export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg && tg.initData);

const BG = '#FBF4EE';

function safe(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export function initTelegram() {
  if (!tg) return;
  safe(() => tg.ready());
  safe(() => tg.expand());
  if (tg.isVersionAtLeast?.('6.1')) {
    safe(() => tg.setHeaderColor(BG));
    safe(() => tg.setBackgroundColor(BG));
  }
  if (tg.isVersionAtLeast?.('7.10')) safe(() => tg.setBottomBarColor(BG));
  if (tg.isVersionAtLeast?.('7.7')) safe(() => tg.disableVerticalSwipes());
}

export function tgUser() {
  return tg?.initDataUnsafe?.user || null;
}

export const haptic = {
  light: () => safe(() => tg?.HapticFeedback?.impactOccurred('light')),
  medium: () => safe(() => tg?.HapticFeedback?.impactOccurred('medium')),
  success: () => safe(() => tg?.HapticFeedback?.notificationOccurred('success')),
  error: () => safe(() => tg?.HapticFeedback?.notificationOccurred('error')),
  select: () => safe(() => tg?.HapticFeedback?.selectionChanged()),
};

/** Telegram'ning "Orqaga" tugmasi */
export function setBackButton(handler) {
  const bb = tg?.BackButton;
  if (!bb || !tg.isVersionAtLeast?.('6.1')) return () => {};
  if (!handler) {
    safe(() => bb.hide());
    return () => {};
  }
  safe(() => bb.show());
  safe(() => bb.onClick(handler));
  return () => safe(() => bb.offClick(handler));
}

export function closeApp() {
  if (isTelegram) safe(() => tg.close());
}

export function openLink(url) {
  if (isTelegram && tg.openLink) safe(() => tg.openLink(url));
  else window.open(url, '_blank', 'noopener');
}

/** Telegram'dan telefon raqamini so'raydi. Raqam (yoki null) qaytaradi. */
export function requestContact() {
  return new Promise((resolve) => {
    if (!isTelegram || !tg.isVersionAtLeast?.('6.9')) return resolve(null);
    safe(() => tg.requestContact((ok, event) => {
      if (!ok) return resolve(null);
      const phone = event?.responseUnsafe?.contact?.phone_number;
      resolve(phone || 'shared');
    }));
    return undefined;
  });
}

/** Foydalanuvchi joylashuvini oladi: avval Telegram LocationManager, keyin brauzer geolokatsiyasi */
export function getLocation() {
  const viaBrowser = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Qurilmangiz joylashuvni aniqlay olmaydi'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Joylashuvga ruxsat berilmadi. Manzilni qo'lda yozing.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
    return undefined;
  });

  const lm = tg?.LocationManager;
  if (!isTelegram || !lm || !tg.isVersionAtLeast?.('8.0')) return viaBrowser();

  return new Promise((resolve, reject) => {
    const fetchLoc = () => {
      if (!lm.isLocationAvailable) return viaBrowser().then(resolve, reject);
      lm.getLocation((loc) => {
        if (loc) return resolve({ latitude: loc.latitude, longitude: loc.longitude });
        if (lm.isAccessRequested && !lm.isAccessGranted) {
          return reject(new Error("Joylashuvga ruxsat berilmagan. Telegram sozlamalaridan ruxsat bering yoki manzilni yozing."));
        }
        return viaBrowser().then(resolve, reject);
      });
      return undefined;
    };
    if (lm.isInited) fetchLoc();
    else safe(() => lm.init(fetchLoc));
  });
}
