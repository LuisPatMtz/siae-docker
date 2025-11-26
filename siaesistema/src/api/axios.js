import axios from 'axios';

// 1. Creamos la instancia base de Axios
const apiClient = axios.create({
    baseURL: 'http://localhost:8000', // La URL de tu API de FastAPI
});

// 2. Interceptor de Petición (Request Interceptor)
// Esto se ejecuta ANTES de que cualquier petición (GET, POST, etc.) sea enviada.
apiClient.interceptors.request.use(
    (config) => {
        // Obtenemos el token guardado en localStorage
        const token = localStorage.getItem('token');

        // Si el token existe, lo añadimos a la cabecera (header)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Manejamos errores en la configuración de la petición
        return Promise.reject(error);
    }
);

// 3. Interceptor de Respuesta (Response Interceptor)
// Esto se ejecuta DESPUÉS de recibir la respuesta del servidor
apiClient.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa, simplemente la retornamos
        return response;
    },
    (error) => {
        // Verificamos si el error es por token expirado o inválido (401)
        // Y aseguramos que NO sea una petición de login (para permitir que el componente Login maneje el error)
        if (error.response && error.response.status === 401 && !error.config.url.includes('/login')) {
            // Limpiamos el localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Mostramos una notificación al usuario
            const message = error.response.data?.detail || 'Tu sesión ha expirado';

            // Creamos una notificación visual
            if (typeof window !== 'undefined') {
                // Verificamos si ya existe una notificación
                const existingNotification = document.getElementById('session-expired-notification');
                if (!existingNotification) {
                    const notification = document.createElement('div');
                    notification.id = 'session-expired-notification';
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        padding: 16px 24px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                        z-index: 10000;
                        font-family: 'Inter', sans-serif;
                        font-weight: 600;
                        animation: slideIn 0.3s ease;
                    `;
                    notification.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>${message}</span>
                        </div>
                    `;

                    // Agregamos la animación
                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes slideIn {
                            from {
                                transform: translateX(400px);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                    document.body.appendChild(notification);

                    // Removemos la notificación después de 3 segundos y redirigimos
                    setTimeout(() => {
                        notification.style.animation = 'slideIn 0.3s ease reverse';
                        setTimeout(() => {
                            notification.remove();
                            // Redirigimos al login
                            window.location.href = '/login';
                        }, 300);
                    }, 3000);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
