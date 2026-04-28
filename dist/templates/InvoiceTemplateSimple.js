"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceTemplateSimple = void 0;
const pdf_lib_1 = require("pdf-lib");
/**
 * Un template minimaliste, codé "en dur".
 * On peut imaginer un template plus riche (logos, backgrounds, etc.).
 */
class InvoiceTemplateSimple {
    async render(invoice) {
        // 1. Créer un nouveau document PDF
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // approx A4
        const { width, height } = page.getSize();
        // 2. Polices
        const fontRegular = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        // 3. Titre
        page.drawText('FACTURE', {
            x: 50,
            y: height - 60,
            size: 18,
            font: fontBold,
            color: (0, pdf_lib_1.rgb)(0, 0, 0.6),
        });
        // 4. Infos principales
        let currentY = height - 90;
        page.drawText(`N° : ${invoice}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        currentY -= 15;
        page.drawText(`Date : ${invoice.header.invoiceDate.toLocaleDateString('fr-FR')}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        // 5. Seller / Buyer
        currentY -= 25;
        page.drawText(`Vendeur : ${invoice.seller.name}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontBold,
        });
        currentY -= 12;
        page.drawText(`${invoice.seller.postalAddress.line1} - ${invoice.seller.postalAddress.city} ${invoice.seller.postalAddress.countryCode}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        currentY -= 20;
        page.drawText(`Acheteur : ${invoice.buyer.name}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontBold,
        });
        currentY -= 12;
        page.drawText(`${invoice.buyer.postalAddress.line1} - ${invoice.buyer.postalAddress.city} ${invoice.buyer.postalAddress.countryCode}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        // 6. Items
        currentY -= 30;
        page.drawText('Désignation | Qte | PU | TVA | Total', {
            x: 50,
            y: currentY,
            size: 10,
            font: fontBold,
        });
        currentY -= 15;
        let subtotal = 0;
        for (const item of invoice.lines) {
            const lineTotal = item.quantity * item.unitPrice;
            subtotal += lineTotal;
            const line = [
                item.description,
                item.quantity.toFixed(2),
                item.unitPrice.toFixed(2),
                (item.vatRate * 100).toFixed(0) + '%',
                lineTotal.toFixed(2),
            ].join(' | ');
            page.drawText(line, { x: 50, y: currentY, size: 9, font: fontRegular });
            currentY -= 12;
        }
        // 7. Calcul TVA & total
        const totalVat = invoice.lines.reduce((acc, i) => acc + i.quantity * i.unitPrice * i.vatRate, 0);
        const total = subtotal + totalVat;
        currentY -= 10;
        page.drawText(`Sous-Total : ${subtotal.toFixed(2)} ${invoice.currency}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        currentY -= 12;
        page.drawText(`TVA : ${totalVat.toFixed(2)} ${invoice.currency}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontRegular,
        });
        currentY -= 12;
        page.drawText(`Total : ${total.toFixed(2)} ${invoice.currency}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: fontBold,
        });
        // 8. Disclaimers & notes
        function drawDisclaimers(page, x, y, invoice, fontBold, fontRegular) {
            if (invoice.disclaimers && invoice.disclaimers.length > 0) {
                let currentY = y;
                // Dessiner le titre "Disclaimers" en gras à gauche
                page.drawText('Disclaimers:', { x, y: currentY, size: 10, font: fontBold });
                currentY -= 12;
                // Dessiner chaque disclaimer à droite
                const offsetX = 300; // Décalage pour positionner le texte à droite du titre
                for (const disc of invoice.disclaimers) {
                    page.drawText(`- ${disc}`, { x: x + offsetX, y: currentY, size: 9, font: fontRegular });
                    currentY -= 12;
                }
            }
        }
        drawDisclaimers(page, 50, currentY, invoice, fontBold, fontRegular);
        if (invoice.notes && invoice.notes.length > 0) {
            currentY -= 20;
            page.drawText('Notes:', { x: 50, y: currentY, size: 10, font: fontBold });
            currentY -= 12;
            for (const note of invoice.notes) {
                page.drawText(`- ${note}`, { x: 60, y: currentY, size: 9, font: fontRegular });
                currentY -= 12;
            }
        }
        // const footerText = "Thank you for your business!";
        // currentY -= 20;
        // page.drawText(footerText, { x: 50, y: currentY, size: 8, font: fontRegular });
        // 9. Finaliser
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }
}
exports.InvoiceTemplateSimple = InvoiceTemplateSimple;
