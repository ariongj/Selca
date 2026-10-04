// Realistic demo activity (orders + inquiries) so the CMS dashboard looks alive.
// Deterministic for a given seed, always relative to "now".
import type { CartItem, Customer, Inquiry, Lang, Order, OrderEvent, OrderStatus, PaymentMethod, Product, Settings, Coupon } from '@/lib/types';
import { priceCart, defaultOptions, packsForArea } from '@/lib/pricing';
import { lt } from '@/i18n';
import { pick, rng, slugify, weighted } from '@/lib/utils';

const FIRST = ['Marko', 'Jelena', 'Nikola', 'Ana', 'Stefan', 'Milica', 'Luka', 'Ivana', 'Petar', 'Tamara', 'Arben', 'Drita', 'Gjergj', 'Lindita', 'Driton', 'Valentina', 'Edin', 'Amra', 'Mirza', 'Lejla', 'Vuk', 'Teodora', 'Ardit', 'Elira', 'Filip', 'Sanja', 'Besnik', 'Albina', 'Dejan', 'Maja'];
const LAST = ['Vuković', 'Popović', 'Radović', 'Đukanović', 'Ivanović', 'Perović', 'Lulgjuraj', 'Gjokaj', 'Dedvukaj', 'Camaj', 'Ljuljđuraj', 'Kalaj', 'Hadžić', 'Mujović', 'Kovačević', 'Marković', 'Vujošević', 'Bulatović', 'Nikač', 'Gjonaj', 'Dreshaj', 'Pepić', 'Šabović', 'Dragović'];
const STREETS = ['Ulica Slobode', 'Njegoševa', 'Bulevar Revolucije', 'Ulica 13. jula', 'Vojislavljevića', 'Ulica Marka Miljanova', 'Hercegovačka', 'Rista Stijovića', 'Mediteranska', 'Jadranski put', 'Ulica Skenderbega', 'Moskovska'];
const CITIES: (readonly [string, number])[] = [
  ['Podgorica', 34], ['Nikšić', 9], ['Tuzi', 7], ['Bar', 8], ['Ulcinj', 8], ['Budva', 7], ['Herceg Novi', 5], ['Kotor', 4], ['Tivat', 4],
  ['Cetinje', 3], ['Danilovgrad', 3], ['Bijelo Polje', 3], ['Berane', 2], ['Plav', 1], ['Rožaje', 2], ['Gusinje', 1], ['Pljevlja', 2],
];

function customer(r: () => number): Customer {
  const firstName = pick(FIRST, r);
  const lastName = pick(LAST, r);
  const city = weighted(CITIES, r);
  const digits = () => String(Math.floor(r() * 900) + 100);
  return {
    firstName,
    lastName,
    email: `${slugify(firstName)}.${slugify(lastName)}@example.com`,
    phone: `+382 6${pick(['7', '8', '9'], r)} ${digits()} ${digits()}`,
    city,
    address: `${pick(STREETS, r)} ${Math.floor(r() * 120) + 1}`,
  };
}

function lineFor(p: Product, r: () => number): CartItem {
  const options = defaultOptions(p);
  for (const o of p.options) options[o.id] = pick(o.values, r).id;
  let qty = 1;
  if (p.unit === 'm2' && p.packSize) qty = packsForArea(12 + Math.floor(r() * 80), p.packSize);
  else if (p.unit === 'm') qty = 2 + Math.floor(r() * 4);
  else if (p.categoryId === 'cat-vrata' && p.unit === 'kom') qty = 1 + Math.floor(r() * 5);
  else if (p.categoryId === 'cat-prozori') qty = 1 + Math.floor(r() * 7);
  else qty = 1 + Math.floor(r() * 2);
  const installation = !!p.installation?.available && r() < 0.45;
  return { key: '', productId: p.id, qty, options, installation };
}

function statusFor(ageDays: number, r: () => number): OrderStatus {
  if (ageDays < 0.6) return r() < 0.75 ? 'new' : 'confirmed';
  if (ageDays < 3) return weighted([['confirmed', 4], ['processing', 4], ['new', 1]] as const, r);
  if (ageDays < 9) return weighted([['processing', 3], ['shipped', 3], ['installation', 3], ['completed', 2], ['cancelled', 0.4]] as const, r);
  if (ageDays < 20) return weighted([['shipped', 2], ['installation', 2], ['completed', 6], ['cancelled', 0.6]] as const, r);
  return weighted([['completed', 15], ['cancelled', 1]] as const, r);
}

const FLOW: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'installation', 'completed'];

export function generateOrders(products: Product[], settings: Settings, coupons: Coupon[], now = new Date(), seed = 42): Order[] {
  const r = rng(seed);
  const sellable = products.filter((p) => !p.quoteOnly && p.status === 'active');
  const weights = sellable.map((p) => [p, Math.sqrt(p.sold + 5)] as const);
  const orders: Order[] = [];
  let seq = 1001;
  const DAYS = 75;
  for (let day = DAYS; day >= 0; day--) {
    // gentle growth trend + weekly rhythm (quieter Sundays)
    const date = new Date(now.getTime() - day * 86400000);
    const dow = date.getDay();
    const base = 0.35 + ((DAYS - day) / DAYS) * 0.75;
    const mean = dow === 0 ? base * 0.3 : dow === 6 ? base * 0.8 : base;
    let count = 0;
    let x = r();
    let p = Math.exp(-mean);
    let cdf = p;
    while (x > cdf && count < 5) {
      count++;
      p = (p * mean) / count;
      cdf += p;
    }
    if (day === 0) count = Math.max(count, 3);
    for (let i = 0; i < count; i++) {
      const hour = 8 + Math.floor(r() * 12);
      const created = new Date(date);
      created.setHours(hour, Math.floor(r() * 60), Math.floor(r() * 60), 0);
      if (created > now) created.setTime(now.getTime() - (i + 1) * 47 * 60000);
      const ageDays = (now.getTime() - created.getTime()) / 86400000;

      const nLines = weighted([[1, 5], [2, 3], [3, 1.5], [4, 0.5]] as const, r);
      const cart: CartItem[] = [];
      const used = new Set<string>();
      for (let k = 0; k < nLines; k++) {
        const prod = weighted(weights, r);
        if (used.has(prod.id)) continue;
        used.add(prod.id);
        cart.push(lineFor(prod, r));
      }
      const cust = customer(r);
      const delivery = r() < 0.15 ? 'pickup' : 'delivery';
      const lang: Lang = weighted([['me', 6], ['sq', 3], ['en', 1]] as const, r);
      const couponCode = r() < 0.14 ? 'SELCA10' : null;
      const totals = priceCart(cart, products, settings, { lang, couponCode, coupons, delivery, city: cust.city });
      const payMethod: PaymentMethod = weighted([['cod', 5], ['bank', 2.5], ['card', 2.5]] as const, r);
      const status = statusFor(ageDays, r);

      const idx = FLOW.indexOf(status);
      const timeline: OrderEvent[] = [{ at: created.toISOString(), status: 'new', by: 'web' }];
      if (status === 'cancelled') {
        timeline.push({ at: new Date(created.getTime() + 5 * 3600000).toISOString(), status: 'cancelled', note: 'Kupac odustao telefonom', by: 'admin' });
      } else {
        for (let s = 1; s <= idx; s++) {
          const at = new Date(created.getTime() + s * Math.min(ageDays / (idx + 1), 2.2) * 86400000);
          timeline.push({ at: at.toISOString(), status: FLOW[s], by: 'admin' });
        }
      }
      const paid = payMethod === 'card' ? true : payMethod === 'bank' ? idx >= 1 : status === 'completed';
      orders.push({
        id: `o_${seq}`,
        number: `SC-${seq}`,
        createdAt: created.toISOString(),
        status,
        customer: cust,
        items: totals.lines.map((l) => ({
          productId: l.product.id,
          sku: l.product.sku,
          name: lt(l.product.name, lang),
          image: l.product.images[0] ?? '',
          unit: l.product.unit,
          packSize: l.product.packSize,
          qty: l.item.qty,
          options: l.optionsLabel,
          unitPrice: l.unitPrice,
          installation: l.item.installation,
          installationPrice: l.installationUnitPrice,
          lineTotal: l.lineTotal,
        })),
        delivery: { method: delivery, fee: totals.shipping },
        payment: { method: payMethod, status: status === 'cancelled' ? (paid && payMethod === 'card' ? 'refunded' : 'pending') : paid ? 'paid' : 'pending' },
        coupon: totals.coupon ? { code: totals.coupon.code, discount: totals.discount } : null,
        subtotal: totals.subtotal,
        installationTotal: totals.installationTotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        vat: totals.vat,
        lang,
        timeline,
        seen: ageDays > 0.6,
        demo: true,
      });
      seq++;
    }
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const INQ_MSG: { type: Inquiry['type']; service?: string; productId?: string; message: string }[] = [
  { type: 'measurement', service: 'Prozori', message: 'Zamjena 7 prozora i balkonskih vrata u stanu od 80 m². Molim da dođete u toku sedmice poslije 17h.' },
  { type: 'measurement', service: 'Podovi', message: 'Treba mi laminat za 3 sobe i hodnik, ukupno oko 65 m². Zanima me i postavljanje.' },
  { type: 'quote', service: 'Kuhinje', productId: 'p-kuhinja-noce', message: 'Interesuje me kuhinja Noce sa ostrvom, prostor je 4,2 × 3,5 m. Da li radite i ugradnju aparata?' },
  { type: 'measurement', service: 'Kupatilo', message: 'Kompletna adaptacija kupatila 6 m² — walk-in tuš umjesto kade.' },
  { type: 'contact', message: 'Përshëndetje, a keni dyer të sigurisë në ngjyrë antracit në stok? Faleminderit.' },
  { type: 'measurement', service: 'Vrata', message: 'Pet sobnih vrata Classica, bijela, za novu kuću. Zidovi su 12 cm.' },
  { type: 'quote', service: 'Prozori', productId: 'p-hs-panorama', message: 'HS klizna vrata za terasu, otvor otprilike 4,8 × 2,4 m. Ponuda za PVC i za ALU.' },
  { type: 'measurement', service: 'Dritare', message: 'Dua të ndërroj dritaret në shtëpi, 9 copë. Kur mund të vini për matje?' },
  { type: 'contact', message: 'Da li je moguće platiti na rate za kompletnu adaptaciju stana?' },
  { type: 'measurement', service: 'Keramika', message: 'Porculan 60×120 za dnevni boravak i kuhinju, oko 45 m², sa postavljanjem.' },
  { type: 'quote', service: 'Kuhinje', productId: 'p-kuhinja-bianca', message: 'Bijela kuhinja bez ručki, ugaona 3 + 2 m, sa kvarcnom pločom.' },
  { type: 'measurement', service: 'Podovi', message: 'Parket riblja kost za dnevni boravak 32 m² — da li može na podno grijanje?' },
];

export function generateInquiries(now = new Date(), seed = 7): Inquiry[] {
  const r = rng(seed);
  return INQ_MSG.map((m, i) => {
    const ageHours = i === 0 ? 2.5 : i === 1 ? 9 : Math.floor(14 + r() * 28 * 24);
    const created = new Date(now.getTime() - ageHours * 3600000);
    const c = customer(r);
    const ageDays = ageHours / 24;
    const status: Inquiry['status'] = ageDays < 1 ? 'new' : ageDays < 4 ? (r() < 0.5 ? 'contacted' : 'scheduled') : ageDays < 12 ? (r() < 0.6 ? 'scheduled' : 'done') : 'done';
    const scheduledAt = status === 'scheduled' ? new Date(now.getTime() + (1 + Math.floor(r() * 5)) * 86400000).toISOString() : undefined;
    return {
      id: `inq_${100 + i}`,
      createdAt: created.toISOString(),
      type: m.type,
      name: `${c.firstName} ${c.lastName}`,
      phone: c.phone,
      email: c.email,
      city: c.city,
      service: m.service,
      productId: m.productId,
      message: m.message,
      preferredDate: m.type === 'measurement' ? new Date(now.getTime() + (2 + i) * 86400000).toISOString().slice(0, 10) : undefined,
      status,
      seen: status !== 'new',
      scheduledAt,
    } satisfies Inquiry;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
