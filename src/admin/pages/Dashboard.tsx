import { useMemo, useState } from 'react';
import { ExternalLink, Inbox, PanelsTopLeft, Plus, Receipt, ShoppingBag, Wallet } from 'lucide-react';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { OPEN_INQUIRY, PERIODS, lowStock, pctChange, periodStats, todaySummary, upcomingAppointments, type Period } from '@/admin/components/dashboard/data';
import { D, capitalize, pluralKey } from '@/admin/components/dashboard/i18n';
import { fmtDate } from '@/admin/components/dashboard/dates';
import { KpiCard, Sparkline } from '@/admin/components/dashboard/KpiCard';
import { RevenueChart } from '@/admin/components/dashboard/RevenueChart';
import { StatusBreakdown } from '@/admin/components/dashboard/StatusBreakdown';
import { Appointments, LowStock, RecentOrders, TopProducts } from '@/admin/components/dashboard/lists';

const T = defineDict({
  me: {
    greet_morning: 'Dobro jutro',
    greet_day: 'Dobar dan',
    greet_evening: 'Dobro veče',
    today_both: 'Danas ste primili {orders} u vrijednosti od {revenue} i {inquiries}.',
    today_orders: 'Danas ste primili {orders} u vrijednosti od {revenue}.',
    today_inq: 'Danas još nema novih narudžbi. Novi upiti danas: {n}.',
    today_quiet: 'Danas još nema novih narudžbi ni upita — evo pregleda posljednjih dana.',
    acc_1: '{n} narudžbu',
    acc_2: '{n} narudžbe',
    acc_5: '{n} narudžbi',
    inq_1: '{n} novi upit',
    inq_2: '{n} nova upita',
    inq_5: '{n} novih upita',
    qa_new_product: 'Novi proizvod',
    qa_edit_home: 'Uredi početnu',
    qa_view_site: 'Pogledaj sajt',
    period: 'Period',
    days: '{n} dana',
  },
  sq: {
    greet_morning: 'Mirëmëngjes',
    greet_day: 'Mirëdita',
    greet_evening: 'Mirëmbrëma',
    today_both: 'Sot keni marrë {orders} në vlerë prej {revenue} dhe {inquiries}.',
    today_orders: 'Sot keni marrë {orders} në vlerë prej {revenue}.',
    today_inq: 'Sot ende nuk ka porosi të reja. Kërkesa të reja sot: {n}.',
    today_quiet: 'Sot ende nuk ka porosi apo kërkesa të reja — ja përmbledhja e ditëve të fundit.',
    acc_1: '{n} porosi',
    acc_2: '{n} porosi',
    acc_5: '{n} porosi',
    inq_1: '{n} kërkesë të re',
    inq_2: '{n} kërkesa të reja',
    inq_5: '{n} kërkesa të reja',
    qa_new_product: 'Produkt i ri',
    qa_edit_home: 'Ndrysho ballinën',
    qa_view_site: 'Shiko faqen',
    period: 'Periudha',
    days: '{n} ditë',
  },
  en: {
    greet_morning: 'Good morning',
    greet_day: 'Good afternoon',
    greet_evening: 'Good evening',
    today_both: 'Today you received {orders} worth {revenue} and {inquiries}.',
    today_orders: 'Today you received {orders} worth {revenue}.',
    today_inq: 'No new orders yet today. New inquiries today: {n}.',
    today_quiet: 'No new orders or inquiries yet today — here is how the last few days went.',
    acc_1: '{n} order',
    acc_2: '{n} orders',
    acc_5: '{n} orders',
    inq_1: '{n} new inquiry',
    inq_2: '{n} new inquiries',
    inq_5: '{n} new inquiries',
    qa_new_product: 'New product',
    qa_edit_home: 'Edit homepage',
    qa_view_site: 'View site',
    period: 'Period',
    days: '{n} days',
  },
});

const INQ_DOT = { new: 'bg-brand-600', contacted: 'bg-sky-500', scheduled: 'bg-violet-500' } as const;

function greetingKey(h: number) {
  if (h >= 4 && h < 12) return 'greet_morning' as const;
  if (h >= 12 && h < 18) return 'greet_day' as const;
  return 'greet_evening' as const;
}

export default function Dashboard() {
  const t = useDict(T, 'admin');
  const d = useDict(D, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');

  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);

  const [period, setPeriod] = useState<Period>(30);
  // "now" is re-read whenever the data changes (e.g. a new order from the storefront)
  const now = useMemo(() => new Date(), [orders, inquiries]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => periodStats(orders, now, period), [orders, now, period]);
  const today = useMemo(() => todaySummary(orders, inquiries, now), [orders, inquiries, now]);
  const recent = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [orders]);
  const unseen = useMemo(() => orders.filter((o) => !o.seen).length, [orders]);
  const appointments = useMemo(() => upcomingAppointments(inquiries, now), [inquiries, now]);
  const stock = useMemo(() => lowStock(products, categories), [products, categories]);
  const openInq = useMemo(() => {
    const by = { new: 0, contacted: 0, scheduled: 0 };
    for (const q of inquiries) if (q.status !== 'done') by[q.status]++;
    return { total: by.new + by.contacted + by.scheduled, by };
  }, [inquiries]);

  const { current: cur, previous: prev, comparable } = stats;

  const todayLine = (() => {
    const o = t(`acc_${pluralKey(lang, today.orders)}`, { n: today.orders });
    const q = t(`inq_${pluralKey(lang, today.inquiries)}`, { n: today.inquiries });
    const revenue = money(today.revenue, lang, { decimals: false });
    if (today.orders && today.inquiries) return t('today_both', { orders: o, revenue, inquiries: q });
    if (today.orders) return t('today_orders', { orders: o, revenue });
    if (today.inquiries) return t('today_inq', { n: today.inquiries });
    return t('today_quiet');
  })();
  const vs = comparable ? d('vs_prev', { n: period }) : d('no_compare');

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting + quick actions */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-muted">
            {capitalize(fmtDate(now, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })).replace(/\.$/, '')}
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">{t(greetingKey(now.getHours()))}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {todayLine}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <ButtonLink to="/admin/proizvodi/novi" size="sm" shape="rounded" icon={<Plus className="h-4 w-4" />} className="col-span-2 px-3 sm:px-4">
            {t('qa_new_product')}
          </ButtonLink>
          <ButtonLink to="/admin/sadrzaj" variant="outline" size="sm" shape="rounded" icon={<PanelsTopLeft className="h-4 w-4" />} className="bg-white px-3 sm:px-4">
            {t('qa_edit_home')}
          </ButtonLink>
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass({ variant: 'outline', size: 'sm', shape: 'rounded', className: 'bg-white px-3 sm:px-4' })}>
            {t('qa_view_site')}
            <ExternalLink className="h-3.5 w-3.5 text-muted" />
          </a>
        </div>
      </div>

      {/* Period filter — scopes the KPIs, the chart, the status breakdown and top products */}
      <div role="group" aria-label={t('period')} className="flex w-full rounded-xl bg-white p-1 shadow-[0_1px_2px_rgb(28_26_23/0.04)] ring-1 ring-line/80 sm:inline-flex sm:w-auto">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className={cn(
              'h-8 flex-1 rounded-lg px-4 text-[13px] font-semibold tabular-nums transition-colors sm:flex-none',
              period === p ? 'bg-ink text-paper shadow-sm' : 'text-ink-soft hover:bg-canvas hover:text-ink',
            )}
          >
            {t('days', { n: p })}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label={d('kpi_revenue')}
          icon={Wallet}
          value={money(cur.revenue, lang, { decimals: false })}
          delta={pctChange(cur.revenue, prev.revenue, comparable)}
          caption={vs}
          footer={<Sparkline values={stats.spark.map((b) => b.revenue)} label={d('kpi_revenue')} />}
        />
        <KpiCard
          label={d('kpi_orders')}
          icon={ShoppingBag}
          value={cur.orders}
          delta={pctChange(cur.orders, prev.orders, comparable)}
          caption={vs}
          to="/admin/narudzbe"
          footer={<Sparkline values={stats.spark.map((b) => b.placed)} label={d('kpi_orders')} />}
        />
        <KpiCard
          label={d('kpi_aov')}
          icon={Receipt}
          value={money(cur.aov, lang, { decimals: false })}
          delta={pctChange(cur.aov, prev.aov, comparable)}
          caption={comparable ? vs : d('excl_cancelled')}
          footer={<Sparkline values={stats.spark.map((b) => (b.orders ? b.revenue / b.orders : null))} label={d('kpi_aov')} />}
        />
        <KpiCard
          label={d('kpi_inquiries')}
          icon={Inbox}
          value={openInq.total}
          caption={d('inq_open_hint')}
          to="/admin/upiti"
          footer={
            <div className="flex min-h-9 flex-wrap content-end items-end gap-x-3 gap-y-1">
              {OPEN_INQUIRY.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <span className={cn('h-2 w-2 rounded-full', INQ_DOT[s as keyof typeof INQ_DOT])} />
                  <span className="font-bold tabular-nums text-ink">{openInq.by[s as keyof typeof openInq.by]}</span>
                  {tc(`inqstatus_${s}`)}
                </span>
              ))}
            </div>
          }
        />
      </div>

      {/* Revenue + status */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RevenueChart className="xl:col-span-2" buckets={stats.chart} step={stats.chartStep} period={period} />
        <StatusBreakdown byStatus={cur.byStatus} period={period} />
      </div>

      {/* Recent orders + top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrders orders={recent} unseen={unseen} />
        <TopProducts rows={cur.top} products={products} period={period} />
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Appointments items={appointments} now={now} />
        <LowStock rows={stock} />
      </div>
    </div>
  );
}

