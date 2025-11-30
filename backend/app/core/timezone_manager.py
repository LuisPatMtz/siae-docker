"""
Gestor centralizado de zona horaria del sistema.
Todos los módulos deben usar estas funciones para garantizar consistencia.
"""
import os
import json
from datetime import datetime, timezone
from pathlib import Path
import pytz

# Archivo de configuración de zona horaria
CONFIG_FILE = Path("config") / "timezone_config.json"
CONFIG_FILE.parent.mkdir(exist_ok=True)

# Zona horaria por defecto
DEFAULT_TIMEZONE = "America/Mexico_City"

def get_timezone_config():
    """
    Lee la configuración de zona horaria desde archivo.
    Retorna el nombre de la zona horaria configurada.
    """
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('timezone', DEFAULT_TIMEZONE)
        except Exception:
            pass
    return DEFAULT_TIMEZONE

def set_timezone_config(timezone_name: str):
    """
    Guarda la configuración de zona horaria en archivo.
    
    Args:
        timezone_name: Nombre de la zona horaria (ej: "America/Mexico_City", "UTC")
    
    Raises:
        ValueError: Si la zona horaria no es válida
    """
    # Validar que la zona horaria existe
    try:
        pytz.timezone(timezone_name)
    except pytz.exceptions.UnknownTimeZoneError:
        raise ValueError(f"Zona horaria inválida: {timezone_name}")
    
    config = {'timezone': timezone_name}
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def get_current_timezone():
    """
    Obtiene el objeto timezone configurado actualmente.
    
    Returns:
        pytz.timezone: Objeto de zona horaria
    """
    timezone_name = get_timezone_config()
    return pytz.timezone(timezone_name)

def now():
    """
    Obtiene la fecha y hora actual en la zona horaria configurada.
    
    Returns:
        datetime: Fecha y hora actual con zona horaria
    """
    tz = get_current_timezone()
    return datetime.now(tz)

def utc_to_local(utc_dt):
    """
    Convierte un datetime UTC a la zona horaria local configurada.
    
    Args:
        utc_dt: datetime en UTC (naive o aware)
    
    Returns:
        datetime: datetime en zona horaria local
    """
    if utc_dt.tzinfo is None:
        # Si es naive, asumir UTC
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    
    local_tz = get_current_timezone()
    return utc_dt.astimezone(local_tz)

def local_to_utc(local_dt):
    """
    Convierte un datetime local a UTC.
    
    Args:
        local_dt: datetime en zona horaria local (naive o aware)
    
    Returns:
        datetime: datetime en UTC
    """
    if local_dt.tzinfo is None:
        # Si es naive, asumir zona horaria local
        local_tz = get_current_timezone()
        local_dt = local_tz.localize(local_dt)
    
    return local_dt.astimezone(timezone.utc)

def from_timestamp(timestamp, tz=None):
    """
    Crea un datetime desde un timestamp usando la zona horaria configurada.
    
    Args:
        timestamp: timestamp Unix
        tz: zona horaria opcional, si no se provee usa la configurada
    
    Returns:
        datetime: datetime en zona horaria especificada
    """
    if tz is None:
        tz = get_current_timezone()
    return datetime.fromtimestamp(timestamp, tz=tz)

def get_available_timezones():
    """
    Retorna lista de zonas horarias comunes disponibles.
    
    Returns:
        list: Lista de nombres de zonas horarias
    """
    return [
        "America/Mexico_City",  # GMT-6/-5 (México Central)
        "America/Tijuana",      # GMT-8/-7 (México Pacífico)
        "America/Cancun",       # GMT-5 (México Este)
        "America/Chihuahua",    # GMT-7/-6 (México Montaña)
        "America/Hermosillo",   # GMT-7 (México Pacífico sin DST)
        "America/New_York",     # GMT-5/-4 (US Este)
        "America/Chicago",      # GMT-6/-5 (US Central)
        "America/Denver",       # GMT-7/-6 (US Montaña)
        "America/Los_Angeles",  # GMT-8/-7 (US Pacífico)
        "UTC",                  # GMT+0
        "Europe/Madrid",        # GMT+1/+2
        "Europe/London",        # GMT+0/+1
        "Asia/Tokyo",           # GMT+9
    ]

def get_timezone_info():
    """
    Obtiene información detallada de la zona horaria actual.
    
    Returns:
        dict: Información de zona horaria (nombre, offset, abreviación)
    """
    tz = get_current_timezone()
    now_time = datetime.now(tz)
    
    return {
        "timezone": tz.zone,
        "offset": now_time.strftime("%z"),
        "offset_hours": now_time.utcoffset().total_seconds() / 3600,
        "abbreviation": now_time.tzname(),
        "current_time": now_time.isoformat()
    }
