const TOKEN_KEY = 'admin_token';
const ROLE_KEY = 'admin_role';

export const auth = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  get role() {
    try { return localStorage.getItem(ROLE_KEY) || 'admin'; } catch { return 'admin'; }
  },
  set(token, role) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ROLE_KEY, role);
    } catch { /* */ }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
    } catch { /* */ }
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
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
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
  report: (period) => request(`/report?period=${period}`),
  kitchen: () => request('/kitchen'),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  orders: (params = {}) => request(`/orders?${new URLSearchParams(params)}`),
  setOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  products: resource('products'),
  categories: resource('categories'),
  stories: resource('stories'),
  courses: resource('courses'),
  enrollments: (status) => request(`/enrollments?${new URLSearchParams({ status: status || 'ALL' })}`),
  setEnrollmentStatus: (id, status) => request(`/enrollments/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteEnrollment: (id) => request(`/enrollments/${id}`, { method: 'DELETE' }),
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

export const STATUSES = [
  { id: 'NEW', label: 'Yangi', tone: 'blue' },
  { id: 'CONFIRMED', label: 'Tasdiqlandi', tone: 'indigo' },
  { id: 'PREPARING', label: 'Tayyorlanmoqda', tone: 'amber' },
  { id: 'READY', label: 'Tayyor', tone: 'teal' },
  { id: 'ON_THE_WAY', label: 'Kuryerga berildi', tone: 'violet' },
  { id: 'DELIVERED', label: 'Yetkazildi', tone: 'green' },
  { id: 'CANCELLED', label: 'Bekor qilindi', tone: 'red' },
];
export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
