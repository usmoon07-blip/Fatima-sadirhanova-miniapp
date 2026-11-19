import { useState } from 'react';
import {
  ChevronDown, CreditCard, Instagram, MessageSquareHeart, Phone, ReceiptText, RotateCcw, Send,
} from 'lucide-react';
import Img from '../components/Img';
import AccessButton from '../components/AccessButton';
import OnlinePay from '../components/OnlinePay';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { LANGS } from '../lib/i18n';
import { dateTime, initials } from '../lib/format';
import { haptic, openLink, tgUser } from '../lib/telegram';

const STATUS_TONE = { PENDING: 'amber', PAID: 'green', CANCELLED: 'red' };

function OrderCard({ order }) {
  const { courseMap, me, setCart, setTab, toast, openPayment, t, lang, loc, money } = useStore();
  const [open, setOpen] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];

  const reorder = () => {
    const ids = items.map((i) => i.courseId).filter((id) => id && courseMap.has(id) && !me.purchased.includes(id));
    if (!ids.length) {
      toast(t('ownedAll'));
      return;
    }
    setCart((prev) => [...new Set([...prev, ...ids])]);
    setTab('cart');
  };

  return (
    <div className={`order-card ${open ? 'open' : ''}`}>
      <button type="button" className="order-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <b>{t('orderN', { id: order.id })}</b>
          <small>{dateTime(order.createdAt, lang)}</small>
        </div>
        <span className={`status ${STATUS_TONE[order.status] || 'amber'}`}>{t(`status_${order.status}`)}</span>
        <ChevronDown size={18} className="chev" />
      </button>
      {order.status === 'PENDING' && order.paymentMethod === 'multicard' && (
        <div className="order-online"><OnlinePay order={order} initialPayment={order.payments?.[0]?.status === 'CREATED' ? order.payments[0] : null} /></div>
      )}
      {order.status === 'PENDING' && order.paymentMethod !== 'multicard' && (
        order.receiptUrl
          ? <div className="order-pay done"><ReceiptText size={15} /> {t('receiptSent')}</div>
          : (
            <button type="button" className="order-pay" onClick={() => openPayment(order)}>
              <CreditCard size={15} /> {t('payAndUpload')}
            </button>
          )
      )}
      {open && (
        <div className="order-body">
          {items.map((i, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={idx} className="order-line"><span>{(i.courseId && loc(courseMap.get(i.courseId), 'title')) || i.title}</span><b>{money(i.price)}</b></div>
          ))}
          <div className="order-line total"><span>{t('total')}</span><b>{money(order.total)}</b></div>
          <button type="button" className="btn btn-soft btn-block btn-sm" onClick={reorder}>
            <RotateCcw size={15} /> {t('reorder')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { me, orders, config, openReview, setTab, t, loc, lang, setLang } = useStore();
  const tu = tgUser();
  const name = [me.user?.firstName || tu?.first_name, me.user?.lastName || tu?.last_name].filter(Boolean).join(' ') || t('guest');
  const username = me.user?.username || tu?.username;
  const photo = tu?.photo_url;
  const shop = config?.shop || {};
  const authorTg = shop.authorTelegram || 'fatima_sadirkhanova';
  const authorIg = shop.authorInstagram || 'fatima_sadirkhanova';

  return (
    <div className="page">
      <PageTitle title={t('profile')} />

      <section className="profile-card">
        <span className="avatar big">{photo ? <img src={photo} alt="" /> : initials(name)}</span>
        <div>
          <b className="serif">{name}</b>
          {username && <small>@{username}</small>}
          {me.user?.phone && <small>{me.user.phone}</small>}
        </div>
      </section>

      <section className="block">
        <h3 className="serif">{t('myCourses')}</h3>
        {me.myCourses.length ? me.myCourses.map((c) => {
          const reviewed = me.reviews.some((r) => r.courseId === c.id);
          return (
            <div key={c.id} className="my-course">
              <span className="cart-thumb"><Img src={c.imageUrl} alt={loc(c, 'title')} /></span>
              <div className="my-course-info">
                <b>{loc(c, 'title')}</b>
                <div className="my-course-actions">
                  <AccessButton courseId={c.id} size="xs" />
                  <button type="button" className="btn btn-soft btn-xs" onClick={() => openReview(c.id)}>
                    <MessageSquareHeart size={14} /> {reviewed ? t('myReview') : t('leaveReview')}
                  </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="empty small">
            <p>{me.pending.length ? t('awaitingCourses') : t('noCourses')}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setTab('courses')}>{t('viewCourses')}</button>
          </div>
        )}
      </section>

      <section className="block">
        <h3 className="serif">{t('myOrders')}</h3>
        {orders.length ? orders.map((o) => <OrderCard key={o.id} order={o} />) : (
          <p className="muted small">{t('noOrders')}</p>
        )}
      </section>

      <section className="block">
        <h3 className="serif">{t('language')}</h3>
        <div className="lang-switch">
          {LANGS.map((l) => (
            <button key={l.id} type="button" className={lang === l.id ? 'on' : ''} onClick={() => { haptic.select(); setLang(l.id); }}>
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="block">
        <h3 className="serif">{t('author')}</h3>
        <div className="author-card">
          <div className="author-head">
            <span className="avatar big">FS</span>
            <div>
              <b className="serif">{shop.name || 'Fatima Sadirkhanova'}</b>
              <small>{shop.tagline || 'PATISSERIE'}</small>
            </div>
          </div>
          <div className="contact-list">
            <button type="button" className="contact" onClick={() => openLink(`https://t.me/${authorTg}`)}>
              <Send size={18} />
              <span><small>Telegram</small>@{authorTg}</span>
            </button>
            <button type="button" className="contact" onClick={() => openLink(`https://instagram.com/${authorIg}`)}>
              <Instagram size={18} />
              <span><small>Instagram</small>{authorIg}</span>
            </button>
            {shop.phone && (
              <a className="contact" href={`tel:${shop.phone.replace(/\s/g, '')}`}>
                <Phone size={18} />
                <span><small>{t('contacts')}</small>{shop.phone}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <p className="made-by">
        {t('madeBy').split('usmoai').map((part, i) => (i === 0 ? part : (
          <span key={part + i}>
            <button type="button" className="made-by-link" onClick={() => openLink('https://t.me/usmoai')}>@usmoai<Send size={10} /></button>
            {part}
          </span>
        )))}
      </p>
    </div>
  );
}
