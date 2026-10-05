import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, MessageSquareText, Volume2, VolumeX } from 'lucide-react';
import { api, money } from '../api';
import { isSoundReady, playSignal, unlockSound } from '../sound';

const POLL_MS = 5000;
const WARN_MIN = 15;
const LATE_MIN = 25;

const COLUMNS = [
  { id: 'new', title: 'Yangi buyurtmalar', statuses: ['NEW'] },
  { id: 'cooking', title: 'Tayyorlanmoqda', statuses: ['CONFIRMED', 'PREPARING'] },
  { id: 'out', title: "Yo'lda / Olib ketishga tayyor", statuses: ['READY', 'ON_THE_WAY'] },
];

function actionsFor(order) {
  const pickup = order.deliveryType === 'PICKUP';
  switch (order.status) {
    case 'NEW': return [{ label: 'Qabul qildim', to: 'CONFIRMED', primary: true }, { label: 'Bekor qilish', to: 'CANCELLED', danger: true }];
    case 'CONFIRMED': return [{ label: 'Tayyorlashni boshladim', to: 'PREPARING', primary: true }];
    case 'PREPARING': return [pickup
      ? { label: 'Tayyor — olib ketishga', to: 'READY', primary: true }
      : { label: 'Tayyor — kuryerga berildi', to: 'ON_THE_WAY', primary: true }];
    case 'READY': return [{ label: 'Mijoz olib ketdi', to: 'DELIVERED', primary: true }];
    case 'ON_THE_WAY': return [{ label: 'Yetkazildi', to: 'DELIVERED', primary: true }];
    default: return [];
  }
}

const STATUS_NOTE = {
  CONFIRMED: 'Qabul qilingan', PREPARING: 'Tayyorlanmoqda', READY: 'Mijozni kutmoqda', ON_THE_WAY: "Kuryerda, yo'lda",
};

function minutesSince(date, now) {
  return Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000));
}

function hhmm(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function OrderCard({ order, now, fresh, onAction, busy }) {
  const mins = minutesSince(order.createdAt, now);
  const level = mins >= LATE_MIN ? 'late' : mins >= WARN_MIN ? 'warn' : 'ok';
  return (
    <article className={`k-card ${level} ${fresh ? 'fresh' : ''}`}>
      <div className="k-head">
        <b>#{order.id}</b>
        <span className={`k-timer ${level}`}>{mins} daqiqa</span>
      </div>
      <div className="k-tags">
        <span>{order.deliveryType === 'DELIVERY' ? 'Yetkazib berish' : 'Olib ketish'}</span>
        <span>{order.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}</span>
        <span>{hhmm(order.createdAt)}</span>
        {order.deliveryTime && !/tez|скорее|soon/i.test(order.deliveryTime) && <span className="k-time">⏰ {order.deliveryTime}</span>}
      </div>
      <ul className="k-items">
        {order.items.map((i) => (
          <li key={`${i.productId}-${i.size}`}>
            <b>{i.quantity}×</b> {i.name}{i.size ? <span className="muted"> · {i.size}</span> : null}
          </li>
        ))}
      </ul>
      {order.comment && <div className="k-comment"><MessageSquareText size={14} /> {order.comment}</div>}
      <div className="k-customer">
        <span>{order.customerName}</span>
        <a href={`tel:${order.phone}`}>{order.phone}</a>
      </div>
      <div className="k-total">{money(order.total)}{STATUS_NOTE[order.status] && <small>{STATUS_NOTE[order.status]}</small>}</div>
      <div className="k-actions">
        {actionsFor(order).map((a) => (
          <button
            key={a.to}
            type="button"
            disabled={busy}
            className={`btn ${a.primary ? 'btn-dark' : ''} ${a.danger ? 'btn-danger-ghost' : ''}`}
            onClick={() => onAction(order, a.to)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </article>
  );
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [sound, setSound] = useState(isSoundReady());
  const [fresh, setFresh] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const knownIds = useRef(null);
  const offset = useRef(0);

  const load = useCallback(async () => {
    try {
      const r = await api.kitchen();
      offset.current = new Date(r.now).getTime() - Date.now();
      setOrders(r.orders);
      setError('');
      const ids = new Set(r.orders.map((o) => o.id));
      if (knownIds.current) {
        const added = r.orders.filter((o) => o.status === 'NEW' && !knownIds.current.has(o.id)).map((o) => o.id);
        if (added.length) {
          playSignal(2);
          setFresh((prev) => new Set([...prev, ...added]));
          document.title = `🔔 ${added.length} ta yangi buyurtma!`;
          setTimeout(() => { document.title = 'Oshxona ekrani'; }, 8000);
          setTimeout(() => setFresh((prev) => {
            const n = new Set(prev);
            added.forEach((id) => n.delete(id));
            return n;
          }), 15000);
        }
      }
      knownIds.current = ids;
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now() + offset.current), 15000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [load]);

  const enableSound = () => {
    unlockSound();
    setTimeout(() => {
      setSound(isSoundReady());
      playSignal(1);
    }, 100);
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  const act = async (order, to) => {
    if (to === 'CANCELLED' && !window.confirm(`#${order.id} buyurtmani bekor qilasizmi? Mijozga bot orqali xabar boradi.`)) return;
    setBusyId(order.id);
    try {
      const { order: updated } = await api.setOrderStatus(order.id, to);
      setOrders((prev) => (['DELIVERED', 'CANCELLED'].includes(updated.status)
        ? prev.filter((o) => o.id !== updated.id)
        : prev.map((o) => (o.id === updated.id ? updated : o))));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page kitchen">
      <div className="page-head">
        <div>
          <h1>Oshxona ekrani</h1>
          <p className="muted">Har {POLL_MS / 1000} soniyada yangilanadi · {WARN_MIN} daqiqadan keyin sariq, {LATE_MIN} daqiqadan keyin qizil</p>
        </div>
        <div className="row gap">
          <button type="button" className={`btn ${sound ? 'btn-outline' : 'btn-dark'}`} onClick={enableSound}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} {sound ? 'Tovush yoqilgan' : 'Tovushni yoqish'}
          </button>
          <button type="button" className="btn btn-outline" onClick={fullscreen}><Maximize size={16} /> To'liq ekran</button>
        </div>
      </div>

      {!sound && (
        <div className="notice">
          Yangi buyurtma kelganda signal eshitilishi uchun bir marta <b>"Tovushni yoqish"</b> tugmasini bosing (brauzer shuni talab qiladi).
        </div>
      )}
      {error && <div className="alert">{error}</div>}

      <div className="k-board">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <section key={col.id} className={`k-col ${col.id}`}>
              <div className="k-col-head">
                <span>{col.title}</span>
                <b>{list.length}</b>
              </div>
              <div className="k-list">
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} now={now} fresh={fresh.has(o.id)} busy={busyId === o.id} onAction={act} />
                ))}
                {!list.length && <div className="k-empty">Bo'sh</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
