"use strict";
// // ==================================================
// // File: /src/generators/templates/ModernInvoiceTemplate.ts
// // (A TypeScript class-based modern invoice template using pdf-lib)
// // ==================================================
// import { PDFDocument, PageSizes, StandardFonts } from 'pdf-lib';
// import { Invoice } from '../../models/Invoice';
// import { RendererOption } from './RendererOption';
// import { TemplateRenderer } from './TemplateRenderer';
// /**
//  * 1) DefaultInvoiceTemplate:
//  * An in-design “pure” invoice without logo or background design.
//  * Minimal textual layout with fixed positions for simplicity.
//  */
// export class ModernInvoiceTemplate implements TemplateRenderer {
//   constructor(private baseOptions: RendererOption = {}) {}
//   public async render(
//     pdfDoc: PDFDocument,
//     invoice: Invoice,
//     userOptions: RendererOption
//   ): Promise<void> {
//     // Merge any base options with user-supplied overrides
//     const options = { ...this.baseOptions, ...userOptions };
//     // Page setup
//     let [pageWidth, pageHeight] = PageSizes.A4;
//     if (options.pageSize === 'Letter') {
//       [pageWidth, pageHeight] = PageSizes.Letter;
//     } else if (typeof options.pageSize === 'object') {
//       pageWidth = options.pageSize.width;
//       pageHeight = options.pageSize.height;
//     }
//     if (options.orientation === 'landscape') {
//       [pageWidth, pageHeight] = [pageHeight, pageWidth];
//     }
//     const page = pdfDoc.addPage([pageWidth, pageHeight]);
//     const margin = options.margin ?? 40;
//     // Fonts
//     const fontNormal = await pdfDoc.embedFont(options.fontFamilyNormal ?? StandardFonts.Helvetica);
//     const fontBold   = await pdfDoc.embedFont(options.fontFamilyBold   ?? StandardFonts.HelveticaBold);
//     // Start placing content
//     let yPos = pageHeight - margin;
//     page.setFont(fontNormal);
//     page.setFontSize(options.fontSizeBody ?? 12);
//     // Title
//     if (options.showHeader !== false) {
//       page.drawText(options.headerTitle ?? 'INVOICE', {
//         x: margin,
//         y: yPos,
//         font: fontBold,
//         size: options.fontSizeHeading ?? 18,
//       });
//       yPos -= 30;
//     }
//     // Invoice Info
//     const locale = options.locale ?? 'en-US';
//     page.drawText(`Invoice #${invoice.number}`, { x: margin, y: yPos });
//     yPos -= 15;
//     page.drawText(`Date: ${invoice.issueDate.toLocaleDateString(locale)}`, { x: margin, y: yPos });
//     yPos -= 30;
//     // Seller
//     if (options.showSellerDetails !== false) {
//       page.drawText(options.sellerLabel ?? 'Seller:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.seller.name, { x: margin, y: yPos, font: fontNormal });
//       yPos -= 15;
//       page.drawText(invoice.seller.address, { x: margin, y: yPos, font: fontNormal });
//       yPos -= 30;
//     }
//     // Buyer
//     if (options.showBuyerDetails !== false) {
//       page.drawText(options.buyerLabel ?? 'Buyer:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.buyer.name, { x: margin, y: yPos, font: fontNormal });
//       yPos -= 15;
//       page.drawText(invoice.buyer.address, { x: margin, y: yPos, font: fontNormal });
//       yPos -= 30;
//     }
//     // Items
//     page.drawText('Items:', { x: margin, y: yPos, font: fontBold });
//     yPos -= 20;
//     for (const line of invoice.lines) {
//       const lineTotal = line.quantity * line.unitPrice;
//       const itemText = `- ${line.description}: ${line.quantity} x ${line.unitPrice} = ${lineTotal.toFixed(2)}`;
//       page.drawText(itemText, { x: margin + 10, y: yPos, font: fontNormal });
//       yPos -= 15;
//     }
//     // Totals
//     yPos -= 20;
//     if (options.showSubtotal !== false) {
//       page.drawText(`Net Total: ${invoice.getNetTotal().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 15;
//     }
//     if (options.showVat !== false) {
//       page.drawText(`VAT Total: ${invoice.getVatTotal().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 15;
//     }
//     if (options.showGrandTotal !== false) {
//       const label = options.totalsLabel ?? 'Grand Total';
//       page.drawText(`${label}: ${invoice.getTotalWithVat().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 20;
//     }
//     // Notes
//     if (invoice.notes) {
//       page.drawText('Notes:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.notes, { x: margin, y: yPos, font: fontNormal });
//       yPos -= 15;
//     }
//     // Footer note
//     if (options.footerNote) {
//       page.drawText(options.footerNote, {
//         x: margin,
//         y: 40,
//         font: fontNormal,
//         size: 10,
//       });
//     }
//   }
// }
