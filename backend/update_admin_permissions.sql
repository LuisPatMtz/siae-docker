-- Actualizar permisos del usuario admin
UPDATE usuarios 
SET permissions = '{"all": true, "canViewDashboard": true, "canManageAlerts": true, "canEditStudents": true, "canManageUsers": true, "canManageMaintenance": true, "canManageAttendance": true}'::json 
WHERE username = 'admin';

-- Verificar los permisos actualizados
SELECT username, role, permissions FROM usuarios WHERE username = 'admin';
