import { Star } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export default function Stars({ value = 0, size = 14, onChange }) {
  const { t } = useStore();
  return (
    <span className={`stars ${onChange ? 'interactive' : ''}`} role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const icon = <Star size={size} strokeWidth={1.6} className={filled ? 'on' : ''} fill={filled ? 'currentColor' : 'none'} />;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={t('stars', { n })} role="radio" aria-checked={n === value}>
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </span>
  );
}
