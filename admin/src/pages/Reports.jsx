import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, dateTime, money } from '../api';

const PERIODS = [
  { id: 'today', label: 'Bugun' },
  { id: '7', label: '7 kun' },
  { id: '30', label: '30 kun' },
  { id: '90', label: '90 kun' },
  { id: 'all', label: 'Hammasi' },
];

const short = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} mln`;
  if (n >= 1000) return `${Math.round(n / 1000)} ming`;
  return String(n);
};

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`kpi ${tone || ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Split({ title, subtitle, rows, total }) {
  return (
    <div className="panel">
      <div className="panel-head"><h3>{title}</h3><small className="muted">{subtitle}</small></div>
      {rows.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={r.label} className="split-row">
            <div className="split-top"><span>{r.label}</span><b>{pct}%</b></div>
            <div className="split-bar"><i style={{ width: `${pct}%` }} /></div>
            <small className="muted">{r.count} ta — {money(r.sum)}</small>
          </div>
        );
      })}
    </div>
  );
}

/** Oddiy ustunli grafik: bitta qator ma'lumot, hover'da ko'rsatma */
function BarChart({ data, valueKey, labelKey, format, tickEvery = 1, height = 180, highlightMax = true }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const maxIndex = data.findIndex((d) => d[valueKey] === max);
  return (
    <div className="chart" style={{ height }}>
      <div className="chart-grid"><span /><span /><span /></div>
      <div className="chart-bars">
        {data.map((d, i) => {
          const v = d[valueKey];
          return (
            <div key={d[labelKey]} className="bar-slot" tabIndex={0}>
              {highlightMax && i === maxIndex && v > 0 && <span className="bar-peak">{format(v)}</span>}
              <div className="bar" style={{ height: `${(v / max) * 100}%` }} />
              <div className="bar-tip"><b>{format(v)}</b><span>{d[labelKey]}</span></div>
              {i % tickEvery === 0 && <span className="bar-label">{d.tick ?? d[labelKey]}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (p = period) => {
    setLoading(true);
    try {
      setData(await api.report(p));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(period);
    const iv = setInterval(() => load(period), 60000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const daily = (data?.daily || []).map((d) => {
    const [, m, day] = d.date.split('-');
    return { ...d, label: `${day}.${m}`, tick: `${day}.${m}` };
  });
  const hourly = (data?.hourly || []).map((h) => ({ ...h, label: `${String(h.hour).padStart(2, '0')}:00`, tick: String(h.hour).padStart(2, '0') }));
  const topMax = Math.max(1, ...(data?.topProducts || []).map((p) => p.quantity));
  const valid = data ? data.ordersCount : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hisobot</h1>
          <p className="muted">Bekor qilinganlar tushumga kirmaydi · har daqiqada yangilanadi</p>
        </div>
        <div className="row gap">
          <div className="tabs">
            {PERIODS.map((p) => (
              <button key={p.id} type="button" className={period === p.id ? 'active' : ''} onClick={() => setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
          <button type="button" className="btn btn-outline" onClick={() => load()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {data && (
        <>
          <div className="kpis">
            <Kpi label="Tushum" value={money(data.revenue)} sub={`${data.ordersCount} ta buyurtma · bekor qilinganlarsiz`} />
            <Kpi label="Qo'lga tekkan pul" value={money(data.collected)} sub={`${data.deliveredCount} ta yetkazilgan`} />
            <Kpi label="O'rtacha chek" value={money(data.averageCheck)} sub="bitta buyurtmaga" />
            <Kpi label="Bekor qilingan" value={money(data.cancelledSum)} sub={`${data.cancelled} ta · barcha buyurtmalarning ${data.cancelledShare}%`} tone="bad" />
            <Kpi label="Yangi mijozlar" value={data.newCustomers} sub={`jami bazada ${data.totalCustomers} ta`} />
            <Kpi label="Qayta kelganlar" value={data.returningCustomers} sub="shu davrda 2+ marta buyurtma" />
            <Kpi label="Kurs arizalari" value={`${data.enrollments} ta`} sub={`to'langan: ${money(data.enrollmentsPaid)}`} />
            <Kpi label="Yetkazib berish" value={`${data.deliveryType[0].count} ta`} sub={`olib ketish — ${data.deliveryType[1].count} ta`} />
          </div>

          <div className="two-cols">
            <Split
              title="To'lov turi"
              subtitle="Mijozlar qanday to'laydi"
              total={valid}
              rows={[
                { label: 'Naqd', count: data.payment[0].count, sum: data.payment[0].sum },
                { label: 'Karta', count: data.payment[1].count, sum: data.payment[1].sum },
              ]}
            />
            <Split
              title="Yetkazish turi"
              subtitle="Buyurtma qanday olinadi"
              total={valid}
              rows={[
                { label: 'Yetkazib berish', count: data.deliveryType[0].count, sum: data.deliveryType[0].sum },
                { label: 'Olib ketish', count: data.deliveryType[1].count, sum: data.deliveryType[1].sum },
              ]}
            />
          </div>

          <div className="panel cancelled-panel">
            <div className="panel-head">
              <h3>Bekor qilingan buyurtmalar</h3>
              <small className="muted">Bu summalar tushumga, o'rtacha chekka, grafiklarga va top ro'yxatlarga kirmaydi</small>
            </div>
            <div className="cancel-stats">
              <div><span>Jami bekor qilingan</span><b>{money(data.cancelledSum)}</b><small>{data.cancelled} ta buyurtma</small></div>
              <div><span>Mijoz bekor qildi</span><b>{money(data.cancelledByCustomer.sum)}</b><small>{data.cancelledByCustomer.count} ta</small></div>
              <div><span>Do'kon bekor qildi</span><b>{money(data.cancelledByRestaurant.sum)}</b><small>{data.cancelledByRestaurant.count} ta</small></div>
            </div>
            {data.cancelledList.length ? (
              <table className="table compact">
                <thead><tr><th>#</th><th>Sana</th><th>Mijoz</th><th>Mahsulotlar</th><th>Kim bekor qildi</th><th className="right">Summa</th></tr></thead>
                <tbody>
                  {data.cancelledList.map((o) => (
                    <tr key={o.id}>
                      <td><b>#{o.id}</b></td>
                      <td className="nowrap">{dateTime(o.createdAt)}</td>
                      <td><div className="strong">{o.customerName}</div><a className="muted small" href={`tel:${o.phone}`}>{o.phone}</a></td>
                      <td className="muted small">{o.items}</td>
                      <td><span className={`pill ${o.cancelledBy === 'customer' ? '' : 'violet'}`}>{o.cancelledBy === 'customer' ? 'Mijoz' : "Do'kon"}</span></td>
                      <td className="right nowrap strike">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="k-empty">Bu davrda bekor qilingan buyurtma yo'q</div>}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Kunlik tushum</h3><small className="muted">Ustun ustiga olib boring — aniq summa</small></div>
            {daily.length ? (
              <BarChart data={daily} valueKey="sum" labelKey="label" format={short} tickEvery={Math.max(1, Math.ceil(daily.length / 10))} />
            ) : <div className="k-empty">Ma'lumot yo'q</div>}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Kun davomida</h3><small className="muted">Qaysi soatlarda ko'p buyurtma bo'ladi — smena rejasi uchun</small></div>
            <BarChart data={hourly} valueKey="count" labelKey="label" format={(v) => `${v} ta`} tickEvery={3} height={150} />
          </div>

          <div className="two-cols">
            <div className="panel">
              <div className="panel-head"><h3>Eng ko'p sotilganlar</h3><small className="muted">Menyu va xarid rejasi uchun</small></div>
              {data.topProducts.length ? data.topProducts.map((p) => (
                <div key={p.productId} className="split-row">
                  <div className="split-top"><span>{p.name}</span><b>{p.quantity} ta</b></div>
                  <div className="split-bar"><i style={{ width: `${(p.quantity / topMax) * 100}%` }} /></div>
                  <small className="muted">{money(p.revenue)}</small>
                </div>
              )) : <div className="k-empty">Ma'lumot yo'q</div>}
            </div>
            <div className="panel">
              <div className="panel-head"><h3>Eng qadrli mijozlar</h3><small className="muted">Alohida e'tibor berishga arziydi</small></div>
              <table className="table compact">
                <thead><tr><th>Mijoz</th><th className="right">Jami xarid</th></tr></thead>
                <tbody>
                  {data.topCustomers.map((c) => (
                    <tr key={c.userId}>
                      <td><div className="strong">{c.name}</div><a className="muted small" href={`tel:${c.phone}`}>{c.phone}</a></td>
                      <td className="right"><div className="strong">{money(c.total)}</div><small className="muted">{c.orders} ta buyurtma</small></td>
                    </tr>
                  ))}
                  {!data.topCustomers.length && <tr><td colSpan={2} className="empty-cell">Ma'lumot yo'q</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
