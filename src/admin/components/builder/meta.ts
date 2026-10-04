import type { ComponentType } from 'react';
import {
  Award, BadgePercent, BookOpen, CalendarCheck, Clock, Hammer, HelpCircle, Home, Images, Instagram, LayoutGrid, Leaf, ListOrdered,
  Phone, Quote, Ruler, ShieldCheck, Sparkles, Star, Truck, Wrench, GalleryHorizontalEnd, ShoppingBag,
} from 'lucide-react';
import type { HomeSection, HomeSectionType, L10n } from '@/lib/types';
import type { BKey } from './i18n';

type IconC = ComponentType<{ className?: string }>;

/** Visual identity of each homepage section type in the builder. */
export const SECTION_META: Record<HomeSectionType, { icon: IconC; tone: string }> = {
  hero: { icon: GalleryHorizontalEnd, tone: 'bg-brand-50 text-brand-700 ring-brand-600/15' },
  trust: { icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  categories: { icon: LayoutGrid, tone: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  featured: { icon: ShoppingBag, tone: 'bg-violet-50 text-violet-700 ring-violet-600/15' },
  promo: { icon: BadgePercent, tone: 'bg-rose-50 text-rose-700 ring-rose-600/15' },
  process: { icon: ListOrdered, tone: 'bg-sky-50 text-sky-700 ring-sky-600/15' },
  services: { icon: Wrench, tone: 'bg-orange-50 text-orange-700 ring-orange-600/15' },
  projects: { icon: Images, tone: 'bg-stone-100 text-stone-700 ring-stone-500/20' },
  stats: { icon: Quote, tone: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15' },
  instagram: { icon: Instagram, tone: 'bg-pink-50 text-pink-700 ring-pink-600/15' },
  faq: { icon: HelpCircle, tone: 'bg-teal-50 text-teal-700 ring-teal-600/15' },
  blog: { icon: BookOpen, tone: 'bg-lime-50 text-lime-800 ring-lime-600/20' },
  cta: { icon: CalendarCheck, tone: 'bg-red-50 text-red-700 ring-red-600/15' },
};

/** Icons the storefront trust bar knows how to render (see site/sections/HomeSections ICONS). */
export const TRUST_ICONS: { name: string; icon: IconC }[] = [
  { name: 'Ruler', icon: Ruler },
  { name: 'Hammer', icon: Hammer },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Truck', icon: Truck },
  { name: 'Clock', icon: Clock },
  { name: 'Award', icon: Award },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Leaf', icon: Leaf },
  { name: 'Wrench', icon: Wrench },
  { name: 'Home', icon: Home },
  { name: 'Star', icon: Star },
  { name: 'Phone', icon: Phone },
];

export const trustIcon = (name: string): IconC => TRUST_ICONS.find((i) => i.name === name)?.icon ?? Sparkles;

/** Strip *accent* markers. */
export const stripStars = (s: string) => s.replace(/\*/g, '');

/** One-line description of a section for the list (its headline) + a count chip. */
export function sectionSummary(s: HomeSection, l: (v: L10n) => string, t: (k: BKey, v?: Record<string, string | number>) => string): { line: string; meta: string } {
  switch (s.type) {
    case 'hero':
      return {
        line: stripStars(l(s.data.slides[0]?.title ?? { me: '', sq: '', en: '' })),
        meta: t('count_slides', { n: s.data.slides.length }),
      };
    case 'trust':
      return { line: s.data.items.map((i) => l(i.title)).join(' · '), meta: t('count_items', { n: s.data.items.length }) };
    case 'featured':
      return {
        line: stripStars(l(s.data.title)),
        meta: s.data.mode === 'manual' ? `${t('mode_manual')} · ${t('count_products', { n: s.data.productIds.length })}` : t(`mode_${s.data.mode}`),
      };
    case 'process':
      return { line: stripStars(l(s.data.title)), meta: t('count_steps', { n: s.data.steps.length }) };
    case 'services':
      return { line: stripStars(l(s.data.title)), meta: t('count_services', { n: s.data.items.length }) };
    case 'stats':
      return { line: `„${l(s.data.quote)}“`, meta: t('count_figures', { n: s.data.items.length }) };
    case 'faq':
      return { line: stripStars(l(s.data.title)), meta: t('count_questions', { n: s.data.items.length }) };
    case 'instagram':
      return { line: stripStars(l(s.data.title)), meta: t('count_photos', { n: s.data.images.length }) };
    case 'promo':
      return { line: stripStars(l(s.data.title)), meta: s.data.code ? s.data.code : '' };
    default:
      return { line: stripStars(l(s.data.title)), meta: '' };
  }
}
