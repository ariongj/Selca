// Core data model shared by the storefront and the CMS.
// Everything the client can edit lives in the persisted `db` store (see store/db.ts).

export type Lang = 'me' | 'sq' | 'en';

/** A localized string: Montenegrin (default), Albanian, English. */
export type L10n = { me: string; sq: string; en: string };

/** Units a product can be sold in. */
export type Unit = 'kom' | 'm2' | 'm' | 'set';

export type Badge = 'new' | 'sale' | 'bestseller' | 'premium';

export interface Category {
  id: string;
  slug: string;
  name: L10n;
  tagline: L10n;
  description: L10n;
  image: string;
  order: number;
  featured: boolean;
}

export interface ProductOptionValue {
  id: string;
  label: L10n;
  /** CSS color for swatch-type options */
  swatch?: string;
  /** Added to the unit price when selected (EUR, VAT incl.) */
  priceDelta?: number;
}

export interface ProductOption {
  id: string;
  name: L10n;
  type: 'swatch' | 'button';
  values: ProductOptionValue[];
}

export interface ProductSpec {
  label: L10n;
  value: L10n;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  categoryId: string;
  name: L10n;
  short: L10n;
  description: L10n;
  /** Regular price in EUR (VAT included) per unit */
  price: number;
  /** Optional sale price (VAT included) */
  salePrice?: number | null;
  unit: Unit;
  /** m² per package (flooring/tiles) — cart quantity is in packages */
  packSize?: number;
  stock: number;
  images: string[];
  options: ProductOption[];
  specs: ProductSpec[];
  /** Installation offered as an add-on, priced per unit (per m² for m2 products) */
  installation?: { available: boolean; price: number } | null;
  badges: Badge[];
  featured: boolean;
  status: 'active' | 'draft';
  /** Made-to-measure products: "Request a quote" instead of "Add to cart" */
  quoteOnly?: boolean;
  /** Typical lead time in days */
  leadDays?: number;
  warrantyYears?: number;
  seo?: { title?: string; description?: string };
  createdAt: string;
  updatedAt?: string;
  sold: number;
}

export interface CartItem {
  key: string;
  productId: string;
  /** pieces / metres / packages (for m2 products) */
  qty: number;
  options: Record<string, string>;
  installation: boolean;
}

export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'installation' | 'completed' | 'cancelled';
export type PaymentMethod = 'cod' | 'bank' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type DeliveryMethod = 'delivery' | 'pickup';

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unit: Unit;
  packSize?: number;
  qty: number;
  /** Human readable option summary, e.g. "Širina: 80 cm · Boja: Bijela" */
  options: string;
  unitPrice: number;
  installation: boolean;
  installationPrice: number;
  lineTotal: number;
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  company?: string;
  pib?: string;
  note?: string;
}

export interface OrderEvent {
  at: string;
  status: OrderStatus | 'note' | 'payment';
  note?: string;
  by?: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderLine[];
  delivery: { method: DeliveryMethod; fee: number; date?: string };
  payment: { method: PaymentMethod; status: PaymentStatus };
  coupon?: { code: string; discount: number } | null;
  subtotal: number;
  installationTotal: number;
  discount: number;
  shipping: number;
  total: number;
  vat: number;
  lang: Lang;
  timeline: OrderEvent[];
  internalNote?: string;
  /** false until an admin opens it — drives the "new" badge */
  seen: boolean;
  demo?: boolean;
}

export type InquiryType = 'measurement' | 'contact' | 'quote';
export type InquiryStatus = 'new' | 'contacted' | 'scheduled' | 'done';

export interface Inquiry {
  id: string;
  createdAt: string;
  type: InquiryType;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  service?: string;
  productId?: string;
  message: string;
  preferredDate?: string;
  status: InquiryStatus;
  seen: boolean;
  scheduledAt?: string;
  note?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minTotal?: number;
  active: boolean;
  uses: number;
  expiresAt?: string;
  description?: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: L10n;
  /** Lightweight markdown: ## headings, - lists, **bold**, [links](url), > quotes */
  body: L10n;
  published: boolean;
  showInFooter: boolean;
  updatedAt: string;
}

export interface Post {
  id: string;
  slug: string;
  title: L10n;
  excerpt: L10n;
  body: L10n;
  cover: string;
  tag: L10n;
  author: string;
  readMinutes: number;
  publishedAt: string;
  published: boolean;
}

export interface Project {
  id: string;
  title: L10n;
  location: string;
  year: number;
  tags: L10n[];
  summary: L10n;
  image: string;
  featured: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  alt?: string;
  folder: string;
  uploaded: boolean;
  createdAt: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface Cta { label: L10n; href: string }

export interface HeroSlide {
  id: string;
  image: string;
  eyebrow: L10n;
  title: L10n;
  subtitle: L10n;
  primary: Cta;
  secondary: Cta;
}

/** Homepage is a list of sections the client can reorder, toggle and edit. */
export type HomeSection =
  | { id: string; type: 'hero'; enabled: boolean; data: { slides: HeroSlide[]; autoplay: boolean } }
  | { id: string; type: 'trust'; enabled: boolean; data: { items: { icon: string; title: L10n; text: L10n }[] } }
  | { id: string; type: 'categories'; enabled: boolean; data: { eyebrow: L10n; title: L10n; subtitle: L10n } }
  | { id: string; type: 'featured'; enabled: boolean; data: { eyebrow: L10n; title: L10n; mode: 'bestsellers' | 'sale' | 'new' | 'manual'; productIds: string[] } }
  | { id: string; type: 'promo'; enabled: boolean; data: { eyebrow: L10n; title: L10n; text: L10n; image: string; cta: Cta; endsAt: string; code: string } }
  | { id: string; type: 'process'; enabled: boolean; data: { eyebrow: L10n; title: L10n; steps: { title: L10n; text: L10n }[] } }
  | { id: string; type: 'services'; enabled: boolean; data: { eyebrow: L10n; title: L10n; subtitle: L10n; items: { image: string; title: L10n; text: L10n }[] } }
  | { id: string; type: 'projects'; enabled: boolean; data: { eyebrow: L10n; title: L10n; subtitle: L10n } }
  | { id: string; type: 'stats'; enabled: boolean; data: { items: { value: string; label: L10n }[]; quote: L10n; image: string } }
  | { id: string; type: 'instagram'; enabled: boolean; data: { title: L10n; images: string[] } }
  | { id: string; type: 'faq'; enabled: boolean; data: { eyebrow: L10n; title: L10n; items: { q: L10n; a: L10n }[] } }
  | { id: string; type: 'blog'; enabled: boolean; data: { eyebrow: L10n; title: L10n } }
  | { id: string; type: 'cta'; enabled: boolean; data: { eyebrow: L10n; title: L10n; text: L10n; image: string } };

export type HomeSectionType = HomeSection['type'];

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  fee: number;
  days: string;
}

export interface Settings {
  companyName: string;
  legalName: string;
  tagline: L10n;
  about: L10n;
  email: string;
  phone: string;
  phone2?: string;
  whatsapp?: string;
  address: string;
  city: string;
  mapUrl: string;
  hours: L10n;
  pib: string;
  pdv: string;
  bankName: string;
  bankAccount: string;
  instagram: string;
  facebook?: string;
  currency: 'EUR';
  vatRate: number;
  freeShippingThreshold: number;
  shippingZones: ShippingZone[];
  pickupAddress: string;
  payments: { cod: boolean; bank: boolean; card: boolean };
  languages: { me: boolean; sq: boolean; en: boolean };
  announcements: L10n[];
  brandColor: string;
  demoBanner: boolean;
  seo: { title: string; description: string };
  adminEmail: string;
}

export interface Db {
  version: number;
  settings: Settings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  inquiries: Inquiry[];
  coupons: Coupon[];
  pages: CmsPage[];
  posts: Post[];
  projects: Project[];
  media: MediaItem[];
  home: HomeSection[];
  /** ISO time the demo data was (re)generated */
  seededAt: string;
}
