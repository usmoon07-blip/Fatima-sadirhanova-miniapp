export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg && tg.initData);

const BG = '#FFF8F4';
const TOP = '#A9686F'; // yuqori panel rangi (to'liq ekranda Telegram tugmalari shu fonda turadi)

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
  // Ilova har doim butun ekranni egallaydi (yarim oynada ochilsa ham darhol kengayadi)
  const expand = () => safe(() => { if (!tg.isExpanded) tg.expand(); });
  expand();
  setTimeout(expand, 150);
  setTimeout(expand, 600);
  safe(() => tg.onEvent('viewportChanged', (e) => { if (e?.isStateStable) expand(); }));
  safe(() => tg.onEvent('activated', expand));
  if (tg.isVersionAtLeast?.('6.1')) {
    safe(() => tg.setHeaderColor(TOP));
    safe(() => tg.setBackgroundColor(BG));
  }
  // To'liq ekran (Kremm Bakery'dagidek): telefonda ilova soat qatorigacha egallaydi,
  // Telegram faqat «Yopish» va «⋮» tugmalarini yuqori panel ustida ko'rsatadi
  const mobile = ['android', 'ios'].includes(tg.platform);
  if (mobile && tg.isVersionAtLeast?.('8.0') && !tg.isFullscreen) safe(() => tg.requestFullscreen());
  if (tg.isVersionAtLeast?.('7.10')) safe(() => tg.setBottomBarColor('#FFFFFF'));
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
  if (!url) return;
  if (isTelegram && /^https:\/\/t\.me\//.test(url) && tg.openTelegramLink) safe(() => tg.openTelegramLink(url));
  else if (isTelegram && tg.openLink) safe(() => tg.openLink(url));
  else window.open(url, '_blank', 'noopener');
}

/** Telegram'dan telefon raqamini so'raydi. Raqam (yoki null) qaytaradi. */
export function requestContact() {
  return new Promise((resolve) => {
    if (!isTelegram || !tg.isVersionAtLeast?.('6.9')) return resolve(null);
    safe(() => tg.requestContact((ok, event) => {
      if (!ok) return resolve(null);
      const phone = event?.responseUnsafe?.contact?.phone_number;
      resolve(phone ? (phone.startsWith('+') ? phone : `+${phone}`) : 'shared');
    }));
    return undefined;
  });
}
