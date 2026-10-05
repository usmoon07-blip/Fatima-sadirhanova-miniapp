import { useState } from 'react';
import { LoaderCircle, Ticket, Trash2, X } from 'lucide-react';
import Img from '../components/Img';
import QtyStepper from '../components/QtyStepper';
import { useStore } from '../store/StoreContext';
import { shortMoney } from '../lib/format';
import { currency, loc } from '../lib/i18n';

export function Totals({ deliveryType }) {
  const {
    t, money, subtotal, discount, promo, deliveryFeeFor, cartCount,
  } = useStore();
  const fee = deliveryFeeFor(deliveryType);
  return (
    <div className="summary card">
      <div><span>{t.items} ({cartCount})</span><b>{money(subtotal)}</b></div>
      {discount > 0 && <div className="discount-row"><span>{t.discount} · {promo.code}</span><b>−{money(discount)}</b></div>}
      {deliveryType === 'DELIVERY' && <div><span>{t.delivery}</span><b>{fee ? money(fee) : t.free}</b></div>}
      <div className="total"><span>{t.total}</span><b>{money(subtotal - discount + fee)}</b></div>
    </div>
  );
}

function PromoBox() {
  const { t, promo, setPromo, applyPromo } = useStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (promo?.code) {
    return (
      <div className={`promo-applied ${promo.error ? 'bad' : ''}`}>
        <Ticket size={18} />
        <span>
          <b>{promo.code}</b>
          {promo.error && <small>{promo.error}</small>}
        </span>
        <button type="button" onClick={() => setPromo(null)} aria-label={t.removePromo}><X size={16} /></button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const ok = await applyPromo(code.trim());
    setBusy(false);
    if (ok) setCode('');
  };

  return (
    <form className="promo-box" onSubmit={submit}>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t.promoPlaceholder} autoCapitalize="characters" />
      <button type="submit" className="btn btn-soft" disabled={busy || !code.trim()}>
        {busy ? <LoaderCircle size={16} className="spin" /> : t.apply}
      </button>
    </form>
  );
}

export default function Cart() {
  const {
    cartLines, subtotal, discount, setQuantity, removeFromCart, catalog, addToCart, goTo, setScreen, config, t, lang, money,
    deliveryType, deliveryFeeFor,
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
  const net = subtotal - discount;
  const left = delivery.freeFrom ? delivery.freeFrom - net : 0;
  const belowMin = delivery.minOrder && subtotal < delivery.minOrder;
  const upsellParts = upsell ? t.upsell(loc(upsell, 'name', lang), money(upsell.price)) : [];

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

      {upsell && (
        <label className="upsell">
          <Img src={upsell.imageUrl} alt="" className="upsell-img" emoji="☕" />
          <span className="upsell-text">
            {upsellParts[0]}<b>{upsellParts[1]}</b>{upsellParts[2]}<b className="accent">{upsellParts[3]}</b>{upsellParts[4]}
          </span>
          <span className={`switch ${upsellLine ? 'on' : ''}`}>
            <input type="checkbox" checked={Boolean(upsellLine)} onChange={toggleUpsell} />
            <i />
          </span>
        </label>
      )}

      <PromoBox />

      <Totals deliveryType={deliveryType} />

      {delivery.freeFrom > 0 && deliveryType === 'DELIVERY' && (
        <div className="hint">
          {left > 0 ? t.freeLeft(money(left)) : t.freeReached}
          <div className="progress"><i style={{ width: `${Math.min(100, (net / delivery.freeFrom) * 100)}%` }} /></div>
        </div>
      )}

      <div className="sticky-cta above-nav">
        {belowMin ? (
          <button type="button" className="btn btn-primary btn-block" disabled>{t.minOrder(money(delivery.minOrder))}</button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={() => setScreen('checkout')}>
            {t.checkout} — {money(net + deliveryFeeFor(deliveryType))}
          </button>
        )}
      </div>
    </div>
  );
}
