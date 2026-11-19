import { useState } from 'react';
import { mediaUrl } from '../lib/api';

/** Rasm: yuklanguncha shimmer, xato bo'lsa chiroyli zaxira fon */
export default function Img({ src, alt = '', className = '', emoji = '🧁', eager = false }) {
  const [state, setState] = useState(src ? 'loading' : 'error');
  return (
    <div className={`img ${state} ${className}`}>
      {state !== 'error' && (
        <img
          src={mediaUrl(src)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      )}
      {state === 'error' && <span className="img-fallback" aria-hidden>{emoji}</span>}
    </div>
  );
}
