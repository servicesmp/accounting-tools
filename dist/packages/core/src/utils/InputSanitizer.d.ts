/**
 * @module InputSanitizer
 * @description Optimized input validation and sanitization
 * All methods are pure functions for maximum performance
 */
import { ValidationResult } from '../types';
/**
 * Sanitize string - Optimized with early returns
 */
export declare const sanitizeString: (input: string | null | undefined, options?: {
    maxLength?: number;
    allowNewlines?: boolean;
    allowXmlChars?: boolean;
    pattern?: RegExp;
}) => string;
/**
 * Escape XML special characters - Optimized with Map lookup
 */
export declare const escapeXml: (input: string) => string;
/**
 * Unescape XML entities - Optimized with Map lookup
 */
export declare const unescapeXml: (input: string) => string;
/**
 * Validate email - Optimized with pre-compiled regex
 */
export declare const validateEmail: (email: string | null | undefined) => ValidationResult;
/**
 * Validate phone - Optimized
 */
export declare const validatePhone: (phone: string | null | undefined) => ValidationResult;
/**
 * Validate invoice number - Optimized
 */
export declare const validateInvoiceNumber: (invoiceNumber: string | null | undefined) => ValidationResult;
/**
 * Validate country code - Optimized with pre-compiled regex
 */
export declare const validateCountryCode: (code: string | null | undefined) => ValidationResult;
/**
 * Validate currency code - Optimized
 */
export declare const validateCurrencyCode: (code: string | null | undefined) => ValidationResult;
/**
 * Validate VAT number - Optimized
 */
export declare const validateVatNumber: (vat: string | null | undefined) => ValidationResult;
/**
 * Validate amount - Optimized with simple number operations
 */
export declare const validateAmount: (amount: number | null | undefined, min?: number, max?: number) => ValidationResult;
/**
 * Validate date - Optimized
 */
export declare const validateDate: (date: Date | null | undefined, minDate?: Date, maxDate?: Date) => ValidationResult;
/**
 * Combine validation results - Optimized
 */
export declare const combineValidationResults: (...results: ValidationResult[]) => ValidationResult;
export declare const InputSanitizer: {
    readonly sanitizeString: (input: string | null | undefined, options?: {
        maxLength?: number;
        allowNewlines?: boolean;
        allowXmlChars?: boolean;
        pattern?: RegExp;
    }) => string;
    readonly escapeXml: (input: string) => string;
    readonly unescapeXml: (input: string) => string;
    readonly validateEmail: (email: string | null | undefined) => ValidationResult;
    readonly validatePhone: (phone: string | null | undefined) => ValidationResult;
    readonly validateInvoiceNumber: (invoiceNumber: string | null | undefined) => ValidationResult;
    readonly validateCountryCode: (code: string | null | undefined) => ValidationResult;
    readonly validateCurrencyCode: (code: string | null | undefined) => ValidationResult;
    readonly validateVatNumber: (vat: string | null | undefined) => ValidationResult;
    readonly validateAmount: (amount: number | null | undefined, min?: number, max?: number) => ValidationResult;
    readonly validateDate: (date: Date | null | undefined, minDate?: Date, maxDate?: Date) => ValidationResult;
    readonly combineValidationResults: (...results: ValidationResult[]) => ValidationResult;
};
//# sourceMappingURL=InputSanitizer.d.ts.map