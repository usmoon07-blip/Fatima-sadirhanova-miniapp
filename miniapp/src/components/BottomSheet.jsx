import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { X } from 'lucide-react';
import { setBackButton } from '../lib/telegram';

/**
 * Pastdan chiquvchi oyna. Pastga surib (swipe) yoki fonga bosib yopiladi.
 * ref.current.close() — animatsiya bilan yopish.
 */
const BottomSheet = forwardRef(function BottomSheet({ onClose, children, footer, hero, title, className = '' }, ref) {
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef(null);
  const scrollRef = useRef(null);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 230);
  };
  useImperativeHandle(ref, () => ({ close }));

  useEffect(() => {
    document.body.classList.add('no-scroll');
    const off = setBackButton(close);
    return () => {
      document.body.classList.remove('no-scroll');
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = (e) => {
    if ((scrollRef.current?.scrollTop || 0) > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    setDrag(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (startY.current == null) return;
    startY.current = null;
    if (drag > 110) close();
    setDrag(0);
  };

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={close}>
      <div
        className={`sheet ${className}`}
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="sheet-handle" />
        <button type="button" className="sheet-close" onClick={close} aria-label="Yopish"><X size={18} /></button>
        <div className="sheet-scroll" ref={scrollRef}>
          {hero}
          {title && !hero && <h3 className="sheet-title serif">{title}</h3>}
          {children}
        </div>
        {footer && <div className="sticky-cta">{footer(close)}</div>}
      </div>
    </div>
  );
});

export default BottomSheet;
