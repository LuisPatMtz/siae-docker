# app/services/__init__.py
"""
Services layer - Lógica de negocio del SIAE.
"""
from app.services.nfc_service import NFCService

from app.services.falta_service import FaltaService
from app.services.dashboard_service import DashboardService

__all__ = [
    "NFCService",

    "FaltaService",
    "DashboardService"
]
