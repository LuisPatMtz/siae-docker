# Configuración de Permisos Docker

## Problema
Los scripts necesitan ejecutarse con `sudo` porque el usuario actual no tiene permisos para usar Docker directamente.

## Solución Recomendada

Para evitar tener que usar `sudo` cada vez, agrega tu usuario al grupo `docker`:

```bash
# 1. Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# 2. Verificar que se agregó correctamente
groups $USER

# 3. Aplicar los cambios (elige una opción)

# Opción A: Reiniciar la sesión (recomendado)
# Cierra sesión y vuelve a iniciar sesión

# Opción B: Aplicar cambios sin reiniciar sesión
newgrp docker

# Opción C: Reiniciar el servidor (si es necesario)
sudo reboot
```

## Verificar que funciona

```bash
# Probar docker sin sudo
docker ps

# Probar docker compose sin sudo
docker compose version
```

## Estado Actual

Los scripts `deploy.sh` y `quick-deploy.sh` ahora:
- ✅ Detectan automáticamente si necesitan `sudo`
- ✅ Agregan `sudo` automáticamente si es necesario
- ✅ Funcionan tanto con permisos de usuario como con sudo

## Usar los scripts

```bash
# Con permisos de usuario docker (después de configurar)
./deploy.sh
./quick-deploy.sh

# Si no tienes permisos, el script usará sudo automáticamente
# Te pedirá la contraseña cuando sea necesario
```

## Alternativa: Ejecutar como root

Si prefieres ejecutar los scripts como root directamente:

```bash
sudo ./deploy.sh
sudo ./quick-deploy.sh
```

**Nota:** Los scripts detectarán automáticamente que ya estás en modo root y no duplicarán el `sudo`.

## Seguridad

⚠️ **Importante:** Agregar un usuario al grupo `docker` le da permisos equivalentes a root. Solo hazlo con usuarios de confianza.

Si prefieres mantener la seguridad, simplemente usa `sudo` cada vez que ejecutes los scripts. Los scripts están preparados para manejar esto automáticamente.
