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
import { FacturXInvoice, FacturxProfile } from '../../../core/src';
import { XsdValidationResult } from '../../../core/src';
import { RealXsdValidationResult, BusinessRuleValidationResult, CodeListValidationResult } from '../../../core/src';
import { ExternalValidationResult, ExternalValidatorConfig } from './ExternalValidators';
type ProfileValidationResult = {
    isValid: boolean;
    errors: Array<{
        code: string;
        message: string;
        field?: string;
    }>;
    warnings: Array<{
        message: string;
    }>;
};
export interface ValidationPipelineResult {
    readonly isValid: boolean;
    readonly validatedAt: Date;
    readonly profile: FacturxProfile;
    readonly steps: {
        readonly profile: ValidationStepResult<ProfileValidationResult>;
        readonly xsd: ValidationStepResult<XsdValidationResult>;
        readonly realXsd?: ValidationStepResult<RealXsdValidationResult>;
        readonly businessRules?: ValidationStepResult<BusinessRuleValidationResult>;
        readonly codeLists?: ValidationStepResult<CodeListValidationResult>;
        readonly pdfA3: ValidationStepResult<PDFA3ValidationResult>;
        readonly xmlAttachment: ValidationStepResult<XMLAttachmentResult>;
        readonly external?: ValidationStepResult<ExternalValidationResult>;
    };
    readonly summary: ValidationSummary;
    readonly recommendations: ReadonlyArray<string>;
}
export interface ValidationStepResult<T> {
    readonly name: string;
    readonly passed: boolean;
    readonly duration: number;
    readonly result: T;
    readonly error?: string;
}
export interface PDFA3ValidationResult {
    readonly isCompliant: boolean;
    readonly errors: ReadonlyArray<PDFA3Error>;
    readonly warnings: ReadonlyArray<string>;
    readonly checks: {
        readonly hasMetadata: boolean;
        readonly hasXmpMetadata: boolean;
        readonly hasEmbeddedFile: boolean;
        readonly pdfVersion: string;
        readonly conformanceLevel?: string;
    };
}
export interface XMLAttachmentResult {
    readonly isAttached: boolean;
    readonly filename?: string;
    readonly mimeType?: string;
    readonly size?: number;
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<string>;
}
export interface PDFA3Error {
    readonly code: string;
    readonly message: string;
    readonly severity: 'error' | 'warning';
    readonly location?: string;
}
export interface ValidationSummary {
    readonly totalErrors: number;
    readonly totalWarnings: number;
    readonly stepsCompleted: number;
    readonly stepsPassed: number;
    readonly overallScore: number;
    readonly complianceLevel: 'FULL' | 'PARTIAL' | 'FAILED';
}
export interface ValidationOptions {
    readonly enableProfileValidation?: boolean;
    readonly enableXsdValidation?: boolean;
    readonly enableRealXsdValidation?: boolean;
    readonly enableBusinessRuleValidation?: boolean;
    readonly enableCodeListValidation?: boolean;
    readonly enablePdfA3Validation?: boolean;
    readonly enableXmlAttachmentCheck?: boolean;
    readonly enableExternalValidation?: boolean;
    readonly externalValidatorConfig?: ExternalValidatorConfig;
    readonly complianceBasePath?: string;
    readonly enableFrenchRules?: boolean;
    readonly strictMode?: boolean;
    readonly skipCache?: boolean;
}
export declare class ValidationPipeline {
    private readonly xsdValidator;
    private readonly realXsdValidator?;
    private readonly businessRuleValidator?;
    private readonly codeListValidator?;
    private readonly externalValidator?;
    private readonly options;
    constructor(options?: ValidationOptions);
    /**
     * Validate complete Factur-X invoice before PDF generation
     * This runs BEFORE creating the PDF
     */
    validateBeforeGeneration(invoice: FacturXInvoice): Promise<ValidationPipelineResult>;
    /**
     * Validate complete Factur-X PDF after generation
     * This runs AFTER the PDF is created
     */
    validateAfterGeneration(invoice: FacturXInvoice, pdfBytes: Buffer, xmlContent: string): Promise<ValidationPipelineResult>;
    /**
     * Quick validation - only essential checks
     */
    validateQuick(invoice: FacturXInvoice): Promise<boolean>;
    /**
     * Run a validation step with timing
     */
    private runStep;
    /**
     * Validate PDF/A-3 compliance
     * Real implementation: inspects PDF catalog, embedded files, XMP metadata
     */
    private validatePDFA3;
    /**
     * Validate XML attachment in PDF
     * Real implementation: extracts embedded files from PDF and verifies content
     */
    private validateXMLAttachment;
    /**
     * Validate with external tools (veraPDF + Mustangproject)
     */
    private validateWithExternalTools;
    /**
     * Compute validation summary
     */
    private computeSummary;
    /**
     * Generate recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Clear validation cache
     */
    clearCache(): void;
}
/**
 * Get default validation pipeline - Lazy singleton
 */
export declare function getDefaultPipeline(): ValidationPipeline;
/**
 * Convenience function - validate before generation
 */
export declare function validateBeforeGeneration(invoice: FacturXInvoice): Promise<ValidationPipelineResult>;
/**
 * Convenience function - validate after generation
 */
export declare function validateAfterGeneration(invoice: FacturXInvoice, pdfBytes: Buffer, xmlContent: string): Promise<ValidationPipelineResult>;
/**
 * Convenience function - quick validation
 */
export declare function validateQuick(invoice: FacturXInvoice): Promise<boolean>;
export {};
//# sourceMappingURL=ValidationPipeline.d.ts.map