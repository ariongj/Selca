import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CalendarDays, CheckCheck, ChevronDown, ChevronRight, Download, Hourglass, ReceiptText, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Card, FilterPills, OrderStatusBadge, PageHeader, PaymentStatusBadge, SearchInput, Table, Td, Th, Tr } from '@/admin/components/kit';
import { ALL_STATUSES, PAY_ICON, csvNum, customerName, localizeLine, matchesOrder, pluralForm, qtyLabel, toCsv } from '@/admin/components/orders/helpers';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { date, money } from '@/lib/format';
import { cn, download, initials } from '@/lib/utils';
import type { Lang, Order, OrderStatus } from '@/lib/types';

const T = defineDict({
  me: {
    title: 'Narudžbe',
    description: 'Pratite, obrađujte i izvozite narudžbe iz web prodavnice.',
    exportCsv: 'Izvezi CSV',
    exported: 'CSV fajl je preuzet ({n})',
    markAllSeen: 'Označi sve kao pregledano',
    markedSeen: 'Sve narudžbe su označene kao pregledane',
    searchPh: 'Broj, kupac, e-mail, telefon, grad…',
    period_7: 'Posljednjih 7 dana',
    period_30: 'Posljednjih 30 dana',
    period_90: 'Posljednjih 90 dana',
    period_all: 'Cijeli period',
    col_number: 'Narudžba',
    col_date: 'Datum',
    col_customer: 'Kupac',
    col_items: 'Stavke',
    col_payment: 'Plaćanje',
    col_total: 'Ukupno',
    col_status: 'Status',
    items_one: '{n} stavka',
    items_few: '{n} stavke',
    items_many: '{n} stavki',
    orders_one: '{n} narudžba',
    orders_few: '{n} narudžbe',
    orders_many: '{n} narudžbi',
    new_one: '{n} nova',
    new_few: '{n} nove',
    new_many: '{n} novih',
    unseen: 'Nije pregledana',
    stat_orders: 'Narudžbe',
    stat_revenue: 'Promet',
    stat_revenueHint: 'bez otkazanih narudžbi',
    stat_avg: 'Prosječna narudžba',
    stat_avgHint: 'vrijednost po narudžbi',
    stat_unpaid: 'Čeka uplatu',
    emptyTitle: 'Nema narudžbi za izabrane filtere',
    emptyText: 'Promijenite status, period ili pojam pretrage.',
    emptyAction: 'Poništi filtere',
    emptyAllTitle: 'Još nema narudžbi',
    emptyAllText: 'Kada kupci naruče iz web prodavnice, narudžbe će se pojaviti ovdje.',
    showMore: 'Prikaži još',
    showing: 'Prikazano {n} od {total}',
    csvFile: 'narudzbe',
    csv_number: 'Broj',
    csv_date: 'Datum',
    csv_firstName: 'Ime',
    csv_lastName: 'Prezime',
    csv_email: 'E-mail',
    csv_phone: 'Telefon',
    csv_city: 'Grad',
    csv_address: 'Adresa',
    csv_company: 'Firma',
    csv_items: 'Stavke',
    csv_delivery: 'Isporuka',
    csv_payment: 'Način plaćanja',
    csv_payStatus: 'Status plaćanja',
    csv_coupon: 'Kupon',
    csv_vat: 'PDV',
    csv_status: 'Status',
  },
  sq: {
    title: 'Porositë',
    description: 'Ndiqni, përpunoni dhe eksportoni porositë nga dyqani online.',
    exportCsv: 'Eksporto CSV',
    exported: 'Skedari CSV u shkarkua ({n})',
    markAllSeen: 'Shëno të gjitha si të shikuara',
    markedSeen: 'Të gjitha porositë u shënuan si të shikuara',
    searchPh: 'Numri, klienti, e-mail, telefoni, qyteti…',
    period_7: '7 ditët e fundit',
    period_30: '30 ditët e fundit',
    period_90: '90 ditët e fundit',
    period_all: 'E gjithë periudha',
    col_number: 'Porosia',
    col_date: 'Data',
    col_customer: 'Klienti',
    col_items: 'Artikujt',
    col_payment: 'Pagesa',
    col_total: 'Totali',
    col_status: 'Statusi',
    items_one: '{n} artikull',
    items_few: '{n} artikuj',
    items_many: '{n} artikuj',
    orders_one: '{n} porosi',
    orders_few: '{n} porosi',
    orders_many: '{n} porosi',
    new_one: '{n} e re',
    new_few: '{n} të reja',
    new_many: '{n} të reja',
    unseen: 'E pashikuar',
    stat_orders: 'Porosi',
    stat_revenue: 'Qarkullimi',
    stat_revenueHint: 'pa porositë e anuluara',
    stat_avg: 'Porosia mesatare',
    stat_avgHint: 'vlera për porosi',
    stat_unpaid: 'Në pritje të pagesës',
    emptyTitle: 'Nuk ka porosi për filtrat e zgjedhur',
    emptyText: 'Ndryshoni statusin, periudhën ose termin e kërkimit.',
    emptyAction: 'Pastro filtrat',
    emptyAllTitle: 'Ende nuk ka porosi',
    emptyAllText: 'Kur klientët të porosisin nga dyqani online, porositë do të shfaqen këtu.',
    showMore: 'Shfaq më shumë',
    showing: 'Shfaqen {n} nga {total}',
    csvFile: 'porosite',
    csv_number: 'Numri',
    csv_date: 'Data',
    csv_firstName: 'Emri',
    csv_lastName: 'Mbiemri',
    csv_email: 'E-mail',
    csv_phone: 'Telefoni',
    csv_city: 'Qyteti',
    csv_address: 'Adresa',
    csv_company: 'Kompania',
    csv_items: 'Artikujt',
    csv_delivery: 'Dorëzimi',
    csv_payment: 'Mënyra e pagesës',
    csv_payStatus: 'Statusi i pagesës',
    csv_coupon: 'Kuponi',
    csv_vat: 'TVSH',
    csv_status: 'Statusi',
  },
  en: {
    title: 'Orders',
    description: 'Track, process and export orders from the online shop.',
    exportCsv: 'Export CSV',
    exported: 'CSV file downloaded ({n})',
    markAllSeen: 'Mark all as viewed',
    markedSeen: 'All orders marked as viewed',
    searchPh: 'Number, customer, e-mail, phone, city…',
    period_7: 'Last 7 days',
    period_30: 'Last 30 days',
    period_90: 'Last 90 days',
    period_all: 'All time',
    col_number: 'Order',
    col_date: 'Date',
    col_customer: 'Customer',
    col_items: 'Items',
    col_payment: 'Payment',
    col_total: 'Total',
    col_status: 'Status',
    items_one: '{n} item',
    items_few: '{n} items',
    items_many: '{n} items',
    orders_one: '{n} order',
    orders_few: '{n} orders',
    orders_many: '{n} orders',
    new_one: '{n} new',
    new_few: '{n} new',
    new_many: '{n} new',
    unseen: 'Not viewed yet',
    stat_orders: 'Orders',
    stat_revenue: 'Revenue',
    stat_revenueHint: 'excluding cancelled orders',
    stat_avg: 'Average order',
    stat_avgHint: 'value per order',
    stat_unpaid: 'Awaiting payment',
    emptyTitle: 'No orders match these filters',
    emptyText: 'Try another status, period or search term.',
    emptyAction: 'Reset filters',
    emptyAllTitle: 'No orders yet',
    emptyAllText: 'When customers order from the online shop, their orders will appear here.',
    showMore: 'Show more',
    showing: 'Showing {n} of {total}',
    csvFile: 'orders',
    csv_number: 'Number',
    csv_date: 'Date',
    csv_firstName: 'First name',
    csv_lastName: 'Last name',
    csv_email: 'E-mail',
    csv_phone: 'Phone',
    csv_city: 'City',
    csv_address: 'Address',
    csv_company: 'Company',
    csv_items: 'Items',
    csv_delivery: 'Delivery',
    csv_payment: 'Payment method',
    csv_payStatus: 'Payment status',
    csv_coupon: 'Coupon',
    csv_vat: 'VAT',
    csv_status: 'Status',
  },
});

type Period = '7' | '30' | '90' | 'all';
type StatusFilter = OrderStatus | 'all';
const PERIODS: Period[] = ['7', '30', '90', 'all'];
const PAGE = 25;

const timeOf = (iso: string, lang: Lang) => date(iso, lang, { hour: '2-digit', minute: '2-digit' });
const dayOf = (iso: string, lang: Lang) => date(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' });

export default function Orders() {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const markAllOrdersSeen = useDb((s) => s.markAllOrdersSeen);

  const [params, setParams] = useSearchParams();
  const rawStatus = params.get('status');
  const status: StatusFilter = rawStatus && (ALL_STATUSES as string[]).includes(rawStatus) ? (rawStatus as OrderStatus) : 'all';
  const setStatus = (s: StatusFilter) => {
    const next = new URLSearchParams(params);
    if (s === 'all') next.delete('status');
    else next.set('status', s);
    setParams(next, { replace: true });
    setLimit(PAGE);
  };
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [period, setPeriod] = useState<Period>('all');
  const [limit, setLimit] = useState(PAGE);

  const plural = (base: 'items' | 'orders' | 'new', n: number) => t(`${base}_${pluralForm(n, lang)}`, { n });

  // period → search → status (counts on the pills reflect period + search)
  const inPeriod = useMemo(() => {
    if (period === 'all') return orders;
    const from = Date.now() - Number(period) * 86400000;
    return orders.filter((o) => new Date(o.createdAt).getTime() >= from);
  }, [orders, period]);
  const searched = useMemo(() => inPeriod.filter((o) => matchesOrder(o, query)), [inPeriod, query]);
  const filtered = useMemo(() => (status === 'all' ? searched : searched.filter((o) => o.status === status)), [searched, status]);
  const visible = filtered.slice(0, limit);

  const counts = useMemo(() => {
    const c = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const o of searched) c[o.status]++;
    return c;
  }, [searched]);

  const unseen = useMemo(() => orders.filter((o) => !o.seen).length, [orders]);

  const stats = useMemo(() => {
    const live = inPeriod.filter((o) => o.status !== 'cancelled');
    const revenue = live.reduce((s, o) => s + o.total, 0);
    const unpaid = live.filter((o) => o.payment.status === 'pending');
    return {
      count: live.length,
      fresh: live.filter((o) => o.status === 'new').length,
      revenue,
      avg: live.length ? revenue / live.length : 0,
      unpaidSum: unpaid.reduce((s, o) => s + o.total, 0),
      unpaidCount: unpaid.length,
    };
  }, [inPeriod]);

  const pills = [
    { id: 'all' as StatusFilter, label: tc('all'), count: searched.length },
    ...ALL_STATUSES.map((s) => ({ id: s as StatusFilter, label: tc(`status_${s}`), count: counts[s] })),
  ];

  const resetFilters = () => {
    setQuery('');
    setPeriod('all');
    setStatus('all');
  };

  const exportCsv = () => {
    const header = [
      t('csv_number'), t('csv_date'), t('csv_firstName'), t('csv_lastName'), t('csv_email'), t('csv_phone'), t('csv_city'), t('csv_address'), t('csv_company'),
      t('csv_items'), t('csv_delivery'), t('csv_payment'), t('csv_payStatus'),
      tc('subtotal'), tc('installation'), tc('discount'), t('csv_coupon'), tc('shipping'), tc('total'), t('csv_vat'), t('csv_status'),
    ];
    const rows = filtered.map((o) => {
      const items = o.items
        .map((l) => {
          const loc = localizeLine(l, products.find((p) => p.id === l.productId), o.lang, lang);
          return `${loc.name} × ${qtyLabel(l, lang, tc('packs'))}`;
        })
        .join(' | ');
      return [
        o.number,
        `${date(o.createdAt, lang, { year: 'numeric', month: '2-digit', day: '2-digit' })} ${timeOf(o.createdAt, lang)}`,
        o.customer.firstName, o.customer.lastName, o.customer.email, o.customer.phone, o.customer.city, o.customer.address, o.customer.company ?? '',
        items, tc(`delivery_${o.delivery.method}`), tc(`pay_${o.payment.method}`), tc(`paystatus_${o.payment.status}`),
        csvNum(o.subtotal, lang), csvNum(o.installationTotal, lang), csvNum(o.discount, lang), o.coupon?.code ?? '', csvNum(o.shipping, lang), csvNum(o.total, lang), csvNum(o.vat, lang),
        tc(`status_${o.status}`),
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    download(`${t('csvFile')}-${stamp}.csv`, '﻿' + toCsv([header, ...rows]), 'text/csv;charset=utf-8');
    toast.success(t('exported', { n: plural('orders', rows.length) }));
  };

  const open = (o: Order) => navigate(`/admin/narudzbe/${o.id}`);
  const filtersActive = status !== 'all' || period !== 'all' || query.trim() !== '';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('description')}
        badge={unseen > 0 ? <Badge tone="brand" dot>{plural('new', unseen)}</Badge> : undefined}
        actions={
          <>
            {unseen > 0 && (
              <Button
                variant="ghost"
                size="sm"
                shape="rounded"
                icon={<CheckCheck className="h-4 w-4" />}
                onClick={() => {
                  markAllOrdersSeen();
                  toast.success(t('markedSeen'));
                }}
              >
                {t('markAllSeen')}
              </Button>
            )}
            <Button variant="outline" size="sm" shape="rounded" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!filtered.length}>
              {t('exportCsv')}
            </Button>
          </>
        }
      />

      {/* KPI strip (follows the period filter) */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<ShoppingBag className="h-4 w-4" />} label={t('stat_orders')} value={String(stats.count)} hint={stats.fresh ? plural('new', stats.fresh) : t(`period_${period}`)} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label={t('stat_revenue')} value={money(stats.revenue, lang, { decimals: false })} hint={t('stat_revenueHint')} />
        <Stat icon={<ReceiptText className="h-4 w-4" />} label={t('stat_avg')} value={money(stats.avg, lang, { decimals: false })} hint={t('stat_avgHint')} />
        <Stat icon={<Hourglass className="h-4 w-4" />} label={t('stat_unpaid')} value={money(stats.unpaidSum, lang, { decimals: false })} hint={plural('orders', stats.unpaidCount)} tone="amber" />
      </div>

      <Card padded={false}>
        <div className="space-y-3 border-b border-line/70 p-4 sm:px-5">
          <FilterPills options={pills} value={status} onChange={setStatus} />
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setLimit(PAGE);
              }}
              placeholder={t('searchPh')}
              className="sm:max-w-sm sm:flex-1"
            />
            <PeriodSelect
              value={period}
              onChange={(p) => {
                setPeriod(p);
                setLimit(PAGE);
              }}
              label={(p) => t(`period_${p}`)}
            />
            <span className="text-[13px] text-muted sm:ml-auto">{plural('orders', filtered.length)}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          orders.length === 0 ? (
            <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title={t('emptyAllTitle')} text={t('emptyAllText')} />
          ) : (
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title={t('emptyTitle')}
              text={t('emptyText')}
              action={
                filtersActive && (
                  <Button variant="outline" size="sm" shape="rounded" onClick={resetFilters}>
                    {t('emptyAction')}
                  </Button>
                )
              }
            />
          )
        ) : (
          <>
            {/* Desktop / tablet table */}
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th>{t('col_number')}</Th>
                  <Th>{t('col_date')}</Th>
                  <Th>{t('col_customer')}</Th>
                  <Th>{t('col_items')}</Th>
                  <Th>{t('col_payment')}</Th>
                  <Th className="text-right">{t('col_total')}</Th>
                  <Th>{t('col_status')}</Th>
                  <Th className="w-8" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const PayIcon = PAY_ICON[o.payment.method];
                  return (
                    <Tr key={o.id} onClick={() => open(o)} className={cn('group', !o.seen && 'bg-brand-50/40')}>
                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', o.seen ? 'bg-transparent' : 'bg-brand-600 shadow-[0_0_0_3px_var(--color-brand-100)]')} title={o.seen ? undefined : t('unseen')} />
                          <span className={cn('tabular-nums', o.seen ? 'font-semibold text-ink' : 'font-extrabold text-ink')}>{o.number}</span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className={cn('block', !o.seen && 'font-semibold')}>{dayOf(o.createdAt, lang)}</span>
                        <span className="block text-xs text-muted tabular-nums">{timeOf(o.createdAt, lang)}</span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand text-[11px] font-bold text-ink-soft">{initials(customerName(o))}</span>
                          <span className="min-w-0">
                            <span className={cn('block truncate', o.seen ? 'font-medium' : 'font-bold')}>{customerName(o)}</span>
                            <span className="block truncate text-xs text-muted">{o.customer.city}</span>
                          </span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft">{plural('items', o.items.length)}</Td>
                      <Td className="whitespace-nowrap">
                        <span className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                            <PayIcon className="h-3.5 w-3.5" />
                            {tc(`pay_${o.payment.method}`)}
                          </span>
                          <PaymentStatusBadge status={o.payment.status} />
                        </span>
                      </Td>
                      <Td className={cn('whitespace-nowrap text-right tabular-nums', o.status === 'cancelled' ? 'text-muted line-through' : 'font-bold')}>{money(o.total, lang)}</Td>
                      <Td className="whitespace-nowrap">
                        <OrderStatusBadge status={o.status} />
                      </Td>
                      <Td className="w-8 text-muted">
                        <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>

            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-line/70 md:hidden">
              {visible.map((o) => {
                const PayIcon = PAY_ICON[o.payment.method];
                return (
                  <li key={o.id}>
                    <button type="button" onClick={() => open(o)} className={cn('block w-full px-4 py-3.5 text-left transition-colors active:bg-canvas', !o.seen && 'bg-brand-50/40')}>
                      <span className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2">
                          {!o.seen && <span className="h-2 w-2 rounded-full bg-brand-600 shadow-[0_0_0_3px_var(--color-brand-100)]" />}
                          <span className={cn('text-[15px] tabular-nums', o.seen ? 'font-semibold' : 'font-extrabold')}>{o.number}</span>
                        </span>
                        <span className={cn('text-[15px] tabular-nums', o.status === 'cancelled' ? 'text-muted line-through' : 'font-bold')}>{money(o.total, lang)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3 text-[13px]">
                        <span className={cn('truncate', o.seen ? 'font-medium text-ink' : 'font-bold text-ink')}>
                          {customerName(o)} <span className="font-normal text-muted">· {o.customer.city}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">{plural('items', o.items.length)}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {dayOf(o.createdAt, lang)} · {timeOf(o.createdAt, lang)}
                        <span className="mx-1 text-line">|</span>
                        <PayIcon className="h-3.5 w-3.5" />
                        <span className="truncate">{tc(`pay_${o.payment.method}`)}</span>
                      </span>
                      <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={o.status} />
                        <PaymentStatusBadge status={o.payment.status} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col items-center justify-between gap-3 px-4 py-3.5 text-[13px] text-muted sm:flex-row sm:px-5">
              <span>{t('showing', { n: visible.length, total: filtered.length })}</span>
              {visible.length < filtered.length && (
                <Button variant="outline" size="sm" shape="rounded" iconRight={<ChevronDown className="h-4 w-4" />} onClick={() => setLimit((l) => l + PAGE)}>
                  {t('showMore')}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, hint, tone }: { icon: ReactNode; label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'amber' }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgb(28_26_23/0.04)] sm:p-5">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
        <span className={cn('grid h-7 w-7 place-items-center rounded-lg', tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700')}>{icon}</span>
        <span className="min-w-0 leading-tight">{label}</span>
      </div>
      <div className="mt-3 text-xl font-extrabold tracking-tight text-ink tabular-nums sm:text-2xl">{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}

function PeriodSelect({ value, onChange, label }: { value: Period; onChange: (p: Period) => void; label: (p: Period) => string }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Period)}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pl-9 pr-9 text-sm font-medium text-ink outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-ink/5 sm:w-auto"
      >
        {PERIODS.map((p) => (
          <option key={p} value={p}>
            {label(p)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
