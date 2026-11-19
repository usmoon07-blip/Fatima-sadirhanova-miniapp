import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import CourseSheet from './components/CourseSheet';
import ReviewSheet from './components/ReviewSheet';
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
import { setBackButton } from './lib/telegram';

const SCREENS = { home: Home, courses: Catalog, cart: Cart, results: Results, profile: Profile };

function Splash() {
  return (
    <div className="splash">
      <span className="brand-logo big">🧁</span>
      <b className="serif">Fatima Sadirkhanova</b>
      <small>PATISSERIE</small>
      <span className="loader" />
    </div>
  );
}

export default function App() {
  const { status, error, load, tab, setTab, courseId, reviewCourseId, storyIndex } = useStore();
  const [onboarded, setOnboarded] = useState(() => storage.get('onboarded', false));

  // Telegram "Orqaga" tugmasi: boshqa tabdan bosh sahifaga
  const overlayOpen = courseId != null || reviewCourseId != null || storyIndex != null;
  useEffect(() => {
    if (overlayOpen || !onboarded) return undefined;
    return setBackButton(tab !== 'home' ? () => setTab('home') : null);
  }, [tab, overlayOpen, onboarded, setTab]);

  if (!onboarded) {
    return <Onboarding onDone={() => { storage.set('onboarded', true); setOnboarded(true); }} />;
  }

  if (status === 'loading') return <Splash />;
  if (status === 'error') {
    return (
      <div className="splash">
        <span className="brand-logo big">🥺</span>
        <b>Ulanishda xatolik</b>
        <small className="muted">{error}</small>
        <button type="button" className="btn btn-primary" onClick={load}>Qayta urinish</button>
      </div>
    );
  }

  const Screen = SCREENS[tab] || Home;

  return (
    <div className="app">
      <main key={tab} className="screen">
        <Screen />
      </main>
      <BottomNav />
      {courseId != null && <CourseSheet />}
      {reviewCourseId != null && <ReviewSheet key={reviewCourseId} />}
      <StoryViewer />
      <Toast />
    </div>
  );
}
