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

/** Rasmni yuklashdan oldin kichraytiradi (telefon suratlari 5–10 MB bo'ladi) */
async function compressImage(file, maxSide = 1600, quality = 0.85) {
  try {
    if (!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type) && file.type) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
    return blob && blob.size < file.size ? new File([blob], 'chek.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

async function upload(path, file) {
  const form = new FormData();
  form.append('file', await compressImage(file));
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'X-Telegram-Init-Data': tg?.initData || '', 'ngrok-skip-browser-warning': 'true' },
      body: form,
    });
  } catch {
    throw new Error("Internet bilan aloqa yo'q");
  }
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (!res.ok) throw new Error(data?.message || "Chekni yuborib bo'lmadi");
  return data;
}

export const api = {
  uploadReceipt: (orderId, file) => upload(`/orders/${orderId}/receipt`, file),
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
