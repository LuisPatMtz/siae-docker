// src/hooks/usePageTitle.js
import { useLocation } from 'react-router-dom';

const usePageTitle = () => {
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard',
    '/alertas': 'Gestión de Alertas',
    '/usuarios': 'Gestión de Usuarios',
    '/estudiantes': 'Gestión de Estudiantes',
    '/registro-acceso': 'Registro de Accesos',
    '/historial-accesos': 'Historial de Accesos',
    '/grupos': 'Gestión de Grupos',
    '/ciclos': 'Ciclos Escolares',
  };

  return pageTitles[location.pathname] || 'SIAE';
};

export default usePageTitle;
