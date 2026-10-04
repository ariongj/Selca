import { useMemo, useState } from 'react';
import { AtSign, Banknote, Building2, CreditCard, ExternalLink, Landmark, Mail, MapPin, MessageCircle, Phone, Plus, Trash2, TriangleAlert, Truck } from 'lucide-react';
import { L10nInput } from '@/admin/components/L10nInput';
import { Button } from '@/components/ui/Button';
import { FacebookIcon } from '@/components/brand/Social';
import { useDict, useLang } from '@/i18n';
import { money } from '@/lib/format';
import type { ShippingZone } from '@/lib/types';
import { cn, uid } from '@/lib/utils';
import { T } from './i18n';
import { Group, IconBtn, ListField, NumberField, SectionCard, TextField, ToggleRow, type SectionProps } from './fields';

/* ------------------------------------------------------------------ */
/* Kompanija                                                           */
/* ------------------------------------------------------------------ */
export function CompanySection({ s, set, errors }: SectionProps) {
  const t = useDict(T, 'admin');
  return (
    <SectionCard id="company" icon={Building2} title={t('s_company')} description={t('s_company_d')}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <TextField label={t('companyName')} value={s.companyName} onChange={(v) => set('companyName', v)} error={errors.companyName} />
        <TextField label={t('legalName')} value={s.legalName} onChange={(v) => set('legalName', v)} hint={t('legalName_h')} />
        <L10nInput className="sm:col-span-2" label={t('tagline')} value={s.tagline} onChange={(v) => set('tagline', v)} />
        <L10nInput className="sm:col-span-2" label={t('about')} value={s.about} onChange={(v) => set('about', v)} multiline rows={4} hint={t('about_h')} />
      </div>
      <Group title={t('taxGroup')} className="mt-8">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField label={t('pib')} value={s.pib} onChange={(v) => set('pib', v)} example inputClassName="font-mono text-[13.5px] tracking-wide" />
          <TextField label={t('pdv')} value={s.pdv} onChange={(v) => set('pdv', v)} example inputClassName="font-mono text-[13.5px] tracking-wide" />
        </div>
      </Group>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Kontakt                                                             */
/* ------------------------------------------------------------------ */
const ico = 'h-4 w-4';

export function ContactSection({ s, set, errors }: SectionProps) {
  const t = useDict(T, 'admin');
  const mapOk = /^https?:\/\/\S+$/.test(s.mapUrl.trim());
  return (
    <SectionCard id="contact" icon={Phone} title={t('s_contact')} description={t('s_contact_d')}>
      <Group title={t('reachGroup')}>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField label={t('email')} type="email" value={s.email} onChange={(v) => set('email', v)} leading={<Mail className={ico} />} error={errors.email} />
          <TextField label={t('phone')} type="tel" value={s.phone} onChange={(v) => set('phone', v)} leading={<Phone className={ico} />} example />
          <TextField label={t('phone2')} type="tel" optional value={s.phone2 ?? ''} onChange={(v) => set('phone2', v)} leading={<Phone className={ico} />} example placeholder="+382 …" />
          <TextField label={t('whatsapp')} type="tel" optional value={s.whatsapp ?? ''} onChange={(v) => set('whatsapp', v)} leading={<MessageCircle className={ico} />} example placeholder="+382 …" />
        </div>
      </Group>

      <Group title={t('locationGroup')} className="mt-8">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <TextField label={t('address')} value={s.address} onChange={(v) => set('address', v)} leading={<MapPin className={ico} />} example />
          <TextField label={t('city')} value={s.city} onChange={(v) => set('city', v)} example />
          <TextField
            className="sm:col-span-2"
            label={t('mapUrl')}
            hint={t('mapUrl_h')}
            value={s.mapUrl}
            onChange={(v) => set('mapUrl', v)}
            leading={<MapPin className={ico} />}
            placeholder="https://maps.google.com/…"
            inputClassName="pr-24"
            trailing={
              mapOk ? (
                <a href={s.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-ink-soft hover:bg-canvas hover:text-ink">
                  {t('openMap')} <ExternalLink className="h-3 w-3" />
                </a>
              ) : null
            }
          />
          <L10nInput className="sm:col-span-2" label={t('hours')} value={s.hours} onChange={(v) => set('hours', v)} />
        </div>
      </Group>

      <Group title={t('socialGroup')} className="mt-8">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField
            label={t('instagram')}
            hint={t('instagram_h')}
            value={s.instagram}
            onChange={(v) => set('instagram', v.replace(/^@+/, '').trim())}
            leading={<AtSign className={ico} />}
            placeholder="selca_doo"
          />
          <TextField
            label={t('facebook')}
            optional
            value={s.facebook ?? ''}
            onChange={(v) => set('facebook', v)}
            leading={<FacebookIcon className={ico} />}
            placeholder="https://facebook.com/…"
          />
        </div>
      </Group>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Prodaja i dostava                                                   */
/* ------------------------------------------------------------------ */
export function SalesSection({ s, set, errors }: SectionProps) {
  const t = useDict(T, 'admin');
  const lang = useLang('admin');
  const zones = s.shippingZones;
  const [focusId, setFocusId] = useState<string | null>(null);

  const patchZone = (id: string, patch: Partial<ShippingZone>) => set('shippingZones', zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const addZone = () => {
    const z: ShippingZone = { id: uid('z'), name: '', cities: [], fee: 15, days: '2–3' };
    setFocusId(z.id);
    set('shippingZones', [...zones, z]);
  };
  const removeZone = (id: string) => set('shippingZones', zones.filter((z) => z.id !== id));

  // A city listed in two zones is ambiguous — the storefront uses the first match.
  const duplicates = useMemo(() => {
    const seen = new Map<string, string>();
    const dup = new Set<string>();
    for (const z of zones)
      for (const c of z.cities) {
        const k = c.toLowerCase();
        if (seen.has(k)) dup.add(seen.get(k)!);
        else seen.set(k, c);
      }
    return [...dup];
  }, [zones]);

  return (
    <SectionCard id="sales" icon={Truck} title={t('s_sales')} description={t('s_sales_d')}>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <NumberField label={t('vatRate')} hint={t('vatRate_h')} value={s.vatRate} onChange={(n) => set('vatRate', n)} trailing="%" error={errors.vatRate} />
        <NumberField label={t('freeShip')} hint={t('freeShip_h')} value={s.freeShippingThreshold} onChange={(n) => set('freeShippingThreshold', n)} trailing="€" error={errors.freeShippingThreshold} />
        <TextField className="sm:col-span-2" label={t('pickup')} value={s.pickupAddress} onChange={(v) => set('pickupAddress', v)} leading={<MapPin className={ico} />} example />
      </div>

      <Group title={t('zones')} hint={t('zones_d')} className="mt-8">
        {zones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{t('noZones')}</div>
        ) : (
          <ol className="space-y-3">
            {zones.map((z, i) => (
              <li key={z.id} className="rounded-xl border border-line bg-canvas/40 p-4">
                <div className="mb-3.5 flex items-center gap-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-bold text-paper">{i + 1}</span>
                  <span className={cn('min-w-0 flex-1 truncate text-[14px] font-semibold', z.name.trim() ? 'text-ink' : 'text-muted')}>{z.name.trim() || t('newZone')}</span>
                  <span className="hidden shrink-0 text-[12.5px] tabular-nums text-muted sm:inline">
                    {money(z.fee, lang)} · {z.days} {t('days')}
                  </span>
                  <IconBtn label={t('removeZone')} danger onClick={() => removeZone(z.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[minmax(0,1fr)_120px_130px]">
                  <TextField
                    className="col-span-2 sm:col-span-1"
                    label={t('zoneName')}
                    value={z.name}
                    onChange={(v) => patchZone(z.id, { name: v })}
                    placeholder={t('newZone')}
                    error={errors[`zone_${z.id}`]}
                    autoFocus={focusId === z.id}
                  />
                  <NumberField label={t('zoneFee')} value={z.fee} onChange={(n) => patchZone(z.id, { fee: n })} trailing="€" />
                  <TextField label={t('zoneDays')} value={z.days} onChange={(v) => patchZone(z.id, { days: v })} placeholder="1–2" />
                  <ListField
                    className="col-span-2 sm:col-span-3"
                    label={t('zoneCities')}
                    labelAside={<span className="text-[11.5px] font-medium tabular-nums text-muted">{t('zoneCitiesCount', { n: z.cities.length })}</span>}
                    value={z.cities}
                    onChange={(v) => patchZone(z.id, { cities: v })}
                    rows={2}
                    placeholder="Podgorica, Danilovgrad, …"
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
        {duplicates.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/15">
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
            {duplicates.map((c) => t('duplicateCity', { city: c })).join(' ')}
          </p>
        )}
        <Button variant="outline" size="sm" shape="rounded" className="mt-3" icon={<Plus className="h-4 w-4" />} onClick={addZone}>
          {t('addZone')}
        </Button>
      </Group>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Plaćanje                                                            */
/* ------------------------------------------------------------------ */
export function PaymentsSection({ s, set }: SectionProps) {
  const t = useDict(T, 'admin');
  const p = s.payments;
  const enabled = [p.cod, p.bank, p.card].filter(Boolean).length;
  const rows = [
    { key: 'cod' as const, icon: <Banknote className="h-[18px] w-[18px]" />, title: t('cod'), desc: t('cod_d') },
    { key: 'bank' as const, icon: <Landmark className="h-[18px] w-[18px]" />, title: t('bank'), desc: t('bank_d') },
    { key: 'card' as const, icon: <CreditCard className="h-[18px] w-[18px]" />, title: t('card'), desc: t('card_d') },
  ];
  return (
    <SectionCard id="payments" icon={CreditCard} title={t('s_payments')} description={t('s_payments_d')}>
      <div className="divide-y divide-line/70">
        {rows.map((r) => (
          <ToggleRow
            key={r.key}
            icon={r.icon}
            title={r.title}
            description={r.desc}
            checked={p[r.key]}
            disabled={p[r.key] && enabled === 1}
            onChange={(v) => set('payments', { ...p, [r.key]: v })}
          />
        ))}
      </div>
      {enabled === 1 && <p className="mt-3 text-[12.5px] text-muted">{t('lastPayment')}</p>}

      <Group title={t('bankGroup')} hint={t('bankGroup_h')} className={cn('mt-8 transition-opacity', !p.bank && 'opacity-60')}>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <TextField label={t('bankName')} value={s.bankName} onChange={(v) => set('bankName', v)} leading={<Landmark className={ico} />} />
          <TextField label={t('bankAccount')} value={s.bankAccount} onChange={(v) => set('bankAccount', v)} example inputClassName="font-mono text-[13.5px] tracking-wide" />
        </div>
      </Group>
    </SectionCard>
  );
}
