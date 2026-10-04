import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Banknote, CalendarCheck, Clock, Hammer, MapPin, Ruler, ShieldCheck, Store, Truck, Wrench } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { Img, Tabs } from '@/components/ui/misc';
import { useDict, useL, useLang } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { money, num, unitLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { common } from '@/i18n/common';
import { PD } from './dict';

type Tab = 'desc' | 'specs' | 'shipping';

export function DetailTabs({ product, category }: { product: Product; category?: Category }) {
  const t = useDict(PD);
  const [tab, setTab] = useState<Tab>('desc');
  return (
    <section id="detalji" className="scroll-mt-28">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        className="gap-4 sm:gap-8"
        tabs={[
          { id: 'desc', label: <span className="text-[15px] sm:text-base">{t('tab_desc')}</span> },
          { id: 'specs', label: <span className="text-[15px] sm:text-base">{t('tab_specs')}</span> },
          { id: 'shipping', label: <span className="text-[15px] sm:text-base">{t('tab_shipping')}</span> },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="pt-8 sm:pt-10">
          {tab === 'desc' && <Description product={product} />}
          {tab === 'specs' && <Specs product={product} category={category} />}
          {tab === 'shipping' && <Shipping product={product} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
function Description({ product: p }: { product: Product }) {
  const t = useDict(PD);
  const tc = useDict(common);
  const l = useL();
  const lang = useLang();
  const facts = [
    p.warrantyYears ? { icon: ShieldCheck, label: t('spec_warranty'), value: t('years', { n: p.warrantyYears }) } : null,
    p.leadDays ? { icon: Clock, label: t('spec_lead'), value: t('daysApprox', { n: p.leadDays }) } : null,
    p.installation?.available
      ? { icon: Wrench, label: t('installation'), value: `${money(p.installation.price, lang, { decimals: p.installation.price % 1 !== 0 })} / ${unitLabel(p.unit === 'm2' ? 'm2' : p.unit, lang)}` }
      : p.quoteOnly
        ? { icon: Ruler, label: t('trust_measure'), value: tc('free') }
        : null,
    p.unit === 'm2' && p.packSize ? { icon: Hammer, label: t('spec_unit'), value: t('unit_m2', { size: num(p.packSize, lang) }) } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];
  const paragraphs = l(p.description).split(/\n{2,}/).filter(Boolean);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <p className="display text-[26px] leading-[1.25] text-ink sm:text-[30px]">{l(p.short)}</p>
        <div className="mt-6 space-y-4 text-[16px] leading-[1.75] text-ink-soft">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {p.specs.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {p.specs.slice(0, 4).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[13px]">
                <span className="text-muted">{l(s.label)}</span>
                <span className="font-semibold text-ink">{l(s.value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="lg:col-span-5">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {p.images[1] && (
            <div className="aspect-[16/10] overflow-hidden bg-sand">
              <Img src={p.images[1]} small alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('highlights')}</div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
              {facts.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-ink">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[12px] text-muted">{f.label}</dt>
                      <dd className="text-[14px] font-bold text-ink">{f.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Specs({ product: p, category }: { product: Product; category?: Category }) {
  const t = useDict(PD);
  const l = useL();
  const lang = useLang();
  const hasWarranty = p.specs.some((s) => /garanc|warrant/i.test(s.label.me + s.label.en));
  const unitText =
    p.unit === 'm2' && p.packSize ? t('unit_m2', { size: num(p.packSize, lang) }) : p.unit === 'm' ? t('unit_m') : p.unit === 'set' ? t('unit_set') : t('unit_kom');
  const rows: [string, string][] = [
    ...p.specs.map((s) => [l(s.label), l(s.value)] as [string, string]),
    ...(!hasWarranty && p.warrantyYears ? [[t('spec_warranty'), t('years', { n: p.warrantyYears })] as [string, string]] : []),
    ...(p.leadDays ? [[t('spec_lead'), t('daysApprox', { n: p.leadDays })] as [string, string]] : []),
    [t('spec_unit'), unitText],
    ...(category ? [[t('spec_category'), l(category.name)] as [string, string]] : []),
    [t('spec_sku'), p.sku],
  ];
  return (
    <div className="max-w-3xl">
      <dl className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {rows.map(([k, v], i) => (
          <div key={i} className={cn('grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-4 text-[14.5px] sm:px-7', i % 2 === 1 && 'bg-paper/60', i > 0 && 'border-t border-line/70')}>
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Shipping({ product: p }: { product: Product }) {
  const t = useDict(PD);
  const lang = useLang();
  const settings = useSettings();
  const steps = [t('installHow1'), t('installHow2'), t('installHow3')];
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
          <Truck className="h-5 w-5 text-brand-600" /> {t('zonesTitle')}
        </h3>
        <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {settings.shippingZones.map((z, i) => (
            <div key={z.id} className={cn('flex items-start justify-between gap-4 px-5 py-4 sm:px-6', i > 0 && 'border-t border-line/70')}>
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold text-ink">{z.name}</div>
                <div className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">{z.cities.join(', ')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] font-bold tabular-nums text-ink">{money(z.fee, lang, { decimals: z.fee % 1 !== 0 })}</div>
                <div className="mt-0.5 text-[12px] text-muted">{t('daysValue', { days: z.days })}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-600/15">
          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <div className="text-[14px] font-bold text-emerald-900">{t('freeOver', { amount: money(settings.freeShippingThreshold, lang, { decimals: false }) })}</div>
            <p className="mt-0.5 text-[13px] leading-snug text-emerald-800/80">{t('freeOverText')}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <div>
              <div className="text-[14px] font-bold text-ink">{t('pickup')}</div>
              <p className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug text-muted">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                {t('pickupText', { address: settings.pickupAddress })}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <div>
              <div className="text-[14px] font-bold text-ink">{t('payTitle')}</div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t('payText')}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
          <Wrench className="h-5 w-5 text-brand-600" /> {t('installHowTitle')}
        </h3>
        <div className="mt-4 rounded-3xl bg-ink p-6 text-paper sm:p-7">
          <ol className="space-y-5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-brand-200">{i + 1}</span>
                <span className="pt-2 text-[15px] font-semibold leading-snug">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-relaxed text-paper/75">
            {p.quoteOnly ? (
              t('installIncluded')
            ) : p.installation?.available ? (
              <>
                <span className="font-bold text-white">
                  {t('installPrice', { price: money(p.installation.price, lang, { decimals: p.installation.price % 1 !== 0 }), unit: unitLabel(p.unit === 'm2' ? 'm2' : p.unit, lang) })}
                </span>
                <span className="mt-1 block">{t('installFree')}.</span>
              </>
            ) : (
              t('installNone')
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
