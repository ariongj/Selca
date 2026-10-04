import type { Lang } from '@/lib/types';

/** Popular searches per storefront language — every term returns results in the seeded catalogue. */
export const POPULAR_SEARCHES: Record<Lang, string[]> = {
  me: ['laminat', 'sigurnosna vrata', 'PVC prozor', 'parket', 'walk-in', 'LED ogledalo', 'porculan', 'kuhinja po mjeri'],
  sq: ['laminat', 'derë sigurie', 'dritare PVC', 'parket', 'walk-in', 'pasqyrë LED', 'porcelan', 'kuzhinë me porosi'],
  en: ['laminate', 'security door', 'PVC window', 'parquet', 'walk-in', 'LED mirror', 'porcelain', 'made-to-measure kitchen'],
};

/**
 * Plural category for counted nouns. Montenegrin uses the singular after numbers
 * ending in 1 (except 11): "21 proizvod", "37 proizvoda"; Albanian and English only for 1.
 */
export function pluralOne(n: number, lang: Lang) {
  if (lang === 'me') return n % 10 === 1 && n % 100 !== 11;
  return n === 1;
}

/** Best sellers with variety: the top seller of each category first, then the rest by sales. */
export function diverseBestsellers<P extends { id: string; categoryId: string; sold: number }>(products: P[], n: number): P[] {
  const sorted = [...products].sort((a, b) => b.sold - a.sold);
  const seen = new Set<string>();
  const firstPass = sorted.filter((p) => (seen.has(p.categoryId) ? false : (seen.add(p.categoryId), true)));
  const rest = sorted.filter((p) => !firstPass.includes(p));
  return [...firstPass, ...rest].slice(0, n);
}
