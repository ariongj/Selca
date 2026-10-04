import type { CmsPage, Coupon, HomeSection, L10n, Post, Project, Settings } from '@/lib/types';

const T = (me: string, sq: string, en: string): L10n => ({ me, sq, en });

/* ------------------------------------------------------------------ */
/* Settings (placeholders marked in Admin → Postavke)                  */
/* ------------------------------------------------------------------ */
export const DEFAULT_SETTINGS: Settings = {
  companyName: 'SELCA COMPANY',
  legalName: 'SELCA COMPANY d.o.o.',
  tagline: T('Sve za vaš dom', 'Çdo gjë për shtëpinë tuaj', 'Everything for your home'),
  about: T(
    'SELCA COMPANY je porodična firma za prodaju i ugradnju svega što čini dom — od vrata i prozora do podova, keramike, kupatila i kuhinja po mjeri. Vjerujemo da kvalitetan materijal vrijedi onoliko koliko i ruke koje ga ugrađuju.',
    'SELCA COMPANY është kompani familjare për shitjen dhe montimin e gjithçkaje që e bën një shtëpi — nga dyert dhe dritaret deri te dyshemetë, pllakat, banjot dhe kuzhinat me porosi. Besojmë se materiali cilësor vlen aq sa duart që e montojnë.',
    'SELCA COMPANY is a family business that supplies and installs everything that makes a home — from doors and windows to floors, tiles, bathrooms and made-to-measure kitchens. We believe great materials are only as good as the hands that install them.',
  ),
  email: 'selca@live.com',
  phone: '+382 67 123 456',
  phone2: '',
  whatsapp: '+382 67 123 456',
  address: 'Magistralni put bb',
  city: 'Podgorica',
  mapUrl: 'https://maps.google.com/?q=Podgorica',
  hours: T('Pon–Pet 08–20h · Sub 08–15h', 'Hën–Pre 08–20 · Sht 08–15', 'Mon–Fri 8am–8pm · Sat 8am–3pm'),
  pib: '03XXXXXX',
  pdv: '40/31-XXXXX-X',
  bankName: 'CKB banka',
  bankAccount: '510-XXXXXXXXXXXXX-XX',
  instagram: 'selca_doo',
  facebook: '',
  currency: 'EUR',
  vatRate: 21,
  freeShippingThreshold: 300,
  shippingZones: [
    { id: 'z1', name: 'Podgorica i okolina', cities: ['Podgorica', 'Tuzi', 'Zeta', 'Danilovgrad'], fee: 10, days: '1–2' },
    { id: 'z2', name: 'Primorje', cities: ['Bar', 'Ulcinj', 'Budva', 'Kotor', 'Tivat', 'Herceg Novi'], fee: 20, days: '2–3' },
    {
      id: 'z3',
      name: 'Centralni i sjeverni region',
      cities: ['Nikšić', 'Cetinje', 'Kolašin', 'Mojkovac', 'Bijelo Polje', 'Berane', 'Andrijevica', 'Plav', 'Gusinje', 'Rožaje', 'Petnjica', 'Pljevlja', 'Žabljak', 'Šavnik', 'Plužine'],
      fee: 25,
      days: '2–4',
    },
  ],
  pickupAddress: 'Magistralni put bb, Podgorica',
  payments: { cod: true, bank: true, card: true },
  languages: { me: true, sq: true, en: true },
  announcements: [
    T('Besplatno mjerenje i stručna ugradnja širom Crne Gore', 'Matje falas dhe montim profesional në gjithë Malin e Zi', 'Free measurement & expert installation across Montenegro'),
    T('Besplatna dostava za narudžbe preko 300 €', 'Transport falas për porosi mbi 300 €', 'Free delivery on orders over €300'),
    T('Jesenja akcija: do −20% na podove i keramiku', 'Ofertë vjeshte: deri −20% në dysheme dhe pllaka', 'Autumn sale: up to −20% on flooring & tiles'),
  ],
  brandColor: '#9a2e2e',
  demoBanner: true,
  seo: {
    title: 'SELCA COMPANY — Sve za vaš dom',
    description: 'Prodaja i ugradnja vrata, prozora, podova, keramike, opreme za kupatilo i kuhinja po mjeri. Besplatno mjerenje i dostava širom Crne Gore.',
  },
  adminEmail: 'admin@selca.me',

  /* ---- CMS v2 ---- */
  timezone: 'Europe/Podgorica',
  orderPrefix: 'SC-',
  locations: [
    { id: 'loc-pg', name: 'Salon Podgorica', address: 'Magistralni put bb', city: 'Podgorica', pickup: true, isDefault: true },
    { id: 'loc-tz', name: 'Magacin Tuzi', address: 'Industrijska zona bb', city: 'Tuzi', pickup: false, isDefault: false },
  ],
  notifications: [
    { id: 'nt-order', event: 'order_placed', enabled: true, recipients: 'customer', subject: T('Primili smo vašu narudžbu {number}', 'E morëm porosinë tuaj {number}', 'We received your order {number}') },
    { id: 'nt-confirm', event: 'order_confirmed', enabled: true, recipients: 'customer', subject: T('Narudžba {number} je potvrđena', 'Porosia {number} u konfirmua', 'Order {number} is confirmed') },
    { id: 'nt-payment', event: 'payment_received', enabled: true, recipients: 'customer', subject: T('Uplata za narudžbu {number} je evidentirana', 'Pagesa për porosinë {number} u regjistrua', 'Payment for order {number} received') },
    { id: 'nt-shipped', event: 'order_shipped', enabled: true, recipients: 'customer', subject: T('Narudžba {number} je na putu', 'Porosia {number} është në rrugë', 'Order {number} is on its way') },
    { id: 'nt-return', event: 'return_requested', enabled: true, recipients: 'staff', subject: T('Novi zahtjev za povrat {number}', 'Kërkesë e re për kthim {number}', 'New return request {number}') },
    { id: 'nt-refund', event: 'return_refunded', enabled: true, recipients: 'customer', subject: T('Povrat novca za {number}', 'Rimbursimi për {number}', 'Refund for {number}') },
    { id: 'nt-contact', event: 'contact_received', enabled: true, recipients: 'customer', subject: T('Hvala — javićemo vam se danas', 'Faleminderit — do t’ju kontaktojmë sot', 'Thank you — we’ll get back to you today') },
    { id: 'nt-booking', event: 'booking_confirmed', enabled: true, recipients: 'customer', subject: T('Termin {date} je potvrđen', 'Termini {date} u konfirmua', 'Your appointment on {date} is confirmed') },
    { id: 'nt-reminder', event: 'booking_reminder', enabled: false, recipients: 'customer', subject: T('Podsjetnik: termin sjutra u {time}', 'Kujtesë: termini nesër në {time}', 'Reminder: appointment tomorrow at {time}') },
    { id: 'nt-staff-order', event: 'staff_new_order', enabled: true, recipients: 'staff', subject: T('Nova narudžba {number} — {total}', 'Porosi e re {number} — {total}', 'New order {number} — {total}') },
    { id: 'nt-staff-inquiry', event: 'staff_new_inquiry', enabled: true, recipients: 'staff', subject: T('Novi upit: {name}', 'Kërkesë e re: {name}', 'New enquiry: {name}') },
  ],
  integrations: [
    { id: 'int-payment', kind: 'payment', name: 'Kartično plaćanje (payment gateway)', status: 'test', note: 'Test način — kartice se ne terete. Produkcijski ključevi poslije ugovora sa bankom.' },
    { id: 'int-courier', kind: 'courier', name: 'Kurirska služba', status: 'disconnected', note: 'Za sada dostava sopstvenim vozilima; API kurira po izboru partnera.' },
    { id: 'int-email', kind: 'email', name: 'Transakcijski e-mail (SMTP)', status: 'connected', note: 'Potvrde narudžbi i termina šalju se sa info@selca.me.' },
    { id: 'int-fiscal', kind: 'fiscal', name: 'Fiskalizacija (EFI)', status: 'disconnected', note: 'Povezivanje sa poreskim sistemom EFI — u planu za fazu 2.' },
    { id: 'int-analytics', kind: 'analytics', name: 'Google Analytics 4', status: 'test', note: 'Mjerenje posjeta i konverzija u test property-ju.' },
  ],
  markets: [
    { id: 'mk-me', name: T('Crna Gora', 'Mali i Zi', 'Montenegro'), countries: ['ME'], currency: 'EUR', languages: ['me', 'sq', 'en'], status: 'active' },
    { id: 'mk-xk', name: T('Kosovo', 'Kosova', 'Kosovo'), countries: ['XK'], currency: 'EUR', languages: ['sq', 'en'], status: 'draft' },
    { id: 'mk-al', name: T('Albanija', 'Shqipëria', 'Albania'), countries: ['AL'], currency: 'ALL', languages: ['sq', 'en'], status: 'draft' },
  ],
  checkout: { guest: true, phoneRequired: true, companyField: 'optional', marketingOptIn: false },
  privacy: { cookieBanner: true },
};

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */
export function buildHome(now = new Date()): HomeSection[] {
  const endsAt = new Date(now.getTime() + 12 * 86400000 + 5 * 3600000).toISOString();
  return [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      data: {
        autoplay: true,
        slides: [
          {
            id: 's1',
            image: '/images/hero/living.webp',
            eyebrow: T('Prodaja & ugradnja', 'Shitje & montim', 'Supply & installation'),
            title: T('Sve za vaš *dom*.', 'Çdo gjë për *shtëpinë* tuaj.', 'Everything for your *home*.'),
            subtitle: T(
              'Vrata, prozori, podovi, keramika, kupatila i kuhinje — od besplatnog mjerenja do posljednjeg detalja ugradnje.',
              'Dyer, dritare, dysheme, pllaka, banjo dhe kuzhina — nga matja falas deri te detaji i fundit i montimit.',
              'Doors, windows, flooring, tiles, bathrooms and kitchens — from a free measurement to the last detail of installation.',
            ),
            primary: { label: T('Pogledajte ponudu', 'Shikoni ofertën', 'Shop the range'), href: '/proizvodi' },
            secondary: { label: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'), href: '/#mjerenje' },
          },
          {
            id: 's2',
            image: '/images/hero/kitchen.webp',
            eyebrow: T('Kuhinje po mjeri', 'Kuzhina me porosi', 'Made-to-measure kitchens'),
            title: T('Prostor koji je *samo vaš*.', 'Hapësirë që është *vetëm e juaja*.', 'A space that is *yours alone*.'),
            subtitle: T(
              '3D projekat, izrada u radionici i montaža po sistemu „ključ u ruke“ — za 30 dana.',
              'Projekt 3D, prodhim në punishte dhe montim „me çelës në dorë“ — për 30 ditë.',
              '3D design, workshop-built and fitted turnkey — in 30 days.',
            ),
            primary: { label: T('Pogledajte kuhinje', 'Shikoni kuzhinat', 'Explore kitchens'), href: '/proizvodi/kuhinje' },
            secondary: { label: T('Zatražite ponudu', 'Kërkoni ofertë', 'Request a quote'), href: '/kontakt' },
          },
          {
            id: 's3',
            image: '/images/hero/bath.webp',
            eyebrow: T('Kupatila', 'Banjo', 'Bathrooms'),
            title: T('Kupatilo kao *mali spa*.', 'Banjo si një *spa e vogël*.', 'A bathroom like a *little spa*.'),
            subtitle: T(
              'Samostojeće kade, walk-in tuševi i LED ogledala — uz kompletnu adaptaciju.',
              'Vaska të lira, dushe walk-in dhe pasqyra LED — me rinovim të plotë.',
              'Freestanding tubs, walk-in showers and LED mirrors — with complete renovation.',
            ),
            primary: { label: T('Oprema za kupatilo', 'Pajisje banjoje', 'Shop bathroom'), href: '/proizvodi/kupatilo' },
            secondary: { label: T('Naši radovi', 'Punimet tona', 'Our work'), href: '/projekti' },
          },
        ],
      },
    },
    {
      id: 'trust',
      type: 'trust',
      enabled: true,
      data: {
        items: [
          { icon: 'Ruler', title: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'), text: T('Na vašoj adresi u roku od 48h', 'Në adresën tuaj brenda 48 orëve', 'At your address within 48 hours') },
          { icon: 'Hammer', title: T('Stručna ugradnja', 'Montim profesional', 'Expert installation'), text: T('Sopstveni, iskusni montažni timovi', 'Ekipe tona me përvojë', 'Our own experienced fitting crews') },
          { icon: 'ShieldCheck', title: T('Garancija do 25 godina', 'Garanci deri 25 vjet', 'Up to 25-year warranty'), text: T('Na proizvode i izvedene radove', 'Për produktet dhe punimet', 'On products and workmanship') },
          { icon: 'Truck', title: T('Dostava širom Crne Gore', 'Dërgesë në gjithë Malin e Zi', 'Delivery across Montenegro'), text: T('Besplatno za narudžbe preko 300 €', 'Falas për porosi mbi 300 €', 'Free on orders over €300') },
        ],
      },
    },
    {
      id: 'categories',
      type: 'categories',
      enabled: true,
      data: {
        eyebrow: T('Asortiman', 'Asortimenti', 'Our range'),
        title: T('Šta uređujete *danas*?', 'Çfarë po rregulloni *sot*?', 'What are you working on *today*?'),
        subtitle: T('Šest kategorija, jedan partner — od izbora do ugradnje.', 'Gjashtë kategori, një partner — nga zgjedhja te montimi.', 'Six categories, one partner — from selection to installation.'),
      },
    },
    {
      id: 'featured',
      type: 'featured',
      enabled: true,
      data: {
        eyebrow: T('Izdvajamo', 'Të veçuara', 'Featured'),
        title: T('Najprodavanije ove sezone', 'Më të shiturat e sezonit', 'This season’s bestsellers'),
        mode: 'bestsellers',
        productIds: [],
      },
    },
    {
      id: 'promo',
      type: 'promo',
      enabled: true,
      data: {
        eyebrow: T('Jesenja akcija', 'Ofertë vjeshte', 'Autumn sale'),
        title: T('Do −20% na podove i keramiku', 'Deri −20% në dysheme dhe pllaka', 'Up to −20% on flooring & tiles'),
        text: T(
          'Laminat, parket i porculanske pločice po akcijskim cijenama — uz besplatno mjerenje i stručno postavljanje. Sa kodom SELCA10 ostvarujete dodatnih 10%.',
          'Laminat, parket dhe pllaka porcelani me çmime ofertë — me matje falas dhe shtrim profesional. Me kodin SELCA10 përfitoni edhe 10% shtesë.',
          'Laminate, parquet and porcelain tiles at sale prices — with free measurement and expert installation. Use code SELCA10 for an extra 10% off.',
        ),
        image: '/images/cat/podovi.webp',
        cta: { label: T('Pogledajte akciju', 'Shikoni ofertën', 'Shop the sale'), href: '/proizvodi?akcija=1' },
        endsAt,
        code: 'SELCA10',
      },
    },
    {
      id: 'process',
      type: 'process',
      enabled: true,
      data: {
        eyebrow: T('Kako radimo', 'Si punojmë', 'How we work'),
        title: T('Od ideje do *ključa u ruke* — u četiri koraka', 'Nga ideja te *çelësi në dorë* — në katër hapa', 'From idea to *turnkey* — in four steps'),
        steps: [
          {
            title: T('Konsultacija', 'Konsultimi', 'Consultation'),
            text: T('Posjetite naš salon ili nas pozovite — pomažemo vam da izaberete materijale i rješenja.', 'Vizitoni sallonin tonë ose na telefononi — ju ndihmojmë të zgjidhni materialet dhe zgjidhjet.', 'Visit our showroom or call us — we help you choose materials and solutions.'),
          },
          {
            title: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'),
            text: T('Tehničar dolazi na adresu, mjeri prostor i savjetuje vas na licu mjesta.', 'Tekniku vjen në adresë, mat hapësirën dhe ju këshillon në vend.', 'A technician visits, measures the space and advises you on site.'),
          },
          {
            title: T('Ponuda i izrada', 'Oferta dhe prodhimi', 'Quote & production'),
            text: T('Preciznu ponudu dobijate za 48h, a proizvodi se pripremaju po mjeri.', 'Oferta e saktë vjen brenda 48 orëve, ndërsa produktet përgatiten sipas masës.', 'You get a precise quote within 48 hours, and products are made to measure.'),
          },
          {
            title: T('Ugradnja i garancija', 'Montimi dhe garancia', 'Installation & warranty'),
            text: T('Montažni tim radi čisto i precizno, a mi stojimo iza svakog posla.', 'Ekipa e montimit punon pastër dhe saktë, dhe ne garantojmë çdo punë.', 'Our crew works cleanly and precisely — and we stand behind every job.'),
          },
        ],
      },
    },
    {
      id: 'services',
      type: 'services',
      enabled: true,
      data: {
        eyebrow: T('Usluge', 'Shërbimet', 'Services'),
        title: T('Ne ne prodajemo samo materijal — *mi ga ugrađujemo*', 'Ne nuk shesim vetëm materiale — *i montojmë*', 'We don’t just sell materials — *we install them*'),
        subtitle: T('Sopstveni timovi majstora za svaku fazu radova.', 'Ekipe tona mjeshtrash për çdo fazë të punimeve.', 'Our own skilled crews for every stage of the job.'),
        items: [
          { image: '/images/s/mjerenje.webp', title: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'), text: T('Precizno mjerenje i stručni savjet na vašoj adresi, bez obaveze kupovine.', 'Matje e saktë dhe këshillë profesionale në adresën tuaj, pa detyrim blerjeje.', 'Precise measuring and expert advice at your address, with no obligation.') },
          { image: '/images/s/ugradnja-prozora.webp', title: T('Ugradnja vrata i prozora', 'Montimi i dyerve dhe dritareve', 'Door & window fitting'), text: T('RAL montaža sa paronepropusnim trakama — bez toplotnih mostova.', 'Montim RAL me shirita kundër avullit — pa ura termike.', 'RAL-standard fitting with vapour-tight tapes — no thermal bridges.') },
          { image: '/images/s/podovi.webp', title: T('Postavljanje podova', 'Shtrimi i dyshemeve', 'Floor installation'), text: T('Priprema podloge, laminat, parket i vinil, lajsne i prelazi.', 'Përgatitja e bazës, laminat, parket dhe vinil, listela dhe kalime.', 'Subfloor prep, laminate, parquet and vinyl, skirting and transitions.') },
          { image: '/images/s/adaptacija.webp', title: T('Adaptacija kupatila', 'Rinovimi i banjos', 'Bathroom renovation'), text: T('„Ključ u ruke“: instalacije, hidroizolacija, keramika i sanitarije.', '„Me çelës në dorë“: instalime, hidroizolim, pllaka dhe sanitari.', 'Turnkey: plumbing, waterproofing, tiling and sanitaryware.') },
          { image: '/images/s/majstor.webp', title: T('Kuhinje po mjeri', 'Kuzhina me porosi', 'Made-to-measure kitchens'), text: T('3D projekat, izrada u našoj radionici i precizna montaža.', 'Projekt 3D, prodhim në punishten tonë dhe montim i saktë.', '3D design, built in our workshop and precisely fitted.') },
          { image: '/images/s/gips.webp', title: T('Gips i završni radovi', 'Gips dhe punime përfundimtare', 'Drywall & finishing'), text: T('Spušteni plafoni, pregradni zidovi, gletovanje i krečenje.', 'Tavane të varura, mure ndarëse, stukim dhe lyerje.', 'Suspended ceilings, partitions, skimming and painting.') },
        ],
      },
    },
    {
      id: 'projects',
      type: 'projects',
      enabled: true,
      data: {
        eyebrow: T('Realizacije', 'Realizimet', 'Our work'),
        title: T('Domovi koje smo *uredili*', 'Shtëpi që i kemi *rregulluar*', 'Homes we have *transformed*'),
        subtitle: T('Mali izbor projekata iz cijele Crne Gore.', 'Një përzgjedhje e vogël projektesh nga i gjithë Mali i Zi.', 'A small selection of projects from across Montenegro.'),
      },
    },
    {
      id: 'stats',
      type: 'stats',
      enabled: true,
      data: {
        image: '/images/s/majstor.webp',
        quote: T(
          'Naš posao nije gotov kada se vrata zatvore — gotov je kada ste vi zadovoljni.',
          'Puna jonë nuk mbaron kur mbyllet dera — mbaron kur jeni ju të kënaqur.',
          'Our job isn’t done when the door closes — it’s done when you’re happy.',
        ),
        items: [
          { value: '48h', label: T('do ponude nakon mjerenja', 'deri te oferta pas matjes', 'from measurement to quote') },
          { value: '25', label: T('godina garancije na parket', 'vjet garanci për parketin', 'year warranty on parquet') },
          { value: '6', label: T('kategorija za cijeli dom', 'kategori për gjithë shtëpinë', 'categories for the whole home') },
          { value: '1', label: T('partner od mjerenja do ugradnje', 'partner nga matja te montimi', 'partner from measuring to fitting') },
        ],
      },
    },
    {
      id: 'blog',
      type: 'blog',
      enabled: true,
      data: {
        eyebrow: T('Savjeti', 'Këshilla', 'Advice'),
        title: T('Savjeti za uređenje doma', 'Këshilla për rregullimin e shtëpisë', 'Home improvement advice'),
      },
    },
    {
      id: 'faq',
      type: 'faq',
      enabled: true,
      data: {
        eyebrow: T('Pitanja', 'Pyetje', 'FAQ'),
        title: T('Česta pitanja', 'Pyetje të shpeshta', 'Frequently asked questions'),
        items: [
          {
            q: T('Da li je mjerenje zaista besplatno?', 'A është matja vërtet falas?', 'Is the measurement really free?'),
            a: T(
              'Da. Mjerenje i savjetovanje na vašoj adresi su potpuno besplatni i ne obavezuju vas na kupovinu. Termin zakazujete putem forme ili telefonom.',
              'Po. Matja dhe këshillimi në adresën tuaj janë plotësisht falas dhe nuk ju detyrojnë të blini. Terminin e caktoni përmes formularit ose në telefon.',
              'Yes. Measuring and advice at your address are completely free with no obligation to buy. Book through the form or by phone.',
            ),
          },
          {
            q: T('Koliko traje isporuka?', 'Sa zgjat dërgesa?', 'How long does delivery take?'),
            a: T(
              'Proizvodi sa stanja stižu za 1–4 radna dana, zavisno od grada. Stolarija i kuhinje po mjeri izrađuju se 2–6 sedmica — tačan rok piše na svakom proizvodu.',
              'Produktet në stok arrijnë për 1–4 ditë pune, varësisht nga qyteti. Dograma dhe kuzhinat me porosi prodhohen për 2–6 javë — afati i saktë shkruhet te çdo produkt.',
              'In-stock items arrive in 1–4 working days depending on the city. Made-to-measure windows and kitchens take 2–6 weeks — the exact lead time is shown on each product.',
            ),
          },
          {
            q: T('Da li ugradnju radite u cijeloj Crnoj Gori?', 'A bëni montim në gjithë Malin e Zi?', 'Do you install across Montenegro?'),
            a: T(
              'Da, naši montažni timovi rade u svim opštinama. Ugradnju dodajete direktno u korpi — i tada je dostava besplatna.',
              'Po, ekipet tona punojnë në të gjitha komunat. Montimin e shtoni direkt në shportë — dhe atëherë transporti është falas.',
              'Yes, our crews work in every municipality. Add installation right in the cart — and delivery becomes free.',
            ),
          },
          {
            q: T('Kako mogu da platim?', 'Si mund të paguaj?', 'How can I pay?'),
            a: T(
              'Pouzećem pri isporuci, uplatom na račun ili platnom karticom online. Za veće projekte nudimo plaćanje na rate.',
              'Me para në dorëzim, me transfertë bankare ose me kartelë online. Për projekte më të mëdha ofrojmë pagesë me këste.',
              'Cash on delivery, bank transfer or card online. For larger projects we offer instalment plans.',
            ),
          },
          {
            q: T('Koliko materijala da naručim za pod?', 'Sa material duhet të porosis për dyshemenë?', 'How much flooring should I order?'),
            a: T(
              'Na stranici svakog poda nalazi se kalkulator: unesite površinu u m², a mi automatski dodajemo 10% rezerve za sječenje i računamo broj paketa.',
              'Në faqen e çdo dyshemeje ka një kalkulator: shkruani sipërfaqen në m², ne shtojmë automatikisht 10% rezervë për prerje dhe llogarisim numrin e pakove.',
              'Every flooring page has a calculator: enter your area in m² and we add 10% for cutting and work out the number of packs.',
            ),
          },
          {
            q: T('Šta pokriva garancija?', 'Çfarë mbulon garancia?', 'What does the warranty cover?'),
            a: T(
              'Garancija proizvođača traje od 2 do 25 godina, zavisno od proizvoda. Na naše radove ugradnje dajemo dodatne 2 godine garancije.',
              'Garancia e prodhuesit zgjat nga 2 deri 25 vjet, varësisht nga produkti. Për punimet tona të montimit japim 2 vjet garanci shtesë.',
              'Manufacturer warranties run from 2 to 25 years depending on the product. We add a further 2 years on our installation work.',
            ),
          },
        ],
      },
    },
    {
      id: 'instagram',
      type: 'instagram',
      enabled: true,
      data: {
        title: T('Pratite nas na Instagramu', 'Na ndiqni në Instagram', 'Follow us on Instagram'),
        images: [
          '/images/projects/kupatilo-travertin.webp',
          '/images/p/vrata-linea-1.webp',
          '/images/projects/kuhinja-orah.webp',
          '/images/p/parket-natur-1.webp',
          '/images/p/ogledalo-luna-1.webp',
          '/images/projects/stan-hrast.webp',
        ],
      },
    },
    {
      id: 'cta',
      type: 'cta',
      enabled: true,
      data: {
        eyebrow: T('Besplatno mjerenje', 'Matje falas', 'Free measurement'),
        title: T('Zakažite mjerenje — dolazimo za 48 sati', 'Caktoni matjen — vijmë brenda 48 orëve', 'Book a measurement — we’ll be there in 48 hours'),
        text: T(
          'Ostavite kontakt i opišite šta planirate. Javićemo vam se istog dana da dogovorimo termin.',
          'Lini kontaktin dhe përshkruani çfarë planifikoni. Do t’ju kontaktojmë të njëjtën ditë për të caktuar terminin.',
          'Leave your details and tell us what you’re planning. We’ll call you the same day to arrange a visit.',
        ),
        image: '/images/s/mjerenje.webp',
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Projects / portfolio                                                */
/* ------------------------------------------------------------------ */
const TAG = {
  windows: T('Prozori', 'Dritare', 'Windows'),
  doors: T('Vrata', 'Dyer', 'Doors'),
  floors: T('Podovi', 'Dysheme', 'Flooring'),
  tiles: T('Keramika', 'Pllaka', 'Tiles'),
  bath: T('Kupatilo', 'Banjo', 'Bathroom'),
  kitchen: T('Kuhinja', 'Kuzhinë', 'Kitchen'),
};

export const PROJECTS: Project[] = [
  {
    id: 'pr-1',
    title: T('Vila sa bazenom — kompletna ALU stolarija', 'Vilë me pishinë — dogramë e plotë alumini', 'Villa with pool — full aluminium glazing'),
    location: 'Budva',
    year: 2025,
    tags: [TAG.windows, TAG.floors],
    summary: T('Panoramski HS sistemi, ALU prozori Slim 70 i porculanski podovi velikog formata.', 'Sisteme panoramike HS, dritare alumini Slim 70 dhe dysheme porcelani të formatit të madh.', 'Panoramic HS sliders, Slim 70 aluminium windows and large-format porcelain floors.'),
    image: '/images/projects/vila-primorje.webp',
    featured: true,
  },
  {
    id: 'pr-2',
    title: T('Spa kupatilo od travertina', 'Banjo spa me travertin', 'Travertine spa bathroom'),
    location: 'Podgorica',
    year: 2025,
    tags: [TAG.bath, TAG.tiles],
    summary: T('Walk-in tuš, ugradne crne baterije i indirektna LED rasvjeta.', 'Dush walk-in, bateri të zeza të integruara dhe ndriçim LED indirekt.', 'Walk-in shower, concealed black fittings and indirect LED lighting.'),
    image: '/images/projects/kupatilo-travertin.webp',
    featured: true,
  },
  {
    id: 'pr-3',
    title: T('Kuhinja od oraha sa ostrvom', 'Kuzhinë arre me ishull', 'Walnut kitchen with island'),
    location: 'Podgorica',
    year: 2025,
    tags: [TAG.kitchen],
    summary: T('Kuhinja Noce po mjeri sa rebrastim ostrvom i radnom pločom od sinterovanog kamena.', 'Kuzhinë Noce me porosi me ishull me brinjë dhe sipërfaqe guri të sinterizuar.', 'A made-to-measure Noce kitchen with a fluted island and sintered-stone worktop.'),
    image: '/images/projects/kuhinja-orah.webp',
    featured: true,
  },
  {
    id: 'pr-4',
    title: T('Stan sa hrastovim podom', 'Apartament me dysheme lisi', 'Apartment with oak floors'),
    location: 'Nikšić',
    year: 2024,
    tags: [TAG.floors, TAG.doors],
    summary: T('85 m² laminata Nordic Light Oak i sobna vrata Classica u cijelom stanu.', '85 m² laminat Nordic Light Oak dhe dyer Classica në gjithë apartamentin.', '85 m² of Nordic Light Oak laminate and Classica doors throughout.'),
    image: '/images/projects/stan-hrast.webp',
    featured: true,
  },
  {
    id: 'pr-5',
    title: T('Porodično kupatilo', 'Banjo familjare', 'Family bathroom'),
    location: 'Bar',
    year: 2025,
    tags: [TAG.bath],
    summary: T('Samostojeća kada, dupli ormarić od hrasta i ovalna ogledala.', 'Vaskë e lirë, dollap i dyfishtë lisi dhe pasqyra ovale.', 'Freestanding bath, double oak vanity and oval mirrors.'),
    image: '/images/projects/kupatilo-oval.webp',
    featured: true,
  },
  {
    id: 'pr-6',
    title: T('Dnevni boravak sa panoramskim prozorima', 'Dhomë ndenjeje me dritare panoramike', 'Living room with panoramic windows'),
    location: 'Ulcinj',
    year: 2024,
    tags: [TAG.windows, TAG.floors],
    summary: T('PVC prozori Thermo 76 u antracitu i topli hrastov parket.', 'Dritare PVC Thermo 76 në antracit dhe parket i ngrohtë lisi.', 'Thermo 76 PVC windows in anthracite and warm oak parquet.'),
    image: '/images/projects/dnevna-svjetla.webp',
    featured: true,
  },
  {
    id: 'pr-7',
    title: T('Master kupatilo u toplim tonovima', 'Banjo master në tone të ngrohta', 'Warm-toned master bathroom'),
    location: 'Tivat',
    year: 2024,
    tags: [TAG.bath, TAG.tiles],
    summary: T('Porculan velikog formata, walk-in tuš i dvostruki umivaonik.', 'Porcelan i formatit të madh, dush walk-in dhe lavaman i dyfishtë.', 'Large-format porcelain, walk-in shower and double basin.'),
    image: '/images/projects/kupatilo-toplo.webp',
    featured: false,
  },
  {
    id: 'pr-8',
    title: T('Kuhinja u sivoj boji', 'Kuzhinë në ngjyrë gri', 'Grey shaker kitchen'),
    location: 'Danilovgrad',
    year: 2025,
    tags: [TAG.kitchen],
    summary: T('Kasetirani frontovi, ostrvo sa šankom i crna kuhinjska slavina Pro.', 'Fasada me kaseta, ishull me banak dhe rubinet i zi Pro.', 'Shaker fronts, a breakfast-bar island and a black Pro mixer.'),
    image: '/images/projects/kuhinja-siva.webp',
    featured: false,
  },
  {
    id: 'pr-9',
    title: T('Moderna kuća — vrata i prozori', 'Shtëpi moderne — dyer dhe dritare', 'Modern house — doors & windows'),
    location: 'Cetinje',
    year: 2024,
    tags: [TAG.windows, TAG.doors],
    summary: T('Sigurnosna vrata Guardian RC3 i ALU stolarija sa termo-prekidom.', 'Derë sigurie Guardian RC3 dhe dogramë alumini me ndërprerje termike.', 'Guardian RC3 security door and thermally broken aluminium joinery.'),
    image: '/images/misc/house-dusk.webp',
    featured: false,
  },
  {
    id: 'pr-10',
    title: T('Mediteranska vila', 'Vilë mesdhetare', 'Mediterranean villa'),
    location: 'Herceg Novi',
    year: 2023,
    tags: [TAG.windows, TAG.tiles],
    summary: T('ALU škure Mediteran, terasa od porculana R10 i klizna balkonska vrata.', 'Grila alumini Mediteran, tarracë porcelani R10 dhe dyer ballkoni rrëshqitëse.', 'Mediteran aluminium shutters, R10 porcelain terrace and sliding balcony doors.'),
    image: '/images/misc/villa.webp',
    featured: false,
  },
];

/* ------------------------------------------------------------------ */
/* CMS pages                                                           */
/* ------------------------------------------------------------------ */
export function buildPages(now = new Date()): CmsPage[] {
  const at = now.toISOString();
  return [
    {
      id: 'pg-dostava',
      slug: 'dostava-i-ugradnja',
      title: T('Dostava i ugradnja', 'Dërgesa dhe montimi', 'Delivery & installation'),
      body: T(
        `Dostavljamo širom Crne Gore sopstvenim vozilima, a ugradnju izvode naši montažni timovi.

## Rokovi isporuke
- Proizvodi sa stanja: 1–4 radna dana, zavisno od grada
- Stolarija po mjeri: 2–4 sedmice
- Kuhinje po mjeri: 4–6 sedmica

## Cijena dostave
- Podgorica i okolina: 10 €
- Primorje: 20 €
- Centralni i sjeverni region: 25 €

Dostava je **besplatna** za narudžbe preko 300 € i za sve narudžbe sa ugradnjom.

## Ugradnja
Ugradnju možete dodati uz svaki proizvod direktno u korpi. Prije ugradnje naš tehničar besplatno provjerava mjere na licu mjesta.`,
        `Dërgojmë në gjithë Malin e Zi me automjetet tona, ndërsa montimin e kryejnë ekipet tona.

## Afatet e dërgesës
- Produktet në stok: 1–4 ditë pune, varësisht nga qyteti
- Dograma me porosi: 2–4 javë
- Kuzhinat me porosi: 4–6 javë

## Çmimi i transportit
- Podgorica dhe rrethina: 10 €
- Bregdeti: 20 €
- Rajoni qendror dhe verior: 25 €

Transporti është **falas** për porosi mbi 300 € dhe për të gjitha porositë me montim.

## Montimi
Montimin mund ta shtoni për çdo produkt direkt në shportë. Para montimit tekniku ynë i kontrollon masat në vend falas.`,
        `We deliver across Montenegro with our own vehicles, and installation is carried out by our own fitting crews.

## Lead times
- In-stock items: 1–4 working days depending on the city
- Made-to-measure windows and doors: 2–4 weeks
- Made-to-measure kitchens: 4–6 weeks

## Delivery prices
- Podgorica area: €10
- Coast: €20
- Central & northern region: €25

Delivery is **free** on orders over €300 and on every order with installation.

## Installation
Add installation to any product right in the cart. Before fitting, our technician double-checks measurements on site free of charge.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-uslovi',
      slug: 'uslovi-kupovine',
      title: T('Uslovi kupovine', 'Kushtet e blerjes', 'Terms of purchase'),
      body: T(
        `Ovi uslovi uređuju kupovinu putem internet prodavnice SELCA COMPANY d.o.o.

## Narudžba
Narudžba je potvrđena kada od nas dobijete potvrdu putem e-maila ili telefona. Za proizvode po mjeri potvrda slijedi nakon kontrolnog mjerenja.

## Cijene
Sve cijene su izražene u eurima i uključuju PDV od 21%. Zadržavamo pravo izmjene cijena bez prethodne najave; za potvrđene narudžbe važi cijena iz potvrde.

## Plaćanje
- Pouzećem prilikom isporuke
- Uplatom na račun na osnovu predračuna
- Platnom karticom (Visa, Mastercard, Maestro)

## Pravo na odustanak
Za proizvode sa stanja imate pravo na odustanak u roku od 14 dana. Proizvodi izrađeni po mjeri ne mogu se vratiti.`,
        `Këto kushte rregullojnë blerjen përmes dyqanit online të SELCA COMPANY d.o.o.

## Porosia
Porosia konfirmohet kur merrni konfirmimin tonë me e-mail ose telefon. Për produktet me porosi konfirmimi vjen pas matjes kontrolluese.

## Çmimet
Të gjitha çmimet janë në euro dhe përfshijnë TVSH 21%. Ruajmë të drejtën e ndryshimit të çmimeve pa njoftim paraprak; për porositë e konfirmuara vlen çmimi nga konfirmimi.

## Pagesa
- Me para në dorëzim
- Me transfertë bankare sipas parafaturës
- Me kartelë pagese (Visa, Mastercard, Maestro)

## E drejta e tërheqjes
Për produktet në stok keni të drejtë tërheqjeje brenda 14 ditëve. Produktet e prodhuara me porosi nuk kthehen.`,
        `These terms govern purchases through the SELCA COMPANY d.o.o. online store.

## Orders
An order is confirmed once you receive our confirmation by e-mail or phone. For made-to-measure products, confirmation follows a check measurement.

## Prices
All prices are in euros and include 21% VAT. We may change prices without notice; confirmed orders keep the confirmed price.

## Payment
- Cash on delivery
- Bank transfer against a pro-forma invoice
- Card payment (Visa, Mastercard, Maestro)

## Right of withdrawal
For in-stock items you may withdraw within 14 days. Made-to-measure products cannot be returned.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-reklamacije',
      slug: 'reklamacije-i-povrat',
      title: T('Reklamacije i povrat', 'Reklamacionet dhe kthimi', 'Returns & complaints'),
      body: T(
        `Ako nešto nije u redu sa proizvodom ili ugradnjom, tu smo da to brzo riješimo.

## Kako prijaviti reklamaciju
1. Pošaljite nam e-mail ili poruku sa brojem narudžbe i fotografijom
2. Javljamo vam se u roku od 24 sata
3. Po potrebi tehničar dolazi na adresu

## Povrat robe
Neoštećeni proizvodi sa stanja u originalnom pakovanju mogu se vratiti u roku od 14 dana. Troškove povrata snosi kupac, osim u slučaju greške sa naše strane.`,
        `Nëse diçka nuk shkon me produktin ose montimin, jemi këtu ta zgjidhim shpejt.

## Si të paraqisni ankesë
1. Na dërgoni e-mail ose mesazh me numrin e porosisë dhe një foto
2. Ju përgjigjemi brenda 24 orëve
3. Sipas nevojës, tekniku vjen në adresë

## Kthimi i mallit
Produktet e padëmtuara në stok, në paketimin origjinal, mund të kthehen brenda 14 ditëve. Shpenzimet e kthimit i mbulon blerësi, përveç rasteve kur gabimi është yni.`,
        `If something isn't right with a product or installation, we're here to fix it quickly.

## How to report a problem
1. Send us an e-mail or message with your order number and a photo
2. We reply within 24 hours
3. If needed, a technician visits your address

## Returns
Undamaged in-stock items in original packaging can be returned within 14 days. Return costs are paid by the customer unless the error was ours.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
    {
      id: 'pg-privatnost',
      slug: 'politika-privatnosti',
      title: T('Politika privatnosti', 'Politika e privatësisë', 'Privacy policy'),
      body: T(
        `Vaše podatke koristimo isključivo za obradu narudžbi, zakazivanje mjerenja i ugradnje te komunikaciju sa vama.

## Koje podatke prikupljamo
- Ime i prezime, telefon i e-mail
- Adresu dostave i ugradnje
- Istoriju narudžbi

## Vaša prava
U svakom trenutku možete zatražiti uvid, ispravku ili brisanje svojih podataka slanjem e-maila na našu adresu.`,
        `Të dhënat tuaja i përdorim vetëm për përpunimin e porosive, caktimin e matjeve dhe montimit dhe komunikimin me ju.

## Çfarë të dhënash mbledhim
- Emrin dhe mbiemrin, telefonin dhe e-mailin
- Adresën e dërgesës dhe montimit
- Historinë e porosive

## Të drejtat tuaja
Në çdo kohë mund të kërkoni qasje, korrigjim ose fshirje të të dhënave tuaja duke na shkruar me e-mail.`,
        `We use your data solely to process orders, schedule measurements and installation, and communicate with you.

## What we collect
- Name, phone and e-mail
- Delivery and installation address
- Order history

## Your rights
You can request access to, correction of, or deletion of your data at any time by e-mailing us.`,
      ),
      published: true,
      showInFooter: true,
      updatedAt: at,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Blog — "Savjeti"                                                    */
/* ------------------------------------------------------------------ */
export function buildPosts(now = new Date()): Post[] {
  const d = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: 'post-laminat',
      slug: 'kako-izabrati-laminat',
      title: T('Kako izabrati pravi laminat: klasa, debljina i dekor', 'Si të zgjidhni laminatin e duhur: klasa, trashësia dhe dekori', 'How to choose the right laminate: wear class, thickness and décor'),
      excerpt: T(
        'AC4 ili AC5? 8 ili 10 mm? Objašnjavamo šta oznake znače i kako da izaberete pod koji će trajati.',
        'AC4 apo AC5? 8 apo 10 mm? Shpjegojmë çfarë do të thonë shenjat dhe si të zgjidhni një dysheme që zgjat.',
        'AC4 or AC5? 8 or 10 mm? We explain what the labels mean and how to choose a floor that lasts.',
      ),
      body: T(
        `Laminat je najpopularniji izbor poda u Crnoj Gori — povoljan je, lako se postavlja i izgleda kao pravo drvo. Ali nisu svi laminati isti.

## Klasa habanja
- **AC3** — spavaće sobe i prostorije sa malo saobraćaja
- **AC4** — dnevni boravci, hodnici i kuhinje
- **AC5** — veoma prometni prostori i poslovni objekti

## Debljina
Deblji laminat (10–12 mm) je tiši pod nogama i bolje prikriva manje neravnine podloge. Za stanove sa podnim grijanjem preporučujemo 8 mm.

## Dekor i format
Svijetli dekori optički šire prostor, a široke daske (preko 19 cm) daju luksuzniji utisak. V-fuga na sve četiri strane izgleda najprirodnije.

> Savjet: uvijek naručite 10% materijala više zbog sječenja — naš kalkulator to radi automatski.`,
        `Laminati është zgjedhja më popullore e dyshemesë në Mal të Zi — është i volitshëm, shtrohet lehtë dhe duket si dru i vërtetë. Por jo të gjithë laminatet janë njësoj.

## Klasa e konsumimit
- **AC3** — dhoma gjumi dhe ambiente me pak qarkullim
- **AC4** — dhoma ndenjeje, korridore dhe kuzhina
- **AC5** — ambiente me qarkullim të madh dhe objekte biznesi

## Trashësia
Laminati më i trashë (10–12 mm) është më i qetë nën këmbë dhe i fsheh më mirë parregullsitë e vogla. Për banesa me ngrohje nëndyshemeje rekomandojmë 8 mm.

## Dekori dhe formati
Dekoret e çelëta e zgjerojnë optikisht hapësirën, ndërsa dërrasat e gjera (mbi 19 cm) japin përshtypje më luksoze. V-fuga në të katër anët duket më natyrale.

> Këshillë: porositni gjithmonë 10% më shumë material për prerje — kalkulatori ynë e bën këtë automatikisht.`,
        `Laminate is the most popular flooring choice in Montenegro — it's affordable, quick to install and looks like real wood. But not all laminates are equal.

## Wear class
- **AC3** — bedrooms and low-traffic rooms
- **AC4** — living rooms, hallways and kitchens
- **AC5** — very busy areas and commercial spaces

## Thickness
Thicker laminate (10–12 mm) feels quieter underfoot and hides minor subfloor unevenness. For homes with underfloor heating we recommend 8 mm.

## Décor and format
Light décors make rooms feel larger, and wide planks (over 19 cm) look more luxurious. A V-groove on all four sides looks most natural.

> Tip: always order 10% extra for cutting — our calculator does this automatically.`,
      ),
      cover: '/images/p/laminat-nordic-2.webp',
      tag: T('Podovi', 'Dysheme', 'Flooring'),
      author: 'SELCA tim',
      readMinutes: 4,
      publishedAt: d(9),
      published: true,
    },
    {
      id: 'post-prozori',
      slug: 'pvc-ili-alu-prozori',
      title: T('PVC ili ALU prozori — šta je bolje za vaš dom?', 'Dritare PVC apo alumini — çfarë është më mirë për shtëpinë tuaj?', 'PVC or aluminium windows — which is right for your home?'),
      excerpt: T(
        'Poredimo izolaciju, izgled, održavanje i cijenu — da biste odluku donijeli bez dileme.',
        'Krahasojmë izolimin, pamjen, mirëmbajtjen dhe çmimin — që të vendosni pa dilemë.',
        'We compare insulation, looks, maintenance and price — so you can decide with confidence.',
      ),
      body: T(
        `Zamjena stolarije je jedna od najisplativijih investicija u dom — dobri prozori smanjuju račune za grijanje i hlađenje i do 30%.

## PVC prozori
- Odlična toplotna izolacija po povoljnoj cijeni
- Ne zahtijevaju održavanje
- Dostupni u bijeloj boji i dekorima (antracit, drvo)

## ALU prozori
- Tanji profili i veće staklene površine
- Izuzetna stabilnost — idealni za velike otvore i klizne sisteme
- Bilo koja RAL boja

## Naša preporuka
Za stanove i porodične kuće PVC daje najbolji odnos cijene i izolacije. Za moderne kuće sa velikim staklenim površinama izaberite ALU sa termo-prekidom.

> Zakažite besplatno mjerenje i donijećemo uzorke oba sistema na vašu adresu.`,
        `Zëvendësimi i dogramës është një nga investimet më të leverdishme në shtëpi — dritaret e mira i ulin faturat e ngrohjes dhe ftohjes deri në 30%.

## Dritaret PVC
- Izolim termik i shkëlqyer me çmim të volitshëm
- Nuk kërkojnë mirëmbajtje
- Në ngjyrë të bardhë dhe dekore (antracit, dru)

## Dritaret alumini
- Profile më të holla dhe sipërfaqe më të mëdha xhami
- Qëndrueshmëri e jashtëzakonshme — ideale për hapje të mëdha dhe sisteme rrëshqitëse
- Çdo ngjyrë RAL

## Rekomandimi ynë
Për apartamente dhe shtëpi familjare, PVC jep raportin më të mirë çmim–izolim. Për shtëpi moderne me sipërfaqe të mëdha xhami, zgjidhni alumin me ndërprerje termike.

> Caktoni matjen falas dhe do t'ju sjellim mostra të të dy sistemeve në adresë.`,
        `Replacing windows is one of the best-value investments in a home — good windows can cut heating and cooling bills by up to 30%.

## PVC windows
- Excellent insulation at a great price
- Maintenance-free
- Available in white and finishes such as anthracite and wood

## Aluminium windows
- Slimmer frames and larger glass areas
- Outstanding stability — ideal for large openings and sliding systems
- Any RAL colour

## Our recommendation
For apartments and family homes, PVC offers the best balance of price and insulation. For modern houses with large glazing, choose thermally broken aluminium.

> Book a free measurement and we'll bring samples of both systems to your door.`,
      ),
      cover: '/images/p/pvc-antracit-1.webp',
      tag: T('Prozori', 'Dritare', 'Windows'),
      author: 'SELCA tim',
      readMinutes: 5,
      publishedAt: d(23),
      published: true,
    },
    {
      id: 'post-kupatilo',
      slug: 'adaptacija-kupatila-korak-po-korak',
      title: T('Adaptacija kupatila korak po korak', 'Rinovimi i banjos hap pas hapi', 'Bathroom renovation, step by step'),
      excerpt: T(
        'Od rušenja do posljednje silikonske fuge — koliko traje, koliko košta i na šta da pazite.',
        'Nga prishja deri te fuga e fundit e silikonit — sa zgjat, sa kushton dhe çfarë të keni parasysh.',
        'From demolition to the last silicone joint — how long it takes, what it costs and what to watch for.',
      ),
      body: T(
        `Prosječna adaptacija kupatila od 5 m² traje 10 do 14 radnih dana. Evo kako izgleda proces kada ga radite sa nama.

## 1. Projekat i izbor
Na besplatnom mjerenju zajedno biramo raspored, pločice i sanitarije, a vi dobijate 3D prikaz i ponudu.

## 2. Rušenje i instalacije
Uklanjamo staru keramiku i sanitarije, a zatim postavljamo nove vodovodne i električne instalacije.

## 3. Hidroizolacija
Najvažniji korak koji se ne vidi — dvoslojna hidroizolacija tuš zone sprječava probleme godinama.

## 4. Keramika i sanitarije
Postavljamo pločice, ugrađujemo kadu ili tuš, ormarić, ogledalo i baterije.

> Savjet: walk-in tuš sa staklenim paravanom optički povećava i najmanje kupatilo.`,
        `Një rinovim mesatar i banjos 5 m² zgjat 10 deri 14 ditë pune. Ja si duket procesi kur e bëni me ne.

## 1. Projekti dhe zgjedhja
Në matjen falas zgjedhim së bashku planimetrinë, pllakat dhe sanitaret, ndërsa ju merrni pamje 3D dhe ofertë.

## 2. Prishja dhe instalimet
Heqim pllakat dhe sanitaret e vjetra, pastaj vendosim instalime të reja të ujit dhe elektrike.

## 3. Hidroizolimi
Hapi më i rëndësishëm që nuk duket — hidroizolimi dyshtresor i zonës së dushit parandalon probleme për vite.

## 4. Pllakat dhe sanitaret
Vendosim pllakat, montojmë vaskën ose dushin, dollapin, pasqyrën dhe bateritë.

> Këshillë: dushi walk-in me paravan xhami e zmadhon optikisht edhe banjon më të vogël.`,
        `An average 5 m² bathroom renovation takes 10 to 14 working days. Here's what the process looks like with us.

## 1. Design and selection
At the free measurement we choose the layout, tiles and sanitaryware together, and you receive a 3D render and a quote.

## 2. Demolition and services
We strip the old tiles and fittings, then install new plumbing and electrics.

## 3. Waterproofing
The most important step you never see — two-coat waterproofing of the shower area prevents problems for years.

## 4. Tiling and fittings
We lay the tiles and fit the bath or shower, vanity, mirror and taps.

> Tip: a walk-in shower with a glass screen makes even the smallest bathroom feel bigger.`,
      ),
      cover: '/images/projects/kupatilo-toplo.webp',
      tag: T('Kupatilo', 'Banjo', 'Bathroom'),
      author: 'SELCA tim',
      readMinutes: 6,
      publishedAt: d(41),
      published: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */
export function buildCoupons(now = new Date()): Coupon[] {
  return [
    { id: 'cp-1', code: 'SELCA10', type: 'percent', value: 10, minTotal: 100, active: true, uses: 37, description: 'Dobrodošlica — 10% na narudžbe preko 100 €' },
    { id: 'cp-2', code: 'JESEN25', type: 'fixed', value: 25, minTotal: 250, active: true, uses: 12, expiresAt: new Date(now.getTime() + 20 * 86400000).toISOString(), description: 'Jesenja akcija — 25 € popusta preko 250 €' },
    { id: 'cp-3', code: 'MAJSTOR50', type: 'fixed', value: 50, minTotal: 600, active: false, uses: 4, description: 'Za partnere i majstore (neaktivan)' },
  ];
}
