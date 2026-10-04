import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ArrowUpDown, Copy, ExternalLink, FolderTree, Layers, PackageSearch, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { ButtonLink, Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Card, FilterPills, PageHeader, SearchInput, Table, Td, Th, Thumb, Tr, confirmDialog } from '@/admin/components/kit';
import { AdminBadges, RowMenu, SelectInput, StockPill, TickBox, type MenuItem } from '@/admin/components/products/parts';
import { BulkBar } from '@/admin/components/products/BulkBar';
import { pd } from '@/admin/components/products/dict';
import { useDict, useL, useLang } from '@/i18n';
import { useDb } from '@/store/db';
import { useCategories } from '@/store/hooks';
import { basePrice, isOnSale } from '@/lib/pricing';
import { money, perUnit } from '@/lib/format';
import { fold } from '@/lib/search';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

type StatusF = 'all' | 'active' | 'draft';
type StockF = 'all' | 'low' | 'mto';
type SortKey = 'newest' | 'name' | 'price' | 'stock' | 'sold';
const DEFAULT_DIR: Record<SortKey, 'asc' | 'desc'> = { newest: 'desc', name: 'asc', price: 'asc', stock: 'asc', sold: 'desc' };
const COLLATOR: Record<string, string> = { me: 'sr-Latn', sq: 'sq', en: 'en' };

/** Price with sale + struck regular price and a unit suffix for m² / m. */
function PriceCell({ p, inline }: { p: Product; inline?: boolean }) {
  const lang = useLang('admin');
  const t = useDict(pd, 'admin');
  const sale = isOnSale(p);
  const price = basePrice(p);
  const suffix = p.unit === 'm2' || p.unit === 'm' ? <span className="ml-0.5 text-[12px] font-medium text-muted">{perUnit(p.unit, lang)}</span> : null;
  const fmt = (v: number) => money(v, lang, { decimals: v % 1 !== 0 });
  return (
    <div className={cn('whitespace-nowrap tabular-nums', inline && 'flex flex-wrap items-baseline gap-x-2')}>
      <div>
        <span className={cn('font-bold', sale ? 'text-brand-700' : 'text-ink')}>{fmt(price)}</span>
        {suffix}
      </div>
      {sale && <div className="text-[12px] text-muted line-through">{fmt(p.price)}</div>}
      {p.quoteOnly && !sale && <div className="text-[12px] font-medium text-oak">{t('onRequest')}</div>}
    </div>
  );
}

function SortTh({ label, k, sort, dir, onSort, className }: { label: ReactNode; k: SortKey; sort: SortKey; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void; className?: string }) {
  const on = sort === k;
  const Icon = on ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Th className={className} aria-sort={on ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" onClick={() => onSort(k)} className={cn('group inline-flex items-center gap-1 uppercase tracking-[0.12em] hover:text-ink', on && 'text-ink')}>
        {label}
        <Icon className={cn('h-3 w-3 transition-opacity', on ? 'opacity-100' : 'opacity-0 group-hover:opacity-60')} />
      </button>
    </Th>
  );
}

export default function Products() {
  const t = useDict(pd, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const products = useDb((s) => s.products);
  const upsertProduct = useDb((s) => s.upsertProduct);
  const deleteProduct = useDb((s) => s.deleteProduct);
  const duplicateProduct = useDb((s) => s.duplicateProduct);
  const categories = useCategories();
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filters live in the URL so "back" from the editor keeps them.
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('kategorija') ?? 'all';
  const status = (params.get('status') ?? 'all') as StatusF;
  const stock = (params.get('zalihe') ?? 'all') as StockF;
  const sort = (params.get('sort') ?? 'newest') as SortKey;
  const dir = (params.get('dir') ?? DEFAULT_DIR[sort]) as 'asc' | 'desc';
  const setParam = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === '' || v === 'all') n.delete(k);
          else n.set(k, v);
        }
        return n;
      },
      { replace: true },
    );
  const setSort = (k: SortKey, d?: 'asc' | 'desc') => setParam({ sort: k === 'newest' ? null : k, dir: d && d !== DEFAULT_DIR[k] ? d : null });
  const onHeaderSort = (k: SortKey) => setSort(k, sort === k ? (dir === 'asc' ? 'desc' : 'asc') : DEFAULT_DIR[k]);
  const filtersActive = !!q || cat !== 'all' || status !== 'all' || stock !== 'all';
  const clearFilters = () => setParam({ q: null, kategorija: null, status: null, zalihe: null });

  // Everything except the status filter (so the status pills show live counts).
  const base = useMemo(() => {
    const terms = fold(q.trim()).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (cat !== 'all' && p.categoryId !== cat) return false;
      if (stock === 'low' && !(p.stock <= 5)) return false;
      if (stock === 'mto' && p.stock < 999) return false;
      if (terms.length) {
        const hay = fold(`${p.name.me} ${p.name.sq} ${p.name.en} ${p.sku}`);
        if (!terms.every((term) => hay.includes(term))) return false;
      }
      return true;
    });
  }, [products, q, cat, stock]);

  const list = useMemo(() => {
    const out = base.filter((p) => status === 'all' || p.status === status);
    const sign = dir === 'asc' ? 1 : -1;
    const coll = new Intl.Collator(COLLATOR[lang] ?? 'en');
    const cmp: Record<SortKey, (a: Product, b: Product) => number> = {
      newest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      name: (a, b) => coll.compare(l(a.name), l(b.name)),
      price: (a, b) => basePrice(a) - basePrice(b),
      stock: (a, b) => a.stock - b.stock,
      sold: (a, b) => a.sold - b.sold,
    };
    return [...out].sort((a, b) => sign * cmp[sort](a, b));
  }, [base, status, sort, dir, l, lang]);

  const counts = useMemo(
    () => ({ all: base.length, active: base.filter((p) => p.status === 'active').length, draft: base.filter((p) => p.status === 'draft').length }),
    [base],
  );
  const lowCount = useMemo(() => products.filter((p) => p.stock <= 5).length, [products]);

  // Selection (pruned to products that still exist and are visible)
  const [sel, setSel] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(list.map((p) => p.id)), [list]);
  const selected = useMemo(() => [...sel].filter((id) => visibleIds.has(id)), [sel, visibleIds]);
  const allOn = list.length > 0 && selected.length === list.length;
  const someOn = selected.length > 0 && !allOn;
  const toggle = (id: string, on: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const toggleAll = () => setSel(allOn ? new Set() : new Set(list.map((p) => p.id)));

  /* ---------------------------- actions ---------------------------- */
  const setStatus = (p: Product, active: boolean) => {
    upsertProduct({ ...p, status: active ? 'active' : 'draft' });
    toast.success(active ? t('nowActive', { name: l(p.name) }) : t('nowDraft', { name: l(p.name) }));
  };
  const duplicate = (p: Product) => {
    const id = duplicateProduct(p.id);
    if (!id) return;
    toast.success(t('duplicated'), { description: l(p.name) });
    navigate(`/admin/proizvodi/${id}`);
  };
  const remove = async (p: Product) => {
    if (!(await confirmDialog({ title: t('deleteTitle', { name: l(p.name) }), text: t('deleteText'), confirmLabel: t('delete'), danger: true }))) return;
    deleteProduct(p.id);
    toast.success(t('deleted'), { description: l(p.name) });
  };
  const bulkStatus = (active: boolean) => {
    const st = active ? 'active' : 'draft';
    const targets = products.filter((p) => selected.includes(p.id) && p.status !== st);
    targets.forEach((p) => upsertProduct({ ...p, status: st }));
    toast.success(active ? t('bulkActivated', { n: selected.length }) : t('bulkDeactivated', { n: selected.length }));
    setSel(new Set());
  };
  const bulkDelete = async () => {
    const n = selected.length;
    if (!(await confirmDialog({ title: t('bulkDeleteTitle', { n }), text: t('deleteText'), confirmLabel: t('delete'), danger: true }))) return;
    selected.forEach((id) => deleteProduct(id));
    toast.success(t('bulkDeleted', { n }));
    setSel(new Set());
  };
  const menuFor = (p: Product): MenuItem[] => [
    { label: t('edit'), icon: Pencil, onSelect: () => navigate(`/admin/proizvodi/${p.id}`) },
    { label: t('duplicate'), icon: Copy, onSelect: () => duplicate(p) },
    { label: t('viewOnSite'), icon: ExternalLink, onSelect: () => window.open(`/proizvod/${p.slug}`, '_blank', 'noopener') },
    { label: t('delete'), icon: Trash2, onSelect: () => remove(p), danger: true, divider: true },
  ];
  const open = (p: Product) => navigate(`/admin/proizvodi/${p.id}`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const catLabel = (p: Product) => {
    const c = catById.get(p.categoryId);
    return c ? l(c.name) : t('noCategory');
  };

  return (
    <div className="pb-24">
      <PageHeader
        title={t('title')}
        badge={<Badge tone="gray">{products.length}</Badge>}
        description={t('subtitle')}
        actions={
          <ButtonLink to="/admin/proizvodi/novi" shape="rounded" size="sm" icon={<Plus className="h-4 w-4" />}>
            {t('newProduct')}
          </ButtonLink>
        }
      />

      <Card padded={false}>
        {/* Toolbar */}
        <div className="space-y-3 border-b border-line/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills<StatusF>
              value={status}
              onChange={(v) => setParam({ status: v })}
              options={[
                { id: 'all', label: t('st_all'), count: counts.all },
                { id: 'active', label: t('st_active'), count: counts.active },
                { id: 'draft', label: t('st_draft'), count: counts.draft },
              ]}
            />
            {lowCount > 0 && stock !== 'low' && (
              <button
                type="button"
                onClick={() => setParam({ zalihe: 'low' })}
                className="inline-flex h-9 items-center gap-2 self-start rounded-lg bg-amber-50 px-3 text-[13px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 transition hover:bg-amber-100 lg:self-auto"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t('lowStock')}
                <span className="rounded-md bg-white/70 px-1.5 text-[11px] tabular-nums">{lowCount}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
            <SearchInput value={q} onChange={(v) => setParam({ q: v })} placeholder={t('searchPh')} className="col-span-2 md:flex-1" />
            <SelectInput value={cat} onChange={(e) => setParam({ kategorija: e.target.value })} active={cat !== 'all'} icon={<FolderTree className="h-4 w-4" />} className="md:w-48" aria-label={t('col_category')}>
              <option value="all">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {l(c.name)}
                </option>
              ))}
            </SelectInput>
            <SelectInput value={stock} onChange={(e) => setParam({ zalihe: e.target.value })} active={stock !== 'all'} icon={<Layers className="h-4 w-4" />} className="md:w-52" aria-label={t('col_stock')}>
              <option value="all">{t('stock_all')}</option>
              <option value="low">{t('stock_low')}</option>
              <option value="mto">{t('stock_mto')}</option>
            </SelectInput>
            <SelectInput value={sort} onChange={(e) => setSort(e.target.value as SortKey)} icon={<ArrowUpDown className="h-4 w-4" />} className="col-span-2 md:w-48" aria-label="Sort">
              <option value="newest">{t('sort_newest')}</option>
              <option value="name">{t('sort_name')}</option>
              <option value="price">{t('sort_price')}</option>
              <option value="stock">{t('sort_stock')}</option>
              <option value="sold">{t('sort_sold')}</option>
            </SelectInput>
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title={t('emptyTitle')}
            text={t('emptyText')}
            action={
              filtersActive && (
                <Button variant="outline" shape="rounded" size="sm" onClick={clearFilters}>
                  {t('clearFilters')}
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th className="w-10 pr-0!">
                    <TickBox checked={allOn} indeterminate={someOn} onChange={toggleAll} label={t('selectAll')} />
                  </Th>
                  <SortTh label={t('col_product')} k="name" sort={sort} dir={dir} onSort={onHeaderSort} />
                  <Th className="max-xl:hidden">{t('col_category')}</Th>
                  <SortTh label={t('col_price')} k="price" sort={sort} dir={dir} onSort={onHeaderSort} />
                  <SortTh label={t('col_stock')} k="stock" sort={sort} dir={dir} onSort={onHeaderSort} />
                  <Th>{t('col_status')}</Th>
                  <Th className="max-lg:hidden">{t('col_badges')}</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <Tr key={p.id} onClick={() => open(p)} className={cn('group', on && 'bg-brand-50/50 hover:bg-brand-50/70!')}>
                      <Td className="w-10 pr-0!" onClick={stop}>
                        <TickBox checked={on} onChange={(v) => toggle(p.id, v)} label={t('selectRow')} />
                      </Td>
                      <Td>
                        <div className="flex min-w-0 items-center gap-3">
                          <Thumb src={p.images[0]} />
                          <div className="min-w-0">
                            <Link to={`/admin/proizvodi/${p.id}`} onClick={stop} className="block max-w-[320px] truncate font-semibold text-ink hover:text-brand-700">
                              {l(p.name) || '—'}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                              <span className="font-mono tracking-tight">{p.sku || '—'}</span>
                              <span className="xl:hidden">· {catLabel(p)}</span>
                              {p.featured && (
                                <span className="inline-flex items-center gap-1 text-amber-700" title={t('featured')}>
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-[13px] text-ink-soft max-xl:hidden">{catLabel(p)}</Td>
                      <Td>
                        <PriceCell p={p} />
                      </Td>
                      <Td>
                        <StockPill product={p} />
                        {p.sold > 0 && <div className="mt-1 pl-1 text-[11.5px] text-muted tabular-nums">{t('soldN', { n: p.sold })}</div>}
                      </Td>
                      <Td onClick={stop}>
                        <div className="flex items-center gap-2">
                          <Switch size="sm" checked={p.status === 'active'} onChange={(v) => setStatus(p, v)} />
                          <span className={cn('text-[13px] font-medium', p.status === 'active' ? 'text-ink' : 'text-muted')}>{p.status === 'active' ? t('active') : t('draft')}</span>
                        </div>
                      </Td>
                      <Td className="max-lg:hidden">
                        <AdminBadges product={p} className="max-w-[190px]" empty={<span className="text-muted/60">—</span>} />
                      </Td>
                      <Td className="w-12 text-right" onClick={stop}>
                        <RowMenu items={menuFor(p)} label={t('moreActions')} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>

            {/* Mobile cards */}
            <div className="md:hidden">
              <div className="flex items-center gap-3 border-b border-line/70 bg-canvas/50 px-4 py-2.5">
                <TickBox checked={allOn} indeterminate={someOn} onChange={toggleAll} label={t('selectAll')} />
                <span className="text-[12px] font-semibold text-muted">{t('selectAll')}</span>
              </div>
              <ul className="divide-y divide-line/70">
                {list.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <li key={p.id} onClick={() => open(p)} className={cn('flex cursor-pointer gap-3 px-4 py-4 transition-colors active:bg-canvas', on && 'bg-brand-50/50')}>
                      <div className="pt-0.5" onClick={stop}>
                        <TickBox checked={on} onChange={(v) => toggle(p.id, v)} label={t('selectRow')} />
                      </div>
                      <Thumb src={p.images[0]} className="h-[68px] w-[68px] rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink">{l(p.name) || '—'}</div>
                            <div className="mt-0.5 truncate text-[12px] text-muted">
                              <span className="font-mono">{p.sku}</span> · {catLabel(p)}
                            </div>
                          </div>
                          <div className="-mr-1.5 -mt-1" onClick={stop}>
                            <RowMenu items={menuFor(p)} label={t('moreActions')} />
                          </div>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                          <PriceCell p={p} inline />
                          <StockPill product={p} />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2" onClick={stop}>
                            <Switch size="sm" checked={p.status === 'active'} onChange={(v) => setStatus(p, v)} />
                            <span className={cn('text-[12.5px] font-medium', p.status === 'active' ? 'text-ink' : 'text-muted')}>{p.status === 'active' ? t('active') : t('draft')}</span>
                          </div>
                          <AdminBadges product={p} className="justify-end" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-[13px] text-muted">
              <span>{t('showing', { n: list.length, total: products.length })}</span>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="font-semibold text-ink-soft hover:text-ink">
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </>
        )}
      </Card>

      <BulkBar count={selected.length} onActivate={() => bulkStatus(true)} onDeactivate={() => bulkStatus(false)} onDelete={bulkDelete} onClear={() => setSel(new Set())} />
    </div>
  );
}
