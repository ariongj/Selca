import type { Lang, Unit } from './types';

const LOCALE: Record<Lang, string> = { me: 'de-DE', sq: 'de-DE', en: 'en-IE' };
const DATE_LOCALE: Record<Lang, string> = { me: 'sr-Latn-ME', sq: 'sq-AL', en: 'en-GB' };

/** 1.249,00 € (ME/SQ) — €1,249.00 (EN) */
export function money(value: number, lang: Lang = 'me', opts: { decimals?: boolean } = {}) {
  const decimals = opts.decimals ?? true;
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
}

/** Compact money for charts/KPIs: 12,4k € */
export function moneyCompact(value: number, lang: Lang = 'me') {
  if (Math.abs(value) < 10000) return money(value, lang, { decimals: false });
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function num(value: number, lang: Lang = 'me', maxDecimals = 2) {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: maxDecimals }).format(value);
}

export function date(iso: string | Date, lang: Lang = 'me', opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[lang], opts).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
  }
}

export function dateTime(iso: string, lang: Lang = 'me') {
  return date(iso, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const REL: Record<Lang, { now: string; min: string; h: string; d: string; ago: (s: string) => string }> = {
  me: { now: 'upravo sada', min: 'min', h: 'h', d: 'd', ago: (s) => `prije ${s}` },
  sq: { now: 'tani', min: 'min', h: 'orë', d: 'ditë', ago: (s) => `para ${s}` },
  en: { now: 'just now', min: 'min', h: 'h', d: 'd', ago: (s) => `${s} ago` },
};

export function timeAgo(iso: string, lang: Lang = 'me') {
  const r = REL[lang];
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return r.now;
  if (diff < 3600) return r.ago(`${Math.floor(diff / 60)} ${r.min}`);
  if (diff < 86400) return r.ago(`${Math.floor(diff / 3600)} ${r.h}`);
  if (diff < 86400 * 30) return r.ago(`${Math.floor(diff / 86400)} ${r.d}`);
  return date(iso, lang);
}

const UNIT_LABEL: Record<Lang, Record<Unit, string>> = {
  me: { kom: 'kom', m2: 'm²', m: 'm', set: 'set' },
  sq: { kom: 'copë', m2: 'm²', m: 'm', set: 'set' },
  en: { kom: 'pc', m2: 'm²', m: 'm', set: 'set' },
};

export function unitLabel(unit: Unit, lang: Lang = 'me') {
  return UNIT_LABEL[lang][unit];
}

/** "/ m²" style suffix for prices */
export function perUnit(unit: Unit, lang: Lang = 'me') {
  return `/ ${unitLabel(unit, lang)}`;
}
