import {
  ChevronRight, Clock, GraduationCap, Heart, Info, MapPin, Phone, ReceiptText,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatPhone, shortMoney } from '../lib/format';
import { currency, LANGS } from '../lib/i18n';
import { haptic, tgUser } from '../lib/telegram';
import { Logo } from '../components/Header';

export default function Profile() {
  const {
    user, userStats, displayName, config, goTo, setActiveCategory, favorites, t, lang, setLang, setScreen, setPanel, showToast,
  } = useStore();
  const photo = tgUser()?.photo_url;
  const { shop } = config;

  const copyPhone = () => {
    navigator.clipboard?.writeText(shop.phone).then(() => {
      haptic.success();
      showToast(t.phoneCopied);
    }).catch(() => {});
  };

  const savedAddress = user?.address || (user?.latitude ? `📍 ${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}` : null);

  return (
    <div className="page">
      <div className="profile-head">
        <div className="avatar">{photo ? <img src={photo} alt="" /> : displayName.slice(0, 1).toUpperCase()}</div>
        <div>
          <h2 className="serif">{[user?.firstName || displayName, user?.lastName].filter(Boolean).join(' ')}</h2>
          {user?.phone && <div className="muted small">{formatPhone(user.phone)}</div>}
          {user?.username && <div className="muted small">@{user.username}</div>}
        </div>
      </div>

      <div className="stat-tiles">
        <div className="card"><b>{userStats?.ordersCount ?? 0}</b><span>{t.ordersStat}</span></div>
        <div className="card"><b>{shortMoney(userStats?.totalSpent ?? 0)}</b><span>{t.spentStat(currency(lang))}</span></div>
      </div>

      <h4 className="label-title">{t.language}</h4>
      <div className="lang-switch">
        {LANGS.map((l) => (
          <button key={l.id} type="button" className={lang === l.id ? 'active' : ''} onClick={() => setLang(l.id)}>
            <span>{l.flag}</span>{l.label}
          </button>
        ))}
      </div>

      <div className="menu-rows card">
        <button type="button" onClick={() => setScreen('orders')}>
          <span className="row-icon"><ReceiptText size={18} /></span>
          <span className="row-text"><b>{t.myOrders}</b><small>{t.myOrdersSub}</small></span>
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => setScreen('myCourses')}>
          <span className="row-icon"><GraduationCap size={18} /></span>
          <span className="row-text"><b>{t.myCourses}</b><small>{t.myCoursesSub}</small></span>
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => setPanel('address')}>
          <span className="row-icon"><MapPin size={18} /></span>
          <span className="row-text"><b>{t.deliveryAddress}</b><small>{savedAddress || t.noAddress}</small></span>
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => { setActiveCategory('fav'); goTo('menu'); }}>
          <span className="row-icon"><Heart size={18} /></span>
          <span className="row-text"><b>{t.favorites}</b><small>{favorites.length}</small></span>
          <ChevronRight size={18} />
        </button>
        {shop.phone && (
          <button type="button" onClick={copyPhone}>
            <span className="row-icon"><Phone size={18} /></span>
            <span className="row-text"><b>{t.contact}</b><small>{shop.phone}</small></span>
            <ChevronRight size={18} />
          </button>
        )}
        {shop.workingHours && (
          <div className="row-static">
            <span className="row-icon"><Clock size={18} /></span>
            <span className="row-text"><b>{t.hours}</b><small>{shop.workingHours}</small></span>
          </div>
        )}
        <button type="button" onClick={() => setPanel('about')}>
          <span className="row-icon"><Info size={18} /></span>
          <span className="row-text"><b>{t.aboutTitle}</b><small>{shop.address}</small></span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="profile-footer">
        <Logo size={28} />
        <span>{shop.name}</span>
      </div>
    </div>
  );
}
