"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modern2024InvoiceTemplate = void 0;
const pdf_lib_1 = require("pdf-lib");
class Modern2024InvoiceTemplate {
    constructor(baseOptions = {}) {
        this.baseOptions = baseOptions;
    }
    async render(pdfDoc, invoice, userOptions) {
        // Merge base + user
        const options = { ...this.baseOptions, ...userOptions };
        // 1) Page Setup
        let [pageWidth, pageHeight] = pdf_lib_1.PageSizes.A4;
        if (options.pageSize === 'Letter') {
            [pageWidth, pageHeight] = pdf_lib_1.PageSizes.Letter;
        }
        else if (typeof options.pageSize === 'object') {
            pageWidth = options.pageSize.width;
            pageHeight = options.pageSize.height;
        }
        if (options.orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const margin = options.margin ?? 50;
        // The brand color might serve for top banner, table headers, etc.
        const brandColor = options.brandColor ?? (0, pdf_lib_1.rgb)(0.2, 0.4, 0.7);
        const textColor = options.textColor ?? (0, pdf_lib_1.rgb)(0, 0, 0);
        // A subtle secondary color, for backgrounds (light shading of row, etc.)
        const secondaryBgColor = (0, pdf_lib_1.rgb)(0.9, 0.95, 1);
        // 2) Background color
        if (options.backgroundColor) {
            page.drawRectangle({
                x: 0, y: 0,
                width: pageWidth, height: pageHeight,
                color: options.backgroundColor
            });
        }
        // 3) Top brand-colored header band
        const headerBandHeight = options.headerHeight ?? 70;
        page.drawRectangle({
            x: 0,
            y: pageHeight - headerBandHeight,
            width: pageWidth,
            height: headerBandHeight,
            color: brandColor
        });
        // 4) Fonts
        const fontNormal = await pdfDoc.embedFont(options.fontFamilyNormal ?? pdf_lib_1.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(options.fontFamilyBold ?? pdf_lib_1.StandardFonts.HelveticaBold);
        // 5) Optional logo in header
        let headerTopY = pageHeight - 20;
        if (options.logo) {
            try {
                const scale = options.logoScale ?? 0.3;
                const embeddedLogo = await pdfDoc.embedPng(options.logo);
                const dims = embeddedLogo.scale(scale);
                const yLogo = pageHeight - dims.height - 10;
                page.drawImage(embeddedLogo, {
                    x: margin,
                    y: yLogo,
                    width: dims.width,
                    height: dims.height
                });
                headerTopY = yLogo - 10;
            }
            catch {
                // skip if embed fails
            }
        }
        // Title in header (top-right)
        if (options.showHeader !== false) {
            const headerTitle = options.headerTitle ?? 'INVOICE';
            const titleSize = options.fontSizeHeading ?? 24;
            const titleWidth = fontBold.widthOfTextAtSize(headerTitle, titleSize);
            const titleX = pageWidth - margin - titleWidth;
            const titleY = pageHeight - headerBandHeight + (headerBandHeight - titleSize) / 2;
            page.drawText(headerTitle, {
                x: titleX,
                y: titleY,
                font: fontBold,
                size: titleSize,
                color: options.headerTextColor ?? (0, pdf_lib_1.rgb)(1, 1, 1),
            });
        }
        page.setFont(fontNormal);
        page.setFontSize(options.fontSizeBody ?? 12);
        // 6) Current Y just below the brand band
        let currentY = pageHeight - headerBandHeight - 30;
        const leftX = margin;
        const rightX = pageWidth / 2 + margin / 2;
        // 7) Invoice info block (left)
        const locale = options.locale ?? 'en-US';
        const dateString = invoice.issueDate.toLocaleDateString(locale);
        const invoiceNumber = invoice.number ? `Invoice #${invoice.number}` : 'Invoice';
        page.drawText(invoiceNumber, {
            x: leftX,
            y: currentY,
            font: fontBold,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        currentY -= 15;
        page.drawText(`Date: ${dateString}`, {
            x: leftX,
            y: currentY,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        // 8) Seller block (on the left, just below invoice info)
        let sellerBlockY = currentY - 30;
        const sellerBoxHeight = 60; // approximate
        // A subtle background rectangle behind Seller details
        page.drawRectangle({
            x: leftX - 5,
            y: sellerBlockY - 5,
            width: pageWidth / 2 - margin,
            height: sellerBoxHeight,
            color: secondaryBgColor
        });
        sellerBlockY -= 5; // padding inside
        page.drawText(options.sellerLabel ?? 'Seller:', {
            x: leftX,
            y: sellerBlockY,
            font: fontBold,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        sellerBlockY -= 15;
        page.drawText(`${invoice.seller.name}\n${invoice.seller.address}`, {
            x: leftX,
            y: sellerBlockY,
            lineHeight: 12,
            font: fontNormal,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        // 9) Buyer block (on the right, aligned top with Seller block)
        let buyerBlockY = currentY - 30;
        const buyerBoxHeight = 60; // approximate
        page.drawRectangle({
            x: rightX - 5,
            y: buyerBlockY - 5,
            width: pageWidth / 2 - margin,
            height: buyerBoxHeight,
            color: secondaryBgColor
        });
        buyerBlockY -= 5;
        page.drawText(options.buyerLabel ?? 'Buyer:', {
            x: rightX,
            y: buyerBlockY,
            font: fontBold,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        buyerBlockY -= 15;
        page.drawText(`${invoice.buyer.name}\n${invoice.buyer.address}`, {
            x: rightX,
            y: buyerBlockY,
            lineHeight: 12,
            font: fontNormal,
            size: options.fontSizeBody ?? 12,
            color: textColor
        });
        // 10) Adjust currentY to below these blocks
        currentY -= 100;
        // 11) Items Table
        const columns = options.columns ?? [];
        if (columns.length > 0) {
            // Table header row
            const tableX = margin;
            let tableWidth = columns.reduce((acc, c) => acc + c.width, 0);
            if (tableWidth > pageWidth - margin * 2) {
                tableWidth = pageWidth - margin * 2;
            }
            // Table header background
            const headerRowHeight = 20;
            page.drawRectangle({
                x: tableX,
                y: currentY,
                width: tableWidth,
                height: headerRowHeight,
                color: brandColor
            });
            page.setFont(fontBold);
            page.setFontSize(options.fontSizeBody ?? 12);
            let xPos = tableX;
            const headerY = currentY + 5; // text offset
            for (const col of columns) {
                let txtX = xPos + 5; // default left align
                if (col.align === 'right') {
                    const colTitleWidth = fontBold.widthOfTextAtSize(col.header, options.fontSizeBody ?? 12);
                    txtX = xPos + col.width - colTitleWidth - 5;
                }
                else if (col.align === 'center') {
                    const colTitleWidth = fontBold.widthOfTextAtSize(col.header, options.fontSizeBody ?? 12);
                    txtX = xPos + (col.width / 2) - (colTitleWidth / 2);
                }
                page.drawText(col.header, {
                    x: txtX,
                    y: headerY,
                    color: (0, pdf_lib_1.rgb)(1, 1, 1) // header text in white
                });
                xPos += col.width;
            }
            currentY -= headerRowHeight;
            // Table rows
            page.setFont(fontNormal);
            const rowHeight = options.rowSpacing ?? 18;
            for (let i = 0; i < invoice.lines.length; i++) {
                const line = invoice.lines[i];
                const rowY = currentY - rowHeight * i;
                // Alternate background color for row
                if (i % 2 === 0) {
                    page.drawRectangle({
                        x: tableX,
                        y: rowY,
                        width: tableWidth,
                        height: rowHeight,
                        color: secondaryBgColor
                    });
                }
                // Now the cells
                let colX = tableX;
                for (const col of columns) {
                    const cellVal = String(line[col.id] ?? '');
                    const textWidth = fontNormal.widthOfTextAtSize(cellVal, options.fontSizeBody ?? 12);
                    let drawX = colX + 5;
                    if (col.align === 'right') {
                        drawX = colX + col.width - textWidth - 5;
                    }
                    else if (col.align === 'center') {
                        drawX = colX + (col.width / 2) - (textWidth / 2);
                    }
                    page.drawText(cellVal, {
                        x: drawX,
                        y: rowY + 4,
                        color: textColor,
                        size: options.fontSizeBody ?? 12,
                    });
                    colX += col.width;
                }
            }
            currentY -= rowHeight * invoice.lines.length;
        }
        else {
            // If no columns defined, fallback or skip table
            page.drawText('No columns defined for items.', { x: margin, y: currentY });
            currentY -= 20;
        }
        currentY -= 30;
        // 12) Totals Section
        page.setFont(fontBold);
        const totalsLabelX = pageWidth - margin - 100; // right-aligned area
        if (options.showSubtotal !== false) {
            const label = 'Subtotal: ';
            const val = invoice.getNetTotal().toFixed(2);
            const labelWidth = fontBold.widthOfTextAtSize(label, options.fontSizeBody ?? 12);
            page.drawText(label, {
                x: totalsLabelX,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            page.drawText(val, {
                x: totalsLabelX + labelWidth,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 15;
        }
        if (options.showVat !== false) {
            const label = 'VAT: ';
            const val = invoice.getVatTotal().toFixed(2);
            const labelWidth = fontBold.widthOfTextAtSize(label, options.fontSizeBody ?? 12);
            page.drawText(label, {
                x: totalsLabelX,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            page.drawText(val, {
                x: totalsLabelX + labelWidth,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 15;
        }
        if (options.showGrandTotal !== false) {
            const label = options.totalsLabel ?? 'Grand Total: ';
            const val = invoice.getTotalWithVat().toFixed(2);
            const labelWidth = fontBold.widthOfTextAtSize(label, options.fontSizeBody ?? 12);
            page.drawText(label, {
                x: totalsLabelX,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            page.drawText(val, {
                x: totalsLabelX + labelWidth,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 25;
        }
        // 13) Notes
        page.setFont(fontNormal);
        if (invoice.notes) {
            page.drawText('Notes:', {
                x: leftX,
                y: currentY,
                font: fontBold,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 15;
            page.drawText(invoice.notes, {
                x: leftX,
                y: currentY,
                lineHeight: 12,
                color: textColor,
                size: options.fontSizeBody ?? 12,
                maxWidth: pageWidth - margin * 2
            });
            currentY -= 40;
        }
        // 14) Payment Terms
        if (invoice.paymentTerms) {
            page.drawText('Payment Terms:', {
                x: leftX,
                y: currentY,
                font: fontBold,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 15;
            page.drawText(invoice.paymentTerms, {
                x: leftX,
                y: currentY,
                size: options.fontSizeBody ?? 12,
                color: textColor
            });
            currentY -= 30;
        }
        // 15) Footer
        if (options.footerNote) {
            page.drawText(options.footerNote, {
                x: margin,
                y: 30,
                size: 10,
                color: textColor
            });
        }
    }
}
exports.Modern2024InvoiceTemplate = Modern2024InvoiceTemplate;
