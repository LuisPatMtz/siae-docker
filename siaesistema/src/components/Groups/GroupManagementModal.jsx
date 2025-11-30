// src/components/Groups/GroupManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, X } from 'lucide-react';
import axiosInstance from '../../api/axios';
import Modal from '../UI/Modal';
import '../../styles/modals/SharedModalStyles.css';
import '../../styles/modals/GroupManagementModal.css';

const GroupManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    turno: 'Matutino',
    semestre: '1'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      fetchStudents();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/grupos');
      console.log('Response from /api/grupos:', response.data);
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      console.error('Error response:', error.response);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get('/api/estudiantes');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setStudents([]);
    }
  };

  // Contar estudiantes por grupo
  const getStudentCount = (groupId) => {
    return students.filter(student => student.id_grupo === groupId).length;
  };

  // Filtrar grupos
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemestre = !selectedSemestre || group.semestre?.toString() === selectedSemestre;
    const matchesTurno = !selectedTurno || group.turno === selectedTurno;
    return matchesSearch && matchesSemestre && matchesTurno;
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre del grupo es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.turno) {
      errors.turno = 'Selecciona un turno';
    }

    if (!formData.semestre) {
      errors.semestre = 'Selecciona un semestre';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulario (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        turno: formData.turno,
        semestre: parseInt(formData.semestre)
      };

      if (editingGroup) {
        // Actualizar grupo existente
        await axiosInstance.put(`/api/grupos/${editingGroup.id}`, dataToSend);
      } else {
        // Crear nuevo grupo
        await axiosInstance.post('/api/grupos', dataToSend);
      }

      // Limpiar formulario
      setFormData({
        nombre: '',
        turno: 'Matutino',
        semestre: '1'
      });
      setFormErrors({});
      setShowForm(false);
      setEditingGroup(null);

      // Recargar datos
      await fetchGroups();

      // Notificar éxito
      if (onSuccess) {
        onSuccess(editingGroup ? 'Grupo actualizado exitosamente' : 'Grupo creado exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar grupo:', error);
      setFormErrors({
        submit: error.response?.data?.message || `Error al ${editingGroup ? 'actualizar' : 'crear'} el grupo`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar edición de grupo
  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      nombre: group.nombre,
      turno: group.turno,
      semestre: group.semestre.toString()
    });
    setShowForm(true);
  };

  // Manejar confirmación de eliminación
  const handleDeleteClick = (groupId) => {
    setDeletingGroupId(groupId);
    setShowDeleteConfirm(true);
  };

  // Eliminar grupo
  const handleDelete = async () => {
    if (!deletingGroupId) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/api/grupos/${deletingGroupId}`);

      // Recargar datos
      await fetchGroups();

      // Notificar éxito
      if (onSuccess) {
        onSuccess('Grupo eliminado exitosamente');
      }

      setShowDeleteConfirm(false);
      setDeletingGroupId(null);
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      if (onSuccess) {
        onSuccess(error.response?.data?.message || 'Error al eliminar el grupo', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    setSearchTerm('');
    setSelectedSemestre('');
    setSelectedTurno('');
    setShowForm(false);
    setEditingGroup(null);
    setDeletingGroupId(null);
    setShowDeleteConfirm(false);
    setFormData({
      nombre: '',
      turno: 'Matutino',
      semestre: '1'
    });
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} />
            Gestión de Grupos
          </div>
        }
        size="xl"
      >
        <div className="student-management-content">
          {!showForm ? (
            <>
              {/* Controles superiores */}
              <div className="management-controls">
                {/* Búsqueda */}
                <div className="search-input-group">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de grupo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtro por Semestre */}
                <select
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los Semestres</option>
                  {[1, 2, 3, 4, 5, 6].map(sem => (
                    <option key={sem} value={sem}>
                      Semestre {sem}
                    </option>
                  ))}
                </select>

                {/* Filtro por Turno */}
                <select
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los Turnos</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>

                {/* Botón Agregar */}
                <button
                  onClick={() => setShowForm(true)}
                  className="action-btn primary"
                  disabled={loading}
                  style={{ marginLeft: 'auto' }}
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>

              {/* Tabla de grupos */}
              <div className="students-table-wrapper">
                {loading ? (
                  <div className="empty-state">
                    <p>Cargando grupos...</p>
                  </div>
                ) : filteredGroups.length > 0 ? (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Semestre</th>
                        <th>Turno</th>
                        <th>Estudiantes</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroups.map(group => (
                        <tr key={group.id}>
                          <td>
                            <strong>{group.nombre}</strong>
                          </td>
                          <td>{group.semestre}° Semestre</td>
                          <td>
                            <span className={`status-badge ${group.turno?.toLowerCase()}`}>
                              {group.turno}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={14} />
                              <span>{getStudentCount(group.id)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="icon-btn edit"
                                onClick={() => handleEdit(group)}
                                title="Editar grupo"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="icon-btn delete"
                                onClick={() => handleDeleteClick(group.id)}
                                title="Eliminar grupo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Users size={64} style={{ color: 'var(--siae-text-tertiary)', opacity: 0.5 }} />
                    <h3>
                      {searchTerm || selectedSemestre || selectedTurno
                        ? 'No se encontraron grupos'
                        : 'No hay grupos registrados'
                      }
                    </h3>
                    <p>
                      {searchTerm || selectedSemestre || selectedTurno
                        ? 'Prueba con diferentes filtros de búsqueda'
                        : 'Crea tu primer grupo para empezar a organizar estudiantes'
                      }
                    </p>
                    {!searchTerm && !selectedSemestre && !selectedTurno && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="action-btn primary"
                        style={{ marginTop: 'var(--siae-spacing-md)' }}
                      >
                        <Plus size={18} />
                        Crear Primer Grupo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Formulario para agregar grupo */
            <div className="modal-form-container">
              <form onSubmit={handleSubmit} className="modal-form">
                {formErrors.submit && (
                  <div className="form-feedback error">
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-grid">
                  <div className="modal-input-group full-width">
                    <label htmlFor="grupo-nombre">
                      Nombre del Grupo *
                    </label>
                    <input
                      type="text"
                      id="grupo-nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: 101, 201A, 305"
                      className={formErrors.nombre ? 'error' : ''}
                      disabled={isSubmitting}
                      maxLength="20"
                    />
                    {formErrors.nombre && (
                      <span className="form-feedback error">{formErrors.nombre}</span>
                    )}
                  </div>

                  <div className="modal-input-group">
                    <label htmlFor="grupo-turno">
                      Turno *
                    </label>
                    <select
                      id="grupo-turno"
                      name="turno"
                      value={formData.turno}
                      onChange={handleInputChange}
                      className={formErrors.turno ? 'error' : ''}
                      disabled={isSubmitting}
                    >
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                    </select>
                    {formErrors.turno && (
                      <span className="form-feedback error">{formErrors.turno}</span>
                    )}
                  </div>

                  <div className="modal-input-group">
                    <label htmlFor="grupo-semestre">
                      Semestre *
                    </label>
                    <select
                      id="grupo-semestre"
                      name="semestre"
                      value={formData.semestre}
                      onChange={handleInputChange}
                      className={formErrors.semestre ? 'error' : ''}
                      disabled={isSubmitting}
                    >
                      {[1, 2, 3, 4, 5, 6].map(sem => (
                        <option key={sem} value={sem}>
                          {sem}° Semestre
                        </option>
                      ))}
                    </select>
                    {formErrors.semestre && (
                      <span className="form-feedback error">{formErrors.semestre}</span>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingGroup(null);
                      setFormData({
                        nombre: '',
                        turno: 'Matutino',
                        semestre: '1'
                      });
                      setFormErrors({});
                    }}
                    className="modal-btn cancel"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="modal-btn save"
                    disabled={isSubmitting}
                  >
                    {editingGroup ? <Edit size={18} /> : <Plus size={18} />}
                    {isSubmitting
                      ? (editingGroup ? 'Actualizando...' : 'Creando...')
                      : (editingGroup ? 'Actualizar Grupo' : 'Crear Grupo')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content confirmation-modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Trash2 size={24} />
                Confirmar Eliminación
              </h2>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingGroupId(null);
                }}
                className="close-form-btn"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-icon">
                <Trash2 size={48} />
              </div>

              <h3 className="confirmation-title">¿Eliminar grupo?</h3>

              <div className="confirmation-message">
                ¿Estás seguro de que deseas eliminar este grupo?
                <br /><br />
                <strong>Esta acción no se puede deshacer.</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingGroupId(null);
                }}
                className="modal-btn cancel"
                disabled={isSubmitting}
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="modal-btn delete"
                disabled={isSubmitting}
              >
                <Trash2 size={16} />
                {isSubmitting ? 'Eliminando...' : 'Eliminar Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupManagementModal;