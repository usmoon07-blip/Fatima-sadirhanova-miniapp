import { Trash2 } from 'lucide-react';
import Img from '../components/Img';
import QtyStepper from '../components/QtyStepper';
import { useStore } from '../store/StoreContext';
import { money, shortMoney } from '../lib/format';

export default function Cart() {
  const {
    cartLines, subtotal, setQuantity, removeFromCart, catalog, addToCart, goTo, setScreen, config,
  } = useStore();

  const upsell = catalog.products.find((p) => p.isUpsell);
  const upsellLine = upsell && cartLines.find((l) => l.productId === upsell.id);
  const toggleUpsell = () => {
    if (!upsell) return;
    if (upsellLine) removeFromCart(upsellLine.key);
    else addToCart(upsell, null, 1, { silent: true });
  };

  if (!cartLines.length) {
    return (
      <div className="page">
        <div className="page-title"><h1 className="serif">Savatcha</h1></div>
        <div className="empty big">
          <div className="empty-emoji">🧁</div>
          <h3 className="serif">Savatchangiz bo'sh</h3>
          <p className="muted">Sevimli shirinliklaringizni tanlang — biz ularni sevgi bilan tayyorlaymiz.</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('catalog')}>Katalogga o'tish</button>
        </div>
      </div>
    );
  }

  const { delivery } = config;
  const left = delivery.freeFrom ? delivery.freeFrom - subtotal : 0;
  const belowMin = delivery.minOrder && subtotal < delivery.minOrder;

  return (
    <div className="page with-cta">
      <div className="page-title"><h1 className="serif">Savatcha</h1></div>

      <div className="cart-list">
        {cartLines.map((line) => (
          <div className="cart-item" key={line.key}>
            <Img src={line.product.imageUrl} alt={line.product.name} className="cart-thumb" />
            <div className="cart-info">
              <div className="cart-top">
                <h4>{line.product.name}</h4>
                <button type="button" className="ghost-icon" aria-label="O'chirish" onClick={() => removeFromCart(line.key)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {line.size && <div className="muted small">{line.size}</div>}
              <div className="cart-bottom">
                <span className="new-price">{shortMoney(line.total)} <small>so'm</small></span>
                <QtyStepper small value={line.quantity} onChange={(q) => setQuantity(line.key, q)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {upsell && (
        <label className="upsell">
          <Img src={upsell.imageUrl} alt={upsell.name} className="upsell-img" emoji="☕" />
          <span className="upsell-text">
            Bunga qo'shimcha ravishda <b>{upsell.name}</b>ni atigi <b className="accent">{money(upsell.price)}</b>ga qo'shasizmi?
          </span>
          <span className={`switch ${upsellLine ? 'on' : ''}`}>
            <input type="checkbox" checked={Boolean(upsellLine)} onChange={toggleUpsell} />
            <i />
          </span>
        </label>
      )}

      {left > 0 && (
        <div className="hint">
          🚚 Bepul yetkazib berish uchun yana <b>{money(left)}</b> lik xarid qiling
          <div className="progress"><i style={{ width: `${Math.min(100, (subtotal / delivery.freeFrom) * 100)}%` }} /></div>
        </div>
      )}

      <div className="summary card">
        <div><span>Mahsulotlar</span><b>{money(subtotal)}</b></div>
        <div className="muted small">Yetkazib berish narxi keyingi qadamda hisoblanadi</div>
      </div>

      <div className="sticky-cta above-nav">
        {belowMin ? (
          <button type="button" className="btn btn-primary btn-block" disabled>
            Minimal buyurtma: {money(delivery.minOrder)}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setScreen('checkout')}>
            Rasmiylashtirish · {money(subtotal)}
          </button>
        )}
      </div>
    </div>
  );
}
