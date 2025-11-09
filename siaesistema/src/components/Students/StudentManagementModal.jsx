import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search, Users, BookOpen, Calendar } from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import DeleteConfirmModal from '../Users/DeleteConfirmModal';

const StudentManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  
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

  // Cerrar modal con ESC (hook optimizado)
  useEscapeKey(isOpen, onClose);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/estudiantes');
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      onSuccess('Error al cargar estudiantes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await axiosInstance.get('/grupos');
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadCycles = async () => {
    try {
      const response = await axiosInstance.get('/ciclos');
      setCycles(response.data);
    } catch (error) {
      console.error('Error loading cycles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingStudent) {
        // Actualizar estudiante
        await axiosInstance.put(`/estudiantes/${editingStudent.id}`, formData);
        onSuccess('Estudiante actualizado correctamente', 'success');
      } else {
        // Crear estudiante
        await axiosInstance.post('/estudiantes', formData);
        onSuccess('Estudiante creado correctamente', 'success');
      }
      
      resetForm();
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar estudiante';
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
      await axiosInstance.delete(`/estudiantes/${studentToDelete.matricula}`);
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.matricula.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || student.id_grupo == selectedGroup;
    const matchesCycle = !selectedCycle || student.id_ciclo == selectedCycle;
    
    return matchesSearch && matchesGroup && matchesCycle;
  });

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
    <div className="modal-overlay">
      <div className="modal-content student-management-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <Users size={20} />
            Gestión de Alumnado
          </h2>
          <button onClick={onClose} className="close-form-btn">
            <X size={20} />
          </button>
        </div>
        {!showForm ? (
          <div className="student-management-content">
            {/* Controles superiores */}
            <div className="management-controls">
              <div className="search-and-filters">
                <div className="search-input-group">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                  
                  <div className="filter-controls">
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
                      value={selectedCycle} 
                      onChange={(e) => setSelectedCycle(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Todos los ciclos</option>
                      {cycles.map(cycle => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowForm(true)}
                  className="add-item-btn"
                  disabled={loading}
                >
                  <Plus size={18} />
                  Agregar Estudiante
                </button>
              </div>

              {/* Tabla de estudiantes */}
              <div className="management-table-container">
                {loading ? (
                  <div className="table-loading">
                    Cargando estudiantes...
                  </div>
                ) : (
                  <table className="management-table">
                    <thead>
                      <tr>
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
                        filteredStudents.map(student => (
                          <tr key={student.id}>
                            <td className="matricula-cell">{student.matricula}</td>
                            <td className="student-name">
                              {student.nombre} {student.apellido}
                            </td>
                            <td className="student-email">{student.correo || 'Sin correo'}</td>
                            <td className="student-group">
                              <span className="group-badge">
                                <BookOpen size={14} />
                                {getGroupName(student.id_grupo)}
                              </span>
                            </td>
                            <td className="student-cycle">
                              <span className="cycle-badge">
                                <Calendar size={14} />
                                {getCycleName(student.id_ciclo)}
                              </span>
                            </td>
                            <td className="table-actions">
                              <button
                                onClick={() => handleEdit(student)}
                                className="action-btn edit-btn"
                                title="Editar estudiante"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student)}
                                className="action-btn delete-btn"
                                title="Eliminar estudiante"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="table-no-data">
                            {searchTerm || selectedGroup || selectedCycle 
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
          </div>
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
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, correo: e.target.value})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="modal-input-group">
                  <label htmlFor="id_grupo">Grupo *</label>
                  <select
                    id="id_grupo"
                    value={formData.id_grupo}
                    onChange={(e) => setFormData({...formData, id_grupo: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar grupo</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-input-group">
                  <label htmlFor="id_ciclo">Ciclo Escolar *</label>
                  <select
                    id="id_ciclo"
                    value={formData.id_ciclo}
                    onChange={(e) => setFormData({...formData, id_ciclo: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar ciclo</option>
                    {cycles.map(cycle => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="modal-btn cancel"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="modal-btn save"
                  disabled={loading}
                >
                  <Plus size={18} />
                  {loading ? 'Guardando...' : (editingStudent ? 'Actualizar' : 'Crear')} Estudiante
                </button>
              </div>
          </form>
        )}

        {/* Modal de confirmación de eliminación */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          userName={studentToDelete ? `${studentToDelete.nombre} ${studentToDelete.apellido}` : ''}
          isSaving={isDeleting}
        />
      </div>
    </div>
  );
};

export default StudentManagementModal;