/**
 * @module smp-factur-x-ts/types
 * @description Type definitions for Factur-X PDF templates
 */

import { FacturXInvoice, MonetarySummary } from '@facturx/core';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export enum TemplateType {
  MODERN = 'modern',
  BRAND = 'brand',
  FANCY = 'fancy',
  CORPORATE = 'corporate',
  MINIMAL = 'minimal',
}

export interface TemplateTheme {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly textColor: string;
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly headerBackground: string;
  readonly footerBackground: string;
  readonly tableHeaderBackground: string;
  readonly tableRowEvenBackground: string;
  readonly tableRowOddBackground: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
}

export interface TemplateOptions {
  readonly theme?: Partial<TemplateTheme>;
  readonly logo?: Buffer | string | ''; // Base64 or Buffer or empty string
  readonly showLogo?: boolean;
  readonly logoLayout?: 'above' | 'left' | 'none'; // 'above' = logo centered above name, 'left' = logo left of name
  readonly logoData?: Buffer | string; // Base64 PNG/JPEG data for the logo
  readonly logoPath?: string; // File system path to a PNG or JPEG logo image
  readonly showWatermark?: boolean;
  readonly watermarkText?: string;
  readonly showQRCode?: boolean;
  readonly qrCodeData?: string;
  readonly pageFormat?: 'A4' | 'Letter' | 'Legal';
  readonly margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  readonly language?: 'fr' | 'en' | 'de';
  readonly showLineNumbers?: boolean;
  readonly showTaxBreakdown?: boolean;
  readonly showPaymentTerms?: boolean;
  readonly customFooter?: string;
  readonly sellerSiren?: string;
  readonly sellerSiret?: string;
  readonly showDeliveryAddress?: boolean;
  readonly paymentLink?: string; // URL for payment QR code
  readonly isDraft?: boolean; // If true, shows 'Brouillon' status badge and watermark
  readonly paymentStatus?: string; // 'DRAFT' | 'PAID' | 'PENDING' etc.
  // Validation options
  readonly validateBeforeGeneration?: boolean; // Default: true
  readonly validateAfterGeneration?: boolean; // Default: true
  readonly strictValidation?: boolean; // Default: false - if true, throws on validation errors
}

export interface TemplateContext {
  readonly invoice: FacturXInvoice;
  readonly summary: MonetarySummary;
  readonly options: Required<TemplateOptions>;
  readonly theme: TemplateTheme;
  readonly generatedAt: Date;
}

// ============================================================================
// PDF GENERATION TYPES
// ============================================================================

export interface PDFGenerationResult {
  readonly pdf: Buffer;
  readonly pageCount: number;
  readonly fileSize: number;
  readonly generatedAt: Date;
  readonly templateType: TemplateType;
}

export interface PDFAttachmentOptions {
  readonly filename: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly relationship?: 'Data' | 'Alternative' | 'Source' | 'Supplement';
}

// ============================================================================
// RENDERING TYPES
// ============================================================================

export interface RenderContext {
  readonly width: number;
  readonly height: number;
  readonly margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  currentY: number; // Mutable for rendering progress
  readonly pageNumber: number;
}

export interface RenderedElement {
  readonly height: number;
  readonly y: number;
}

// ============================================================================
// DEFAULT THEMES
// ============================================================================

export const DEFAULT_THEME: TemplateTheme = Object.freeze({
  primaryColor: '#2563eb', // Blue
  secondaryColor: '#64748b', // Slate
  accentColor: '#0ea5e9', // Sky blue
  textColor: '#1e293b', // Dark slate
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  headerBackground: '#f8fafc',
  footerBackground: '#f1f5f9',
  tableHeaderBackground: '#e0e7ff',
  tableRowEvenBackground: '#ffffff',
  tableRowOddBackground: '#f8fafc',
  fontFamily: 'Helvetica',
  fontSize: 10,
  lineHeight: 1.5,
});

export const BRAND_THEME: TemplateTheme = Object.freeze({
  ...DEFAULT_THEME,
  primaryColor: '#7c3aed', // Purple
  accentColor: '#a78bfa',
  headerBackground: '#f5f3ff',
  tableHeaderBackground: '#ede9fe',
});

export const FANCY_THEME: TemplateTheme = Object.freeze({
  ...DEFAULT_THEME,
  primaryColor: '#059669', // Emerald
  secondaryColor: '#6b7280',
  accentColor: '#10b981',
  headerBackground: '#ecfdf5',
  tableHeaderBackground: '#d1fae5',
});

// ============================================================================
// LOCALIZATION
// ============================================================================

export interface LocalizedStrings {
  readonly invoice: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly generatedOn: string;
  readonly seller: string;
  readonly buyer: string;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly vatRate: string;
  readonly lineTotal: string;
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly grandTotal: string;
  readonly paymentTerms: string;
  readonly paymentMeans: string;
  readonly iban: string;
  readonly bic: string;
  readonly page: string;
  readonly of: string;
  readonly taxBreakdown: string;
  readonly taxBase: string;
  readonly taxAmount: string;
  readonly notes: string;
  readonly vatNumber: string;
  readonly scanToPay: string;
}

export const LOCALIZED_STRINGS: Record<string, LocalizedStrings> = {
  fr: {
    invoice: 'FACTURE',
    invoiceNumber: 'N° de facture',
    invoiceDate: 'Date',
    issueDate: 'Date d\'émission',
    dueDate: 'Date d\'échéance',
    generatedOn: 'Document généré le',
    seller: 'Vendeur',
    buyer: 'Client',
    description: 'Description',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire',
    vatRate: 'TVA',
    lineTotal: 'Total HT',
    subtotal: 'Sous-total HT',
    taxTotal: 'Total TVA',
    grandTotal: 'Total TTC',
    paymentTerms: 'Conditions de paiement',
    paymentMeans: 'Moyen de paiement',
    iban: 'IBAN',
    bic: 'BIC',
    page: 'Page',
    of: 'sur',
    taxBreakdown: 'Détail de la TVA',
    taxBase: 'Base HT',
    taxAmount: 'Montant TVA',
    notes: 'Notes',
    vatNumber: 'N° TVA',
    scanToPay: 'Scannez pour payer',
  },
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Date',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    generatedOn: 'Generated on',
    seller: 'Seller',
    buyer: 'Buyer',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    vatRate: 'VAT',
    lineTotal: 'Total',
    subtotal: 'Subtotal',
    taxTotal: 'Total VAT',
    grandTotal: 'Grand Total',
    paymentTerms: 'Payment Terms',
    paymentMeans: 'Payment Method',
    iban: 'IBAN',
    bic: 'BIC',
    page: 'Page',
    of: 'of',
    taxBreakdown: 'Tax Breakdown',
    taxBase: 'Tax Base',
    taxAmount: 'Tax Amount',
    notes: 'Notes',
    vatNumber: 'VAT No.',
    scanToPay: 'Scan to pay',
  },
  de: {
    invoice: 'RECHNUNG',
    invoiceNumber: 'Rechnungsnummer',
    invoiceDate: 'Datum',
    issueDate: 'Ausstellungsdatum',
    dueDate: 'Fälligkeitsdatum',
    generatedOn: 'Erstellt am',
    seller: 'Verkäufer',
    buyer: 'Käufer',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    vatRate: 'MwSt',
    lineTotal: 'Gesamt',
    subtotal: 'Zwischensumme',
    taxTotal: 'MwSt Gesamt',
    grandTotal: 'Endsumme',
    paymentTerms: 'Zahlungsbedingungen',
    paymentMeans: 'Zahlungsmittel',
    iban: 'IBAN',
    bic: 'BIC',
    page: 'Seite',
    of: 'von',
    taxBreakdown: 'Steueraufschlüsselung',
    taxBase: 'Steuerbasis',
    taxAmount: 'Steuerbetrag',
    notes: 'Notizen',
    vatNumber: 'USt-IdNr.',
    scanToPay: 'Scannen zum Bezahlen',
  },
};
