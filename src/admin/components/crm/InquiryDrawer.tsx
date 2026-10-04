import { useState, type ComponentType, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CalendarCheck2, CalendarClock, CheckCircle2, Clock, ExternalLink, Mail, MapPin, MessageSquareText, Phone, PhoneCall, StickyNote, Trash2, Wrench } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { WhatsAppIcon } from '@/components/brand/Social';
import { InquiryStatusBadge, Thumb, confirmDialog } from '@/admin/components/kit';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { basePrice } from '@/lib/pricing';
import { date, dateTime, money, perUnit } from '@/lib/format';
import type { Inquiry, InquiryStatus, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ContactAction, InquiryTypeIcon, crm, fromLocalInput, mailHref, parseDay, startOfDay, telHref, toLocalInput, waHref } from './shared';

const T = defineDict({
  me: {
    received: 'Primljeno {date}',
    message: 'Poruka klijenta',
    details: 'Detalji',
    service: 'Usluga',
    preferred: 'Željeni datum',
    product: 'Povezani proizvod',
    openOnSite: 'Otvori na sajtu',
    priceFrom: 'od {price}',
    onRequest: 'Cijena na upit',
    statusTitle: 'Status',
    act_contacted: 'Kontaktiran',
    act_scheduled: 'Zakazano',
    act_done: 'Završeno',
    visitAt: 'Termin posjete',
    visitHint: 'Klijent je naveo: {date}',
    visitHintNone: 'Izaberite datum i vrijeme dolaska na mjerenje.',
    statusSaved: 'Status: {status}',
    scheduledToast: 'Posjeta zakazana — {when}',
    note: 'Interna bilješka',
    notePh: 'Npr. dogovoreno mjerenje u 17h, ponijeti uzorke laminata…',
    noteHint: 'Vidljivo samo administratorima.',
    saveNote: 'Sačuvaj bilješku',
    noteSaved: 'Bilješka je sačuvana',
    delete: 'Obriši upit',
    deleteTitle: 'Obrisati ovaj upit?',
    deleteText: 'Upit od {name} biće trajno uklonjen iz CMS-a.',
    deleted: 'Upit je obrisan',
    mailSubject: 'SELCA COMPANY — vaš upit',
  },
  sq: {
    received: 'Pranuar më {date}',
    message: 'Mesazhi i klientit',
    details: 'Detajet',
    service: 'Shërbimi',
    preferred: 'Data e dëshiruar',
    product: 'Produkti i lidhur',
    openOnSite: 'Hape në faqe',
    priceFrom: 'nga {price}',
    onRequest: 'Çmimi sipas kërkesës',
    statusTitle: 'Statusi',
    act_contacted: 'U kontaktua',
    act_scheduled: 'E caktuar',
    act_done: 'E përfunduar',
    visitAt: 'Termini i vizitës',
    visitHint: 'Klienti ka kërkuar: {date}',
    visitHintNone: 'Zgjidhni datën dhe orën e vizitës për matje.',
    statusSaved: 'Statusi: {status}',
    scheduledToast: 'Vizita u caktua — {when}',
    note: 'Shënim i brendshëm',
    notePh: 'P.sh. matja e rënë dakord në ora 17, merrni mostrat e laminatit…',
    noteHint: 'E dukshme vetëm për administratorët.',
    saveNote: 'Ruaj shënimin',
    noteSaved: 'Shënimi u ruajt',
    delete: 'Fshij kërkesën',
    deleteTitle: 'Të fshihet kjo kërkesë?',
    deleteText: 'Kërkesa nga {name} do të hiqet përgjithmonë nga CMS-i.',
    deleted: 'Kërkesa u fshi',
    mailSubject: 'SELCA COMPANY — kërkesa juaj',
  },
  en: {
    received: 'Received {date}',
    message: 'Customer message',
    details: 'Details',
    service: 'Service',
    preferred: 'Preferred date',
    product: 'Linked product',
    openOnSite: 'Open on site',
    priceFrom: 'from {price}',
    onRequest: 'Price on request',
    statusTitle: 'Status',
    act_contacted: 'Contacted',
    act_scheduled: 'Scheduled',
    act_done: 'Done',
    visitAt: 'Visit date & time',
    visitHint: 'Customer asked for: {date}',
    visitHintNone: 'Pick the date and time of the measurement visit.',
    statusSaved: 'Status: {status}',
    scheduledToast: 'Visit scheduled — {when}',
    note: 'Internal note',
    notePh: 'E.g. measurement agreed for 5 pm, bring laminate samples…',
    noteHint: 'Only visible to admins.',
    saveNote: 'Save note',
    noteSaved: 'Note saved',
    delete: 'Delete inquiry',
    deleteTitle: 'Delete this inquiry?',
    deleteText: 'The inquiry from {name} will be permanently removed from the CMS.',
    deleted: 'Inquiry deleted',
    mailSubject: 'SELCA COMPANY — your inquiry',
  },
});

const ACTIONS: { id: Exclude<InquiryStatus, 'new'>; icon: ComponentType<{ className?: string }>; on: string }[] = [
  { id: 'contacted', icon: PhoneCall, on: 'border-sky-600/30 bg-sky-50 text-sky-800 ring-2 ring-sky-600/15' },
  { id: 'scheduled', icon: CalendarCheck2, on: 'border-violet-600/30 bg-violet-50 text-violet-800 ring-2 ring-violet-600/15' },
  { id: 'done', icon: CheckCircle2, on: 'border-emerald-600/30 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/15' },
];

/** Sensible default visit slot: the customer's preferred day (if still ahead) or the next working day, at 10:00. */
function defaultVisit(q: Inquiry) {
  const today = startOfDay(Date.now());
  let d = q.preferredDate ? parseDay(q.preferredDate) : null;
  if (!d || Number.isNaN(d.getTime()) || d < today) {
    d = new Date(today);
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  }
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function Section({ title, icon, children, aside }: { title: ReactNode; icon?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {icon}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right font-medium text-ink">{children}</span>
    </div>
  );
}

function NoteEditor({ inquiry }: { inquiry: Inquiry }) {
  const t = useDict(T, 'admin');
  const updateInquiry = useDb((s) => s.updateInquiry);
  const [note, setNote] = useState(inquiry.note ?? '');
  const dirty = note.trim() !== (inquiry.note ?? '').trim();
  const save = () => {
    updateInquiry(inquiry.id, { note: note.trim() || undefined });
    toast.success(t('noteSaved'));
  };
  return (
    <Section title={t('note')} icon={<StickyNote className="h-3.5 w-3.5" />}>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('notePh')}
        rows={3}
        className="text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && dirty) save();
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted">{t('noteHint')}</span>
        <Button size="xs" shape="rounded" variant={dirty ? 'dark' : 'outline'} disabled={!dirty} onClick={save}>
          {t('saveNote')}
        </Button>
      </div>
    </Section>
  );
}

export function InquiryDrawer({ inquiry: q, product, open, onClose }: { inquiry: Inquiry | undefined; product?: Product; open: boolean; onClose: () => void }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const tr = useDict(crm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const updateInquiry = useDb((s) => s.updateInquiry);
  const deleteInquiry = useDb((s) => s.deleteInquiry);

  const setStatus = (status: Exclude<InquiryStatus, 'new'>) => {
    if (!q || q.status === status) return;
    if (status === 'scheduled') {
      const scheduledAt = q.scheduledAt ?? defaultVisit(q);
      updateInquiry(q.id, { status, scheduledAt, seen: true });
      toast.success(t('scheduledToast', { when: dateTime(scheduledAt, lang) }));
    } else {
      updateInquiry(q.id, { status, seen: true });
      toast.success(t('statusSaved', { status: tc(`inqstatus_${status}`) }));
    }
  };

  const remove = async () => {
    if (!q) return;
    const ok = await confirmDialog({ title: t('deleteTitle'), text: t('deleteText', { name: q.name }), confirmLabel: t('delete'), danger: true });
    if (!ok) return;
    onClose();
    deleteInquiry(q.id);
    toast.success(t('deleted'));
  };

  return (
    <Drawer
      open={open && !!q}
      onClose={onClose}
      width="max-w-[540px]"
      title={q && <span className="text-[15px] font-bold text-ink">{tc(`inq_${q.type}`)}</span>}
      footer={
        q && (
          <div className="grid grid-cols-3 gap-2">
            <ContactAction href={telHref(q.phone)} icon={<Phone className="h-4 w-4" />} variant="primary">
              {tr('call')}
            </ContactAction>
            <ContactAction href={waHref(q.phone)} icon={<WhatsAppIcon className="h-4 w-4" />} variant="whatsapp" external>
              {tr('whatsapp')}
            </ContactAction>
            <ContactAction href={q.email ? mailHref(q.email, t('mailSubject')) : '#'} icon={<Mail className="h-4 w-4" />} disabled={!q.email}>
              {tr('email')}
            </ContactAction>
          </div>
        )
      }
    >
      {q && (
        <div className="space-y-6 px-5 py-6 sm:px-6">
          {/* Who */}
          <div className="flex items-start gap-4">
            <InquiryTypeIcon type={q.type} className="h-12 w-12 rounded-2xl [&>svg]:h-5 [&>svg]:w-5" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-extrabold tracking-tight text-ink">{q.name}</h2>
                <InquiryStatusBadge status={q.status} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                <Clock className="h-3.5 w-3.5" /> {t('received', { date: dateTime(q.createdAt, lang) })}
              </p>
            </div>
          </div>

          {/* Message */}
          <Section title={t('message')} icon={<MessageSquareText className="h-3.5 w-3.5" />}>
            <div className="relative rounded-2xl border border-line/80 bg-white py-4 pl-11 pr-5">
              <span aria-hidden className="pointer-events-none absolute left-3.5 top-3 font-display text-[40px] leading-none text-brand-300">“</span>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{q.message}</p>
            </div>
          </Section>

          {/* Linked product */}
          {product && (
            <Section title={t('product')}>
              <a href={`/proizvod/${product.slug}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3.5 rounded-2xl border border-line/80 bg-white p-3 transition-colors hover:border-ink/25">
                <Thumb src={product.images[0]} className="h-16 w-16 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{l(product.name)}</div>
                  <div className="mt-0.5 text-[12px] text-muted">
                    {product.sku} · {product.quoteOnly ? t('onRequest') : t('priceFrom', { price: `${money(basePrice(product), lang)} ${perUnit(product.unit, lang)}` })}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 group-hover:underline">
                    {t('openOnSite')} <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </a>
            </Section>
          )}

          {/* Status */}
          <Section title={t('statusTitle')}>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => {
                const on = q.status === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStatus(a.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-[12.5px] font-semibold transition-all active:scale-[0.98]',
                      on ? a.on : 'border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink',
                    )}
                  >
                    <a.icon className="h-[18px] w-[18px]" />
                    <span className="text-center leading-tight">{t(`act_${a.id}`)}</span>
                  </button>
                );
              })}
            </div>

            {q.status === 'scheduled' && (
              <div className="mt-3 rounded-2xl border border-violet-600/15 bg-violet-50/60 p-4">
                <label htmlFor={`visit-${q.id}`} className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-violet-900">
                  <CalendarClock className="h-4 w-4" /> {t('visitAt')}
                </label>
                <input
                  id={`visit-${q.id}`}
                  type="datetime-local"
                  value={toLocalInput(q.scheduledAt)}
                  onChange={(e) => {
                    const v = fromLocalInput(e.target.value);
                    if (v) updateInquiry(q.id, { scheduledAt: v });
                  }}
                  className="h-11 w-full rounded-xl border border-violet-600/20 bg-white px-3.5 text-[15px] text-ink outline-none transition focus:border-violet-600/50 focus:ring-4 focus:ring-violet-600/10"
                />
                <p className="mt-1.5 text-[12px] text-violet-900/70">
                  {q.preferredDate ? t('visitHint', { date: date(parseDay(q.preferredDate), lang, { weekday: 'long', day: 'numeric', month: 'long' }) }) : t('visitHintNone')}
                </p>
              </div>
            )}
          </Section>

          {/* Details */}
          <Section title={t('details')}>
            <div className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-white">
              <DetailRow label={tr('phone')}>
                <a href={telHref(q.phone)} className="tabular-nums hover:text-brand-700">
                  {q.phone}
                </a>
              </DetailRow>
              <DetailRow label={tr('email')}>
                {q.email ? (
                  <a href={mailHref(q.email)} className="break-all hover:text-brand-700">
                    {q.email}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </DetailRow>
              {q.city && (
                <DetailRow label={tr('city')}>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted" /> {q.city}
                  </span>
                </DetailRow>
              )}
              {q.service && (
                <DetailRow label={t('service')}>
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5 text-muted" /> {q.service}
                  </span>
                </DetailRow>
              )}
              {q.preferredDate && <DetailRow label={t('preferred')}>{date(parseDay(q.preferredDate), lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</DetailRow>}
            </div>
          </Section>

          <NoteEditor key={q.id} inquiry={q} />

          <div className="border-t border-line pt-4">
            <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> {t('delete')}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
