// src/components/Users/AddUserModal.jsx
import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    
    // Estados para todos los campos del formulario
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    
    // Estado para los checkboxes de permisos
    const [permissions, setPermissions] = useState({
        canViewDashboard: true, // Por defecto, casi todos pueden ver
        canManageAlerts: false,
        canEditStudents: false,
        canManageUsers: false,
    });
    
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const clearForm = () => {
        setUsername('');
        setFullName('');
        setPassword('');
        setPermissions({
            canViewDashboard: true, canManageAlerts: false,
            canEditStudents: false, canManageUsers: false,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!username || !fullName || !password) {
            setError('Usuario, Nombre Completo y Contraseña son obligatorios.');
            return;
        }

        setIsSaving(true);
        
        const newUserData = {
            username,
            full_name: fullName,
            password,
            role: fullName,
            permissions,
        };

        try {
            // Llama a la función 'handleAddUser' de la página padre
            await onSubmit(newUserData);
            // Si tiene éxito, cierra el modal y limpia
            clearForm();
            onClose();
        } catch (apiError) {
            // Si onSubmit lanza un error (de la API), lo mostramos
            setError(apiError.message || "Error al guardar el usuario.");
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
                    <h2 className="modal-title">Agregar Nuevo Usuario</h2>
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
                        
                        <h3 className="form-section-title">Datos de Acceso</h3>
                        <div className="form-grid-col-3">
                            <div className="modal-input-group">
                                <label htmlFor="username">Nombre de Usuario (Login):</label>
                                <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
                            </div>
                            <div className="modal-input-group">
                                <label htmlFor="fullName">Nombre Completo:</label>
                                <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej: Juan Pérez García" required />
                            </div>
                            <div className="modal-input-group">
                                <label htmlFor="password">Contraseña Inicial:</label>
                                <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>

                        <h3 className="form-section-title">Permisos del Usuario</h3>
                        <div className="form-grid-col-2">
                            {/* Checkbox para cada permiso */}
                            <label className="checkbox-label">
                                <input type="checkbox" checked={permissions.canViewDashboard} onChange={() => handlePermissionChange('canViewDashboard')} />
                                Ver Dashboard
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" checked={permissions.canManageAlerts} onChange={() => handlePermissionChange('canManageAlerts')} />
                                Gestionar Alertas
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" checked={permissions.canEditStudents} onChange={() => handlePermissionChange('canEditStudents')} />
                                Editar Estudiantes
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" checked={permissions.canManageUsers} onChange={() => handlePermissionChange('canManageUsers')} />
                                Gestionar Usuarios
                            </label>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="modal-btn cancel" onClick={handleClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="modal-btn save" disabled={isSaving}>
                            <UserPlus size={18} />
                            {isSaving ? 'Guardando...' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;