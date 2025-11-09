import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../api/axios'; // ¡Importamos nuestro cliente API!

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos el Proveedor (Provider) del Contexto
export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    // 'isLoading' ahora solo se usa para el PROCESO DE LOGIN
    const [isLoading, setIsLoading] = useState(false); 
    // 'isAuthLoading' es solo para la CARGA INICIAL de la app
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const fetchUserData = async () => {
        try {
            // El interceptor de axios.js ya añade el token
            const userResponse = await apiClient.get('/users/me');
            setUser(userResponse.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error al cargar datos del usuario (fetchUserData):", error.response || error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            throw error; 
        }
    }

    // 3. Función de Login (ACTUALIZADA)
    const login = async (username, password) => {
        // Usamos el isLoading del PROCESO DE LOGIN
        setIsLoading(true); 

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiClient.post('/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const { access_token } = response.data;
            if (!access_token) {
                throw new Error("La API no devolvió un access_token");
            }
            localStorage.setItem('token', access_token);
            
            await fetchUserData(); // Cargamos los datos del usuario

        } catch (error) {
            console.error("Fallo en el proceso de login:", error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            throw error; // Lanza el error para que LoginPage.jsx lo atrape
        } finally {
            setIsLoading(false); // Terminamos el loading del LOGIN
        }
    };

    // 4. Función de Logout
    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/login'; 
    };

    // 5. Verificar token al cargar la app
    useEffect(() => {
        const checkTokenOnLoad = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await fetchUserData();
                } catch (error) {
                    console.log("Token inválido al cargar, limpiando sesión.");
                }
            }
            // Terminamos la carga INICIAL
            setIsAuthLoading(false); 
        };
        
        checkTokenOnLoad();
    }, []);

    // 6. Función helper para verificar permisos
    const hasPermission = (permission) => {
        return user?.permissions?.[permission] === true;
    };

    // 7. Pasamos los valores al resto de la app
    const value = {
        isAuthenticated,
        user,
        isLoading, // El isLoading del LOGIN
        isAuthLoading, // El isLoading de la carga INICIAL
        login,
        logout,
        hasPermission, // Función para verificar permisos
    };    return (
        <AuthContext.Provider value={value}>
            {/* ESTA ES LA CORRECCIÓN: 
               Solo bloqueamos la app en la carga INICIAL,
               pero NO durante el login.
            */}
            {!isAuthLoading && children} 
        </AuthContext.Provider>
    );
}

// 7. Hook personalizado para usar el contexto fácilmente
export function useAuth() {
    return useContext(AuthContext);
}
