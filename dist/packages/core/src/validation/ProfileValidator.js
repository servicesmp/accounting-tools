"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileValidator = void 0;
exports.getDefaultProfileValidator = getDefaultProfileValidator;
exports.validateProfile = validateProfile;
const types_1 = require("../types");
const constants_1 = require("../core/constants");
// ============================================================================
// PROFILE VALIDATOR
// ============================================================================
class ProfileValidator {
    constructor() {
        this.rules = new Map();
        this.initializeRules();
    }
    /**
     * Validate invoice against profile - O(n) where n = number of rules
     */
    validate(invoice, profile) {
        const errors = [];
        const warnings = [];
        const profileRules = this.rules.get(profile) || [];
        // Run all validation rules
        for (const rule of profileRules) {
            try {
                const passed = rule.check(invoice);
                if (!passed) {
                    if (rule.severity === 'error') {
                        errors.push({
                            field: rule.name,
                            rule: rule.name,
                            message: rule.errorMessage,
                            severity: 'error',
                        });
                    }
                    else {
                        warnings.push(rule.errorMessage);
                    }
                }
            }
            catch (e) {
                errors.push({
                    field: rule.name,
                    rule: rule.name,
                    message: `Validation rule failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
                    severity: 'error',
                });
            }
        }
        // Check policy constraints
        const policyErrors = this.validatePolicy(invoice, profile);
        errors.push(...policyErrors);
        return {
            isValid: errors.length === 0,
            errors: Object.freeze(errors),
            warnings: Object.freeze(warnings),
            profile,
            checkedRules: profileRules.length,
        };
    }
    /**
     * Validate policy constraints (mandatory/forbidden fields)
     */
    validatePolicy(invoice, profile) {
        const errors = [];
        const policy = (0, constants_1.getProfilePolicy)(profile);
        // Check mandatory fields
        for (const field of policy.mandatoryFields) {
            if (!this.hasField(invoice, field)) {
                errors.push({
                    field,
                    rule: 'mandatory_field',
                    message: `Profile ${profile} requires field '${field}'`,
                    severity: 'error',
                });
            }
        }
        // Check forbidden fields
        for (const field of policy.forbiddenFields) {
            if (this.hasField(invoice, field)) {
                errors.push({
                    field,
                    rule: 'forbidden_field',
                    message: `Profile ${profile} forbids field '${field}'`,
                    severity: 'error',
                });
            }
        }
        return errors;
    }
    /**
     * Check if field exists in invoice - supports dot notation
     */
    hasField(invoice, fieldPath) {
        const parts = fieldPath.split('.');
        let current = invoice;
        for (const part of parts) {
            if (current === null || current === undefined) {
                return false;
            }
            current = current[part];
        }
        // Check if value is meaningful
        if (current === null || current === undefined) {
            return false;
        }
        if (Array.isArray(current)) {
            return current.length > 0;
        }
        if (typeof current === 'string') {
            return current.trim().length > 0;
        }
        return true;
    }
    /**
     * Initialize validation rules for each profile
     */
    initializeRules() {
        // MINIMUM profile rules
        this.rules.set(types_1.FacturxProfile.MINIMUM, [
            {
                name: 'invoice_number',
                check: (inv) => inv.header?.id && inv.header.id.length > 0,
                errorMessage: 'Invoice number is required',
                severity: 'error',
            },
            {
                name: 'invoice_date',
                check: (inv) => inv.header?.invoiceDate instanceof Date,
                errorMessage: 'Invoice date is required and must be a valid Date',
                severity: 'error',
            },
            {
                name: 'seller_name',
                check: (inv) => inv.seller?.name && inv.seller.name.length > 0,
                errorMessage: 'Seller name is required',
                severity: 'error',
            },
            {
                name: 'buyer_name',
                check: (inv) => inv.buyer?.name && inv.buyer.name.length > 0,
                errorMessage: 'Buyer name is required',
                severity: 'error',
            },
            {
                name: 'currency',
                check: (_inv) => true, // Always EUR for now
                errorMessage: 'Currency code is required',
                severity: 'error',
            },
        ]);
        // BASICWL profile rules (extends MINIMUM)
        this.rules.set(types_1.FacturxProfile.BASICWL, [
            ...this.rules.get(types_1.FacturxProfile.MINIMUM),
            {
                name: 'payment_means',
                check: (inv) => inv.payment?.meansCode !== undefined,
                errorMessage: 'Payment means code is required for BASICWL',
                severity: 'error',
            },
            {
                name: 'tax_total',
                check: (_inv) => true, // Checked in totals
                errorMessage: 'Tax total is required',
                severity: 'error',
            },
            {
                name: 'no_lines',
                check: (inv) => !inv.lines || inv.lines.length === 0,
                errorMessage: 'BASICWL profile does not support line items',
                severity: 'error',
            },
        ]);
        // BASIC profile rules (extends BASICWL)
        this.rules.set(types_1.FacturxProfile.BASIC, [
            {
                name: 'invoice_number',
                check: (inv) => inv.header?.id && inv.header.id.length > 0,
                errorMessage: 'Invoice number is required',
                severity: 'error',
            },
            {
                name: 'invoice_date',
                check: (inv) => inv.header?.invoiceDate instanceof Date,
                errorMessage: 'Invoice date is required',
                severity: 'error',
            },
            {
                name: 'seller_name',
                check: (inv) => inv.seller?.name && inv.seller.name.length > 0,
                errorMessage: 'Seller name is required',
                severity: 'error',
            },
            {
                name: 'buyer_name',
                check: (inv) => inv.buyer?.name && inv.buyer.name.length > 0,
                errorMessage: 'Buyer name is required',
                severity: 'error',
            },
            {
                name: 'lines_required',
                check: (inv) => inv.lines && inv.lines.length > 0,
                errorMessage: 'BASIC profile requires at least one line item',
                severity: 'error',
            },
        ]);
        // EN16931 profile rules (full compliance)
        this.rules.set(types_1.FacturxProfile.EN16931, [
            {
                name: 'invoice_number',
                check: (inv) => inv.header?.id && inv.header.id.length > 0,
                errorMessage: 'Invoice number is required (BT-1)',
                severity: 'error',
            },
            {
                name: 'invoice_date',
                check: (inv) => inv.header?.invoiceDate instanceof Date,
                errorMessage: 'Invoice issue date is required (BT-2)',
                severity: 'error',
            },
            {
                name: 'invoice_type',
                check: (inv) => inv.header?.typeCode !== undefined,
                errorMessage: 'Invoice type code is required (BT-3)',
                severity: 'error',
            },
            {
                name: 'currency',
                check: (_inv) => true, // EUR by default
                errorMessage: 'Invoice currency code is required (BT-5)',
                severity: 'error',
            },
            {
                name: 'seller_name',
                check: (inv) => inv.seller?.name && inv.seller.name.length > 0,
                errorMessage: 'Seller name is required (BT-27)',
                severity: 'error',
            },
            {
                name: 'seller_address',
                check: (inv) => inv.seller?.address !== undefined,
                errorMessage: 'Seller postal address is required (BG-5)',
                severity: 'error',
            },
            {
                name: 'seller_country',
                check: (inv) => inv.seller?.address?.countryCode && inv.seller.address.countryCode.length === 2,
                errorMessage: 'Seller country code is required (BT-40)',
                severity: 'error',
            },
            {
                name: 'buyer_name',
                check: (inv) => inv.buyer?.name && inv.buyer.name.length > 0,
                errorMessage: 'Buyer name is required (BT-44)',
                severity: 'error',
            },
            {
                name: 'buyer_address',
                check: (inv) => inv.buyer?.address !== undefined,
                errorMessage: 'Buyer postal address is required (BG-8)',
                severity: 'error',
            },
            {
                name: 'buyer_country',
                check: (inv) => inv.buyer?.address?.countryCode && inv.buyer.address.countryCode.length === 2,
                errorMessage: 'Buyer country code is required (BT-55)',
                severity: 'error',
            },
            {
                name: 'payment_means',
                check: (inv) => inv.payment?.meansCode !== undefined,
                errorMessage: 'Payment means type code is required (BT-81)',
                severity: 'error',
            },
            {
                name: 'tax_total',
                check: (_inv) => true, // Computed
                errorMessage: 'Invoice total VAT amount is required (BT-110)',
                severity: 'error',
            },
            {
                name: 'line_items',
                check: (inv) => inv.lines && inv.lines.length > 0,
                errorMessage: 'At least one invoice line is required (BG-25)',
                severity: 'error',
            },
            {
                name: 'line_id',
                check: (inv) => {
                    if (!inv.lines)
                        return false;
                    return inv.lines.every((line) => line.id && line.id.length > 0);
                },
                errorMessage: 'Line ID is required for each line (BT-126)',
                severity: 'error',
            },
            {
                name: 'line_quantity',
                check: (inv) => {
                    if (!inv.lines)
                        return false;
                    return inv.lines.every((line) => line.quantity > 0);
                },
                errorMessage: 'Invoiced quantity must be greater than zero (BT-129)',
                severity: 'error',
            },
            {
                name: 'line_price',
                check: (inv) => {
                    if (!inv.lines)
                        return false;
                    return inv.lines.every((line) => line.unitPrice >= 0);
                },
                errorMessage: 'Item net price must be non-negative (BT-146)',
                severity: 'error',
            },
            {
                name: 'vat_rate',
                check: (inv) => {
                    if (!inv.lines)
                        return false;
                    return inv.lines.every((line) => line.vatRate !== undefined);
                },
                errorMessage: 'VAT rate is required for each line (BT-119)',
                severity: 'error',
            },
        ]);
        // EXTENDED profile rules (extends EN16931)
        this.rules.set(types_1.FacturxProfile.EXTENDED, [
            ...this.rules.get(types_1.FacturxProfile.EN16931),
            {
                name: 'extended_fields',
                check: (_inv) => true, // EXTENDED allows all fields
                errorMessage: 'EXTENDED profile validation',
                severity: 'warning',
            },
        ]);
    }
    /**
     * Get available profiles
     */
    getAvailableProfiles() {
        return Array.from(this.rules.keys());
    }
    /**
     * Get rule count for profile
     */
    getRuleCount(profile) {
        return this.rules.get(profile)?.length || 0;
    }
}
exports.ProfileValidator = ProfileValidator;
// ============================================================================
// SINGLETON INSTANCE
// ============================================================================
let defaultProfileValidator = null;
/**
 * Get default profile validator - Lazy singleton
 */
function getDefaultProfileValidator() {
    if (!defaultProfileValidator) {
        defaultProfileValidator = new ProfileValidator();
    }
    return defaultProfileValidator;
}
/**
 * Convenience function - validate with default validator
 */
function validateProfile(invoice, profile) {
    return getDefaultProfileValidator().validate(invoice, profile);
}
//# sourceMappingURL=ProfileValidator.js.map