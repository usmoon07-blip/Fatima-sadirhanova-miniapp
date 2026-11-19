import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { haptic } from '../lib/telegram';
import snapshot from '../snapshot.json';

const StoreContext = createContext(null);

const EMPTY_CATALOG = { courses: [], categories: [], stories: [], results: [], reviews: [] };
const EMPTY_ME = { user: null, purchased: [], pending: [], myCourses: [], reviews: [] };

// Ilova bilan birga yuklanadigan kurslar nusxasi — server uxlab yotsa ham kurslar darhol ko'rinadi
const SNAP_CATALOG = { ...EMPTY_CATALOG, ...(snapshot?.catalog || {}) };
const HAS_SNAPSHOT = SNAP_CATALOG.courses.length > 0;

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(snapshot?.config || null);
  const [catalog, setCatalog] = useState(SNAP_CATALOG);
  const [me, setMe] = useState(EMPTY_ME);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState(HAS_SNAPSHOT ? 'ready' : 'loading');
  const [error, setError] = useState('');

  const [cart, setCart] = useState(() => storage.get('cart', []));
  const [upsell, setUpsell] = useState(false);
  const [tab, setTabState] = useState('home');
  const [filter, setFilter] = useState({ category: 'all', query: '' });
  const [courseId, setCourseId] = useState(null);
  const [reviewCourseId, setReviewCourseId] = useState(null);
  const [storyIndex, setStoryIndex] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => storage.set('cart', cart), [cart]);

  const toast = useCallback((text, tone = 'ok') => {
    clearTimeout(toastTimer.current);
    setToastMsg({ text, tone, key: Date.now() });
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const refreshCatalog = useCallback(async () => {
    const data = await api.catalog();
    setCatalog(data);
    return data;
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const [meData, ordersData] = await Promise.all([api.me(), api.myOrders()]);
      setMe(meData);
      setOrders(ordersData);
    } catch {
      /* Telegram'dan tashqarida — shaxsiy ma'lumotlarsiz ishlaydi */
    }
  }, []);

  const load = useCallback(async () => {
    if (!HAS_SNAPSHOT) setStatus('loading');
    setError('');
    try {
      const [cfg] = await Promise.all([api.config(), refreshCatalog(), refreshMe()]);
      setConfig(cfg);
      setStatus('ready');
    } catch (err) {
      // Nusxa bor bo'lsa xatolik ko'rsatilmaydi — mijoz kurslarni ko'rib turadi
      if (HAS_SNAPSHOT) {
        setStatus('ready');
        setTimeout(() => load(), 15000);
        return;
      }
      setError(err.message);
      setStatus('error');
    }
  }, [refreshCatalog, refreshMe]);

  useEffect(() => {
    load();
  }, [load]);

  // Bazadan o'chirilgan kurslarni savatchadan olib tashlash
  useEffect(() => {
    if (status !== 'ready') return;
    const ids = new Set(catalog.courses.map((c) => c.id));
    setCart((prev) => {
      const next = prev.filter((id) => ids.has(id) && !me.purchased.includes(id));
      return next.length === prev.length ? prev : next;
    });
  }, [status, catalog.courses, me.purchased]);

  const courseMap = useMemo(() => new Map(catalog.courses.map((c) => [c.id, c])), [catalog.courses]);

  const setTab = useCallback((next) => {
    setTabState(next);
    window.scrollTo({ top: 0 });
  }, []);

  const addToCart = useCallback((id) => {
    if (me.purchased.includes(id)) {
      toast('Bu kurs sizda allaqachon bor 🎓');
      return;
    }
    setCart((prev) => (prev.includes(id) ? prev : [...prev, id]));
    haptic.success();
    toast("Savatchaga qo'shildi 🧁");
  }, [me.purchased, toast]);

  const removeFromCart = useCallback((id) => {
    haptic.light();
    setCart((prev) => prev.filter((x) => x !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setUpsell(false);
  }, []);

  const cartCourses = useMemo(() => cart.map((id) => courseMap.get(id)).filter(Boolean), [cart, courseMap]);

  const value = {
    config, catalog, me, orders, status, error, load, refreshMe, refreshCatalog,
    cart, cartCourses, addToCart, removeFromCart, clearCart, setCart, upsell, setUpsell,
    tab, setTab, filter, setFilter,
    courseId, openCourse: setCourseId, courseMap,
    reviewCourseId, openReview: setReviewCourseId,
    storyIndex, setStoryIndex,
    toastMsg, toast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
