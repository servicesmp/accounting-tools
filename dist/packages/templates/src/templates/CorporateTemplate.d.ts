/**
 * @module CorporateTemplate
 * @description Professional corporate template for Factur-X invoices
 *
 * Features:
 * - Elegant gray, blue and gold color scheme
 * - Clean, professional design
 * - Structured layout with clear sections
 * - Perfect for established businesses
 */
import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType, BrandSlots } from '../types';
export declare class CorporateTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    /** Teintes d'origine remplacées par les couleurs de marque de l'organisation. */
    protected brandSlots(): BrandSlots;
    protected renderContent(): Promise<void>;
    private renderCorporateHeader;
    private renderCorporateParties;
    private renderCorporateLineItems;
    private renderPaymentAndTotals;
    private renderTaxBreakdown;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
}
//# sourceMappingURL=CorporateTemplate.d.ts.map