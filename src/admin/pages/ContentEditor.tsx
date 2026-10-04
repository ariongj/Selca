import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Cloud, CloudCheck, Eye, EyeOff, Loader2, MousePointerClick, Move, PencilLine, Undo2 } from 'lucide-react';
import type { HomeSection } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { confirmDialog } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { B } from '@/admin/components/builder/i18n';
import { SECTION_META } from '@/admin/components/builder/meta';
import { SectionList } from '@/admin/components/builder/SectionList';
import { SectionForm, type ChangeOpts } from '@/admin/components/builder/SectionForm';
import { IconBtn } from '@/admin/components/builder/fields';
import { Preview, type Device } from '@/admin/components/builder/Preview';

const DEBOUNCE_MS = 250;

export default function ContentEditor() {
  const t = useDict(B, 'admin');
  const home = useDb((s) => s.home);
  const setHome = useDb((s) => s.setHome);
  const updateHomeSection = useDb((s) => s.updateHomeSection);

  // Snapshot for "undo all changes" — taken once, when the editor opens
  const [snapshot] = useState(() => structuredClone(useDb.getState().home));
  const snapshotJson = useMemo(() => JSON.stringify(snapshot), [snapshot]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HomeSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [device, setDevice] = useState<Device>(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'mobile' : 'desktop'));
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');

  const pending = useRef<HomeSection | null>(null);
  const timer = useRef<number | undefined>(undefined);

  /* ---------------- debounced writes ---------------- */
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    updateHomeSection(next);
    setDraft(null);
    setSaving(false);
    setSavedAt(Date.now());
  }, [updateHomeSection]);

  // Never lose the last keystrokes when leaving the page
  useEffect(() => () => flush(), [flush]);

  const focusSection = useCallback((id: string) => setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 })), []);

  const editSection = (next: HomeSection, opts?: ChangeOpts) => {
    pending.current = next;
    setDraft(next);
    setSaving(true);
    window.clearTimeout(timer.current);
    if (opts?.reload) {
      flush();
      setReloadTick((n) => n + 1);
    } else {
      timer.current = window.setTimeout(flush, DEBOUNCE_MS);
    }
  };

  const commitList = (next: HomeSection[]) => {
    flush();
    setHome(next);
    setSavedAt(Date.now());
  };

  /* ---------------- derived ---------------- */
  const stored = selectedId ? home.find((h) => h.id === selectedId) : undefined;
  const current = draft && draft.id === selectedId ? draft : stored;
  const index = current ? home.findIndex((h) => h.id === current.id) : -1;
  const enabledCount = home.filter((h) => h.enabled).length;
  const homeJson = useMemo(() => JSON.stringify(home), [home]);
  const dirty = draft !== null || homeJson !== snapshotJson;

  /* ---------------- actions ---------------- */
  const select = (id: string | null) => {
    flush();
    setSelectedId(id);
    if (id) focusSection(id);
  };

  const toggle = (id: string, enabled: boolean) => {
    if (current?.id === id) {
      editSection({ ...current, enabled });
      flush();
    } else {
      commitList(home.map((h) => (h.id === id ? { ...h, enabled } : h)));
    }
    if (enabled) focusSection(id);
  };

  const undoAll = async () => {
    const ok = await confirmDialog({ title: t('undoTitle'), text: t('undoText'), confirmLabel: t('undoShort'), danger: false });
    if (!ok) return;
    window.clearTimeout(timer.current);
    pending.current = null;
    setDraft(null);
    setSaving(false);
    setHome(structuredClone(snapshot));
    setSavedAt(Date.now());
    toast.success(t('undone'));
    if (selectedId && !snapshot.some((s) => s.id === selectedId)) setSelectedId(null);
  };

  const switchTab = (next: 'editor' | 'preview') => {
    flush();
    setTab(next);
    if (next === 'preview' && selectedId) focusSection(selectedId);
  };

  return (
    <div className="flex flex-col xl:h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">{t('pageTitle')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('pageText')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AutosaveStatus saving={saving} savedAt={savedAt} />
          <Button variant="outline" size="sm" shape="rounded" icon={<Undo2 className="h-4 w-4" />} disabled={!dirty} onClick={undoAll} title={t('undoAll')}>
            <span className="hidden sm:inline">{t('undoAll')}</span>
            <span className="sm:hidden">{t('undoShort')}</span>
          </Button>
        </div>
      </div>

      {/* Narrow screens: editor / preview tabs */}
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-white p-1 ring-1 ring-line xl:hidden" role="tablist">
        {(['editor', 'preview'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => switchTab(k)}
            className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-lg text-[13.5px] font-semibold transition-colors', tab === k ? 'bg-ink text-paper shadow-sm' : 'text-ink-soft hover:text-ink')}
          >
            {k === 'editor' ? <PencilLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {k === 'editor' ? t('tabEditor') : t('tabPreview')}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* Left: sections + forms */}
        <aside className={cn('min-h-0 flex-col overflow-clip rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgb(28_26_23/0.04)] xl:flex', tab === 'editor' ? 'flex' : 'hidden')}>
          <AnimatePresence mode="wait" initial={false}>
            {current ? (
              <motion.div
                key={`edit-${current.id}`}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <EditorHeader
                  section={current}
                  index={index}
                  total={home.length}
                  onBack={() => select(null)}
                  onPrev={() => index > 0 && select(home[index - 1].id)}
                  onNext={() => index < home.length - 1 && select(home[index + 1].id)}
                  onToggle={(v) => toggle(current.id, v)}
                />
                <div className="min-h-0 flex-1 px-4 pb-8 pt-5 sm:px-5 xl:overflow-y-auto">
                  <SectionForm key={current.id} section={current} onChange={editSection} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-ink">{t('sections')}</h2>
                    <p className="text-[12.5px] text-muted">{t('enabledCount', { n: enabledCount, total: home.length })}</p>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-muted sm:inline-flex">
                    <Move className="h-3.5 w-3.5" /> {t('dragHint')}
                  </span>
                </div>
                <div className="min-h-0 flex-1 p-2.5 sm:p-3 xl:overflow-y-auto">
                  <SectionList
                    sections={home}
                    onSelect={select}
                    onToggle={toggle}
                    onReorder={(next, movedId) => {
                      commitList(next);
                      focusSection(movedId);
                    }}
                  />
                </div>
                <div className="flex items-start gap-2.5 border-t border-line/70 bg-canvas/40 px-4 py-3 text-[12.5px] leading-snug text-muted sm:px-5">
                  <MousePointerClick className="mt-px h-4 w-4 shrink-0 text-brand-600" />
                  {t('listTip')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Right: live preview */}
        <Preview
          device={device}
          onDevice={(d) => {
            setDevice(d);
            if (selectedId) focusSection(selectedId);
          }}
          focus={focus}
          reloadTick={reloadTick}
          className={cn('h-[calc(100dvh-15rem)] min-h-[540px] xl:flex xl:h-auto xl:min-h-0', tab === 'preview' ? 'flex' : 'hidden')}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function EditorHeader({
  section,
  index,
  total,
  onBack,
  onPrev,
  onNext,
  onToggle,
}: {
  section: HomeSection;
  index: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggle: (v: boolean) => void;
}) {
  const t = useDict(B, 'admin');
  const meta = SECTION_META[section.type];
  const Icon = meta.icon;
  return (
    <div className="sticky top-16 z-10 border-b border-line/70 bg-white/95 backdrop-blur xl:static">
      <div className="flex items-center gap-2 px-2.5 py-2.5 sm:px-3">
        <button type="button" onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-canvas hover:text-ink" aria-label={t('allSections')} title={t('allSections')}>
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset', meta.tone, !section.enabled && 'opacity-45 grayscale')}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1 pl-0.5">
          <button type="button" onClick={onBack} className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink">
            {t('allSections')} <span className="tabular-nums">· {index + 1}/{total}</span>
          </button>
          <div className="truncate text-[15px] font-bold leading-tight text-ink">{t(`type_${section.type}`)}</div>
        </div>
        <IconBtn label={t('prevSection')} onClick={onPrev} disabled={index <= 0} className="h-8 w-7">
          <ChevronLeft className="h-4 w-4" />
        </IconBtn>
        <IconBtn label={t('nextSection')} onClick={onNext} disabled={index >= total - 1} className="h-8 w-7">
          <ChevronRight className="h-4 w-4" />
        </IconBtn>
        <span className="ml-1 flex shrink-0 items-center border-l border-line/70 pl-3" title={section.enabled ? t('visible') : t('hidden')}>
          <Switch size="sm" checked={section.enabled} onChange={onToggle} />
        </span>
      </div>
      <AnimatePresence initial={false}>
        {!section.enabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2.5 border-t border-amber-600/15 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-900">
              <EyeOff className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t('hiddenNote')}</span>
              <button type="button" onClick={() => onToggle(true)} className="shrink-0 rounded-md bg-white px-2.5 py-1 text-[12px] font-bold text-amber-900 ring-1 ring-amber-600/25 hover:bg-amber-100">
                {t('showIt')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function AutosaveStatus({ saving, savedAt }: { saving: boolean; savedAt: number | null }) {
  const t = useDict(B, 'admin');
  const lang = useLang('admin');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (savedAt) setNow(Date.now());
  }, [savedAt]);

  let rel = '';
  if (savedAt) {
    const s = Math.max(0, Math.round((now - savedAt) / 1000));
    rel = s < 5 ? t('relNow') : s < 60 ? t('relSec', { n: s }) : s < 3600 ? t('relMin', { n: Math.floor(s / 60) }) : timeAgo(new Date(savedAt).toISOString(), lang);
  }

  return (
    <span className="inline-flex h-9 min-w-0 items-center gap-2 rounded-lg bg-white px-3 text-[12.5px] ring-1 ring-line" aria-live="polite">
      {saving ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
      ) : savedAt ? (
        <CloudCheck className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <Cloud className="h-4 w-4 shrink-0 text-muted" />
      )}
      <span className="truncate font-semibold text-ink">{saving ? t('savingNow') : savedAt ? t('autosaved') : t('autosaveIdle')}</span>
      {savedAt && !saving && <span className="hidden shrink-0 text-muted sm:inline">· {rel}</span>}
    </span>
  );
}
