/**
 * SmartAgri AI Mobile - Axios API Client
 * Auto-detects the server IP from Expo's dev server connection.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ── Production vs Local server toggle ─────────────────────
// Set USE_LOCAL = true to test against your local PC server.
// Set USE_LOCAL = false to use the deployed Render server.
const USE_LOCAL = false;

const PRODUCTION_URL = 'https://smartagri-api.onrender.com/api';

// Auto-detect local PC IP from Expo QR code connection
const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
const hostIP = debuggerHost.split(':')[0];
const LOCAL_URL = hostIP
    ? `http://${hostIP}:8000/api`
    : 'http://localhost:8000/api';

export const API_URL = USE_LOCAL ? LOCAL_URL : PRODUCTION_URL;

console.log(`[API] Connecting to: ${API_URL}`);

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// ── Logout callback (set by AuthContext) ──────────────────
let _onAuthFailure = null;
export function setOnAuthFailure(callback) {
    _onAuthFailure = callback;
}

// Request interceptor – attach token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('smartagri_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor – handle 401 → auto-logout
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        if (err.response?.status === 401) {
            await AsyncStorage.multiRemove(['smartagri_token', 'smartagri_user', 'smartagri_refresh']);
            if (_onAuthFailure) _onAuthFailure();
        }
        return Promise.reject(err);
    }
);

export default api;
