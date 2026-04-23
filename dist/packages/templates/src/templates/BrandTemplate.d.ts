/**
 * @module BrandTemplate
 * @description Professional brand template for Factur-X invoices
 *
 * Features:
 * - Navy and orange color scheme
 * - Strong brand presence with seller name
 * - Professional layout
 * - Perfect for corporate businesses
 */
import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class BrandTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderBrandHeader;
    private renderBrandParties;
    private renderBrandLineItems;
    private renderPaymentAndTotals;
    private renderTaxBreakdown;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
}
//# sourceMappingURL=BrandTemplate.d.ts.map