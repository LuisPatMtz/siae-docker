import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const DeleteUserSelectModal = ({ isOpen, onClose, users, onConfirmSelection }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!selectedUserId) {
            setError('Por favor, selecciona un usuario para eliminar.');
            return;
        }
        
        // Buscamos el usuario por su ID. Asumimos que el ID es un número.
        const user = users.find(u => u.id === parseInt(selectedUserId));
        
        if (user) {
            onConfirmSelection(user.id, user.full_name || user.username);
        } else {
            setError('Usuario no encontrado.'); // Error por si acaso
        }
    };

    const handleClose = () => {
        setSelectedUserId('');
        setError('');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <div className="modal-header form-header">
                    <h2 className="card-title">Eliminar Usuario</h2>
                    <button onClick={handleClose} className="close-form-btn">
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
                        <div className="modal-input-group">
                            <label htmlFor="userSelect">Selecciona el usuario a eliminar:</label>
                            <select 
                                id="userSelect" 
                                value={selectedUserId} 
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Elige un usuario --</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.username} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="modal-actions form-actions">
                        <button type="button" className="action-button clear-button" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="action-button delete-button">
                            Siguiente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteUserSelectModal;