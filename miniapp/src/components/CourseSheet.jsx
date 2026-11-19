import { useEffect, useRef, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, MessageSquareHeart, PlayCircle, PlaySquare, ShoppingBag } from 'lucide-react';
import BottomSheet from './BottomSheet';
import Img from './Img';
import Stars from './Stars';
import { PriceBlock } from './CourseCard';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { discountPercent, money, shortDate } from '../lib/format';
import { openLink } from '../lib/telegram';

export function ReviewItem({ review, showCourse = false }) {
  return (
    <div className="review">
      <div className="review-head">
        <span className="avatar small">{review.author?.[0] || '🌸'}</span>
        <div>
          <b>{review.author}</b>
          <small>{shortDate(review.createdAt)}{showCourse && review.courseTitle ? ` · ${review.courseTitle}` : ''}</small>
        </div>
        <Stars value={review.rating} size={12} />
      </div>
      <p>{review.text}</p>
    </div>
  );
}

export default function CourseSheet() {
  const { courseId, openCourse, courseMap, cart, me, addToCart, setTab, openReview } = useStore();
  const course = courseMap.get(courseId);
  const [reviews, setReviews] = useState(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!courseId) return;
    setReviews(null);
    api.courseReviews(courseId).then(setReviews).catch(() => setReviews([]));
  }, [courseId]);

  if (!course) return null;

  const owned = me.purchased.includes(course.id);
  const pending = me.pending.includes(course.id);
  const inCart = cart.includes(course.id);
  const myCourse = me.myCourses.find((c) => c.id === course.id);
  const myReview = me.reviews.find((r) => r.courseId === course.id);
  const off = discountPercent(course.oldPrice, course.price);

  const footer = (close) => {
    if (owned) {
      return (
        <button type="button" className="btn btn-primary btn-block" disabled={!myCourse?.accessLink} onClick={() => openLink(myCourse?.accessLink)}>
          <PlayCircle size={18} /> {myCourse?.accessLink ? 'Kursni ochish' : 'Kurator havolani yuboradi'}
        </button>
      );
    }
    if (inCart) {
      return (
        <button type="button" className="btn btn-dark btn-block" onClick={() => { close(); setTimeout(() => setTab('cart'), 240); }}>
          <ShoppingBag size={18} /> Savatchaga o'tish
        </button>
      );
    }
    return (
      <button type="button" className="btn btn-primary btn-block" onClick={() => addToCart(course.id)}>
        Savatchaga qo'shish — {money(course.price)}
      </button>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      onClose={() => openCourse(null)}
      title={course.title}
      className="course-sheet"
      footer={footer}
      hero={(
        <div className="sheet-hero">
          <Img src={course.imageUrl} alt={course.title} eager />
          {course.badge && <span className="badge">{course.badge}</span>}
          {off > 0 && <span className="badge off">−{off}%</span>}
        </div>
      )}
    >
      <div className="sheet-pad">
        <span className="eyebrow">{course.category}</span>
        <h2 className="serif sheet-h2">{course.title}</h2>
        <div className="sheet-rating">
          {course.rating ? (
            <>
              <Stars value={course.rating} />
              <b>{course.rating.toFixed(1)}</b>
              <span>· {course.reviewsCount} ta izoh</span>
            </>
          ) : <span>Hali izohlar yo'q</span>}
        </div>

        <div className="info-chips">
          {course.lessonsCount > 0 && <span><PlaySquare size={15} /> {course.lessonsCount} ta dars</span>}
          {course.duration && <span><Clock3 size={15} /> {course.duration}</span>}
          {course.level && <span><BarChart3 size={15} /> {course.level}</span>}
        </div>

        {!owned && <PriceBlock course={course} large />}
        {owned && <div className="owned-note"><CheckCircle2 size={18} /> Bu kurs sizda bor</div>}
        {pending && !owned && <div className="pending-note">⏳ To'lovingiz tasdiqlanishi kutilmoqda</div>}

        {course.description && <p className="sheet-desc">{course.description}</p>}

        {course.program?.length > 0 && (
          <section className="sheet-section">
            <h4>Kurs dasturi</h4>
            <ul className="bullets">
              {course.program.map((p) => (
                <li key={p}><CheckCircle2 size={17} /> {p}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="sheet-section">
          <div className="section-row">
            <h4>O'quvchilar izohlari</h4>
            {owned && (
              <button type="button" className="link-btn" onClick={() => openReview(course.id)}>
                <MessageSquareHeart size={15} /> {myReview ? 'Tahrirlash' : 'Izoh qoldirish'}
              </button>
            )}
          </div>
          {reviews == null && <div className="skeleton-line" />}
          {reviews?.length === 0 && (
            <p className="muted small">Birinchi izohni kursni sotib olgan o'quvchilar qoldiradi.</p>
          )}
          {reviews?.map((r) => <ReviewItem key={r.id} review={r} />)}
        </section>
      </div>
    </BottomSheet>
  );
}
