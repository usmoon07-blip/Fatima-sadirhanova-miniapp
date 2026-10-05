import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { money } from '../lib/format';
import { closeApp, isTelegram } from '../lib/telegram';

export default function Success() {
  const { lastOrder, setScreen, goTo } = useStore();

  useEffect(() => {
    if (!isTelegram) return undefined;
    const t = setTimeout(closeApp, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="success">
      <div className="success-icon"><Check size={44} strokeWidth={3} /></div>
      <h1 className="serif">Buyurtmangiz qabul qilindi!</h1>
      {lastOrder && <p className="order-no">Buyurtma #{lastOrder.id} · {money(lastOrder.total)}</p>}
      <p className="muted">
        {lastOrder?.deliveryType === 'PICKUP'
          ? "Buyurtmangiz tayyor bo'lishi bilan botda xabar beramiz 🧁"
          : "Kuryerimiz tez orada siz bilan bog'lanadi 🧁"}
      </p>
      <div className="success-actions">
        {isTelegram ? (
          <button type="button" className="btn btn-primary btn-block" onClick={closeApp}>Yopish</button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('home')}>Bosh sahifaga</button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setScreen('orders')}>Buyurtmalarimni ko'rish</button>
      </div>
    </div>
  );
}
