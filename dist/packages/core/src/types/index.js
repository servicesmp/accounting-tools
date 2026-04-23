"use strict";
/**
 * @module types
 * @description Core types and interfaces for Factur-X implementation
 * Optimized for performance and type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceType = exports.CurrencyCode = exports.UnitCode = exports.PaymentMeansCode = exports.TaxCategoryCode = exports.DocTypeCode = exports.FacturxProfile = void 0;
// ============================================================================
// ENUMERATIONS
// ============================================================================
/**
 * Factur-X Profile levels
 * @see https://fnfe-mpe.org/factur-x/
 */
var FacturxProfile;
(function (FacturxProfile) {
    /** Minimal profile - Only totals and basic info */
    FacturxProfile["MINIMUM"] = "MINIMUM";
    /** Basic profile without line details - EN16931 conformant */
    FacturxProfile["BASICWL"] = "BASICWL";
    /** Basic profile with lines - EN16931 conformant */
    FacturxProfile["BASIC"] = "BASIC";
    /** Full EN16931 compliance - Recommended for B2B */
    FacturxProfile["EN16931"] = "EN16931";
    /** Extended profile with all features - EN16931 compliant */
    FacturxProfile["EXTENDED"] = "EXTENDED";
})(FacturxProfile || (exports.FacturxProfile = FacturxProfile = {}));
/**
 * Document type codes (UN/EDIFACT 1001)
 * @see https://unece.org/fileadmin/DAM/trade/untdid/d16b/tred/tred1001.htm
 */
var DocTypeCode;
(function (DocTypeCode) {
    /** Commercial invoice */
    DocTypeCode[DocTypeCode["INVOICE"] = 380] = "INVOICE";
    /** Credit note */
    DocTypeCode[DocTypeCode["CREDIT_NOTE"] = 381] = "CREDIT_NOTE";
    /** Debit note */
    DocTypeCode[DocTypeCode["DEBIT_NOTE"] = 383] = "DEBIT_NOTE";
    /** Pro forma invoice / Quote */
    DocTypeCode[DocTypeCode["PRO_FORMAT"] = 384] = "PRO_FORMAT";
    /** Prepayment invoice */
    DocTypeCode[DocTypeCode["PREPAYMENT"] = 386] = "PREPAYMENT";
    /** Self-billed invoice */
    DocTypeCode[DocTypeCode["SELF_BILLED"] = 389] = "SELF_BILLED";
})(DocTypeCode || (exports.DocTypeCode = DocTypeCode = {}));
/**
 * Tax category codes (UN/EDIFACT 5305)
 */
var TaxCategoryCode;
(function (TaxCategoryCode) {
    /** Standard rate */
    TaxCategoryCode["STANDARD"] = "S";
    /** Zero rated */
    TaxCategoryCode["ZERO"] = "Z";
    /** Exempt from tax */
    TaxCategoryCode["EXEMPT"] = "E";
    /** Reverse charge */
    TaxCategoryCode["REVERSE_CHARGE"] = "AE";
    /** VAT exempt for EEA intra-community supply */
    TaxCategoryCode["INTRA_COMMUNITY"] = "K";
    /** Free export item - tax not charged */
    TaxCategoryCode["EXPORT"] = "G";
    /** Services outside scope of tax */
    TaxCategoryCode["OUT_OF_SCOPE"] = "O";
    /** Canary Islands general indirect tax */
    TaxCategoryCode["CANARY_ISLANDS"] = "L";
    /** Tax for production, services and importation in Ceuta and Melilla */
    TaxCategoryCode["CEUTA_MELILLA"] = "M";
    /** Reduced rate */
    TaxCategoryCode["REDUCED"] = "AA";
})(TaxCategoryCode || (exports.TaxCategoryCode = TaxCategoryCode = {}));
/**
 * Payment means type codes (UN/EDIFACT 4461)
 */
var PaymentMeansCode;
(function (PaymentMeansCode) {
    /** Instrument not defined */
    PaymentMeansCode[PaymentMeansCode["NOT_DEFINED"] = 1] = "NOT_DEFINED";
    /** Automated clearing house credit */
    PaymentMeansCode[PaymentMeansCode["ACH_CREDIT"] = 3] = "ACH_CREDIT";
    /** Cash */
    PaymentMeansCode[PaymentMeansCode["CASH"] = 10] = "CASH";
    /** Cheque */
    PaymentMeansCode[PaymentMeansCode["CHEQUE"] = 20] = "CHEQUE";
    /** Credit transfer */
    PaymentMeansCode[PaymentMeansCode["CREDIT_TRANSFER"] = 30] = "CREDIT_TRANSFER";
    /** Debit transfer */
    PaymentMeansCode[PaymentMeansCode["DEBIT_TRANSFER"] = 31] = "DEBIT_TRANSFER";
    /** Payment to bank account */
    PaymentMeansCode[PaymentMeansCode["PAYMENT_TO_ACCOUNT"] = 42] = "PAYMENT_TO_ACCOUNT";
    /** Bank card */
    PaymentMeansCode[PaymentMeansCode["BANK_CARD"] = 48] = "BANK_CARD";
    /** Direct debit */
    PaymentMeansCode[PaymentMeansCode["DIRECT_DEBIT"] = 49] = "DIRECT_DEBIT";
    /** SEPA credit transfer */
    PaymentMeansCode[PaymentMeansCode["SEPA_CREDIT_TRANSFER"] = 58] = "SEPA_CREDIT_TRANSFER";
    /** SEPA direct debit */
    PaymentMeansCode[PaymentMeansCode["SEPA_DIRECT_DEBIT"] = 59] = "SEPA_DIRECT_DEBIT";
})(PaymentMeansCode || (exports.PaymentMeansCode = PaymentMeansCode = {}));
/**
 * Unit codes (UN/ECE Recommendation 20/21)
 */
var UnitCode;
(function (UnitCode) {
    /** Piece / Unit */
    UnitCode["PIECE"] = "C62";
    /** Hour */
    UnitCode["HOUR"] = "HUR";
    /** Day */
    UnitCode["DAY"] = "DAY";
    /** Month */
    UnitCode["MONTH"] = "MON";
    /** Year */
    UnitCode["YEAR"] = "ANN";
    /** Kilogram */
    UnitCode["KILOGRAM"] = "KGM";
    /** Meter */
    UnitCode["METER"] = "MTR";
    /** Square meter */
    UnitCode["SQUARE_METER"] = "MTK";
    /** Cubic meter */
    UnitCode["CUBIC_METER"] = "MTQ";
    /** Liter */
    UnitCode["LITER"] = "LTR";
    /** Kilometer */
    UnitCode["KILOMETER"] = "KMT";
})(UnitCode || (exports.UnitCode = UnitCode = {}));
/**
 * Currency codes (ISO 4217)
 * @see https://www.iso.org/iso-4217-currency-codes.html
 */
var CurrencyCode;
(function (CurrencyCode) {
    /** Euro */
    CurrencyCode["EUR"] = "EUR";
    /** US Dollar */
    CurrencyCode["USD"] = "USD";
    /** British Pound Sterling */
    CurrencyCode["GBP"] = "GBP";
    /** Swiss Franc */
    CurrencyCode["CHF"] = "CHF";
    /** Japanese Yen */
    CurrencyCode["JPY"] = "JPY";
    /** Canadian Dollar */
    CurrencyCode["CAD"] = "CAD";
    /** Australian Dollar */
    CurrencyCode["AUD"] = "AUD";
    /** Chinese Yuan Renminbi */
    CurrencyCode["CNY"] = "CNY";
    /** Swedish Krona */
    CurrencyCode["SEK"] = "SEK";
    /** Norwegian Krone */
    CurrencyCode["NOK"] = "NOK";
    /** Danish Krone */
    CurrencyCode["DKK"] = "DKK";
    /** Polish Zloty */
    CurrencyCode["PLN"] = "PLN";
    /** Czech Koruna */
    CurrencyCode["CZK"] = "CZK";
    /** Hungarian Forint */
    CurrencyCode["HUF"] = "HUF";
    /** Romanian Leu */
    CurrencyCode["RON"] = "RON";
    /** Brazilian Real */
    CurrencyCode["BRL"] = "BRL";
    /** Mexican Peso */
    CurrencyCode["MXN"] = "MXN";
    /** South African Rand */
    CurrencyCode["ZAR"] = "ZAR";
    /** Indian Rupee */
    CurrencyCode["INR"] = "INR";
    /** Singapore Dollar */
    CurrencyCode["SGD"] = "SGD";
    /** Hong Kong Dollar */
    CurrencyCode["HKD"] = "HKD";
    /** New Zealand Dollar */
    CurrencyCode["NZD"] = "NZD";
    /** Turkish Lira */
    CurrencyCode["TRY"] = "TRY";
    /** Russian Ruble */
    CurrencyCode["RUB"] = "RUB";
    /** United Arab Emirates Dirham */
    CurrencyCode["AED"] = "AED";
    /** Saudi Riyal */
    CurrencyCode["SAR"] = "SAR";
    /** Thai Baht */
    CurrencyCode["THB"] = "THB";
    /** Malaysian Ringgit */
    CurrencyCode["MYR"] = "MYR";
})(CurrencyCode || (exports.CurrencyCode = CurrencyCode = {}));
/**
 * E-invoicing compliance standards
 */
var ComplianceType;
(function (ComplianceType) {
    /** French/German Factur-X (ZUGFeRD) standard */
    ComplianceType["FACTUR_X"] = "FACTUR_X";
    /** Universal Business Language (OASIS UBL 2.1) */
    ComplianceType["UBL"] = "UBL";
    /** PEPPOL BIS Billing 3.0 (European) */
    ComplianceType["PEPPOL"] = "PEPPOL";
    /** Italian FatturaPA */
    ComplianceType["FATTURA_PA"] = "FATTURA_PA";
    /** Spanish FacturaE */
    ComplianceType["FACTURAE"] = "FACTURAE";
    /** Dutch UBL-OHNL */
    ComplianceType["UBL_OHNL"] = "UBL_OHNL";
    /** Belgian e-invoicing */
    ComplianceType["BELGIAN_EINVOICE"] = "BELGIAN_EINVOICE";
    /** Swiss e-invoicing */
    ComplianceType["SWISS_EINVOICE"] = "SWISS_EINVOICE";
    /** Custom/Other regional standard */
    ComplianceType["OTHER"] = "OTHER";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
//# sourceMappingURL=index.js.map