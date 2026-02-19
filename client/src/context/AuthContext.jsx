/**
 * SmartAgri AI - Auth Context
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('smartagri_user');
        const token = localStorage.getItem('smartagri_token');
        if (stored && token) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user: userData } = res.data;
        localStorage.setItem('smartagri_token', access_token);
        localStorage.setItem('smartagri_refresh', refresh_token);
        localStorage.setItem('smartagri_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { access_token, refresh_token, user: userData } = res.data;
        localStorage.setItem('smartagri_token', access_token);
        localStorage.setItem('smartagri_refresh', refresh_token);
        localStorage.setItem('smartagri_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('smartagri_token');
        localStorage.removeItem('smartagri_refresh');
        localStorage.removeItem('smartagri_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
