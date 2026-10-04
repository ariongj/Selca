import { useState, type Ref } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Banknote, Check, Clock, Heart, Phone, Ruler, Share2, ShieldCheck, ShoppingBag, Truck, Wrench, FileText, CreditCard } from 'lucide-react';
import type { Category } from '@/lib/types';
import { WhatsAppIcon } from '@/components/brand/Social';
import { ProductBadges } from '@/site/components/ProductCard';
import { Price } from '@/site/components/Price';
import { useDict, useL, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useSettings } from '@/store/hooks';
import { basePrice } from '@/lib/pricing';
import { money, num, perUnit, unitLabel } from '@/lib/format';
import { cn, round2 } from '@/lib/utils';
import { PD, eur, packWord } from './dict';
import { OptionPicker } from './OptionPicker';
import { QuantityPicker } from './QuantityPicker';
import { useTweenedNumber, type Configurator } from './useConfigurator';

export function BuyBox({ cfg, category, onAdd, onQuote, ctaRef }: { cfg: Configurator; category?: Category; onAdd: () => void; onQuote: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const l = useL();
  const p = cfg.product;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: l(p.name), url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      }
    } catch {
      /* dismissed or blocked — nothing to do */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        {category ? (
          <Link to={`/proizvodi/${category.slug}`} className="eyebrow hover:text-brand-800">
            {l(category.name)}
          </Link>
        ) : (
          <span />
        )}
        <button type="button" onClick={share} className="-mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
          <Share2 className="h-3.5 w-3.5" /> {t('share')}
        </button>
      </div>
      <h1 className="display mt-3 text-[34px] leading-[1.04] text-ink sm:text-[42px] xl:text-[46px]">{l(p.name)}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ProductBadges product={p} />
        <span className="text-[12.5px] font-medium text-muted">
          {t('sku')}: <span className="font-semibold tabular-nums text-ink-soft">{p.sku}</span>
        </span>
      </div>

      <PriceBlock cfg={cfg} />

      {l(p.short) && <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">{l(p.short)}</p>}
      <StockLine cfg={cfg} />

      <div className="my-7 h-px bg-line" />

      {p.quoteOnly ? (
        <QuotePanel cfg={cfg} onQuote={onQuote} ctaRef={ctaRef} />
      ) : (
        <div className="space-y-6">
          <OptionPicker options={p.options} value={cfg.options} onChange={cfg.setOption} />
          <QuantityPicker cfg={cfg} />
          {cfg.canInstall && <InstallationCard cfg={cfg} />}
          <Summary cfg={cfg} onAdd={onAdd} ctaRef={ctaRef} />
        </div>
      )}

      <HelpLine />
      <TrustRow warrantyYears={p.warrantyYears} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
function PriceBlock({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const price = useTweenedNumber(cfg.unitPrice, 0.45);
  const sale = cfg.regularUnitPrice > cfg.unitPrice;
  const perPack = p.unit === 'm2' && p.packSize ? round2(cfg.unitPrice * p.packSize) : 0;

  if (p.quoteOnly) {
    return (
      <div className="mt-6">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-oak">{t('quoteOnly')}</div>
        <Price product={p} size="xl" className="mt-2" />
        <div className="mt-2 text-[12.5px] text-muted">{t('vatIncl')}</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={cn('text-[34px] font-bold leading-none tracking-tight tabular-nums', sale ? 'text-brand-700' : 'text-ink')}>{eur(price, lang, cfg.unitPrice)}</span>
        {p.unit !== 'kom' && p.unit !== 'set' && <span className="text-[14px] font-medium text-muted">{perUnit(p.unit, lang)}</span>}
        {sale && <span className="text-[15px] font-medium text-muted line-through tabular-nums">{money(cfg.regularUnitPrice, lang, { decimals: cfg.regularUnitPrice % 1 !== 0 })}</span>}
        {sale && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-bold text-brand-700">
            {t('save', { amount: money(round2(cfg.regularUnitPrice - cfg.unitPrice), lang) })}
            {p.unit === 'm2' ? ` ${perUnit('m2', lang)}` : ''}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-1.5 text-[12.5px] text-muted">
        <span>{t('vatIncl')}</span>
        {perPack > 0 && (
          <span>
            · {t('perPack', { price: money(perPack, lang), size: num(p.packSize!, lang) })}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function StockLine({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const p = cfg.product;
  const days = p.leadDays ?? 0;
  const toOrder = p.stock >= 999 || p.stock <= 0;
  const low = !toOrder && p.stock <= 5;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] font-semibold">
      {toOrder ? (
        <span className="inline-flex items-center gap-2 text-oak">
          <Clock className="h-4 w-4" />
          {t('madeToOrder', { days })}
        </span>
      ) : (
        <>
          <span className={cn('inline-flex items-center gap-2', low ? 'text-amber-700' : 'text-emerald-700')}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', low ? 'bg-amber-400' : 'bg-emerald-400')} />
              <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', low ? 'bg-amber-500' : 'bg-emerald-500')} />
            </span>
            {low ? t('lowStock', { n: p.stock }) : t('inStock')}
          </span>
          {days > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-muted">
              <Truck className="h-4 w-4" />
              {t('delivery', { days })}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function InstallationCard({ cfg }: { cfg: Configurator }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const price = p.installation!.price;
  const on = cfg.installation;
  return (
    <label
      className={cn(
        'relative flex cursor-pointer gap-3.5 rounded-2xl border p-4 transition-all duration-300 select-none sm:p-5',
        on ? 'border-brand-600 bg-brand-50/70 shadow-[0_0_0_1px_var(--color-brand-600)]' : 'border-line bg-white hover:border-ink/25',
      )}
    >
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => cfg.setInstallation(e.target.checked)} />
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand-600/20',
          on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/25 bg-white',
        )}
      >
        <Check className={cn('h-3.5 w-3.5 transition-transform', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
            <Wrench className="h-4 w-4 text-brand-600" />
            {t('installTitle')}
          </span>
          <span className="text-[13.5px] font-semibold tabular-nums text-ink">
            +{money(price, lang, { decimals: price % 1 !== 0 })} <span className="font-medium text-muted">/ {unitLabel(p.unit === 'm2' ? 'm2' : p.unit, lang)}</span>
          </span>
        </span>
        <span className="mt-1.5 block text-[13px] leading-snug text-muted">{t('installText')}</span>
        <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            <Truck className="h-3.5 w-3.5" /> {t('installFree')}
          </span>
          <AnimatePresence>
            {on && (
              <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="text-[13.5px] font-bold tabular-nums text-brand-700">
                {p.unit === 'm2' ? `${num(cfg.units, lang)} m² · ` : cfg.qty > 1 ? `${cfg.qty} × ` : ''}+{eur(cfg.installationTotal, lang)}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
function Summary({ cfg, onAdd, ctaRef }: { cfg: Configurator; onAdd: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const lang = useLang();
  const p = cfg.product;
  const total = useTweenedNumber(cfg.total);
  const [justAdded, setJustAdded] = useState(false);

  const qtyText =
    p.unit === 'm2' && p.packSize
      ? `${cfg.qty} ${packWord(cfg.qty, lang, t('pack_one'), t('pack_many'))} · ${num(cfg.units, lang)} m² × ${eur(cfg.unitPrice, lang)}`
      : `${num(cfg.qty, lang)} ${unitLabel(p.unit, lang)} × ${eur(cfg.unitPrice, lang)}`;

  const add = () => {
    onAdd();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-30px_rgba(28,26,23,0.55)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-paper/55">{t('total')}</div>
          <div className="mt-1.5 text-[13px] leading-snug text-paper/70">
            <div className="tabular-nums">{qtyText}</div>
            <AnimatePresence initial={false}>
              {cfg.installation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden tabular-nums">
                  + {t('installation')} {eur(cfg.installationTotal, lang)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="shrink-0 text-right text-[30px] font-bold leading-none tracking-tight tabular-nums sm:text-[34px]">{eur(total, lang, cfg.total)}</div>
      </div>
      <div ref={ctaRef} className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={add}
          className="relative inline-flex h-14 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-brand-600 px-6 text-[15.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background,transform] duration-200 hover:bg-brand-500 active:scale-[0.98]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span key="ok" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="inline-flex items-center gap-2.5">
                <Check className="h-5 w-5" strokeWidth={2.6} /> {t('addedShort')}
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="inline-flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5" /> {t('addToCart')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <WishButton productId={p.id} />
      </div>
    </div>
  );
}

export function WishButton({ productId, tone = 'dark', className }: { productId: string; tone?: 'dark' | 'light'; className?: string }) {
  const t = useDict(PD);
  const wish = useUi((s) => s.wishlist.includes(productId));
  const toggle = useUi((s) => s.toggleWishlist);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(productId);
        toast(wish ? t('wishRemoved') : t('wishAdded'), { icon: <Heart className="h-4 w-4 fill-brand-600 text-brand-600" /> });
      }}
      aria-pressed={wish}
      aria-label={wish ? t('wishRemove') : t('wishAdd')}
      title={wish ? t('wishRemove') : t('wishAdd')}
      className={cn(
        'grid h-14 w-14 shrink-0 place-items-center rounded-full transition-all duration-200 active:scale-95',
        tone === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'border border-line bg-white text-ink hover:border-ink/30',
        wish && (tone === 'dark' ? 'bg-white text-brand-600 hover:bg-white' : 'border-brand-200 bg-brand-50 text-brand-600'),
        className,
      )}
    >
      <motion.span key={String(wish)} initial={{ scale: wish ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
        <Heart className={cn('h-5 w-5', wish && 'fill-current')} />
      </motion.span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
function QuotePanel({ cfg, onQuote, ctaRef }: { cfg: Configurator; onQuote: () => void; ctaRef?: Ref<HTMLDivElement> }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const p = cfg.product;
  const steps = [t('quoteStep1'), t('quoteStep2'), t('quoteStep3')];
  return (
    <div className="space-y-6">
      <OptionPicker options={p.options} value={cfg.options} onChange={cfg.setOption} />
      <div className="rounded-3xl bg-ink p-5 text-paper shadow-[0_30px_60px_-30px_rgba(28,26,23,0.55)] sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-200">{t('quoteFrom', { price: money(basePrice(p), lang, { decimals: false }) })}</div>
        <p className="mt-2.5 text-[14px] leading-relaxed text-paper/75">{t('quoteLead')}</p>
        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-[14px] font-semibold">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-bold tabular-nums text-brand-200">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div ref={ctaRef} className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onQuote}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-brand-600 px-6 text-[15.5px] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] transition-[background,transform] duration-200 hover:bg-brand-500 active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" /> {t('quoteTitle')}
          </button>
          <WishButton productId={p.id} />
        </div>
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 text-[14px] font-semibold text-paper/90 transition-colors hover:bg-white/10">
          <Phone className="h-4 w-4" /> {settings.phone}
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function HelpLine() {
  const t = useDict(PD);
  const settings = useSettings();
  const wa = settings.whatsapp?.replace(/[^\d]/g, '');
  return (
    <div className="mt-5 flex items-center justify-between gap-3 px-1">
      <span className="min-w-0 text-[13px] leading-snug">
        <span className="block font-bold text-ink">{t('help')}</span>
        <span className="block text-muted">{t('helpText')}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-[13px]">
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 font-semibold text-ink transition-colors hover:border-ink/30">
          <Phone className="h-3.5 w-3.5" /> {settings.phone}
        </a>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-white transition-transform hover:scale-105">
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
        )}
      </span>
    </div>
  );
}

function TrustRow({ warrantyYears }: { warrantyYears?: number }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const items = [
    { icon: Ruler, title: t('trust_measure'), text: t('trust_measureText'), to: '/#mjerenje' },
    warrantyYears
      ? { icon: ShieldCheck, title: t('trust_warranty', { n: warrantyYears }), text: t('trust_warrantyText') }
      : { icon: ShieldCheck, title: t('trust_bank'), text: t('trust_bankText') },
    { icon: Truck, title: t('trust_delivery'), text: t('trust_deliveryText', { amount: money(settings.freeShippingThreshold, lang, { decimals: false }) }) },
    settings.payments.cod ? { icon: Banknote, title: t('trust_cod'), text: t('trust_codText') } : { icon: CreditCard, title: t('trust_bank'), text: t('trust_bankText') },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
      {items.map((it, i) => {
        const Icon = it.icon;
        const inner = (
          <>
            <Icon className="h-5 w-5 shrink-0 text-brand-600" />
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight text-ink">{it.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{it.text}</span>
            </span>
          </>
        );
        const cls = 'flex items-start gap-3 bg-white p-3.5 sm:p-4';
        return 'to' in it && it.to ? (
          <Link key={i} to={it.to} className={cn(cls, 'transition-colors hover:bg-paper')}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
