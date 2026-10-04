import { cn } from '@/lib/utils';

/**
 * Vector re-draw of the SELCA COMPANY mark: red roof with chimney over the
 * wordmark, "D.O.O" on the left and spaced "COMPANY" beneath.
 */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const ink = tone === 'dark' ? 'var(--color-ink)' : '#ffffff';
  const roof = tone === 'dark' ? 'var(--color-brand-600)' : '#ffffff';
  return (
    <svg viewBox="0 0 220 96" className={cn('h-11 w-auto', className)} role="img" aria-label="SELCA COMPANY d.o.o.">
      <path d="M10 42 L110 8 L210 42" fill="none" stroke={roof} strokeWidth="7.5" strokeLinejoin="miter" strokeMiterlimit="10" />
      <rect x="158" y="10" width="10" height="17" fill={roof} />
      <path d="M38 47 L110 22.5 L182 47" fill="none" stroke={ink} strokeWidth="2.6" />
      <path d="M58 51 L110 33.5 L162 51" fill="none" stroke={ink} strokeWidth="2.6" />
      <text x="114" y="82" textAnchor="middle" fill={ink} style={{ font: '800 37px var(--font-sans)', letterSpacing: '5px' }}>
        SELCA
      </text>
      <text x="14" y="82" fill={ink} style={{ font: '700 9.5px var(--font-sans)', letterSpacing: '0.5px' }}>
        D.O.O
      </text>
      <text x="116" y="95" textAnchor="middle" fill={ink} style={{ font: '600 9px var(--font-sans)', letterSpacing: '9.5px' }}>
        COMPANY
      </text>
    </svg>
  );
}

export function LogoMark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const ink = tone === 'dark' ? 'var(--color-ink)' : '#ffffff';
  const roof = tone === 'dark' ? 'var(--color-brand-600)' : '#ffffff';
  return (
    <svg viewBox="0 0 64 48" className={cn('h-8 w-auto', className)} aria-hidden>
      <path d="M4 26 L32 6 L60 26" fill="none" stroke={roof} strokeWidth="6" strokeLinejoin="miter" />
      <rect x="44" y="6" width="6" height="11" fill={roof} />
      <path d="M13 31 L32 17.5 L51 31" fill="none" stroke={ink} strokeWidth="2.6" />
      <path d="M20 36 L32 27.5 L44 36" fill="none" stroke={ink} strokeWidth="2.6" />
    </svg>
  );
}
