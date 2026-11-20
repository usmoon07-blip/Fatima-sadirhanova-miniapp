import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import InstallButton from './InstallButton';
import { canPrompt, cameForInstall, isAndroid, isAndroidChrome, isStandalone, openInChrome, promptInstall, subscribe } from '../pwa';

/** Paroldan keyin bir marta so'raydi: "O'rnatamizmi?" — Ha bosilsa, darhol o'rnatiladi */
export default function InstallPrompt({ onDone }) {
  const [, force] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  useEffect(() => { const id = setTimeout(() => setTimedOut(true), 6000); return () => clearTimeout(id); }, []);

  if (isStandalone()) return null;

  // Chrome'ga o'rnatish uchun kelgan bo'lsak — brauzer tayyor bo'lguncha bir lahza kutamiz
  const waiting = cameForInstall() && isAndroidChrome() && !canPrompt() && !timedOut;

  const yes = async () => {
    if (canPrompt()) {
      await promptInstall();
      onDone();
      return;
    }
    // Android'dagi boshqa brauzerlar (Mi Browser, Opera, Telegram ichida...) o'rnata olmaydi —
    // bir bosishda Chrome'ga o'tamiz, u yerda shu oyna yana chiqadi va bir bosishda o'rnatiladi
    if (isAndroid() && !isAndroidChrome()) {
      if (await openInChrome()) { onDone(); return; }
    }
    setShowHelp(true);
  };

  if (showHelp) {
    return (
      <div className="install-help-auto">
        <InstallButton variant="auto" onClose={onDone} />
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onMouseDown={onDone}>
      <div className="modal install-ask" onMouseDown={(e) => e.stopPropagation()}>
        <div className="install-ask-body">
          <span className="install-ask-icon"><img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" /></span>
          <h3>Admin Panelni telefoningizga o'rnatamizmi?</h3>
          <p className="muted">Ekraningizda <b>FS Admin</b> belgisi paydo bo'ladi — keyingi safar bir bosishda ochiladi.</p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onDone}>Keyinroq</button>
          <button type="button" className="btn btn-primary" onClick={yes} disabled={waiting}><Download size={16} /> {waiting ? 'Tayyorlanmoqda...' : "Ha, o'rnatish"}</button>
        </div>
      </div>
    </div>
  );
}
