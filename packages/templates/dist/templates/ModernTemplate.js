"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModernTemplate = void 0;
const core_1 = require("@facturx/core");
const TemplateRenderer_1 = require("../core/TemplateRenderer");
const types_1 = require("../types");
const COLORS = {
    black: '#111111',
    darkGray: '#333333',
    mediumGray: '#555555',
    gray: '#888888',
    lightGray: '#cccccc',
    borderGray: '#dddddd',
    bgGray: '#f5f5f5',
    white: '#ffffff',
    greenBorder: '#067d62',
    greenBg: '#f0faf6',
    greenText: '#067d62',
    amberBorder: '#b45309',
    amberBg: '#fffbeb',
    amberText: '#92400e',
};
class ModernTemplate extends TemplateRenderer_1.TemplateRenderer {
    getTemplateType() {
        return types_1.TemplateType.MODERN;
    }
    async renderContent() {
        await this.renderModernHeader();
        this.renderModernParties();
        this.renderOrderInfo();
        this.renderContext.currentY -= 10;
        this.renderModernLineItems();
        this.renderContext.currentY -= 10;
        this.renderContext.currentY -= 25;
        this.checkPageBreak(160);
        await this.renderModernTotals();
        this.renderContext.currentY -= 15;
        this.checkPageBreak(60);
        this.renderLegalInfo();
    }
    async renderModernHeader() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const invoice = this.context.invoice;
        const startY = this.renderContext.currentY;
        const logoConsumed = await this.renderLogo(margins.left, startY, 140, 50);
        if (logoConsumed === 0) {
            this.drawText(invoice.seller.name, margins.left, startY - 18, {
                size: 18,
                bold: true,
                color: COLORS.black,
            });
        }
        const titleText = this.strings.invoice || 'Facture';
        const titleWidth = this.measureTextWidth(titleText, 22, false);
        this.drawText(titleText, width - margins.right - titleWidth, startY - 18, {
            size: 22,
            color: COLORS.darkGray,
        });
        const badgeW = 260;
        const badgeH = 70;
        const badgeX = width - margins.right - badgeW;
        const badgeY = startY - 35;
        this.drawRect(badgeX, badgeY - badgeH, badgeW, badgeH, { fillColor: COLORS.bgGray });
        this.drawRect(badgeX, badgeY - badgeH, 3, badgeH, { fillColor: COLORS.darkGray });
        const isDraftOption = this.context.options.isDraft === true;
        const paymentStatus = this.context.options.paymentStatus || 'PENDING';
        let statusLabel;
        if (isDraftOption || paymentStatus === 'DRAFT') {
            statusLabel = 'Brouillon';
        }
        else if (paymentStatus === 'PAID' || paymentStatus === 'paid') {
            statusLabel = 'Payé';
        }
        else {
            statusLabel = 'En attente';
        }
        this.drawText(statusLabel, badgeX + 12, badgeY - 16, {
            size: 12,
            bold: true,
            color: COLORS.darkGray,
        });
        const refLabel = this.strings.invoiceNumber || 'N° de facture';
        this.drawText(`${refLabel}: ${invoice.header.id}`, badgeX + 12, badgeY - 32, {
            size: 8,
            color: COLORS.mediumGray,
        });
        const dueDate = this.getDueDate();
        const dueDateStr = this.formatDateFull(dueDate);
        this.drawText(`${this.strings.dueDate || 'Échéance'}: ${dueDateStr}`, badgeX + 12, badgeY - 45, {
            size: 8,
            color: COLORS.mediumGray,
        });
        const { summary } = this.context;
        this.drawText(`Total: ${(0, core_1.formatAmount)(summary.grandTotal)} ${this.currencySymbol}`, badgeX + 12, badgeY - 58, { size: 9, bold: true, color: COLORS.black });
        this.renderContext.currentY = badgeY - badgeH - 20;
    }
    renderModernParties() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const colWidth = contentWidth / 3;
        const col1X = margins.left;
        this.drawText(this.strings.seller || 'Émetteur', col1X, startY, {
            size: 9,
            bold: true,
            color: COLORS.darkGray,
        });
        let y1 = startY - 16;
        this.drawText(invoice.seller.name, col1X, y1, { size: 9, color: COLORS.mediumGray });
        y1 -= 13;
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            if (addr.street) {
                this.drawText(addr.street, col1X, y1, { size: 9, color: COLORS.mediumGray });
                y1 -= 13;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
            y1 -= 13;
            this.drawText(addr.countryCode, col1X, y1, { size: 9, color: COLORS.mediumGray });
            y1 -= 13;
        }
        if (invoice.seller.vatId) {
            this.drawText(`N° TVA : ${invoice.seller.vatId}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
            y1 -= 13;
        }
        const { sellerSiret, sellerSiren } = this.context.options;
        if (sellerSiren) {
            this.drawText(`SIREN : ${sellerSiren}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
        }
        else if (sellerSiret) {
            this.drawText(`SIRET : ${sellerSiret}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
        }
        const col3X = margins.left + colWidth * 2;
        this.drawText(this.strings.buyer || 'Adresse de facturation', col3X, startY, {
            size: 9,
            bold: true,
            color: COLORS.darkGray,
        });
        let y3 = startY - 16;
        this.drawText(invoice.buyer.name, col3X, y3, { size: 9, color: COLORS.mediumGray });
        y3 -= 13;
        if (invoice.buyer.address) {
            const addr = invoice.buyer.address;
            if (addr.street) {
                this.drawText(addr.street, col3X, y3, { size: 9, color: COLORS.mediumGray });
                y3 -= 13;
            }
            if (addr.additionalStreet) {
                this.drawText(addr.additionalStreet, col3X, y3, { size: 9, color: COLORS.mediumGray });
                y3 -= 13;
            }
            this.drawText(`${addr.postalCode} ${addr.city}`, col3X, y3, { size: 9, color: COLORS.mediumGray });
            y3 -= 13;
            this.drawText(addr.countryCode, col3X, y3, { size: 9, color: COLORS.mediumGray });
        }
        this.renderContext.currentY = startY - 100;
    }
    renderOrderInfo() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        this.drawLine(margins.left, startY + 5, width - margins.right, startY + 5, { color: COLORS.borderGray, width: 0.5 });
        this.drawText('Informations de la commande', margins.left, startY - 12, {
            size: 10,
            bold: true,
            color: COLORS.darkGray,
        });
        const issueDateStr = this.formatInvoiceDateFull();
        const labelX = margins.left + 20;
        const valueX = margins.left + 180;
        this.drawText(`Date d'émission`, labelX, startY - 30, {
            size: 9, color: COLORS.mediumGray,
        });
        this.drawText(issueDateStr, valueX, startY - 30, {
            size: 9, color: COLORS.black,
        });
        this.drawText('Numéro de facture', labelX, startY - 45, {
            size: 9, color: COLORS.mediumGray,
        });
        this.drawText(invoice.header.id, valueX, startY - 45, {
            size: 9, color: COLORS.black,
        });
        this.renderContext.currentY = startY - 60;
    }
    renderModernLineItems() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        const tableWidth = width - margins.left - margins.right;
        const cols = {
            description: tableWidth * 0.38,
            qty: tableWidth * 0.08,
            unitPriceHT: tableWidth * 0.15,
            vatRate: tableWidth * 0.12,
            unitPriceTTC: tableWidth * 0.13,
            totalTTC: tableWidth * 0.14,
        };
        this.drawLine(margins.left, startY + 5, width - margins.right, startY + 5, { color: COLORS.borderGray, width: 0.5 });
        this.drawText('Détails de la facture', margins.left, startY - 12, {
            size: 10,
            bold: true,
            color: COLORS.darkGray,
        });
        let y = startY - 30;
        const headerH = 28;
        this.drawLine(margins.left, y, width - margins.right, y, { color: COLORS.borderGray, width: 0.5 });
        let hx = margins.left + 5;
        const headerY = y - 12;
        this.drawText(this.strings.description, hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx += cols.description;
        this.drawText(this.strings.quantity || 'Qté', hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx += cols.qty;
        this.drawText('Prix Unitaire', hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx += cols.unitPriceHT;
        this.drawText('Taux TVA', hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx += cols.vatRate;
        this.drawText('Prix TTC', hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx += cols.unitPriceTTC;
        this.drawText('Total TTC', hx, headerY, { size: 8, bold: true, color: COLORS.darkGray });
        hx = margins.left + 5 + cols.description + cols.qty;
        this.drawText('HT', hx, headerY - 12, { size: 7, color: COLORS.gray });
        hx += cols.unitPriceHT + cols.vatRate;
        this.drawText('TTC', hx, headerY - 12, { size: 7, color: COLORS.gray });
        y -= headerH;
        this.drawLine(margins.left, y, width - margins.right, y, { color: COLORS.borderGray, width: 0.5 });
        const descFontSize = 8;
        const descMaxWidth = cols.description - 10;
        const lineSpacing = 11;
        const minRowHeight = 22;
        for (let i = 0; i < invoice.lines.length; i++) {
            const line = invoice.lines[i];
            const descLines = this.wrapText(line.description, descMaxWidth, descFontSize);
            const textHeight = descLines.length * lineSpacing;
            const rowHeight = Math.max(minRowHeight, textHeight + 10);
            this.renderContext.currentY = y;
            const pageBefore = this.renderContext.pageNumber;
            this.checkPageBreak(rowHeight + 5);
            if (this.renderContext.pageNumber > pageBefore) {
                y = this.renderContext.currentY;
                this.drawLine(margins.left, y, width - margins.right, y, { color: COLORS.borderGray, width: 0.5 });
                let rhx = margins.left + 5;
                this.drawText(this.strings.description, rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                rhx += cols.description;
                this.drawText('Qté', rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                rhx += cols.qty;
                this.drawText('Prix Unitaire HT', rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                rhx += cols.unitPriceHT;
                this.drawText('Taux TVA', rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                rhx += cols.vatRate;
                this.drawText('Prix TTC', rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                rhx += cols.unitPriceTTC;
                this.drawText('Total TTC', rhx, y - 12, { size: 8, bold: true, color: COLORS.darkGray });
                y -= headerH;
                this.drawLine(margins.left, y, width - margins.right, y, { color: COLORS.borderGray, width: 0.5 });
            }
            let dx = margins.left + 5;
            let descY = y - 13;
            for (const descLine of descLines) {
                this.drawText(descLine, dx, descY, { size: descFontSize, color: COLORS.black });
                descY -= lineSpacing;
            }
            const unitPriceTTC = line.unitPrice * (1 + line.vatRate);
            const totalTTC = line.lineTotal * (1 + line.vatRate);
            const colY = y - Math.round(rowHeight / 2) - 3;
            let cx = margins.left + 5 + cols.description;
            this.drawText(String(line.quantity), cx, colY, { size: 8, color: COLORS.black });
            cx += cols.qty;
            this.drawText(`${(0, core_1.formatAmount)(line.unitPrice)} €`, cx, colY, { size: 8, color: COLORS.black });
            cx += cols.unitPriceHT;
            this.drawText(`${(0, core_1.formatAmount)(line.vatRate * 100)} %`, cx, colY, { size: 8, color: COLORS.black });
            cx += cols.vatRate;
            this.drawText(`${(0, core_1.formatAmount)(unitPriceTTC)} €`, cx, colY, { size: 8, color: COLORS.black });
            cx += cols.unitPriceTTC;
            this.drawText(`${(0, core_1.formatAmount)(totalTTC)} €`, cx, colY, { size: 8, color: COLORS.black });
            y -= rowHeight;
            this.drawLine(margins.left, y, width - margins.right, y, { color: COLORS.borderGray, width: 0.3 });
        }
        this.renderContext.currentY = y;
    }
    async renderModernTotals() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { summary } = this.context;
        const startY = this.renderContext.currentY;
        const contentWidth = width - margins.left - margins.right;
        const paymentLink = this.context.options.paymentLink;
        if (paymentLink) {
            const qrSize = 90;
            const qrX = margins.left;
            const qrY = startY - qrSize - 5;
            await this.renderQRCode(qrX, qrY, paymentLink, qrSize, undefined, COLORS.darkGray);
            this.drawText('Scanner pour payer', qrX + 5, qrY - 10, {
                size: 7,
                color: COLORS.gray,
            });
        }
        const totalAmountText = `${(0, core_1.formatAmount)(summary.grandTotal)} €`;
        const totalAmountWidth = this.measureTextWidth(totalAmountText, 14, true);
        this.drawText('Facture Total', margins.left + contentWidth * 0.45, startY - 5, {
            size: 14,
            bold: true,
            color: COLORS.black,
        });
        this.drawText(totalAmountText, width - margins.right - totalAmountWidth, startY - 5, {
            size: 14,
            bold: true,
            color: COLORS.black,
        });
        let y = startY - 35;
        const taxTableX = margins.left + contentWidth * 0.45;
        const col1W = 80;
        const col2W = 100;
        this.drawRect(taxTableX, y - 18, contentWidth * 0.55, 18, { fillColor: COLORS.bgGray });
        this.drawText('Taux TVA', taxTableX + 8, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
        this.drawText('Total HT', taxTableX + col1W, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
        this.drawText('TVA', taxTableX + col1W + col2W, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
        y -= 18;
        for (const taxSum of summary.taxSummaries) {
            this.drawText(`${taxSum.rate} %`, taxTableX + 8, y - 13, { size: 8, color: COLORS.black });
            this.drawText(`${(0, core_1.formatAmount)(taxSum.taxable)} €`, taxTableX + col1W, y - 13, { size: 8, color: COLORS.black });
            this.drawText(`${(0, core_1.formatAmount)(taxSum.taxAmount)} €`, taxTableX + col1W + col2W, y - 13, { size: 8, color: COLORS.black });
            y -= 16;
            if (taxSum.exemptionReason) {
                this.drawText(`Mention TVA : ${taxSum.exemptionReason}`, taxTableX + 8, y - 6, {
                    size: 7, color: COLORS.gray,
                });
                y -= 14;
            }
        }
        this.drawLine(taxTableX, y, taxTableX + contentWidth * 0.55, y, { color: COLORS.borderGray, width: 0.5 });
        this.drawText('Total', taxTableX + 8, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
        this.drawText(`${(0, core_1.formatAmount)(summary.lineTotal)} €`, taxTableX + col1W, y - 13, { size: 8, bold: true, color: COLORS.black });
        this.drawText(`${(0, core_1.formatAmount)(summary.taxTotal)} €`, taxTableX + col1W + col2W, y - 13, { size: 8, bold: true, color: COLORS.black });
        this.renderContext.currentY = y - 25;
    }
    renderLegalInfo() {
        const { margins } = this.context.options;
        const { width } = this.renderContext;
        const { invoice } = this.context;
        const startY = this.renderContext.currentY;
        this.drawLine(margins.left, startY + 5, width - margins.right, startY + 5, { color: COLORS.borderGray, width: 0.5 });
        let y = startY - 10;
        const legalMentions = [
            "Pénalités de retard exigibles dès le premier jour suivant la date de règlement, au taux de 3x le taux légal (art. L.441-10 C.com).",
            "Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 € (art. D.441-5 C.com).",
            "Pas d'escompte accordé pour paiement anticipé.",
        ];
        for (const mention of legalMentions) {
            this.drawText(mention, margins.left, y, { size: 6.5, color: COLORS.gray });
            y -= 11;
        }
        const { summary } = this.context;
        for (const taxSum of summary.taxSummaries) {
            if (taxSum.exemptionReason) {
                this.drawText(taxSum.exemptionReason, margins.left, y, {
                    size: 7, bold: true, color: COLORS.darkGray,
                });
                y -= 12;
            }
        }
        y -= 4;
        const { sellerSiret, sellerSiren } = this.context.options;
        const legalParts = [];
        if (invoice.seller.name)
            legalParts.push(invoice.seller.name);
        if (invoice.seller.address) {
            const addr = invoice.seller.address;
            const addrStr = [addr.street, `${addr.postalCode} ${addr.city}`, addr.countryCode]
                .filter(Boolean)
                .join(', ');
            if (addrStr)
                legalParts.push(addrStr);
        }
        if (legalParts.length > 0) {
            this.drawText(legalParts.join(' – '), margins.left, y, {
                size: 7,
                color: COLORS.gray,
            });
            y -= 12;
        }
        const legalIds = [];
        if (sellerSiren)
            legalIds.push(`SIREN : ${sellerSiren}`);
        else if (sellerSiret)
            legalIds.push(`SIRET : ${sellerSiret}`);
        if (invoice.seller.vatId)
            legalIds.push(`N° TVA : ${invoice.seller.vatId}`);
        if (legalIds.length > 0) {
            this.drawText(legalIds.join(' • '), margins.left, y, {
                size: 7,
                color: COLORS.gray,
            });
            y -= 12;
        }
        if (this.context.options.showPaymentTerms && invoice.payment) {
            const termsLine = invoice.payment.termsDescription || 'Conditions de paiement : 30 jours net';
            this.drawText(termsLine, margins.left, y, { size: 7, color: COLORS.gray });
            y -= 12;
            if (invoice.payment.iban) {
                this.drawText(`IBAN : ${invoice.payment.iban}`, margins.left, y, { size: 7, color: COLORS.gray });
                y -= 12;
            }
        }
        this.renderContext.currentY = y;
    }
    drawSinglePageFooter(page, pageNum, totalPages) {
        const { margins } = this.context.options;
        const pageWidth = 595.28;
        const footerH = 25;
        const font = this.getFont('Helvetica');
        page.drawLine({
            start: { x: margins.left, y: margins.bottom + footerH },
            end: { x: pageWidth - margins.right, y: margins.bottom + footerH },
            color: this.parseColor(COLORS.borderGray),
            thickness: 0.5,
        });
        const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
        const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
        page.drawText(pageText, {
            x: pageWidth - margins.right - pageTextWidth,
            y: margins.bottom + 8,
            size: 8,
            font,
            color: this.parseColor(COLORS.gray),
        });
    }
    async drawContinuationPageHeaders() {
        if (this.allPages.length <= 1)
            return;
        const { margins } = this.context.options;
        const { invoice } = this.context;
        const font = this.getFont('Helvetica');
        const fontBold = this.getFont('Helvetica-Bold');
        for (let i = 1; i < this.allPages.length; i++) {
            const page = this.allPages[i];
            const pageWidth = page.getWidth();
            const pageHeight = page.getHeight();
            const topY = pageHeight - margins.top;
            const headerH = TemplateRenderer_1.TemplateRenderer.CONTINUATION_HEADER_HEIGHT;
            const bandBottom = topY - headerH;
            page.drawText(`Facture ${invoice.header.id}`, {
                x: margins.left,
                y: topY - 20,
                size: 10,
                font: fontBold,
                color: this.parseColor(COLORS.darkGray),
            });
            const dateText = `${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`;
            const dateWidth = font.widthOfTextAtSize(dateText, 9);
            page.drawText(dateText, {
                x: pageWidth - margins.right - dateWidth,
                y: topY - 20,
                size: 9,
                font,
                color: this.parseColor(COLORS.gray),
            });
            page.drawLine({
                start: { x: margins.left, y: bandBottom },
                end: { x: pageWidth - margins.right, y: bandBottom },
                color: this.parseColor(COLORS.borderGray),
                thickness: 0.5,
            });
            page.drawText('(suite)', {
                x: margins.left,
                y: topY - 40,
                size: 8,
                font,
                color: this.parseColor(COLORS.gray),
            });
        }
    }
}
exports.ModernTemplate = ModernTemplate;
//# sourceMappingURL=ModernTemplate.js.map