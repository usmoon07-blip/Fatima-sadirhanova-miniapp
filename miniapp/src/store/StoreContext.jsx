import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { haptic, tgUser } from '../lib/telegram';
import { detectLang, getDict, loc, money as fmtMoney } from '../lib/i18n';

const StoreContext = createContext(null);

export function unitPrice(product, size) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  if (!sizes.length) return { price: product?.price || 0, size: null };
  const found = sizes.find((s) => s.label === size) || sizes[0];
  return { price: found.price, size: found.label };
}

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState({ categories: [], products: [], stories: [], promos: [] });
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lang, setLangState] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    return fromUrl || storage.get('lang', null) || detectLang(tgUser()?.language_code);
  });
  const [langChosen, setLangChosen] = useState(() => Boolean(storage.get('lang', null) || new URLSearchParams(window.location.search).get('lang')));

  const [cart, setCart] = useState(() => storage.get('cart', []));
  const [favorites, setFavorites] = useState(() => storage.get('favorites', []));
  const [promo, setPromo] = useState(() => storage.get('promo', null)); // { code, discount }
  const [deliveryType, setDeliveryType] = useState(() => storage.get('checkout', {}).deliveryType || 'DELIVERY');

  // Navigatsiya
  const [tab, setTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuQuery, setMenuQuery] = useState('');
  const [sheetProductId, setSheetProductId] = useState(null);
  const [screen, setScreen] = useState(null); // 'checkout' | 'success' | 'orders'
  const [panel, setPanel] = useState(null); // 'address' | 'about'
  const [storyIndex, setStoryIndex] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const t = getDict(lang);
  const money = useCallback((n) => fmtMoney(n, lang), [lang]);

  useEffect(() => storage.set('cart', cart), [cart]);
  useEffect(() => storage.set('favorites', favorites), [favorites]);
  useEffect(() => storage.set('promo', promo), [promo]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const refreshMe = useCallback(() => api.me().then((r) => {
    setUser(r.user);
    setUserStats(r.stats);
    return r.user;
  }).catch(() => null), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cfg, cat] = await Promise.all([api.config(), api.catalog()]);
      setConfig(cfg);
      setCatalog(cat);
      refreshMe().then((u) => {
        if (u?.language && !storage.get('lang', null) && !new URLSearchParams(window.location.search).get('lang')) {
          setLangState(u.language);
        }
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshMe]);

  useEffect(() => {
    load();
  }, [load]);

  const setLang = useCallback((next) => {
    setLangState(next);
    setLangChosen(true);
    storage.set('lang', next);
    haptic.select();
    api.updateLanguage(next).catch(() => {});
  }, []);

  const showToast = useCallback((text, tone = 'ok') => {
    setToast({ text, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const productsById = useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog.products]);

  const addToCart = useCallback((product, size, quantity = 1, { silent } = {}) => {
    const resolved = unitPrice(product, size).size;
    const key = `${product.id}:${resolved || ''}`;
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 50) } : i));
      return [...prev, { key, productId: product.id, size: resolved, quantity }];
    });
    haptic.light();
    if (!silent) showToast(getDict(lang).added(loc(product, 'name', lang)));
  }, [showToast, lang]);

  const setQuantity = useCallback((key, quantity) => {
    setCart((prev) => (quantity <= 0
      ? prev.filter((i) => i.key !== key)
      : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 50) } : i))));
    haptic.select();
  }, []);

  const removeFromCart = useCallback((key) => setCart((prev) => prev.filter((i) => i.key !== key)), []);
  const clearCart = useCallback(() => {
    setCart([]);
    setPromo(null);
  }, []);

  const toggleFavorite = useCallback((id) => {
    haptic.select();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const cartLines = useMemo(() => cart
    .map((item) => {
      const product = productsById.get(item.productId);
      if (!product) return null;
      const { price } = unitPrice(product, item.size);
      return { ...item, product, price, total: price * item.quantity };
    })
    .filter(Boolean), [cart, productsById]);

  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cartLines.reduce((s, l) => s + l.total, 0);

  // Promokodni savat summasi o'zgarganda serverda qayta tekshirish
  const promoCheckRef = useRef(0);
  const applyPromo = useCallback(async (code, { silent } = {}) => {
    const id = ++promoCheckRef.current;
    try {
      const r = await api.checkPromo(code, subtotal);
      if (id !== promoCheckRef.current) return true;
      setPromo({ code: r.code, discount: r.discount });
      if (!silent) {
        haptic.success();
        showToast(getDict(lang).promoApplied(r.code));
      }
      return true;
    } catch (e) {
      if (id !== promoCheckRef.current) return false;
      const d = getDict(lang);
      const msg = e.reason === 'MIN_ORDER' ? d.promoErr.MIN_ORDER(fmtMoney(e.minOrder, lang)) : d.promoErr[e.reason] || e.message;
      if (silent) setPromo((p) => (p ? { ...p, discount: 0, error: msg } : p));
      else {
        haptic.error();
        showToast(msg, 'bad');
      }
      return false;
    }
  }, [subtotal, lang, showToast]);

  useEffect(() => {
    if (!promo?.code || !subtotal) return undefined;
    const timer = setTimeout(() => applyPromo(promo.code, { silent: true }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const discount = promo && !promo.error ? Math.min(promo.discount || 0, subtotal) : 0;

  const deliveryFeeFor = useCallback((type) => {
    if (!config || type !== 'DELIVERY') return 0;
    const { fee, freeFrom } = config.delivery;
    return freeFrom && subtotal - discount >= freeFrom ? 0 : fee;
  }, [config, subtotal, discount]);

  const reorder = useCallback((order) => {
    let added = 0;
    for (const item of order.items || []) {
      const product = productsById.get(item.productId);
      if (product) {
        addToCart(product, item.size, item.quantity, { silent: true });
        added += 1;
      }
    }
    const d = getDict(lang);
    if (added) {
      showToast(d.reordered);
      setScreen(null);
      setTab('cart');
    } else {
      showToast(d.unavailable, 'bad');
    }
  }, [productsById, addToCart, showToast, lang]);

  const goTo = useCallback((nextTab, opts = {}) => {
    haptic.select();
    if (opts.category !== undefined) setActiveCategory(opts.category);
    if (opts.query !== undefined) setMenuQuery(opts.query);
    setScreen(null);
    setTab(nextTab);
    window.scrollTo({ top: 0 });
  }, []);

  const displayName = user?.firstName || tgUser()?.first_name || t.guest;

  const value = {
    config, catalog, user, setUser, userStats, refreshMe, loading, error, reload: load, displayName,
    lang, setLang, langChosen, t, money,
    cart, cartLines, cartCount, subtotal, addToCart, setQuantity, removeFromCart, clearCart, reorder,
    promo, setPromo, applyPromo, discount, deliveryType, setDeliveryType, deliveryFeeFor,
    favorites, toggleFavorite, productsById,
    tab, goTo, activeCategory, setActiveCategory, menuQuery, setMenuQuery,
    sheetProductId, openProduct: setSheetProductId,
    screen, setScreen, panel, setPanel, storyIndex, setStoryIndex, lastOrder, setLastOrder,
    toast, showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
