import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import CourseSheet from './components/CourseSheet';
import ReviewSheet from './components/ReviewSheet';
import BottomSheet from './components/BottomSheet';
import PaymentPanel from './components/PaymentPanel';
import Toast from './components/Toast';
import { StoryViewer } from './components/Stories';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Catalog from './screens/Catalog';
import Cart from './screens/Cart';
import Results from './screens/Results';
import Profile from './screens/Profile';
import { useStore } from './store/StoreContext';
import { storage } from './lib/storage';
import { setBackButton, tgUser } from './lib/telegram';

// Bir martalik ko'rib chiqish: bot egasiga onboarding yana bir marta ko'rsatiladi (mijozlarga ta'sir qilmaydi)
const OWNER_ID = 8823567005;
const PREVIEW_KEY = 'onboarding_preview_2';
const ownerPreview = () => tgUser()?.id === OWNER_ID && !storage.get(PREVIEW_KEY, false);

const SCREENS = { home: Home, courses: Catalog, cart: Cart, results: Results, profile: Profile };

function Splash() {
  return (
    <div className="splash">
      <span className="brand-logo big"><img src="/fs-logo.png" alt="Fatima Sadirkhanova" /></span>
      <b className="serif">Fatima Sadirkhanova</b>
      <small>PATISSERIE</small>
      <span className="loader" />
    </div>
  );
}

export default function App() {
  const { status, error, load, tab, setTab, courseId, reviewCourseId, storyIndex, paymentOrder, openPayment, toast, t, lang } = useStore();
  const [onboarded, setOnboarded] = useState(() => storage.get('onboarded', false) && !ownerPreview());

  // Telegram "Orqaga" tugmasi: boshqa tabdan bosh sahifaga
  const overlayOpen = courseId != null || reviewCourseId != null || storyIndex != null || paymentOrder != null;
  useEffect(() => {
    if (overlayOpen || !onboarded) return undefined;
    return setBackButton(tab !== 'home' ? () => setTab('home') : null);
  }, [tab, overlayOpen, onboarded, setTab]);

  if (!onboarded) {
    return <Onboarding onDone={() => { storage.set('onboarded', true); storage.set(PREVIEW_KEY, true); setOnboarded(true); }} />;
  }

  if (status === 'loading') return <Splash />;
  if (status === 'error') {
    return (
      <div className="splash">
        <span className="brand-logo big"><img src="/fs-logo.png" alt="Fatima Sadirkhanova" /></span>
        <b>{t('connError')}</b>
        <small className="muted">{error}</small>
        <button type="button" className="btn btn-primary" onClick={load}>{t('retry')}</button>
      </div>
    );
  }

  const Screen = SCREENS[tab] || Home;

  return (
    <div className="app">
      <Header />
      <main key={`${tab}-${lang}`} className="screen">
        <Screen />
      </main>
      <BottomNav />
      {courseId != null && <CourseSheet />}
      {reviewCourseId != null && <ReviewSheet key={reviewCourseId} />}
      {paymentOrder && (
        <BottomSheet title={t('payByCardTitle')} onClose={() => openPayment(null)}>
          <div className="sheet-pad">
            <PaymentPanel
              order={paymentOrder}
              onUploaded={() => { openPayment(null); toast(t('receiptSentToast')); }}
            />
          </div>
        </BottomSheet>
      )}
      <StoryViewer />
      <Toast />
    </div>
  );
}
