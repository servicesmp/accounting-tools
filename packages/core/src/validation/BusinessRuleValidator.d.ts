import { FacturxProfile } from '../types';
import { FacturXInvoice } from '../core/FacturXInvoice';
export interface BusinessRule {
    readonly id: string;
    readonly description: string;
    readonly severity: 'error' | 'warning';
    readonly category: 'presence' | 'calculation' | 'decimal' | 'vat' | 'french';
    readonly test: (invoice: FacturXInvoice) => boolean;
    readonly minProfile?: FacturxProfile;
}
export interface BusinessRuleResult {
    readonly ruleId: string;
    readonly passed: boolean;
    readonly message: string;
    readonly severity: 'error' | 'warning';
}
export interface BusinessRuleValidationResult {
    readonly isValid: boolean;
    readonly results: ReadonlyArray<BusinessRuleResult>;
    readonly errors: ReadonlyArray<BusinessRuleResult>;
    readonly warnings: ReadonlyArray<BusinessRuleResult>;
    readonly score: number;
    readonly profile: string;
}
export interface BusinessRuleValidatorOptions {
    readonly enableFrenchRules?: boolean;
    readonly profile?: FacturxProfile;
}
export declare class BusinessRuleValidator {
    private readonly allRules;
    private readonly enableFrenchRules;
    private readonly overrideProfile?;
    constructor(options?: BusinessRuleValidatorOptions);
    validate(invoice: FacturXInvoice): BusinessRuleValidationResult;
    validateRule(ruleId: string, invoice: FacturXInvoice): BusinessRuleResult;
    getRulesForProfile(profile: FacturxProfile): BusinessRule[];
    getTotalRuleCount(): number;
    getAllRuleIds(): string[];
}
export declare function getDefaultBusinessRuleValidator(): BusinessRuleValidator;
export declare function validateBusinessRules(invoice: FacturXInvoice): BusinessRuleValidationResult;
//# sourceMappingURL=BusinessRuleValidator.d.ts.map