// CMS v2 demo data — collections, discounts, offers, placements, staff, appointments, segments,
// inventory, purchasing, drafts, returns, quotes, menus, content models and the audit log.
// Everything is relative to `now` so the demo always looks current, and coherent with the
// SELCA catalogue (doors, windows, floors, tiles, bathroom, kitchens) and Montenegro.
import type {
  AuditEntry, Booking, Collection, ContentModel, Discount, DraftOrder, HomeSection, HomeVersion, Inquiry, InventoryMovement, L10n,
  Menu, Offer, Order, Placement, Product, Project, PurchaseOrder, Quote, ReturnRequest, Segment, Service, Staff,
} from '@/lib/types';
import { defaultOptions } from '@/lib/pricing';
import { refundForLines } from '@/lib/orders';
import { round2 } from '@/lib/utils';

const T = (me: string, sq: string, en: string): L10n => ({ me, sq, en });
const E = (): L10n => ({ me: '', sq: '', en: '' });
const DAY = 86400000;
const iso = (now: Date, days: number, hours = 0) => new Date(now.getTime() + days * DAY + hours * 3600000).toISOString();

/* ================================================================== */
/* Products — tags, vendors, costs, barcodes, incoming, one archived   */
/* ================================================================== */
const COST_FACTOR: Record<string, number> = { 'cat-vrata': 0.58, 'cat-prozori': 0.55, 'cat-podovi': 0.6, 'cat-keramika': 0.57, 'cat-kupatilo': 0.56, 'cat-kuhinje': 0.52 };

const EXTRAS: Record<string, { tags: string[]; vendor: string; incoming?: number; unavailable?: number; channels?: ('online' | 'pos')[] }> = {
  'p-vrata-linea': { tags: ['sobna', 'hrast', 'novo'], vendor: 'Porta Lux' },
  'p-vrata-classica': { tags: ['sobna', 'bijela'], vendor: 'Porta Lux' },
  'p-vrata-flat': { tags: ['sobna', 'orah', 'premium'], vendor: 'Porta Lux', incoming: 10 },
  'p-vrata-loft': { tags: ['klizna', 'industrijski'], vendor: 'Porta Lux' },
  'p-vrata-vetro': { tags: ['staklo', 'novo'], vendor: 'Porta Lux', unavailable: 1 },
  'p-vrata-guardian': { tags: ['sigurnosna', 'ulazna', 'rc3'], vendor: 'SecurDoor', incoming: 4 },
  'p-kvaka-linea': { tags: ['okov', 'pribor'], vendor: 'Maniglia', incoming: 60 },
  'p-pvc-bijeli': { tags: ['pvc', 'energetska-efikasnost'], vendor: 'Profilo 76', channels: ['online'] },
  'p-pvc-antracit': { tags: ['pvc', 'antracit'], vendor: 'Profilo 76', channels: ['online'] },
  'p-alu-slim': { tags: ['alu', 'premium'], vendor: 'AluMare', channels: ['online'] },
  'p-hs-panorama': { tags: ['alu', 'klizna', 'po-mjeri'], vendor: 'AluMare', channels: ['online'] },
  'p-skure': { tags: ['alu', 'zastita-od-sunca'], vendor: 'AluMare', channels: ['online'] },
  'p-laminat-nordic': { tags: ['laminat', 'svijetlo'], vendor: 'Alpe Floor' },
  'p-laminat-rustic': { tags: ['laminat', 'akcija'], vendor: 'Alpe Floor' },
  'p-laminat-grey': { tags: ['laminat', 'akcija'], vendor: 'Alpe Floor', incoming: 80 },
  'p-parket-natur': { tags: ['parket', 'akcija', 'podno-grijanje'], vendor: 'Hrast & Co.' },
  'p-parket-bianco': { tags: ['parket', 'podno-grijanje'], vendor: 'Hrast & Co.' },
  'p-spc-aquastop': { tags: ['vinil', 'vodootporno', 'akcija'], vendor: 'AquaStep' },
  'p-calacatta': { tags: ['porculan', 'mermer'], vendor: 'Ceramica Adria' },
  'p-statuario': { tags: ['porculan', 'mermer'], vendor: 'Ceramica Adria' },
  'p-beton': { tags: ['porculan', 'beton', 'terasa'], vendor: 'Ceramica Adria' },
  'p-metro': { tags: ['zidna', 'kupatilo'], vendor: 'Ceramica Adria' },
  'p-lisboa': { tags: ['dekor'], vendor: 'Ceramica Adria' },
  'p-terrazzo': { tags: ['teraco'], vendor: 'Ceramica Adria' },
  'p-kada-nera': { tags: ['kada', 'premium'], vendor: 'Pietra Bagno' },
  'p-kada-ellipse': { tags: ['kada'], vendor: 'Bagno Studio', unavailable: 1 },
  'p-walkin': { tags: ['tus', 'staklo'], vendor: 'Bagno Studio' },
  'p-tus-rain': { tags: ['tus', 'termostat'], vendor: 'Bagno Studio' },
  'p-umivaonik-stone': { tags: ['umivaonik', 'kamen'], vendor: 'Pietra Bagno' },
  'p-slavina-nero': { tags: ['baterija', 'crna'], vendor: 'Bagno Studio' },
  'p-ogledalo-luna': { tags: ['ogledalo', 'led'], vendor: 'Bagno Studio' },
  'p-ormaric-oak': { tags: ['namjestaj', 'hrast'], vendor: 'Bagno Studio' },
  'p-kuhinja-bianca': { tags: ['kuhinja', 'po-mjeri'], vendor: 'SELCA radionica', channels: ['online'] },
  'p-kuhinja-noce': { tags: ['kuhinja', 'po-mjeri', 'premium'], vendor: 'SELCA radionica', channels: ['online'] },
  'p-kuhinja-nero': { tags: ['kuhinja', 'po-mjeri'], vendor: 'SELCA radionica', channels: ['online'] },
  'p-kvarc': { tags: ['radna-ploca', 'kvarc'], vendor: 'Quarzo Lux' },
  'p-slavina-pro': { tags: ['baterija', 'crna'], vendor: 'Bagno Studio' },
};

/** EAN-13 with the Montenegrin GS1 prefix 389 and a valid check digit. */
function ean13(n: number) {
  const body = `389${String(100000000 + n * 7919).slice(-9)}`;
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

/** Adds CMS v2 fields to the catalogue (cost, vendor, tags, barcode, incoming, channels, template). */
export function enrichProducts(products: Product[]): Product[] {
  return products.map((p, i): Product => {
    const x = EXTRAS[p.id];
    return {
      ...p,
      cost: round2(p.price * (COST_FACTOR[p.categoryId] ?? 0.6)),
      vendor: x?.vendor,
      tags: x?.tags ?? [],
      barcode: ean13(i + 1),
      incoming: x?.incoming ?? 0,
      unavailable: x?.unavailable ?? 0,
      template: p.quoteOnly ? 'quote' : 'standard',
      channels: x?.channels ?? ['online', 'pos'],
    };
  });
}

/** Discontinued line: archived after it had sales (orders keep their copy). */
export const ARCHIVED_PRODUCT = 'p-statuario';

/* ================================================================== */
/* Collections                                                         */
/* ================================================================== */
export function buildCollections(now: Date): Collection[] {
  return [
    {
      id: 'col-podovi-akcija',
      slug: 'podovi-na-akciji',
      title: T('Podovi na akciji', 'Dysheme në ofertë', 'Flooring on sale'),
      description: T(
        'Laminat, parket i SPC vinil iz jesenje akcije — popust se obračunava automatski u korpi.',
        'Laminat, parket dhe vinil SPC nga oferta e vjeshtës — zbritja llogaritet automatikisht në shportë.',
        'Laminate, parquet and SPC vinyl from the autumn sale — the discount is applied automatically in the cart.',
      ),
      image: '/images/cat/podovi.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [
        { field: 'category', op: 'eq', value: 'cat-podovi' },
        { field: 'tag', op: 'eq', value: 'akcija' },
      ],
      sort: 'price-asc',
      published: true,
      seo: { title: 'Podovi na akciji — SELCA', description: 'Laminat, parket i vinil po akcijskim cijenama uz stručno postavljanje.' },
      createdAt: iso(now, -9),
    },
    {
      id: 'col-premium-kupatilo',
      slug: 'premium-kupatilo',
      title: T('Premium kupatilo', 'Banjo premium', 'Premium bathroom'),
      description: T(
        'Samostojeće kade, walk-in tuševi i namještaj iznad 300 € — za kupatilo kao mali spa.',
        'Vaska të lira, dushe walk-in dhe mobilje mbi 300 € — për një banjo si spa e vogël.',
        'Freestanding tubs, walk-in showers and furniture above €300 — for a bathroom like a little spa.',
      ),
      image: '/images/hero/bath.webp',
      kind: 'smart',
      productIds: [],
      match: 'all',
      rules: [
        { field: 'category', op: 'eq', value: 'cat-kupatilo' },
        { field: 'price', op: 'gt', value: '300' },
      ],
      sort: 'price-desc',
      published: true,
      createdAt: iso(now, -40),
    },
    {
      id: 'col-jesenja-akcija',
      slug: 'jesenja-akcija',
      title: T('Jesenja akcija', 'Oferta e vjeshtës', 'Autumn sale'),
      description: T('Ručno odabrani proizvodi sa sniženom cijenom ove jeseni.', 'Produkte të përzgjedhura me çmim të ulur këtë vjeshtë.', 'Hand-picked products with reduced prices this autumn.'),
      image: '/images/cat/keramika.webp',
      kind: 'manual',
      productIds: ['p-laminat-nordic', 'p-beton', 'p-vrata-classica', 'p-kada-ellipse', 'p-tus-rain', 'p-slavina-nero', 'p-vrata-guardian'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: true,
      createdAt: iso(now, -12),
    },
    {
      id: 'col-bestseleri',
      slug: 'bestseleri',
      title: T('Bestseleri', 'Më të shiturat', 'Bestsellers'),
      description: T('Proizvodi koje naši kupci najčešće biraju.', 'Produktet që klientët tanë zgjedhin më shpesh.', 'The products our customers choose most often.'),
      image: '/images/p/laminat-nordic-2.webp',
      kind: 'manual',
      productIds: ['p-laminat-nordic', 'p-calacatta', 'p-parket-natur', 'p-beton', 'p-pvc-bijeli', 'p-slavina-nero', 'p-vrata-classica', 'p-walkin'],
      match: 'all',
      rules: [],
      sort: 'bestselling',
      published: true,
      createdAt: iso(now, -60),
    },
    {
      id: 'col-novi-stan',
      slug: 'za-novi-stan',
      title: T('Za novi stan', 'Për banesën e re', 'For your new apartment'),
      description: T(
        'Sve što treba za useljenje — od vrata i prozora do poda, kupatila i kuhinje.',
        'Gjithçka për t’u vendosur — nga dyert dhe dritaret te dyshemeja, banjo dhe kuzhina.',
        'Everything you need to move in — from doors and windows to floors, bathroom and kitchen.',
      ),
      image: '/images/projects/stan-hrast.webp',
      kind: 'manual',
      productIds: ['p-vrata-linea', 'p-pvc-bijeli', 'p-laminat-rustic', 'p-calacatta', 'p-walkin', 'p-slavina-nero', 'p-ogledalo-luna', 'p-kuhinja-bianca'],
      match: 'all',
      rules: [],
      sort: 'manual',
      published: false,
      createdAt: iso(now, -2),
    },
  ];
}

/* ================================================================== */
/* Discounts — all 4 types, code + automatic, every lifecycle state    */
/* ================================================================== */
const DOORS = ['p-vrata-linea', 'p-vrata-classica', 'p-vrata-flat', 'p-vrata-loft', 'p-vrata-vetro', 'p-vrata-guardian'];
const ALL_LINES = { scope: 'all' as const, ids: [] };
const NO_MIN = { type: 'none' as const, value: 0 };
const EVERYONE = { type: 'all' as const };

/** End of the autumn floor sale — same moment as the homepage promo countdown. */
export const autumnSaleEnd = (now: Date) => new Date(now.getTime() + 12 * DAY + 5 * 3600000).toISOString();

export function buildDiscounts(now: Date): Discount[] {
  return [
    {
      id: 'd-selca10',
      title: 'Dobrodošlica — SELCA10',
      publicTitle: T('Dobrodošlica −10%', 'Mirëseardhje −10%', 'Welcome −10%'),
      kind: 'order',
      method: 'code',
      code: 'SELCA10',
      valueType: 'percent',
      value: 10,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 100 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: false,
      startsAt: iso(now, -120),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -120),
      tags: ['dobrodoslica'],
    },
    {
      id: 'd-podovi15',
      title: 'Jesen — podovi −15% (automatski)',
      publicTitle: T('Jesenja akcija podova −15%', 'Oferta e vjeshtës për dysheme −15%', 'Autumn flooring sale −15%'),
      kind: 'products',
      method: 'auto',
      valueType: 'percent',
      value: 15,
      appliesTo: { scope: 'collections', ids: ['col-podovi-akcija'] },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -9),
      endsAt: autumnSaleEnd(now),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -10),
      tags: ['jesen', 'podovi'],
    },
    {
      id: 'd-vrata-kvaka',
      title: 'Kupi 3 vrata — kvaka gratis',
      publicTitle: T('Uz 3 sobna vrata kvaka gratis', 'Me 3 dyer doreza falas', 'Buy 3 doors, get a handle free'),
      kind: 'bxgy',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: NO_MIN,
      bxgy: { buyIds: DOORS, buyScope: 'products', buyQty: 3, getIds: ['p-kvaka-linea'], getScope: 'products', getQty: 1, getType: 'free', getValue: 100, maxUses: 4 },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, -30),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -31),
      tags: ['vrata'],
    },
    {
      id: 'd-dostava300',
      title: 'Besplatna dostava preko 300 €',
      publicTitle: T('Besplatna dostava preko 300 €', 'Transport falas mbi 300 €', 'Free delivery over €300'),
      kind: 'shipping',
      method: 'auto',
      valueType: 'percent',
      value: 100,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 300 },
      shipping: { zoneIds: [] },
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: false },
      startsAt: iso(now, -200),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -200),
    },
    {
      id: 'd-jesen25',
      title: 'Jesen — 25 € preko 250 €',
      publicTitle: T('Jesenji popust 25 €', 'Zbritje vjeshte 25 €', 'Autumn €25 off'),
      kind: 'order',
      method: 'code',
      code: 'JESEN25',
      valueType: 'fixed',
      value: 25,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 250 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      usageLimit: 200,
      startsAt: iso(now, -10),
      endsAt: iso(now, 20),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -11),
      tags: ['jesen'],
    },
    {
      id: 'd-bf-vrata',
      title: 'Black Friday — vrata −20%',
      publicTitle: T('Black Friday: vrata −20%', 'Black Friday: dyer −20%', 'Black Friday: doors −20%'),
      kind: 'products',
      method: 'auto',
      valueType: 'percent',
      value: 20,
      appliesTo: { scope: 'products', ids: DOORS },
      minimum: NO_MIN,
      audience: EVERYONE,
      combines: { products: true, order: true, shipping: true },
      startsAt: iso(now, 21),
      endsAt: iso(now, 28),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -2),
      tags: ['black-friday', 'vrata'],
    },
    {
      id: 'd-ljeto15',
      title: 'Ljetna rasprodaja — LJETO15',
      publicTitle: T('Ljetna rasprodaja −15%', 'Ulje vere −15%', 'Summer sale −15%'),
      kind: 'order',
      method: 'code',
      code: 'LJETO15',
      valueType: 'percent',
      value: 15,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 200 },
      audience: EVERYONE,
      combines: { products: true, order: false, shipping: true },
      startsAt: iso(now, -75),
      endsAt: iso(now, -25),
      status: 'active',
      uses: 0,
      createdAt: iso(now, -76),
      tags: ['ljeto'],
    },
    {
      id: 'd-vip50',
      title: 'VIP kupci — 50 € preko 600 €',
      publicTitle: T('VIP popust 50 €', 'Zbritje VIP 50 €', 'VIP €50 off'),
      kind: 'order',
      method: 'code',
      code: 'VIP50',
      valueType: 'fixed',
      value: 50,
      appliesTo: ALL_LINES,
      minimum: { type: 'amount', value: 600 },
      audience: { type: 'segment', segmentId: 'seg-vip' },
      combines: { products: true, order: false, shipping: true },
      oncePerCustomer: true,
      startsAt: iso(now, 0),
      status: 'draft',
      uses: 0,
      createdAt: iso(now, -1),
      tags: ['vip'],
    },
  ];
}

/** Recount uses from the generated orders (cancelled orders excluded). */
export function countDiscountUses(discounts: Discount[], orders: Order[]): Discount[] {
  const uses = new Map<string, number>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const a of o.discounts ?? []) uses.set(a.id, (uses.get(a.id) ?? 0) + 1);
  }
  return discounts.map((d) => ({ ...d, uses: uses.get(d.id) ?? 0 }));
}

/* ================================================================== */
/* Offers (p.30 mock-up: active / active / draft / scheduled)          */
/* ================================================================== */
const ZERO = { visits: 0, ctaClicks: 0, codeUses: 0, orders: 0, revenue: 0, discountTotal: 0 };

export function buildOffers(now: Date, discounts: Discount[], orders: Order[]): Offer[] {
  const d = (id: string) => discounts.find((x) => x.id === id)!;
  const metrics = (discountId: string, visitsPerOrder: number, baseVisits: number) => {
    const list = orders.filter((o) => o.status !== 'cancelled' && o.discounts?.some((a) => a.id === discountId));
    const discountTotal = round2(list.reduce((s, o) => s + (o.discounts?.find((a) => a.id === discountId)?.amount ?? 0), 0));
    const visits = baseVisits + list.length * visitsPerOrder;
    return {
      visits,
      ctaClicks: Math.round(visits * 0.17),
      codeUses: list.filter((o) => o.discounts?.some((a) => a.id === discountId && a.code)).length,
      orders: list.length,
      revenue: round2(list.reduce((s, o) => s + o.total, 0)),
      discountTotal,
    };
  };
  return [
    {
      id: 'of-jesen',
      slug: 'jesenja-akcija-podova',
      name: T('Jesenja akcija podova', 'Oferta e vjeshtës për dysheme', 'Autumn flooring sale'),
      description: T(
        'Automatski −15% na odabrane laminate, parket i SPC vinil. Prikazuje se u banneru kataloga, traci obavještenja i promo bloku početne.',
        'Automatikisht −15% për laminate, parket dhe vinil SPC të përzgjedhur. Shfaqet në banerin e katalogut, shiritin e njoftimeve dhe bllokun promo të ballinës.',
        'Automatic −15% on selected laminate, parquet and SPC vinyl. Shown in the catalogue banner, announcement bar and homepage promo block.',
      ),
      status: 'active',
      startsAt: d('d-podovi15').startsAt,
      endsAt: d('d-podovi15').endsAt,
      discountId: 'd-podovi15',
      collectionId: 'col-podovi-akcija',
      productIds: [],
      badge: T('Akcija −15%', 'Ofertë −15%', 'Sale −15%'),
      image: '/images/cat/podovi.webp',
      landing: {
        title: T('Jesen je za *nove podove*', 'Vjeshta është për *dysheme të reja*', 'Autumn is for *new floors*'),
        text: T(
          'Do kraja akcije odabrani podovi su 15% jeftiniji — popust vidite odmah u korpi, bez koda. Mjerenje je besplatno.',
          'Deri në fund të ofertës dyshemetë e përzgjedhura janë 15% më lirë — zbritjen e shihni menjëherë në shportë, pa kod. Matja është falas.',
          'Until the sale ends, selected floors are 15% off — you see the discount straight away in the cart, no code needed. Measuring is free.',
        ),
      },
      placements: ['banner', 'announcement', 'home-block'],
      owner: 'st-drita',
      utm: 'utm_source=selca&utm_medium=banner&utm_campaign=jesen-podovi',
      metrics: metrics('d-podovi15', 38, 260),
      createdAt: iso(now, -10),
    },
    {
      id: 'of-dobrodoslica',
      slug: 'dobrodoslica-selca10',
      name: T('Dobrodošlica — SELCA10', 'Mirëseardhje — SELCA10', 'Welcome — SELCA10'),
      description: T(
        'Kod SELCA10 daje 10% na narudžbe od 100 € (poslije popusta na proizvode). Kombinuje se sa popustima na proizvode i dostavu.',
        'Kodi SELCA10 jep 10% për porosi nga 100 € (pas zbritjeve të produkteve). Kombinohet me zbritje produktesh dhe dërgese.',
        'Code SELCA10 gives 10% on orders from €100 (after product discounts). Combines with product and shipping discounts.',
      ),
      status: 'active',
      startsAt: d('d-selca10').startsAt,
      discountId: 'd-selca10',
      productIds: [],
      badge: T('−10% uz SELCA10', '−10% me SELCA10', '−10% with SELCA10'),
      image: '/images/misc/about.webp',
      landing: {
        title: T('Dobro došli u *SELCA*', 'Mirë se vini në *SELCA*', 'Welcome to *SELCA*'),
        text: T(
          'Za prvu kupovinu unesite kod SELCA10 u korpi i ostvarite 10% popusta na narudžbe od 100 €.',
          'Për blerjen e parë shkruani kodin SELCA10 në shportë dhe përfitoni 10% zbritje për porosi nga 100 €.',
          'For your first purchase enter code SELCA10 in the cart and get 10% off orders from €100.',
        ),
      },
      placements: ['banner', 'home-block'],
      owner: 'st-drita',
      utm: 'utm_source=selca&utm_medium=landing&utm_campaign=dobrodoslica',
      metrics: metrics('d-selca10', 46, 900),
      createdAt: iso(now, -120),
    },
    {
      id: 'of-kupatilo',
      slug: 'nova-kupatila-2026',
      name: T('Nova kupatila 2026', 'Banjot e reja 2026', 'New bathrooms 2026'),
      description: T(
        'Editorijalna kampanja bez popusta: nova kolekcija premium kupatila na početnoj i u slideru.',
        'Fushatë editoriale pa zbritje: koleksioni i ri i banjove premium në ballinë dhe në slider.',
        'Editorial campaign without a discount: the new premium bathroom collection on the homepage and slider.',
      ),
      status: 'draft',
      startsAt: iso(now, 7),
      collectionId: 'col-premium-kupatilo',
      productIds: [],
      badge: T('Novo', 'E re', 'New'),
      image: '/images/projects/kupatilo-travertin.webp',
      landing: {
        title: T('Kupatilo kao *mali spa*', 'Banjo si një *spa e vogël*', 'A bathroom like a *little spa*'),
        text: T('Samostojeće kade, walk-in tuševi i kamen — pogledajte novu kolekciju.', 'Vaska të lira, dushe walk-in dhe gur — shikoni koleksionin e ri.', 'Freestanding tubs, walk-in showers and stone — see the new collection.'),
      },
      placements: ['hero', 'home-block'],
      owner: 'st-ana',
      utm: 'utm_source=selca&utm_medium=hero&utm_campaign=kupatila-2026',
      metrics: { ...ZERO },
      createdAt: iso(now, -1),
    },
    {
      id: 'of-blackfriday',
      slug: 'black-friday-vrata',
      name: T('Black Friday — vrata −20%', 'Black Friday — dyer −20%', 'Black Friday — doors −20%'),
      description: T(
        'Planirano: sedam dana −20% na sva sobna, klizna i sigurnosna vrata. Slajd i traka se uključuju sami sa početkom akcije.',
        'E planifikuar: shtatë ditë −20% për të gjitha dyert. Slide-i dhe shiriti aktivizohen vetë me fillimin e ofertës.',
        'Scheduled: seven days of −20% on all doors. The slide and bar switch on by themselves when the sale starts.',
      ),
      status: 'active',
      startsAt: d('d-bf-vrata').startsAt,
      endsAt: d('d-bf-vrata').endsAt,
      discountId: 'd-bf-vrata',
      productIds: DOORS,
      badge: T('Black Friday −20%', 'Black Friday −20%', 'Black Friday −20%'),
      image: '/images/hero/arch.webp',
      landing: {
        title: T('Black Friday: *sva vrata −20%*', 'Black Friday: *të gjitha dyert −20%*', 'Black Friday: *all doors −20%*'),
        text: T('Sedam dana, besplatno mjerenje i ugradnja našim timovima.', 'Shtatë ditë, matje falas dhe montim nga ekipet tona.', 'Seven days, free measuring and fitting by our own crews.'),
      },
      placements: ['hero', 'announcement'],
      owner: 'st-drita',
      utm: 'utm_source=selca&utm_medium=hero&utm_campaign=black-friday-vrata',
      metrics: { ...ZERO },
      createdAt: iso(now, -2),
    },
  ];
}

/* ================================================================== */
/* Placements — hero slides, catalogue banners, announcement bar       */
/* ================================================================== */
export function buildPlacements(home: HomeSection[]): Placement[] {
  const hero = home.find((h) => h.type === 'hero');
  const slides = hero && hero.type === 'hero' ? hero.data.slides : [];
  const base = { textAlign: 'left' as const, status: 'active' as const };
  const fromHero: Placement[] = slides.map((s, i) => ({
    ...base,
    id: `pl-${s.id}`,
    kind: 'slide',
    position: 'home-hero',
    name: [`Hero — dnevni boravak`, `Hero — kuhinje po mjeri`, `Hero — kupatila`][i] ?? `Hero ${i + 1}`,
    eyebrow: s.eyebrow,
    title: s.title,
    subtitle: s.subtitle,
    cta: s.primary,
    secondary: s.secondary,
    image: s.image,
    alt: [
      T('Svijetli dnevni boravak sa hrastovim podom', 'Dhomë ndenjeje e ndritshme me dysheme lisi', 'Bright living room with oak flooring'),
      T('Kuhinja po mjeri sa ostrvom', 'Kuzhinë me porosi me ishull', 'Made-to-measure kitchen with island'),
      T('Kupatilo sa samostojećom kadom', 'Banjo me vaskë të lirë', 'Bathroom with freestanding tub'),
    ][i] ?? E(),
    overlay: 35,
    order: i + 1,
  }));
  const ann = (id: string, order: number, title: L10n, offerId?: string, href = ''): Placement => ({
    ...base,
    id,
    kind: 'announcement',
    position: 'bar',
    name: `Traka — ${title.me.slice(0, 32)}`,
    eyebrow: E(),
    title,
    subtitle: E(),
    cta: { label: E(), href },
    image: '',
    alt: E(),
    overlay: 0,
    order,
    ...(offerId ? { offerId } : {}),
  });
  return [
    ...fromHero,
    {
      ...base,
      id: 'pl-s4',
      kind: 'slide',
      position: 'home-hero',
      name: 'Hero — Black Friday vrata',
      eyebrow: T('Black Friday', 'Black Friday', 'Black Friday'),
      title: T('Sva vrata *−20%*.', 'Të gjitha dyert *−20%*.', 'All doors *−20%*.'),
      subtitle: T(
        'Sobna, klizna i sigurnosna vrata uz besplatno mjerenje i ugradnju — samo sedam dana.',
        'Dyer të brendshme, rrëshqitëse dhe sigurie me matje dhe montim falas — vetëm shtatë ditë.',
        'Interior, sliding and security doors with free measuring and fitting — seven days only.',
      ),
      cta: { label: T('Pogledajte vrata', 'Shikoni dyert', 'Shop doors'), href: '/proizvodi/vrata' },
      secondary: { label: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'), href: '/#mjerenje' },
      image: '/images/hero/arch.webp',
      alt: T('Moderan ulaz sa drvenim vratima', 'Hyrje moderne me derë druri', 'Modern entrance with a wooden door'),
      overlay: 45,
      offerId: 'of-blackfriday',
      order: 4,
    },
    {
      ...base,
      id: 'pl-s5',
      kind: 'slide',
      position: 'home-hero',
      status: 'draft',
      name: 'Hero — nova kupatila (draft)',
      eyebrow: T('Novo u salonu', 'E re në sallon', 'New in the showroom'),
      title: T('Kamen, svjetlo i *tišina*.', 'Gur, dritë dhe *qetësi*.', 'Stone, light and *calm*.'),
      subtitle: T('Nova kolekcija premium kupatila — od kade do posljednje slavine.', 'Koleksioni i ri i banjove premium — nga vaska te rubineti i fundit.', 'The new premium bathroom collection — from the tub to the last tap.'),
      cta: { label: T('Pogledajte kolekciju', 'Shikoni koleksionin', 'See the collection'), href: '/proizvodi/kupatilo' },
      image: '/images/projects/kupatilo-travertin.webp',
      alt: T('Kupatilo od travertina sa walk-in tušem', 'Banjo me travertin dhe dush walk-in', 'Travertine bathroom with walk-in shower'),
      textAlign: 'center',
      overlay: 40,
      offerId: 'of-kupatilo',
      order: 5,
    },
    {
      ...base,
      id: 'pl-b1',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalog — jesenja akcija podova',
      eyebrow: T('Jesenja akcija', 'Oferta e vjeshtës', 'Autumn sale'),
      title: T('Odabrani podovi *−15%*', 'Dysheme të përzgjedhura *−15%*', 'Selected floors *−15%*'),
      subtitle: T('Popust se obračunava automatski u korpi — bez koda.', 'Zbritja llogaritet automatikisht në shportë — pa kod.', 'The discount is applied automatically in the cart — no code needed.'),
      cta: { label: T('Pogledajte podove', 'Shikoni dyshemetë', 'Shop flooring'), href: '/proizvodi/podovi' },
      image: '/images/cat/podovi.webp',
      alt: T('Hrastov laminat u dnevnom boravku', 'Laminat lisi në dhomën e ndenjes', 'Oak laminate in a living room'),
      overlay: 30,
      offerId: 'of-jesen',
      order: 1,
    },
    {
      ...base,
      id: 'pl-b2',
      kind: 'banner',
      position: 'catalog',
      name: 'Katalog — SELCA10 dobrodošlica',
      eyebrow: T('Za prvu kupovinu', 'Për blerjen e parë', 'For your first order'),
      title: T('−10% uz kod *SELCA10*', '−10% me kodin *SELCA10*', '−10% with code *SELCA10*'),
      subtitle: T('Za narudžbe od 100 € — kombinuje se sa besplatnom dostavom.', 'Për porosi nga 100 € — kombinohet me transportin falas.', 'On orders from €100 — combines with free delivery.'),
      cta: { label: T('Kupujte sada', 'Blini tani', 'Shop now'), href: '/proizvodi' },
      image: '/images/misc/about.webp',
      alt: T('SELCA salon', 'Salloni SELCA', 'SELCA showroom'),
      overlay: 40,
      offerId: 'of-dobrodoslica',
      order: 2,
    },
    ann('pl-a1', 1, T('Besplatno mjerenje i stručna ugradnja širom Crne Gore', 'Matje falas dhe montim profesional në gjithë Malin e Zi', 'Free measurement & expert installation across Montenegro'), undefined, '/#mjerenje'),
    ann('pl-a2', 2, T('Besplatna dostava za narudžbe preko 300 €', 'Transport falas për porosi mbi 300 €', 'Free delivery on orders over €300'), undefined, '/stranica/dostava-i-ugradnja'),
    ann('pl-a3', 3, T('Jesenja akcija: odabrani podovi −15%, automatski u korpi', 'Oferta e vjeshtës: dysheme të përzgjedhura −15%, automatikisht në shportë', 'Autumn sale: selected floors −15%, applied in the cart'), 'of-jesen', '/proizvodi/podovi'),
    ann('pl-a4', 4, T('Black Friday: sva vrata −20% — samo sedam dana', 'Black Friday: të gjitha dyert −20% — vetëm shtatë ditë', 'Black Friday: all doors −20% — seven days only'), 'of-blackfriday', '/proizvodi/vrata'),
  ];
}

/* ================================================================== */
/* Staff, services, bookings                                           */
/* ================================================================== */
export const STAFF: Staff[] = [
  { id: 'st-gent', name: 'Gent Lulaj', email: 'gent@selca.me', role: 'owner', color: '#1a1a1a', active: true, phone: '+382 67 123 456', title: T('Vlasnik', 'Pronar', 'Owner') },
  { id: 'st-arta', name: 'Arta Gjokaj', email: 'arta@selca.me', role: 'manager', color: '#6b5b95', active: true, phone: '+382 67 210 334', title: T('Menadžerka prodaje', 'Menaxhere shitjesh', 'Sales manager') },
  { id: 'st-drita', name: 'Drita Camaj', email: 'drita@selca.me', role: 'marketing', color: '#b5651d', active: true, title: T('Marketing', 'Marketing', 'Marketing') },
  { id: 'st-milica', name: 'Milica Vuković', email: 'info@selca.me', role: 'reception', color: '#2f7d6d', active: true, phone: '+382 20 610 200', title: T('Recepcija salona', 'Recepsioni i sallonit', 'Showroom reception') },
  { id: 'st-blerim', name: 'Blerim Dedaj', email: 'blerim@selca.me', role: 'orders', color: '#3d5a80', active: true, phone: '+382 69 330 118', title: T('Tehničar — mjerenje i montaža', 'Teknik — matje dhe montim', 'Technician — measuring & fitting') },
  { id: 'st-ana', name: 'Ana Perović', email: 'ana@selca.me', role: 'editor', color: '#9c6644', active: true, title: T('Urednica sadržaja', 'Redaktore përmbajtjeje', 'Content editor') },
];

export const SERVICES: Service[] = [
  {
    id: 'sv-mjerenje',
    name: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'),
    description: T('Tehničar dolazi na adresu, mjeri i savjetuje.', 'Tekniku vjen në adresë, mat dhe këshillon.', 'A technician visits, measures and advises.'),
    durationMin: 60,
    capacity: 1,
    price: 0,
    color: '#3d5a80',
    staffIds: ['st-blerim', 'st-gent'],
    location: 'onsite',
  },
  {
    id: 'sv-konsultacija',
    name: T('Konsultacija u salonu', 'Konsultim në sallon', 'Showroom consultation'),
    description: T('Izbor materijala uz uzorke i 3D prikaz.', 'Zgjedhja e materialeve me mostra dhe pamje 3D.', 'Choosing materials with samples and a 3D render.'),
    durationMin: 45,
    capacity: 2,
    color: '#2f7d6d',
    staffIds: ['st-arta', 'st-milica', 'st-gent'],
    location: 'loc-pg',
  },
  {
    id: 'sv-montaza',
    name: T('Montaža', 'Montim', 'Installation'),
    description: T('Ugradnja vrata, prozora ili poda — termin za montažni tim.', 'Montimi i dyerve, dritareve ose dyshemesë — termin për ekipën.', 'Fitting doors, windows or floors — a slot for the crew.'),
    durationMin: 180,
    capacity: 1,
    color: '#b5651d',
    staffIds: ['st-blerim'],
    location: 'onsite',
  },
];

const BOOKING_PEOPLE: [string, string, string][] = [
  ['Jelena Radović', '+382 67 441 902', 'Podgorica'],
  ['Arben Kalaj', '+382 68 220 517', 'Tuzi'],
  ['Petar Ivanović', '+382 69 715 330', 'Nikšić'],
  ['Lindita Gjonaj', '+382 67 908 114', 'Ulcinj'],
  ['Stefan Perović', '+382 68 510 276', 'Podgorica'],
  ['Amra Hadžić', '+382 69 304 681', 'Bar'],
  ['Valentina Dreshaj', '+382 67 655 209', 'Podgorica'],
  ['Nikola Bulatović', '+382 68 147 993', 'Danilovgrad'],
  ['Teodora Marković', '+382 69 822 460', 'Budva'],
  ['Besnik Camaj', '+382 67 390 845', 'Tuzi'],
  ['Maja Vujošević', '+382 68 674 152', 'Podgorica'],
  ['Edin Mujović', '+382 69 251 738', 'Rožaje'],
  ['Ivana Kovačević', '+382 67 118 506', 'Cetinje'],
  ['Driton Lulgjuraj', '+382 68 963 027', 'Ulcinj'],
  ['Filip Nikač', '+382 69 437 615', 'Podgorica'],
  ['Elira Dedvukaj', '+382 67 582 394', 'Tuzi'],
];

/** [day offset from this Monday, hour, minute, service, staff, note] — no overlaps per staff member. */
const SLOTS: [number, number, number, string, string, string][] = [
  [0, 9, 0, 'sv-konsultacija', 'st-arta', 'Izbor sobnih vrata za kuću'],
  [0, 11, 0, 'sv-mjerenje', 'st-blerim', 'Prozori — stan 80 m²'],
  [1, 10, 0, 'sv-mjerenje', 'st-gent', 'Laminat, 3 sobe i hodnik'],
  [1, 13, 0, 'sv-montaza', 'st-blerim', 'Ugradnja 5 sobnih vrata'],
  [2, 9, 0, 'sv-konsultacija', 'st-milica', 'Keramika za kupatilo'],
  [2, 9, 30, 'sv-konsultacija', 'st-arta', 'Kuhinja po mjeri — 3D prikaz'],
  [3, 8, 0, 'sv-montaza', 'st-blerim', 'Postavljanje parketa 32 m²'],
  [3, 12, 0, 'sv-mjerenje', 'st-blerim', 'Kupatilo — walk-in tuš'],
  [4, 9, 0, 'sv-konsultacija', 'st-gent', 'Sigurnosna vrata — ponuda'],
  [4, 15, 0, 'sv-mjerenje', 'st-gent', 'Dritare 9 copë'],
  [7, 9, 0, 'sv-mjerenje', 'st-blerim', 'Porculan 60 × 120, 45 m²'],
  [7, 11, 0, 'sv-konsultacija', 'st-arta', 'Klizna HS vrata — PVC ili ALU'],
  [8, 8, 0, 'sv-montaza', 'st-blerim', 'Ugradnja PVC prozora, 7 kom'],
  [9, 10, 0, 'sv-konsultacija', 'st-milica', 'Kupatilo — izbor sanitarija'],
  [10, 12, 0, 'sv-mjerenje', 'st-gent', 'Kuhinja — mjerenje prostora'],
  [11, 9, 0, 'sv-montaza', 'st-blerim', 'Montaža kuhinje Linea Bianca'],
];

function mondayOf(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d;
}

/**
 * Bookings for this and next week. Scheduled inquiries are linked to future bookings of the matching
 * service (measurement → Besplatno mjerenje, others → Konsultacija) and get the same date.
 */
export function buildBookings(now: Date, inquiries: Inquiry[]): { bookings: Booking[]; inquiries: Inquiry[] } {
  const monday = mondayOf(now);
  const bookings: Booking[] = SLOTS.map(([day, h, m, serviceId, staffId, note], i) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + day);
    start.setHours(h, m, 0, 0);
    const service = SERVICES.find((s) => s.id === serviceId)!;
    const end = start.getTime() + service.durationMin * 60000;
    const [customerName, phone, city] = BOOKING_PEOPLE[i % BOOKING_PEOPLE.length];
    const past = end < now.getTime();
    const status: Booking['status'] = past ? (i === 4 ? 'noshow' : i === 5 ? 'cancelled' : 'done') : i === 13 || i === 14 ? 'pending' : 'confirmed';
    return {
      id: `bk-${101 + i}`,
      serviceId,
      staffId,
      customerName,
      phone,
      city,
      start: start.toISOString(),
      durationMin: service.durationMin,
      status,
      note,
      location: service.location ?? 'loc-pg',
      ...(service.location === 'onsite' ? { address: `${['Njegoševa', 'Ulica Slobode', 'Bulevar Revolucije', 'Mediteranska'][i % 4]} ${12 + i * 3}` } : {}),
      createdAt: new Date(start.getTime() - (3 + (i % 5)) * DAY).toISOString(),
    };
  });

  const out = inquiries.map((q) => ({ ...q }));
  const free = (svc: string) => bookings.filter((b) => b.serviceId === svc && !b.inquiryId && new Date(b.start).getTime() > now.getTime() && b.status !== 'cancelled');
  for (const q of out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (q.status !== 'scheduled') continue;
    const slot = free(q.type === 'measurement' ? 'sv-mjerenje' : 'sv-konsultacija')[0];
    if (!slot) {
      q.status = 'contacted';
      q.scheduledAt = undefined;
      continue;
    }
    slot.inquiryId = q.id;
    slot.customerName = q.name;
    slot.phone = q.phone;
    slot.email = q.email;
    slot.city = q.city;
    slot.status = 'confirmed';
    q.scheduledAt = slot.start;
  }
  return { bookings, inquiries: out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

/* ================================================================== */
/* Inquiries — CMS v2 fields + two extra (B2B quote, delivery question) */
/* ================================================================== */
export function enrichInquiries(now: Date, inquiries: Inquiry[]): Inquiry[] {
  const out: Inquiry[] = inquiries.map((q, i) => ({
    ...q,
    source: q.type === 'measurement' ? 'measurement' : q.type === 'quote' ? 'quote' : 'web-form',
    assignee: q.status === 'new' ? undefined : q.type === 'measurement' ? (i % 2 ? 'st-gent' : 'st-blerim') : q.type === 'quote' ? 'st-arta' : 'st-milica',
    tags: [q.service ? q.service.toLowerCase() : 'opste', ...(q.type === 'quote' ? ['ponuda'] : [])],
  }));
  out.push(
    {
      id: 'inq_120',
      createdAt: iso(now, -4, -3),
      type: 'quote',
      name: 'Vesna Bulatović',
      company: 'Hotel Montenegrina d.o.o.',
      phone: '+382 67 552 301',
      email: 'nabavka.montenegrina@example.com',
      city: 'Budva',
      service: 'Prozori',
      productId: 'p-pvc-antracit',
      message: 'Ponuda za 30 PVC prozora u antracitu (120 × 140) sa ugradnjom i demontažom starih, za renoviranje hotela prije sezone.',
      status: 'contacted',
      seen: true,
      source: 'phone',
      assignee: 'st-arta',
      tags: ['b2b', 'prozori', 'hotel'],
      followUpAt: iso(now, 2),
    },
    {
      id: 'inq_121',
      createdAt: iso(now, 0, -5),
      type: 'contact',
      name: 'Ardit Gjokaj',
      phone: '+382 68 419 207',
      email: 'ardit.gjokaj@example.com',
      city: 'Plav',
      message: 'Da li dostavljate u Plav i koliko traje isporuka za laminat sa stanja?',
      status: 'new',
      seen: false,
      source: 'web-form',
      tags: ['dostava'],
    },
  );
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ================================================================== */
/* Segments                                                            */
/* ================================================================== */
export const SEGMENTS: Segment[] = [
  {
    id: 'seg-vip',
    name: T('VIP kupci', 'Klientë VIP', 'VIP customers'),
    description: T('Potrošili više od 4.000 €.', 'Kanë shpenzuar mbi 4.000 €.', 'Spent more than €4,000.'),
    match: 'all',
    rules: [{ field: 'spent', op: 'gt', value: '4000' }],
  },
  {
    id: 'seg-povratni',
    name: T('Povratni kupci', 'Klientë që kthehen', 'Returning customers'),
    description: T('Više od jedne narudžbe.', 'Më shumë se një porosi.', 'More than one order.'),
    match: 'all',
    rules: [{ field: 'orders', op: 'gt', value: '1' }],
  },
  {
    id: 'seg-primorje',
    name: T('Primorje', 'Bregdeti', 'Coast'),
    description: T('Kupci iz primorskih opština.', 'Klientë nga komunat bregdetare.', 'Customers from coastal municipalities.'),
    match: 'any',
    rules: ['Bar', 'Ulcinj', 'Budva', 'Kotor', 'Tivat', 'Herceg Novi'].map((c) => ({ field: 'city' as const, op: 'eq' as const, value: c })),
  },
  {
    id: 'seg-shqip',
    name: T('Kupci na albanskom', 'Klientë në shqip', 'Albanian-speaking customers'),
    description: T('Naručivali na albanskom jeziku — za kampanje na SQ.', 'Kanë porositur në shqip — për fushata në SQ.', 'Ordered in Albanian — for SQ campaigns.'),
    match: 'all',
    rules: [{ field: 'lang', op: 'eq', value: 'sq' }],
  },
];

/* ================================================================== */
/* Purchasing & inventory movements                                    */
/* ================================================================== */
export function buildPurchaseOrders(now: Date): PurchaseOrder[] {
  return [
    {
      id: 'po-014',
      number: 'PO-2026-014',
      supplier: 'Alpe Floor GmbH',
      location: 'loc-tz',
      status: 'partial',
      lines: [
        { productId: 'p-laminat-grey', ordered: 200, received: 120, rejected: 0, cost: 6.9 },
        { productId: 'p-laminat-nordic', ordered: 150, received: 150, rejected: 0, cost: 6.2 },
        { productId: 'p-laminat-rustic', ordered: 100, received: 96, rejected: 4, cost: 9.4 },
      ],
      reference: 'AF-55721',
      note: 'Ostatak Grey Stone Oak stiže drugim kamionom. 4 paketa Rustic odbijena — oštećeni uglovi.',
      expectedAt: iso(now, 3),
      createdAt: iso(now, -12),
    },
    {
      id: 'po-015',
      number: 'PO-2026-015',
      supplier: 'Porta Lux d.o.o.',
      location: 'loc-pg',
      status: 'sent',
      lines: [
        { productId: 'p-vrata-flat', ordered: 10, received: 0, rejected: 0, cost: 205 },
        { productId: 'p-vrata-guardian', ordered: 4, received: 0, rejected: 0, cost: 690 },
        { productId: 'p-kvaka-linea', ordered: 60, received: 0, rejected: 0, cost: 15.5 },
      ],
      reference: 'PL-2026/0932',
      note: 'Za Black Friday akciju vrata.',
      expectedAt: iso(now, 9),
      createdAt: iso(now, -3),
    },
  ];
}

export function buildMovements(now: Date, orders: Order[], returns: ReturnRequest[]): InventoryMovement[] {
  const mv = (id: string, productId: string, delta: number, reason: InventoryMovement['reason'], days: number, by: string, note?: string, ref?: string): InventoryMovement => ({
    id,
    productId,
    delta,
    reason,
    at: iso(now, days),
    by,
    ...(note ? { note } : {}),
    ...(ref ? { ref } : {}),
  });
  const list: InventoryMovement[] = [
    mv('mv-1', 'p-ogledalo-luna', -1, 'damaged', -2, 'st-blerim', 'Napuklo staklo pri istovaru — otpis'),
    mv('mv-2', 'p-vrata-vetro', -1, 'damaged', -4, 'st-blerim', 'Ogrebotina na staklu — izloženo u salonu'),
    mv('mv-3', 'p-laminat-grey', 120, 'received', -5, 'st-arta', 'Alpe Floor GmbH', 'PO-2026-014'),
    mv('mv-4', 'p-laminat-nordic', 150, 'received', -5, 'st-arta', 'Alpe Floor GmbH', 'PO-2026-014'),
    mv('mv-5', 'p-laminat-rustic', 96, 'received', -5, 'st-arta', 'Alpe Floor GmbH — 4 paketa odbijena', 'PO-2026-014'),
    mv('mv-6', 'p-calacatta', -3, 'count', -7, 'st-arta', 'Inventura — razlika u magacinu Tuzi'),
    mv('mv-7', 'p-parket-natur', 2, 'count', -7, 'st-arta', 'Inventura — pronađena 2 paketa'),
    mv('mv-9', 'p-beton', -4, 'correction', -11, 'st-gent', 'Uzorci za izložbeni prostor'),
  ];
  // restocked returns
  for (const r of returns) {
    if (!r.restocked) continue;
    const rec = r.timeline.find((t) => t.status === 'received');
    for (const l of r.lines) list.push({ id: `mv-${r.id}-${l.productId}`, productId: l.productId, delta: l.qty, reason: 'return', at: rec?.at ?? r.createdAt, by: rec?.by ?? 'st-blerim', note: 'Vraćeno neoštećeno', ref: r.number });
  }
  // the most recent web orders as 'sale' movements
  let n = 10;
  for (const o of orders.slice(0, 6)) {
    for (const l of o.items) {
      if (!l.productId) continue;
      const days = (new Date(o.createdAt).getTime() - now.getTime()) / DAY;
      list.push({ id: `mv-${n++}`, productId: l.productId, delta: -l.qty, reason: 'sale', at: iso(now, days), by: 'web', ref: o.number });
    }
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

/* ================================================================== */
/* Draft orders, returns, quotes                                       */
/* ================================================================== */
export function buildDrafts(now: Date, products: Product[]): DraftOrder[] {
  const opts = (id: string) => {
    const p = products.find((x) => x.id === id);
    return p ? defaultOptions(p) : {};
  };
  const key = (id: string, o: Record<string, string>, inst: boolean) =>
    `${id}|${Object.keys(o)
      .sort()
      .map((k) => `${k}=${o[k]}`)
      .join('&')}|${inst ? 'i' : ''}`;
  const classica = opts('p-vrata-classica');
  const kvaka = opts('p-kvaka-linea');
  const rustic = opts('p-laminat-rustic');
  return [
    {
      id: 'dr-1001',
      number: 'D-1001',
      createdAt: iso(now, -1, -2),
      customer: { firstName: 'Bojana', lastName: 'Kalaj', company: 'Apartmani Bojana d.o.o.', pib: '03187254', email: 'bojana.kalaj@example.com', phone: '+382 69 412 778', city: 'Ulcinj', address: 'Ulica Skenderbega 14' },
      items: [
        { key: key('p-vrata-classica', classica, true), productId: 'p-vrata-classica', qty: 12, options: classica, installation: true },
        { key: key('p-kvaka-linea', kvaka, false), productId: 'p-kvaka-linea', qty: 12, options: kvaka, installation: false },
      ],
      customLines: [{ title: 'Demontaža i odvoz starih vrata', price: 15, qty: 12 }],
      discountCodes: ['SELCA10'],
      delivery: 'delivery',
      payment: 'bank',
      note: 'Apartmani — 12 jedinica, ugradnja u novembru prije sezone. Plaćanje avansno po predračunu.',
      tags: ['b2b', 'ulcinj'],
      status: 'open',
      createdBy: 'st-arta',
      lang: 'sq',
    },
    {
      id: 'dr-1002',
      number: 'D-1002',
      createdAt: iso(now, -4, -1),
      customer: { firstName: 'Arben', lastName: 'Gjonaj', email: 'arben.gjonaj@example.com', phone: '+382 68 220 517', city: 'Tuzi', address: 'Ulica 13. jula 41' },
      items: [{ key: key('p-laminat-rustic', rustic, true), productId: 'p-laminat-rustic', qty: 30, options: rustic, installation: true }],
      customLines: [{ title: 'Lajsne i prelazne lajsne (komplet)', price: 120, qty: 1 }],
      discountCodes: [],
      delivery: 'delivery',
      payment: 'cod',
      note: 'Predračun poslat e-mailom. Kupac dolazi u salon po uzorke lajsni.',
      tags: ['podovi'],
      status: 'invoice_sent',
      createdBy: 'st-gent',
      lang: 'me',
    },
  ];
}

/** Two returns from real generated orders; the refunded one is also recorded on its order. */
export function buildReturns(now: Date, orders: Order[]): { returns: ReturnRequest[]; orders: Order[] } {
  const age = (o: Order) => (now.getTime() - new Date(o.createdAt).getTime()) / DAY;
  const pieceLine = (o: Order) => o.items.find((l) => l.unit === 'kom' || l.unit === 'set');
  const old = orders.find((o) => o.status === 'completed' && age(o) > 20 && pieceLine(o));
  const recent = orders.find((o) => o !== old && (o.status === 'shipped' || o.status === 'installation' || o.status === 'completed') && age(o) < 15 && pieceLine(o));
  const returns: ReturnRequest[] = [];
  let out = orders;
  if (old) {
    const line = pieceLine(old)!;
    const lines = [{ productId: line.productId, qty: 1 }];
    const amount = refundForLines(old, lines);
    const t0 = new Date(Math.min(now.getTime() - 12 * DAY, new Date(old.createdAt).getTime() + 6 * DAY));
    const at = (h: number) => new Date(t0.getTime() + h * 3600000).toISOString();
    returns.push({
      id: 'rt-1001',
      number: 'RT-1001',
      orderId: old.id,
      lines,
      reason: 'Oštećeno pri transportu — kupac traži povrat novca',
      status: 'refunded',
      refundAmount: amount,
      restock: true,
      restocked: true,
      createdAt: at(0),
      timeline: [
        { at: at(0), status: 'requested', by: 'st-milica', note: 'Prijava telefonom, poslate fotografije' },
        { at: at(5), status: 'approved', by: 'st-arta' },
        { at: at(50), status: 'received', by: 'st-blerim', note: 'Preuzeto na adresi, vraćeno na stanje' },
        { at: at(54), status: 'refunded', by: 'st-arta' },
      ],
    });
    out = out.map((o) =>
      o.id === old.id
        ? {
            ...o,
            refunds: [{ id: 'rf-1001', at: at(54), amount, lineIds: [String(o.items.indexOf(line))], note: 'RT-1001', by: 'st-arta' }],
            payment: { ...o.payment, status: 'paid', refunded: amount },
            timeline: [...o.timeline, { at: at(54), status: 'payment', note: `Refund ${amount.toFixed(2)} € (RT-1001)`, by: 'admin' }],
          }
        : o,
    );
  }
  if (recent) {
    const line = pieceLine(recent)!;
    const lines = [{ productId: line.productId, qty: 1 }];
    const at = iso(now, 0, -20);
    returns.push({
      id: 'rt-1002',
      number: 'RT-1002',
      orderId: recent.id,
      lines,
      reason: 'Pogrešna nijansa — kupac želi zamjenu ili povrat',
      status: 'requested',
      refundAmount: refundForLines(recent, lines),
      restock: true,
      createdAt: at,
      timeline: [{ at, status: 'requested', by: 'web', note: 'Zahtjev preko e-maila sa brojem narudžbe' }],
    });
  }
  return { returns, orders: out };
}

export function buildQuotes(now: Date): Quote[] {
  const terms = T(
    'Cijene uključuju PDV 21%. Avans 40%, ostatak po ugradnji. Rok isporuke 3–4 sedmice od potvrde.',
    'Çmimet përfshijnë TVSH 21%. Avans 40%, pjesa tjetër pas montimit. Afati i dërgesës 3–4 javë nga konfirmimi.',
    'Prices include 21% VAT. 40% deposit, balance on installation. Delivery 3–4 weeks from confirmation.',
  );
  return [
    {
      id: 'q-031',
      number: 'Q-2026-031',
      inquiryId: 'inq_120',
      customer: { name: 'Vesna Bulatović', company: 'Hotel Montenegrina d.o.o.', email: 'nabavka.montenegrina@example.com', phone: '+382 67 552 301' },
      lines: [
        { productId: 'p-pvc-antracit', title: 'PVC prozor Thermo 76 — antracit, 120 × 140', qty: 30, price: 229 },
        { title: 'Ugradnja — RAL montaža sa trakama', qty: 30, price: 45 },
        { title: 'Demontaža i odvoz starih prozora', qty: 30, price: 12 },
      ],
      validUntil: iso(now, 14),
      terms,
      version: 2,
      status: 'sent',
      createdAt: iso(now, -3),
      owner: 'st-arta',
    },
    {
      id: 'q-032',
      number: 'Q-2026-032',
      customer: { name: 'Dejan Marković', company: 'Gradnja Plus d.o.o.', email: 'dejan.markovic@example.com', phone: '+382 68 300 415' },
      lines: [
        { productId: 'p-vrata-classica', title: 'Sobna vrata Classica — bijela, 80 cm', qty: 48, price: 179 },
        { productId: 'p-kvaka-linea', title: 'Kvaka Linea na rozeti', qty: 48, price: 29 },
        { title: 'Ugradnja sobnih vrata', qty: 48, price: 40 },
      ],
      validUntil: iso(now, 30),
      terms,
      version: 1,
      status: 'draft',
      createdAt: iso(now, -1),
      owner: 'st-gent',
    },
  ];
}

/* ================================================================== */
/* Menus & content models                                              */
/* ================================================================== */
export function buildMenus(): Menu[] {
  const cat = (id: string, label: L10n) => ({ id: `mi-${id}`, label, type: 'category' as const, target: id });
  const url = (id: string, label: L10n, target: string, children?: Menu['items']) => ({ id, label, type: 'url' as const, target, ...(children ? { children } : {}) });
  const page = (id: string, label: L10n) => ({ id: `mi-${id}`, label, type: 'page' as const, target: id });
  return [
    {
      id: 'menu-main',
      handle: 'main',
      title: 'Glavni meni',
      items: [
        url('mi-products', T('Proizvodi', 'Produktet', 'Products'), '/proizvodi', [
          cat('cat-vrata', T('Vrata', 'Dyer', 'Doors')),
          cat('cat-prozori', T('Prozori', 'Dritare', 'Windows')),
          cat('cat-podovi', T('Podovi', 'Dysheme', 'Flooring')),
          cat('cat-keramika', T('Keramika', 'Pllaka', 'Tiles')),
          cat('cat-kupatilo', T('Kupatilo', 'Banjo', 'Bathroom')),
          cat('cat-kuhinje', T('Kuhinje', 'Kuzhina', 'Kitchens')),
          url('mi-sale', T('Akcija', 'Ofertë', 'Sale'), '/proizvodi?akcija=1'),
        ]),
        url('mi-services', T('Usluge', 'Shërbimet', 'Services'), '/usluge'),
        url('mi-projects', T('Realizacije', 'Realizimet', 'Projects'), '/projekti'),
        url('mi-about', T('O nama', 'Rreth nesh', 'About'), '/o-nama'),
        url('mi-blog', T('Savjeti', 'Këshilla', 'Advice'), '/savjeti'),
        url('mi-contact', T('Kontakt', 'Kontakt', 'Contact'), '/kontakt'),
      ],
    },
    {
      id: 'menu-footer',
      handle: 'footer',
      title: 'Podnožje',
      items: [
        url('mi-f-shop', T('Kupovina', 'Blerja', 'Shop'), '/proizvodi', [
          cat('cat-vrata', T('Vrata', 'Dyer', 'Doors')),
          cat('cat-prozori', T('Prozori', 'Dritare', 'Windows')),
          cat('cat-podovi', T('Podovi', 'Dysheme', 'Flooring')),
          cat('cat-keramika', T('Keramika', 'Pllaka', 'Tiles')),
          cat('cat-kupatilo', T('Kupatilo', 'Banjo', 'Bathroom')),
          cat('cat-kuhinje', T('Kuhinje', 'Kuzhina', 'Kitchens')),
          url('mi-f-sale', T('Akcija', 'Ofertë', 'Sale'), '/proizvodi?akcija=1'),
        ]),
        url('mi-f-company', T('Kompanija', 'Kompania', 'Company'), '/o-nama', [
          url('mi-f-about', T('O nama', 'Rreth nesh', 'About'), '/o-nama'),
          url('mi-f-services', T('Usluge', 'Shërbimet', 'Services'), '/usluge'),
          url('mi-f-projects', T('Realizacije', 'Realizimet', 'Projects'), '/projekti'),
          url('mi-f-blog', T('Savjeti', 'Këshilla', 'Advice'), '/savjeti'),
          url('mi-f-contact', T('Kontakt', 'Kontakt', 'Contact'), '/kontakt'),
        ]),
        url('mi-f-help', T('Kupcima', 'Për klientët', 'Customer care'), '', [
          page('pg-dostava', T('Dostava i ugradnja', 'Dërgesa dhe montimi', 'Delivery & installation')),
          page('pg-uslovi', T('Uslovi kupovine', 'Kushtet e blerjes', 'Terms of purchase')),
          page('pg-reklamacije', T('Reklamacije i povrat', 'Reklamacionet dhe kthimi', 'Returns & complaints')),
          page('pg-privatnost', T('Politika privatnosti', 'Politika e privatësisë', 'Privacy policy')),
        ]),
      ],
    },
  ];
}

export function buildContentModels(projects: Project[], home: HomeSection[], locations: number): ContentModel[] {
  const faq = home.find((h) => h.type === 'faq');
  const services = home.find((h) => h.type === 'services');
  return [
    {
      id: 'cm-projekti',
      name: T('Projekti', 'Projektet', 'Projects'),
      source: 'projects',
      fields: [
        { key: 'title', label: T('Naziv', 'Titulli', 'Title'), type: 'text' },
        { key: 'location', label: T('Lokacija', 'Vendndodhja', 'Location'), type: 'text' },
        { key: 'year', label: T('Godina', 'Viti', 'Year'), type: 'number' },
        { key: 'tags', label: T('Kategorije', 'Kategoritë', 'Categories'), type: 'choice' },
        { key: 'summary', label: T('Opis', 'Përshkrimi', 'Summary'), type: 'text' },
        { key: 'image', label: T('Fotografija', 'Fotografia', 'Photo'), type: 'image' },
        { key: 'featured', label: T('Izdvojeno', 'E veçuar', 'Featured'), type: 'boolean' },
      ],
      entries: projects.length,
    },
    {
      id: 'cm-faq',
      name: T('Česta pitanja', 'Pyetje të shpeshta', 'FAQ'),
      source: 'home.faq',
      fields: [
        { key: 'q', label: T('Pitanje', 'Pyetja', 'Question'), type: 'text' },
        { key: 'a', label: T('Odgovor', 'Përgjigjja', 'Answer'), type: 'text' },
      ],
      entries: faq && faq.type === 'faq' ? faq.data.items.length : 0,
    },
    {
      id: 'cm-usluge',
      name: T('Usluge', 'Shërbimet', 'Services'),
      source: 'home.services',
      fields: [
        { key: 'image', label: T('Fotografija', 'Fotografia', 'Photo'), type: 'image' },
        { key: 'title', label: T('Naziv', 'Titulli', 'Title'), type: 'text' },
        { key: 'text', label: T('Opis', 'Përshkrimi', 'Description'), type: 'text' },
        { key: 'service', label: T('Termin (usluga)', 'Termini (shërbimi)', 'Booking service'), type: 'reference' },
      ],
      entries: services && services.type === 'services' ? services.data.items.length : 0,
    },
    {
      id: 'cm-lokacije',
      name: T('Lokacije', 'Lokacionet', 'Locations'),
      source: 'settings.locations',
      fields: [
        { key: 'name', label: T('Naziv', 'Emri', 'Name'), type: 'text' },
        { key: 'address', label: T('Adresa', 'Adresa', 'Address'), type: 'text' },
        { key: 'city', label: T('Grad', 'Qyteti', 'City'), type: 'text' },
        { key: 'pickup', label: T('Preuzimanje', 'Marrje në vend', 'Pickup'), type: 'boolean' },
        { key: 'map', label: T('Mapa', 'Harta', 'Map'), type: 'link' },
      ],
      entries: locations,
    },
  ];
}

/* ================================================================== */
/* Homepage history & audit log                                        */
/* ================================================================== */
export function buildHomeHistory(now: Date, home: HomeSection[]): HomeVersion[] {
  const v1 = structuredClone(home).map((s) => (s.type === 'instagram' ? { ...s, enabled: false } : s));
  const v2 = structuredClone(home)
    .filter((s) => s.type !== 'promo')
    .map((s) => (s.type === 'blog' ? { ...s, enabled: false } : s));
  return [
    { at: iso(now, -6, -4), by: 'st-ana', sections: v1 },
    { at: iso(now, -21, -2), by: 'st-drita', sections: v2 },
  ];
}

export function buildAudit(now: Date, orders: Order[]): AuditEntry[] {
  const o = (i: number) => orders[Math.min(i, orders.length - 1)];
  const a = (id: number, hours: number, actor: string, action: AuditEntry['action'], object: AuditEntry['object'], objectId: string, detail?: string): AuditEntry => ({
    id: `au-${id}`,
    at: new Date(now.getTime() - hours * 3600000).toISOString(),
    actor,
    action,
    object,
    objectId,
    ...(detail ? { detail } : {}),
  });
  const list: AuditEntry[] = [
    a(1, 0.4, 'st-gent', 'login', 'staff', 'st-gent', 'Prijava u CMS'),
    a(2, 1.2, 'st-arta', 'status', 'order', o(3).id, `${o(3).number}: new → confirmed`),
    a(3, 3, 'st-milica', 'assign', 'inquiry', 'inq_120', 'Vesna Bulatović → Arta Gjokaj'),
    a(4, 20, 'st-arta', 'create', 'draft', 'dr-1001', 'D-1001'),
    a(5, 26, 'st-blerim', 'fulfil', 'order', o(8).id, o(8).number),
    a(6, 30, 'st-milica', 'create', 'booking', 'bk-103', 'Mjerenje — utorak 10:00'),
    a(7, 47, 'st-drita', 'create', 'offer', 'of-blackfriday', 'Black Friday — vrata −20%'),
    a(8, 48, 'st-drita', 'create', 'discount', 'd-bf-vrata', 'Black Friday — vrata −20%'),
    a(9, 50, 'st-drita', 'create', 'placement', 'pl-s4', 'Hero — Black Friday vrata'),
    a(10, 70, 'st-gent', 'archive', 'product', 'p-statuario', 'Porculan Statuario Gold 60 × 60'),
    a(11, 74, 'st-arta', 'send', 'quote', 'q-031', 'Q-2026-031 v2'),
    a(12, 96, 'st-blerim', 'adjust', 'inventory', 'p-vrata-vetro', 'SC-VR-105 −1 (damaged)'),
    a(13, 98, 'st-gent', 'send', 'draft', 'dr-1002', 'D-1002 — predračun'),
    a(14, 120, 'st-arta', 'receive', 'purchaseOrder', 'po-014', 'PO-2026-014: +366'),
    a(15, 146, 'st-ana', 'publish', 'home', 'home', 'Početna — promo blok jesen'),
    a(16, 150, 'st-ana', 'update', 'page', 'pg-dostava', 'Dostava i ugradnja'),
    a(17, 200, 'st-gent', 'update', 'settings', 'settings', 'shippingZones'),
    a(18, 214, 'st-gent', 'publish', 'offer', 'of-jesen', 'Jesenja akcija podova'),
    a(19, 216, 'st-drita', 'create', 'discount', 'd-podovi15', 'Jesen — podovi −15% (automatski)'),
    a(20, 218, 'st-drita', 'create', 'collection', 'col-podovi-akcija', 'Podovi na akciji'),
    a(21, 230, 'st-arta', 'refund', 'return', 'rt-1001', 'RT-1001'),
    a(22, 240, 'st-drita', 'create', 'discount', 'd-jesen25', 'JESEN25'),
  ];
  return list;
}
