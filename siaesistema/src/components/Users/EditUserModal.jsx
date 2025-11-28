// src/components/Users/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const EditUserModal = ({ isOpen, onClose, onSubmit, user }) => {
    useEscapeKey(isOpen, onClose);
    
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('Docente');
    const [permissions, setPermissions] = useState({
        canViewDashboard: false,
        canManageAlerts: false,
        canEditStudents: false,
        canManageUsers: false,
        canManageMaintenance: false,
        canManageAttendance: false,
    });
    
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Cargar datos del usuario cuando se abre el modal
    useEffect(() => {
        if (isOpen && user) {
            setUsername(user.username || '');
            setFullName(user.full_name || '');
            setRole(user.role || 'Docente');
            setPermissions(user.permissions || {
                canViewDashboard: false,
                canManageAlerts: false,
                canEditStudents: false,
                canManageUsers: false,
                canManageMaintenance: false,
                canManageAttendance: false,
            });
        }
    }, [isOpen, user]);

    const handlePermissionChange = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const clearForm = () => {
        setUsername('');
        setFullName('');
        setRole('Docente');
        setPermissions({
            canViewDashboard: false,
            canManageAlerts: false,
            canEditStudents: false,
            canManageUsers: false,
            canManageMaintenance: false,
            canManageAttendance: false,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!username || !fullName) {
            setError('Usuario y Nombre Completo son obligatorios.');
            return;
        }

        setIsSaving(true);
        
        const updatedUserData = {
            username,
            full_name: fullName,
            role,
            permissions,
        };

        try {
            await onSubmit(user.id, updatedUserData);
            clearForm();
            onClose();
        } catch (apiError) {
            setError(apiError.message || "Error al actualizar el usuario.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content large-modal">
                <div className="modal-header form-header">
                    <h2 className="modal-title">Editar Usuario</h2>
                    <button onClick={handleClose} className="close-form-btn" disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="form-feedback error">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}
                        
                        <h3 className="form-section-title">Información del Usuario</h3>
                        <div className="form-grid-col-2">
                            <div className="modal-input-group">
                                <label htmlFor="edit-username">Nombre de Usuario (Login):</label>
                                <input 
                                    type="text" 
                                    id="edit-username" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="modal-input-group">
                                <label htmlFor="edit-fullName">Nombre Completo:</label>
                                <input 
                                    type="text" 
                                    id="edit-fullName" 
                                    value={fullName} 
                                    onChange={e => setFullName(e.target.value)} 
                                    placeholder="Ej: Juan Pérez García" 
                                    required 
                                />
                            </div>
                        </div>

                        <h3 className="form-section-title">Rol del Usuario</h3>
                        <div className="modal-input-group">
                            <label htmlFor="edit-role">Selecciona el rol:</label>
                            <select id="edit-role" value={role} onChange={e => setRole(e.target.value)} required>
                                <option value="Administrador">Administrador</option>
                                <option value="Orientador">Orientador</option>
                                <option value="Prefecto">Prefecto</option>
                                <option value="Docente">Docente</option>
                            </select>
                        </div>

                        <h3 className="form-section-title">Permisos del Usuario</h3>
                        <div className="form-grid-permissions">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canViewDashboard} 
                                    onChange={() => handlePermissionChange('canViewDashboard')} 
                                />
                                Ver Dashboard
                            </label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canManageAlerts} 
                                    onChange={() => handlePermissionChange('canManageAlerts')} 
                                />
                                Gestionar Alertas
                            </label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canEditStudents} 
                                    onChange={() => handlePermissionChange('canEditStudents')} 
                                />
                                Editar Estudiantes
                            </label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canManageUsers} 
                                    onChange={() => handlePermissionChange('canManageUsers')} 
                                />
                                Gestionar Usuarios
                            </label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canManageMaintenance} 
                                    onChange={() => handlePermissionChange('canManageMaintenance')} 
                                />
                                Mantenimiento
                            </label>
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={permissions.canManageAttendance} 
                                    onChange={() => handlePermissionChange('canManageAttendance')} 
                                />
                                Gestión de Asistencia
                            </label>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="modal-btn cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="modal-btn save" disabled={isSaving}>
                            <Save size={18} />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
