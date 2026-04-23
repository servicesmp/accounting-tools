import { PDFPage } from 'pdf-lib';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';
export declare class ModernTemplate extends TemplateRenderer {
    protected getTemplateType(): TemplateType;
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