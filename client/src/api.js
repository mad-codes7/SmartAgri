/**
 * SmartAgri AI - Axios API Client
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('smartagri_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('smartagri_token');
            localStorage.removeItem('smartagri_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
