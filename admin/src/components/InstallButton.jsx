import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { canPrompt, isIOS, isStandalone, promptInstall, subscribe } from '../pwa';

/** "Ilovani o'rnatish" tugmasi: Android/Chrome — bir bosishda, iPhone — yo'riqnoma */
export default function InstallButton({ compact = false }) {
  const [, force] = useState(0);
  const [iosHelp, setIosHelp] = useState(false);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  if (isStandalone()) return null;
  const ios = isIOS();
  if (!canPrompt() && !ios) return null;

  const onClick = () => (ios ? setIosHelp(true) : promptInstall());

  return (
    <>
      <button type="button" className={compact ? 'icon-btn install-compact' : 'install-btn'} onClick={onClick} aria-label="Ilovani o'rnatish">
        <Download size={compact ? 17 : 18} /> {!compact && <span>Ilovani o'rnatish</span>}
      </button>
      {iosHelp && (
        <div className="modal-backdrop" onMouseDown={() => setIosHelp(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>iPhone'ga o'rnatish</h3>
              <button type="button" className="icon-btn" onClick={() => setIosHelp(false)} aria-label="Yopish"><X size={18} /></button>
            </div>
            <div className="modal-body ios-steps">
              <p><b>1.</b> Safari'da pastdagi <Share size={16} /> <b>«Ulashish»</b> tugmasini bosing.</p>
              <p><b>2.</b> <SquarePlus size={16} /> <b>«Ekranga qo'shish» (Add to Home Screen)</b> ni tanlang.</p>
              <p><b>3.</b> <b>«Qo'shish»</b> ni bosing — ekranda FS belgili ilova paydo bo'ladi.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
