import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Euro, Percent, Shuffle, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { FieldError, Hint, Input, Label, Switch } from '@/components/ui/Field';
import { defineDict, useDict, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useDb } from '@/store/db';
import { date, money } from '@/lib/format';
import type { Coupon } from '@/lib/types';
import { cn, uid } from '@/lib/utils';

export const COUPON_T = defineDict({
  me: {
    newTitle: 'Novi kupon',
    editTitle: 'Uredi kupon',
    newText: 'Kod za popust koji kupci unose u korpi.',
    code: 'Kod kupona',
    codeHint: 'Samo velika slova, brojevi i crtica — npr. PROLJECE15.',
    generate: 'Generiši',
    type: 'Vrsta popusta',
    percent: 'Procenat',
    percentText: 'npr. 10% od iznosa',
    fixed: 'Fiksni iznos',
    fixedText: 'npr. 25 € popusta',
    value: 'Vrijednost',
    minTotal: 'Minimalni iznos korpe',
    minTotalHint: 'Ostavite prazno ako nema minimuma.',
    expires: 'Važi do',
    expiresHint: 'Bez datuma kupon važi neograničeno.',
    description: 'Interna napomena',
    descriptionPh: 'npr. Jesenja akcija za Instagram pratioce',
    active: 'Aktivan',
    activeText: 'Kupci mogu odmah da ga koriste.',
    summary: 'Pregled',
    sumPercent: 'Kupac dobija {v}% popusta',
    sumFixed: 'Kupac dobija {v} popusta',
    sumMin: 'na korpu od {min} i više',
    sumAny: 'na svaku narudžbu',
    sumUntil: 'do {date}',
    sumInactive: 'Kupon je trenutno isključen.',
    errCode: 'Kod mora imati 3–20 znakova (A–Z, 0–9, -).',
    errCodeTaken: 'Kupon sa ovim kodom već postoji.',
    errValue: 'Unesite vrijednost veću od nule.',
    errPercent: 'Procenat ne može biti veći od 100.',
    errMin: 'Iznos ne može biti negativan.',
    saved: 'Kupon je sačuvan',
    created: 'Kupon {code} je kreiran',
  },
  sq: {
    newTitle: 'Kupon i ri',
    editTitle: 'Ndrysho kuponin',
    newText: 'Kod zbritjeje që klientët e shkruajnë në shportë.',
    code: 'Kodi i kuponit',
    codeHint: 'Vetëm shkronja të mëdha, numra dhe vizë — p.sh. PRANVERA15.',
    generate: 'Gjenero',
    type: 'Lloji i zbritjes',
    percent: 'Përqindje',
    percentText: 'p.sh. 10% e shumës',
    fixed: 'Shumë fikse',
    fixedText: 'p.sh. 25 € zbritje',
    value: 'Vlera',
    minTotal: 'Shuma minimale e shportës',
    minTotalHint: 'Lëreni bosh nëse nuk ka minimum.',
    expires: 'Vlen deri më',
    expiresHint: 'Pa datë kuponi vlen pa afat.',
    description: 'Shënim i brendshëm',
    descriptionPh: 'p.sh. Aksion vjeshte për ndjekësit në Instagram',
    active: 'Aktiv',
    activeText: 'Klientët mund ta përdorin menjëherë.',
    summary: 'Përmbledhje',
    sumPercent: 'Klienti merr {v}% zbritje',
    sumFixed: 'Klienti merr {v} zbritje',
    sumMin: 'për shportë nga {min} e lart',
    sumAny: 'për çdo porosi',
    sumUntil: 'deri më {date}',
    sumInactive: 'Kuponi aktualisht është i çaktivizuar.',
    errCode: 'Kodi duhet të ketë 3–20 shenja (A–Z, 0–9, -).',
    errCodeTaken: 'Ekziston tashmë një kupon me këtë kod.',
    errValue: 'Shkruani një vlerë më të madhe se zero.',
    errPercent: 'Përqindja nuk mund të jetë më e madhe se 100.',
    errMin: 'Shuma nuk mund të jetë negative.',
    saved: 'Kuponi u ruajt',
    created: 'Kuponi {code} u krijua',
  },
  en: {
    newTitle: 'New coupon',
    editTitle: 'Edit coupon',
    newText: 'A discount code shoppers enter in the cart.',
    code: 'Coupon code',
    codeHint: 'Capital letters, digits and dashes only — e.g. SPRING15.',
    generate: 'Generate',
    type: 'Discount type',
    percent: 'Percentage',
    percentText: 'e.g. 10% off the total',
    fixed: 'Fixed amount',
    fixedText: 'e.g. €25 off',
    value: 'Value',
    minTotal: 'Minimum cart total',
    minTotalHint: 'Leave empty for no minimum.',
    expires: 'Valid until',
    expiresHint: 'Without a date the coupon never expires.',
    description: 'Internal note',
    descriptionPh: 'e.g. Autumn campaign for Instagram followers',
    active: 'Active',
    activeText: 'Shoppers can use it right away.',
    summary: 'Summary',
    sumPercent: 'Shoppers get {v}% off',
    sumFixed: 'Shoppers get {v} off',
    sumMin: 'on carts of {min} or more',
    sumAny: 'on every order',
    sumUntil: 'until {date}',
    sumInactive: 'The coupon is currently switched off.',
    errCode: 'The code needs 3–20 characters (A–Z, 0–9, -).',
    errCodeTaken: 'A coupon with this code already exists.',
    errValue: 'Enter a value greater than zero.',
    errPercent: 'A percentage cannot exceed 100.',
    errMin: 'The amount cannot be negative.',
    saved: 'Coupon saved',
    created: 'Coupon {code} created',
  },
});

const CODE_RE = /^[A-Z0-9-]{3,20}$/;
const toNum = (s: string) => Number(s.replace(',', '.'));

/** ISO → yyyy-mm-dd in local time (for <input type="date">) */
function toDateInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** yyyy-mm-dd → ISO at the end of that local day */
function fromDateInput(v: string) {
  if (!v) return undefined;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}

function randomCode() {
  const words = ['SELCA', 'DOM', 'JESEN', 'ZIMA', 'PROLJECE', 'LJETO', 'VRATA', 'PODOVI'];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}${Math.floor(10 + Math.random() * 40)}`;
}

/** Create / edit a coupon. Mount with a fresh `key` each time it opens. */
export function CouponEditor({ open, coupon, onClose }: { open: boolean; coupon: Coupon | null; onClose: () => void }) {
  const t = useDict(COUPON_T, 'admin');
  const ta = useDict(adm, 'admin');
  const lang = useLang('admin');
  const coupons = useDb((s) => s.coupons);
  const upsertCoupon = useDb((s) => s.upsertCoupon);
  const codeId = useId();
  const isNew = !coupon;

  const [code, setCode] = useState(coupon?.code ?? '');
  const [type, setType] = useState<Coupon['type']>(coupon?.type ?? 'percent');
  const [value, setValue] = useState(coupon ? String(coupon.value) : '10');
  const [minTotal, setMinTotal] = useState(coupon?.minTotal ? String(coupon.minTotal) : '');
  const [expires, setExpires] = useState(toDateInput(coupon?.expiresAt));
  const [description, setDescription] = useState(coupon?.description ?? '');
  const [active, setActive] = useState(coupon?.active ?? true);
  const [touched, setTouched] = useState(false);

  const v = toNum(value);
  const min = minTotal.trim() ? toNum(minTotal) : 0;
  const errors = {
    code: !CODE_RE.test(code) ? t('errCode') : coupons.some((c) => c.id !== coupon?.id && c.code === code) ? t('errCodeTaken') : undefined,
    value: !(v > 0) ? t('errValue') : type === 'percent' && v > 100 ? t('errPercent') : undefined,
    min: Number.isNaN(min) || min < 0 ? t('errMin') : undefined,
  };

  const save = () => {
    setTouched(true);
    if (errors.code || errors.value || errors.min) return;
    upsertCoupon({
      id: coupon?.id ?? uid('cp'),
      code,
      type,
      value: v,
      minTotal: min > 0 ? min : undefined,
      expiresAt: fromDateInput(expires),
      description: description.trim() || undefined,
      active,
      uses: coupon?.uses ?? 0,
    });
    toast.success(isNew ? t('created', { code }) : t('saved'));
    onClose();
  };

  const valueOk = v > 0 && !(type === 'percent' && v > 100);
  const summary = valueOk
    ? [
        type === 'percent' ? t('sumPercent', { v: String(v).replace('.', lang === 'en' ? '.' : ',') }) : t('sumFixed', { v: money(v, lang) }),
        min > 0 ? t('sumMin', { min: money(min, lang, { decimals: min % 1 !== 0 }) }) : t('sumAny'),
        expires ? t('sumUntil', { date: date(fromDateInput(expires)!, lang, { day: 'numeric', month: 'long', year: 'numeric' }) }) : '',
      ]
        .filter(Boolean)
        .join(' ') + '.'
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isNew ? t('newTitle') : t('editTitle')}
      description={t('newText')}
      footer={
        <>
          <Button variant="outline" shape="rounded" size="sm" onClick={onClose}>
            {ta('cancel')}
          </Button>
          <Button shape="rounded" size="sm" onClick={save}>
            {isNew ? ta('create') : ta('save')}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {/* Code */}
        <div>
          <Label htmlFor={codeId} required>
            {t('code')}
          </Label>
          <div className="flex gap-2">
            <input
              id={codeId}
              value={code}
              autoFocus={isNew}
              maxLength={20}
              spellCheck={false}
              autoComplete="off"
              placeholder="SELCA15"
              aria-invalid={(touched && !!errors.code) || undefined}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''))}
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 font-mono text-[16px] font-bold tracking-[0.14em] text-ink outline-none transition placeholder:font-normal placeholder:text-muted/50 focus:border-ink/40 focus:ring-4 focus:ring-ink/5 aria-[invalid=true]:border-red-500"
            />
            <Button variant="outline" shape="rounded" className="h-11" icon={<Shuffle className="h-4 w-4" />} onClick={() => setCode(randomCode())}>
              {t('generate')}
            </Button>
          </div>
          {touched && errors.code ? <FieldError>{errors.code}</FieldError> : <Hint>{t('codeHint')}</Hint>}
        </div>

        {/* Type */}
        <div>
          <Label>{t('type')}</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { id: 'percent', icon: Percent, title: t('percent'), text: t('percentText') },
                { id: 'fixed', icon: Euro, title: t('fixed'), text: t('fixedText') },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={type === o.id}
                onClick={() => setType(o.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition-all',
                  type === o.id ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-ink/30',
                )}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors', type === o.id ? 'bg-ink text-paper' : 'bg-canvas text-ink-soft')}>
                  <o.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{o.title}</span>
                  <span className="block truncate text-xs text-muted">{o.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('value')}
            required
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ''))}
            trailing={<span className="font-semibold text-ink-soft">{type === 'percent' ? '%' : '€'}</span>}
            error={touched ? errors.value : undefined}
          />
          <Input
            label={t('minTotal')}
            inputMode="decimal"
            value={minTotal}
            placeholder="0"
            onChange={(e) => setMinTotal(e.target.value.replace(/[^\d.,]/g, ''))}
            trailing={<span className="font-semibold text-ink-soft">€</span>}
            error={touched ? errors.min : undefined}
            hint={t('minTotalHint')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('expires')} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} hint={t('expiresHint')} />
          <div>
            <Label>{t('active')}</Label>
            <div className={cn('flex h-11 items-center justify-between gap-3 rounded-xl border px-3.5 transition-colors', active ? 'border-emerald-600/25 bg-emerald-50/60' : 'border-line bg-white')}>
              <span className="truncate text-[13px] text-ink-soft">{active ? t('activeText') : t('sumInactive')}</span>
              <Switch size="sm" checked={active} onChange={setActive} />
            </div>
          </div>
        </div>

        <Input label={t('description')} value={description} placeholder={t('descriptionPh')} onChange={(e) => setDescription(e.target.value)} maxLength={120} />

        {summary && (
          <div className="flex gap-3 rounded-xl bg-brand-50/70 p-3.5 ring-1 ring-brand-100">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-[13px] leading-relaxed text-ink-soft">
              <span className="font-bold text-ink">{t('summary')}:</span> {summary}
            </p>
          </div>
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
