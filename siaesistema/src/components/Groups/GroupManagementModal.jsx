// src/components/Groups/GroupManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const GroupManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    turno: 'Matutino',
    semestre: '1'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook para manejar ESC
  useEscapeKey(isOpen, onClose);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/grupos');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
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

  // Enviar formulario
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

      await axiosInstance.post('/grupos', dataToSend);
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        turno: 'Matutino',
        semestre: '1'
      });
      setFormErrors({});
      setShowForm(false);
      
      // Recargar datos
      await fetchGroups();
      
      // Notificar éxito
      if (onSuccess) {
        onSuccess('Grupo creado exitosamente');
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      setFormErrors({ 
        submit: error.response?.data?.message || 'Error al crear el grupo' 
      });
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
    <div className="modal-overlay">
      <div className="modal-content student-management-modal">
        <div className="modal-header">
          <h2>
            <Users size={24} />
            Gestión de Grupos
          </h2>
          <button 
            onClick={handleClose} 
            className="close-button"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="student-management-content">
          {!showForm ? (
            <>
              {/* Controles superiores */}
              <div className="management-controls">
                <div className="search-and-filters">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre de grupo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-controls">
                    <select 
                      value={selectedSemestre} 
                      onChange={(e) => setSelectedSemestre(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Todos los semestres</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sem => (
                        <option key={sem} value={sem}>
                          {sem}° Semestre
                        </option>
                      ))}
                    </select>
                    
                    <select 
                      value={selectedTurno} 
                      onChange={(e) => setSelectedTurno(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Todos los turnos</option>
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowForm(true)}
                  className="add-item-btn"
                  disabled={loading}
                >
                  <Plus size={18} />
                  Agregar Grupo
                </button>
              </div>

              {/* Grid de tarjetas de grupos */}
              <div className="groups-grid-container">
                {loading ? (
                  <div className="loading-state">
                    <Users size={48} className="loading-icon" />
                    <p>Cargando grupos...</p>
                  </div>
                ) : filteredGroups.length > 0 ? (
                  <div className="groups-grid">
                    {filteredGroups.map(group => (
                      <div key={group.id} className="group-card">
                        <div className="group-card-header">
                          <div className="group-main-info">
                            <h3 className="group-title">{group.nombre}</h3>
                            <div className="group-badges">
                              <span className={`turno-badge ${group.turno?.toLowerCase()}`}>
                                {group.turno}
                              </span>
                              <span className="semestre-badge">
                                {group.semestre}° Sem
                              </span>
                            </div>
                          </div>
                          <div className="group-stats">
                            <div className="stat-item">
                              <Users size={16} />
                              <span>0 estudiantes</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group-card-actions">
                          <button 
                            className="group-action-btn edit-btn"
                            onClick={() => {/* TODO: Implementar edición */}}
                            title="Editar grupo"
                          >
                            <Edit size={16} />
                            Editar
                          </button>
                          <button 
                            className="group-action-btn delete-btn"
                            onClick={() => {/* TODO: Implementar eliminación */}}
                            title="Eliminar grupo"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Users size={64} className="empty-icon" />
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
                        className="create-first-group-btn"
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
            <div className="form-container">
              <div className="form-header">
                <h3>Agregar Nuevo Grupo</h3>
              </div>

              <form onSubmit={handleSubmit} className="group-form">
                {formErrors.submit && (
                  <div className="error-banner">
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="grupo-nombre" className="form-label">
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    id="grupo-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: 101, 201A, 305"
                    className={`form-input ${formErrors.nombre ? 'error' : ''}`}
                    disabled={isSubmitting}
                    maxLength="20"
                  />
                  {formErrors.nombre && (
                    <span className="error-message">{formErrors.nombre}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="grupo-turno" className="form-label">
                      Turno *
                    </label>
                    <select
                      id="grupo-turno"
                      name="turno"
                      value={formData.turno}
                      onChange={handleInputChange}
                      className={`form-select ${formErrors.turno ? 'error' : ''}`}
                      disabled={isSubmitting}
                    >
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                    </select>
                    {formErrors.turno && (
                      <span className="error-message">{formErrors.turno}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="grupo-semestre" className="form-label">
                      Semestre *
                    </label>
                    <select
                      id="grupo-semestre"
                      name="semestre"
                      value={formData.semestre}
                      onChange={handleInputChange}
                      className={`form-select ${formErrors.semestre ? 'error' : ''}`}
                      disabled={isSubmitting}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sem => (
                        <option key={sem} value={sem}>
                          {sem}° Semestre
                        </option>
                      ))}
                    </select>
                    {formErrors.semestre && (
                      <span className="error-message">{formErrors.semestre}</span>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="modal-btn modal-btn-secondary"
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="modal-btn modal-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Creando...'
                    ) : (
                      <>
                        <Plus size={16} />
                        Crear Grupo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;