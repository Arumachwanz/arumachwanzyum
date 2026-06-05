/**
 * api.js  –  Semua komunikasi ke backend ada di sini.
 * Ganti BASE_URL sesuai alamat backend kamu.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ── Token management (simpan di memory, bisa pindah ke sessionStorage) ──
let _token = null;
export const setToken  = (t) => { _token = t; };
export const clearToken = ()  => { _token = null; };
export const getToken  = ()   => _token;

// ── Generic fetch wrapper ──────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// ════════════════════════════════════════════════════
//  FOODS
// ════════════════════════════════════════════════════

/** Ambil semua hidangan + statistik rating */
export const getFoods = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/foods${qs ? `?${qs}` : ''}`);
};

/** Ambil satu hidangan + reviews-nya */
export const getFoodById = (id) => request(`/foods/${id}`);

/** Tambah hidangan (admin) */
export const createFood = (body) =>
  request('/foods', { method: 'POST', body: JSON.stringify(body) });

/** Update hidangan (admin) */
export const updateFood = (id, body) =>
  request(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) });

/** Hapus hidangan (admin) */
export const deleteFood = (id) =>
  request(`/foods/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════

/** Ambil review untuk satu hidangan */
export const getReviewsByFood = (foodId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reviews/food/${foodId}${qs ? `?${qs}` : ''}`);
};

/** Submit review baru */
export const createReview = ({ foodId, name, rating, comment }) =>
  request('/reviews', {
    method: 'POST',
    body: JSON.stringify({ foodId, name, rating, comment }),
  });

/** Hapus review (admin) */
export const deleteReview = (id) =>
  request(`/reviews/${id}`, { method: 'DELETE' });

/** Semua review - admin */
export const getAllReviews = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/reviews${qs ? `?${qs}` : ''}`);
};

// ════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════

/** Login admin → simpan token */
export const adminLogin = async (password) => {
  const data = await request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (data.token) setToken(data.token);
  return data;
};

/** Verifikasi token masih valid */
export const verifyAdmin = () => request('/admin/verify');

/** Statistik dashboard */
export const getAdminStats = () => request('/admin/stats');
