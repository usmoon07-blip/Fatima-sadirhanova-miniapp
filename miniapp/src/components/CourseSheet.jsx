import { useEffect, useState } from 'react';
import {
  ArrowLeft, Banknote, Check, Clock, CreditCard, LoaderCircle, MonitorPlay, Phone, Users,
} from 'lucide-react';
import Img from './Img';
import { FormatTags } from './CourseCard';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { formatPhone, isValidPhone } from '../lib/format';
import { loc } from '../lib/i18n';
import { haptic, requestContact, tgUser } from '../lib/telegram';

export default function CourseSheet() {
  const {
    courseId, openCourse, catalog, t, lang, money, user, showToast, setUser,
  } = useStore();
  const course = courseId ? catalog.courses.find((c) => c.id === courseId) : null;
  const [format, setFormat] = useState(null);
  const [step, setStep] = useState('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState('CARD');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!course) return undefined;
    setFormat(course.onlinePrice ? 'ONLINE' : 'OFFLINE');
    setStep('info');
    setClosing(false);
    setErrors({});
    setName([tgUser()?.first_name, tgUser()?.last_name].filter(Boolean).join(' ') || user?.firstName || '');
    setPhone(user?.phone ? formatPhone(user.phone) : '');
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  if (!course) return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => openCourse(null), 220);
  };

  const price = format === 'ONLINE' ? course.onlinePrice : course.offlinePrice;
  const program = loc(course, 'program', lang);
  const duration = loc(course, 'duration', lang);

  const shareContact = async () => {
    const result = await requestContact();
    if (!result) return showToast(t.phoneManual, 'bad');
    if (result !== 'shared') return setPhone(formatPhone(result));
    setTimeout(() => api.me().then((r) => {
      setUser(r.user);
      if (r.user.phone) setPhone(formatPhone(r.user.phone));
    }).catch(() => {}), 1200);
    return undefined;
  };

  const submit = async () => {
    const e = {};
    if (name.trim().length < 2) e.name = t.errName;
    if (!isValidPhone(phone)) e.phone = t.errPhone;
    setErrors(e);
    if (Object.keys(e).length) {
      haptic.error();
      return;
    }
    setSending(true);
    try {
      await api.enroll(course.id, {
        format, customerName: name.trim(), phone, paymentMethod: payment, comment: comment.trim() || null,
      });
      haptic.success();
      showToast(t.enrollSent);
      close();
    } catch (err) {
      haptic.error();
      showToast(err.message, 'bad');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        <div className="sheet-scroll">
          <div className="sheet-media">
            <Img src={course.imageUrl} alt="" emoji="🎓" eager />
            <button type="button" className="icon-btn floating left" aria-label="←" onClick={step === 'form' ? () => setStep('info') : close}>
              <ArrowLeft size={20} />
            </button>
            {course.badge && <span className="badge">{course.badge}</span>}
          </div>

          <div className="sheet-body">
            <FormatTags course={course} />
            <h2 className="serif sheet-title">{loc(course, 'title', lang)}</h2>
            {duration && <p className="muted course-duration"><Clock size={15} /> {t.duration}: {duration}</p>}

            {step === 'info' ? (
              <>
                <p className="sheet-desc">{loc(course, 'description', lang)}</p>
                {program.length > 0 && (
                  <section className="sheet-section">
                    <h4>{t.program}</h4>
                    <ul className="checks">
                      {program.map((item) => <li key={item}><Check size={15} /> {item}</li>)}
                    </ul>
                  </section>
                )}
                <section className="sheet-section">
                  <h4>{t.chooseFormat}</h4>
                  <div className="format-options">
                    {course.onlinePrice ? (
                      <button type="button" className={format === 'ONLINE' ? 'active' : ''} onClick={() => { haptic.select(); setFormat('ONLINE'); }}>
                        <MonitorPlay size={22} />
                        <b>{t.online}</b>
                        <small>{t.onlineHint}</small>
                        <span className="fo-price">{money(course.onlinePrice)}</span>
                      </button>
                    ) : null}
                    {course.offlinePrice ? (
                      <button type="button" className={format === 'OFFLINE' ? 'active' : ''} onClick={() => { haptic.select(); setFormat('OFFLINE'); }}>
                        <Users size={22} />
                        <b>{t.offline}</b>
                        <small>{t.offlineHint}</small>
                        <span className="fo-price">{money(course.offlinePrice)}</span>
                      </button>
                    ) : null}
                  </div>
                </section>
              </>
            ) : (
              <section className="sheet-section form-card plain">
                <h4>{t.enrollForm} · {format === 'ONLINE' ? t.online : t.offline}</h4>
                <input className={errors.name ? 'invalid' : ''} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} />
                {errors.name && <div className="field-error">{errors.name}</div>}
                <div className="input-with-btn">
                  <input
                    className={errors.phone ? 'invalid' : ''}
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => phone && setPhone(formatPhone(phone))}
                    placeholder="+998 90 123 45 67"
                  />
                  <button type="button" className="icon-btn" aria-label="phone" onClick={shareContact}><Phone size={18} /></button>
                </div>
                {errors.phone && <div className="field-error">{errors.phone}</div>}
                <h4>{t.payTitle}</h4>
                <div className="pay-options">
                  <button type="button" className={`pay ${payment === 'CARD' ? 'active' : ''}`} onClick={() => setPayment('CARD')}>
                    <CreditCard size={22} /><b>{t.card}</b><span>{t.cardSub}</span>
                  </button>
                  <button type="button" className={`pay ${payment === 'CASH' ? 'active' : ''}`} onClick={() => setPayment('CASH')}>
                    <Banknote size={22} /><b>{t.cash}</b><span>{t.offlineHint}</span>
                  </button>
                </div>
                <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.courseCommentPh} maxLength={500} />
                <p className="muted small">{t.payLater}</p>
              </section>
            )}
          </div>
        </div>

        <div className="sticky-cta">
          {step === 'info' ? (
            <button type="button" className="btn btn-primary btn-block" onClick={() => { haptic.light(); setStep('form'); }}>
              {t.enrollBtn(money(price))}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={sending}>
              {sending ? <LoaderCircle size={20} className="spin" /> : t.sendApplication(money(price))}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
