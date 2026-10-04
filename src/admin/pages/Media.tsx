import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleDashed, HardDrive, ImageIcon, Images, Link2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/misc';
import { Card, FilterPills, PageHeader, SearchInput } from '@/admin/components/kit';
import { Dropzone, useUploader } from '@/admin/components/media';
import { MediaDrawer, useFolderLabel } from '@/admin/components/catalog/MediaDrawer';
import { StatTile, formatBytes } from '@/admin/components/catalog/shared';
import { useMediaUsage, usageOf } from '@/admin/components/catalog/usage';
import { defineDict, useDict, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { fold } from '@/lib/search';
import { cn, thumb } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Mediji',
    subtitle: 'Sve fotografije sajta na jednom mjestu — otpremite nove, uredite alt tekst i provjerite gdje se koja slika koristi.',
    upload: 'Otpremi slike',
    statTotal: 'Ukupno slika',
    statTotalHint: 'u {n} foldera',
    statUploaded: 'Otpremljeno',
    statUploadedHint: '{size} u pregledaču',
    statUploadedNone: 'Još nema otpremljenih slika',
    statUsed: 'U upotrebi',
    statUsedHint: '{pct}% biblioteke',
    statUnused: 'Nekorišćene',
    statUnusedHint: 'Kandidati za brisanje',
    searchPh: 'Pretraži po nazivu ili alt tekstu…',
    usageAll: 'Sve',
    usageUsed: 'U upotrebi',
    usageUnused: 'Nekorišćene',
    usedN: '{n}× u upotrebi',
    unused: 'Nekorišćena',
    fresh: 'Novo',
    emptyTitle: 'Nema slika za prikaz',
    emptyText: 'Promijenite pretragu ili filter, ili otpremite nove fotografije.',
    resetFilters: 'Poništi filtere',
    sortHint: 'Najnovije prvo',
    loadMore: 'Prikaži još {n}',
  },
  sq: {
    title: 'Media',
    subtitle: 'Të gjitha fotot e faqes në një vend — ngarkoni të reja, ndryshoni tekstin alt dhe shihni ku përdoret secili imazh.',
    upload: 'Ngarko imazhe',
    statTotal: 'Gjithsej imazhe',
    statTotalHint: 'në {n} dosje',
    statUploaded: 'Të ngarkuara',
    statUploadedHint: '{size} në shfletues',
    statUploadedNone: 'Ende pa imazhe të ngarkuara',
    statUsed: 'Në përdorim',
    statUsedHint: '{pct}% e bibliotekës',
    statUnused: 'Të papërdorura',
    statUnusedHint: 'Kandidatë për fshirje',
    searchPh: 'Kërko sipas emrit ose tekstit alt…',
    usageAll: 'Të gjitha',
    usageUsed: 'Në përdorim',
    usageUnused: 'Të papërdorura',
    usedN: 'Përdoret {n}×',
    unused: 'E papërdorur',
    fresh: 'E re',
    emptyTitle: 'Nuk ka imazhe për të shfaqur',
    emptyText: 'Ndryshoni kërkimin ose filtrin, ose ngarkoni foto të reja.',
    resetFilters: 'Pastro filtrat',
    sortHint: 'Më të rejat së pari',
    loadMore: 'Shfaq edhe {n}',
  },
  en: {
    title: 'Media',
    subtitle: 'Every photo on the site in one place — upload new ones, edit alt text and see where each image is used.',
    upload: 'Upload images',
    statTotal: 'Total images',
    statTotalHint: 'in {n} folders',
    statUploaded: 'Uploaded',
    statUploadedHint: '{size} in the browser',
    statUploadedNone: 'No uploads yet',
    statUsed: 'In use',
    statUsedHint: '{pct}% of the library',
    statUnused: 'Unused',
    statUnusedHint: 'Candidates for clean-up',
    searchPh: 'Search by name or alt text…',
    usageAll: 'All',
    usageUsed: 'In use',
    usageUnused: 'Unused',
    usedN: 'Used {n}×',
    unused: 'Unused',
    fresh: 'New',
    emptyTitle: 'No images to show',
    emptyText: 'Change the search or filter, or upload new photos.',
    resetFilters: 'Reset filters',
    sortHint: 'Newest first',
    loadMore: 'Show {n} more',
  },
});

type UsageFilter = 'all' | 'used' | 'unused';
/** Tiles rendered per "page" — keeps the grid light with 100+ images */
const PAGE = 30;

export default function Media() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const folderLabel = useFolderLabel();
  const media = useDb((s) => s.media);
  const usage = useMediaUsage();
  const { upload, busy } = useUploader();
  const fileRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [folder, setFolder] = useState('all');
  const [use, setUse] = useState<UsageFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE);

  const sorted = useMemo(() => [...media].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [media]);
  const useCount = useMemo(() => new Map(media.map((m) => [m.id, usageOf(usage, m.url).length])), [media, usage]);

  const stats = useMemo(() => {
    const uploaded = media.filter((m) => m.uploaded);
    const used = media.filter((m) => (useCount.get(m.id) ?? 0) > 0).length;
    return {
      total: media.length,
      folders: new Set(media.map((m) => m.folder)).size,
      uploaded: uploaded.length,
      uploadedBytes: uploaded.reduce((s, m) => s + (m.size ?? 0), 0),
      used,
      unused: media.length - used,
    };
  }, [media, useCount]);

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of media) counts.set(m.folder, (counts.get(m.folder) ?? 0) + 1);
    return [{ id: 'all', label: ta('all'), count: media.length }, ...Array.from(counts, ([id, count]) => ({ id, label: folderLabel(id), count }))];
  }, [media, ta, folderLabel]);

  const list = useMemo(() => {
    const needle = fold(q.trim());
    return sorted.filter((m) => {
      if (folder !== 'all' && m.folder !== folder) return false;
      const n = useCount.get(m.id) ?? 0;
      if (use === 'used' && n === 0) return false;
      if (use === 'unused' && n > 0) return false;
      return !needle || fold(`${m.name} ${m.alt ?? ''}`).includes(needle);
    });
  }, [sorted, folder, use, q, useCount]);

  const visible = useMemo(() => list.slice(0, limit), [list, limit]);
  useEffect(() => setLimit(PAGE), [q, folder, use]);

  // If the folder disappears (e.g. last upload deleted) fall back to "all"
  useEffect(() => {
    if (folder !== 'all' && !media.some((m) => m.folder === folder)) setFolder('all');
  }, [media, folder]);

  const doUpload = async (files: FileList) => {
    const items = await upload(files);
    if (!items.length) return;
    setFolder('all');
    setUse('all');
    setQ('');
    setFresh((f) => [...f, ...items.map((i) => i.id)]);
  };

  const idx = openId ? list.findIndex((m) => m.id === openId) : -1;
  const current = openId ? media.find((m) => m.id === openId) ?? null : null;
  const filtered = q || folder !== 'all' || use !== 'all';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) doUpload(e.target.files);
                e.target.value = '';
              }}
            />
            <Button shape="rounded" size="sm" loading={busy} icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              {t('upload')}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<Images className="h-4 w-4" />} label={t('statTotal')} value={stats.total} hint={t('statTotalHint', { n: stats.folders })} />
        <StatTile
          icon={<HardDrive className="h-4 w-4" />}
          label={t('statUploaded')}
          value={stats.uploaded}
          accent
          hint={stats.uploaded ? t('statUploadedHint', { size: formatBytes(stats.uploadedBytes, lang) }) : t('statUploadedNone')}
        />
        <StatTile icon={<Link2 className="h-4 w-4" />} label={t('statUsed')} value={stats.used} hint={t('statUsedHint', { pct: stats.total ? Math.round((stats.used / stats.total) * 100) : 0 })} />
        <StatTile icon={<CircleDashed className="h-4 w-4" />} label={t('statUnused')} value={stats.unused} hint={t('statUnusedHint')} />
      </div>

      <Card padded={false}>
        <div className="border-b border-line/70 p-4 sm:p-5">
          <Dropzone onFiles={doUpload} busy={busy} compact />
        </div>
        <div className="space-y-3 border-b border-line/70 p-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={q} onChange={setQ} placeholder={t('searchPh')} className="sm:w-80" />
            <div className="flex shrink-0 rounded-lg bg-canvas p-0.5 ring-1 ring-line/60 sm:ml-auto">
              {(['all', 'used', 'unused'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUse(u)}
                  className={cn('h-8 flex-1 rounded-md px-3 text-[12.5px] font-semibold transition-colors sm:flex-none', use === u ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
                >
                  {u === 'all' ? t('usageAll') : u === 'used' ? t('usageUsed') : t('usageUnused')}
                </button>
              ))}
            </div>
          </div>
          <FilterPills options={folders} value={folder} onChange={setFolder} />
        </div>

        <div className="flex items-center justify-between px-4 pt-4 text-xs text-muted sm:px-5">
          <span>{ta('showing', { n: visible.length, total: list.length })}</span>
          <span>{t('sortHint')}</span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-6 w-6" />}
            title={t('emptyTitle')}
            text={t('emptyText')}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  shape="rounded"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    setFolder('all');
                    setUse('all');
                  }}
                >
                  {t('resetFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 p-4 sm:grid-cols-3 sm:p-5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {visible.map((m) => {
                const n = useCount.get(m.id) ?? 0;
                const isFresh = fresh.includes(m.id);
                return (
                  <li key={m.id} className={cn(isFresh && 'animate-pop')}>
                    <button type="button" onClick={() => setOpenId(m.id)} className="group block w-full text-left">
                      <span
                        className={cn(
                          'relative block aspect-square overflow-hidden rounded-xl bg-sand ring-1 transition duration-300 group-hover:shadow-lg group-hover:ring-ink/25',
                          isFresh ? 'ring-2 ring-brand-600' : 'ring-line',
                        )}
                      >
                        <img src={thumb(m.url)} alt={m.alt ?? ''} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        {(m.uploaded || isFresh) && (
                          <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">{isFresh ? t('fresh') : folderLabel(m.folder)}</span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-semibold text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          {m.alt || m.name}
                        </span>
                      </span>
                      <span className="mt-2 block truncate text-[12.5px] font-semibold text-ink group-hover:text-brand-700">{m.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted">
                        <span className="truncate">{folderLabel(m.folder)}</span>
                        <span className="text-line">•</span>
                        {n > 0 ? (
                          <span className="shrink-0">{t('usedN', { n })}</span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {t('unused')}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {list.length > visible.length && (
              <div className="flex justify-center px-4 pb-6">
                <Button variant="outline" shape="rounded" size="sm" onClick={() => setLimit((x) => x + PAGE)}>
                  {t('loadMore', { n: Math.min(PAGE, list.length - visible.length) })}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <MediaDrawer
        item={current}
        usage={usage}
        onClose={() => setOpenId(null)}
        onPrev={idx > 0 ? () => setOpenId(list[idx - 1].id) : undefined}
        onNext={idx >= 0 && idx < list.length - 1 ? () => setOpenId(list[idx + 1].id) : undefined}
      />
    </div>
  );
}
