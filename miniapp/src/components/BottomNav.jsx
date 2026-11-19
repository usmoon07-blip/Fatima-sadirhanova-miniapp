import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Award, GraduationCap, House, ShoppingBag, UserRound } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { haptic } from '../lib/telegram';

export const TABS = [
  { id: 'home', label: 'Bosh sahifa', Icon: House },
  { id: 'courses', label: 'Kurslar', Icon: GraduationCap },
  { id: 'cart', label: 'Savatcha', Icon: ShoppingBag },
  { id: 'results', label: 'Natijalar', Icon: Award },
  { id: 'profile', label: 'Profil', Icon: UserRound },
];

// O'lchamlar (px)
const BAR_H = 68; // panel balandligi
const RADIUS = 26; // burchaklar
const PAD = 18; // ichki chekka
const NOTCH_HW = 40; // chuqurcha yarim kengligi
const NOTCH_DEPTH = 27; // chuqurcha chuqurligi
const BALL = 50; // doira diametri
const BALL_REST_Y = NOTCH_DEPTH - 5 - BALL / 2; // doira markazi (panel tepasiga nisbatan)
const LIFT = 26; // o'tishda doira qancha ko'tariladi
const DURATION = 680;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Chuqurcha shakli: silliq "qo'ng'iroq" egri chizig'i */
function bell(u) {
  if (u <= -1 || u >= 1) return 0;
  return (1 + Math.cos(Math.PI * u)) / 2;
}

function buildPath(width, cx, depth) {
  const W = width;
  const H = BAR_H;
  const R = RADIUS;
  const y = (x) => (depth * bell((x - cx) / NOTCH_HW)).toFixed(2);
  let d = `M0 ${R} Q0 0 ${R} 0`;
  for (let x = R; x < W - R; x += 2.5) d += ` L${x.toFixed(1)} ${y(x)}`;
  d += ` L${W - R} ${y(W - R)} Q${W} 0 ${W} ${R} L${W} ${H - R} Q${W} ${H} ${W - R} ${H} L${R} ${H} Q0 ${H} 0 ${H - R} Z`;
  return d;
}

export default function BottomNav() {
  const { tab, setTab, cart, t } = useStore();
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === tab));

  // Animatsiya holati
  const [anim, setAnim] = useState({ x: null, lift: 0, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
  const animRef = useRef(anim);
  animRef.current = anim;
  const rafRef = useRef(0);

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

  // Faol tab o'zgarganda: doira ko'tariladi → yoy bo'ylab uchadi → yangi chuqurchaga tushadi
  useEffect(() => {
    if (!width) return undefined;
    const target = centerOf(activeIndex);
    const current = animRef.current;
    if (current.x == null) {
      setAnim({ x: target, lift: 0, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
      return undefined;
    }
    if (current.to === activeIndex && current.t >= 1) {
      // Faqat kenglik o'zgardi
      setAnim((a) => ({ ...a, x: target }));
      return undefined;
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fromX = current.x;
    const fromIndex = current.t >= 1 ? current.to : current.from;
    const startLift = current.lift;
    const duration = reduce ? 1 : DURATION;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = clamp01((now - start) / duration);
      const e = easeInOut(t);
      // Ko'tarilish: boshida tez, oxirida silliq tushish
      const arc = Math.sin(Math.PI * t);
      const lift = Math.max(arc, startLift * (1 - t));
      setAnim({ x: fromX + (target - fromX) * e, lift, t, from: fromIndex, to: activeIndex, landed: t >= 1 ? Date.now() : 0 });
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, width]);

  const x = anim.x ?? (width ? centerOf(activeIndex) : 0);
  const depth = NOTCH_DEPTH * (1 - anim.lift);
  const ballY = BALL_REST_Y - LIFT * anim.lift;
  const cartCount = cart.length;

  const onTap = (id) => {
    if (id === tab) return;
    haptic.select();
    setTab(id);
  };

  // Doira ichidagi ikonkalar: eskisi so'nadi, yangisi qo'nishda paydo bo'ladi
  const fromOpacity = anim.from === anim.to ? 0 : 1 - clamp01(anim.t / 0.28);
  const toOpacity = anim.from === anim.to ? 1 : clamp01((anim.t - 0.62) / 0.38);
  const FromIcon = TABS[anim.from]?.Icon;
  const ToIcon = TABS[anim.to]?.Icon;

  return (
    <nav className="bottom-nav" aria-label={t('mainMenu')}>
      <div className="nav-wrap" ref={wrapRef} style={{ height: BAR_H }}>
        {width > 0 && (
          <svg className="nav-shape" width={width} height={BAR_H} viewBox={`0 0 ${width} ${BAR_H}`} aria-hidden>
            <path d={buildPath(width, x, depth)} />
          </svg>
        )}

        {width > 0 && (
          <div
            key={anim.landed || 'ball'}
            className={`nav-ball ${anim.landed ? 'landed' : ''}`}
            style={{ width: BALL, height: BALL, transform: `translate(${x - BALL / 2}px, ${ballY - BALL / 2}px)` }}
            aria-hidden
          >
            {FromIcon && fromOpacity > 0 && <FromIcon size={22} strokeWidth={2.2} style={{ opacity: fromOpacity }} />}
            {ToIcon && <ToIcon size={22} strokeWidth={2.2} style={{ opacity: toOpacity }} />}
            {TABS[anim.to]?.id === 'cart' && cartCount > 0 && toOpacity > 0.5 && <span className="nav-badge on-ball">{cartCount}</span>}
          </div>
        )}

        <div className="nav-items" style={{ padding: `0 ${PAD}px` }}>
          {TABS.map(({ id, Icon }, i) => {
            const label = t(`nav_${id}`);
            const cx = width ? centerOf(i) : 0;
            const near = spacing ? clamp01(1 - Math.abs(x - cx) / (spacing * 0.55)) : 0;
            const hidden = near * (1 - anim.lift * 0.85);
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
                <span className="nav-icon" style={{ opacity: 1 - hidden, transform: `translateY(${hidden * 8}px) scale(${1 - hidden * 0.3})` }}>
                  <Icon size={22} strokeWidth={1.8} />
                  {id === 'cart' && cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                </span>
                <span className="nav-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
