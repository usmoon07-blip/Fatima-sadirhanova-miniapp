import { useState } from 'react';
import { LoaderCircle, LocateFixed } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { getLocation, haptic } from '../lib/telegram';

async function reverseGeocode(lat, lng, lang) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}&zoom=18`);
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.road, a.house_number, a.neighbourhood || a.suburb, a.city_district || a.city].filter(Boolean);
    return parts.join(', ') || data.display_name || '';
  } catch {
    return '';
  }
}

/** Joylashuv tugmasi + xarita + manzil maydoni */
export default function AddressFields({ address, setAddress, coords, setCoords, error }) {
  const { t, lang, showToast } = useStore();
  const [locating, setLocating] = useState(false);

  const locate = async () => {
    haptic.light();
    setLocating(true);
    try {
      const loc = await getLocation();
      setCoords(loc);
      const text = await reverseGeocode(loc.latitude, loc.longitude, lang);
      if (text && !address) setAddress(text);
    } catch (e) {
      showToast(e.code === 'denied' ? t.geoDenied : e.code === 'nogeo' ? t.noGeo : e.message, 'bad');
    } finally {
      setLocating(false);
    }
  };

  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.longitude - 0.004},${coords.latitude - 0.0025},${coords.longitude + 0.004},${coords.latitude + 0.0025}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`
    : null;

  return (
    <>
      <button type="button" className={`btn btn-soft btn-block ${coords ? 'done' : ''}`} onClick={locate} disabled={locating}>
        {locating ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />}
        {coords ? t.located : t.locate}
      </button>
      {mapSrc && <iframe className="map" title="map" src={mapSrc} loading="lazy" />}
      <textarea
        className={error ? 'invalid' : ''}
        rows={2}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={t.addressPh}
      />
      {error && <div className="field-error">{error}</div>}
    </>
  );
}
