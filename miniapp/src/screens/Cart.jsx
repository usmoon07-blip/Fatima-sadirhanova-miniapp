import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Phone, Trash2 } from 'lucide-react';
import Img from '../components/Img';
import PaymentPanel from '../components/PaymentPanel';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { closeApp, haptic, isTelegram, requestContact, tgUser } from '../lib/telegram';

function Success({ order, onClose }) {
  const { t } = useStore();
  const [current, setCurrent] = useState(order);
  const paid = Boolean(current.receiptUrl);

  const finish = () => {
    if (isTelegram) closeApp();
    else onClose();
  };

  return (
    <div className="page">
      <div className="success-head">
        <div className="success-badge small"><CheckCircle2 size={34} strokeWidth={1.8} /></div>
        <h2 className="serif">{paid ? t('receiptAccepted') : t('orderAccepted')}</h2>
        <p>{paid ? t('afterReceipt') : t('payNow', { id: current.id })}</p>
      </div>

      <PaymentPanel order={current} onUploaded={(o) => { setCurrent(o); if (isTelegram) setTimeout(closeApp, 2200); }} />

      <button type="button" className="btn btn-soft btn-block later-btn" onClick={finish}>
        {paid ? t('close') : t('payLater')}
      </button>
      {!paid && <p className="muted small center">{t('payLaterHint')}</p>}
    </div>
  );
}

export default function Cart() {
  const {
    cartCourses, removeFromCart, clearCart, me, refreshMe, setTab, openCourse, t, loc, money,
  } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    const u = me.user;
    const tu = tgUser();
    setName((v) => v || [u?.firstName || tu?.first_name, u?.lastName || tu?.last_name].filter(Boolean).join(' '));
    setPhone((v) => v || u?.phone || '');
  }, [me.user]);

  if (done) {
    return <Success order={done} onClose={() => { setDone(null); setTab('profile'); }} />;
  }

  if (!cartCourses.length) {
    return (
      <div className="page">
        <PageTitle title={t('cartTitle')} />
        <div className="empty big">
          <span className="empty-emoji">🛍️</span>
          <b>{t('cartEmpty')}</b>
          <p>{t('cartEmptySub')}</p>
          <button type="button" className="btn btn-primary" onClick={() => setTab('courses')}>{t('viewCourses')}</button>
        </div>
      </div>
    );
  }

  const subtotal = cartCourses.reduce((s, c) => s + c.price, 0);
  const oldTotal = cartCourses.reduce((s, c) => s + (c.oldPrice > c.price ? c.oldPrice : c.price), 0);
  const savings = oldTotal - subtotal;
  const total = subtotal;

  const askContact = async () => {
    const p = await requestContact();
    if (p && p !== 'shared') setPhone(p);
    else if (p === 'shared') await refreshMe();
  };

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) return setError(t('errName'));
    if (!/^\+?[0-9\s\-()]{9,20}$/.test(phone.trim())) return setError(t('errPhone'));
    setSending(true);
    try {
      const order = await api.createOrder({
        courseIds: cartCourses.map((c) => c.id),
        titles: Object.fromEntries(cartCourses.map((c) => [c.id, c.title])),
        customerName: name.trim(),
        phone: phone.trim(),
        comment: comment.trim() || null,
      });
      haptic.success();
      clearCart();
      setDone(order);
      refreshMe();
      window.scrollTo({ top: 0 });
    } catch (err) {
      haptic.error();
      setError(err.message);
    } finally {
      setSending(false);
    }
    return undefined;
  };

  return (
    <div className="page">
      <PageTitle title={t('cartTitle')} subtitle={t('cartCount', { n: cartCourses.length })} />

      <div className="cart-list">
        {cartCourses.map((c) => (
          <div key={c.id} className="cart-item">
            <button type="button" className="cart-thumb" onClick={() => openCourse(c.id)}><Img src={c.imageUrl} alt={loc(c, 'title')} /></button>
            <div className="cart-info" onClick={() => openCourse(c.id)}>
              <b>{loc(c, 'title')}</b>
              <small>{[c.lessonsCount ? t('lessons', { n: c.lessonsCount }) : '', loc(c, 'duration')].filter(Boolean).join(' · ')}</small>
              <div className="price">
                {c.oldPrice > c.price && <s>{money(c.oldPrice)}</s>}
                <b>{money(c.price)}</b>
              </div>
            </div>
            <button type="button" className="icon-btn soft" onClick={() => removeFromCart(c.id)} aria-label={t('remove')}><Trash2 size={17} /></button>
          </div>
        ))}
      </div>


      <section className="form-card">
        <h4>{t('yourInfo')}</h4>
        <div className="field">
          <label htmlFor="c-name">{t('name')}</label>
          <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePh')} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="c-phone">{t('phone')}</label>
          <div className="input-row">
            <input id="c-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" autoComplete="tel" />
            {isTelegram && (
              <button type="button" className="btn btn-soft btn-sm" onClick={askContact}><Phone size={15} /> {t('send')}</button>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-comment">{t('comment')}</label>
          <textarea id="c-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPh')} />
        </div>
      </section>

      <section className="summary">
        <div><span>{t('sumCourses')}</span><span>{money(oldTotal)}</span></div>
        {savings > 0 && <div className="save"><span>{t('discount')}</span><span>−{money(savings)}</span></div>}
        <div className="pay-method"><span>{t('payMethod')}</span><span><CreditCard size={15} /> {t('byCard')}</span></div>
        <div className="total"><span>{t('total')}</span><span>{money(total)}</span></div>
      </section>

      {error && <div className="form-error">{error}</div>}

      <div className="cart-cta">
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={sending} onClick={submit}>
          {sending ? t('sending') : t('confirmOrder', { price: money(total) })}
        </button>
      </div>
    </div>
  );
}
