import { useEffect, useState } from 'react';
import { MessageSquareHeart, X } from 'lucide-react';
import Img from '../components/Img';
import Stars from '../components/Stars';
import { PageTitle } from '../components/Header';
import { ReviewItem } from '../components/CourseSheet';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';

function Lightbox({ result, onClose }) {
  const { t } = useStore();
  return (
    <div className="lightbox" onClick={onClose}>
      <button type="button" className="story-close" aria-label={t('close')}><X size={22} /></button>
      <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
        <Img src={result.imageUrl} alt={result.studentName} eager />
        <div className="lightbox-text">
          <b>{result.studentName}</b>
          {result.courseTitle && <span className="eyebrow">{result.courseTitle}</span>}
          {result.text && <p>{result.text}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const { catalog, me, openReview, setTab, t } = useStore();
  const [view, setView] = useState('works');
  const [reviews, setReviews] = useState(catalog.reviews);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.reviews().then(setReviews).catch(() => {});
  }, [catalog.reviews]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const canReview = me.myCourses.length > 0;

  return (
    <div className="page">
      <PageTitle title={t('resultsTitle')} subtitle={t('resultsSub')} />

      <div className="segmented">
        <button type="button" className={view === 'works' ? 'on' : ''} onClick={() => setView('works')}>{t('works')}</button>
        <button type="button" className={view === 'reviews' ? 'on' : ''} onClick={() => setView('reviews')}>
          {t('reviews')} {reviews.length > 0 && <small>{reviews.length}</small>}
        </button>
      </div>

      {view === 'works' && (
        catalog.results.length ? (
          <div className="masonry">
            {catalog.results.map((r) => (
              <button key={r.id} type="button" className="result-card" onClick={() => setOpen(r)}>
                <Img src={r.imageUrl} alt={r.studentName} />
                <span className="result-cap">
                  <b>{r.studentName}</b>
                  {r.courseTitle && <small>{r.courseTitle}</small>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="empty-emoji">🎂</span>
            <b>{t('soon')}</b>
            <p>{t('soonSub')}</p>
          </div>
        )
      )}

      {view === 'reviews' && (
        <>
          <div className="review-cta">
            {reviews.length > 0 && (
              <div className="avg">
                <b className="serif">{avg.toFixed(1)}</b>
                <Stars value={avg} />
                <small>{t('reviewsCount', { n: reviews.length })}</small>
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => (canReview ? openReview(me.myCourses.length === 1 ? me.myCourses[0].id : 'pick') : setTab('courses'))}
            >
              <MessageSquareHeart size={16} /> {canReview ? t('leaveReview') : t('chooseCourseBtn')}
            </button>
          </div>
          {!canReview && <p className="muted small center">{t('onlyBuyers')}</p>}
          {reviews.length ? reviews.map((r) => <ReviewItem key={r.id} review={r} showCourse />) : (
            <div className="empty">
              <span className="empty-emoji">💬</span>
              <b>{t('noReviews')}</b>
            </div>
          )}
        </>
      )}

      {open && <Lightbox result={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
