import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import OrderList from '../components/OrderList';
import { useStore } from '../store/StoreContext';

export default function Orders() {
  const { setScreen, t } = useStore();
  const [count, setCount] = useState(null);
  return (
    <div className="page no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="←" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <div className="topbar-title">
          <h1 className="serif">{t.ordersTitle}</h1>
          {count != null && <small className="muted">{t.ordersCount(count)}</small>}
        </div>
        <span style={{ width: 40 }} />
      </div>
      <OrderList onCount={setCount} />
    </div>
  );
}
