import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Lang } from '@/lib/types';
import { safeStorage } from './storage';

export function cartKey(productId: string, options: Record<string, string>, installation: boolean) {
  const opts = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('&');
  return `${productId}|${opts}|${installation ? 'i' : ''}`;
}

interface UiState {
  lang: Lang;
  adminLang: Lang;
  cart: CartItem[];
  wishlist: string[];
  coupon: string | null;
  recentlyViewed: string[];
  adminAuthed: boolean;
  /** Last time the admin looked at notifications */
  cartOpen: boolean;
  searchOpen: boolean;

  setLang: (lang: Lang) => void;
  setAdminLang: (lang: Lang) => void;
  addToCart: (item: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  setInstallation: (key: string, on: boolean) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => void;
  setCoupon: (code: string | null) => void;
  pushViewed: (productId: string) => void;
  login: () => void;
  logout: () => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      lang: 'me',
      adminLang: 'me',
      cart: [],
      wishlist: [],
      coupon: null,
      recentlyViewed: [],
      adminAuthed: false,
      cartOpen: false,
      searchOpen: false,

      setLang: (lang) => set({ lang }),
      setAdminLang: (adminLang) => set({ adminLang }),
      addToCart: (item) =>
        set((s) => {
          const key = cartKey(item.productId, item.options, item.installation);
          const existing = s.cart.find((c) => c.key === key);
          if (existing) {
            return { cart: s.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + item.qty } : c)) };
          }
          return { cart: [...s.cart, { ...item, key }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((c) => c.key !== key) : s.cart.map((c) => (c.key === key ? { ...c, qty } : c)),
        })),
      setInstallation: (key, on) =>
        set((s) => {
          const line = s.cart.find((c) => c.key === key);
          if (!line) return {};
          const newKey = cartKey(line.productId, line.options, on);
          const clash = s.cart.find((c) => c.key === newKey);
          if (clash) {
            return {
              cart: s.cart
                .filter((c) => c.key !== key)
                .map((c) => (c.key === newKey ? { ...c, qty: c.qty + line.qty } : c)),
            };
          }
          return { cart: s.cart.map((c) => (c.key === key ? { ...c, installation: on, key: newKey } : c)) };
        }),
      removeFromCart: (key) => set((s) => ({ cart: s.cart.filter((c) => c.key !== key) })),
      clearCart: () => set({ cart: [], coupon: null }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      toggleWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] })),
      setCoupon: (coupon) => set({ coupon }),
      pushViewed: (id) => set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((v) => v !== id)].slice(0, 12) })),
      login: () => set({ adminAuthed: true }),
      logout: () => set({ adminAuthed: false }),
    }),
    {
      name: 'selca-ui',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        lang: s.lang,
        adminLang: s.adminLang,
        cart: s.cart,
        wishlist: s.wishlist,
        coupon: s.coupon,
        recentlyViewed: s.recentlyViewed,
        adminAuthed: s.adminAuthed,
      }),
    },
  ),
);
