/**
 * @module accounting-tools
 * @description Unified Factur-X library — single-package entry point.
 *
 * Install: "accounting-tools": "github:servicesmp/accounting-tools"
 * Usage:   import { FacturXInvoice, generateModernPDF } from 'accounting-tools';
 *
 * Compilation: tsc compiles all sources together, tsc-alias rewrites
 * @facturx/core → relative paths in dist/ so it works when installed.
 */

// ============================================================================
// CORE — all types, entities, validators, XML generation
// ============================================================================
export {
  FacturxProfile, DocTypeCode, TaxCategoryCode, PaymentMeansCode, UnitCode,
  CurrencyCode, ComplianceType,
  FacturXInvoice, FacturXInvoiceBuilder, TaxCalculator,
  // Entities (classes — usable with `new`)
  PostalAddressImpl, TradePartyImpl, PaymentDetailsImpl, DocumentHeaderImpl,
  InvoiceLineImpl,      // class re-exported as InvoiceLineImpl from entities.ts
  AllowanceChargeImpl,  // class re-exported as AllowanceChargeImpl from entities.ts
  XML_NAMESPACES, GUIDELINE_URNS, PROFILE_POLICIES, PATTERNS, REGIONAL_CONFIGS,
  getGuidelineUrn, getProfilePolicy, getRegionalConfig, getRegionalConfigOrDefault,
  formatDateFacturX, formatAmount,
  escapeXml, unescapeXml, sanitizeString,
  validateEmail, validatePhone, validateCountryCode, validateAmount, validateDate,
  CurrencyFormatter, isValidCurrency, getCurrencyInfo, formatCurrency,
  formatAmountForXml, parseCurrency, convertCurrency,
  XsdValidator, getDefaultValidator, validateXml, validateXmlAsync,
  RealXsdValidator,
  BusinessRuleValidator, getDefaultBusinessRuleValidator, validateBusinessRules,
  CodeListValidator, getDefaultCodeListValidator, isValidCode, validateInvoiceCodes,
  I18n, getDefaultI18n, t, createI18n, translate, DEFAULT_LOCALES,
  getLocaleByCode, getAvailableLocaleCodes,
  // Réforme FR 2026
  VatDueDateTypeCode, OperationNature, FR_BUSINESS_PROCESS_PATTERN, buildBusinessProcessType,
} from '@facturx/core';

// Type-only exports from core
export type {
  PostalAddress, TradeParty, PaymentDetails, DocumentHeader, InvoiceLine,
  AllowanceCharge, TaxSummary, MonetarySummary, ValidationResult, ProfilePolicy,
  RegionalConfig, NoteWithCode, DeliveryParty, PrecedingInvoiceReference,
} from '@facturx/core';

// ============================================================================
// TEMPLATES — all PDF renderers and generation functions
// ============================================================================
export {
  TemplateType, TemplateTheme, DEFAULT_THEME, BRAND_THEME, FANCY_THEME,
  LOCALIZED_STRINGS,
  TemplateRenderer, ModernTemplate, FancyTemplate, BrandTemplate,
  CorporateTemplate, MinimalTemplate,
  generateModernPDF, generateFancyPDF, generateBrandPDF,
  generateCorporatePDF, generateMinimalPDF, generatePDF,
  ValidationPipeline, getDefaultPipeline,
  validateBeforeGeneration, validateAfterGeneration, validateQuick,
  setupPDFA3Compliance, applyPDFA3Compliance, addAFRelationshipToFile,
  loadSRGBProfile, generatePDFA3XMP, generatePDFFileID,
  DOCUMENT_TITLES, getDocumentTitle,
} from '@facturx/templates';

// ============================================================================
// DOCUMENTS PAR BLOCS — facture, avoir, devis, bon de commande
// (la partie navigateur-compatible est aussi publiée seule : 'accounting-tools/document')
// ============================================================================
export * from '@facturx/templates/document';
export {
  generateDocumentPdf, renderDocumentPdf, DocumentPdfRenderer, buildFacturXInvoice,
  FR_MANDATORY_NOTES, FR_FRANCHISE_MENTION,
} from '@facturx/templates/document-pdf';
export type {
  GenerateDocumentPdfInput, GeneratedDocumentPdf, RenderDocumentPdfOptions, RenderedDocumentPdf, FacturXBuildResult,
} from '@facturx/templates/document-pdf';

// Type-only exports from templates
export type {
  TemplateOptions, TemplateContext, PDFGenerationResult, PDFAttachmentOptions,
  RenderContext, RenderedElement, LocalizedStrings,
  BrandSlots,
} from '@facturx/templates';

// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '1.2.0';
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
