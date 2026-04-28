"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceTemplateBrand = void 0;
const pdf_lib_1 = require("pdf-lib");
/**
 * Example multipage invoice PDF template that renders all FacturX fields,
 * avec chaque sous-section factorisée dans une fonction.
 */
class InvoiceTemplateBrand {
    constructor() {
        // Couleurs de la charte graphique
        this.colorNavy = (0, pdf_lib_1.rgb)(0.05, 0.18, 0.37);
        this.colorOrange = (0, pdf_lib_1.rgb)(1.0, 0.4, 0.0);
        // Marges et positions
        this.leftMargin = 40;
        this.infoX = 400;
    }
    async render(invoice) {
        // Création du document PDF
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        // Embarquer les polices
        const fontRegular = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const fonts = { regular: fontRegular, bold: fontBold };
        // Suivi des pages (pour pagination en 2e passe)
        const pages = [];
        // 1) Création de la première page
        pages.push(this.createNewPage(pdfDoc, fonts));
        // 2) En-têtes principaux ("Invoice From", "Invoice to", etc.)
        this.drawHeaderBlocks(invoice, pages, fonts);
        // 3) Tableau des lignes d'items (multipages)
        this.drawItemsTable(invoice, pages, fonts);
        // 4) Sections de paiement, conditions, etc. (divisées en sous-fonctions)
        const summary = invoice.finalizeTotals();
        this.drawPaymentAndTerms(invoice, summary, pages, fonts);
        // 5) Pagination (ajout "Page X of Y")
        this.drawPageNumbering(pages, fonts.regular);
        // 6) Sauvegarder et retourner le PDF en Uint8Array
        return await pdfDoc.save();
    }
    /* ----------------- Sous-fonctions pour les sections ----------------- */
    drawPaymentInfo(lastPage, invoice, y, fonts) {
        // Section "Payment Info"
        y -= 35;
        lastPage.drawText('Payment Info:', {
            x: this.leftMargin,
            y,
            size: 10,
            font: fonts.bold,
            color: this.colorNavy,
        });
        y -= 15;
        if (invoice.payment?.payeeIBAN) {
            lastPage.drawText(`IBAN: ${invoice.payment.payeeIBAN}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        if (invoice.payment?.payeeBIC) {
            lastPage.drawText(`BIC: ${invoice.payment.payeeBIC}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        if (invoice.payment?.dueDate) {
            lastPage.drawText(`Due date: ${invoice.payment.dueDate.toLocaleDateString('fr-FR')}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        if (invoice.paymentTerms) {
            lastPage.drawText(`Payment Terms: ${invoice.paymentTerms}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        if (invoice.payment?.paymentTermsText) {
            y -= 12;
            lastPage.drawText(`Payment Details Terms: ${invoice.payment.paymentTermsText}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        return y;
    }
    drawPayeeSection(lastPage, invoice, y, fonts) {
        // Section "Payee" si distinct
        if (invoice.payeeParty) {
            y -= 15;
            lastPage.drawText('Payee:', {
                x: this.leftMargin,
                y,
                size: 10,
                font: fonts.bold,
                color: this.colorNavy,
            });
            y -= 15;
            lastPage.drawText(`${invoice.payeeParty.name ?? ''}`, {
                x: this.leftMargin + 10,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
            if (invoice.payeeParty.postalAddress) {
                lastPage.drawText(`${invoice.payeeParty.postalAddress.line1 ?? ''}, ${invoice.payeeParty.postalAddress.city ?? ''} ${invoice.payeeParty.postalAddress.countryCode ?? ''}`, {
                    x: this.leftMargin + 10,
                    y,
                    size: 9,
                    font: fonts.regular,
                });
                y -= 12;
            }
        }
        return y;
    }
    drawDocAllowanceCharges(lastPage, invoice, y, fonts) {
        // Section "Document-Level Charges/Allowances"
        if (invoice.docAllowanceCharges && invoice.docAllowanceCharges.length > 0) {
            y -= 20;
            lastPage.drawText('Document-Level Charges/Allowances:', {
                x: this.leftMargin,
                y,
                size: 10,
                font: fonts.bold,
                color: this.colorNavy,
            });
            y -= 15;
            for (const dac of invoice.docAllowanceCharges) {
                const sign = dac.chargeIndicator ? '+' : '-';
                const label = dac.reason ?? (dac.chargeIndicator ? 'Charge' : 'Allowance');
                lastPage.drawText(`${label} (${sign}): ${dac.actualAmount.toFixed(2)} ${invoice.currency}`, {
                    x: this.leftMargin + 10,
                    y,
                    size: 9,
                    font: fonts.regular,
                });
                y -= 12;
                if (dac.reasonCode) {
                    lastPage.drawText(`Reason code: ${dac.reasonCode}`, {
                        x: this.leftMargin + 30,
                        y,
                        size: 9,
                        font: fonts.regular,
                    });
                    y -= 12;
                }
            }
        }
        return y;
    }
    drawTermsNotesAndDisclaimers(lastPage, invoice, y, fonts) {
        // Section "Terms & Conditions"
        y -= 30;
        lastPage.drawText('Terms & Conditions', {
            x: this.leftMargin,
            y,
            size: 10,
            font: fonts.bold,
            color: this.colorNavy,
        });
        y -= 15;
        lastPage.drawText('1. Items are not refundable if...', {
            x: this.leftMargin + 10,
            y,
            size: 9,
            font: fonts.regular,
        });
        y -= 12;
        lastPage.drawText('2. Payment must be made within 30 days...', {
            x: this.leftMargin + 10,
            y,
            size: 9,
            font: fonts.regular,
        });
        y -= 12;
        // Notes (si présentes)
        if (invoice.notes) {
            y -= 15;
            lastPage.drawText(`Notes: ${invoice.notes}`, {
                x: this.leftMargin,
                y,
                size: 9,
                font: fonts.regular,
            });
            y -= 12;
        }
        // Disclaimers (si présentes)
        if (invoice.disclaimers && invoice.disclaimers.length > 0) {
            y -= 15;
            lastPage.drawText('Disclaimers:', {
                x: this.leftMargin,
                y,
                size: 10,
                font: fonts.bold,
                color: this.colorNavy,
            });
            y -= 15;
            for (const disc of invoice.disclaimers) {
                lastPage.drawText(disc, {
                    x: this.leftMargin + 10,
                    y,
                    size: 9,
                    font: fonts.regular,
                });
                y -= 12;
            }
        }
        return y;
    }
    drawAdditionalDocs(lastPage, invoice, y, fonts) {
        // Section "Additional Documents"
        if (invoice.additionalDocs && invoice.additionalDocs.length > 0) {
            y -= 20;
            lastPage.drawText('Additional Documents:', {
                x: this.leftMargin,
                y,
                size: 10,
                font: fonts.bold,
                color: this.colorNavy,
            });
            y -= 15;
            for (const doc of invoice.additionalDocs) {
                lastPage.drawText(`Doc: ${doc.name ?? 'Unnamed Document'} (ID: ${doc.id ?? 'N/A'})`, {
                    x: this.leftMargin + 10,
                    y,
                    size: 9,
                    font: fonts.regular,
                });
                y -= 12;
            }
        }
        return y;
    }
    drawTotalsAndSign(lastPage, summary, invoice, y, fonts) {
        // Section "Totals" avec fond arrondi et zone "Authorized Sign"
        const totalsX = 400;
        const padding = 10;
        const boxWidth = 180;
        const boxHeight = 100;
        const cornerRadius = 12;
        lastPage.drawRectangle({
            x: totalsX - padding,
            y: y - padding - boxHeight,
            width: boxWidth + 2 * padding,
            height: boxHeight + 2 * padding,
            // borderRadius: cornerRadius,
            color: (0, pdf_lib_1.rgb)(1, 0.6, 0),
            opacity: 0.2,
        });
        let currentY = y - padding * 2;
        lastPage.drawText(`Sub Total: ${summary.taxBasis.toFixed(2)} ${invoice.currency}`, {
            x: totalsX,
            y: currentY,
            size: 14,
            font: fonts.regular,
        });
        currentY -= 30;
        lastPage.drawText(`VAT: ${summary.taxTotal.toFixed(2)} ${invoice.currency}`, {
            x: totalsX,
            y: currentY,
            size: 14,
            font: fonts.regular,
        });
        currentY -= 30;
        lastPage.drawText(`Total: ${summary.grandTotal.toFixed(2)} ${invoice.currency}`, {
            x: totalsX,
            y: currentY,
            size: 16,
            font: fonts.bold,
            color: this.colorOrange,
        });
        currentY -= 60;
        // Zone "Authorized Sign"
        lastPage.drawRectangle({
            x: 450,
            y: 50,
            width: 80,
            height: 25,
            color: this.colorOrange,
        });
        lastPage.drawText('Authorized Sign', {
            x: 455,
            y: 58,
            size: 9,
            font: fonts.regular,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        return currentY;
    }
    drawPaymentAndTerms(invoice, summary, pages, fonts) {
        const pdfDoc = pages[0].page.doc;
        this.checkAndAddPage(pages, pdfDoc, fonts, 100);
        let { page: lastPage, currentY: y } = pages[pages.length - 1];
        y = this.drawPaymentInfo(lastPage, invoice, y, fonts);
        y = this.drawPayeeSection(lastPage, invoice, y, fonts);
        y = this.drawDocAllowanceCharges(lastPage, invoice, y, fonts);
        y = this.drawTermsNotesAndDisclaimers(lastPage, invoice, y, fonts);
        y = this.drawAdditionalDocs(lastPage, invoice, y, fonts);
        this.checkAndAddPage(pages, pdfDoc, fonts, 60);
        ({ page: lastPage, currentY: y } = pages[pages.length - 1]);
        y = this.drawTotalsAndSign(lastPage, summary, invoice, y, fonts);
        pages[pages.length - 1].currentY = y;
    }
    /* ----------------- Fonctions existantes ----------------- */
    createNewPage(pdfDoc, fonts) {
        const page = pdfDoc.addPage([595.28, 841.89]); // Format A4
        const { width, height } = page.getSize();
        // Entête Navy
        const headerHeight = 60;
        page.drawRectangle({
            x: 0,
            y: height - headerHeight,
            width,
            height: headerHeight,
            color: this.colorNavy,
        });
        // Bloc de marque orange en haut à droite
        const brandBoxWidth = 140;
        const brandBoxHeight = 40;
        page.drawRectangle({
            x: width - brandBoxWidth,
            y: height - brandBoxHeight - 10,
            width: brandBoxWidth,
            height: brandBoxHeight,
            color: this.colorOrange,
        });
        page.drawText('Brand Name', {
            x: width - brandBoxWidth + 10,
            y: height - 35,
            size: 12,
            font: fonts.bold,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        // Texte "INVOICE"
        page.drawText('INVOICE', {
            x: 30,
            y: height - 35,
            size: 20,
            font: fonts.bold,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        // Position de départ en dessous de l'en-tête
        return { page, currentY: height - headerHeight - 20 };
    }
    checkAndAddPage(pages, pdfDoc, fonts, neededSpace) {
        const bottomMargin = 50;
        let { page, currentY } = pages[pages.length - 1];
        if (currentY - neededSpace < bottomMargin) {
            pages.push(this.createNewPage(pdfDoc, fonts));
        }
    }
    drawHeaderBlocks(invoice, pages, fonts) {
        let { page, currentY } = pages[pages.length - 1];
        const savedY = currentY;
        // "Invoice From:" bloc
        page.drawText('Invoice From:', {
            x: this.leftMargin,
            y: currentY,
            size: 10,
            font: fonts.bold,
            color: this.colorNavy,
        });
        currentY -= 15;
        page.drawText(`${invoice.seller?.name ?? ''}`, {
            x: this.leftMargin,
            y: currentY,
            size: 10,
            font: fonts.regular,
        });
        currentY -= 12;
        if (invoice.seller?.postalAddress) {
            page.drawText(`${invoice.seller.postalAddress.line1 ?? ''}, ${invoice.seller.postalAddress.city ?? ''} ${invoice.seller.postalAddress.countryCode ?? ''}`, { x: this.leftMargin, y: currentY, size: 10, font: fonts.regular });
            currentY -= 12;
        }
        // "Invoice to:" bloc
        const xRightBlock = this.leftMargin * 6;
        page.drawText('Invoice to:', {
            x: xRightBlock,
            y: savedY,
            size: 10,
            font: fonts.bold,
            color: this.colorNavy,
        });
        let rightBlockY = savedY - 15;
        page.drawText(`${invoice.buyer?.name ?? ''}`, {
            x: xRightBlock,
            y: rightBlockY,
            size: 10,
            font: fonts.regular,
        });
        rightBlockY -= 12;
        if (invoice.buyer?.postalAddress) {
            page.drawText(`${invoice.buyer.postalAddress.line1 ?? ''}, ${invoice.buyer.postalAddress.city ?? ''} ${invoice.buyer.postalAddress.countryCode ?? ''}`, { x: xRightBlock, y: rightBlockY, size: 10, font: fonts.regular });
            rightBlockY -= 12;
        }
        // Bloc d'infos sur la droite (Invoice#, Date, Profile, etc.)
        let infoY = savedY - 15;
        page.drawText(`Invoice# : ${invoice.header?.id ?? ''}`, {
            x: this.infoX,
            y: infoY,
            size: 10,
            font: fonts.bold,
            color: this.colorNavy,
        });
        infoY -= 15;
        if (invoice.header?.invoiceDate) {
            page.drawText(`Date : ${invoice.header.invoiceDate.toLocaleDateString('fr-FR')}`, {
                x: this.infoX,
                y: infoY,
                size: 10,
                font: fonts.regular,
            });
            infoY -= 12;
        }
        page.drawText(`Profile : ${invoice.profile}`, {
            x: this.infoX,
            y: infoY,
            size: 10,
            font: fonts.regular,
        });
        infoY -= 12;
        if (invoice.buyerOrderReference) {
            page.drawText(`BuyerOrderRef : ${invoice.buyerOrderReference}`, {
                x: this.infoX,
                y: infoY,
                size: 10,
                font: fonts.regular,
            });
            infoY -= 12;
        }
        // Delivery Party (Ship to)
        currentY -= 25;
        if (invoice.deliveryParty) {
            page.drawText('Ship to:', {
                x: this.leftMargin,
                y: currentY,
                size: 10,
                font: fonts.bold,
                color: this.colorNavy,
            });
            currentY -= 15;
            page.drawText(`${invoice.deliveryParty.name ?? ''}`, {
                x: this.leftMargin,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            currentY -= 12;
            if (invoice.deliveryParty.postalAddress) {
                const da = invoice.deliveryParty.postalAddress;
                page.drawText(`${da.line1 ?? ''}, ${da.city ?? ''} ${da.countryCode ?? ''}`, { x: this.leftMargin, y: currentY, size: 10, font: fonts.regular });
                currentY -= 12;
            }
        }
        pages[pages.length - 1].currentY = currentY;
    }
    drawTableHeader(pages, fonts) {
        const { page, currentY } = pages[pages.length - 1];
        page.drawText('#', { x: this.leftMargin, y: currentY, font: fonts.bold, size: 10 });
        page.drawText('Item Description', { x: this.leftMargin + 40, y: currentY, font: fonts.bold, size: 10 });
        page.drawText('Price', { x: this.leftMargin + 340, y: currentY, font: fonts.bold, size: 10 });
        page.drawText('Qty', { x: this.leftMargin + 400, y: currentY, font: fonts.bold, size: 10 });
        page.drawText('Total', { x: this.leftMargin + 450, y: currentY, font: fonts.bold, size: 10 });
        page.drawLine({
            start: { x: this.leftMargin + 10, y: currentY - 10 },
            end: { x: this.leftMargin + 460, y: currentY - 10 },
            thickness: 1,
            color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
        });
        pages[pages.length - 1].currentY = currentY - 30;
    }
    drawItemsTable(invoice, pages, fonts) {
        const pdfDoc = pages[0].page.doc;
        this.drawTableHeader(pages, fonts);
        let index = 1;
        for (const item of invoice.lines) {
            this.checkAndAddPage(pages, pdfDoc, fonts, 30);
            let { page, currentY } = pages[pages.length - 1];
            if (currentY === page.getSize().height - 80) {
                this.drawTableHeader(pages, fonts);
                ({ page, currentY } = pages[pages.length - 1]);
            }
            const lineTotal = item.lineTotal ?? (item.quantity * item.unitPrice);
            page.drawText(index.toString(), {
                x: this.leftMargin,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            page.drawText(item.description, {
                x: this.leftMargin + 40,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            page.drawText(`${item.unitPrice.toFixed(2)}`, {
                x: this.leftMargin + 340,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            page.drawText(`${item.quantity}`, {
                x: this.leftMargin + 400,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            page.drawText(lineTotal.toFixed(2), {
                x: this.leftMargin + 450,
                y: currentY,
                size: 10,
                font: fonts.regular,
            });
            currentY -= 22;
            pages[pages.length - 1].currentY = currentY;
            if (item.allowances && item.allowances.length > 0) {
                for (const allow of item.allowances) {
                    this.checkAndAddPage(pages, pdfDoc, fonts, 15);
                    ({ page, currentY } = pages[pages.length - 1]);
                    page.drawText(` - Allowance: -${allow.actualAmount.toFixed(2)} ${invoice.currency}`, {
                        x: this.leftMargin + 40,
                        y: currentY,
                        size: 9,
                        font: fonts.regular,
                    });
                    currentY -= 12;
                    pages[pages.length - 1].currentY = currentY;
                }
            }
            if (item.charges && item.charges.length > 0) {
                for (const ch of item.charges) {
                    this.checkAndAddPage(pages, pdfDoc, fonts, 15);
                    ({ page, currentY } = pages[pages.length - 1]);
                    page.drawText(` + Charge: +${ch.actualAmount.toFixed(2)} ${invoice.currency}`, {
                        x: this.leftMargin + 40,
                        y: currentY,
                        size: 9,
                        font: fonts.regular,
                    });
                    currentY -= 12;
                    pages[pages.length - 1].currentY = currentY;
                }
            }
            index++;
        }
    }
    drawPageNumbering(pages, fontRegular) {
        const totalPages = pages.length;
        for (let i = 0; i < totalPages; i++) {
            const { page } = pages[i];
            const { width } = page.getSize();
            page.drawText(`Page ${i + 1} of ${totalPages}`, {
                x: width / 2 - 30,
                y: 20,
                size: 9,
                font: fontRegular,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
        }
    }
}
exports.InvoiceTemplateBrand = InvoiceTemplateBrand;
