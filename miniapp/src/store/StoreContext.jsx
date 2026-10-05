import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { haptic, tgUser } from '../lib/telegram';

const StoreContext = createContext(null);

export function unitPrice(product, size) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  if (!sizes.length) return { price: product?.price || 0, size: null };
  const found = sizes.find((s) => s.label === size) || sizes[0];
  return { price: found.price, size: found.label };
}

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState({ categories: [], products: [], stories: [] });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cart, setCart] = useState(() => storage.get('cart', []));
  const [favorites, setFavorites] = useState(() => storage.get('favorites', []));

  // Navigatsiya
  const [tab, setTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sheetProductId, setSheetProductId] = useState(null);
  const [screen, setScreen] = useState(null); // 'checkout' | 'success' | 'orders'
  const [storyIndex, setStoryIndex] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => storage.set('cart', cart), [cart]);
  useEffect(() => storage.set('favorites', favorites), [favorites]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cfg, cat] = await Promise.all([api.config(), api.catalog()]);
      setConfig(cfg);
      setCatalog(cat);
      api.me().then((r) => setUser(r.user)).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = useCallback((text, tone = 'ok') => {
    setToast({ text, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
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
    if (!silent) showToast(`${product.name} savatchaga qo'shildi`);
  }, [showToast]);

  const setQuantity = useCallback((key, quantity) => {
    setCart((prev) => (quantity <= 0
      ? prev.filter((i) => i.key !== key)
      : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 50) } : i))));
    haptic.select();
  }, []);

  const removeFromCart = useCallback((key) => setCart((prev) => prev.filter((i) => i.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((id) => {
    haptic.select();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // Savatcha qatorlari (mavjud bo'lmagan mahsulotlar tushib qoladi)
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

  const reorder = useCallback((order) => {
    let added = 0;
    for (const item of order.items || []) {
      const product = productsById.get(item.productId);
      if (product) {
        addToCart(product, item.size, item.quantity, { silent: true });
        added += 1;
      }
    }
    if (added) {
      showToast("Mahsulotlar savatchaga qo'shildi");
      setScreen(null);
      setTab('cart');
    } else {
      showToast('Bu mahsulotlar hozir mavjud emas', 'bad');
    }
  }, [productsById, addToCart, showToast]);

  const goTo = useCallback((nextTab, opts = {}) => {
    haptic.select();
    if (opts.category) setActiveCategory(opts.category);
    setScreen(null);
    setTab(nextTab);
    window.scrollTo({ top: 0 });
  }, []);

  const displayName = user?.firstName || tgUser()?.first_name || 'mehmon';

  const value = {
    config, catalog, user, setUser, loading, error, reload: load, displayName,
    cart, cartLines, cartCount, subtotal, addToCart, setQuantity, removeFromCart, clearCart, reorder,
    favorites, toggleFavorite, productsById,
    tab, goTo, activeCategory, setActiveCategory,
    sheetProductId, openProduct: setSheetProductId,
    screen, setScreen, storyIndex, setStoryIndex, lastOrder, setLastOrder,
    toast, showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
