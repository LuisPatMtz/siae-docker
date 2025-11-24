import React, { useEffect } from 'react';
import '../../styles/DashboardControlsStyles.css';

const MODES = [
    { id: 'general', label: 'GENERAL' },
    { id: 'matutino', label: 'MATUTINO' },
    { id: 'vespertino', label: 'VESPERTINO' },
];

const DashboardControls = ({ activeMode, onModeChange }) => {
    // Por defecto selecciona 'general' si no hay modo activo
    useEffect(() => {
        if (!activeMode) {
            onModeChange('general');
        }
    }, [activeMode, onModeChange]);

    return (
        <div className="dashboard-controls-modes">
            {MODES.map((mode) => {
                const isActive = mode.id === (activeMode || 'general');
                const btnClass = `dashboard-controls-btn-mode${isActive ? ' active' : ''}`;
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
    );
};

export default DashboardControls;