import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { CheckCheck, Inbox, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { FilterPills, PageHeader, SearchInput } from '@/admin/components/kit';
import { Agenda } from '@/admin/components/crm/Agenda';
import { InquiryCard } from '@/admin/components/crm/InquiryCard';
import { InquiryDrawer } from '@/admin/components/crm/InquiryDrawer';
import { INQ_TYPE_ICON, matches, pluralForm, useNow } from '@/admin/components/crm/shared';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import type { InquiryStatus, InquiryType, Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Upiti i mjerenja',
    subtitle: 'Zahtjevi za besplatno mjerenje, ponude i poruke sa sajta — stižu ovdje u realnom vremenu.',
    newBadge_one: '{n} novi',
    newBadge_few: '{n} nova',
    newBadge_many: '{n} novih',
    markAll: 'Označi sve kao pregledano',
    searchPh: 'Pretraži po imenu, telefonu, gradu ili poruci…',
    allTypes: 'Sve vrste',
    allStatuses: 'Svi statusi',
    showing: 'Prikazano {n} od {total}',
    emptyTitle: 'Nema upita za izabrane filtere',
    emptyText: 'Promijenite filtere ili obrišite pretragu.',
    resetFilters: 'Poništi filtere',
    noneTitle: 'Još nema upita',
    noneText: 'Kada kupac pošalje formular za mjerenje, ponudu ili poruku, pojaviće se ovdje odmah.',
    toastNew: 'Novi upit: {name}',
    open: 'Otvori',
  },
  sq: {
    title: 'Kërkesat & matjet',
    subtitle: 'Kërkesat për matje falas, oferta dhe mesazhe nga faqja — mbërrijnë këtu në kohë reale.',
    newBadge_one: '{n} e re',
    newBadge_few: '{n} të reja',
    newBadge_many: '{n} të reja',
    markAll: 'Shëno të gjitha si të shikuara',
    searchPh: 'Kërko sipas emrit, telefonit, qytetit ose mesazhit…',
    allTypes: 'Të gjitha llojet',
    allStatuses: 'Të gjitha statuset',
    showing: 'Shfaqen {n} nga {total}',
    emptyTitle: 'Asnjë kërkesë për këto filtra',
    emptyText: 'Ndryshoni filtrat ose pastroni kërkimin.',
    resetFilters: 'Rivendos filtrat',
    noneTitle: 'Ende nuk ka kërkesa',
    noneText: 'Kur një klient dërgon formularin për matje, ofertë ose mesazh, ai shfaqet këtu menjëherë.',
    toastNew: 'Kërkesë e re: {name}',
    open: 'Hap',
  },
  en: {
    title: 'Leads & visits',
    subtitle: 'Free measurement requests, quote requests and messages from the website — they land here in real time.',
    newBadge_one: '{n} new',
    newBadge_few: '{n} new',
    newBadge_many: '{n} new',
    markAll: 'Mark all as seen',
    searchPh: 'Search by name, phone, city or message…',
    allTypes: 'All types',
    allStatuses: 'All statuses',
    showing: 'Showing {n} of {total}',
    emptyTitle: 'No inquiries match these filters',
    emptyText: 'Change the filters or clear the search.',
    resetFilters: 'Reset filters',
    noneTitle: 'No inquiries yet',
    noneText: 'When a customer submits the measurement, quote or contact form, it shows up here instantly.',
    toastNew: 'New inquiry: {name}',
    open: 'Open',
  },
});

type TypeFilter = 'all' | InquiryType;
type StatusFilter = 'all' | InquiryStatus;

const TYPES: InquiryType[] = ['measurement', 'quote', 'contact'];
const STATUSES: InquiryStatus[] = ['new', 'contacted', 'scheduled', 'done'];
const STATUS_DOT: Record<InquiryStatus, string> = { new: 'bg-brand-600', contacted: 'bg-sky-500', scheduled: 'bg-violet-500', done: 'bg-emerald-500' };

export default function Inquiries() {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const inquiries = useDb((s) => s.inquiries);
  const products = useDb((s) => s.products);
  const updateInquiry = useDb((s) => s.updateInquiry);
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(() => params.get('id'));
  const [open, setOpen] = useState(() => !!params.get('id'));
  const now = useNow();

  const productById = useMemo(() => new Map<string, Product>(products.map((p) => [p.id, p])), [products]);
  const sorted = useMemo(() => [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [inquiries]);

  const byType = useMemo(() => (type === 'all' ? sorted : sorted.filter((x) => x.type === type)), [sorted, type]);
  const filtered = useMemo(
    () =>
      byType.filter((x) => {
        if (status !== 'all' && x.status !== status) return false;
        const prod = x.productId ? productById.get(x.productId) : undefined;
        return matches(q, [x.name, x.phone, x.email, x.city, x.service, x.message, x.note, prod && l(prod.name)]);
      }),
    [byType, status, q, productById, l],
  );

  const unseen = useMemo(() => inquiries.filter((x) => !x.seen), [inquiries]);
  const current = selected ? inquiries.find((x) => x.id === selected) : undefined;
  const currentProduct = current?.productId ? productById.get(current.productId) : undefined;

  const openInquiry = (id: string) => {
    setSelected(id);
    setOpen(true);
  };
  const closeInquiry = () => {
    setOpen(false);
    if (params.has('id')) {
      params.delete('id');
      setParams(params, { replace: true });
    }
  };

  // Opening an inquiry marks it as seen.
  useEffect(() => {
    if (open && current && !current.seen) updateInquiry(current.id, { seen: true });
  }, [open, current, updateInquiry]);

  // Live: leads submitted on the storefront (another tab) pop in with a toast.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (known.current === null) {
      known.current = new Set(inquiries.map((x) => x.id));
      return;
    }
    for (const x of inquiries) {
      if (known.current.has(x.id)) continue;
      known.current.add(x.id);
      if (!x.seen) {
        toast(t('toastNew', { name: x.name }), {
          description: `${tc(`inq_${x.type}`)} · ${x.message.slice(0, 70)}${x.message.length > 70 ? '…' : ''}`,
          action: { label: t('open'), onClick: () => {
            setSelected(x.id);
            setOpen(true);
          } },
        });
      }
    }
  }, [inquiries, t, tc]);

  const typeOptions = [
    {
      id: 'all' as TypeFilter,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> {t('allTypes')}
        </span>
      ),
      count: sorted.length,
    },
    ...TYPES.map((ty) => {
      const Icon = INQ_TYPE_ICON[ty];
      return {
        id: ty as TypeFilter,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" /> {tc(`inq_${ty}`)}
          </span>
        ),
        count: sorted.filter((x) => x.type === ty).length,
      };
    }),
  ];

  const statusOptions = [
    { id: 'all' as StatusFilter, label: t('allStatuses'), count: byType.length },
    ...STATUSES.map((s) => ({
      id: s as StatusFilter,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[s])} /> {tc(`inqstatus_${s}`)}
        </span>
      ),
      count: byType.filter((x) => x.status === s).length,
    })),
  ];

  const filtersActive = type !== 'all' || status !== 'all' || q.trim() !== '';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        badge={
          unseen.length > 0 && (
            <Badge tone="brand" dot>
              {t(`newBadge_${pluralForm(unseen.length, lang)}`, { n: unseen.length })}
            </Badge>
          )
        }
        actions={
          unseen.length > 0 && (
            <Button variant="outline" shape="rounded" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={() => unseen.forEach((x) => updateInquiry(x.id, { seen: true }))}>
              {t('markAll')}
            </Button>
          )
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        {/* Filters */}
        <div className="min-w-0 space-y-3 rounded-2xl border border-line/80 bg-white p-3 shadow-[0_1px_2px_rgb(28_26_23/0.04)] sm:p-4 lg:col-start-1 lg:row-start-1">
          <SearchInput value={q} onChange={setQ} placeholder={t('searchPh')} />
          <FilterPills options={typeOptions} value={type} onChange={setType} />
          <FilterPills options={statusOptions} value={status} onChange={setStatus} />
        </div>

        {/* Agenda — right column on desktop, between filters and list on mobile */}
        <Agenda inquiries={inquiries} now={now} onOpen={openInquiry} className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1" />

        {/* List */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {inquiries.length === 0 ? (
            <div className="rounded-2xl border border-line/80 bg-white">
              <EmptyState icon={<Inbox className="h-6 w-6" />} title={t('noneTitle')} text={t('noneText')} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60">
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title={t('emptyTitle')}
                text={t('emptyText')}
                action={
                  <Button
                    variant="outline"
                    shape="rounded"
                    size="sm"
                    onClick={() => {
                      setType('all');
                      setStatus('all');
                      setQ('');
                    }}
                  >
                    {t('resetFilters')}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {filtersActive && <p className="mb-2.5 px-1 text-[12.5px] text-muted">{t('showing', { n: filtered.length, total: inquiries.length })}</p>}
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {filtered.map((x) => (
                    <motion.li
                      key={x.id}
                      layout="position"
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                      transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                    >
                      <InquiryCard inquiry={x} product={x.productId ? productById.get(x.productId) : undefined} active={open && selected === x.id} onOpen={() => openInquiry(x.id)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </>
          )}
        </div>
      </div>

      <InquiryDrawer inquiry={current} product={currentProduct} open={open} onClose={closeInquiry} />
    </div>
  );
}
