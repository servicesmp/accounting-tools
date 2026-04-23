/**
 * @module accounting-tools
 * @description Unified Factur-X library — single-package entry point.
 *
 * Installs everything in ONE line:
 *   "accounting-tools": "github:servicesmp/accounting-tools"
 *
 * Exports:
 *  - All @facturx/core types, entities, validators, XML generation
 *  - All @facturx/templates PDF renderers, convenience functions
 *
 * Usage after install:
 *   import { FacturXInvoice, generateModernPDF } from 'accounting-tools';
 */

// ============================================================================
// RE-EXPORT EVERYTHING FROM CORE
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

  // NoteWithCode (FR compliance)
  NoteWithCode,
} from './core/types';

export {
  FacturXInvoice,
  FacturXInvoiceBuilder,
} from './core/core/FacturXInvoice';

export {
  TaxCalculator,
} from './core/core/TaxCalculator';

export {
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLine as InvoiceLineImpl,
  AllowanceCharge as AllowanceChargeImpl,
} from './core/core/entities';

export {
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
} from './core/core/constants';

export {
  escapeXml,
  unescapeXml,
  sanitizeString,
  validateEmail,
  validatePhone,
  validateCountryCode,
  validateAmount,
  validateDate,
} from './core/utils/InputSanitizer';

export {
  CurrencyFormatter,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrency,
  formatAmountForXml,
  parseCurrency,
  convertCurrency,
} from './core/utils/CurrencyFormatter';

export {
  XsdValidator,
  getDefaultValidator,
  validateXml,
  validateXmlAsync,
} from './core/validation/XsdValidator';

export {
  RealXsdValidator,
} from './core/validation/RealXsdValidator';

export {
  BusinessRuleValidator,
  getDefaultBusinessRuleValidator,
  validateBusinessRules,
} from './core/validation/BusinessRuleValidator';

export {
  CodeListValidator,
  getDefaultCodeListValidator,
  isValidCode,
  validateInvoiceCodes,
} from './core/validation/CodeListValidator';

export {
  I18n,
  getDefaultI18n,
  t,
  createI18n,
  translate,
  en,
  fr,
  de,
  DEFAULT_LOCALES,
  getLocaleByCode,
  getAvailableLocaleCodes,
} from './core/i18n';

// ============================================================================
// RE-EXPORT EVERYTHING FROM TEMPLATES
// ============================================================================

export {
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
} from './templates/types';

export { TemplateRenderer } from './templates/core/TemplateRenderer';
export { ModernTemplate } from './templates/templates/ModernTemplate';
export { FancyTemplate } from './templates/templates/FancyTemplate';
export { BrandTemplate } from './templates/templates/BrandTemplate';
export { CorporateTemplate } from './templates/templates/CorporateTemplate';
export { MinimalTemplate } from './templates/templates/MinimalTemplate';

export {
  ValidationPipeline,
  ValidationPipelineResult,
  PDFA3ValidationResult,
  XMLAttachmentResult,
  ValidationSummary,
  getDefaultPipeline,
  validateBeforeGeneration,
  validateAfterGeneration,
  validateQuick,
} from './templates/validation/ValidationPipeline';

export {
  setupPDFA3Compliance,
  applyPDFA3Compliance,
  addAFRelationshipToFile,
  loadChillaxFonts,
  loadSRGBProfile,
  generatePDFA3XMP,
  generatePDFFileID,
} from './templates/utils/PDFA3Compliance';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { FacturXInvoice } from './core/core/FacturXInvoice';
import { ModernTemplate } from './templates/templates/ModernTemplate';
import { FancyTemplate } from './templates/templates/FancyTemplate';
import { BrandTemplate } from './templates/templates/BrandTemplate';
import { CorporateTemplate } from './templates/templates/CorporateTemplate';
import { MinimalTemplate } from './templates/templates/MinimalTemplate';
import { TemplateOptions, PDFGenerationResult, TemplateType } from './templates/types';

/** Generate a PDF/A-3 invoice with the Modern template */
export async function generateModernPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  return new ModernTemplate().generate(invoice, options);
}

/** Generate a PDF/A-3 invoice with the Fancy template */
export async function generateFancyPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  return new FancyTemplate().generate(invoice, options);
}

/** Generate a PDF/A-3 invoice with the Brand template */
export async function generateBrandPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  return new BrandTemplate().generate(invoice, options);
}

/** Generate a PDF/A-3 invoice with the Corporate template */
export async function generateCorporatePDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  return new CorporateTemplate().generate(invoice, options);
}

/** Generate a PDF/A-3 invoice with the Minimal template */
export async function generateMinimalPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  return new MinimalTemplate().generate(invoice, options);
}

/** Generate a PDF/A-3 invoice with the specified template type */
export async function generatePDF(
  invoice: FacturXInvoice,
  templateType: TemplateType = TemplateType.MODERN,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  switch (templateType) {
    case TemplateType.MODERN:    return new ModernTemplate().generate(invoice, options);
    case TemplateType.BRAND:     return new BrandTemplate().generate(invoice, options);
    case TemplateType.FANCY:     return new FancyTemplate().generate(invoice, options);
    case TemplateType.CORPORATE: return new CorporateTemplate().generate(invoice, options);
    case TemplateType.MINIMAL:   return new MinimalTemplate().generate(invoice, options);
    default:                     return new ModernTemplate().generate(invoice, options);
  }
}

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
