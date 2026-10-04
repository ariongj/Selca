import type { Db, MediaItem } from '@/lib/types';
import { CATEGORIES, buildProducts } from './catalog';
import { DEFAULT_SETTINGS, PROJECTS, buildCoupons, buildHome, buildPages, buildPosts } from './content';
import { generateInquiries, generateOrders } from './demo';

/** Bump to force every browser to reload fresh demo data. */
export const DB_VERSION = 4;

/** Every bundled image, exposed in the CMS media library. */
const IMAGE_PATHS = [
  'hero/living', 'hero/arch', 'hero/bath', 'hero/kitchen',
  'misc/house-dusk', 'misc/villa', 'misc/about',
  'cat/vrata', 'cat/prozori', 'cat/podovi', 'cat/keramika', 'cat/kupatilo', 'cat/kuhinje',
  's/mjerenje', 's/ugradnja', 's/ugradnja-prozora', 's/podovi', 's/majstor', 's/adaptacija', 's/gips',
  'projects/vila-primorje', 'projects/kupatilo-oval', 'projects/kupatilo-toplo', 'projects/kupatilo-travertin',
  'projects/kuhinja-orah', 'projects/dnevna-svjetla', 'projects/stan-hrast', 'projects/kuhinja-siva',
];

const FOLDER: Record<string, string> = { hero: 'Hero', misc: 'Ostalo', cat: 'Kategorije', s: 'Usluge', projects: 'Projekti', p: 'Proizvodi' };

function buildMedia(productImages: string[], now: Date): MediaItem[] {
  const all = [...IMAGE_PATHS.map((p) => `/images/${p}.webp`), ...productImages];
  const unique = Array.from(new Set(all));
  return unique.map((url, i) => {
    const seg = url.split('/')[2] ?? 'misc';
    const name = url.split('/').pop()!.replace('.webp', '');
    return {
      id: `m_${i + 1}`,
      url,
      name: `${name}.webp`,
      alt: name.replace(/-\d$/, '').replace(/-/g, ' '),
      folder: FOLDER[seg] ?? 'Ostalo',
      uploaded: false,
      createdAt: new Date(now.getTime() - (unique.length - i) * 3600000).toISOString(),
    };
  });
}

export function createSeed(now = new Date()): Db {
  const products = buildProducts(now);
  const settings = structuredClone(DEFAULT_SETTINGS);
  const coupons = buildCoupons(now);
  return {
    version: DB_VERSION,
    settings,
    categories: structuredClone(CATEGORIES),
    products,
    orders: generateOrders(products, settings, coupons, now),
    inquiries: generateInquiries(now),
    coupons,
    pages: buildPages(now),
    posts: buildPosts(now),
    projects: structuredClone(PROJECTS),
    media: buildMedia(products.flatMap((p) => p.images), now),
    home: buildHome(now),
    seededAt: now.toISOString(),
  };
}
