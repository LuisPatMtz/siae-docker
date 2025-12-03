// src/components/Students/StudentManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Edit, Trash2, Save, Users, BookOpen, Calendar } from 'lucide-react';
import axiosInstance from '../../api/axios';
import Modal from '../UI/Modal';
import '../../styles/modals/SharedModalStyles.css';
import '../../styles/modals/StudentManagementModal.css';

const StudentManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');

  // Estados para selección múltiple
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    matricula: '',
    nombre: '',
    apellido: '',
    correo: '',
    id_grupo: '',
    id_ciclo: ''
  });

  // Estados para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadStudents();
      loadGroups();
      loadCycles();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/estudiantes');
      // Asegurar que siempre sea un array
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading students:', error);
      onSuccess('Error al cargar estudiantes', 'error');
      setStudents([]); // Asegurar array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/grupos');
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadCycles = async () => {
    try {
      const response = await axiosInstance.get('/api/ciclos');
      setCycles(response.data);
    } catch (error) {
      console.error('Error loading cycles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación: asegurar que grupo y ciclo tengan valores válidos
    if (!formData.id_grupo || formData.id_grupo === '') {
      onSuccess('Por favor selecciona un grupo válido', 'error');
      return;
    }
    
    if (!formData.id_ciclo || formData.id_ciclo === '') {
      onSuccess('Por favor selecciona un ciclo escolar válido', 'error');
      return;
    }

    try {
      setLoading(true);

      // Asegurar que los valores sean números enteros
      const dataToSend = {
        ...formData,
        id_grupo: parseInt(formData.id_grupo, 10),
        id_ciclo: parseInt(formData.id_ciclo, 10)
      };

      if (editingStudent) {
        // Actualizar estudiante - usar matrícula en lugar de id
        await axiosInstance.put(`/api/estudiantes/${editingStudent.matricula}`, dataToSend);
        onSuccess('Estudiante actualizado correctamente', 'success');
      } else {
        // Crear estudiante
        await axiosInstance.post('/api/estudiantes', dataToSend);
        onSuccess('Estudiante creado correctamente', 'success');
      }

      resetForm();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Error al guardar estudiante';
      onSuccess(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir modal de confirmación
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/api/estudiantes/${studentToDelete.matricula}`);
      onSuccess('Estudiante eliminado correctamente', 'success');
      loadStudents();
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      onSuccess('Error al eliminar estudiante', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para cancelar eliminación
  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      matricula: student.matricula,
      nombre: student.nombre,
      apellido: student.apellido,
      correo: student.correo || '',
      id_grupo: student.id_grupo || '',
      id_ciclo: student.id_ciclo || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      matricula: '',
      nombre: '',
      apellido: '',
      correo: '',
      id_grupo: '',
      id_ciclo: ''
    });
    setEditingStudent(null);
    setShowForm(false);
  };

  // Calcular estudiantes filtrados antes de usarlos
  const filteredStudents = Array.isArray(students) ? students.filter(student => {
    const matchesSearch = student.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricula?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || student.id_grupo == selectedGroup;

    // Filtrar por semestre del grupo
    const studentGroup = groups.find(g => g.id == student.id_grupo);
    const matchesSemester = !selectedSemestre || (studentGroup && studentGroup.semestre == selectedSemestre);

    return matchesSearch && matchesGroup && matchesSemester;
  }) : [];

  // Funciones para selección múltiple
  const handleSelectStudent = (matricula) => {
    setSelectedStudents(prev => {
      if (prev.includes(matricula)) {
        return prev.filter(m => m !== matricula);
      } else {
        return [...prev, matricula];
      }
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allMatriculas = filteredStudents.map(s => s.matricula);
      setSelectedStudents(allMatriculas);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleBulkChangeGroup = async (groupId) => {
    if (!groupId || selectedStudents.length === 0) return;

    try {
      setLoading(true);

      // Usar el endpoint de bulk-move-group
      const payload = {
        matriculas: selectedStudents,
        nuevo_id_grupo: parseInt(groupId)
      };

      const response = await axiosInstance.patch('/api/estudiantes/bulk-move-group', payload);

      onSuccess(`¡${response.data.estudiantes_afectados} estudiante(s) actualizado(s) correctamente!`, 'success');

      setSelectedStudents([]);
      loadStudents();
    } catch (error) {
      console.error('Error en cambio masivo:', error);
      const errorMsg = error.response?.data?.detail || 'Error al procesar el cambio masivo';
      onSuccess(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id == groupId);
    return group ? group.nombre : 'Sin grupo';
  };

  const getCycleName = (cycleId) => {
    const cycle = cycles.find(c => c.id == cycleId);
    return cycle ? cycle.nombre : 'Sin ciclo';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} />
          Gestión de Alumnado
        </div>
      }
      size="xl"
    >
      <div className="student-management-content">
        {!showForm ? (
          <>
            {/* Controles superiores - Todo en una línea */}
            <div className="management-controls">
              <div className="search-input-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los grupos</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.nombre}
                  </option>
                ))}
              </select>

              <select
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los semestres</option>
                {[1, 2, 3, 4, 5, 6].map(sem => (
                  <option key={sem} value={sem}>
                    {sem}° Semestre
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowForm(true)}
                className="action-btn primary"
                disabled={loading}
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>

            {/* Tabla de estudiantes */}
            <div className="students-table-wrapper">
              {/* Barra de acciones masivas flotante */}
              {selectedStudents.length > 0 && (
                <div className="bulk-actions-floating">
                  <div className="bulk-actions-content">
                    <span className="selection-count">
                      <Users size={16} />
                      {selectedStudents.length} seleccionado(s)
                    </span>
                    <select
                      className="bulk-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkChangeGroup(e.target.value);
                        }
                      }}
                      disabled={loading}
                    >
                      <option value="" disabled>Cambiar grupo...</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      className="bulk-clear-btn"
                      onClick={() => setSelectedStudents([])}
                      title="Limpiar selección"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="empty-state">
                  <p>Cargando estudiantes...</p>
                </div>
              ) : (
                <table className="students-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          ref={input => {
                            if (input) {
                              input.indeterminate = selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length;
                            }
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          title={selectedStudents.length === filteredStudents.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        />
                      </th>
                      <th>Matrícula</th>
                      <th>Nombre Completo</th>
                      <th>Correo</th>
                      <th>Grupo</th>
                      <th>Ciclo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => {
                        const isSelected = selectedStudents.includes(student.matricula);
                        return (
                          <tr key={student.id} className={isSelected ? 'selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectStudent(student.matricula)}
                              />
                            </td>
                            <td>{student.matricula}</td>
                            <td>
                              {student.nombre} {student.apellido}
                            </td>
                            <td>{student.correo || 'Sin correo'}</td>
                            <td>
                              <BookOpen size={14} />
                              {getGroupName(student.id_grupo)}
                            </td>
                            <td>
                              <Calendar size={14} />
                              {getCycleName(student.id_ciclo)}
                            </td>
                            <td className="table-actions">
                              <button
                                onClick={() => handleEdit(student)}
                                className="icon-btn edit"
                                title="Editar estudiante"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student)}
                                className="icon-btn delete"
                                title="Eliminar estudiante"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          {searchTerm || selectedGroup || selectedSemestre
                            ? 'No se encontraron estudiantes con los filtros aplicados'
                            : 'No hay estudiantes registrados'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Formulario de agregar/editar */
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-section-header">
              <h4>{editingStudent ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}</h4>
              <button type="button" onClick={resetForm} className="close-form-btn">
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <div className="modal-input-group">
                <label htmlFor="matricula">Matrícula *</label>
                <input
                  type="text"
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                  placeholder="Ej: S2001"
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Nombre del estudiante"
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="apellido">Apellido *</label>
                <input
                  type="text"
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                  placeholder="Apellido del estudiante"
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="correo">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="estudiante@ejemplo.com"
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="grupo">Grupo <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="grupo"
                  value={formData.id_grupo}
                  onChange={(e) => setFormData({ ...formData, id_grupo: e.target.value })}
                  required
                  style={{ borderColor: !formData.id_grupo ? '#ff4444' : undefined }}
                >
                  <option value="">Seleccionar grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.nombre}
                    </option>
                  ))}
                </select>
                {!formData.id_grupo && (
                  <small style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Este campo es obligatorio
                  </small>
                )}
              </div>

              <div className="modal-input-group">
                <label htmlFor="ciclo">Ciclo Escolar <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="ciclo"
                  value={formData.id_ciclo}
                  onChange={(e) => setFormData({ ...formData, id_ciclo: e.target.value })}
                  required
                  style={{ borderColor: !formData.id_ciclo ? '#ff4444' : undefined }}
                >
                  <option value="">Seleccionar ciclo</option>
                  {cycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.nombre}
                    </option>
                  ))}
                </select>
                {!formData.id_ciclo && (
                  <small style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    Este campo es obligatorio
                  </small>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={resetForm} className="modal-btn cancel">
                Cancelar
              </button>
              <button type="submit" className="modal-btn save" disabled={loading}>
                <Save size={18} />
                {editingStudent ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h2 className="modal-title">Confirmar Eliminación</h2>
              <button onClick={handleDeleteCancel} className="close-form-btn">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-icon">
                <Trash2 size={48} />
              </div>
              <h3 className="confirmation-title">¿Eliminar estudiante?</h3>
              <p className="confirmation-message">
                ¿Estás seguro de que deseas eliminar al estudiante <strong>{studentToDelete?.nombre} {studentToDelete?.apellido}</strong>?
                <br />
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={handleDeleteCancel} className="modal-btn cancel">
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} className="modal-btn delete" disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentManagementModal;