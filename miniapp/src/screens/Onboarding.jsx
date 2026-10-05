import { useRef, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Img from '../components/Img';
import { Logo } from '../components/Header';
import { haptic } from '../lib/telegram';
import { LANGS } from '../lib/i18n';
import { useStore } from '../store/StoreContext';

const IMAGES = [
  { image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80', emoji: '🍰' },
  { image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80', emoji: '🧁' },
  { image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80', emoji: '🥐' },
];

export function LanguagePicker() {
  const { setLang, config } = useStore();
  return (
    <div className="lang-screen">
      <div className="lang-brand">
        <Logo size={56} />
        <div className="brand-name big">{config?.shop.name || ''}</div>
        <div className="brand-tag">{config?.shop.tagline || ''}</div>
      </div>
      <div className="lang-box">
        <h2 className="serif">Tilni tanlang</h2>
        <p className="muted">Выберите язык · Choose a language</p>
        <div className="lang-list">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className="lang-item" onClick={() => setLang(l.id)}>
              <span className="flag">{l.flag}</span>
              <span>{l.label}</span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding({ onDone }) {
  const { t } = useStore();
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const slides = t.slides.map((s, i) => ({ ...s, ...IMAGES[i] }));
  const last = index === slides.length - 1;

  const next = () => {
    haptic.light();
    if (last) onDone();
    else setIndex(index + 1);
  };

  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -40 && !last) setIndex(index + 1);
    if (dx > 40 && index > 0) setIndex(index - 1);
    touchX.current = null;
  };

  return (
    <div className="onboarding" onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
      <button type="button" className="skip" onClick={onDone}>{t.skip}</button>
      <div className="ob-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s) => (
          <div className="ob-slide" key={s.title}>
            <div className="ob-image">
              <Img src={s.image} alt="" emoji={s.emoji} eager />
            </div>
            <h1 className="serif">{s.title}</h1>
            <p className="muted">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="ob-footer">
        <div className="dots">
          {slides.map((s, i) => <span key={s.title} className={i === index ? 'active' : ''} />)}
        </div>
        <button type="button" className={`btn btn-primary ${last ? 'btn-block btn-lg' : 'btn-round'}`} onClick={next}>
          {last ? t.start : <ArrowRight size={22} />}
        </button>
      </div>
    </div>
  );
}
