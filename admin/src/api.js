const TOKEN_KEY = 'admin_token';

export const auth = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
  },
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api/admin${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error("Server bilan bog'lanib bo'lmadi. Backend ishlayaptimi?");
  }
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (res.status === 401 && path !== '/login') {
    auth.clear();
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data?.message || "Server bilan bog'lanib bo'lmadi. Backend ishlayaptimi?");
  return data;
}

const resource = (name) => ({
  list: () => request(`/${name}`),
  create: (data) => request(`/${name}`, { method: 'POST', body: data }),
  update: (id, data) => request(`/${name}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/${name}/${id}`, { method: 'DELETE' }),
});

export const api = {
  login: (password) => request('/login', { method: 'POST', body: { password } }),
  stats: () => request('/stats'),
  orders: (status = 'ALL') => request(`/orders?${new URLSearchParams({ status })}`),
  setOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  courses: resource('courses'),
  results: resource('results'),
  stories: resource('stories'),
  reviews: () => request('/reviews'),
  setReviewVisible: (id, isVisible) => request(`/reviews/${id}`, { method: 'PATCH', body: { isVisible } }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/upload', { method: 'POST', form });
  },
};

export function money(n) {
  return `${Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

export function dateTime(value) {
  const d = new Date(value);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || '—';
}

export const STATUSES = [
  { id: 'PENDING', label: "To'lov kutilmoqda", tone: 'amber' },
  { id: 'PAID', label: "To'landi", tone: 'green' },
  { id: 'CANCELLED', label: 'Bekor qilindi', tone: 'red' },
];
export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
