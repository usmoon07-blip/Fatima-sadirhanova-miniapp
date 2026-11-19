import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { api, money } from '../api';

const PERIODS = [
  { id: '7', label: '7 kun' },
  { id: '30', label: '30 kun' },
  { id: '90', label: '90 kun' },
  { id: 'all', label: 'Butun davr' },
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const LANG_NAMES = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const compact = (n) => {
  if (n >= 1e9) return `${Math.round(n / 1e8) / 10} mlrd`;
  if (n >= 1e6) return `${Math.round(n / 1e5) / 10} mln`;
  if (n >= 1e4) return `${Math.round(n / 1e3)} ming`;
  return fmt(n);
};
const dayLabel = (iso) => {
  const [, m, d] = iso.split('-');
  return `${Number(d)}-${MONTHS[Number(m) - 1]}`;
};
/** Chiroyli o'q qiymati: 1, 2, 5 × 10^n */
function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function Change({ value, invert = false }) {
  if (value == null) return null;
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`delta ${good ? 'up' : 'down'}`}>
      <Icon size={13} /> {value > 0 ? '+' : ''}{value}%
    </span>
  );
}

function Tile({ label, value, sub, change, invert, accent }) {
  return (
    <div className={`kpi ${accent ? 'accent' : ''}`}>
      <small>{label}</small>
      <b>{value}</b>
      <div className="kpi-foot">
        {change !== undefined && <Change value={change} invert={invert} />}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/** Kunlik tushum — ustunli grafik, kursor ostida tooltip */
function RevenueChart({ data }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(700);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const H = 220;
  const pad = { l: 56, r: 8, t: 12, b: 26 };
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const innerW = Math.max(width - pad.l - pad.r, 50);
  const innerH = H - pad.t - pad.b;
  const slot = innerW / data.length;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v) => pad.t + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70)));
  const total = data.reduce((s, d) => s + d.revenue, 0);

  if (!total) return <div className="chart-empty">Bu davrda to'langan arizalar yo'q</div>;

  const h = hover != null ? data[hover] : null;
  const hx = hover != null ? pad.l + slot * hover + slot / 2 : 0;

  return (
    <div className="chart" ref={wrapRef} onMouseLeave={() => setHover(null)}>
      <svg width={width} height={H} role="img" aria-label="Kunlik tushum grafigi">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis">{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + slot * i + (slot - barW) / 2;
          const bh = Math.max(0, y(0) - y(d.revenue));
          const r = Math.min(4, barW / 2, bh);
          return (
            <g key={d.date}>
              {bh > 0 && (
                <path
                  className={`bar ${hover === i ? 'on' : ''}`}
                  d={`M${x},${y(0)} V${y(d.revenue) + r} Q${x},${y(d.revenue)} ${x + r},${y(d.revenue)} H${x + barW - r} Q${x + barW},${y(d.revenue)} ${x + barW},${y(d.revenue) + r} V${y(0)} Z`}
                />
              )}
              {i % labelEvery === 0 && <text x={pad.l + slot * i + slot / 2} y={H - 8} textAnchor="middle" className="axis">{dayLabel(d.date)}</text>}
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
        <line x1={pad.l} x2={width - pad.r} y1={y(0)} y2={y(0)} className="baseline" />
      </svg>
      {h && (
        <div className="tooltip" style={{ left: Math.min(Math.max(hx, 90), width - 90), top: Math.max(y(h.revenue) - 74, 0) }}>
          <b>{dayLabel(h.date)}</b>
          <span>Tushum: <b>{money(h.revenue)}</b></span>
          <span>Arizalar: {h.orders} · to'langan: {h.paid}</span>
        </div>
      )}
    </div>
  );
}

/** Gorizontal ustunlar ro'yxati (bitta rang, qiymat oxirida) */
function BarList({ rows, format = fmt, max }) {
  const m = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="barlist">
      {rows.map((r) => (
        <div key={r.key || r.label} className="barlist-row" title={`${r.label}: ${format(r.value)}`}>
          <span className="barlist-label">{r.label}</span>
          <span className="barlist-track"><i style={{ width: `${m ? (r.value / m) * 100 : 0}%` }} /></span>
          <span className="barlist-value">{format(r.value)}{r.note && <small>{r.note}</small>}</span>
        </div>
      ))}
    </div>
  );
}

/** Kichik ustunli grafik (soatlar / hafta kunlari) */
function MiniColumns({ rows, labelOf, every = 1 }) {
  const max = Math.max(...rows.map((r) => r.orders), 1);
  const peak = rows.reduce((a, b) => (b.orders > a.orders ? b : a), rows[0]);
  return (
    <div className="mini-cols">
      {rows.map((r, i) => (
        <div key={i} className="mini-col" title={`${labelOf(r)}: ${r.orders} ta ariza`}>
          <span className="mini-col-bar"><i className={r === peak && r.orders ? 'peak' : ''} style={{ height: `${(r.orders / max) * 100}%` }} /></span>
          <small>{i % every === 0 ? labelOf(r) : ''}</small>
        </div>
      ))}
    </div>
  );
}

function StatusBar({ s }) {
  const parts = [
    { key: 'paid', label: "To'langan", value: s.paid, cls: 'st-good' },
    { key: 'pending', label: 'Kutilmoqda', value: s.pending, cls: 'st-warn' },
    { key: 'cancelled', label: 'Bekor qilingan', value: s.cancelled, cls: 'st-bad' },
  ];
  const total = s.orders || 1;
  return (
    <div>
      <div className="stack">
        {parts.filter((p) => p.value > 0).map((p) => (
          <i key={p.key} className={p.cls} style={{ flexGrow: p.value }} title={`${p.label}: ${p.value}`} />
        ))}
        {!s.orders && <i className="st-empty" style={{ flexGrow: 1 }} />}
      </div>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.key}><i className={p.cls} /> {p.label} <b>{p.value}</b> <small>({Math.round((p.value / total) * 100)}%)</small></span>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.analytics(period)
      .then((d) => { setData(d); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const topCourse = useMemo(() => data?.courses.find((c) => c.paid > 0), [data]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Statistika</h1>
          <p className="muted">Sotuvlar, kurslar va mijozlar bo'yicha asosiy ko'rsatkichlar</p>
        </div>
        <div className="head-actions">
          <div className="tabs no-margin">
            {PERIODS.map((p) => (
              <button key={p.id} type="button" className={period === p.id ? 'on' : ''} onClick={() => setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
          <button type="button" className="btn btn-outline" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Yangilash</button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!data && !error && <div className="muted">Yuklanmoqda...</div>}

      {data && (
        <>
          <div className="kpis">
            <Tile accent label="Tushum" value={money(data.summary.revenue)} change={data.summary.revenueChange} sub={data.period !== 'all' ? 'oldingi davrga nisbatan' : null} />
            <Tile label="Sotilgan kurslar (to'langan arizalar)" value={fmt(data.summary.paid)} change={data.summary.paidChange} sub={`jami ${data.summary.orders} ta arizadan`} />
            <Tile label="O'rtacha chek" value={money(data.summary.avgCheck)} />
            <Tile label="Konversiya" value={`${data.summary.conversion}%`} sub="arizadan to'lovgacha" />
            <Tile label="Bekor qilingan" value={`${data.summary.cancelled} ta`} sub={`${data.summary.cancelRate}% arizalar`} />
            <Tile label="To'lov qilmay qolganlar" value={`${data.summary.abandoned} ta`} sub="24 soatdan beri chek yo'q" />
            <Tile label="Kutilayotgan pul" value={money(data.summary.pendingAmount)} sub={`${data.summary.pendingWithReceipt} ta chek tekshirilmagan`} />
            <Tile label="Tasdiqlash vaqti" value={data.summary.medianPayHours != null ? `${data.summary.medianPayHours} soat` : '—'} sub="arizadan to'lovgacha (mediana)" />
          </div>

          <section className="panel">
            <div className="panel-head">
              <h3>Kunlik tushum</h3>
              <small className="muted">{data.period === 'all' ? 'oxirgi 90 kun' : `oxirgi ${data.period} kun`} · to'langan arizalar</small>
            </div>
            <RevenueChart data={data.daily} />
            <details className="table-toggle">
              <summary>Jadval ko'rinishi</summary>
              <table>
                <thead><tr><th>Sana</th><th>Arizalar</th><th>To'langan</th><th>Tushum</th></tr></thead>
                <tbody>
                  {[...data.daily].reverse().filter((d) => d.orders).map((d) => (
                    <tr key={d.date}><td>{dayLabel(d.date)}</td><td>{d.orders}</td><td>{d.paid}</td><td>{money(d.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Kurslar reytingi</h3>
              {topCourse && <small className="muted">Eng talab yuqori: <b>{topCourse.title}</b> — {topCourse.paid} ta sotuv</small>}
            </div>
            <div className="table-wrap flat">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Kurs</th><th>Sotildi</th><th>Tushum</th><th>Arizalar</th><th>Konversiya</th><th>Bekor</th><th>Kutilmoqda</th><th>Reyting</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c, i) => {
                    const maxRev = Math.max(...data.courses.map((x) => x.revenue), 1);
                    return (
                      <tr key={c.id} className={c.isActive ? '' : 'dim'}>
                        <td><b>{i + 1}</b></td>
                        <td><b>{c.title}</b><small>{money(c.price)}</small></td>
                        <td><b className="big-num">{c.paid}</b></td>
                        <td className="rev-cell">
                          <span>{money(c.revenue)}</span>
                          <span className="inline-bar"><i style={{ width: `${(c.revenue / maxRev) * 100}%` }} /></span>
                          <small>{c.revenueShare}% tushum</small>
                        </td>
                        <td>{c.orders}</td>
                        <td>{c.orders ? `${c.conversion}%` : '—'}</td>
                        <td>{c.cancelled ? <span className="tag bad">{c.cancelled} · {c.cancelRate}%</span> : '0'}</td>
                        <td>{c.pending}</td>
                        <td>{c.rating ? `★ ${c.rating}` : '—'}<small>{c.reviews} izoh</small></td>
                      </tr>
                    );
                  })}
                  {!data.courses.length && <tr><td colSpan={9} className="empty-cell">Kurslar yo'q</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel-head"><h3>Sotuv voronkasi</h3><small className="muted">tanlangan davrda, noyob odamlar</small></div>
              <BarList
                rows={data.funnel.map((f, i) => ({
                  key: f.key,
                  label: f.label,
                  value: f.value,
                  note: i > 0 && data.funnel[i - 1].value ? `${Math.round((f.value / data.funnel[i - 1].value) * 100)}%` : null,
                }))}
              />
              <p className="muted small-text">Foiz — oldingi bosqichdan o'tganlar ulushi.</p>
            </section>

            <section className="panel">
              <div className="panel-head"><h3>Arizalar holati</h3><small className="muted">{data.summary.orders} ta ariza</small></div>
              <StatusBar s={data.summary} />
            </section>

            <section className="panel">
              <div className="panel-head"><h3>Mijozlar</h3><small className="muted">botdagi barcha foydalanuvchilar</small></div>
              <div className="mini-kpis grid2">
                <div><small>Jami foydalanuvchilar</small><b>{fmt(data.audience.total)}</b><span>+{data.audience.newUsers} yangi (davrda)</span></div>
                <div><small>Xaridorlar</small><b>{fmt(data.audience.buyers)}</b><span>{data.audience.buyerRate}% foydalanuvchilardan</span></div>
                <div><small>Qayta xarid qilganlar</small><b>{fmt(data.audience.repeatBuyers)}</b><span>2 va undan ko'p kurs</span></div>
                <div><small>Bir xaridor qiymati</small><b>{money(data.audience.ltv)}</b><span>o'rtacha jami xarid</span></div>
              </div>
              <h4 className="sub-h">Tillar</h4>
              <BarList rows={data.audience.languages.map((l) => ({ key: l.lang, label: LANG_NAMES[l.lang], value: l.count }))} />
            </section>

            <section className="panel">
              <div className="panel-head"><h3>Faol vaqtlar</h3><small className="muted">arizalar, Toshkent vaqti</small></div>
              <h4 className="sub-h">Soatlar</h4>
              <MiniColumns rows={data.hours} labelOf={(r) => `${r.hour}`} every={3} />
              <h4 className="sub-h">Hafta kunlari</h4>
              <MiniColumns rows={data.weekdays} labelOf={(r) => WEEKDAYS[r.day]} />
              <p className="muted small-text">To'q rang — eng faol vaqt. Reklama va postlarni shu vaqtga moslang.</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
