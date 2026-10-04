import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, Check, ExternalLink, Eye, EyeOff, Infinity as InfinityIcon, Keyboard, PackageSearch, Percent, Sparkles, Star, Tag, Trash2, Wrench } from 'lucide-react';
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/Field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Card, PageHeader, SaveBar, confirmDialog } from '@/admin/components/kit';
import { L10nInput } from '@/admin/components/L10nInput';
import { GalleryField } from '@/admin/components/media';
import { pd } from '@/admin/components/products/dict';
import { FormField, NumInput, SelectInput, TextInput, ToggleRow, missingCounts } from '@/admin/components/products/parts';
import { OptionsEditor } from '@/admin/components/products/OptionsEditor';
import { SpecsEditor } from '@/admin/components/products/SpecsEditor';
import { SeoCard } from '@/admin/components/products/SeoCard';
import { ProductCard } from '@/site/components/ProductCard';
import { useDict, useL, useLang } from '@/i18n';
import { common } from '@/i18n/common';
import { useDb } from '@/store/db';
import { useCategories } from '@/store/hooks';
import { discountPct, isOnSale } from '@/lib/pricing';
import { date, money, num, perUnit, timeAgo, unitLabel } from '@/lib/format';
import type { Badge as BadgeT, Lang, Product, Unit } from '@/lib/types';
import { cn, round2, slugify, uid } from '@/lib/utils';

const blankProduct = (): Product => ({
  id: '',
  slug: '',
  sku: '',
  categoryId: '',
  name: { me: '', sq: '', en: '' },
  short: { me: '', sq: '', en: '' },
  description: { me: '', sq: '', en: '' },
  price: 0,
  salePrice: null,
  unit: 'kom',
  stock: 0,
  images: [],
  options: [],
  specs: [],
  installation: { available: false, price: 0 },
  badges: [],
  featured: false,
  status: 'active',
  quoteOnly: false,
  leadDays: 7,
  warrantyYears: 2,
  seo: {},
  createdAt: '',
  sold: 0,
});

type Errors = Partial<Record<'name' | 'price' | 'category', string>>;
const BADGES: BadgeT[] = ['new', 'sale', 'bestseller', 'premium'];
const UNITS: Unit[] = ['kom', 'm2', 'm', 'set'];

export default function ProductEdit() {
  const { id } = useParams();
  const product = useDb((s) => (id ? s.products.find((p) => p.id === id) : undefined));
  const t = useDict(pd, 'admin');
  if (id && !product) {
    return (
      <div>
        <PageHeader back="/admin/proizvodi" title={t('notFound')} />
        <Card>
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title={t('notFound')}
            text={t('notFoundText')}
            action={
              <ButtonLink to="/admin/proizvodi" variant="outline" shape="rounded" size="sm">
                {t('backToList')}
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }
  // Keyed so a freshly created product (new → /:id) remounts with its stored data.
  return <Editor key={id ?? 'new'} source={product} />;
}

function Editor({ source }: { source?: Product }) {
  const t = useDict(pd, 'admin');
  const tc = useDict(common, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const categories = useCategories();
  const allProducts = useDb((s) => s.products);
  const upsertProduct = useDb((s) => s.upsertProduct);
  const deleteProduct = useDb((s) => s.deleteProduct);
  const isNew = !source;

  const [original, setOriginal] = useState<Product>(() => (source ? structuredClone(source) : blankProduct()));
  const [draft, setDraft] = useState<Product>(original);
  const autoFor = (p: Product) => !p.slug || p.slug === slugify(p.name.me);
  const [slugAuto, setSlugAuto] = useState(() => autoFor(original));
  const [tried, setTried] = useState(false);
  const lastStock = useRef(original.stock < 999 ? original.stock : 0);
  const bypass = useRef(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft, original]);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const validate = (p: Product): Errors => {
    const e: Errors = {};
    if (!p.name.me.trim()) e.name = t('e_name');
    if (!(p.price > 0)) e.price = t('e_price');
    if (!p.categoryId || !categories.some((c) => c.id === p.categoryId)) e.category = t('e_category');
    return e;
  };
  const errors: Errors = tried ? validate(draft) : {};

  const uniqueSlug = (base: string, selfId: string) => {
    let s = base;
    let n = 2;
    while (allProducts.some((p) => p.slug === s && p.id !== selfId)) s = `${base}-${n++}`;
    return s;
  };

  /* ------------------------------ save ------------------------------ */
  const save = () => {
    setTried(true);
    const errs = validate(draft);
    if (Object.keys(errs).length) {
      toast.error(t('fixErrors'), { description: Object.values(errs).join(' ') });
      const first = errs.name ? 'sec-basic' : errs.price ? 'sec-pricing' : 'sec-org';
      document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const now = new Date().toISOString();
    const pid = draft.id || uid('p');
    const seo = { title: draft.seo?.title?.trim() || undefined, description: draft.seo?.description?.trim() || undefined };
    const next: Product = {
      ...draft,
      id: pid,
      slug: uniqueSlug(slugify(draft.slug) || slugify(draft.name.me) || pid, pid),
      sku: draft.sku.trim(),
      salePrice: draft.salePrice && draft.salePrice > 0 ? round2(draft.salePrice) : null,
      price: round2(draft.price),
      packSize: draft.unit === 'm2' ? draft.packSize || 1 : undefined,
      seo: seo.title || seo.description ? seo : undefined,
      createdAt: draft.createdAt || now,
      sold: isNew ? 0 : draft.sold,
    };
    upsertProduct(next);
    const stored = useDb.getState().products.find((p) => p.id === pid) ?? next;
    setOriginal(stored);
    setDraft(stored);
    setTried(false);
    setSlugAuto(autoFor(stored));
    toast.success(isNew ? t('created') : t('saved'), { description: stored.name.me });
    if (isNew) {
      bypass.current = true;
      navigate(`/admin/proizvodi/${pid}`, { replace: true });
    }
  };
  const discard = () => {
    setDraft(original);
    setTried(false);
    setSlugAuto(autoFor(original));
  };

  // Ctrl/Cmd + S
  const saveRef = useRef(save);
  saveRef.current = save;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirtyRef.current || !source) saveRef.current();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [source]);

  // Guard unsaved changes (in-app navigation + tab close)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !bypass.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirmDialog({ title: t('leaveTitle'), text: t('leaveText'), confirmLabel: t('leave'), danger: true }).then((ok) => (ok ? blocker.proceed() : blocker.reset()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state]);
  useEffect(() => {
    if (!dirty) return;
    const fn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [dirty]);

  const remove = async () => {
    if (!source) return;
    if (!(await confirmDialog({ title: t('deleteTitle', { name: l(original.name) }), text: t('deleteText'), confirmLabel: t('delete'), danger: true }))) return;
    bypass.current = true;
    navigate('/admin/proizvodi');
    deleteProduct(source.id);
    toast.success(t('deleted'), { description: l(original.name) });
  };

  /* ---------------------------- derived ---------------------------- */
  const installation = draft.installation ?? { available: false, price: 0 };
  const mto = draft.stock >= 999;
  const sale = isOnSale(draft);
  const saleTooHigh = draft.salePrice != null && draft.salePrice > 0 && draft.salePrice >= draft.price && draft.price > 0;
  const fmt = (v: number) => money(v, lang, { decimals: v % 1 !== 0 });
  const unitSfx = draft.unit === 'kom' || draft.unit === 'set' ? '' : ` ${perUnit(draft.unit, lang)}`;
  const translations = useMemo(() => {
    const all = [draft.name, draft.short, draft.description, ...draft.options.flatMap((o) => [o.name, ...o.values.map((v) => v.label)]), ...draft.specs.flatMap((s) => [s.label, s.value])];
    const total = all.filter((v) => v.me.trim() || v.sq.trim() || v.en.trim()).length;
    const miss = missingCounts(all);
    return { total, miss };
  }, [draft]);
  const preview = useMemo<Product>(() => ({ ...draft, id: draft.id || 'preview', name: draft.name.me.trim() ? draft.name : { me: t('f_name'), sq: t('f_name'), en: t('f_name') } }), [draft, t]);

  const warn = (text: string) => (
    <span className="inline-flex items-start gap-1 font-medium text-amber-700">
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> {text}
    </span>
  );
  const stockNote: ReactNode = mto
    ? undefined
    : draft.stock > 0 && draft.stock <= 5
      ? warn(t('lowStockWarn'))
      : draft.stock <= 0 && !isNew
        ? warn(t('outOfStockWarn'))
        : draft.unit === 'm2'
          ? t('stockPacksH')
          : undefined;

  const toggleBadge = (b: BadgeT) => set('badges', draft.badges.includes(b) ? draft.badges.filter((x) => x !== b) : BADGES.filter((x) => x === b || draft.badges.includes(x)));
  const setMto = (on: boolean) => {
    if (on) {
      if (draft.stock < 999) lastStock.current = draft.stock;
      set('stock', 999);
    } else set('stock', lastStock.current);
  };

  const headerDesc: ReactNode = isNew ? (
    t('newDesc')
  ) : (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {original.sku && <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[12px] text-ink-soft ring-1 ring-line">{original.sku}</span>}
      <span>{t('createdOn', { date: date(original.createdAt, lang) })}</span>
      {original.updatedAt && (
        <>
          <span className="text-line">•</span>
          <span>{t('updatedAgo', { ago: timeAgo(original.updatedAt, lang) })}</span>
        </>
      )}
      {original.sold > 0 && (
        <>
          <span className="text-line">•</span>
          <span>{t('soldN', { n: num(original.sold, lang) })}</span>
        </>
      )}
    </span>
  );

  return (
    <div className="pb-28">
      <PageHeader
        back="/admin/proizvodi"
        title={<span className="line-clamp-2">{l(draft.name) || t('newTitle')}</span>}
        badge={
          !isNew && (
            <Badge tone={original.status === 'active' ? 'green' : 'gray'} dot>
              {original.status === 'active' ? t('active') : t('draft')}
            </Badge>
          )
        }
        description={headerDesc}
        actions={
          <>
            {!isNew && (
              <>
                <a href={`/proizvod/${original.slug}`} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'outline', size: 'sm', shape: 'rounded' })}>
                  <ExternalLink className="h-4 w-4" /> {t('viewOnSite')}
                </a>
                <Button variant="outline" size="sm" shape="rounded" onClick={remove} icon={<Trash2 className="h-4 w-4" />} className="text-red-600 hover:border-red-300! hover:bg-red-50!">
                  <span className="max-sm:sr-only">{t('delete')}</span>
                </Button>
              </>
            )}
            <Button size="sm" shape="rounded" onClick={save} disabled={!dirty && !isNew} icon={<Check className="h-4 w-4" />}>
              {t('save')}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------------------------- main ---------------------------- */}
        <div className="min-w-0 space-y-6">
          <div id="sec-basic" className="scroll-mt-24">
            <Card title={t('c_basic')} description={t('c_basic_d')}>
              <div className="space-y-5">
                <div>
                  <L10nInput
                    label={t('f_name')}
                    required
                    value={draft.name}
                    onChange={(name) => setDraft((d) => ({ ...d, name, slug: slugAuto ? slugify(name.me) : d.slug }))}
                    className={cn(errors.name && '[&_input]:border-red-500 [&_input]:ring-4 [&_input]:ring-red-500/10')}
                  />
                  <FieldError>{errors.name}</FieldError>
                </div>
                <L10nInput label={t('f_short')} multiline rows={2} value={draft.short} onChange={(v) => set('short', v)} hint={t('f_short_h')} />
                <L10nInput label={t('f_desc')} multiline rows={8} value={draft.description} onChange={(v) => set('description', v)} hint={t('f_desc_h')} />
              </div>
            </Card>
          </div>

          <Card title={t('c_images')} description={t('c_images_d')} actions={draft.images.length > 0 && <Badge tone="gray">{draft.images.length}</Badge>}>
            <GalleryField value={draft.images} onChange={(v) => set('images', v)} />
          </Card>

          <div id="sec-pricing" className="scroll-mt-24">
            <Card title={t('c_pricing')} description={t('c_pricing_d')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('f_price')} required error={errors.price}>
                  <NumInput money zeroAsEmpty value={draft.price} onChange={(v) => set('price', v ?? 0)} suffix={`€${unitSfx}`} placeholder={lang === 'en' ? '0.00' : '0,00'} invalid={!!errors.price} className="font-semibold" />
                </FormField>
                <FormField label={t('f_sale')} hint={t('f_sale_h')}>
                  <NumInput money value={draft.salePrice ?? null} onChange={(v) => set('salePrice', v)} suffix={`€${unitSfx}`} placeholder="—" invalid={saleTooHigh} />
                </FormField>
                <FormField label={t('f_unit')}>
                  <SelectInput value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value as Unit, packSize: e.target.value === 'm2' ? d.packSize || 1 : d.packSize }))}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {t(`unit_${u}`)}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                {draft.unit === 'm2' && (
                  <FormField label={t('f_pack')} hint={t('f_pack_h')}>
                    <NumInput value={draft.packSize ?? null} onChange={(v) => set('packSize', v ?? undefined)} suffix="m²" placeholder={lang === 'en' ? '2.22' : '2,22'} />
                  </FormField>
                )}
              </div>
              {/* live price summary */}
              <div
                className={cn(
                  'mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3 text-[13px]',
                  saleTooHigh ? 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-600/20' : sale ? 'bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-600/15' : 'bg-canvas/70 text-muted',
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {saleTooHigh ? <AlertTriangle className="h-4 w-4" /> : sale ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                  {saleTooHigh
                    ? t('saleTooHigh')
                    : sale
                      ? t('discountHint', { pct: discountPct(draft), amount: fmt(round2(draft.price - (draft.salePrice as number))) })
                      : t('regularOnly')}
                </span>
                {draft.unit === 'm2' && (draft.packSize ?? 0) > 0 && draft.price > 0 && (
                  <span className="text-ink-soft sm:ml-auto">
                    {t('packHint', { size: num(draft.packSize as number, lang), price: fmt(round2((sale ? (draft.salePrice as number) : draft.price) * (draft.packSize as number))) })}
                  </span>
                )}
              </div>
            </Card>
          </div>

          <OptionsEditor value={draft.options} onChange={(v) => set('options', v)} />
          <SpecsEditor value={draft.specs} onChange={(v) => set('specs', v)} />
          <SeoCard
            draft={draft}
            slugAuto={slugAuto}
            onSlug={(s) => {
              setSlugAuto(false);
              set('slug', s.toLowerCase().replace(/\s+/g, '-'));
            }}
            onResetSlug={() => {
              setSlugAuto(true);
              set('slug', slugify(draft.name.me));
            }}
            onSeo={(seo) => set('seo', seo)}
          />
        </div>

        {/* --------------------------- sidebar --------------------------- */}
        <div className="flex min-w-0 flex-col gap-6 self-stretch">
          <Card title={t('c_status')}>
            <div className="space-y-4">
              <ToggleRow
                label={t('f_active')}
                hint={draft.status === 'active' ? t('statusActiveH') : t('statusDraftH')}
                checked={draft.status === 'active'}
                onChange={(v) => set('status', v ? 'active' : 'draft')}
                icon={draft.status === 'active' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              />
              <ToggleRow label={t('f_featured')} hint={t('f_featured_h')} checked={draft.featured} onChange={(v) => set('featured', v)} icon={<Star className={cn('h-4 w-4', draft.featured && 'fill-current')} />} />
              {translations.total > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                  <span className="text-[13px] font-semibold text-ink-soft">{t('translations')}</span>
                  <div className="flex gap-1.5">
                    {(['me', 'sq', 'en'] as Lang[]).map((lg) => {
                      const miss = translations.miss[lg];
                      return (
                        <span
                          key={lg}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                            miss ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
                          )}
                        >
                          {lg.toUpperCase()}
                          {miss ? <span className="font-semibold">{translations.total - miss}/{translations.total}</span> : <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div id="sec-org" className="scroll-mt-24">
            <Card title={t('c_org')}>
              <div className="space-y-5">
                <FormField label={t('f_category')} required error={errors.category}>
                  <SelectInput value={draft.categoryId} onChange={(e) => set('categoryId', e.target.value)} invalid={!!errors.category}>
                    <option value="" disabled>
                      {t('chooseCategory')}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {l(c.name)}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label={t('f_badges')}>
                  <div className="flex flex-wrap gap-1.5">
                    {BADGES.map((b) => {
                      const on = draft.badges.includes(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleBadge(b)}
                          className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all',
                            on ? 'bg-ink text-paper shadow-sm' : 'bg-white text-ink-soft ring-1 ring-inset ring-line hover:ring-ink/30',
                          )}
                        >
                          {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />}
                          {tc(`badge_${b}`)}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
                <div className="border-t border-line/70 pt-4">
                  <ToggleRow label={t('f_quote')} hint={t('f_quote_h')} checked={!!draft.quoteOnly} onChange={(v) => set('quoteOnly', v)} icon={<Sparkles className="h-4 w-4" />} />
                </div>
              </div>
            </Card>
          </div>

          <Card title={t('c_stock')}>
            <div className="space-y-4">
              <FormField label={t('f_sku')}>
                <TextInput value={draft.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="SC-XX-000" mono spellCheck={false} />
              </FormField>
              <FormField label={t('f_stock')} hint={stockNote}>
                {mto ? (
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-sky-600/20 bg-sky-50 px-3 text-[14px] font-semibold text-sky-800">
                    <InfinityIcon className="h-4 w-4" /> {t('f_mto')}
                  </div>
                ) : (
                  <NumInput integer zeroAsEmpty placeholder="0" value={draft.stock} onChange={(v) => set('stock', Math.min(998, v ?? 0))} suffix={draft.unit === 'm2' ? t('packsUnit') : unitLabel(draft.unit, lang)} />
                )}
              </FormField>
              <ToggleRow label={t('f_mto')} hint={t('f_mto_h')} checked={mto} onChange={setMto} icon={<InfinityIcon className="h-4 w-4" />} />
            </div>
          </Card>

          <Card title={t('c_install')}>
            <div className="space-y-4">
              <ToggleRow
                label={t('f_install')}
                hint={t('f_install_h')}
                checked={installation.available}
                onChange={(v) => set('installation', { ...installation, available: v })}
                icon={<Wrench className="h-4 w-4" />}
              />
              {installation.available && (
                <FormField label={t('f_installPrice')}>
                  <NumInput money zeroAsEmpty value={installation.price} onChange={(v) => set('installation', { ...installation, price: v ?? 0 })} suffix={`€ ${perUnit(draft.unit, lang)}`} placeholder="0" />
                </FormField>
              )}
            </div>
          </Card>

          <Card title={t('c_delivery')}>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('f_lead')}>
                <NumInput integer value={draft.leadDays ?? null} onChange={(v) => set('leadDays', v ?? undefined)} suffix={t('daysUnit')} placeholder="7" />
              </FormField>
              <FormField label={t('f_warranty')}>
                <NumInput integer value={draft.warrantyYears ?? null} onChange={(v) => set('warrantyYears', v ?? undefined)} suffix={t('yearsUnit')} placeholder="2" />
              </FormField>
            </div>
          </Card>

          <div className="lg:sticky lg:top-24">
            <Card title={t('c_preview')} description={t('c_preview_d')}>
              <div className="rounded-xl bg-paper px-6 py-6">
                <div
                  className="mx-auto max-w-[230px]"
                  onClickCapture={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <ProductCard product={preview} />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted max-md:hidden">
                <Keyboard className="h-3.5 w-3.5" /> {t('shortcutTip')}
              </p>
            </Card>
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard} />
    </div>
  );
}
