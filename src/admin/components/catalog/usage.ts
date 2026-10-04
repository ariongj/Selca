import { useMemo } from 'react';
import { useDb } from '@/store/db';
import type { HomeSectionType, L10n } from '@/lib/types';

export type UsageKind = 'product' | 'category' | 'home' | 'project' | 'post';

export interface UsageRef {
  kind: UsageKind;
  id: string;
  /** Localized label of the entity (products, categories, projects, posts) */
  name?: L10n;
  /** Homepage section type (kind = 'home') */
  section?: HomeSectionType;
  /** Where to edit it in the CMS */
  to: string;
}

/** Bundled images have a `-sm.webp` thumbnail sibling — treat both as the same file. */
export const normUrl = (url: string) => url.replace(/-sm\.webp$/, '.webp');

const isImage = (s: string) => s.startsWith('/images/') || s.startsWith('data:image/') || /^https?:\/\/.+\.(webp|jpe?g|png|gif|avif)(\?.*)?$/i.test(s);

function walkStrings(v: unknown, cb: (s: string) => void) {
  if (typeof v === 'string') cb(v);
  else if (Array.isArray(v)) v.forEach((x) => walkStrings(x, cb));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walkStrings(x, cb));
}

/**
 * Where each image is used across the site: products, categories, homepage sections,
 * projects and blog posts. Returns a map keyed by normalized URL.
 */
export function useMediaUsage() {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const home = useDb((s) => s.home);
  const projects = useDb((s) => s.projects);
  const posts = useDb((s) => s.posts);

  return useMemo(() => {
    const map = new Map<string, UsageRef[]>();
    const add = (url: string | undefined, ref: UsageRef) => {
      if (!url) return;
      const key = normUrl(url);
      const list = map.get(key) ?? [];
      if (!list.some((r) => r.kind === ref.kind && r.id === ref.id)) list.push(ref);
      map.set(key, list);
    };
    for (const p of products) for (const u of p.images) add(u, { kind: 'product', id: p.id, name: p.name, to: `/admin/proizvodi/${p.id}` });
    for (const c of categories) add(c.image, { kind: 'category', id: c.id, name: c.name, to: `/admin/kategorije?uredi=${c.id}` });
    for (const h of home) walkStrings(h.data, (s) => isImage(s) && add(s, { kind: 'home', id: h.id, section: h.type, to: '/admin/sadrzaj' }));
    for (const p of projects) add(p.image, { kind: 'project', id: p.id, name: p.title, to: '/admin/projekti' });
    for (const p of posts) add(p.cover, { kind: 'post', id: p.id, name: p.title, to: `/admin/savjeti/${p.id}` });
    return map;
  }, [products, categories, home, projects, posts]);
}

export const usageOf = (map: Map<string, UsageRef[]>, url: string) => map.get(normUrl(url)) ?? [];
