import { Star } from 'lucide-react';

export default function Stars({ rating = 5, reviews, label, size = 12, count }) {
  // Sharhlar bo'lmasa yulduzchalar ko'rsatilmaydi (soxta reyting chiqmasin)
  if (!(count ?? reviews)) return null;
  const full = Math.round(rating);
  return (
    <div className="stars" aria-label={`${rating}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= full ? 'on' : ''} fill="currentColor" strokeWidth={0} />
      ))}
      {reviews != null && <span className="stars-count">{rating.toFixed(1)} ({reviews} {label})</span>}
    </div>
  );
}
