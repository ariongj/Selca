// Shared helpers for the CMS orders area (list, detail, invoice).
import { Banknote, CreditCard, Landmark, type LucideIcon } from 'lucide-react';
import { lt } from '@/i18n';
import { num, unitLabel } from '@/lib/format';
import { fold } from '@/lib/search';
import type { Lang, Order, OrderLine, OrderStatus, PaymentMethod, Product } from '@/lib/types';

/** The happy-path flow an order moves through (cancelled sits outside it). */
export const ORDER_FLOW: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'installation', 'completed'];
export const ALL_STATUSES: OrderStatus[] = [...ORDER_FLOW, 'cancelled'];

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(s);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
}

export const PAY_ICON: Record<PaymentMethod, LucideIcon> = { cod: Banknote, bank: Landmark, card: CreditCard };

/** timeAgo() falls back to a plain date after 30 days — only worth showing before that. */
export const isRecent = (iso: string) => Date.now() - new Date(iso).getTime() < 30 * 86400000;

export const customerName = (o: Order) => `${o.customer.firstName} ${o.customer.lastName}`.trim();

/** Units a line represents: m² for packaged products, otherwise the quantity itself. */
export const lineUnits = (l: OrderLine) => (l.unit === 'm2' && l.packSize ? Math.round(l.qty * l.packSize * 100) / 100 : l.qty);

export const installationAmount = (l: OrderLine) => (l.installation && l.installationPrice ? Math.round(l.installationPrice * lineUnits(l) * 100) / 100 : 0);

/** "12 pak. · 25,92 m²" for packaged products, "3 kom" otherwise. */
export function qtyLabel(l: OrderLine, lang: Lang, packsWord: string) {
  if (l.unit === 'm2' && l.packSize) return `${l.qty} ${packsWord} · ${num(lineUnits(l), lang)} m²`;
  return `${num(l.qty, lang)} ${unitLabel(l.unit, lang)}`;
}

/**
 * Order lines are snapshotted in the customer's language. When the product still exists,
 * re-render its name and option summary in the admin's language.
 */
export function localizeLine(l: OrderLine, product: Product | undefined, from: Lang, to: Lang): { name: string; options: string } {
  if (!product || from === to) return { name: product ? lt(product.name, to) : l.name, options: l.options };
  const name = lt(product.name, to);
  if (!l.options) return { name, options: '' };
  const parts: string[] = [];
  for (const o of product.options) {
    const v = o.values.find((x) => l.options.includes(`${lt(o.name, from)}: ${lt(x.label, from)}`));
    if (v) parts.push(`${lt(o.name, to)}: ${lt(v.label, to)}`);
  }
  return { name, options: parts.length ? parts.join(' · ') : l.options };
}

export function mapsUrl(address: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, city, 'Montenegro'].filter(Boolean).join(', '))}`;
}

/** Case/diacritic-insensitive match on number, name, email, phone (digits only) and city. */
export function matchesOrder(o: Order, query: string) {
  const q = fold(query.trim());
  if (!q) return true;
  const c = o.customer;
  const hay = fold(`${o.number} ${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.city} ${c.company ?? ''}`);
  if (q.split(/\s+/).every((term) => hay.includes(term))) return true;
  const digits = q.replace(/\D/g, '');
  return digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits);
}

/** Pick a plural form: Montenegrin has one/few/many, Albanian + English one/many. */
export function pluralForm(n: number, lang: Lang): 'one' | 'few' | 'many' {
  if (lang === 'me') {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'one';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
    return 'many';
  }
  return n === 1 ? 'one' : 'many';
}

/** Semicolon CSV (Excel in ME/SQ locales) — values quoted when needed. */
export function toCsv(rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(';')).join('\r\n');
}

/** 1234.5 → "1234,50" (ME/SQ) or "1234.50" (EN) — plain, spreadsheet friendly. */
export const csvNum = (v: number, lang: Lang) => (lang === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
