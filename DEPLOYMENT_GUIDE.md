# 🚀 Guía de Despliegue - SIAE

## Uso del Script Interactivo

El script `deploy.sh` proporciona una interfaz amigable para gestionar el despliegue de SIAE.

### Inicio Rápido

```bash
# Hacer el script ejecutable (solo la primera vez)
chmod +x deploy.sh

# Ejecutar el script
./deploy.sh
```

---

## 📋 Opciones del Menú

### 1️⃣ Reconstruir TODO (Full rebuild)

**Cuándo usar:**
- Después de hacer cambios importantes en múltiples servicios
- Primera instalación/despliegue
- Cuando algo no funciona y quieres empezar de cero

**Qué hace:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Tiempo estimado:** 5-10 minutos

---

### 2️⃣ Reconstruir solo FRONTEND + Nginx

**Cuándo usar:**
- Cambios en React/Vite (componentes, páginas, estilos)
- Actualizaciones de la interfaz de usuario
- Cambios en configuración de Vite

**Qué hace:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d --no-deps frontend
docker-compose restart nginx
```

**Tiempo estimado:** 2-3 minutos

**Ejemplo de uso:**
- Modificaste `RegistroAccesoPage.jsx`
- Cambiaste estilos CSS
- Actualizaste componentes de React

---

### 3️⃣ Reconstruir solo BACKEND

**Cuándo usar:**
- Cambios en FastAPI (rutas, modelos, servicios)
- Actualizaciones de dependencias de Python
- Modificaciones en la lógica de negocio

**Qué hace:**
```bash
docker-compose build --no-cache backend
docker-compose up -d --no-deps backend
```

**Tiempo estimado:** 2-3 minutos

**Ejemplo de uso:**
- Agregaste nuevos endpoints
- Modificaste modelos de SQLModel
- Cambiaste la lógica de autenticación

---

### 4️⃣ Reconstruir solo PostgreSQL

⚠️ **ADVERTENCIA:** Esta opción elimina TODOS los datos

**Cuándo usar:**
- Necesitas resetear la base de datos
- Cambios en el esquema de base de datos
- Problemas de corrupción de datos

**Qué hace:**
```bash
docker-compose stop db
docker-compose down -v  # Elimina volúmenes
docker-compose up -d db
```

**Recomendación:** Siempre hacer backup antes de usar esta opción

```bash
# Backup manual
docker-compose exec db pg_dump -U siae_user siae_db > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U siae_user siae_db < backup.sql
```

---

### 5️⃣ Reiniciar solo NGINX

**Cuándo usar:**
- Cambios en `default.conf`
- Actualizaste certificados SSL
- Nginx no responde correctamente

**Qué hace:**
```bash
docker-compose restart nginx
```

**Tiempo estimado:** 5-10 segundos

---

### 6️⃣ Ver estado de contenedores

Muestra el estado actual de todos los servicios:

```bash
docker-compose ps
```

**Salida esperada:**
```
NAME              STATUS
siae-nginx        Up
siae-frontend     Up
siae-backend      Up
siae-postgres     Up (healthy)
```

---

### 7️⃣ Ver logs

**Opciones disponibles:**
1. Todos los servicios
2. Frontend
3. Backend
4. Nginx
5. PostgreSQL

**Comandos equivalentes:**
```bash
# Todos
docker-compose logs -f --tail=100

# Frontend
docker-compose logs -f --tail=100 frontend

# Backend
docker-compose logs -f --tail=100 backend

# Nginx
docker-compose logs -f --tail=100 nginx

# PostgreSQL
docker-compose logs -f --tail=100 db
```

**Presiona Ctrl+C para salir**

---

### 8️⃣ Limpiar sistema Docker

**Cuándo usar:**
- Espacio en disco bajo
- Muchas imágenes y contenedores no utilizados
- Después de múltiples builds

**Qué hace:**
```bash
docker system prune -a -f
```

**Elimina:**
- Contenedores detenidos
- Redes no utilizadas
- Imágenes sin tag
- Caché de build

**No elimina:**
- Contenedores en ejecución
- Volúmenes (datos de PostgreSQL están seguros)

---

### 9️⃣ Detener todo

**Cuándo usar:**
- Mantenimiento del servidor
- Liberar recursos
- Antes de actualizar Docker

**Qué hace:**
```bash
docker-compose down
```

**Para volver a iniciar:**
```bash
docker-compose up -d
```

---

## 🎯 Escenarios Comunes

### Escenario 1: Actualizaste el frontend (RegistroAccesoPage.jsx)

```bash
./deploy.sh
# Selecciona opción [2] - Reconstruir FRONTEND + Nginx
```

### Escenario 2: Agregaste un nuevo endpoint en el backend

```bash
./deploy.sh
# Selecciona opción [3] - Reconstruir BACKEND
```

### Escenario 3: Cambios en frontend Y backend

```bash
./deploy.sh
# Selecciona opción [1] - Reconstruir TODO
```

### Escenario 4: El sistema no responde

```bash
./deploy.sh
# Selecciona opción [6] - Ver estado
# Luego opción [7] - Ver logs del servicio con problemas
```

### Escenario 5: Después de git pull

```bash
git pull origin dev
./deploy.sh
# Si solo cambió frontend: opción [2]
# Si solo cambió backend: opción [3]
# Si no estás seguro: opción [1]
```

---

## 🔧 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs
./deploy.sh → opción [7]

# Ver estado detallado
docker-compose ps
docker inspect <nombre_contenedor>
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto
sudo lsof -i :80
sudo lsof -i :443

# Detener el proceso
sudo kill -9 <PID>
```

### Problemas de permisos

```bash
# Asegúrate de que el script es ejecutable
chmod +x deploy.sh

# Problemas con Docker
sudo usermod -aG docker $USER
# Luego cierra sesión e inicia de nuevo
```

### Cambios no se reflejan en el navegador

```bash
# Limpiar caché del navegador
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# O en DevTools (F12)
Application → Clear storage → Clear site data
```

### Base de datos corrupta

```bash
# Backup primero
docker-compose exec db pg_dump -U siae_user siae_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Luego reconstruir
./deploy.sh → opción [4]

# Restaurar si es necesario
docker-compose exec -T db psql -U siae_user siae_db < backup.sql
```

---

## 🌐 Despliegue en Producción (Ubuntu Server)

### Conexión SSH y Despliegue

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor.com

# 2. Ir al directorio del proyecto
cd /ruta/a/siae-docker

# 3. Actualizar código
git pull origin main  # o la rama que uses en producción

# 4. Ejecutar script de despliegue
./deploy.sh

# 5. Seleccionar la opción apropiada según los cambios
```

### Checklist Pre-Despliegue

- [ ] Backup de base de datos
- [ ] Commit de todos los cambios locales
- [ ] Push a GitHub
- [ ] Verificar rama correcta
- [ ] Revisar variables de entorno (.env)
- [ ] Verificar certificados SSL vigentes

### Checklist Post-Despliegue

- [ ] Verificar estado de contenedores: `./deploy.sh` → [6]
- [ ] Revisar logs: `./deploy.sh` → [7]
- [ ] Probar login en la aplicación
- [ ] Verificar funcionalidades críticas
- [ ] Monitorear por 5-10 minutos

---

## 📊 Monitoreo

### Ver recursos en tiempo real

```bash
# Uso de CPU y RAM
docker stats

# Espacio en disco
df -h

# Logs en tiempo real
docker-compose logs -f --tail=50
```

### Comandos útiles

```bash
# Reiniciar un servicio específico
docker-compose restart <servicio>

# Ejecutar comando dentro del contenedor
docker-compose exec backend bash
docker-compose exec frontend sh

# Ver información del contenedor
docker inspect siae-backend

# Ver redes
docker network ls
docker network inspect siae-docker_default
```

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisar logs:** `./deploy.sh` → [7]
2. **Ver estado:** `./deploy.sh` → [6]
3. **Consultar documentación:** README.md, DOCKER_GUIDE.md
4. **GitHub Issues:** Reportar problemas en el repositorio

---

## 📝 Notas Importantes

- **Siempre** hacer backup de la base de datos antes de cambios importantes
- **Verificar** los logs después de cada despliegue
- **Monitorear** el sistema los primeros minutos después del despliegue
- **Usar** la opción de reconstrucción selectiva para ahorrar tiempo
- **Limpiar** el sistema Docker regularmente para liberar espacio

---

¿Dudas o sugerencias? Abre un issue en GitHub o contacta al equipo de desarrollo.
