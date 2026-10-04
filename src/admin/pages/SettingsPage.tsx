import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useBlocker } from 'react-router';
import { toast } from 'sonner';
import {
  Building2, CircleCheck, CreditCard, Database, Keyboard, Languages, Megaphone, Palette, Phone, Save, Search, ShieldCheck, TriangleAlert, Truck,
} from 'lucide-react';
import { PageHeader, SaveBar, confirmDialog } from '@/admin/components/kit';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { useDict } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { applyBrand, isHex } from '@/lib/color';
import type { Settings } from '@/lib/types';
import { cn, sleep } from '@/lib/utils';
import { T, type Key } from '@/admin/components/settings/i18n';
import { EXAMPLE_FIELDS, SECTION_KEYS, isEmail, isExample, type Errors, type SectionId, type SetSetting } from '@/admin/components/settings/fields';
import { CompanySection, ContactSection, PaymentsSection, SalesSection } from '@/admin/components/settings/BusinessSections';
import { AdminSection, AnnouncementsSection, AppearanceSection, LanguagesSection, SeoSection } from '@/admin/components/settings/SiteSections';
import { DemoDataSection } from '@/admin/components/settings/DemoDataSection';

const SECTIONS: { id: SectionId; icon: ComponentType<{ className?: string }>; label: Key }[] = [
  { id: 'company', icon: Building2, label: 's_company' },
  { id: 'contact', icon: Phone, label: 's_contact' },
  { id: 'sales', icon: Truck, label: 's_sales' },
  { id: 'payments', icon: CreditCard, label: 's_payments' },
  { id: 'languages', icon: Languages, label: 's_languages' },
  { id: 'announcements', icon: Megaphone, label: 's_announcements' },
  { id: 'appearance', icon: Palette, label: 's_appearance' },
  { id: 'seo', icon: Search, label: 's_seo' },
  { id: 'admin', icon: ShieldCheck, label: 's_admin' },
  { id: 'data', icon: Database, label: 's_data' },
];

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function validate(s: Settings, t: (k: Key) => string): Errors {
  const e: Errors = {};
  if (!s.companyName.trim()) e.companyName = t('required');
  if (!isEmail(s.email)) e.email = t('invalidEmail');
  if (!isEmail(s.adminEmail)) e.adminEmail = t('invalidEmail');
  if (!(s.vatRate >= 0 && s.vatRate <= 100)) e.vatRate = t('invalidRate');
  if (!(s.freeShippingThreshold >= 0)) e.freeShippingThreshold = t('invalidAmount');
  for (const z of s.shippingZones) if (!z.name.trim()) e[`zone_${z.id}`] = t('required');
  return e;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const SHORTCUT = [isMac ? '⌘' : 'Ctrl', 'S'];

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-[5px] border border-line bg-white px-1 font-sans text-[10.5px] font-bold text-ink-soft shadow-[0_1px_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

const Shortcut = () => (
  <span className="inline-flex items-center gap-0.5 align-middle">
    {SHORTCUT.map((k) => (
      <Kbd key={k}>{k}</Kbd>
    ))}
  </span>
);

export default function SettingsPage() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const saved = useDb((s) => s.settings);
  const updateSettings = useDb((s) => s.updateSettings);

  /* ---------------- local draft + dirty detection ---------------- */
  const [base, setBase] = useState(saved);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dirty = useMemo(() => !same(draft, base), [draft, base]);
  const latest = useRef({ draft, dirty });
  useEffect(() => {
    latest.current = { draft, dirty };
  });

  // Saved settings changed elsewhere (another tab) — follow them while nothing is being edited.
  useEffect(() => {
    if (saved !== base && !latest.current.dirty) {
      setBase(saved);
      setDraft(saved);
    }
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback<SetSetting>((key, value) => setDraft((d) => ({ ...d, [key]: value })), []);
  const replaceAll = useCallback((next: Settings) => {
    setBase(next);
    setDraft(next);
    setShowErrors(false);
  }, []);

  const errors = useMemo(() => validate(draft, t), [draft, t]);

  /* ---------------- brand colour: live preview, restored if unsaved ---------------- */
  useEffect(() => {
    if (isHex(draft.brandColor)) applyBrand(draft.brandColor);
  }, [draft.brandColor]);
  useEffect(() => () => applyBrand(useDb.getState().settings.brandColor), []);

  /* ---------------- save / discard ---------------- */
  const save = async () => {
    if (!latest.current.dirty) {
      toast(t('noChanges'));
      return;
    }
    if (Object.keys(validate(latest.current.draft, t)).length) {
      setShowErrors(true);
      toast.error(t('fixErrors'));
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[data-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    setSaving(true);
    await sleep(320);
    updateSettings(latest.current.draft);
    replaceAll(useDb.getState().settings);
    setSaving(false);
    toast.success(ta('saved'));
  };

  const discard = () => {
    replaceAll(base);
    toast(t('discarded'));
  };

  // Ctrl/Cmd + S
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Guard against losing edits: browser reload/close + in-app navigation.
  useEffect(() => {
    if (!dirty) return;
    const fn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  });
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    void confirmDialog({ title: t('leaveTitle'), text: t('leaveText'), confirmLabel: t('leaveConfirm'), danger: true }).then((ok) => {
      const b = blockerRef.current;
      if (ok) b.proceed?.();
      else b.reset?.();
    });
  }, [blocker.state]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- demo placeholders + per-section state ---------------- */
  const examples = useMemo(() => EXAMPLE_FIELDS.filter((f) => isExample(draft[f.key] as string | undefined)), [draft]);
  const exampleSections = useMemo(() => new Set(examples.map((f) => f.section)), [examples]);
  const dirtySections = useMemo(
    () => new Set(SECTIONS.filter((s) => SECTION_KEYS[s.id].some((k) => !same(draft[k], base[k]))).map((s) => s.id)),
    [draft, base],
  );

  const goFirstExample = () => {
    const el = document.querySelector<HTMLElement>('[data-example="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.focus({ preventScroll: true }), 450);
  };

  /* ---------------- section nav (scroll spy) ---------------- */
  const [active, setActive] = useState<SectionId>('company');
  const lockUntil = useRef(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      if (Date.now() < lockUntil.current) return;
      // A card becomes "current" once its header reaches the upper third of the viewport.
      const offset = Math.max(window.innerWidth >= 1280 ? 130 : 170, window.innerHeight * 0.3);
      let cur: SectionId = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(`s-${s.id}`);
        if (el && el.getBoundingClientRect().top - offset <= 0) cur = s.id;
      }
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = SECTIONS[SECTIONS.length - 1].id;
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (id: SectionId) => {
    setActive(id);
    lockUntil.current = Date.now() + 900;
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionProps = { s: draft, set, errors: showErrors ? errors : {} };
  const [tipA, tipB] = t('tip', { key: '\u0000' }).split('\u0000');

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <>
            <span title={`${tipA}${SHORTCUT.join('+')}${tipB}`} className="mr-1 hidden items-center gap-1.5 text-[12px] font-medium text-muted md:inline-flex">
              <Shortcut />
            </span>
            <Button size="sm" shape="rounded" icon={<Save className="h-4 w-4" />} disabled={!dirty} loading={saving} onClick={() => void save()}>
              {ta('save')}
            </Button>
          </>
        }
      />

      {examples.length > 0 ? (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <TriangleAlert className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2 className="text-[14.5px] font-bold text-amber-950">{t('calloutTitle')}</h2>
                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-900">{t('calloutCount', { n: examples.length })}</span>
              </div>
              <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-amber-900/80">{t('calloutText')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" shape="rounded" className="self-start sm:self-center" onClick={goFirstExample}>
            {t('calloutGo')}
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <CircleCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14.5px] font-bold text-emerald-950">{t('calloutOkTitle')}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/80">{t('calloutOkText')}</p>
          </div>
        </div>
      )}

      <div className="xl:grid xl:grid-cols-[216px_minmax(0,1fr)] xl:gap-10">
        {/* Desktop: sticky in-page nav */}
        <aside className="hidden xl:block">
          <nav className="sticky top-24" aria-label={t('sections')}>
            <div className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted/80">{t('sections')}</div>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(s.id)}
                      aria-current={on ? 'true' : undefined}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors',
                        on ? 'bg-white text-ink shadow-[0_1px_2px_rgb(28_26_23/0.06)] ring-1 ring-line/80' : 'text-muted hover:bg-white/60 hover:text-ink',
                      )}
                    >
                      <s.icon className={cn('h-4 w-4 shrink-0 transition-colors', on ? 'text-brand-600' : 'text-muted/80 group-hover:text-ink-soft')} />
                      <span className="flex-1 truncate">{t(s.label)}</span>
                      {exampleSections.has(s.id) && <span title={t('exampleDot')} className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                      {dirtySections.has(s.id) && <span title={t('unsavedDot')} className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-line/80 bg-white/50 px-3 py-2.5 text-[12px] leading-relaxed text-muted">
              <Keyboard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {tipA}
                <Shortcut />
                {tipB}
              </span>
            </p>
          </nav>
        </aside>

        <div className="min-w-0">
          {/* Mobile / tablet: sticky section picker */}
          <div className="sticky top-16 z-20 -mx-4 mb-3 bg-canvas/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:hidden">
            <Select aria-label={t('jumpTo')} value={active} onChange={(e) => goTo(e.target.value as SectionId)} className="font-semibold">
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.label)}
                  {dirtySections.has(s.id) ? ' •' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-6 pb-28">
            <CompanySection {...sectionProps} />
            <ContactSection {...sectionProps} />
            <SalesSection {...sectionProps} />
            <PaymentsSection {...sectionProps} />
            <LanguagesSection {...sectionProps} />
            <AnnouncementsSection {...sectionProps} />
            <AppearanceSection {...sectionProps} savedBrand={saved.brandColor} />
            <SeoSection {...sectionProps} />
            <AdminSection {...sectionProps} />
            <DemoDataSection onReplaced={replaceAll} />
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={discard} />
    </>
  );
}
