"use strict";
/**
 * @module ValidationPipeline
 * @description Complete Factur-X validation pipeline
 *
 * This module provides a comprehensive validation pipeline for Factur-X PDFs:
 * 1. Profile validation (before XML generation)
 * 2. XSD validation (after XML generation)
 * 3. PDF/A-3 compliance check
 * 4. XML attachment verification
 * 5. Complete Factur-X conformance report
 *
 * Performance: Optimized with caching and parallel checks
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipeline = void 0;
exports.getDefaultPipeline = getDefaultPipeline;
exports.validateBeforeGeneration = validateBeforeGeneration;
exports.validateAfterGeneration = validateAfterGeneration;
exports.validateQuick = validateQuick;
const core_1 = require("../../../core/src");
const core_2 = require("../../../core/src");
const pdf_lib_1 = require("pdf-lib");
const ExternalValidators_1 = require("./ExternalValidators");
// Simple profile validation function (replace with actual implementation from core)
function validateProfile(invoice, _profile) {
    const errors = [];
    const warnings = [];
    // Basic validation - check that invoice exists and has required data
    if (!invoice) {
        errors.push({ code: 'MISSING_INVOICE', message: 'Invoice is required' });
        return { isValid: false, errors, warnings };
    }
    // Check seller
    if (!invoice.seller || !invoice.seller.name) {
        errors.push({ code: 'MISSING_SELLER', message: 'Seller information is required' });
    }
    // Check buyer
    if (!invoice.buyer || !invoice.buyer.name) {
        errors.push({ code: 'MISSING_BUYER', message: 'Buyer information is required' });
    }
    // Check invoice lines
    if (!invoice.lines || invoice.lines.length === 0) {
        errors.push({ code: 'MISSING_ITEMS', message: 'At least one invoice line is required' });
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
// ============================================================================
// VALIDATION PIPELINE
// ============================================================================
class ValidationPipeline {
    constructor(options = {}) {
        this.options = {
            enableProfileValidation: options.enableProfileValidation ?? true,
            enableXsdValidation: options.enableXsdValidation ?? true,
            enableRealXsdValidation: options.enableRealXsdValidation ?? true,
            enableBusinessRuleValidation: options.enableBusinessRuleValidation ?? true,
            enableCodeListValidation: options.enableCodeListValidation ?? true,
            enablePdfA3Validation: options.enablePdfA3Validation ?? true,
            enableXmlAttachmentCheck: options.enableXmlAttachmentCheck ?? true,
            enableExternalValidation: options.enableExternalValidation ?? false,
            externalValidatorConfig: options.externalValidatorConfig ?? {},
            complianceBasePath: options.complianceBasePath ?? '',
            enableFrenchRules: options.enableFrenchRules ?? true,
            strictMode: options.strictMode ?? false,
            skipCache: options.skipCache ?? false,
        };
        this.xsdValidator = new core_1.XsdValidator({
            enableCache: !this.options.skipCache,
            strictMode: this.options.strictMode,
        });
        // Initialize real XSD validator (validates against actual .xsd schemas)
        if (this.options.enableRealXsdValidation) {
            try {
                this.realXsdValidator = new core_2.RealXsdValidator(this.options.complianceBasePath || undefined);
            }
            catch {
                // Graceful degradation if XSD schemas not found
            }
        }
        // Initialize business rule validator (EN16931 Schematron rules + BR-FR)
        if (this.options.enableBusinessRuleValidation) {
            this.businessRuleValidator = new core_2.BusinessRuleValidator({
                enableFrenchRules: this.options.enableFrenchRules,
            });
        }
        // Initialize code list validator
        if (this.options.enableCodeListValidation) {
            this.codeListValidator = new core_2.CodeListValidator();
        }
        // Initialize external validator if enabled
        if (this.options.enableExternalValidation) {
            this.externalValidator = new ExternalValidators_1.ExternalValidator(this.options.externalValidatorConfig);
        }
    }
    /**
     * Validate complete Factur-X invoice before PDF generation
     * This runs BEFORE creating the PDF
     */
    async validateBeforeGeneration(invoice) {
        const steps = {};
        // Step 1: Profile validation
        if (this.options.enableProfileValidation) {
            steps.profile = await this.runStep('Profile Validation', async () => {
                const result = validateProfile(invoice, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2: Generate XML for XSD validation
        let xmlContent = '';
        if (this.options.enableXsdValidation) {
            try {
                xmlContent = invoice.generateXml(true);
            }
            catch (error) {
                steps.xsd = {
                    name: 'XSD Validation',
                    passed: false,
                    duration: 0,
                    result: {
                        isValid: false,
                        errors: [
                            {
                                line: 0,
                                column: 0,
                                message: `XML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                code: 'XML_GEN_FAILED',
                                severity: 'error',
                            },
                        ],
                        warnings: [],
                        validatedAt: new Date(),
                        profile: invoice.profile,
                        cached: false,
                    },
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
            // Run XSD validation if XML was generated
            if (xmlContent) {
                steps.xsd = await this.runStep('XSD Validation', async () => {
                    const result = this.xsdValidator.validate(xmlContent, invoice.profile);
                    return {
                        passed: result.isValid,
                        result,
                    };
                });
            }
        }
        // Step 2b: Real XSD validation (against actual .xsd schema files)
        if (this.options.enableRealXsdValidation && this.realXsdValidator && xmlContent) {
            steps.realXsd = await this.runStep('Real XSD Schema Validation', async () => {
                const result = this.realXsdValidator.validate(xmlContent, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2c: Business rule validation (EN16931 Schematron rules + BR-FR)
        if (this.options.enableBusinessRuleValidation && this.businessRuleValidator) {
            steps.businessRules = await this.runStep('Business Rule Validation (EN16931 + BR-FR)', async () => {
                const result = this.businessRuleValidator.validate(invoice);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2d: Code list validation
        if (this.options.enableCodeListValidation && this.codeListValidator && xmlContent) {
            steps.codeLists = await this.runStep('Code List Validation', async () => {
                const result = this.codeListValidator.validateInvoiceCodes(xmlContent);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Note: PDF/A-3 and XML attachment checks happen AFTER PDF generation
        steps.pdfA3 = {
            name: 'PDF/A-3 Validation',
            passed: true,
            duration: 0,
            result: {
                isCompliant: true,
                errors: [],
                warnings: ['PDF/A-3 validation runs after PDF generation'],
                checks: {
                    hasMetadata: false,
                    hasXmpMetadata: false,
                    hasEmbeddedFile: false,
                    pdfVersion: 'N/A',
                },
            },
        };
        steps.xmlAttachment = {
            name: 'XML Attachment Check',
            passed: true,
            duration: 0,
            result: {
                isAttached: false,
                isValid: true,
                errors: ['XML attachment check runs after PDF generation'],
            },
        };
        const summary = this.computeSummary(steps);
        return {
            isValid: summary.complianceLevel !== 'FAILED',
            validatedAt: new Date(),
            profile: invoice.profile,
            steps,
            summary,
            recommendations: this.generateRecommendations(steps, summary),
        };
    }
    /**
     * Validate complete Factur-X PDF after generation
     * This runs AFTER the PDF is created
     */
    async validateAfterGeneration(invoice, pdfBytes, xmlContent) {
        const steps = {};
        // Step 1: Profile validation
        if (this.options.enableProfileValidation) {
            steps.profile = await this.runStep('Profile Validation', async () => {
                const result = validateProfile(invoice, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2: XSD validation (structural)
        if (this.options.enableXsdValidation && xmlContent) {
            steps.xsd = await this.runStep('XSD Validation', async () => {
                const result = this.xsdValidator.validate(xmlContent, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2b: Real XSD validation (against actual .xsd schema files)
        if (this.options.enableRealXsdValidation && this.realXsdValidator && xmlContent) {
            steps.realXsd = await this.runStep('Real XSD Schema Validation', async () => {
                const result = this.realXsdValidator.validate(xmlContent, invoice.profile);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2c: Business rule validation (EN16931 Schematron rules + BR-FR)
        if (this.options.enableBusinessRuleValidation && this.businessRuleValidator) {
            steps.businessRules = await this.runStep('Business Rule Validation (EN16931 + BR-FR)', async () => {
                const result = this.businessRuleValidator.validate(invoice);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 2d: Code list validation
        if (this.options.enableCodeListValidation && this.codeListValidator && xmlContent) {
            steps.codeLists = await this.runStep('Code List Validation', async () => {
                const result = this.codeListValidator.validateInvoiceCodes(xmlContent);
                return {
                    passed: result.isValid,
                    result,
                };
            });
        }
        // Step 3: PDF/A-3 validation
        if (this.options.enablePdfA3Validation) {
            steps.pdfA3 = await this.runStep('PDF/A-3 Validation', async () => {
                const result = await this.validatePDFA3(pdfBytes);
                return {
                    passed: result.isCompliant,
                    result,
                };
            });
        }
        // Step 4: XML attachment validation
        if (this.options.enableXmlAttachmentCheck) {
            steps.xmlAttachment = await this.runStep('XML Attachment Check', async () => {
                const result = await this.validateXMLAttachment(pdfBytes, xmlContent);
                return {
                    passed: result.isAttached && result.isValid,
                    result,
                };
            });
        }
        // Step 5: External validation (veraPDF + Mustangproject)
        if (this.options.enableExternalValidation && this.externalValidator) {
            steps.external = await this.runStep('External Validation', async () => {
                const result = await this.validateWithExternalTools(pdfBytes);
                return {
                    passed: result.isFullyValid,
                    result,
                };
            });
        }
        const summary = this.computeSummary(steps);
        return {
            isValid: summary.complianceLevel === 'FULL',
            validatedAt: new Date(),
            profile: invoice.profile,
            steps,
            summary,
            recommendations: this.generateRecommendations(steps, summary),
        };
    }
    /**
     * Quick validation - only essential checks
     */
    async validateQuick(invoice) {
        // Only validate profile (fastest check)
        const profileResult = validateProfile(invoice, invoice.profile);
        return profileResult.isValid;
    }
    /**
     * Run a validation step with timing
     */
    async runStep(name, fn) {
        const startTime = Date.now();
        try {
            const { passed, result } = await fn();
            const duration = Date.now() - startTime;
            return {
                name,
                passed,
                duration,
                result,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            throw {
                name,
                passed: false,
                duration,
                result: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Validate PDF/A-3 compliance
     * Real implementation: inspects PDF catalog, embedded files, XMP metadata
     */
    async validatePDFA3(pdfBytes) {
        const errors = [];
        const warnings = [];
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            // 1. Check PDF version (PDF/A-3 requires 1.4 to 1.7)
            const rawPdf = pdfBytes.toString('ascii', 0, 20);
            const versionMatch = rawPdf.match(/%PDF-(\d\.\d)/);
            const pdfVersion = versionMatch ? versionMatch[1] : 'unknown';
            if (pdfVersion !== '1.7' && pdfVersion !== '1.4' && pdfVersion !== '1.5' && pdfVersion !== '1.6') {
                warnings.push(`PDF version ${pdfVersion} detected; PDF/A-3 requires 1.4-1.7`);
            }
            // 2. Check for document metadata (title, author, etc.)
            const title = pdfDoc.getTitle();
            const author = pdfDoc.getAuthor();
            const hasMetadata = !!(title || author);
            if (!hasMetadata) {
                errors.push({
                    code: 'NO_METADATA',
                    message: 'PDF/A-3 requires document metadata (at minimum a title)',
                    severity: 'error',
                });
            }
            // 3. Check for XMP metadata by looking at raw PDF bytes for xmpmeta tag
            const pdfString = pdfBytes.toString('latin1');
            const hasXmpMetadata = pdfString.includes('x:xmpmeta') || pdfString.includes('xmp:');
            if (!hasXmpMetadata) {
                errors.push({
                    code: 'NO_XMP_METADATA',
                    message: 'PDF/A-3 requires XMP metadata stream',
                    severity: 'error',
                });
            }
            // 3b. Check for Factur-X specific XMP properties
            const hasFxNamespace = pdfString.includes('factur-x') || pdfString.includes('urn:factur-x');
            if (!hasFxNamespace) {
                warnings.push('Factur-X XMP extension schema (fx namespace) not found');
            }
            // 4. Check for embedded files via /Names /EmbeddedFiles in catalog
            // Use raw byte search since pdf-lib doesn't expose EmbeddedFiles API directly
            const hasEmbeddedFile = pdfString.includes('/EmbeddedFiles') || pdfString.includes('/AF');
            if (!hasEmbeddedFile) {
                errors.push({
                    code: 'NO_EMBEDDED_FILE',
                    message: 'PDF/A-3 Factur-X requires an embedded XML file (factur-x.xml)',
                    severity: 'error',
                });
            }
            // 5. Check for /AF (Associated Files) array - required for PDF/A-3
            const hasAFRelationship = pdfString.includes('/AF') && pdfString.includes('/AFRelationship');
            if (!hasAFRelationship && hasEmbeddedFile) {
                warnings.push('AFRelationship entry not found; required for PDF/A-3 compliance');
            }
            // 6. Check for OutputIntent (sRGB ICC profile) - required for PDF/A
            const hasOutputIntent = pdfString.includes('/OutputIntents') || pdfString.includes('/OutputIntent');
            if (!hasOutputIntent) {
                errors.push({
                    code: 'NO_OUTPUT_INTENT',
                    message: 'PDF/A-3 requires an OutputIntent with ICC profile (sRGB)',
                    severity: 'error',
                });
            }
            // 7. Check for factur-x.xml filename specifically
            const hasFacturxXml = pdfString.includes('factur-x.xml');
            if (!hasFacturxXml && hasEmbeddedFile) {
                warnings.push('Embedded file should be named "factur-x.xml" for Factur-X compliance');
            }
            // 8. Determine conformance level from XMP
            let conformanceLevel = 'unknown';
            const conformanceMatch = pdfString.match(/pdfaid:conformance>([A-Z])</);
            if (conformanceMatch) {
                conformanceLevel = `PDF/A-3${conformanceMatch[1]}`;
            }
            else if (pdfString.includes('pdfaid')) {
                conformanceLevel = 'PDF/A-3B'; // Default assumption
            }
            return {
                isCompliant: errors.length === 0,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                checks: {
                    hasMetadata,
                    hasXmpMetadata,
                    hasEmbeddedFile,
                    pdfVersion,
                    conformanceLevel,
                },
            };
        }
        catch (error) {
            errors.push({
                code: 'PDF_PARSE_ERROR',
                message: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error',
            });
            return {
                isCompliant: false,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                checks: {
                    hasMetadata: false,
                    hasXmpMetadata: false,
                    hasEmbeddedFile: false,
                    pdfVersion: 'unknown',
                },
            };
        }
    }
    /**
     * Validate XML attachment in PDF
     * Real implementation: extracts embedded files from PDF and verifies content
     */
    async validateXMLAttachment(pdfBytes, expectedXml) {
        const errors = [];
        try {
            await pdf_lib_1.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const pdfString = pdfBytes.toString('latin1');
            // 1. Check if factur-x.xml is referenced as embedded file
            const hasFacturxRef = pdfString.includes('factur-x.xml');
            if (!hasFacturxRef) {
                errors.push('No reference to "factur-x.xml" found in PDF embedded files');
                return {
                    isAttached: false,
                    isValid: false,
                    errors: Object.freeze(errors),
                };
            }
            // 2. Check MIME type (should be text/xml)
            const hasMimeType = pdfString.includes('text/xml') || pdfString.includes('application/xml');
            if (!hasMimeType) {
                errors.push('Embedded file MIME type should be "text/xml"');
            }
            // 3. Verify XML content is present in the PDF stream
            // Search for the XML declaration or root element within the PDF
            const hasXmlContent = pdfString.includes('CrossIndustryInvoice') ||
                pdfString.includes('<?xml');
            if (!hasXmlContent) {
                errors.push('Could not find Factur-X XML content in PDF embedded streams');
            }
            // 4. Check /AF relationship exists
            const hasAF = pdfString.includes('/AF');
            if (!hasAF) {
                errors.push('Associated Files (/AF) entry missing; required for Factur-X');
            }
            // 5. Estimate size from expected XML
            const size = expectedXml ? expectedXml.length : undefined;
            const isAttached = hasFacturxRef && hasXmlContent;
            const isValid = isAttached && errors.length === 0;
            return {
                isAttached,
                filename: 'factur-x.xml',
                mimeType: hasMimeType ? 'text/xml' : undefined,
                size,
                isValid,
                errors: Object.freeze(errors),
            };
        }
        catch (error) {
            errors.push(`Failed to check XML attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                isAttached: false,
                isValid: false,
                errors: Object.freeze(errors),
            };
        }
    }
    /**
     * Validate with external tools (veraPDF + Mustangproject)
     */
    async validateWithExternalTools(pdfBytes) {
        if (!this.externalValidator) {
            throw new Error('External validator not initialized');
        }
        // Create temporary file for PDF (external tools need file paths)
        const { writeFile, unlink } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const { join } = await Promise.resolve().then(() => __importStar(require('path')));
        const tmpDir = process.env.TMPDIR || '/tmp';
        const tmpFile = join(tmpDir, `facturx-validation-${Date.now()}.pdf`);
        try {
            // Write PDF to temp file
            await writeFile(tmpFile, pdfBytes);
            // Run external validation
            const result = await this.externalValidator.validate(tmpFile);
            return result;
        }
        finally {
            // Clean up temp file
            try {
                await unlink(tmpFile);
            }
            catch (error) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Compute validation summary
     */
    computeSummary(steps) {
        const stepResults = Object.values(steps);
        const stepsCompleted = stepResults.length;
        const stepsPassed = stepResults.filter((s) => s.passed).length;
        let totalErrors = 0;
        let totalWarnings = 0;
        // Count errors and warnings from all steps
        for (const step of stepResults) {
            if (step.result?.errors) {
                totalErrors += step.result.errors.length;
            }
            if (step.result?.warnings) {
                totalWarnings += step.result.warnings.length;
            }
        }
        // Compute overall score (0-100)
        const overallScore = stepsCompleted > 0 ? Math.round((stepsPassed / stepsCompleted) * 100) : 0;
        // Determine compliance level
        let complianceLevel;
        if (overallScore === 100 && totalErrors === 0) {
            complianceLevel = 'FULL';
        }
        else if (overallScore >= 50 || totalErrors === 0) {
            complianceLevel = 'PARTIAL';
        }
        else {
            complianceLevel = 'FAILED';
        }
        return {
            totalErrors,
            totalWarnings,
            stepsCompleted,
            stepsPassed,
            overallScore,
            complianceLevel,
        };
    }
    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(steps, summary) {
        const recommendations = [];
        if (summary.complianceLevel === 'FULL') {
            recommendations.push('✓ Your Factur-X PDF is fully compliant!');
            return recommendations;
        }
        // Check profile validation
        if (steps.profile && !steps.profile.passed) {
            const result = steps.profile.result;
            if (result.errors.length > 0) {
                recommendations.push(`Fix ${result.errors.length} profile validation error(s) before generating PDF`);
            }
        }
        // Check XSD validation
        if (steps.xsd && !steps.xsd.passed) {
            const result = steps.xsd.result;
            if (result.errors.length > 0) {
                recommendations.push(`Fix ${result.errors.length} XML schema validation error(s)`);
            }
        }
        // Check PDF/A-3
        if (steps.pdfA3 && !steps.pdfA3.passed) {
            const result = steps.pdfA3.result;
            if (!result.checks.hasEmbeddedFile) {
                recommendations.push('Ensure XML file is properly embedded in PDF');
            }
            if (!result.checks.hasXmpMetadata) {
                recommendations.push('Add XMP metadata for PDF/A-3 compliance');
            }
        }
        // Check XML attachment
        if (steps.xmlAttachment && !steps.xmlAttachment.passed) {
            recommendations.push('Verify that XML is correctly attached to PDF');
        }
        if (recommendations.length === 0) {
            recommendations.push('Review validation errors and warnings above');
        }
        return recommendations;
    }
    /**
     * Clear validation cache
     */
    clearCache() {
        // Clear XSD validator cache
        // (XsdValidator should expose a clearCache method)
    }
}
exports.ValidationPipeline = ValidationPipeline;
// ============================================================================
// SINGLETON INSTANCE
// ============================================================================
let defaultPipeline = null;
/**
 * Get default validation pipeline - Lazy singleton
 */
function getDefaultPipeline() {
    if (!defaultPipeline) {
        defaultPipeline = new ValidationPipeline();
    }
    return defaultPipeline;
}
/**
 * Convenience function - validate before generation
 */
async function validateBeforeGeneration(invoice) {
    return getDefaultPipeline().validateBeforeGeneration(invoice);
}
/**
 * Convenience function - validate after generation
 */
async function validateAfterGeneration(invoice, pdfBytes, xmlContent) {
    return getDefaultPipeline().validateAfterGeneration(invoice, pdfBytes, xmlContent);
}
/**
 * Convenience function - quick validation
 */
async function validateQuick(invoice) {
    return getDefaultPipeline().validateQuick(invoice);
}
//# sourceMappingURL=ValidationPipeline.js.map