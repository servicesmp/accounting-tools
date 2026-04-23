"use strict";
/**
 * @module accounting-tools
 * @description Unified Factur-X library — single-package entry point.
 *
 * Install: "accounting-tools": "github:servicesmp/accounting-tools"
 *
 * Usage:
 *   import { FacturXInvoice, generateModernPDF } from 'accounting-tools';
 *
 * This file re-exports from pre-built packages/core/dist and packages/templates/dist.
 * Build order: core → templates → root
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBusinessRules = exports.getDefaultBusinessRuleValidator = exports.BusinessRuleValidator = exports.RealXsdValidator = exports.validateXmlAsync = exports.validateXml = exports.getDefaultValidator = exports.XsdValidator = exports.convertCurrency = exports.parseCurrency = exports.formatAmountForXml = exports.formatCurrency = exports.getCurrencyInfo = exports.isValidCurrency = exports.CurrencyFormatter = exports.validateDate = exports.validateAmount = exports.validateCountryCode = exports.validatePhone = exports.validateEmail = exports.sanitizeString = exports.unescapeXml = exports.escapeXml = exports.formatAmount = exports.formatDateFacturX = exports.getRegionalConfigOrDefault = exports.getRegionalConfig = exports.getProfilePolicy = exports.getGuidelineUrn = exports.REGIONAL_CONFIGS = exports.PATTERNS = exports.PROFILE_POLICIES = exports.GUIDELINE_URNS = exports.XML_NAMESPACES = exports.AllowanceChargeImpl = exports.InvoiceLineImpl = exports.DocumentHeaderImpl = exports.PaymentDetailsImpl = exports.TradePartyImpl = exports.PostalAddressImpl = exports.TaxCalculator = exports.FacturXInvoiceBuilder = exports.FacturXInvoice = exports.ComplianceType = exports.CurrencyCode = exports.UnitCode = exports.PaymentMeansCode = exports.TaxCategoryCode = exports.DocTypeCode = exports.FacturxProfile = void 0;
exports.LIBRARY_INFO = exports.EN16931_VERSION = exports.FACTURX_VERSION = exports.VERSION = exports.generatePDFFileID = exports.generatePDFA3XMP = exports.loadSRGBProfile = exports.addAFRelationshipToFile = exports.applyPDFA3Compliance = exports.setupPDFA3Compliance = exports.validateQuick = exports.validateAfterGeneration = exports.validateBeforeGeneration = exports.getDefaultPipeline = exports.ValidationPipeline = exports.generatePDF = exports.generateMinimalPDF = exports.generateCorporatePDF = exports.generateBrandPDF = exports.generateFancyPDF = exports.generateModernPDF = exports.MinimalTemplate = exports.CorporateTemplate = exports.BrandTemplate = exports.FancyTemplate = exports.ModernTemplate = exports.TemplateRenderer = exports.LOCALIZED_STRINGS = exports.FANCY_THEME = exports.BRAND_THEME = exports.DEFAULT_THEME = exports.TemplateType = exports.getAvailableLocaleCodes = exports.getLocaleByCode = exports.DEFAULT_LOCALES = exports.translate = exports.createI18n = exports.t = exports.getDefaultI18n = exports.I18n = exports.validateInvoiceCodes = exports.isValidCode = exports.getDefaultCodeListValidator = exports.CodeListValidator = void 0;
// ============================================================================
// CORE — all types, entities, validators, XML generation
// ============================================================================
var index_1 = require("../packages/core/dist/index");
// Enums
Object.defineProperty(exports, "FacturxProfile", { enumerable: true, get: function () { return index_1.FacturxProfile; } });
Object.defineProperty(exports, "DocTypeCode", { enumerable: true, get: function () { return index_1.DocTypeCode; } });
Object.defineProperty(exports, "TaxCategoryCode", { enumerable: true, get: function () { return index_1.TaxCategoryCode; } });
Object.defineProperty(exports, "PaymentMeansCode", { enumerable: true, get: function () { return index_1.PaymentMeansCode; } });
Object.defineProperty(exports, "UnitCode", { enumerable: true, get: function () { return index_1.UnitCode; } });
Object.defineProperty(exports, "CurrencyCode", { enumerable: true, get: function () { return index_1.CurrencyCode; } });
Object.defineProperty(exports, "ComplianceType", { enumerable: true, get: function () { return index_1.ComplianceType; } });
// Main classes
Object.defineProperty(exports, "FacturXInvoice", { enumerable: true, get: function () { return index_1.FacturXInvoice; } });
Object.defineProperty(exports, "FacturXInvoiceBuilder", { enumerable: true, get: function () { return index_1.FacturXInvoiceBuilder; } });
Object.defineProperty(exports, "TaxCalculator", { enumerable: true, get: function () { return index_1.TaxCalculator; } });
// Entities
Object.defineProperty(exports, "PostalAddressImpl", { enumerable: true, get: function () { return index_1.PostalAddressImpl; } });
Object.defineProperty(exports, "TradePartyImpl", { enumerable: true, get: function () { return index_1.TradePartyImpl; } });
Object.defineProperty(exports, "PaymentDetailsImpl", { enumerable: true, get: function () { return index_1.PaymentDetailsImpl; } });
Object.defineProperty(exports, "DocumentHeaderImpl", { enumerable: true, get: function () { return index_1.DocumentHeaderImpl; } });
Object.defineProperty(exports, "InvoiceLineImpl", { enumerable: true, get: function () { return index_1.InvoiceLineImpl; } });
Object.defineProperty(exports, "AllowanceChargeImpl", { enumerable: true, get: function () { return index_1.AllowanceChargeImpl; } });
// Constants
Object.defineProperty(exports, "XML_NAMESPACES", { enumerable: true, get: function () { return index_1.XML_NAMESPACES; } });
Object.defineProperty(exports, "GUIDELINE_URNS", { enumerable: true, get: function () { return index_1.GUIDELINE_URNS; } });
Object.defineProperty(exports, "PROFILE_POLICIES", { enumerable: true, get: function () { return index_1.PROFILE_POLICIES; } });
Object.defineProperty(exports, "PATTERNS", { enumerable: true, get: function () { return index_1.PATTERNS; } });
Object.defineProperty(exports, "REGIONAL_CONFIGS", { enumerable: true, get: function () { return index_1.REGIONAL_CONFIGS; } });
Object.defineProperty(exports, "getGuidelineUrn", { enumerable: true, get: function () { return index_1.getGuidelineUrn; } });
Object.defineProperty(exports, "getProfilePolicy", { enumerable: true, get: function () { return index_1.getProfilePolicy; } });
Object.defineProperty(exports, "getRegionalConfig", { enumerable: true, get: function () { return index_1.getRegionalConfig; } });
Object.defineProperty(exports, "getRegionalConfigOrDefault", { enumerable: true, get: function () { return index_1.getRegionalConfigOrDefault; } });
Object.defineProperty(exports, "formatDateFacturX", { enumerable: true, get: function () { return index_1.formatDateFacturX; } });
Object.defineProperty(exports, "formatAmount", { enumerable: true, get: function () { return index_1.formatAmount; } });
// Utils
Object.defineProperty(exports, "escapeXml", { enumerable: true, get: function () { return index_1.escapeXml; } });
Object.defineProperty(exports, "unescapeXml", { enumerable: true, get: function () { return index_1.unescapeXml; } });
Object.defineProperty(exports, "sanitizeString", { enumerable: true, get: function () { return index_1.sanitizeString; } });
Object.defineProperty(exports, "validateEmail", { enumerable: true, get: function () { return index_1.validateEmail; } });
Object.defineProperty(exports, "validatePhone", { enumerable: true, get: function () { return index_1.validatePhone; } });
Object.defineProperty(exports, "validateCountryCode", { enumerable: true, get: function () { return index_1.validateCountryCode; } });
Object.defineProperty(exports, "validateAmount", { enumerable: true, get: function () { return index_1.validateAmount; } });
Object.defineProperty(exports, "validateDate", { enumerable: true, get: function () { return index_1.validateDate; } });
Object.defineProperty(exports, "CurrencyFormatter", { enumerable: true, get: function () { return index_1.CurrencyFormatter; } });
Object.defineProperty(exports, "isValidCurrency", { enumerable: true, get: function () { return index_1.isValidCurrency; } });
Object.defineProperty(exports, "getCurrencyInfo", { enumerable: true, get: function () { return index_1.getCurrencyInfo; } });
Object.defineProperty(exports, "formatCurrency", { enumerable: true, get: function () { return index_1.formatCurrency; } });
Object.defineProperty(exports, "formatAmountForXml", { enumerable: true, get: function () { return index_1.formatAmountForXml; } });
Object.defineProperty(exports, "parseCurrency", { enumerable: true, get: function () { return index_1.parseCurrency; } });
Object.defineProperty(exports, "convertCurrency", { enumerable: true, get: function () { return index_1.convertCurrency; } });
// Validators
Object.defineProperty(exports, "XsdValidator", { enumerable: true, get: function () { return index_1.XsdValidator; } });
Object.defineProperty(exports, "getDefaultValidator", { enumerable: true, get: function () { return index_1.getDefaultValidator; } });
Object.defineProperty(exports, "validateXml", { enumerable: true, get: function () { return index_1.validateXml; } });
Object.defineProperty(exports, "validateXmlAsync", { enumerable: true, get: function () { return index_1.validateXmlAsync; } });
Object.defineProperty(exports, "RealXsdValidator", { enumerable: true, get: function () { return index_1.RealXsdValidator; } });
Object.defineProperty(exports, "BusinessRuleValidator", { enumerable: true, get: function () { return index_1.BusinessRuleValidator; } });
Object.defineProperty(exports, "getDefaultBusinessRuleValidator", { enumerable: true, get: function () { return index_1.getDefaultBusinessRuleValidator; } });
Object.defineProperty(exports, "validateBusinessRules", { enumerable: true, get: function () { return index_1.validateBusinessRules; } });
Object.defineProperty(exports, "CodeListValidator", { enumerable: true, get: function () { return index_1.CodeListValidator; } });
Object.defineProperty(exports, "getDefaultCodeListValidator", { enumerable: true, get: function () { return index_1.getDefaultCodeListValidator; } });
Object.defineProperty(exports, "isValidCode", { enumerable: true, get: function () { return index_1.isValidCode; } });
Object.defineProperty(exports, "validateInvoiceCodes", { enumerable: true, get: function () { return index_1.validateInvoiceCodes; } });
// i18n
Object.defineProperty(exports, "I18n", { enumerable: true, get: function () { return index_1.I18n; } });
Object.defineProperty(exports, "getDefaultI18n", { enumerable: true, get: function () { return index_1.getDefaultI18n; } });
Object.defineProperty(exports, "t", { enumerable: true, get: function () { return index_1.t; } });
Object.defineProperty(exports, "createI18n", { enumerable: true, get: function () { return index_1.createI18n; } });
Object.defineProperty(exports, "translate", { enumerable: true, get: function () { return index_1.translate; } });
Object.defineProperty(exports, "DEFAULT_LOCALES", { enumerable: true, get: function () { return index_1.DEFAULT_LOCALES; } });
Object.defineProperty(exports, "getLocaleByCode", { enumerable: true, get: function () { return index_1.getLocaleByCode; } });
Object.defineProperty(exports, "getAvailableLocaleCodes", { enumerable: true, get: function () { return index_1.getAvailableLocaleCodes; } });
// ============================================================================
// TEMPLATES — all PDF renderers and generation functions
// ============================================================================
var index_2 = require("../packages/templates/dist/index");
// Types
Object.defineProperty(exports, "TemplateType", { enumerable: true, get: function () { return index_2.TemplateType; } });
Object.defineProperty(exports, "DEFAULT_THEME", { enumerable: true, get: function () { return index_2.DEFAULT_THEME; } });
Object.defineProperty(exports, "BRAND_THEME", { enumerable: true, get: function () { return index_2.BRAND_THEME; } });
Object.defineProperty(exports, "FANCY_THEME", { enumerable: true, get: function () { return index_2.FANCY_THEME; } });
Object.defineProperty(exports, "LOCALIZED_STRINGS", { enumerable: true, get: function () { return index_2.LOCALIZED_STRINGS; } });
// Renderers
Object.defineProperty(exports, "TemplateRenderer", { enumerable: true, get: function () { return index_2.TemplateRenderer; } });
Object.defineProperty(exports, "ModernTemplate", { enumerable: true, get: function () { return index_2.ModernTemplate; } });
Object.defineProperty(exports, "FancyTemplate", { enumerable: true, get: function () { return index_2.FancyTemplate; } });
Object.defineProperty(exports, "BrandTemplate", { enumerable: true, get: function () { return index_2.BrandTemplate; } });
Object.defineProperty(exports, "CorporateTemplate", { enumerable: true, get: function () { return index_2.CorporateTemplate; } });
Object.defineProperty(exports, "MinimalTemplate", { enumerable: true, get: function () { return index_2.MinimalTemplate; } });
// Convenience functions
Object.defineProperty(exports, "generateModernPDF", { enumerable: true, get: function () { return index_2.generateModernPDF; } });
Object.defineProperty(exports, "generateFancyPDF", { enumerable: true, get: function () { return index_2.generateFancyPDF; } });
Object.defineProperty(exports, "generateBrandPDF", { enumerable: true, get: function () { return index_2.generateBrandPDF; } });
Object.defineProperty(exports, "generateCorporatePDF", { enumerable: true, get: function () { return index_2.generateCorporatePDF; } });
Object.defineProperty(exports, "generateMinimalPDF", { enumerable: true, get: function () { return index_2.generateMinimalPDF; } });
Object.defineProperty(exports, "generatePDF", { enumerable: true, get: function () { return index_2.generatePDF; } });
// Validation
Object.defineProperty(exports, "ValidationPipeline", { enumerable: true, get: function () { return index_2.ValidationPipeline; } });
Object.defineProperty(exports, "getDefaultPipeline", { enumerable: true, get: function () { return index_2.getDefaultPipeline; } });
Object.defineProperty(exports, "validateBeforeGeneration", { enumerable: true, get: function () { return index_2.validateBeforeGeneration; } });
Object.defineProperty(exports, "validateAfterGeneration", { enumerable: true, get: function () { return index_2.validateAfterGeneration; } });
Object.defineProperty(exports, "validateQuick", { enumerable: true, get: function () { return index_2.validateQuick; } });
// PDF/A-3
Object.defineProperty(exports, "setupPDFA3Compliance", { enumerable: true, get: function () { return index_2.setupPDFA3Compliance; } });
Object.defineProperty(exports, "applyPDFA3Compliance", { enumerable: true, get: function () { return index_2.applyPDFA3Compliance; } });
Object.defineProperty(exports, "addAFRelationshipToFile", { enumerable: true, get: function () { return index_2.addAFRelationshipToFile; } });
Object.defineProperty(exports, "loadSRGBProfile", { enumerable: true, get: function () { return index_2.loadSRGBProfile; } });
Object.defineProperty(exports, "generatePDFA3XMP", { enumerable: true, get: function () { return index_2.generatePDFA3XMP; } });
Object.defineProperty(exports, "generatePDFFileID", { enumerable: true, get: function () { return index_2.generatePDFFileID; } });
// ============================================================================
// VERSION
// ============================================================================
exports.VERSION = '1.1.0';
exports.FACTURX_VERSION = '1.07.2';
exports.EN16931_VERSION = '2017';
exports.LIBRARY_INFO = Object.freeze({
    name: 'accounting-tools',
    version: exports.VERSION,
    facturxVersion: exports.FACTURX_VERSION,
    en16931Version: exports.EN16931_VERSION,
    description: 'Unified Factur-X/ZUGFeRD invoice generation & compliance library',
    license: 'MIT',
    repository: 'https://github.com/servicesmp/accounting-tools',
    standards: ['Factur-X 1.07.2', 'EN 16931:2017', 'ZUGFeRD 2.3', 'XP Z12-012 (FR)'],
});
//# sourceMappingURL=index.js.map