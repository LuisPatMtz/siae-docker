import React, { useState } from 'react';
import { Trash2, Edit3, User } from 'lucide-react';
import DeleteUserConfirmModal from './DeleteUserConfirmModal.jsx';

// Helper para obtener iniciales
const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

// Helper para obtener color de fondo basado en el nombre
const getAvatarColor = (name) => {
    const colors = [
        'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', // Indigo
        'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', // Blue
        'linear-gradient(135deg, #059669 0%, #047857 100%)', // Emerald
        'linear-gradient(135deg, #D97706 0%, #B45309 100%)', // Amber
        'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', // Red
        'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', // Violet
        'linear-gradient(135deg, #DB2777 0%, #9D174D 100%)', // Pink
    ];

    let hash = 0;
    const str = name || 'default';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

// --- CAMBIO 1 ---
// El componente 'PermissionToggle' ya no acepta ni renderiza la prop 'description'
const PermissionToggle = ({ label, isChecked, onChange, userId }) => {
    const id = `toggle-${userId}-${label.replace(/\s+/g, '-')}`;
    return (
        <div className="permission-toggle-item">
            <div className="permission-toggle-label">
                <label htmlFor={id}>{label}</label>
                {/* La línea <p className="permission-description">... se ha eliminado */}
            </div>
            <div className="toggle-switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={isChecked}
                    onChange={onChange}
                />
                <label htmlFor={id} className="slider"></label>
            </div>
        </div>
    );
};

// Componente principal de la tarjeta
const UserPermissionCard = ({ user, onPermissionChange, onDelete, onEdit }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handler que avisa a la página padre (GestionUsuariosPage) sobre un cambio
    const handleChange = (permissionKey) => {
        const newValue = !user.permissions[permissionKey];
        // Llama a la función 'handlePermissionChange' de la página padre
        onPermissionChange(user.id, permissionKey, newValue);
    };

    // Handler para abrir modal de confirmación
    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    // Handler para confirmar eliminación
    const handleConfirmDelete = async () => {
        if (!onDelete) return;

        setIsDeleting(true);
        try {
            await onDelete(user.id, user.full_name || user.username);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error en la eliminación:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handler para cancelar eliminación
    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
    };

    const displayName = user.full_name || user.username;
    const initials = getInitials(displayName);
    const avatarBackground = getAvatarColor(user.username);

    return (
        <div className="user-permission-card card">
            <div className="user-info-header">
                <div className="user-avatar" style={{ background: avatarBackground }}>
                    {initials}
                </div>
                <div className="user-details">
                    <h3 className="user-name" title={displayName}>{displayName}</h3>
                    <span className="user-role-badge">{user.role}</span>
                    <span className="user-username">{user.username}</span>
                </div>
            </div>

            <div className="permissions-list">
                {/* --- CAMBIO 2 --- */}
                {/* Se eliminaron las props 'description' de todos los toggles */}
                <PermissionToggle
                    label="Ver Dashboard"
                    isChecked={user.permissions.canViewDashboard}
                    onChange={() => handleChange('canViewDashboard')}
                    userId={user.id}
                />
                <PermissionToggle
                    label="Gestionar Alertas"
                    isChecked={user.permissions.canManageAlerts}
                    onChange={() => handleChange('canManageAlerts')}
                    userId={user.id}
                />
                <PermissionToggle
                    label="Editar Estudiantes"
                    isChecked={user.permissions.canEditStudents}
                    onChange={() => handleChange('canEditStudents')}
                    userId={user.id}
                />
                <PermissionToggle
                    label="Gestionar Usuarios"
                    isChecked={user.permissions.canManageUsers}
                    onChange={() => handleChange('canManageUsers')}
                    userId={user.id}
                />
                <PermissionToggle
                    label="Mantenimiento"
                    isChecked={user.permissions.canManageMaintenance}
                    onChange={() => handleChange('canManageMaintenance')}
                    userId={user.id}
                />
                <PermissionToggle
                    label="Gestión de Asistencia"
                    isChecked={user.permissions.canManageAttendance}
                    onChange={() => handleChange('canManageAttendance')}
                    userId={user.id}
                />
            </div>

            <div className="card-actions-group">
                <button
                    className="edit-user-btn"
                    onClick={() => onEdit(user)}
                    title="Editar usuario"
                >
                    <Edit3 size={16} />
                    Editar
                </button>

                <button
                    className="delete-user-btn-full"
                    onClick={handleDelete}
                    title="Eliminar usuario"
                >
                    <Trash2 size={16} />
                    Eliminar
                </button>
            </div>

            <DeleteUserConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                userName={displayName}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default UserPermissionCard;