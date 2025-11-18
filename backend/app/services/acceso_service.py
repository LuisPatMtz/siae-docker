# app/services/acceso_service.py
"""
Servicio de lógica de negocio para Accesos.
"""
from typing import List, Optional
from datetime import datetime, date
from sqlmodel import Session, select
from fastapi import HTTPException, status
import pytz

from app.models import Acceso, NfcPayload, AccesoRead, NFC, CicloEscolar, Estudiante
from app.repositories.acceso_repo import AccesoRepository
from app.repositories.nfc_repo import NFCRepository


class AccesoService:
    """Servicio para gestionar accesos"""
    
    MEXICO_TZ = pytz.timezone('America/Mexico_City')
    
    def __init__(self, session: Session):
        self.session = session
        self.acceso_repo = AccesoRepository(session)
        self.nfc_repo = NFCRepository(session)
    
    def registrar_acceso(self, payload: NfcPayload) -> Acceso:
        """
        Registra un acceso cuando se escanea una tarjeta NFC.
        Solo permite un acceso por estudiante por día.
        """
        # Determinar la fecha a usar
        if payload.fecha_registro:
            try:
                # Modo prueba: usar la fecha proporcionada
                fecha_obj = datetime.strptime(payload.fecha_registro, '%Y-%m-%d')
                hoy = fecha_obj.date()
                # Crear datetime con hora actual pero fecha especificada
                hora_registro = self.MEXICO_TZ.localize(
                    datetime.combine(hoy, datetime.now(self.MEXICO_TZ).time())
                )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de fecha inválido. Use YYYY-MM-DD"
                )
        else:
            # Modo normal: usar fecha y hora actual
            hoy = datetime.now(self.MEXICO_TZ).date()
            hora_registro = datetime.now(self.MEXICO_TZ)
        
        # Verificar que la tarjeta existe
        nfc = self.nfc_repo.get_by_uid(payload.nfc_uid)
        if not nfc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarjeta NFC no reconocida o no vinculada."
            )
        
        # Obtener el ciclo escolar activo
        ciclo_activo = self.session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        ).first()
        
        if not ciclo_activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay un ciclo escolar activo."
            )
        
        # Verificar si ya existe un acceso en esa fecha
        if self.acceso_repo.exists_acceso_hoy(nfc.nfc_uid, hoy, ciclo_activo.id):
            # Obtener el estudiante para mostrar su nombre
            estudiante = self.session.get(Estudiante, nfc.matricula_estudiante)
            nombre_completo = f"{estudiante.nombre} {estudiante.apellido}" if estudiante else "el estudiante"
            
            # Obtener el acceso existente para mostrar la hora
            acceso_existente = self.session.exec(
                select(Acceso).where(
                    Acceso.nfc_uid == nfc.nfc_uid,
                    Acceso.id_ciclo == ciclo_activo.id
                )
            ).first()
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya se registró un acceso el {hoy.strftime('%Y-%m-%d')} para {nombre_completo} a las {acceso_existente.hora_registro.strftime('%H:%M:%S')}."
            )
        
        # Crear el nuevo acceso
        return self.acceso_repo.create(nfc.nfc_uid, ciclo_activo.id, hora_registro)
    
    def obtener_historial_por_matricula(self, matricula: str) -> List[Acceso]:
        """Obtiene el historial de accesos de un estudiante"""
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {matricula} no encontrado."
            )
        
        return self.acceso_repo.get_by_matricula(matricula)
    
    def obtener_accesos_por_ciclo(self, id_ciclo: int) -> List[Acceso]:
        """Obtiene todos los accesos de un ciclo escolar"""
        # Verificar que el ciclo existe
        ciclo = self.session.get(CicloEscolar, id_ciclo)
        if not ciclo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
            )
        
        return self.acceso_repo.get_by_ciclo(id_ciclo)
