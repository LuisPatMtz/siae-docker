import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// --- CAMBIO 1: Importamos 'isLoading' desde el contexto ---
import { useAuth } from '../components/Auth/AuthContext'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- CAMBIO 2: Obtenemos 'login' Y 'isLoading' globales ---
  const { login, isLoading } = useAuth();

  // --- CAMBIO 3: Ya no necesitamos el 'isLoading' local ---
  // const [isLoading, setIsLoading] = useState(false); // <--- ELIMINADO

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // --- CAMBIO 4: Ya no usamos setIsLoading(true) local ---
    // setIsLoading(true); // <--- ELIMINADO (AuthContext lo hará)

    try {
      await login(username, password);
      
      // Si 'await login()' NO da error, el inicio de sesión fue exitoso
      // (AuthContext ya habrá puesto isLoading=false)
      navigate('/loading'); // O '/dashboard'
    
    } catch (err) {
      // Si 'login()' da error, AuthContext ya puso isLoading=false
      // y aquí SÍ podremos establecer el error.
      setError('Credenciales incorrectas. Intenta de nuevo.');
      console.error("Error de API (detectado por LoginPage):", err); 
    } 
    // --- CAMBIO 5: Ya no usamos setIsLoading(false) local ---
    // finally { 
    //   setIsLoading(false); // <--- ELIMINADO
    // }
  };

  // --- El JSX ahora usa el 'isLoading' GLOBAL ---
  return (
    <div className="login-container">
      <div className="login-card">
        <span className="login-logo">SIAE</span>
        <h1 className="login-title">Ingreso Al Panel General Del Sistema</h1>
        <p className="login-subtitle">Sistema Inteligente de Asistencia Estudiantil</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          
          <div className="input-group">
            <label htmlFor="username">Usuario</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            // ¡Ahora usamos el 'isLoading' del contexto!
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;