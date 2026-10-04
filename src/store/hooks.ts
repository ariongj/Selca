import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDb } from './db';
import { useUi } from './ui';
import { priceCart } from '@/lib/pricing';
import type { DeliveryMethod, Product } from '@/lib/types';

export const useSettings = () => useDb((s) => s.settings);

export function useCategories() {
  const cats = useDb((s) => s.categories);
  return useMemo(() => [...cats].sort((a, b) => a.order - b.order), [cats]);
}

/** Active (published) products only — what the storefront shows. */
export function useActiveProducts() {
  const products = useDb((s) => s.products);
  return useMemo(() => products.filter((p) => p.status === 'active'), [products]);
}

export function useProduct(idOrSlug: string | undefined): Product | undefined {
  return useDb((s) => s.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug));
}

export function useCategory(idOrSlug: string | undefined) {
  return useDb((s) => s.categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug));
}

/** Priced cart for the current shopper (storefront language). */
export function useCart(opts: { delivery?: DeliveryMethod; city?: string } = {}) {
  const { cart, lang, coupon } = useUi(useShallow((s) => ({ cart: s.cart, lang: s.lang, coupon: s.coupon })));
  const { products, settings, coupons } = useDb(useShallow((s) => ({ products: s.products, settings: s.settings, coupons: s.coupons })));
  return useMemo(
    () => priceCart(cart, products, settings, { lang, couponCode: coupon, coupons, delivery: opts.delivery, city: opts.city }),
    [cart, products, settings, lang, coupon, coupons, opts.delivery, opts.city],
  );
}

export function useCartCount() {
  return useUi((s) => s.cart.length);
}

/** Unseen orders + new inquiries — drives admin notification badges. */
export function useAdminBadges() {
  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  return useMemo(
    () => ({
      newOrders: orders.filter((o) => !o.seen).length,
      newInquiries: inquiries.filter((q) => !q.seen).length,
    }),
    [orders, inquiries],
  );
}
