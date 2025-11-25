import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const fetchUserData = async () => {
        try {
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

    const login = async (username, password) => {
        setIsLoading(true);

        try {
            console.log('[AuthContext] Starting login for:', username);
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            console.log('[AuthContext] Sending login request to /login');
            const response = await apiClient.post('/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            console.log('[AuthContext] Login response:', response.status);
            const { access_token } = response.data;
            if (!access_token) {
                throw new Error("La API no devolvió un access_token");
            }

            console.log('[AuthContext] Token received, saving to localStorage');
            localStorage.setItem('token', access_token);

            console.log('[AuthContext] Fetching user data from /users/me');
            await fetchUserData();

            console.log('[AuthContext] Login completed successfully');

        } catch (error) {
            console.error("[AuthContext] Login failed:", error);
            console.error("[AuthContext] Error response:", error.response);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        const checkTokenOnLoad = async () => {
            console.log('[AuthContext] Checking token on load...');
            const token = localStorage.getItem('token');

            if (token) {
                console.log('[AuthContext] Token found in localStorage');
                try {
                    await fetchUserData();
                    console.log('[AuthContext] Token valid, user authenticated');
                } catch (error) {
                    console.error('[AuthContext] Token invalid or expired:', error);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } else {
                console.log('[AuthContext] No token found in localStorage');
            }

            setIsAuthLoading(false);
            console.log('[AuthContext] Initial auth check complete');
        };

        checkTokenOnLoad();
    }, []);

    const hasPermission = (permission) => {
        return user?.permissions?.[permission] === true;
    };

    const value = {
        isAuthenticated,
        user,
        isLoading,
        isAuthLoading,
        login,
        logout,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isAuthLoading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
