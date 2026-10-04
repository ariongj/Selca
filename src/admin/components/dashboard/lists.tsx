import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarCheck2, CalendarClock, PackageCheck, ShoppingCart, TriangleAlert } from 'lucide-react';
import { Card, InquiryStatusBadge, OrderStatusBadge, Thumb } from '@/admin/components/kit';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { money, num, timeAgo, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Category, Order, Product } from '@/lib/types';
import { addDays, isoDay, type Appointment, type TopProduct } from './data';
import { fmtDate } from './dates';
import { D, capitalize } from './i18n';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */
export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-1 whitespace-nowrap rounded-md text-[13px] font-semibold text-brand-700 hover:text-brand-800">
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Empty({ icon, title, text }: { icon: ReactNode; title: ReactNode; text?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-canvas text-ink-soft ring-1 ring-line/60">{icon}</span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[13px] text-muted">{text}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent orders                                                       */
/* ------------------------------------------------------------------ */
export function RecentOrders({ orders, unseen, className }: { orders: Order[]; unseen: number; className?: string }) {
  const t = useDict(D, 'admin');
  const lang = useLang('admin');
  return (
    <Card
      className={className}
      title={t('recent_title')}
      description={unseen ? t('recent_unseen', { n: unseen }) : t('recent_all_seen')}
      actions={<CardLink to="/admin/narudzbe">{t('all_orders')}</CardLink>}
      padded={false}
    >
      {orders.length === 0 ? (
        <Empty icon={<ShoppingCart className="h-5 w-5" />} title={t('no_orders')} />
      ) : (
        <ul className="divide-y divide-line/70">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/admin/narudzbe/${o.id}`}
                className={cn(
                  'relative flex items-center gap-3 px-5 py-3 transition-colors sm:gap-4',
                  o.seen ? 'hover:bg-canvas/70' : 'bg-brand-50/60 hover:bg-brand-50',
                )}
              >
                {!o.seen && (
                  <>
                    <span className="absolute inset-y-0 left-0 w-[3px] bg-brand-600" aria-hidden />
                    <span className="sr-only">{t('unseen')}: </span>
                  </>
                )}
                <span className="hidden w-[78px] shrink-0 sm:block">
                  <span className="flex items-center gap-1.5 text-[13.5px] font-bold tabular-nums text-ink">
                    {o.number}
                    {!o.seen && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" title={t('unseen')} />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[14px] text-ink', o.seen ? 'font-semibold' : 'font-bold')}>
                    {o.customer.firstName} {o.customer.lastName}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted">
                    <span className="sm:hidden">{o.number} · </span>
                    {o.customer.city} · {timeAgo(o.createdAt, lang)}
                  </span>
                </span>
                <span className="hidden w-[150px] shrink-0 md:block">
                  <OrderStatusBadge status={o.status} />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[14px] font-bold tabular-nums text-ink">{money(o.total, lang)}</span>
                  <span className="mt-0.5 block md:hidden">
                    <OrderStatusBadge status={o.status} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Top products                                                        */
/* ------------------------------------------------------------------ */
export function TopProducts({ rows, products, period, className }: { rows: TopProduct[]; products: Product[]; period: number; className?: string }) {
  const t = useDict(D, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const byId = new Map(products.map((p) => [p.id, p]));
  const max = rows[0]?.revenue || 1;
  return (
    <Card className={className} title={t('top_title')} description={t('top_desc', { n: period })} actions={<CardLink to="/admin/proizvodi">{t('all_products')}</CardLink>} padded={false}>
      {rows.length === 0 ? (
        <Empty icon={<PackageCheck className="h-5 w-5" />} title={t('no_sales')} />
      ) : (
        <ol className="divide-y divide-line/70">
          {rows.map((r, i) => {
            const p = byId.get(r.productId);
            const units = `${num(r.units, lang, 1)} ${unitLabel(r.unit, lang)}`;
            const inner = (
              <>
                <span className="w-4 shrink-0 text-center text-[12px] font-bold tabular-nums text-muted">{i + 1}</span>
                <Thumb src={p?.images[0] ?? r.image} className="h-11 w-11" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13.5px] font-semibold text-ink" title={p ? l(p.name) : r.name}>
                      {p ? l(p.name) : r.name}
                    </span>
                    <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-ink">{money(r.revenue, lang, { decimals: false })}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-3">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-canvas">
                      <span className="block h-full rounded-full bg-brand-600" style={{ width: `${Math.max(3, (r.revenue / max) * 100)}%` }} />
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-right text-[12px] tabular-nums text-muted">
                      {units} {t('sold')}
                    </span>
                  </span>
                </span>
              </>
            );
            return (
              <li key={r.productId}>
                {p ? (
                  <Link to={`/admin/proizvodi/${p.id}`} className="flex items-center gap-3 px-5 py-[15px] transition-colors hover:bg-canvas/70">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-[15px]">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Upcoming measurements                                               */
/* ------------------------------------------------------------------ */
export function Appointments({ items, now, className }: { items: Appointment[]; now: Date; className?: string }) {
  const t = useDict(D, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const today = isoDay(now);
  const tomorrow = isoDay(addDays(now, 1));
  return (
    <Card className={className} title={t('meas_title')} description={t('meas_desc')} actions={<CardLink to="/admin/upiti">{t('all_inquiries')}</CardLink>} padded={false}>
      {items.length === 0 ? (
        <Empty icon={<CalendarClock className="h-5 w-5" />} title={t('meas_empty')} text={t('meas_empty_text')} />
      ) : (
        <ul className="divide-y divide-line/70">
          {items.map(({ inquiry: q, when, confirmed }) => {
            const day = isoDay(when);
            const rel = day === today ? t('today') : day === tomorrow ? t('tomorrow') : capitalize(fmtDate(when, lang, { weekday: 'long' }));
            const time = confirmed ? fmtDate(when, lang, { hour: '2-digit', minute: '2-digit' }) : null;
            return (
              <li key={q.id}>
                <Link to={`/admin/upiti?id=${q.id}`} className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-canvas/70">
                  <span className={cn('flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 ring-1', confirmed ? 'bg-brand-50 ring-brand-200/70' : 'bg-canvas ring-line/70')}>
                    <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', confirmed ? 'text-brand-700' : 'text-muted')}>
                      {fmtDate(when, lang, { month: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-[19px] font-extrabold leading-tight tabular-nums text-ink">{when.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{q.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {[q.city, q.service ?? tc(`inq_${q.type}`)].filter(Boolean).join(' · ')}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                      {confirmed ? <CalendarCheck2 className="h-3.5 w-3.5 text-brand-700" /> : <CalendarClock className="h-3.5 w-3.5 text-muted" />}
                      <span className="truncate">
                        {rel}
                        {time && ` · ${time}`} · <span className="text-muted">{confirmed ? t('meas_confirmed') : t('meas_preferred')}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <InquiryStatusBadge status={q.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Low stock                                                           */
/* ------------------------------------------------------------------ */
export function LowStock({ rows, className }: { rows: { product: Product; category?: Category }[]; className?: string }) {
  const t = useDict(D, 'admin');
  const tc = useDict(common, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  return (
    <Card className={className} title={t('stock_title')} description={t('stock_desc')} actions={<CardLink to="/admin/proizvodi">{t('all_products')}</CardLink>} padded={false}>
      {rows.length === 0 ? (
        <Empty icon={<PackageCheck className="h-5 w-5" />} title={t('stock_ok')} text={t('stock_ok_text')} />
      ) : (
        <ul className="divide-y divide-line/70">
          {rows.map(({ product: p, category }) => {
            const critical = p.stock <= 2;
            return (
              <li key={p.id}>
                <Link to={`/admin/proizvodi/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas/70">
                  <Thumb src={p.images[0]} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{l(p.name)}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      <span className="font-mono text-[11.5px]">{p.sku}</span>
                      {category && ` · ${l(category.name)}`}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold tabular-nums ring-1 ring-inset',
                      critical ? 'bg-red-50 text-red-700 ring-red-600/15' : 'bg-amber-50 text-amber-800 ring-amber-600/20',
                    )}
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {p.stock <= 0 ? t('stock_out') : `${t('stock_left', { n: p.stock })} ${p.unit === 'm2' ? tc('packs') : unitLabel(p.unit, lang)}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
