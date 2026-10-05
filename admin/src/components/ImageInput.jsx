import { useRef, useState } from 'react';
import { ImageUp, LoaderCircle } from 'lucide-react';
import { api } from '../api';

export default function ImageInput({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-input">
      <div className="image-preview" onClick={() => fileRef.current?.click()}>
        {value ? <img src={value} alt="" /> : <span>Rasm yo'q</span>}
      </div>
      <div className="image-controls">
        <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle size={16} className="spin" /> : <ImageUp size={16} />} Kompyuterdan yuklash
        </button>
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="yoki rasm URL manzilini qo'ying" />
        {error && <div className="error-text">{error}</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}
