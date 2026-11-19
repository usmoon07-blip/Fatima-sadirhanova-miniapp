import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { api } from '../lib/api';
import { haptic, openLink, tg } from '../lib/telegram';

/**
 * Onlayn to'lov (Multicard): «To'lash» → to'lov sahifasi → qaytganda holat SERVERDAN so'raladi.
 * Ariza holati faqat server (Multicard tasdig'i) orqali o'zgaradi — bu yerda hech narsa «to'landi» qilinmaydi.
 */
export default function OnlinePay({ order, initialPayment, initialError, onPaid }) {
  const { t, money, refreshMe } = useStore();
  const [payment, setPayment] = useState(initialPayment || null);
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(order.status === 'PAID');
  const [opened, setOpened] = useState(false);
  const timer = useRef(null);

  const check = useCallback(async () => {
    try {
      const r = await api.paymentStatus(order.id);
      if (r.orderStatus === 'PAID') {
        setPaid(true);
        haptic.success();
        refreshMe();
        onPaid?.();
        return true;
      }
      if (r.payment) setPayment(r.payment);
    } catch { /* keyingi urinishda */ }
    return false;
  }, [order.id, refreshMe, onPaid]);

  // To'lov sahifasidan qaytganda va har 5 soniyada (2 daqiqagacha) holatni tekshiramiz
  useEffect(() => {
    if (!opened || paid) return undefined;
    let n = 0;
    timer.current = setInterval(async () => {
      n += 1;
      if ((await check()) || n > 24) clearInterval(timer.current);
    }, 5000);
    const onBack = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onBack);
    try { tg?.onEvent?.('activated', check); } catch { /* */ }
    return () => {
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onBack);
      try { tg?.offEvent?.('activated', check); } catch { /* */ }
    };
  }, [opened, paid, check]);

  const pay = async () => {
    setError('');
    setBusy(true);
    try {
      const p = payment?.checkoutUrl ? payment : await api.payOrder(order.id);
      setPayment(p);
      haptic.medium();
      openLink(p.checkoutUrl);
      setOpened(true);
    } catch (e) {
      haptic.error();
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (paid) {
    return (
      <div className="pay-done">
        <CheckCircle2 size={22} />
        <div>
          <b>{t('paySuccessTitle')}</b>
          <p>{t('paySuccessText')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="online-pay">
      <div className="online-pay-card">
        <span className="online-pay-icon"><CreditCard size={22} /></span>
        <div>
          <b>{t('payOnlineTitle')}</b>
          <small>{t('payOnlineMethods')}</small>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block btn-lg" disabled={busy} onClick={pay}>
        {busy ? <LoaderCircle size={19} className="spin" /> : <CreditCard size={19} />} {t('payOnline', { price: money(order.total) })}
      </button>
      {opened && (
        <button type="button" className="btn btn-soft btn-block" onClick={check}>
          <LoaderCircle size={16} className="spin" /> {t('payChecking')}
        </button>
      )}
      {error && <div className="form-error">{error}</div>}
      <p className="secure-note"><ShieldCheck size={14} /> {t('paySecure')}</p>
    </div>
  );
}
