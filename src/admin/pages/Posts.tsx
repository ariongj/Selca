import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { BookOpen, Clock3, ExternalLink, FilePlus2, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, Card, FilterPills, SearchInput, confirmDialog } from '@/admin/components/kit';
import { LangDots } from '@/admin/components/editorial/fields';
import { ed } from '@/admin/components/editorial/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Field';
import { Badge, EmptyState, Img } from '@/components/ui/misc';
import { defineDict, useDict, useL, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import type { Post } from '@/lib/types';
import { date } from '@/lib/format';
import { fold } from '@/lib/search';
import { cn } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Savjeti (blog)',
    description: 'Članci sa savjetima — prikazuju se na stranici „Savjeti“ i u istoimenoj sekciji na početnoj.',
    newPost: 'Novi savjet',
    colPost: 'Članak',
    colTag: 'Tema',
    colDate: 'Datum',
    colPublished: 'Objavljen',
    drafts: 'Nacrti',
    searchPh: 'Pretraži savjete…',
    empty: 'Još nema savjeta',
    emptyText: 'Napišite prvi članak — kupci vole praktične vodiče za izbor i održavanje.',
    noMatch: 'Nijedan članak ne odgovara pretrazi.',
    nowPublished: 'Savjet je objavljen',
    nowHidden: 'Savjet je sakriven sa sajta',
    deleteTitle: 'Obrisati savjet „{name}“?',
    deleteText: 'Članak i svi njegovi prevodi biće trajno uklonjeni.',
    readMin: '{n} min čitanja',
    allTags: 'Sve teme',
  },
  sq: {
    title: 'Këshilla (blog)',
    description: 'Artikuj me këshilla — shfaqen në faqen „Këshilla“ dhe në seksionin me të njëjtin emër në faqen kryesore.',
    newPost: 'Këshillë e re',
    colPost: 'Artikulli',
    colTag: 'Tema',
    colDate: 'Data',
    colPublished: 'I publikuar',
    drafts: 'Draftet',
    searchPh: 'Kërko këshillat…',
    empty: 'Ende nuk ka këshilla',
    emptyText: 'Shkruani artikullin e parë — klientët i duan udhëzuesit praktikë për zgjedhje dhe mirëmbajtje.',
    noMatch: 'Asnjë artikull nuk përputhet me kërkimin.',
    nowPublished: 'Këshilla u publikua',
    nowHidden: 'Këshilla u fsheh nga sajti',
    deleteTitle: 'Të fshihet këshilla „{name}“?',
    deleteText: 'Artikulli dhe të gjitha përkthimet do të hiqen përgjithmonë.',
    readMin: '{n} min lexim',
    allTags: 'Të gjitha temat',
  },
  en: {
    title: 'Advice (blog)',
    description: 'Advice articles — shown on the “Advice” page and in the matching homepage section.',
    newPost: 'New article',
    colPost: 'Article',
    colTag: 'Topic',
    colDate: 'Date',
    colPublished: 'Published',
    drafts: 'Drafts',
    searchPh: 'Search articles…',
    empty: 'No articles yet',
    emptyText: 'Write your first article — customers love practical buying and care guides.',
    noMatch: 'No article matches your search.',
    nowPublished: 'Article published',
    nowHidden: 'Article hidden from the site',
    deleteTitle: 'Delete the article “{name}”?',
    deleteText: 'The article and all its translations will be removed permanently.',
    readMin: '{n} min read',
    allTags: 'All topics',
  },
});

type Filter = 'all' | 'published' | 'drafts';
const COLS = 'md:grid-cols-[104px_minmax(0,1fr)_118px_120px_80px_104px]';

export default function Posts() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const posts = useDb((s) => s.posts);
  const upsertPost = useDb((s) => s.upsertPost);
  const deletePost = useDb((s) => s.deletePost);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({ all: posts.length, published: posts.filter((p) => p.published).length, drafts: posts.filter((p) => !p.published).length }),
    [posts],
  );

  const list = useMemo(() => {
    const needle = fold(q.trim());
    return [...posts]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((p) => {
        if (filter === 'published' && !p.published) return false;
        if (filter === 'drafts' && p.published) return false;
        if (!needle) return true;
        return fold(`${p.title.me} ${p.title.sq} ${p.title.en} ${p.slug} ${p.tag.me} ${p.author}`).includes(needle);
      });
  }, [posts, q, filter]);

  const setPublished = (p: Post, v: boolean) => {
    upsertPost({ ...p, published: v });
    toast.success(v ? t('nowPublished') : t('nowHidden'), { description: l(p.title) });
  };

  const remove = async (p: Post) => {
    const name = l(p.title);
    if (!(await confirmDialog({ title: t('deleteTitle', { name }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true }))) return;
    deletePost(p.id);
    toast.success(te('deletedToast', { name }));
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <ButtonLink to="/admin/savjeti/novi" shape="rounded" size="sm" icon={<FilePlus2 className="h-4 w-4" />}>
            {t('newPost')}
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
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder={t('searchPh')} className="md:w-72" />
      </div>

      <Card padded={false} className="overflow-hidden">
        {posts.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={t('empty')}
            text={t('emptyText')}
            action={
              <ButtonLink to="/admin/savjeti/novi" shape="rounded" size="sm" icon={<FilePlus2 className="h-4 w-4" />}>
                {t('newPost')}
              </ButtonLink>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" />} title={ta('noResults')} text={t('noMatch')} />
        ) : (
          <>
            <div className={cn('hidden items-center gap-4 border-b border-line bg-canvas/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted md:grid', COLS)}>
              <span className="col-span-2">{t('colPost')}</span>
              <span>{t('colTag')}</span>
              <span>{t('colDate')}</span>
              <span className="text-center">{t('colPublished')}</span>
              <span className="sr-only">{ta('actions')}</span>
            </div>
            <ul className="divide-y divide-line/70">
              {list.map((p) => (
                <li
                  key={p.id}
                  onClick={() => navigate(`/admin/savjeti/${p.id}`)}
                  className={cn('group grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5', COLS)}
                >
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-lg bg-sand ring-1 ring-line">
                    {p.cover ? (
                      <Img small src={p.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted">
                        <ImageOff className="h-4 w-4" />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link to={`/admin/savjeti/${p.id}`} onClick={(e) => e.stopPropagation()} className="truncate text-[14.5px] font-semibold text-ink hover:text-brand-700">
                        {l(p.title)}
                      </Link>
                      {!p.published && (
                        <Badge tone="amber" className="shrink-0 py-0.5">
                          {ta('draft')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{l(p.excerpt)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                      <span className="font-medium text-ink-soft">{p.author}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" /> {t('readMin', { n: p.readMinutes })}
                      </span>
                      <LangDots value={[p.title, p.excerpt, p.body]} />
                    </div>
                  </div>

                  {/* Mobile meta row */}
                  <div className="col-span-2 flex items-center gap-3 md:hidden" onClick={(e) => e.stopPropagation()}>
                    <Badge tone="sand">{l(p.tag)}</Badge>
                    <span className="text-[12.5px] text-muted">{date(p.publishedAt, lang)}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <Switch size="sm" checked={p.published} onChange={(v) => setPublished(p, v)} />
                      <RowActions p={p} onDelete={() => remove(p)} />
                    </span>
                  </div>

                  <span className="hidden md:block">
                    <Badge tone="sand">{l(p.tag)}</Badge>
                  </span>
                  <span className="hidden text-[13px] text-ink-soft md:block">{date(p.publishedAt, lang)}</span>
                  <span className="hidden justify-center md:flex" onClick={(e) => e.stopPropagation()}>
                    <Switch size="sm" checked={p.published} onChange={(v) => setPublished(p, v)} />
                  </span>
                  <span className="hidden items-center justify-end gap-0.5 md:flex" onClick={(e) => e.stopPropagation()}>
                    <RowActions p={p} onDelete={() => remove(p)} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

function RowActions({ p, onDelete }: { p: Post; onDelete: () => void }) {
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const btn = 'grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white hover:text-ink hover:shadow-sm';
  return (
    <>
      <a href={`/savjeti/${p.slug}`} target="_blank" rel="noreferrer" className={btn} title={te('viewOnSite')} aria-label={te('viewOnSite')}>
        <ExternalLink className="h-4 w-4" />
      </a>
      <Link to={`/admin/savjeti/${p.id}`} className={cn(btn, 'hidden sm:grid')} title={ta('edit')} aria-label={ta('edit')}>
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" onClick={onDelete} className={cn(btn, 'hover:text-red-600')} title={ta('delete')} aria-label={ta('delete')}>
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}
