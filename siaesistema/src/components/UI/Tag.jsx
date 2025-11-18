// src/components/UI/Tag.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Tag/Badge reutilizable
 * @param {string} status - Tipo de tag: 'success' | 'warning' | 'danger' | 'info' | 'primary'
 * @param {ReactNode} children - Texto del tag
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} uppercase - Si debe transformar a mayúsculas
 */
const Tag = ({ status = 'primary', children, className = '', uppercase = true }) => {
    const baseClass = 'tag';
    const statusClass = `tag-${status}`;
    const uppercaseClass = uppercase ? 'tag-uppercase' : '';
    
    const tagClasses = `${baseClass} ${statusClass} ${uppercaseClass} ${className}`.trim();

    return (
        <span className={tagClasses}>
            {children}
        </span>
    );
};

Tag.propTypes = {
    status: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'primary']).isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    uppercase: PropTypes.bool
};

export default Tag;

/**
 * Helpers para determinar el status según el valor
 */
export const getStatusFromFaltas = (faltas) => {
    if (faltas >= 5) return 'danger';
    if (faltas >= 3) return 'warning';
    return 'success';
};

export const getStatusFromEstado = (estado) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('justificado')) return 'success';
    if (estadoLower.includes('injustificado')) return 'danger';
    if (estadoLower.includes('excusa')) return 'warning';
    return 'info';
};

export const getStatusFromPercentage = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
};
