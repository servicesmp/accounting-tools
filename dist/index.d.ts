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
export { FacturxProfile, DocTypeCode, TaxCategoryCode, PaymentMeansCode, UnitCode, CurrencyCode, ComplianceType, PostalAddress, TradeParty, PaymentDetails, DocumentHeader, InvoiceLine, AllowanceCharge, TaxSummary, MonetarySummary, ValidationResult, ProfilePolicy, RegionalConfig, NoteWithCode, FacturXInvoice, FacturXInvoiceBuilder, TaxCalculator, PostalAddressImpl, TradePartyImpl, PaymentDetailsImpl, DocumentHeaderImpl, InvoiceLineImpl, AllowanceChargeImpl, XML_NAMESPACES, GUIDELINE_URNS, PROFILE_POLICIES, PATTERNS, REGIONAL_CONFIGS, getGuidelineUrn, getProfilePolicy, getRegionalConfig, getRegionalConfigOrDefault, formatDateFacturX, formatAmount, escapeXml, unescapeXml, sanitizeString, validateEmail, validatePhone, validateCountryCode, validateAmount, validateDate, CurrencyFormatter, isValidCurrency, getCurrencyInfo, formatCurrency, formatAmountForXml, parseCurrency, convertCurrency, XsdValidator, getDefaultValidator, validateXml, validateXmlAsync, RealXsdValidator, BusinessRuleValidator, getDefaultBusinessRuleValidator, validateBusinessRules, CodeListValidator, getDefaultCodeListValidator, isValidCode, validateInvoiceCodes, I18n, getDefaultI18n, t, createI18n, translate, DEFAULT_LOCALES, getLocaleByCode, getAvailableLocaleCodes, } from '../packages/core/dist/index';
export { TemplateType, TemplateTheme, TemplateOptions, TemplateContext, PDFGenerationResult, PDFAttachmentOptions, RenderContext, RenderedElement, LocalizedStrings, DEFAULT_THEME, BRAND_THEME, FANCY_THEME, LOCALIZED_STRINGS, TemplateRenderer, ModernTemplate, FancyTemplate, BrandTemplate, CorporateTemplate, MinimalTemplate, generateModernPDF, generateFancyPDF, generateBrandPDF, generateCorporatePDF, generateMinimalPDF, generatePDF, ValidationPipeline, getDefaultPipeline, validateBeforeGeneration, validateAfterGeneration, validateQuick, setupPDFA3Compliance, applyPDFA3Compliance, addAFRelationshipToFile, loadSRGBProfile, generatePDFA3XMP, generatePDFFileID, } from '../packages/templates/dist/index';
export declare const VERSION = "1.1.0";
export declare const FACTURX_VERSION = "1.07.2";
export declare const EN16931_VERSION = "2017";
export declare const LIBRARY_INFO: Readonly<{
    name: "accounting-tools";
    version: "1.1.0";
    facturxVersion: "1.07.2";
    en16931Version: "2017";
    description: "Unified Factur-X/ZUGFeRD invoice generation & compliance library";
    license: "MIT";
    repository: "https://github.com/servicesmp/accounting-tools";
    standards: string[];
}>;
//# sourceMappingURL=index.d.ts.map