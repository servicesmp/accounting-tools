/**
 * @module factur-x-ts
 * @description Factur-X (ZUGFeRD) Core Library - Production Ready
 *
 * High-performance TypeScript implementation of Factur-X 1.07.2
 * Fully compliant with EN 16931:2017 standard
 *
 * @author Factur-X Team
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// TYPE SYSTEM
// ============================================================================

export {
  // Enums
  FacturxProfile,
  DocTypeCode,
  TaxCategoryCode,
  PaymentMeansCode,
  UnitCode,
  CurrencyCode,
  ComplianceType,

  // Core Interfaces
  PostalAddress,
  TradeParty,
  PaymentDetails,
  DocumentHeader,
  InvoiceLine,
  AllowanceCharge,

  // Tax & Summary
  TaxSummary,
  MonetarySummary,

  // Validation
  ValidationResult,

  // Advanced Types
  ProfilePolicy,
  RegionalConfig,

} from './types';

// ============================================================================
// CORE BUSINESS LOGIC
// ============================================================================

export {
  // Main Invoice Class
  FacturXInvoice,
  FacturXInvoiceBuilder,
} from './core/FacturXInvoice';

export {
  // Tax Calculator
  TaxCalculator,
} from './core/TaxCalculator';

export {
  // Immutable Entities
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLine as InvoiceLineImpl,
  AllowanceCharge as AllowanceChargeImpl,
} from './core/entities';

export {
  // Constants & Helpers
  XML_NAMESPACES,
  GUIDELINE_URNS,
  PROFILE_POLICIES,
  PATTERNS,
  REGIONAL_CONFIGS,
  getGuidelineUrn,
  getProfilePolicy,
  getRegionalConfig,
  getRegionalConfigOrDefault,
  formatDateFacturX,
  formatAmount,
} from './core/constants';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // Input Sanitization & Validation
  escapeXml,
  unescapeXml,
  sanitizeString,
  validateEmail,
  validatePhone,
  validateCountryCode,
  validateAmount,
  validateDate,
} from './utils/InputSanitizer';

export {
  // Currency Utilities
  CurrencyFormatter,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,
} from './utils/CurrencyFormatter';

export {
  // XSD Validation (structural)
  XsdValidator,
  getDefaultValidator,
  validateXml,
  validateXmlAsync,
  type XsdValidationResult,
  type XsdValidationError,
  type ValidatorOptions,
} from './validation/XsdValidator';

export {
  // Real XSD Validation (against actual XSD schemas)
  RealXsdValidator,
  type RealXsdValidationResult,
} from './validation/RealXsdValidator';

export {
  // Business Rule Validation (EN16931 Schematron rules + BR-FR)
  BusinessRuleValidator,
  getDefaultBusinessRuleValidator,
  validateBusinessRules,
  type BusinessRule,
  type BusinessRuleResult,
  type BusinessRuleValidationResult,
} from './validation/BusinessRuleValidator';

export {
  // Code List Validation (ISO 4217, ISO 3166, UNTDID, etc.)
  CodeListValidator,
  getDefaultCodeListValidator,
  isValidCode,
  validateInvoiceCodes,
  type CodeListName,
  type CodeListValidationResult,
} from './validation/CodeListValidator';

export {
  // NoteWithCode type for FR compliance
  type NoteWithCode,
  // Réforme FR 2026 : nature de l'opération (BT-23), TVA sur les débits (BT-8), livraison
  type DeliveryParty,
  type PrecedingInvoiceReference,
  VatDueDateTypeCode,
  OperationNature,
  FR_BUSINESS_PROCESS_PATTERN,
  buildBusinessProcessType,
} from './types';

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const FACTURX_VERSION = '1.07.2';
export const EN16931_VERSION = '2017';

/**
 * Library metadata
 */
export const LIBRARY_INFO = Object.freeze({
  name: '@facturx/core',
  version: VERSION,
  facturxVersion: FACTURX_VERSION,
  en16931Version: EN16931_VERSION,
  description: 'High-performance Factur-X/ZUGFeRD implementation',
  license: 'MIT',
  repository: 'https://github.com/facturx/facturx-ts',
  homepage: 'https://factur-x.eu/',
  standards: [
    'Factur-X 1.07.2',
    'EN 16931:2017',
    'ZUGFeRD 2.3',
    'CII D16B',
  ],
});

// ============================================================================
// INTERNATIONALIZATION (i18n)
// ============================================================================

export {
  // i18n Core
  I18n,
  getDefaultI18n,
  t,
  createI18n,
  translate,

  // Default Locales
  en,
  fr,
  de,
  DEFAULT_LOCALES,
  getLocaleByCode,
  getAvailableLocaleCodes,

  // i18n Types
  type LocaleCode,
  type LocaleData,
  type Messages,
  type I18nOptions,
  type TranslationOptions,
  type I18nPlugin,
  type FormatterPlugin,
  type InterpolationContext,
  type DateFormats,
  type NumberFormats,
  type PluralizationRule,
  type TextDirection,
} from './i18n';
