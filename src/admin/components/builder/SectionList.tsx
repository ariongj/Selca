import { useState, type DragEvent } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, EyeOff, GripVertical } from 'lucide-react';
import type { HomeSection } from '@/lib/types';
import { Switch } from '@/components/ui/Field';
import { useDict, useL } from '@/i18n';
import { cn } from '@/lib/utils';
import { B } from './i18n';
import { SECTION_META, sectionSummary } from './meta';
import { IconBtn } from './fields';

/** Move item `from` so that it lands before index `to` (0…length). */
export function moveTo<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, x);
  return next;
}

export function SectionList({
  sections,
  onReorder,
  onToggle,
  onSelect,
}: {
  sections: HomeSection[];
  onReorder: (next: HomeSection[], movedId: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const t = useDict(B, 'admin');
  const l = useL('admin');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  const reset = () => {
    setDragFrom(null);
    setDropAt(null);
  };
  const onDragOver = (e: DragEvent<HTMLLIElement>, i: number) => {
    if (dragFrom === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const r = e.currentTarget.getBoundingClientRect();
    setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragFrom !== null && dropAt !== null && dropAt !== dragFrom && dropAt !== dragFrom + 1) {
      onReorder(moveTo(sections, dragFrom, dropAt), sections[dragFrom].id);
    }
    reset();
  };
  const step = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    onReorder(moveTo(sections, i, dir === 1 ? j + 1 : j), sections[i].id);
  };

  return (
    <ul className="space-y-1.5" onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropAt(null)}>
      {sections.map((s, i) => {
        const meta = SECTION_META[s.type];
        const Icon = meta.icon;
        const sum = sectionSummary(s, l, t);
        const showLineBefore = dropAt === i && dragFrom !== null && dragFrom !== i && dragFrom !== i - 1;
        const showLineAfter = i === sections.length - 1 && dropAt === sections.length && dragFrom !== null && dragFrom !== i;
        return (
          <li
            key={s.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', s.id);
              setDragFrom(i);
            }}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={onDrop}
            onDragEnd={reset}
            className="relative"
          >
            {showLineBefore && <DropLine className="-top-[5px]" />}
            {showLineAfter && <DropLine className="-bottom-[5px]" />}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(s.id);
                }
              }}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-xl border bg-white py-2 pl-2.5 pr-2 outline-none sm:pl-1 transition-all',
                'hover:border-ink/20 hover:shadow-[0_6px_20px_-14px_rgb(28_26_23/0.4)] focus-visible:ring-4 focus-visible:ring-ink/10',
                dragFrom === i ? 'border-dashed border-ink/25 opacity-50' : 'border-line',
              )}
            >
              <span className="hidden h-9 w-5 shrink-0 cursor-grab place-items-center sm:grid text-ink/25 transition group-hover:text-ink/50 active:cursor-grabbing" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </span>
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition', meta.tone, !s.enabled && 'opacity-45 grayscale')}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className={cn('min-w-0 flex-1 pl-1', !s.enabled && 'opacity-60')}>
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-bold text-ink">{t(`type_${s.type}`)}</span>
                  {!s.enabled && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-ink/[0.06] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                      <EyeOff className="h-2.5 w-2.5" /> {t('hidden')}
                    </span>
                  )}
                </span>
                <span className="block truncate text-[12px] text-muted">
                  {sum.meta && <span className="font-semibold text-ink-soft/80">{sum.meta} · </span>}
                  {sum.line}
                </span>
              </span>
              <span className="flex shrink-0 items-center transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <IconBtn label={t('moveUp')} disabled={i === 0} onClick={() => step(i, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn label={t('moveDown')} disabled={i === sections.length - 1} onClick={() => step(i, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </IconBtn>
              </span>
              <span className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} title={s.enabled ? t('visible') : t('hidden')}>
                <Switch size="sm" checked={s.enabled} onChange={(v) => onToggle(s.id, v)} />
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted/60 transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DropLine({ className }: { className?: string }) {
  return (
    <span className={cn('pointer-events-none absolute inset-x-1 z-10 flex items-center', className)}>
      <span className="h-2 w-2 rounded-full border-2 border-brand-600 bg-white" />
      <span className="h-0.5 flex-1 rounded-full bg-brand-600" />
    </span>
  );
}
