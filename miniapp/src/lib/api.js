import { tg } from './telegram';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': tg?.initData || '',
      'ngrok-skip-browser-warning': 'true',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* bo'sh javob */
  }
  if (!res.ok) {
    const err = new Error(data?.message || "Server bilan bog'lanib bo'lmadi");
    err.field = data?.field;
    err.reason = data?.reason;
    err.minOrder = data?.minOrder;
    throw err;
  }
  return data;
}

export const api = {
  config: () => request('/config'),
  catalog: () => request('/catalog'),
  me: () => request('/me'),
  updatePhone: (phone) => request('/me/phone', { method: 'PUT', body: { phone } }),
  updateLanguage: (language) => request('/me/language', { method: 'PUT', body: { language } }),
  saveAddress: (data) => request('/me/address', { method: 'PUT', body: data }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  enroll: (courseId, data) => request(`/courses/${courseId}/enroll`, { method: 'POST', body: data }),
  myEnrollments: () => request('/enrollments'),
  cancelEnrollment: (id) => request(`/enrollments/${id}/cancel`, { method: 'POST' }),
  myOrders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
};
