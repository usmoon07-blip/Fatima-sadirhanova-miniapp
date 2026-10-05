import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Img from '../components/Img';
import { haptic } from '../lib/telegram';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80',
    emoji: '🍰',
    title: 'Shirinlikka ishtiyoq uyg\'ondimi?',
    text: "Biz qo'lda tayyorlangan premium tortlar va desertlarni yangiligicha tez yetkazamiz.",
  },
  {
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=80',
    emoji: '🧁',
    title: 'Bu qanday ishlaydi?',
    text: "Tanlang, buyurtma bering — yetkazib beramiz yoki o'zingiz olib ketasiz. Rohatlaning!",
  },
  {
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80',
    emoji: '🥐',
    title: '10 000+ mamnun mijoz',
    text: 'Toshkentdagi minglab oilalar bayramlarini biz bilan shirinroq qilishadi.',
  },
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const last = index === SLIDES.length - 1;

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
      <button type="button" className="skip" onClick={onDone}>O'tkazib yuborish</button>
      <div className="ob-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((s) => (
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
          {SLIDES.map((s, i) => <span key={s.title} className={i === index ? 'active' : ''} />)}
        </div>
        <button type="button" className={`btn btn-primary ${last ? 'btn-block btn-lg' : 'btn-round'}`} onClick={next}>
          {last ? 'Boshlash' : <ArrowRight size={22} />}
        </button>
      </div>
    </div>
  );
}
