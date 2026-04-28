"use strict";
// import { PDFDocument, StandardFonts, PageSizes } from 'pdf-lib';
// import { Invoice } from '../../models/Invoice';
// import { RendererOption } from './RendererOption';
// import { TemplateRenderer } from './TemplateRenderer';
// export class DefaultInvoiceTemplate implements TemplateRenderer {
//   constructor(private baseOptions: RendererOption = {}) {}
//   public async render(
//     pdfDoc: PDFDocument,
//     invoice: Invoice,
//     mergedOptions: RendererOption
//   ): Promise<void> {
//     // Merge baseOptions with mergedOptions if needed (template's internal logic)
//     const finalOpts: RendererOption = { ...this.baseOptions, ...mergedOptions };
//     // Determine page size
//     let [pageWidth, pageHeight] = PageSizes.A4;
//     if (finalOpts.pageSize === 'Letter') {
//       [pageWidth, pageHeight] = PageSizes.Letter;
//     } else if (typeof finalOpts.pageSize === 'object') {
//       pageWidth = finalOpts.pageSize.width;
//       pageHeight = finalOpts.pageSize.height;
//     }
//     if (finalOpts.orientation === 'landscape') {
//       [pageWidth, pageHeight] = [pageHeight, pageWidth];
//     }
//     const page = pdfDoc.addPage([pageWidth, pageHeight]);
//     const margin = finalOpts.margin ?? 40;
//     // Fonts
//     const fontNormal = await pdfDoc.embedFont(finalOpts.fontFamilyNormal ?? StandardFonts.Helvetica);
//     const fontBold = await pdfDoc.embedFont(finalOpts.fontFamilyBold ?? StandardFonts.HelveticaBold);
//     // Header
//     let yPos = pageHeight - margin;
//     if (finalOpts.logo) {
//       try {
//         const scale = finalOpts.logoScale ?? 0.3;
//         const embedded = await pdfDoc.embedPng(finalOpts.logo);
//         const dims = embedded.scale(scale);
//         page.drawImage(embedded, {
//           x: margin,
//           y: yPos - dims.height,
//           width: dims.width,
//           height: dims.height
//         });
//         yPos -= (dims.height + 20);
//       } catch {
//         // If PNG fails, you might attempt embedJpg, or skip
//       }
//     }
//     if (finalOpts.showHeader !== false) {
//       page.drawText(finalOpts.headerTitle ?? 'INVOICE', {
//         x: margin,
//         y: yPos,
//         size: finalOpts.fontSizeHeading ?? 18,
//         font: fontBold,
//       });
//       yPos -= 30;
//     }
//     // Invoice info
//     page.setFont(fontNormal);
//     page.setFontSize(finalOpts.fontSizeBody ?? 12);
//     const locale = finalOpts.locale ?? 'en-US';
//     page.drawText(`Invoice #${invoice.number}`, { x: margin, y: yPos });
//     yPos -= 15;
//     page.drawText(`Date: ${invoice.issueDate.toLocaleDateString(locale)}`, { x: margin, y: yPos });
//     yPos -= 30;
//     // Seller & Buyer
//     if (finalOpts.showSellerDetails !== false) {
//       page.drawText(finalOpts.sellerLabel ?? 'Seller:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.seller.name, { x: margin, y: yPos });
//       yPos -= 15;
//       page.drawText(invoice.seller.address, { x: margin, y: yPos });
//       yPos -= 30;
//     }
//     if (finalOpts.showBuyerDetails !== false) {
//       page.drawText(finalOpts.buyerLabel ?? 'Buyer:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.buyer.name, { x: margin, y: yPos });
//       yPos -= 15;
//       page.drawText(invoice.buyer.address, { x: margin, y: yPos });
//       yPos -= 30;
//     }
//     // Items (basic example)
//     page.drawText('Items:', { x: margin, y: yPos, font: fontBold });
//     yPos -= 20;
//     for (const line of invoice.lines) {
//       const lineTotal = line.quantity * line.unitPrice;
//       page.drawText(`- ${line.description}: ${line.quantity} x ${line.unitPrice} = ${lineTotal.toFixed(2)}`, {
//         x: margin + 10,
//         y: yPos,
//       });
//       yPos -= 15;
//     }
//     // Totals
//     yPos -= 20;
//     if (finalOpts.showSubtotal !== false) {
//       page.drawText(`Net Total: ${invoice.getNetTotal().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 15;
//     }
//     if (finalOpts.showVat !== false) {
//       page.drawText(`VAT Total: ${invoice.getVatTotal().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 15;
//     }
//     if (finalOpts.showGrandTotal !== false) {
//       const label = finalOpts.totalsLabel ?? 'Grand Total';
//       page.drawText(`${label}: ${invoice.getTotalWithVat().toFixed(2)}`, { x: margin, y: yPos });
//       yPos -= 20;
//     }
//     // Notes
//     if (invoice.notes) {
//       page.drawText('Notes:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.notes, { x: margin, y: yPos });
//       yPos -= 15;
//     }
//     // Footer note
//     if (finalOpts.footerNote) {
//       page.drawText(finalOpts.footerNote, {
//         x: margin,
//         y: 40,
//         font: fontNormal,
//         size: 10,
//       });
//     }
//   }
// }
