import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChartColumn, Rows3 } from 'lucide-react';
import { Card } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { money } from '@/lib/format';
import { fmtDate } from './dates';
import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/types';
import { addDays, niceTicks, type Bucket } from './data';
import { D, capitalize, pluralKey } from './i18n';
import { useWidth } from './useWidth';

const PLOT_H = 220;
const TOP = 22; // room for the peak label
const AXIS = 28; // x-axis label band (part of the container height)
const GUTTER = 58; // y-axis labels

function bucketLabel(b: Bucket, step: number, lang: Lang, long = false) {
  if (step === 1) {
    return long
      ? capitalize(fmtDate(b.start, lang, { weekday: 'long', day: 'numeric', month: 'long' }))
      : fmtDate(b.start, lang, { day: 'numeric', month: 'short' });
  }
  const last = addDays(b.end, -1);
  return `${fmtDate(b.start, lang, { day: 'numeric', month: 'short' })} – ${fmtDate(last, lang, { day: 'numeric', month: 'short' })}`;
}

/** Top-rounded bar (4px data end), square at the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function RevenueChart({ buckets, step, period, className }: { buckets: Bucket[]; step: number; period: number; className?: string }) {
  const t = useDict(D, 'admin');
  const lang = useLang('admin');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const total = buckets.reduce((s, b) => s + b.revenue, 0);
  const orders = buckets.reduce((s, b) => s + b.orders, 0);

  return (
    <Card
      className={className}
      title={t('chart_title')}
      description={step === 1 ? t('chart_daily') : t('chart_weekly')}
      actions={
        <div className="flex rounded-lg bg-canvas p-0.5 ring-1 ring-line/70" role="group">
          {(['chart', 'table'] as const).map((v) => {
            const Icon = v === 'chart' ? ChartColumn : Rows3;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                title={v === 'chart' ? t('view_chart') : t('view_table')}
                aria-label={v === 'chart' ? t('view_chart') : t('view_table')}
                className={cn('grid h-7 w-8 place-items-center rounded-md transition-colors', view === v ? 'bg-white text-ink shadow-sm ring-1 ring-line/70' : 'text-muted hover:text-ink')}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-[13px] font-semibold text-muted">{t('chart_total')}</span>
        <span className="text-xl font-extrabold tracking-tight text-ink">{money(total, lang)}</span>
        <span className="text-[13px] text-muted">
          <span className="hidden sm:inline">· </span>
          {t(`ord_${pluralKey(lang, orders)}`, { n: orders })}
        </span>
      </div>
      {view === 'chart' ? <Bars buckets={buckets} step={step} period={period} total={total} /> : <BucketTable buckets={buckets} step={step} />}
    </Card>
  );
}

function Bars({ buckets, step, period, total }: { buckets: Bucket[]; step: number; period: number; total: number }) {
  const t = useDict(D, 'admin');
  const lang = useLang('admin');
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const n = buckets.length;
  const max = Math.max(...buckets.map((b) => b.revenue), 0);
  const ticks = useMemo(() => niceTicks(max, 4), [max]);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = Math.max(width - GUTTER, 10);
  const slot = plotW / n;
  const barW = Math.max(3, Math.min(24, slot * 0.66));
  const y = (v: number) => TOP + PLOT_H - (v / top) * PLOT_H;
  const cx = (i: number) => GUTTER + slot * i + slot / 2;
  const peak = buckets.reduce((m, b, i) => (b.revenue > buckets[m].revenue ? i : m), 0);

  // x labels: anchored to the newest bucket, every k-th going back so they never collide
  const labelEvery = step === 1 ? (n <= 7 ? 1 : slot < 16 ? 7 : slot < 28 ? 5 : 3) : slot < 44 ? 3 : 2;
  const xLabel = (b: Bucket) => (step === 1 && n <= 7 ? capitalize(fmtDate(b.start, lang, { weekday: 'short' }).replace('.', '')) : fmtDate(b.start, lang, { day: 'numeric', month: 'short' }));

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => {
        const cur = a ?? n - 1;
        return e.key === 'ArrowRight' ? Math.min(n - 1, cur + 1) : Math.max(0, cur - 1);
      });
    } else if (e.key === 'Escape') setActive(null);
  };

  const a = active !== null ? buckets[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(cx(active), 84), width - 84) : 0;

  return (
    <div
      ref={ref}
      className="relative rounded-lg outline-offset-4"
      style={{ height: TOP + PLOT_H + AXIS }}
      tabIndex={0}
      role="img"
      aria-label={t('chart_aria', { n: period, total: money(total, lang) })}
      onKeyDown={onKey}
      onFocus={() => setActive((v) => v ?? n - 1)}
      onBlur={() => setActive(null)}
      onMouseLeave={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={TOP + PLOT_H + AXIS} className="block overflow-visible select-none" aria-hidden>
          {/* grid + y labels */}
          {ticks.map((v) => (
            <g key={v}>
              <line x1={GUTTER} x2={width} y1={y(v) + 0.5} y2={y(v) + 0.5} className={v === 0 ? 'stroke-ink/25' : 'stroke-line/70'} strokeWidth={1} />
              <text x={GUTTER - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] font-medium tabular-nums">
                {money(v, lang, { decimals: false })}
              </text>
            </g>
          ))}

          {/* bars + hit areas */}
          {buckets.map((b, i) => {
            const h = (b.revenue / top) * PLOT_H;
            const x = cx(i) - barW / 2;
            const on = active === i;
            return (
              <g key={i}>
                {on && <rect x={GUTTER + slot * i} y={TOP} width={slot} height={PLOT_H} rx={4} className="fill-ink/[0.035]" />}
                {h > 0 && (
                  <path
                    d={barPath(x, y(b.revenue), barW, h)}
                    className={cn('transition-[fill] duration-150', on ? 'fill-brand-800' : 'fill-brand-600')}
                  />
                )}
                <rect x={GUTTER + slot * i} y={0} width={slot} height={TOP + PLOT_H + AXIS} fill="transparent" onMouseEnter={() => setActive(i)} onMouseMove={() => active !== i && setActive(i)} />
              </g>
            );
          })}

          {/* direct label on the peak only */}
          {max > 0 && active === null && (
            <text x={cx(peak)} y={y(max) - 7} textAnchor="middle" className="pointer-events-none fill-ink-soft text-[11px] font-bold tabular-nums">
              {money(max, lang, { decimals: false })}
            </text>
          )}

          {/* x labels */}
          {buckets.map((b, i) => {
            if ((n - 1 - i) % labelEvery !== 0) return null;
            const label = xLabel(b);
            const half = label.length * 3.1;
            let x = cx(i);
            let anchor: 'middle' | 'end' | 'start' = 'middle';
            if (x + half > width) {
              x = width;
              anchor = 'end';
            } else if (x - half < GUTTER - 6) {
              x = GUTTER - 6;
              anchor = 'start';
            }
            return (
              <text key={i} x={x} y={TOP + PLOT_H + 19} textAnchor={anchor} className={cn('text-[11px] font-medium tabular-nums', active === i ? 'fill-ink' : 'fill-muted')}>
                {label}
              </text>
            );
          })}
        </svg>
      )}

      {max === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center" style={{ paddingLeft: GUTTER }}>
          <div className="text-sm font-bold text-ink">{t('no_sales')}</div>
          <div className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{t('no_sales_text')}</div>
        </div>
      )}

      {/* tooltip */}
      {a && active !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[0_12px_32px_-12px_rgb(28_26_23/0.35)]"
          style={{ left: tipLeft, top: Math.max(y(a.revenue) - 10, 64) }}
        >
          <div className="text-[15px] font-extrabold tabular-nums text-ink">{money(a.revenue, lang)}</div>
          <div className="mt-0.5 text-[12px] text-muted">{t(`ord_${pluralKey(lang, a.orders)}`, { n: a.orders })}</div>
          <div className="mt-1.5 whitespace-nowrap border-t border-line/70 pt-1.5 text-[11.5px] font-semibold text-ink-soft">
            {a.current ? `${step === 1 ? t('today') : t('this_week')} · ${t('in_progress')}` : bucketLabel(a, step, lang, true)}
          </div>
        </div>
      )}
    </div>
  );
}

function BucketTable({ buckets, step }: { buckets: Bucket[]; step: number }) {
  const t = useDict(D, 'admin');
  const lang = useLang('admin');
  const rows = [...buckets].reverse();
  return (
    <div className="overflow-y-auto rounded-lg ring-1 ring-line/70" style={{ height: TOP + PLOT_H + AXIS }}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-canvas">
          <tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            <th className="px-4 py-2.5">{t('col_period')}</th>
            <th className="px-4 py-2.5 text-right">{t('col_orders')}</th>
            <th className="px-4 py-2.5 text-right">{t('col_revenue')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => (
            <tr key={i} className="border-t border-line/60">
              <td className="px-4 py-2 text-ink-soft">
                {bucketLabel(b, step, lang, true)}
                {b.current && <span className="ml-2 text-[11px] font-semibold text-muted">({t('in_progress')})</span>}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-ink-soft">{b.orders}</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink">{money(b.revenue, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
