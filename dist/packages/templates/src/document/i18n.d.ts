/**
 * Libellés des documents commerciaux (fr, en, de) — repris mot pour mot de la
 * maquette « Document Page » (Claude Design). Seule source des textes imprimés :
 * le PDF et le rendu web utilisent exactement les mêmes.
 */
import type { DocumentKind, DocumentLanguage, ColumnKey, DocumentStatus } from './types';
export interface DocumentLabels {
    readonly titles: Record<DocumentKind, string>;
    readonly number: string;
    readonly issue: string;
    readonly due: string;
    readonly valid: string;
    readonly delivery: string;
    readonly seller: string;
    readonly buyer: string;
    readonly vat: string;
    readonly siret: string;
    readonly siren: string;
    readonly columns: Record<ColumnKey, string>;
    readonly subtotal: string;
    readonly taxTotal: string;
    readonly grandTotal: string;
    readonly taxBreakdown: string;
    readonly taxBase: string;
    readonly taxAmount: string;
    readonly paymentTerms: string;
    readonly iban: string;
    readonly bic: string;
    readonly scanToPay: string;
    readonly poweredBy: string;
    readonly page: string;
    readonly of: string;
    /** Filigrane selon le type de document (accord en genre) et son état ; aucun pour « pending ». */
    readonly watermark: (kind: DocumentKind, status: DocumentStatus) => string | undefined;
    readonly status: Record<DocumentStatus, string>;
    readonly amount: Record<DocumentKind, string>;
    readonly creditRef: (invoice: string, date?: string, reason?: string) => string;
    readonly quoteRef: (days?: number, until?: string) => string;
    readonly orderRef: (number: string, buyerReference?: string) => string;
    readonly capital: (legalName: string, capital: string) => string;
    readonly mentions: {
        readonly latePenalties: string;
        readonly recoveryIndemnity: string;
        readonly noDiscount: string;
        readonly nature: (label: string) => string;
        readonly natureLabels: Record<'goods' | 'services' | 'mixed', string>;
        readonly vatOnDebits: string;
        readonly deliveryAddress: (address: string) => string;
        readonly orderNoPayment: string;
    };
    readonly continuation: string;
}
export declare const DOCUMENT_LABELS: Record<DocumentLanguage, DocumentLabels>;
export declare const DOCUMENT_LOCALES: Record<DocumentLanguage, string>;
export declare function getDocumentLabels(language: string | undefined): DocumentLabels;
//# sourceMappingURL=i18n.d.ts.map