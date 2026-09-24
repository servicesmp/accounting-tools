"use strict";
/**
 * @module types
 * @description Core types and interfaces for Factur-X implementation
 * Optimized for performance and type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FR_BUSINESS_PROCESS_PATTERN = exports.OperationNature = exports.VatDueDateTypeCode = exports.ComplianceType = exports.CurrencyCode = exports.UnitCode = exports.PaymentMeansCode = exports.TaxCategoryCode = exports.DocTypeCode = exports.FacturxProfile = void 0;
exports.buildBusinessProcessType = buildBusinessProcessType;
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
    /** Corrected invoice — facture rectificative (UNTDID 1001 : 384). */
    DocTypeCode[DocTypeCode["CORRECTED_INVOICE"] = 384] = "CORRECTED_INVOICE";
    /**
     * @deprecated Nom historique erroné : 384 est une facture RECTIFICATIVE, pas une
     * pro forma ni un devis (un devis n'est pas une facture et n'a pas de code EN 16931).
     * Utiliser CORRECTED_INVOICE.
     */
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
/** BT-8 — UNTDID 2005 (sous-ensemble autorisé par EN 16931). */
var VatDueDateTypeCode;
(function (VatDueDateTypeCode) {
    /** Date d'émission de la facture — option TVA sur les débits */
    VatDueDateTypeCode["INVOICE_DATE"] = "5";
    /** Date de livraison effective */
    VatDueDateTypeCode["DELIVERY_DATE"] = "29";
    /** Date de paiement — TVA sur les encaissements */
    VatDueDateTypeCode["PAYMENT_DATE"] = "72";
})(VatDueDateTypeCode || (exports.VatDueDateTypeCode = VatDueDateTypeCode = {}));
/** Nature de l'opération (réforme 2026) → lettre du cadre de facturation BT-23. */
var OperationNature;
(function (OperationNature) {
    OperationNature["GOODS"] = "B";
    OperationNature["SERVICES"] = "S";
    OperationNature["MIXED"] = "M";
})(OperationNature || (exports.OperationNature = OperationNature = {}));
/** Cadres de facturation français BT-23 actuellement admis (8 et 9 retirés). */
exports.FR_BUSINESS_PROCESS_PATTERN = /^[BSM][1-7]$/;
/** Construit le code BT-23 à partir de la nature de l'opération et du cadre (1 = dépôt standard). */
function buildBusinessProcessType(nature, framework = 1) {
    const code = `${nature}${framework}`;
    if (!exports.FR_BUSINESS_PROCESS_PATTERN.test(code)) {
        throw new Error(`[Factur-X] Cadre de facturation BT-23 invalide : ${code}`);
    }
    return code;
}
//# sourceMappingURL=index.js.map