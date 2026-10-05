import { Trash2 } from 'lucide-react';
import Img from '../components/Img';
import QtyStepper from '../components/QtyStepper';
import { useStore } from '../store/StoreContext';
import { shortMoney } from '../lib/format';
import { currency, loc } from '../lib/i18n';

export function Totals() {
  const {
    t, money, subtotal, cartCount,
  } = useStore();
  return (
    <div className="summary card">
      <div><span>{t.items} ({cartCount})</span><b>{money(subtotal)}</b></div>
      <div className="total"><span>{t.total}</span><b>{money(subtotal)}</b></div>
    </div>
  );
}

export default function Cart() {
  const {
    cartLines, subtotal, setQuantity, removeFromCart, goTo, setScreen, config, t, lang, money,
  } = useStore();

  if (!cartLines.length) {
    return (
      <div className="page">
        <div className="page-title"><h1 className="serif">{t.cartTitle}</h1></div>
        <div className="empty big">
          <div className="empty-emoji">🧁</div>
          <h3 className="serif">{t.cartEmptyTitle}</h3>
          <p className="muted">{t.cartEmptyText}</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('menu', { category: 'all' })}>{t.toMenu}</button>
        </div>
      </div>
    );
  }

  const { delivery } = config;
  const belowMin = delivery.minOrder && subtotal < delivery.minOrder;

  return (
    <div className="page with-cta">
      <div className="page-title">
        <h1 className="serif">{t.cartTitle}</h1>
        <p className="muted">{t.cartKinds(cartLines.length)}</p>
      </div>

      <div className="cart-list">
        {cartLines.map((line) => (
          <div className="cart-item" key={line.key}>
            <Img src={line.product.imageUrl} alt="" className="cart-thumb" />
            <div className="cart-info">
              <div className="cart-top">
                <h4>{loc(line.product, 'name', lang)}</h4>
                <button type="button" className="ghost-icon" aria-label="×" onClick={() => removeFromCart(line.key)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {line.size && <div className="muted small">{line.size}</div>}
              <div className="cart-bottom">
                <span className="new-price">{shortMoney(line.total)} <small>{currency(lang)}</small></span>
                <QtyStepper small value={line.quantity} onChange={(q) => setQuantity(line.key, q)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Totals />


      <div className="sticky-cta above-nav">
        {belowMin ? (
          <button type="button" className="btn btn-primary btn-block" disabled>{t.minOrder(money(delivery.minOrder))}</button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setScreen('checkout')}>
            {t.checkout} — {money(subtotal)}
          </button>
        )}
      </div>
    </div>
  );
}
