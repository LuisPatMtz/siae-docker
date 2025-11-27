# app/services/falta_service.py
"""
Servicio de lógica de negocio para Faltas con sistema de corte automático.
"""
from typing import List, Optional, Dict
from datetime import date, datetime, timedelta
from sqlmodel import Session, select, func, and_
from fastapi import HTTPException, status

from app.models import Falta, FaltaCreate, FaltaUpdate, Estudiante, CicloEscolar, Asistencia
from app.repositories.falta_repo import FaltaRepository


class FaltaService:
    """Servicio para gestionar faltas y corte automático"""
    
    # Porcentaje mínimo de tiempo de permanencia para contar asistencia
    PORCENTAJE_MINIMO_ASISTENCIA = 10  # 10% del tiempo esperado
    
    # Horas esperadas de permanencia (ejemplo: 8 horas)
    HORAS_ESPERADAS = 8
    
    def __init__(self, session: Session):
        self.session = session
        self.falta_repo = FaltaRepository(session)
    
    @staticmethod
    def es_dia_habil(fecha: date) -> bool:
        """
        Verifica si una fecha es día hábil (Lunes a Viernes).
        Retorna False para sábados (5) y domingos (6).
        """
        return fecha.weekday() < 5  # 0=Lunes, 4=Viernes, 5=Sábado, 6=Domingo
    
    @staticmethod
    def obtener_dias_habiles_rango(fecha_inicio: date, fecha_fin: date) -> List[date]:
        """
        Obtiene lista de días hábiles en un rango de fechas.
        Excluye sábados y domingos.
        """
        dias_habiles = []
        fecha_actual = fecha_inicio
        
        while fecha_actual <= fecha_fin:
            if FaltaService.es_dia_habil(fecha_actual):
                dias_habiles.append(fecha_actual)
            fecha_actual += timedelta(days=1)
        
        return dias_habiles
    
    @staticmethod
    def calcular_porcentaje_permanencia(entrada: datetime, salida: datetime) -> float:
        """
        Calcula el porcentaje de permanencia basado en las horas esperadas.
        """
        tiempo_permanencia = salida - entrada
        horas_permanencia = tiempo_permanencia.total_seconds() / 3600
        
        porcentaje = (horas_permanencia / FaltaService.HORAS_ESPERADAS) * 100
        return round(porcentaje, 2)
    
    def obtener_dias_con_asistencia(
        self,
        matricula: str,
        fecha_inicio: date,
        fecha_fin: date
    ) -> Dict[date, Dict]:
        """
        Obtiene los días que el estudiante asistió.
        Solo verifica si hay una entrada válida, sin calcular porcentaje de permanencia.
        """
        try:
            # Convertir fechas a datetime para comparación consistente
            # Las fechas en la BD son timezone-naive (México), así que usamos datetime naive
            fecha_inicio_dt = datetime.combine(fecha_inicio, datetime.min.time())
            fecha_fin_dt = datetime.combine(fecha_fin, datetime.max.time())
            
            # Obtener entradas válidas del periodo
            statement = select(Asistencia).where(
                and_(
                    Asistencia.matricula_estudiante == matricula,
                    Asistencia.tipo == "entrada",
                    Asistencia.es_valida == True,
                    Asistencia.timestamp >= fecha_inicio_dt,
                    Asistencia.timestamp <= fecha_fin_dt
                )
            ).order_by(Asistencia.timestamp)
            
            entradas = list(self.session.exec(statement).all())
            
            dias_asistencia = {}
            
            for entrada in entradas:
                # Extraer solo la fecha del timestamp
                fecha_entrada = entrada.timestamp.date()
                
                # Buscar la salida correspondiente
                salida = self.session.exec(
                    select(Asistencia).where(
                        and_(
                            Asistencia.matricula_estudiante == matricula,
                            Asistencia.tipo == "salida",
                            Asistencia.entrada_relacionada_id == entrada.id
                        )
                    )
                ).first()
                
                # Si hay entrada (con o sin salida), cuenta como asistencia
                dias_asistencia[fecha_entrada] = {
                    "entrada_id": entrada.id,
                    "salida_id": salida.id if salida else None,
                    "hora_entrada": entrada.timestamp,
                    "hora_salida": salida.timestamp if salida else None
                }
            
            return dias_asistencia
            
        except Exception as e:
            # Log del error para debugging
            print(f"Error en obtener_dias_con_asistencia para {matricula}: {str(e)}")
            # Retornar diccionario vacío en caso de error
            return {}
    
    def procesar_corte_faltas(
        self,
        fecha_inicio: date,
        fecha_fin: date,
        ciclo_id: int,
        matricula_estudiante: str = None
    ) -> Dict:
        """
        Procesa el corte de faltas para un periodo.
        
        Lógica:
        1. Obtiene días hábiles del periodo (Lunes a Viernes)
        2. Para cada estudiante, verifica si tiene entrada registrada
        3. Si no tiene entrada: Marca falta y genera/actualiza alerta
        
        Args:
            fecha_inicio: Fecha de inicio del corte
            fecha_fin: Fecha de fin del corte
            ciclo_id: ID del ciclo escolar
            matricula_estudiante: Si se especifica, solo procesa ese estudiante
        
        Returns:
            Diccionario con estadísticas del corte
        """
        from app.services.alerta_service import AlertaService
        
        # Obtener días hábiles del periodo
        dias_habiles = self.obtener_dias_habiles_rango(fecha_inicio, fecha_fin)
        
        if not dias_habiles:
            return {
                "error": "No hay días hábiles en el rango especificado",
                "dias_habiles": 0
            }
        
        # Obtener estudiantes a procesar
        if matricula_estudiante:
            estudiantes = [self.session.get(Estudiante, matricula_estudiante)]
            if not estudiantes[0]:
                return {"error": f"Estudiante {matricula_estudiante} no encontrado"}
        else:
            # Obtener todos los estudiantes activos
            statement = select(Estudiante)
            estudiantes = list(self.session.exec(statement).all())
        
        # Estadísticas del corte
        stats = {
            "fecha_inicio": fecha_inicio.isoformat(),
            "fecha_fin": fecha_fin.isoformat(),
            "dias_habiles": len(dias_habiles),
            "estudiantes_procesados": 0,
            "faltas_nuevas": 0,
            "asistencias_menores_10_porciento": 0,  # Mantener para compatibilidad, siempre será 0
            "detalles": []
        }
        
        for estudiante in estudiantes:
            # Obtener asistencias del estudiante
            dias_con_asistencia = self.obtener_dias_con_asistencia(
                estudiante.matricula, fecha_inicio, fecha_fin
            )
            
            # Obtener TODAS las faltas existentes del estudiante en el periodo de una sola vez
            faltas_existentes_query = select(Falta.fecha).where(
                and_(
                    Falta.matricula_estudiante == estudiante.matricula,
                    Falta.fecha >= fecha_inicio,
                    Falta.fecha <= fecha_fin
                )
            )
            fechas_con_falta = set(self.session.exec(faltas_existentes_query).all())
            
            faltas_estudiante = 0
            faltas_a_crear = []
            
            # Procesar cada día hábil
            for dia in dias_habiles:
                # Si ya existe falta o hay asistencia, omitir
                if dia in fechas_con_falta or dia in dias_con_asistencia:
                    continue
                
                # Crear falta (sin guardar aún)
                falta = Falta(
                    matricula_estudiante=estudiante.matricula,
                    id_ciclo=ciclo_id,
                    fecha=dia,
                    estado="Sin justificar"
                )
                faltas_a_crear.append(falta)
                faltas_estudiante += 1
            
            # Guardar todas las faltas del estudiante de una vez
            if faltas_a_crear:
                for falta in faltas_a_crear:
                    self.session.add(falta)
                self.session.flush()  # Para obtener los IDs
                
                # Generar o actualizar alerta
                for falta in faltas_a_crear:
                    AlertaService.procesar_nueva_falta(self.session, falta)
                
                stats["faltas_nuevas"] += faltas_estudiante
                stats["detalles"].append({
                    "matricula": estudiante.matricula,
                    "nombre": f"{estudiante.nombre} {estudiante.apellido}",
                    "faltas_nuevas": faltas_estudiante,
                    "asistencias_menores_10_porciento": 0
                })
            
            stats["estudiantes_procesados"] += 1
        
        self.session.commit()
        
        return stats
    
    def obtener_reporte_asistencias_periodo(
        self,
        fecha_inicio: date,
        fecha_fin: date,
        matricula_estudiante: str = None
    ) -> List[Dict]:
        """
        Genera reporte de asistencias para un periodo.
        Útil para revisar antes de hacer el corte.
        """
        dias_habiles = self.obtener_dias_habiles_rango(fecha_inicio, fecha_fin)
        
        # Obtener estudiantes
        if matricula_estudiante:
            estudiantes = [self.session.get(Estudiante, matricula_estudiante)]
        else:
            statement = select(Estudiante)
            estudiantes = list(self.session.exec(statement).all())
        
        reporte = []
        
        for estudiante in estudiantes:
            dias_con_asistencia = self.obtener_dias_con_asistencia(
                estudiante.matricula, fecha_inicio, fecha_fin
            )
            
            # Contar asistencias (cualquier día con entrada)
            asistencias_validas = len(dias_con_asistencia)
            
            # Calcular faltas pendientes
            faltas_sin_registrar = len(dias_habiles) - asistencias_validas
            
            # Calcular porcentaje
            porcentaje_asistencia = (
                (asistencias_validas / len(dias_habiles) * 100) 
                if dias_habiles else 0
            )
            
            reporte.append({
                "matricula": estudiante.matricula,
                "nombre": f"{estudiante.nombre} {estudiante.apellido}",
                "grupo": estudiante.grupo.nombre if estudiante.grupo else "Sin grupo",
                "dias_habiles": len(dias_habiles),
                "asistencias_validas": asistencias_validas,
                "asistencias_menores_10_porciento": 0,  # Ya no se usa
                "faltas_pendientes": faltas_sin_registrar,
                "porcentaje_asistencia": round(porcentaje_asistencia, 2)
            })
        
        return reporte
    
    # --- Métodos originales del servicio ---
    
    def registrar_falta(self, falta_data: FaltaCreate) -> Falta:
        """
        Registra una falta para un estudiante.
        Valida:
        - Que el estudiante exista
        - Que el ciclo exista
        - Que no haya ya una falta en esa fecha
        """
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, falta_data.matricula_estudiante)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {falta_data.matricula_estudiante} no encontrado."
            )
        
        # Verificar que el ciclo existe
        ciclo = self.session.get(CicloEscolar, falta_data.id_ciclo)
        if not ciclo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ciclo escolar con ID {falta_data.id_ciclo} no encontrado."
            )
        
        # Verificar que no existe ya una falta para este estudiante en esta fecha
        if self.falta_repo.exists_falta(falta_data.matricula_estudiante, falta_data.fecha):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un registro de falta para el estudiante {falta_data.matricula_estudiante} en la fecha {falta_data.fecha}."
            )
        
        return self.falta_repo.create(falta_data)
    
    def obtener_faltas(
        self,
        matricula_estudiante: Optional[str] = None,
        id_ciclo: Optional[int] = None,
        fecha: Optional[date] = None,
        estado: Optional[str] = None
    ) -> List[Falta]:
        """Obtiene faltas con filtros opcionales"""
        return self.falta_repo.get_filtered(
            matricula=matricula_estudiante,
            id_ciclo=id_ciclo,
            fecha=fecha,
            estado=estado
        )
    
    def obtener_faltas_por_estudiante(
        self, 
        matricula: str, 
        id_ciclo: Optional[int] = None
    ) -> List[Falta]:
        """Obtiene todas las faltas de un estudiante"""
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {matricula} no encontrado."
            )
        
        return self.falta_repo.get_by_matricula(matricula, id_ciclo)
    
    def obtener_faltas_por_fecha(
        self, 
        fecha: date, 
        id_ciclo: Optional[int] = None
    ) -> List[Falta]:
        """Obtiene todas las faltas de una fecha"""
        return self.falta_repo.get_by_fecha(fecha, id_ciclo)
    
    def obtener_falta_por_id(self, id_falta: int) -> Falta:
        """Obtiene una falta específica por su ID"""
        falta = self.falta_repo.get_by_id(id_falta)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def actualizar_falta(self, id_falta: int, falta_update: FaltaUpdate) -> Falta:
        """Actualiza una falta existente"""
        falta = self.falta_repo.update(id_falta, falta_update)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def justificar_falta(self, id_falta: int, justificacion: str) -> Falta:
        """Justifica una falta específica"""
        falta = self.falta_repo.justificar(id_falta, justificacion)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def eliminar_falta(self, id_falta: int) -> None:
        """Elimina una falta"""
        if not self.falta_repo.delete(id_falta):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
