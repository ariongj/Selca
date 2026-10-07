// CSV product import (PDF p.09): field mapping, validation, duplicate-SKU report, then create/update.
import type { Category, Product, ProductStatus, Unit } from '@/lib/types';
import { fold } from '@/lib/search';
import { slugify, uid } from '@/lib/utils';
import { parseNumber } from './csv';
import { applyPricing, missingForPublish, skusOf, uniqueSlug, MAX_TRACKED, type ProductX } from './model';

export const IMPORT_FIELDS = ['name_me', 'name_sq', 'name_en', 'sku', 'barcode', 'price', 'compareAt', 'cost', 'category', 'vendor', 'tags', 'stock', 'status', 'unit', 'description', 'image'] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type MappedField = ImportField | 'ignore';

/** Header synonyms in ME / SQ / EN and Shopify's export names (folded, lower-case). */
const SYNONYMS: Record<ImportField, string[]> = {
  name_me: ['name', 'naziv', 'title', 'titulli', 'emri', 'product', 'produkti', 'proizvod', 'name me', 'naziv me', 'emri me', 'title me'],
  name_sq: ['name sq', 'naziv sq', 'emri sq', 'titulli sq', 'title sq', 'emri shqip'],
  name_en: ['name en', 'naziv en', 'emri en', 'title en', 'english name'],
  sku: ['sku', 'sifra', 'kodi', 'code', 'variant sku', 'artikal', 'kod'],
  barcode: ['barcode', 'barkod', 'barkodi', 'ean', 'gtin', 'variant barcode'],
  price: ['price', 'cijena', 'cmimi', 'variant price', 'prodajna cijena', 'cmimi i shitjes'],
  compareAt: ['compare at', 'compare at price', 'compareat', 'variant compare at price', 'cmimi referues', 'referentna cijena', 'redovna cijena', 'stara cijena', 'cmimi i vjeter'],
  cost: ['cost', 'kosto', 'kosto cope', 'cost per item', 'trosak', 'trosak kom', 'nabavna cijena', 'nabavna'],
  category: ['category', 'kategorija', 'kategoria', 'product type', 'type', 'grupa'],
  vendor: ['vendor', 'furnitori', 'dobavljac', 'brand', 'marka', 'proizvodjac', 'prodhuesi'],
  tags: ['tags', 'etiketat', 'etiketa', 'oznake', 'tagovi'],
  stock: ['stock', 'zalihe', 'stoku', 'sasia', 'qty', 'quantity', 'inventory', 'variant inventory qty', 'kolicina', 'na stanju'],
  status: ['status', 'statusi'],
  unit: ['unit', 'jedinica', 'njesia', 'jedinica mjere'],
  description: ['description', 'opis', 'pershkrimi', 'body', 'body html'],
  image: ['image', 'images', 'slika', 'slike', 'imazhi', 'imazhet', 'image src', 'foto'],
};

const norm = (h: string) =>
  fold(h)
    .replace(/[()[\]_/\-–—:.,*#€]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Best guess for each CSV column; a field is used once (first column wins). */
export function autoMap(headers: string[]): MappedField[] {
  const taken = new Set<ImportField>();
  return headers.map((h) => {
    const n = norm(h);
    let hit = IMPORT_FIELDS.find((f) => !taken.has(f) && SYNONYMS[f].includes(n));
    if (!hit) {
      const lang = /\b(sq|al|shqip)\b/.test(n) ? 'sq' : /\b(en|eng|english)\b/.test(n) ? 'en' : null;
      const bare = n.replace(/\b(me|sq|al|en|eng|shqip|english)\b/g, '').trim();
      if (lang && SYNONYMS.name_me.includes(bare)) hit = lang === 'sq' ? 'name_sq' : 'name_en';
      else hit = IMPORT_FIELDS.find((f) => !taken.has(f) && SYNONYMS[f].some((s) => s.length > 3 && (bare === s || bare.startsWith(`${s} `))));
    }
    if (hit && !taken.has(hit)) {
      taken.add(hit);
      return hit;
    }
    return 'ignore';
  });
}

export type IssueCode = 'noName' | 'noPrice' | 'badNumber' | 'negative' | 'dupFile' | 'exists' | 'noCategory' | 'unknownCategory' | 'compareLow' | 'badStatus' | 'notPublishable' | 'nameFromOther';
export interface Issue {
  code: IssueCode;
  field?: ImportField;
  value?: string;
}

export interface ImportRow {
  /** CSV line number (header = line 1) */
  line: number;
  values: Partial<Record<ImportField, string>>;
  name: string;
  sku: string;
  price: number | null;
  categoryId: string;
  errors: Issue[];
  warnings: Issue[];
  /** catalogue product with the same SKU */
  existing?: Product;
  /** line of the first row with the same SKU */
  dupOfLine?: number;
  action: 'create' | 'update' | 'skip';
}

export interface ImportOptions {
  /** what to do when the SKU already exists in the catalogue */
  onExisting: 'update' | 'skip';
  /** new products: always draft (recommended) or use the status column */
  newStatus: 'draft' | 'column';
}

const STATUS: Record<string, ProductStatus> = {
  active: 'active', aktiv: 'active', aktivan: 'active', aktivno: 'active', published: 'active', publikuar: 'active', objavljen: 'active',
  draft: 'draft', nacrt: 'draft', skica: 'draft',
  archived: 'archived', arkivuar: 'archived', arhiviran: 'archived', arhivirano: 'archived',
};
const UNITS: Record<string, Unit> = { kom: 'kom', pc: 'kom', pcs: 'kom', cope: 'kom', piece: 'kom', m2: 'm2', 'm²': 'm2', m: 'm', set: 'set', komplet: 'set' };

export function matchCategory(raw: string, categories: Category[]): string | null {
  const v = fold(raw.trim());
  if (!v) return null;
  const c = categories.find((x) => x.id === raw.trim() || x.slug === slugify(raw) || [x.name.me, x.name.sq, x.name.en].some((n) => fold(n) === v));
  return c?.id ?? null;
}

function read(row: string[], mapping: MappedField[]) {
  const values: Partial<Record<ImportField, string>> = {};
  mapping.forEach((f, i) => {
    if (f !== 'ignore' && row[i] != null && row[i] !== '' && values[f] == null) values[f] = row[i];
  });
  return values;
}

export function validateRows(rows: string[][], mapping: MappedField[], products: ProductX[], categories: Category[], opts: ImportOptions): ImportRow[] {
  const bySku = new Map<string, Product>();
  for (const p of products) for (const s of skusOf(p)) bySku.set(s.toUpperCase(), p);
  const firstLine = new Map<string, number>();

  return rows.map((row, i): ImportRow => {
    const line = i + 2;
    const values = read(row, mapping);
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    let name = values.name_me?.trim() ?? '';
    if (!name && (values.name_sq || values.name_en)) {
      name = (values.name_sq || values.name_en || '').trim();
      warnings.push({ code: 'nameFromOther' });
    }
    const sku = (values.sku ?? '').trim().toUpperCase();
    const existing = sku ? bySku.get(sku) : undefined;
    if (!name && !existing) errors.push({ code: 'noName' });

    const num = (f: ImportField) => {
      const raw = values[f];
      if (raw == null || raw === '') return null;
      const n = parseNumber(raw);
      if (n == null) errors.push({ code: 'badNumber', field: f, value: raw });
      else if (n < 0) errors.push({ code: 'negative', field: f, value: raw });
      return n;
    };
    const price = num('price');
    const compareAt = num('compareAt');
    num('cost');
    num('stock');
    if (values.price == null && !existing) errors.push({ code: 'noPrice' });
    else if (price === 0 && !existing) errors.push({ code: 'noPrice' });
    if (compareAt != null && price != null && compareAt <= price) warnings.push({ code: 'compareLow', value: values.compareAt });

    let categoryId = existing?.categoryId ?? '';
    if (values.category) {
      const hit = matchCategory(values.category, categories);
      if (hit) categoryId = hit;
      else warnings.push({ code: 'unknownCategory', value: values.category });
    } else if (!existing) warnings.push({ code: 'noCategory' });

    if (values.status && !STATUS[fold(values.status.trim())]) warnings.push({ code: 'badStatus', value: values.status });

    let dupOfLine: number | undefined;
    if (sku) {
      const first = firstLine.get(sku);
      if (first) {
        dupOfLine = first;
        errors.push({ code: 'dupFile', value: sku });
      } else firstLine.set(sku, line);
    }
    if (existing && !dupOfLine) warnings.push({ code: 'exists', value: sku });

    const action: ImportRow['action'] = errors.length ? 'skip' : existing ? (opts.onExisting === 'update' ? 'update' : 'skip') : 'create';
    if (action === 'create') {
      const wantActive = opts.newStatus === 'column' && STATUS[fold(values.status?.trim() ?? '')] === 'active';
      if (wantActive && missingForPublish({ name: { me: name, sq: '', en: '' }, categoryId, price: price ?? 0, images: values.image ? ['x'] : [] }, categories).length) {
        warnings.push({ code: 'notPublishable' });
      }
    }
    return { line, values, name: name || existing?.name.me || '', sku, price, categoryId, errors, warnings, existing, dupOfLine, action };
  });
}

const splitList = (raw?: string) =>
  (raw ?? '')
    .split(/[;|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Build the product to store for a validated row (create or update). */
export function buildProduct(row: ImportRow, opts: ImportOptions, categories: Category[], all: Pick<Product, 'id' | 'slug'>[]): ProductX {
  const v = row.values;
  const n = (f: ImportField) => (v[f] != null && v[f] !== '' ? parseNumber(v[f]) : null);
  const now = new Date().toISOString();
  const statusCol = v.status ? STATUS[fold(v.status.trim())] : undefined;
  const images = v.image ? v.image.split(/[|\s]+/).map((s) => s.trim()).filter(Boolean) : null;
  const stock = n('stock');
  const unit = v.unit ? UNITS[fold(v.unit.trim())] : undefined;

  if (row.action === 'update' && row.existing) {
    const p = row.existing as ProductX;
    const price = n('price') ?? (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
    const compare = v.compareAt != null ? n('compareAt') : p.salePrice && p.salePrice < p.price ? p.price : null;
    const next: ProductX = {
      ...p,
      ...applyPricing(price, compare),
      name: v.name_me ? { ...p.name, me: v.name_me.trim() } : p.name,
      categoryId: row.categoryId || p.categoryId,
      updatedAt: now,
    };
    if (v.name_sq) next.name = { ...next.name, sq: v.name_sq.trim() };
    if (v.name_en) next.name = { ...next.name, en: v.name_en.trim() };
    if (v.description) next.description = { ...p.description, me: v.description.trim() };
    if (v.barcode) next.barcode = v.barcode.trim();
    if (n('cost') != null) next.cost = n('cost') as number;
    if (v.vendor) next.vendor = v.vendor.trim();
    if (v.tags) next.tags = splitList(v.tags);
    if (stock != null) next.stock = Math.min(MAX_TRACKED, Math.round(stock));
    if (unit) next.unit = unit;
    if (images?.length) next.images = images;
    if (statusCol && opts.newStatus === 'column') {
      next.status = statusCol === 'active' && missingForPublish(next, categories).length ? p.status : statusCol;
    }
    return next;
  }

  const id = uid('p');
  const name = { me: row.name, sq: v.name_sq?.trim() ?? '', en: v.name_en?.trim() ?? '' };
  const base: ProductX = {
    id,
    slug: uniqueSlug(slugify(row.name) || id, id, all),
    sku: row.sku,
    categoryId: row.categoryId,
    name,
    short: { me: '', sq: '', en: '' },
    description: { me: v.description?.trim() ?? '', sq: '', en: '' },
    ...applyPricing(n('price'), n('compareAt')),
    unit: unit ?? 'kom',
    ...(unit === 'm2' ? { packSize: 1 } : {}),
    stock: stock != null ? Math.min(MAX_TRACKED, Math.round(stock)) : 0,
    images: images ?? [],
    options: [],
    specs: [],
    installation: null,
    badges: ['new'],
    featured: false,
    status: 'draft',
    quoteOnly: false,
    leadDays: 7,
    createdAt: now,
    sold: 0,
    vendor: v.vendor?.trim() || undefined,
    tags: splitList(v.tags),
    barcode: v.barcode?.trim() || undefined,
    cost: n('cost') ?? undefined,
    incoming: 0,
    unavailable: 0,
    template: 'standard',
    channels: ['online', 'pos'],
  };
  if (opts.newStatus === 'column' && statusCol) base.status = statusCol === 'active' && missingForPublish(base, categories).length ? 'draft' : statusCol;
  return base;
}

/** A ready-made sample (realistic SELCA data incl. one existing SKU, one duplicate and one error). */
export const SAMPLE_CSV = [
  'Naziv;Emri (SQ);SKU;Barkod;Kategorija;Cijena;Çmimi referues;Kosto;Zalihe;Dobavljač;Oznake',
  'Sobna vrata Arco — bijeli hrast;Derë e brendshme Arco — lis i bardhë;SC-VR-110;3891000770001;Vrata;319,00;;196,00;8;Porta Lux;sobna|hrast|novo',
  'Laminat Alpine Oak 10 mm;Laminat Alpine Oak 10 mm;SC-PD-110;3891000770002;Podovi;18,90;22,50;11,40;140;Alpe Floor;laminat|akcija',
  'Porculanska pločica Marmo Grigio 60×120;Pllakë porcelani Marmo Grigio 60×120;SC-KE-110;3891000770003;Keramika;34,90;;21,10;96;Ceramica Adria;porculan|mermer',
  'Sobna vrata Linea — rebrasti hrast;Derë e brendshme Linea — lis me brinjë;SC-VR-101;;Vrata;279,00;299,00;;14;Porta Lux;sobna|hrast',
  'Tuš kanalica Slim 80 cm;Kanal dushi Slim 80 cm;SC-KU-110;3891000770005;Kupatilo;89,00;;48,00;20;Bagno Studio;tus',
  'Tuš kanalica Slim 90 cm;Kanal dushi Slim 90 cm;SC-KU-110;3891000770006;Kupatilo;95,00;;51,00;12;Bagno Studio;tus',
  'Radna ploča Quarzo Nero;Sipërfaqe pune Quarzo Nero;SC-KH-110;3891000770007;Kuhinje;;;;4;Quarzo Lux;radna-ploca',
].join('\n');
