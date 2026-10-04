import { useState } from 'react';
import { toast } from 'sonner';
import { Ban, CircleDollarSign, Globe, MessageSquareText, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORDER_STATUS_TONE } from '@/admin/components/kit';
import { defineDict, useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { dateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order, OrderEvent, OrderStatus } from '@/lib/types';
import { isRecent } from './helpers';

const T = defineDict({
  me: {
    placeholder: 'Dodajte internu napomenu (vidi je samo tim)…',
    add: 'Dodaj napomenu',
    added: 'Napomena je dodata',
    shortcut: 'Ctrl + Enter za slanje',
    ev_created: 'Narudžba primljena preko web prodavnice',
    ev_status: 'Status promijenjen u „{s}“',
    ev_cancelled: 'Narudžba je otkazana',
    ev_note: 'Interna napomena',
    ev_payment: 'Uplata je evidentirana',
    by_web: 'Web prodavnica',
    by_admin: 'Admin',
    empty: 'Još nema aktivnosti.',
  },
  sq: {
    placeholder: 'Shtoni një shënim të brendshëm (e sheh vetëm ekipi)…',
    add: 'Shto shënim',
    added: 'Shënimi u shtua',
    shortcut: 'Ctrl + Enter për ta dërguar',
    ev_created: 'Porosia u pranua nga dyqani online',
    ev_status: 'Statusi u ndryshua në „{s}“',
    ev_cancelled: 'Porosia u anulua',
    ev_note: 'Shënim i brendshëm',
    ev_payment: 'Pagesa u regjistrua',
    by_web: 'Dyqani online',
    by_admin: 'Admin',
    empty: 'Ende nuk ka aktivitet.',
  },
  en: {
    placeholder: 'Add an internal note (visible to your team only)…',
    add: 'Add note',
    added: 'Note added',
    shortcut: 'Ctrl + Enter to send',
    ev_created: 'Order received from the online shop',
    ev_status: 'Status changed to “{s}”',
    ev_cancelled: 'Order was cancelled',
    ev_note: 'Internal note',
    ev_payment: 'Payment recorded',
    by_web: 'Online shop',
    by_admin: 'Admin',
    empty: 'No activity yet.',
  },
});

const DOT: Record<string, string> = {
  brand: 'bg-brand-600 text-white',
  blue: 'bg-sky-600 text-white',
  amber: 'bg-amber-500 text-white',
  violet: 'bg-violet-600 text-white',
  green: 'bg-emerald-600 text-white',
  gray: 'bg-ink/40 text-white',
};

/** Order activity feed (newest first) with an "add internal note" composer. */
export function OrderTimeline({ order }: { order: Order }) {
  const t = useDict(T, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const addOrderNote = useDb((s) => s.addOrderNote);
  const [note, setNote] = useState('');

  const submit = () => {
    const text = note.trim();
    if (!text) return;
    addOrderNote(order.id, text);
    setNote('');
    toast.success(t('added'));
  };

  const events = [...order.timeline].reverse();

  const title = (e: OrderEvent, first: boolean) => {
    if (e.status === 'note') return t('ev_note');
    if (e.status === 'payment') return t('ev_payment');
    if (e.status === 'cancelled') return t('ev_cancelled');
    if (e.status === 'new' && first) return t('ev_created');
    return t('ev_status', { s: tc(`status_${e.status}`) });
  };

  const icon = (e: OrderEvent) => {
    if (e.status === 'note') return <MessageSquareText className="h-3.5 w-3.5" />;
    if (e.status === 'payment') return <CircleDollarSign className="h-3.5 w-3.5" />;
    if (e.status === 'cancelled') return <Ban className="h-3.5 w-3.5" />;
    if (e.by === 'web') return <Globe className="h-3.5 w-3.5" />;
    return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
  };

  const tone = (e: OrderEvent) => {
    if (e.status === 'note') return 'bg-sand text-ink-soft ring-1 ring-line';
    if (e.status === 'payment') return DOT.green;
    return DOT[ORDER_STATUS_TONE[e.status as OrderStatus]] ?? DOT.gray;
  };

  return (
    <div>
      <div className="rounded-xl border border-line bg-canvas/40 focus-within:border-ink/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-ink/5">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={t('placeholder')}
          className="block w-full resize-none bg-transparent px-3.5 pt-3 text-sm leading-relaxed text-ink outline-none placeholder:text-muted/80"
        />
        <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5">
          <span className="hidden pl-1 text-[11px] text-muted sm:block">{t('shortcut')}</span>
          <Button size="xs" shape="rounded" variant="dark" className="ml-auto" icon={<Send className="h-3.5 w-3.5" />} disabled={!note.trim()} onClick={submit}>
            {t('add')}
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t('empty')}</p>
      ) : (
        <ol className="mt-5">
          {events.map((e, i) => {
            const first = i === events.length - 1;
            return (
              <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                {!first && <span aria-hidden className="absolute bottom-0 left-[13px] top-7 w-px bg-line" />}
                <span className={cn('relative z-10 mt-0.5 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full', tone(e))}>{icon(e)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">{title(e, first)}</p>
                  {e.note && <p className={cn('mt-1.5 whitespace-pre-line rounded-lg px-3 py-2 text-[13px] leading-relaxed', e.status === 'note' ? 'bg-amber-50/70 text-ink ring-1 ring-amber-600/10' : 'bg-canvas text-ink-soft')}>{e.note}</p>}
                  <p className="mt-1 text-[11.5px] text-muted">
                    {dateTime(e.at, lang)}
                    {isRecent(e.at) && (
                      <>
                        <span className="mx-1.5">·</span>
                        {timeAgo(e.at, lang)}
                      </>
                    )}
                    {e.by && (
                      <>
                        <span className="mx-1.5">·</span>
                        {e.by === 'web' ? t('by_web') : e.by === 'admin' ? t('by_admin') : e.by}
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
