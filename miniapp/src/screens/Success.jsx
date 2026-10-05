import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { closeApp, isTelegram } from '../lib/telegram';

export default function Success() {
  const { lastOrder, setScreen, goTo, t, money } = useStore();

  useEffect(() => {
    if (!isTelegram) return undefined;
    const timer = setTimeout(closeApp, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="success">
      <div className="success-icon"><Check size={44} strokeWidth={3} /></div>
      <h1 className="serif">{t.successTitle}</h1>
      {lastOrder && <p className="order-no">{t.orderNo(lastOrder.id)} · {money(lastOrder.total)}</p>}
      <p className="muted">{lastOrder?.deliveryType === 'PICKUP' ? t.successPickup : t.successDelivery}</p>
      <div className="success-actions">
        {isTelegram ? (
          <button type="button" className="btn btn-primary btn-block" onClick={closeApp}>{t.close}</button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('home')}>{t.toHome}</button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setScreen('orders')}>{t.viewOrders}</button>
      </div>
    </div>
  );
}
