import { useEffect, useState } from 'react';
import {
  ArrowLeft, Banknote, Clock, CreditCard, LoaderCircle, MapPin, Phone, Store, Truck, UserRound,
} from 'lucide-react';
import AddressFields from '../components/AddressFields';
import { Totals } from './Cart';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { formatPhone, isValidPhone } from '../lib/format';
import { storage } from '../lib/storage';
import { haptic, openLink, requestContact, tgUser } from '../lib/telegram';

/** datetime-local uchun qiymat: bugundan `days` kun keyin (0 bo'lsa — 2 soatdan keyin) */
function minDateTime(days) {
  const d = days > 0 ? new Date() : new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (days > 0) {
    d.setDate(d.getDate() + days);
    d.setHours(10, 0, 0, 0);
  }
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function prettyDateTime(value) {
  const [date, time] = value.split('T');
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y} ${time}`;
}

export default function Checkout() {
  const {
    cartLines, subtotal, config, user, setUser, setScreen, clearCart, setLastOrder, showToast, displayName,
    t, money, deliveryType, setDeliveryType, refreshMe,
  } = useStore();
  const saved = storage.get('checkout', {});

  const [paymentMethod, setPaymentMethod] = useState(saved.paymentMethod || 'CASH');
  const [name, setName] = useState(saved.name || [tgUser()?.first_name, tgUser()?.last_name].filter(Boolean).join(' ') || (displayName !== t.guest ? displayName : ''));
  const [phone, setPhone] = useState(saved.phone || '');
  const [address, setAddress] = useState(user?.address || saved.address || '');
  const [coords, setCoords] = useState(user?.latitude ? { latitude: user.latitude, longitude: user.longitude } : saved.coords || null);
  const advanceDays = config.order?.advanceDays || 0;
  const [timeMode, setTimeMode] = useState(advanceDays ? 'later' : 'asap');
  const [time, setTime] = useState(advanceDays ? minDateTime(advanceDays) : '');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!phone && user?.phone) setPhone(formatPhone(user.phone));
  }, [user, phone]);

  const { shop } = config;
  const total = subtotal;

  const chooseType = (type) => {
    haptic.select();
    setDeliveryType(type);
  };

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

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = t.errName;
    if (!isValidPhone(phone)) e.phone = t.errPhone;
    if (deliveryType === 'DELIVERY' && !coords && address.trim().length < 5) e.address = t.errAddress;
    if (timeMode === 'later' && (!time || (advanceDays && time.slice(0, 10) < minDateTime(advanceDays).slice(0, 10)))) e.time = t.errTime;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    if (!validate()) {
      haptic.error();
      showToast(t.fillFields, 'bad');
      return;
    }
    setSubmitting(true);
    try {
      const isDelivery = deliveryType === 'DELIVERY';
      const payload = {
        items: cartLines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
        deliveryType,
        paymentMethod,
        customerName: name.trim(),
        phone,
        address: isDelivery ? address.trim() || null : null,
        latitude: isDelivery ? coords?.latitude ?? null : null,
        longitude: isDelivery ? coords?.longitude ?? null : null,
        deliveryTime: timeMode === 'later' && time ? prettyDateTime(time) : t.asap,
        deliveryAt: timeMode === 'later' && time ? new Date(time).toISOString() : null,
        comment: comment.trim() || null,
      };
      const { order } = await api.createOrder(payload);
      storage.set('checkout', { deliveryType, paymentMethod, name: name.trim(), phone, address, coords });
      haptic.success();
      clearCart();
      setLastOrder(order);
      refreshMe();
      setScreen('success');
    } catch (e) {
      haptic.error();
      if (e.field) setErrors((prev) => ({ ...prev, [e.field]: e.message }));
      showToast(e.message, 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page with-cta no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="←" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <h1 className="serif">{t.checkout}</h1>
        <span style={{ width: 40 }} />
      </div>

      <h4 className="label-title">{t.howGet}</h4>
      <div className="type-cards">
        <button type="button" className={deliveryType === 'DELIVERY' ? 'active' : ''} onClick={() => chooseType('DELIVERY')}>
          <Truck size={22} />
          <b>{t.delivery}</b>
        </button>
        <button type="button" className={deliveryType === 'PICKUP' ? 'active' : ''} onClick={() => chooseType('PICKUP')}>
          <Store size={22} />
          <b>{t.pickup}</b>
        </button>
      </div>

      {deliveryType === 'DELIVERY' ? (
        <section className="card form-card">
          <h4><MapPin size={18} /> {t.addressTitle}</h4>
          <AddressFields
            address={address}
            setAddress={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: null })); }}
            coords={coords}
            setCoords={(c) => { setCoords(c); setErrors((e) => ({ ...e, address: null })); }}
            error={errors.address}
          />
        </section>
      ) : (
        <section className="card form-card">
          <h4><Store size={18} /> {t.pickupTitle}</h4>
          <p className="pickup-address">{shop.address}</p>
          {shop.workingHours && <p className="muted small">{t.hours}: {shop.workingHours}</p>}
          {shop.lat && shop.lng && (
            <button type="button" className="btn btn-soft btn-block" onClick={() => openLink(`https://maps.google.com/?q=${shop.lat},${shop.lng}`)}>
              <MapPin size={18} /> {t.showOnMap}
            </button>
          )}
        </section>
      )}

      <section className="card form-card">
        <h4><UserRound size={18} /> {t.receiver}</h4>
        <input className={errors.name ? 'invalid' : ''} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} autoComplete="name" />
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
            autoComplete="tel"
          />
          <button type="button" className="icon-btn" aria-label="phone" onClick={shareContact}><Phone size={18} /></button>
        </div>
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </section>

      <section className="card form-card">
        <h4><Clock size={18} /> {deliveryType === 'DELIVERY' ? t.timeDelivery : t.timePickup}</h4>
        {!advanceDays && (
          <div className="chips wrap">
            <button type="button" className={`chip ${timeMode === 'asap' ? 'active' : ''}`} onClick={() => setTimeMode('asap')}>{t.asap}</button>
            <button type="button" className={`chip ${timeMode === 'later' ? 'active' : ''}`} onClick={() => setTimeMode('later')}>{t.chooseTime}</button>
          </div>
        )}
        {timeMode === 'later' && (
          <>
            <input
              className={errors.time ? 'invalid' : ''}
              type="datetime-local"
              min={minDateTime(advanceDays).slice(0, 10) + (advanceDays ? 'T00:00' : minDateTime(0).slice(10))}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label={t.pickDate}
            />
            {errors.time && <div className="field-error">{errors.time}</div>}
            {advanceDays > 0 && <p className="muted small">{t.advanceHint(advanceDays)}</p>}
          </>
        )}
      </section>

      <section className="card form-card">
        <h4>{t.payTitle}</h4>
        <div className="pay-options">
          <button type="button" className={`pay ${paymentMethod === 'CASH' ? 'active' : ''}`} onClick={() => { haptic.select(); setPaymentMethod('CASH'); }}>
            <Banknote size={22} />
            <b>{t.cash}</b>
            <span>{deliveryType === 'DELIVERY' ? t.cashSubDelivery : t.cashSubPickup}</span>
          </button>
          <button type="button" className={`pay ${paymentMethod === 'CARD' ? 'active' : ''}`} onClick={() => { haptic.select(); setPaymentMethod('CARD'); }}>
            <CreditCard size={22} />
            <b>{t.card}</b>
            <span>{t.cardSub}</span>
          </button>
        </div>
        {paymentMethod === 'CARD' && shop.cardNumber && <p className="muted small">{t.cardHint}</p>}
      </section>

      <section className="card form-card">
        <h4>{t.comment}</h4>
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.commentPh} maxLength={500} />
      </section>

      <Totals />

      <div className="sticky-cta">
        <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
          {submitting ? <LoaderCircle size={20} className="spin" /> : `${t.confirm} — ${money(total)}`}
        </button>
      </div>
    </div>
  );
}
