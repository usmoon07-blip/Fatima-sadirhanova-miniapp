import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Img from './Img';
import { api } from '../lib/api';
import { dateTime, money, STATUS } from '../lib/format';
import { useStore } from '../store/StoreContext';

export default function OrderList({ limit }) {
  const { reorder } = useStore();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myOrders().then((r) => setOrders(r.orders)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="muted center">{error}</p>;
  if (!orders) return <div className="skeleton-list"><div /><div /></div>;
  if (!orders.length) {
    return (
      <div className="empty">
        <div className="empty-emoji">📜</div>
        <p className="muted">Hali buyurtmalar yo'q</p>
      </div>
    );
  }

  return (
    <div className="orders">
      {orders.slice(0, limit || orders.length).map((o) => {
        const st = STATUS[o.status] || STATUS.NEW;
        return (
          <article key={o.id} className="order card">
            <div className="order-head">
              <div>
                <b>#{o.id}</b>
                <div className="muted small">{dateTime(o.createdAt)}</div>
              </div>
              <span className={`status ${st.tone}`}>{st.label}</span>
            </div>
            <div className="order-thumbs">
              {o.items.slice(0, 4).map((i) => (
                <Img key={`${i.productId}-${i.size}`} src={i.imageUrl} alt={i.name} className="order-thumb" />
              ))}
              {o.items.length > 4 && <span className="more">+{o.items.length - 4}</span>}
            </div>
            <div className="order-items muted small">
              {o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`).join(', ')}
            </div>
            <div className="order-foot">
              <b>{money(o.total)}</b>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => reorder(o)}>
                <RotateCcw size={15} /> Yana shundan buyurtma qilish
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
