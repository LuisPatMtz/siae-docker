// src/components/Common/PageContainer.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente contenedor para páginas con animación automática
 * Aplica la clase page-enter para animar la entrada de la página
 */
const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`page-container page-enter ${className}`}>
      {children}
    </div>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default PageContainer;
