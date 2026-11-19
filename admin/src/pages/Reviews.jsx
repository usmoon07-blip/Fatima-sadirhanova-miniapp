import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import Toggle from '../components/Toggle';
import { api, dateTime, fullName } from '../api';

export default function Reviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.reviews()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (r) => {
    try {
      await api.setReviewVisible(r.id, !r.isVisible);
      setItems((list) => list.map((x) => (x.id === r.id ? { ...x, isVisible: !r.isVisible } : x)));
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (r) => {
    if (!window.confirm("Izoh o'chirilsinmi?")) return;
    try {
      await api.deleteReview(r.id);
      setItems((list) => list.filter((x) => x.id !== r.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Izohlar</h1>
          <p className="muted">Kursni sotib olgan o'quvchilar qoldirgan izohlar. Keraksizini yashirishingiz mumkin.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>O'quvchi</th>
              <th>Kurs</th>
              <th>Baho</th>
              <th>Izoh</th>
              <th>Ko'rinsin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className={r.isVisible ? '' : 'dim'}>
                <td className="nowrap">{dateTime(r.createdAt)}</td>
                <td>
                  <b>{fullName(r.user)}</b>
                  <small>{r.user?.username ? `@${r.user.username}` : r.user?.phone || ''}</small>
                </td>
                <td>{r.course?.title}</td>
                <td className="nowrap stars-cell">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? 'currentColor' : 'none'} />)}
                </td>
                <td className="review-text">{r.text}</td>
                <td><Toggle checked={r.isVisible} onChange={() => toggle(r)} /></td>
                <td><button type="button" className="icon-btn danger" onClick={() => remove(r)} aria-label="O'chirish"><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {!items.length && !loading && <tr><td colSpan={7} className="empty-cell">Hali izohlar yo'q</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
