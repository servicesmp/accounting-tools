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
    validate(invoice: any, profile: FacturxProfile): ProfileValidationResult;
    private validatePolicy;
    private hasField;
    private initializeRules;
    getAvailableProfiles(): FacturxProfile[];
    getRuleCount(profile: FacturxProfile): number;
}
export declare function getDefaultProfileValidator(): ProfileValidator;
export declare function validateProfile(invoice: any, profile: FacturxProfile): ProfileValidationResult;
//# sourceMappingURL=ProfileValidator.d.ts.map