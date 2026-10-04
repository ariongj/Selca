import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, ExternalLink, FolderTree, Hammer, Home, Package, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Hint, Label } from '@/components/ui/Field';
import { Badge } from '@/components/ui/misc';
import { KV, confirmDialog } from '@/admin/components/kit';
import { CopyButton, formatBytes } from './shared';
import { usageOf, type UsageKind, type UsageRef } from './usage';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { date } from '@/lib/format';
import type { HomeSectionType, MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export const MEDIA_T = defineDict({
  me: {
    details: 'Detalji slike',
    prev: 'Prethodna',
    next: 'Sljedeća',
    uploaded: 'Otpremljeno',
    library: 'Iz kataloga',
    alt: 'Alternativni tekst',
    altHint: 'Kratak opis slike — pomaže Google pretrazi i čitačima ekrana.',
    altPh: 'npr. Sobna vrata u bijeloj boji',
    altSaved: 'Alt tekst je sačuvan',
    dimensions: 'Dimenzije',
    size: 'Veličina',
    type: 'Format',
    folder: 'Folder',
    added: 'Dodato',
    url: 'Adresa slike',
    copyUrl: 'Kopiraj URL',
    urlCopied: 'URL slike je kopiran',
    embedded: 'Slika je sačuvana u pregledaču (demo) — u produkciji dobija trajnu adresu na serveru.',
    usage: 'Gdje se koristi',
    usageNone: 'Slika se trenutno ne koristi nigdje na sajtu — možete je slobodno obrisati.',
    open: 'Otvori original',
    deleteTitle: 'Obrisati sliku iz biblioteke?',
    deleteText: 'Slika će biti uklonjena iz biblioteke medija. Ova radnja se ne može poništiti.',
    deleteInUse: 'Pažnja: slika se koristi na {n} mjesta ({where}). Ostaće prikazana tamo gdje je postavljena, ali je više nećete moći izabrati iz biblioteke.',
    deletedToast: 'Slika je obrisana',
    unknown: 'Nepoznato',
    kind_product: 'Proizvod',
    kind_category: 'Kategorija',
    kind_home: 'Početna stranica',
    kind_project: 'Realizacija',
    kind_post: 'Savjet (blog)',
    sec_hero: 'Hero slajder',
    sec_trust: 'Prednosti',
    sec_categories: 'Kategorije',
    sec_featured: 'Izdvojeni proizvodi',
    sec_promo: 'Promo akcija',
    sec_process: 'Kako radimo',
    sec_services: 'Usluge',
    sec_projects: 'Realizacije',
    sec_stats: 'Brojke i citat',
    sec_instagram: 'Instagram',
    sec_faq: 'Česta pitanja',
    sec_blog: 'Savjeti',
    sec_cta: 'Poziv na akciju',
  },
  sq: {
    details: 'Detajet e imazhit',
    prev: 'E mëparshmja',
    next: 'Tjetra',
    uploaded: 'E ngarkuar',
    library: 'Nga katalogu',
    alt: 'Teksti alternativ',
    altHint: 'Përshkrim i shkurtër i imazhit — ndihmon kërkimin në Google dhe lexuesit e ekranit.',
    altPh: 'p.sh. Derë e brendshme e bardhë',
    altSaved: 'Teksti alt u ruajt',
    dimensions: 'Dimensionet',
    size: 'Madhësia',
    type: 'Formati',
    folder: 'Dosja',
    added: 'Shtuar',
    url: 'Adresa e imazhit',
    copyUrl: 'Kopjo URL',
    urlCopied: 'URL e imazhit u kopjua',
    embedded: 'Imazhi është ruajtur në shfletues (demo) — në prodhim merr një adresë të përhershme në server.',
    usage: 'Ku përdoret',
    usageNone: 'Imazhi aktualisht nuk përdoret askund në faqe — mund ta fshini lirisht.',
    open: 'Hap origjinalin',
    deleteTitle: 'Të fshihet imazhi nga biblioteka?',
    deleteText: 'Imazhi do të hiqet nga biblioteka e medias. Ky veprim nuk mund të zhbëhet.',
    deleteInUse: 'Kujdes: imazhi përdoret në {n} vende ({where}). Do të mbetet i shfaqur aty ku është vendosur, por nuk do të mund ta zgjidhni më nga biblioteka.',
    deletedToast: 'Imazhi u fshi',
    unknown: 'E panjohur',
    kind_product: 'Produkt',
    kind_category: 'Kategori',
    kind_home: 'Faqja kryesore',
    kind_project: 'Realizim',
    kind_post: 'Këshillë (blog)',
    sec_hero: 'Sllajderi hero',
    sec_trust: 'Përparësitë',
    sec_categories: 'Kategoritë',
    sec_featured: 'Produktet e veçuara',
    sec_promo: 'Aksioni promo',
    sec_process: 'Si punojmë',
    sec_services: 'Shërbimet',
    sec_projects: 'Realizimet',
    sec_stats: 'Shifrat dhe citati',
    sec_instagram: 'Instagram',
    sec_faq: 'Pyetjet e shpeshta',
    sec_blog: 'Këshillat',
    sec_cta: 'Thirrje për veprim',
  },
  en: {
    details: 'Image details',
    prev: 'Previous',
    next: 'Next',
    uploaded: 'Uploaded',
    library: 'From catalogue',
    alt: 'Alt text',
    altHint: 'A short description of the image — helps Google search and screen readers.',
    altPh: 'e.g. White interior door',
    altSaved: 'Alt text saved',
    dimensions: 'Dimensions',
    size: 'File size',
    type: 'Format',
    folder: 'Folder',
    added: 'Added',
    url: 'Image address',
    copyUrl: 'Copy URL',
    urlCopied: 'Image URL copied',
    embedded: 'The image is stored in the browser (demo) — in production it gets a permanent server address.',
    usage: 'Where it is used',
    usageNone: 'This image is not used anywhere on the site — it is safe to delete.',
    open: 'Open original',
    deleteTitle: 'Delete image from the library?',
    deleteText: 'The image will be removed from the media library. This cannot be undone.',
    deleteInUse: 'Heads up: this image is used in {n} places ({where}). It will stay visible where it is placed, but you will no longer be able to pick it from the library.',
    deletedToast: 'Image deleted',
    unknown: 'Unknown',
    kind_product: 'Product',
    kind_category: 'Category',
    kind_home: 'Homepage',
    kind_project: 'Project',
    kind_post: 'Advice (blog)',
    sec_hero: 'Hero slider',
    sec_trust: 'Benefits',
    sec_categories: 'Categories',
    sec_featured: 'Featured products',
    sec_promo: 'Promo campaign',
    sec_process: 'How we work',
    sec_services: 'Services',
    sec_projects: 'Projects',
    sec_stats: 'Stats & quote',
    sec_instagram: 'Instagram',
    sec_faq: 'FAQ',
    sec_blog: 'Advice',
    sec_cta: 'Call to action',
  },
});

/** Data folder names are stored in Montenegrin — show them in the panel language. */
const FOLDER_LABELS: Record<string, { sq: string; en: string }> = {
  Hero: { sq: 'Hero', en: 'Hero' },
  Ostalo: { sq: 'Të tjera', en: 'Other' },
  Kategorije: { sq: 'Kategoritë', en: 'Categories' },
  Usluge: { sq: 'Shërbimet', en: 'Services' },
  Projekti: { sq: 'Projektet', en: 'Projects' },
  Proizvodi: { sq: 'Produktet', en: 'Products' },
  Otpremljeno: { sq: 'Të ngarkuara', en: 'Uploaded' },
};

export function useFolderLabel() {
  const lang = useLang('admin');
  return useCallback((folder: string) => (lang === 'me' ? folder : FOLDER_LABELS[folder]?.[lang] ?? folder), [lang]);
}

const KIND_ICON: Record<UsageKind, ComponentType<{ className?: string }>> = {
  product: Package,
  category: FolderTree,
  home: Home,
  project: Hammer,
  post: BookOpen,
};

export function fileFormat(m: MediaItem) {
  const mime = /^data:image\/([a-z+]+)/i.exec(m.url)?.[1];
  const ext = mime ?? /\.([a-z0-9]+)(\?.*)?$/i.exec(m.url)?.[1] ?? /\.([a-z0-9]+)$/i.exec(m.name)?.[1] ?? '';
  return ext.replace('jpeg', 'jpg').toUpperCase();
}

export function MediaDrawer({ item, onClose, usage, onPrev, onNext }: { item: MediaItem | null; onClose: () => void; usage: Map<string, UsageRef[]>; onPrev?: () => void; onNext?: () => void }) {
  const t = useDict(MEDIA_T, 'admin');
  // Keep the last item while the drawer animates out
  const [last, setLast] = useState<MediaItem | null>(item);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;
  return (
    <Drawer
      open={!!item}
      onClose={onClose}
      width="max-w-[520px]"
      title={
        <div className="flex items-center gap-2">
          <span>{t('details')}</span>
          <span className="ml-1 flex items-center gap-0.5">
            <button type="button" onClick={onPrev} disabled={!onPrev} title={t('prev')} aria-label={t('prev')} className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={onNext} disabled={!onNext} title={t('next')} aria-label={t('next')} className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </span>
        </div>
      }
    >
      {shown && <MediaDetails key={shown.id} item={shown} usage={usageOf(usage, shown.url)} onDeleted={onClose} />}
    </Drawer>
  );
}

function MediaDetails({ item, usage, onDeleted }: { item: MediaItem; usage: UsageRef[]; onDeleted: () => void }) {
  const t = useDict(MEDIA_T, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const folderLabel = useFolderLabel();
  const updateMedia = useDb((s) => s.updateMedia);
  const deleteMedia = useDb((s) => s.deleteMedia);
  const [alt, setAlt] = useState(item.alt ?? '');
  const [dims, setDims] = useState<{ w: number; h: number } | null>(item.width && item.height ? { w: item.width, h: item.height } : null);
  const [bytes, setBytes] = useState<number | null>(item.size ?? null);
  const isData = item.url.startsWith('data:');
  const dirty = alt.trim() !== (item.alt ?? '').trim();

  // File size for bundled images: ask the server (HEAD) — "when known"
  useEffect(() => {
    if (item.size || isData) return;
    let alive = true;
    fetch(item.url, { method: 'HEAD' })
      .then((r) => {
        const n = Number(r.headers.get('content-length'));
        if (alive && r.ok && n > 0) setBytes(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [item.url, item.size, isData]);

  const saveAlt = () => {
    updateMedia(item.id, { alt: alt.trim() });
    toast.success(t('altSaved'));
  };

  const where = (r: UsageRef) => (r.kind === 'home' && r.section ? t(`sec_${r.section as HomeSectionType}`) : r.name ? l(r.name) : '');

  const remove = async () => {
    const kinds = Array.from(new Set(usage.map((u) => t(`kind_${u.kind}`)))).join(', ');
    const ok = await confirmDialog({
      title: t('deleteTitle'),
      text: usage.length ? (
        <>
          <span className="mb-2 flex gap-2 rounded-lg bg-amber-50 p-2.5 text-[13px] leading-snug text-amber-900 ring-1 ring-amber-600/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{t('deleteInUse', { n: usage.length, where: kinds.toLowerCase() })}</span>
          </span>
          {t('deleteText')}
        </>
      ) : (
        t('deleteText')
      ),
      confirmLabel: ta('delete'),
      danger: true,
    });
    if (!ok) return;
    deleteMedia(item.id);
    toast.success(t('deletedToast'));
    onDeleted();
  };

  const absoluteUrl = isData ? item.url : new URL(item.url, window.location.origin).href;

  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-6 p-5 sm:p-6">
        {/* Preview on a checkerboard so transparent PNGs read correctly */}
        <div
          className="grid place-items-center overflow-hidden rounded-2xl ring-1 ring-line"
          style={{ backgroundColor: '#efe7dc', backgroundImage: 'linear-gradient(45deg,#e6dccd 25%,transparent 25%,transparent 75%,#e6dccd 75%),linear-gradient(45deg,#e6dccd 25%,transparent 25%,transparent 75%,#e6dccd 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,8px 8px' }}
        >
          <img
            src={item.url}
            alt={item.alt ?? ''}
            className="max-h-[320px] w-auto max-w-full object-contain"
            onLoad={(e) => !dims && setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={item.uploaded ? 'brand' : 'sand'}>{item.uploaded ? t('uploaded') : t('library')}</Badge>
            <Badge tone="outline">{folderLabel(item.folder)}</Badge>
          </div>
          <h3 className="mt-2.5 break-all text-lg font-bold leading-snug text-ink">{item.name}</h3>
        </div>

        {/* Alt text */}
        <div>
          <Label htmlFor="media-alt">{t('alt')}</Label>
          <div className="flex gap-2">
            <input
              id="media-alt"
              value={alt}
              placeholder={t('altPh')}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && dirty && saveAlt()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-[14px] text-ink outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
            />
            <Button shape="rounded" size="sm" variant={dirty ? 'primary' : 'outline'} disabled={!dirty} onClick={saveAlt} className="h-10">
              {ta('save')}
            </Button>
          </div>
          <Hint>{t('altHint')}</Hint>
        </div>

        {/* Facts */}
        <div className="rounded-xl border border-line bg-white px-4 py-1.5">
          <KV label={t('dimensions')} className="border-b border-line/60">
            {dims ? `${dims.w} × ${dims.h} px` : <span className="text-muted">{t('unknown')}</span>}
          </KV>
          <KV label={t('size')} className="border-b border-line/60">
            {bytes ? formatBytes(bytes, lang) : <span className="text-muted">{t('unknown')}</span>}
          </KV>
          <KV label={t('type')} className="border-b border-line/60">
            {fileFormat(item) || '—'}
          </KV>
          <KV label={t('added')}>{date(item.createdAt, lang)}</KV>
        </div>

        {/* URL */}
        <div>
          <Label>{t('url')}</Label>
          <div className="flex gap-2">
            <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-line bg-canvas/60 px-3 font-mono text-[12px] text-ink-soft">
              <span className="truncate">{isData ? `${item.url.slice(0, 32)}…` : item.url}</span>
            </div>
            <CopyButton text={absoluteUrl} label={t('copyUrl')} toastText={t('urlCopied')} />
          </div>
          {isData && <Hint>{t('embedded')}</Hint>}
        </div>

        {/* Usage */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">{t('usage')}</Label>
            <span className={cn('rounded-md px-1.5 text-[11px] font-bold tabular-nums', usage.length ? 'bg-ink text-paper' : 'bg-canvas text-muted')}>{usage.length}</span>
          </div>
          {usage.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-4 text-[13px] text-muted">{t('usageNone')}</p>
          ) : (
            <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line bg-white">
              {usage.map((u) => {
                const Icon = KIND_ICON[u.kind];
                return (
                  <li key={`${u.kind}-${u.id}`}>
                    <Link to={u.to} className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-canvas/60">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft group-hover:bg-white group-hover:text-brand-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">{where(u)}</span>
                        <span className="block text-[11.5px] text-muted">{t(`kind_${u.kind}`)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-2 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-6">
        <Button variant="ghost" shape="rounded" size="sm" icon={<Trash2 className="h-4 w-4" />} className="text-red-600 hover:bg-red-50" onClick={remove}>
          {ta('delete')}
        </Button>
        {!isData && (
          <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-ink/35">
            {t('open')} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
