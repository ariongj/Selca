import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useDb } from '@/store/db';
import { useCategories, useSettings } from '@/store/hooks';
import { allCities } from '@/lib/pricing';
import type { InquiryType } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Lead form used for "free measurement", "request a quote" and plain contact.
 * Submissions land in Admin → Upiti i mjerenja instantly.
 */
export function MeasureForm({
  type = 'measurement',
  productId,
  defaultService,
  defaultMessage,
  className,
  onDone,
}: {
  type?: InquiryType;
  productId?: string;
  defaultService?: string;
  defaultMessage?: string;
  className?: string;
  onDone?: () => void;
}) {
  const t = useDict(site);
  const l = useL();
  const cats = useCategories();
  const settings = useSettings();
  const addInquiry = useDb((s) => s.addInquiry);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', service: defaultService ?? '', date: '', message: defaultMessage ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ name: string; phone: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = t('f_required');
    if (!form.phone.trim()) err.phone = t('f_required');
    else if (form.phone.replace(/\D/g, '').length < 8) err.phone = t('f_invalidPhone');
    if (type === 'contact' && !form.message.trim()) err.message = t('f_required');
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));
    addInquiry({
      type,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      city: form.city || undefined,
      service: form.service || undefined,
      productId,
      message: form.message.trim() || '—',
      preferredDate: form.date || undefined,
    });
    setBusy(false);
    setSent({ name: form.name.trim().split(' ')[0], phone: form.phone.trim() });
    onDone?.();
  };

  if (sent) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center ring-1 ring-line sm:p-10', className)}>
        <span className="grid h-14 w-14 animate-pop place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="display mt-5 text-3xl">{t('f_successTitle', { name: sent.name })}</h3>
        <p className="mt-2 max-w-sm text-muted">{t('f_successText', { phone: sent.phone })}</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(null);
            setForm({ name: '', phone: '', email: '', city: '', service: defaultService ?? '', date: '', message: '' });
          }}
        >
          {t('f_newRequest')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={cn('rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8', className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('f_name')} required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input label={t('f_phone')} required type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+382 6_ ___ ___" autoComplete="tel" />
        {type === 'contact' ? (
          <Input label={t('f_email')} type="email" value={form.email} onChange={set('email')} wrapClassName="sm:col-span-2" autoComplete="email" />
        ) : (
          <>
            <Select label={t('f_city')} value={form.city} onChange={set('city')}>
              <option value="">{t('f_chooseCity')}</option>
              {allCities(settings).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {type === 'measurement' ? (
              <Input label={t('f_date')} type="date" min={today} value={form.date} onChange={set('date')} />
            ) : (
              <Input label={t('f_email')} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            )}
            {type === 'measurement' && (
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{t('f_service')}</span>
                <div className="flex flex-wrap gap-2">
                  {[...cats.map((c) => l(c.name)), t('f_other')].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, service: f.service === s ? '' : s }))}
                      className={cn(
                        'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                        form.service === s ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink-soft hover:border-ink/30',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <Textarea label={t('f_message')} rows={3} value={form.message} onChange={set('message')} placeholder={t('f_messagePh')} error={errors.message} wrapClassName="sm:col-span-2" />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted sm:max-w-[55%]">{t('f_privacy')}</p>
        <Button type="submit" size="lg" loading={busy} iconRight={<Send className="h-4 w-4" />}>
          {t('f_submit')}
        </Button>
      </div>
    </form>
  );
}
