import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Img from '../components/Img';
import { useStore } from '../store/StoreContext';
import { LANGS } from '../lib/i18n';
import { haptic } from '../lib/telegram';

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const SLIDES = [
  { image: img('1464349095431-e9a21285b5f3'), emoji: '🎂', key: 'ob1' },
  { image: img('1569864358642-9d1684040f43'), emoji: '🧁', key: 'ob2' },
  { image: img('1606313564200-e75d5e30476c'), emoji: '🌸', key: 'ob3' },
];

export default function Onboarding({ onDone }) {
  const { t, lang, setLang } = useStore();
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);

  const goTo = (i) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      setIndex(i);
      haptic.select();
    }
  };

  const last = index === SLIDES.length - 1;

  return (
    <div className="onboarding">
      <div className="ob-top">
        <div className="lang-switch small">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.short}</button>
          ))}
        </div>
        <button type="button" className="skip-btn" onClick={onDone}>{t('skip')}</button>
      </div>

      <div className="ob-track" ref={trackRef} onScroll={onScroll}>
        {SLIDES.map((s, i) => (
          <section key={s.key} className={`ob-slide ${i === index ? 'active' : ''}`}>
            <div className="ob-visual">
              <span className="ob-glow" />
              <div className="ob-arch"><Img src={s.image} alt="" eager emoji={s.emoji} /></div>
              <span className="ob-float">{s.emoji}</span>
            </div>
            <h1 className="serif">{t(`${s.key}Title`)}</h1>
            <p>{t(`${s.key}Text`)}</p>
          </section>
        ))}
      </div>

      <div className="ob-bottom">
        <div className="dots">
          {SLIDES.map((s, i) => (
            <button key={s.key} type="button" className={i === index ? 'on' : ''} onClick={() => goTo(i)} aria-label={t('slide', { n: i + 1 })} />
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={() => { haptic.medium(); if (last) onDone(); else goTo(index + 1); }}
        >
          {last ? t('start') : t('next')} <ArrowRight size={19} />
        </button>
      </div>
    </div>
  );
}
