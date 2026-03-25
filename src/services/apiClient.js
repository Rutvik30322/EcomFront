import axios from 'axios';
import { API_BASE_URL, REQUEST_DEBOUNCE_MS } from './config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000,
});

const pendingRequests = new Map();

apiClient.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem('adminToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        const key = `${config.method.toUpperCase()}_${config.url}_${JSON.stringify(config.params || {})}`;
        const isGet = config.method.toUpperCase() === 'GET';
        const last = pendingRequests.get(key);
        const now = Date.now();

        if (!isGet && last && (now - last) < REQUEST_DEBOUNCE_MS) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Duplicate mutation request prevented (within 500ms):', key);
            }
            return Promise.reject(new Error('Duplicate request prevented'));
        }

        pendingRequests.set(key, now);
        setTimeout(() => pendingRequests.delete(key), 1000);

        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        if (response.config) {
            const key = `${response.config.method.toUpperCase()}_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
            pendingRequests.delete(key);
        }
        return response;
    },
    (error) => {
        if (error.config) {
            const key = `${error.config.method.toUpperCase()}_${error.config.url}_${JSON.stringify(error.config.params || {})}`;
            pendingRequests.delete(key);
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');

            // Dispatch a custom event to notify the application
            window.dispatchEvent(new CustomEvent('sessionExpired'));

            return Promise.reject({
                ...error,
                message: 'Session expired. Please login again.',
                isUnauthorized: true,
            });
        }

        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || error.response.headers['ratelimit-reset'] || 1;
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Rate limit exceeded. Retry after ${retryAfter}s.`);
            }
            return Promise.reject({
                ...error,
                message: `Too many requests. Please wait ${retryAfter} seconds.`,
                retryAfter: parseInt(retryAfter) || 1,
                isRateLimit: true,
            });
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('API Error:', error.response?.status, error.config?.url, error.message);
        }
        return Promise.reject(error);
    }
);

export const buildParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
    );

export default apiClient;
