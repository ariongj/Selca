// Build a 50–900 brand scale from a single hex so the client can re-colour the
// whole site from Admin → Postavke and see it update live.

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

export function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}

export function brandScale(hex: string): Record<string, string> {
  const [h, s, l] = hexToHsl(hex);
  const sat = (d: number) => Math.max(0, Math.min(100, s + d));
  return {
    50: hslToHex(h, sat(-20), 97),
    100: hslToHex(h, sat(-15), 93),
    200: hslToHex(h, sat(-10), 85),
    300: hslToHex(h, sat(-5), 73),
    400: hslToHex(h, s, Math.min(62, l + 18)),
    500: hslToHex(h, s, Math.min(52, l + 8)),
    600: hex,
    700: hslToHex(h, s, Math.max(8, l - 7)),
    800: hslToHex(h, s, Math.max(6, l - 13)),
    900: hslToHex(h, s, Math.max(4, l - 19)),
  };
}

export function applyBrand(hex: string) {
  const root = document.documentElement;
  const scale = brandScale(isHex(hex) ? hex : '#9a2e2e');
  for (const [k, v] of Object.entries(scale)) root.style.setProperty(`--color-brand-${k}`, v);
}
