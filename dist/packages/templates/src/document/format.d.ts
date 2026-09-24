/**
 * Formatage des montants et des dates, identique à la maquette :
 * montants « 3 200,00 » dans le tableau, « 6 336,00 € » dans les totaux,
 * dates « 12/11/2026 ». La devise est celle du document (jamais d'« € » implicite).
 * Espaces fines d'Intl remplacées par des espaces insécables standard (même
 * chasse qu'une espace ordinaire, présentes dans toutes les polices embarquées).
 */
/** Nombre de décimales d'une devise (JPY, XOF, XAF : 0 ; EUR, USD : 2…). */
export declare function currencyDecimals(currency: string): number;
/** Montant avec devise : « 6 336,00 € », « 12 000 FCFA », « $1,250.00 ». */
export declare function formatMoney(minor: number, currency: string, locale: string): string;
/** Montant sans devise (cellules du tableau) : « 3 200,00 ». */
export declare function formatAmount(minor: number, currency: string, locale: string): string;
export declare function formatPercent(rate: number, locale: string): string;
export declare function formatQuantity(q: number, locale: string): string;
/** Accepte Date, ISO, ou timestamp (nombre ou chaîne numérique). */
export declare function toDate(value: string | number | Date | undefined | null): Date | null;
/** Date numérique : « 12/11/2026 » (fr, en), « 12.11.2026 » (de). */
export declare function formatDate(value: string | number | Date | undefined | null, locale: string): string;
/** Nombre de jours entiers entre deux dates (validité d'un devis). */
export declare function daysBetween(from: string | number | Date | undefined | null, to: string | number | Date | undefined | null): number | null;
//# sourceMappingURL=format.d.ts.map