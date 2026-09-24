/**
 * Outils couleur pour la personnalisation des documents.
 * Contraste WCAG 2.x : https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX3 = /^#[0-9a-f]{3}$/i;

/** Normalise '#ABC' / '#aabbcc' / 'aabbcc' en '#aabbcc' ; null si invalide. */
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let v = input.trim().toLowerCase();
  if (!v.startsWith('#')) v = `#${v}`;
  if (HEX3.test(v)) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return HEX6.test(v) ? v : null;
}

function toRgb(hex: string): [number, number, number] {
  const h = (normalizeHex(hex) ?? '#000000').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mélange `hex` avec du blanc (`amount` = part de blanc, 0..1). */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

/** Assombrit `hex` (`amount` = part de noir, 0..1). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}

/**
 * Assombrit progressivement une couleur jusqu'à atteindre le contraste minimal
 * contre le blanc (texte coloré sur papier, ou texte blanc sur aplat coloré).
 * Garantit la lisibilité d'un document légal quelle que soit la couleur choisie.
 */
export function ensureContrastOnWhite(hex: string, minRatio: number): { color: string; adjusted: boolean } {
  let color = hex;
  let adjusted = false;
  for (let i = 0; i < 40 && contrastRatio(color, '#ffffff') < minRatio; i++) {
    color = shade(color, 0.06);
    adjusted = true;
  }
  return { color, adjusted };
}

/** Équivalent de CSS `color-mix(in srgb, color p%, #ffffff)` (p entre 0 et 1). */
export function mix(hex: string, p: number): string {
  return tint(hex, 1 - p);
}

/** Mélange `fg` sur `bg` avec l'opacité `alpha` (pour rendre une opacité CSS sans transparence PDF). */
export function blend(fg: string, bg: string, alpha: number): string {
  const [r1, g1, b1] = toRgb(fg); const [r2, g2, b2] = toRgb(bg);
  return toHex([r2 + (r1 - r2) * alpha, g2 + (g1 - g2) * alpha, b2 + (b1 - b2) * alpha]);
}
