import { FacturxProfile } from '../types';
export interface RealXsdValidationError {
    readonly message: string;
    readonly line?: number;
    readonly column?: number;
}
export interface RealXsdValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<RealXsdValidationError>;
    readonly profile: string;
    readonly schemaPath: string;
    readonly durationMs: number;
    readonly engine: 'node-libxml' | 'libxmljs' | 'xmllint-cli' | 'none';
}
type Engine = 'node-libxml' | 'libxmljs' | 'xmllint-cli' | 'none';
export declare function resetEngineDetection(): void;
export declare class RealXsdValidator {
    private readonly complianceBasePath;
    private readonly cache;
    private readonly engine;
    private readonly enableCache;
    constructor(complianceBasePath?: string, options?: {
        cacheSize?: number;
        enableCache?: boolean;
    });
    getEngine(): Engine;
    getSchemaPath(profile: FacturxProfile): string;
    schemaExists(profile: FacturxProfile): boolean;
    getSchemaFiles(profile: FacturxProfile): string[];
    validate(xmlContent: string, profile: FacturxProfile): RealXsdValidationResult;
    validateAsync(xmlContent: string, profile: FacturxProfile): Promise<RealXsdValidationResult>;
    validateBatch(documents: Array<{
        xml: string;
        profile: FacturxProfile;
    }>): RealXsdValidationResult[];
    clearCache(): void;
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
    private buildCacheKey;
}
export declare function getDefaultRealXsdValidator(complianceBasePath?: string): RealXsdValidator;
export declare function realValidateXsd(xmlContent: string, profile: FacturxProfile, complianceBasePath?: string): RealXsdValidationResult;
export {};
//# sourceMappingURL=RealXsdValidator.d.ts.map