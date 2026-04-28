"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceTemplateFancy = void 0;
// src/templates/InvoiceTemplateFancy.ts
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const pdf_lib_1 = require("pdf-lib");
const img_1 = require("./img");
/**
 * A modern, "fancy" invoice PDF renderer with multi-page support for FacturXInvoice.
 * Configurable via InvoiceTemplateConfig.
 */
class InvoiceTemplateFancy {
    // Color palette - primary color derived from config
    get COLORS() {
        const { titleColor } = this.config;
        return {
            primary: (0, pdf_lib_1.rgb)(titleColor.r / 255, titleColor.g / 255, titleColor.b / 255),
            primaryLight: (0, pdf_lib_1.rgb)(Math.min(1, titleColor.r / 255 + 0.7), Math.min(1, titleColor.g / 255 + 0.7), Math.min(1, titleColor.b / 255 + 0.7)),
            pink: (0, pdf_lib_1.rgb)(219 / 255, 39 / 255, 119 / 255),
            pinkLight: (0, pdf_lib_1.rgb)(252 / 255, 231 / 255, 243 / 255),
            blue: (0, pdf_lib_1.rgb)(59 / 255, 130 / 255, 246 / 255),
            blueLight: (0, pdf_lib_1.rgb)(239 / 255, 246 / 255, 255 / 255),
            gray: (0, pdf_lib_1.rgb)(107 / 255, 114 / 255, 128 / 255),
            grayLight: (0, pdf_lib_1.rgb)(249 / 255, 250 / 255, 251 / 255),
            dark: (0, pdf_lib_1.rgb)(31 / 255, 41 / 255, 55 / 255)
        };
    }
    constructor(config) {
        // A4 dimensions in points (210mm x 297mm)
        this.A4_WIDTH = 595.28;
        this.A4_HEIGHT = 841.89;
        this.MARGIN = 42.52; // 15mm in points
        this.CONTENT_WIDTH = this.A4_WIDTH - (this.MARGIN * 2);
        // Logo dimensions and positioning
        this.LOGO_WIDTH = 56.69; // 20mm in points
        this.LOGO_HEIGHT = 56.69; // 20mm in points
        this.TEXT_OFFSET_X = 11.34; // 4mm in points
        this.pages = [];
        this.currentPageIndex = 0;
        this.config = {
            logoLayout: config?.logoLayout ?? 'left',
            titleColor: config?.titleColor ?? { r: 219, g: 39, b: 119 },
            titleFontSize: config?.titleFontSize ?? 28,
            paymentLink: config?.paymentLink ?? '',
            showDeliveryAddress: config?.showDeliveryAddress ?? true,
            sellerSiren: config?.sellerSiren ?? '',
            sellerSiret: config?.sellerSiret ?? '',
            buyerSiren: config?.buyerSiren ?? '',
        };
    }
    /**
     * Dessiner une image base64 sur le PDF
     */
    async drawBase64Image(page, base64, x, y, maxWidth, maxHeight) {
        try {
            // Créer l'image à partir du base64
            const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            // Essayer d'abord PNG, puis JPG si ça échoue
            let image;
            try {
                image = await this.pdfDoc.embedPng(imageBytes);
            }
            catch {
                image = await this.pdfDoc.embedJpg(imageBytes);
            }
            // Calculer les dimensions avec ratio
            const { width, height } = image;
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            const displayWidth = width * ratio;
            const displayHeight = height * ratio;
            // Dessiner l'image
            page.drawImage(image, {
                x,
                y: y - displayHeight, // pdf-lib utilise le coin inférieur gauche
                width: displayWidth,
                height: displayHeight
            });
        }
        catch (error) {
            console.warn('Erreur lors du chargement de l\'image:', error);
            // Dessiner un rectangle de placeholder si l'image échoue
            page.drawRectangle({
                x,
                y: y - maxHeight,
                width: maxWidth,
                height: maxHeight,
                color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
                borderColor: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
                borderWidth: 1
            });
        }
    }
    async render(invoice) {
        // 1. Create PDFDocument
        this.pdfDoc = await pdf_lib_1.PDFDocument.create();
        this.pdfDoc.registerFontkit(fontkit_1.default);
        // 2. Embed fonts
        this.fontRegular = await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        this.fontBold = await this.pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        // 3. Initialize first page
        this.createNewPage(true);
        // 4. Draw first page content
        await this.drawFirstPageContent(invoice);
        // 5. Draw items table (may span multiple pages)
        await this.drawItemsTable(invoice);
        // 6. Draw summary on last page with payment info
        await this.drawSummaryOnLastPage(invoice);
        // 7. Add footers to all pages
        this.addFootersToAllPages(invoice);
        // 8. Add page numbers
        this.addPageNumbers();
        // 9. Save and return
        const pdfBytes = await this.pdfDoc.save();
        return pdfBytes;
    }
    // Création d'une nouvelle page et initialisation de la position Y
    createNewPage(isFirstPage = false) {
        const page = this.pdfDoc.addPage([this.A4_WIDTH, this.A4_HEIGHT]);
        // Position Y initiale au niveau de la marge haute pour toutes les pages
        const initialY = this.A4_HEIGHT - this.MARGIN;
        this.pages.push({ page, currentY: initialY });
        this.currentPageIndex = this.pages.length - 1;
        return { page, currentY: initialY };
    }
    // Ajouter le numérotation de pages (Page X of Y)
    drawPageNumbering(font) {
        for (let i = 0; i < this.pages.length; i++) {
            const page = this.pages[i].page;
            const totalPages = this.pages.length;
            const text = `Page ${i + 1} of ${totalPages}`;
            page.drawText(text, {
                x: this.MARGIN,
                y: this.MARGIN + 10,
                font,
                size: 12,
            });
        }
    }
    /**
     * Ajouter le header complet sur une nouvelle page (en-tête + header répétitif)
     */
    async drawPageHeader(invoice) {
        const { currentY: yPosition } = this.pages[this.currentPageIndex];
        // 1. En-tête de page avec QR code et identifiants (toutes les pages)
        let currentY = await this.drawPageHeaderTop(invoice, yPosition);
        // 2. Header différent selon la page
        if (this.currentPageIndex === 0) {
            // Version complète pour la première page
            currentY = await this.drawCompleteHeader(invoice, currentY);
        }
        else {
            // Version simplifiée pour les pages suivantes
            currentY = await this.drawSimpleHeader(invoice, currentY);
        }
        // Update currentY in pages array
        this.pages[this.currentPageIndex].currentY = currentY;
        return currentY;
    }
    /**
     * Dessine l'en-tête de page : titre du document en haut + identifiants à droite
     */
    async drawPageHeaderTop(invoice, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        // Déterminer le titre selon le type de document
        const typeCode = invoice.header?.typeCode;
        let docTitle = 'FACTURE';
        const tc = String(typeCode);
        if (tc === '381')
            docTitle = 'AVOIR';
        else if (tc === '384')
            docTitle = 'DEVIS';
        else if (tc === '383')
            docTitle = 'NOTE DE DEBIT';
        else if (tc === '386')
            docTitle = 'ACOMPTE';
        // TITRE DU DOCUMENT - tout en haut, couleur et taille configurables
        const titleSize = this.config.titleFontSize;
        page.drawText(docTitle, {
            x: this.MARGIN,
            y: yPosition - 5,
            size: titleSize,
            font: this.fontBold,
            color: this.COLORS.primary
        });
        // Numéro de facture et date alignés à droite sur la même ligne
        const invoiceNum = `N\u00b0 ${invoice.header?.invoiceNumber || ''}`;
        const invoiceDate = invoice.header?.invoiceDate?.toLocaleDateString('fr-FR') || '';
        const dateText = `${invoiceDate}`;
        const numWidth = this.fontBold.widthOfTextAtSize(invoiceNum, 11);
        page.drawText(invoiceNum, {
            x: this.A4_WIDTH - this.MARGIN - numWidth,
            y: yPosition - 5,
            size: 11,
            font: this.fontBold,
            color: this.COLORS.dark
        });
        const dateWidth = this.fontRegular.widthOfTextAtSize(dateText, 9);
        page.drawText(dateText, {
            x: this.A4_WIDTH - this.MARGIN - dateWidth,
            y: yPosition - 20,
            size: 9,
            font: this.fontRegular,
            color: this.COLORS.gray
        });
        // Ligne de séparation sous le titre
        const lineY = yPosition - titleSize - 8;
        page.drawLine({
            start: { x: this.MARGIN, y: lineY },
            end: { x: this.A4_WIDTH - this.MARGIN, y: lineY },
            thickness: 2,
            color: this.COLORS.primary
        });
        return lineY - 15; // Espace après la ligne
    }
    /**
     * Header complet pour la première page.
     * Layout configurable : 'left' (logo gauche, infos droite) ou 'above' (logo dessus, infos dessous).
     */
    async drawCompleteHeader(invoice, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        if (this.config.logoLayout === 'above') {
            return this.drawCompleteHeaderAbove(invoice, yPosition);
        }
        // === LAYOUT 'left' (défaut) : Logo à gauche, infos à droite ===
        // Logo vendeur à gauche
        await this.drawBase64Image(page, img_1.SELLER_LOGO_BASE64, this.MARGIN, yPosition, this.LOGO_WIDTH, this.LOGO_HEIGHT);
        let leftTextY = yPosition - 10;
        const sellerStartX = this.MARGIN + this.LOGO_WIDTH + this.TEXT_OFFSET_X;
        // Nom de l'entreprise (bold, 14pt)
        page.drawText(invoice.seller?.name || '', {
            x: sellerStartX,
            y: leftTextY,
            size: 14,
            font: this.fontBold,
            color: this.COLORS.dark
        });
        // Infos vendeur complètes (adresse, TVA, SIREN, contact)
        const sellerInfo = [];
        if (invoice.seller?.postalAddress?.line1)
            sellerInfo.push(invoice.seller.postalAddress.line1);
        const cityLine = [
            invoice.seller?.postalAddress?.postalCode,
            invoice.seller?.postalAddress?.city,
            invoice.seller?.postalAddress?.countryCode
        ].filter(Boolean).join(' ');
        if (cityLine)
            sellerInfo.push(cityLine);
        if (invoice.seller?.vatNumber)
            sellerInfo.push(`TVA : ${invoice.seller.vatNumber}`);
        if (this.config.sellerSiren)
            sellerInfo.push(`SIREN : ${this.config.sellerSiren}`);
        if (this.config.sellerSiret)
            sellerInfo.push(`SIRET : ${this.config.sellerSiret}`);
        if (invoice.seller?.contactEmail)
            sellerInfo.push(`${invoice.seller.contactEmail}`);
        if (invoice.seller?.contactPhone)
            sellerInfo.push(`${invoice.seller.contactPhone}`);
        sellerInfo.forEach(line => {
            leftTextY -= 12;
            page.drawText(line, {
                x: sellerStartX,
                y: leftTextY,
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
        });
        // PARTIE DROITE - Détails de la facture (pas de watermark)
        const rightDetails = [
            `Client : ${invoice.buyer?.name || ''}`,
            `Total : ${this.formatCurrency(this.calculateTotal(invoice))}`,
            `Ech. : ${invoice.payment?.dueDate?.toLocaleDateString('fr-FR') || ''}`
        ].filter(d => !d.includes('undefined') && d.trim());
        let detailY = yPosition - 10;
        rightDetails.forEach(detail => {
            const detailWidth = this.fontRegular.widthOfTextAtSize(detail, 9);
            page.drawText(detail, {
                x: this.A4_WIDTH - this.MARGIN - detailWidth,
                y: detailY,
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
            detailY -= 12;
        });
        const usedHeight = Math.max(sellerInfo.length * 12 + 20, rightDetails.length * 12 + 20, this.LOGO_HEIGHT + 10);
        return yPosition - usedHeight;
    }
    /**
     * Header layout 'above' : logo centré, infos dessous
     */
    async drawCompleteHeaderAbove(invoice, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        // Logo centré
        const logoX = (this.A4_WIDTH - this.LOGO_WIDTH) / 2;
        await this.drawBase64Image(page, img_1.SELLER_LOGO_BASE64, logoX, yPosition, this.LOGO_WIDTH, this.LOGO_HEIGHT);
        let y = yPosition - this.LOGO_HEIGHT - 8;
        // Nom centré
        const name = invoice.seller?.name || '';
        const nameWidth = this.fontBold.widthOfTextAtSize(name, 14);
        page.drawText(name, {
            x: (this.A4_WIDTH - nameWidth) / 2,
            y,
            size: 14,
            font: this.fontBold,
            color: this.COLORS.dark
        });
        y -= 14;
        // Infos centrées
        const lines = [];
        if (invoice.seller?.postalAddress?.line1)
            lines.push(invoice.seller.postalAddress.line1);
        const city = [invoice.seller?.postalAddress?.postalCode, invoice.seller?.postalAddress?.city].filter(Boolean).join(' ');
        if (city)
            lines.push(city);
        if (invoice.seller?.vatNumber)
            lines.push(`TVA : ${invoice.seller.vatNumber}`);
        if (this.config.sellerSiren)
            lines.push(`SIREN : ${this.config.sellerSiren}`);
        lines.forEach(line => {
            const w = this.fontRegular.widthOfTextAtSize(line, 9);
            page.drawText(line, { x: (this.A4_WIDTH - w) / 2, y, size: 9, font: this.fontRegular, color: this.COLORS.gray });
            y -= 12;
        });
        // Détails facture alignés à droite
        const rightDetails = [
            `Client : ${invoice.buyer?.name || ''}`,
            `Total : ${this.formatCurrency(this.calculateTotal(invoice))}`,
            `Ech. : ${invoice.payment?.dueDate?.toLocaleDateString('fr-FR') || ''}`
        ].filter(d => !d.includes('undefined'));
        let ry = yPosition - 10;
        rightDetails.forEach(detail => {
            const dw = this.fontRegular.widthOfTextAtSize(detail, 9);
            page.drawText(detail, { x: this.A4_WIDTH - this.MARGIN - dw, y: ry, size: 9, font: this.fontRegular, color: this.COLORS.gray });
            ry -= 12;
        });
        return y - 10;
    }
    /**
     * Header simplifié pour les pages suivantes (pas de watermark)
     */
    async drawSimpleHeader(invoice, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        // Logo vendeur + nom à gauche (compact)
        await this.drawBase64Image(page, img_1.SELLER_LOGO_BASE64, this.MARGIN, yPosition, this.LOGO_WIDTH * 0.7, this.LOGO_HEIGHT * 0.7);
        const sellerStartX = this.MARGIN + this.LOGO_WIDTH * 0.7 + this.TEXT_OFFSET_X;
        page.drawText(invoice.seller?.name || '', {
            x: sellerStartX,
            y: yPosition - 10,
            size: 11,
            font: this.fontBold,
            color: this.COLORS.dark
        });
        // Infos essentielles alignées à droite
        const essentialInfo = [
            `N\u00b0 ${invoice.header?.invoiceNumber || ''}`,
            `Total : ${this.formatCurrency(this.calculateTotal(invoice))}`,
        ];
        let infoY = yPosition - 8;
        essentialInfo.forEach(info => {
            const infoWidth = this.fontRegular.widthOfTextAtSize(info, 9);
            page.drawText(info, {
                x: this.A4_WIDTH - this.MARGIN - infoWidth,
                y: infoY,
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
            infoY -= 12;
        });
        // Ligne de séparation fine
        const lineY = yPosition - this.LOGO_HEIGHT * 0.7 - 5;
        page.drawLine({
            start: { x: this.MARGIN, y: lineY },
            end: { x: this.A4_WIDTH - this.MARGIN, y: lineY },
            thickness: 0.5,
            color: this.COLORS.primary
        });
        return lineY - 10;
    }
    /**
     * Draw billing and shipping sections with background and logos
     */
    async drawBillingShippingSections(invoice) {
        const columnWidth = (this.CONTENT_WIDTH - 28.35) / 2; // 10mm spacing
        let { page, currentY: yPosition } = this.pages.at(-1); //
        const fontBold = this.fontBold;
        const fontRegular = this.fontRegular;
        // Background for section titles
        page.drawRectangle({
            x: this.MARGIN,
            y: yPosition - 22.68,
            width: this.CONTENT_WIDTH,
            height: 22.68, // 8mm
            color: this.COLORS.grayLight
        });
        // Section titles
        page.drawText('FACTURÉ À', {
            x: this.MARGIN + 5.67 + this.LOGO_WIDTH + this.TEXT_OFFSET_X,
            y: yPosition - 15,
            size: 11,
            font: fontBold,
            color: this.COLORS.dark
        });
        // "LIVRÉ À" aligné à droite
        const livreAText = 'LIVRÉ À';
        const livreAWidth = fontBold.widthOfTextAtSize(livreAText, 11);
        page.drawText(livreAText, {
            x: this.A4_WIDTH - this.MARGIN - livreAWidth,
            y: yPosition - 15,
            size: 11,
            font: fontBold,
            color: this.COLORS.dark
        });
        yPosition -= 35; // Move down after titles
        // Buyer information (FACTURÉ À) - PAS d'icône client
        const buyerLines = [
            invoice.buyer?.name || '',
            invoice.buyer?.postalAddress?.line1 || '',
            [invoice.buyer?.postalAddress?.postalCode, invoice.buyer?.postalAddress?.city, invoice.buyer?.postalAddress?.countryCode].filter(Boolean).join(' '),
        ].filter(l => l.trim());
        if (this.config.buyerSiren) {
            buyerLines.push(`SIREN : ${this.config.buyerSiren}`);
        }
        if (invoice.buyer?.registrationNumber) {
            buyerLines.push(`SIRET : ${invoice.buyer.registrationNumber}`);
        }
        if (invoice.buyer?.vatNumber) {
            buyerLines.push(`TVA : ${invoice.buyer.vatNumber}`);
        }
        let buyerY = yPosition - 5;
        buyerLines.forEach((line) => {
            if (line.trim()) {
                page.drawText(line, {
                    x: this.MARGIN + 5.67,
                    y: buyerY,
                    size: 9,
                    font: fontRegular,
                    color: this.COLORS.gray
                });
                buyerY -= 12;
            }
        });
        // Shipping information (LIVRÉ À) - alignée à droite
        const shipLines = [...buyerLines];
        let shipY = yPosition - 5;
        shipLines.forEach((line, i) => {
            if (line.trim()) {
                const lineWidth = fontRegular.widthOfTextAtSize(line, 9);
                page.drawText(line, {
                    x: this.A4_WIDTH - this.MARGIN - lineWidth,
                    y: shipY,
                    size: 9,
                    font: fontRegular,
                    color: this.COLORS.gray
                });
                shipY -= 12;
            }
        });
        return yPosition - Math.max(buyerLines.length, shipLines.length) * 12 - 20; // Move down
    }
    /**
     * Draw summary section with QR code and VAT details
     */
    async drawSummaryWithQRCode(invoice) {
        const { page } = this.pages[this.currentPageIndex];
        let { currentY: yPosition } = this.pages[this.currentPageIndex];
        const fontBold = this.fontBold;
        const fontRegular = this.fontRegular;
        // Calculer les détails de TVA
        const vatDetails = this.calculateVATDetails(invoice);
        // Calculer l'espace nécessaire pour les conditions de paiement et footer
        const paymentConditionsHeight = 120; // Espace pour les conditions de paiement
        const footerHeight = 80; // Espace pour le footer
        const minSpaceFromBottom = paymentConditionsHeight + footerHeight;
        // Calculer la hauteur optimale du cadre de synthèse
        const vatDetailsHeight = vatDetails.length > 0 ? vatDetails.length * 15 + 30 : 0; // Réduit de 20 à 15
        const baseSectionHeight = 100; // Réduit de 130 à 100
        const sectionHeight = baseSectionHeight + vatDetailsHeight;
        // Vérifier si on a assez d'espace sur la page courante
        const requiredSpace = sectionHeight + minSpaceFromBottom;
        if (yPosition - requiredSpace < this.MARGIN + 60) {
            // Pas assez d'espace, créer une nouvelle page
            this.createNewPage();
            await this.drawPageHeader(invoice);
            yPosition = this.pages[this.currentPageIndex].currentY;
            yPosition -= 30; // Espace après header sur nouvelle page
            this.updateCurrentPageY(yPosition);
        }
        const qrSize = 113.39; // 40mm
        const gap = 28.35; // 10mm
        const summaryWidth = this.A4_WIDTH - this.MARGIN * 2 - qrSize - gap;
        const summaryX = this.MARGIN + qrSize + gap;
        // QR Code avec données de paiement
        const qrX = this.MARGIN;
        const qrY = yPosition - qrSize;
        // Fond blanc + bordure
        page.drawRectangle({
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
            borderColor: this.COLORS.primary,
            borderWidth: 1.5
        });
        // Pattern QR code (encodage simplifié des données de paiement)
        const qrPattern = this.generateSimpleQRPattern();
        const cellSize = Math.floor(qrSize / (qrPattern.length + 4));
        const qrOffset = (qrSize - qrPattern.length * cellSize) / 2;
        qrPattern.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    page.drawRectangle({
                        x: qrX + qrOffset + (j * cellSize),
                        y: qrY + qrSize - qrOffset - ((i + 1) * cellSize),
                        width: cellSize,
                        height: cellSize,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0)
                    });
                }
            });
        });
        // Label sous le QR code avec détails de paiement
        const invoiceNum = invoice.header?.invoiceNumber || '';
        const qrTotal = this.formatCurrency(this.calculateTotal(invoice));
        const iban = invoice.payment?.payeeIBAN || '';
        const qrLabels = [
            this.config.paymentLink ? 'Scanner pour payer' : 'Paiement',
            `Ref: ${invoiceNum}`,
            `Montant: ${qrTotal}`,
        ];
        if (iban)
            qrLabels.push(`IBAN: ${iban.substring(0, 14)}...`);
        let labelY = qrY - 10;
        qrLabels.forEach(label => {
            const lw = fontRegular.widthOfTextAtSize(label, 6.5);
            page.drawText(label, {
                x: qrX + (qrSize - lw) / 2,
                y: labelY,
                size: 6.5,
                font: fontRegular,
                color: this.COLORS.gray
            });
            labelY -= 9;
        });
        // Summary box avec hauteur ajustée
        page.drawRectangle({
            x: summaryX,
            y: yPosition - sectionHeight,
            width: summaryWidth,
            height: sectionHeight,
            color: this.COLORS.grayLight,
            borderColor: this.COLORS.pink,
            borderWidth: 0.5
        });
        // Summary content
        const innerPadding = 11.34; // 4mm
        let summaryY = yPosition - 20;
        const subtotal = this.calculateSubtotal(invoice);
        const vatAmount = this.calculateVAT(invoice);
        const total = this.calculateTotal(invoice);
        // Sous-total HT
        page.drawText('Sous-total HT :', {
            x: summaryX + innerPadding,
            y: summaryY,
            size: 9,
            font: fontBold,
            color: (0, pdf_lib_1.rgb)(17 / 255, 24 / 255, 39 / 255)
        });
        let subtotalText = this.formatCurrency(subtotal);
        let subtotalWidth = fontRegular.widthOfTextAtSize(subtotalText, 9);
        page.drawText(subtotalText, {
            x: summaryX + summaryWidth - innerPadding - subtotalWidth,
            y: summaryY,
            size: 9,
            font: fontRegular,
            color: this.COLORS.dark
        });
        summaryY -= 20; // Réduit de 25 à 20
        // Détail de la TVA section
        if (vatDetails.length > 0) {
            // Titre "Détail de la TVA :" à gauche
            page.drawText('Détail de la TVA :', {
                x: summaryX + innerPadding,
                y: summaryY,
                size: 9,
                font: fontBold,
                color: (0, pdf_lib_1.rgb)(17 / 255, 24 / 255, 39 / 255)
            });
            // Box pour le détail de la TVA à droite du titre
            const vatBoxWidth = summaryWidth - innerPadding - 120; // 120 points pour le titre à gauche
            const vatBoxHeight = vatDetails.length * 15 + 20; // Réduit la hauteur
            const vatBoxX = summaryX + innerPadding + 120; // À droite du titre
            page.drawRectangle({
                x: vatBoxX,
                y: summaryY - vatBoxHeight + 8, // Ajusté pour alignement avec le titre
                width: vatBoxWidth,
                height: vatBoxHeight,
                color: this.COLORS.pinkLight,
                borderWidth: 0 // Suppression de la bordure
            });
            // En-têtes du tableau TVA
            const vatHeaderY = summaryY - 3; // Aligné avec le titre
            const colWidth = vatBoxWidth / 3;
            page.drawText('Taux TVA', {
                x: vatBoxX + 5,
                y: vatHeaderY,
                size: 8,
                font: fontBold,
                color: this.COLORS.dark
            });
            page.drawText('Base HT', {
                x: vatBoxX + colWidth + 5,
                y: vatHeaderY,
                size: 8,
                font: fontBold,
                color: this.COLORS.dark
            });
            page.drawText('Montant TVA', {
                x: vatBoxX + (colWidth * 2) + 5,
                y: vatHeaderY,
                size: 8,
                font: fontBold,
                color: this.COLORS.dark
            });
            // Lignes de détail TVA
            let vatRowY = vatHeaderY - 12; // Réduit de 15 à 12
            vatDetails.forEach((detail) => {
                // Taux TVA
                page.drawText(`${(detail.rate * 100).toFixed(0)}%`, {
                    x: vatBoxX + 5,
                    y: vatRowY,
                    size: 8,
                    font: fontRegular,
                    color: this.COLORS.dark
                });
                // Base HT (alignée à droite dans sa colonne)
                const baseText = this.formatCurrency(detail.base);
                const baseWidth = fontRegular.widthOfTextAtSize(baseText, 8);
                page.drawText(baseText, {
                    x: vatBoxX + colWidth - baseWidth - 5,
                    y: vatRowY,
                    size: 8,
                    font: fontRegular,
                    color: this.COLORS.dark
                });
                // Montant TVA (aligné à droite dans sa colonne)
                const amountText = this.formatCurrency(detail.amount);
                const amountWidth = fontRegular.widthOfTextAtSize(amountText, 8);
                page.drawText(amountText, {
                    x: vatBoxX + (colWidth * 2) - amountWidth - 5,
                    y: vatRowY,
                    size: 8,
                    font: fontRegular,
                    color: this.COLORS.dark
                });
                vatRowY -= 12; // Réduit de 15 à 12
            });
            summaryY -= Math.max(vatBoxHeight - 8, 12); // Ajuster la position Y
        }
        // TVA totale
        summaryY -= 5; // Petit espace supplémentaire
        page.drawText('TVA :', {
            x: summaryX + innerPadding,
            y: summaryY,
            size: 9,
            font: fontBold,
            color: (0, pdf_lib_1.rgb)(17 / 255, 24 / 255, 39 / 255)
        });
        let vatText = this.formatCurrency(vatAmount);
        let vatTextWidth = fontRegular.widthOfTextAtSize(vatText, 9);
        page.drawText(vatText, {
            x: summaryX + summaryWidth - innerPadding - vatTextWidth,
            y: summaryY,
            size: 9,
            font: fontRegular,
            color: this.COLORS.dark
        });
        // Separator line
        summaryY -= 12; // Réduit de 15 à 12
        page.drawLine({
            start: { x: summaryX + innerPadding, y: summaryY },
            end: { x: summaryX + summaryWidth - innerPadding, y: summaryY },
            thickness: 1,
            color: this.COLORS.pink
        });
        // Total
        summaryY -= 15; // Réduit de 20 à 15
        page.drawText('Total TTC :', {
            x: summaryX + innerPadding,
            y: summaryY,
            size: 9,
            font: fontBold,
            color: (0, pdf_lib_1.rgb)(190 / 255, 24 / 255, 93 / 255) // pink-700
        });
        let totalText = this.formatCurrency(total);
        let totalTextWidth = fontBold.widthOfTextAtSize(totalText, 11);
        page.drawText(totalText, {
            x: summaryX + summaryWidth - innerPadding - totalTextWidth,
            y: summaryY,
            size: 11,
            font: fontBold,
            color: (0, pdf_lib_1.rgb)(190 / 255, 24 / 255, 93 / 255)
        });
        return yPosition - sectionHeight - 28.35; // Additional spacing
    }
    /**
     * Met à jour la position Y de la page courante
     */
    updateCurrentPageY(newY) {
        if (this.pages.length > 0) {
            this.pages[this.currentPageIndex].currentY = newY;
        }
    }
    /**
     * Vérifie si il faut créer une nouvelle page
     */
    needsNewPage(requiredHeight) {
        const { currentY } = this.pages[this.currentPageIndex];
        return currentY - requiredHeight < this.MARGIN + 60; // 60 points d'espace pour le footer
    }
    /**
     * Dessine le contenu de la première page avec en-tête uniforme
     */
    async drawFirstPageContent(invoice) {
        // 1. En-tête de page (numéro de document + QR code) - MAINTENANT sur toutes les pages
        let yPosition = this.pages[this.currentPageIndex].currentY;
        yPosition = await this.drawPageHeaderTop(invoice, yPosition);
        this.updateCurrentPageY(yPosition);
        // 2. Header complet pour la première page
        yPosition = await this.drawCompleteHeader(invoice, yPosition);
        this.updateCurrentPageY(yPosition);
        // 3. Ajouter de l'espace avant les sections de facturation et livraison
        yPosition -= 30; // Espace supplémentaire pour éviter le conflit avec les détails du destinataire
        this.updateCurrentPageY(yPosition);
        // 4. Sections de facturation et livraison
        yPosition = await this.drawBillingShippingSections(invoice);
        this.updateCurrentPageY(yPosition);
        // 5. Espace après l'en-tête (header) avant la table
        yPosition -= 30; // Espace après l'en-tête
        this.updateCurrentPageY(yPosition);
    }
    /**
     * Dessine uniquement le tableau des items
     */
    async drawItemsTable(invoice) {
        const { page } = this.pages[this.currentPageIndex];
        let { currentY: yPosition } = this.pages[this.currentPageIndex];
        // Dessiner l'en-tête du tableau
        yPosition = await this.drawTableHeader(yPosition);
        this.updateCurrentPageY(yPosition);
        // Dessiner chaque ligne
        for (let index = 0; index < invoice.lines.length; index++) {
            const item = invoice.lines[index];
            const rowHeight = 28.35;
            // Vérifier s'il faut une nouvelle page
            if (this.needsNewPage(rowHeight)) {
                this.createNewPage();
                // Dessiner header sur nouvelle page
                yPosition = await this.drawPageHeader(invoice);
                // Redessiner l'en-tête du tableau
                yPosition = await this.drawTableHeader(yPosition);
                this.updateCurrentPageY(yPosition);
            }
            yPosition = await this.drawTableRow(item, index, yPosition);
            this.updateCurrentPageY(yPosition);
        }
    }
    /**
     * Dessine la synthèse sur la dernière page avec toutes les informations de paiement
     * S'assure que tout s'affiche sur la même page
     */
    async drawSummaryOnLastPage(invoice) {
        let { currentY: yPosition } = this.pages[this.currentPageIndex];
        // Calculer l'espace total nécessaire pour synthèse + conditions + paiement
        const summaryHeight = 200; // Synthèse avec QR code et détails TVA
        const paymentConditionsHeight = 120; // Conditions de paiement
        const totalRequiredHeight = summaryHeight + paymentConditionsHeight + 60; // +60 pour espacement
        // Vérifier s'il faut une nouvelle page pour tout afficher ensemble
        if (this.needsNewPage(totalRequiredHeight)) {
            this.createNewPage();
            yPosition = await this.drawPageHeader(invoice);
            yPosition -= 30; // Espace après header sur nouvelle page
            this.updateCurrentPageY(yPosition);
        }
        else {
            // Ajouter de l'espace entre les items et la synthèse
            yPosition -= 40;
            this.updateCurrentPageY(yPosition);
        }
        // Dessiner la synthèse avec QR code
        yPosition = await this.drawSummaryWithQRCode(invoice);
        this.updateCurrentPageY(yPosition);
        // Ajouter les conditions de vente et moyens de paiement
        yPosition = await this.drawPaymentTermsAndConditions(invoice, yPosition);
        this.updateCurrentPageY(yPosition);
    }
    /**
     * Dessine le tableau des items et la synthèse
     */
    async drawItemsAndSummary(invoice) {
        const { page } = this.pages[this.currentPageIndex];
        let { currentY: yPosition } = this.pages[this.currentPageIndex];
        // Dessiner l'en-tête du tableau
        yPosition = await this.drawTableHeader(yPosition);
        this.updateCurrentPageY(yPosition);
        // Dessiner chaque ligne
        for (let index = 0; index < invoice.lines.length; index++) {
            const item = invoice.lines[index];
            const rowHeight = 28.35;
            // Vérifier s'il faut une nouvelle page
            if (this.needsNewPage(rowHeight)) {
                this.createNewPage();
                // Dessiner header sur nouvelle page
                yPosition = await this.drawPageHeader(invoice);
                // Redessiner l'en-tête du tableau
                yPosition = await this.drawTableHeader(yPosition);
                this.updateCurrentPageY(yPosition);
            }
            yPosition = await this.drawTableRow(item, index, yPosition);
            this.updateCurrentPageY(yPosition);
        }
        // Ajouter de l'espace entre les items et la synthèse
        yPosition -= 40;
        this.updateCurrentPageY(yPosition);
        // Dessiner la synthèse
        yPosition = await this.drawSummaryWithQRCode(invoice);
        this.updateCurrentPageY(yPosition);
        // Ajouter les conditions de vente et moyens de paiement
        yPosition = await this.drawPaymentTermsAndConditions(invoice, yPosition);
        this.updateCurrentPageY(yPosition);
    }
    /**
     * Ajoute les pieds de page à toutes les pages
     */
    addFootersToAllPages(invoice) {
        this.pages.forEach((pageInfo, index) => {
            this.addFooterToPage(pageInfo.page, invoice, index + 1);
        });
    }
    /**
     * Ajoute les numéros de page
     */
    addPageNumbers() {
        const totalPages = this.pages.length;
        this.pages.forEach((pageInfo, index) => {
            const pageNumber = index + 1;
            const text = `Page ${pageNumber} sur ${totalPages}`;
            pageInfo.page.drawText(text, {
                x: this.A4_WIDTH - this.MARGIN - this.fontRegular.widthOfTextAtSize(text, 8),
                y: this.MARGIN - 10,
                size: 8,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
        });
    }
    /**
     * Dessine l'en-tête du tableau avec un design moderne et colonnes équilibrées
     */
    async drawTableHeader(yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        // Colonnes du tableau avec largeurs parfaitement équilibrées pour A4
        // Total disponible: 510 points (A4_WIDTH - 2*MARGIN)
        const TABLE_COLS = {
            number: { x: this.MARGIN, width: 25 }, // 25
            description: { x: this.MARGIN + 25, width: 200 }, // 200  
            quantity: { x: this.MARGIN + 225, width: 45 }, // 45
            unit: { x: this.MARGIN + 270, width: 45 }, // 45
            unitPrice: { x: this.MARGIN + 315, width: 65 }, // 65
            vat: { x: this.MARGIN + 380, width: 45 }, // 45
            total: { x: this.MARGIN + 425, width: 85 } // 85 = TOTAL: 510
        };
        const headerHeight = 35;
        // Dégradé de fond moderne pour l'en-tête
        page.drawRectangle({
            x: this.MARGIN,
            y: yPosition - headerHeight,
            width: this.CONTENT_WIDTH,
            height: headerHeight,
            color: this.COLORS.pink
        });
        // Bordure supérieure plus claire pour l'effet moderne
        page.drawRectangle({
            x: this.MARGIN,
            y: yPosition - 6,
            width: this.CONTENT_WIDTH,
            height: 6,
            color: (0, pdf_lib_1.rgb)(0.95, 0.7, 0.85) // Rose plus clair
        });
        // Séparateurs verticaux subtils entre colonnes
        const separatorColor = (0, pdf_lib_1.rgb)(1, 1, 1);
        const separatorPositions = [
            TABLE_COLS.description.x,
            TABLE_COLS.quantity.x,
            TABLE_COLS.unit.x,
            TABLE_COLS.unitPrice.x,
            TABLE_COLS.vat.x,
            TABLE_COLS.total.x
        ];
        separatorPositions.forEach(x => {
            page.drawLine({
                start: { x, y: yPosition },
                end: { x, y: yPosition - headerHeight },
                thickness: 0.5,
                color: separatorColor,
                opacity: 0.4
            });
        });
        const headerY = yPosition - 22;
        // En-têtes avec texte blanc et typographie moderne
        page.drawText('#', {
            x: TABLE_COLS.number.x + 8,
            y: headerY,
            size: 11,
            font: this.fontBold,
            color: (0, pdf_lib_1.rgb)(1, 1, 1)
        });
        page.drawText('DESCRIPTION', {
            x: TABLE_COLS.description.x + 8,
            y: headerY,
            size: 11,
            font: this.fontBold,
            color: (0, pdf_lib_1.rgb)(1, 1, 1)
        });
        // Autres en-têtes centrés avec couleur blanche
        this.drawCenteredHeaderText(page, 'QTÉ', TABLE_COLS.quantity, headerY, (0, pdf_lib_1.rgb)(1, 1, 1));
        this.drawCenteredHeaderText(page, 'UNITÉ', TABLE_COLS.unit, headerY, (0, pdf_lib_1.rgb)(1, 1, 1));
        this.drawCenteredHeaderText(page, 'PRIX U.', TABLE_COLS.unitPrice, headerY, (0, pdf_lib_1.rgb)(1, 1, 1));
        this.drawCenteredHeaderText(page, 'TVA%', TABLE_COLS.vat, headerY, (0, pdf_lib_1.rgb)(1, 1, 1));
        this.drawRightAlignedHeaderText(page, 'TOTAL €', TABLE_COLS.total, headerY, (0, pdf_lib_1.rgb)(1, 1, 1));
        return yPosition - headerHeight;
    }
    /**
     * Dessine une ligne du tableau avec description multi-lignes
     */
    async drawTableRow(item, index, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        const baseRowHeight = 30;
        // Mêmes colonnes que dans drawTableHeader - EXACTEMENT LES MÊMES
        const TABLE_COLS = {
            number: { x: this.MARGIN, width: 25 },
            description: { x: this.MARGIN + 25, width: 200 },
            quantity: { x: this.MARGIN + 225, width: 45 },
            unit: { x: this.MARGIN + 270, width: 45 },
            unitPrice: { x: this.MARGIN + 315, width: 65 },
            vat: { x: this.MARGIN + 380, width: 45 },
            total: { x: this.MARGIN + 425, width: 85 }
        };
        // Diviser la description en lignes en utilisant la largeur complète de la colonne
        const description = item.description || '';
        const descriptionColumnWidth = TABLE_COLS.description.width - 12; // -12 pour les marges
        const descriptionLines = this.wrapText(description, descriptionColumnWidth);
        const actualRowHeight = Math.max(baseRowHeight, descriptionLines.length * 12 + 8);
        // Alternating row colors
        if (index % 2 === 1) {
            page.drawRectangle({
                x: this.MARGIN,
                y: yPosition - actualRowHeight,
                width: this.CONTENT_WIDTH,
                height: actualRowHeight,
                color: this.COLORS.grayLight
            });
        }
        const itemY = yPosition - 15;
        // Numéro de ligne
        page.drawText((index + 1).toString(), {
            x: TABLE_COLS.number.x + 6,
            y: itemY,
            size: 9,
            font: this.fontRegular,
            color: this.COLORS.dark
        });
        // Description multi-lignes
        descriptionLines.forEach((line, lineIndex) => {
            page.drawText(line, {
                x: TABLE_COLS.description.x + 6,
                y: itemY - (lineIndex * 12),
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.dark
            });
        });
        // Centrer verticalement les autres colonnes par rapport à la description
        const centerY = itemY - ((descriptionLines.length - 1) * 12) / 2;
        // Autres colonnes centrées/alignées à droite
        this.drawCenteredCellText(page, item.quantity?.toString() || '1', TABLE_COLS.quantity, centerY);
        this.drawCenteredCellText(page, 'unit', TABLE_COLS.unit, centerY);
        this.drawRightAlignedCellText(page, (item.unitPrice || 0).toFixed(2), TABLE_COLS.unitPrice, centerY);
        this.drawCenteredCellText(page, `${((item.vatRate || 0) * 100).toFixed(0)}`, TABLE_COLS.vat, centerY);
        const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
        this.drawRightAlignedCellText(page, lineTotal.toFixed(2), TABLE_COLS.total, centerY, this.fontBold);
        return yPosition - actualRowHeight;
    }
    /**
     * Divise un texte en lignes selon une largeur maximale en utilisant la largeur de colonne complète
     */
    wrapText(text, maxWidth) {
        if (!text)
            return [''];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = this.fontRegular.widthOfTextAtSize(testLine, 9);
            if (testWidth <= maxWidth) {
                currentLine = testLine;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                }
                else {
                    // Mot trop long, le couper pour tenir dans la largeur
                    let remainingWord = word;
                    while (remainingWord.length > 0) {
                        let cutIndex = remainingWord.length;
                        while (cutIndex > 0) {
                            const testPart = remainingWord.substring(0, cutIndex) + (cutIndex < remainingWord.length ? '...' : '');
                            const partWidth = this.fontRegular.widthOfTextAtSize(testPart, 9);
                            if (partWidth <= maxWidth) {
                                lines.push(testPart);
                                remainingWord = remainingWord.substring(cutIndex);
                                break;
                            }
                            cutIndex--;
                        }
                        if (cutIndex === 0)
                            break; // Sécurité
                    }
                    currentLine = '';
                }
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines.length > 0 ? lines : [''];
    }
    /**
     * Dessine les conditions de paiement et de vente
     */
    async drawPaymentTermsAndConditions(invoice, yPosition) {
        const { page } = this.pages[this.currentPageIndex];
        yPosition -= 30; // Espace avant les conditions
        // Titres des conditions en français et anglais
        page.drawText('CONDITIONS DE PAIEMENT ET DE VENTE', {
            x: this.MARGIN,
            y: yPosition,
            size: 11,
            font: this.fontBold,
            color: this.COLORS.pink
        });
        // Titre en anglais aligné à droite
        const paymentInfoText = 'INFORMATIONS DE PAIEMENT';
        const paymentInfoWidth = this.fontBold.widthOfTextAtSize(paymentInfoText, 11);
        page.drawText(paymentInfoText, {
            x: this.A4_WIDTH - this.MARGIN - paymentInfoWidth,
            y: yPosition,
            size: 11,
            font: this.fontBold,
            color: this.COLORS.pink
        });
        yPosition -= 20;
        // Conditions de paiement à gauche
        const conditions = [
            'Paiement à 30 jours fin de mois.',
            'En cas de retard de paiement, des pénalités seront appliquées.',
            'Aucun escompte pour paiement anticipé.',
            'Réclamations à adresser dans les 8 jours.',
        ];
        let conditionsY = yPosition;
        conditions.forEach(condition => {
            page.drawText(`• ${condition}`, {
                x: this.MARGIN,
                y: conditionsY,
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
            conditionsY -= 15;
        });
        // Informations de paiement à droite
        const paymentDetails = [
            `IBAN : ${invoice.payment?.payeeIBAN || 'FR76 1234 5678 9012 3456 7890 123'}`,
            `BIC : ${invoice.payment?.payeeBIC || 'AGRIFRPP'}`,
            `Référence : ${invoice.header?.invoiceNumber || ''}`,
            `Echéance : ${invoice.payment?.dueDate?.toLocaleDateString('fr-FR') || ''}`
        ];
        let paymentY = yPosition;
        paymentDetails.forEach(detail => {
            const detailWidth = this.fontRegular.widthOfTextAtSize(detail, 9);
            page.drawText(detail, {
                x: this.A4_WIDTH - this.MARGIN - detailWidth,
                y: paymentY,
                size: 9,
                font: this.fontRegular,
                color: this.COLORS.gray
            });
            paymentY -= 15;
        });
        // Retourner la position la plus basse entre les deux colonnes
        const finalY = Math.min(conditionsY, paymentY);
        return finalY;
    }
    /**
     * Méthodes utilitaires pour l'alignement du texte dans les tableaux
     */
    drawCenteredHeaderText(page, text, column, y, color = this.COLORS.gray) {
        const textWidth = this.fontBold.widthOfTextAtSize(text, 10);
        page.drawText(text, {
            x: column.x + (column.width - textWidth) / 2,
            y: y,
            size: 10,
            font: this.fontBold,
            color: color
        });
    }
    drawRightAlignedHeaderText(page, text, column, y, color = this.COLORS.gray) {
        const textWidth = this.fontBold.widthOfTextAtSize(text, 10);
        page.drawText(text, {
            x: column.x + column.width - textWidth - 5,
            y: y,
            size: 10,
            font: this.fontBold,
            color: color
        });
    }
    drawCenteredCellText(page, text, column, y) {
        const textWidth = this.fontRegular.widthOfTextAtSize(text, 8);
        page.drawText(text, {
            x: column.x + (column.width - textWidth) / 2,
            y: y,
            size: 8,
            font: this.fontRegular,
            color: this.COLORS.dark
        });
    }
    drawRightAlignedCellText(page, text, column, y, font = this.fontRegular) {
        const textWidth = font.widthOfTextAtSize(text, 8);
        page.drawText(text, {
            x: column.x + column.width - textWidth - 5,
            y: y,
            size: 8,
            font: font,
            color: this.COLORS.dark
        });
    }
    /**
     * Ajoute un pied de page à une page spécifique
     */
    addFooterToPage(page, invoice, pageNumber) {
        const footerY = 40;
        const siret = this.config.sellerSiret || invoice.seller?.registrationNumber || '';
        const line1 = `${invoice.seller?.name || ''} - SIRET: ${siret} - TVA: ${invoice.seller?.vatNumber || ''}`;
        const line2 = `${invoice.seller?.postalAddress?.line1 || '1 Boulevard de la République'}, ${invoice.seller?.postalAddress?.postalCode || '75010'} ${invoice.seller?.postalAddress?.city || 'Paris'}`;
        // Centered text
        let line1Width = this.fontRegular.widthOfTextAtSize(line1, 8);
        let line2Width = this.fontRegular.widthOfTextAtSize(line2, 8);
        page.drawText(line1, {
            x: (this.A4_WIDTH - line1Width) / 2,
            y: footerY + 15,
            size: 8,
            font: this.fontRegular,
            color: this.COLORS.gray
        });
        page.drawText(line2, {
            x: (this.A4_WIDTH - line2Width) / 2,
            y: footerY,
            size: 8,
            font: this.fontRegular,
            color: this.COLORS.gray
        });
        // Code de facture à gauche dans le pied de page
        const invoiceNumber = invoice.header?.invoiceNumber || 'FACT-2025-001';
        const dateStr = new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '.');
        const dateIdentifier = `${dateStr}.${invoiceNumber}`;
        page.drawText(dateIdentifier, {
            x: this.MARGIN,
            y: footerY,
            size: 8,
            font: this.fontRegular,
            color: this.COLORS.gray
        });
    }
    // Helper methods
    calculateSubtotal(invoice) {
        return invoice.lines.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }
    calculateVAT(invoice) {
        return invoice.lines.reduce((acc, item) => acc + (item.quantity * item.unitPrice * item.vatRate), 0);
    }
    calculateTotal(invoice) {
        return this.calculateSubtotal(invoice) + this.calculateVAT(invoice);
    }
    /**
     * Calculate VAT details grouped by rate
     */
    calculateVATDetails(invoice) {
        const vatMap = new Map();
        invoice.lines.forEach((item) => {
            const rate = item.vatRate || 0;
            const base = item.quantity * item.unitPrice;
            const amount = base * rate;
            if (vatMap.has(rate)) {
                const existing = vatMap.get(rate);
                existing.base += base;
                existing.amount += amount;
            }
            else {
                vatMap.set(rate, { base, amount });
            }
        });
        return Array.from(vatMap.entries())
            .map(([rate, { base, amount }]) => ({ rate, base, amount }))
            .sort((a, b) => a.rate - b.rate); // Sort by rate ascending
    }
    formatCurrency(amount) {
        return `${amount.toFixed(2)} €`;
    }
    /**
     * Génère un pattern simple de QR code pour la démonstration
     */
    generateSimpleQRPattern() {
        return [
            [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0]
        ];
    }
}
exports.InvoiceTemplateFancy = InvoiceTemplateFancy;
