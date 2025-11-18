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

## Insertar admin

Ejecuta el script [crear_admin.py]
```bash
docker-compose exec backend python crear_admin_docker.py
```

