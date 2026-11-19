import { useEffect, useState } from 'react';
import { Copy, Download, ExternalLink, MoreVertical, Share, SquarePlus, X } from 'lucide-react';
import { canPrompt, isIOS, isStandalone, promptInstall, subscribe } from '../pwa';

/** Brauzer turini aniqlash: qaysi yo'l bilan o'rnatish mumkinligi shunga bog'liq */
function detectBrowser() {
  const ua = navigator.userAgent || '';
  const android = /Android/i.test(ua);
  const ios = isIOS();
  // Ilovalar ichidagi brauzerlar (Telegram, Instagram, Google ilovasi, Facebook va h.k.) — o'rnatib bo'lmaydi
  const inApp = /Telegram|Instagram|FBAN|FBAV|FB_IAB|GSA\/|Line\/|Snapchat|TikTok|MicroMessenger/i.test(ua)
    || (android && /; wv\)/.test(ua));
  if (inApp) return { kind: 'inapp', android, ios };
  if (ios) return { kind: /CriOS|FxiOS|EdgiOS/.test(ua) ? 'ios-other' : 'ios-safari' };
  if (android) {
    if (/SamsungBrowser/i.test(ua)) return { kind: 'samsung' };
    if (/MiuiBrowser|XiaoMi/i.test(ua)) return { kind: 'android-other', name: 'Mi Browser' };
    if (/OPR\/|Opera/i.test(ua)) return { kind: 'android-other', name: 'Opera' };
    if (/YaBrowser/i.test(ua)) return { kind: 'android-other', name: 'Yandex' };
    if (/Firefox/i.test(ua)) return { kind: 'android-other', name: 'Firefox' };
    if (/Chrome\//i.test(ua)) return { kind: 'android-chrome' };
    return { kind: 'android-other', name: 'brauzer' };
  }
  return { kind: 'desktop' };
}

function chromeIntentUrl() {
  const url = new URL(window.location.href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;end`;
}

function Steps({ browser, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { /* */ }
  };

  if (browser.kind === 'inapp') {
    return (
      <>
        <p>Siz ilova ichidagi brauzerdasiz (Telegram, Google yoki Instagram ichida). Bu yerda Admin Panelni o'rnatib bo'lmaydi.</p>
        {browser.android ? (
          <a className="btn btn-primary btn-block" href={chromeIntentUrl()}><ExternalLink size={16} /> Chrome'da ochish</a>
        ) : (
          <p><b>1.</b> Pastdagi yoki tepadagi <b>⋯</b> menyusini bosing → <b>«Safari'da ochish»</b>.</p>
        )}
        <button type="button" className="btn btn-outline btn-block" onClick={copy}><Copy size={16} /> {copied ? 'Havola nusxalandi' : 'Havolani nusxalash'}</button>
        <p className="muted small-text">Chrome (yoki iPhone'da Safari) ochilgach, yana «Ilovani o'rnatish» tugmasini bosing.</p>
      </>
    );
  }
  if (browser.kind === 'ios-safari') {
    return (
      <>
        <p><b>1.</b> Pastdagi <Share size={16} /> <b>«Ulashish»</b> tugmasini bosing.</p>
        <p><b>2.</b> <SquarePlus size={16} /> <b>«Ekranga qo'shish» (Add to Home Screen)</b> ni tanlang.</p>
        <p><b>3.</b> <b>«Qo'shish»</b> ni bosing — ekranda FS belgili ilova paydo bo'ladi.</p>
      </>
    );
  }
  if (browser.kind === 'ios-other') {
    return (
      <>
        <p>iPhone'da ilovani faqat <b>Safari</b> orqali o'rnatish mumkin.</p>
        <button type="button" className="btn btn-outline btn-block" onClick={copy}><Copy size={16} /> {copied ? 'Havola nusxalandi' : 'Havolani nusxalash'}</button>
        <p className="muted small-text">Havolani Safari'da oching va «Ulashish» → «Ekranga qo'shish» ni tanlang.</p>
      </>
    );
  }
  if (browser.kind === 'android-chrome') {
    return (
      <>
        <p><b>1.</b> Tepada o'ng burchakdagi <MoreVertical size={16} /> <b>menyuni</b> bosing.</p>
        <p><b>2.</b> <b>«Ilovani o'rnatish»</b> yoki <b>«Bosh ekranga qo'shish»</b> ni tanlang.</p>
        <p><b>3.</b> <b>«O'rnatish»</b> ni bosing.</p>
      </>
    );
  }
  if (browser.kind === 'samsung') {
    return (
      <>
        <p><b>1.</b> Pastdagi <b>☰ menyu</b> ni bosing.</p>
        <p><b>2.</b> <b>«Sahifani qo'shish» → «Bosh ekran»</b> ni tanlang.</p>
      </>
    );
  }
  if (browser.kind === 'android-other') {
    return (
      <>
        <p><b>1.</b> {browser.name} menyusini (<b>⋮</b> yoki <b>☰</b>) oching.</p>
        <p><b>2.</b> <b>«Bosh ekranga qo'shish»</b> (Add to Home screen) ni tanlang.</p>
        <p className="muted small-text">Eng yaxshi natija uchun Chrome'da oching — u yerda bir bosishda o'rnatiladi.</p>
        <a className="btn btn-outline btn-block" href={chromeIntentUrl()}><ExternalLink size={16} /> Chrome'da ochish</a>
      </>
    );
  }
  return (
    <>
      <p><b>1.</b> Manzil qatorining o'ng tomonidagi <Download size={15} /> <b>«O'rnatish»</b> belgisini bosing.</p>
      <p><b>2.</b> Ko'rinmasa: brauzer menyusi (<b>⋮</b>) → <b>«Ilovani o'rnatish»</b>.</p>
      <button type="button" className="btn btn-outline" onClick={onClose}>Tushunarli</button>
    </>
  );
}

/** "Ilovani o'rnatish": brauzer taklif qilsa — bir bosishda, aks holda — shu brauzer uchun yo'riqnoma */
export default function InstallButton({ variant = 'side' }) {
  const [, force] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  if (isStandalone()) return null;
  const browser = detectBrowser();

  const onClick = async () => {
    if (canPrompt()) {
      const ok = await promptInstall();
      if (!ok) setHelp(true);
      return;
    }
    setHelp(true);
  };

  const button = {
    compact: (
      <button type="button" className="icon-btn install-compact" onClick={onClick} aria-label="Ilovani o'rnatish"><Download size={17} /></button>
    ),
    side: (
      <button type="button" className="install-btn" onClick={onClick}><Download size={18} /> <span>Ilovani o'rnatish</span></button>
    ),
    card: (
      <button type="button" className="install-card" onClick={onClick}>
        <Download size={18} />
        <span><b>Ilova sifatida o'rnatish</b><small>Telefon ekranida FS Admin belgisi paydo bo'ladi</small></span>
      </button>
    ),
  }[variant];

  return (
    <>
      {button}
      {help && (
        <div className="modal-backdrop" onMouseDown={() => setHelp(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Ilovani o'rnatish</h3>
              <button type="button" className="icon-btn" onClick={() => setHelp(false)} aria-label="Yopish"><X size={18} /></button>
            </div>
            <div className="modal-body ios-steps">
              <Steps browser={browser} onClose={() => setHelp(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
