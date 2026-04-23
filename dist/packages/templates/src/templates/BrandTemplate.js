"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandTemplate = void 0;
const core_1 = require("../../../core/src");
const TemplateRenderer_1 = require("../core/TemplateRenderer");
const types_1 = require("../types");
class BrandTemplate extends TemplateRenderer_1.TemplateRenderer {
    getTemplateType() {
        return types_1.TemplateType.BRAND;
    }
    async renderContent() {
        await this.renderBrandHeader();
        this.renderContext.currentY -= 25;
        this.renderBrandParties();
        this.renderContext.currentY -= 20;
        this.renderBrandLineItems();
        this.renderContext.currentY -= 15;
        this.checkPageBreak(120);
        await this.renderPaymentAndTotals();
        if (this.context.options.showTaxBreakdown) {
            this.renderContext.currentY -= 15;
            this.checkPageBreak(60);
            this.renderTaxBreakdown();
        }
        // Page footer drawn automatically by base TemplateRenderer
    }
    // ===========================================================================
    // HEADER
    // ===========================================================================
    async renderBrandHeader() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const invoice = this.context.invoice;
        const logoLayout = this.context.options.logoLayout || 'none';
        const contentWidth = width - margins.left - margins.right;
        // Step 1: Handle 'above' logo — render before background, shift currentY down
        let logoConsumedH = 0;
        if (logoLayout === 'above') {
            logoConsumedH = await this.renderLogo(margins.left, this.renderContext.currentY, contentWidth, 55);
            this.renderContext.currentY -= logoConsumedH;
        }
        const headerTop = this.renderContext.currentY;
        const headerHeight = 100;
        // Navy background
        this.drawRect(margins.left, headerTop - headerHeight, contentWidth, headerHeight, { fillColor: '#0d2f5e' });
        // Orange accent stripe at top
        this.drawRect(margins.left, headerTop - 8, contentWidth, 8, { fillColor: '#ff6600' });
        // Step 2: Handle 'left' logo — render inside band, compute text offset
        let textOffsetX = 0;
        if (logoLayout === 'left') {
            const logoH = await this.renderLogo(margins.left + 10, headerTop - 5, 70, 80);
            if (logoH > 0)
                textOffsetX = 80;
        }
        // Seller company name (dynamic, not placeholder)
        this.drawText(invoice.seller.name, margins.left + 20 + textOffsetX, headerTop - 35, {
            size: 20, bold: true, color: '#ffffff',
        });
        // Orange underline
        this.drawLine(margins.left + 20 + textOffsetX, headerTop - 42, margins.left + 220 + textOffsetX, headerTop - 42, { color: '#ff6600', width: 2 });
        // Document title on right side (FACTURE / AVOIR / DEVIS)
        const docTitle = invoice.header.name || this.strings.invoice;
        const rightX = width - margins.right - 200;
        this.drawText(docTitle, rightX, headerTop - 25, {
            size: 22, bold: true, color: '#ff6600',
        });
        // Number
        this.drawText(`${this.strings.invoiceNumber}: ${invoice.header.id}`, rightX, headerTop - 48, { size: 10, color: '#ffffff' });
        // Issue date
        this.drawText(`${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`, rightX, headerTop - 63, { size: 9, color: '#ffffff' });
        // Due date
        this.drawText(`${this.strings.dueDate}: ${this.formatDateFull(this.getDueDate())}`, rightX, headerTop - 78, { size: 9, color: '#ffffff' });
        this.renderContext.currentY = headerTop - headerHeight - 10;
    }
    // ===========================================================================
    // PARTIES
    // ===========================================================================
    renderBrandParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const halfWidth = (width - margins.left - margins.right) / 2 - 10;
        const titleH = 22;
        const contentH = 88;
        const totalH = titleH + contentH;
        // --- SELLER ---
        // Full outer border
        this.drawRect(margins.left, startY - totalH, halfWidth, totalH, {
            borderColor: '#0d2f5e', borderWidth: 1,
        });
        // Title bar (inside top)
        this.drawRect(margins.left, startY - titleH, halfWidth, titleH, { fillColor: '#0d2f5e' });
        this.drawText(this.strings.seller, margins.left + 10, startY - 15, {
            size: 11, bold: true, color: '#ffffff',
        });
        // Content background (inside bottom)
        this.drawRect(margins.left, startY - totalH, halfWidth, contentH, { fillColor: '#f5f5f5' });
        let y = startY - titleH - 16;
        this.drawText(invoice.seller.name, margins.left + 10, y, { size: 11, bold: true, color: '#0d2f5e' });
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            y -= 18;
            if (addr.street) {
                this.drawText(addr.street, margins.left + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, margins.left + 10, y, { size: 9 });
        }
        // VAT bottom-left of seller content
        let vatY = startY - totalH + 22;
        if (invoice.seller.vatId) {
            this.drawText(`TVA: ${invoice.seller.vatId}`, margins.left + 10, vatY, { size: 9, color: '#4d4d4d' });
            vatY -= 12;
        }
        // SIREN / SIRET after VAT
        const { sellerSiret, sellerSiren } = this.context.options;
        if (sellerSiret) {
            this.drawText(`SIRET: ${sellerSiret}`, margins.left + 10, vatY, { size: 8, color: '#4d4d4d' });
        }
        else if (sellerSiren) {
            this.drawText(`SIREN: ${sellerSiren}`, margins.left + 10, vatY, { size: 8, color: '#4d4d4d' });
        }
        // --- BUYER ---
        const buyerX = margins.left + halfWidth + 20;
        // Full outer border
        this.drawRect(buyerX, startY - totalH, halfWidth, totalH, {
            borderColor: '#ff6600', borderWidth: 1,
        });
        // Title bar
        this.drawRect(buyerX, startY - titleH, halfWidth, titleH, { fillColor: '#ff6600' });
        this.drawText(this.strings.buyer, buyerX + 10, startY - 15, {
            size: 11, bold: true, color: '#ffffff',
        });
        // Content background
        this.drawRect(buyerX, startY - totalH, halfWidth, contentH, { fillColor: '#f5f5f5' });
        y = startY - titleH - 16;
        this.drawText(invoice.buyer.name, buyerX + 10, y, { size: 11, bold: true, color: '#ff6600' });
        if (invoice.buyer.address) {
            const addr = invoice.buyer.address;
            y -= 18;
            if (addr.street) {
                this.drawText(addr.street, buyerX + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, buyerX + 10, y, { size: 9 });
        }
        if (invoice.buyer.vatId) {
            this.drawText(`TVA: ${invoice.buyer.vatId}`, buyerX + 10, startY - totalH + 10, { size: 9, color: '#4d4d4d' });
        }
        this.renderContext.currentY -= totalH + 10;
    }
    // ===========================================================================
    // LINE ITEMS
    // ===========================================================================
    renderBrandLineItems() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const tableWidth = width - margins.left - margins.right;
        const colWidths = {
            description: tableWidth * 0.4,
            quantity: tableWidth * 0.12,
            unitPrice: tableWidth * 0.18,
            vatRate: tableWidth * 0.12,
            total: tableWidth * 0.18,
        };
        // Table header
        this.drawRect(margins.left, startY - 26, tableWidth, 26, { fillColor: '#0d2f5e' });
        const drawTableHeader = (y) => {
            let hx = margins.left + 8;
            this.drawText(this.strings.description, hx, y - 17, { bold: true, color: '#ffffff', size: 9 });
            hx += colWidths.description;
            this.drawText(this.strings.quantity, hx, y - 17, { bold: true, color: '#ffffff', size: 9 });
            hx += colWidths.quantity;
            this.drawText(this.strings.unitPrice, hx, y - 17, { bold: true, color: '#ffffff', size: 9 });
            hx += colWidths.unitPrice;
            this.drawText(this.strings.vatRate, hx, y - 17, { bold: true, color: '#ffffff', size: 9 });
            hx += colWidths.vatRate;
            this.drawText(this.strings.lineTotal, hx, y - 17, { bold: true, color: '#ffffff', size: 9 });
        };
        drawTableHeader(startY);
        let y = startY - 26;
        const descFontSize = 9;
        const descMaxWidth = colWidths.description - 16; // 8px padding each side
        const lineSpacing = 12;
        const minRowHeight = 20;
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
                y = this.renderContext.currentY;
                this.drawRect(margins.left, y - 26, tableWidth, 26, { fillColor: '#0d2f5e' });
                drawTableHeader(y);
                y -= 26;
            }
            const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
            this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, { fillColor: bgColor });
            this.drawLine(margins.left, y - rowHeight, margins.left + tableWidth, y - rowHeight, { color: '#e0e0e0', width: 0.5 });
            // Description: multi-line rendering
            let descY = y - 14;
            for (const descLine of descLines) {
                this.drawText(descLine, margins.left + 8, descY, { size: descFontSize });
                descY -= lineSpacing;
            }
            // Other columns: vertically centered
            const colY = y - Math.round(rowHeight / 2) - 4;
            let x = margins.left + 8 + colWidths.description;
            this.drawText(String(line.quantity), x, colY, { size: 9 });
            x += colWidths.quantity;
            this.drawText((0, core_1.formatAmount)(line.unitPrice) + ' ' + this.currencySymbol, x, colY, { size: 9 });
            x += colWidths.unitPrice;
            this.drawText(`${(0, core_1.formatAmount)(line.vatRate * 100)}%`, x, colY, { size: 9 });
            x += colWidths.vatRate;
            this.drawText((0, core_1.formatAmount)(line.lineTotal) + ' ' + this.currencySymbol, x, colY, { size: 9, bold: true, color: '#0d2f5e' });
            y -= rowHeight;
        }
        this.renderContext.currentY = y - 10;
    }
    // ===========================================================================
    // PAYMENT (left) + TOTALS (right) - Side by side
    // ===========================================================================
    async renderPaymentAndTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice, summary } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const leftW = contentWidth * 0.48;
        const rightX = margins.left + contentWidth * 0.52;
        const rightW = contentWidth * 0.48;
        // ---- LEFT: Payment info with navy title bar ----
        if (this.context.options.showPaymentTerms) {
            this.drawRect(margins.left, startY - 20, leftW, 20, { fillColor: '#0d2f5e' });
            this.drawText(this.strings.paymentTerms, margins.left + 10, startY - 13, {
                size: 10, bold: true, color: '#ffffff',
            });
            let py = startY - 35;
            if (invoice.payment) {
                if (invoice.payment.iban) {
                    this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 10, py, { size: 8 });
                    py -= 14;
                }
                if (invoice.payment.bic) {
                    this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 10, py, { size: 8 });
                    py -= 14;
                }
                if (invoice.payment.dueDate) {
                    this.drawText(`${this.strings.dueDate}: ${this.formatDateFull(invoice.payment.dueDate)}`, margins.left + 10, py, { size: 8, color: '#ff6600', bold: true });
                    py -= 14;
                }
                if (invoice.payment.termsDescription) {
                    this.drawText(invoice.payment.termsDescription, margins.left + 10, py, { size: 8 });
                    py -= 14;
                }
            }
            // QR paiement
            const paymentLink = this.context.options.paymentLink ||
                `https://pay.services.ceo/invoices/${this.context.invoice.header.id}`;
            const qrSize = 80;
            const qrX = margins.left + 10;
            const minY = margins.bottom + TemplateRenderer_1.TemplateRenderer.PAGE_FOOTER_HEIGHT + 14;
            const qrY = Math.max(py - qrSize, minY);
            await this.renderQRCode(qrX, qrY, paymentLink, qrSize, this.strings.scanToPay, '#0d2f5e');
        }
        // ---- RIGHT: Totals with orange highlight ----
        let y = startY - 15;
        this.drawText(this.strings.subtotal, rightX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.lineTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 10 });
        this.drawLine(rightX, y - 5, rightX + rightW, y - 5, { color: '#cccccc', width: 0.5 });
        y -= 22;
        this.drawText(this.strings.taxTotal, rightX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.taxTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 10 });
        y -= 28;
        this.drawRect(rightX - 5, y - 10, rightW + 5, 30, { fillColor: '#ff6600' });
        this.drawText(this.strings.grandTotal, rightX, y, { size: 13, bold: true, color: '#ffffff' });
        this.drawText((0, core_1.formatAmount)(summary.grandTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 13, bold: true, color: '#ffffff' });
        this.renderContext.currentY = y - 20;
    }
    // ===========================================================================
    // TAX BREAKDOWN - right-aligned below totals
    // ===========================================================================
    renderTaxBreakdown() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const rightX = margins.left + contentWidth * 0.52;
        this.drawText(this.strings.taxBreakdown, rightX, startY, { size: 10, bold: true, color: '#0d2f5e' });
        let y = startY - 18;
        this.drawText(this.strings.vatRate, rightX, y, { size: 8, bold: true, color: '#666666' });
        this.drawText(this.strings.taxBase, rightX + 60, y, { size: 8, bold: true, color: '#666666' });
        this.drawText(this.strings.taxAmount, rightX + 140, y, { size: 8, bold: true, color: '#666666' });
        y -= 16;
        for (const taxSum of summary.taxSummaries) {
            this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9 });
            this.drawText((0, core_1.formatAmount)(taxSum.taxable) + ' ' + this.currencySymbol, rightX + 60, y, { size: 9 });
            this.drawText((0, core_1.formatAmount)(taxSum.taxAmount) + ' ' + this.currencySymbol, rightX + 140, y, { size: 9, color: '#ff6600' });
            y -= 14;
        }
        this.renderContext.currentY = y - 10;
    }
    // ===========================================================================
    // CUSTOM FOOTER - Navy/Orange brand style
    // ===========================================================================
    drawSinglePageFooter(page, pageNum, totalPages) {
        const { margins } = this.context.options;
        const pageWidth = 595.28;
        const footerH = 40;
        const footerTop = margins.bottom + footerH;
        const contentW = pageWidth - margins.left - margins.right;
        const font = this.getFont('Helvetica');
        const fontBold = this.getFont('Helvetica-Bold');
        const white = this.parseColor('#ffffff');
        const navy = this.parseColor('#0d2f5e');
        const orange = this.parseColor('#ff6600');
        // Generation date above bar
        page.drawText(this.getGeneratedDateText(), {
            x: margins.left + 15, y: footerTop - 2,
            size: 7, font: fontBold, color: navy,
        });
        // Navy bar
        page.drawRectangle({
            x: margins.left, y: margins.bottom,
            width: contentW, height: footerH - 12,
            color: navy,
        });
        // Orange accent stripe at bottom
        page.drawRectangle({
            x: margins.left, y: margins.bottom,
            width: contentW, height: 4,
            color: orange,
        });
        // Page number (white on navy)
        page.drawText(`${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`, {
            x: margins.left + 15, y: margins.bottom + 10,
            size: 8, font, color: white,
        });
        // Powered by (orange on navy)
        page.drawText('@facturx/templates', {
            x: pageWidth - margins.right - 130, y: margins.bottom + 10,
            size: 8, font, color: orange,
        });
    }
}
exports.BrandTemplate = BrandTemplate;
//# sourceMappingURL=BrandTemplate.js.map