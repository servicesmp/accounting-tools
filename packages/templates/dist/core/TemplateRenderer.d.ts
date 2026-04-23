import { PDFDocument, PDFPage, PDFFont, PDFImage } from 'pdf-lib';
import { FacturXInvoice } from '@facturx/core';
import { TemplateOptions, TemplateContext, PDFGenerationResult, RenderContext, RenderedElement, LocalizedStrings, TemplateType } from '../types';
import { ValidationPipelineResult } from '../validation/ValidationPipeline';
export declare abstract class TemplateRenderer {
    protected pdfDoc: PDFDocument;
    protected currentPage: PDFPage;
    protected context: TemplateContext;
    protected renderContext: RenderContext;
    protected strings: LocalizedStrings;
    protected allPages: PDFPage[];
    private fontCache;
    private chillaxFonts?;
    private embeddedLogo?;
    private validationPipeline;
    protected get currencySymbol(): string;
    constructor();
    generate(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult & {
        validation?: ValidationPipelineResult;
    }>;
    protected abstract renderContent(): Promise<void>;
    protected abstract getTemplateType(): TemplateType;
    protected static readonly PAGE_FOOTER_HEIGHT = 40;
    protected static readonly CONTINUATION_HEADER_HEIGHT = 70;
    protected drawAllPageFooters(): void;
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
    protected addPage(): void;
    protected needsNewPage(requiredHeight: number): boolean;
    protected checkPageBreak(requiredHeight: number): void;
    protected drawText(text: string, x: number, y: number, options?: {
        size?: number;
        color?: string;
        font?: string;
        bold?: boolean;
    }): void;
    protected drawRect(x: number, y: number, width: number, height: number, options?: {
        fillColor?: string;
        borderColor?: string;
        borderWidth?: number;
    }): void;
    protected drawLine(x1: number, y1: number, x2: number, y2: number, options?: {
        color?: string;
        width?: number;
    }): void;
    protected buildInvoiceQRData(): string;
    protected renderQRCode(x: number, y: number, data: string, size?: number, label?: string, color?: string): Promise<void>;
    protected drawContinuationPageHeaders(): Promise<void>;
    protected loadLogo(): Promise<PDFImage | undefined>;
    private flattenImageAlpha;
    protected renderLogo(x: number, y: number, maxWidth: number, maxHeight: number): Promise<number>;
    protected wrapText(text: string, maxWidth: number, fontSize: number): string[];
    protected measureTextWidth(text: string, fontSize: number, bold?: boolean): number;
    protected renderHeader(): Promise<RenderedElement>;
    protected getDueDate(): Date;
    protected renderParties(): RenderedElement;
    protected renderLineItems(): RenderedElement;
    protected renderTotals(): RenderedElement;
    protected formatDateFull(date: Date): string;
    protected getGeneratedDateText(): string;
    protected formatInvoiceDateFull(): string;
    private loadEmbeddedFonts;
    protected getFont(fontName: string): PDFFont;
    protected parseColor(color: string): any;
    private getPageSize;
    private mergeOptions;
    private mergeTheme;
    private addMetadata;
    private attachFacturXml;
}
//# sourceMappingURL=TemplateRenderer.d.ts.map