// src/components/SetupWizard/SetupWizard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import './SetupWizard.css';

const SetupWizard = ({ step, onComplete, onClose, onOpenCycleModal, onOpenGroupModal }) => {
  const navigate = useNavigate();
  
  // Estados para paso 1: Crear usuario admin
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStepContent = () => {
    switch (step) {
      case 'create-admin':
        return {
          number: 1,
          total: 3,
          icon: '👤',
          title: 'Crear Usuario Administrador',
          subtitle: 'Este será el primer usuario con acceso completo al sistema',
          description: 'Ingresa los datos del administrador que gestionará el sistema.'
        };
      case 'create-cycle':
        return {
          number: 2,
          total: 3,
          icon: '📅',
          title: 'Crear Ciclo Escolar',
          subtitle: 'Define el periodo académico',
          description: 'El ciclo escolar es el periodo en el que se registrarán las asistencias (ejemplo: 2024-2025).'
        };
      case 'create-groups':
        return {
          number: 3,
          total: 3,
          icon: '🏫',
          title: 'Crear Grupos',
          subtitle: 'Organiza a tus estudiantes',
          description: 'Los grupos te permiten organizar a los estudiantes por grado, turno o especialidad.'
        };
      default:
        return null;
    }
  };

  const content = getStepContent();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.fullName || !formData.username || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // Crear primer usuario administrador
      const setupData = new FormData();
      setupData.append('full_name', formData.fullName);
      setupData.append('username', formData.username);
      setupData.append('password', formData.password);
      
      await apiClient.post('/api/auth/first-setup', setupData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Auto-login
      const loginData = new FormData();
      loginData.append('username', formData.username);
      loginData.append('password', formData.password);
      
      const loginResponse = await apiClient.post('/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { access_token } = loginResponse.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token', access_token);
      
      const userResponse = await apiClient.get('/api/auth/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      // Notificar que se completó y redirigir a gestión de estudiantes para continuar con paso 2
      onComplete();
      window.location.href = '/gestion-estudiantes';
    } catch (err) {
      console.error('Error en setup inicial:', err);
      setError(err.response?.data?.detail || 'Error al crear el usuario. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToStep = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleOpenModal = (type) => {
    if (type === 'cycle' && onOpenCycleModal) {
      onOpenCycleModal();
      if (onClose) onClose();
    } else if (type === 'group' && onOpenGroupModal) {
      onOpenGroupModal();
      if (onClose) onClose();
    }
  };

  if (!content) return null;

  return (
    <div className="setup-wizard-overlay">
      <div className="setup-wizard-modal">
        {/* Progress header */}
        <div className="setup-wizard-progress">
          <span className="setup-step-indicator">
            Paso {content.number} de {content.total}
          </span>
          <div className="setup-progress-bar">
            <div 
              className="setup-progress-fill" 
              style={{ width: `${(content.number / content.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Icon */}
        <div className="setup-wizard-icon">
          <span>{content.icon}</span>
        </div>

        {/* Content */}
        <h2 className="setup-wizard-title">{content.title}</h2>
        <p className="setup-wizard-subtitle">{content.subtitle}</p>
        <p className="setup-wizard-description">{content.description}</p>

        {/* Step-specific content */}
        {step === 'create-admin' && (
          <form onSubmit={handleCreateAdmin} className="setup-wizard-form">
            {error && (
              <div className="setup-error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="setup-form-group">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ejemplo: Juan Pérez García"
                autoComplete="name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="setup-form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ejemplo: admin"
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>

            <div className="setup-form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>

            <div className="setup-form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="setup-wizard-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Administrador y Continuar'}
            </button>

            <div className="setup-wizard-info">
              <span>💡</span>
              <p>Guarda estas credenciales en un lugar seguro</p>
            </div>
          </form>
        )}

        {step === 'create-cycle' && (
          <div className="setup-wizard-actions">
            <button 
              className="setup-wizard-btn-primary"
              onClick={() => onOpenCycleModal ? handleOpenModal('cycle') : handleNavigateToStep('/gestion-estudiantes')}
            >
              Crear Ciclo Escolar
            </button>
            <button 
              className="setup-wizard-btn-secondary"
              onClick={onClose}
            >
              Continuar más tarde
            </button>
          </div>
        )}

        {step === 'create-groups' && (
          <div className="setup-wizard-actions">
            <button 
              className="setup-wizard-btn-primary"
              onClick={() => onOpenGroupModal ? handleOpenModal('group') : handleNavigateToStep('/gestion-estudiantes')}
            >
              Crear Grupos
            </button>
            <button 
              className="setup-wizard-btn-secondary"
              onClick={onClose}
            >
              Continuar más tarde
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
