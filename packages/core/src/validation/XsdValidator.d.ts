import { FacturxProfile } from '../types';
export interface XsdValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<XsdValidationError>;
    readonly warnings: ReadonlyArray<string>;
    readonly validatedAt: Date;
    readonly profile: FacturxProfile;
    readonly cached: boolean;
}
export interface XsdValidationError {
    readonly line: number;
    readonly column: number;
    readonly message: string;
    readonly code: string;
    readonly severity: 'error' | 'warning';
}
export interface ValidatorOptions {
    readonly cacheSize?: number;
    readonly enableCache?: boolean;
    readonly strictMode?: boolean;
    readonly validateExtensions?: boolean;
}
export declare class XsdValidator {
    private cache;
    private readonly options;
    constructor(options?: ValidatorOptions);
    validate(xml: string, profile: FacturxProfile): XsdValidationResult;
    validateAsync(xml: string, profile: FacturxProfile): Promise<XsdValidationResult>;
    validateBatch(documents: Array<{
        xml: string;
        profile: FacturxProfile;
    }>): XsdValidationResult[];
    clearCache(): void;
    getCacheStats(): {
        size: number;
        capacity: number;
        hitRate: number;
    };
    private performValidation;
    private validateRequiredElements;
    private validateDataTypes;
    private validateBusinessRules;
    private hasElement;
    private getElementValue;
    private getRequiredElementPaths;
    private generateCacheKey;
}
export declare function getDefaultValidator(): XsdValidator;
export declare function validateXml(xml: string, profile: FacturxProfile): XsdValidationResult;
export declare function validateXmlAsync(xml: string, profile: FacturxProfile): Promise<XsdValidationResult>;
//# sourceMappingURL=XsdValidator.d.ts.map