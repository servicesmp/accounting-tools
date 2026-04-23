/**
 * @module BusinessRuleValidator
 * @description EN16931 Schematron business rules + French BR-FR rules for Factur-X
 *
 * Implements ~50 critical business rules operating on invoice DATA (not XML)
 * for fast pre-generation validation. Rules are organized by category:
 *
 * - BR-01 to BR-16:  Core presence rules
 * - BR-CO-10 to BR-CO-26: Calculation coherence rules
 * - BR-DEC-01 to BR-DEC-17: Decimal precision rules
 * - BR-S-01 to BR-S-08: VAT standard rate rules
 * - BR-FR-05 to BR-FR-13: French rules (XP Z12-012)
 *
 * Performance: O(n + m) where n = lines, m = tax summaries
 *
 * @see https://www.cen.eu/work/areas/ict/ebusiness/pages/ws-ebilling.aspx
 * @see https://fnfe-mpe.org/factur-x/
 */
import { FacturxProfile } from '../types';
import { FacturXInvoice } from '../core/FacturXInvoice';
/**
 * Business rule definition
 */
export interface BusinessRule {
    /** Rule identifier (e.g. 'BR-02', 'BR-CO-13', 'BR-FR-05') */
    readonly id: string;
    /** Human-readable description of the rule */
    readonly description: string;
    /** Severity level: 'error' causes validation failure, 'warning' is advisory */
    readonly severity: 'error' | 'warning';
    /** Rule category for filtering and reporting */
    readonly category: 'presence' | 'calculation' | 'decimal' | 'vat' | 'french';
    /** Test function: returns true if the invoice PASSES the rule */
    readonly test: (invoice: FacturXInvoice) => boolean;
    /** Minimum profile level at which this rule applies (inclusive and above) */
    readonly minProfile?: FacturxProfile;
}
/**
 * Result for a single business rule evaluation
 */
export interface BusinessRuleResult {
    /** Rule identifier */
    readonly ruleId: string;
    /** Whether the invoice passed this rule */
    readonly passed: boolean;
    /** Human-readable message (description on pass, failure details on fail) */
    readonly message: string;
    /** Severity level */
    readonly severity: 'error' | 'warning';
}
/**
 * Aggregate validation result
 */
export interface BusinessRuleValidationResult {
    /** True if no rules with severity 'error' failed */
    readonly isValid: boolean;
    /** All rule results (both passed and failed) */
    readonly results: ReadonlyArray<BusinessRuleResult>;
    /** Only failed rules with severity 'error' */
    readonly errors: ReadonlyArray<BusinessRuleResult>;
    /** Only failed rules with severity 'warning' */
    readonly warnings: ReadonlyArray<BusinessRuleResult>;
    /** Compliance score 0-100 based on passed/total rules */
    readonly score: number;
    /** Profile that was validated against */
    readonly profile: string;
}
/**
 * Options for BusinessRuleValidator
 */
export interface BusinessRuleValidatorOptions {
    /** Enable French-specific rules (BR-FR-*). Default: false */
    readonly enableFrenchRules?: boolean;
    /** Target profile. Default: invoice's own profile */
    readonly profile?: FacturxProfile;
}
export declare class BusinessRuleValidator {
    private readonly allRules;
    private readonly enableFrenchRules;
    private readonly overrideProfile?;
    /**
     * Create a BusinessRuleValidator
     * @param options - Configuration options
     */
    constructor(options?: BusinessRuleValidatorOptions);
    /**
     * Validate an invoice against all applicable business rules
     *
     * @param invoice - The FacturXInvoice instance to validate
     * @returns Structured validation result with per-rule pass/fail
     */
    validate(invoice: FacturXInvoice): BusinessRuleValidationResult;
    /**
     * Validate a single rule by ID against an invoice
     *
     * @param ruleId - The rule identifier (e.g. 'BR-02', 'BR-CO-13')
     * @param invoice - The FacturXInvoice instance to validate
     * @returns Single rule result
     * @throws Error if ruleId is not found
     */
    validateRule(ruleId: string, invoice: FacturXInvoice): BusinessRuleResult;
    /**
     * Get all rules applicable to a given profile
     *
     * @param profile - The Factur-X profile level
     * @returns Array of applicable BusinessRule instances
     */
    getRulesForProfile(profile: FacturxProfile): BusinessRule[];
    /**
     * Get total number of rules registered
     */
    getTotalRuleCount(): number;
    /**
     * Get all rule IDs
     */
    getAllRuleIds(): string[];
}
/**
 * Get default business rule validator - Lazy singleton
 */
export declare function getDefaultBusinessRuleValidator(): BusinessRuleValidator;
/**
 * Convenience function - validate with default validator
 */
export declare function validateBusinessRules(invoice: FacturXInvoice): BusinessRuleValidationResult;
//# sourceMappingURL=BusinessRuleValidator.d.ts.map