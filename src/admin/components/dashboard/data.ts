// Pure dashboard maths: time buckets, period stats, top products, upcoming measurements.
// Everything is derived from the raw store slices inside `useMemo` (see Dashboard.tsx).
import type { Category, Inquiry, Order, OrderStatus, Product, Unit } from '@/lib/types';

export type Period = 7 | 30 | 90;
export const PERIODS: Period[] = [7, 30, 90];

/** Pipeline order — also the order of the ordinal colour ramp. */
export const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'installation', 'completed', 'cancelled'];

export const OPEN_INQUIRY: Inquiry['status'][] = ['new', 'contacted', 'scheduled'];

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Local YYYY-MM-DD (not UTC) */
export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const counts = (o: Order) => o.status !== 'cancelled';

/* ------------------------------------------------------------------ */
/* Time buckets                                                        */
/* ------------------------------------------------------------------ */
export interface Bucket {
  start: Date;
  /** exclusive */
  end: Date;
  revenue: number;
  /** non-cancelled orders (the ones behind `revenue`) */
  orders: number;
  /** every order placed, cancelled included */
  placed: number;
  /** last bucket — contains today and is still in progress */
  current: boolean;
}

/** Buckets of `step` days covering the last `period` days (today included), oldest first. */
export function buildBuckets(orders: Order[], now: Date, period: number, step: number): Bucket[] {
  const today = startOfDay(now);
  const windowStart = addDays(today, -(period - 1));
  const buckets: Bucket[] = [];
  let end = addDays(today, 1);
  while (end > windowStart) {
    let start = addDays(end, -step);
    if (start < windowStart) start = windowStart;
    buckets.unshift({ start, end, revenue: 0, orders: 0, placed: 0, current: buckets.length === 0 });
    end = start;
  }
  for (const o of orders) {
    const t = new Date(o.createdAt);
    if (t < windowStart || t >= buckets[buckets.length - 1].end) continue;
    const b = buckets.find((x) => t >= x.start && t < x.end);
    if (!b) continue;
    b.placed += 1;
    if (!counts(o)) continue;
    b.revenue += o.total;
    b.orders += 1;
  }
  return buckets;
}

/* ------------------------------------------------------------------ */
/* Period stats                                                        */
/* ------------------------------------------------------------------ */
export interface TopProduct {
  productId: string;
  name: string;
  image: string;
  unit: Unit;
  /** pieces / metres / sets, or m² for m2 products */
  units: number;
  revenue: number;
  orders: number;
}

export interface PeriodStats {
  revenue: number;
  /** all orders placed in the window, cancelled included */
  orders: number;
  /** non-cancelled orders — the AOV denominator */
  validOrders: number;
  aov: number;
  byStatus: Record<OrderStatus, number>;
  top: TopProduct[];
}

function statsFor(orders: Order[], from: Date, to: Date): PeriodStats {
  const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<OrderStatus, number>;
  const top = new Map<string, TopProduct>();
  let revenue = 0;
  let count = 0;
  let valid = 0;
  for (const o of orders) {
    const t = new Date(o.createdAt);
    if (t < from || t >= to) continue;
    count++;
    byStatus[o.status]++;
    if (!counts(o)) continue;
    valid++;
    revenue += o.total;
    for (const l of o.items) {
      const row = top.get(l.productId) ?? { productId: l.productId, name: l.name, image: l.image, unit: l.unit, units: 0, revenue: 0, orders: 0 };
      row.units += l.unit === 'm2' && l.packSize ? l.qty * l.packSize : l.qty;
      row.revenue += l.lineTotal;
      row.orders += 1;
      top.set(l.productId, row);
    }
  }
  return {
    revenue,
    orders: count,
    validOrders: valid,
    aov: valid ? revenue / valid : 0,
    byStatus,
    top: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}

export interface DashboardStats {
  current: PeriodStats;
  previous: PeriodStats;
  /** false when the previous window starts before the first recorded order */
  comparable: boolean;
  /** chart buckets: daily for 7/30 days, weekly for 90 */
  chart: Bucket[];
  chartStep: number;
  /** ~10–13 point series for the KPI sparklines */
  spark: Bucket[];
}

export function periodStats(orders: Order[], now: Date, period: Period): DashboardStats {
  const today = startOfDay(now);
  const end = addDays(today, 1);
  const start = addDays(today, -(period - 1));
  const prevStart = addDays(start, -period);
  const first = orders.reduce((m, o) => (o.createdAt < m ? o.createdAt : m), now.toISOString());
  const chartStep = period === 90 ? 7 : 1;
  const sparkStep = period === 7 ? 1 : period === 30 ? 3 : 7;
  return {
    current: statsFor(orders, start, end),
    previous: statsFor(orders, prevStart, start),
    comparable: new Date(first) <= addDays(prevStart, 1),
    chart: buildBuckets(orders, now, period, chartStep),
    chartStep,
    spark: buildBuckets(orders, now, period, sparkStep),
  };
}

/** % change, or null when there is nothing to compare against. */
export function pctChange(cur: number, prev: number, comparable: boolean) {
  if (!comparable || prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */
export function todaySummary(orders: Order[], inquiries: Inquiry[], now: Date) {
  const from = startOfDay(now).toISOString();
  const todays = orders.filter((o) => o.createdAt >= from && counts(o));
  return {
    orders: todays.length,
    revenue: todays.reduce((s, o) => s + o.total, 0),
    inquiries: inquiries.filter((q) => q.createdAt >= from).length,
  };
}

/* ------------------------------------------------------------------ */
/* Upcoming measurements                                               */
/* ------------------------------------------------------------------ */
export interface Appointment {
  inquiry: Inquiry;
  when: Date;
  /** true = confirmed by the team (scheduledAt), false = customer's preferred date */
  confirmed: boolean;
}

export function upcomingAppointments(inquiries: Inquiry[], now: Date, limit = 5): Appointment[] {
  const today = isoDay(now);
  const out: Appointment[] = [];
  for (const q of inquiries) {
    if (q.status === 'done') continue;
    if (q.scheduledAt && new Date(q.scheduledAt) > now) {
      out.push({ inquiry: q, when: new Date(q.scheduledAt), confirmed: true });
    } else if (q.preferredDate && q.preferredDate >= today) {
      out.push({ inquiry: q, when: new Date(`${q.preferredDate}T00:00:00`), confirmed: false });
    }
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime()).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Low stock                                                           */
/* ------------------------------------------------------------------ */
export function lowStock(products: Product[], categories: Category[], limit = 6) {
  const cats = new Map(categories.map((c) => [c.id, c]));
  return products
    .filter((p) => p.stock <= 5 && p.stock < 999)
    .sort((a, b) => a.stock - b.stock || a.sku.localeCompare(b.sku))
    .slice(0, limit)
    .map((p) => ({ product: p, category: cats.get(p.categoryId) }));
}

/* ------------------------------------------------------------------ */
/* Axis helpers                                                        */
/* ------------------------------------------------------------------ */
/** Clean y-axis ticks (0 … niceMax) for roughly `count` intervals. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 250, 500, 750, 1000];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}
