import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* Bo'limlar menyusi — Mini App'dagi videodagi uslubning vertikal ko'rinishi:
   chapda to'q tasma, faol bo'lim qarshisida chuqur U shaklidagi o'yiq va ichida tasma rangidagi doira.
   Bo'lim almashganda doira va o'yiq birga yuqoriga/pastga suriladi (oxirida yengil prujina).
   Kompyuterda — chap panel, telefonda — tepadagi ☰ tugmasi bilan ochiladigan ro'yxat. */

const RAIL_W = 60;
const RAIL_R = 22;
const BALL_R = 21;
const GAP = 5;
const DEPTH = 44;
const NOTCH_R = BALL_R + GAP;
const BALL_C = DEPTH - NOTCH_R; // doira markazi tasmaning o'ng chetidan chapga
const WALL = 2.1;
const SHOULDER = 16;
const DURATION = 560;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
function easeOutBack(t) {
  const c1 = 1.25;
  return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
function smax(a, b, k) {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return a + (b - a) * h + k * h * (1 - h);
}
function notchDepth(d) {
  const a = Math.abs(d);
  const u = a <= NOTCH_R ? BALL_C + Math.sqrt(NOTCH_R * NOTCH_R - a * a) : BALL_C - WALL * (a - NOTCH_R);
  return smax(0, u, SHOULDER);
}

/** Vertikal tasma: o'ng chetida o'yiq (cy — o'yiq markazi) */
function railPath(H, cy) {
  const W = RAIL_W;
  const R = RAIL_R;
  const corner = (y) => {
    if (y < R) return R - Math.sqrt(Math.max(0, R * R - (R - y) ** 2));
    if (y > H - R) return R - Math.sqrt(Math.max(0, R * R - (y - (H - R)) ** 2));
    return 0;
  };
  const xAt = (y) => (W - smax(corner(y), notchDepth(y - cy), 9)).toFixed(2);
  let d = `M${R} 0 L${xAt(0)} 0`;
  for (let y = 0.5; y < H; y += y < R || y > H - R ? 0.5 : 1.5) d += ` L${xAt(y)} ${y.toFixed(1)}`;
  d += ` L${xAt(H)} ${H} L${R} ${H} Q0 ${H} 0 ${H - R} L0 ${R} Q0 0 ${R} 0 Z`;
  return d;
}

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

function SectionList({ items, active, onChange }) {
  const listRef = useRef(null);
  const rowRefs = useRef([]);
  const [geo, setGeo] = useState({ h: 0, centers: [] });
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === active));
  const [anim, setAnim] = useState({ y: null, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
  const animRef = useRef(anim);
  animRef.current = anim;
  const raf = useRef(0);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const measure = () => setGeo({
      h: el.offsetHeight,
      centers: rowRefs.current.map((n) => (n ? n.offsetTop + n.offsetHeight / 2 : 0)),
    });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!geo.h) return undefined;
    const target = geo.centers[activeIndex];
    const cur = animRef.current;
    if (cur.y == null || (cur.to === activeIndex && cur.t >= 1)) {
      setAnim({ y: target, t: 1, from: activeIndex, to: activeIndex, landed: 0 });
      return undefined;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fromY = cur.y;
    const fromIndex = cur.t >= 1 ? cur.to : cur.from;
    const start = performance.now();
    const duration = reduce ? 1 : DURATION;
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const t = clamp01((now - start) / duration);
      setAnim({ y: fromY + (target - fromY) * easeOutBack(t), t, from: fromIndex, to: activeIndex, landed: t >= 1 ? Date.now() : 0 });
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, geo]);

  const cy = anim.y ?? geo.centers[activeIndex] ?? 0;
  const moving = anim.from !== anim.to && anim.t < 1;
  const fromOp = moving ? 1 - clamp01(anim.t / 0.22) : 0;
  const toOp = moving ? clamp01((anim.t - 0.6) / 0.35) : 1;
  const From = items[anim.from]?.Icon;
  const To = items[anim.to]?.Icon;

  return (
    <nav className="section-list" ref={listRef}>
      {geo.h > 0 && (
        <svg className="rail-shape" width={RAIL_W} height={geo.h} viewBox={`0 0 ${RAIL_W} ${geo.h}`} aria-hidden>
          <path d={railPath(geo.h, cy)} />
        </svg>
      )}
      {geo.h > 0 && (
        <span
          key={anim.landed || 'ball'}
          className={`rail-ball ${anim.landed ? 'landed' : ''}`}
          style={{ width: BALL_R * 2, height: BALL_R * 2, left: RAIL_W - BALL_C - BALL_R, top: cy - BALL_R }}
          aria-hidden
        >
          {From && fromOp > 0 && <From size={18} strokeWidth={2.2} style={{ opacity: fromOp }} />}
          {To && <To size={18} strokeWidth={2.2} style={{ opacity: toOp }} />}
        </span>
      )}
      {items.map(({ id, label, Icon, badge }, i) => {
        const isActive = i === activeIndex;
        const dy = geo.centers[i] != null ? Math.abs(cy - geo.centers[i]) : 999;
        const hide = clamp01(1 - (dy - BALL_R * 0.5) / (NOTCH_R + 12 - BALL_R * 0.5));
        return (
          <button
            key={id}
            ref={(n) => { rowRefs.current[i] = n; }}
            type="button"
            className={`section-item ${isActive ? 'active' : ''}`}
            onClick={() => id !== active && onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            style={{ paddingLeft: RAIL_W + 22 }}
          >
            <span className="rail-icon" style={{ left: RAIL_W / 2 - 9, opacity: 1 - hide, transform: `scale(${1 - hide * 0.35})` }}><Icon size={18} /></span>
            <span className="section-label">{label}</span>
            {badge > 0 && <span className="side-badge">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- Kompyuter: chap panel ---------------- */
function SideNav({ items, active, onChange, header, footer }) {
  return (
    <aside className="sidebar">
      {header}
      <SectionList items={items} active={active} onChange={onChange} />
      {footer}
    </aside>
  );
}

/* ---------------- Telefon: tepada ☰ tugmasi, bo'limlar ro'yxati ---------------- */
function TopMenu({ items, active, onChange, brand, actions }) {
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === active);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setTimeout(() => setOpen(false), DURATION + 120); // animatsiyani ko'rib, keyin yopiladi
  };

  return (
    <>
      <header className="mobile-top">
        <button type="button" className={`burger ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="Bo'limlar" aria-expanded={open}>
          <span /><span /><span />
        </button>
        {brand}
        <div className="mobile-title">
          <small>Fatima Sadirkhanova</small>
          <b>{current?.label}</b>
        </div>
        {actions}
      </header>
      <div className={`menu-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} aria-hidden={!open} />
      <div className={`menu-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <SectionList items={items} active={active} onChange={pick} />
      </div>
    </>
  );
}

export default function NotchNav({ items, active, onChange, header, footer, brand, actions }) {
  const mobile = useMedia('(max-width: 860px)');
  return mobile
    ? <TopMenu items={items} active={active} onChange={onChange} brand={brand} actions={actions} />
    : <SideNav items={items} active={active} onChange={onChange} header={header} footer={footer} />;
}
