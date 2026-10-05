import { useState } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import BottomSheet from './BottomSheet';
import AddressFields from './AddressFields';
import { Logo } from './Header';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { openLink } from '../lib/telegram';

function AddressPanel({ onClose }) {
  const { t, user, setUser, showToast } = useStore();
  const [address, setAddress] = useState(user?.address || '');
  const [coords, setCoords] = useState(user?.latitude ? { latitude: user.latitude, longitude: user.longitude } : null);
  const [saving, setSaving] = useState(false);

  const save = async (close) => {
    setSaving(true);
    try {
      const r = await api.saveAddress({ address: address.trim() || null, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null });
      setUser(r.user);
      showToast(t.addressSaved);
      close();
    } catch (e) {
      showToast(e.message, 'bad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      title={t.deliveryAddress}
      onClose={onClose}
      footer={(close) => (
        <button type="button" className="btn btn-primary btn-block" disabled={saving || (!address.trim() && !coords)} onClick={() => save(close)}>
          {t.save}
        </button>
      )}
    >
      <div className="form-card plain">
        <AddressFields address={address} setAddress={setAddress} coords={coords} setCoords={setCoords} />
      </div>
    </BottomSheet>
  );
}

function AboutPanel({ onClose }) {
  const { t, config } = useStore();
  const { shop } = config;
  return (
    <BottomSheet title={t.aboutTitle} onClose={onClose}>
      <div className="about">
        <div className="about-brand">
          <Logo />
          <div>
            <div className="brand-name">{shop.name}</div>
            <div className="brand-tag">{shop.tagline}</div>
          </div>
        </div>
        {shop.about && <p className="about-text">{shop.about}</p>}
        <div className="info-rows">
          {shop.address && (
            <button type="button" onClick={() => shop.lat && openLink(`https://maps.google.com/?q=${shop.lat},${shop.lng}`)}>
              <MapPin size={18} /> <span>{shop.address}</span>
            </button>
          )}
          {shop.workingHours && <div><Clock size={18} /> <span>{t.hours}: {shop.workingHours}</span></div>}
          {shop.phone && <div><Phone size={18} /> <span>{shop.phone}</span></div>}
        </div>
      </div>
    </BottomSheet>
  );
}

export default function Panels() {
  const { panel, setPanel, config } = useStore();
  if (!panel || !config) return null;
  const close = () => setPanel(null);
  if (panel === 'address') return <AddressPanel onClose={close} />;
  if (panel === 'about') return <AboutPanel onClose={close} />;
  return null;
}
