import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Img from '../components/Img';
import { haptic } from '../lib/telegram';

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const SLIDES = [
  {
    image: img('1464349095431-e9a21285b5f3'),
    emoji: '🎂',
    title: "Shirinlik pishirishni o'rganmoqchimisiz?",
    text: 'Fatima Sadirkhanova bilan uyda turib professional qandolatchi bo\'ling.',
  },
  {
    image: img('1569864358642-9d1684040f43'),
    emoji: '🧁',
    title: 'Bu qanday ishlaydi?',
    text: "Kursni tanlang, buyurtma bering va darslarni istalgan vaqtda ko'ring.",
  },
  {
    image: img('1606313564200-e75d5e30476c'),
    emoji: '🌸',
    title: '10 000+ o\'quvchi allaqachon biz bilan',
    text: "Ular o'z tortlarini sotib, yaqinlarini xursand qilmoqda. Navbat sizda!",
  },
];

export default function Onboarding({ onDone }) {
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
      <button type="button" className="skip-btn" onClick={onDone}>O'tkazib yuborish</button>

      <div className="ob-track" ref={trackRef} onScroll={onScroll}>
        {SLIDES.map((s, i) => (
          <section key={s.title} className={`ob-slide ${i === index ? 'active' : ''}`}>
            <div className="ob-visual">
              <span className="ob-glow" />
              <div className="ob-arch"><Img src={s.image} alt="" eager emoji={s.emoji} /></div>
              <span className="ob-float">{s.emoji}</span>
            </div>
            <h1 className="serif">{s.title}</h1>
            <p>{s.text}</p>
          </section>
        ))}
      </div>

      <div className="ob-bottom">
        <div className="dots">
          {SLIDES.map((s, i) => (
            <button key={s.title} type="button" className={i === index ? 'on' : ''} onClick={() => goTo(i)} aria-label={`${i + 1}-slayd`} />
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={() => { haptic.medium(); if (last) onDone(); else goTo(index + 1); }}
        >
          {last ? 'Boshlash' : 'Keyingi'} <ArrowRight size={19} />
        </button>
      </div>
    </div>
  );
}
