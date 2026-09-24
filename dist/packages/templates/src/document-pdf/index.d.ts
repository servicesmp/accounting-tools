/**
 * Génération PDF des documents commerciaux par blocs (Node uniquement).
 */
import type { DocumentData, DocumentEntitlements, DocumentView } from '../document/types';
export { DocumentPdfRenderer, renderDocumentPdf } from './DocumentPdfRenderer';
export type { RenderDocumentPdfOptions, RenderedDocumentPdf } from './DocumentPdfRenderer';
export { buildFacturXInvoice, FR_MANDATORY_NOTES, FR_FRANCHISE_MENTION } from './facturx';
export type { FacturXBuildResult } from './facturx';
export interface GenerateDocumentPdfInput {
    readonly data: DocumentData;
    /** Réglage enregistré de l'organisation (non fiable : normalisé ici). */
    readonly settings?: unknown;
    /** Droits du plan de l'organisation émettrice. */
    readonly entitlements?: DocumentEntitlements;
    readonly logo?: Uint8Array | null;
    readonly defaultCountry?: string;
}
export interface GeneratedDocumentPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
    readonly view: DocumentView;
    /** XML Factur-X embarqué (facture et avoir), sinon undefined. */
    readonly xml?: string;
    readonly warnings: string[];
}
/**
 * Point d'entrée unique : facture, avoir, devis ou bon de commande.
 * Facture/avoir : le XML Factur-X est construit à partir des MÊMES données et ses
 * totaux sont ceux affichés (aucun écart possible entre PDF et XML).
 */
export declare function generateDocumentPdf(input: GenerateDocumentPdfInput): Promise<GeneratedDocumentPdf>;
//# sourceMappingURL=index.d.ts.map