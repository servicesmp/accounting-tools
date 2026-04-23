"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FancyTemplate = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const core_1 = require("@facturx/core");
const TemplateRenderer_1 = require("../core/TemplateRenderer");
const types_1 = require("../types");
const SUMMARY_BLOCK_HEIGHT = 260;
class FancyTemplate extends TemplateRenderer_1.TemplateRenderer {
    getTemplateType() {
        return types_1.TemplateType.FANCY;
    }
    async renderContent() {
        await this.renderFancyHeader();
        this.renderContext.currentY -= 25;
        this.renderFancyParties();
        this.renderContext.currentY -= 20;
        this.renderFancyLineItems();
        this.renderContext.currentY -= 15;
        this.checkPageBreak(SUMMARY_BLOCK_HEIGHT);
        await this.renderPaymentAndTotals();
        if (this.context.options.showTaxBreakdown) {
            this.renderContext.currentY -= 15;
            this.renderFancyTaxBreakdown();
        }
    }
    async renderFancyHeader() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const startY = this.renderContext.currentY;
        const invoice = this.context.invoice;
        const logoLayout = this.context.options.logoLayout || 'none';
        let logoHeight = 0;
        if (logoLayout === 'above') {
            const contentWidth = width - margins.left - margins.right;
            logoHeight = await this.renderLogo(margins.left, startY, contentWidth, 60);
        }
        const headerTop = startY - logoHeight;
        const headerHeight = 110;
        this.drawRect(margins.left, headerTop - headerHeight, width - margins.left - margins.right, headerHeight, { fillColor: '#db2777' });
        this.drawRect(width - margins.right - 150, headerTop - headerHeight, 150, headerHeight, { fillColor: '#3b82f6' });
        let textOffsetX = 0;
        if (logoLayout === 'left') {
            const logoH = await this.renderLogo(margins.left + 10, headerTop - 5, 80, 80);
            if (logoH > 0) {
                textOffsetX = 90;
            }
        }
        const docTitle = invoice.header.name || this.strings.invoice;
        this.drawText(docTitle, margins.left + 20 + textOffsetX, headerTop - 30, {
            size: 32, bold: true, color: '#ffffff',
        });
        this.drawText(`${this.strings.invoiceNumber}: ${invoice.header.id}`, margins.left + 20 + textOffsetX, headerTop - 55, { size: 11, color: '#ffffff' });
        this.drawText(`${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`, margins.left + 20 + textOffsetX, headerTop - 72, { size: 10, color: '#ffffff' });
        this.drawText(`${this.strings.dueDate}: ${this.formatDateFull(this.getDueDate())}`, margins.left + 20 + textOffsetX, headerTop - 87, { size: 10, color: '#ffffff' });
        this.renderContext.currentY = headerTop - headerHeight - 10;
    }
    renderFancyParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const halfWidth = (width - margins.left - margins.right) / 2 - 10;
        this.drawRect(margins.left, startY - 120, halfWidth, 120, { fillColor: '#fce7f3', borderColor: '#db2777', borderWidth: 2 });
        this.drawText(this.strings.seller, margins.left + 10, startY - 20, {
            size: 12, bold: true, color: '#db2777',
        });
        this.drawText(invoice.seller.name, margins.left + 10, startY - 38, {
            size: 11, bold: true,
        });
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            let y = startY - 55;
            if (addr.street) {
                this.drawText(addr.street, margins.left + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, margins.left + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, margins.left + 10, y, { size: 9 });
        }
        let sellerInfoY = startY - 97;
        if (invoice.seller.vatId) {
            this.drawText(`${this.strings.vatNumber}: ${invoice.seller.vatId}`, margins.left + 10, sellerInfoY, { size: 9, color: '#6b7280' });
            sellerInfoY -= 12;
        }
        const { sellerSiren, sellerSiret } = this.context.options;
        if (sellerSiret) {
            this.drawText(`SIRET: ${sellerSiret}`, margins.left + 10, sellerInfoY, { size: 8, color: '#6b7280' });
        }
        else if (sellerSiren) {
            this.drawText(`SIREN: ${sellerSiren}`, margins.left + 10, sellerInfoY, { size: 8, color: '#6b7280' });
        }
        const buyerX = margins.left + halfWidth + 20;
        this.drawRect(buyerX, startY - 120, halfWidth, 120, { fillColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 });
        this.drawText(this.strings.buyer, buyerX + 10, startY - 20, {
            size: 12, bold: true, color: '#3b82f6',
        });
        this.drawText(invoice.buyer.name, buyerX + 10, startY - 38, {
            size: 11, bold: true,
        });
        if (invoice.buyer.address) {
            const addr = invoice.buyer.address;
            let y = startY - 55;
            if (addr.street) {
                this.drawText(addr.street, buyerX + 10, y, { size: 9 });
                y -= 14;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, buyerX + 10, y, { size: 9 });
            y -= 14;
            this.drawText(addr.countryCode, buyerX + 10, y, { size: 9 });
        }
        if (invoice.buyer.vatId) {
            this.drawText(`${this.strings.vatNumber}: ${invoice.buyer.vatId}`, buyerX + 10, startY - 105, { size: 9, color: '#6b7280' });
        }
        this.renderContext.currentY -= 130;
    }
    renderFancyLineItems() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const tableWidth = width - margins.left - margins.right;
        const colWidths = {
            description: tableWidth * 0.40,
            quantity: tableWidth * 0.12,
            unitPrice: tableWidth * 0.18,
            vatRate: tableWidth * 0.12,
            total: tableWidth * 0.18,
        };
        const drawTableHeader = (y) => {
            this.drawRect(margins.left, y - 28, tableWidth, 28, { fillColor: '#3b82f6' });
            let hx = margins.left + 8;
            this.drawText(this.strings.description, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
            hx += colWidths.description;
            this.drawText(this.strings.quantity, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
            hx += colWidths.quantity;
            this.drawText(this.strings.unitPrice, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
            hx += colWidths.unitPrice;
            this.drawText(this.strings.vatRate, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
            hx += colWidths.vatRate;
            this.drawText(this.strings.lineTotal, hx, y - 18, { bold: true, color: '#ffffff', size: 10 });
        };
        let y = this.renderContext.currentY;
        drawTableHeader(y);
        y -= 28;
        const descFontSize = 9;
        const descMaxWidth = colWidths.description - 16;
        const lineSpacing = 12;
        const minRowHeight = 22;
        for (let i = 0; i < invoice.lines.length; i++) {
            const line = invoice.lines[i];
            const descLines = this.wrapText(line.description, descMaxWidth, descFontSize);
            const textHeight = descLines.length * lineSpacing;
            const rowHeight = Math.max(minRowHeight, textHeight + 8);
            this.renderContext.currentY = y;
            const isLastItem = i === invoice.lines.length - 1;
            const neededAfter = isLastItem ? rowHeight + 15 + SUMMARY_BLOCK_HEIGHT : rowHeight + 5;
            const pageBefore = this.renderContext.pageNumber;
            this.checkPageBreak(neededAfter);
            if (this.renderContext.pageNumber > pageBefore) {
                y = this.renderContext.currentY;
                drawTableHeader(y);
                y -= 28;
            }
            const bgColor = i % 2 === 0 ? '#fce7f3' : '#eff6ff';
            this.drawRect(margins.left, y - rowHeight, tableWidth, rowHeight, { fillColor: bgColor });
            let descY = y - 14;
            for (const descLine of descLines) {
                this.drawText(descLine, margins.left + 8, descY, { size: descFontSize });
                descY -= lineSpacing;
            }
            const colY = y - (rowHeight / 2) - 4;
            let x = margins.left + 8 + colWidths.description;
            this.drawText(String(line.quantity), x, colY, { size: 9 });
            x += colWidths.quantity;
            this.drawText((0, core_1.formatAmount)(line.unitPrice) + ' ' + this.currencySymbol, x, colY, { size: 9 });
            x += colWidths.unitPrice;
            this.drawText(`${(0, core_1.formatAmount)(line.vatRate * 100)}%`, x, colY, { size: 9 });
            x += colWidths.vatRate;
            this.drawText((0, core_1.formatAmount)(line.lineTotal) + ' ' + this.currencySymbol, x, colY, { size: 9, bold: true });
            y -= rowHeight;
        }
        this.renderContext.currentY = y - 10;
    }
    async renderPaymentAndTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice, summary } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const rightX = margins.left + contentWidth * 0.52;
        const rightW = contentWidth * 0.48;
        if (this.context.options.showPaymentTerms) {
            this.drawText(this.strings.paymentTerms, margins.left, startY, {
                size: 11, bold: true, color: '#3b82f6',
            });
            let py = startY - 20;
            if (invoice.payment) {
                if (invoice.payment.iban) {
                    this.drawText(`${this.strings.iban}: ${invoice.payment.iban}`, margins.left + 5, py, { size: 9 });
                    py -= 15;
                }
                if (invoice.payment.bic) {
                    this.drawText(`${this.strings.bic}: ${invoice.payment.bic}`, margins.left + 5, py, { size: 9 });
                    py -= 15;
                }
                if (invoice.payment.dueDate) {
                    this.drawText(`${this.strings.dueDate}: ${this.formatDateFull(invoice.payment.dueDate)}`, margins.left + 5, py, { size: 9 });
                    py -= 15;
                }
                if (invoice.payment.termsDescription) {
                    this.drawText(invoice.payment.termsDescription, margins.left + 5, py, { size: 9 });
                    py -= 20;
                }
            }
            const paymentLink = this.context.options.paymentLink ||
                `https://pay.services.ceo/invoices/${this.context.invoice.header.id}`;
            if (paymentLink) {
                const qrSize = 80;
                const qrX = margins.left + 5;
                const minY = margins.bottom + 50;
                const qrY = Math.max(py - qrSize, minY);
                try {
                    const qrPngBuffer = await qrcode_1.default.toBuffer(paymentLink, {
                        type: 'png',
                        width: 200,
                        margin: 1,
                        color: { dark: '#1e293b', light: '#ffffff' },
                        errorCorrectionLevel: 'M',
                    });
                    const qrImage = await this.pdfDoc.embedPng(qrPngBuffer);
                    this.currentPage.drawImage(qrImage, {
                        x: qrX,
                        y: qrY,
                        width: qrSize,
                        height: qrSize,
                    });
                }
                catch {
                    this.drawRect(qrX, qrY, qrSize, qrSize, {
                        borderColor: '#3b82f6', borderWidth: 1,
                    });
                    this.drawText('QR', qrX + 28, qrY + 35, { size: 16, bold: true, color: '#3b82f6' });
                }
                this.drawText(this.strings.scanToPay, qrX, qrY - 12, { size: 8, bold: true, color: '#3b82f6' });
                const maxLinkLen = 35;
                const displayLink = paymentLink.length > maxLinkLen
                    ? paymentLink.substring(0, maxLinkLen) + '...'
                    : paymentLink;
                this.drawText(displayLink, qrX, qrY - 22, { size: 7, color: '#6b7280' });
            }
        }
        const totalsBoxH = 90;
        this.drawRect(rightX - 10, startY - totalsBoxH, rightW + 10, totalsBoxH, { fillColor: '#f9fafb', borderColor: '#e5e7eb', borderWidth: 1 });
        let y = startY - 20;
        this.drawText(this.strings.subtotal, rightX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.lineTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 10 });
        y -= 22;
        this.drawText(this.strings.taxTotal, rightX, y, { size: 10 });
        this.drawText((0, core_1.formatAmount)(summary.taxTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 10 });
        y -= 28;
        this.drawRect(rightX - 10, y - 8, rightW + 10, 25, { fillColor: '#db2777' });
        this.drawText(this.strings.grandTotal, rightX, y, { size: 13, bold: true, color: '#ffffff' });
        this.drawText((0, core_1.formatAmount)(summary.grandTotal) + ' ' + this.currencySymbol, rightX + rightW - 80, y, { size: 13, bold: true, color: '#ffffff' });
        this.renderContext.currentY = startY - totalsBoxH - 10;
    }
    renderFancyTaxBreakdown() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const rightX = margins.left + contentWidth * 0.52;
        this.drawText(this.strings.taxBreakdown, rightX, startY, {
            size: 10, bold: true, color: '#db2777',
        });
        let y = startY - 20;
        this.drawRect(rightX - 5, y - 18, 220, 18, { fillColor: '#fce7f3' });
        this.drawText(this.strings.vatRate, rightX, y - 12, { size: 8, bold: true });
        this.drawText(this.strings.taxBase, rightX + 60, y - 12, { size: 8, bold: true });
        this.drawText(this.strings.taxAmount, rightX + 140, y - 12, { size: 8, bold: true });
        y -= 28;
        for (const taxSum of summary.taxSummaries) {
            this.drawText(`${taxSum.rate}%`, rightX, y, { size: 9 });
            this.drawText((0, core_1.formatAmount)(taxSum.taxable) + ' ' + this.currencySymbol, rightX + 60, y, { size: 9 });
            this.drawText((0, core_1.formatAmount)(taxSum.taxAmount) + ' ' + this.currencySymbol, rightX + 140, y, { size: 9 });
            y -= 16;
        }
        this.renderContext.currentY = y - 10;
    }
    drawSinglePageFooter(page, pageNum, totalPages) {
        const { margins } = this.context.options;
        const size = [595.28, 841.89];
        const pageWidth = size[0];
        const footerH = 40;
        const footerTop = margins.bottom + footerH;
        const halfW = (pageWidth - margins.left - margins.right) / 2;
        const font = this.getFont('Helvetica');
        const fontBold = this.getFont('Helvetica-Bold');
        const white = this.parseColor('#ffffff');
        const gray = this.parseColor('#6b7280');
        const generatedDateText = this.getGeneratedDateText();
        page.drawText(generatedDateText, {
            x: margins.left + 10, y: footerTop - 2,
            size: 7, font: fontBold, color: gray,
        });
        page.drawRectangle({
            x: margins.left, y: margins.bottom,
            width: halfW, height: footerH - 12,
            color: this.parseColor('#db2777'),
        });
        page.drawRectangle({
            x: margins.left + halfW, y: margins.bottom,
            width: halfW, height: footerH - 12,
            color: this.parseColor('#3b82f6'),
        });
        const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
        page.drawText(pageText, {
            x: margins.left + 10, y: margins.bottom + 8,
            size: 8, font, color: white,
        });
        page.drawText('@facturx/templates', {
            x: pageWidth - margins.right - 120, y: margins.bottom + 8,
            size: 8, font, color: white,
        });
    }
}
exports.FancyTemplate = FancyTemplate;
//# sourceMappingURL=FancyTemplate.js.map