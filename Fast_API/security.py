from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated

# Importaciones de FastAPI y SQLModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

# Importaciones de Hashing y JWT
import bcrypt # Usamos la librería bcrypt directamente
from jose import JWTError, jwt 
from pydantic import BaseModel # Necesario para la clase Token

# Importaciones de tus módulos locales
# Asegúrate de que estas rutas sean correctas para tu proyecto
from database import get_session
from models import Usuario, TokenData

# --- 1. Configuración de Seguridad ---

# Nota: Leer estas variables de un archivo .env es lo ideal.
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f4f4f81f636afc8f10c51"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Esquema de seguridad para indicar que se usa Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# --- 2. Modelos de Respuesta ---
# La clase Token necesita heredar de BaseModel de Pydantic
class Token(BaseModel):
    access_token: str
    token_type: str


# --- 3. Funciones de Hashing de Contraseña ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña plana coincide con el hash guardado (usando bcrypt)."""
    try:
        # Aseguramos que ambas entradas sean bytes
        plain_password_bytes = plain_password.encode('utf-8')
        hashed_password_bytes = hashed_password.encode('utf-8')
        
        # bcrypt.checkpw hace la verificación
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception as e:
        # Manejar caso si el hash no es válido o hay error de codificación
        print(f"Error durante la verificación de contraseña: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Genera un hash para la contraseña (usando bcrypt)."""
    password_bytes = password.encode('utf-8')
    # Genera un 'salt' y hashea la contraseña.
    # El default de 12 es un buen factor de trabajo (work factor)
    salt = bcrypt.gensalt(rounds=12) 
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    # Decodifica a utf-8 para guardarlo como string en la DB
    return hashed_bytes.decode('utf-8')


# --- 4. Funciones de Token JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT con tiempo de expiración."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Añade el tiempo de expiración ('exp') al payload
    to_encode.update({"exp": expire}) 
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- 5. Funciones de Base de Datos y Dependencias ---

def get_user_from_db(username: str, session: Session = Depends(get_session)) -> Optional[Usuario]:
    """Busca un usuario por nombre de usuario en la base de datos."""
    # Asegúrate de que 'Usuario' esté importado de Fast_API.models
    statement = select(Usuario).where(Usuario.username == username)
    return session.exec(statement).first()

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    session: Session = Depends(get_session)
) -> Usuario:
    """
    Dependencia que extrae el usuario del token y lo busca en la DB.
    Si falla, lanza HTTPException 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodifica el token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub") # Extrae el sujeto (username)
        
        if username is None:
            raise credentials_exception

        # Usa el modelo TokenData para validación
        token_data = TokenData(username=username) 

    except JWTError:
        raise credentials_exception

    # Busca el usuario en la DB
    user = get_user_from_db(username=token_data.username, session=session)
    if user is None:
        raise credentials_exception

    # Opcional: Verifica si el usuario está deshabilitado
    # if user.disabled:
    #     raise HTTPException(status_code=400, detail="Usuario inactivo")

    return user