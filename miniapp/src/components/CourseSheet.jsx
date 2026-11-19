import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, MessageSquareHeart, PlaySquare, ShoppingBag } from 'lucide-react';
import BottomSheet from './BottomSheet';
import Img from './Img';
import Stars from './Stars';
import AccessButton from './AccessButton';
import { PriceBlock } from './CourseCard';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { discountPercent, shortDate } from '../lib/format';

export function ReviewItem({ review, showCourse = false }) {
  const { lang, loc } = useStore();
  const courseTitle = loc({ courseTitle: review.courseTitle, courseTitleRu: review.courseTitleRu, courseTitleEn: review.courseTitleEn }, 'courseTitle');
  return (
    <div className="review">
      <div className="review-head">
        <span className="avatar small">{review.author?.[0] || 'F'}</span>
        <div>
          <b>{review.author}</b>
          <small>{shortDate(review.createdAt, lang)}{showCourse && courseTitle ? ` · ${courseTitle}` : ''}</small>
        </div>
        <Stars value={review.rating} size={12} />
      </div>
      <p>{review.text}</p>
    </div>
  );
}

export default function CourseSheet() {
  const { courseId, openCourse, courseMap, cart, me, addToCart, setTab, openReview, t, loc, money } = useStore();
  const course = courseMap.get(courseId);
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setReviews(null);
    api.courseReviews(courseId).then(setReviews).catch(() => setReviews([]));
  }, [courseId]);

  if (!course) return null;

  const owned = me.purchased.includes(course.id);
  const pending = me.pending.includes(course.id);
  const inCart = cart.includes(course.id);
  const myReview = me.reviews.find((r) => r.courseId === course.id);
  const off = discountPercent(course.oldPrice, course.price);
  const title = loc(course, 'title');
  const program = loc(course, 'program') || [];
  const duration = loc(course, 'duration');
  const level = loc(course, 'level');

  const footer = (close) => {
    if (owned) return <AccessButton courseId={course.id} />;
    if (inCart) {
      return (
        <button type="button" className="btn btn-dark btn-block" onClick={() => { close(); setTimeout(() => setTab('cart'), 240); }}>
          <ShoppingBag size={18} /> {t('goToCart')}
        </button>
      );
    }
    return (
      <button type="button" className="btn btn-primary btn-block" onClick={() => addToCart(course.id)}>
        {t('addToCartPrice', { price: money(course.price) })}
      </button>
    );
  };

  return (
    <BottomSheet
      onClose={() => openCourse(null)}
      title={title}
      className="course-sheet"
      footer={footer}
      hero={(
        <div className="sheet-hero">
          <Img src={course.imageUrl} alt={title} eager />
          {course.badge && <span className="badge">{course.badge}</span>}
          {off > 0 && <span className="badge off">−{off}%</span>}
        </div>
      )}
    >
      <div className="sheet-pad">
        <span className="eyebrow">{loc(course, 'category')}</span>
        <h2 className="serif sheet-h2">{title}</h2>
        <div className="sheet-rating">
          {course.rating ? (
            <>
              <Stars value={course.rating} />
              <b>{course.rating.toFixed(1)}</b>
              <span>· {t('reviewsCount', { n: course.reviewsCount })}</span>
            </>
          ) : <span>{t('noReviews')}</span>}
        </div>

        <div className="info-chips">
          {course.lessonsCount > 0 && <span><PlaySquare size={15} /> {t('lessons', { n: course.lessonsCount })}</span>}
          {duration && <span><Clock3 size={15} /> {duration}</span>}
          {level && <span><BarChart3 size={15} /> {level}</span>}
        </div>

        {!owned && <PriceBlock course={course} large />}
        {owned && <div className="owned-note"><CheckCircle2 size={18} /> {t('ownedNote')}</div>}
        {pending && !owned && <div className="pending-note">{t('pendingNote')}</div>}

        {loc(course, 'description') && <p className="sheet-desc">{loc(course, 'description')}</p>}

        {program.length > 0 && (
          <section className="sheet-section">
            <h4>{t('program')}</h4>
            <ul className="bullets">
              {program.map((p) => (
                <li key={p}><CheckCircle2 size={17} /> {p}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="sheet-section">
          <div className="section-row">
            <h4>{t('studentReviews')}</h4>
            {owned && (
              <button type="button" className="link-btn" onClick={() => openReview(course.id)}>
                <MessageSquareHeart size={15} /> {myReview ? t('edit') : t('leaveReview')}
              </button>
            )}
          </div>
          {reviews == null && <div className="skeleton-line" />}
          {reviews?.length === 0 && <p className="muted small">{t('firstReview')}</p>}
          {reviews?.map((r) => <ReviewItem key={r.id} review={r} />)}
        </section>
      </div>
    </BottomSheet>
  );
}
