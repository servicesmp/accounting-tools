/**
 * `PlatformInvoiceData` → `PlatformInvoiceView` (textes prêts à dessiner) et → `DocumentData`
 * (XML Factur-X). Les deux partent des mêmes données : ce qui est imprimé est dans le XML.
 */
import type { DocumentData, DocumentTotals } from './types';
import type { PlatformInvoiceData, PlatformInvoiceView } from './platform-invoice-types';
/** Statut refusé (maquette). */
export declare const PLATFORM_ALERT_COLOR = "#C1123C";
/** « 92910142600013 » → « 929 101 426 00013 » ; SIREN « 929101426 » → « 929 101 426 ». */
export declare function formatSiret(value: string | undefined): string | undefined;
/** « FR75929101426 » → « FR75 929 101 426 » (TVA française) ; autres pays inchangés. */
export declare function formatVatNumber(value: string | undefined): string | undefined;
/** Nom de la devise : « Euro », « Dollar des États-Unis ». */
export declare function currencyDisplayName(currency: string): string;
/** Taux de la remise de document : celui de la première ligne (une seule base imposable en pratique). */
export declare function platformDiscountRate(data: PlatformInvoiceData): number;
/** Totaux calculés (HT des lignes, remise, base, TVA par taux arrondie par taux, TTC). */
export declare function computePlatformTotals(data: PlatformInvoiceData): DocumentTotals;
/**
 * `DocumentData` du XML : lignes, remise (BG-20), période (BG-14), moyen de paiement (carte,
 * compensation sur le wallet), et en notes (BT-22) le bloc d'information, les mentions sous le
 * tableau et les conditions du pied — tout ce que le PDF imprime.
 */
export declare function platformInvoiceToDocumentData(data: PlatformInvoiceData, view?: PlatformInvoiceView): DocumentData;
export interface BuildPlatformInvoiceViewOptions {
    /** Totaux imposés (ceux du XML Factur-X) ; calculés depuis les lignes sinon. */
    readonly totals?: DocumentTotals;
}
export declare function buildPlatformInvoiceView(data: PlatformInvoiceData, options?: BuildPlatformInvoiceViewOptions): PlatformInvoiceView;
/** Libellé de ligne d'un abonnement : « Plan Pro, abonnement mensuel du 01/11/2026 au 01/12/2026 ». */
export declare function platformSubscriptionLineLabel(planName: string, interval: 'monthly' | 'annual', period?: {
    start?: string | Date | null;
    end?: string | Date | null;
}, planChange?: boolean): string;
//# sourceMappingURL=platform-invoice-view.d.ts.map