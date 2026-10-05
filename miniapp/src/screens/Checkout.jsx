import { useEffect, useState } from 'react';
import {
  ArrowLeft, Banknote, Clock, CreditCard, LoaderCircle, LocateFixed, MapPin, Phone, Store, Truck, UserRound,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { formatPhone, isValidPhone, money } from '../lib/format';
import { storage } from '../lib/storage';
import { getLocation, haptic, openLink, requestContact, tgUser } from '../lib/telegram';

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=uz&zoom=18`);
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.road, a.house_number, a.neighbourhood || a.suburb, a.city_district || a.city].filter(Boolean);
    return parts.join(', ') || data.display_name || '';
  } catch {
    return '';
  }
}

function minDateTime() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
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
  } = useStore();
  const saved = storage.get('checkout', {});

  const [deliveryType, setDeliveryType] = useState(saved.deliveryType || 'DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState(saved.paymentMethod || 'CASH');
  const [name, setName] = useState(saved.name || [tgUser()?.first_name, tgUser()?.last_name].filter(Boolean).join(' ') || (displayName !== 'mehmon' ? displayName : ''));
  const [phone, setPhone] = useState(saved.phone || '');
  const [address, setAddress] = useState(saved.address || '');
  const [coords, setCoords] = useState(saved.coords || null);
  const [timeMode, setTimeMode] = useState('asap');
  const [time, setTime] = useState('');
  const [comment, setComment] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!phone && user?.phone) setPhone(formatPhone(user.phone));
  }, [user, phone]);

  const { delivery, shop } = config;
  const fee = deliveryType === 'DELIVERY' && !(delivery.freeFrom && subtotal >= delivery.freeFrom) ? delivery.fee : 0;
  const total = subtotal + fee;

  const locate = async () => {
    haptic.light();
    setLocating(true);
    try {
      const loc = await getLocation();
      setCoords(loc);
      setErrors((e) => ({ ...e, address: null }));
      const text = await reverseGeocode(loc.latitude, loc.longitude);
      if (text && !address) setAddress(text);
    } catch (e) {
      showToast(e.message, 'bad');
    } finally {
      setLocating(false);
    }
  };

  const shareContact = async () => {
    const result = await requestContact();
    if (!result) return showToast("Raqamni qo'lda kiriting", 'bad');
    if (result !== 'shared') return setPhone(formatPhone(result));
    // Raqam botga yuborildi — bazadan qayta olamiz
    setTimeout(() => api.me().then((r) => {
      setUser(r.user);
      if (r.user.phone) setPhone(formatPhone(r.user.phone));
    }).catch(() => {}), 1200);
    return undefined;
  };

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Ismingizni kiriting';
    if (!isValidPhone(phone)) e.phone = "To'g'ri telefon raqamini kiriting";
    if (deliveryType === 'DELIVERY' && !coords && address.trim().length < 5) e.address = 'Manzilni kiriting yoki joylashuvni yuboring';
    if (timeMode === 'later' && !time) e.time = 'Vaqtni tanlang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    if (!validate()) {
      haptic.error();
      showToast("Iltimos, maydonlarni to'ldiring", 'bad');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: cartLines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
        deliveryType,
        paymentMethod,
        customerName: name.trim(),
        phone,
        address: deliveryType === 'DELIVERY' ? address.trim() || null : null,
        latitude: deliveryType === 'DELIVERY' ? coords?.latitude ?? null : null,
        longitude: deliveryType === 'DELIVERY' ? coords?.longitude ?? null : null,
        deliveryTime: timeMode === 'later' && time ? prettyDateTime(time) : 'Imkon qadar tezroq',
        comment: comment.trim() || null,
      };
      const { order } = await api.createOrder(payload);
      storage.set('checkout', { deliveryType, paymentMethod, name: name.trim(), phone, address, coords });
      haptic.success();
      clearCart();
      setLastOrder(order);
      setScreen('success');
    } catch (e) {
      haptic.error();
      if (e.field) setErrors((prev) => ({ ...prev, [e.field]: e.message }));
      showToast(e.message, 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.004},${coords.latitude - 0.0025},${coords.longitude + 0.004},${coords.latitude + 0.0025}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`
    : null;

  return (
    <div className="page with-cta no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Orqaga" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <h1 className="serif">Rasmiylashtirish</h1>
        <span style={{ width: 40 }} />
      </div>

      <div className="segmented">
        <button type="button" className={deliveryType === 'DELIVERY' ? 'active' : ''} onClick={() => { haptic.select(); setDeliveryType('DELIVERY'); }}>
          <Truck size={18} /> Yetkazib berish
        </button>
        <button type="button" className={deliveryType === 'PICKUP' ? 'active' : ''} onClick={() => { haptic.select(); setDeliveryType('PICKUP'); }}>
          <Store size={18} /> Olib ketish
        </button>
      </div>

      {deliveryType === 'DELIVERY' ? (
        <section className="card form-card">
          <h4><MapPin size={18} /> Yetkazib berish manzili</h4>
          <button type="button" className={`btn btn-soft btn-block ${coords ? 'done' : ''}`} onClick={locate} disabled={locating}>
            {locating ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />}
            {coords ? 'Joylashuv aniqlandi ✓ (yangilash)' : 'Joylashuvimni yuborish'}
          </button>
          {mapSrc && <iframe className="map" title="Xarita" src={mapSrc} loading="lazy" />}
          <textarea
            className={errors.address ? 'invalid' : ''}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ko'cha, uy, xonadon, mo'ljal..."
          />
          {errors.address && <div className="field-error">{errors.address}</div>}
        </section>
      ) : (
        <section className="card form-card">
          <h4><Store size={18} /> Olib ketish manzili</h4>
          <p className="pickup-address">{shop.address}</p>
          {shop.workingHours && <p className="muted small">Ish vaqti: {shop.workingHours}</p>}
          {shop.lat && shop.lng && (
            <button type="button" className="btn btn-soft btn-block" onClick={() => openLink(`https://maps.google.com/?q=${shop.lat},${shop.lng}`)}>
              <MapPin size={18} /> Xaritada ko'rish
            </button>
          )}
        </section>
      )}

      <section className="card form-card">
        <h4><UserRound size={18} /> Qabul qiluvchi</h4>
        <input className={errors.name ? 'invalid' : ''} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" autoComplete="name" />
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
          <button type="button" className="icon-btn" aria-label="Telegram raqamini yuborish" onClick={shareContact}><Phone size={18} /></button>
        </div>
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </section>

      <section className="card form-card">
        <h4><Clock size={18} /> {deliveryType === 'DELIVERY' ? 'Yetkazish vaqti' : 'Olib ketish vaqti'}</h4>
        <div className="chips wrap">
          <button type="button" className={`chip ${timeMode === 'asap' ? 'active' : ''}`} onClick={() => setTimeMode('asap')}>Imkon qadar tezroq</button>
          <button type="button" className={`chip ${timeMode === 'later' ? 'active' : ''}`} onClick={() => setTimeMode('later')}>Vaqtni tanlash</button>
        </div>
        {timeMode === 'later' && (
          <>
            <input className={errors.time ? 'invalid' : ''} type="datetime-local" min={minDateTime()} value={time} onChange={(e) => setTime(e.target.value)} />
            {errors.time && <div className="field-error">{errors.time}</div>}
            <p className="muted small">Maxsus tortlar uchun kamida 1 kun oldin buyurtma bering.</p>
          </>
        )}
      </section>

      <section className="card form-card">
        <h4>To'lov usuli</h4>
        <div className="pay-options">
          <button type="button" className={`pay ${paymentMethod === 'CASH' ? 'active' : ''}`} onClick={() => { haptic.select(); setPaymentMethod('CASH'); }}>
            <Banknote size={22} />
            <b>Naqd pul</b>
            <span>Qabul qilganda</span>
          </button>
          <button type="button" className={`pay ${paymentMethod === 'CARD' ? 'active' : ''}`} onClick={() => { haptic.select(); setPaymentMethod('CARD'); }}>
            <CreditCard size={22} />
            <b>Karta orqali</b>
            <span>Terminal yoki o'tkazma</span>
          </button>
        </div>
        {paymentMethod === 'CARD' && shop.cardNumber && (
          <p className="muted small">Karta raqami buyurtmadan so'ng bot orqali yuboriladi. Kuryerda terminal ham mavjud.</p>
        )}
      </section>

      <section className="card form-card">
        <h4>Izoh</h4>
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tort ustidagi yozuv, istaklar..." maxLength={500} />
      </section>

      <section className="summary card">
        <div><span>Mahsulotlar ({cartLines.reduce((s, l) => s + l.quantity, 0)})</span><b>{money(subtotal)}</b></div>
        {deliveryType === 'DELIVERY' && <div><span>Yetkazib berish</span><b>{fee ? money(fee) : 'Bepul'}</b></div>}
        <div className="total"><span>Jami</span><b>{money(total)}</b></div>
      </section>

      <div className="sticky-cta">
        <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
          {submitting ? <LoaderCircle size={20} className="spin" /> : `Buyurtmani tasdiqlash · ${money(total)}`}
        </button>
      </div>
    </div>
  );
}
