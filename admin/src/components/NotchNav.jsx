import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* Bo'limlar menyusi.
   Faol bo'lim ostida yumshoq "suyuq" fon, ikonka o'rnida gradient doira (Mini App uslubida).
   Bo'lim almashganda doira bo'lim yozuvlari ustidan yoy bo'ylab uchib o'tadi,
   fon esa cho'zilib, yangi bo'limga oqib boradi.
   Kompyuterda — chap panel, telefonda — tepadagi ☰ tugmasi bilan ochiladigan ro'yxat. */

const DURATION = 620;
const BALL = 34;
const ARC = 64; // doira yozuvlar ustidan qancha o'ngga uchadi

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;

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
  const [rows, setRows] = useState([]); // [{top, height}]
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === active));
  const [anim, setAnim] = useState({ from: activeIndex, to: activeIndex, t: 1, landed: 0 });
  const animRef = useRef(anim);
  animRef.current = anim;
  const raf = useRef(0);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const measure = () => setRows(rowRefs.current.map((n) => (n ? { top: n.offsetTop, height: n.offsetHeight } : { top: 0, height: 0 })));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    const cur = animRef.current;
    if (cur.to === activeIndex) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = cur.t >= 1 ? cur.to : cur.to; // davom etayotgan bo'lsa ham oxirgi nishondan boshlaymiz
    const start = performance.now();
    const duration = reduce ? 1 : DURATION;
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const t = clamp01((now - start) / duration);
      setAnim({ from, to: activeIndex, t, landed: t >= 1 ? Date.now() : 0 });
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [activeIndex]);

  const A = rows[anim.from];
  const B = rows[anim.to];
  let pill = null;
  let ball = null;
  if (A && B) {
    const down = B.top >= A.top;
    // Suyuq fon: oldingi cheti tez, orqa cheti sekin — cho'zilib oqadi
    const lead = easeOut(anim.t);
    const trail = easeIn(anim.t);
    const aTop = A.top; const aBot = A.top + A.height;
    const bTop = B.top; const bBot = B.top + B.height;
    const top = down ? aTop + (bTop - aTop) * trail : aTop + (bTop - aTop) * lead;
    const bottom = down ? aBot + (bBot - aBot) * lead : aBot + (bBot - aBot) * trail;
    pill = { top, height: Math.max(bottom - top, 10) };
    // Doira: vertikal silliq, gorizontal yoy (yozuvlar ustidan)
    const e = easeInOut(anim.t);
    const cyA = A.top + A.height / 2;
    const cyB = B.top + B.height / 2;
    ball = { x: 14 + ARC * Math.sin(Math.PI * anim.t), y: cyA + (cyB - cyA) * e, lift: Math.sin(Math.PI * anim.t) };
  }

  const moving = anim.t < 1 && anim.from !== anim.to;
  const fromOp = moving ? 1 - clamp01(anim.t / 0.3) : 0;
  const toOp = moving ? clamp01((anim.t - 0.6) / 0.4) : 1;
  const From = items[anim.from]?.Icon;
  const To = items[anim.to]?.Icon;

  return (
    <nav className="section-list" ref={listRef}>
      {pill && <span className="section-pill" style={{ top: pill.top, height: pill.height }} aria-hidden />}
      {ball && (
        <span
          key={anim.landed || 'ball'}
          className={`section-ball ${anim.landed ? 'landed' : ''}`}
          style={{
            width: BALL,
            height: BALL,
            transform: `translate(${ball.x}px, ${ball.y - BALL / 2}px) scale(${1 + ball.lift * 0.12})`,
          }}
          aria-hidden
        >
          {From && fromOp > 0 && <From size={17} strokeWidth={2.2} style={{ opacity: fromOp }} />}
          {To && <To size={17} strokeWidth={2.2} style={{ opacity: toOp }} />}
        </span>
      )}
      {items.map(({ id, label, Icon, badge }, i) => {
        const isActive = i === activeIndex;
        // Doira ustidan o'tayotgan qatorning ikonkasi biroz so'nadi
        let hide = 0;
        if (i === anim.to) hide = moving ? clamp01((anim.t - 0.8) / 0.2) : 1; // doira qo'nganda yashiriladi
        else if (i === anim.from && moving) hide = 1 - clamp01(anim.t / 0.2); // doira ketishi bilan qaytadi
        else if (ball && rows[i]) {
          const dy = Math.abs(ball.y - (rows[i].top + rows[i].height / 2));
          hide = clamp01(1 - dy / 30) * 0.35;
        }
        return (
          <button
            key={id}
            ref={(n) => { rowRefs.current[i] = n; }}
            type="button"
            className={`section-item ${isActive ? 'active' : ''}`}
            onClick={() => id !== active && onChange(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="section-icon" style={{ opacity: 1 - hide }}><Icon size={18} /></span>
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
    setTimeout(() => setOpen(false), DURATION + 80); // animatsiyani ko'rib, keyin yopiladi
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
