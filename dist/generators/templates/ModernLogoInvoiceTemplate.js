"use strict";
// // src/generators/templates/ModernLogoInvoiceTemplate.ts
// import { PageSizes, PDFDocument, StandardFonts } from "pdf-lib";
// import { TemplateRenderer } from "./TemplateRenderer";
// import { Invoice } from "../../models/Invoice";
// import { RendererOption } from "./RendererOption";
// /**
//  * 2) ModernLogoInvoiceTemplate:
//  * Includes possibility of a **logo** but no background design.
//  */
// export class ModernLogoInvoiceTemplate implements TemplateRenderer {
//   constructor(private baseOptions: RendererOption = {}) {}
//   public async render(
//     pdfDoc: PDFDocument,
//     invoice: Invoice,
//     userOptions: RendererOption
//   ): Promise<void> {
//     const options = { ...this.baseOptions, ...userOptions };
//     // Page config
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
//     let yPos = pageHeight - margin;
//     // Logo (optional)
//     if (options.logo) {
//       try {
//         const scale = options.logoScale ?? 0.3;
//         const embeddedLogo = await pdfDoc.embedPng(options.logo);
//         const dims = embeddedLogo.scale(scale);
//         page.drawImage(embeddedLogo, {
//           x: margin,
//           y: yPos - dims.height,
//           width: dims.width,
//           height: dims.height
//         });
//         yPos -= (dims.height + 20);
//       } catch {
//         // if PNG fails, skip or attempt embedJpg
//       }
//     }
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
//     page.setFont(fontNormal);
//     page.setFontSize(options.fontSizeBody ?? 12);
//     const locale = options.locale ?? 'en-US';
//     page.drawText(`Invoice #${invoice.number}`, { x: margin, y: yPos });
//     yPos -= 15;
//     page.drawText(`Date: ${invoice.issueDate.toLocaleDateString(locale)}`, { x: margin, y: yPos });
//     yPos -= 30;
//     // Seller
//     if (options.showSellerDetails !== false) {
//       page.drawText(options.sellerLabel ?? 'Seller:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.seller.name, { x: margin, y: yPos });
//       yPos -= 15;
//       page.drawText(invoice.seller.address, { x: margin, y: yPos });
//       yPos -= 30;
//     }
//     // Buyer
//     if (options.showBuyerDetails !== false) {
//       page.drawText(options.buyerLabel ?? 'Buyer:', { x: margin, y: yPos, font: fontBold });
//       yPos -= 15;
//       page.drawText(invoice.buyer.name, { x: margin, y: yPos });
//       yPos -= 15;
//       page.drawText(invoice.buyer.address, { x: margin, y: yPos });
//       yPos -= 30;
//     }
//     // Items
//     page.drawText('Items:', { x: margin, y: yPos, font: fontBold });
//     yPos -= 20;
//     for (const line of invoice.lines) {
//       const lineTotal = line.quantity * line.unitPrice;
//       page.drawText(
//         `- ${line.description}: ${line.quantity} x ${line.unitPrice} = ${lineTotal.toFixed(2)}`,
//         { x: margin + 10, y: yPos }
//       );
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
//       page.drawText(invoice.notes, { x: margin, y: yPos });
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
