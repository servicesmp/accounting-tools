/**
 * @module RealXsdValidator
 * @description Real XSD validation for Factur-X XML using actual XSD schema files.
 *
 * This validator performs genuine XSD validation against the official Factur-X 1.07.2
 * XSD schemas, unlike the structural XsdValidator which only checks element presence.
 *
 * Strategy (ordered by preference):
 * 1. node-libxml (native libxml2 bindings) - fast, supports schema imports natively
 * 2. libxmljs (alternative libxml2 bindings) - fallback with same capabilities
 * 3. xmllint CLI (child_process.execFileSync) - last resort, requires xmllint on PATH
 *
 * Schema layout (per profile):
 *   <basePath>/xsd/facturx-<profile>/Factur-X_1.07.2_<PROFILE>.xsd  (main)
 *   + 3 supporting XSDs (QDT, RAM, UDT) in the same directory
 *   libxml2 resolves xsd:import schemaLocation paths relative to the main XSD.
 *
 * Performance: Schemas are loaded once per validation call (node-libxml handles
 *              caching internally). Validation results are cached with an LRU
 *              cache keyed by content hash + profile.
 */
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
/**
 * Reset engine detection (useful for testing).
 */
export declare function resetEngineDetection(): void;
export declare class RealXsdValidator {
    private readonly complianceBasePath;
    private readonly cache;
    private readonly engine;
    private readonly enableCache;
    /**
     * Create a new RealXsdValidator.
     *
     * @param complianceBasePath - Absolute path to the compliance directory
     *   containing `xsd/facturx-<profile>/` subdirectories.
     *   Defaults to `<project-root>/src/compliance`.
     * @param options - Optional configuration.
     */
    constructor(complianceBasePath?: string, options?: {
        cacheSize?: number;
        enableCache?: boolean;
    });
    /**
     * Get the detected validation engine name.
     */
    getEngine(): Engine;
    /**
     * Get the absolute path to the main XSD for a given profile.
     */
    getSchemaPath(profile: FacturxProfile): string;
    /**
     * Verify that the XSD files for a profile exist on disk.
     */
    schemaExists(profile: FacturxProfile): boolean;
    /**
     * List all XSD files for a profile (main + supporting).
     */
    getSchemaFiles(profile: FacturxProfile): string[];
    /**
     * Synchronous XSD validation.
     *
     * Validates the given XML string against the Factur-X XSD schema
     * for the specified profile.
     */
    validate(xmlContent: string, profile: FacturxProfile): RealXsdValidationResult;
    /**
     * Asynchronous XSD validation.
     *
     * Wraps the synchronous validate() in a Promise resolved via setImmediate
     * so the event loop is not blocked for large documents.
     */
    validateAsync(xmlContent: string, profile: FacturxProfile): Promise<RealXsdValidationResult>;
    /**
     * Validate multiple documents in batch.
     */
    validateBatch(documents: Array<{
        xml: string;
        profile: FacturxProfile;
    }>): RealXsdValidationResult[];
    /**
     * Clear the validation result cache.
     */
    clearCache(): void;
    /**
     * Get cache statistics.
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
    private buildCacheKey;
}
/**
 * Get a default singleton RealXsdValidator instance.
 */
export declare function getDefaultRealXsdValidator(complianceBasePath?: string): RealXsdValidator;
/**
 * Quick-validate XML against a profile XSD.
 */
export declare function realValidateXsd(xmlContent: string, profile: FacturxProfile, complianceBasePath?: string): RealXsdValidationResult;
export {};
//# sourceMappingURL=RealXsdValidator.d.ts.map