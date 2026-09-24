/**
 * @module smp-factur-x-ts
 * @description Professional PDF templates for Factur-X invoices
 *
 * High-performance template rendering with multiple themes
 *
 * @author Factur-X Team
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// TYPES
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
} from './types';

export { DOCUMENT_TITLES, getDocumentTitle } from './types';
export type { BrandSlots } from './types';

// ============================================================================
// DOCUMENTS PAR BLOCS (facture, avoir, devis, bon de commande)
// ============================================================================

export * from './document';
export * from './document-pdf';

// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================

export { TemplateRenderer } from './core/TemplateRenderer';
export { ModernTemplate } from './templates/ModernTemplate';
export { FancyTemplate } from './templates/FancyTemplate';
export { BrandTemplate } from './templates/BrandTemplate';
export { CorporateTemplate } from './templates/CorporateTemplate';
export { MinimalTemplate } from './templates/MinimalTemplate';

// ============================================================================
// VALIDATION
// ============================================================================

export {
  ValidationPipeline,
  ValidationPipelineResult,
  PDFA3ValidationResult,
  XMLAttachmentResult,
  ValidationSummary,
  ValidationOptions as ValidationPipelineOptions,
  getDefaultPipeline,
  validateBeforeGeneration,
  validateAfterGeneration,
  validateQuick,
} from './validation/ValidationPipeline';

// External validation tools
export {
  ExternalValidator,
  VeraPDFValidator,
  MustangprojectValidator,
  ExternalValidationResult,
  ExternalValidationSummary,
  VeraPDFResult,
  VeraPDFError,
  VeraPDFWarning,
  VeraPDFMetadata,
  MustangprojectResult,
  MustangError,
  MustangWarning,
  ExternalValidatorConfig,
  checkExternalValidators,
  findVeraPDF,
  findMustangproject,
  getDefaultExternalValidator,
  validateWithExternalTools,
  extractXMLWithExternalTools,
} from './validation/ExternalValidators';

// ============================================================================
// PDF/A-3 COMPLIANCE UTILITIES
// ============================================================================

export {
  setupPDFA3Compliance,
  applyPDFA3Compliance,
  addAFRelationshipToFile,
  loadChillaxFonts,
  loadSRGBProfile,
  generatePDFA3XMP,
  generatePDFFileID,
  EmbeddedFonts,
  PDFA3MetadataOptions,
  PDFA3SetupOptions,
} from './utils/PDFA3Compliance';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { FacturXInvoice } from '@facturx/core';
import { ModernTemplate } from './templates/ModernTemplate';
import { FancyTemplate } from './templates/FancyTemplate';
import { BrandTemplate } from './templates/BrandTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { TemplateOptions, PDFGenerationResult, TemplateType } from './types';

/**
 * Generate PDF with modern template - Convenience function
 */
export async function generateModernPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new ModernTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with fancy template - Convenience function
 */
export async function generateFancyPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new FancyTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with brand template - Convenience function
 */
export async function generateBrandPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new BrandTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with corporate template - Convenience function
 */
export async function generateCorporatePDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new CorporateTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with minimal template - Convenience function
 */
export async function generateMinimalPDF(
  invoice: FacturXInvoice,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  const template = new MinimalTemplate();
  return template.generate(invoice, options);
}

/**
 * Generate PDF with specified template type
 */
export async function generatePDF(
  invoice: FacturXInvoice,
  templateType: TemplateType = TemplateType.MODERN,
  options: Partial<TemplateOptions> = {}
): Promise<PDFGenerationResult> {
  let template;

  switch (templateType) {
    case TemplateType.MODERN:
      template = new ModernTemplate();
      break;
    case TemplateType.BRAND:
      template = new BrandTemplate();
      break;
    case TemplateType.FANCY:
      template = new FancyTemplate();
      break;
    case TemplateType.CORPORATE:
      template = new CorporateTemplate();
      break;
    case TemplateType.MINIMAL:
      template = new MinimalTemplate();
      break;
    default:
      template = new ModernTemplate();
  }

  return template.generate(invoice, options);
}

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';

export const LIBRARY_INFO = Object.freeze({
  name: '@facturx/templates',
  version: VERSION,
  description: 'Professional PDF templates for Factur-X',
  license: 'MIT',
  repository: 'https://github.com/facturx/facturx-ts',
  templates: [
    TemplateType.MODERN,
    TemplateType.FANCY,
    TemplateType.BRAND,
    TemplateType.CORPORATE,
    TemplateType.MINIMAL,
  ],
  templateDescriptions: {
    [TemplateType.MODERN]: 'Clean, professional design with blue color scheme',
    [TemplateType.FANCY]: 'Colorful template with pink and blue gradient design',
    [TemplateType.BRAND]: 'Professional corporate template with navy and orange colors',
    [TemplateType.CORPORATE]: 'Elegant corporate design with gray, blue and gold accents',
    [TemplateType.MINIMAL]: 'Ultra-clean minimalist design with monochrome palette',
  },
});
