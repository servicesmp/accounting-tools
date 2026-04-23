import { FacturXInvoice, MonetarySummary } from '@facturx/core';
export declare enum TemplateType {
    MODERN = "modern",
    BRAND = "brand",
    FANCY = "fancy",
    CORPORATE = "corporate",
    MINIMAL = "minimal"
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
    readonly logo?: Buffer | string | '';
    readonly showLogo?: boolean;
    readonly logoLayout?: 'above' | 'left' | 'none';
    readonly logoData?: Buffer | string;
    readonly logoPath?: string;
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
    readonly paymentLink?: string;
    readonly validateBeforeGeneration?: boolean;
    readonly validateAfterGeneration?: boolean;
    readonly strictValidation?: boolean;
}
export interface TemplateContext {
    readonly invoice: FacturXInvoice;
    readonly summary: MonetarySummary;
    readonly options: Required<TemplateOptions>;
    readonly theme: TemplateTheme;
    readonly generatedAt: Date;
}
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
export interface RenderContext {
    readonly width: number;
    readonly height: number;
    readonly margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    currentY: number;
    readonly pageNumber: number;
}
export interface RenderedElement {
    readonly height: number;
    readonly y: number;
}
export declare const DEFAULT_THEME: TemplateTheme;
export declare const BRAND_THEME: TemplateTheme;
export declare const FANCY_THEME: TemplateTheme;
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
export declare const LOCALIZED_STRINGS: Record<string, LocalizedStrings>;
//# sourceMappingURL=index.d.ts.map