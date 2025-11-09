// src/pages/LoadingPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoadingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Este es el temporizador de 3 segundos
    const timer = setTimeout(() => {
      // Después de 3 segundos, redirige al Dashboard principal
      navigate('/', { replace: true });
    }, 3000); // 3000 milisegundos = 3 segundos

    // Limpiamos el temporizador si el componente se desmonta
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="loading-container">
      {/* La animación "shimmer" está definida en el CSS */}
      <h1 className="loading-logo shimmer-animation">SIAE</h1>
    </div>
  );
};

export default LoadingPage;