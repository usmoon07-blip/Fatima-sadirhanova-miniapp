import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Award, GraduationCap, House, ShoppingBag, UserRound } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { haptic } from '../lib/telegram';

export const TABS = [
  { id: 'home', Icon: House },
  { id: 'courses', Icon: GraduationCap },
  { id: 'cart', Icon: ShoppingBag },
  { id: 'results', Icon: Award },
  { id: 'profile', Icon: UserRound },
];

/* Videodagi uslub: to'q panel, chuqur U shaklidagi o'yiq, ichida panel rangidagi doira.
   Bo'lim almashganda doira va o'yiq birga yonga suriladi (oxirida yengil prujina). */
const BAR_H = 62;
const RADIUS = 22;
const PAD = 26;
const BALL_R = 25;
const GAP = 6; // doira va o'yiq orasidagi bo'shliq
const DEPTH = 50; // o'yiq chuqurligi
const NOTCH_R = BALL_R + GAP;
const BALL_CY = DEPTH - NOTCH_R; // doira markazi (panel tepasidan)
const WALL = 2.1; // o'yiq devorlari qiyaligi
const SHOULDER = 18; // yelkalar silliqligi
const DURATION = 560;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Yengil "prujina": oxirida biroz o'tib, qaytadi */
function easeOutBack(t) {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/** O'yiq chuqurligi: doira atrofidagi aylana + qiya devorlar, yelkalari silliqlangan */
function notchDepth(dx) {
  const a = Math.abs(dx);
  const u = a <= NOTCH_R ? BALL_CY + Math.sqrt(NOTCH_R * NOTCH_R - a * a) : BALL_CY - WALL * (a - NOTCH_R);
  // silliq maksimum(0, u)
  const k = SHOULDER;
  const h = clamp01(0.5 + (0.5 * u) / k);
  return u * h + k * h * (1 - h);
}

function buildPath(W, cx) {
  const H = BAR_H;
  const R = RADIUS;
  // Burchak yoyi va o'yiq bitta silliq chiziqqa birlashadi
  const corner = (x) => {
    if (x < R) return R - Math.sqrt(Math.max(0, R * R - (R - x) ** 2));
    if (x > W - R) return R - Math.sqrt(Math.max(0, R * R - (x - (W - R)) ** 2));
    return 0;
  };
  const smax = (a, b, k = 9) => {
    const h = clamp01(0.5 + (0.5 * (b - a)) / k);
    return a + (b - a) * h + k * h * (1 - h);
  };
  const top = (x) => smax(corner(x), notchDepth(x - cx)).toFixed(2);
  let d = `M0 ${top(0)}`;
  for (let x = 0.5; x < W; x += x < R || x > W - R ? 0.5 : 1.5) d += ` L${x.toFixed(1)} ${top(x)}`;
  d += ` L${W} ${top(W)} L${W} ${H - R} Q${W} ${H} ${W - R} ${H} L${R} ${H} Q0 ${H} 0 ${H - R} Z`;
  return d;
}

export default function BottomNav() {
  const { tab, setTab, cart, t } = useStore();
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(0, TABS.findIndex((x) => x.id === tab));
  const [anim, setAnim] = useState({ x: null, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
  const animRef = useRef(anim);
  animRef.current = anim;
  const raf = useRef(0);

  const spacing = width ? (width - PAD * 2) / TABS.length : 0;
  const centerOf = (i) => PAD + spacing * (i + 0.5);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return undefined;
    const target = centerOf(activeIndex);
    const cur = animRef.current;
    if (cur.x == null || (cur.to === activeIndex && cur.t >= 1)) {
      setAnim({ x: target, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
      return undefined;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fromX = cur.x;
    const fromIndex = cur.t >= 1 ? cur.to : cur.from;
    const start = performance.now();
    const duration = reduce ? 1 : DURATION;
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const tt = clamp01((now - start) / duration);
      setAnim({ x: fromX + (target - fromX) * easeOutBack(tt), t: tt, from: fromIndex, to: activeIndex, landed: tt >= 1 ? Date.now() : 0 });
      if (tt < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, width]);

  const x = anim.x ?? (width ? centerOf(activeIndex) : 0);
  const moving = anim.from !== anim.to && anim.t < 1;
  const fromOp = moving ? 1 - clamp01(anim.t / 0.22) : 0;
  const toOp = moving ? clamp01((anim.t - 0.6) / 0.35) : 1;
  const FromIcon = TABS[anim.from]?.Icon;
  const ToIcon = TABS[anim.to]?.Icon;
  const cartCount = cart.length;

  const onTap = (id) => {
    if (id === tab) return;
    haptic.select();
    setTab(id);
  };

  return (
    <nav className="bottom-nav" aria-label={t('mainMenu')}>
      <div className="nav-wrap" ref={wrapRef} style={{ height: BAR_H }}>
        {width > 0 && (
          <svg className="nav-shape" width={width} height={BAR_H} viewBox={`0 0 ${width} ${BAR_H}`} aria-hidden>
            <path d={buildPath(width, x)} />
          </svg>
        )}
        {width > 0 && (
          <div
            key={anim.landed || 'ball'}
            className={`nav-ball ${anim.landed ? 'landed' : ''}`}
            style={{ width: BALL_R * 2, height: BALL_R * 2, left: x - BALL_R, top: BALL_CY - BALL_R }}
            aria-hidden
          >
            {FromIcon && fromOp > 0 && <FromIcon size={22} strokeWidth={2.2} style={{ opacity: fromOp }} />}
            {ToIcon && <ToIcon size={22} strokeWidth={2.2} style={{ opacity: toOp }} />}
            {TABS[anim.to]?.id === 'cart' && cartCount > 0 && toOp > 0.5 && <span className="nav-badge on-ball">{cartCount}</span>}
          </div>
        )}
        <div className="nav-items" style={{ padding: `0 ${PAD}px` }}>
          {TABS.map(({ id, Icon }, i) => {
            const label = t(`nav_${id}`);
            const dx = width ? Math.abs(x - centerOf(i)) : 999;
            // o'yiq ichida qolgan ikonka ko'rinmaydi (doira uni ko'rsatadi)
            const hide = clamp01(1 - (dx - BALL_R * 0.5) / (NOTCH_R + 16 - BALL_R * 0.5));
            const isActive = i === activeIndex;
            return (
              <button
                key={id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onTap(id)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon" style={{ opacity: 1 - hide, transform: `scale(${1 - hide * 0.35})` }}>
                  <Icon size={23} strokeWidth={2} />
                  {id === 'cart' && cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
