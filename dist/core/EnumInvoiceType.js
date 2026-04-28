"use strict";
// src/core/EnumInvoiceType.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceType = exports.TaxCategoryCode = exports.LegalOrganizationScheme = exports.DocTypeCode = exports.FacturxProfile = void 0;
//------------------------------------
//  ENUMS et CODES
//------------------------------------
/**
 * Profil Factur-X : BASIC ou EXTENDED
 * Cf. UNTDID 1001 ou EN16931.
 */
var FacturxProfile;
(function (FacturxProfile) {
    FacturxProfile["MINIMUM"] = "MINIMUM";
    FacturxProfile["BASICWL"] = "BASICWL";
    FacturxProfile["BASIC"] = "BASIC";
    FacturxProfile["EN16931"] = "EN16931";
    FacturxProfile["EXTENDED"] = "EXTENDED";
})(FacturxProfile || (exports.FacturxProfile = FacturxProfile = {}));
/**
 * Code de type de document (Factur-X)
 * Cf. UNTDID 1001 ou EN16931.
 */
var DocTypeCode;
(function (DocTypeCode) {
    DocTypeCode["INVOICE"] = "380";
    DocTypeCode["CREDIT_NOTE"] = "381";
    DocTypeCode["DEBIT_NOTE"] = "382";
    DocTypeCode["CORRECTION"] = "383";
    DocTypeCode["PRO_FORMAT"] = "384";
    DocTypeCode["ADVANCE_PAYMENT"] = "385";
    DocTypeCode["FINAL_INVOICE"] = "386";
    DocTypeCode["CREDIT_MEMO"] = "387";
    DocTypeCode["ADJUSTMENT_INVOICE"] = "388";
})(DocTypeCode || (exports.DocTypeCode = DocTypeCode = {}));
/**
 * Identifiants légaux possibles (SchemeID).
 * Ex. "0002" = SIRET France, "0088" = GLN (Europe), etc.
 */
var LegalOrganizationScheme;
(function (LegalOrganizationScheme) {
    LegalOrganizationScheme["SIRET_0002"] = "0002";
    LegalOrganizationScheme["INSEE_0004"] = "0004";
    LegalOrganizationScheme["EAN_0007"] = "0007";
    LegalOrganizationScheme["GLN_0088"] = "0088";
    LegalOrganizationScheme["DUNS_0106"] = "0106";
    LegalOrganizationScheme["OIN_0177"] = "0177";
    LegalOrganizationScheme["USTID_9906"] = "9906";
    LegalOrganizationScheme["STEUERNR_9907"] = "9907";
})(LegalOrganizationScheme || (exports.LegalOrganizationScheme = LegalOrganizationScheme = {}));
/**
 * Catégories de taxe communes Factur-X
 * Cf. UNTDID 5305 ou EN16931.
 */
var TaxCategoryCode;
(function (TaxCategoryCode) {
    TaxCategoryCode["STANDARD"] = "S";
    TaxCategoryCode["REDUCED"] = "AA";
    TaxCategoryCode["ZERO"] = "Z";
    TaxCategoryCode["EXEMPT"] = "E";
    TaxCategoryCode["REVERSE_CHARGE"] = "AE";
    TaxCategoryCode["OUT_OF_SCOPE"] = "O";
    TaxCategoryCode["EXPORT"] = "G"; // Export
})(TaxCategoryCode || (exports.TaxCategoryCode = TaxCategoryCode = {}));
/**
 * Types of e-invoicing compliance
 */
var ComplianceType;
(function (ComplianceType) {
    ComplianceType["FR_FACTUR_X"] = "FR_FACTUR_X";
    ComplianceType["GENERIC_UBL"] = "GENERIC_UBL";
    ComplianceType["OTHER_REGION"] = "OTHER_REGION";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
