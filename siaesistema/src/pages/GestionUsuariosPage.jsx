import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Search } from 'lucide-react';
import UserPermissionCard from '../components/Users/UserPermissionCard.jsx';
import AddUserModal from '../components/Users/AddUserModal.jsx';
import EditUserModal from '../components/Users/EditUserModal.jsx';
import DeleteUserSelectModal from '../components/Users/DeleteUserSelectModal.jsx';
import DeleteConfirmModal from '../components/Users/DeleteConfirmModal.jsx';
import { useToast } from '../components/UI/ToastContainer.jsx';
import useUsers from '../hooks/useUsers';

const GestionUsuariosPage = () => {
    // Hook de lógica de usuarios
    const {
        users, isLoading, searchTerm, setSearchTerm, filteredUsers,
        createUser, updateUser, deleteUser, updatePermission
    } = useUsers();

    // Estados UI para Modales
    const [isDeleteSelectOpen, setIsDeleteSelectOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState({ id: null, name: '' });
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    // Estado para feedback general (ej. 'Permisos actualizados') - Aunque useUsers maneja toasts, 
    // el componente original tenía un estado local 'feedback' que se mostraba (aunque no lo veo renderizado en el código original, 
    // solo se seteaba y limpiaba con timeout, pero no se usaba en el JSX visible en el snippet anterior. 
    // Revisando el snippet anterior: lines 30-44 setFeedback, pero no veo {feedback.message} en el JSX.
    // Asumiré que se usaba para algo o era código muerto. Lo quitaré si no se usa, o lo dejaré si es crítico.
    // El snippet original usaba useToast también. useUsers usa useToast.
    // Voy a confiar en useToast del hook.

    const [isSaving, setIsSaving] = useState(false); // Estado de carga genérico para modals (UI state)

    const { ToastContainer } = useToast(); // Solo necesitamos el container, las funciones las usa el hook

    // Handlers UI -> Hook Calls

    // Agregar Usuario
    const openAddUserModal = () => setIsAddUserModalOpen(true);
    const closeAddUserModal = () => setIsAddUserModalOpen(false);

    const handleAddUser = async (newUserData) => {
        // El hook lanza error si falla, el modal lo atrapa si es necesario, o aquí.
        // El modal original atrapaba errores?
        // El código original de handleAddUser no tenía try/catch, decía "Esta función 'lanza' un error si la API falla, que el modal (AddUserModal) atrapa".
        // Así que createUser debe lanzar error. (Lo hace).
        await createUser(newUserData);
        // Si no lanza error, éxito.
        // El modal se cierra solo desde su propio 'handleSubmit' en el código original?
        // "El modal se cierra solo desde su propio 'handleSubmit'" -> comment in original.
    };

    // Editar Usuario
    const openEditUserModal = (user) => {
        setUserToEdit(user);
        setIsEditUserModalOpen(true);
    };

    const closeEditUserModal = () => {
        setIsEditUserModalOpen(false);
        setUserToEdit(null);
    };

    const handleEditUser = async (userId, updatedUserData) => {
        await updateUser(userId, updatedUserData);
    };

    // Eliminar Usuario
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

    const confirmDeleteUser = async () => {
        if (!userToDelete.id) return;

        setIsSaving(true);
        try {
            await deleteUser(userToDelete.id, userToDelete.name);
            closeDeleteConfirm();
        } catch (error) {
            // Error handled in hook (toast), but we catch here to stop loading state
        } finally {
            setIsSaving(false);
        }
    };

    const handleIndividualDelete = async (userId, userName) => {
        await deleteUser(userId, userName);
    };

    const handlePermissionChange = (userId, permissionKey, newValue) => {
        updatePermission(userId, permissionKey, newValue);
    };

    return (
        <main className="dashboard-main">
            {/* Page Header */}
            <div className="page-title-container">
                <h1 className="page-title">Gestión de Usuarios</h1>
            </div>
            
            {/* Premium Toolbar */}
            <div className="users-toolbar">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="search-input-premium"
                        placeholder="Buscar usuarios por nombre, rol o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                    <PlusCircle size={18} />
                    Agregar Usuario
                </button>
            </div>

            {isLoading ? (
                <div className="loading-message">Cargando usuarios...</div>
            ) : filteredUsers.length > 0 ? (
                <div className="users-grid-container">
                    {filteredUsers.map(user => (
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
                    <h3>{searchTerm ? 'No se encontraron resultados' : 'No hay usuarios registrados'}</h3>
                    <p>{searchTerm ? `No hay usuarios que coincidan con "${searchTerm}"` : 'Comienza agregando tu primer usuario al sistema'}</p>
                    {!searchTerm && (
                        <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                            <PlusCircle size={18} />
                            Agregar Primer Usuario
                        </button>
                    )}
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
