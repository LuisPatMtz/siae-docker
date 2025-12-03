// src/components/EmptyState/EmptyState.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmptyState.css';

const EmptyState = ({ type }) => {
  const navigate = useNavigate();

  const states = {
    'no-cycle': {
      icon: '📅',
      title: '¡Bienvenido a SIAE!',
      message: 'Para comenzar, necesitas crear un ciclo escolar',
      description: 'El ciclo escolar define el periodo académico (ejemplo: 2024-2025). Es el primer paso para configurar el sistema.',
      primaryAction: {
        label: 'Crear Ciclo Escolar',
        path: '/configuracion/ciclos'
      },
      steps: [
        { number: 1, text: 'Crear ciclo escolar', active: true },
        { number: 2, text: 'Crear grupos', active: false },
        { number: 3, text: 'Agregar estudiantes', active: false }
      ]
    },
    'no-groups': {
      icon: '🏫',
      title: 'Ciclo escolar configurado',
      message: 'Ahora necesitas crear grupos',
      description: 'Los grupos son las clases o salones donde se organizan los estudiantes (ejemplo: 101, 201, etc.).',
      primaryAction: {
        label: 'Crear Grupos',
        path: '/gestion-grupos'
      },
      steps: [
        { number: 1, text: 'Crear ciclo escolar', active: true, completed: true },
        { number: 2, text: 'Crear grupos', active: true },
        { number: 3, text: 'Agregar estudiantes', active: false }
      ]
    },
    'no-students': {
      icon: '👥',
      title: 'Grupos creados exitosamente',
      message: 'Ya puedes agregar estudiantes',
      description: 'Agrega los estudiantes que pertenecen a cada grupo para comenzar a registrar asistencias.',
      primaryAction: {
        label: 'Agregar Estudiantes',
        path: '/gestion-estudiantes'
      },
      steps: [
        { number: 1, text: 'Crear ciclo escolar', active: true, completed: true },
        { number: 2, text: 'Crear grupos', active: true, completed: true },
        { number: 3, text: 'Agregar estudiantes', active: true }
      ]
    },
    'no-attendance': {
      icon: '✅',
      title: 'Sistema configurado',
      message: 'Todo listo para registrar asistencias',
      description: 'El sistema está completamente configurado. Los estudiantes pueden comenzar a registrar su asistencia.',
      primaryAction: {
        label: 'Ver Dashboard',
        path: '/dashboard'
      },
      secondaryAction: {
        label: 'Gestionar Estudiantes',
        path: '/gestion-estudiantes'
      },
      steps: [
        { number: 1, text: 'Crear ciclo escolar', active: true, completed: true },
        { number: 2, text: 'Crear grupos', active: true, completed: true },
        { number: 3, text: 'Agregar estudiantes', active: true, completed: true }
      ]
    }
  };

  const state = states[type] || states['no-cycle'];

  return (
    <div className="empty-state-container">
      <div className="empty-state-card">
        <div className="empty-state-icon">{state.icon}</div>
        
        <h1 className="empty-state-title">{state.title}</h1>
        <p className="empty-state-message">{state.message}</p>
        <p className="empty-state-description">{state.description}</p>

        {/* Progress Steps */}
        <div className="setup-progress">
          {state.steps.map((step) => (
            <div 
              key={step.number} 
              className={`progress-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <div className="step-number">
                {step.completed ? '✓' : step.number}
              </div>
              <div className="step-text">{step.text}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="empty-state-actions">
          <button 
            className="btn-primary-large"
            onClick={() => navigate(state.primaryAction.path)}
          >
            {state.primaryAction.label}
          </button>
          
          {state.secondaryAction && (
            <button 
              className="btn-secondary-large"
              onClick={() => navigate(state.secondaryAction.path)}
            >
              {state.secondaryAction.label}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="empty-state-help">
          <p>💡 <strong>Consejo:</strong> Sigue los pasos en orden para una configuración sin problemas</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
