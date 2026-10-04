import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { CalendarDays, Clock3, FileQuestion, Globe, UserRound, Wand2 } from 'lucide-react';
import { PageHeader, Card, SaveBar, confirmDialog } from '@/admin/components/kit';
import { L10nInput } from '@/admin/components/L10nInput';
import { ImageField } from '@/admin/components/media';
import { MarkdownEditor } from '@/admin/components/editorial/MarkdownEditor';
import { EditorActions, SearchPreview, SlugField, SwitchRow, TextField, TranslationStatus } from '@/admin/components/editorial/fields';
import { readMinutesFor, useDraft, useSaveKeyLabel, useSaveShortcut, useUnsavedGuard } from '@/admin/components/editorial/hooks';
import { ed } from '@/admin/components/editorial/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { defineDict, interpolate, useDict, useL, useLang, emptyL10n, lt } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import type { L10n, Post } from '@/lib/types';
import { date, timeAgo } from '@/lib/format';
import { cn, slugify, thumb, uid } from '@/lib/utils';

const T = defineDict({
  me: {
    newPost: 'Novi savjet',
    newPostText: 'Članak za blog „Savjeti“ — vodiči, savjeti i inspiracija za kupce.',
    title: 'Naslov članka',
    titlePh: 'npr. Kako izabrati pravi laminat',
    excerpt: 'Kratak opis',
    excerptHint: 'Prikazuje se na listi savjeta, na početnoj i u Google pretrazi (do ~160 znakova).',
    tag: 'Tema',
    quickPick: 'Brzi izbor:',
    body: 'Tekst članka',
    cover: 'Naslovna slika',
    coverHint: 'Preporučeno 1600 × 1000 px, pejzažni format.',
    published: 'Objavljen',
    publishedHint: 'Vidljiv na stranici „Savjeti“ i na početnoj.',
    publishedAt: 'Datum objave',
    author: 'Autor',
    readMinutes: 'Vrijeme čitanja',
    min: 'min',
    auto: 'Izračunaj iz teksta (~{n} min)',
    saved: 'Savjet je sačuvan',
    created: 'Savjet je kreiran',
    deleteTitle: 'Obrisati savjet „{name}“?',
    deleteText: 'Članak i svi njegovi prevodi biće trajno uklonjeni.',
    fieldTitle: 'Naslov',
    fieldExcerpt: 'Opis',
    fieldBody: 'Tekst',
    fieldTag: 'Tema',
    draftNote: 'Nacrt nije vidljiv na sajtu dok ga ne objavite.',
    readMeta: '{n} min čitanja',
    published_on: 'Objavljeno {date}',
  },
  sq: {
    newPost: 'Këshillë e re',
    newPostText: 'Artikull për blogun „Këshilla“ — udhëzues, këshilla dhe frymëzim për klientët.',
    title: 'Titulli i artikullit',
    titlePh: 'p.sh. Si të zgjidhni laminatin e duhur',
    excerpt: 'Përshkrim i shkurtër',
    excerptHint: 'Shfaqet në listën e këshillave, në faqen kryesore dhe në Google (deri ~160 karaktere).',
    tag: 'Tema',
    quickPick: 'Zgjedhje e shpejtë:',
    body: 'Teksti i artikullit',
    cover: 'Imazhi kryesor',
    coverHint: 'Rekomandohet 1600 × 1000 px, format horizontal.',
    published: 'I publikuar',
    publishedHint: 'I dukshëm në faqen „Këshilla“ dhe në faqen kryesore.',
    publishedAt: 'Data e publikimit',
    author: 'Autori',
    readMinutes: 'Koha e leximit',
    min: 'min',
    auto: 'Llogarit nga teksti (~{n} min)',
    saved: 'Këshilla u ruajt',
    created: 'Këshilla u krijua',
    deleteTitle: 'Të fshihet këshilla „{name}“?',
    deleteText: 'Artikulli dhe të gjitha përkthimet do të hiqen përgjithmonë.',
    fieldTitle: 'Titulli',
    fieldExcerpt: 'Përshkrimi',
    fieldBody: 'Teksti',
    fieldTag: 'Tema',
    draftNote: 'Drafti nuk shihet në faqe derisa ta publikoni.',
    readMeta: '{n} min lexim',
    published_on: 'Publikuar më {date}',
  },
  en: {
    newPost: 'New article',
    newPostText: 'An article for the “Advice” blog — guides, tips and inspiration for customers.',
    title: 'Article title',
    titlePh: 'e.g. How to choose the right laminate',
    excerpt: 'Short description',
    excerptHint: 'Shown in the article list, on the homepage and in Google results (up to ~160 characters).',
    tag: 'Topic',
    quickPick: 'Quick pick:',
    body: 'Article text',
    cover: 'Cover image',
    coverHint: 'Recommended 1600 × 1000 px, landscape.',
    published: 'Published',
    publishedHint: 'Visible on the “Advice” page and the homepage.',
    publishedAt: 'Publish date',
    author: 'Author',
    readMinutes: 'Reading time',
    min: 'min',
    auto: 'Calculate from text (~{n} min)',
    saved: 'Article saved',
    created: 'Article created',
    deleteTitle: 'Delete the article “{name}”?',
    deleteText: 'The article and all its translations will be removed permanently.',
    fieldTitle: 'Title',
    fieldExcerpt: 'Description',
    fieldBody: 'Text',
    fieldTag: 'Topic',
    draftNote: 'A draft is not visible on the site until you publish it.',
    readMeta: '{n} min read',
    published_on: 'Published {date}',
  },
});

const blankPost = (): Post => ({
  id: uid('post'),
  slug: '',
  title: emptyL10n(),
  excerpt: emptyL10n(),
  body: emptyL10n(),
  cover: '',
  tag: emptyL10n(),
  author: 'SELCA tim',
  readMinutes: 3,
  publishedAt: new Date().toISOString(),
  published: false,
});

export default function PostEdit() {
  const { id = 'novi' } = useParams();
  return <PostEditor key={id} id={id} />;
}

function PostEditor({ id }: { id: string }) {
  const t = useDict(T, 'admin');
  const te = useDict(ed, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const keyLabel = useSaveKeyLabel();

  const isNew = id === 'novi';
  const source = useDb((s) => (isNew ? undefined : s.posts.find((p) => p.id === id)));
  const posts = useDb((s) => s.posts);
  const adminEmail = useDb((s) => s.settings.adminEmail);
  const upsertPost = useDb((s) => s.upsertPost);
  const deletePost = useDb((s) => s.deletePost);

  const { draft, setDraft, patch, dirty, reset } = useDraft<Post>(source, blankPost);
  const [slugAuto, setSlugAuto] = useState(isNew);
  const [showErrors, setShowErrors] = useState(false);
  const allowNav = useUnsavedGuard(dirty);

  const slugTaken = useMemo(() => !!draft.slug && posts.some((p) => p.id !== draft.id && p.slug === draft.slug), [posts, draft.slug, draft.id]);
  const errors = {
    title: !draft.title.me.trim() ? te('titleRequired') : undefined,
    slug: !draft.slug.trim() ? te('slugRequired') : slugTaken ? te('slugTaken') : undefined,
  };

  /** Topics already used by other articles — one-click reuse keeps tags consistent. */
  const knownTags = useMemo(() => {
    const seen = new Map<string, L10n>();
    posts.forEach((p) => p.tag.me.trim() && !seen.has(p.tag.me.trim().toLowerCase()) && seen.set(p.tag.me.trim().toLowerCase(), p.tag));
    return [...seen.values()];
  }, [posts]);

  const suggestedMinutes = readMinutesFor(draft.body.me);
  const setTitle = (title: L10n) => patch(slugAuto ? { title, slug: slugify(title.me) } : { title });

  const save = () => {
    if (!dirty && !isNew) return;
    const clean: Post = { ...draft, slug: slugify(draft.slug), readMinutes: Math.max(1, Math.round(draft.readMinutes || 1)) };
    if (!clean.title.me.trim() || !clean.slug || slugTaken) {
      setShowErrors(true);
      toast.error(te('fixErrors'));
      return;
    }
    upsertPost(clean);
    setDraft(clean);
    toast.success(isNew ? t('created') : t('saved'));
    if (isNew) {
      allowNav();
      navigate(`/admin/savjeti/${clean.id}`, { replace: true });
    }
  };
  useSaveShortcut(save);

  const remove = async () => {
    const name = l(draft.title) || draft.slug;
    const ok = await confirmDialog({ title: t('deleteTitle', { name }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true });
    if (!ok) return;
    deletePost(draft.id);
    toast.success(te('deletedToast', { name }));
    allowNav();
    navigate('/admin/savjeti');
  };

  if (!isNew && !source) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion className="h-6 w-6" />}
          title={te('notFound')}
          text={te('notFoundText')}
          action={
            <ButtonLink to="/admin/savjeti" variant="dark" shape="rounded" size="sm">
              {te('backToList')}
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  const url = `/savjeti/${draft.slug || '…'}`;
  const day = draft.publishedAt.slice(0, 10);

  return (
    <div className="pb-24">
      <PageHeader
        back="/admin/savjeti"
        title={l(draft.title) || t('newPost')}
        badge={
          isNew ? (
            <Badge tone="sand">{te('newBadge')}</Badge>
          ) : draft.published ? (
            <Badge tone="green" dot>
              {ta('published')}
            </Badge>
          ) : (
            <Badge tone="amber" dot>
              {ta('draft')}
            </Badge>
          )
        }
        description={
          isNew ? (
            t('newPostText')
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[12.5px] text-ink-soft">{url}</span>
              <span className="text-ink/20">•</span>
              <span>{t('published_on', { date: date(source!.publishedAt, lang) })}</span>
              <span className="text-ink/20">•</span>
              <span>{timeAgo(source!.publishedAt, lang)}</span>
            </span>
          )
        }
        actions={<EditorActions href={url} isNew={isNew} dirty={dirty} onSave={save} onDelete={remove} saveLabel={isNew ? ta('create') : ta('save')} keyLabel={keyLabel} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title={te('basics')} bodyClassName="space-y-5">
          <div>
            <L10nInput label={t('title')} value={draft.title} onChange={setTitle} placeholder={t('titlePh')} required />
            {showErrors && errors.title && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>}
          </div>
          <SlugField
            prefix="/savjeti/"
            value={draft.slug}
            onChange={(slug) => {
              setSlugAuto(false);
              patch({ slug });
            }}
            onBlur={() => patch({ slug: slugify(draft.slug) })}
            auto={slugAuto}
            canRegenerate={!!draft.title.me.trim() && draft.slug !== slugify(draft.title.me)}
            onRegenerate={() => {
              setSlugAuto(true);
              patch({ slug: slugify(draft.title.me) });
            }}
            error={slugTaken || showErrors ? errors.slug : undefined}
          />
          <L10nInput label={t('excerpt')} value={draft.excerpt} onChange={(excerpt) => patch({ excerpt })} multiline rows={3} hint={t('excerptHint')} />
          <div>
            <L10nInput label={t('tag')} value={draft.tag} onChange={(tag) => patch({ tag })} />
            {knownTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-xs text-muted">{t('quickPick')}</span>
                {knownTags.map((tag) => {
                  const on = tag.me === draft.tag.me;
                  return (
                    <button
                      key={tag.me}
                      type="button"
                      onClick={() => patch({ tag: { ...tag } })}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors',
                        on ? 'bg-ink text-paper' : 'bg-canvas text-ink-soft ring-1 ring-line hover:text-ink hover:ring-ink/25',
                      )}
                    >
                      {lt(tag, lang)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <SearchPreview
            className="border-t border-line/70 pt-5"
            domain={adminEmail.split('@')[1] || 'selca.me'}
            path={['savjeti', draft.slug]}
            title={`${l(draft.title) || t('newPost')} | SELCA COMPANY`}
            description={l(draft.excerpt)}
          />
        </Card>

        <div className="space-y-6">
          <Card title={te('publishing')} bodyClassName="space-y-4">
            <SwitchRow icon={<Globe className="h-4 w-4" />} label={t('published')} hint={t('publishedHint')} checked={draft.published} onChange={(published) => patch({ published })} />
            {!draft.published && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-800 ring-1 ring-amber-600/15">{t('draftNote')}</p>}
            <div className="grid grid-cols-2 gap-3 border-t border-line/70 pt-4">
              <TextField
                wrapClassName="col-span-2"
                label={t('publishedAt')}
                type="date"
                value={day}
                leading={<CalendarDays className="h-4 w-4" />}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const time = draft.publishedAt.slice(10) || 'T09:00:00.000Z';
                  patch({ publishedAt: `${v}${time}` });
                }}
              />
              <TextField wrapClassName="col-span-2" label={t('author')} value={draft.author} leading={<UserRound className="h-4 w-4" />} onChange={(e) => patch({ author: e.target.value })} />
              <TextField
                wrapClassName="col-span-2"
                label={t('readMinutes')}
                type="number"
                min={1}
                max={60}
                value={draft.readMinutes || ''}
                leading={<Clock3 className="h-4 w-4" />}
                onChange={(e) => patch({ readMinutes: Number(e.target.value) })}
                trailing={
                  <span className="flex items-stretch">
                    <span className="flex items-center pr-3 text-[13px] text-muted">{t('min')}</span>
                    <button
                      type="button"
                      onClick={() => patch({ readMinutes: suggestedMinutes })}
                      title={t('auto', { n: suggestedMinutes })}
                      aria-label={t('auto', { n: suggestedMinutes })}
                      className="grid w-10 place-items-center border-l border-line text-muted transition hover:bg-canvas hover:text-brand-700"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                }
              />
            </div>
            <div className="border-t border-line/70 pt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{te('translations')}</div>
              <TranslationStatus
                fields={[
                  { label: t('fieldTitle'), value: draft.title },
                  { label: t('fieldExcerpt'), value: draft.excerpt },
                  { label: t('fieldBody'), value: draft.body },
                  { label: t('fieldTag'), value: draft.tag },
                ]}
              />
            </div>
          </Card>

          <Card title={t('cover')}>
            <ImageField value={draft.cover} onChange={(cover) => patch({ cover })} aspect="aspect-[16/10]" hint={t('coverHint')} />
          </Card>
        </div>
      </div>

      <MarkdownEditor
        className="mt-6"
        title={t('body')}
        value={draft.body}
        onChange={(body) => patch({ body })}
        rows={16}
        previewHeader={(lng) => {
          const title = lt(draft.title, lng);
          const excerpt = lt(draft.excerpt, lng);
          const tag = lt(draft.tag, lng);
          return (
            <div className="mb-6">
              {draft.cover && (
                <div className="mb-5 aspect-[16/9] overflow-hidden rounded-2xl bg-sand">
                  <img src={thumb(draft.cover)} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                {tag && <span className="eyebrow">{tag}</span>}
                <span>{date(draft.publishedAt, lng)}</span>
                <span>·</span>
                <span>{draft.author}</span>
                <span>·</span>
                <span>{interpolate(T[lng].readMeta, { n: draft.readMinutes || 1 })}</span>
              </div>
              {title && <h1 className="display mt-2 text-[2rem] leading-[1.1] text-ink sm:text-[2.3rem]">{title}</h1>}
              {excerpt && <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{excerpt}</p>}
              <div className="mt-6 h-px bg-line" />
            </div>
          );
        }}
      />

      <SaveBar dirty={dirty} onSave={save} onDiscard={reset} />
    </div>
  );
}
