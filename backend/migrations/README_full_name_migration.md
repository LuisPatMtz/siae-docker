# Migración: Agregar campo full_name a usuarios

## Error Detectado
```
ERROR: column u.full_name does not exist
LINE 108: u.full_name,
SQL state: 42703
```

## Problema
El frontend está intentando mostrar `user.full_name` pero la tabla `usuarios` en la base de datos no tiene esta columna.

## Solución Implementada

### 1. Cambios en el Modelo
**Archivo**: `backend/app/models/usuario.py`
- ✅ Agregada columna `full_name: Optional[str]` al modelo `Usuario`

### 2. Cambios en los DTOs
**Archivo**: `backend/app/models/auth.py`
- ✅ Agregado campo `full_name` a `UserRead`
- ✅ Agregado campo `full_name` a `UserReadWithPermissions`
- ✅ Agregado campo `full_name` a `AdminUserCreate`
- ✅ Agregado campo `full_name` a `UserUpdate`

### 3. Cambios en el Repositorio
**Archivo**: `backend/app/repositories/usuario_repo.py`
- ✅ Actualizado método `create()` para incluir `full_name`

### 4. Script de Migración
**Archivo**: `backend/scripts/add_full_name_migration.py`
- ✅ Creado script para ejecutar la migración SQL

## Cómo Aplicar la Migración

### Opción 1: Usando el script Python (Recomendado)

#### Si usas Docker:
```bash
docker-compose exec backend python scripts/add_full_name_migration.py
```

#### Si ejecutas local:
```bash
cd backend
python scripts/add_full_name_migration.py
```

### Opción 2: SQL Directo

Conectarte a PostgreSQL y ejecutar:

```sql
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
```

## Verificación

Después de ejecutar la migración, verifica que la columna existe:

```sql
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' AND column_name = 'full_name';
```

Deberías ver:
```
column_name | data_type         | character_maximum_length | is_nullable
------------|-------------------|--------------------------|------------
full_name   | character varying | 100                      | YES
```

## Reiniciar el Backend

Después de aplicar la migración, reinicia el backend:

### Docker:
```bash
docker-compose restart backend
```

### Local:
Detén el servidor (Ctrl+C) y vuelve a ejecutar:
```bash
uvicorn app.main:app --reload
```

## Notas Importantes

1. **Usuarios Existentes**: Los usuarios que ya existen tendrán `full_name = NULL`. Esto es normal y no causa problemas porque el campo es opcional.

2. **Frontend Preparado**: El frontend ya maneja correctamente cuando `full_name` es null, mostrando el `username` como fallback:
   ```jsx
   {user.full_name || user.username}
   ```

3. **Nuevos Usuarios**: Al crear nuevos usuarios desde el modal "Agregar Usuario", ahora podrás ingresar el nombre completo y se guardará correctamente.

## Actualización de Usuarios Existentes

Si quieres actualizar el `full_name` de usuarios existentes, puedes hacerlo:

### Desde SQL:
```sql
UPDATE usuarios SET full_name = 'Nombre Completo' WHERE username = 'admin';
```

### Desde la UI:
Cuando implementes la función de editar usuario, podrás actualizar el nombre completo desde ahí.

## Rollback (Si es necesario)

Si necesitas revertir la migración:

```sql
ALTER TABLE usuarios DROP COLUMN IF EXISTS full_name;
```

**⚠️ ADVERTENCIA**: Esto eliminará permanentemente los datos de `full_name` de todos los usuarios.
