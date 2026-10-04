import { useMemo } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { date } from '@/lib/format';
import type { Inquiry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { INQ_TYPE_ICON, INQ_TYPE_TONE, crm, dayKey, pluralForm, startOfDay } from './shared';

const T = defineDict({
  me: {
    title: 'Agenda',
    subtitle: 'Zakazane posjete u narednih 7 dana',
    empty: 'Nema zakazanih posjeta u narednih 7 dana.',
    emptyHint: 'Otvorite upit i označite ga kao „Zakazano“.',
    visits_one: '{n} posjeta',
    visits_few: '{n} posjete',
    visits_many: '{n} posjeta',
  },
  sq: {
    title: 'Agjenda',
    subtitle: 'Vizitat e caktuara në 7 ditët e ardhshme',
    empty: 'Nuk ka vizita të caktuara në 7 ditët e ardhshme.',
    emptyHint: 'Hapni një kërkesë dhe shënojeni si „E caktuar“.',
    visits_one: '{n} vizitë',
    visits_few: '{n} vizita',
    visits_many: '{n} vizita',
  },
  en: {
    title: 'Agenda',
    subtitle: 'Scheduled visits for the next 7 days',
    empty: 'No visits scheduled for the next 7 days.',
    emptyHint: 'Open an inquiry and mark it as “Scheduled”.',
    visits_one: '{n} visit',
    visits_few: '{n} visits',
    visits_many: '{n} visits',
  },
});

export function Agenda({ inquiries, now, onOpen, className }: { inquiries: Inquiry[]; now: number; onOpen: (id: string) => void; className?: string }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const tr = useDict(crm, 'admin');
  const lang = useLang('admin');

  const { days, groups, total } = useMemo(() => {
    const start = startOfDay(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const visits = inquiries
      .filter((q) => q.status === 'scheduled' && q.scheduledAt)
      .filter((q) => {
        const at = new Date(q.scheduledAt!);
        return at >= start && at < end;
      })
      .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
    const groups = new Map<string, Inquiry[]>();
    for (const v of visits) {
      const k = dayKey(v.scheduledAt!);
      groups.set(k, [...(groups.get(k) ?? []), v]);
    }
    return { days, groups, total: visits.length };
  }, [inquiries, now]);

  const todayKey = dayKey(days[0]);
  const tomorrowKey = dayKey(days[1]);
  const dayLabel = (d: Date) => {
    const k = dayKey(d);
    const rest = date(d, lang, { weekday: 'long', day: 'numeric', month: 'long' });
    if (k === todayKey) return { main: tr('today'), rest };
    if (k === tomorrowKey) return { main: tr('tomorrow'), rest };
    return { main: date(d, lang, { weekday: 'long' }), rest: date(d, lang, { day: 'numeric', month: 'long' }) };
  };

  return (
    <Card
      className={className}
      padded={false}
      title={
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-600" /> {t('title')}
        </span>
      }
      description={t('subtitle')}
      actions={total > 0 && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800 ring-1 ring-inset ring-violet-600/15">{t(`visits_${pluralForm(total, lang)}`, { n: total })}</span>}
    >
      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 border-b border-line/70 px-3 py-3">
        {days.map((d, i) => {
          const n = groups.get(dayKey(d))?.length ?? 0;
          const weekend = d.getDay() === 0;
          return (
            <div key={i} className={cn('flex flex-col items-center gap-1 rounded-xl py-2', i === 0 ? 'bg-ink text-paper' : n ? 'bg-violet-50 text-violet-900' : weekend ? 'text-muted/60' : 'text-ink-soft')}>
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', i === 0 ? 'text-paper/60' : 'opacity-70')}>{date(d, lang, { weekday: 'short' }).replace('.', '')}</span>
              <span className="text-[15px] font-extrabold leading-none tabular-nums">{d.getDate()}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                {Array.from({ length: Math.min(n, 3) }, (_, k) => (
                  <span key={k} className={cn('h-1.5 w-1.5 rounded-full', i === 0 ? 'bg-brand-300' : 'bg-violet-500')} />
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-semibold text-ink">{t('empty')}</p>
          <p className="mt-1 text-[12.5px] text-muted">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="divide-y divide-line/70">
          {days
            .filter((d) => groups.has(dayKey(d)))
            .map((d) => {
              const label = dayLabel(d);
              const list = groups.get(dayKey(d))!;
              return (
                <div key={dayKey(d)} className="px-4 py-3.5">
                  <div className="mb-2 flex items-baseline gap-2 px-1">
                    <span className={cn('text-[13px] font-extrabold capitalize', dayKey(d) === todayKey ? 'text-brand-700' : 'text-ink')}>{label.main}</span>
                    <span className="truncate text-[12px] text-muted">{label.rest}</span>
                  </div>
                  <ul className="space-y-1">
                    {list.map((q) => {
                      const Icon = INQ_TYPE_ICON[q.type];
                      return (
                        <li key={q.id}>
                          <button type="button" onClick={() => onOpen(q.id)} className="group flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-canvas">
                            <span className="w-12 shrink-0 rounded-lg bg-ink/[0.05] py-1.5 text-center text-[13px] font-extrabold tabular-nums text-ink">{date(q.scheduledAt!, lang, { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-semibold text-ink group-hover:text-brand-700">{q.name}</span>
                              <span className="flex items-center gap-1 truncate text-[12px] text-muted">
                                {q.city && (
                                  <>
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {q.city}
                                    {' · '}
                                  </>
                                )}
                                {q.service ?? tc(`inq_${q.type}`)}
                              </span>
                            </span>
                            <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset', INQ_TYPE_TONE[q.type])}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}
