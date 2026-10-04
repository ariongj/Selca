import type { ComponentType, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { HomeSection } from '@/lib/types';
import { Accent, Accordion, Reveal } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { InstagramIcon, ViberIcon, WhatsAppIcon } from '@/components/brand/Social';
import { PageHero, SectionHeading } from '@/site/components/SectionHeading';
import { MeasureForm } from '@/site/components/MeasureForm';
import { MapCard } from '@/site/components/content/MapCard';
import { telHref } from '@/site/components/content/posts';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { defineDict, useDict, useL } from '@/i18n';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Kontakt',
    eyebrow: 'Kontakt',
    heroTitle: 'Razgovarajmo o *vašem domu*',
    heroText: 'Pozovite, pišite ili svratite u naš salon. Savjet je uvijek besplatan, a na svaki upit odgovaramo istog dana.',
    replyBadge: 'Odgovaramo istog dana',
    measureBadge: 'Besplatno mjerenje širom Crne Gore',
    phone: 'Telefon',
    phoneHint: 'Pozovite nas direktno',
    email: 'E-mail',
    emailHint: 'Za ponude, nacrte i fotografije',
    address: 'Salon',
    addressHint: 'Prikaži na mapi',
    hours: 'Radno vrijeme',
    hoursHint: 'Mjerenja zakazujemo i van radnog vremena',
    socialTitle: 'Pratite naše *realizacije*',
    socialText: 'Nove ugradnje, prije i poslije, uzorci i akcije — svake sedmice.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Pošaljite poruku',
    formTitle: 'Pišite nam — *odgovaramo brzo*',
    formText: 'Opišite šta vam treba: proizvod, okvirne mjere ili rok. Savjetnik će vas kontaktirati telefonom ili e-mailom.',
    faqHelpTitle: 'Niste pronašli odgovor?',
    faqHelpText: 'Pozovite nas — savjetnik je dostupan tokom cijelog radnog vremena.',
    bookMeasure: 'Zakaži mjerenje',
  },
  sq: {
    title: 'Kontakt',
    eyebrow: 'Kontakt',
    heroTitle: 'Të flasim për *shtëpinë tuaj*',
    heroText: 'Na telefononi, na shkruani ose ejani në sallonin tonë. Këshilla është gjithmonë falas dhe çdo kërkese i përgjigjemi të njëjtën ditë.',
    replyBadge: 'Përgjigjemi të njëjtën ditë',
    measureBadge: 'Matje falas në gjithë Malin e Zi',
    phone: 'Telefoni',
    phoneHint: 'Na telefononi direkt',
    email: 'E-mail',
    emailHint: 'Për oferta, skica dhe fotografi',
    address: 'Salloni',
    addressHint: 'Shfaq në hartë',
    hours: 'Orari i punës',
    hoursHint: 'Matjet i caktojmë edhe jashtë orarit',
    socialTitle: 'Ndiqni *realizimet* tona',
    socialText: 'Montime të reja, para dhe pas, mostra dhe oferta — çdo javë.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Dërgoni mesazh',
    formTitle: 'Na shkruani — *përgjigjemi shpejt*',
    formText: 'Përshkruani çfarë ju nevojitet: produktin, masat e përafërta ose afatin. Këshilltari do t’ju kontaktojë me telefon ose e-mail.',
    faqHelpTitle: 'Nuk e gjetët përgjigjen?',
    faqHelpText: 'Na telefononi — këshilltari është në dispozicion gjatë gjithë orarit të punës.',
    bookMeasure: 'Cakto matjen',
  },
  en: {
    title: 'Contact',
    eyebrow: 'Contact',
    heroTitle: 'Let’s talk about *your home*',
    heroText: 'Call, write or drop by our showroom. Advice is always free, and we reply to every enquiry the same day.',
    replyBadge: 'Same-day replies',
    measureBadge: 'Free measurement across Montenegro',
    phone: 'Phone',
    phoneHint: 'Call us directly',
    email: 'E-mail',
    emailHint: 'For quotes, drawings and photos',
    address: 'Showroom',
    addressHint: 'Show on map',
    hours: 'Opening hours',
    hoursHint: 'Measurements can be booked out of hours too',
    socialTitle: 'Follow our *latest projects*',
    socialText: 'New installations, before & after, samples and offers — every week.',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
    formEyebrow: 'Send a message',
    formTitle: 'Write to us — *we reply fast*',
    formText: 'Tell us what you need: the product, rough measurements or your timeline. An advisor will get back to you by phone or e-mail.',
    faqHelpTitle: 'Didn’t find your answer?',
    faqHelpText: 'Give us a call — an advisor is available throughout opening hours.',
    bookMeasure: 'Book a visit',
  },
});

type FaqData = Extract<HomeSection, { type: 'faq' }>;

/** Contact tile — compact icon-left row on phones, tall card with the icon on top from `sm` up. */
function ContactCard({ icon: Icon, label, hint, href, external, children }: { icon: ComponentType<{ className?: string }>; label: string; hint?: string; href?: string; external?: boolean; children: ReactNode }) {
  const inner = (
    <>
      <div className="flex flex-1 gap-4 sm:flex-col sm:gap-0">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <div className={cn('flex min-w-0 flex-1 flex-col sm:mt-7 sm:pr-0', href && 'pr-6')}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</div>
          <div className="mt-1.5 break-words text-[17px] font-semibold leading-snug text-ink sm:mt-2 sm:text-[19px]">{children}</div>
          {hint && <div className={cn('mt-auto pt-2.5 text-[13.5px] leading-snug text-muted sm:pt-4', href && 'transition-colors group-hover:text-ink')}>{hint}</div>}
        </div>
      </div>
      {href && <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 text-ink/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600 sm:right-7 sm:top-7" />}
    </>
  );
  const cls = 'group relative flex h-full flex-col rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7';
  if (!href) return <div className={cls}>{inner}</div>;
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cn(cls, 'transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-32px_rgba(28,26,23,0.5)] hover:ring-ink/15')}
    >
      {inner}
    </a>
  );
}

export default function Contact() {
  const t = useDict(T);
  const l = useL();
  const settings = useSettings();
  const faq = useDb((s) => s.home.find((h): h is FaqData => h.type === 'faq'));
  usePageTitle(t('title'));

  // Tolerate "@handle" or a pasted profile URL in the CMS settings.
  const igHandle = (settings.instagram ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '');
  const instagram = `https://www.instagram.com/${igHandle}/`;
  const waDigits = (settings.whatsapp ?? '').replace(/\D/g, '');
  const hours = l(settings.hours)
    .split(/\s*·\s*/)
    .filter(Boolean);

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroText')} crumbs={[{ label: t('title') }]}>
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t('replyBadge')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-line">
            <MapPin className="h-3.5 w-3.5 text-brand-600" />
            {t('measureBadge')}
          </span>
        </div>
      </PageHero>

      {/* Contact cards */}
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <Reveal className="h-full">
              <ContactCard icon={Phone} label={t('phone')} hint={t('phoneHint')} href={telHref(settings.phone)}>
                {settings.phone}
                {settings.phone2 ? <span className="block text-[15px] font-medium text-muted">{settings.phone2}</span> : null}
              </ContactCard>
            </Reveal>
            <Reveal delay={70} className="h-full">
              <ContactCard icon={Mail} label={t('email')} hint={t('emailHint')} href={`mailto:${settings.email}`}>
                {settings.email}
              </ContactCard>
            </Reveal>
            <Reveal delay={140} className="h-full">
              <ContactCard icon={MapPin} label={t('address')} hint={t('addressHint')} href={settings.mapUrl} external>
                {settings.address}
                <span className="block text-[15px] font-medium text-muted">{settings.city}</span>
              </ContactCard>
            </Reveal>
            <Reveal delay={210} className="h-full">
              <ContactCard icon={Clock} label={t('hours')} hint={t('hoursHint')}>
                {hours.map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
              </ContactCard>
            </Reveal>
          </div>

          {/* Social strip */}
          {(igHandle || waDigits) && (
          <Reveal className="mt-5">
            <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="bg-grain pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] opacity-25 blur-3xl" />
              <div className="relative flex items-center gap-5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-lg">
                  <InstagramIcon className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="display text-[26px] leading-tight sm:text-[30px]">
                    <Accent text={t('socialTitle')} accentClassName="text-brand-200" />
                  </h2>
                  <p className="mt-1 text-[14.5px] text-paper/65">{t('socialText')}</p>
                </div>
              </div>
              <div className="relative flex flex-wrap gap-2">
                {igHandle && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand"
                  >
                    <InstagramIcon className="h-4 w-4" />@{igHandle}
                  </a>
                )}
                {waDigits && (
                  <>
                    <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                      <WhatsAppIcon className="h-4 w-4" />
                      {t('whatsapp')}
                    </a>
                    <a href={`viber://chat?number=%2B${waDigits}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                      <ViberIcon className="h-4 w-4" />
                      {t('viber')}
                    </a>
                  </>
                )}
              </div>
            </div>
          </Reveal>
          )}
        </div>
      </section>

      {/* Form + map */}
      <section className="bg-sand/60 py-20 sm:py-28">
        <div className="container-x grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <Reveal>
            <SectionHeading eyebrow={t('formEyebrow')} title={t('formTitle')} subtitle={t('formText')} />
            <MeasureForm type="contact" className="mt-10 shadow-[0_30px_60px_-45px_rgba(28,26,23,0.45)] lg:p-9" />
          </Reveal>
          <Reveal delay={120} className="h-full">
            <MapCard className="h-full shadow-[0_30px_60px_-45px_rgba(28,26,23,0.45)]" />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      {faq && faq.data.items.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <Reveal>
              <SectionHeading eyebrow={l(faq.data.eyebrow)} title={l(faq.data.title)} />
              <div className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-7">
                <h3 className="text-lg font-bold text-ink">{t('faqHelpTitle')}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t('faqHelpText')}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={telHref(settings.phone)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink-soft">
                    <Phone className="h-4 w-4" /> {settings.phone}
                  </a>
                  <ButtonLink to="/#mjerenje" variant="outline" iconRight={<ArrowRight className="h-4 w-4" />}>
                    {t('bookMeasure')}
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Accordion items={faq.data.items.map((it) => ({ title: l(it.q), content: l(it.a) }))} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
