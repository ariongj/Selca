import type { CartItem, Coupon, DeliveryMethod, Lang, Product, Settings } from './types';
import { lt } from '@/i18n';
import { round2 } from './utils';

/** Waste allowance added by the m² calculator. */
export const WASTE = 0.1;

/** Number of packs needed to cover an area (incl. waste allowance). */
export function packsForArea(area: number, packSize: number, waste = WASTE) {
  if (!area || area <= 0 || !packSize) return 0;
  return Math.ceil((area * (1 + waste)) / packSize - 1e-9);
}

export function basePrice(p: Product) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function isOnSale(p: Product) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
}

export function discountPct(p: Product) {
  return isOnSale(p) ? Math.round((1 - (p.salePrice as number) / p.price) * 100) : 0;
}

export function optionsDelta(p: Product, options: Record<string, string>) {
  let delta = 0;
  for (const o of p.options) {
    const v = o.values.find((x) => x.id === options[o.id]);
    if (v?.priceDelta) delta += v.priceDelta;
  }
  return delta;
}

/** Unit price (VAT incl.) for the chosen options — per piece, per m² or per metre. */
export function unitPrice(p: Product, options: Record<string, string> = {}) {
  return round2(basePrice(p) + optionsDelta(p, options));
}

export function regularUnitPrice(p: Product, options: Record<string, string> = {}) {
  return round2(p.price + optionsDelta(p, options));
}

/** Units the line represents: m² for packaged products, otherwise the quantity itself. */
export function qtyUnits(p: Product, qty: number) {
  return p.unit === 'm2' && p.packSize ? round2(qty * p.packSize) : qty;
}

export function optionsLabel(p: Product, options: Record<string, string>, lang: Lang) {
  return p.options
    .map((o) => {
      const v = o.values.find((x) => x.id === options[o.id]);
      return v ? `${lt(o.name, lang)}: ${lt(v.label, lang)}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

export function defaultOptions(p: Product) {
  const out: Record<string, string> = {};
  for (const o of p.options) if (o.values[0]) out[o.id] = o.values[0].id;
  return out;
}

export interface PricedLine {
  item: CartItem;
  product: Product;
  unitPrice: number;
  regularUnitPrice: number;
  units: number;
  lineTotal: number;
  installationUnitPrice: number;
  installationTotal: number;
  optionsLabel: string;
}

export type CouponError = 'notfound' | 'inactive' | 'expired' | 'min';

export function validateCoupon(code: string | null | undefined, coupons: Coupon[], subtotal: number): { coupon: Coupon | null; error?: CouponError } {
  if (!code) return { coupon: null };
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { coupon: null, error: 'notfound' };
  if (!c.active) return { coupon: null, error: 'inactive' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { coupon: null, error: 'expired' };
  if (c.minTotal && subtotal < c.minTotal) return { coupon: null, error: 'min' };
  return { coupon: c };
}

export function couponDiscount(c: Coupon | null, subtotal: number) {
  if (!c) return 0;
  const d = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
  return round2(Math.min(d, subtotal));
}

export function zoneForCity(settings: Settings, city?: string) {
  if (!city) return null;
  return settings.shippingZones.find((z) => z.cities.some((c) => c.toLowerCase() === city.toLowerCase())) ?? null;
}

export function allCities(settings: Settings) {
  return settings.shippingZones.flatMap((z) => z.cities).sort((a, b) => a.localeCompare(b, 'sr'));
}

export interface Totals {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  installationTotal: number;
  discount: number;
  shipping: number;
  /** true when no city chosen yet and shipping is an estimate ("from") */
  shippingEstimate: boolean;
  freeShippingReason: 'threshold' | 'installation' | 'pickup' | null;
  freeShippingRemaining: number;
  total: number;
  vat: number;
  hasInstallation: boolean;
  coupon: Coupon | null;
  couponError?: CouponError;
}

export function priceCart(
  cart: CartItem[],
  products: Product[],
  settings: Settings,
  opts: { lang: Lang; couponCode?: string | null; coupons?: Coupon[]; delivery?: DeliveryMethod; city?: string },
): Totals {
  const lines: PricedLine[] = [];
  for (const item of cart) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const up = unitPrice(product, item.options);
    const units = qtyUnits(product, item.qty);
    const instUnit = item.installation && product.installation?.available ? product.installation.price : 0;
    lines.push({
      item,
      product,
      unitPrice: up,
      regularUnitPrice: regularUnitPrice(product, item.options),
      units,
      lineTotal: round2(up * units),
      installationUnitPrice: instUnit,
      installationTotal: round2(instUnit * units),
      optionsLabel: optionsLabel(product, item.options, opts.lang),
    });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const installationTotal = round2(lines.reduce((s, l) => s + l.installationTotal, 0));
  const hasInstallation = installationTotal > 0;
  const { coupon, error } = validateCoupon(opts.couponCode, opts.coupons ?? [], subtotal);
  const discount = couponDiscount(coupon, subtotal);

  let shipping = 0;
  let shippingEstimate = false;
  let freeShippingReason: Totals['freeShippingReason'] = null;
  if (lines.length) {
    if (opts.delivery === 'pickup') freeShippingReason = 'pickup';
    else if (hasInstallation) freeShippingReason = 'installation';
    else if (subtotal >= settings.freeShippingThreshold) freeShippingReason = 'threshold';
    else {
      const zone = zoneForCity(settings, opts.city);
      if (zone) shipping = zone.fee;
      else {
        shipping = Math.min(...settings.shippingZones.map((z) => z.fee));
        shippingEstimate = true;
      }
    }
  }
  const total = round2(subtotal + installationTotal - discount + shipping);
  const vat = round2(total - total / (1 + settings.vatRate / 100));
  return {
    lines,
    count: lines.reduce((s, l) => s + (l.product.unit === 'kom' || l.product.unit === 'set' ? l.item.qty : 1), 0),
    subtotal,
    installationTotal,
    discount,
    shipping,
    shippingEstimate,
    freeShippingReason,
    freeShippingRemaining: Math.max(0, round2(settings.freeShippingThreshold - subtotal)),
    total,
    vat,
    hasInstallation,
    coupon,
    couponError: error,
  };
}
