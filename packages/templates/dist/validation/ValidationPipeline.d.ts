import { FacturXInvoice, FacturxProfile } from '@facturx/core';
import { XsdValidationResult } from '@facturx/core';
import { RealXsdValidationResult, BusinessRuleValidationResult, CodeListValidationResult } from '@facturx/core';
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
    validateBeforeGeneration(invoice: FacturXInvoice): Promise<ValidationPipelineResult>;
    validateAfterGeneration(invoice: FacturXInvoice, pdfBytes: Buffer, xmlContent: string): Promise<ValidationPipelineResult>;
    validateQuick(invoice: FacturXInvoice): Promise<boolean>;
    private runStep;
    private validatePDFA3;
    private validateXMLAttachment;
    private validateWithExternalTools;
    private computeSummary;
    private generateRecommendations;
    clearCache(): void;
}
export declare function getDefaultPipeline(): ValidationPipeline;
export declare function validateBeforeGeneration(invoice: FacturXInvoice): Promise<ValidationPipelineResult>;
export declare function validateAfterGeneration(invoice: FacturXInvoice, pdfBytes: Buffer, xmlContent: string): Promise<ValidationPipelineResult>;
export declare function validateQuick(invoice: FacturXInvoice): Promise<boolean>;
export {};
//# sourceMappingURL=ValidationPipeline.d.ts.map