import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Hammer, ImageOff, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { PageHeader, FilterPills, SearchInput, confirmDialog } from '@/admin/components/kit';
import { L10nInput } from '@/admin/components/L10nInput';
import { ImageField } from '@/admin/components/media';
import { SwitchRow, TextField } from '@/admin/components/editorial/fields';
import { TagsEditor } from '@/admin/components/editorial/TagsEditor';
import { ed } from '@/admin/components/editorial/i18n';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { EmptyState, Img } from '@/components/ui/misc';
import { defineDict, useDict, useL, emptyL10n } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { allCities } from '@/lib/pricing';
import type { L10n, Project } from '@/lib/types';
import { fold } from '@/lib/search';
import { cn, uid } from '@/lib/utils';

const T = defineDict({
  me: {
    title: 'Realizacije',
    description: 'Portfolio završenih projekata. Izdvojeni (★) se prikazuju na početnoj stranici, svi na stranici „Projekti“.',
    newProject: 'Novi projekat',
    featured: 'Izdvojeni',
    featuredBadge: 'Na početnoj',
    featureAdd: 'Izdvoji na početnoj',
    featureRemove: 'Ukloni sa početne',
    nowFeatured: 'Projekat je izdvojen na početnoj',
    nowUnfeatured: 'Projekat više nije na početnoj',
    searchPh: 'Pretraži po nazivu ili gradu…',
    empty: 'Još nema realizacija',
    emptyText: 'Dodajte prvi završeni projekat sa fotografijom — to je najbolja preporuka za nove kupce.',
    noMatch: 'Nijedan projekat ne odgovara filteru.',
    addCard: 'Dodaj realizaciju',
    addCardText: 'Fotografija, lokacija i kratak opis',
    editTitle: 'Uredi projekat',
    newTitle: 'Novi projekat',
    modalText: 'Prikazuje se u portfoliju na sajtu, na sva tri jezika.',
    fTitle: 'Naziv projekta',
    fTitlePh: 'npr. Vila sa bazenom — ALU stolarija',
    fSummary: 'Kratak opis',
    fSummaryHint: 'Jedna do dvije rečenice — šta je urađeno i od kojih materijala.',
    fLocation: 'Lokacija',
    fLocationPh: 'npr. Budva',
    fYear: 'Godina',
    fImage: 'Fotografija',
    fImageHint: 'Najbolje pejzažna fotografija, najmanje 1200 px širine.',
    fFeatured: 'Izdvoji na početnoj',
    fFeaturedHint: 'Prikazuje se u sekciji „Realizacije“ na početnoj.',
    saved: 'Projekat je sačuvan',
    created: 'Projekat je dodat u portfolio',
    deleteTitle: 'Obrisati projekat „{name}“?',
    deleteText: 'Projekat će biti uklonjen iz portfolija na sajtu.',
    locationRequired: 'Unesite lokaciju.',
    yearInvalid: 'Unesite ispravnu godinu.',
    imageRequired: 'Izaberite fotografiju.',
    homeCount: '{n} na početnoj',
  },
  sq: {
    title: 'Realizimet',
    description: 'Portofoli i projekteve të përfunduara. Të veçuarit (★) shfaqen në faqen kryesore, të gjithë në faqen „Projektet“.',
    newProject: 'Projekt i ri',
    featured: 'Të veçuar',
    featuredBadge: 'Në ballinë',
    featureAdd: 'Veço në faqen kryesore',
    featureRemove: 'Hiq nga faqja kryesore',
    nowFeatured: 'Projekti u veçua në faqen kryesore',
    nowUnfeatured: 'Projekti nuk është më në faqen kryesore',
    searchPh: 'Kërko sipas emrit ose qytetit…',
    empty: 'Ende nuk ka realizime',
    emptyText: 'Shtoni projektin e parë të përfunduar me foto — është rekomandimi më i mirë për klientët e rinj.',
    noMatch: 'Asnjë projekt nuk përputhet me filtrin.',
    addCard: 'Shto realizim',
    addCardText: 'Foto, vendndodhja dhe përshkrim i shkurtër',
    editTitle: 'Ndrysho projektin',
    newTitle: 'Projekt i ri',
    modalText: 'Shfaqet në portofolin e faqes, në të tri gjuhët.',
    fTitle: 'Emri i projektit',
    fTitlePh: 'p.sh. Vilë me pishinë — dogramë alumini',
    fSummary: 'Përshkrim i shkurtër',
    fSummaryHint: 'Një deri në dy fjali — çfarë u bë dhe me cilat materiale.',
    fLocation: 'Vendndodhja',
    fLocationPh: 'p.sh. Ulqin',
    fYear: 'Viti',
    fImage: 'Fotografia',
    fImageHint: 'Më mirë foto horizontale, të paktën 1200 px e gjerë.',
    fFeatured: 'Veço në faqen kryesore',
    fFeaturedHint: 'Shfaqet në seksionin „Realizimet“ në faqen kryesore.',
    saved: 'Projekti u ruajt',
    created: 'Projekti u shtua në portofol',
    deleteTitle: 'Të fshihet projekti „{name}“?',
    deleteText: 'Projekti do të hiqet nga portofoli në faqe.',
    locationRequired: 'Shkruani vendndodhjen.',
    yearInvalid: 'Shkruani një vit të saktë.',
    imageRequired: 'Zgjidhni një fotografi.',
    homeCount: '{n} në ballinë',
  },
  en: {
    title: 'Projects',
    description: 'Portfolio of completed projects. Featured ones (★) appear on the homepage, all of them on the “Projects” page.',
    newProject: 'New project',
    featured: 'Featured',
    featuredBadge: 'On homepage',
    featureAdd: 'Feature on homepage',
    featureRemove: 'Remove from homepage',
    nowFeatured: 'Project featured on the homepage',
    nowUnfeatured: 'Project removed from the homepage',
    searchPh: 'Search by name or city…',
    empty: 'No projects yet',
    emptyText: 'Add your first completed project with a photo — it is the best recommendation for new customers.',
    noMatch: 'No project matches the filter.',
    addCard: 'Add a project',
    addCardText: 'Photo, location and a short description',
    editTitle: 'Edit project',
    newTitle: 'New project',
    modalText: 'Shown in the portfolio on the site, in all three languages.',
    fTitle: 'Project name',
    fTitlePh: 'e.g. Villa with pool — aluminium glazing',
    fSummary: 'Short description',
    fSummaryHint: 'One or two sentences — what was done and with which materials.',
    fLocation: 'Location',
    fLocationPh: 'e.g. Budva',
    fYear: 'Year',
    fImage: 'Photo',
    fImageHint: 'Ideally a landscape photo, at least 1200 px wide.',
    fFeatured: 'Feature on homepage',
    fFeaturedHint: 'Shown in the “Projects” section on the homepage.',
    saved: 'Project saved',
    created: 'Project added to the portfolio',
    deleteTitle: 'Delete the project “{name}”?',
    deleteText: 'The project will be removed from the portfolio on the site.',
    locationRequired: 'Enter a location.',
    yearInvalid: 'Enter a valid year.',
    imageRequired: 'Choose a photo.',
    homeCount: '{n} on homepage',
  },
});

const blankProject = (): Project => ({
  id: uid('pr'),
  title: emptyL10n(),
  location: '',
  year: new Date().getFullYear(),
  tags: [],
  summary: emptyL10n(),
  image: '',
  featured: false,
});

const tagKey = (tag: L10n) => tag.me.trim().toLowerCase();

export default function ProjectsAdmin() {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const l = useL('admin');
  const projects = useDb((s) => s.projects);
  const upsertProject = useDb((s) => s.upsertProject);
  const deleteProject = useDb((s) => s.deleteProject);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);

  /** Every tag used across the portfolio (deduplicated on the Montenegrin label). */
  const allTags = useMemo(() => {
    const map = new Map<string, { tag: L10n; count: number }>();
    projects.forEach((p) =>
      p.tags.forEach((tag) => {
        const k = tagKey(tag);
        if (!k) return;
        const cur = map.get(k);
        if (cur) cur.count++;
        else map.set(k, { tag, count: 1 });
      }),
    );
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [projects]);

  const featuredCount = useMemo(() => projects.filter((p) => p.featured).length, [projects]);

  const list = useMemo(() => {
    const needle = fold(q.trim());
    return [...projects]
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year)
      .filter((p) => {
        if (filter === 'featured' && !p.featured) return false;
        if (filter.startsWith('tag:') && !p.tags.some((tag) => tagKey(tag) === filter.slice(4))) return false;
        if (!needle) return true;
        return fold(`${p.title.me} ${p.title.sq} ${p.title.en} ${p.location} ${p.year}`).includes(needle);
      });
  }, [projects, q, filter]);

  const toggleFeatured = (p: Project) => {
    upsertProject({ ...p, featured: !p.featured });
    toast.success(!p.featured ? t('nowFeatured') : t('nowUnfeatured'), { description: l(p.title) });
  };

  const remove = async (p: Project) => {
    const name = l(p.title);
    if (!(await confirmDialog({ title: t('deleteTitle', { name }), text: t('deleteText'), confirmLabel: ta('delete'), danger: true }))) return false;
    deleteProject(p.id);
    toast.success(te('deletedToast', { name }));
    return true;
  };

  const openNew = () => {
    setIsNew(true);
    setEditing(blankProject());
  };
  const openEdit = (p: Project) => {
    setIsNew(false);
    setEditing(structuredClone(p));
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button shape="rounded" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            {t('newProject')}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          value={filter}
          onChange={setFilter}
          className="min-w-0"
          options={[
            { id: 'all', label: ta('all'), count: projects.length },
            {
              id: 'featured',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Star className={cn('h-3.5 w-3.5', filter === 'featured' ? 'fill-amber-300 text-amber-300' : 'fill-amber-400 text-amber-400')} />
                  {t('featured')}
                </span>
              ),
              count: featuredCount,
            },
            ...allTags.map(([k, { tag, count }]) => ({ id: `tag:${k}`, label: l(tag), count })),
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder={t('searchPh')} className="shrink-0 lg:w-72" />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-line/80 bg-white">
          <EmptyState
            icon={<Hammer className="h-6 w-6" />}
            title={t('empty')}
            text={t('emptyText')}
            action={
              <Button shape="rounded" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openNew}>
                {t('newProject')}
              </Button>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-line/80 bg-white">
          <EmptyState icon={<Hammer className="h-6 w-6" />} title={ta('noResults')} text={t('noMatch')} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} p={p} onEdit={() => openEdit(p)} onToggle={() => toggleFeatured(p)} onDelete={() => remove(p)} />
          ))}
          {filter === 'all' && !q && (
            <button
              type="button"
              onClick={openNew}
              className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white/40 p-6 text-center transition hover:border-brand-600/40 hover:bg-white"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line transition group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[14.5px] font-semibold text-ink">{t('addCard')}</span>
              <span className="text-[13px] text-muted">{t('addCardText')}</span>
            </button>
          )}
        </div>
      )}

      <ProjectModal
        project={editing}
        isNew={isNew}
        suggestions={allTags.map(([, v]) => v.tag)}
        onClose={() => setEditing(null)}
        onSave={(p) => {
          upsertProject(p);
          toast.success(isNew ? t('created') : t('saved'), { description: l(p.title) });
          setEditing(null);
        }}
        onDelete={async (p) => {
          if (await remove(p)) setEditing(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
function ProjectCard({ p, onEdit, onToggle, onDelete }: { p: Project; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const l = useL('admin');
  return (
    <article
      onClick={onEdit}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgb(28_26_23/0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgb(28_26_23/0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {p.image ? (
          <Img small src={p.image} alt={l(p.title)} className="h-full w-full object-cover duration-700 group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <ImageOff className="h-6 w-6" />
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={p.featured ? t('featureRemove') : t('featureAdd')}
          aria-label={p.featured ? t('featureRemove') : t('featureAdd')}
          aria-pressed={p.featured}
          className={cn(
            'absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-bold shadow-sm backdrop-blur transition',
            p.featured ? 'bg-white/95 text-amber-700 hover:bg-white' : 'w-8 justify-center bg-white/80 px-0 text-ink-soft hover:bg-white hover:text-amber-600',
          )}
        >
          <Star className={cn('h-4 w-4 transition-transform group-hover:scale-110', p.featured && 'fill-amber-400 text-amber-500')} />
          {p.featured && t('featuredBadge')}
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{p.year}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          {p.location} · {p.year}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[15.5px] font-bold leading-snug text-ink">{l(p.title)}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{l(p.summary)}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {p.tags.map((tag, i) => (
              <span key={i} className="rounded-full bg-sand px-2.5 py-0.5 text-[11.5px] font-semibold text-ink-soft">
                {l(tag)}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink" title={ta('edit')} aria-label={ta('edit')}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" title={ta('delete')} aria-label={ta('delete')}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit modal                                                 */
/* ------------------------------------------------------------------ */
function ProjectModal({
  project,
  isNew,
  suggestions,
  onClose,
  onSave,
  onDelete,
}: {
  project: Project | null;
  isNew: boolean;
  suggestions: L10n[];
  onClose: () => void;
  onSave: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  const t = useDict(T, 'admin');
  const ta = useDict(adm, 'admin');
  const te = useDict(ed, 'admin');
  const settings = useDb((s) => s.settings);
  const cityList = useMemo(() => allCities(settings), [settings]);
  const [draft, setDraft] = useState<Project | null>(project);
  const [showErrors, setShowErrors] = useState(false);
  const [prevProject, setPrevProject] = useState<Project | null>(project);

  // Reset local state whenever a different project is opened.
  // (Keeps the last project while the modal animates out.)
  if (project !== prevProject) {
    setPrevProject(project);
    if (project) {
      setDraft(project);
      setShowErrors(false);
    }
  }

  const d = draft ?? project;
  const patch = (p: Partial<Project>) => setDraft((cur) => (cur ? { ...cur, ...p } : cur));
  const currentYear = new Date().getFullYear();
  const errors = d
    ? {
        title: !d.title.me.trim() ? te('titleRequired') : undefined,
        location: !d.location.trim() ? t('locationRequired') : undefined,
        year: !d.year || d.year < 1990 || d.year > currentYear + 1 ? t('yearInvalid') : undefined,
        image: !d.image ? t('imageRequired') : undefined,
      }
    : {};
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = () => {
    if (!d) return;
    if (hasErrors) {
      setShowErrors(true);
      toast.error(te('fixErrors'));
      return;
    }
    onSave({ ...d, location: d.location.trim() });
  };

  return (
    <Modal
      open={!!project}
      onClose={onClose}
      size="lg"
      title={isNew ? t('newTitle') : t('editTitle')}
      description={t('modalText')}
      footer={
        d && (
          <>
            {!isNew && (
              <Button variant="ghost" shape="rounded" size="sm" className="mr-auto text-red-600 hover:bg-red-50" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(d)}>
                {ta('delete')}
              </Button>
            )}
            <Button variant="outline" shape="rounded" size="sm" onClick={onClose}>
              {ta('cancel')}
            </Button>
            <Button shape="rounded" size="sm" onClick={submit}>
              {isNew ? ta('create') : ta('save')}
            </Button>
          </>
        )
      }
    >
      {d && (
        <form
          className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_250px]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="min-w-0 space-y-5">
            <div>
              <L10nInput label={t('fTitle')} value={d.title} onChange={(title) => patch({ title })} placeholder={t('fTitlePh')} required />
              {showErrors && errors.title && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>}
            </div>
            <L10nInput label={t('fSummary')} value={d.summary} onChange={(summary) => patch({ summary })} multiline rows={3} hint={t('fSummaryHint')} />
            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
              <TextField
                label={t('fLocation')}
                required
                value={d.location}
                list="selca-cities"
                placeholder={t('fLocationPh')}
                leading={<MapPin className="h-4 w-4" />}
                onChange={(e) => patch({ location: e.target.value })}
                error={showErrors ? errors.location : undefined}
              />
              <TextField
                label={t('fYear')}
                required
                type="number"
                inputMode="numeric"
                min={1990}
                max={currentYear + 1}
                value={d.year || ''}
                onChange={(e) => patch({ year: Number(e.target.value) })}
                error={showErrors ? errors.year : undefined}
              />
              <datalist id="selca-cities">
                {cityList.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <TagsEditor value={d.tags} onChange={(tags) => patch({ tags })} suggestions={suggestions} />
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </div>

          <div className="space-y-5">
            <div>
              <ImageField label={<span>{t('fImage')} <span className="text-brand-600">*</span></span>} value={d.image} onChange={(image) => patch({ image })} aspect="aspect-[4/3]" hint={t('fImageHint')} />
              {showErrors && errors.image && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.image}</p>}
            </div>
            <div className="rounded-xl border border-line/80 bg-canvas/40 p-3.5">
              <SwitchRow icon={<Star className={cn('h-4 w-4', d.featured && 'fill-amber-400 text-amber-500')} />} label={t('fFeatured')} hint={t('fFeaturedHint')} checked={d.featured} onChange={(featured) => patch({ featured })} />
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
