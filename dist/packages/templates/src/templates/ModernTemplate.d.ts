/**
 * @module ModernTemplate
 * @description Clean, professional invoice template inspired by Amazon-style invoices
 *
 * Features:
 * - Ultra-clean, minimal design (almost no color)
 * - Logo top-left, "Facture" title top-right
 * - Green "Payé" / Yellow "En attente" status badge with invoice reference
 * - Buyer address block left, seller info right
 * - "Détails de la facture" table with clean borders
 * - "Facture Total" section with tax breakdown
 * - Legal info footer
 * - Pagination handled by base TemplateRenderer
 */
import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType, BrandSlots } from '../types';
export declare class ModernTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected brandSlots(): BrandSlots;
    /** Ce modèle imprime les mentions obligatoires dans son pied légal (renderLegalInfo). */
    protected rendersOwnMandatoryMentions(): boolean;
    protected renderContent(): Promise<void>;
    private renderModernHeader;
    private renderModernParties;
    private renderOrderInfo;
    private renderModernLineItems;
    private renderModernTotals;
    private renderLegalInfo;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
    protected drawContinuationPageHeaders(): Promise<void>;
}
//# sourceMappingURL=ModernTemplate.d.ts.map