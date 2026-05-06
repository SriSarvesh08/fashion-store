import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Backend base URL (without /api suffix)
const BACKEND_BASE = API_BASE.replace(/\/api$/, '');

/**
 * Resolves a product image URL:
 * - Full https:// URLs (Cloudinary) → returned as-is
 * - Relative /uploads/... paths → prefixed with backend base URL
 * - Empty/null → returns empty string (caller should use placeholder)
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_BASE}${url}`;
  return url;
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach admin token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vnz_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vnz_admin_token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Products ─────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured/list'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data) => api.post('/orders', data),
  track: (orderId, phone) => api.get(`/orders/track/${orderId}`, { params: { phone } }),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

// ─── Payments ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

// ─── Coupons ──────────────────────────────────────────────────────────────
export const couponsApi = {
  validate: (code, amount) => api.post('/coupons/validate', { code, amount }),
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// ─── Returns ──────────────────────────────────────────────────────────────
export const returnsApi = {
  submit: (data) => api.post('/returns', data),
  getAll: () => api.get('/returns'),
  update: (id, data) => api.patch(`/returns/${id}`, data),
};

// ─── Admin ────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (data) => api.post('/admin/login', data),
  verifyOtp: (data) => api.post('/admin/verify-otp', data),
  resendOtp: (data) => api.post('/admin/resend-otp', data),
  dashboard: () => api.get('/admin/dashboard'),
};

// ─── Upload ───────────────────────────────────────────────────────────────
export const uploadApi = {
  images: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;
