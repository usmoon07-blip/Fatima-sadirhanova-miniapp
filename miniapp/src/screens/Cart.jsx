import { useEffect, useState } from 'react';
import { BookOpenText, CheckCircle2, Phone, Trash2 } from 'lucide-react';
import Img from '../components/Img';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { lessonsLabel, money } from '../lib/format';
import { closeApp, haptic, isTelegram, requestContact, tgUser } from '../lib/telegram';

function Success({ order, onClose }) {
  return (
    <div className="success-screen">
      <div className="success-badge"><CheckCircle2 size={56} strokeWidth={1.6} /></div>
      <h2 className="serif">Buyurtmangiz qabul qilindi!</h2>
      <p>Buyurtma #{order.id}. Kuratorimiz tez orada siz bilan bog'lanadi 🧁</p>
      {!isTelegram && <button type="button" className="btn btn-primary" onClick={onClose}>Profilga o'tish</button>}
    </div>
  );
}

export default function Cart() {
  const { cartCourses, removeFromCart, clearCart, config, upsell, setUpsell, me, refreshMe, setTab, openCourse } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    const u = me.user;
    const t = tgUser();
    setName((v) => v || [u?.firstName || t?.first_name, u?.lastName || t?.last_name].filter(Boolean).join(' '));
    setPhone((v) => v || u?.phone || '');
  }, [me.user]);

  if (done) {
    return <Success order={done} onClose={() => { setDone(null); setTab('profile'); }} />;
  }

  if (!cartCourses.length) {
    return (
      <div className="page">
        <PageTitle title="Savatcha" />
        <div className="empty big">
          <span className="empty-emoji">🛍️</span>
          <b>Savatchangiz bo'sh</b>
          <p>Kurslardan birini tanlab, savatchaga qo'shing</p>
          <button type="button" className="btn btn-primary" onClick={() => setTab('courses')}>Kurslarni ko'rish</button>
        </div>
      </div>
    );
  }

  const offer = config?.upsell;
  const subtotal = cartCourses.reduce((s, c) => s + c.price, 0);
  const oldTotal = cartCourses.reduce((s, c) => s + (c.oldPrice > c.price ? c.oldPrice : c.price), 0);
  const savings = oldTotal - subtotal;
  const extra = offer && upsell ? offer.price : 0;
  const total = subtotal + extra;

  const askContact = async () => {
    const p = await requestContact();
    if (p && p !== 'shared') setPhone(p);
    else if (p === 'shared') {
      await refreshMe();
    }
  };

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) return setError('Ismingizni kiriting');
    if (!/^\+?[0-9\s\-()]{9,20}$/.test(phone.trim())) return setError("Telefon raqamni to'g'ri kiriting (masalan, +998 90 123 45 67)");
    setSending(true);
    try {
      const order = await api.createOrder({
        courseIds: cartCourses.map((c) => c.id),
        upsell: Boolean(offer && upsell),
        customerName: name.trim(),
        phone: phone.trim(),
        comment: comment.trim() || null,
      });
      haptic.success();
      clearCart();
      setDone(order);
      refreshMe();
      if (isTelegram) setTimeout(closeApp, 1600);
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
      <PageTitle title="Savatcha" subtitle={`${cartCourses.length} ta kurs`} />

      <div className="cart-list">
        {cartCourses.map((c) => (
          <div key={c.id} className="cart-item">
            <button type="button" className="cart-thumb" onClick={() => openCourse(c.id)}><Img src={c.imageUrl} alt={c.title} /></button>
            <div className="cart-info" onClick={() => openCourse(c.id)}>
              <b>{c.title}</b>
              <small>{[lessonsLabel(c.lessonsCount), c.duration].filter(Boolean).join(' · ')}</small>
              <div className="price">
                {c.oldPrice > c.price && <s>{money(c.oldPrice)}</s>}
                <b>{money(c.price)}</b>
              </div>
            </div>
            <button type="button" className="icon-btn soft" onClick={() => removeFromCart(c.id)} aria-label="O'chirish"><Trash2 size={17} /></button>
          </div>
        ))}
      </div>

      {offer && (
        <label className={`upsell ${upsell ? 'on' : ''}`}>
          <span className="upsell-icon"><BookOpenText size={22} /></span>
          <span className="upsell-text">
            Bunga qo'shimcha ravishda <b>{offer.title}</b>ni atigi <b>{money(offer.price)}</b>ga qo'shasizmi?
          </span>
          <input type="checkbox" checked={upsell} onChange={(e) => { haptic.select(); setUpsell(e.target.checked); }} />
          <span className="switch" aria-hidden />
        </label>
      )}

      <section className="form-card">
        <h4>Ma'lumotlaringiz</h4>
        <div className="field">
          <label htmlFor="c-name">Ismingiz</label>
          <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism va familiya" autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Telefon raqam</label>
          <div className="input-row">
            <input id="c-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" autoComplete="tel" />
            {isTelegram && (
              <button type="button" className="btn btn-soft btn-sm" onClick={askContact}><Phone size={15} /> Yuborish</button>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-comment">Izoh (ixtiyoriy)</label>
          <textarea id="c-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Qulay bog'lanish vaqti va h.k." />
        </div>
      </section>

      <section className="summary">
        <div><span>Kurslar</span><span>{money(oldTotal)}</span></div>
        {savings > 0 && <div className="save"><span>Chegirma</span><span>−{money(savings)}</span></div>}
        {extra > 0 && <div><span>Qo'shimcha</span><span>{money(extra)}</span></div>}
        <div className="total"><span>Jami</span><span>{money(total)}</span></div>
      </section>

      {error && <div className="form-error">{error}</div>}

      <div className="cart-cta">
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={sending} onClick={submit}>
          {sending ? 'Yuborilmoqda...' : `Buyurtmani tasdiqlash — ${money(total)}`}
        </button>
      </div>
    </div>
  );
}
