# app/api/v1/asistencia_routes.py
"""
Rutas para el registro de asistencia por matrícula.
Sistema de entrada/salida con validación de tiempo configurable.
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func
import pytz

from app.db.database import get_session
from app.models import (
    Estudiante,
    Asistencia, AsistenciaCreate, AsistenciaRead,
    Usuario,
    NFC, NfcPayload,
    CicloEscolar,
    SystemConfig
)

router = APIRouter(
    prefix="/asistencia",
    tags=["Asistencia"]
)

# Zona horaria de México
MEXICO_TZ = pytz.timezone('America/Mexico_City')


def get_time_window_config(session: Session) -> tuple[int, int]:
    """
    Obtiene la configuración de ventana de tiempo desde la base de datos.
    Returns: (minutos_minimos, minutos_maximos)
    """
    min_config = session.exec(
        select(SystemConfig).where(SystemConfig.key == 'exit_time_window_min_minutes')
    ).first()
    
    max_config = session.exec(
        select(SystemConfig).where(SystemConfig.key == 'exit_time_window_max_minutes')
    ).first()
    
    # Valores por defecto si no existen en la BD
    minutos_minimos = int(min_config.value) if min_config else 5
    minutos_maximos = int(max_config.value) if max_config else 240
    
    return minutos_minimos, minutos_maximos

@router.post("/registrar", response_model=dict, status_code=status.HTTP_201_CREATED)
def registrar_asistencia(
    matricula: str,
    session: Session = Depends(get_session)
):
    """
    Registra entrada o salida de un estudiante por matrícula.
    
    Lógica con validación de tiempo configurable:
    - Si no hay entrada pendiente: registra ENTRADA (es_valida=None)
    - Si hay entrada pendiente:
        * Valida tiempo transcurrido contra configuración
        * Si < mínimo: ERROR "Debes permanecer al menos X minutos"
        * Si > máximo: ERROR "Tiempo máximo excedido (X minutos)"
        * Si dentro del rango: registra SALIDA (es_valida=True) y actualiza entrada
    
    Returns:
        dict con información del registro: tipo, estudiante, timestamp, es_valida
    """
    try:
        # Obtener configuración de ventana de tiempo
        minutos_minimos, minutos_maximos = get_time_window_config(session)
        
        # 1. Verificar que el estudiante existe
        estudiante = session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {matricula} no encontrado."
            )
        
        # 2. Obtener el ciclo activo
        ciclo_activo = session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        ).first()
        
        if not ciclo_activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay un ciclo escolar activo. Por favor activa un ciclo."
            )
        
        # 3. Obtener la hora actual en zona horaria de México
        ahora = datetime.now(MEXICO_TZ)
        
        # Convertir a naive para comparación con la base de datos
        ahora_naive = ahora.replace(tzinfo=None)
        
        # 4. Buscar la última entrada pendiente (sin salida válida) EN EL CICLO ACTIVO
        ultima_entrada = session.exec(
            select(Asistencia)
            .where(
                Asistencia.matricula_estudiante == matricula,
                Asistencia.id_ciclo == ciclo_activo.id,
                Asistencia.tipo == "entrada",
                Asistencia.es_valida == None  # Entrada sin salida válida
            )
            .order_by(Asistencia.timestamp.desc())
        ).first()
        
        # 4.1 Buscar la última salida para validar tiempo entre asistencias
        ultima_salida = session.exec(
            select(Asistencia)
            .where(
                Asistencia.matricula_estudiante == matricula,
                Asistencia.id_ciclo == ciclo_activo.id,
                Asistencia.tipo == "salida",
                Asistencia.es_valida == True
            )
            .order_by(Asistencia.timestamp.desc())
        ).first()
        
        # 5. Determinar si es entrada o salida
        if not ultima_entrada:
            # Validar que haya pasado al menos 1 hora desde la última salida
            if ultima_salida:
                tiempo_desde_salida = ahora_naive - ultima_salida.timestamp
                minutos_desde_salida = tiempo_desde_salida.total_seconds() / 60
                
                if minutos_desde_salida < 60:  # Menos de 1 hora
                    minutos_faltantes = int(60 - minutos_desde_salida)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Debes esperar al menos 1 hora después de tu salida para registrar una nueva entrada. "
                               f"Tiempo transcurrido: {int(minutos_desde_salida)} minutos. Faltan {minutos_faltantes} minutos."
                    )
            
            # No hay entrada pendiente -> NUEVA ENTRADA
            tipo_registro = "entrada"
            es_valida = None  # Pendiente de salida
            entrada_relacionada_id = None
            
            horas_max = minutos_maximos // 60
            minutos_max = minutos_maximos % 60
            mensaje = f"Entrada registrada exitosamente. Recuerda registrar tu salida (entre {minutos_minimos} min y {horas_max}h {minutos_max}min)."
            
            nueva_asistencia = Asistencia(
                matricula_estudiante=matricula,
                id_ciclo=ciclo_activo.id,
                tipo=tipo_registro,
                timestamp=ahora_naive,
                es_valida=es_valida,
                entrada_relacionada_id=entrada_relacionada_id
            )
            
            session.add(nueva_asistencia)
            session.commit()
            session.refresh(nueva_asistencia)
            
        else:
            # Hay entrada pendiente -> Intentar registrar SALIDA
            # Calcular tiempo transcurrido (ambos son naive)
            tiempo_transcurrido = ahora_naive - ultima_entrada.timestamp
            minutos_transcurridos = tiempo_transcurrido.total_seconds() / 60
            
            # Validar rango de tiempo usando configuración
            if minutos_transcurridos < minutos_minimos:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Debes permanecer al menos {minutos_minimos} minutos antes de registrar tu salida. "
                           f"Tiempo transcurrido: {int(minutos_transcurridos)} minutos."
                )
            
            if minutos_transcurridos > minutos_maximos:
                # Marcar entrada como inválida y permitir nueva entrada
                ultima_entrada.es_valida = False
                session.add(ultima_entrada)
                session.commit()
                
                horas_max = minutos_maximos // 60
                minutos_max = minutos_maximos % 60
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tiempo máximo excedido ({horas_max}h {minutos_max}min). "
                           f"Tu entrada anterior ha sido marcada como inválida. "
                           f"Por favor registra una nueva entrada."
                )
            
            # Rango válido -> Registrar SALIDA
            tipo_registro = "salida"
            es_valida = True
            entrada_relacionada_id = ultima_entrada.id
            
            # Calcular tiempo de permanencia legible
            horas = int(minutos_transcurridos // 60)
            minutos = int(minutos_transcurridos % 60)
            mensaje = f"Salida registrada exitosamente. Tiempo de permanencia: {horas} horas y {minutos} minutos."
            
            # Crear salida
            nueva_asistencia = Asistencia(
                matricula_estudiante=matricula,
                id_ciclo=ciclo_activo.id,
                tipo=tipo_registro,
                timestamp=ahora_naive,
                es_valida=es_valida,
                entrada_relacionada_id=entrada_relacionada_id
            )
            
            # Actualizar entrada como válida
            ultima_entrada.es_valida = True
            
            session.add(nueva_asistencia)
            session.add(ultima_entrada)
            session.commit()
            session.refresh(nueva_asistencia)
        
        # 6. Preparar respuesta con información completa
        return {
            "id": nueva_asistencia.id,
            "tipo": tipo_registro,
            "timestamp": nueva_asistencia.timestamp.isoformat(),
            "es_valida": nueva_asistencia.es_valida,
            "entrada_relacionada_id": nueva_asistencia.entrada_relacionada_id,
            "estudiante": {
                "matricula": estudiante.matricula,
                "nombre": estudiante.nombre,
                "apellido": estudiante.apellido,
                "grupo": estudiante.grupo.nombre if estudiante.grupo else None
            },
            "mensaje": mensaje
        }
    except Exception as e:
        print(f"ERROR en registrar_asistencia: {e}")
        import traceback
        traceback.print_exc()
        raise e


@router.post("/registrar-nfc", response_model=dict, status_code=status.HTTP_201_CREATED)
def registrar_asistencia_nfc(
    payload: NfcPayload,
    session: Session = Depends(get_session)
):
    """
    Registra asistencia mediante tarjeta NFC.
    Busca la matrícula asociada al NFC y llama a la lógica de registro.
    """
    # 1. Buscar la tarjeta NFC
    nfc = session.get(NFC, payload.nfc_uid)
    if not nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta NFC no reconocida o no vinculada."
        )
    
    # 2. Llamar a la función de registro por matrícula
    # Reutilizamos la lógica existente pasando la matrícula encontrada
    return registrar_asistencia(matricula=nfc.matricula_estudiante, session=session)


@router.get("/estudiante/{matricula}", response_model=List[AsistenciaRead])
def obtener_historial_estudiante(
    matricula: str,
    session: Session = Depends(get_session)
):
    """
    Obtiene el historial completo de asistencias de un estudiante.
    """
    # Verificar que el estudiante existe
    estudiante = session.get(Estudiante, matricula)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {matricula} no encontrado."
        )
    
    # Obtener todas las asistencias del estudiante
    asistencias = session.exec(
        select(Asistencia)
        .where(Asistencia.matricula_estudiante == matricula)
        .order_by(Asistencia.timestamp.desc())
    ).all()
    
    return asistencias


@router.get("/hoy", response_model=List[dict])
def obtener_asistencias_hoy(session: Session = Depends(get_session)):
    """
    Obtiene todas las asistencias registradas hoy.
    Incluye información del estudiante.
    """
    # Obtener fecha de hoy en zona horaria de México
    hoy = datetime.now(MEXICO_TZ).date()
    
    # Buscar todas las asistencias de hoy
    asistencias = session.exec(
        select(Asistencia)
        .where(func.date(Asistencia.timestamp) == hoy)
        .order_by(Asistencia.timestamp.desc())
    ).all()
    
    # Enriquecer con información del estudiante
    resultado = []
    for asistencia in asistencias:
        estudiante = session.get(Estudiante, asistencia.matricula_estudiante)
        if estudiante:
            resultado.append({
                "id": asistencia.id,
                "tipo": asistencia.tipo,
                "timestamp": asistencia.timestamp.isoformat(),
                "es_valida": asistencia.es_valida,
                "entrada_relacionada_id": asistencia.entrada_relacionada_id,
                "estudiante": {
                    "matricula": estudiante.matricula,
                    "nombre": estudiante.nombre,
                    "apellido": estudiante.apellido,
                    "grupo": estudiante.grupo.nombre if estudiante.grupo else None
                }
            })
    
    return resultado


@router.get("/entradas", response_model=List[dict])
def obtener_todas_entradas(
    fecha_inicio: str = None,
    fecha_fin: str = None,
    session: Session = Depends(get_session)
):
    """
    Obtiene TODOS los registros de asistencias (entradas y salidas).
    Opcionalmente filtradas por rango de fechas.
    Incluye información del estudiante.
    """
    # Construir query base - ahora incluye tanto entradas como salidas
    query = select(Asistencia)
    
    # Aplicar filtros de fecha si se proporcionan
    if fecha_inicio:
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            query = query.where(func.date(Asistencia.timestamp) >= fecha_inicio_dt)
        except ValueError:
            pass
    
    if fecha_fin:
        try:
            fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            query = query.where(func.date(Asistencia.timestamp) <= fecha_fin_dt)
        except ValueError:
            pass
    
    # Ordenar por timestamp descendente
    query = query.order_by(Asistencia.timestamp.desc())
    
    # Ejecutar query
    registros = session.exec(query).all()
    
    # Enriquecer con información del estudiante
    resultado = []
    for registro in registros:
        estudiante = session.get(Estudiante, registro.matricula_estudiante)
        if estudiante:
            resultado.append({
                "id": registro.id,
                "tipo": registro.tipo,
                "timestamp": registro.timestamp.isoformat(),
                "es_valida": registro.es_valida,
                "entrada_relacionada_id": registro.entrada_relacionada_id,
                "estudiante": {
                    "matricula": estudiante.matricula,
                    "nombre": estudiante.nombre,
                    "apellido": estudiante.apellido,
                    "grupo": estudiante.grupo.nombre if estudiante.grupo else None
                }
            })
    
    return resultado



@router.get("/estadisticas/hoy", response_model=dict)
def obtener_estadisticas_hoy(session: Session = Depends(get_session)):
    """
    Obtiene estadísticas de asistencia del día actual.
    Incluye asistencias válidas, inválidas y pendientes.
    """
    hoy = datetime.now(MEXICO_TZ).date()
    
    # Contar entradas y salidas de hoy
    total_entradas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "entrada"
        )
    ).one()
    
    total_salidas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "salida"
        )
    ).one()
    
    # Contar asistencias válidas (entrada + salida en rango 1-8h)
    asistencias_validas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "salida",
            Asistencia.es_valida == True
        )
    ).one()
    
    # Contar asistencias inválidas
    asistencias_invalidas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.es_valida == False
        )
    ).one()
    
    # Contar estudiantes con entrada sin salida (pendientes)
    entradas_pendientes = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "entrada",
            Asistencia.es_valida == None
        )
    ).one()
    
    return {
        "fecha": hoy.isoformat(),
        "total_entradas": total_entradas,
        "total_salidas": total_salidas,
        "asistencias_validas": asistencias_validas,
        "asistencias_invalidas": asistencias_invalidas,
        "entradas_pendientes": entradas_pendientes,
        "estudiantes_presentes": total_entradas - total_salidas
    }


@router.get("/validas", response_model=List[dict])
def obtener_asistencias_validas(
    fecha_inicio: str = None,
    fecha_fin: str = None,
    session: Session = Depends(get_session)
):
    """
    Obtiene solo las asistencias válidas (entrada + salida en rango 1-8h).
    
    Parámetros opcionales:
    - fecha_inicio: Fecha de inicio en formato YYYY-MM-DD
    - fecha_fin: Fecha de fin en formato YYYY-MM-DD
    """
    query = select(Asistencia).where(
        Asistencia.tipo == "salida",
        Asistencia.es_valida == True
    )
    
    # Filtrar por rango de fechas si se proporciona
    if fecha_inicio:
        fecha_inicio_dt = datetime.fromisoformat(fecha_inicio).date()
        query = query.where(func.date(Asistencia.timestamp) >= fecha_inicio_dt)
    
    if fecha_fin:
        fecha_fin_dt = datetime.fromisoformat(fecha_fin).date()
        query = query.where(func.date(Asistencia.timestamp) <= fecha_fin_dt)
    
    asistencias_validas = session.exec(query.order_by(Asistencia.timestamp.desc())).all()
    
    # Enriquecer con información del estudiante y entrada relacionada
    resultado = []
    for asistencia in asistencias_validas:
        estudiante = session.get(Estudiante, asistencia.matricula_estudiante)
        entrada = session.get(Asistencia, asistencia.entrada_relacionada_id) if asistencia.entrada_relacionada_id else None
        
        if estudiante:
            tiempo_permanencia = None
            if entrada:
                tiempo_transcurrido = asistencia.timestamp - entrada.timestamp
                horas = tiempo_transcurrido.total_seconds() / 3600
                tiempo_permanencia = f"{int(horas)}h {int((horas % 1) * 60)}min"
            
            resultado.append({
                "id": asistencia.id,
                "fecha": asistencia.timestamp.date().isoformat(),
                "hora_entrada": entrada.timestamp.time().isoformat() if entrada else None,
                "hora_salida": asistencia.timestamp.time().isoformat(),
                "tiempo_permanencia": tiempo_permanencia,
                "estudiante": {
                    "matricula": estudiante.matricula,
                    "nombre": estudiante.nombre,
                    "apellido": estudiante.apellido,
                    "grupo": estudiante.grupo.nombre if estudiante.grupo else None
                }
            })
    
    return resultado
