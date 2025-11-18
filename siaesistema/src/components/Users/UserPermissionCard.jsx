import React, { useState } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import DeleteUserConfirmModal from './DeleteUserConfirmModal.jsx';

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

    return (
        <div className="user-permission-card card">
            <div className="user-info-header">
                <h3 className="user-name">{user.full_name || user.username}</h3>
                <span className="user-role-badge">{user.role}</span>
                <span className="user-username">{user.username}</span>
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
            </div>
            
            <div className="card-actions-group">
                <button 
                    className="edit-user-btn"
                    onClick={() => onEdit(user)}
                    title="Editar usuario"
                >
                    <Edit3 size={16} />
                    Editar Usuario
                </button>
                
                <button 
                    className="delete-user-btn-full"
                    onClick={handleDelete}
                    title="Eliminar usuario"
                >
                    <Trash2 size={16} />
                    Eliminar Usuario
                </button>
            </div>

            <DeleteUserConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                userName={user.full_name || user.username}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default UserPermissionCard;