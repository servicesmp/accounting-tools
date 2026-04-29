"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRenderer = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_lib_1 = require("pdf-lib");
const qrcode_1 = __importDefault(require("qrcode"));
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const core_1 = require("../../../core/src");
const types_1 = require("../types");
const ValidationPipeline_1 = require("../validation/ValidationPipeline");
const PDFA3Compliance_1 = require("../utils/PDFA3Compliance");
const AFRelationshipFix_1 = require("../utils/AFRelationshipFix");
// ============================================================================
// BASE TEMPLATE RENDERER
// ============================================================================
class TemplateRenderer {
    /** Currency symbol derived from invoice currency code */
    get currencySymbol() {
        return this.context?.invoice?.currency || 'EUR';
    }
    constructor() {
        // Track all pages for deferred footer rendering
        this.allPages = [];
        // Font cache (now contains embedded fonts)
        this.fontCache = new Map();
        this.validationPipeline = new ValidationPipeline_1.ValidationPipeline();
    }
    /**
     * Generate PDF from invoice - Main entry point with automatic validation
     */
    async generate(invoice, options = {}) {
        // STEP 1: Validate BEFORE generation (optional, enabled by default)
        let preValidation;
        if (options.validateBeforeGeneration !== false) {
            try {
                preValidation = await this.validationPipeline.validateBeforeGeneration(invoice);
                // If strict mode and validation fails, throw error
                if (options.strictValidation && !preValidation.isValid) {
                    throw new Error(`Factur-X validation failed: ${preValidation.summary.totalErrors} error(s). ` +
                        `Recommendations: ${preValidation.recommendations.join(', ')}`);
                }
            }
            catch (error) {
                if (options.strictValidation) {
                    throw error;
                }
                // In non-strict mode, log but continue
                console.warn('Pre-generation validation failed:', error);
            }
        }
        // STEP 2: Initialize context
        const fullOptions = this.mergeOptions(options);
        const summary = invoice.finalizeTotals();
        const theme = this.mergeTheme(fullOptions.theme || {});
        this.context = {
            invoice,
            summary,
            options: fullOptions,
            theme,
            generatedAt: new Date(),
        };
        this.strings = types_1.LOCALIZED_STRINGS[fullOptions.language] ?? types_1.LOCALIZED_STRINGS['en'];
        // STEP 3: Create PDF document
        this.pdfDoc = await pdf_lib_1.PDFDocument.create();
        // STEP 3.0: Register fontkit to enable custom font embedding
        this.pdfDoc.registerFontkit(fontkit_1.default);
        // STEP 3.1: Load and embed Chillax fonts (PDF/A-3 compliance: all fonts must be embedded)
        await this.loadEmbeddedFonts();
        // STEP 3.2: Apply PDF/A-3 compliance (XMP metadata, OutputIntent, etc.)
        const PROFILE_CONFORMANCE = {
            MINIMUM: 'MINIMUM',
            BASICWL: 'BASIC WL',
            BASIC: 'BASIC',
            EN16931: 'EN 16931',
            EXTENDED: 'EXTENDED',
        };
        const conformanceLevel = PROFILE_CONFORMANCE[invoice.profile] ?? 'EN 16931';
        await (0, PDFA3Compliance_1.setupPDFA3Compliance)(this.pdfDoc, {
            title: invoice.header.name || 'Invoice',
            author: invoice.seller.name,
            subject: `Invoice ${invoice.header.invoiceNumber}`,
            creator: 'factur-x-ts',
            keywords: ['Invoice', 'Factur-X', invoice.profile, 'PDF/A-3'],
            conformanceLevel,
        });
        // Add metadata (basic PDF metadata, XMP is already added by setupPDFA3Compliance)
        this.addMetadata();
        // Create first page
        this.addPage();
        // Render content (implemented by subclasses)
        await this.renderContent();
        // Draw footer on ALL pages with correct total page count
        this.drawAllPageFooters();
        // Draw continuation recap headers on pages 2+
        await this.drawContinuationPageHeaders();
        // Attach Factur-X XML
        const xmlContent = await this.attachFacturXml();
        // STEP 4: Finalize PDF
        const pdfBytes = await this.pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        // STEP 5: Validate AFTER generation (optional, enabled by default)
        let postValidation;
        if (options.validateAfterGeneration !== false) {
            try {
                postValidation = await this.validationPipeline.validateAfterGeneration(invoice, pdfBuffer, xmlContent);
                // If strict mode and validation fails, throw error
                if (options.strictValidation && !postValidation.isValid) {
                    throw new Error(`Factur-X post-generation validation failed: ${postValidation.summary.totalErrors} error(s). ` +
                        `Compliance: ${postValidation.summary.complianceLevel}`);
                }
            }
            catch (error) {
                if (options.strictValidation) {
                    throw error;
                }
                // In non-strict mode, log but continue
                console.warn('Post-generation validation failed:', error);
            }
        }
        return {
            pdf: pdfBuffer,
            pageCount: this.pdfDoc.getPageCount(),
            fileSize: pdfBytes.length,
            generatedAt: this.context.generatedAt,
            templateType: this.getTemplateType(),
            // Include validation result if available
            validation: postValidation || preValidation,
        };
    }
    /**
     * Draw page footers on ALL pages at once (called at end of document).
     * This ensures correct "Page X sur Y" with the final total page count.
     */
    drawAllPageFooters() {
        const totalPages = this.allPages.length;
        for (let i = 0; i < totalPages; i++) {
            this.drawSinglePageFooter(this.allPages[i], i + 1, totalPages);
        }
    }
    /**
     * Draw footer on a single page. Override in subclasses for custom styling.
     * @param page - The PDF page to draw on
     * @param pageNum - Current page number (1-based)
     * @param totalPages - Total number of pages
     */
    drawSinglePageFooter(page, pageNum, totalPages) {
        const { margins } = this.context.options;
        const { theme } = this.context;
        const size = this.getPageSize(this.context.options.pageFormat);
        const pageWidth = size[0];
        const footerTop = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT;
        const font = this.getFont('Helvetica');
        const fontBold = this.getFont('Helvetica-Bold');
        // Footer background
        page.drawRectangle({
            x: margins.left,
            y: margins.bottom,
            width: pageWidth - margins.left - margins.right,
            height: TemplateRenderer.PAGE_FOOTER_HEIGHT,
            color: this.parseColor(theme.footerBackground),
        });
        // Generation date (bold)
        const generatedDateText = this.getGeneratedDateText();
        page.drawText(generatedDateText, {
            x: margins.left + 10,
            y: footerTop - 14,
            size: 8,
            font: fontBold,
            color: this.parseColor(theme.textColor),
        });
        // Page number
        const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
        page.drawText(pageText, {
            x: margins.left + 10,
            y: footerTop - 28,
            size: 8,
            font,
            color: this.parseColor(theme.textColor),
        });
        // Powered by (right-aligned)
        const creditText = '@facturx/templates';
        const creditX = pageWidth - margins.right - 120;
        page.drawText(creditText, {
            x: creditX,
            y: footerTop - 28,
            size: 8,
            font,
            color: this.parseColor(theme.secondaryColor),
        });
    }
    // ==========================================================================
    // PAGE MANAGEMENT
    // ==========================================================================
    /**
     * Add new page and track it for deferred footer rendering
     */
    addPage() {
        const { pageFormat, margins } = this.context.options;
        const size = this.getPageSize(pageFormat);
        const isContinuation = this.allPages.length > 0;
        this.currentPage = this.pdfDoc.addPage(size);
        this.allPages.push(this.currentPage);
        const startY = isContinuation
            ? size[1] - margins.top - TemplateRenderer.CONTINUATION_HEADER_HEIGHT
            : size[1] - margins.top;
        this.renderContext = {
            width: size[0],
            height: size[1],
            margins,
            currentY: startY,
            pageNumber: this.pdfDoc.getPageCount(),
        };
    }
    /**
     * Check if we need new page - accounts for reserved footer space
     */
    needsNewPage(requiredHeight) {
        const { margins } = this.context.options;
        const reservedBottom = margins.bottom + TemplateRenderer.PAGE_FOOTER_HEIGHT;
        return this.renderContext.currentY - requiredHeight < reservedBottom;
    }
    /**
     * Move to new page if needed
     */
    checkPageBreak(requiredHeight) {
        if (this.needsNewPage(requiredHeight)) {
            this.addPage();
        }
    }
    // ==========================================================================
    // DRAWING PRIMITIVES
    // ==========================================================================
    /**
     * Draw text - Optimized
     */
    drawText(text, x, y, options = {}) {
        const { theme } = this.context;
        const size = options.size || theme.fontSize;
        const color = options.color || theme.textColor;
        const fontName = options.bold ? 'Helvetica-Bold' : 'Helvetica';
        // Get font (cached - now returns embedded Chillax fonts)
        const font = this.getFont(fontName);
        // Parse color
        const rgbColor = this.parseColor(color);
        this.currentPage.drawText(text, {
            x,
            y,
            size,
            font,
            color: rgbColor,
        });
    }
    /**
     * Draw rectangle - Optimized
     */
    drawRect(x, y, width, height, options = {}) {
        if (options.fillColor) {
            this.currentPage.drawRectangle({
                x,
                y,
                width,
                height,
                color: this.parseColor(options.fillColor),
            });
        }
        if (options.borderColor && options.borderWidth) {
            this.currentPage.drawRectangle({
                x,
                y,
                width,
                height,
                borderColor: this.parseColor(options.borderColor),
                borderWidth: options.borderWidth,
            });
        }
    }
    /**
     * Draw line - Optimized
     */
    drawLine(x1, y1, x2, y2, options = {}) {
        const { theme } = this.context;
        const color = options.color || theme.borderColor;
        const width = options.width || 1;
        this.currentPage.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            color: this.parseColor(color),
            thickness: width,
        });
    }
    // ==========================================================================
    // QR CODE RENDERING
    // ==========================================================================
    /**
     * Build JSON payload for the invoice header QR code (continuation pages).
     * Contains all key invoice data: id, url, seller, buyer, amounts.
     */
    buildInvoiceQRData() {
        const { invoice, summary, options } = this.context;
        const id = invoice.header.id;
        const baseUrl = options.paymentLink ||
            `https://pay.services.ceo/invoices/${id}`;
        const payload = {
            id,
            url: baseUrl,
            ref: invoice.header.invoiceNumber || id,
            date: invoice.header.invoiceDate.toISOString().split('T')[0],
            total: Math.round(summary.grandTotal * 100) / 100,
            currency: invoice.currency || 'EUR',
            dueDate: this.getDueDate().toISOString().split('T')[0],
            seller: {
                name: invoice.seller.name,
                ...(invoice.seller.vatId && { vat: invoice.seller.vatId }),
                ...(options.sellerSiret && { siret: options.sellerSiret }),
                ...(options.sellerSiren && !options.sellerSiret && { siren: options.sellerSiren }),
                ...(invoice.seller.email && { email: invoice.seller.email }),
                ...(invoice.seller.phone && { phone: invoice.seller.phone }),
                ...(invoice.seller.address && {
                    address: [
                        invoice.seller.address.street,
                        `${invoice.seller.address.postalCode} ${invoice.seller.address.city}`,
                        invoice.seller.address.countryCode,
                    ].filter(Boolean).join(', '),
                }),
            },
            buyer: {
                name: invoice.buyer.name,
                ...(invoice.buyer.vatId && { vat: invoice.buyer.vatId }),
                ...(invoice.buyer.email && { email: invoice.buyer.email }),
                ...(invoice.buyer.phone && { phone: invoice.buyer.phone }),
            },
        };
        return JSON.stringify(payload);
    }
    /**
     * Render a QR code on the current page.
     * @param x - Left X position
     * @param y - Bottom Y position (pdf-lib coordinate system)
     * @param data - String to encode in the QR code
     * @param size - Width/height in points (default 80)
     * @param label - Optional label text below the QR code
     * @param color - QR color hex (default '#1e293b')
     */
    async renderQRCode(x, y, data, size = 80, label, color = '#1e293b') {
        try {
            // @types/qrcode color expects RGBA hex (8 chars); append 'ff' for full opacity
            const darkColor = color.replace('#', '') + 'ff';
            const qrPngBuffer = await qrcode_1.default.toBuffer(data, {
                type: 'png',
                width: 200,
                margin: 1,
                color: { dark: darkColor, light: 'ffffffff' },
                errorCorrectionLevel: 'M',
            });
            const qrImage = await this.pdfDoc.embedPng(qrPngBuffer);
            this.currentPage.drawImage(qrImage, { x, y, width: size, height: size });
        }
        catch {
            // Fallback: placeholder box
            this.currentPage.drawRectangle({
                x, y, width: size, height: size,
                borderColor: this.parseColor('#e2e8f0'),
                borderWidth: 1,
            });
            this.currentPage.drawText('QR', {
                x: x + size / 2 - 8,
                y: y + size / 2 - 5,
                size: 12,
                font: this.getFont('Helvetica-Bold'),
                color: this.parseColor('#94a3b8'),
            });
        }
        if (label) {
            // Scale font size so label text height matches QR code size exactly
            const labelFont = this.getFont('Helvetica');
            const refWidth = labelFont.widthOfTextAtSize(label, 10);
            const labelSize = Math.max(4, Math.min(14, (size * 10) / refWidth));
            this.currentPage.drawText(label, {
                x: x + size + 4,
                y,
                size: labelSize,
                font: labelFont,
                color: this.parseColor('#64748b'),
                rotate: (0, pdf_lib_1.degrees)(90),
            });
        }
    }
    /**
     * Draw continuation headers on pages 2+ (after content is fully rendered).
     * Layout: [Seller info left] [Client summary] [QR] [Invoice# vertical right]
     * Pages 2+ only.
     */
    async drawContinuationPageHeaders() {
        if (this.allPages.length <= 1)
            return;
        const qrData = this.buildInvoiceQRData();
        const { margins, sellerSiret, sellerSiren } = this.context.options;
        const { invoice, summary } = this.context;
        const headerH = TemplateRenderer.CONTINUATION_HEADER_HEIGHT;
        const qrSize = 60;
        const font = this.getFont('Helvetica');
        const fontBold = this.getFont('Helvetica-Bold');
        // Pre-generate QR image once
        let qrImage;
        try {
            const qrPngBuffer = await qrcode_1.default.toBuffer(qrData, {
                type: 'png', width: 200, margin: 1,
                color: { dark: '1e293bff', light: 'ffffffff' },
                errorCorrectionLevel: 'M',
            });
            qrImage = await this.pdfDoc.embedPng(qrPngBuffer);
        }
        catch { /* fallback */ }
        // Pre-load seller logo once (non-blocking)
        const logoImage = await this.loadLogo();
        // Compute invoice# font size once (constant across all pages)
        const invoiceRef = invoice.header.id;
        const textWidthAt10 = fontBold.widthOfTextAtSize(invoiceRef, 10);
        const scaledFontSize = Math.max(4, Math.min(14, (qrSize * 10) / textWidthAt10));
        for (let i = 1; i < this.allPages.length; i++) {
            const page = this.allPages[i];
            const pageWidth = page.getWidth();
            const contentWidth = pageWidth - margins.left - margins.right;
            const pageHeight = page.getHeight();
            const topY = pageHeight - margins.top;
            const bandBottom = topY - headerH;
            // QR: leave room for invoice# (scaledFontSize wide) + 8px gap on the right
            const vertGap = 8;
            const qrX = pageWidth - margins.right - scaledFontSize - vertGap - qrSize;
            const qrY = bandBottom + 5;
            // Invoice# to the RIGHT of QR, with generous gap to avoid overlap
            const vertX = qrX + qrSize + vertGap;
            // Zone widths: seller left, client right-aligned near QR
            const sellerZoneW = contentWidth * 0.34;
            const clientBlockWidth = 175;
            const clientZoneMaxX = qrX - 6;
            const cx = Math.max(margins.left + sellerZoneW + 10, clientZoneMaxX - clientBlockWidth);
            const clientZoneW = Math.max(20, clientZoneMaxX - cx);
            // ── Background band ──
            page.drawRectangle({
                x: margins.left, y: bandBottom,
                width: contentWidth, height: headerH,
                color: this.parseColor('#f8fafc'),
            });
            page.drawLine({
                start: { x: margins.left, y: bandBottom },
                end: { x: pageWidth - margins.right, y: bandBottom },
                color: this.parseColor('#cbd5e1'),
                thickness: 0.5,
            });
            // ── LEFT: Seller info (logo + name + SIRET + TVA) ──
            const sellerX = margins.left + 6;
            let logoW = 0;
            if (logoImage) {
                const maxLogoH = headerH - 14;
                const maxLogoW = Math.round(sellerZoneW * 0.4);
                const dims = logoImage.scaleToFit(maxLogoW, maxLogoH);
                page.drawImage(logoImage, {
                    x: sellerX,
                    y: bandBottom + Math.round((headerH - dims.height) / 2),
                    width: dims.width,
                    height: dims.height,
                });
                logoW = dims.width + 5;
            }
            const stx = sellerX + logoW;
            page.drawText(invoice.seller.name, {
                x: stx, y: topY - 18,
                size: 9, font: fontBold, color: this.parseColor('#1e293b'),
                maxWidth: sellerZoneW - logoW - 4,
            });
            let sellerDetailY = topY - 30;
            if (sellerSiret) {
                page.drawText(`SIRET ${sellerSiret}`, {
                    x: stx, y: sellerDetailY, size: 7, font, color: this.parseColor('#64748b'),
                });
                sellerDetailY -= 11;
            }
            else if (sellerSiren) {
                page.drawText(`SIREN ${sellerSiren}`, {
                    x: stx, y: sellerDetailY, size: 7, font, color: this.parseColor('#64748b'),
                });
                sellerDetailY -= 11;
            }
            if (invoice.seller.vatId) {
                page.drawText(`TVA ${invoice.seller.vatId}`, {
                    x: stx, y: sellerDetailY, size: 7, font, color: this.parseColor('#64748b'),
                });
            }
            // Vertical separator between seller and client zones
            const sep1X = margins.left + sellerZoneW + 2;
            page.drawLine({
                start: { x: sep1X, y: bandBottom + 8 },
                end: { x: sep1X, y: topY - 8 },
                color: this.parseColor('#e2e8f0'),
                thickness: 0.5,
            });
            // ── MIDDLE: Client summary ──
            page.drawText(invoice.buyer.name, {
                x: cx, y: topY - 18,
                size: 9, font: fontBold, color: this.parseColor('#1e293b'),
                maxWidth: clientZoneW,
            });
            page.drawText(`${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`, { x: cx, y: topY - 30, size: 7.5, font, color: this.parseColor('#64748b'), maxWidth: clientZoneW });
            page.drawText(`${this.strings.grandTotal}: ${(0, core_1.formatAmount)(summary.grandTotal)} ${invoice.currency}`, { x: cx, y: topY - 42, size: 8.5, font: fontBold, color: this.parseColor('#1e293b'), maxWidth: clientZoneW });
            page.drawText(`${this.strings.dueDate}: ${this.formatDateFull(this.getDueDate())}`, { x: cx, y: topY - 55, size: 7.5, font, color: this.parseColor('#64748b'), maxWidth: clientZoneW });
            // ── Invoice# vertical: RIGHT of QR, 2px gap, auto-sized to fill qrSize ──
            page.drawText(invoiceRef, {
                x: vertX,
                y: qrY,
                size: scaledFontSize,
                font: fontBold,
                color: this.parseColor('#94a3b8'),
                rotate: (0, pdf_lib_1.degrees)(90),
            });
            // ── QR (left of invoice#) ──
            if (qrImage) {
                page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
            }
            else {
                page.drawRectangle({
                    x: qrX, y: qrY, width: qrSize, height: qrSize,
                    borderColor: this.parseColor('#e2e8f0'), borderWidth: 1,
                });
            }
        }
    }
    // ==========================================================================
    // LOGO RENDERING
    // ==========================================================================
    /**
     * Load and embed logo image (PNG or JPEG).
     * Flattens alpha channel to avoid SMask (PDF/A-3 compliance).
     */
    async loadLogo() {
        if (this.embeddedLogo)
            return this.embeddedLogo;
        const { logoData, logo, logoPath } = this.context.options;
        let data = logoData || logo;
        // Si pas de données inline, tenter de charger depuis logoPath
        if (!data && logoPath) {
            try {
                data = fs_1.default.readFileSync(logoPath);
            }
            catch {
                // Non-bloquant
                data = undefined;
            }
        }
        if (!data)
            return undefined;
        let bytes;
        if (typeof data === 'string' && data.length > 0) {
            bytes = new Uint8Array(Buffer.from(data, 'base64'));
        }
        else if (Buffer.isBuffer(data)) {
            bytes = new Uint8Array(data);
        }
        else {
            return undefined;
        }
        // Flatten alpha to avoid SMask issues (PDF/A-3 compliance)
        const flatBytes = this.flattenImageAlpha(bytes);
        // Detect PNG vs JPEG by magic bytes
        const isPng = flatBytes[0] === 0x89 && flatBytes[1] === 0x50;
        try {
            this.embeddedLogo = isPng
                ? await this.pdfDoc.embedPng(flatBytes)
                : await this.pdfDoc.embedJpg(flatBytes);
        }
        catch {
            // If PNG embed fails (alpha issues), try JPEG fallback
            try {
                this.embeddedLogo = await this.pdfDoc.embedJpg(flatBytes);
            }
            catch {
                console.warn('Failed to embed logo image');
                return undefined;
            }
        }
        return this.embeddedLogo;
    }
    /**
     * Flatten PNG alpha channel by compositing on white background.
     * For JPEG files, returns the bytes unchanged.
     * This prevents SMask entries which violate PDF/A-3.
     */
    flattenImageAlpha(bytes) {
        // Only process PNG files (magic: 89 50 4E 47)
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
        if (!isPng)
            return bytes;
        // For PNG: check if it has alpha by looking at color type in IHDR chunk
        // IHDR is always the first chunk after the 8-byte signature
        // Offset 25 = color type: 4 = grayscale+alpha, 6 = RGBA
        if (bytes.length > 25) {
            const colorType = bytes[25];
            if (colorType !== 4 && colorType !== 6) {
                // No alpha channel, return as-is
                return bytes;
            }
        }
        // PNG has alpha - we return it as-is and let pdf-lib handle it.
        // The real fix is at the template level: avoid using PNG with alpha.
        // If SMask appears, the caller should provide a JPEG or flat PNG.
        return bytes;
    }
    /**
     * Render logo with configurable layout.
     * @param x - Left X position
     * @param y - Top Y position (logo drawn downward)
     * @param maxWidth - Maximum width for the logo
     * @param maxHeight - Maximum height for the logo
     * @returns Height consumed by the logo rendering, or 0 if no logo
     */
    async renderLogo(x, y, maxWidth, maxHeight) {
        const logoLayout = this.context.options.logoLayout || 'none';
        if (logoLayout === 'none')
            return 0;
        const logoImage = await this.loadLogo();
        if (!logoImage)
            return 0;
        // Scale to fit within bounds while preserving aspect ratio
        const imgWidth = logoImage.width;
        const imgHeight = logoImage.height;
        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;
        if (logoLayout === 'above') {
            // Center logo horizontally above the text
            const centerX = x + (maxWidth - drawWidth) / 2;
            this.currentPage.drawImage(logoImage, {
                x: centerX,
                y: y - drawHeight,
                width: drawWidth,
                height: drawHeight,
            });
            return drawHeight + 5; // 5px padding below logo
        }
        else if (logoLayout === 'left') {
            // Logo on the left side
            this.currentPage.drawImage(logoImage, {
                x,
                y: y - drawHeight,
                width: drawWidth,
                height: drawHeight,
            });
            return drawHeight + 5;
        }
        return 0;
    }
    // ==========================================================================
    // TEXT WRAPPING UTILITY
    // ==========================================================================
    /**
     * Wrap text to fit within a given width.
     * Returns array of lines.
     */
    wrapText(text, maxWidth, fontSize) {
        const font = this.getFont('Helvetica');
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines.length > 0 ? lines : [''];
    }
    /**
     * Measure text width using embedded font
     */
    measureTextWidth(text, fontSize, bold = false) {
        const fontName = bold ? 'Helvetica-Bold' : 'Helvetica';
        const font = this.getFont(fontName);
        return font.widthOfTextAtSize(text, fontSize);
    }
    // ==========================================================================
    // COMMON RENDERING HELPERS
    // ==========================================================================
    /**
     * Render header section with optional logo support (logoLayout: 'above' | 'left' | 'none')
     */
    async renderHeader() {
        const { margins } = this.context.options;
        const { theme } = this.context;
        const { width } = this.renderContext;
        const startY = this.renderContext.currentY;
        const invoice = this.context.invoice;
        const logoLayout = this.context.options.logoLayout || 'none';
        // Logo 'above': render logo above the header band, then shift the band down
        let logoConsumedH = 0;
        if (logoLayout === 'above') {
            const contentWidth = width - margins.left - margins.right;
            logoConsumedH = await this.renderLogo(margins.left, startY, contentWidth, 55);
            this.renderContext.currentY -= logoConsumedH;
        }
        const headerTop = this.renderContext.currentY;
        const headerHeight = 95;
        // Draw header background
        this.drawRect(margins.left, headerTop - headerHeight, width - margins.left - margins.right, headerHeight, { fillColor: theme.headerBackground });
        // Logo 'left': render inside the header band, offset text to the right
        let textOffsetX = 0;
        if (logoLayout === 'left') {
            const logoH = await this.renderLogo(margins.left + 10, headerTop - 5, 70, 70);
            if (logoH > 0) {
                textOffsetX = 80;
            }
        }
        // Document title (FACTURE, AVOIR, DEVIS)
        const docTitle = invoice.header.name || this.strings.invoice;
        this.drawText(docTitle, margins.left + 10 + textOffsetX, headerTop - 30, {
            size: 24,
            bold: true,
            color: theme.primaryColor,
        });
        // Document number
        this.drawText(`${this.strings.invoiceNumber}: ${invoice.header.id}`, margins.left + 10 + textOffsetX, headerTop - 55, { size: 11 });
        // Issue date
        const issueDateStr = this.formatInvoiceDateFull();
        this.drawText(`${this.strings.issueDate}: ${issueDateStr}`, margins.left + 10 + textOffsetX, headerTop - 70, { size: 10 });
        // Due date (from payment, header, or default +60 days)
        const dueDateStr = this.formatDateFull(this.getDueDate());
        this.drawText(`${this.strings.dueDate}: ${dueDateStr}`, margins.left + 10 + textOffsetX, headerTop - 85, { size: 10 });
        const totalHeight = logoConsumedH + headerHeight + 10;
        this.renderContext.currentY = startY - totalHeight;
        return {
            height: totalHeight,
            y: startY,
        };
    }
    /**
     * Get due date: from payment, from header, or default to issueDate + 60 days
     */
    getDueDate() {
        const invoice = this.context.invoice;
        // 1. From payment details
        if (invoice.payment?.dueDate) {
            return invoice.payment.dueDate;
        }
        // 2. From document header
        if (invoice.header.dueDate) {
            return invoice.header.dueDate;
        }
        // 3. Default: issue date + 60 days
        const issueDate = invoice.header.invoiceDate;
        const defaultDue = new Date(issueDate.getTime() + 60 * 24 * 60 * 60 * 1000);
        return defaultDue;
    }
    /**
     * Render parties (seller/buyer)
     */
    renderParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const halfWidth = (width - margins.left - margins.right) / 2;
        // Seller
        this.drawText(this.strings.seller, margins.left, startY, {
            size: 12,
            bold: true,
        });
        this.drawText(invoice.seller.name, margins.left, startY - 20, { size: 10 });
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            let y = startY - 35;
            if (addr.street) {
                this.drawText(addr.street, margins.left, y, { size: 9 });
                y -= 12;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, margins.left, y, { size: 9 });
            y -= 12;
            this.drawText(addr.countryCode, margins.left, y, { size: 9 });
        }
        // VAT and SIREN/SIRET for the seller
        let sellerLegalY = startY - 80;
        if (invoice.seller.vatId) {
            this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left, sellerLegalY, { size: 9 });
            sellerLegalY -= 12;
        }
        const { sellerSiret, sellerSiren } = this.context.options;
        if (sellerSiret) {
            this.drawText(`SIRET: ${sellerSiret}`, margins.left, sellerLegalY, { size: 9 });
        }
        else if (sellerSiren) {
            this.drawText(`SIREN: ${sellerSiren}`, margins.left, sellerLegalY, { size: 9 });
        }
        // Buyer
        const buyerX = margins.left + halfWidth + 20;
        this.drawText(this.strings.buyer, buyerX, startY, {
            size: 12,
            bold: true,
        });
        this.drawText(invoice.buyer.name, buyerX, startY - 20, { size: 10 });
        if (invoice.buyer.address) {
            const addr = invoice.buyer.address;
            let y = startY - 35;
            if (addr.street) {
                this.drawText(addr.street, buyerX, y, { size: 9 });
                y -= 12;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, buyerX, y, { size: 9 });
            y -= 12;
            this.drawText(addr.countryCode, buyerX, y, { size: 9 });
        }
        if (invoice.buyer.vatId) {
            this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX, startY - 80, { size: 9 });
        }
        this.renderContext.currentY -= 110;
        return {
            height: 110,
            y: startY,
        };
    }
    /**
     * Render line items table
     */
    renderLineItems() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { theme, invoice } = this.context;
        const startY = this.renderContext.currentY;
        const tableWidth = width - margins.left - margins.right;
        const colWidths = {
            description: tableWidth * 0.4,
            quantity: tableWidth * 0.15,
            unitPrice: tableWidth * 0.2,
            vatRate: tableWidth * 0.1,
            total: tableWidth * 0.15,
        };
        // Table header
        this.drawRect(margins.left, startY - 25, tableWidth, 25, {
            fillColor: theme.tableHeaderBackground,
        });
        let x = margins.left + 5;
        const headerColor = theme.primaryColor;
        this.drawText(this.strings.description, x, startY - 18, { bold: true, size: 9, color: headerColor });
        x += colWidths.description;
        this.drawText(this.strings.quantity, x, startY - 18, { bold: true, size: 9, color: headerColor });
        x += colWidths.quantity;
        this.drawText(this.strings.unitPrice, x, startY - 18, { bold: true, size: 9, color: headerColor });
        x += colWidths.unitPrice;
        this.drawText(this.strings.vatRate, x, startY - 18, { bold: true, size: 9, color: headerColor });
        x += colWidths.vatRate;
        this.drawText(this.strings.lineTotal, x, startY - 18, { bold: true, size: 9, color: headerColor });
        let y = startY - 25;
        const descFontSize = 9;
        const descMaxWidth = colWidths.description - 8;
        const lineSpacing = 12;
        const minRowHeight = 20;
        // Lines
        for (let i = 0; i < invoice.lines.length; i++) {
            const line = invoice.lines[i];
            // Compute wrapped lines to determine row height
            const descLines = this.wrapText(line.description, descMaxWidth, descFontSize);
            const textHeight = descLines.length * lineSpacing;
            const rowHeight = Math.max(minRowHeight, textHeight + 8);
            // CRITICAL: sync renderContext.currentY with local y before page break check
            this.renderContext.currentY = y;
            const pageBefore = this.renderContext.pageNumber;
            this.checkPageBreak(rowHeight + 5);
            if (this.renderContext.pageNumber > pageBefore) {
                // New page actually created - redraw header
                y = this.renderContext.currentY;
                this.drawRect(margins.left, y - 25, tableWidth, 25, {
                    fillColor: theme.tableHeaderBackground,
                });
                let hx = margins.left + 5;
                this.drawText(this.strings.description, hx, y - 18, { bold: true });
                hx += colWidths.description;
                this.drawText(this.strings.quantity, hx, y - 18, { bold: true });
                hx += colWidths.quantity;
                this.drawText(this.strings.unitPrice, hx, y - 18, { bold: true });
                hx += colWidths.unitPrice;
                this.drawText(this.strings.vatRate, hx, y - 18, { bold: true });
                hx += colWidths.vatRate;
                this.drawText(this.strings.lineTotal, hx, y - 18, { bold: true });
                y -= 25;
            }
            // Alternate row colors
            const bgColor = i % 2 === 0 ? theme.tableRowEvenBackground : theme.tableRowOddBackground;
            this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, {
                fillColor: bgColor,
            });
            // Draw description: multi-line rendering
            x = margins.left + 5;
            let descY = y - 13;
            for (const descLine of descLines) {
                this.drawText(descLine, x, descY, { size: descFontSize });
                descY -= lineSpacing;
            }
            // Other columns: vertically centered
            const colY = y - Math.round(rowHeight / 2) - 4;
            x = margins.left + 5 + colWidths.description;
            this.drawText(String(line.quantity), x, colY, { size: 9 });
            x += colWidths.quantity;
            this.drawText((0, core_1.formatAmount)(line.unitPrice) + ' ' + this.currencySymbol, x, colY, { size: 9 });
            x += colWidths.unitPrice;
            this.drawText((0, core_1.formatAmount)(line.vatRate * 100) + '%', x, colY, { size: 9 });
            x += colWidths.vatRate;
            this.drawText((0, core_1.formatAmount)(line.lineTotal) + ' ' + this.currencySymbol, x, colY, { size: 9 });
            y -= rowHeight;
        }
        this.renderContext.currentY = y - 10;
        return {
            height: startY - y,
            y: startY,
        };
    }
    /**
     * Render totals section
     */
    renderTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const totalsX = width - margins.right - 200;
        let y = startY;
        // Subtotal
        this.drawText(this.strings.subtotal, totalsX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.lineTotal) + ' ' + this.currencySymbol, totalsX + 120, y, { size: 10 });
        y -= 20;
        // Tax total
        this.drawText(this.strings.taxTotal, totalsX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.taxTotal) + ' ' + this.currencySymbol, totalsX + 120, y, { size: 10 });
        y -= 25;
        // Grand total
        this.drawText(this.strings.grandTotal, totalsX, y, { size: 12, bold: true });
        this.drawText((0, core_1.formatAmount)(summary.grandTotal) + ' ' + this.currencySymbol, totalsX + 120, y, {
            size: 12,
            bold: true,
        });
        this.renderContext.currentY = y - 20;
        return {
            height: startY - y,
            y: startY,
        };
    }
    // ==========================================================================
    // DATE FORMATTING
    // ==========================================================================
    /**
     * Format date in full locale format (e.g., "2 mars 2026" for fr)
     */
    formatDateFull(date) {
        const lang = this.context.options.language || 'fr';
        const localeMap = {
            fr: 'fr-FR',
            en: 'en-GB',
            de: 'de-DE',
            es: 'es-ES',
        };
        const locale = localeMap[lang] || 'fr-FR';
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
    /**
     * Get the generation date text (e.g., "Document généré le 2 mars 2026")
     */
    getGeneratedDateText() {
        return `${this.strings.generatedOn} ${this.formatDateFull(this.context.generatedAt)}`;
    }
    /**
     * Format invoice date in full locale format
     */
    formatInvoiceDateFull() {
        return this.formatDateFull(this.context.invoice.header.invoiceDate);
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Get font - Cached
     */
    /**
     * Load embedded Chillax fonts (PDF/A-3 compliance)
     */
    async loadEmbeddedFonts() {
        if (this.chillaxFonts) {
            return; // Already loaded
        }
        const fontFiles = await (0, PDFA3Compliance_1.loadChillaxFonts)();
        const regular = await this.pdfDoc.embedFont(fontFiles.regular);
        const bold = await this.pdfDoc.embedFont(fontFiles.bold);
        this.chillaxFonts = { regular, bold };
        // Pre-populate font cache with embedded fonts
        this.fontCache.set('Helvetica', regular);
        this.fontCache.set('Helvetica-Bold', bold);
        this.fontCache.set('Times-Roman', regular);
        this.fontCache.set('Times-Bold', bold);
        this.fontCache.set('Courier', regular);
        this.fontCache.set('Courier-Bold', bold);
    }
    /**
     * Get font - now returns embedded Chillax fonts
     */
    getFont(fontName) {
        // All standard font requests are mapped to embedded Chillax fonts
        if (!this.fontCache.has(fontName)) {
            // Default to regular if font not found
            return this.chillaxFonts?.regular || this.fontCache.get('Helvetica');
        }
        return this.fontCache.get(fontName);
    }
    /**
     * Parse color string to RGB
     */
    parseColor(color) {
        // Simple hex color parser
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return (0, pdf_lib_1.rgb)(r, g, b);
    }
    /**
     * Get page size
     */
    getPageSize(format) {
        switch (format) {
            case 'A4':
                return [595.28, 841.89]; // Points
            case 'Letter':
                return [612, 792];
            case 'Legal':
                return [612, 1008];
            default:
                return [595.28, 841.89];
        }
    }
    /**
     * Merge options with defaults
     */
    mergeOptions(options) {
        return {
            theme: options.theme || {},
            logo: options.logo || '',
            showLogo: options.showLogo ?? false,
            logoLayout: options.logoLayout || 'none',
            logoData: options.logoData || '',
            logoPath: options.logoPath || '',
            showWatermark: options.showWatermark ?? false,
            watermarkText: options.watermarkText || 'DRAFT',
            showQRCode: options.showQRCode ?? false,
            qrCodeData: options.qrCodeData || '',
            pageFormat: options.pageFormat || 'A4',
            margins: options.margins || { top: 50, right: 50, bottom: 50, left: 50 },
            language: options.language || 'fr',
            showLineNumbers: options.showLineNumbers ?? true,
            showTaxBreakdown: options.showTaxBreakdown ?? true,
            showPaymentTerms: options.showPaymentTerms ?? true,
            customFooter: options.customFooter || '',
            sellerSiren: options.sellerSiren || '',
            sellerSiret: options.sellerSiret || '',
            showDeliveryAddress: options.showDeliveryAddress ?? false,
            paymentLink: options.paymentLink || '',
            isDraft: options.isDraft ?? false,
            paymentStatus: options.paymentStatus || 'PENDING',
            validateBeforeGeneration: options.validateBeforeGeneration ?? true,
            validateAfterGeneration: options.validateAfterGeneration ?? true,
            strictValidation: options.strictValidation ?? false,
        };
    }
    /**
     * Merge theme with defaults
     */
    mergeTheme(theme) {
        return {
            ...types_1.DEFAULT_THEME,
            ...theme,
        };
    }
    /**
     * Add PDF metadata
     */
    addMetadata() {
        const { invoice } = this.context;
        this.pdfDoc.setTitle(`Invoice ${invoice.header.id}`);
        this.pdfDoc.setAuthor(invoice.seller.name);
        this.pdfDoc.setSubject(`Factur-X Invoice ${invoice.header.id}`);
        this.pdfDoc.setKeywords(['invoice', 'factur-x', 'zugferd', 'electronic']);
        this.pdfDoc.setProducer('@facturx/templates');
        this.pdfDoc.setCreator('@facturx/core');
        this.pdfDoc.setCreationDate(this.context.generatedAt);
        this.pdfDoc.setModificationDate(this.context.generatedAt);
    }
    /**
     * Attach Factur-X XML to PDF - Returns XML content for validation
     */
    async attachFacturXml() {
        const { invoice } = this.context;
        const xml = invoice.generateXml(true);
        // Manually attach the file with AFRelationship for PDF/A-3 compliance
        await (0, AFRelationshipFix_1.attachFileWithAFRelationship)(this.pdfDoc, Buffer.from(xml, 'utf-8'), 'factur-x.xml', {
            mimeType: 'text/xml',
            description: 'Factur-X XML Invoice',
            creationDate: this.context.generatedAt,
            modificationDate: this.context.generatedAt,
            relationship: 'Data', // PDF/A-3 requirement for Factur-X
        });
        return xml;
    }
}
exports.TemplateRenderer = TemplateRenderer;
// ==========================================================================
// PAGE FOOTER SYSTEM
// ==========================================================================
/** Height reserved at bottom of every page for the page footer */
TemplateRenderer.PAGE_FOOTER_HEIGHT = 40;
/** Height reserved at top of continuation pages (page 2+) for the recap header */
TemplateRenderer.CONTINUATION_HEADER_HEIGHT = 70;
//# sourceMappingURL=TemplateRenderer.js.map