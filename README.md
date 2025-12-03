# SIAE - Sistema de Identificacion de Asistencia Estudiantil

## Características Principales

- Control de asistencia con tarjetas NFC/RFID
- Gestión de estudiantes por semestre y grupo
- Vinculación de tarjetas con matrícula estudiantil
- Dashboard con estadísticas en tiempo real
- Sistema de alertas de faltas
- Gestión de usuarios con roles y permisos
- Justificación de inasistencias

---

## Instalación

### Requisitos Previos

- Docker Desktop instalado: https://www.docker.com/get-started/
- Git para clonar el repositorio

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/LuisPatMtz/siae-docker.git
cd siae-docker
```

2. Iniciar Docker Desktop

3. Construir e iniciar los contenedores:
```bash
docker-compose up --build
```

4. El sistema estará disponible en:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

---

## 🚀 Gestión de Despliegue

### Script Interactivo de Despliegue

Usa el script `deploy.sh` para gestionar los servicios de forma interactiva:

```bash
./deploy.sh
```

El script ofrece las siguientes opciones:

- **[1]** 🔄 Reconstruir TODO (Full rebuild)
- **[2]** 🎨 Reconstruir solo FRONTEND + Nginx
- **[3]** ⚙️  Reconstruir solo BACKEND
- **[4]** 🗄️  Reconstruir solo PostgreSQL
- **[5]** 🌐 Reiniciar solo NGINX (sin rebuild)
- **[6]** 📊 Ver estado de contenedores
- **[7]** 📋 Ver logs
- **[8]** 🧹 Limpiar sistema Docker
- **[9]** 🔌 Detener todo

### Actualización Automática (Producción)

Para servidores de producción, usa `quick-deploy.sh` que detecta automáticamente qué servicios actualizar:

```bash
./quick-deploy.sh
```

Este script:
- ✅ Hace `git pull` automáticamente
- ✅ Detecta qué archivos cambiaron
- ✅ Reconstruye solo los servicios necesarios
- ✅ Verifica el estado final

### Comandos Manuales Rápidos

```bash
# Reconstruir solo frontend (después de cambios en React/Vite)
docker-compose up -d --build --no-deps frontend

# Reconstruir solo backend (después de cambios en FastAPI)
docker-compose up -d --build --no-deps backend

# Ver logs en tiempo real
docker-compose logs -f

# Ver estado de servicios
docker-compose ps
```

---

## Insertar admin

Ejecuta el script [crear_admin.py]
```bash
docker-compose exec backend python crear_admin_docker.py
```

