import { ValidationResult } from '../types';
export declare const sanitizeString: (input: string | null | undefined, options?: {
    maxLength?: number;
    allowNewlines?: boolean;
    allowXmlChars?: boolean;
    pattern?: RegExp;
}) => string;
export declare const escapeXml: (input: string) => string;
export declare const unescapeXml: (input: string) => string;
export declare const validateEmail: (email: string | null | undefined) => ValidationResult;
export declare const validatePhone: (phone: string | null | undefined) => ValidationResult;
export declare const validateInvoiceNumber: (invoiceNumber: string | null | undefined) => ValidationResult;
export declare const validateCountryCode: (code: string | null | undefined) => ValidationResult;
export declare const validateCurrencyCode: (code: string | null | undefined) => ValidationResult;
export declare const validateVatNumber: (vat: string | null | undefined) => ValidationResult;
export declare const validateAmount: (amount: number | null | undefined, min?: number, max?: number) => ValidationResult;
export declare const validateDate: (date: Date | null | undefined, minDate?: Date, maxDate?: Date) => ValidationResult;
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