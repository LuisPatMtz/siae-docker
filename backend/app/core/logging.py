"""
Sistema de logging centralizado para el SIAE.
Registra todas las operaciones importantes con contexto de usuario, endpoint, IP y resultado.
"""
import logging
import json
import sys
from datetime import datetime
from typing import Optional
from pathlib import Path

import pytz
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import settings


# Crear directorio de logs si no existe
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Configurar formato de logs
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
MEXICO_TZ = pytz.timezone('America/Mexico_City')


# Configurar logger principal
def setup_logger(name: str, log_file: str, level=logging.INFO) -> logging.Logger:
    """
    Configura un logger con archivo y formato específicos.
    
    Args:
        name: Nombre del logger
        log_file: Nombre del archivo de log
        level: Nivel de logging
        
    Returns:
        Logger configurado
    """
    formatter = logging.Formatter(LOG_FORMAT)
    
    handler = logging.FileHandler(LOGS_DIR / log_file, encoding='utf-8')
    handler.setFormatter(formatter)
    
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    
    # También loguear a consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


# Loggers específicos
api_logger = setup_logger("siae.api", "api.log")
security_logger = setup_logger("siae.security", "security.log")
error_logger = setup_logger("siae.error", "errors.log", level=logging.ERROR)


def log_api_request(
    username: Optional[str],
    method: str,
    endpoint: str,
    ip: str,
    status_code: int,
    duration_ms: float,
    error: Optional[str] = None
):
    """
    Registra una petición API con todos sus detalles.
    
    Args:
        username: Usuario que realiza la petición (None si no autenticado)
        method: Método HTTP (GET, POST, etc.)
        endpoint: Ruta del endpoint
        ip: Dirección IP del cliente
        status_code: Código de respuesta HTTP
        duration_ms: Duración de la petición en milisegundos
        error: Mensaje de error si hubo uno
    """
    log_data = {
        "timestamp": datetime.now(MEXICO_TZ).isoformat(),
        "usuario": username or "anónimo",
        "method": method,
        "endpoint": endpoint,
        "ip": ip,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        "success": 200 <= status_code < 400
    }
    
    if error:
        log_data["error"] = error
    
    # Determinar nivel de log según el resultado
    if status_code >= 500:
        api_logger.error(json.dumps(log_data, ensure_ascii=False))
        error_logger.error(f"Error 5xx: {json.dumps(log_data, ensure_ascii=False)}")
    elif status_code >= 400:
        api_logger.warning(json.dumps(log_data, ensure_ascii=False))
    else:
        api_logger.info(json.dumps(log_data, ensure_ascii=False))


def log_security_event(
    event_type: str,
    username: Optional[str],
    ip: str,
    details: str,
    success: bool = True
):
    """
    Registra un evento de seguridad (login, logout, cambio de permisos, etc.).
    
    Args:
        event_type: Tipo de evento (login, logout, permission_denied, etc.)
        username: Usuario involucrado
        ip: Dirección IP
        details: Detalles del evento
        success: Si el evento fue exitoso
    """
    log_data = {
        "timestamp": datetime.now(MEXICO_TZ).isoformat(),
        "event_type": event_type,
        "usuario": username or "anónimo",
        "ip": ip,
        "details": details,
        "success": success
    }
    
    if success:
        security_logger.info(json.dumps(log_data, ensure_ascii=False))
    else:
        security_logger.warning(json.dumps(log_data, ensure_ascii=False))


def log_error(
    error_type: str,
    endpoint: str,
    username: Optional[str],
    error_message: str,
    traceback: Optional[str] = None
):
    """
    Registra un error de aplicación.
    
    Args:
        error_type: Tipo de error (ValidationError, DatabaseError, etc.)
        endpoint: Endpoint donde ocurrió el error
        username: Usuario que experimentó el error
        error_message: Mensaje de error
        traceback: Stack trace completo (opcional)
    """
    log_data = {
        "timestamp": datetime.now(MEXICO_TZ).isoformat(),
        "error_type": error_type,
        "endpoint": endpoint,
        "usuario": username or "anónimo",
        "message": error_message
    }
    
    if traceback:
        log_data["traceback"] = traceback
    
    error_logger.error(json.dumps(log_data, ensure_ascii=False))


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que registra todas las peticiones HTTP.
    """
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Procesa la petición y registra sus detalles.
        """
        import time
        
        # Guardar timestamp de inicio
        start_time = time.time()
        
        # Obtener información de la petición
        method = request.method
        endpoint = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        # Intentar extraer username del token (si existe)
        username = None
        try:
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                from app.core.security import decode_access_token
                payload = decode_access_token(token)
                if payload:
                    username = payload.get("sub")
        except Exception:
            pass  # No pudimos extraer el username, continuamos sin él
        
        # Procesar la petición
        response = None
        error_message = None
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            error_message = str(e)
            # Re-lanzar la excepción para que FastAPI la maneje
            raise
        finally:
            # Calcular duración
            duration_ms = (time.time() - start_time) * 1000
            
            # Registrar la petición
            log_api_request(
                username=username,
                method=method,
                endpoint=endpoint,
                ip=client_ip,
                status_code=status_code,
                duration_ms=duration_ms,
                error=error_message
            )
        
        return response


# Función auxiliar para logging desde endpoints
def log_action(
    action: str,
    username: str,
    details: str,
    success: bool = True
):
    """
    Función auxiliar para registrar acciones desde los endpoints.
    
    Uso:
        log_action("create_user", current_user.username, f"Creó usuario: {new_user.username}")
    
    Args:
        action: Acción realizada
        username: Usuario que realizó la acción
        details: Detalles de la acción
        success: Si la acción fue exitosa
    """
    log_data = {
        "timestamp": datetime.now(MEXICO_TZ).isoformat(),
        "action": action,
        "usuario": username,
        "details": details,
        "success": success
    }
    
    if success:
        api_logger.info(f"ACTION: {json.dumps(log_data, ensure_ascii=False)}")
    else:
        api_logger.warning(f"FAILED_ACTION: {json.dumps(log_data, ensure_ascii=False)}")


# Logger global para retrocompatibilidad
logger = api_logger
