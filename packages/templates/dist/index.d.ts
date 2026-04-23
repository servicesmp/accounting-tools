export { TemplateType, TemplateTheme, TemplateOptions, TemplateContext, PDFGenerationResult, PDFAttachmentOptions, RenderContext, RenderedElement, LocalizedStrings, DEFAULT_THEME, BRAND_THEME, FANCY_THEME, LOCALIZED_STRINGS, } from './types';
export { TemplateRenderer } from './core/TemplateRenderer';
export { ModernTemplate } from './templates/ModernTemplate';
export { FancyTemplate } from './templates/FancyTemplate';
export { BrandTemplate } from './templates/BrandTemplate';
export { CorporateTemplate } from './templates/CorporateTemplate';
export { MinimalTemplate } from './templates/MinimalTemplate';
export { ValidationPipeline, ValidationPipelineResult, PDFA3ValidationResult, XMLAttachmentResult, ValidationSummary, ValidationOptions as ValidationPipelineOptions, getDefaultPipeline, validateBeforeGeneration, validateAfterGeneration, validateQuick, } from './validation/ValidationPipeline';
export { ExternalValidator, VeraPDFValidator, MustangprojectValidator, ExternalValidationResult, ExternalValidationSummary, VeraPDFResult, VeraPDFError, VeraPDFWarning, VeraPDFMetadata, MustangprojectResult, MustangError, MustangWarning, ExternalValidatorConfig, checkExternalValidators, findVeraPDF, findMustangproject, getDefaultExternalValidator, validateWithExternalTools, extractXMLWithExternalTools, } from './validation/ExternalValidators';
export { setupPDFA3Compliance, applyPDFA3Compliance, addAFRelationshipToFile, loadChillaxFonts, loadSRGBProfile, generatePDFA3XMP, generatePDFFileID, EmbeddedFonts, PDFA3MetadataOptions, PDFA3SetupOptions, } from './utils/PDFA3Compliance';
import { FacturXInvoice } from '@facturx/core';
import { TemplateOptions, PDFGenerationResult, TemplateType } from './types';
export declare function generateModernPDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generateFancyPDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generateBrandPDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generateCorporatePDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generateMinimalPDF(invoice: FacturXInvoice, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare function generatePDF(invoice: FacturXInvoice, templateType?: TemplateType, options?: Partial<TemplateOptions>): Promise<PDFGenerationResult>;
export declare const VERSION = "1.0.0";
export declare const LIBRARY_INFO: Readonly<{
    name: "@facturx/templates";
    version: "1.0.0";
    description: "Professional PDF templates for Factur-X";
    license: "MIT";
    repository: "https://github.com/facturx/facturx-ts";
    templates: TemplateType[];
    templateDescriptions: {
        modern: string;
        fancy: string;
        brand: string;
        corporate: string;
        minimal: string;
    };
}>;
//# sourceMappingURL=index.d.ts.map