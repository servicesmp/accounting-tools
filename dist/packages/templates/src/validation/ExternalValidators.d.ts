/**
 * External validation tools integration for Factur-X documents
 *
 * This module provides TypeScript wrappers for external validation tools:
 * - veraPDF: Industry standard PDF/A-3 validator
 * - Mustangproject: Factur-X/ZUGFeRD validator
 *
 * @module ExternalValidators
 */
/**
 * Result of veraPDF validation
 */
export interface VeraPDFResult {
    readonly isValid: boolean;
    readonly isCompliant: boolean;
    readonly profile: string;
    readonly errors: ReadonlyArray<VeraPDFError>;
    readonly warnings: ReadonlyArray<VeraPDFWarning>;
    readonly metadata: VeraPDFMetadata;
    readonly rawReport?: string;
}
export interface VeraPDFError {
    readonly clause: string;
    readonly specification: string;
    readonly level: 'Error' | 'Warning';
    readonly message: string;
    readonly location?: string;
}
export interface VeraPDFWarning {
    readonly message: string;
    readonly context?: string;
}
export interface VeraPDFMetadata {
    readonly pdfVersion: string;
    readonly fileSize: number;
    readonly pageCount: number;
    readonly hasAttachments: boolean;
    readonly creationDate?: string;
    readonly modificationDate?: string;
}
/**
 * Result of Mustangproject validation
 */
export interface MustangprojectResult {
    readonly isValid: boolean;
    readonly profile: string;
    readonly errors: ReadonlyArray<MustangError>;
    readonly warnings: ReadonlyArray<MustangWarning>;
    readonly xmlExtracted: boolean;
    readonly xmlContent?: string;
    readonly rawReport?: string;
}
export interface MustangError {
    readonly code: string;
    readonly message: string;
    readonly severity: 'FATAL' | 'ERROR' | 'WARNING';
    readonly xpath?: string;
}
export interface MustangWarning {
    readonly message: string;
    readonly suggestion?: string;
}
/**
 * Combined external validation result
 */
export interface ExternalValidationResult {
    readonly timestamp: Date;
    readonly veraPDF?: VeraPDFResult;
    readonly mustangproject?: MustangprojectResult;
    readonly isFullyValid: boolean;
    readonly summary: ExternalValidationSummary;
}
export interface ExternalValidationSummary {
    readonly totalErrors: number;
    readonly totalWarnings: number;
    readonly pdfA3Compliant: boolean;
    readonly facturXCompliant: boolean;
    readonly recommendations: ReadonlyArray<string>;
}
/**
 * Configuration for external validators
 */
export interface ExternalValidatorConfig {
    readonly veraPDFPath?: string;
    readonly mustangprojectPath?: string;
    readonly tempDir?: string;
    readonly timeout?: number;
    readonly saveReports?: boolean;
    readonly reportsDir?: string;
}
/**
 * Check if veraPDF is installed and get its path
 */
export declare function findVeraPDF(): Promise<string | null>;
/**
 * Check if Mustangproject is installed and get its JAR path
 */
export declare function findMustangproject(): Promise<string | null>;
/**
 * Check which external validators are available
 */
export declare function checkExternalValidators(): Promise<{
    veraPDF: boolean;
    mustangproject: boolean;
    veraPDFPath?: string;
    mustangprojectPath?: string;
}>;
/**
 * Validate PDF/A-3 compliance using veraPDF
 */
export declare class VeraPDFValidator {
    private readonly veraPDFPath;
    private readonly timeout;
    private readonly saveReports;
    private readonly reportsDir?;
    constructor(config?: ExternalValidatorConfig);
    /**
     * Validate a PDF file for PDF/A-3 compliance
     */
    validate(pdfPath: string): Promise<VeraPDFResult>;
    /**
     * Parse veraPDF machine-readable output
     */
    private parseVeraPDFOutput;
    /**
     * Check if veraPDF is available
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Validate Factur-X compliance using Mustangproject
 */
export declare class MustangprojectValidator {
    private readonly jarPath;
    private readonly javaPath;
    private readonly timeout;
    private readonly saveReports;
    private readonly reportsDir?;
    constructor(config?: ExternalValidatorConfig);
    /**
     * Validate a Factur-X PDF
     */
    validate(pdfPath: string): Promise<MustangprojectResult>;
    /**
     * Extract XML from Factur-X PDF
     */
    extractXML(pdfPath: string, outputPath?: string): Promise<string>;
    /**
     * Parse Mustangproject output
     */
    private parseMustangOutput;
    /**
     * Check if Mustangproject is available
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Combined external validation using both veraPDF and Mustangproject
 */
export declare class ExternalValidator {
    private readonly veraPDF;
    private readonly mustang;
    constructor(config?: ExternalValidatorConfig);
    /**
     * Validate a Factur-X PDF with all available external tools
     */
    validate(pdfPath: string): Promise<ExternalValidationResult>;
    /**
     * Build validation summary
     */
    private buildSummary;
    /**
     * Check which validators are available
     */
    getAvailableValidators(): Promise<{
        veraPDF: boolean;
        mustangproject: boolean;
    }>;
    /**
     * Extract XML from Factur-X PDF
     */
    extractXML(pdfPath: string, outputPath?: string): Promise<string | null>;
}
export declare function getDefaultExternalValidator(config?: ExternalValidatorConfig): ExternalValidator;
/**
 * Quick validation with external tools
 */
export declare function validateWithExternalTools(pdfPath: string, config?: ExternalValidatorConfig): Promise<ExternalValidationResult>;
/**
 * Extract XML using external tools
 */
export declare function extractXMLWithExternalTools(pdfPath: string, outputPath?: string, config?: ExternalValidatorConfig): Promise<string | null>;
//# sourceMappingURL=ExternalValidators.d.ts.map