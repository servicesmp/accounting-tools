"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIBRARY_INFO = exports.VERSION = exports.generatePDFFileID = exports.generatePDFA3XMP = exports.loadSRGBProfile = exports.loadChillaxFonts = exports.addAFRelationshipToFile = exports.applyPDFA3Compliance = exports.setupPDFA3Compliance = exports.extractXMLWithExternalTools = exports.validateWithExternalTools = exports.getDefaultExternalValidator = exports.findMustangproject = exports.findVeraPDF = exports.checkExternalValidators = exports.MustangprojectValidator = exports.VeraPDFValidator = exports.ExternalValidator = exports.validateQuick = exports.validateAfterGeneration = exports.validateBeforeGeneration = exports.getDefaultPipeline = exports.ValidationPipeline = exports.MinimalTemplate = exports.CorporateTemplate = exports.BrandTemplate = exports.FancyTemplate = exports.ModernTemplate = exports.TemplateRenderer = exports.getDocumentTitle = exports.DOCUMENT_TITLES = exports.LOCALIZED_STRINGS = exports.FANCY_THEME = exports.BRAND_THEME = exports.DEFAULT_THEME = exports.TemplateType = void 0;
exports.generateModernPDF = generateModernPDF;
exports.generateFancyPDF = generateFancyPDF;
exports.generateBrandPDF = generateBrandPDF;
exports.generateCorporatePDF = generateCorporatePDF;
exports.generateMinimalPDF = generateMinimalPDF;
exports.generatePDF = generatePDF;
// ============================================================================
// TYPES
// ============================================================================
var types_1 = require("./types");
Object.defineProperty(exports, "TemplateType", { enumerable: true, get: function () { return types_1.TemplateType; } });
Object.defineProperty(exports, "DEFAULT_THEME", { enumerable: true, get: function () { return types_1.DEFAULT_THEME; } });
Object.defineProperty(exports, "BRAND_THEME", { enumerable: true, get: function () { return types_1.BRAND_THEME; } });
Object.defineProperty(exports, "FANCY_THEME", { enumerable: true, get: function () { return types_1.FANCY_THEME; } });
Object.defineProperty(exports, "LOCALIZED_STRINGS", { enumerable: true, get: function () { return types_1.LOCALIZED_STRINGS; } });
var types_2 = require("./types");
Object.defineProperty(exports, "DOCUMENT_TITLES", { enumerable: true, get: function () { return types_2.DOCUMENT_TITLES; } });
Object.defineProperty(exports, "getDocumentTitle", { enumerable: true, get: function () { return types_2.getDocumentTitle; } });
// ============================================================================
// DOCUMENTS PAR BLOCS (facture, avoir, devis, bon de commande)
// ============================================================================
__exportStar(require("./document"), exports);
__exportStar(require("./document-pdf"), exports);
// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================
var TemplateRenderer_1 = require("./core/TemplateRenderer");
Object.defineProperty(exports, "TemplateRenderer", { enumerable: true, get: function () { return TemplateRenderer_1.TemplateRenderer; } });
var ModernTemplate_1 = require("./templates/ModernTemplate");
Object.defineProperty(exports, "ModernTemplate", { enumerable: true, get: function () { return ModernTemplate_1.ModernTemplate; } });
var FancyTemplate_1 = require("./templates/FancyTemplate");
Object.defineProperty(exports, "FancyTemplate", { enumerable: true, get: function () { return FancyTemplate_1.FancyTemplate; } });
var BrandTemplate_1 = require("./templates/BrandTemplate");
Object.defineProperty(exports, "BrandTemplate", { enumerable: true, get: function () { return BrandTemplate_1.BrandTemplate; } });
var CorporateTemplate_1 = require("./templates/CorporateTemplate");
Object.defineProperty(exports, "CorporateTemplate", { enumerable: true, get: function () { return CorporateTemplate_1.CorporateTemplate; } });
var MinimalTemplate_1 = require("./templates/MinimalTemplate");
Object.defineProperty(exports, "MinimalTemplate", { enumerable: true, get: function () { return MinimalTemplate_1.MinimalTemplate; } });
// ============================================================================
// VALIDATION
// ============================================================================
var ValidationPipeline_1 = require("./validation/ValidationPipeline");
Object.defineProperty(exports, "ValidationPipeline", { enumerable: true, get: function () { return ValidationPipeline_1.ValidationPipeline; } });
Object.defineProperty(exports, "getDefaultPipeline", { enumerable: true, get: function () { return ValidationPipeline_1.getDefaultPipeline; } });
Object.defineProperty(exports, "validateBeforeGeneration", { enumerable: true, get: function () { return ValidationPipeline_1.validateBeforeGeneration; } });
Object.defineProperty(exports, "validateAfterGeneration", { enumerable: true, get: function () { return ValidationPipeline_1.validateAfterGeneration; } });
Object.defineProperty(exports, "validateQuick", { enumerable: true, get: function () { return ValidationPipeline_1.validateQuick; } });
// External validation tools
var ExternalValidators_1 = require("./validation/ExternalValidators");
Object.defineProperty(exports, "ExternalValidator", { enumerable: true, get: function () { return ExternalValidators_1.ExternalValidator; } });
Object.defineProperty(exports, "VeraPDFValidator", { enumerable: true, get: function () { return ExternalValidators_1.VeraPDFValidator; } });
Object.defineProperty(exports, "MustangprojectValidator", { enumerable: true, get: function () { return ExternalValidators_1.MustangprojectValidator; } });
Object.defineProperty(exports, "checkExternalValidators", { enumerable: true, get: function () { return ExternalValidators_1.checkExternalValidators; } });
Object.defineProperty(exports, "findVeraPDF", { enumerable: true, get: function () { return ExternalValidators_1.findVeraPDF; } });
Object.defineProperty(exports, "findMustangproject", { enumerable: true, get: function () { return ExternalValidators_1.findMustangproject; } });
Object.defineProperty(exports, "getDefaultExternalValidator", { enumerable: true, get: function () { return ExternalValidators_1.getDefaultExternalValidator; } });
Object.defineProperty(exports, "validateWithExternalTools", { enumerable: true, get: function () { return ExternalValidators_1.validateWithExternalTools; } });
Object.defineProperty(exports, "extractXMLWithExternalTools", { enumerable: true, get: function () { return ExternalValidators_1.extractXMLWithExternalTools; } });
// ============================================================================
// PDF/A-3 COMPLIANCE UTILITIES
// ============================================================================
var PDFA3Compliance_1 = require("./utils/PDFA3Compliance");
Object.defineProperty(exports, "setupPDFA3Compliance", { enumerable: true, get: function () { return PDFA3Compliance_1.setupPDFA3Compliance; } });
Object.defineProperty(exports, "applyPDFA3Compliance", { enumerable: true, get: function () { return PDFA3Compliance_1.applyPDFA3Compliance; } });
Object.defineProperty(exports, "addAFRelationshipToFile", { enumerable: true, get: function () { return PDFA3Compliance_1.addAFRelationshipToFile; } });
Object.defineProperty(exports, "loadChillaxFonts", { enumerable: true, get: function () { return PDFA3Compliance_1.loadChillaxFonts; } });
Object.defineProperty(exports, "loadSRGBProfile", { enumerable: true, get: function () { return PDFA3Compliance_1.loadSRGBProfile; } });
Object.defineProperty(exports, "generatePDFA3XMP", { enumerable: true, get: function () { return PDFA3Compliance_1.generatePDFA3XMP; } });
Object.defineProperty(exports, "generatePDFFileID", { enumerable: true, get: function () { return PDFA3Compliance_1.generatePDFFileID; } });
const ModernTemplate_2 = require("./templates/ModernTemplate");
const FancyTemplate_2 = require("./templates/FancyTemplate");
const BrandTemplate_2 = require("./templates/BrandTemplate");
const CorporateTemplate_2 = require("./templates/CorporateTemplate");
const MinimalTemplate_2 = require("./templates/MinimalTemplate");
const types_3 = require("./types");
/**
 * Generate PDF with modern template - Convenience function
 */
async function generateModernPDF(invoice, options = {}) {
    const template = new ModernTemplate_2.ModernTemplate();
    return template.generate(invoice, options);
}
/**
 * Generate PDF with fancy template - Convenience function
 */
async function generateFancyPDF(invoice, options = {}) {
    const template = new FancyTemplate_2.FancyTemplate();
    return template.generate(invoice, options);
}
/**
 * Generate PDF with brand template - Convenience function
 */
async function generateBrandPDF(invoice, options = {}) {
    const template = new BrandTemplate_2.BrandTemplate();
    return template.generate(invoice, options);
}
/**
 * Generate PDF with corporate template - Convenience function
 */
async function generateCorporatePDF(invoice, options = {}) {
    const template = new CorporateTemplate_2.CorporateTemplate();
    return template.generate(invoice, options);
}
/**
 * Generate PDF with minimal template - Convenience function
 */
async function generateMinimalPDF(invoice, options = {}) {
    const template = new MinimalTemplate_2.MinimalTemplate();
    return template.generate(invoice, options);
}
/**
 * Generate PDF with specified template type
 */
async function generatePDF(invoice, templateType = types_3.TemplateType.MODERN, options = {}) {
    let template;
    switch (templateType) {
        case types_3.TemplateType.MODERN:
            template = new ModernTemplate_2.ModernTemplate();
            break;
        case types_3.TemplateType.BRAND:
            template = new BrandTemplate_2.BrandTemplate();
            break;
        case types_3.TemplateType.FANCY:
            template = new FancyTemplate_2.FancyTemplate();
            break;
        case types_3.TemplateType.CORPORATE:
            template = new CorporateTemplate_2.CorporateTemplate();
            break;
        case types_3.TemplateType.MINIMAL:
            template = new MinimalTemplate_2.MinimalTemplate();
            break;
        default:
            template = new ModernTemplate_2.ModernTemplate();
    }
    return template.generate(invoice, options);
}
// ============================================================================
// VERSION INFO
// ============================================================================
exports.VERSION = '1.0.0';
exports.LIBRARY_INFO = Object.freeze({
    name: '@facturx/templates',
    version: exports.VERSION,
    description: 'Professional PDF templates for Factur-X',
    license: 'MIT',
    repository: 'https://github.com/facturx/facturx-ts',
    templates: [
        types_3.TemplateType.MODERN,
        types_3.TemplateType.FANCY,
        types_3.TemplateType.BRAND,
        types_3.TemplateType.CORPORATE,
        types_3.TemplateType.MINIMAL,
    ],
    templateDescriptions: {
        [types_3.TemplateType.MODERN]: 'Clean, professional design with blue color scheme',
        [types_3.TemplateType.FANCY]: 'Colorful template with pink and blue gradient design',
        [types_3.TemplateType.BRAND]: 'Professional corporate template with navy and orange colors',
        [types_3.TemplateType.CORPORATE]: 'Elegant corporate design with gray, blue and gold accents',
        [types_3.TemplateType.MINIMAL]: 'Ultra-clean minimalist design with monochrome palette',
    },
});
//# sourceMappingURL=index.js.map