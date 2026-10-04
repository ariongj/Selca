import { CalendarCheck2, CalendarClock, MapPin, Phone } from 'lucide-react';
import { InquiryStatusBadge, Thumb } from '@/admin/components/kit';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { date, timeAgo } from '@/lib/format';
import type { Inquiry, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { InquiryTypeIcon, parseDay, telHref } from './shared';

const T = defineDict({
  me: { unseen: 'Nepregledano', preferred: 'Željeni termin', scheduled: 'Zakazano' },
  sq: { unseen: 'E pashikuar', preferred: 'Data e dëshiruar', scheduled: 'Caktuar' },
  en: { unseen: 'Unseen', preferred: 'Preferred date', scheduled: 'Scheduled' },
});

export function InquiryCard({ inquiry: q, product, active, onOpen }: { inquiry: Inquiry; product?: Product; active?: boolean; onOpen: () => void }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const unseen = !q.seen;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className={cn(
        'group relative flex cursor-pointer gap-3.5 overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgb(28_26_23/0.04)] outline-none transition-all hover:-translate-y-px hover:shadow-[0_10px_30px_-18px_rgb(28_26_23/0.35)] focus-visible:ring-4 focus-visible:ring-ink/10 sm:p-5',
        unseen ? 'border-brand-200 bg-gradient-to-r from-brand-50/70 to-white to-40%' : 'border-line/80 hover:border-ink/20',
        active && 'border-ink/40',
      )}
    >
      {unseen && <span className="absolute inset-y-0 left-0 w-1 bg-brand-600" />}
      <InquiryTypeIcon type={q.type} className="hidden sm:grid" />

      <div className="min-w-0 flex-1">
        {/* Top line */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <InquiryTypeIcon type={q.type} className="h-7 w-7 rounded-lg sm:hidden [&>svg]:h-3.5 [&>svg]:w-3.5" />
              <span className={cn('truncate text-[15px] text-ink', unseen ? 'font-extrabold' : 'font-semibold')}>{q.name}</span>
              {unseen && (
                <span className="relative flex h-2 w-2" title={t('unseen')} aria-label={t('unseen')}>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                </span>
              )}
            </div>
            <div className="mt-1 text-[12px] font-semibold text-muted">
              {tc(`inq_${q.type}`)}
              {q.service && <span className="font-medium"> · {q.service}</span>}
            </div>
          </div>
          <span className="shrink-0 whitespace-nowrap pt-0.5 text-[12px] text-muted" title={date(q.createdAt, lang, { dateStyle: 'medium', timeStyle: 'short' })}>
            {timeAgo(q.createdAt, lang)}
          </span>
        </div>

        {/* Contact line */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
          <a href={telHref(q.phone)} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 font-semibold text-ink tabular-nums hover:text-brand-700">
            <Phone className="h-3.5 w-3.5 text-muted" />
            {q.phone}
          </a>
          {q.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted" />
              {q.city}
            </span>
          )}
        </div>

        {/* Message */}
        <div className="mt-2.5 flex items-start gap-3">
          <p className="line-clamp-2 min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-soft">{q.message}</p>
          {product && <Thumb src={product.images[0]} className="h-12 w-12 rounded-lg" />}
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            {q.status === 'scheduled' && q.scheduledAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 font-semibold text-violet-800">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                {t('scheduled')}: {date(q.scheduledAt, lang, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : q.preferredDate ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2 py-1 font-medium text-ink-soft">
                <CalendarClock className="h-3.5 w-3.5 text-muted" />
                {t('preferred')}: {date(parseDay(q.preferredDate), lang, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            ) : null}
            {product && <span className="truncate rounded-md bg-canvas px-2 py-1 font-medium text-ink-soft">{l(product.name)}</span>}
          </div>
          <InquiryStatusBadge status={q.status} />
        </div>
      </div>
    </div>
  );
}
