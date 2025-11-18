"""
Módulo de seguridad: autenticación JWT y hashing de contraseñas
Responsabilidades:
- Generación y validación de tokens JWT
- Hash y verificación de contraseñas con bcrypt
- Extracción del usuario actual desde el token
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


# Esquema de seguridad OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- Hashing de Contraseñas ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña plana coincide con el hash almacenado.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash almacenado en la base de datos
        
    Returns:
        bool: True si coinciden, False en caso contrario
    """
    try:
        plain_password_bytes = plain_password.encode('utf-8')
        hashed_password_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception as e:
        print(f"Error al verificar contraseña: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt para la contraseña.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Hash de la contraseña
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')


# --- Tokens JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT con los datos proporcionados.
    
    Args:
        data: Diccionario con los datos a codificar en el token
        expires_delta: Tiempo de expiración personalizado (opcional)
        
    Returns:
        str: Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida un token JWT.
    
    Args:
        token: Token JWT a decodificar
        
    Returns:
        dict: Payload del token si es válido, None en caso contrario
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_current_username(token: str = Depends(oauth2_scheme)) -> str:
    """
    Extrae el username del token JWT.
    
    Args:
        token: Token JWT obtenido del header Authorization
        
    Returns:
        str: Username extraído del token
        
    Raises:
        HTTPException: Si el token es inválido o no contiene username
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    return username


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Obtiene el objeto Usuario completo desde el token JWT.
    NOTA: Esta función necesita Session, por lo que el uso real
    está en app.core.permissions.get_current_user()
    
    Esta función solo extrae el username. Para obtener el objeto completo,
    usa: from app.core.permissions import get_current_user
    
    Returns:
        str: Username del usuario actual
    """
    return get_current_username(token)
