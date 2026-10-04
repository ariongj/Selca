import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowDown, ChevronDown, ChevronRight, Download, MapPin, Repeat2, ShoppingBag, Sparkles, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, FilterPills, PageHeader, SearchInput, Table, Td, Th, Tr } from '@/admin/components/kit';
import { CustomerDrawer } from '@/admin/components/crm/CustomerDrawer';
import { aggregateCustomers, customersCsv, sortCustomers, topThreshold, type CustomerSort } from '@/admin/components/crm/customers';
import { Avatar, StatTile, matches, pluralForm, useNow } from '@/admin/components/crm/shared';
import { defineDict, useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { date, money, num, timeAgo } from '@/lib/format';
import { cn, download } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Kupci',
    subtitle: 'Svi kupci iz web narudžbi — kontakt podaci, istorija kupovine i ukupna potrošnja.',
    export: 'Izvezi CSV',
    statCustomers: 'Kupci',
    statCustomersSub_one: '+{n} novi za 30 dana',
    statCustomersSub_few: '+{n} nova za 30 dana',
    statCustomersSub_many: '+{n} novih za 30 dana',
    statRepeat: 'Stalni kupci',
    statRepeatSub: '{pct}% kupaca naručilo 2+ puta',
    statLtv: 'Prosječno po kupcu',
    statLtvSub: 'Prosječna narudžba {v}',
    statCity: 'Najjači grad',
    statCitySub_one: '{n} kupac · {v}',
    statCitySub_few: '{n} kupca · {v}',
    statCitySub_many: '{n} kupaca · {v}',
    searchPh: 'Ime, e-mail, telefon ili grad…',
    sort_spent: 'Potrošnja',
    sort_orders: 'Broj narudžbi',
    sort_recent: 'Najnovije',
    col_customer: 'Kupac',
    col_phone: 'Telefon',
    col_city: 'Grad',
    col_orders: 'Narudžbe',
    col_spent: 'Potrošeno',
    col_first: 'Prva narudžba',
    col_last: 'Posljednja narudžba',
    top: 'Top kupac',
    topShort: 'Top',
    orders_one: '{n} narudžba',
    orders_few: '{n} narudžbe',
    orders_many: '{n} narudžbi',
    showing: 'Prikazano {n} od {total}',
    showMore: 'Prikaži još',
    emptyTitle: 'Nema kupaca za ovu pretragu',
    emptyText: 'Pokušajte s imenom, gradom ili brojem telefona.',
    clearSearch: 'Obriši pretragu',
    noneTitle: 'Još nema kupaca',
    noneText: 'Kupci se pojavljuju ovdje automatski čim stigne prva narudžba sa sajta.',
  },
  sq: {
    title: 'Klientët',
    subtitle: 'Të gjithë klientët nga porositë online — kontakti, historiku i blerjeve dhe shpenzimet totale.',
    export: 'Eksporto CSV',
    statCustomers: 'Klientët',
    statCustomersSub_one: '+{n} i ri në 30 ditë',
    statCustomersSub_few: '+{n} të rinj në 30 ditë',
    statCustomersSub_many: '+{n} të rinj në 30 ditë',
    statRepeat: 'Klientë të rregullt',
    statRepeatSub: '{pct}% kanë porositur 2+ herë',
    statLtv: 'Mesatarja për klient',
    statLtvSub: 'Porosia mesatare {v}',
    statCity: 'Qyteti kryesor',
    statCitySub_one: '{n} klient · {v}',
    statCitySub_few: '{n} klientë · {v}',
    statCitySub_many: '{n} klientë · {v}',
    searchPh: 'Emri, e-maili, telefoni ose qyteti…',
    sort_spent: 'Shpenzimet',
    sort_orders: 'Nr. i porosive',
    sort_recent: 'Më të rejat',
    col_customer: 'Klienti',
    col_phone: 'Telefoni',
    col_city: 'Qyteti',
    col_orders: 'Porositë',
    col_spent: 'Shpenzuar',
    col_first: 'Porosia e parë',
    col_last: 'Porosia e fundit',
    top: 'Klient kryesor',
    topShort: 'Top',
    orders_one: '{n} porosi',
    orders_few: '{n} porosi',
    orders_many: '{n} porosi',
    showing: 'Shfaqen {n} nga {total}',
    showMore: 'Shfaq më shumë',
    emptyTitle: 'Asnjë klient për këtë kërkim',
    emptyText: 'Provoni me emër, qytet ose numër telefoni.',
    clearSearch: 'Pastro kërkimin',
    noneTitle: 'Ende nuk ka klientë',
    noneText: 'Klientët shfaqen këtu automatikisht sapo të vijë porosia e parë nga faqja.',
  },
  en: {
    title: 'Customers',
    subtitle: 'Everyone who ordered online — contact details, purchase history and lifetime spend.',
    export: 'Export CSV',
    statCustomers: 'Customers',
    statCustomersSub_one: '+{n} new in 30 days',
    statCustomersSub_few: '+{n} new in 30 days',
    statCustomersSub_many: '+{n} new in 30 days',
    statRepeat: 'Repeat customers',
    statRepeatSub: '{pct}% ordered 2+ times',
    statLtv: 'Avg. per customer',
    statLtvSub: 'Average order {v}',
    statCity: 'Top city',
    statCitySub_one: '{n} customer · {v}',
    statCitySub_few: '{n} customers · {v}',
    statCitySub_many: '{n} customers · {v}',
    searchPh: 'Name, e-mail, phone or city…',
    sort_spent: 'Spend',
    sort_orders: 'Orders',
    sort_recent: 'Most recent',
    col_customer: 'Customer',
    col_phone: 'Phone',
    col_city: 'City',
    col_orders: 'Orders',
    col_spent: 'Spent',
    col_first: 'First order',
    col_last: 'Last order',
    top: 'Top customer',
    topShort: 'Top',
    orders_one: '{n} order',
    orders_few: '{n} orders',
    orders_many: '{n} orders',
    showing: 'Showing {n} of {total}',
    showMore: 'Show more',
    emptyTitle: 'No customers match this search',
    emptyText: 'Try a name, a city or a phone number.',
    clearSearch: 'Clear search',
    noneTitle: 'No customers yet',
    noneText: 'Customers appear here automatically as soon as the first web order arrives.',
  },
});

const PAGE = 25;

function TopTag({ title, label }: { title: string; label: string }) {
  return (
    <span title={title} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-600/20">
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export default function Customers() {
  const t = useDict(T, 'admin');
  const lang = useLang('admin');
  const orders = useDb((s) => s.orders);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [sort, setSort] = useState<CustomerSort>('spent');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(() => params.get('c'));
  const [open, setOpen] = useState(() => !!params.get('c'));
  const now = useNow();

  const customers = useMemo(() => aggregateCustomers(orders), [orders]);
  const top = useMemo(() => topThreshold(customers), [customers]);

  const stats = useMemo(() => {
    const n = customers.length;
    const repeat = customers.filter((c) => c.count > 1).length;
    const spent = customers.reduce((s, c) => s + c.spent, 0);
    const validOrders = customers.reduce((s, c) => s + c.count - c.cancelled, 0);
    const monthAgo = new Date(now - 30 * 86400000).toISOString();
    const fresh = customers.filter((c) => c.first >= monthAgo).length;
    const cities = new Map<string, { n: number; spent: number }>();
    for (const c of customers) {
      const e = cities.get(c.city) ?? { n: 0, spent: 0 };
      e.n++;
      e.spent += c.spent;
      cities.set(c.city, e);
    }
    const topCity = [...cities.entries()].sort((a, b) => b[1].spent - a[1].spent)[0];
    return {
      n,
      repeat,
      repeatPct: n ? Math.round((repeat / n) * 100) : 0,
      ltv: n ? spent / n : 0,
      aov: validOrders ? spent / validOrders : 0,
      fresh,
      topCity,
    };
  }, [customers, now]);

  const filtered = useMemo(() => {
    const list = customers.filter((c) => matches(q, [c.name, c.email, c.phone, c.city, c.address, c.company]));
    return sortCustomers(list, sort);
  }, [customers, q, sort]);

  const visible = filtered.slice(0, limit);
  const current = customers.find((c) => c.key === selected);

  const openCustomer = (key: string) => {
    setSelected(key);
    setOpen(true);
  };
  const closeCustomer = () => {
    setOpen(false);
    if (params.has('c')) {
      params.delete('c');
      setParams(params, { replace: true });
    }
  };

  const sortOptions: { id: CustomerSort; label: string }[] = [
    { id: 'spent', label: t('sort_spent') },
    { id: 'orders', label: t('sort_orders') },
    { id: 'recent', label: t('sort_recent') },
  ];
  const sortMark = (id: CustomerSort) => (sort === id ? <ArrowDown className="ml-1 inline h-3 w-3 -translate-y-px text-ink" /> : null);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          customers.length > 0 && (
            <Button variant="outline" shape="rounded" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => download('selca-kupci.csv', '﻿' + customersCsv(filtered), 'text/csv;charset=utf-8')}>
              {t('export')}
            </Button>
          )
        }
      />

      {customers.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-6 w-6" />} title={t('noneTitle')} text={t('noneText')} />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            <StatTile icon={Users} tone="bg-ink text-paper" label={t('statCustomers')} value={num(stats.n, lang)} sub={t(`statCustomersSub_${pluralForm(stats.fresh, lang)}`, { n: stats.fresh })} />
            <StatTile icon={Repeat2} tone="bg-emerald-50 text-emerald-700" label={t('statRepeat')} value={num(stats.repeat, lang)} sub={t('statRepeatSub', { pct: stats.repeatPct })} />
            <StatTile icon={Wallet} tone="bg-brand-50 text-brand-700" label={t('statLtv')} value={money(stats.ltv, lang, { decimals: false })} sub={t('statLtvSub', { v: money(stats.aov, lang, { decimals: false }) })} />
            {stats.topCity && <StatTile icon={MapPin} tone="bg-amber-50 text-amber-800" label={t('statCity')} value={stats.topCity[0]} sub={t(`statCitySub_${pluralForm(stats.topCity[1].n, lang)}`, { n: stats.topCity[1].n, v: money(stats.topCity[1].spent, lang, { decimals: false }) })} />}
          </div>

          <Card padded={false}>
            <div className="flex flex-col gap-3 border-b border-line/70 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
              <SearchInput value={q} onChange={(v) => { setQ(v); setLimit(PAGE); }} placeholder={t('searchPh')} className="w-full md:max-w-sm" />
              <FilterPills className="p-px" options={sortOptions} value={sort} onChange={(v) => { setSort(v); setLimit(PAGE); }} />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title={t('emptyTitle')}
                text={t('emptyText')}
                action={
                  <Button variant="outline" shape="rounded" size="sm" onClick={() => setQ('')}>
                    {t('clearSearch')}
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <Table className="hidden md:block">
                  <thead>
                    <tr>
                      <Th>{t('col_customer')}</Th>
                      <Th>{t('col_phone')}</Th>
                      <Th>{t('col_city')}</Th>
                      <Th className={cn('text-center', sort === 'orders' && 'text-ink')}>
                        {t('col_orders')}
                        {sortMark('orders')}
                      </Th>
                      <Th className={cn('text-right', sort === 'spent' && 'text-ink')}>
                        {t('col_spent')}
                        {sortMark('spent')}
                      </Th>
                      <Th className="hidden xl:table-cell">{t('col_first')}</Th>
                      <Th className={cn(sort === 'recent' && 'text-ink')}>
                        {t('col_last')}
                        {sortMark('recent')}
                      </Th>
                      <Th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((c) => (
                      <Tr key={c.key} onClick={() => openCustomer(c.key)} className="group">
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold text-ink">{c.name}</span>
                                {c.spent >= top && <TopTag title={t('top')} label={t('topShort')} />}
                              </div>
                              <div className="truncate text-[12.5px] text-muted">{c.email}</div>
                            </div>
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap text-[13px] text-ink-soft tabular-nums">{c.phone}</Td>
                        <Td className="whitespace-nowrap text-[13px] text-ink-soft">{c.city}</Td>
                        <Td className="text-center">
                          <span className={cn('inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full px-2 text-[12px] font-bold tabular-nums', c.count > 1 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15' : 'bg-canvas text-ink-soft')}>
                            {c.count > 1 && <Repeat2 className="h-3 w-3" />}
                            {c.count}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap text-right font-bold tabular-nums">{money(c.spent, lang)}</Td>
                        <Td className="hidden whitespace-nowrap text-[13px] text-ink-soft xl:table-cell">{date(c.first, lang)}</Td>
                        <Td className="whitespace-nowrap">
                          <div className="text-[13px] text-ink">{date(c.last, lang)}</div>
                          {now - new Date(c.last).getTime() < 30 * 86400000 && <div className="text-[11.5px] text-muted">{timeAgo(c.last, lang)}</div>}
                        </Td>
                        <Td className="w-8 pl-0!">
                          <ChevronRight className="h-4 w-4 text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>

                {/* Mobile cards */}
                <ul className="divide-y divide-line/70 md:hidden">
                  {visible.map((c) => (
                    <li key={c.key}>
                      <button type="button" onClick={() => openCustomer(c.key)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-canvas/70">
                        <Avatar name={c.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[15px] font-semibold text-ink">{c.name}</span>
                            {c.spent >= top && <TopTag title={t('top')} label={t('topShort')} />}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-muted">
                            <MapPin className="h-3 w-3 shrink-0" /> {c.city} · {now - new Date(c.last).getTime() < 30 * 86400000 ? timeAgo(c.last, lang) : date(c.last, lang, { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[15px] font-bold text-ink tabular-nums">{money(c.spent, lang, { decimals: false })}</div>
                          <div className={cn('mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold', c.count > 1 ? 'text-emerald-700' : 'text-muted')}>
                            {c.count > 1 ? <Repeat2 className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                            {t(`orders_${pluralForm(c.count, lang)}`, { n: c.count })}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-line/70 px-4 py-3.5 text-[13px] text-muted sm:flex-row sm:px-5">
                  <span>{t('showing', { n: visible.length, total: filtered.length })}</span>
                  {filtered.length > visible.length && (
                    <Button variant="outline" shape="rounded" size="sm" icon={<ChevronDown className="h-4 w-4" />} onClick={() => setLimit((l) => l + PAGE)}>
                      {t('showMore')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <CustomerDrawer customer={current} open={open} onClose={closeCustomer} isTop={!!current && current.spent >= top} />
    </div>
  );
}
