import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* Mini App'dagi "uchuvchi doira" menyusi:
   faol bo'lim ostida chuqurcha, ichida gradient doira; bo'lim almashganda doira ko'tariladi,
   yoy bo'ylab uchadi va yangi chuqurchaga tushadi.
   Kompyuterda — chap panel (chuqurcha o'ng chetda), telefonda — pastki panel. */

const DURATION = 680;
const BALL = 46;
const DEPTH = 26;
const HW = 38; // chuqurcha yarim kengligi
const LIFT = 24;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const bell = (u) => (u <= -1 || u >= 1 ? 0 : (1 + Math.cos(Math.PI * u)) / 2);

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Faol element koordinatasini animatsiya bilan kuzatadi */
function useBallAnimation(target, activeIndex) {
  const [anim, setAnim] = useState({ pos: null, lift: 0, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
  const ref = useRef(anim);
  ref.current = anim;
  const raf = useRef(0);

  useEffect(() => {
    if (target == null) return undefined;
    const cur = ref.current;
    if (cur.pos == null || (cur.to === activeIndex && cur.t >= 1)) {
      setAnim((a) => ({ ...a, pos: target, to: activeIndex, from: activeIndex }));
      return undefined;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fromPos = cur.pos;
    const fromIndex = cur.t >= 1 ? cur.to : cur.from;
    const startLift = cur.lift;
    const duration = reduce ? 1 : DURATION;
    const start = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const t = clamp01((now - start) / duration);
      const lift = Math.max(Math.sin(Math.PI * t), startLift * (1 - t));
      setAnim({ pos: fromPos + (target - fromPos) * easeInOut(t), lift, t, from: fromIndex, to: activeIndex, landed: t >= 1 ? Date.now() : 0 });
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, activeIndex]);

  return anim;
}

function BallIcons({ items, anim, size = 20 }) {
  const fromOp = anim.from === anim.to ? 0 : 1 - clamp01(anim.t / 0.28);
  const toOp = anim.from === anim.to ? 1 : clamp01((anim.t - 0.62) / 0.38);
  const From = items[anim.from]?.Icon;
  const To = items[anim.to]?.Icon;
  return (
    <>
      {From && fromOp > 0 && <From size={size} strokeWidth={2.2} style={{ opacity: fromOp }} />}
      {To && <To size={size} strokeWidth={2.2} style={{ opacity: toOp }} />}
    </>
  );
}

/* ---------------- Kompyuter: chap panel ---------------- */
function SideNav({ items, active, onChange, header, footer }) {
  const wrapRef = useRef(null);
  const itemRefs = useRef([]);
  const [box, setBox] = useState({ w: 0, h: 0, centers: [] });
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === active));

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const centers = itemRefs.current.map((n) => {
        if (!n) return 0;
        const b = n.getBoundingClientRect();
        return b.top - r.top + b.height / 2;
      });
      setBox({ w: r.width, h: r.height, centers });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [items.length]);

  const anim = useBallAnimation(box.w ? box.centers[activeIndex] : null, activeIndex);
  const cy = anim.pos ?? box.centers[activeIndex] ?? 0;
  const depth = DEPTH * (1 - anim.lift);
  const W = box.w;
  const H = box.h;

  let path = '';
  if (W) {
    path = `M0 0 H${W}`;
    for (let y = 0; y <= H; y += 3) path += ` L${(W - depth * bell((y - cy) / HW)).toFixed(2)} ${y}`;
    path += ` L${W} ${H} H0 Z`;
  }
  const ballX = W - DEPTH + 5 + BALL / 2 + LIFT * anim.lift;
  const spacing = box.centers.length > 1 ? box.centers[1] - box.centers[0] : 48;

  return (
    <aside className="sidebar notch-side" ref={wrapRef}>
      {W > 0 && (
        <svg className="notch-shape" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
          <path d={path} />
        </svg>
      )}
      {W > 0 && (
        <div
          key={anim.landed || 'ball'}
          className={`notch-ball ${anim.landed ? 'landed' : ''}`}
          style={{ width: BALL, height: BALL, transform: `translate(${ballX - BALL / 2}px, ${cy - BALL / 2}px)` }}
          aria-hidden
        >
          <BallIcons items={items} anim={anim} />
        </div>
      )}
      <div className="notch-content">
        {header}
        <nav>
          {items.map(({ id, label, Icon, badge }, i) => {
            const near = clamp01(1 - Math.abs(cy - (box.centers[i] ?? -999)) / (spacing * 0.6));
            const hidden = near * (1 - anim.lift * 0.85);
            return (
              <button
                key={id}
                ref={(n) => { itemRefs.current[i] = n; }}
                type="button"
                className={i === activeIndex ? 'active' : ''}
                onClick={() => id !== active && onChange(id)}
                aria-current={i === activeIndex ? 'page' : undefined}
              >
                <span className="notch-icon" style={{ opacity: 1 - hidden, transform: `scale(${1 - hidden * 0.3})` }}><Icon size={18} /></span>
                <span className="notch-label">{label}</span>
                {badge > 0 && <span className="side-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        {footer}
      </div>
    </aside>
  );
}

/* ---------------- Telefon: pastki panel (Mini App bilan bir xil) ---------------- */
const BAR_H = 64;
const RADIUS = 24;
const PAD = 14;

function BottomNav({ items, active, onChange }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === active));

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spacing = width ? (width - PAD * 2) / items.length : 0;
  const centerOf = (i) => PAD + spacing * (i + 0.5);
  const anim = useBallAnimation(width ? centerOf(activeIndex) : null, activeIndex);
  const x = anim.pos ?? (width ? centerOf(activeIndex) : 0);
  const depth = DEPTH * (1 - anim.lift);
  const hw = Math.min(HW, spacing * 0.62);

  let path = '';
  if (width) {
    const W = width;
    const R = RADIUS;
    const y = (px) => (depth * bell((px - x) / hw)).toFixed(2);
    path = `M0 ${R} Q0 0 ${R} 0`;
    for (let px = R; px < W - R; px += 2.5) path += ` L${px.toFixed(1)} ${y(px)}`;
    path += ` L${W - R} ${y(W - R)} Q${W} 0 ${W} ${R} L${W} ${BAR_H - R} Q${W} ${BAR_H} ${W - R} ${BAR_H} L${R} ${BAR_H} Q0 ${BAR_H} 0 ${BAR_H - R} Z`;
  }
  const ballY = DEPTH - 5 - BALL / 2 - LIFT * anim.lift;

  return (
    <nav className="notch-bottom" aria-label="Menyu">
      <div className="notch-bottom-wrap" ref={wrapRef} style={{ height: BAR_H }}>
        {width > 0 && (
          <svg className="notch-shape" width={width} height={BAR_H} viewBox={`0 0 ${width} ${BAR_H}`} aria-hidden>
            <path d={path} />
          </svg>
        )}
        {width > 0 && (
          <div
            key={anim.landed || 'ball'}
            className={`notch-ball ${anim.landed ? 'landed' : ''}`}
            style={{ width: BALL, height: BALL, transform: `translate(${x - BALL / 2}px, ${ballY - BALL / 2}px)` }}
            aria-hidden
          >
            <BallIcons items={items} anim={anim} />
          </div>
        )}
        <div className="notch-bottom-items" style={{ padding: `0 ${PAD}px` }}>
          {items.map(({ id, short, label, Icon, badge }, i) => {
            const near = spacing ? clamp01(1 - Math.abs(x - centerOf(i)) / (spacing * 0.55)) : 0;
            const hidden = near * (1 - anim.lift * 0.85);
            return (
              <button key={id} type="button" className={i === activeIndex ? 'active' : ''} onClick={() => id !== active && onChange(id)} aria-label={label}>
                <span className="notch-icon" style={{ opacity: 1 - hidden, transform: `translateY(${hidden * 8}px) scale(${1 - hidden * 0.3})` }}>
                  <Icon size={20} />
                  {badge > 0 && <span className="side-badge dot">{badge}</span>}
                </span>
                <span className="notch-label">{short || label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function NotchNav(props) {
  const mobile = useMedia('(max-width: 860px)');
  return mobile ? <BottomNav {...props} /> : <SideNav {...props} />;
}
