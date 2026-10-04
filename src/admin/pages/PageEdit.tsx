import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { FileQuestion, Globe, PanelBottom } from 'lucide-react';
import { PageHeader, Card, SaveBar, confirmDialog } from '@/admin/components/kit';
import { L10nInput } from '@/admin/components/L10nInput';
import { MarkdownEditor } from '@/admin/components/editorial/MarkdownEditor';
import { EditorActions, SearchPreview, SlugField, SwitchRow, TranslationStatus, mdSummary } from '@/admin/components/editorial/fields';
import { useDraft, useSaveKeyLabel, useSaveShortcut, useUnsavedGuard } from '@/admin/components/editorial/hooks';
import { ed } from '@/admin/components/editorial/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { defineDict, useDict, useL, useLang, emptyL10n } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import type { CmsPage } from '@/lib/types';
import { date, timeAgo } from '@/lib/format';
import { slugify, uid } from '@/lib/utils';

const T = defineDict({
  me: {
    newPage: 'Nova stranica',
    newPageText: 'Informativna stranica — dostava, uslovi, reklamacije, privatnost…',
    title: 'Naslov stranice',
    titlePh: 'npr. Dostava i ugradnja',
    body: 'Tekst stranice',
    published: 'Objavljena',
    publishedHint: 'Vidljiva posjetiocima na sajtu.',
    footer: 'Prikaži u podnožju',
    footerHint: 'Link se dodaje u podnožje sajta.',
    saved: 'Stranica je sačuvana',
    created: 'Stranica je kreirana',
    deleteTitle: 'Obrisati stranicu „{name}“?',
    deleteText: 'Stranica i svi njeni prevodi biće trajno uklonjeni, a link iz podnožja nestaje.',
    pageUrl: 'Adresa na sajtu',
    lastUpdate: 'Posljednja izmjena',
    fieldTitle: 'Naslov',
    fieldBody: 'Tekst',
    draftNote: 'Nacrt nije vidljiv na sajtu dok ga ne objavite.',
  },
  sq: {
    newPage: 'Faqe e re',
    newPageText: 'Faqe informative — dërgesa, kushtet, reklamacionet, privatësia…',
    title: 'Titulli i faqes',
    titlePh: 'p.sh. Dërgesa dhe montimi',
    body: 'Teksti i faqes',
    published: 'E publikuar',
    publishedHint: 'E dukshme për vizitorët në faqe.',
    footer: 'Shfaq në fund të faqes',
    footerHint: 'Lidhja shtohet në fund të faqes (footer).',
    saved: 'Faqja u ruajt',
    created: 'Faqja u krijua',
    deleteTitle: 'Të fshihet faqja „{name}“?',
    deleteText: 'Faqja dhe të gjitha përkthimet do të hiqen përgjithmonë, bashkë me lidhjen në footer.',
    pageUrl: 'Adresa në faqe',
    lastUpdate: 'Ndryshimi i fundit',
    fieldTitle: 'Titulli',
    fieldBody: 'Teksti',
    draftNote: 'Drafti nuk shihet në faqe derisa ta publikoni.',
  },
  en: {
    newPage: 'New page',
    newPageText: 'Information page — delivery, terms, returns, privacy…',
    title: 'Page title',
    titlePh: 'e.g. Delivery & installation',
    body: 'Page text',
    published: 'Published',
    publishedHint: 'Visible to visitors on the site.',
    footer: 'Show in footer',
    footerHint: 'A link is added to the site footer.',
    saved: 'Page saved',
    created: 'Page created',
    deleteTitle: 'Delete the page “{name}”?',
    deleteText: 'The page and all its translations will be removed permanently, along with its footer link.',
    pageUrl: 'Address on site',
    lastUpdate: 'Last change',
    fieldTitle: 'Title',
    fieldBody: 'Text',
    draftNote: 'A draft is not visible on the site until you publish it.',
  },
});

const blankPage = (): CmsPage => ({
  id: uid('pg'),
  slug: '',
  title: emptyL10n(),
  body: emptyL10n(),
  published: false,
  showInFooter: false,
  updatedAt: new Date().toISOString(),
});

export default function PageEdit() {
  const { id = 'novi' } = useParams();
  return <PageEditor key={id} id={id} />;
}

function PageEditor({ id }: { id: string }) {
  const t = useDict(T, 'admin');
  const te = useDict(ed, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  const lang = useLang('admin');
  const navigate = useNavigate();
  const keyLabel = useSaveKeyLabel();

  const isNew = id === 'novi';
  const source = useDb((s) => (isNew ? undefined : s.pages.find((p) => p.id === id)));
  const pages = useDb((s) => s.pages);
  const adminEmail = useDb((s) => s.settings.adminEmail);
  const upsertPage = useDb((s) => s.upsertPage);
  const deletePage = useDb((s) => s.deletePage);

  const { draft, setDraft, patch, dirty, reset } = useDraft<CmsPage>(source, blankPage);
  const [slugAuto, setSlugAuto] = useState(isNew);
  const [showErrors, setShowErrors] = useState(false);
  const allowNav = useUnsavedGuard(dirty);

  const slugTaken = useMemo(() => !!draft.slug && pages.some((p) => p.id !== draft.id && p.slug === draft.slug), [pages, draft.slug, draft.id]);
  const errors = {
    title: !draft.title.me.trim() ? te('titleRequired') : undefined,
    slug: !draft.slug.trim() ? te('slugRequired') : slugTaken ? te('slugTaken') : undefined,
  };

  const setTitle = (title: CmsPage['title']) => patch(slugAuto ? { title, slug: slugify(title.me) } : { title });

  const save = () => {
    if (!dirty && !isNew) return;
    const clean = { ...draft, slug: slugify(draft.slug) };
    if (!clean.title.me.trim() || !clean.slug || slugTaken) {
      setShowErrors(true);
      toast.error(te('fixErrors'));
      return;
    }
    upsertPage(clean);
    const saved = useDb.getState().pages.find((p) => p.id === clean.id) ?? clean;
    setDraft(saved);
    toast.success(isNew ? t('created') : t('saved'));
    if (isNew) {
      allowNav();
      navigate(`/admin/stranice/${saved.id}`, { replace: true });
    }
  };
  useSaveShortcut(save);

  const remove = async () => {
    const name = l(draft.title) || draft.slug;
    const ok = await confirmDialog({ title: t('deleteTitle', { name }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true });
    if (!ok) return;
    deletePage(draft.id);
    toast.success(te('deletedToast', { name }));
    allowNav();
    navigate('/admin/stranice');
  };

  if (!isNew && !source) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion className="h-6 w-6" />}
          title={te('notFound')}
          text={te('notFoundText')}
          action={
            <ButtonLink to="/admin/stranice" variant="dark" shape="rounded" size="sm">
              {te('backToList')}
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  const url = `/stranica/${draft.slug || '…'}`;

  return (
    <div className="pb-24">
      <PageHeader
        back="/admin/stranice"
        title={l(draft.title) || t('newPage')}
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
            t('newPageText')
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[12.5px] text-ink-soft">{url}</span>
              <span className="text-line">•</span>
              <span>{te('updatedAgo', { ago: timeAgo(source!.updatedAt, lang) })}</span>
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
            prefix="/stranica/"
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
          <SearchPreview
            className="border-t border-line/70 pt-5"
            domain={adminEmail.split('@')[1] || 'selca.me'}
            path={['stranica', draft.slug]}
            title={`${l(draft.title) || t('newPage')} | SELCA COMPANY`}
            description={mdSummary(l(draft.body))}
          />
        </Card>

        <Card title={te('publishing')} bodyClassName="space-y-4">
          <SwitchRow icon={<Globe className="h-4 w-4" />} label={t('published')} hint={t('publishedHint')} checked={draft.published} onChange={(published) => patch({ published })} />
          <SwitchRow icon={<PanelBottom className="h-4 w-4" />} label={t('footer')} hint={t('footerHint')} checked={draft.showInFooter} onChange={(showInFooter) => patch({ showInFooter })} />
          {!draft.published && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-800 ring-1 ring-amber-600/15">{t('draftNote')}</p>}
          <div className="border-t border-line/70 pt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{te('translations')}</div>
            <TranslationStatus
              fields={[
                { label: t('fieldTitle'), value: draft.title },
                { label: t('fieldBody'), value: draft.body },
              ]}
            />
          </div>
          <div className="flex items-center justify-between border-t border-line/70 pt-3 text-[12.5px]">
            <span className="text-muted">{t('lastUpdate')}</span>
            <span className="font-semibold text-ink">{isNew ? te('neverSaved') : date(source!.updatedAt, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </Card>
      </div>

      <MarkdownEditor
        className="mt-6"
        title={t('body')}
        value={draft.body}
        onChange={(body) => patch({ body })}
        rows={16}
        previewHeader={(lng) => {
          const title = draft.title[lng]?.trim() || draft.title.me;
          return title ? <h1 className="display mb-2 text-[2rem] leading-tight text-ink sm:text-[2.4rem]">{title}</h1> : null;
        }}
      />

      <SaveBar dirty={dirty} onSave={save} onDiscard={reset} />
    </div>
  );
}

