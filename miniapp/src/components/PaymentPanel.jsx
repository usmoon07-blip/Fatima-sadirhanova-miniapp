import { useRef, useState } from 'react';
import { Check, Copy, CreditCard, ImageUp, LoaderCircle, ReceiptText } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { haptic } from '../lib/telegram';

function formatCard(n = '') {
  const digits = n.replace(/\D/g, '');
  return digits.length >= 12 ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : n;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Karta orqali to'lov: karta raqami + chek rasmini yuklash */
export default function PaymentPanel({ order, onUploaded }) {
  const { config, refreshMe, toast } = useStore();
  const pay = config?.payment || {};
  const fileRef = useRef(null);
  const [copied, setCopied] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const copy = async (text, what) => {
    if (await copyText(text.replace(/\s/g, what === 'card' ? '' : ' '))) {
      haptic.success();
      setCopied(what);
      toast('Nusxa olindi ✅');
      setTimeout(() => setCopied(''), 1800);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const updated = await api.uploadReceipt(order.id, file);
      haptic.success();
      await refreshMe();
      onUploaded?.(updated);
    } catch (err) {
      haptic.error();
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pay-panel">
      <div className="pay-card">
        <div className="pay-card-top">
          <span><CreditCard size={18} /> To'lov kartasi</span>
          <small>Buyurtma #{order.id}</small>
        </div>
        {pay.cardNumber ? (
          <>
            <button type="button" className="pay-number" onClick={() => copy(pay.cardNumber, 'card')}>
              <b>{formatCard(pay.cardNumber)}</b>
              {copied === 'card' ? <Check size={18} /> : <Copy size={18} />}
            </button>
            {pay.cardHolder && <div className="pay-holder">{pay.cardHolder}</div>}
          </>
        ) : (
          <div className="pay-holder">Karta ma'lumotlarini kurator tez orada yuboradi</div>
        )}
        <button type="button" className="pay-amount" onClick={() => copy(String(order.total), 'sum')}>
          <span>To'lov summasi</span>
          <b>{money(order.total)} {copied === 'sum' ? <Check size={15} /> : <Copy size={15} />}</b>
        </button>
      </div>

      <ol className="pay-steps">
        <li>Karta raqamini nusxalang (ustiga bosing)</li>
        <li>Bank ilovangizda (Click, Payme, Uzum...) shu kartaga <b>{money(order.total)}</b> o'tkazing</li>
        <li>To'lov chekini (skrinshot) pastdagi tugma orqali yuklang</li>
      </ol>
      {pay.note && <p className="pay-note">{pay.note}</p>}

      {order.receiptUrl ? (
        <div className="owned-note"><ReceiptText size={18} /> Chek yuborilgan — tekshirilmoqda</div>
      ) : (
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <LoaderCircle size={19} className="spin" /> : <ImageUp size={19} />}
          {uploading ? 'Yuborilmoqda...' : 'Chekni yuklash'}
        </button>
      )}
      {error && <div className="form-error">{error}</div>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}
