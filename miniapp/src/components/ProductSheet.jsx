import { useEffect, useState } from 'react';
import { ArrowLeft, ChefHat, Heart, Truck, Wheat } from 'lucide-react';
import Img from './Img';
import Stars from './Stars';
import QtyStepper from './QtyStepper';
import { Badge } from './ProductCard';
import { unitPrice, useStore } from '../store/StoreContext';
import { shortMoney } from '../lib/format';
import { altName, loc } from '../lib/i18n';

export default function ProductSheet() {
  const {
    sheetProductId, openProduct, productsById, addToCart, favorites, toggleFavorite, t, lang, money,
  } = useStore();
  const product = sheetProductId ? productsById.get(sheetProductId) : null;
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!product) return undefined;
    setSize(product.sizes?.[0]?.label || null);
    setQty(1);
    setClosing(false);
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [product]);

  if (!product) return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => openProduct(null), 220);
  };

  const name = loc(product, 'name', lang);
  const second = altName(product, lang);
  const description = loc(product, 'description', lang);
  const ingredients = loc(product, 'ingredients', lang);
  const { price } = unitPrice(product, size);
  const sizes = product.sizes || [];
  const isFav = favorites.includes(product.id);
  const sizeOld = product.oldPrice && sizes.length ? Math.round(product.oldPrice * (price / product.price)) : product.oldPrice;

  const onAdd = () => {
    addToCart(product, size, qty);
    close();
  };

  return (
    <div className={`sheet-backdrop ${closing ? 'closing' : ''}`} onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={name}>
        <div className="sheet-handle" />
        <div className="sheet-scroll">
          <div className="sheet-media">
            <Img src={product.imageUrl} alt={name} eager />
            <button type="button" className="icon-btn floating left" aria-label="←" onClick={close}><ArrowLeft size={20} /></button>
            <button type="button" className={`icon-btn floating right ${isFav ? 'fav' : ''}`} aria-label="♥" onClick={() => toggleFavorite(product.id)}>
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <Badge product={product} />
          </div>

          <div className="sheet-body">
            <h2 className="serif sheet-title">{name}</h2>
            {second && <div className="alt-name">{second}</div>}
            <div className="sheet-price-row">
              <span className="sheet-price">{money(price)}</span>
              {sizeOld > price && <s className="old-price">{shortMoney(sizeOld)}</s>}
              <Stars rating={product.rating} reviews={product.reviewsCount} label={t.reviews} size={13} />
            </div>

            {description && <p className="muted sheet-desc">{description}</p>}

            {ingredients.length > 0 && (
              <section className="sheet-section">
                <h4>{t.ingredients}</h4>
                <ul className="bullets">
                  {ingredients.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </section>
            )}

            {sizes.length > 0 && (
              <section className="sheet-section">
                <h4>{t.size}</h4>
                <div className="chips wrap">
                  {sizes.map((s) => (
                    <button key={s.label} type="button" className={`chip ${size === s.label ? 'active' : ''}`} onClick={() => setSize(s.label)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="features">
              <div><span><Wheat size={20} /></span>{t.featNatural}</div>
              <div><span><ChefHat size={20} /></span>{t.featMade}</div>
              <div><span><Truck size={20} /></span>{t.featDelivery}</div>
            </div>
          </div>
        </div>

        <div className="sticky-cta cta-row">
          <QtyStepper value={qty} onChange={setQty} min={1} />
          <button type="button" className="btn btn-primary grow" onClick={onAdd}>
            {t.addToCart(money(price * qty))}
          </button>
        </div>
      </div>
    </div>
  );
}
