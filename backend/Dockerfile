# /SIAE_DEV/Fast_API/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Instalar cliente PostgreSQL para pg_dump
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copia solo los requerimientos primero para cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia TODO el resto del código (main.py, routers/, models.py, etc.)
COPY . .

EXPOSE 8000

# Comando actualizado para la nueva estructura app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]