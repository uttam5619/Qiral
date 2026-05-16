import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // 120 seconds to allow for long LLM generation
});

// ── Request Interceptor — attach access token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor — auto-refresh on 401 ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ────────────────────────────

// Auth
export const authApi = {
  bootstrap:     (data)               => api.post('/auth/bootstrap', data),
  register:      (data)               => api.post('/auth/register', data),
  login:         (data)               => api.post('/auth/login', data),
  refresh:       (refreshToken)       => api.post('/auth/refresh', { refreshToken }),
  logout:        (refreshToken)       => api.post('/auth/logout', { refreshToken }),
  forgotPassword:(email)              => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Users
export const userApi = {
  me: () => api.get('/users/me'),
  list: (page = 1, limit = 10) => api.get(`/users?page=${page}&limit=${limit}`),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/users/me/password', { currentPassword, newPassword }),
  updateRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  delete: (userId) => api.delete(`/users/${userId}`),
};

// Databases
export const dbApi = {
  list: (page = 1, limit = 10) => api.get(`/databases?page=${page}&limit=${limit}`),
  get: (dbName) => api.get(`/databases/${dbName}`),
  register: (data) => api.post('/databases', data),
  test: (dbName) => api.post(`/databases/${dbName}/test`),
  sync: (dbName) => api.post(`/databases/${dbName}/sync`),
  delete: (dbName) => api.delete(`/databases/${dbName}`),
};

// NL Queries
export const queryApi = {
  run: (dbName, userQuery) => api.post('/query', { dbName, userQuery }),
  fix: (dbName, originalQuery, failedSQL, errorMessage) =>
    api.post('/query/fix', { dbName, originalQuery, failedSQL, errorMessage }),
};
