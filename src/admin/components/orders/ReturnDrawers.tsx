// Returns (PDF p.17 "Kthim: kërkesë, miratim, pranim, kontroll dhe vendim për stok. Rimbursimi llogaritet nga pagesa
// dhe zbritjet reale të porosisë"). Detail drawer = the request → approve → receive → refund flow; create drawer = new request.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Check as CheckIcon, CheckCircle2, CircleDollarSign, PackageCheck, Search, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Drawer } from '@/components/ui/Overlay';
import { Thumb, confirmDialog } from '@/admin/components/kit';
import { defineDict, useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCan } from '@/store/hooks';
import { fulfillmentOf, paymentOf, refundForLines } from '@/lib/orders';
import { fold } from '@/lib/search';
import { date, dateTime, money } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import type { Order, OrderLine, ReturnRequest, ReturnStatus } from '@/lib/types';
import { actorName, customerName, localizeLine } from './helpers';
import { PayBadge, ReturnBadge } from './status';
import { Eyebrow, SelectInput, Stepper, TextInput, Tip } from './ui';
import { od } from './dict';

export const RT = defineDict({
  me: {
    request: 'Zahtjev',
    approve: 'Odobri povrat',
    receive: 'Roba je primljena',
    refund: 'Refundiraj {amount}',
    reject: 'Odbij',
    rejectTitle: 'Odbiti povrat {n}?',
    rejectText: 'Kupac ne dobija povrat novca; roba se ne vraća na stanje.',
    rejectConfirm: 'Odbij povrat',
    done_approved: 'Povrat {n} je odobren',
    done_received: 'Roba za {n} je primljena',
    done_refunded: 'Refundirano {amount} za {n}',
    done_rejected: 'Povrat {n} je odbijen',
    step_requested: 'Zahtjev',
    step_approved: 'Odobren',
    step_received: 'Primljen',
    step_refunded: 'Refundiran',
    order: 'Narudžba',
    items: 'Stavke za povrat',
    ofQty: '{n} od {total}',
    reason: 'Razlog',
    refundTitle: 'Iznos refundacije',
    refundBasis: 'Neto plaćeni iznos vraćenih stavki (nakon popusta), ne trenutna cijena. Dostava se ne vraća.',
    unpaid: 'Narudžba još nije plaćena — refundacija je moguća tek kada uplata postoji.',
    markOrderPaid: 'Označi narudžbu kao plaćenu',
    orderPaid: 'Narudžba {n} je označena kao plaćena',
    restock: 'Vrati robu na stanje kada stigne',
    restockHint: 'Isključite za oštećenu robu — stanje se ne mijenja.',
    restocked: 'Vraćeno na stanje',
    notRestocked: 'Nije vraćeno na stanje',
    stepNote: 'Napomena uz sljedeći korak (opciono)',
    history: 'Istorija',
    closed: 'Povrat je zatvoren.',
    noRefundPerm: 'Vaša uloga ne može da refundira',
    // create
    createTitle: 'Novi povrat',
    pickOrder: 'Narudžba',
    findOrder: 'Broj narudžbe ili kupac…',
    noOrders: 'Nema poslatih narudžbi za ovu pretragu',
    change: 'Promijeni',
    chooseItems: 'Šta kupac vraća?',
    alreadyReturned: 'već u povratu: {n}',
    reasonLabel: 'Razlog povrata',
    r_damaged: 'Oštećeno pri transportu',
    r_shade: 'Pogrešna nijansa ili model',
    r_size: 'Pogrešna mjera',
    r_surplus: 'Višak materijala',
    r_mind: 'Kupac je odustao',
    r_other: 'Drugo',
    details: 'Detalji (opciono)',
    detailsPh: 'npr. 2 paketa neotvorena, fotografije stigle e-mailom',
    estimated: 'Procijenjena refundacija',
    create: 'Kreiraj povrat',
    created: 'Povrat {n} je kreiran',
    needItems: 'Izaberite bar jednu stavku',
  },
  sq: {
    request: 'Kërkesë',
    approve: 'Mirato kthimin',
    receive: 'Malli u pranua',
    refund: 'Rimburso {amount}',
    reject: 'Refuzo',
    rejectTitle: 'Të refuzohet kthimi {n}?',
    rejectText: 'Klienti nuk merr rimbursim; malli nuk kthehet në stok.',
    rejectConfirm: 'Refuzo kthimin',
    done_approved: 'Kthimi {n} u miratua',
    done_received: 'Malli për {n} u pranua',
    done_refunded: 'U rimbursuan {amount} për {n}',
    done_rejected: 'Kthimi {n} u refuzua',
    step_requested: 'Kërkesë',
    step_approved: 'Miratuar',
    step_received: 'Pranuar',
    step_refunded: 'Rimbursuar',
    order: 'Porosia',
    items: 'Artikujt për kthim',
    ofQty: '{n} nga {total}',
    reason: 'Arsyeja',
    refundTitle: 'Shuma e rimbursimit',
    refundBasis: 'Pagesa neto e artikujve të kthyer (pas zbritjeve), jo çmimi aktual. Transporti nuk rimbursohet.',
    unpaid: 'Porosia ende nuk është paguar — rimbursimi bëhet vetëm kur ka pagesë.',
    markOrderPaid: 'Shëno porosinë si të paguar',
    orderPaid: 'Porosia {n} u shënua si e paguar',
    restock: 'Ktheje mallin në stok kur të mbërrijë',
    restockHint: 'Çaktivizoni për mall të dëmtuar — stoku nuk ndryshon.',
    restocked: 'U kthye në stok',
    notRestocked: 'Nuk u kthye në stok',
    stepNote: 'Shënim për hapin e radhës (opsional)',
    history: 'Historiku',
    closed: 'Kthimi është mbyllur.',
    noRefundPerm: 'Roli juaj nuk mund të rimbursojë',
    createTitle: 'Kthim i ri',
    pickOrder: 'Porosia',
    findOrder: 'Numri i porosisë ose klienti…',
    noOrders: 'Nuk ka porosi të dërguara për këtë kërkim',
    change: 'Ndrysho',
    chooseItems: 'Çfarë kthen klienti?',
    alreadyReturned: 'tashmë në kthim: {n}',
    reasonLabel: 'Arsyeja e kthimit',
    r_damaged: 'Dëmtuar gjatë transportit',
    r_shade: 'Nuancë ose model i gabuar',
    r_size: 'Masë e gabuar',
    r_surplus: 'Material i tepërt',
    r_mind: 'Klienti ndryshoi mendje',
    r_other: 'Tjetër',
    details: 'Detaje (opsionale)',
    detailsPh: 'p.sh. 2 pako të pahapura, fotot erdhën me e-mail',
    estimated: 'Rimbursimi i llogaritur',
    create: 'Krijo kthimin',
    created: 'Kthimi {n} u krijua',
    needItems: 'Zgjidhni të paktën një artikull',
  },
  en: {
    request: 'Request',
    approve: 'Approve return',
    receive: 'Goods received',
    refund: 'Refund {amount}',
    reject: 'Reject',
    rejectTitle: 'Reject return {n}?',
    rejectText: 'The customer gets no refund; the goods do not go back to stock.',
    rejectConfirm: 'Reject return',
    done_approved: 'Return {n} approved',
    done_received: 'Goods for {n} received',
    done_refunded: 'Refunded {amount} for {n}',
    done_rejected: 'Return {n} rejected',
    step_requested: 'Requested',
    step_approved: 'Approved',
    step_received: 'Received',
    step_refunded: 'Refunded',
    order: 'Order',
    items: 'Items to return',
    ofQty: '{n} of {total}',
    reason: 'Reason',
    refundTitle: 'Refund amount',
    refundBasis: 'The net paid amount of the returned items (after discounts), not today’s price. Delivery is not refunded.',
    unpaid: 'The order has not been paid yet — a refund needs a recorded payment.',
    markOrderPaid: 'Mark order as paid',
    orderPaid: 'Order {n} marked as paid',
    restock: 'Put the goods back in stock when they arrive',
    restockHint: 'Turn off for damaged goods — stock stays unchanged.',
    restocked: 'Back in stock',
    notRestocked: 'Not restocked',
    stepNote: 'Note for the next step (optional)',
    history: 'History',
    closed: 'This return is closed.',
    noRefundPerm: 'Your role cannot issue refunds',
    createTitle: 'New return',
    pickOrder: 'Order',
    findOrder: 'Order number or customer…',
    noOrders: 'No shipped orders for this search',
    change: 'Change',
    chooseItems: 'What is the customer returning?',
    alreadyReturned: 'already in a return: {n}',
    reasonLabel: 'Return reason',
    r_damaged: 'Damaged in transit',
    r_shade: 'Wrong shade or model',
    r_size: 'Wrong size',
    r_surplus: 'Surplus material',
    r_mind: 'Customer changed their mind',
    r_other: 'Other',
    details: 'Details (optional)',
    detailsPh: 'e.g. 2 unopened packs, photos received by e-mail',
    estimated: 'Calculated refund',
    create: 'Create return',
    created: 'Return {n} created',
    needItems: 'Select at least one item',
  },
});

const STEPS: ReturnStatus[] = ['requested', 'approved', 'received', 'refunded'];
const REASONS = ['damaged', 'shade', 'size', 'surplus', 'mind', 'other'] as const;

/** Name + image of the order line(s) a return line refers to. */
function lineInfo(order: Order | undefined, productId: string): OrderLine | undefined {
  return order?.items.find((l) => l.productId === productId);
}

/* ================================================================== */
/* Detail drawer                                                       */
/* ================================================================== */
export function ReturnDrawer({ ret, onClose }: { ret: ReturnRequest | null; onClose: () => void }) {
  const t = useDict(RT, 'admin');
  const to = useDict(od, 'admin');
  const lang = useLang('admin');
  const can = useCan();
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const staff = useDb((s) => s.staff);
  const upsert = useDb((s) => s.upsert);
  const updateOrder = useDb((s) => s.updateOrder);
  const setReturnStatus = useDb((s) => s.setReturnStatus);
  const [note, setNote] = useState('');

  useEffect(() => setNote(''), [ret?.id, ret?.status]);

  const order = ret ? orders.find((o) => o.id === ret.orderId) : undefined;
  const pay = order ? paymentOf(order) : 'pending';
  const paid = pay === 'paid' || pay === 'partially_refunded' || pay === 'refunded';
  const editable = can('returns', 'edit');
  const canRefund = can('returns', 'refund');

  const go = async (status: ReturnStatus) => {
    if (!ret) return;
    if (status === 'rejected') {
      const ok = await confirmDialog({ title: t('rejectTitle', { n: ret.number }), text: t('rejectText'), confirmLabel: t('rejectConfirm'), danger: true });
      if (!ok) return;
    }
    setReturnStatus(ret.id, status, note.trim() || undefined);
    toast.success(t(`done_${status as 'approved' | 'received' | 'refunded' | 'rejected'}`, { n: ret.number, amount: money(ret.refundAmount, lang) }));
  };

  const markPaid = () => {
    if (!order) return;
    updateOrder(order.id, { payment: { ...order.payment, status: 'paid', failed: false }, timeline: [...order.timeline, { at: new Date().toISOString(), status: 'payment', by: 'admin' }] });
    toast.success(t('orderPaid', { n: order.number }));
  };

  const reached = ret ? Math.max(...ret.timeline.map((e) => STEPS.indexOf(e.status)), 0) : 0;
  const atOf = (s: ReturnStatus) => ret?.timeline.find((e) => e.status === s)?.at;

  let footer: ReactNode = null;
  if (ret && editable) {
    if (ret.status === 'requested' || ret.status === 'approved')
      footer = (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" shape="rounded" icon={<X className="h-4 w-4" />} onClick={() => go('rejected')}>
            {t('reject')}
          </Button>
          {ret.status === 'requested' ? (
            <Button size="sm" shape="rounded" icon={<ThumbsUp className="h-4 w-4" />} onClick={() => go('approved')}>
              {t('approve')}
            </Button>
          ) : (
            <Button size="sm" shape="rounded" icon={<PackageCheck className="h-4 w-4" />} onClick={() => go('received')}>
              {t('receive')}
            </Button>
          )}
        </div>
      );
    else if (ret.status === 'received')
      footer = (
        <div className="flex justify-end">
          <Tip tip={!canRefund ? t('noRefundPerm') : !paid ? t('unpaid') : null}>
            <Button size="sm" shape="rounded" icon={<CircleDollarSign className="h-4 w-4" />} disabled={!canRefund || !paid} onClick={() => go('refunded')}>
              {t('refund', { amount: money(ret.refundAmount, lang) })}
            </Button>
          </Tip>
        </div>
      );
  }

  return (
    <Drawer
      open={!!ret}
      onClose={onClose}
      width="max-w-[520px]"
      title={
        ret && (
          <span className="flex items-center gap-2.5">
            <span className="text-[17px] font-bold">{ret.number}</span>
            <ReturnBadge status={ret.status} />
          </span>
        )
      }
      footer={footer}
    >
      {ret && (
        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* progress */}
          <ol className="grid grid-cols-4 gap-1">
            {STEPS.map((s, i) => {
              const done = i <= reached && !(ret.status === 'rejected' && i > reached);
              const isRejectedHere = ret.status === 'rejected' && i === reached + 1;
              return (
                <li key={s} className="min-w-0">
                  <span className={cn('block h-1 rounded-full', isRejectedHere ? 'bg-[#E5A69B]' : done ? 'bg-ink' : 'bg-line')} />
                  <span className={cn('mt-1.5 flex items-center gap-1 text-[12px] font-semibold', done ? 'text-ink' : 'text-muted')}>
                    {done && <CheckIcon className="h-3 w-3 shrink-0" strokeWidth={3} />}
                    <span className="truncate">{isRejectedHere ? to('ret_rejected') : t(`step_${s as 'requested'}`)}</span>
                  </span>
                  <span className="block text-[11.5px] tabular-nums text-muted">{atOf(isRejectedHere ? 'rejected' : s) ? date(atOf(isRejectedHere ? 'rejected' : s)!, lang, { day: 'numeric', month: 'short' }) : ' '}</span>
                </li>
              );
            })}
          </ol>

          {/* order */}
          {order && (
            <section className="rounded-xl border border-line bg-white p-4">
              <Eyebrow>{t('order')}</Eyebrow>
              <div className="mt-1 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/admin/narudzbe/${order.id}`} className="font-semibold text-ink hover:underline">
                    #{order.number}
                  </Link>
                  <p className="truncate text-[13px] text-ink-soft">
                    {customerName(order)} · {order.customer.phone}
                  </p>
                  <p className="text-[12px] text-muted">{date(order.createdAt, lang)} · {to(`ful_${fulfillmentOf(order)}`)}</p>
                </div>
                <PayBadge state={pay} />
              </div>
            </section>
          )}

          {/* items */}
          <section className="rounded-xl border border-line bg-white">
            <p className="border-b border-line/70 px-4 py-2.5 text-[13.5px] font-semibold text-ink">{t('items')}</p>
            <ul className="divide-y divide-line/70">
              {ret.lines.map((l) => {
                const ol = lineInfo(order, l.productId);
                const name = ol ? localizeLine(ol, products.find((p) => p.id === l.productId), order!.lang, lang).name : l.productId;
                const amount = order ? refundForLines(order, [l]) : 0;
                return (
                  <li key={l.productId} className="flex items-center gap-3 px-4 py-2.5">
                    <Thumb src={ol?.image} className="h-10 w-10 rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{name}</span>
                      <span className="block text-[12px] text-muted">{t('ofQty', { n: l.qty, total: ol?.qty ?? l.qty })}</span>
                    </span>
                    <span className="shrink-0 text-[13.5px] font-semibold tabular-nums">{money(amount, lang)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <Eyebrow>{t('reason')}</Eyebrow>
            <p className="mt-1 text-[13.5px] text-ink">{ret.reason}</p>
          </section>

          {/* refund */}
          <section className="rounded-xl bg-[#EBEBEB]/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-semibold text-ink">{t('refundTitle')}</span>
              <span className="text-[20px] font-bold tabular-nums text-ink">{money(ret.refundAmount, lang)}</span>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">{t('refundBasis')}</p>
            {!paid && ret.status !== 'refunded' && ret.status !== 'rejected' && order && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#E8D9A8] bg-[#FFF8E1] px-3 py-2 text-[12.5px] text-[#4A3A00]">
                <span className="min-w-0 flex-1">{t('unpaid')}</span>
                {can('orders', 'edit') && (
                  <Button variant="outline" size="xs" shape="rounded" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={markPaid}>
                    {t('markOrderPaid')}
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* restock */}
          <section className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-ink">{t('restock')}</p>
              <p className="mt-0.5 text-[12.5px] text-muted">{ret.restocked ? t('restocked') : ret.status === 'received' || ret.status === 'refunded' ? t('notRestocked') : t('restockHint')}</p>
            </div>
            <Switch
              size="sm"
              checked={ret.restocked ? true : ret.restock}
              disabled={!editable || !(ret.status === 'requested' || ret.status === 'approved')}
              onChange={(v) => upsert('returns', { ...ret, restock: v })}
            />
          </section>

          {editable && (ret.status === 'requested' || ret.status === 'approved' || ret.status === 'received') && (
            <TextInput label={t('stepNote')} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
          {(ret.status === 'refunded' || ret.status === 'rejected') && <p className="text-[13px] text-muted">{t('closed')}</p>}

          {/* history */}
          <section>
            <Eyebrow>{t('history')}</Eyebrow>
            <ol className="mt-2 space-y-3">
              {[...ret.timeline].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex gap-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', i === 0 ? 'bg-ink' : 'bg-ink/30')} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-ink">{to(`ret_${e.status}`)}</p>
                    {e.note && <p className="mt-0.5 text-[13px] text-ink-soft">{e.note}</p>}
                    <p className="text-[12px] text-muted">
                      {dateTime(e.at, lang)}
                      {e.by && <> · {actorName(e.by, staff, { web: to('by_web'), admin: to('by_admin') })}</>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

/* ================================================================== */
/* Create drawer                                                       */
/* ================================================================== */
export function CreateReturnDrawer({ open, onClose, initialOrderId, onCreated }: { open: boolean; onClose: () => void; initialOrderId?: string | null; onCreated: (r: ReturnRequest) => void }) {
  const t = useDict(RT, 'admin');
  const to = useDict(od, 'admin');
  const lang = useLang('admin');
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const returns = useDb((s) => s.returns);
  const createReturn = useDb((s) => s.createReturn);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<(typeof REASONS)[number]>('damaged');
  const [details, setDetails] = useState('');
  const [restock, setRestock] = useState(true);

  useEffect(() => {
    if (!open) return;
    setOrderId(initialOrderId ?? null);
    setQ('');
    setQty({});
    setReason('damaged');
    setDetails('');
    setRestock(true);
  }, [open, initialOrderId]);

  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const eligible = useMemo(() => {
    const f = fold(q.trim());
    return [...orders]
      .filter((o) => o.status !== 'cancelled' && o.items.some((l) => l.productId))
      .filter((o) => !f || fold(`${o.number} ${customerName(o)} ${o.customer.phone} ${o.customer.email}`).includes(f))
      .sort((a, b) => Number(fulfillmentOf(b) !== 'unfulfilled') - Number(fulfillmentOf(a) !== 'unfulfilled') || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [orders, q]);

  // units already in open/closed (non-rejected) returns for this order
  const already = useMemo(() => {
    const map = new Map<string, number>();
    if (!order) return map;
    for (const r of returns) if (r.orderId === order.id && r.status !== 'rejected') for (const l of r.lines) map.set(l.productId, (map.get(l.productId) ?? 0) + l.qty);
    return map;
  }, [returns, order]);

  const lines = Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([productId, n]) => ({ productId, qty: n }));
  const estimate = order ? refundForLines(order, lines) : 0;

  const submit = () => {
    if (!order || !lines.length) return toast.error(t('needItems'));
    const text = `${t(`r_${reason}`)}${details.trim() ? ` — ${details.trim()}` : ''}`;
    const r = createReturn({ orderId: order.id, lines, reason: text, restock });
    if (!r) return;
    toast.success(t('created', { n: r.number }));
    onCreated(r);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-[520px]"
      title={<span className="text-[17px] font-bold">{t('createTitle')}</span>}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-soft">
            {t('estimated')}: <span className="font-bold tabular-nums text-ink">{money(estimate, lang)}</span>
          </span>
          <Button size="sm" shape="rounded" disabled={!order || !lines.length} onClick={submit}>
            {t('create')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* order */}
        <section>
          <p className="mb-1.5 text-[12.5px] font-semibold text-ink-soft">{t('pickOrder')}</p>
          {order ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/30 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">#{order.number}</p>
                <p className="truncate text-[12.5px] text-muted">
                  {customerName(order)} · {date(order.createdAt, lang)} · {money(order.total, lang)}
                </p>
              </div>
              {!initialOrderId && (
                <button type="button" onClick={() => { setOrderId(null); setQty({}); }} className="shrink-0 text-[12.5px] font-semibold text-ink-soft hover:text-ink hover:underline">
                  {t('change')}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-white">
              <div className="border-b border-line/70 p-2">
                <TextInput autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('findOrder')} leading={<Search />} />
              </div>
              {eligible.length === 0 ? (
                <p className="px-4 py-4 text-[13px] text-muted">{t('noOrders')}</p>
              ) : (
                <ul className="max-h-[320px] divide-y divide-line/60 overflow-y-auto">
                  {eligible.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => setOrderId(o.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-ink/[0.04]">
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink">#{o.number}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {customerName(o)} · {date(o.createdAt, lang, { day: 'numeric', month: 'short' })}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[13px] tabular-nums text-ink">{money(o.total, lang)}</span>
                          <span className="block text-[11.5px] text-muted">{to(`ful_${fulfillmentOf(o)}`)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {order && (
          <>
            <section className="rounded-xl border border-line bg-white">
              <p className="border-b border-line/70 px-4 py-2.5 text-[13.5px] font-semibold text-ink">{t('chooseItems')}</p>
              <ul className="divide-y divide-line/70">
                {order.items.map((l, i) => {
                  if (!l.productId) return null;
                  const name = localizeLine(l, products.find((p) => p.id === l.productId), order.lang, lang).name;
                  const prev = already.get(l.productId) ?? 0;
                  const max = Math.max(0, l.qty - prev);
                  const n = qty[l.productId] ?? 0;
                  return (
                    <li key={`${l.productId}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                      <Thumb src={l.image} className="h-10 w-10 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{name}</span>
                        <span className="block text-[12px] text-muted">
                          {money(round2(refundForLines(order, [{ productId: l.productId, qty: 1 }])), lang)} / {l.unit === 'm2' ? to('items_one', { n: 1 }).replace(/^1\s*/, '') : '1'}
                          {prev > 0 && <> · {t('alreadyReturned', { n: prev })}</>}
                        </span>
                      </span>
                      <Stepper value={n} min={0} max={max} onChange={(v) => setQty((s) => ({ ...s, [l.productId]: v }))} ariaLabel={name} disabled={max === 0} />
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <SelectInput label={t('reasonLabel')} value={reason} onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`r_${r}`)}
                  </option>
                ))}
              </SelectInput>
              <TextInput label={t('details')} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('detailsPh')} />
            </section>

            <section className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white p-4">
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-ink">{t('restock')}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">{t('restockHint')}</p>
              </div>
              <Switch size="sm" checked={restock} onChange={setRestock} />
            </section>

            <p className="text-[12.5px] leading-snug text-muted">{t('refundBasis')}</p>
          </>
        )}
      </div>
    </Drawer>
  );
}
