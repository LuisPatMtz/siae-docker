# 🐳 Instrucciones para Levantar con Docker

## 🚀 Inicio Rápido

```bash
# 1. Ir al directorio del proyecto
cd c:\Users\luisp\Desktop\SIAE

# 2. Reconstruir la imagen (necesario después de la refactorización)
docker-compose build

# 3. Levantar servicios
docker-compose up -d

# 4. Verificar que estén corriendo
docker-compose ps

# 5. Ver logs
docker-compose logs -f fastapi
```

---

## 📝 Paso a Paso Detallado

### 1. Detener Servicios Actuales (si están corriendo)

```bash
docker-compose down
```

---

### 2. Reconstruir Imagen

Esto es **obligatorio** porque cambiamos la estructura del proyecto:

```bash
docker-compose build --no-cache
```

**Salida esperada:**
```
Building fastapi
[+] Building 45.2s (10/10) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 342B
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/python:3.10-slim
 => [1/5] FROM docker.io/library/python:3.10-slim
 => [internal] load build context
 => => transferring context: 15.2kB
 => [2/5] WORKDIR /app
 => [3/5] COPY requirements.txt .
 => [4/5] RUN pip install --no-cache-dir -r requirements.txt
 => [5/5] COPY . .
 => exporting to image
Successfully built abc123def456
```

---

### 3. Levantar Servicios

```bash
docker-compose up -d
```

**Salida esperada:**
```
Creating network "siae_default" with the default driver
Creating volume "siae_postgres_data" with default driver
Creating siae-postgres ... done
Creating siae-fastapi  ... done
```

---

### 4. Verificar Estado

```bash
docker-compose ps
```

**Salida esperada:**
```
     Name                   Command               State           Ports
--------------------------------------------------------------------------------
siae-fastapi    uvicorn app.main:app --hos ...   Up      0.0.0.0:8000->8000/tcp
siae-postgres   docker-entrypoint.sh postgres    Up      5432/tcp
```

**Ambos deben estar en estado `Up`**

---

### 5. Ver Logs

#### Logs de FastAPI:
```bash
docker-compose logs -f fastapi
```

**Salida esperada (exitosa):**
```
fastapi    | INFO:     Will watch for changes in these directories: ['/app']
fastapi    | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
fastapi    | INFO:     Started reloader process [1] using StatReload
fastapi    | Iniciando: Creando tablas si no existen...
fastapi    | CREATE TABLE IF NOT EXISTS ciclo_escolar (...)
fastapi    | CREATE TABLE IF NOT EXISTS grupo (...)
fastapi    | CREATE TABLE IF NOT EXISTS estudiante (...)
fastapi    | ✓ TABLAS CREADAS EXITOSAMENTE
fastapi    | INFO:     Started server process [8]
fastapi    | INFO:     Waiting for application startup.
fastapi    | INFO:     Application startup complete.
```

#### Logs de PostgreSQL:
```bash
docker-compose logs -f postgres
```

---

### 6. Verificar Conectividad

#### Desde PowerShell:
```bash
# Health check
curl http://localhost:8000/health

# O con Invoke-WebRequest
Invoke-WebRequest -Uri http://localhost:8000/health -Method GET
```

#### Desde navegador:
```
http://localhost:8000/health
http://localhost:8000/docs
```

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Reiniciar un servicio
```bash
docker-compose restart fastapi
```

### Detener servicios
```bash
docker-compose stop
```

### Detener y eliminar contenedores
```bash
docker-compose down
```

### Detener, eliminar contenedores Y volúmenes (⚠️ BORRA LA DB)
```bash
docker-compose down -v
```

### Entrar al contenedor de FastAPI
```bash
docker-compose exec fastapi bash
```

Dentro del contenedor:
```bash
# Ver estructura
ls -la app/

# Verificar imports
python -c "from app.main import app; print('OK')"

# Salir
exit
```

### Entrar al contenedor de PostgreSQL
```bash
docker-compose exec postgres psql -U siae_admin -d siae_db
```

Dentro de psql:
```sql
-- Ver tablas
\dt

-- Ver estructura de tabla
\d estudiante

-- Ver usuarios
SELECT username, role FROM usuarios;

-- Salir
\q
```

---

## 🐛 Troubleshooting

### Problema 1: Puerto 8000 ocupado

**Error:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8000: bind: Only one usage of each socket address
```

**Solución:**
```bash
# Ver qué está usando el puerto 8000
netstat -ano | findstr :8000

# Matar el proceso (reemplaza PID)
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml
# ports:
#   - "8001:8000"
```

---

### Problema 2: Error al construir imagen

**Error:**
```
ERROR [4/5] RUN pip install --no-cache-dir -r requirements.txt
```

**Solución:**
```bash
# Limpiar cache de Docker
docker system prune -a

# Reconstruir sin cache
docker-compose build --no-cache
```

---

### Problema 3: FastAPI no levanta

**Ver logs detallados:**
```bash
docker-compose logs fastapi | tail -50
```

**Errores comunes:**

#### Error de imports
```
ModuleNotFoundError: No module named 'app'
```
**Solución:** Verificar que el Dockerfile tenga:
```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Error de conexión a PostgreSQL
```
could not connect to server: Connection refused
```
**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Reiniciar servicios
docker-compose restart
```

---

### Problema 4: PostgreSQL no inicia

**Error:**
```
siae-postgres exited with code 1
```

**Solución:**
```bash
# Ver logs de PostgreSQL
docker-compose logs postgres

# Posible causa: datos corruptos
docker-compose down -v  # ⚠️ ESTO BORRA LA DB
docker-compose up -d
```

---

### Problema 5: Cambios en el código no se reflejan

**Causa:** Docker está usando código viejo en la imagen.

**Solución:**
```bash
# Reconstruir imagen
docker-compose build

# Reiniciar contenedor
docker-compose restart fastapi
```

O usar modo desarrollo con volúmenes (editar docker-compose.yml):
```yaml
services:
  fastapi:
    volumes:
      - ./Fast_API:/app
```

---

## 📊 Verificación Final

### Checklist

- [ ] `docker-compose ps` muestra ambos servicios en `Up`
- [ ] `docker-compose logs fastapi` muestra "Application startup complete"
- [ ] `http://localhost:8000/health` devuelve `{"status": "healthy"}`
- [ ] `http://localhost:8000/docs` muestra Swagger UI
- [ ] Login en Postman funciona y devuelve token
- [ ] `/users/me` con token funciona

---

## 🎯 Próximos Pasos

Una vez que todo levante correctamente:

1. **Probar endpoints con Postman** (ver `POSTMAN_GUIDE.md`)
2. **Verificar dashboard del frontend** (http://localhost:5173)
3. **Probar registro de acceso NFC**
4. **Validar cascade delete**

---

## 📝 Notas

### Variables de Entorno

El archivo `.env` debe tener:
```env
POSTGRES_USER=siae_admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=siae_db
DATABASE_URL=postgresql://siae_admin:admin123@postgres:5432/siae_db
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f4f4f81f636afc8f10c51
```

### Persistencia de Datos

Los datos de PostgreSQL se guardan en un volumen Docker llamado `siae_postgres_data`.

Para ver volúmenes:
```bash
docker volume ls
```

Para eliminar volumen (⚠️ BORRA TODOS LOS DATOS):
```bash
docker volume rm siae_postgres_data
```

---

**Fecha:** 16 de Noviembre, 2025  
**Última actualización:** Después de refactorización a app/
