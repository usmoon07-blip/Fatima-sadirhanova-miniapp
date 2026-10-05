import { ArrowLeft } from 'lucide-react';
import OrderList from '../components/OrderList';
import { useStore } from '../store/StoreContext';

export default function Orders() {
  const { setScreen } = useStore();
  return (
    <div className="page no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Orqaga" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <h1 className="serif">Buyurtmalarim</h1>
        <span style={{ width: 40 }} />
      </div>
      <OrderList />
    </div>
  );
}
