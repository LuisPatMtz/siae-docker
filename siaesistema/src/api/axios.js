import axios from 'axios';

// 1. Creamos la instancia base de Axios
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000', // La URL de tu API de FastAPI
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

export default apiClient;
