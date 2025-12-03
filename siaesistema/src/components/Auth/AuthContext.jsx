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
            const userResponse = await apiClient.get('/api/auth/users/me');
            setUser(userResponse.data);
            setIsAuthenticated(true);
        } catch (error) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        }
    }

    const login = async (username, password) => {
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiClient.post('/api/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const { access_token } = response.data;
            if (!access_token) {
                throw new Error("La API no devolvió un access_token");
            }

            localStorage.setItem('token', access_token);

            await fetchUserData();

        } catch (error) {
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
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    await fetchUserData();
                } catch (error) {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
            setIsAuthLoading(false);
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
