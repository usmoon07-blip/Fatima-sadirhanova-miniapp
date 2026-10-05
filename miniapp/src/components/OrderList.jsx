import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { api } from '../lib/api';
import { dateTime } from '../lib/format';
import { loc } from '../lib/i18n';
import { haptic, tg } from '../lib/telegram';
import { useStore } from '../store/StoreContext';

const TONE = {
  NEW: 'warn', CONFIRMED: 'info', PREPARING: 'info', READY: 'info', ON_THE_WAY: 'info', DELIVERED: 'ok', CANCELLED: 'bad',
};

function confirmDialog(text) {
  return new Promise((resolve) => {
    if (tg?.showConfirm && tg.isVersionAtLeast?.('6.2')) {
      try {
        tg.showConfirm(text, resolve);
        return;
      } catch { /* oddiy oynaga o'tamiz */ }
    }
    resolve(window.confirm(text));
  });
}

export default function OrderList({ onCount }) {
  const { reorder, t, lang, money, showToast, refreshMe } = useStore();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.myOrders().then((r) => {
      setOrders(r.orders);
      onCount?.(r.orders.length);
    }).catch((e) => setError(e.message));
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (order) => {
    if (!(await confirmDialog(t.cancelConfirm))) return;
    try {
      await api.cancelOrder(order.id);
      haptic.success();
      showToast(t.cancelled);
      refreshMe();
      load();
    } catch (e) {
      haptic.error();
      showToast(e.reason === 'TOO_LATE' ? t.tooLate : e.message, 'bad');
      load();
    }
  };

  if (error) return <p className="muted center">{error}</p>;
  if (!orders) return <div className="skeleton-list"><div /><div /></div>;
  if (!orders.length) {
    return (
      <div className="empty">
        <div className="empty-emoji">📜</div>
        <p className="muted">{t.noOrders}</p>
      </div>
    );
  }

  return (
    <div className="orders">
      {orders.map((o) => (
        <article key={o.id} className="order card">
          <div className="order-head">
            <div>
              <b>{t.orderNo(o.id)}</b>
              <div className="muted small">{dateTime(o.createdAt)}</div>
            </div>
            <span className={`status ${TONE[o.status]}`}>{t.status[o.status]}</span>
          </div>
          <div className="order-items small">
            {o.items.map((i) => `${loc(i, 'name', lang)}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`).join(' · ')}
          </div>
          <div className="order-foot">
            <b>{money(o.total)}</b>
            <div className="order-actions">
              {o.status === 'NEW' && (
                <button type="button" className="link-btn muted" onClick={() => cancel(o)}>
                  <X size={14} /> {t.cancel}
                </button>
              )}
              <button type="button" className="link-btn" onClick={() => reorder(o)}>
                <RotateCcw size={14} /> {t.reorder}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
