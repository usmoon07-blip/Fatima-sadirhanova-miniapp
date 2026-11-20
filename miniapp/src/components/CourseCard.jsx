import { Check, Plus, PlayCircle, Star } from 'lucide-react';
import Img from './Img';
import { useStore } from '../store/StoreContext';

export function PriceBlock({ course, large = false }) {
  const { money } = useStore();
  return (
    <div className={`price ${large ? 'large' : ''}`}>
      <b>{money(course.price)}</b>
    </div>
  );
}

function CardAction({ course }) {
  const { cart, me, addToCart, openCourse, t } = useStore();
  const owned = me.purchased.includes(course.id);
  const inCart = cart.includes(course.id);

  if (owned) {
    return (
      <button type="button" className="quick-add owned" aria-label={t('openCourse')} onClick={(e) => { e.stopPropagation(); openCourse(course.id); }}>
        <PlayCircle size={18} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`quick-add ${inCart ? 'added' : ''}`}
      aria-label={inCart ? t('inCart') : t('addToCart')}
      onClick={(e) => { e.stopPropagation(); if (!inCart) addToCart(course.id); }}
    >
      {inCart ? <Check size={18} /> : <Plus size={18} />}
    </button>
  );
}

export default function CourseCard({ course, wide = false }) {
  const { openCourse, loc } = useStore();
  const title = loc(course, 'title');
  return (
    <article className={`course-card ${wide ? 'wide' : ''}`} onClick={() => openCourse(course.id)}>
      <div className="course-media">
        <Img src={course.imageUrl} alt={title} />
        {course.badge && <span className="badge">{course.badge}</span>}
      </div>
      <div className="course-body">
        <h3>{title}</h3>
        <div className="course-meta">
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
