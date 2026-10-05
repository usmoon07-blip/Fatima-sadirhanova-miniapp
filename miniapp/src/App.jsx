import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import ProductSheet from './components/ProductSheet';
import Toast from './components/Toast';
import { StoryViewer } from './components/Stories';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Catalog from './screens/Catalog';
import Cart from './screens/Cart';
import Checkout from './screens/Checkout';
import Success from './screens/Success';
import Profile from './screens/Profile';
import Orders from './screens/Orders';
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

export default function App() {
  const [onboarded, setOnboarded] = useState(() => storage.get('onboarded', false));
  const {
    loading, error, reload, config, tab, screen, setScreen, goTo, sheetProductId, openProduct, storyIndex, setStoryIndex,
  } = useStore();

  // Telegram "Orqaga" tugmasi
  useEffect(() => {
    let handler = null;
    if (storyIndex != null) handler = () => setStoryIndex(null);
    else if (sheetProductId) handler = () => openProduct(null);
    else if (screen === 'checkout' || screen === 'orders') handler = () => setScreen(null);
    else if (screen === 'success') handler = () => goTo('home');
    else if (tab !== 'home') handler = () => goTo('home');
    return setBackButton(handler);
  }, [storyIndex, sheetProductId, screen, tab, setStoryIndex, openProduct, setScreen, goTo]);

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
        <h3 className="serif">Ulanishda xatolik</h3>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={reload}>Qayta urinish</button>
      </div>
    );
  }

  let content;
  if (screen === 'checkout') content = <Checkout />;
  else if (screen === 'success') content = <Success />;
  else if (screen === 'orders') content = <Orders />;
  else if (tab === 'catalog') content = <Catalog />;
  else if (tab === 'cart') content = <Cart />;
  else if (tab === 'profile') content = <Profile />;
  else content = <Home />;

  return (
    <div className="app">
      <main key={screen || tab} className="screen-enter">{content}</main>
      {!screen && <BottomNav />}
      <ProductSheet />
      <StoryViewer />
      <Toast />
    </div>
  );
}
