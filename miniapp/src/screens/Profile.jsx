import { useState } from 'react';
import { ChevronDown, MessageCircle, MessageSquareHeart, Phone, PlayCircle, RotateCcw } from 'lucide-react';
import Img from '../components/Img';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { dateTime, initials, money } from '../lib/format';
import { openLink, tgUser } from '../lib/telegram';

const STATUS = {
  PENDING: { label: "To'lov kutilmoqda", tone: 'amber' },
  PAID: { label: "To'landi", tone: 'green' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'red' },
};

function OrderCard({ order }) {
  const { courseMap, me, setCart, setUpsell, setTab, toast } = useStore();
  const [open, setOpen] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];
  const st = STATUS[order.status] || STATUS.PENDING;

  const reorder = () => {
    const ids = items.map((i) => i.courseId).filter((id) => id && courseMap.has(id) && !me.purchased.includes(id));
    const hadExtra = items.some((i) => i.type === 'extra');
    if (!ids.length && !hadExtra) {
      toast('Bu kurslar sizda allaqachon bor 🎓');
      return;
    }
    setCart((prev) => [...new Set([...prev, ...ids])]);
    if (hadExtra) setUpsell(true);
    setTab('cart');
  };

  return (
    <div className={`order-card ${open ? 'open' : ''}`}>
      <button type="button" className="order-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <b>Buyurtma #{order.id}</b>
          <small>{dateTime(order.createdAt)}</small>
        </div>
        <span className={`status ${st.tone}`}>{st.label}</span>
        <ChevronDown size={18} className="chev" />
      </button>
      {open && (
        <div className="order-body">
          {items.map((i, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={idx} className="order-line"><span>{i.title}</span><b>{money(i.price)}</b></div>
          ))}
          <div className="order-line total"><span>Jami</span><b>{money(order.total)}</b></div>
          <button type="button" className="btn btn-soft btn-block btn-sm" onClick={reorder}>
            <RotateCcw size={15} /> Yana shundan buyurtma qilish
          </button>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { me, orders, config, openReview, setTab } = useStore();
  const t = tgUser();
  const name = [me.user?.firstName || t?.first_name, me.user?.lastName || t?.last_name].filter(Boolean).join(' ') || 'Mehmon';
  const username = me.user?.username || t?.username;
  const photo = t?.photo_url;
  const shop = config?.shop || {};

  return (
    <div className="page">
      <PageTitle title="Profil" />

      <section className="profile-card">
        <span className="avatar big">{photo ? <img src={photo} alt="" /> : initials(name)}</span>
        <div>
          <b className="serif">{name}</b>
          {username && <small>@{username}</small>}
          {me.user?.phone && <small>{me.user.phone}</small>}
        </div>
      </section>

      <section className="block">
        <h3 className="serif">🎓 Mening kurslarim</h3>
        {me.myCourses.length ? me.myCourses.map((c) => {
          const reviewed = me.reviews.some((r) => r.courseId === c.id);
          return (
            <div key={c.id} className="my-course">
              <span className="cart-thumb"><Img src={c.imageUrl} alt={c.title} /></span>
              <div className="my-course-info">
                <b>{c.title}</b>
                <div className="my-course-actions">
                  <button type="button" className="btn btn-primary btn-xs" disabled={!c.accessLink} onClick={() => openLink(c.accessLink)}>
                    <PlayCircle size={14} /> {c.accessLink ? 'Kursni ochish' : 'Havola tez orada'}
                  </button>
                  <button type="button" className="btn btn-soft btn-xs" onClick={() => openReview(c.id)}>
                    <MessageSquareHeart size={14} /> {reviewed ? 'Izohim' : 'Izoh qoldirish'}
                  </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="empty small">
            <p>{me.pending.length ? "⏳ To'lovingiz tasdiqlangach, kurslaringiz shu yerda ochiladi." : "Hali kurs sotib olmagansiz."}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setTab('courses')}>Kurslarni ko'rish</button>
          </div>
        )}
      </section>

      <section className="block">
        <h3 className="serif">📜 Mening buyurtmalarim</h3>
        {orders.length ? orders.map((o) => <OrderCard key={o.id} order={o} />) : (
          <p className="muted small">Buyurtmalar tarixi bo'sh.</p>
        )}
      </section>

      {(shop.phone || shop.adminUsername) && (
        <section className="block">
          <h3 className="serif">Bog'lanish</h3>
          <div className="contact-list">
            {shop.phone && (
              <a className="contact" href={`tel:${shop.phone.replace(/\s/g, '')}`}><Phone size={18} /> {shop.phone}</a>
            )}
            {shop.adminUsername && (
              <button type="button" className="contact" onClick={() => openLink(`https://t.me/${shop.adminUsername}`)}>
                <MessageCircle size={18} /> @{shop.adminUsername}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
