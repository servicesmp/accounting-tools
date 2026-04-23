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

// ============================================================================
// CORE — all types, entities, validators, XML generation
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
  ProfilePolicy,
  RegionalConfig,
  NoteWithCode,

  // Main classes
  FacturXInvoice,
  FacturXInvoiceBuilder,
  TaxCalculator,

  // Entities
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLineImpl,
  AllowanceChargeImpl,

  // Constants
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

  // Utils
  escapeXml,
  unescapeXml,
  sanitizeString,
  validateEmail,
  validatePhone,
  validateCountryCode,
  validateAmount,
  validateDate,
  CurrencyFormatter,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,

  // Validators
  XsdValidator,
  getDefaultValidator,
  validateXml,
  validateXmlAsync,
  RealXsdValidator,
  BusinessRuleValidator,
  getDefaultBusinessRuleValidator,
  validateBusinessRules,
  CodeListValidator,
  getDefaultCodeListValidator,
  isValidCode,
  validateInvoiceCodes,

  // i18n
  I18n,
  getDefaultI18n,
  t,
  createI18n,
  translate,
  DEFAULT_LOCALES,
  getLocaleByCode,
  getAvailableLocaleCodes,
} from '../packages/core/dist/index';

// ============================================================================
// TEMPLATES — all PDF renderers and generation functions
// ============================================================================
export {
  // Types
  TemplateType,
  TemplateTheme,
  TemplateOptions,
  TemplateContext,
  PDFGenerationResult,
  PDFAttachmentOptions,
  RenderContext,
  RenderedElement,
  LocalizedStrings,
  DEFAULT_THEME,
  BRAND_THEME,
  FANCY_THEME,
  LOCALIZED_STRINGS,

  // Renderers
  TemplateRenderer,
  ModernTemplate,
  FancyTemplate,
  BrandTemplate,
  CorporateTemplate,
  MinimalTemplate,

  // Convenience functions
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
  generatePDF,

  // Validation
  ValidationPipeline,
  getDefaultPipeline,
  validateBeforeGeneration,
  validateAfterGeneration,
  validateQuick,

  // PDF/A-3
  setupPDFA3Compliance,
  applyPDFA3Compliance,
  addAFRelationshipToFile,
  loadSRGBProfile,
  generatePDFA3XMP,
  generatePDFFileID,
} from '../packages/templates/dist/index';

// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '1.1.0';
export const FACTURX_VERSION = '1.07.2';
export const EN16931_VERSION = '2017';

export const LIBRARY_INFO = Object.freeze({
  name: 'accounting-tools',
  version: VERSION,
  facturxVersion: FACTURX_VERSION,
  en16931Version: EN16931_VERSION,
  description: 'Unified Factur-X/ZUGFeRD invoice generation & compliance library',
  license: 'MIT',
  repository: 'https://github.com/servicesmp/accounting-tools',
  standards: ['Factur-X 1.07.2', 'EN 16931:2017', 'ZUGFeRD 2.3', 'XP Z12-012 (FR)'],
});
