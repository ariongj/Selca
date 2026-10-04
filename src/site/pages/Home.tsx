import { useEffect, type ReactNode } from 'react';
import type { HomeSection } from '@/lib/types';
import { useDb } from '@/store/db';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { HeroSection } from '@/site/sections/Hero';
import {
  BlogSection, CategoriesSection, CtaSection, FaqSection, FeaturedSection, InstagramSection, ProcessSection,
  ProjectsSection, PromoSection, ServicesSection, StatsSection, TrustSection,
} from '@/site/sections/HomeSections';

function renderSection(s: HomeSection, prev: HomeSection | undefined): ReactNode {
  switch (s.type) {
    case 'hero':
      return <HeroSection slides={s.data.slides} autoplay={s.data.autoplay} />;
    case 'trust':
      return <TrustSection data={s.data} overlap={prev?.type === 'hero'} />;
    case 'categories':
      return <CategoriesSection data={s.data} />;
    case 'featured':
      return <FeaturedSection data={s.data} />;
    case 'promo':
      return <PromoSection data={s.data} />;
    case 'process':
      return <ProcessSection data={s.data} />;
    case 'services':
      return <ServicesSection data={s.data} />;
    case 'projects':
      return <ProjectsSection data={s.data} />;
    case 'stats':
      return <StatsSection data={s.data} />;
    case 'blog':
      return <BlogSection data={s.data} />;
    case 'faq':
      return <FaqSection data={s.data} />;
    case 'instagram':
      return <InstagramSection data={s.data} />;
    case 'cta':
      return <CtaSection data={s.data} />;
    default:
      return null;
  }
}

export default function Home() {
  const home = useDb((s) => s.home);
  usePageTitle(undefined);
  const enabled = home.filter((s) => s.enabled);

  // CMS live preview: the homepage builder posts { type: 'selca:scrollTo', id } into this iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'selca:scrollTo') return;
      const el = document.querySelector<HTMLElement>(`[data-section="${e.data.id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('preview-highlight');
      window.setTimeout(() => el.classList.remove('preview-highlight'), 1600);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      {enabled.map((s, i) => (
        <div key={s.id} data-section={s.id} className="scroll-mt-24">
          {renderSection(s, enabled[i - 1])}
        </div>
      ))}
    </>
  );
}
