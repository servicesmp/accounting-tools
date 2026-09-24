/**
 * Normalisation des pays en code ISO 3166-1 alpha-2 (BT-40, BT-55, BT-80…).
 *
 * La plateforme stocke souvent un NOM de pays (« France », « Allemagne »,
 * « Côte d'Ivoire ») là où Factur-X exige un code à deux lettres. L'ancien
 * contournement (`substring(0, 2).toUpperCase()`) tombait juste par hasard
 * pour « France » mais produisait « AL » (Albanie) pour « Allemagne » ou
 * « SU » pour « Suisse ». Ce module résout les noms en français, anglais,
 * allemand et espagnol via Intl.DisplayNames. Aucune dépendance : utilisable
 * côté navigateur comme côté serveur.
 */
/**
 * Code ISO alpha-2 d'un pays donné par code ou par nom ; `null` si inconnu.
 * « FR », « fr », « France », « france », « FRA » → « FR ».
 */
export declare function toIsoCountryCode(input: unknown): string | null;
/** Comme toIsoCountryCode, avec un repli explicite (ex. pays de l'organisation). */
export declare function toIsoCountryCodeOr(input: unknown, fallback: string): string;
/** Nom lisible d'un pays dans la langue du document (« FR » → « France »). */
export declare function countryDisplayName(code: string | null | undefined, language?: string): string;
//# sourceMappingURL=country.d.ts.map