/**
 * SmartAgri AI Mobile - Auth Context
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('smartagri_user');
                const token = await AsyncStorage.getItem('smartagri_token');
                if (stored && token) setUser(JSON.parse(stored));
            } catch { }
            setLoading(false);
        })();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user: userData } = res.data;
        await AsyncStorage.setItem('smartagri_token', access_token);
        await AsyncStorage.setItem('smartagri_refresh', refresh_token);
        await AsyncStorage.setItem('smartagri_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { access_token, refresh_token, user: userData } = res.data;
        await AsyncStorage.setItem('smartagri_token', access_token);
        await AsyncStorage.setItem('smartagri_refresh', refresh_token);
        await AsyncStorage.setItem('smartagri_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['smartagri_token', 'smartagri_refresh', 'smartagri_user']);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
