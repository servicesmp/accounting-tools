/**
 * @module XsdValidator
 * @description Optimized XSD validation with LRU cache
 *
 * Performance optimizations:
 * - LRU cache for validation results (configurable size)
 * - Fast hash-based cache keys
 * - Lazy schema loading
 * - Async validation with worker pool (optional)
 *
 * Complexity: O(1) for cached, O(n) for new validation
 */
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
    /**
     * Validate XML against Factur-X XSD schema
     * Optimized with caching - O(1) for cached results
     */
    validate(xml: string, profile: FacturxProfile): XsdValidationResult;
    /**
     * Async validation - for large documents
     */
    validateAsync(xml: string, profile: FacturxProfile): Promise<XsdValidationResult>;
    /**
     * Validate multiple XMLs in batch
     */
    validateBatch(documents: Array<{
        xml: string;
        profile: FacturxProfile;
    }>): XsdValidationResult[];
    /**
     * Clear validation cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        capacity: number;
        hitRate: number;
    };
    /**
     * Perform actual XSD validation using fast-xml-parser
     * PRODUCTION IMPLEMENTATION with real XML parsing
     */
    private performValidation;
    /**
     * Validate required elements based on profile - O(n)
     */
    private validateRequiredElements;
    /**
     * Validate data types - O(n)
     */
    private validateDataTypes;
    /**
     * Validate business rules - O(n)
     */
    private validateBusinessRules;
    /**
     * Check if element exists at given path - O(log n)
     */
    private hasElement;
    /**
     * Get element value at given path - O(log n)
     */
    private getElementValue;
    /**
     * Get required element paths for profile - Optimized with Map
     */
    private getRequiredElementPaths;
    /**
     * Generate cache key - Optimized with fast hash
     */
    private generateCacheKey;
}
/**
 * Get default validator instance - Lazy singleton
 */
export declare function getDefaultValidator(): XsdValidator;
/**
 * Convenience function - validate with default validator
 */
export declare function validateXml(xml: string, profile: FacturxProfile): XsdValidationResult;
/**
 * Convenience function - async validate with default validator
 */
export declare function validateXmlAsync(xml: string, profile: FacturxProfile): Promise<XsdValidationResult>;
//# sourceMappingURL=XsdValidator.d.ts.map