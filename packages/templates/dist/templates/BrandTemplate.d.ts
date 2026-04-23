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