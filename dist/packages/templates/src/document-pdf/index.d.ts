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
import type { ReportDocumentData, ReportView } from '../document/report-types';
export { renderReportPdf, ReportPdfRenderer } from './ReportPdfRenderer';
export type { RenderReportPdfOptions, RenderedReportPdf } from './ReportPdfRenderer';
export interface GenerateReportPdfInput {
    readonly data: ReportDocumentData;
    /** Réglage enregistré de l'organisation (non fiable : normalisé ici), le même que pour les factures. */
    readonly settings?: unknown;
    readonly entitlements?: DocumentEntitlements;
    readonly logo?: Uint8Array | null;
    readonly generatedAt?: Date;
}
export interface GeneratedReportPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
    readonly view: ReportView;
    readonly warnings: string[];
}
/** Point d'entrée des rapports : rapport de tâche, compte rendu de réunion, rapport d'activité… */
export declare function generateReportPdf(input: GenerateReportPdfInput): Promise<GeneratedReportPdf>;
import type { TimesheetDocumentData, TimesheetVariant, TimesheetView } from '../document/timesheet-types';
export { renderTimesheetPdf, TimesheetPdfRenderer } from './TimesheetPdfRenderer';
export type { RenderTimesheetPdfOptions, RenderedTimesheetPdf } from './TimesheetPdfRenderer';
export interface GenerateTimesheetPdfInput {
    readonly data: TimesheetDocumentData;
    readonly variant?: TimesheetVariant;
    /** Réglage enregistré de l'organisation (non fiable : normalisé ici), le même que pour les factures. */
    readonly settings?: unknown;
    /** Droits du plan : sans `canCustomize`, ni logo ni personnalisation. */
    readonly entitlements?: DocumentEntitlements;
    readonly logo?: Uint8Array | null;
    readonly generatedAt?: Date;
    /** Fuseau des horodatages (défaut Europe/Paris). */
    readonly timeZone?: string;
}
export interface GeneratedTimesheetPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
    readonly view: TimesheetView;
    readonly warnings: string[];
}
/** Point d'entrée du relevé de temps (versions simple et détaillée). */
export declare function generateTimesheetPdf(input: GenerateTimesheetPdfInput): Promise<GeneratedTimesheetPdf>;
import type { PlatformInvoiceData, PlatformInvoiceView } from '../document/platform-invoice-types';
export { renderPlatformInvoicePdf, PlatformInvoicePdfRenderer } from './PlatformInvoicePdfRenderer';
export type { RenderPlatformInvoicePdfOptions, RenderedPlatformInvoicePdf } from './PlatformInvoicePdfRenderer';
export interface GeneratePlatformInvoicePdfInput {
    readonly data: PlatformInvoiceData;
    /** Logo Services (défaut : logo haute définition de la librairie). */
    readonly logo?: Uint8Array | null;
    readonly defaultCountry?: string;
    readonly generatedAt?: Date;
    /** TTC attendu (montant réellement prélevé), unités mineures : un écart est signalé. */
    readonly expectedTotal?: number;
}
export interface GeneratedPlatformInvoicePdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
    readonly view: PlatformInvoiceView;
    /** XML Factur-X EN 16931 embarqué. */
    readonly xml: string;
    readonly warnings: string[];
}
/**
 * Facture d'abonnement ou de frais de service de la plateforme : XML Factur-X (remise BG-20,
 * période BG-14, montant payé BT-113, blocs d'information en notes) puis PDF/A-3 dessiné avec
 * les totaux du XML — aucun écart possible entre ce qui est imprimé et ce qui est transmis.
 */
export declare function generatePlatformInvoicePdf(input: GeneratePlatformInvoicePdfInput): Promise<GeneratedPlatformInvoicePdf>;
//# sourceMappingURL=index.d.ts.map