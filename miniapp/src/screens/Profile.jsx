import { Clock, Heart, MapPin, MessageCircle, Phone } from 'lucide-react';
import OrderList from '../components/OrderList';
import { useStore } from '../store/StoreContext';
import { formatPhone } from '../lib/format';
import { openLink, tgUser } from '../lib/telegram';

export default function Profile() {
  const { user, displayName, config, goTo, setActiveCategory, favorites } = useStore();
  const photo = tgUser()?.photo_url;
  const { shop } = config;

  return (
    <div className="page">
      <div className="profile-head">
        <div className="avatar">{photo ? <img src={photo} alt="" /> : displayName.slice(0, 1).toUpperCase()}</div>
        <div>
          <h2 className="serif">{[user?.firstName || displayName, user?.lastName].filter(Boolean).join(' ')}</h2>
          {user?.username && <div className="muted small">@{user.username}</div>}
          {user?.phone && <div className="muted small">{formatPhone(user.phone)}</div>}
        </div>
      </div>

      <div className="profile-links">
        <button type="button" className="card" onClick={() => { setActiveCategory('fav'); goTo('catalog'); }}>
          <Heart size={20} /> <span>Sevimlilar</span> <b>{favorites.length}</b>
        </button>
        {shop.lat && shop.lng && (
          <button type="button" className="card" onClick={() => openLink(`https://maps.google.com/?q=${shop.lat},${shop.lng}`)}>
            <MapPin size={20} /> <span>Bizning manzil</span>
          </button>
        )}
      </div>

      <section className="section">
        <div className="section-head"><h3 className="serif">📜 Mening buyurtmalarim</h3></div>
        <OrderList />
      </section>

      <section className="card shop-card">
        <h4 className="serif">{shop.name}</h4>
        {shop.address && <p><MapPin size={16} /> {shop.address}</p>}
        {shop.workingHours && <p><Clock size={16} /> {shop.workingHours}</p>}
        {shop.phone && <p><Phone size={16} /> {shop.phone}</p>}
        <p className="muted small"><MessageCircle size={14} /> Savollar bo'yicha botga yozing</p>
      </section>
    </div>
  );
}
