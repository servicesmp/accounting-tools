/**
 * Outils couleur pour la personnalisation des documents.
 * Contraste WCAG 2.x : https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
/** Normalise '#ABC' / '#aabbcc' / 'aabbcc' en '#aabbcc' ; null si invalide. */
export declare function normalizeHex(input: unknown): string | null;
export declare function relativeLuminance(hex: string): number;
export declare function contrastRatio(a: string, b: string): number;
/** Mélange `hex` avec du blanc (`amount` = part de blanc, 0..1). */
export declare function tint(hex: string, amount: number): string;
/** Assombrit `hex` (`amount` = part de noir, 0..1). */
export declare function shade(hex: string, amount: number): string;
/**
 * Assombrit progressivement une couleur jusqu'à atteindre le contraste minimal
 * contre le blanc (texte coloré sur papier, ou texte blanc sur aplat coloré).
 * Garantit la lisibilité d'un document légal quelle que soit la couleur choisie.
 */
export declare function ensureContrastOnWhite(hex: string, minRatio: number): {
    color: string;
    adjusted: boolean;
};
//# sourceMappingURL=color.d.ts.map