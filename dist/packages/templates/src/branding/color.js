"use strict";
/**
 * Outils couleur pour la personnalisation des documents.
 * Contraste WCAG 2.x : https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeHex = normalizeHex;
exports.relativeLuminance = relativeLuminance;
exports.contrastRatio = contrastRatio;
exports.tint = tint;
exports.shade = shade;
exports.ensureContrastOnWhite = ensureContrastOnWhite;
const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX3 = /^#[0-9a-f]{3}$/i;
/** Normalise '#ABC' / '#aabbcc' / 'aabbcc' en '#aabbcc' ; null si invalide. */
function normalizeHex(input) {
    if (typeof input !== 'string')
        return null;
    let v = input.trim().toLowerCase();
    if (!v.startsWith('#'))
        v = `#${v}`;
    if (HEX3.test(v))
        v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
    return HEX6.test(v) ? v : null;
}
function toRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex([r, g, b]) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}
function channel(c) {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function relativeLuminance(hex) {
    const [r, g, b] = toRgb(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}
/** Mélange `hex` avec du blanc (`amount` = part de blanc, 0..1). */
function tint(hex, amount) {
    const [r, g, b] = toRgb(hex);
    return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}
/** Assombrit `hex` (`amount` = part de noir, 0..1). */
function shade(hex, amount) {
    const [r, g, b] = toRgb(hex);
    return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}
/**
 * Assombrit progressivement une couleur jusqu'à atteindre le contraste minimal
 * contre le blanc (texte coloré sur papier, ou texte blanc sur aplat coloré).
 * Garantit la lisibilité d'un document légal quelle que soit la couleur choisie.
 */
function ensureContrastOnWhite(hex, minRatio) {
    let color = hex;
    let adjusted = false;
    for (let i = 0; i < 40 && contrastRatio(color, '#ffffff') < minRatio; i++) {
        color = shade(color, 0.06);
        adjusted = true;
    }
    return { color, adjusted };
}
//# sourceMappingURL=color.js.map