# 🎓 SIAE - Sistema Inteligente de Asistencia Estudiantil

Backend del **Sistema de Control de Asistencia Estudiantil** mediante **tarjetas NFC**. Desarrollado con **FastAPI** y **PostgreSQL**, permite gestionar estudiantes, grupos, ciclos escolares y registrar accesos de manera automática.

**✨ Refactorizado el 16/Nov/2025** - Nueva estructura modular con mejor organización del código.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/LuisPatMtz/siae-docker.git
cd SIAE/Fast_API

# 2. Verificar estructura
python validate_structure.py

# 3. Levantar con Docker
docker-compose build
docker-compose up -d

# 4. Verificar que funciona
curl http://localhost:8000/health

# 5. Ver documentación
# http://localhost:8000/docs
```

**📖 Guía completa:** [`DOCKER_GUIDE.md`](DOCKER_GUIDE.md)

---

## ✨ Características

- ✅ Autenticación JWT + bcrypt
- ✅ CRUD completo de estudiantes, grupos, ciclos
- ✅ Registro NFC en tiempo real
- ✅ Dashboard con estadísticas
- ✅ Gestión de faltas con justificaciones
- ✅ Sistema de permisos por usuario
- ✅ CASCADE DELETE automático
- ✅ API versionada (v1)
- ✅ Documentación interactiva
- ✅ Zona horaria México (UTC-6)

---

## 📁 Estructura

```
Fast_API/
├── app/
│   ├── main.py              # Entry point
│   ├── core/                # Config + Security
│   ├── db/                  # Database
│   ├── models/              # Modelos separados
│   └── api/v1/              # Routers versionados
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── 📚 Docs/
    ├── INDEX.md             # Índice
    ├── DOCKER_GUIDE.md      # Docker
    ├── POSTMAN_GUIDE.md     # Pruebas
    └── REFACTORING_SUMMARY.md  # 👉 Empieza aquí
```

---

## 📚 Documentación

| Guía | Descripción |
|------|-------------|
| [`INDEX.md`](INDEX.md) | Índice completo |
| [`REFACTORING_SUMMARY.md`](REFACTORING_SUMMARY.md) | Resumen cambios |
| [`DOCKER_GUIDE.md`](DOCKER_GUIDE.md) | Instrucciones Docker |
| [`POSTMAN_GUIDE.md`](POSTMAN_GUIDE.md) | Colección pruebas |

**Docs interactivas:**
- http://localhost:8000/docs (Swagger)
- http://localhost:8000/redoc

---

## 🔐 Autenticación

```bash
# Login
curl -X POST http://localhost:8000/login \
  -d "username=admin&password=admin123"

# Usar token
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer {token}"
```

---

## 🛠️ Desarrollo

```bash
# Levantar
docker-compose up -d

# Ver logs
docker-compose logs -f fastapi

# Reiniciar
docker-compose restart fastapi

# Detener
docker-compose down
```

---

## 📊 Stack

- **FastAPI** - Framework
- **SQLModel** - ORM
- **PostgreSQL** - Database
- **Docker** - Containerización
- **JWT** - Autenticación
- **bcrypt** - Hashing

---

## 🤝 Contribuir

Ver [`INDEX.md`](INDEX.md) - Sección "Contribuir"

---

**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready  
**Última actualización:** 16/Nov/2025
