import { useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import Stars from './Stars';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';


export default function ReviewSheet() {
  const { reviewCourseId, openReview, me, courseMap, refreshMe, refreshCatalog, toast, t, loc } = useStore();
  const existing = me.reviews.find((r) => r.courseId === reviewCourseId);
  const [courseId, setCourseId] = useState(reviewCourseId);
  const [rating, setRating] = useState(existing?.rating || 5);
  const [text, setText] = useState(existing?.text || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sheetRef = useRef(null);

  // reviewCourseId === 'pick' bo'lsa — o'quvchi kursni o'zi tanlaydi
  const picking = reviewCourseId === 'pick';
  const selectedId = picking ? courseId : reviewCourseId;
  const course = courseMap.get(selectedId) || me.myCourses.find((c) => c.id === selectedId);

  const submit = async () => {
    if (!selectedId || selectedId === 'pick') return setError(t('chooseCourse'));
    if (text.trim().length < 3) return setError(t('writeOpinion'));
    setSending(true);
    setError('');
    try {
      await api.addReview({ courseId: selectedId, rating, text: text.trim() });
      haptic.success();
      await Promise.all([refreshMe(), refreshCatalog()]);
      toast(t('reviewThanks'));
      sheetRef.current?.close();
    } catch (err) {
      haptic.error();
      setError(err.message);
    } finally {
      setSending(false);
    }
    return undefined;
  };

  return (
    <BottomSheet
      ref={sheetRef}
      onClose={() => openReview(null)}
      title={t('reviewTitle')}
      footer={() => (
        <button type="button" className="btn btn-primary btn-block" disabled={sending} onClick={submit}>
          {sending ? t('sending') : t('sendReview')}
        </button>
      )}
    >
      <div className="sheet-pad">
        {picking ? (
          <div className="field">
            <label htmlFor="rv-course">{t('whichCourse')}</label>
            <select id="rv-course" value={courseId === 'pick' ? '' : courseId || ''} onChange={(e) => setCourseId(Number(e.target.value))}>
              <option value="" disabled>{t('chooseCourse')}</option>
              {me.myCourses.map((c) => <option key={c.id} value={c.id}>{loc(c, 'title')}</option>)}
            </select>
          </div>
        ) : (
          <p className="muted">{loc(course, 'title')}</p>
        )}

        <div className="rate-box">
          <Stars value={rating} size={34} onChange={(n) => { haptic.select(); setRating(n); }} />
          <span>{t(`rate${rating}`)}</span>
        </div>

        <div className="field">
          <label htmlFor="rv-text">{t('yourOpinion')}</label>
          <textarea
            id="rv-text"
            rows={5}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('opinionPh')}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>
    </BottomSheet>
  );
}
