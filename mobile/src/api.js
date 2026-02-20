/**
 * SmartAgri AI Mobile - Axios API Client
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.8:8000/api'; // Your PC's local IP
// For Android emulator use: 'http://10.0.2.2:8000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Request interceptor – attach token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('smartagri_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err.response?.status === 401) {
            await AsyncStorage.multiRemove(['smartagri_token', 'smartagri_user', 'smartagri_refresh']);
        }
        return Promise.reject(err);
    }
);

export default api;
