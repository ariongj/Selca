import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';
import { STATUS_ORDER } from './data';
import { D, pluralKey } from './i18n';

/**
 * Ordinal ramp along the order pipeline (one hue, light → dark), validated with the
 * dataviz `--ordinal` checks (monotone L, ΔL ≥ 0.06, light end ≥ 2:1 on white).
 * Cancelled sits outside the pipeline, so it takes the neutral de-emphasis grey.
 * Uses the runtime brand scale, so it follows the colour chosen in Postavke.
 */
const RAMP: Record<OrderStatus, string> = {
  new: 'bg-brand-300',
  confirmed: 'bg-brand-400',
  processing: 'bg-brand-500',
  shipped: 'bg-brand-600',
  installation: 'bg-brand-700',
  completed: 'bg-brand-900',
  cancelled: 'bg-ink/20',
};

export function StatusBreakdown({ byStatus, period, className }: { byStatus: Record<OrderStatus, number>; period: number; className?: string }) {
  const t = useDict(D, 'admin');
  const tc = useDict(common, 'admin');
  const lang = useLang('admin');
  const [hover, setHover] = useState<OrderStatus | null>(null);
  const total = STATUS_ORDER.reduce((s, k) => s + byStatus[k], 0);
  const pct = (k: OrderStatus) => (total ? (byStatus[k] / total) * 100 : 0);

  return (
    <Card className={className} title={t('status_title')} description={t('status_desc', { n: period })} bodyClassName="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink tabular-nums">{total}</span>
        <span className="text-[13px] text-muted">{t(`status_total_${pluralKey(lang, total)}`)}</span>
      </div>

      {/* part-to-whole: one stacked bar, 2px surface gaps */}
      <div className={cn('mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]', total === 0 && 'bg-canvas')} onMouseLeave={() => setHover(null)}>
        {total > 0 &&
          STATUS_ORDER.filter((k) => byStatus[k] > 0).map((k) => (
            <div
              key={k}
              onMouseEnter={() => setHover(k)}
              title={`${tc(`status_${k}`)} · ${byStatus[k]}`}
              className={cn('h-full min-w-[3px] transition-opacity duration-150', RAMP[k], hover && hover !== k && 'opacity-35')}
              style={{ width: `${pct(k)}%` }}
            />
          ))}
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t('status_empty')}</p>
      ) : (
        <ul className="-mx-2 mt-4 space-y-0.5" onMouseLeave={() => setHover(null)}>
          {STATUS_ORDER.map((k) => {
            const n = byStatus[k];
            return (
              <li key={k}>
                <Link
                  to={`/admin/narudzbe?status=${k}`}
                  onMouseEnter={() => setHover(k)}
                  onFocus={() => setHover(k)}
                  onBlur={() => setHover(null)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-2 py-[7px] text-[13.5px] transition-[background,opacity]',
                    hover === k ? 'bg-canvas' : 'hover:bg-canvas',
                    hover && hover !== k && 'opacity-60',
                  )}
                >
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-[3px]', RAMP[k])} />
                  <span className={cn('flex-1 truncate font-medium', n ? 'text-ink' : 'text-muted')}>{tc(`status_${k}`)}</span>
                  <span className={cn('w-8 text-right font-bold tabular-nums', n ? 'text-ink' : 'text-muted/70')}>{n}</span>
                  <span className="w-12 text-right text-[12.5px] tabular-nums text-muted">{pct(k) > 0 && pct(k) < 1 ? '<1' : num(Math.round(pct(k)), lang)}%</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted/0 transition-colors group-hover:text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
