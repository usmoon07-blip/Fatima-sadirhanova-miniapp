import { tg } from './telegram';

/** Server manzili: lokalda '/api' (Vite proxy), serverda — VITE_API_URL (masalan, https://xxx.onrender.com/api) */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const API_ORIGIN = API_URL.replace(/\/api$/, '');

/** Bazadagi nisbiy rasm yo'li (/uploads/...) ga server manzilini qo'shadi */
export function mediaUrl(src) {
  if (!src) return src;
  return src.startsWith('/uploads/') ? `${API_ORIGIN}${src}` : src;
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData || '',
        'ngrok-skip-browser-warning': 'true',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Internet bilan aloqa yo'q");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* bo'sh javob */
  }
  if (!res.ok) {
    if (!data && res.status >= 500) throw new Error("Server uyg'onmoqda, bir oz kuting va qayta urinib ko'ring");
    const err = new Error(data?.message || "Server bilan bog'lanib bo'lmadi");
    err.field = data?.field;
    throw err;
  }
  return data;
}

export const api = {
  config: () => request('/config'),
  catalog: () => request('/catalog'),
  me: () => request('/me'),
  updatePhone: (phone) => request('/me/phone', { method: 'PUT', body: { phone } }),
  myOrders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  courseReviews: (id) => request(`/courses/${id}/reviews`),
  reviews: () => request('/reviews'),
  addReview: (payload) => request('/reviews', { method: 'POST', body: payload }),
};
