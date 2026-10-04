import type { Category, L10n, Lang, Product, Unit } from '@/lib/types';
import { basePrice, isOnSale } from '@/lib/pricing';

/* ------------------------------------------------------------------ */
/* Sorting (synced to ?sort=…)                                         */
/* ------------------------------------------------------------------ */
export type SortKey = 'popular' | 'new' | 'priceAsc' | 'priceDesc' | 'name';

export const SORTS: { key: SortKey; param: string | null }[] = [
  { key: 'popular', param: null },
  { key: 'new', param: 'najnovije' },
  { key: 'priceAsc', param: 'cijena-rastuce' },
  { key: 'priceDesc', param: 'cijena-opadajuce' },
  { key: 'name', param: 'naziv' },
];

export const sortFromParam = (v: string | null): SortKey => SORTS.find((s) => s.param === v)?.key ?? 'popular';
export const sortToParam = (k: SortKey) => SORTS.find((s) => s.key === k)?.param ?? null;

const COLLATOR: Record<Lang, string> = { me: 'sr-Latn', sq: 'sq', en: 'en' };

export function sortProducts(list: Product[], sort: SortKey, name: (v: L10n) => string, lang: Lang) {
  const out = [...list];
  switch (sort) {
    case 'new':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'priceAsc':
      return out.sort((a, b) => basePrice(a) - basePrice(b));
    case 'priceDesc':
      return out.sort((a, b) => basePrice(b) - basePrice(a));
    case 'name': {
      const coll = new Intl.Collator(COLLATOR[lang], { sensitivity: 'base' });
      return out.sort((a, b) => coll.compare(name(a.name), name(b.name)));
    }
    default:
      return out.sort((a, b) => b.sold - a.sold || Number(b.featured) - Number(a.featured));
  }
}

/* ------------------------------------------------------------------ */
/* Product facets                                                      */
/* ------------------------------------------------------------------ */
export type Avail = 'stock' | 'order';
export type UnitKind = 'piece' | 'area' | 'length';

/** Ready to ship from stock vs. made to order (windows, kitchens…; stock ≥ 999 marks "unlimited / produced on demand"). */
export const availOf = (p: Product): Avail => (!p.quoteOnly && p.stock > 0 && p.stock < 999 ? 'stock' : 'order');
export const unitKind = (u: Unit): UnitKind => (u === 'm2' ? 'area' : u === 'm' ? 'length' : 'piece');
export const hasInstall = (p: Product) => !!p.installation?.available;

export const AVAILS: Avail[] = ['stock', 'order'];
export const UNIT_KINDS: UnitKind[] = ['piece', 'area', 'length'];

/* ------------------------------------------------------------------ */
/* Colour families — swatch values aggregated into shopper-friendly    */
/* groups ("Crna mat", "Crna RAL 9005" → Crna). Label keywords first,  */
/* the swatch hex as a fallback for anything typed in the CMS.         */
/* ------------------------------------------------------------------ */
export type ColorFamily = 'white' | 'cream' | 'grey' | 'anthracite' | 'black' | 'lightwood' | 'darkwood' | 'gold' | 'metal' | 'green' | 'blue' | 'red';

export const FAMILY_ORDER: ColorFamily[] = ['white', 'cream', 'grey', 'anthracite', 'black', 'lightwood', 'darkwood', 'gold', 'metal', 'green', 'blue', 'red'];

export const FAMILY_SWATCH: Record<ColorFamily, string> = {
  white: '#f5f3ef',
  cream: '#e9dcc4',
  grey: '#c3c3bf',
  anthracite: '#3a3e41',
  black: '#1b1b1b',
  lightwood: 'linear-gradient(135deg,#dcb688 0%,#c08f5c 55%,#a8784a 100%)',
  darkwood: 'linear-gradient(135deg,#8f6142 0%,#6b4630 55%,#45301f 100%)',
  gold: 'linear-gradient(135deg,#ecd29b 0%,#c39f62 50%,#9b7a43 100%)',
  metal: 'linear-gradient(135deg,#f4f5f6 0%,#c4c8cc 45%,#8f959a 100%)',
  green: '#6f7f69',
  blue: '#3f5f8a',
  red: '#9a2e2e',
};

const RULES: [RegExp, ColorFamily][] = [
  [/zlat|gold|brass|mesing|bronz|tunxh|\bari\b/, 'gold'],
  [/\bhrom|chrome|\bkrom|inox|inoks|čelik|celik|steel|nikl|nickel|srebr|silver/, 'metal'],
  [/\borah|walnut|\barre\b|\bnoce\b|tamn\w* hrast|dark oak|dimljen|smoked|wenge|venge/, 'darkwood'],
  [/hrast|\boak\b|\bdrv|wood|bukv|beech|jasen|\blis\b/, 'lightwood'],
  [/antracit|anthracite|grafit|graphite/, 'anthracite'],
  [/\bcrn|black|\bner[oa]\b|zez/, 'black'],
  [/\bbijel|white|bianc|krečenj|krecenj|paint|bardh/, 'white'],
  [/\bkrem\b|cream|bež|beige|ivory|bezh/, 'cream'],
  [/\bsiv|grey|gray|\bgri\b|beton|concrete/, 'grey'],
  [/\bzelen|green|žalfij|zalfij|\bsage\b|maslin|olive|gjelb/, 'green'],
  [/\bplav|blue|navy|\bblu\b/, 'blue'],
  [/\bcrven|\bred\b|bordo|terakot|kuq/, 'red'],
];

/** Every family a text names ("Sivi hrast" → grey + light wood; "Tamni hrast" → dark wood only). */
function familiesIn(text: string): ColorFamily[] {
  const s = text.toLowerCase();
  const out = RULES.filter(([re]) => re.test(s)).map(([, f]) => f);
  return out.includes('darkwood') ? out.filter((f) => f !== 'lightwood') : out;
}

function familyFromHex(hex: string | undefined): ColorFamily | null {
  const m = hex?.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  if (l > 0.9) return 'white';
  if (l < 0.16) return 'black';
  if (s < 0.12) return l < 0.35 ? 'anthracite' : 'grey';
  if (h >= 18 && h < 52) return l > 0.8 ? 'cream' : l < 0.4 ? 'darkwood' : 'lightwood';
  if (h >= 70 && h < 170) return 'green';
  if (h >= 170 && h < 260) return 'blue';
  if (h < 18 || h >= 330) return 'red';
  return null;
}

export function colorFamilies(label: L10n, hex?: string): ColorFamily[] {
  const found = familiesIn(`${label.me} | ${label.en} | ${label.sq}`);
  if (found.length) return found;
  const fam = familyFromHex(hex);
  return fam ? [fam] : [];
}

/**
 * Colour families a product comes in: from its swatch options, or — for
 * products without swatches — from its name ("… — bijela", "Grey Stone Oak").
 */
export function productColors(p: Product): ColorFamily[] {
  const out = new Set<ColorFamily>();
  const swatches = p.options.filter((o) => o.type === 'swatch');
  for (const o of swatches) for (const v of o.values) colorFamilies(v.label, v.swatch).forEach((f) => out.add(f));
  if (!swatches.length) familiesIn(`${p.name.me} | ${p.name.en}`).forEach((f) => out.add(f));
  return FAMILY_ORDER.filter((f) => out.has(f));
}

/* ------------------------------------------------------------------ */
/* Filter state + matching                                             */
/* ------------------------------------------------------------------ */
export interface Filters {
  /** Category ids — only used on the all-products view */
  cats: string[];
  /** [min, max] in EUR; null = full range */
  price: [number, number] | null;
  avail: Avail[];
  install: boolean;
  colors: ColorFamily[];
  units: UnitKind[];
}

export const EMPTY_FILTERS: Filters = { cats: [], price: null, avail: [], install: false, colors: [], units: [] };

export type Facet = 'cats' | 'price' | 'avail' | 'sale' | 'install' | 'colors' | 'units';

export interface MatchCtx {
  sale: boolean;
  colors: Map<string, ColorFamily[]>;
}

export function passes(p: Product, f: Filters, ctx: MatchCtx, skip?: Facet) {
  if (skip !== 'cats' && f.cats.length && !f.cats.includes(p.categoryId)) return false;
  if (skip !== 'sale' && ctx.sale && !isOnSale(p)) return false;
  if (skip !== 'price' && f.price) {
    const v = basePrice(p);
    if (v < f.price[0] || v > f.price[1]) return false;
  }
  if (skip !== 'avail' && f.avail.length && !f.avail.includes(availOf(p))) return false;
  if (skip !== 'install' && f.install && !hasInstall(p)) return false;
  if (skip !== 'colors' && f.colors.length && !(ctx.colors.get(p.id) ?? []).some((c) => f.colors.includes(c))) return false;
  if (skip !== 'units' && f.units.length && !f.units.includes(unitKind(p.unit))) return false;
  return true;
}

export function activeCount(f: Filters, sale: boolean) {
  return f.cats.length + (f.price ? 1 : 0) + f.avail.length + (f.install ? 1 : 0) + f.colors.length + f.units.length + (sale ? 1 : 0);
}

export interface FacetData {
  cats: { id: string; count: number }[];
  avail: Record<Avail, number>;
  sale: number;
  install: number;
  colors: { id: ColorFamily; count: number }[];
  units: { id: UnitKind; count: number }[];
  /** Effective prices of products matching every filter except price — feeds the histogram */
  prices: number[];
  bounds: [number, number];
}

/**
 * Facet counts, each computed against every *other* active filter — so a
 * count always tells the shopper how many results that choice would give.
 */
export function computeFacets(scope: Product[], f: Filters, ctx: MatchCtx, categories: Category[]): FacetData {
  const count = (skip: Facet, pred: (p: Product) => boolean) => scope.reduce((n, p) => (passes(p, f, ctx, skip) && pred(p) ? n + 1 : n), 0);

  const famPresent = new Set<ColorFamily>();
  const unitPresent = new Set<UnitKind>();
  for (const p of scope) {
    (ctx.colors.get(p.id) ?? []).forEach((c) => famPresent.add(c));
    unitPresent.add(unitKind(p.unit));
  }

  const priced = (ctx.sale ? scope.filter(isOnSale) : scope).map(basePrice);
  const lo = priced.length ? Math.floor(Math.min(...priced)) : 0;
  const hi = priced.length ? Math.ceil(Math.max(...priced)) : 0;

  return {
    cats: categories.map((c) => ({ id: c.id, count: count('cats', (p) => p.categoryId === c.id) })),
    avail: { stock: count('avail', (p) => availOf(p) === 'stock'), order: count('avail', (p) => availOf(p) === 'order') },
    sale: count('sale', isOnSale),
    install: count('install', hasInstall),
    colors: FAMILY_ORDER.filter((c) => famPresent.has(c)).map((c) => ({ id: c, count: count('colors', (p) => (ctx.colors.get(p.id) ?? []).includes(c)) })),
    units: UNIT_KINDS.filter((u) => unitPresent.has(u)).map((u) => ({ id: u, count: count('units', (p) => unitKind(p.unit) === u) })),
    prices: scope.filter((p) => passes(p, f, ctx, 'price')).map(basePrice),
    bounds: [lo, Math.max(hi, lo + 1)],
  };
}

/* ------------------------------------------------------------------ */
/* Price slider scale — prices span 10 € (m² of laminate) to ~5 000 €  */
/* (a kitchen), so the slider uses a power curve when the range is     */
/* wide, giving the cheap end enough travel.                           */
/* ------------------------------------------------------------------ */
export function priceScale(lo: number, hi: number) {
  const span = Math.max(1, hi - lo);
  const ratio = hi / Math.max(lo, 1);
  const k = ratio > 12 ? 2.4 : ratio > 4 ? 1.6 : 1;
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  return {
    toValue: (pos: number) => lo + span * Math.pow(clamp01(pos), k),
    toPos: (v: number) => Math.pow(clamp01((v - lo) / span), 1 / k),
  };
}

/** Round slider values to steps a person would type: 1 € → 5 € → 10 €. */
export function nicePrice(v: number) {
  if (v < 100) return Math.round(v);
  if (v < 1000) return Math.round(v / 5) * 5;
  return Math.round(v / 10) * 10;
}
