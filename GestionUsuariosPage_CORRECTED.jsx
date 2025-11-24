import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios'; // Importa tu cliente Axios
import '../styles/GestionUsuariosPage.css'; // Estilos premium

// --- 1. Importa los componentes ---
import UserPermissionCard from '../components/Users/UserPermissionCard.jsx';
import AddUserModal from '../components/Users/AddUserModal.jsx';
import EditUserModal from '../components/Users/EditUserModal.jsx';
import DeleteUserSelectModal from '../components/Users/DeleteUserSelectModal.jsx';
import DeleteConfirmModal from '../components/Users/DeleteConfirmModal.jsx';
import { useToast } from '../components/UI/ToastContainer.jsx';

// --- 2. Importa los iconos que usa esta página ---
import { PlusCircle, Trash2 } from 'lucide-react';

const GestionUsuariosPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteSelectOpen, setIsDeleteSelectOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState({ id: null, name: '' });
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    // Estado para feedback general (ej. 'Permisos actualizados')
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isSaving, setIsSaving] = useState(false); // Estado de carga genérico para modals

    // Hook para notificaciones toast
    const { showSuccess, showError, showWarning, ToastContainer } = useToast();

    // Temporizador para limpiar el feedback
    useEffect(() => {
        if (feedback.message) {
            const timer = setTimeout(() => {
                setFeedback({ message: '', type: '' });
            }, 3000); // Oculta después de 3 segundos
            return () => clearTimeout(timer);
        }
    }, [feedback]);


    // *** INTERRUPTOR #1: Cargar la lista de usuarios ***
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // --- CONEXIÓN API ---
            const response = await apiClient.get('/users');
            setUsers(response.data);
            // --------------------
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            showError('Error al cargar la lista de usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    // Carga los usuarios al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    // *** INTERRUPTOR #2: Actualizar un permiso ***
    const handlePermissionChange = async (userId, permissionKey, newValue) => {
        // Optimistic UI: Actualiza el estado local primero
        const originalUsers = [...users]; // Crear una copia para evitar referencias

        // Encuentra el usuario específico
        const targetUser = originalUsers.find(u => u.id === userId);
        if (!targetUser) {
            showError('Usuario no encontrado');
            return;
        }

        setUsers(currentUsers => {
            const updatedUsers = currentUsers.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        permissions: {
                            ...user.permissions,
                            [permissionKey]: newValue
                        }
                    };
                }
                return { ...user }; // Crear nueva referencia para todos los usuarios
            });
            return updatedUsers;
        });

        const currentUser = originalUsers.find(u => u.id === userId);
        if (!currentUser) return;

        const updatedPermissions = {
            ...currentUser.permissions,
            [permissionKey]: newValue
        };

        try {
            // --- CONEXIÓN API ---
            // Llama a la API en segundo plano
            await apiClient.patch(`/users/${userId}/permissions`, {
                permissions: updatedPermissions
            });
            // --------------------
            showSuccess('Permisos actualizados correctamente');

        } catch (error) {
            console.error("Error al actualizar permiso:", error);
            showError('Error al guardar el permiso. Cambios revertidos.');
            // Rollback: Si la API falla, revierte el cambio en el estado local
            setUsers(originalUsers);
        }
    };

    // --- Funciones para Modal Agregar Usuario ---
    const openAddUserModal = () => setIsAddUserModalOpen(true);
    const closeAddUserModal = () => setIsAddUserModalOpen(false);

    // *** INTERRUPTOR #3: Agregar Nuevo Usuario ***
    const handleAddUser = async (newUserData) => {
        // Esta función 'lanza' un error si la API falla, que el modal (AddUserModal) atrapa
        // --- CONEXIÓN API ---
        const response = await apiClient.post('/users', newUserData);
        const createdUser = response.data; // El usuario creado con su ID real
        // --------------------

        // Si la API tiene éxito, actualiza el estado local
        setUsers(currentUsers => [...currentUsers, createdUser]);
        showSuccess(`Usuario "${createdUser.full_name || createdUser.username}" creado exitosamente`);
        // El modal se cierra solo desde su propio 'handleSubmit'
    };

    // --- Funciones para Modal Editar Usuario ---
    const openEditUserModal = (user) => {
        setUserToEdit(user);
        setIsEditUserModalOpen(true);
    };

    const closeEditUserModal = () => {
        setIsEditUserModalOpen(false);
        setUserToEdit(null);
    };

    // *** INTERRUPTOR #3B: Actualizar Usuario Existente ***
    const handleEditUser = async (userId, updatedUserData) => {
        try {
            // --- CONEXIÓN API ---
            const response = await apiClient.put(`/users/${userId}`, updatedUserData);
            const updatedUser = response.data;
            // --------------------

            // Actualizar el estado local con los nuevos datos
            setUsers(currentUsers =>
                currentUsers.map(user =>
                    user.id === userId ? updatedUser : user
                )
            );
            showSuccess(`Usuario "${updatedUser.full_name || updatedUser.username}" actualizado exitosamente`);
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            const apiErrorMessage = error.response?.data?.detail || 'Error al actualizar el usuario';
            showError(apiErrorMessage);
            throw error;
        }
    };

    // --- Funciones para Eliminar Usuario ---
    const openDeleteUserModal = () => setIsDeleteSelectOpen(true);
    const closeDeleteUserModal = () => {
        setIsDeleteSelectOpen(false);
        setUserToDelete({ id: null, name: '' });
    };
    const handleConfirmSelection = (userId, userName) => {
        setUserToDelete({ id: userId, name: userName });
        setIsDeleteSelectOpen(false);
        setIsDeleteConfirmOpen(true);
    };
    const closeDeleteConfirm = () => {
        setIsDeleteConfirmOpen(false);
        setUserToDelete({ id: null, name: '' });
    };

    // *** INTERRUPTOR #4: Confirmar Eliminación ***
    const confirmDeleteUser = async () => {
        if (!userToDelete.id) return;

        setIsSaving(true);
        try {
            // --- CONEXIÓN API ---
            await apiClient.delete(`/users/${userToDelete.id}`);
            // --------------------

            setUsers(currentUsers => currentUsers.filter(user => user.id !== userToDelete.id));
            showSuccess(`Usuario "${userToDelete.name}" eliminado correctamente`);
            closeDeleteConfirm();

        } catch (error) {
            console.error(`Error al eliminar usuario ${userToDelete.id}:`, error);
            // Muestra el error de la API si existe (ej. "No se puede eliminar al admin")
            const apiErrorMessage = error.response?.data?.detail || 'Error al eliminar el usuario.';
            showError(apiErrorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Handler para eliminar un usuario individual desde su tarjeta
    const handleIndividualDelete = async (userId, userName) => {
        try {
            // --- CONEXIÓN API ---
            await apiClient.delete(`/users/${userId}`);
            // --------------------

            setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
            showSuccess(`Usuario "${userName}" eliminado exitosamente`);

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            // Muestra el error de la API si existe
            const apiErrorMessage = error.response?.data?.detail || 'Error al eliminar el usuario.';
            showError(apiErrorMessage);
            throw error; // Re-lanza el error para que el componente pueda manejarlo
        }
    };

    return (
        <main className="dashboard-main">
            <div className="users-page-header">
                <h1 className="users-page-title">Gestión de Usuarios</h1>
                <p className="users-page-subtitle">
                    Asigna o revoca permisos a los perfiles de usuario que acceden al sistema.
                </p>
                <div className="users-header-actions">
                    <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                        <PlusCircle size={18} />
                        Agregar Usuario
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-message">Cargando usuarios...</div>
            ) : users.length > 0 ? (
                <div className="users-grid-container">
                    {users.map(user => (
                        <UserPermissionCard
                            key={`user-${user.id}-${user.username}`}
                            user={user}
                            onPermissionChange={handlePermissionChange}
                            onDelete={handleIndividualDelete}
                            onEdit={openEditUserModal}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <h3>No hay usuarios registrados</h3>
                    <p>Comienza agregando tu primer usuario al sistema</p>
                    <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                        <PlusCircle size={18} />
                        Agregar Primer Usuario
                    </button>
                </div>
            )}

            {/* --- RENDERIZA TODOS LOS MODALES --- */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={closeAddUserModal}
                onSubmit={handleAddUser}
            />

            <EditUserModal
                isOpen={isEditUserModalOpen}
                onClose={closeEditUserModal}
                onSubmit={handleEditUser}
                user={userToEdit}
            />

            <DeleteUserSelectModal
                isOpen={isDeleteSelectOpen}
                onClose={closeDeleteUserModal}
                users={users}
                onConfirmSelection={handleConfirmSelection}
            />

            <DeleteConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDeleteUser}
                userName={userToDelete.name}
            />

            {/* Contenedor de notificaciones toast */}
            <ToastContainer />
        </main>
    );
};

export default GestionUsuariosPage;
