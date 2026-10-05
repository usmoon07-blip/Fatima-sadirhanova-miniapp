import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Img from '../components/Img';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { dateTime } from '../lib/format';
import { loc } from '../lib/i18n';
import { haptic, tg } from '../lib/telegram';

const TONE = { NEW: 'warn', CONFIRMED: 'info', PAID: 'ok', COMPLETED: 'ok', CANCELLED: 'bad' };

function confirmDialog(text) {
  return new Promise((resolve) => {
    if (tg?.showConfirm && tg.isVersionAtLeast?.('6.2')) {
      try {
        tg.showConfirm(text, resolve);
        return;
      } catch { /* */ }
    }
    resolve(window.confirm(text));
  });
}

export default function MyCourses() {
  const {
    setScreen, t, lang, money, showToast, goTo,
  } = useStore();
  const [list, setList] = useState(null);

  const load = useCallback(() => {
    api.myEnrollments().then((r) => setList(r.enrollments)).catch(() => setList([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (e) => {
    if (!(await confirmDialog(t.cancelApplication))) return;
    try {
      await api.cancelEnrollment(e.id);
      haptic.success();
      showToast(t.applicationCancelled);
    } catch (err) {
      showToast(err.message, 'bad');
    }
    load();
  };

  return (
    <div className="page no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="←" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <h1 className="serif">{t.myCourses}</h1>
        <span style={{ width: 40 }} />
      </div>

      {!list && <div className="skeleton-list"><div /><div /></div>}
      {list && !list.length && (
        <div className="empty">
          <div className="empty-emoji">🎓</div>
          <p className="muted">{t.noCourses}</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('courses')}>{t.coursesTitle}</button>
        </div>
      )}
      <div className="orders">
        {list?.map((e) => (
          <article key={e.id} className="order card">
            <div className="enroll-row">
              {e.course?.imageUrl && <Img src={e.course.imageUrl} alt="" className="enroll-thumb" emoji="🎓" />}
              <div className="grow">
                <b>{e.course ? loc(e.course, 'title', lang) : e.courseTitle}</b>
                <div className="muted small">{e.format === 'ONLINE' ? t.online : t.offline} · {dateTime(e.createdAt)}</div>
              </div>
              <span className={`status ${TONE[e.status]}`}>{t.enrollStatus[e.status]}</span>
            </div>
            <div className="order-foot">
              <b>{money(e.price)}</b>
              {e.status === 'NEW' && (
                <button type="button" className="link-btn muted" onClick={() => cancel(e)}><X size={14} /> {t.cancel}</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
