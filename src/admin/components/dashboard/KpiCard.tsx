import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useLang } from '@/i18n';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useWidth } from './useWidth';

/* ------------------------------------------------------------------ */
/* Sparkline — de-emphasis line, current period in the accent           */
/* ------------------------------------------------------------------ */
export function Sparkline({ values, className, label }: { values: (number | null)[]; className?: string; label?: string }) {
  const [ref, width] = useWidth();
  const H = 36;
  const pad = 5;
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  const max = Math.max(...pts.map((p) => p.v), 1);
  const min = Math.min(...pts.map((p) => p.v), 0);
  const x = (i: number) => pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (H - pad * 2);
  const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  return (
    <div ref={ref} className={cn('h-9 w-full', className)} role="img" aria-label={label}>
      {width > 0 && pts.length > 1 && (
        <svg width={width} height={H} className="block overflow-visible" aria-hidden>
          <path d={path} className="fill-none stroke-ink/20" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {prev && last && (
            <path d={`M${x(prev.i)},${y(prev.v)} L${x(last.i)},${y(last.v)}`} className="fill-none stroke-brand-600" strokeWidth={2} strokeLinecap="round" />
          )}
          {last && <circle cx={x(last.i)} cy={y(last.v)} r={4} className="fill-brand-600 stroke-white" strokeWidth={2} />}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delta pill — direction × "up is good"                               */
/* ------------------------------------------------------------------ */
export function Delta({ value }: { value: number | null }) {
  const lang = useLang('admin');
  if (value === null) return null;
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-bold tabular-nums',
        flat ? 'bg-ink/[0.06] text-ink-soft' : up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {up && !flat ? '+' : flat ? '' : '−'}
      {num(Math.abs(value), lang, 1)}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */
export function KpiCard({
  label,
  icon: Icon,
  value,
  delta,
  caption,
  footer,
  to,
}: {
  label: ReactNode;
  icon: ComponentType<{ className?: string }>;
  value: ReactNode;
  delta?: number | null;
  caption?: ReactNode;
  footer?: ReactNode;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="pt-0.5 text-[13px] font-semibold leading-snug text-muted">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft ring-1 ring-line/60 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight text-ink tabular-nums sm:text-[28px]">{value}</div>
      <div className="mt-1.5 flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-1">
        {delta !== undefined && <Delta value={delta} />}
        {caption && <span className="text-[12px] leading-snug text-muted">{caption}</span>}
      </div>
      {footer && <div className="mt-auto pt-3">{footer}</div>}
    </>
  );
  const cls = 'group flex h-full flex-col rounded-2xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgb(28_26_23/0.04)] sm:p-5';
  return to ? (
    <Link to={to} className={cn(cls, 'transition-[border-color,box-shadow] hover:border-ink/15 hover:shadow-[0_6px_20px_-12px_rgb(28_26_23/0.25)]')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
