export { FacturxProfile, DocTypeCode, TaxCategoryCode, PaymentMeansCode, UnitCode, CurrencyCode, ComplianceType, PostalAddress, TradeParty, PaymentDetails, DocumentHeader, InvoiceLine, AllowanceCharge, TaxSummary, MonetarySummary, ValidationResult, ProfilePolicy, RegionalConfig, } from './types';
export { FacturXInvoice, FacturXInvoiceBuilder, } from './core/FacturXInvoice';
export { TaxCalculator, } from './core/TaxCalculator';
export { PostalAddressImpl, TradePartyImpl, PaymentDetailsImpl, DocumentHeaderImpl, InvoiceLine as InvoiceLineImpl, AllowanceCharge as AllowanceChargeImpl, } from './core/entities';
export { XML_NAMESPACES, GUIDELINE_URNS, PROFILE_POLICIES, PATTERNS, REGIONAL_CONFIGS, getGuidelineUrn, getProfilePolicy, getRegionalConfig, getRegionalConfigOrDefault, formatDateFacturX, formatAmount, } from './core/constants';
export { escapeXml, unescapeXml, sanitizeString, validateEmail, validatePhone, validateCountryCode, validateAmount, validateDate, } from './utils/InputSanitizer';
export { CurrencyFormatter, isValidCurrency, getCurrencyInfo, formatCurrency, formatAmountForXml, parseCurrency, convertCurrency, } from './utils/CurrencyFormatter';
export { XsdValidator, getDefaultValidator, validateXml, validateXmlAsync, type XsdValidationResult, type XsdValidationError, type ValidatorOptions, } from './validation/XsdValidator';
export { RealXsdValidator, type RealXsdValidationResult, } from './validation/RealXsdValidator';
export { BusinessRuleValidator, getDefaultBusinessRuleValidator, validateBusinessRules, type BusinessRule, type BusinessRuleResult, type BusinessRuleValidationResult, } from './validation/BusinessRuleValidator';
export { CodeListValidator, getDefaultCodeListValidator, isValidCode, validateInvoiceCodes, type CodeListName, type CodeListValidationResult, } from './validation/CodeListValidator';
export { type NoteWithCode, } from './types';
export declare const VERSION = "1.0.0";
export declare const FACTURX_VERSION = "1.07.2";
export declare const EN16931_VERSION = "2017";
export declare const LIBRARY_INFO: Readonly<{
    name: "@facturx/core";
    version: "1.0.0";
    facturxVersion: "1.07.2";
    en16931Version: "2017";
    description: "High-performance Factur-X/ZUGFeRD implementation";
    license: "MIT";
    repository: "https://github.com/facturx/facturx-ts";
    homepage: "https://factur-x.eu/";
    standards: string[];
}>;
export { I18n, getDefaultI18n, t, createI18n, translate, en, fr, de, DEFAULT_LOCALES, getLocaleByCode, getAvailableLocaleCodes, type LocaleCode, type LocaleData, type Messages, type I18nOptions, type TranslationOptions, type I18nPlugin, type FormatterPlugin, type InterpolationContext, type DateFormats, type NumberFormats, type PluralizationRule, type TextDirection, } from './i18n';
//# sourceMappingURL=index.d.ts.map