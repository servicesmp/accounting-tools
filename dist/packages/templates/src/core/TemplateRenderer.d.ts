/**
 * @module TemplateRenderer
 * @description Base template renderer for Factur-X PDF generation
 *
 * Performance optimizations:
 * - Lazy font loading
 * - Cached measurements
 * - Efficient page management
 * - Optimized PDF-lib usage
 */
import { PDFDocument, PDFPage, PDFFont, PDFImage } from 'pdf-lib';
import { FacturXInvoice } from '../../../core/src';
import { TemplateOptions, TemplateContext, PDFGenerationResult, RenderContext, RenderedElement, LocalizedStrings, TemplateType, BrandSlots } from '../types';
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
    /** Remplacements de couleur actifs pour ce rendu (teinte d'origine → teinte de marque). */
    private colorRemap;
    /**
     * Emplacements de couleur de marque du modèle. Les modèles qui ne déclarent
     * rien ne sont pas colorisables (ex. Minimal, volontairement monochrome).
     */
    protected brandSlots(): BrandSlots;
    /** Construit la table de remplacement à partir des couleurs de marque demandées. */
    private buildColorRemap;
    /** Symbole monétaire affichable (les montants ne sont pas toujours en euros). */
    protected get currencyMark(): string;
    /** Titre légal du document, dérivé du type (facture, avoir…) et de la langue. */
    protected get documentTitle(): string;
    /** Currency symbol derived from invoice currency code */
    protected get currencySymbol(): string;
    constructor();
    /**
     * Generate PDF from invoice - Main entry point with automatic validation
     */
    generate(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult & {
        validation?: ValidationPipelineResult;
    }>;
    /**
     * Render content - Must be implemented by subclasses
     */
    protected abstract renderContent(): Promise<void>;
    /**
     * Get template type - Must be implemented by subclasses
     */
    protected abstract getTemplateType(): TemplateType;
    /** Height reserved at bottom of every page for the page footer */
    protected static readonly PAGE_FOOTER_HEIGHT = 40;
    /** Height reserved at top of continuation pages (page 2+) for the recap header */
    protected static readonly CONTINUATION_HEADER_HEIGHT = 70;
    /**
     * Draw page footers on ALL pages at once (called at end of document).
     * This ensures correct "Page X sur Y" with the final total page count.
     */
    protected drawAllPageFooters(): void;
    /**
     * Draw footer on a single page. Override in subclasses for custom styling.
     * @param page - The PDF page to draw on
     * @param pageNum - Current page number (1-based)
     * @param totalPages - Total number of pages
     */
    protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void;
    /**
     * Add new page and track it for deferred footer rendering
     */
    protected addPage(): void;
    /**
     * Check if we need new page - accounts for reserved footer space
     */
    protected needsNewPage(requiredHeight: number): boolean;
    /**
     * Move to new page if needed
     */
    protected checkPageBreak(requiredHeight: number): void;
    /**
     * Draw text - Optimized
     */
    protected drawText(text: string, x: number, y: number, options?: {
        size?: number;
        color?: string;
        font?: string;
        bold?: boolean;
    }): void;
    /**
     * Draw rectangle - Optimized
     */
    protected drawRect(x: number, y: number, width: number, height: number, options?: {
        fillColor?: string;
        borderColor?: string;
        borderWidth?: number;
    }): void;
    /**
     * Draw line - Optimized
     */
    protected drawLine(x1: number, y1: number, x2: number, y2: number, options?: {
        color?: string;
        width?: number;
    }): void;
    /**
     * Build JSON payload for the invoice header QR code (continuation pages).
     * Contains all key invoice data: id, url, seller, buyer, amounts.
     */
    protected buildInvoiceQRData(): string;
    /**
     * Render a QR code on the current page.
     * @param x - Left X position
     * @param y - Bottom Y position (pdf-lib coordinate system)
     * @param data - String to encode in the QR code
     * @param size - Width/height in points (default 80)
     * @param label - Optional label text below the QR code
     * @param color - QR color hex (default '#1e293b')
     */
    protected renderQRCode(x: number, y: number, data: string, size?: number, label?: string, color?: string): Promise<void>;
    /**
     * Draw continuation headers on pages 2+ (after content is fully rendered).
     * Layout: [Seller info left] [Client summary] [QR] [Invoice# vertical right]
     * Pages 2+ only.
     */
    protected drawContinuationPageHeaders(): Promise<void>;
    /**
     * Load and embed logo image (PNG or JPEG).
     * Flattens alpha channel to avoid SMask (PDF/A-3 compliance).
     */
    protected loadLogo(): Promise<PDFImage | undefined>;
    /**
     * Flatten PNG alpha channel by compositing on white background.
     * For JPEG files, returns the bytes unchanged.
     * This prevents SMask entries which violate PDF/A-3.
     */
    private flattenImageAlpha;
    /**
     * Render logo with configurable layout.
     * @param x - Left X position
     * @param y - Top Y position (logo drawn downward)
     * @param maxWidth - Maximum width for the logo
     * @param maxHeight - Maximum height for the logo
     * @returns Height consumed by the logo rendering, or 0 if no logo
     */
    protected renderLogo(x: number, y: number, maxWidth: number, maxHeight: number): Promise<number>;
    /**
     * Wrap text to fit within a given width.
     * Returns array of lines.
     */
    protected wrapText(text: string, maxWidth: number, fontSize: number): string[];
    /**
     * Measure text width using embedded font
     */
    protected measureTextWidth(text: string, fontSize: number, bold?: boolean): number;
    /**
     * Render header section with optional logo support (logoLayout: 'above' | 'left' | 'none')
     */
    protected renderHeader(): Promise<RenderedElement>;
    /**
     * Get due date: from payment, from header, or default to issueDate + 60 days
     */
    protected getDueDate(): Date;
    /**
     * Render parties (seller/buyer)
     */
    protected renderParties(): RenderedElement;
    /**
     * Render line items table
     */
    protected renderLineItems(): RenderedElement;
    /**
     * Render totals section
     */
    protected renderTotals(): RenderedElement;
    /**
     * Format date in full locale format (e.g., "2 mars 2026" for fr)
     */
    protected formatDateFull(date: Date): string;
    /**
     * Get the generation date text (e.g., "Document généré le 2 mars 2026")
     */
    protected getGeneratedDateText(): string;
    /**
     * Format invoice date in full locale format
     */
    protected formatInvoiceDateFull(): string;
    /**
     * Get font - Cached
     */
    /**
     * Load embedded Chillax fonts (PDF/A-3 compliance)
     */
    private loadEmbeddedFonts;
    /**
     * Get font - now returns embedded Chillax fonts
     */
    protected getFont(fontName: string): PDFFont;
    /**
     * Parse color string to RGB
     */
    protected parseColor(color: string): any;
    /**
     * Get page size
     */
    private getPageSize;
    /**
     * Mentions légales obligatoires d'une facture française, dont celles de la
     * réforme 2026. Tous les modèles les impriment : la personnalisation ne peut
     * jamais les faire disparaître.
     */
    protected getMandatoryMentions(): string[];
    /** Motifs d'exonération de TVA (BT-120), ex. « TVA non applicable, art. 293 B du CGI ». */
    protected getVatExemptionMentions(): string[];
    /** Un modèle qui imprime déjà ces mentions dans sa propre mise en page renvoie true. */
    protected rendersOwnMandatoryMentions(): boolean;
    /** Bloc de mentions obligatoires générique, en fin de document. */
    protected renderMandatoryMentions(): void;
    /**
     * Imprime la mention libre de l'organisation (`customFooter`) après le contenu.
     * Texte brut, retour à la ligne automatique, saut de page si nécessaire.
     */
    protected renderCustomFooterNote(): void;
    /**
     * Merge options with defaults
     */
    private mergeOptions;
    /**
     * Merge theme with defaults
     */
    private mergeTheme;
    /**
     * Add PDF metadata
     */
    private addMetadata;
    /**
     * Attach Factur-X XML to PDF - Returns XML content for validation
     */
    private attachFacturXml;
}
//# sourceMappingURL=TemplateRenderer.d.ts.map