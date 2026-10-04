import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BadgePercent, Lightbulb, Pencil, Plus, ReceiptText, ShoppingCart, Ticket, Trash2, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Card, FilterPills, PageHeader, confirmDialog } from '@/admin/components/kit';
import { CouponEditor } from '@/admin/components/catalog/CouponEditor';
import { CopyButton, IconBtn, StatTile } from '@/admin/components/catalog/shared';
import { defineDict, useDict, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { date, money } from '@/lib/format';
import type { Coupon, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Kuponi',
    subtitle: 'Kodovi za popust za akcije, partnere i vjerne kupce.',
    newCoupon: 'Novi kupon',
    statActive: 'Aktivni kuponi',
    statActiveHint: 'od ukupno {n}',
    statUses: 'Ukupno korišćenja',
    statUsesHint: 'svih kupona zajedno',
    statOrders: 'Narudžbe sa kuponom',
    statOrdersHint: '{pct}% svih narudžbi',
    statDiscount: 'Odobreni popusti',
    statDiscountHint: 'prosječno {avg} po narudžbi',
    tipTitle: 'Kako kupci koriste kupon?',
    tipText: 'Kod upisuju u korpi, u polje za kupon. Popust se obračunava odmah ako je kupon aktivan, nije istekao i korpa dostiže minimalni iznos.',
    tipLink: 'Otvori korpu',
    f_all: 'Svi',
    f_active: 'Aktivni',
    f_inactive: 'Neaktivni',
    f_expired: 'Istekli',
    st_active: 'Aktivan',
    st_inactive: 'Neaktivan',
    st_expired: 'Istekao',
    typePercent: 'Procenat',
    typeFixed: 'Fiksni iznos',
    minOrder: 'Min. korpa',
    noMin: 'Bez minimuma',
    uses: 'Iskorišćen',
    usesN: '{n}×',
    validUntil: 'Važi do',
    noExpiry: 'Bez roka',
    expiredOn: 'Istekao {date}',
    daysLeft: 'još {n} dana',
    dayLeft: 'ističe danas',
    savings: 'Ušteda kupaca',
    inOrders: 'u {n} narudžbi',
    noOrders: 'Još nema narudžbi',
    noDescription: 'Bez napomene',
    codeCopied: 'Kod {code} je kopiran',
    activated: 'Kupon {code} je aktiviran',
    deactivated: 'Kupon {code} je isključen',
    expiredWarn: 'Kupon {code} je istekao — produžite rok važenja da bi radio.',
    deleteTitle: 'Obrisati kupon {code}?',
    deleteText: 'Kupci više neće moći da koriste ovaj kod. Postojeće narudžbe ostaju nepromijenjene.',
    deletedToast: 'Kupon je obrisan',
    emptyTitle: 'Još nema kupona',
    emptyText: 'Kreirajte prvi kod za popust — npr. za jesenju akciju ili nove kupce.',
    emptyFilter: 'Nema kupona u ovoj grupi',
  },
  sq: {
    title: 'Kuponët',
    subtitle: 'Kode zbritjeje për aksione, partnerë dhe klientë besnikë.',
    newCoupon: 'Kupon i ri',
    statActive: 'Kuponë aktivë',
    statActiveHint: 'nga gjithsej {n}',
    statUses: 'Përdorime gjithsej',
    statUsesHint: 'të gjithë kuponët së bashku',
    statOrders: 'Porosi me kupon',
    statOrdersHint: '{pct}% e të gjitha porosive',
    statDiscount: 'Zbritje të dhëna',
    statDiscountHint: 'mesatarisht {avg} për porosi',
    tipTitle: 'Si e përdorin klientët kuponin?',
    tipText: 'Kodin e shkruajnë në shportë, në fushën për kupon. Zbritja llogaritet menjëherë nëse kuponi është aktiv, nuk ka skaduar dhe shporta arrin shumën minimale.',
    tipLink: 'Hap shportën',
    f_all: 'Të gjithë',
    f_active: 'Aktivë',
    f_inactive: 'Joaktivë',
    f_expired: 'Të skaduar',
    st_active: 'Aktiv',
    st_inactive: 'Joaktiv',
    st_expired: 'Ka skaduar',
    typePercent: 'Përqindje',
    typeFixed: 'Shumë fikse',
    minOrder: 'Shporta min.',
    noMin: 'Pa minimum',
    uses: 'Përdorur',
    usesN: '{n}×',
    validUntil: 'Vlen deri',
    noExpiry: 'Pa afat',
    expiredOn: 'Skadoi më {date}',
    daysLeft: 'edhe {n} ditë',
    dayLeft: 'skadon sot',
    savings: 'Kursimi i klientëve',
    inOrders: 'në {n} porosi',
    noOrders: 'Ende pa porosi',
    noDescription: 'Pa shënim',
    codeCopied: 'Kodi {code} u kopjua',
    activated: 'Kuponi {code} u aktivizua',
    deactivated: 'Kuponi {code} u çaktivizua',
    expiredWarn: 'Kuponi {code} ka skaduar — zgjatni afatin që të funksionojë.',
    deleteTitle: 'Të fshihet kuponi {code}?',
    deleteText: 'Klientët nuk do të mund ta përdorin më këtë kod. Porositë ekzistuese mbeten të pandryshuara.',
    deletedToast: 'Kuponi u fshi',
    emptyTitle: 'Ende nuk ka kuponë',
    emptyText: 'Krijoni kodin e parë të zbritjes — p.sh. për aksionin e vjeshtës ose për klientët e rinj.',
    emptyFilter: 'Nuk ka kuponë në këtë grup',
  },
  en: {
    title: 'Coupons',
    subtitle: 'Discount codes for campaigns, partners and loyal customers.',
    newCoupon: 'New coupon',
    statActive: 'Active coupons',
    statActiveHint: 'out of {n} in total',
    statUses: 'Total redemptions',
    statUsesHint: 'across all coupons',
    statOrders: 'Orders with a coupon',
    statOrdersHint: '{pct}% of all orders',
    statDiscount: 'Discounts given',
    statDiscountHint: '{avg} per order on average',
    tipTitle: 'How do shoppers use a coupon?',
    tipText: 'They type the code into the coupon field in the cart. The discount applies instantly if the coupon is active, has not expired and the cart reaches the minimum total.',
    tipLink: 'Open the cart',
    f_all: 'All',
    f_active: 'Active',
    f_inactive: 'Inactive',
    f_expired: 'Expired',
    st_active: 'Active',
    st_inactive: 'Inactive',
    st_expired: 'Expired',
    typePercent: 'Percentage',
    typeFixed: 'Fixed amount',
    minOrder: 'Min. cart',
    noMin: 'No minimum',
    uses: 'Redeemed',
    usesN: '{n}×',
    validUntil: 'Valid until',
    noExpiry: 'No expiry',
    expiredOn: 'Expired {date}',
    daysLeft: '{n} days left',
    dayLeft: 'expires today',
    savings: 'Customer savings',
    inOrders: 'in {n} orders',
    noOrders: 'No orders yet',
    noDescription: 'No note',
    codeCopied: 'Code {code} copied',
    activated: 'Coupon {code} activated',
    deactivated: 'Coupon {code} switched off',
    expiredWarn: 'Coupon {code} has expired — extend its end date for it to work.',
    deleteTitle: 'Delete coupon {code}?',
    deleteText: 'Shoppers will no longer be able to use this code. Existing orders stay unchanged.',
    deletedToast: 'Coupon deleted',
    emptyTitle: 'No coupons yet',
    emptyText: 'Create your first discount code — e.g. for an autumn campaign or new customers.',
    emptyFilter: 'No coupons in this group',
  },
});

type Status = 'active' | 'inactive' | 'expired';
type Filter = 'all' | Status;
type EditorState = { open: boolean; coupon: Coupon | null; key: number };

const statusOf = (c: Coupon, now: number): Status => (c.expiresAt && new Date(c.expiresAt).getTime() < now ? 'expired' : c.active ? 'active' : 'inactive');
const STATUS_RANK: Record<Status, number> = { active: 0, inactive: 1, expired: 2 };

export default function Coupons() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const coupons = useDb((s) => s.coupons);
  const orders = useDb((s) => s.orders);
  const upsertCoupon = useDb((s) => s.upsertCoupon);
  const deleteCoupon = useDb((s) => s.deleteCoupon);
  const [filter, setFilter] = useState<Filter>('all');
  const [editor, setEditor] = useState<EditorState>({ open: false, coupon: null, key: 0 });
  const [now] = useState(() => Date.now());

  const openEditor = (coupon: Coupon | null) => setEditor((e) => ({ open: true, coupon, key: e.key + 1 }));

  /** Real usage from orders, per code (cancelled orders excluded) */
  const perCode = useMemo(() => {
    const m = new Map<string, { orders: number; discount: number }>();
    for (const o of orders) {
      if (!o.coupon || o.status === 'cancelled') continue;
      const k = o.coupon.code.toUpperCase();
      const x = m.get(k) ?? { orders: 0, discount: 0 };
      x.orders++;
      x.discount += o.discount || o.coupon.discount;
      m.set(k, x);
    }
    return m;
  }, [orders]);

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelled');
    const withCoupon = valid.filter((o) => o.coupon);
    const discount = withCoupon.reduce((s, o) => s + (o.discount || o.coupon!.discount), 0);
    return {
      active: coupons.filter((c) => statusOf(c, now) === 'active').length,
      uses: coupons.reduce((s, c) => s + c.uses, 0),
      orders: withCoupon.length,
      pct: valid.length ? Math.round((withCoupon.length / valid.length) * 100) : 0,
      discount,
      avg: withCoupon.length ? discount / withCoupon.length : 0,
    };
  }, [coupons, orders, now]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: coupons.length, active: 0, inactive: 0, expired: 0 };
    for (const x of coupons) c[statusOf(x, now)]++;
    return c;
  }, [coupons, now]);

  const list = useMemo(
    () =>
      coupons
        .map((c, i) => ({ c, i, s: statusOf(c, now) }))
        .filter((x) => filter === 'all' || x.s === filter)
        .sort((a, b) => STATUS_RANK[a.s] - STATUS_RANK[b.s] || a.i - b.i)
        .map((x) => x.c),
    [coupons, filter, now],
  );

  const toggle = (c: Coupon, active: boolean) => {
    upsertCoupon({ ...c, active });
    if (active && statusOf(c, now) === 'expired') toast.warning(t('expiredWarn', { code: c.code }));
    else toast.success(active ? t('activated', { code: c.code }) : t('deactivated', { code: c.code }));
  };

  const remove = async (c: Coupon) => {
    const ok = await confirmDialog({ title: t('deleteTitle', { code: c.code }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true });
    if (!ok) return;
    deleteCoupon(c.id);
    toast.success(t('deletedToast'));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        badge={<Badge tone="sand">{coupons.length}</Badge>}
        actions={
          <Button shape="rounded" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => openEditor(null)}>
            {t('newCoupon')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<Ticket className="h-4 w-4" />} label={t('statActive')} value={stats.active} hint={t('statActiveHint', { n: coupons.length })} accent />
        <StatTile icon={<BadgePercent className="h-4 w-4" />} label={t('statUses')} value={stats.uses} hint={t('statUsesHint')} />
        <StatTile icon={<ReceiptText className="h-4 w-4" />} label={t('statOrders')} value={stats.orders} hint={t('statOrdersHint', { pct: stats.pct })} />
        <StatTile icon={<TrendingDown className="h-4 w-4" />} label={t('statDiscount')} value={money(stats.discount, lang, { decimals: false })} hint={t('statDiscountHint', { avg: money(stats.avg, lang) })} />
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-line/80 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/15">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{t('tipTitle')}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{t('tipText')}</p>
        </div>
        <a href="/korpa" target="_blank" rel="noreferrer" className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-ink/15 bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-ink/35 sm:self-auto">
          <ShoppingCart className="h-4 w-4" /> {t('tipLink')}
        </a>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ticket className="h-6 w-6" />}
            title={t('emptyTitle')}
            text={t('emptyText')}
            action={
              <Button shape="rounded" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => openEditor(null)}>
                {t('newCoupon')}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <FilterPills
            className="mb-4"
            value={filter}
            onChange={setFilter}
            options={(['all', 'active', 'inactive', 'expired'] as const).map((id) => ({ id, label: t(`f_${id}`), count: counts[id] }))}
          />
          {list.length === 0 ? (
            <Card>
              <EmptyState icon={<Ticket className="h-6 w-6" />} title={t('emptyFilter')} />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {list.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  status={statusOf(c, now)}
                  now={now}
                  lang={lang}
                  usage={perCode.get(c.code.toUpperCase())}
                  onToggle={(v) => toggle(c, v)}
                  onEdit={() => openEditor(c)}
                  onDelete={() => remove(c)}
                />
              ))}
              <button
                type="button"
                onClick={() => openEditor(null)}
                className="group flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-ink/25 hover:bg-white/60 hover:text-ink"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-line transition group-hover:scale-105">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">{t('newCoupon')}</span>
              </button>
            </div>
          )}
        </>
      )}

      <CouponEditor key={editor.key} open={editor.open} coupon={editor.coupon} onClose={() => setEditor((e) => ({ ...e, open: false }))} />
    </div>
  );
}

function CouponCard({
  coupon: c,
  status,
  now,
  lang,
  usage,
  onToggle,
  onEdit,
  onDelete,
}: {
  coupon: Coupon;
  status: Status;
  now: number;
  lang: Lang;
  usage?: { orders: number; discount: number };
  onToggle: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const expired = status === 'expired';
  const off = status !== 'active';
  const daysLeft = c.expiresAt ? Math.ceil((new Date(c.expiresAt).getTime() - now) / 86400000) : null;
  const value = c.type === 'percent' ? `${c.value}%` : money(c.value, lang, { decimals: c.value % 1 !== 0 });
  const tone = status === 'active' ? 'green' : status === 'expired' ? 'red' : 'gray';

  return (
    <article className={cn('group relative flex flex-col rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgb(28_26_23/0.04)] transition-shadow hover:shadow-[0_12px_32px_-18px_rgb(28_26_23/0.35)]')}>
      {/* Ticket head */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn('rounded-lg px-2.5 py-1 font-mono text-[15px] font-bold tracking-[0.14em]', off ? 'bg-ink/[0.07] text-ink-soft' : 'bg-ink text-paper', expired && 'line-through decoration-ink/40')}>{c.code}</span>
            <CopyButton text={c.code} toastText={t('codeCopied', { code: c.code })} />
          </div>
          <p className={cn('mt-3 line-clamp-2 text-[13.5px] leading-snug', c.description ? 'text-ink-soft' : 'italic text-muted')}>{c.description || t('noDescription')}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn('display text-[38px] leading-none', off ? 'text-muted' : 'text-brand-600')}>−{value}</div>
          <div className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">{c.type === 'percent' ? t('typePercent') : t('typeFixed')}</div>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative mx-5 border-t-2 border-dashed border-line" aria-hidden>
        <span className="absolute -left-[29px] -top-[11px] h-5 w-5 rounded-full border border-line/80 bg-canvas [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute -right-[29px] -top-[11px] h-5 w-5 rounded-full border border-line/80 bg-canvas [clip-path:inset(0_50%_0_0)]" />
      </div>

      {/* Terms */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-5 py-4">
        <Term label={t('minOrder')}>{c.minTotal ? money(c.minTotal, lang, { decimals: c.minTotal % 1 !== 0 }) : <span className="font-medium text-muted">{t('noMin')}</span>}</Term>
        <Term label={t('uses')}>{t('usesN', { n: c.uses })}</Term>
        <Term label={t('validUntil')}>
          {!c.expiresAt ? (
            <span className="font-medium text-muted">{t('noExpiry')}</span>
          ) : expired ? (
            <span className="text-red-700">{t('expiredOn', { date: date(c.expiresAt, lang) })}</span>
          ) : (
            <>
              {date(c.expiresAt, lang)}
              {daysLeft !== null && daysLeft <= 30 && <span className="ml-1.5 text-xs font-semibold text-amber-700">· {daysLeft <= 1 ? t('dayLeft') : t('daysLeft', { n: daysLeft })}</span>}
            </>
          )}
        </Term>
        <Term label={t('savings')}>
          {usage ? (
            <>
              {money(usage.discount, lang)}
              <span className="ml-1.5 text-xs font-medium text-muted">{t('inOrders', { n: usage.orders })}</span>
            </>
          ) : (
            <span className="font-medium text-muted">{t('noOrders')}</span>
          )}
        </Term>
      </dl>

      {/* Footer */}
      <footer className="mt-auto flex items-center justify-between gap-3 rounded-b-2xl border-t border-line/70 bg-canvas/40 px-5 py-3">
        <Badge tone={tone} dot>
          {t(`st_${status}`)}
        </Badge>
        <div className="flex items-center gap-1">
          <span className="mr-2 flex items-center" title={c.active ? ta('active') : ta('inactive')}>
            <Switch size="sm" checked={c.active} onChange={onToggle} />
          </span>
          <IconBtn icon={<Pencil className="h-4 w-4" />} label={ta('edit')} onClick={onEdit} />
          <IconBtn icon={<Trash2 className="h-4 w-4" />} label={ta('delete')} danger onClick={onDelete} />
        </div>
      </footer>
    </article>
  );
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-ink">{children}</dd>
    </div>
  );
}
