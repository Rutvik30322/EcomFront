import axios from 'axios';
import { API_BASE_URL, REQUEST_DEBOUNCE_MS } from './config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000,
});

/* ── In-memory GET cache ─────────────────────────────────────
   Stale-while-revalidate: serve cached data instantly while
   a fresh request runs in the background.
   TTL = 30 seconds for most endpoints.
────────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 30_000;          // 30 s default
const SHORT_TTL_MS = 10_000;          // 10 s for frequently-changing endpoints
const SHORT_TTL_PATTERNS = ['/orders', '/dashboard', '/notifications'];

const responseCache = new Map();

const getCacheTtl = (url = '') => {
    if (SHORT_TTL_PATTERNS.some(p => url.includes(p))) return SHORT_TTL_MS;
    return CACHE_TTL_MS;
};

const getCacheKey = (config) =>
    `${config.method?.toUpperCase()}_${config.baseURL || ''}${config.url}_${JSON.stringify(config.params || {})}`;

/** Clear all cached entries (call after mutations) */
export const clearCache = (urlPattern = null) => {
    if (!urlPattern) { responseCache.clear(); return; }
    for (const key of responseCache.keys()) {
        if (key.includes(urlPattern)) responseCache.delete(key);
    }
};

/* ── Pending-mutation dedup map ────────────────────────────── */
const pendingRequests = new Map();

/* ── Request interceptor ────────────────────────────────────── */
apiClient.interceptors.request.use(
    (config) => {
        // Auth header
        const token = localStorage.getItem('adminToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;

        const isGet = config.method?.toUpperCase() === 'GET';
        const key = getCacheKey(config);

        if (isGet) {
            const cached = responseCache.get(key);
            if (cached) {
                const age = Date.now() - cached.ts;
                const ttl = getCacheTtl(config.url);
                if (age < ttl) {
                    // Return cached response by cancelling the real request
                    config.adapter = () => Promise.resolve({
                        data: cached.data,
                        status: 200,
                        statusText: 'OK (cached)',
                        headers: {},
                        config,
                        fromCache: true,
                    });
                }
            }
        } else {
            // Dedup non-GET mutations within 500 ms
            const last = pendingRequests.get(key);
            const now = Date.now();
            if (last && (now - last) < REQUEST_DEBOUNCE_MS) {
                return Promise.reject(new Error('Duplicate request prevented'));
            }
            pendingRequests.set(key, now);
            setTimeout(() => pendingRequests.delete(key), 1000);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* ── Response interceptor ───────────────────────────────────── */
apiClient.interceptors.response.use(
    (response) => {
        // Cache successful GET responses
        const isGet = response.config?.method?.toUpperCase() === 'GET';
        if (isGet && !response.fromCache && response.status === 200) {
            const key = getCacheKey(response.config);
            responseCache.set(key, { data: response.data, ts: Date.now() });
        }

        // Clean pending map
        if (response.config) {
            pendingRequests.delete(getCacheKey(response.config));
        }
        return response;
    },
    (error) => {
        if (error.config) {
            pendingRequests.delete(getCacheKey(error.config));
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.dispatchEvent(new CustomEvent('sessionExpired'));
            return Promise.reject({
                ...error,
                message: 'Session expired. Please login again.',
                isUnauthorized: true,
            });
        }

        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 1;
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
