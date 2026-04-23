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
export interface ExternalValidatorConfig {
    readonly veraPDFPath?: string;
    readonly mustangprojectPath?: string;
    readonly tempDir?: string;
    readonly timeout?: number;
    readonly saveReports?: boolean;
    readonly reportsDir?: string;
}
export declare function findVeraPDF(): Promise<string | null>;
export declare function findMustangproject(): Promise<string | null>;
export declare function checkExternalValidators(): Promise<{
    veraPDF: boolean;
    mustangproject: boolean;
    veraPDFPath?: string;
    mustangprojectPath?: string;
}>;
export declare class VeraPDFValidator {
    private readonly veraPDFPath;
    private readonly timeout;
    private readonly saveReports;
    private readonly reportsDir?;
    constructor(config?: ExternalValidatorConfig);
    validate(pdfPath: string): Promise<VeraPDFResult>;
    private parseVeraPDFOutput;
    isAvailable(): Promise<boolean>;
}
export declare class MustangprojectValidator {
    private readonly jarPath;
    private readonly javaPath;
    private readonly timeout;
    private readonly saveReports;
    private readonly reportsDir?;
    constructor(config?: ExternalValidatorConfig);
    validate(pdfPath: string): Promise<MustangprojectResult>;
    extractXML(pdfPath: string, outputPath?: string): Promise<string>;
    private parseMustangOutput;
    isAvailable(): Promise<boolean>;
}
export declare class ExternalValidator {
    private readonly veraPDF;
    private readonly mustang;
    constructor(config?: ExternalValidatorConfig);
    validate(pdfPath: string): Promise<ExternalValidationResult>;
    private buildSummary;
    getAvailableValidators(): Promise<{
        veraPDF: boolean;
        mustangproject: boolean;
    }>;
    extractXML(pdfPath: string, outputPath?: string): Promise<string | null>;
}
export declare function getDefaultExternalValidator(config?: ExternalValidatorConfig): ExternalValidator;
export declare function validateWithExternalTools(pdfPath: string, config?: ExternalValidatorConfig): Promise<ExternalValidationResult>;
export declare function extractXMLWithExternalTools(pdfPath: string, outputPath?: string, config?: ExternalValidatorConfig): Promise<string | null>;
//# sourceMappingURL=ExternalValidators.d.ts.map