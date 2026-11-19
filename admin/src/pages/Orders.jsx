import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, RefreshCw, Trash2 } from 'lucide-react';
import { api, dateTime, fullName, money, STATUSES, STATUS_MAP } from '../api';
import { isSoundReady, playSignal, unlockSound } from '../sound';

const FILTERS = [{ id: 'ALL', label: 'Hammasi' }, ...STATUSES];
const POLL_MS = 8000;

export default function Orders() {
  const [filter, setFilter] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sound, setSound] = useState(isSoundReady());
  const [fresh, setFresh] = useState(new Set());
  const knownIds = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [list, st] = await Promise.all([api.orders(filter), api.stats()]);
      // Yangi buyurtmalarni aniqlash
      if (knownIds.current) {
        const newOnes = list.filter((o) => !knownIds.current.has(o.id) && o.status === 'PENDING');
        if (newOnes.length) {
          playSignal(1);
          setFresh(new Set(newOnes.map((o) => o.id)));
          document.title = `(${newOnes.length}) Yangi buyurtma!`;
          setTimeout(() => { document.title = 'Admin Panel — Fatima Sadirkhanova'; }, 6000);
        }
      }
      knownIds.current = new Set([...(knownIds.current || []), ...list.map((o) => o.id)]);
      setOrders(list);
      setStats(st);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const changeStatus = async (order, status) => {
    if (status === order.status) return;
    if (status === 'PAID' && !window.confirm(`#${order.id} buyurtma to'landi deb belgilansinmi?\nMijozga botda kursga kirish havolasi yuboriladi.`)) return;
    try {
      const updated = await api.setOrderStatus(order.id, status);
      setOrders((list) => list.map((o) => (o.id === order.id ? updated : o)));
      api.stats().then(setStats).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (order) => {
    if (!window.confirm(`#${order.id} buyurtma butunlay o'chirilsinmi?`)) return;
    try {
      await api.deleteOrder(order.id);
      setOrders((list) => list.filter((o) => o.id !== order.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Buyurtmalar</h1>
          <p className="muted">Har {POLL_MS / 1000} soniyada avtomatik yangilanadi</p>
        </div>
        <div className="head-actions">
          <button type="button" className={`btn ${sound ? 'btn-soft' : 'btn-outline'}`} onClick={() => setSound(unlockSound())}>
            {sound ? <Bell size={16} /> : <BellOff size={16} />} {sound ? 'Ovoz yoqilgan' : 'Ovozni yoqish'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => load()}><RefreshCw size={16} /> Yangilash</button>
        </div>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat"><small>To'lov kutilmoqda</small><b className="amber">{stats.pending}</b></div>
          <div className="stat"><small>To'langan buyurtmalar</small><b>{stats.paid}</b></div>
          <div className="stat"><small>Tushum</small><b className="rose">{money(stats.revenue)}</b></div>
          <div className="stat"><small>Bugun</small><b>{stats.today}</b></div>
          <div className="stat"><small>Foydalanuvchilar</small><b>{stats.students}</b></div>
        </div>
      )}

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sana</th>
              <th>Mijoz</th>
              <th>Telefon</th>
              <th>Kurslar</th>
              <th>Jami</th>
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
                  <b>{o.customerName}</b>
                  <small>{o.user?.username ? `@${o.user.username}` : fullName(o.user)}</small>
                  {o.comment && <small className="comment">💬 {o.comment}</small>}
                </td>
                <td className="nowrap"><a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a></td>
                <td>
                  <ul className="items">
                    {(Array.isArray(o.items) ? o.items : []).map((i, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={idx}>{i.type === 'extra' ? '➕ ' : ''}{i.title} <span className="muted">— {money(i.price)}</span></li>
                    ))}
                  </ul>
                </td>
                <td className="nowrap"><b>{money(o.total)}</b></td>
                <td>
                  <select className={`status-select ${STATUS_MAP[o.status]?.tone}`} value={o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td>
                  <button type="button" className="icon-btn danger" onClick={() => remove(o)} aria-label="O'chirish"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {!orders.length && !loading && (
              <tr><td colSpan={8} className="empty-cell">Buyurtmalar yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
