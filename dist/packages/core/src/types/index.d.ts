/**
 * @module types
 * @description Core types and interfaces for Factur-X implementation
 * Optimized for performance and type safety
 */
/**
 * Factur-X Profile levels
 * @see https://fnfe-mpe.org/factur-x/
 */
export declare enum FacturxProfile {
    /** Minimal profile - Only totals and basic info */
    MINIMUM = "MINIMUM",
    /** Basic profile without line details - EN16931 conformant */
    BASICWL = "BASICWL",
    /** Basic profile with lines - EN16931 conformant */
    BASIC = "BASIC",
    /** Full EN16931 compliance - Recommended for B2B */
    EN16931 = "EN16931",
    /** Extended profile with all features - EN16931 compliant */
    EXTENDED = "EXTENDED"
}
/**
 * Document type codes (UN/EDIFACT 1001)
 * @see https://unece.org/fileadmin/DAM/trade/untdid/d16b/tred/tred1001.htm
 */
export declare enum DocTypeCode {
    /** Commercial invoice */
    INVOICE = 380,
    /** Credit note */
    CREDIT_NOTE = 381,
    /** Debit note */
    DEBIT_NOTE = 383,
    /** Pro forma invoice / Quote */
    PRO_FORMAT = 384,
    /** Prepayment invoice */
    PREPAYMENT = 386,
    /** Self-billed invoice */
    SELF_BILLED = 389
}
/**
 * Tax category codes (UN/EDIFACT 5305)
 */
export declare enum TaxCategoryCode {
    /** Standard rate */
    STANDARD = "S",
    /** Zero rated */
    ZERO = "Z",
    /** Exempt from tax */
    EXEMPT = "E",
    /** Reverse charge */
    REVERSE_CHARGE = "AE",
    /** VAT exempt for EEA intra-community supply */
    INTRA_COMMUNITY = "K",
    /** Free export item - tax not charged */
    EXPORT = "G",
    /** Services outside scope of tax */
    OUT_OF_SCOPE = "O",
    /** Canary Islands general indirect tax */
    CANARY_ISLANDS = "L",
    /** Tax for production, services and importation in Ceuta and Melilla */
    CEUTA_MELILLA = "M",
    /** Reduced rate */
    REDUCED = "AA"
}
/**
 * Payment means type codes (UN/EDIFACT 4461)
 */
export declare enum PaymentMeansCode {
    /** Instrument not defined */
    NOT_DEFINED = 1,
    /** Automated clearing house credit */
    ACH_CREDIT = 3,
    /** Cash */
    CASH = 10,
    /** Cheque */
    CHEQUE = 20,
    /** Credit transfer */
    CREDIT_TRANSFER = 30,
    /** Debit transfer */
    DEBIT_TRANSFER = 31,
    /** Payment to bank account */
    PAYMENT_TO_ACCOUNT = 42,
    /** Bank card */
    BANK_CARD = 48,
    /** Direct debit */
    DIRECT_DEBIT = 49,
    /** SEPA credit transfer */
    SEPA_CREDIT_TRANSFER = 58,
    /** SEPA direct debit */
    SEPA_DIRECT_DEBIT = 59
}
/**
 * Unit codes (UN/ECE Recommendation 20/21)
 */
export declare enum UnitCode {
    /** Piece / Unit */
    PIECE = "C62",
    /** Hour */
    HOUR = "HUR",
    /** Day */
    DAY = "DAY",
    /** Month */
    MONTH = "MON",
    /** Year */
    YEAR = "ANN",
    /** Kilogram */
    KILOGRAM = "KGM",
    /** Meter */
    METER = "MTR",
    /** Square meter */
    SQUARE_METER = "MTK",
    /** Cubic meter */
    CUBIC_METER = "MTQ",
    /** Liter */
    LITER = "LTR",
    /** Kilometer */
    KILOMETER = "KMT"
}
/**
 * Currency codes (ISO 4217)
 * @see https://www.iso.org/iso-4217-currency-codes.html
 */
export declare enum CurrencyCode {
    /** Euro */
    EUR = "EUR",
    /** US Dollar */
    USD = "USD",
    /** British Pound Sterling */
    GBP = "GBP",
    /** Swiss Franc */
    CHF = "CHF",
    /** Japanese Yen */
    JPY = "JPY",
    /** Canadian Dollar */
    CAD = "CAD",
    /** Australian Dollar */
    AUD = "AUD",
    /** Chinese Yuan Renminbi */
    CNY = "CNY",
    /** Swedish Krona */
    SEK = "SEK",
    /** Norwegian Krone */
    NOK = "NOK",
    /** Danish Krone */
    DKK = "DKK",
    /** Polish Zloty */
    PLN = "PLN",
    /** Czech Koruna */
    CZK = "CZK",
    /** Hungarian Forint */
    HUF = "HUF",
    /** Romanian Leu */
    RON = "RON",
    /** Brazilian Real */
    BRL = "BRL",
    /** Mexican Peso */
    MXN = "MXN",
    /** South African Rand */
    ZAR = "ZAR",
    /** Indian Rupee */
    INR = "INR",
    /** Singapore Dollar */
    SGD = "SGD",
    /** Hong Kong Dollar */
    HKD = "HKD",
    /** New Zealand Dollar */
    NZD = "NZD",
    /** Turkish Lira */
    TRY = "TRY",
    /** Russian Ruble */
    RUB = "RUB",
    /** United Arab Emirates Dirham */
    AED = "AED",
    /** Saudi Riyal */
    SAR = "SAR",
    /** Thai Baht */
    THB = "THB",
    /** Malaysian Ringgit */
    MYR = "MYR"
}
/**
 * E-invoicing compliance standards
 */
export declare enum ComplianceType {
    /** French/German Factur-X (ZUGFeRD) standard */
    FACTUR_X = "FACTUR_X",
    /** Universal Business Language (OASIS UBL 2.1) */
    UBL = "UBL",
    /** PEPPOL BIS Billing 3.0 (European) */
    PEPPOL = "PEPPOL",
    /** Italian FatturaPA */
    FATTURA_PA = "FATTURA_PA",
    /** Spanish FacturaE */
    FACTURAE = "FACTURAE",
    /** Dutch UBL-OHNL */
    UBL_OHNL = "UBL_OHNL",
    /** Belgian e-invoicing */
    BELGIAN_EINVOICE = "BELGIAN_EINVOICE",
    /** Swiss e-invoicing */
    SWISS_EINVOICE = "SWISS_EINVOICE",
    /** Custom/Other regional standard */
    OTHER = "OTHER"
}
/**
 * Regional settings and rules
 */
export interface RegionalConfig {
    /** ISO 3166-1 alpha-2 country code */
    readonly countryCode: string;
    /** Compliance standard for this region */
    readonly compliance: ComplianceType;
    /** Default currency for this region */
    readonly defaultCurrency: CurrencyCode;
    /** Default language code (ISO 639-1) */
    readonly defaultLanguage: string;
    /** Tax identifier label (e.g., "VAT", "GST", "TVA") */
    readonly taxIdLabel?: string;
    /** Date format pattern */
    readonly dateFormat?: string;
    /** Number format (decimal separator, thousands separator) */
    readonly numberFormat?: {
        decimalSeparator: string;
        thousandsSeparator: string;
    };
}
/**
 * Postal address structure
 */
export interface PostalAddress {
    /** Street address line 1 */
    readonly street?: string;
    /** Street address line 2 */
    readonly additionalStreet?: string;
    /** Street address line 3 */
    readonly additionalStreet2?: string;
    /** City name */
    readonly city: string;
    /** Postal code */
    readonly postalCode: string;
    /** Country subdivision (state/province) */
    readonly subdivision?: string;
    /** ISO 3166-1 alpha-2 country code */
    readonly countryCode: string;
}
/**
 * Note with optional subject code (BT-21/BT-22)
 * Required for FR compliance (BR-FR-05: PMT, PMD, AAB)
 */
export interface NoteWithCode {
    /** Note content (BT-22) */
    readonly content: string;
    /** Subject code (BT-21): PMT, PMD, AAB, etc. */
    readonly subjectCode?: string;
}
/**
 * Trade party (Seller/Buyer) information
 */
export interface TradeParty {
    /** Legal name */
    readonly name: string;
    /** Trading name (if different) */
    readonly tradingName?: string;
    /** Postal address */
    readonly address: PostalAddress;
    /** VAT identification number */
    readonly vatId?: string;
    /** Tax registration ID (other than VAT) */
    readonly taxId?: string;
    /** Legal registration ID (BT-30 seller SIREN / BT-47 buyer) */
    readonly legalId?: string;
    /** Legal registration ID scheme (e.g. '0002' for SIREN FR) */
    readonly legalIdScheme?: string;
    /** Email address */
    readonly email?: string;
    /** Phone number */
    readonly phone?: string;
    /** Global Location Number (GLN) */
    readonly globalId?: string;
    /** Electronic address for routing (BT-34 seller / BT-49 buyer) */
    readonly electronicAddress?: string;
    /** Electronic address scheme identifier (e.g. 'EM' for email) */
    readonly electronicAddressScheme?: string;
}
/**
 * Payment details
 */
export interface PaymentDetails {
    /** Payment means code */
    readonly meansCode: PaymentMeansCode;
    /** IBAN */
    readonly iban?: string;
    /** BIC/SWIFT code */
    readonly bic?: string;
    /** Payment reference */
    readonly reference?: string;
    /** Due date */
    readonly dueDate?: Date;
    /** Payment terms description */
    readonly termsDescription?: string;
}
/**
 * Document header information
 */
export interface DocumentHeader {
    /** Invoice number */
    readonly id: string;
    /** Invoice number (alias) */
    readonly invoiceNumber: string;
    /** Document name/title */
    readonly name: string;
    /** Issue date */
    readonly invoiceDate: Date;
    /** Due date (optional, can be in payment details) */
    readonly dueDate?: Date;
    /** Document type code */
    readonly typeCode: DocTypeCode;
    /** Billing period start */
    readonly billingPeriodStart?: Date;
    /** Billing period end */
    readonly billingPeriodEnd?: Date;
    /** Purchase order reference */
    readonly purchaseOrderReference?: string;
    /** Sales order reference */
    readonly salesOrderReference?: string;
    /** Contract reference */
    readonly contractReference?: string;
    /** Notes (string for simple notes, NoteWithCode for FR compliance with SubjectCode) */
    readonly notes?: (string | NoteWithCode)[];
}
/**
 * Allowance or charge at line or document level
 */
export interface AllowanceCharge {
    /** true=charge, false=allowance(discount) */
    readonly chargeIndicator: boolean;
    /** Amount */
    readonly actualAmount: number;
    /** Reason text */
    readonly reason?: string;
    /** Reason code */
    readonly reasonCode?: string;
    /** Tax rate (if different from line) */
    readonly taxRate?: number;
    /** Tax category code (if different from line) */
    readonly taxCategoryCode?: string;
    /** Base amount (for percentage calculations) */
    readonly baseAmount?: number;
    /** Percentage */
    readonly percentage?: number;
}
/**
 * Invoice line item
 */
export interface InvoiceLine {
    /** Line ID */
    readonly id: string;
    /** Description */
    readonly description: string;
    /** Quantity */
    quantity: number;
    /** Unit price (net) */
    unitPrice: number;
    /** Line total (computed) */
    readonly lineTotal: number;
    /** VAT rate (decimal, e.g. 0.20 for 20%) */
    readonly vatRate: number;
    /** Tax category code */
    readonly taxCategoryCode: string;
    /** Unit code */
    readonly unitCode: string;
    /** Billing period start (optional) */
    readonly billingPeriodStart?: Date;
    /** Billing period end (optional) */
    readonly billingPeriodEnd?: Date;
    /** Delivered quantity (if different from billed) */
    readonly deliveredQuantity?: number;
    /** Line-level allowances */
    readonly allowances: AllowanceCharge[];
    /** Line-level charges */
    readonly charges: AllowanceCharge[];
    /** Product/Service ID */
    readonly productId?: string;
    /** EAN/GTIN code */
    readonly ean?: string;
}
/**
 * Tax summary for a specific rate/category combination
 */
export interface TaxSummary {
    /** Tax rate (percentage, e.g. 20 for 20%) */
    readonly rate: number;
    /** Tax category code */
    readonly category: string;
    /** Taxable base amount */
    readonly taxable: number;
    /** Tax amount */
    readonly taxAmount: number;
}
/**
 * Monetary summary (totals)
 */
export interface MonetarySummary {
    /** Sum of line totals (before document-level adjustments) */
    readonly lineTotal: number;
    /** Tax basis (after all allowances/charges) */
    readonly taxBasis: number;
    /** Total tax amount */
    readonly taxTotal: number;
    /** Grand total (TTC) */
    readonly grandTotal: number;
    /** Total allowances (optional) */
    readonly allowanceTotal?: number;
    /** Total charges (optional) */
    readonly chargeTotal?: number;
    /** Tax summaries by rate/category */
    readonly taxSummaries: ReadonlyArray<TaxSummary>;
    /** Amount already paid (prepayments) */
    readonly paidAmount?: number;
    /** Amount due for payment */
    readonly dueAmount?: number;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Is valid */
    readonly isValid: boolean;
    /** Error messages */
    readonly errors: ReadonlyArray<string>;
    /** Warning messages */
    readonly warnings: ReadonlyArray<string>;
    /** Info messages */
    readonly infos?: ReadonlyArray<string>;
}
/**
 * XSD Validation result
 */
export interface XsdValidationResult extends ValidationResult {
    /** XSD schema used */
    readonly schemaPath?: string;
    /** Validation duration (ms) */
    readonly durationMs?: number;
}
/**
 * Profile policy defining mandatory and forbidden fields
 */
export interface ProfilePolicy {
    /** Profile name */
    readonly profile: FacturxProfile;
    /** Mandatory fields (dot notation) */
    readonly mandatoryFields: ReadonlyArray<string>;
    /** Forbidden fields (dot notation) */
    readonly forbiddenFields: ReadonlyArray<string>;
    /** Guideline URN */
    readonly guidelineUrn: string;
}
/**
 * Deep readonly helper
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> : T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
/**
 * Mutable variant (for internal use)
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
/**
 * Extract required properties
 */
export type RequiredProperties<T> = {
    [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};
/**
 * Extract optional properties
 */
export type OptionalProperties<T> = {
    [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K];
};
//# sourceMappingURL=index.d.ts.map