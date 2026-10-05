import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ title, onClose, children, footer }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={close}>
      <div className="sheet small-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-handle dark" />
        <div className="sheet-head">
          <h3 className="serif">{title}</h3>
          <button type="button" className="icon-btn" onClick={close} aria-label="×"><X size={18} /></button>
        </div>
        <div className="sheet-scroll sheet-pad">{children}</div>
        {footer && <div className="sticky-cta">{footer(close)}</div>}
      </div>
    </div>
  );
}
