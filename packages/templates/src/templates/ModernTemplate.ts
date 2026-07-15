/**
 * @module ModernTemplate
 * @description Clean, professional invoice template inspired by Amazon-style invoices
 *
 * Features:
 * - Ultra-clean, minimal design (almost no color)
 * - Logo top-left, "Facture" title top-right
 * - Green "Payé" / Yellow "En attente" status badge with invoice reference
 * - Buyer address block left, seller info right
 * - "Détails de la facture" table with clean borders
 * - "Facture Total" section with tax breakdown
 * - Legal info footer
 * - Pagination handled by base TemplateRenderer
 */

import { PDFPage } from 'pdf-lib';
import { formatAmount } from '@facturx/core';
import { TemplateRenderer } from '../core/TemplateRenderer';
import { TemplateType } from '../types';

// ============================================================================
// COLOR CONSTANTS — Amazon-inspired: almost monochrome
// ============================================================================
const COLORS = {
  black: '#111111',
  darkGray: '#333333',
  mediumGray: '#555555',
  gray: '#888888',
  lightGray: '#cccccc',
  borderGray: '#dddddd',
  bgGray: '#f5f5f5',
  white: '#ffffff',
  // Only colors: green for "Paid", amber for "Pending"
  greenBorder: '#067d62',
  greenBg: '#f0faf6',
  greenText: '#067d62',
  amberBorder: '#b45309',
  amberBg: '#fffbeb',
  amberText: '#92400e',
};

export class ModernTemplate extends TemplateRenderer {
  protected getTemplateType(): TemplateType {
    return TemplateType.MODERN;
  }

  protected async renderContent(): Promise<void> {
    // 1. Header: Logo + "Facture" + Status badge
    await this.renderModernHeader();

    // 2. Buyer address + Seller info (side by side)
    this.renderModernParties();

    // 3. "Informations de la commande" section
    this.renderOrderInfo();
    this.renderContext.currentY -= 10;

    // 4. "Détails de la facture" items table
    this.renderModernLineItems();
    this.renderContext.currentY -= 10;

    // 5. "Facture Total" + tax breakdown + QR code
    this.renderContext.currentY -= 25;
    this.checkPageBreak(160);
    await this.renderModernTotals();

    // 6. Legal footer
    this.renderContext.currentY -= 15;
    this.checkPageBreak(60);
    this.renderLegalInfo();
  }

  // =========================================================================
  // 1. HEADER — Logo left, "Facture" right, status badge
  // =========================================================================
  private async renderModernHeader(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const invoice = this.context.invoice;
    const startY = this.renderContext.currentY;

    // ---- Logo (top-left) ----
    const logoConsumed = await this.renderLogo(
      margins.left,
      startY,
      140,
      50
    );

    // If no logo, draw seller name as fallback "title"
    if (logoConsumed === 0) {
      this.drawText(invoice.seller.name, margins.left, startY - 18, {
        size: 18,
        bold: true,
        color: COLORS.black,
      });
    }

    // ---- "Facture" title (top-right) ----
    const titleText = this.strings.invoice || 'Facture';
    const titleWidth = this.measureTextWidth(titleText, 22, false);
    this.drawText(titleText, width - margins.right - titleWidth, startY - 18, {
      size: 22,
      color: COLORS.darkGray,
    });

    // ---- Status badge (below Facture, right-aligned) ----
    const badgeW = 260;
    const badgeH = 70;
    const badgeX = width - margins.right - badgeW;
    const badgeY = startY - 35;

    // Neutral badge — light gray, no color
    this.drawRect(badgeX, badgeY - badgeH, badgeW, badgeH, { fillColor: COLORS.bgGray });
    this.drawRect(badgeX, badgeY - badgeH, 3, badgeH, { fillColor: COLORS.darkGray });

    // Status text — dynamic based on paymentStatus / isDraft option
    const isDraftOption = (this.context.options as any).isDraft === true;
    const paymentStatus = (this.context.options as any).paymentStatus || 'PENDING';
    let statusLabel: string;
    if (isDraftOption || paymentStatus === 'DRAFT') {
      statusLabel = 'Brouillon';
    } else if (paymentStatus === 'PAID' || paymentStatus === 'paid') {
      statusLabel = 'Payé';
    } else {
      statusLabel = 'En attente';
    }

    this.drawText(statusLabel, badgeX + 12, badgeY - 16, {
      size: 12,
      bold: true,
      color: COLORS.darkGray,
    });

    // Invoice reference inside badge
    const refLabel = this.strings.invoiceNumber || 'N° de facture';
    this.drawText(`${refLabel}: ${invoice.header.id}`, badgeX + 12, badgeY - 32, {
      size: 8,
      color: COLORS.mediumGray,
    });

    // Due date + Total in badge
    const dueDate = this.getDueDate();
    const dueDateStr = this.formatDateFull(dueDate);
    this.drawText(`${this.strings.dueDate || 'Échéance'}: ${dueDateStr}`, badgeX + 12, badgeY - 45, {
      size: 8,
      color: COLORS.mediumGray,
    });

    const { summary } = this.context;
    this.drawText(
      `Total: ${formatAmount(summary.grandTotal)} ${this.currencySymbol}`,
      badgeX + 12,
      badgeY - 58,
      { size: 9, bold: true, color: COLORS.black }
    );

    this.renderContext.currentY = badgeY - badgeH - 20;
  }

  // =========================================================================
  // 2. PARTIES — Seller left (entreprise), Buyer right (client)
  // =========================================================================
  private renderModernParties(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;
    const colWidth = contentWidth / 3;

    // ---- Column 1 (LEFT): Seller / Entreprise ----
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

    // VAT / SIREN
    if (invoice.seller.vatId) {
      this.drawText(`N° TVA : ${invoice.seller.vatId}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
      y1 -= 13;
    }
    const { sellerSiret, sellerSiren } = this.context.options;
    if (sellerSiren) {
      this.drawText(`SIREN : ${sellerSiren}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
    } else if (sellerSiret) {
      this.drawText(`SIRET : ${sellerSiret}`, col1X, y1, { size: 9, color: COLORS.mediumGray });
    }

    // ---- Column 3 (RIGHT): Buyer / Client ----
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


  // =========================================================================
  // 3. ORDER INFO — Simple date + numéro
  // =========================================================================
  private renderOrderInfo(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    // Separator line
    this.drawLine(
      margins.left, startY + 5,
      width - margins.right, startY + 5,
      { color: COLORS.borderGray, width: 0.5 }
    );

    // Section title
    this.drawText('Informations de la commande', margins.left, startY - 12, {
      size: 10,
      bold: true,
      color: COLORS.darkGray,
    });

    // Date + Number
    const issueDateStr = this.formatInvoiceDateFull();
    const termsLine = (invoice.payment as any)?.paymentTermsText || (invoice as any).paymentTerms || (invoice.payment as any)?.termsDescription || 'Paiement à 30 jours';
    const curr = (invoice as any).currency || (invoice.header as any)?.currency || 'EUR';
    
    const labelX = margins.left + 20;
    const valueX = margins.left + 180;

    this.drawText(`Date d'émission`, labelX, startY - 30, {
      size: 9, color: COLORS.mediumGray,
    });
    this.drawText(issueDateStr, valueX, startY - 30, {
      size: 9, color: COLORS.black,
    });

    this.drawText(`Modalités de paiement`, labelX, startY - 45, {
      size: 9, color: COLORS.mediumGray,
    });
    this.drawText(termsLine, valueX, startY - 45, {
      size: 9, color: COLORS.black,
    });

    this.drawText('Devise', labelX, startY - 60, {
      size: 9, color: COLORS.mediumGray,
    });
    this.drawText(curr, valueX, startY - 60, {
      size: 9, color: COLORS.black,
    });

    this.renderContext.currentY = startY - 75;
  }

  // =========================================================================
  // 4. LINE ITEMS — Clean table with thin borders
  // =========================================================================
  private renderModernLineItems(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    const tableWidth = width - margins.left - margins.right;

    // Column widths
    const cols = {
      description: tableWidth * 0.38,
      qty: tableWidth * 0.08,
      unitPriceHT: tableWidth * 0.15,
      vatRate: tableWidth * 0.12,
      unitPriceTTC: tableWidth * 0.13,
      totalTTC: tableWidth * 0.14,
    };

    // ---- Section title ----
    this.drawLine(
      margins.left, startY + 5,
      width - margins.right, startY + 5,
      { color: COLORS.borderGray, width: 0.5 }
    );

    this.drawText('Détails de la facture', margins.left, startY - 12, {
      size: 10,
      bold: true,
      color: COLORS.darkGray,
    });

    let y = startY - 30;

    // ---- Table header ----
    const headerH = 28;
    this.drawLine(
      margins.left, y,
      width - margins.right, y,
      { color: COLORS.borderGray, width: 0.5 }
    );

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

    // Sub-header labels (HT / TTC)
    hx = margins.left + 5 + cols.description + cols.qty;
    this.drawText('HT', hx, headerY - 12, { size: 7, color: COLORS.gray });
    hx += cols.unitPriceHT + cols.vatRate;
    this.drawText('TTC', hx, headerY - 12, { size: 7, color: COLORS.gray });

    y -= headerH;
    this.drawLine(
      margins.left, y,
      width - margins.right, y,
      { color: COLORS.borderGray, width: 0.5 }
    );

    // ---- Rows ----
    const descFontSize = 8;
    const descMaxWidth = cols.description - 10;
    const lineSpacing = 11;
    const minRowHeight = 22;

    for (let i = 0; i < invoice.lines.length; i++) {
      const line = invoice.lines[i];

      // Compute wrapped description lines
      const descLines = this.wrapText(line.description, descMaxWidth, descFontSize);
      const textHeight = descLines.length * lineSpacing;
      const rowHeight = Math.max(minRowHeight, textHeight + 10);

      // Page break check
      this.renderContext.currentY = y;
      const pageBefore = this.renderContext.pageNumber;
      this.checkPageBreak(rowHeight + 5);
      if (this.renderContext.pageNumber > pageBefore) {
        // Redraw header on new page
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

      // Description (wrapped)
      let dx = margins.left + 5;
      let descY = y - 13;
      for (const descLine of descLines) {
        this.drawText(descLine, dx, descY, { size: descFontSize, color: COLORS.black });
        descY -= lineSpacing;
      }

      // Compute TTC values
      const unitPriceTTC = line.unitPrice * (1 + line.vatRate);
      const totalTTC = line.lineTotal * (1 + line.vatRate);

      // Other columns — vertically centered
      const colY = y - Math.round(rowHeight / 2) - 3;
      let cx = margins.left + 5 + cols.description;

      this.drawText(String(line.quantity), cx, colY, { size: 8, color: COLORS.black });
      cx += cols.qty;
      this.drawText(`${formatAmount(line.unitPrice)} €`, cx, colY, { size: 8, color: COLORS.black });
      cx += cols.unitPriceHT;
      this.drawText(`${formatAmount(line.vatRate * 100)} %`, cx, colY, { size: 8, color: COLORS.black });
      cx += cols.vatRate;
      this.drawText(`${formatAmount(unitPriceTTC)} €`, cx, colY, { size: 8, color: COLORS.black });
      cx += cols.unitPriceTTC;
      this.drawText(`${formatAmount(totalTTC)} €`, cx, colY, { size: 8, color: COLORS.black });

      y -= rowHeight;

      // Row separator
      this.drawLine(
        margins.left, y,
        width - margins.right, y,
        { color: COLORS.borderGray, width: 0.3 }
      );
    }

    this.renderContext.currentY = y;
  }

  // =========================================================================
  // 5. TOTALS — "Facture Total" + Tax breakdown table
  // =========================================================================
  private async renderModernTotals(): Promise<void> {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { summary } = this.context;
    const startY = this.renderContext.currentY;

    const contentWidth = width - margins.left - margins.right;

    // ---- QR code on the LEFT side (only when a payment link is explicitly set) ----
    const paymentLink = this.context.options.paymentLink;
    if (paymentLink) {
      const qrSize = 90;
      const qrX = margins.left;
      const qrY = startY - qrSize - 5;
      await this.renderQRCode(qrX, qrY, paymentLink, qrSize, undefined, COLORS.darkGray);

      // "Scanner pour payer" label below QR
      this.drawText('Scanner pour payer', qrX + 5, qrY - 10, {
        size: 7,
        color: COLORS.gray,
      });
    }

    // ---- Grand total line ----
    const totalAmountText = `${formatAmount(summary.grandTotal)} €`;
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

    // ---- Tax breakdown table ----
    let y = startY - 35;

    // Header
    const taxTableX = margins.left + contentWidth * 0.45;
    const col1W = 80;
    const col2W = 100;

    this.drawRect(taxTableX, y - 18, contentWidth * 0.55, 18, { fillColor: COLORS.bgGray });

    this.drawText('Taux TVA', taxTableX + 8, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
    this.drawText('Total HT', taxTableX + col1W, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
    this.drawText('TVA', taxTableX + col1W + col2W, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
    y -= 18;

    // Tax rows
    for (const taxSum of summary.taxSummaries) {
      this.drawText(`${taxSum.rate} %`, taxTableX + 8, y - 13, { size: 8, color: COLORS.black });
      this.drawText(`${formatAmount(taxSum.taxable)} €`, taxTableX + col1W, y - 13, { size: 8, color: COLORS.black });
      this.drawText(`${formatAmount(taxSum.taxAmount)} €`, taxTableX + col1W + col2W, y - 13, { size: 8, color: COLORS.black });
      y -= 16;

      // BT-120: Display exemption reason below the 0% line
      if (taxSum.exemptionReason) {
        this.drawText(`Mention TVA : ${taxSum.exemptionReason}`, taxTableX + 8, y - 6, {
          size: 7, color: COLORS.gray,
        });
        y -= 14;
      }
    }

    // Total row
    this.drawLine(
      taxTableX, y,
      taxTableX + contentWidth * 0.55, y,
      { color: COLORS.borderGray, width: 0.5 }
    );

    this.drawText('Total', taxTableX + 8, y - 13, { size: 8, bold: true, color: COLORS.darkGray });
    this.drawText(`${formatAmount(summary.lineTotal)} €`, taxTableX + col1W, y - 13, { size: 8, bold: true, color: COLORS.black });
    this.drawText(`${formatAmount(summary.taxTotal)} €`, taxTableX + col1W + col2W, y - 13, { size: 8, bold: true, color: COLORS.black });

    this.renderContext.currentY = y - 25;
  }

  // =========================================================================
  // 6. LEGAL INFO — Small text at the bottom
  // =========================================================================
  private renderLegalInfo(): void {
    const { margins } = this.context.options;
    const { width } = this.renderContext;
    const { invoice } = this.context;
    const startY = this.renderContext.currentY;

    // Separator
    this.drawLine(
      margins.left, startY + 5,
      width - margins.right, startY + 5,
      { color: COLORS.borderGray, width: 0.5 }
    );

    let y = startY - 10;

    // ── Mentions légales obligatoires (BR-FR-05 / art. L.441-10 C.com) ──
    // These three mentions must appear on every French B2B invoice.
    const legalMentions = [
      "Pénalités de retard exigibles dès le premier jour suivant la date de règlement, au taux de 3x le taux légal (art. L.441-10 C.com).",
      "Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 € (art. D.441-5 C.com).",
      "Pas d'escompte accordé pour paiement anticipé.",
    ];
    for (const mention of legalMentions) {
      this.drawText(mention, margins.left, y, { size: 6.5, color: COLORS.gray });
      y -= 11;
    }

    // ── TVA exemption mention (BT-120 — also in footer for full compliance) ──
    const { summary } = this.context;
    for (const taxSum of summary.taxSummaries) {
      if (taxSum.exemptionReason) {
        this.drawText(taxSum.exemptionReason, margins.left, y, {
          size: 7, bold: true, color: COLORS.darkGray,
        });
        y -= 12;
      }
    }

    y -= 4; // small spacer before identifiers

    // ── Seller legal info ─────────────────────────────────────────────────
    const { sellerSiret, sellerSiren } = this.context.options;
    const legalParts: string[] = [];

    if (invoice.seller.name) legalParts.push(invoice.seller.name);
    if (invoice.seller.address) {
      const addr = invoice.seller.address;
      const addrStr = [addr.street, `${addr.postalCode} ${addr.city}`, addr.countryCode]
        .filter(Boolean)
        .join(', ');
      if (addrStr) legalParts.push(addrStr);
    }

    if (legalParts.length > 0) {
      this.drawText(legalParts.join(' – '), margins.left, y, {
        size: 7,
        color: COLORS.gray,
      });
      y -= 12;
    }

    const legalIds: string[] = [];
    // Prefer SIREN (9 digits) over raw SIRET for correct FR display
    if (sellerSiren) legalIds.push(`SIREN : ${sellerSiren}`);
    else if (sellerSiret) legalIds.push(`SIRET : ${sellerSiret}`);
    if (invoice.seller.vatId) legalIds.push(`N° TVA : ${invoice.seller.vatId}`);

    if (legalIds.length > 0) {
      this.drawText(legalIds.join(' • '), margins.left, y, {
        size: 7,
        color: COLORS.gray,
      });
      y -= 12;
    }

    // Payment terms
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

  // =========================================================================
  // CUSTOM FOOTER — Minimal, no color
  // =========================================================================
  protected drawSinglePageFooter(page: PDFPage, pageNum: number, totalPages: number): void {
    const { margins } = this.context.options;
    const pageWidth = 595.28;
    const footerH = 25;
    const font = (this as any).getFont('Helvetica');

    // Thin top line
    page.drawLine({
      start: { x: margins.left, y: margins.bottom + footerH },
      end: { x: pageWidth - margins.right, y: margins.bottom + footerH },
      color: (this as any).parseColor(COLORS.borderGray),
      thickness: 0.5,
    });

    // Page number right-aligned
    const pageText = `${this.strings.page} ${pageNum} ${this.strings.of} ${totalPages}`;
    const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: pageWidth - margins.right - pageTextWidth,
      y: margins.bottom + 8,
      size: 8,
      font,
      color: (this as any).parseColor(COLORS.gray),
    });
  }

  // =========================================================================
  // MINIMAL CONTINUATION HEADERS — Just invoice ref + separator, no parties
  // =========================================================================
  protected async drawContinuationPageHeaders(): Promise<void> {
    if (this.allPages.length <= 1) return;

    const { margins } = this.context.options;
    const { invoice } = this.context;
    const font = (this as any).getFont('Helvetica');
    const fontBold = (this as any).getFont('Helvetica-Bold');

    for (let i = 1; i < this.allPages.length; i++) {
      const page = this.allPages[i];
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const topY = pageHeight - margins.top;
      const headerH = TemplateRenderer.CONTINUATION_HEADER_HEIGHT;
      const bandBottom = topY - headerH;

      // Invoice ref left
      page.drawText(`Facture ${invoice.header.id}`, {
        x: margins.left,
        y: topY - 20,
        size: 10,
        font: fontBold,
        color: (this as any).parseColor(COLORS.darkGray),
      });

      // Date right
      const dateText = `${this.strings.issueDate}: ${this.formatInvoiceDateFull()}`;
      const dateWidth = font.widthOfTextAtSize(dateText, 9);
      page.drawText(dateText, {
        x: pageWidth - margins.right - dateWidth,
        y: topY - 20,
        size: 9,
        font,
        color: (this as any).parseColor(COLORS.gray),
      });

      // Separator line
      page.drawLine({
        start: { x: margins.left, y: bandBottom },
        end: { x: pageWidth - margins.right, y: bandBottom },
        color: (this as any).parseColor(COLORS.borderGray),
        thickness: 0.5,
      });

      // "(suite)" label
      page.drawText('(suite)', {
        x: margins.left,
        y: topY - 40,
        size: 8,
        font,
        color: (this as any).parseColor(COLORS.gray),
      });
    }
  }
}
