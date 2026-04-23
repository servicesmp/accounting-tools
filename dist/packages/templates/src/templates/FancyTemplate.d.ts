/**
 * @module FancyTemplate
 * @description Fancy, colorful template for Factur-X invoices
 *
 * Features:
 * - Pink and blue color scheme
 * - Modern gradient header
 * - Colorful section highlights
 * - Configurable logo rendering (above/left/none)
 * - Multi-line text wrapping for long descriptions
 * - Real QR code for payment link (embedded PNG, clamped to page bounds)
 * - SIREN/SIRET display
 * - Perfect for creative businesses
 */
import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class FancyTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
    protected renderContent(): Promise<void>;
    private renderFancyHeader;
    private renderFancyParties;
    private renderFancyLineItems;
    private renderPaymentAndTotals;
    private renderFancyTaxBreakdown;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
}
//# sourceMappingURL=FancyTemplate.d.ts.map