/* PWA o'rnatish: brauzer taklifini ushlab qolamiz va o'z tugmamiz orqali ko'rsatamiz */
let deferred = null;

/* Chrome'ga o'tkazish (Mi Browser, Opera, Telegram ichidagi brauzer va h.k. o'rnatishni bilmaydi).
   Kirish tokeni manzil bilan birga beriladi — Chrome'da qayta parol so'ralmaydi.
   Chrome ochilgach token darhol saqlanib, manzildan o'chiriladi. */
const HANDOFF = (() => {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('install') !== '1') return false;
    const token = url.searchParams.get('t');
    if (token) localStorage.setItem('admin_token', token);
    url.searchParams.delete('install');
    url.searchParams.delete('t');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return true;
  } catch { return false; }
})();
export const cameForInstall = () => HANDOFF;

export const isAndroid = () => /Android/i.test(navigator.userAgent || '');
export const isAndroidChrome = () => {
  const ua = navigator.userAgent || '';
  return isAndroid() && /Chrome\//.test(ua) && !/; wv\)|SamsungBrowser|MiuiBrowser|XiaoMi|OPR\/|Opera|YaBrowser|EdgA|Firefox|Telegram|Instagram|FBAN|FBAV|GSA\//i.test(ua);
};

/** Shu sahifani Chrome'da ochadi (o'rnatish oynasi bilan). Chrome yo'q bo'lsa — false qaytaradi. */
export function openInChrome() {
  const url = new URL(window.location.href);
  url.searchParams.set('install', '1');
  let token = null;
  try { token = localStorage.getItem('admin_token'); } catch { /* */ }
  if (token) url.searchParams.set('t', token);
  url.hash = '';
  window.location.href = `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;end`;
  return new Promise((resolve) => {
    // Chrome ochilsa sahifa yashirinadi; 2 soniyadan keyin ham ko'rinib tursa — Chrome yo'q
    setTimeout(() => resolve(document.visibilityState === 'hidden'), 2000);
  });
}
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  notify();
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  notify();
});

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function canPrompt() {
  return Boolean(deferred);
}

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
