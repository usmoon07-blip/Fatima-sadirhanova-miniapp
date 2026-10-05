import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, ExternalLink, Eye, RefreshCw, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { api, dateTime, money, STATUSES, STATUS_MAP } from '../api';

const POLL_MS = 5000;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i ? 1046 : 784;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  } catch { /* ovoz o'chirilgan */ }
}

function StatusSelect({ order, onChange }) {
  const st = STATUS_MAP[order.status];
  return (
    <select className={`status-select tone-${st.tone}`} value={order.status} onChange={(e) => onChange(order, e.target.value)}>
      {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

function ItemsCell({ items }) {
  return (
    <ul className="items-cell">
      {items.map((i) => (
        <li key={`${i.productId}-${i.size}`}>
          {i.name}{i.size ? <span className="muted"> · {i.size}</span> : null} <b>× {i.quantity}</b>
        </li>
      ))}
    </ul>
  );
}

function OrderDetails({ order, onClose, onStatus }) {
  const mapUrl = order.latitude ? `https://maps.google.com/?q=${order.latitude},${order.longitude}` : null;
  const yandexUrl = order.latitude ? `https://yandex.uz/maps/?pt=${order.longitude},${order.latitude}&z=17&l=map` : null;
  return (
    <Modal title={`Buyurtma #${order.id}`} onClose={onClose} wide>
      <div className="details-grid">
        <div>
          <div className="label">Mijoz</div>
          <div className="value">{order.customerName}</div>
          <a href={`tel:${order.phone}`} className="value link">{order.phone}</a>
          {order.user?.username && (
            <a className="value link" href={`https://t.me/${order.user.username}`} target="_blank" rel="noreferrer">@{order.user.username}</a>
          )}
        </div>
        <div>
          <div className="label">Sana</div>
          <div className="value">{dateTime(order.createdAt)}</div>
          <div className="label mt">Vaqt</div>
          <div className="value">{order.deliveryTime || '—'}</div>
        </div>
        <div>
          <div className="label">Turi / To'lov</div>
          <div className="value">{order.deliveryType === 'DELIVERY' ? '🚚 Yetkazib berish' : '🏪 Olib ketish'}</div>
          <div className="value">{order.paymentMethod === 'CASH' ? '💵 Naqd' : '💳 Karta'}</div>
        </div>
        <div>
          <div className="label">Holati</div>
          <StatusSelect order={order} onChange={onStatus} />
        </div>
      </div>

      {order.deliveryType === 'DELIVERY' && (
        <div className="address-box">
          <div className="label">Manzil</div>
          <div className="value">{order.address || 'Faqat lokatsiya yuborilgan'}</div>
          {mapUrl && (
            <div className="row gap">
              <a className="btn btn-outline btn-sm" href={mapUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Google Maps</a>
              <a className="btn btn-outline btn-sm" href={yandexUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Yandex Maps</a>
            </div>
          )}
        </div>
      )}

      {order.comment && (
        <div className="comment-box"><div className="label">Izoh</div>{order.comment}</div>
      )}

      <table className="table compact">
        <thead><tr><th>Mahsulot</th><th>Narx</th><th>Soni</th><th className="right">Summa</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={`${i.productId}-${i.size}`}>
              <td>
                <div className="prod-cell">
                  <img src={i.imageUrl} alt="" />
                  <div>{i.name}{i.size && <div className="muted small">{i.size}</div>}</div>
                </div>
              </td>
              <td>{money(i.price)}</td>
              <td>{i.quantity}</td>
              <td className="right">{money(i.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3}>Mahsulotlar</td><td className="right">{money(order.subtotal)}</td></tr>
          <tr><td colSpan={3}>Yetkazib berish</td><td className="right">{money(order.deliveryFee)}</td></tr>
          <tr className="grand"><td colSpan={3}>Jami</td><td className="right">{money(order.total)}</td></tr>
        </tfoot>
      </table>
    </Modal>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [sound, setSound] = useState(true);
  const [fresh, setFresh] = useState(new Set());
  const maxIdRef = useRef(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([api.orders({ status, search }), api.stats()]);
      setOrders(o.orders);
      setStats(s);
      setError('');
      const maxId = o.orders.reduce((m, x) => Math.max(m, x.id), 0);
      if (maxIdRef.current !== null && maxId > maxIdRef.current) {
        const newIds = o.orders.filter((x) => x.id > maxIdRef.current).map((x) => x.id);
        setFresh((prev) => new Set([...prev, ...newIds]));
        if (soundRef.current) beep();
        document.title = `(${newIds.length}) Yangi buyurtma!`;
        setTimeout(() => { document.title = 'Admin Panel'; }, 6000);
      }
      if (maxIdRef.current === null || maxId > maxIdRef.current) maxIdRef.current = maxId;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    const iv = setInterval(load, POLL_MS);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [load, search]);

  const changeStatus = async (order, next) => {
    if (next === 'CANCELLED' && !window.confirm(`#${order.id} buyurtmani bekor qilasizmi? Mijozga xabar boradi.`)) return;
    try {
      const { order: updated } = await api.setOrderStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setFresh((prev) => { const n = new Set(prev); n.delete(order.id); return n; });
      api.stats().then(setStats).catch(() => {});
    } catch (e) {
      alert(e.message);
    }
  };

  const selected = orders.find((o) => o.id === selectedId);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Buyurtmalar</h1>
          <p className="muted">Har {POLL_MS / 1000} soniyada avtomatik yangilanadi</p>
        </div>
        <div className="row gap">
          <button type="button" className="btn btn-outline" onClick={() => setSound((s) => !s)} title="Yangi buyurtma ovozi">
            {sound ? <Bell size={16} /> : <BellOff size={16} />} {sound ? 'Ovoz yoqilgan' : "Ovoz o'chiq"}
          </button>
          <button type="button" className="btn btn-outline" onClick={load}><RefreshCw size={16} /> Yangilash</button>
        </div>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat"><span>Bugungi buyurtmalar</span><b>{stats.todayOrders}</b></div>
          <div className="stat"><span>Bugungi tushum</span><b>{money(stats.todayRevenue)}</b></div>
          <div className="stat accent"><span>Yangi (kutilmoqda)</span><b>{stats.newOrders}</b></div>
          <div className="stat"><span>Jarayonda</span><b>{stats.activeOrders}</b></div>
          <div className="stat"><span>Mijozlar</span><b>{stats.customers}</b></div>
        </div>
      )}

      <div className="toolbar">
        <div className="tabs">
          {[{ id: 'ALL', label: 'Barchasi' }, ...STATUSES].map((s) => (
            <button key={s.id} type="button" className={status === s.id ? 'active' : ''} onClick={() => setStatus(s.id)}>{s.label}</button>
          ))}
        </div>
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism, telefon yoki # raqam" />
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sana</th>
              <th>Mijoz</th>
              <th>Mahsulotlar</th>
              <th>Turi</th>
              <th>To'lov</th>
              <th className="right">Jami</th>
              <th>Holati</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className={fresh.has(o.id) ? 'fresh' : ''}>
                <td><b>#{o.id}</b></td>
                <td className="nowrap">{dateTime(o.createdAt)}</td>
                <td>
                  <div className="strong">{o.customerName}</div>
                  <a href={`tel:${o.phone}`} className="muted small nowrap">{o.phone}</a>
                </td>
                <td><ItemsCell items={o.items} /></td>
                <td className="nowrap">{o.deliveryType === 'DELIVERY' ? '🚚 Yetkazish' : '🏪 Olib ketish'}</td>
                <td className="nowrap">{o.paymentMethod === 'CASH' ? '💵 Naqd' : '💳 Karta'}</td>
                <td className="right nowrap strong">{money(o.total)}</td>
                <td><StatusSelect order={o} onChange={changeStatus} /></td>
                <td>
                  <button type="button" className="icon-btn" title="Batafsil" onClick={() => setSelectedId(o.id)}><Eye size={17} /></button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={9} className="empty-cell">Buyurtmalar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <OrderDetails order={selected} onClose={() => setSelectedId(null)} onStatus={changeStatus} />}
    </div>
  );
}
