import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Building2, ChevronRight, Globe2, Mail, MapPin, Phone, Repeat2, Sparkles } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Badge } from '@/components/ui/misc';
import { OrderStatusBadge } from '@/admin/components/kit';
import { defineDict, LANGS, useDict, useLang } from '@/i18n';
import { date, money, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Avatar, ContactAction, crm, mailHref, pluralForm, telHref } from './shared';
import type { CustomerRow } from './customers';

const T = defineDict({
  me: {
    customer: 'Profil kupca',
    since: 'Kupac od {date}',
    repeat: 'Stalni kupac',
    top: 'Top kupac',
    contact: 'Kontakt podaci',
    company: 'Firma',
    pib: 'PIB',
    language: 'Jezik',
    orders: 'Narudžbe',
    spent: 'Ukupno potrošeno',
    avg: 'Prosječna narudžba',
    lastOrder: 'Posljednja narudžba',
    history: 'Istorija narudžbi',
    items_one: '{n} stavka',
    items_few: '{n} stavke',
    items_many: '{n} stavki',
    cancelledNote: 'Otkazane narudžbe ({n}) nisu uračunate u potrošnju.',
    mailSubject: 'SELCA COMPANY — vaša narudžba',
  },
  sq: {
    customer: 'Profili i klientit',
    since: 'Klient që nga {date}',
    repeat: 'Klient i rregullt',
    top: 'Klient kryesor',
    contact: 'Të dhënat e kontaktit',
    company: 'Kompania',
    pib: 'NIPT',
    language: 'Gjuha',
    orders: 'Porositë',
    spent: 'Shpenzuar gjithsej',
    avg: 'Porosia mesatare',
    lastOrder: 'Porosia e fundit',
    history: 'Historiku i porosive',
    items_one: '{n} artikull',
    items_few: '{n} artikuj',
    items_many: '{n} artikuj',
    cancelledNote: 'Porositë e anuluara ({n}) nuk llogariten në shpenzime.',
    mailSubject: 'SELCA COMPANY — porosia juaj',
  },
  en: {
    customer: 'Customer profile',
    since: 'Customer since {date}',
    repeat: 'Repeat customer',
    top: 'Top customer',
    contact: 'Contact details',
    company: 'Company',
    pib: 'Tax ID',
    language: 'Language',
    orders: 'Orders',
    spent: 'Total spent',
    avg: 'Average order',
    lastOrder: 'Last order',
    history: 'Order history',
    items_one: '{n} item',
    items_few: '{n} items',
    items_many: '{n} items',
    cancelledNote: 'Cancelled orders ({n}) are not counted towards spend.',
    mailSubject: 'SELCA COMPANY — your order',
  },
});

function Row({ icon, label, children }: { icon: ReactNode; label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</div>
        <div className="truncate text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-line/80 bg-white px-4 py-3', className)}>
      <div className="truncate text-[12px] font-semibold text-muted">{label}</div>
      <div className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-ink tabular-nums">{value}</div>
    </div>
  );
}

export function CustomerDrawer({ customer, open, onClose, isTop }: { customer: CustomerRow | null | undefined; open: boolean; onClose: () => void; isTop?: boolean }) {
  const t = useDict(T, 'admin');
  const tc = useDict(crm, 'admin');
  const lang = useLang('admin');
  const c = customer;
  const validCount = c ? c.count - c.cancelled : 0;

  return (
    <Drawer
      open={open && !!c}
      onClose={onClose}
      width="max-w-[520px]"
      title={<span className="text-[15px] font-bold text-ink">{t('customer')}</span>}
      footer={
        c && (
          <div className="grid grid-cols-2 gap-2">
            <ContactAction href={telHref(c.phone)} icon={<Phone className="h-4 w-4" />} variant="primary" disabled={!c.phone}>
              {tc('call')}
            </ContactAction>
            <ContactAction href={mailHref(c.email, t('mailSubject'))} icon={<Mail className="h-4 w-4" />} disabled={!c.email}>
              {tc('sendEmail')}
            </ContactAction>
          </div>
        )
      }
    >
      {c && (
        <div className="space-y-6 px-5 py-6 sm:px-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <Avatar name={c.name} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-ink">{c.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                <MapPin className="h-3.5 w-3.5" /> {c.city} · {t('since', { date: date(c.first, lang) })}
              </p>
              {(c.count > 1 || isTop) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {isTop && (
                    <Badge tone="amber">
                      <Sparkles className="h-3 w-3" /> {t('top')}
                    </Badge>
                  )}
                  {c.count > 1 && (
                    <Badge tone="green">
                      <Repeat2 className="h-3 w-3" /> {t('repeat')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2 rounded-xl bg-ink px-4 py-3.5 text-paper">
              <div className="text-[12px] font-semibold text-paper/60">{t('spent')}</div>
              <div className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight tabular-nums">{money(c.spent, lang)}</div>
            </div>
            <Stat label={t('orders')} value={c.count} />
            <Stat label={t('avg')} value={money(validCount ? c.spent / validCount : 0, lang)} />
          </div>

          {/* Contact */}
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{t('contact')}</h3>
            <div className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-white">
              <Row icon={<Phone className="h-4 w-4" />} label={tc('phone')}>
                {c.phone ? (
                  <a href={telHref(c.phone)} className="link-u hover:text-brand-700">
                    {c.phone}
                  </a>
                ) : (
                  '—'
                )}
              </Row>
              <Row icon={<Mail className="h-4 w-4" />} label={tc('email')}>
                {c.email ? (
                  <a href={mailHref(c.email)} className="link-u hover:text-brand-700">
                    {c.email}
                  </a>
                ) : (
                  tc('noEmail')
                )}
              </Row>
              <Row icon={<MapPin className="h-4 w-4" />} label={tc('address')}>
                {[c.address, c.city].filter(Boolean).join(', ')}
              </Row>
              {(c.company || c.pib) && (
                <Row icon={<Building2 className="h-4 w-4" />} label={t('company')}>
                  {c.company}
                  {c.pib && <span className="text-muted"> · {t('pib')} {c.pib}</span>}
                </Row>
              )}
              <Row icon={<Globe2 className="h-4 w-4" />} label={t('language')}>
                {LANGS.find((l) => l.code === c.lang)?.label ?? c.lang}
              </Row>
            </div>
          </section>

          {/* Orders */}
          <section>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{t('history')}</h3>
              <span className="text-[12px] text-muted">
                {t('lastOrder')}: {timeAgo(c.last, lang)}
              </span>
            </div>
            <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-white">
              {c.orders.map((o) => {
                const lines = o.items.length;
                const cancelled = o.status === 'cancelled';
                return (
                  <li key={o.id}>
                    <Link to={`/admin/narudzbe/${o.id}`} onClick={onClose} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/70">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink">{o.number}</span>
                          <OrderStatusBadge status={o.status} />
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-muted">
                          {date(o.createdAt, lang)} · {t(`items_${pluralForm(lines, lang)}`, { n: lines })}
                        </div>
                      </div>
                      <span className={cn('text-sm font-bold tabular-nums', cancelled ? 'text-muted line-through' : 'text-ink')}>{money(o.total, lang)}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted/60 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {c.cancelled > 0 && <p className="mt-2 text-[12px] text-muted">{t('cancelledNote', { n: c.cancelled })}</p>}
          </section>
        </div>
      )}
    </Drawer>
  );
}
