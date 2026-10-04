import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ExternalLink, FilePlus2, FileText, PanelBottom, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, Card, FilterPills, SearchInput, confirmDialog } from '@/admin/components/kit';
import { ed } from '@/admin/components/editorial/i18n';
import { LangDots } from '@/admin/components/editorial/fields';
import { ButtonLink } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import type { CmsPage } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { fold } from '@/lib/search';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Stranice',
    description: 'Informativne stranice sajta — dostava, uslovi kupovine, reklamacije, privatnost. Svaka na tri jezika.',
    newPage: 'Nova stranica',
    colPage: 'Stranica',
    colUrl: 'Adresa',
    colPublished: 'Objavljena',
    colFooter: 'U podnožju',
    colUpdated: 'Ažurirano',
    drafts: 'Nacrti',
    inFooter: 'U podnožju',
    empty: 'Nema stranica',
    emptyText: 'Kreirajte prvu informativnu stranicu — npr. „Dostava i ugradnja“.',
    noMatch: 'Nijedna stranica ne odgovara pretrazi.',
    searchPh: 'Pretraži stranice…',
    nowPublished: 'Stranica je objavljena',
    nowHidden: 'Stranica je sakrivena sa sajta',
    nowInFooter: 'Link je dodat u podnožje',
    nowNotInFooter: 'Link je uklonjen iz podnožja',
    deleteTitle: 'Obrisati stranicu „{name}“?',
    deleteText: 'Stranica i svi njeni prevodi biće trajno uklonjeni.',
    footerPreview: 'Podnožje sajta',
    footerPreviewText: 'Ovako se linkovi prikazuju u podnožju, redoslijedom iz liste.',
    footerEmpty: 'Nijedna objavljena stranica nije označena za podnožje.',
    footerColumn: 'Informacije',
    langs: 'Prevodi',
  },
  sq: {
    title: 'Faqet',
    description: 'Faqet informative të sajtit — dërgesa, kushtet e blerjes, reklamacionet, privatësia. Secila në tre gjuhë.',
    newPage: 'Faqe e re',
    colPage: 'Faqja',
    colUrl: 'Adresa',
    colPublished: 'E publikuar',
    colFooter: 'Në footer',
    colUpdated: 'Përditësuar',
    drafts: 'Draftet',
    inFooter: 'Në footer',
    empty: 'Nuk ka faqe',
    emptyText: 'Krijoni faqen e parë informative — p.sh. „Dërgesa dhe montimi“.',
    noMatch: 'Asnjë faqe nuk përputhet me kërkimin.',
    searchPh: 'Kërko faqet…',
    nowPublished: 'Faqja u publikua',
    nowHidden: 'Faqja u fsheh nga sajti',
    nowInFooter: 'Lidhja u shtua në footer',
    nowNotInFooter: 'Lidhja u hoq nga footer-i',
    deleteTitle: 'Të fshihet faqja „{name}“?',
    deleteText: 'Faqja dhe të gjitha përkthimet do të hiqen përgjithmonë.',
    footerPreview: 'Fundi i faqes (footer)',
    footerPreviewText: 'Kështu shfaqen lidhjet në footer, sipas renditjes në listë.',
    footerEmpty: 'Asnjë faqe e publikuar nuk është shënuar për footer.',
    footerColumn: 'Informacione',
    langs: 'Përkthimet',
  },
  en: {
    title: 'Pages',
    description: 'Information pages — delivery, terms of purchase, returns, privacy. Each in three languages.',
    newPage: 'New page',
    colPage: 'Page',
    colUrl: 'Address',
    colPublished: 'Published',
    colFooter: 'In footer',
    colUpdated: 'Updated',
    drafts: 'Drafts',
    inFooter: 'In footer',
    empty: 'No pages yet',
    emptyText: 'Create your first information page — e.g. “Delivery & installation”.',
    noMatch: 'No page matches your search.',
    searchPh: 'Search pages…',
    nowPublished: 'Page published',
    nowHidden: 'Page hidden from the site',
    nowInFooter: 'Link added to the footer',
    nowNotInFooter: 'Link removed from the footer',
    deleteTitle: 'Delete the page “{name}”?',
    deleteText: 'The page and all its translations will be removed permanently.',
    footerPreview: 'Site footer',
    footerPreviewText: 'This is how the links appear in the footer, in list order.',
    footerEmpty: 'No published page is marked for the footer.',
    footerColumn: 'Information',
    langs: 'Translations',
  },
});

type Filter = 'all' | 'published' | 'drafts' | 'footer';

export default function Pages() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const pages = useDb((s) => s.pages);
  const upsertPage = useDb((s) => s.upsertPage);
  const deletePage = useDb((s) => s.deletePage);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: pages.length,
      published: pages.filter((p) => p.published).length,
      drafts: pages.filter((p) => !p.published).length,
      footer: pages.filter((p) => p.showInFooter).length,
    }),
    [pages],
  );

  const list = useMemo(() => {
    const needle = fold(q.trim());
    return pages.filter((p) => {
      if (filter === 'published' && !p.published) return false;
      if (filter === 'drafts' && p.published) return false;
      if (filter === 'footer' && !p.showInFooter) return false;
      if (!needle) return true;
      return fold(`${p.title.me} ${p.title.sq} ${p.title.en} ${p.slug}`).includes(needle);
    });
  }, [pages, q, filter]);

  const footerPages = useMemo(() => pages.filter((p) => p.published && p.showInFooter), [pages]);

  const toggle = (p: CmsPage, key: 'published' | 'showInFooter', v: boolean) => {
    upsertPage({ ...p, [key]: v });
    if (key === 'published') toast.success(v ? t('nowPublished') : t('nowHidden'), { description: l(p.title) });
    else toast.success(v ? t('nowInFooter') : t('nowNotInFooter'), { description: l(p.title) });
  };

  const remove = async (p: CmsPage) => {
    const name = l(p.title);
    if (!(await confirmDialog({ title: t('deleteTitle', { name }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true }))) return;
    deletePage(p.id);
    toast.success(te('deletedToast', { name }));
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <ButtonLink to="/admin/stranice/novi" shape="rounded" size="sm" icon={<FilePlus2 className="h-4 w-4" />}>
            {t('newPage')}
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterPills<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: ta('all'), count: counts.all },
            { id: 'published', label: ta('published'), count: counts.published },
            { id: 'drafts', label: t('drafts'), count: counts.drafts },
            { id: 'footer', label: t('inFooter'), count: counts.footer },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder={t('searchPh')} className="md:w-72" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card padded={false} className="min-w-0 overflow-hidden">
          {pages.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={t('empty')}
              text={t('emptyText')}
              action={
                <ButtonLink to="/admin/stranice/novi" shape="rounded" size="sm" icon={<FilePlus2 className="h-4 w-4" />}>
                  {t('newPage')}
                </ButtonLink>
              }
            />
          ) : list.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title={ta('noResults')} text={t('noMatch')} />
          ) : (
            <>
              {/* Column header (desktop) */}
              <div className="hidden grid-cols-[minmax(0,1fr)_92px_92px_112px_104px] items-center gap-4 border-b border-line bg-canvas/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted md:grid">
                <span>{t('colPage')}</span>
                <span className="text-center">{t('colPublished')}</span>
                <span className="text-center">{t('colFooter')}</span>
                <span>{t('colUpdated')}</span>
                <span className="sr-only">{ta('actions')}</span>
              </div>
              <ul className="divide-y divide-line/70">
                {list.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => navigate(`/admin/stranice/${p.id}`)}
                    className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5 md:grid-cols-[minmax(0,1fr)_92px_92px_112px_104px]"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1', p.published ? 'bg-brand-50 text-brand-700 ring-brand-600/10' : 'bg-canvas text-muted ring-line')}>
                        <FileText className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/stranice/${p.id}`} onClick={(e) => e.stopPropagation()} className="truncate text-[14.5px] font-semibold text-ink hover:text-brand-700">
                            {l(p.title)}
                          </Link>
                          <LangDots value={[p.title, p.body]} />
                          {!p.published && (
                            <Badge tone="amber" className="py-0.5">
                              {ta('draft')}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[12px] text-muted">/stranica/{p.slug}</div>
                      </div>
                    </div>

                    {/* Mobile: compact actions on the right */}
                    <div className="flex items-center gap-1 md:hidden" onClick={(e) => e.stopPropagation()}>
                      <RowActions p={p} onDelete={() => remove(p)} />
                    </div>

                    <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 pl-[54px] md:contents md:pl-0" onClick={(e) => e.stopPropagation()}>
                      <span className="flex items-center gap-2 md:justify-center">
                        <Switch size="sm" checked={p.published} onChange={(v) => toggle(p, 'published', v)} />
                        <span className="text-[12.5px] font-medium text-ink-soft md:hidden">{t('colPublished')}</span>
                      </span>
                      <span className="flex items-center gap-2 md:justify-center">
                        <Switch size="sm" checked={p.showInFooter} onChange={(v) => toggle(p, 'showInFooter', v)} />
                        <span className="text-[12.5px] font-medium text-ink-soft md:hidden">{t('colFooter')}</span>
                      </span>
                      <span className="ml-auto text-[12.5px] text-muted md:ml-0 md:text-[13px]" title={new Date(p.updatedAt).toLocaleString()}>
                        {timeAgo(p.updatedAt, lang)}
                      </span>
                    </div>

                    <div className="hidden items-center justify-end gap-0.5 md:flex" onClick={(e) => e.stopPropagation()}>
                      <RowActions p={p} onDelete={() => remove(p)} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Footer preview */}
        <aside className="space-y-3">
          <div className="overflow-hidden rounded-2xl bg-ink text-paper shadow-[0_1px_2px_rgb(28_26_23/0.04)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <PanelBottom className="h-4 w-4 text-brand-300" />
              <span className="text-[13.5px] font-bold">{t('footerPreview')}</span>
            </div>
            <div className="px-5 py-5">
              <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.2em] text-paper/45">{t('footerColumn')}</div>
              {footerPages.length ? (
                <ul className="space-y-2.5">
                  {footerPages.map((p) => (
                    <li key={p.id}>
                      <Link to={`/admin/stranice/${p.id}`} className="link-u text-[14px] text-paper/80 hover:text-white">
                        {l(p.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-paper/50">{t('footerEmpty')}</p>
              )}
            </div>
          </div>
          <p className="px-1 text-[12.5px] leading-relaxed text-muted">{t('footerPreviewText')}</p>
        </aside>
      </div>
    </div>
  );
}

function RowActions({ p, onDelete }: { p: CmsPage; onDelete: () => void }) {
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const btn = 'grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white hover:text-ink hover:shadow-sm';
  return (
    <>
      <a href={`/stranica/${p.slug}`} target="_blank" rel="noreferrer" className={btn} title={te('viewOnSite')} aria-label={te('viewOnSite')}>
        <ExternalLink className="h-4 w-4" />
      </a>
      <Link to={`/admin/stranice/${p.id}`} className={btn} title={ta('edit')} aria-label={ta('edit')}>
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" onClick={onDelete} className={cn(btn, 'hover:text-red-600')} title={ta('delete')} aria-label={ta('delete')}>
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}

