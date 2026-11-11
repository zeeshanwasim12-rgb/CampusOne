import axios from 'axios';

/**
 * Central Axios instance.
 *  - Attaches the access token to every request.
 *  - On a 401, transparently tries the refresh token once, then retries the
 *    original request. If that fails, it clears the session and notifies the
 *    app (AuthContext listens for 'auth:logout').
 *
 * Base URL: in dev, Vite proxies '/api' to the backend. In production set
 * VITE_API_URL (e.g. https://api.campusone.example.com/api).
 */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL, withCredentials: true });

// ---- token storage ----
const ACCESS = 'campusone_access';
const REFRESH = 'campusone_refresh';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry && tokenStore.refresh) {
      config._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${baseURL}/auth/refresh`, { refreshToken: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set({ accessToken: data.data.accessToken });
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

/** Extract a human-friendly message from an Axios error. */
export const errMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

/**
 * Resolve a possibly-relative file URL (e.g. "/api/files/…" from the local
 * storage driver) to something the browser can open. Presigned S3 URLs are
 * already absolute and returned as-is. In production, relative URLs are
 * prefixed with the backend origin derived from VITE_API_URL.
 */
const apiOrigin = (() => {
  try {
    return import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : '';
  } catch {
    return '';
  }
})();

export const absoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url}`;
};

export default api;
