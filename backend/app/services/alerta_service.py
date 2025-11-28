# app/services/alerta_service.py
"""
Servicio para gestión de alertas con historial.
"""
from datetime import date, datetime
from typing import List, Optional
from sqlmodel import Session, select, func
from app.models import Alerta, AlertaHistorial, Falta, Estudiante


class AlertaService:
    """Servicio para manejar alertas de estudiantes"""
    
    @staticmethod
    def obtener_alerta_activa_por_estudiante(
        session: Session,
        matricula: str,
        id_ciclo: int,
        tipo: str = "Faltas"
    ) -> Optional[Alerta]:
        """Obtiene la alerta activa de un estudiante en un ciclo específico"""
        statement = select(Alerta).where(
            Alerta.matricula_estudiante == matricula,
            Alerta.id_ciclo == id_ciclo,
            Alerta.tipo == tipo,
            Alerta.estado == "Activa"
        )
        return session.exec(statement).first()
    
    @staticmethod
    def crear_alerta(
        session: Session,
        matricula: str,
        id_ciclo: int,
        tipo: str,
        mensaje: str,
        cantidad_faltas: int = 1,
        usuario: Optional[str] = None
    ) -> Alerta:
        """Crea una nueva alerta y su historial inicial"""
        # Crear alerta
        alerta = Alerta(
            matricula_estudiante=matricula,
            id_ciclo=id_ciclo,
            tipo=tipo,
            mensaje=mensaje,
            fecha_creacion=date.today(),
            estado="Activa",
            cantidad_faltas=cantidad_faltas
        )
        session.add(alerta)
        session.flush()  # Para obtener el ID
        
        # Crear registro en historial
        historial = AlertaHistorial(
            id_alerta=alerta.id,
            accion="Creada",
            descripcion=f"Alerta creada: {mensaje}",
            cantidad_faltas_momento=cantidad_faltas,
            fecha=datetime.now(),
            usuario=usuario
        )
        session.add(historial)
        session.commit()
        session.refresh(alerta)
        
        return alerta
    
    @staticmethod
    def agregar_falta_a_alerta(
        session: Session,
        alerta: Alerta,
        descripcion: str,
        usuario: Optional[str] = None
    ) -> Alerta:
        """Agrega una falta a una alerta existente"""
        alerta.cantidad_faltas += 1
        alerta.fecha_modificacion = datetime.now()
        alerta.mensaje = f"El estudiante tiene {alerta.cantidad_faltas} faltas sin justificar"
        
        # Registrar en historial
        historial = AlertaHistorial(
            id_alerta=alerta.id,
            accion="Falta Agregada",
            descripcion=descripcion,
            cantidad_faltas_momento=alerta.cantidad_faltas,
            fecha=datetime.now(),
            usuario=usuario
        )
        
        session.add(alerta)
        session.add(historial)
        session.commit()
        session.refresh(alerta)
        
        return alerta
    
    @staticmethod
    def justificar_alerta(
        session: Session,
        alerta_id: int,
        justificacion: str,
        usuario: Optional[str] = None
    ) -> Alerta:
        """Justifica una alerta, la cierra y crea entrada en historial"""
        alerta = session.get(Alerta, alerta_id)
        if not alerta:
            raise ValueError(f"Alerta {alerta_id} no encontrada")
        
        # Actualizar alerta
        alerta.estado = "Justificada"
        alerta.justificacion = justificacion
        alerta.fecha_justificacion = date.today()
        alerta.fecha_modificacion = datetime.now()
        
        # Registrar en historial
        historial = AlertaHistorial(
            id_alerta=alerta.id,
            accion="Justificada",
            descripcion=f"Alerta justificada: {justificacion}",
            cantidad_faltas_momento=alerta.cantidad_faltas,
            fecha=datetime.now(),
            usuario=usuario
        )
        
        session.add(alerta)
        session.add(historial)
        session.commit()
        session.refresh(alerta)
        
        return alerta
    
    @staticmethod
    def obtener_historial_alerta(
        session: Session,
        alerta_id: int
    ) -> List[AlertaHistorial]:
        """Obtiene el historial completo de una alerta"""
        statement = select(AlertaHistorial).where(
            AlertaHistorial.id_alerta == alerta_id
        ).order_by(AlertaHistorial.fecha.desc())
        
        return list(session.exec(statement).all())
    
    @staticmethod
    def obtener_todas_alertas_estudiante(
        session: Session,
        matricula: str,
        incluir_cerradas: bool = True
    ) -> List[Alerta]:
        """Obtiene todas las alertas de un estudiante (activas y historial)"""
        statement = select(Alerta).where(
            Alerta.matricula_estudiante == matricula
        )
        
        if not incluir_cerradas:
            statement = statement.where(Alerta.estado == "Activa")
        
        statement = statement.order_by(Alerta.fecha_creacion.desc())
        
        return list(session.exec(statement).all())
    
    @staticmethod
    def obtener_estadisticas_faltas_estudiante(
        session: Session,
        matricula: str
    ) -> dict:
        """Obtiene estadísticas de faltas de un estudiante"""
        # Total de faltas sin justificar
        faltas_sin_justificar = session.exec(
            select(func.count(Falta.id)).where(
                Falta.matricula_estudiante == matricula,
                Falta.estado == "Sin justificar"
            )
        ).one()
        
        # Total de faltas justificadas
        faltas_justificadas = session.exec(
            select(func.count(Falta.id)).where(
                Falta.matricula_estudiante == matricula,
                Falta.estado == "Justificada"
            )
        ).one()
        
        # Alertas activas
        alertas_activas = session.exec(
            select(func.count(Alerta.id)).where(
                Alerta.matricula_estudiante == matricula,
                Alerta.estado == "Activa"
            )
        ).one()
        
        # Alertas justificadas (historial)
        alertas_justificadas = session.exec(
            select(func.count(Alerta.id)).where(
                Alerta.matricula_estudiante == matricula,
                Alerta.estado == "Justificada"
            )
        ).one()
        
        return {
            "faltas_sin_justificar": faltas_sin_justificar,
            "faltas_justificadas": faltas_justificadas,
            "total_faltas": faltas_sin_justificar + faltas_justificadas,
            "alertas_activas": alertas_activas,
            "alertas_justificadas": alertas_justificadas,
            "total_alertas": alertas_activas + alertas_justificadas
        }
    
    @staticmethod
    def procesar_nueva_falta(
        session: Session,
        falta: Falta,
        usuario: Optional[str] = None
    ) -> Optional[Alerta]:
        """
        Procesa una nueva falta y actualiza o crea alerta en el ciclo correspondiente.
        Retorna la alerta afectada o None si no se generó alerta.
        """
        matricula = falta.matricula_estudiante
        id_ciclo = falta.id_ciclo
        
        # Buscar alerta activa en este ciclo
        alerta_activa = AlertaService.obtener_alerta_activa_por_estudiante(
            session, matricula, id_ciclo, "Faltas"
        )
        
        if alerta_activa:
            # Agregar falta a alerta existente
            descripcion = f"Nueva falta registrada el {falta.fecha}"
            alerta = AlertaService.agregar_falta_a_alerta(
                session, alerta_activa, descripcion, usuario
            )
            
            # Asociar falta con alerta
            falta.id_alerta_asociada = alerta.id
            session.add(falta)
            session.commit()
            
            return alerta
        else:
            # Crear nueva alerta (primera falta sin justificar en este ciclo)
            estudiante = session.get(Estudiante, matricula)
            mensaje = f"El estudiante {estudiante.nombre} {estudiante.apellido} tiene 1 falta sin justificar"
            
            alerta = AlertaService.crear_alerta(
                session, matricula, id_ciclo, "Faltas", mensaje, 1, usuario
            )
            
            # Asociar falta con alerta
            falta.id_alerta_asociada = alerta.id
            session.add(falta)
            session.commit()
            
            return alerta
