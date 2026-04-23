/**
 * @module ProfileValidator
 * @description Profile-specific validation for Factur-X compliance
 *
 * Validates that invoices conform to specific profile requirements:
 * - MINIMUM: Minimal required fields only
 * - BASICWL: Basic without lines
 * - BASIC: Basic with lines
 * - EN16931: Full EN 16931 compliance
 * - EXTENDED: Extended features
 *
 * Performance: O(n) where n = number of validation rules
 */
import { FacturxProfile } from '../types';
export interface ProfileValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<ProfileValidationError>;
    readonly warnings: ReadonlyArray<string>;
    readonly profile: FacturxProfile;
    readonly checkedRules: number;
}
export interface ProfileValidationError {
    readonly field: string;
    readonly rule: string;
    readonly message: string;
    readonly severity: 'error' | 'warning';
}
export interface ValidationRule {
    readonly name: string;
    readonly check: (invoice: any) => boolean;
    readonly errorMessage: string;
    readonly severity: 'error' | 'warning';
}
export declare class ProfileValidator {
    private readonly rules;
    constructor();
    /**
     * Validate invoice against profile - O(n) where n = number of rules
     */
    validate(invoice: any, profile: FacturxProfile): ProfileValidationResult;
    /**
     * Validate policy constraints (mandatory/forbidden fields)
     */
    private validatePolicy;
    /**
     * Check if field exists in invoice - supports dot notation
     */
    private hasField;
    /**
     * Initialize validation rules for each profile
     */
    private initializeRules;
    /**
     * Get available profiles
     */
    getAvailableProfiles(): FacturxProfile[];
    /**
     * Get rule count for profile
     */
    getRuleCount(profile: FacturxProfile): number;
}
/**
 * Get default profile validator - Lazy singleton
 */
export declare function getDefaultProfileValidator(): ProfileValidator;
/**
 * Convenience function - validate with default validator
 */
export declare function validateProfile(invoice: any, profile: FacturxProfile): ProfileValidationResult;
//# sourceMappingURL=ProfileValidator.d.ts.map