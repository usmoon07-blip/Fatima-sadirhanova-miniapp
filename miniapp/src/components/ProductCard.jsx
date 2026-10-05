import { Plus } from 'lucide-react';
import Img from './Img';
import Stars from './Stars';
import { useStore } from '../store/StoreContext';
import { discountPercent, shortMoney } from '../lib/format';
import { currency, loc } from '../lib/i18n';

export function Badge({ product }) {
  const off = discountPercent(product);
  const text = product.badge || (off ? `-${off}%` : null);
  if (!text) return null;
  const isSale = text.trim().startsWith('-');
  return <span className={`badge ${isSale ? 'sale' : ''}`}>{text}</span>;
}

export default function ProductCard({ product, compact = false }) {
  const { openProduct, addToCart, lang } = useStore();
  const name = loc(product, 'name', lang);
  const quickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, null, 1);
  };

  return (
    <article className={`pcard ${compact ? 'compact' : ''}`} onClick={() => openProduct(product.id)}>
      <div className="pcard-media">
        <Img src={product.imageUrl} alt={name} />
        <Badge product={product} />
      </div>
      <div className="pcard-body">
        <h3 className="pcard-title">{name}</h3>
        <Stars rating={product.rating} size={11} count={product.reviewsCount} />
        <div className="pcard-bottom">
          <div className="price-col">
            {product.oldPrice > product.price && <s className="old-price">{shortMoney(product.oldPrice)}</s>}
            <span className="new-price">{shortMoney(product.price)} <small>{currency(lang)}</small></span>
          </div>
          <button className="add-btn" type="button" aria-label="+" onClick={quickAdd}>
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </article>
  );
}
