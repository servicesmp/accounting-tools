export declare enum FacturxProfile {
    MINIMUM = "MINIMUM",
    BASICWL = "BASICWL",
    BASIC = "BASIC",
    EN16931 = "EN16931",
    EXTENDED = "EXTENDED"
}
export declare enum DocTypeCode {
    INVOICE = 380,
    CREDIT_NOTE = 381,
    DEBIT_NOTE = 383,
    PRO_FORMAT = 384,
    PREPAYMENT = 386,
    SELF_BILLED = 389
}
export declare enum TaxCategoryCode {
    STANDARD = "S",
    ZERO = "Z",
    EXEMPT = "E",
    REVERSE_CHARGE = "AE",
    INTRA_COMMUNITY = "K",
    EXPORT = "G",
    OUT_OF_SCOPE = "O",
    CANARY_ISLANDS = "L",
    CEUTA_MELILLA = "M",
    REDUCED = "AA"
}
export declare enum PaymentMeansCode {
    NOT_DEFINED = 1,
    ACH_CREDIT = 3,
    CASH = 10,
    CHEQUE = 20,
    CREDIT_TRANSFER = 30,
    DEBIT_TRANSFER = 31,
    PAYMENT_TO_ACCOUNT = 42,
    BANK_CARD = 48,
    DIRECT_DEBIT = 49,
    SEPA_CREDIT_TRANSFER = 58,
    SEPA_DIRECT_DEBIT = 59
}
export declare enum UnitCode {
    PIECE = "C62",
    HOUR = "HUR",
    DAY = "DAY",
    MONTH = "MON",
    YEAR = "ANN",
    KILOGRAM = "KGM",
    METER = "MTR",
    SQUARE_METER = "MTK",
    CUBIC_METER = "MTQ",
    LITER = "LTR",
    KILOMETER = "KMT"
}
export declare enum CurrencyCode {
    EUR = "EUR",
    USD = "USD",
    GBP = "GBP",
    CHF = "CHF",
    JPY = "JPY",
    CAD = "CAD",
    AUD = "AUD",
    CNY = "CNY",
    SEK = "SEK",
    NOK = "NOK",
    DKK = "DKK",
    PLN = "PLN",
    CZK = "CZK",
    HUF = "HUF",
    RON = "RON",
    BRL = "BRL",
    MXN = "MXN",
    ZAR = "ZAR",
    INR = "INR",
    SGD = "SGD",
    HKD = "HKD",
    NZD = "NZD",
    TRY = "TRY",
    RUB = "RUB",
    AED = "AED",
    SAR = "SAR",
    THB = "THB",
    MYR = "MYR"
}
export declare enum ComplianceType {
    FACTUR_X = "FACTUR_X",
    UBL = "UBL",
    PEPPOL = "PEPPOL",
    FATTURA_PA = "FATTURA_PA",
    FACTURAE = "FACTURAE",
    UBL_OHNL = "UBL_OHNL",
    BELGIAN_EINVOICE = "BELGIAN_EINVOICE",
    SWISS_EINVOICE = "SWISS_EINVOICE",
    OTHER = "OTHER"
}
export interface RegionalConfig {
    readonly countryCode: string;
    readonly compliance: ComplianceType;
    readonly defaultCurrency: CurrencyCode;
    readonly defaultLanguage: string;
    readonly taxIdLabel?: string;
    readonly dateFormat?: string;
    readonly numberFormat?: {
        decimalSeparator: string;
        thousandsSeparator: string;
    };
}
export interface PostalAddress {
    readonly street?: string;
    readonly additionalStreet?: string;
    readonly additionalStreet2?: string;
    readonly city: string;
    readonly postalCode: string;
    readonly subdivision?: string;
    readonly countryCode: string;
}
export interface NoteWithCode {
    readonly content: string;
    readonly subjectCode?: string;
}
export interface TradeParty {
    readonly name: string;
    readonly tradingName?: string;
    readonly address: PostalAddress;
    readonly vatId?: string;
    readonly taxId?: string;
    readonly legalId?: string;
    readonly legalIdScheme?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly globalId?: string;
    readonly electronicAddress?: string;
    readonly electronicAddressScheme?: string;
}
export interface PaymentDetails {
    readonly meansCode: PaymentMeansCode;
    readonly iban?: string;
    readonly bic?: string;
    readonly reference?: string;
    readonly dueDate?: Date;
    readonly termsDescription?: string;
}
export interface DocumentHeader {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly name: string;
    readonly invoiceDate: Date;
    readonly dueDate?: Date;
    readonly typeCode: DocTypeCode;
    readonly billingPeriodStart?: Date;
    readonly billingPeriodEnd?: Date;
    readonly purchaseOrderReference?: string;
    readonly salesOrderReference?: string;
    readonly contractReference?: string;
    readonly notes?: (string | NoteWithCode)[];
}
export interface AllowanceCharge {
    readonly chargeIndicator: boolean;
    readonly actualAmount: number;
    readonly reason?: string;
    readonly reasonCode?: string;
    readonly taxRate?: number;
    readonly taxCategoryCode?: string;
    readonly baseAmount?: number;
    readonly percentage?: number;
}
export interface InvoiceLine {
    readonly id: string;
    readonly description: string;
    quantity: number;
    unitPrice: number;
    readonly lineTotal: number;
    readonly vatRate: number;
    readonly taxCategoryCode: string;
    readonly unitCode: string;
    readonly billingPeriodStart?: Date;
    readonly billingPeriodEnd?: Date;
    readonly deliveredQuantity?: number;
    readonly allowances: AllowanceCharge[];
    readonly charges: AllowanceCharge[];
    readonly productId?: string;
    readonly ean?: string;
}
export interface TaxSummary {
    readonly rate: number;
    readonly category: string;
    readonly taxable: number;
    readonly taxAmount: number;
}
export interface MonetarySummary {
    readonly lineTotal: number;
    readonly taxBasis: number;
    readonly taxTotal: number;
    readonly grandTotal: number;
    readonly allowanceTotal?: number;
    readonly chargeTotal?: number;
    readonly taxSummaries: ReadonlyArray<TaxSummary>;
    readonly paidAmount?: number;
    readonly dueAmount?: number;
}
export interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<string>;
    readonly warnings: ReadonlyArray<string>;
    readonly infos?: ReadonlyArray<string>;
}
export interface XsdValidationResult extends ValidationResult {
    readonly schemaPath?: string;
    readonly durationMs?: number;
}
export interface ProfilePolicy {
    readonly profile: FacturxProfile;
    readonly mandatoryFields: ReadonlyArray<string>;
    readonly forbiddenFields: ReadonlyArray<string>;
    readonly guidelineUrn: string;
}
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> : T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export type RequiredProperties<T> = {
    [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};
export type OptionalProperties<T> = {
    [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K];
};
//# sourceMappingURL=index.d.ts.map