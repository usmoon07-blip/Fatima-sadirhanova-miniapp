import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import ProductSheet from './components/ProductSheet';
import Panels from './components/Panels';
import Toast from './components/Toast';
import { StoryViewer } from './components/Stories';
import Onboarding, { LanguagePicker } from './screens/Onboarding';
import Home from './screens/Home';
import Menu from './screens/Menu';
import Cart from './screens/Cart';
import Checkout from './screens/Checkout';
import Success from './screens/Success';
import Profile from './screens/Profile';
import Orders from './screens/Orders';
import Promos from './screens/Promos';
import Courses from './screens/Courses';
import MyCourses from './screens/MyCourses';
import CourseSheet from './components/CourseSheet';
import { useStore } from './store/StoreContext';
import { storage } from './lib/storage';
import { setBackButton } from './lib/telegram';

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">🧁</div>
      <div className="loader" />
    </div>
  );
}

const TABS = {
  home: Home, menu: Menu, cart: Cart, courses: Courses, profile: Profile,
};

export default function App() {
  const [onboarded, setOnboarded] = useState(() => storage.get('onboarded', false));
  const {
    loading, error, reload, config, tab, screen, setScreen, goTo, sheetProductId, openProduct, storyIndex, setStoryIndex,
    courseId, openCourse,
    panel, setPanel, langChosen, t,
  } = useStore();

  // Telegram "Orqaga" tugmasi
  useEffect(() => {
    let handler = null;
    if (storyIndex != null) handler = () => setStoryIndex(null);
    else if (panel) handler = () => setPanel(null);
    else if (sheetProductId) handler = () => openProduct(null);
    else if (courseId) handler = () => openCourse(null);
    else if (['checkout', 'orders', 'promos', 'myCourses'].includes(screen)) handler = () => setScreen(null);
    else if (screen === 'success') handler = () => goTo('home');
    else if (tab !== 'home') handler = () => goTo('home');
    return setBackButton(handler);
  }, [storyIndex, panel, sheetProductId, courseId, screen, tab, setStoryIndex, setPanel, openProduct, openCourse, setScreen, goTo]);

  if (!langChosen) return <LanguagePicker />;

  if (!onboarded) {
    return (
      <Onboarding
        onDone={() => {
          storage.set('onboarded', true);
          setOnboarded(true);
        }}
      />
    );
  }

  if (loading && !config) return <Splash />;

  if (error && !config) {
    return (
      <div className="empty big full">
        <div className="empty-emoji">😔</div>
        <h3 className="serif">{t.connError}</h3>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={reload}>{t.retry}</button>
      </div>
    );
  }

  let content;
  if (screen === 'checkout') content = <Checkout />;
  else if (screen === 'success') content = <Success />;
  else if (screen === 'orders') content = <Orders />;
  else if (screen === 'promos') content = <Promos />;
  else if (screen === 'myCourses') content = <MyCourses />;
  else {
    const Tab = TABS[tab] || Home;
    content = <Tab />;
  }

  return (
    <div className="app">
      <main key={screen || tab} className="screen-enter">{content}</main>
      {!screen && <BottomNav />}
      <ProductSheet />
      <CourseSheet />
      <Panels />
      <StoryViewer />
      <Toast />
    </div>
  );
}
