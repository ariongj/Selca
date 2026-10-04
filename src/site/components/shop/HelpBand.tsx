import { Check, Phone, Ruler } from 'lucide-react';
import { Accent, Img, Reveal } from '@/components/ui/misc';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { useDict } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { T } from './dict';

/** "Need help choosing?" band under the product grid. */
export function HelpBand() {
  const t = useDict(T);
  const settings = useSettings();
  return (
    <section className="container-x mt-20 sm:mt-28">
      <Reveal>
        <div className="grid overflow-hidden rounded-[32px] bg-sand lg:grid-cols-[1.12fr_0.88fr]">
          <div className="relative p-7 sm:p-12 lg:p-14">
            <div className="eyebrow">{t('helpEyebrow')}</div>
            <h2 className="display mt-3 max-w-xl text-[34px] leading-[1.04] text-ink sm:text-[48px]">
              <Accent text={t('helpTitle')} />
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-muted">{t('helpText')}</p>
            <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {[t('helpPoint1'), t('helpPoint2'), t('helpPoint3')].map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-ink">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink to="/#mjerenje" size="lg" icon={<Ruler className="h-4 w-4" />}>
                {t('helpCta')}
              </ButtonLink>
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className={buttonClass({ variant: 'outline', size: 'lg', className: 'tabular-nums' })}>
                <Phone className="h-4 w-4" /> {settings.phone}
              </a>
            </div>
          </div>
          <div className="relative min-h-[260px] lg:min-h-full">
            <Img src="/images/s/mjerenje.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-sand/30 lg:via-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-5 shadow-xl backdrop-blur sm:bottom-7 sm:left-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
                <Ruler className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-ink">{t('helpCardTitle')}</span>
                <span className="block text-[12.5px] text-muted">{t('helpCardText')}</span>
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
