/**
 * @module MinimalTemplate
 * @description Clean and minimal template for Factur-X invoices
 *
 * Features:
 * - Ultra-clean design
 * - Monochrome color scheme
 * - Typography-focused
 * - Compact layout: payment left, totals right, tax below
 */
import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class MinimalTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderMinimalHeader;
    private renderMinimalParties;
    private renderMinimalLineItems;
    private renderPaymentAndTotals;
    private renderTaxBreakdown;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
}
//# sourceMappingURL=MinimalTemplate.d.ts.map