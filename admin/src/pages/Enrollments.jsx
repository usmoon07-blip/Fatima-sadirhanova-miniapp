import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { api, dateTime, money } from '../api';
import { playSignal, unlockSound } from '../sound';

const STATUSES = [
  { id: 'NEW', label: 'Yangi ariza', tone: 'blue' },
  { id: 'CONFIRMED', label: 'Tasdiqlandi', tone: 'indigo' },
  { id: 'PAID', label: "To'landi", tone: 'green' },
  { id: 'COMPLETED', label: 'Kursni tugatdi', tone: 'teal' },
  { id: 'CANCELLED', label: 'Bekor qilindi', tone: 'red' },
];
const TONE = Object.fromEntries(STATUSES.map((s) => [s.id, s.tone]));

export default function Enrollments() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [error, setError] = useState('');
  const maxId = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api.enrollments(status);
      setList(r.enrollments);
      setError('');
      const top = r.enrollments.reduce((m, e) => Math.max(m, e.id), 0);
      if (maxId.current !== null && top > maxId.current) {
        unlockSound();
        playSignal(1);
      }
      if (maxId.current === null || top > maxId.current) maxId.current = top;
    } catch (e) {
      setError(e.message);
    }
  }, [status]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const change = async (e, next) => {
    if (next === 'CANCELLED' && !window.confirm('Ariza bekor qilinsinmi? Mijozga bot orqali xabar boradi.')) return;
    try {
      const { enrollment } = await api.setEnrollmentStatus(e.id, next);
      setList((prev) => prev.map((x) => (x.id === enrollment.id ? enrollment : x)));
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (e) => {
    if (!window.confirm(`#${e.id} ariza butunlay o'chirilsinmi?`)) return;
    try {
      await api.deleteEnrollment(e.id);
      setList((prev) => prev.filter((x) => x.id !== e.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPaid = list.filter((e) => ['PAID', 'COMPLETED'].includes(e.status)).reduce((s, e) => s + e.price, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Kursga yozilganlar</h1>
          <p className="muted">Mini App orqali kelgan arizalar · holat o'zgarsa mijozga bot xabar yuboradi</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={load}><RefreshCw size={16} /> Yangilash</button>
      </div>

      <div className="stats">
        <div className="stat accent"><span>Yangi arizalar</span><b>{list.filter((e) => e.status === 'NEW').length}</b></div>
        <div className="stat"><span>Jami arizalar</span><b>{list.length}</b></div>
        <div className="stat"><span>To'langan (ro'yxatda)</span><b>{money(totalPaid)}</b></div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {[{ id: 'ALL', label: 'Barchasi' }, ...STATUSES].map((s) => (
            <button key={s.id} type="button" className={status === s.id ? 'active' : ''} onClick={() => setStatus(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>#</th><th>Sana</th><th>Mijoz</th><th>Kurs</th><th>Format</th><th>To'lov</th><th className="right">Narx</th><th>Izoh</th><th>Holati</th><th /></tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td><b>#{e.id}</b></td>
                <td className="nowrap">{dateTime(e.createdAt)}</td>
                <td>
                  <div className="strong">{e.customerName}</div>
                  <a className="muted small nowrap" href={`tel:${e.phone}`}>{e.phone}</a>
                  {e.user?.username && <div><a className="muted small" href={`https://t.me/${e.user.username}`} target="_blank" rel="noreferrer">@{e.user.username}</a></div>}
                </td>
                <td className="strong">{e.courseTitle}</td>
                <td><span className={`pill ${e.format === 'ONLINE' ? 'violet' : ''}`}>{e.format === 'ONLINE' ? 'Online' : 'Offline'}</span></td>
                <td className="nowrap">{e.paymentMethod === 'CASH' ? '💵 Naqd' : '💳 Karta'}</td>
                <td className="right nowrap strong">{money(e.price)}</td>
                <td className="muted small">{e.comment || '—'}</td>
                <td>
                  <select className={`status-select tone-${TONE[e.status]}`} value={e.status} onChange={(ev) => change(e, ev.target.value)}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </td>
                <td><button type="button" className="icon-btn danger" title="O'chirish" onClick={() => remove(e)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={10} className="empty-cell">Arizalar yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
