// src/components/UI/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Card reutilizable
 * @param {string} title - Título opcional de la card
 * @param {ReactNode} children - Contenido de la card
 * @param {string} className - Clases CSS adicionales
 * @param {Function} onClick - Handler opcional para click
 * @param {boolean} hoverable - Si debe tener efecto hover
 */
const Card = ({ title, children, className = '', onClick, hoverable = true }) => {
    const cardClasses = `card ${hoverable ? 'card-hoverable' : ''} ${className}`;

    return (
        <div className={cardClasses} onClick={onClick}>
            {title && <h3 className="card-title">{title}</h3>}
            <div className="card-body">{children}</div>
        </div>
    );
};

Card.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    hoverable: PropTypes.bool
};

export default Card;
