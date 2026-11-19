import { Check, Plus, PlayCircle, Star } from 'lucide-react';
import Img from './Img';
import { useStore } from '../store/StoreContext';
import { discountPercent, lessonsLabel, money } from '../lib/format';

export function PriceBlock({ course, large = false }) {
  return (
    <div className={`price ${large ? 'large' : ''}`}>
      {course.oldPrice > course.price && <s>{money(course.oldPrice)}</s>}
      <b>{money(course.price)}</b>
    </div>
  );
}

function CardAction({ course }) {
  const { cart, me, addToCart, openCourse } = useStore();
  const owned = me.purchased.includes(course.id);
  const inCart = cart.includes(course.id);

  if (owned) {
    return (
      <button type="button" className="quick-add owned" aria-label="Kursni ochish" onClick={(e) => { e.stopPropagation(); openCourse(course.id); }}>
        <PlayCircle size={18} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`quick-add ${inCart ? 'added' : ''}`}
      aria-label={inCart ? 'Savatchada' : "Savatchaga qo'shish"}
      onClick={(e) => { e.stopPropagation(); if (!inCart) addToCart(course.id); }}
    >
      {inCart ? <Check size={18} /> : <Plus size={18} />}
    </button>
  );
}

export default function CourseCard({ course, wide = false }) {
  const { openCourse } = useStore();
  const off = discountPercent(course.oldPrice, course.price);
  return (
    <article className={`course-card ${wide ? 'wide' : ''}`} onClick={() => openCourse(course.id)}>
      <div className="course-media">
        <Img src={course.imageUrl} alt={course.title} />
        {course.badge && <span className="badge">{course.badge}</span>}
        {off > 0 && <span className="badge off">−{off}%</span>}
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        <div className="course-meta">
          {course.lessonsCount > 0 && <span>{lessonsLabel(course.lessonsCount)}</span>}
          {course.rating && (
            <span className="rating"><Star size={12} fill="currentColor" /> {course.rating.toFixed(1)}</span>
          )}
        </div>
        <div className="course-foot">
          <PriceBlock course={course} />
          <CardAction course={course} />
        </div>
      </div>
    </article>
  );
}
