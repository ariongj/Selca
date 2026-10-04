import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CartItem, Category, CmsPage, Coupon, Customer, Db, DeliveryMethod, HomeSection, Inquiry, Lang, MediaItem,
  Order, OrderStatus, PaymentMethod, Post, Product, Project, Settings,
} from '@/lib/types';
import { createSeed, DB_VERSION } from '@/data/seed';
import { priceCart } from '@/lib/pricing';
import { lt } from '@/i18n';
import { uid } from '@/lib/utils';
import { safeStorage } from './storage';

export interface PlaceOrderInput {
  customer: Customer;
  items: CartItem[];
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  couponCode?: string | null;
  lang: Lang;
}

export interface InquiryInput {
  type: Inquiry['type'];
  name: string;
  phone: string;
  email?: string;
  city?: string;
  service?: string;
  productId?: string;
  message: string;
  preferredDate?: string;
}

interface Actions {
  updateSettings: (patch: Partial<Settings>) => void;

  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => string | null;

  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;

  placeOrder: (input: PlaceOrderInput) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  addOrderNote: (id: string, note: string) => void;
  markOrderSeen: (id: string) => void;
  markAllOrdersSeen: () => void;
  deleteOrder: (id: string) => void;

  addInquiry: (input: InquiryInput) => Inquiry;
  updateInquiry: (id: string, patch: Partial<Inquiry>) => void;
  deleteInquiry: (id: string) => void;

  upsertCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;

  upsertPage: (p: CmsPage) => void;
  deletePage: (id: string) => void;

  upsertPost: (p: Post) => void;
  deletePost: (id: string) => void;

  upsertProject: (p: Project) => void;
  deleteProject: (id: string) => void;

  addMedia: (m: MediaItem) => void;
  updateMedia: (id: string, patch: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => void;

  /** Replace one homepage section (edit) */
  updateHomeSection: (section: HomeSection) => void;
  /** Replace the full list (reorder / toggle / add / remove) */
  setHome: (sections: HomeSection[]) => void;

  resetDemo: () => void;
  importDb: (db: Db) => void;
}

export type DbStore = Db & Actions;

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

const DATA_KEYS: (keyof Db)[] = ['version', 'settings', 'categories', 'products', 'orders', 'inquiries', 'coupons', 'pages', 'posts', 'projects', 'media', 'home', 'seededAt'];

export const useDb = create<DbStore>()(
  persist(
    (set, get) => ({
      ...createSeed(),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      upsertProduct: (p) => set((s) => ({ products: upsert(s.products, { ...p, updatedAt: new Date().toISOString() }) })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      duplicateProduct: (id) => {
        const src = get().products.find((p) => p.id === id);
        if (!src) return null;
        const copy: Product = {
          ...structuredClone(src),
          id: uid('p'),
          slug: `${src.slug}-kopija`,
          sku: `${src.sku}-K`,
          name: { me: `${src.name.me} (kopija)`, sq: `${src.name.sq} (kopje)`, en: `${src.name.en} (copy)` },
          status: 'draft',
          sold: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ products: [copy, ...s.products] }));
        return copy.id;
      },

      upsertCategory: (c) => set((s) => ({ categories: upsert(s.categories, c).sort((a, b) => a.order - b.order) })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      moveCategory: (id, dir) =>
        set((s) => {
          const list = [...s.categories].sort((a, b) => a.order - b.order);
          const i = list.findIndex((c) => c.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= list.length) return {};
          [list[i], list[j]] = [list[j], list[i]];
          return { categories: list.map((c, k) => ({ ...c, order: k + 1 })) };
        }),

      placeOrder: (input) => {
        const s = get();
        const totals = priceCart(input.items, s.products, s.settings, {
          lang: input.lang,
          couponCode: input.couponCode,
          coupons: s.coupons,
          delivery: input.delivery,
          city: input.customer.city,
        });
        const maxNum = s.orders.reduce((m, o) => Math.max(m, Number(o.number.replace(/\D/g, '')) || 0), 1000);
        const now = new Date().toISOString();
        const order: Order = {
          id: uid('o'),
          number: `SC-${maxNum + 1}`,
          createdAt: now,
          status: 'new',
          customer: input.customer,
          items: totals.lines.map((l) => ({
            productId: l.product.id,
            sku: l.product.sku,
            name: lt(l.product.name, input.lang),
            image: l.product.images[0] ?? '',
            unit: l.product.unit,
            packSize: l.product.packSize,
            qty: l.item.qty,
            options: l.optionsLabel,
            unitPrice: l.unitPrice,
            installation: l.item.installation,
            installationPrice: l.installationUnitPrice,
            lineTotal: l.lineTotal,
          })),
          delivery: { method: input.delivery, fee: totals.shipping },
          payment: { method: input.payment, status: input.payment === 'card' ? 'paid' : 'pending' },
          coupon: totals.coupon ? { code: totals.coupon.code, discount: totals.discount } : null,
          subtotal: totals.subtotal,
          installationTotal: totals.installationTotal,
          discount: totals.discount,
          shipping: totals.shipping,
          total: totals.total,
          vat: totals.vat,
          lang: input.lang,
          timeline: [{ at: now, status: 'new', by: 'web' }],
          seen: false,
        };
        set((st) => ({
          orders: [order, ...st.orders],
          products: st.products.map((p) => {
            const qty = input.items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.qty, 0);
            if (!qty) return p;
            return { ...p, sold: p.sold + qty, stock: p.stock >= 999 ? p.stock : Math.max(0, p.stock - qty) };
          }),
          coupons: totals.coupon ? st.coupons.map((c) => (c.id === totals.coupon!.id ? { ...c, uses: c.uses + 1 } : c)) : st.coupons,
        }));
        return order;
      },
      updateOrder: (id, patch) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      setOrderStatus: (id, status, note) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const payment =
              status === 'completed' && o.payment.method === 'cod' ? { ...o.payment, status: 'paid' as const } : status === 'cancelled' && o.payment.status === 'paid' ? { ...o.payment, status: 'refunded' as const } : o.payment;
            return { ...o, status, payment, seen: true, timeline: [...o.timeline, { at: new Date().toISOString(), status, note, by: 'admin' }] };
          }),
        })),
      addOrderNote: (id, note) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, timeline: [...o.timeline, { at: new Date().toISOString(), status: 'note', note, by: 'admin' }] } : o)),
        })),
      markOrderSeen: (id) => set((s) => ({ orders: s.orders.map((o) => (o.id === id && !o.seen ? { ...o, seen: true } : o)) })),
      markAllOrdersSeen: () => set((s) => ({ orders: s.orders.map((o) => (o.seen ? o : { ...o, seen: true })) })),
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      addInquiry: (input) => {
        const inq: Inquiry = { id: uid('inq'), createdAt: new Date().toISOString(), status: 'new', seen: false, ...input };
        set((s) => ({ inquiries: [inq, ...s.inquiries] }));
        return inq;
      },
      updateInquiry: (id, patch) => set((s) => ({ inquiries: s.inquiries.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      deleteInquiry: (id) => set((s) => ({ inquiries: s.inquiries.filter((q) => q.id !== id) })),

      upsertCoupon: (c) => set((s) => ({ coupons: upsert(s.coupons, { ...c, code: c.code.trim().toUpperCase() }) })),
      deleteCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),

      upsertPage: (p) => set((s) => ({ pages: upsert(s.pages, { ...p, updatedAt: new Date().toISOString() }) })),
      deletePage: (id) => set((s) => ({ pages: s.pages.filter((p) => p.id !== id) })),

      upsertPost: (p) => set((s) => ({ posts: upsert(s.posts, p).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) })),
      deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      upsertProject: (p) => set((s) => ({ projects: upsert(s.projects, p) })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addMedia: (m) => set((s) => ({ media: [m, ...s.media] })),
      updateMedia: (id, patch) => set((s) => ({ media: s.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMedia: (id) => set((s) => ({ media: s.media.filter((m) => m.id !== id) })),

      updateHomeSection: (section) => set((s) => ({ home: s.home.map((h) => (h.id === section.id ? section : h)) })),
      setHome: (home) => set({ home }),

      resetDemo: () => set({ ...createSeed() }),
      importDb: (db) => set({ ...db, version: DB_VERSION }),
    }),
    {
      name: 'selca-db',
      version: DB_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as DbStore,
      // Any schema change → start from fresh demo data.
      migrate: () => createSeed() as unknown as DbStore,
    },
  ),
);

/** Convenience non-reactive accessor */
export const db = () => useDb.getState();
