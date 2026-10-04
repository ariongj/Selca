import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowRight, Ban, Building2, CalendarClock, CheckCircle2, ExternalLink, Mail, MapPin, MessageSquareQuote, Phone, Printer,
  SearchX, Store, Tag, Truck, Wrench, XCircle,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Card, OrderStatusBadge, PageHeader, PaymentStatusBadge, Thumb, confirmDialog } from '@/admin/components/kit';
import { StatusStepper } from '@/admin/components/orders/StatusStepper';
import { OrderTimeline } from '@/admin/components/orders/OrderTimeline';
import { ORDER_FLOW, PAY_ICON, customerName, installationAmount, isRecent, localizeLine, mapsUrl, nextStatus, qtyLabel } from '@/admin/components/orders/helpers';
import { LANGS, defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { date, dateTime, money, perUnit, timeAgo } from '@/lib/format';
import { cn, initials } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

const T = defineDict({
  me: {
    title: 'Narudžba {n}',
    placed: 'Kreirana {date}',
    orderLang: 'Jezik kupca: {lang}',
    printInvoice: 'Štampaj račun',
    cancelOrder: 'Otkaži narudžbu',
    cancelTitle: 'Otkazati narudžbu {n}?',
    cancelText: 'Status će biti promijenjen u „Otkazana“. Ako je narudžba plaćena, uplata se označava kao refundirana.',
    cancelConfirm: 'Da, otkaži',
    cancelled: 'Narudžba {n} je otkazana',
    statusTitle: 'Status narudžbe',
    statusDesc: 'Pomjerite narudžbu kroz faze — svaka promjena se bilježi u istoriji.',
    advanceTo: 'Prebaci u „{s}“',
    notePh: 'Napomena uz promjenu (opciono)',
    advanced: 'Status je promijenjen u „{s}“',
    doneTitle: 'Narudžba je završena',
    doneText: 'Zatvorena {date}',
    cancelledTitle: 'Narudžba je otkazana',
    cancelledText: 'Otkazana {date}',
    stepOf: 'Korak {i} od {n}',
    items: 'Stavke',
    itemsDesc: '{n} proizvoda u narudžbi',
    col_product: 'Proizvod',
    col_qty: 'Količina',
    col_price: 'Cijena',
    col_total: 'Iznos',
    sku: 'Šifra',
    installationLine: 'Ugradnja {price}',
    summary: 'Obračun',
    coupon: 'Kupon',
    paidLabel: 'Plaćeno',
    dueLabel: 'Za naplatu',
    customer: 'Kupac',
    ordersCount: '{n}. narudžba ovog kupca',
    firstOrder: 'Prva narudžba kupca',
    allCustomerOrders: 'Sve narudžbe',
    openMap: 'Otvori na mapi',
    country: 'Crna Gora',
    company: 'Firma',
    pib: 'PIB',
    customerNote: 'Napomena kupca',
    deliveryPayment: 'Isporuka i plaćanje',
    delivery: 'Isporuka',
    payment: 'Plaćanje',
    fee: 'Cijena dostave',
    pickupAt: 'Preuzimanje: {addr}',
    deliveryDate: 'Termin: {date}',
    freeReasonInstall: 'Besplatno uz ugradnju',
    reference: 'Poziv na broj',
    markPaid: 'Označi kao plaćeno',
    markedPaid: 'Uplata je evidentirana',
    activity: 'Aktivnost',
    activityDesc: 'Istorija statusa i interne napomene',
    notFound: 'Narudžba nije pronađena',
    notFoundText: 'Moguće je da je obrisana ili da link nije ispravan.',
    backToOrders: 'Nazad na narudžbe',
  },
  sq: {
    title: 'Porosia {n}',
    placed: 'Krijuar më {date}',
    orderLang: 'Gjuha e klientit: {lang}',
    printInvoice: 'Printo faturën',
    cancelOrder: 'Anulo porosinë',
    cancelTitle: 'Të anulohet porosia {n}?',
    cancelText: 'Statusi do të ndryshojë në „E anuluar“. Nëse porosia është paguar, pagesa shënohet si e rimbursuar.',
    cancelConfirm: 'Po, anuloje',
    cancelled: 'Porosia {n} u anulua',
    statusTitle: 'Statusi i porosisë',
    statusDesc: 'Kalojeni porosinë nëpër faza — çdo ndryshim regjistrohet në histori.',
    advanceTo: 'Kalo në „{s}“',
    notePh: 'Shënim për ndryshimin (opsional)',
    advanced: 'Statusi u ndryshua në „{s}“',
    doneTitle: 'Porosia është përfunduar',
    doneText: 'Mbyllur më {date}',
    cancelledTitle: 'Porosia është anuluar',
    cancelledText: 'Anuluar më {date}',
    stepOf: 'Hapi {i} nga {n}',
    items: 'Artikujt',
    itemsDesc: '{n} produkte në porosi',
    col_product: 'Produkti',
    col_qty: 'Sasia',
    col_price: 'Çmimi',
    col_total: 'Shuma',
    sku: 'Kodi',
    installationLine: 'Montimi {price}',
    summary: 'Llogaria',
    coupon: 'Kuponi',
    paidLabel: 'E paguar',
    dueLabel: 'Për t’u paguar',
    customer: 'Klienti',
    ordersCount: 'Porosia e {n}-të e këtij klienti',
    firstOrder: 'Porosia e parë e klientit',
    allCustomerOrders: 'Të gjitha porositë',
    openMap: 'Hap në hartë',
    country: 'Mali i Zi',
    company: 'Kompania',
    pib: 'NIPT',
    customerNote: 'Shënimi i klientit',
    deliveryPayment: 'Dorëzimi dhe pagesa',
    delivery: 'Dorëzimi',
    payment: 'Pagesa',
    fee: 'Kostoja e transportit',
    pickupAt: 'Marrje: {addr}',
    deliveryDate: 'Termini: {date}',
    freeReasonInstall: 'Falas me montim',
    reference: 'Referenca',
    markPaid: 'Shëno si të paguar',
    markedPaid: 'Pagesa u regjistrua',
    activity: 'Aktiviteti',
    activityDesc: 'Historia e statusit dhe shënimet e brendshme',
    notFound: 'Porosia nuk u gjet',
    notFoundText: 'Mund të jetë fshirë ose lidhja nuk është e saktë.',
    backToOrders: 'Kthehu te porositë',
  },
  en: {
    title: 'Order {n}',
    placed: 'Placed {date}',
    orderLang: 'Customer language: {lang}',
    printInvoice: 'Print invoice',
    cancelOrder: 'Cancel order',
    cancelTitle: 'Cancel order {n}?',
    cancelText: 'The status will change to “Cancelled”. If the order was paid, the payment is marked as refunded.',
    cancelConfirm: 'Yes, cancel it',
    cancelled: 'Order {n} was cancelled',
    statusTitle: 'Order status',
    statusDesc: 'Move the order through its stages — every change is logged in the history.',
    advanceTo: 'Move to “{s}”',
    notePh: 'Note for this change (optional)',
    advanced: 'Status changed to “{s}”',
    doneTitle: 'Order completed',
    doneText: 'Closed on {date}',
    cancelledTitle: 'Order cancelled',
    cancelledText: 'Cancelled on {date}',
    stepOf: 'Step {i} of {n}',
    items: 'Items',
    itemsDesc: '{n} products in this order',
    col_product: 'Product',
    col_qty: 'Quantity',
    col_price: 'Price',
    col_total: 'Amount',
    sku: 'SKU',
    installationLine: 'Installation {price}',
    summary: 'Summary',
    coupon: 'Coupon',
    paidLabel: 'Paid',
    dueLabel: 'Amount due',
    customer: 'Customer',
    ordersCount: 'Order no. {n} from this customer',
    firstOrder: 'Customer’s first order',
    allCustomerOrders: 'All orders',
    openMap: 'Open in Maps',
    country: 'Montenegro',
    company: 'Company',
    pib: 'Tax ID',
    customerNote: 'Customer note',
    deliveryPayment: 'Delivery & payment',
    delivery: 'Delivery',
    payment: 'Payment',
    fee: 'Delivery fee',
    pickupAt: 'Pickup: {addr}',
    deliveryDate: 'Scheduled: {date}',
    freeReasonInstall: 'Free with installation',
    reference: 'Payment reference',
    markPaid: 'Mark as paid',
    markedPaid: 'Payment recorded',
    activity: 'Activity',
    activityDesc: 'Status history and internal notes',
    notFound: 'Order not found',
    notFoundText: 'It may have been deleted or the link is incorrect.',
    backToOrders: 'Back to orders',
  },
});

export default function OrderDetail() {
  const { id } = useParams();
  const t = useDict(T, 'admin');
  const order = useDb((s) => s.orders.find((o) => o.id === id || o.number === id));
  const markOrderSeen = useDb((s) => s.markOrderSeen);

  useEffect(() => {
    if (order && !order.seen) markOrderSeen(order.id);
  }, [order, markOrderSeen]);

  if (!order) {
    return (
      <div className="animate-fade-in">
        <PageHeader title={t('notFound')} back="/admin/narudzbe" />
        <Card>
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title={t('notFound')}
            text={t('notFoundText')}
            action={
              <ButtonLink to="/admin/narudzbe" variant="dark" size="sm" shape="rounded">
                {t('backToOrders')}
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }
  return <OrderView order={order} />;
}

function OrderView({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const settings = useSettings();
  const setOrderStatus = useDb((s) => s.setOrderStatus);
  const products = useDb((s) => s.products);
  const allOrders = useDb((s) => s.orders);
  const [note, setNote] = useState('');

  const next = nextStatus(order.status);
  const cancelled = order.status === 'cancelled';
  const canCancel = !cancelled && order.status !== 'completed';
  const lastAt = (s: OrderStatus) => [...order.timeline].reverse().find((e) => e.status === s)?.at ?? order.createdAt;

  const history = useMemo(() => {
    const email = order.customer.email.toLowerCase();
    const mine = allOrders.filter((o) => o.customer.email.toLowerCase() === email).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { count: mine.length, index: mine.findIndex((o) => o.id === order.id) + 1 };
  }, [allOrders, order.customer.email, order.id]);

  const advance = () => {
    if (!next) return;
    setOrderStatus(order.id, next, note.trim() || undefined);
    setNote('');
    toast.success(t('advanced', { s: tc(`status_${next}`) }));
  };

  const cancel = async () => {
    const ok = await confirmDialog({ title: t('cancelTitle', { n: order.number }), text: t('cancelText'), confirmLabel: t('cancelConfirm'), danger: true });
    if (!ok) return;
    setOrderStatus(order.id, 'cancelled');
    toast.success(t('cancelled', { n: order.number }));
  };

  const orderLangLabel = LANGS.find((l) => l.code === order.lang)?.label ?? order.lang;

  return (
    <div className="animate-fade-in">
      <PageHeader
        back="/admin/narudzbe"
        title={t('title', { n: order.number })}
        badge={
          <span className="flex flex-wrap items-center gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment.status} />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t('placed', { date: dateTime(order.createdAt, lang) })}</span>
            {isRecent(order.createdAt) && (
              <>
                <span className="text-line">•</span>
                <span>{timeAgo(order.createdAt, lang)}</span>
              </>
            )}
            {order.lang !== lang && (
              <>
                <span className="text-line">•</span>
                <span>{t('orderLang', { lang: orderLangLabel })}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            {canCancel && (
              <Button variant="ghost" size="sm" shape="rounded" className="text-red-700 hover:bg-red-50" icon={<XCircle className="h-4 w-4" />} onClick={cancel}>
                {t('cancelOrder')}
              </Button>
            )}
            <Button variant="outline" size="sm" shape="rounded" icon={<Printer className="h-4 w-4" />} onClick={() => window.open(`/admin/faktura/${order.id}`, '_blank', 'noopener')}>
              {t('printInvoice')}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 space-y-5">
          <Card title={t('statusTitle')} description={t('statusDesc')} actions={<span className="hidden whitespace-nowrap text-xs font-semibold text-muted sm:inline">{!cancelled && t('stepOf', { i: ORDER_FLOW.indexOf(order.status) + 1, n: ORDER_FLOW.length })}</span>}>
            {cancelled && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/10">
                <Ban className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong className="font-bold">{t('cancelledTitle')}</strong> · {t('cancelledText', { date: dateTime(lastAt('cancelled'), lang) })}
                </span>
              </div>
            )}
            <StatusStepper order={order} />
            {next && !cancelled && (
              <form
                className="mt-6 flex flex-col gap-2.5 border-t border-line/70 pt-5 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  advance();
                }}
              >
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('notePh')}
                  className="h-10 w-full min-w-0 rounded-lg sm:flex-1 border border-line bg-white px-3.5 text-sm outline-none transition placeholder:text-muted/80 focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
                />
                <Button type="submit" size="sm" shape="rounded" className="h-10" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('advanceTo', { s: tc(`status_${next}`) })}
                </Button>
              </form>
            )}
            {order.status === 'completed' && (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-600/10">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong className="font-bold">{t('doneTitle')}</strong> · {t('doneText', { date: date(lastAt('completed'), lang) })}
                </span>
              </div>
            )}
          </Card>

          <Card title={t('items')} description={t('itemsDesc', { n: order.items.length })} padded={false}>
            <div className="hidden grid-cols-[minmax(0,1fr)_128px_96px_112px] gap-4 border-b border-line bg-canvas/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:grid">
              <span>{t('col_product')}</span>
              <span className="text-right">{t('col_qty')}</span>
              <span className="text-right">{t('col_price')}</span>
              <span className="text-right">{t('col_total')}</span>
            </div>
            <ul className="divide-y divide-line/70">
              {order.items.map((l, i) => {
                const product = products.find((p) => p.id === l.productId);
                const loc = localizeLine(l, product, order.lang, lang);
                const inst = installationAmount(l);
                return (
                  <li key={`${l.productId}-${i}`} className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3.5 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_128px_96px_112px] sm:gap-4 sm:px-5">
                    <div className="contents sm:flex sm:min-w-0 sm:gap-3.5">
                      <Thumb src={l.image} className="h-14 w-14 rounded-xl" />
                      <div className="min-w-0">
                        {product ? (
                          <Link to={`/admin/proizvodi/${product.id}`} className="font-semibold leading-snug text-ink hover:text-brand-700 hover:underline">
                            {loc.name}
                          </Link>
                        ) : (
                          <span className="font-semibold leading-snug text-ink">{loc.name}</span>
                        )}
                        <p className="mt-0.5 text-xs text-muted">
                          {t('sku')} {l.sku}
                          {loc.options && <span> · {loc.options}</span>}
                        </p>
                        {l.installation && l.installationPrice > 0 && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-sage/10 px-2 py-0.5 text-[12px] font-semibold text-sage">
                            <Wrench className="h-3 w-3" />
                            {t('installationLine', { price: `${money(l.installationPrice, lang)} ${perUnit(l.unit, lang)}` })}
                          </p>
                        )}
                        {/* mobile: qty × price / total */}
                        <div className="mt-2 flex items-end justify-between gap-3 sm:hidden">
                          <span className="text-[13px] text-muted">
                            {qtyLabel(l, lang, tc('packs'))} × {money(l.unitPrice, lang)}
                          </span>
                          <span className="text-right">
                            <span className="block font-bold tabular-nums">{money(l.lineTotal, lang)}</span>
                            {inst > 0 && <span className="block text-xs font-semibold tabular-nums text-sage">+ {money(inst, lang)}</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden text-right text-sm tabular-nums text-ink-soft sm:block">
                      {qtyLabel(l, lang, tc('packs'))}
                      {l.unit === 'm2' && l.packSize ? <span className="mt-0.5 block text-xs text-muted">{l.packSize} m² / {tc('packs')}</span> : null}
                    </div>
                    <div className="hidden text-right text-sm tabular-nums text-ink-soft sm:block">
                      {money(l.unitPrice, lang)}
                      <span className="mt-0.5 block text-xs text-muted">{perUnit(l.unit, lang)}</span>
                    </div>
                    <div className="hidden text-right tabular-nums sm:block">
                      <span className="block font-bold text-ink">{money(l.lineTotal, lang)}</span>
                      {inst > 0 && <span className="mt-0.5 block text-xs font-semibold text-sage">+ {money(inst, lang)}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title={t('summary')}>
            <dl className="space-y-1">
              <Row label={tc('subtotal')} value={money(order.subtotal, lang)} />
              {order.installationTotal > 0 && <Row label={tc('installation')} value={money(order.installationTotal, lang)} />}
              {order.discount > 0 && (
                <Row
                  label={
                    <span className="inline-flex items-center gap-2">
                      {tc('discount')}
                      {order.coupon?.code && (
                        <Badge tone="outline" className="gap-1 tracking-wider">
                          <Tag className="h-3 w-3" />
                          {order.coupon.code}
                        </Badge>
                      )}
                    </span>
                  }
                  value={<span className="text-emerald-700">− {money(order.discount, lang)}</span>}
                />
              )}
              <Row
                label={`${tc('shipping')} · ${tc(`delivery_${order.delivery.method}`)}`}
                value={order.shipping > 0 ? money(order.shipping, lang) : <span className="font-semibold text-emerald-700">{tc('free')}</span>}
              />
            </dl>
            <div className="mt-3 flex items-end justify-between gap-4 border-t border-line pt-4">
              <div>
                <div className="text-[15px] font-bold text-ink">{tc('total')}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {tc('vatIncluded', { rate: settings.vatRate })}: {money(order.vat, lang)}
                </div>
              </div>
              <div className={cn('text-2xl font-extrabold tracking-tight tabular-nums', cancelled ? 'text-muted line-through' : 'text-ink')}>{money(order.total, lang)}</div>
            </div>
            {!cancelled && (
              <div className={cn('mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm', order.payment.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900')}>
                <span className="font-semibold">{order.payment.status === 'paid' ? t('paidLabel') : t('dueLabel')}</span>
                <span className="font-bold tabular-nums">{money(order.total, lang)}</span>
              </div>
            )}
          </Card>
        </div>

        {/* ---------------- Side column ---------------- */}
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-1">
          <CustomerCard order={order} history={history} />

          <Card title={t('deliveryPayment')}>
            <div className="space-y-4">
              <InfoBlock icon={order.delivery.method === 'pickup' ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />} label={t('delivery')}>
                <p className="font-semibold text-ink">{tc(`delivery_${order.delivery.method}`)}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {order.delivery.method === 'pickup'
                    ? t('pickupAt', { addr: settings.pickupAddress })
                    : `${t('fee')}: ${order.shipping > 0 ? money(order.shipping, lang) : order.installationTotal > 0 ? t('freeReasonInstall') : tc('free')}`}
                </p>
                {order.delivery.date && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t('deliveryDate', { date: date(order.delivery.date, lang, { weekday: 'short', day: 'numeric', month: 'short' }) })}
                  </p>
                )}
              </InfoBlock>
              <div className="border-t border-line/70" />
              <PaymentBlock order={order} />
            </div>
          </Card>

          <Card title={t('activity')} description={t('activityDesc')} className="md:col-span-2 xl:col-span-1">
            <OrderTimeline order={order} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function PaymentBlock({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const updateOrder = useDb((s) => s.updateOrder);
  const PayIcon = PAY_ICON[order.payment.method];
  const canMarkPaid = order.payment.status === 'pending' && order.status !== 'cancelled';

  const markPaid = () => {
    updateOrder(order.id, {
      payment: { ...order.payment, status: 'paid' },
      timeline: [...order.timeline, { at: new Date().toISOString(), status: 'payment', by: 'admin' }],
    });
    toast.success(t('markedPaid'));
  };

  return (
    <InfoBlock icon={<PayIcon className="h-4 w-4" />} label={t('payment')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink">{tc(`pay_${order.payment.method}`)}</p>
        <PaymentStatusBadge status={order.payment.status} />
      </div>
      {order.payment.method === 'bank' && (
        <p className="mt-0.5 text-[13px] text-muted">
          {t('reference')}: <span className="font-bold tracking-wide text-ink">{order.number}</span>
        </p>
      )}
      {canMarkPaid && (
        <Button variant="soft" size="sm" shape="rounded" className="mt-3 w-full" icon={<CheckCircle2 className="h-4 w-4" />} onClick={markPaid}>
          {t('markPaid')}
        </Button>
      )}
    </InfoBlock>
  );
}

function CustomerCard({ order, history }: { order: Order; history: { count: number; index: number } }) {
  const t = useDict(T, 'admin');
  const c = order.customer;
  const name = customerName(order);
  return (
    <Card
      title={t('customer')}
      actions={
        history.count > 1 ? (
          <Link to={`/admin/narudzbe?q=${encodeURIComponent(c.email)}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
            {t('allCustomerOrders')} ({history.count})
          </Link>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper">{initials(name)}</span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-ink">{name}</p>
          <p className="text-xs text-muted">{history.index > 1 ? t('ordersCount', { n: history.index }) : t('firstOrder')}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        <ContactRow icon={<Phone className="h-4 w-4" />}>
          <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
            {c.phone}
          </a>
        </ContactRow>
        <ContactRow icon={<Mail className="h-4 w-4" />}>
          <a href={`mailto:${c.email}?subject=${encodeURIComponent(`SELCA ${order.number}`)}`} className="break-all font-medium text-ink hover:text-brand-700 hover:underline">
            {c.email}
          </a>
        </ContactRow>
        <ContactRow icon={<MapPin className="h-4 w-4" />}>
          <span className="block font-medium text-ink">{c.address}</span>
          <span className="block text-muted">{c.city}, {t('country')}</span>
          <a href={mapsUrl(c.address, c.city)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
            {t('openMap')} <ExternalLink className="h-3 w-3" />
          </a>
        </ContactRow>
        {(c.company || c.pib) && (
          <ContactRow icon={<Building2 className="h-4 w-4" />}>
            {c.company && <span className="block font-medium text-ink">{c.company}</span>}
            {c.pib && (
              <span className="block text-muted">
                {t('pib')}: <span className="font-semibold text-ink-soft">{c.pib}</span>
              </span>
            )}
          </ContactRow>
        )}
      </ul>
      {c.note && (
        <div className="mt-4 rounded-xl bg-sand/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            <MessageSquareQuote className="h-3.5 w-3.5" /> {t('customerNote')}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">{c.note}</p>
        </div>
      )}
    </Card>
  );
}

function ContactRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft">{icon}</span>
      <div className="min-w-0 pt-1 leading-snug">{children}</div>
    </li>
  );
}

function InfoBlock({ icon, label, children }: { icon: ReactNode; label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}
