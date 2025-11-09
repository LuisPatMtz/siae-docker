# /SIAE_DEV/Fast_API/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Copia solo los requerimientos primero para cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia TODO el resto del código (main.py, routers/, models.py, etc.)
COPY . .

EXPOSE 8000

# El cambio clave: uvicorn main:app (porque main.py está en /app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]