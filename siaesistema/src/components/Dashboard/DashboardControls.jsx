// src/components/Dashboard/DashboardControls.jsx
import React from 'react';
// 1. Importa el icono History y quita ChevronDown si ya no lo usas
import { Calendar, History } from 'lucide-react';

// Opciones de los botones de turno
const MODES = [
    { id: 'general', label: 'GENERAL' },
    { id: 'matutino', label: 'MATUTINO' },
    { id: 'vespertino', label: 'VESPERTINO' },
];

// 2. Acepta el nuevo prop 'onOpenHistory'
const DashboardControls = ({ activeMode, onModeChange, onOpenHistory }) => {

    return (
        <div className="controls-container">

            {/* Selectores de Modo */}
            <div className="mode-selectors">
                {MODES.map((mode) => {
                    const isActive = mode.id === activeMode;
                    const btnClass = `btn-mode ${isActive ? 'active' : ''}`;

                    return (
                        <button
                            key={mode.id}
                            className={btnClass}
                            onClick={() => onModeChange(mode.id)}
                        >
                            {mode.label}
                        </button>
                    );
                })}
            </div>

            {/* 3. Botón condicional: Historial o Filtro */}
            {/* Si 'onOpenHistory' existe (estamos en AlertasPage), muestra el botón de Historial */}
            {onOpenHistory ? (
                <button className="btn-filter btn-history" onClick={onOpenHistory}>
                    <History size={20} /> {/* Nuevo icono */}
                    <span>Historial de Justificaciones</span> {/* Nuevo texto */}
                </button>
            ) : (
                /* Si 'onOpenHistory' NO existe (estamos en DashboardPage), muestra el botón de Filtro original */
                /* Nota: Este botón de filtro aún no tiene funcionalidad de dropdown implementada */
                <button className="btn-filter">
                    <Calendar size={20} />
                    <span>Filtrar por Fecha</span>
                    {/* <ChevronDown size={20} /> Quitamos esto si el botón ya no es dropdown */}
                </button>
            )}
        </div>
    );
};

export default DashboardControls;