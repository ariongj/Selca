import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, Hammer, MapPin, Phone, ShieldCheck } from 'lucide-react';
import type { Category } from '@/lib/types';
import { Accent, Accordion, Img, Reveal } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/brand/Social';
import { PageHero, SectionHeading } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { C, ProcessSteps, StatsBand } from '@/site/components/company/Blocks';
import { pad2, scrollToId, telHref, useHomeData } from '@/site/components/company/data';
import { defineDict, useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useCategories, useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    heroFact1: 'Sopstveni montažni timovi',
    heroFact2: '2 godine garancije na radove',
    heroFact3: 'Dolazimo u sve opštine',
    index: 'Pregled usluga',
    included: 'Šta je uključeno',
    bookVisit: 'Zakaži termin',
    fromRange: 'Iz asortimana',
    faqHelp: 'Imate pitanje koje nije na listi? Pozovite nas — savjet je uvijek besplatan.',
    bookEyebrow: 'Besplatno mjerenje',
    bookTitle: 'Zakažite *mjerenje* — dolazimo za 48 sati',
    bookText: 'Ostavite kontakt i opišite šta planirate. Javljamo se istog dana da dogovorimo termin koji vam odgovara.',
    book1: 'Potpuno besplatno i bez obaveze',
    book2: 'Tehničar dolazi sa uzorcima materijala',
    book3: 'Precizna ponuda u roku od 48 sati',
    preferPhone: 'Radije telefonom?',
  },
  sq: {
    heroFact1: 'Ekipe tona montimi',
    heroFact2: '2 vjet garanci për punimet',
    heroFact3: 'Vijmë në të gjitha komunat',
    index: 'Pasqyra e shërbimeve',
    included: 'Çfarë përfshihet',
    bookVisit: 'Cakto terminin',
    fromRange: 'Nga asortimenti',
    faqHelp: 'Keni një pyetje që nuk është në listë? Na telefononi — këshilla është gjithmonë falas.',
    bookEyebrow: 'Matje falas',
    bookTitle: 'Caktoni *matjen* — vijmë brenda 48 orëve',
    bookText: 'Lini kontaktin dhe përshkruani çfarë planifikoni. Ju kontaktojmë të njëjtën ditë për të caktuar një termin që ju përshtatet.',
    book1: 'Plotësisht falas dhe pa detyrim',
    book2: 'Tekniku vjen me mostra materialesh',
    book3: 'Ofertë e saktë brenda 48 orëve',
    preferPhone: 'Preferoni telefonin?',
  },
  en: {
    heroFact1: 'Our own fitting crews',
    heroFact2: '2-year warranty on workmanship',
    heroFact3: 'We cover every municipality',
    index: 'Services at a glance',
    included: 'What’s included',
    bookVisit: 'Book a visit',
    fromRange: 'From our range',
    faqHelp: 'Got a question that isn’t listed? Give us a call — advice is always free.',
    bookEyebrow: 'Free measurement',
    bookTitle: 'Book a *measurement* — we’ll be there in 48 hours',
    bookText: 'Leave your details and tell us what you’re planning. We’ll call you the same day to arrange a time that suits you.',
    book1: 'Completely free, no obligation',
    book2: 'A technician brings material samples',
    book3: 'A precise quote within 48 hours',
    preferPhone: 'Prefer to call?',
  },
});

type Tri = { me: string; sq: string; en: string };
const tri = (me: string, sq: string, en: string): Tri => ({ me, sq, en });

/** What's included in each service — matched to the CMS service list by position. */
const INCLUDED: Tri[][] = [
  [
    tri('Dolazak na adresu u roku od 48h', 'Ardhje në adresë brenda 48 orëve', 'On site within 48 hours'),
    tri('Lasersko mjerenje otvora i površina', 'Matje me lazer e hapjeve dhe sipërfaqeve', 'Laser measuring of openings and surfaces'),
    tri('Savjet o materijalima i bojama', 'Këshillë për materialet dhe ngjyrat', 'Advice on materials and colours'),
    tri('Precizna ponuda bez obaveze kupovine', 'Ofertë e saktë pa detyrim blerjeje', 'A precise quote, no obligation'),
  ],
  [
    tri('Demontaža i odvoz stare stolarije', 'Çmontimi dhe largimi i dogramës së vjetër', 'Removal and disposal of old frames'),
    tri('RAL montaža sa paronepropusnim trakama', 'Montim RAL me shirita kundër avullit', 'RAL fitting with vapour-tight tapes'),
    tri('Podešavanje okova i zaptivki', 'Rregullimi i mekanizmave dhe guarnicioneve', 'Hardware and seal adjustment'),
    tri('Obrada špaleta i završno čišćenje', 'Rifinimi rreth kornizës dhe pastrimi', 'Reveal finishing and clean-up'),
  ],
  [
    tri('Provjera i niveliranje podloge', 'Kontrolli dhe nivelimi i bazës', 'Subfloor check and levelling'),
    tri('Podložna folija i parna brana', 'Shtresa izoluese dhe barriera e avullit', 'Underlay and vapour barrier'),
    tri('Postavljanje laminata, parketa ili vinila', 'Shtrimi i laminatit, parketit ose vinilit', 'Laying laminate, parquet or vinyl'),
    tri('Lajsne, prelazne letvice i čišćenje', 'Listela, profile kalimi dhe pastrim', 'Skirting, transition strips and clean-up'),
  ],
  [
    tri('Rušenje i odvoz šuta', 'Prishja dhe largimi i mbeturinave', 'Strip-out and rubble removal'),
    tri('Nove vodovodne i električne instalacije', 'Instalime të reja hidraulike dhe elektrike', 'New plumbing and electrics'),
    tri('Hidroizolacija i postavljanje keramike', 'Hidroizolim dhe shtrimi i pllakave', 'Waterproofing and tiling'),
    tri('Montaža sanitarija, tuš kabine i namještaja', 'Montimi i sanitarive, dushit dhe mobiljeve', 'Sanitaryware, shower and furniture fitting'),
  ],
  [
    tri('3D projekat i izbor materijala', 'Projekt 3D dhe zgjedhja e materialeve', '3D design and material selection'),
    tri('Izrada u našoj radionici', 'Prodhim në punishten tonë', 'Built in our own workshop'),
    tri('Ugradnja aparata, sudopere i rasvjete', 'Montimi i pajisjeve, lavamanit dhe ndriçimit', 'Appliances, sink and lighting fitted'),
    tri('Montaža za jedan do dva dana', 'Montim për një deri në dy ditë', 'Installed in one to two days'),
  ],
  [
    tri('Spušteni plafoni sa LED rasvjetom', 'Tavane të varura me ndriçim LED', 'Suspended ceilings with LED lighting'),
    tri('Pregradni zidovi i obloge', 'Mure ndarëse dhe veshje', 'Partition walls and linings'),
    tri('Gletovanje i krečenje', 'Stukim dhe lyerje', 'Skimming and painting'),
    tri('Zaštita namještaja i čišćenje', 'Mbrojtja e mobiljeve dhe pastrimi', 'Furniture protection and clean-up'),
  ],
];

const HERO_FACTS = [
  { icon: Hammer, key: 'heroFact1' },
  { icon: ShieldCheck, key: 'heroFact2' },
  { icon: MapPin, key: 'heroFact3' },
] as const;

/** Related shop categories per service (by slug, also by position). */
const RELATED: string[][] = [[], ['vrata', 'prozori'], ['podovi'], ['kupatilo', 'keramika'], ['kuhinje'], []];

export default function Services() {
  const ts = useDict(site);
  const t = useDict(T);
  const tc = useDict(C);
  const l = useL();
  const settings = useSettings();
  const cats = useCategories();
  const services = useHomeData('services');
  const process = useHomeData('process');
  const stats = useHomeData('stats');
  const faq = useHomeData('faq');
  usePageTitle(ts('nav_services'));

  const items = useMemo(() => services?.items ?? [], [services]);
  const related = useMemo(
    () => RELATED.map((slugs) => slugs.map((s) => cats.find((c) => c.slug === s)).filter(Boolean) as Category[]),
    [cats],
  );

  return (
    <>
      <PageHero
        image="/images/s/ugradnja.webp"
        crumbs={[{ label: ts('nav_services') }]}
        eyebrow={services ? l(services.eyebrow) : ts('nav_services')}
        title={services ? l(services.title) : ts('nav_services')}
        subtitle={services ? l(services.subtitle) : undefined}
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => scrollToId('mjerenje')} iconRight={<ArrowRight className="h-4 w-4" />}>
            {tc('bookFree')}
          </Button>
          <a href={telHref(settings.phone)} className="inline-flex h-13 items-center gap-2.5 rounded-full border border-white/40 px-6 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
            <Phone className="h-4 w-4" /> {settings.phone}
          </a>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13.5px] font-medium text-paper/75">
          {HERO_FACTS.map(({ icon: Icon, key }) => (
            <li key={key} className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-200" /> {t(key)}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Index — quick jump to each service */}
      {items.length > 0 && (
        <div className="container-x relative z-10 -mt-8 sm:-mt-10">
          <nav aria-label={t('index')} className="no-scrollbar flex overflow-x-auto rounded-3xl bg-white shadow-[0_30px_70px_-40px_rgba(28,26,23,0.5)] ring-1 ring-line lg:grid lg:grid-cols-6 lg:overflow-visible">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToId(`usluga-${i + 1}`)}
                className={cn('group flex min-w-[168px] flex-1 flex-col items-start gap-1.5 px-5 py-5 text-left transition-colors hover:bg-paper lg:min-w-0', i > 0 && 'border-l border-line', i === 0 && 'rounded-l-3xl', i === items.length - 1 && 'rounded-r-3xl')}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="display text-[15px] text-brand-600">{pad2(i + 1)}</span>
                  <ArrowRight className="h-3.5 w-3.5 rotate-90 text-ink/25 transition-all group-hover:translate-y-0.5 group-hover:text-brand-600" />
                </span>
                <span className="text-[14px] font-semibold leading-snug text-ink">{l(it.title)}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Services — alternating rows */}
      <section className="py-24 sm:py-32">
        <div className="container-x space-y-24 sm:space-y-32">
          {items.map((it, i) => {
            const flip = i % 2 === 1;
            const incl = INCLUDED[i] ?? [];
            const rel = related[i] ?? [];
            return (
              <article key={i} id={`usluga-${i + 1}`} className="grid scroll-mt-32 items-center gap-10 lg:grid-cols-2 lg:gap-20">
                <Reveal className={cn('relative', flip && 'lg:order-2')}>
                  <div className={cn('absolute inset-0 rounded-[32px] bg-sand', flip ? '-translate-x-4 translate-y-4 sm:-translate-x-6 sm:translate-y-6' : 'translate-x-4 translate-y-4 sm:translate-x-6 sm:translate-y-6')} />
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-[28px] bg-sand-2 lg:aspect-[5/4]">
                    <Img src={it.image} alt={l(it.title)} className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-ink backdrop-blur-md">
                      {pad2(i + 1)} / {pad2(items.length)}
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={120} className={cn(flip && 'lg:order-1')}>
                  <div className="display select-none text-[88px] leading-[0.8] text-brand-600/15 sm:text-[120px]" aria-hidden>
                    {pad2(i + 1)}
                  </div>
                  <h2 className="display -mt-5 text-[34px] leading-[1.05] text-ink sm:-mt-8 sm:text-[46px]">
                    <Accent text={l(it.title)} />
                  </h2>
                  <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">{l(it.text)}</p>
                  {incl.length > 0 && (
                    <div className="mt-8 rounded-3xl border border-line bg-white/60 p-5 sm:p-6">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">{t('included')}</div>
                      <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {incl.map((x, k) => (
                          <li key={k} className="flex items-start gap-3 text-[14.5px] leading-snug text-ink-soft">
                            <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            {l(x)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button variant="dark" onClick={() => scrollToId('mjerenje')} iconRight={<CalendarCheck className="h-4 w-4" />}>
                      {t('bookVisit')}
                    </Button>
                    {rel.length > 0 && <span className="ml-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">{t('fromRange')}</span>}
                    {rel.map((c) => (
                      <Link
                        key={c.id}
                        to={`/proizvodi/${c.slug}`}
                        className="group inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3.5 text-[13.5px] font-semibold text-ink transition hover:border-ink/30"
                      >
                        <Img src={c.image} small alt="" className="h-8 w-8 rounded-full object-cover" />
                        {l(c.name)}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                      </Link>
                    ))}
                  </div>
                </Reveal>
              </article>
            );
          })}
        </div>
      </section>

      {process && (
        <ProcessSteps
          data={process}
          action={
            <Button variant="outline" onClick={() => scrollToId('mjerenje')} iconRight={<ArrowRight className="h-4 w-4" />}>
              {tc('bookFree')}
            </Button>
          }
        />
      )}

      {stats && <StatsBand data={stats} />}

      {/* FAQ */}
      {faq && faq.items.length > 0 && (
        <section className="py-24 sm:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal>
              <SectionHeading eyebrow={l(faq.eyebrow)} title={l(faq.title)} />
              <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-muted">{t('faqHelp')}</p>
              <a href={telHref(settings.phone)} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink-soft">
                <Phone className="h-4 w-4" /> {settings.phone}
              </a>
            </Reveal>
            <Reveal delay={120}>
              <Accordion items={faq.items.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Booking */}
      <section id="mjerenje" className="scroll-mt-24 pb-8">
        <div className="container-x">
          <Reveal>
            <div className="grid gap-4 rounded-[36px] bg-sand/80 p-3 sm:p-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden rounded-[28px] bg-ink p-7 sm:p-10">
                <Img src="/images/s/mjerenje.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
                <div className="eyebrow text-brand-200">{t('bookEyebrow')}</div>
                <h2 className="display mt-3 text-[34px] leading-[1.04] text-white sm:text-[46px]">
                  <Accent text={t('bookTitle')} accentClassName="text-brand-200" />
                </h2>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-paper/75">{t('bookText')}</p>
                <ul className="mt-6 space-y-2.5">
                  {[t('book1'), t('book2'), t('book3')].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] font-medium text-white">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border-t border-white/15 pt-6">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-paper/55">{t('preferPhone')}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand">
                      <Phone className="h-4 w-4" /> {settings.phone}
                    </a>
                    {settings.whatsapp && (
                      <a
                        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <MeasureForm type="measurement" className="shadow-none ring-0 lg:p-10" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
