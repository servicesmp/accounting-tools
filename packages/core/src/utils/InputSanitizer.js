"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSanitizer = exports.combineValidationResults = exports.validateDate = exports.validateAmount = exports.validateVatNumber = exports.validateCurrencyCode = exports.validateCountryCode = exports.validateInvoiceNumber = exports.validatePhone = exports.validateEmail = exports.unescapeXml = exports.escapeXml = exports.sanitizeString = void 0;
const constants_1 = require("../core/constants");
const XML_ESCAPE_MAP = new Map([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>',
        '&gt;'],
    ['"', '&quot;'],
    ["'", '&apos;'],
]);
const XML_UNESCAPE_MAP = new Map([
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&quot;', '"'],
    ['&apos;', "'"],
]);
const XML_SPECIAL_CHARS_REGEX = /[&<>"']/g;
const XML_ENTITY_REGEX = /&(?:amp|lt|gt|quot|apos);/g;
const sanitizeString = (input, options) => {
    if (input === null || input === undefined) {
        return '';
    }
    let result = input.trim();
    if (result.length === 0) {
        return result;
    }
    if (options?.maxLength && result.length > options.maxLength) {
        result = result.substring(0, options.maxLength);
    }
    if (!options?.allowNewlines) {
        result = result.replace(/[\x00-\x1F\x7F]/g, '');
    }
    else {
        result = result.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    }
    if (!options?.allowXmlChars) {
        result = (0, exports.escapeXml)(result);
    }
    if (options?.pattern && !options.pattern.test(result)) {
        throw new Error(`Input does not match required pattern: ${options.pattern}`);
    }
    return result;
};
exports.sanitizeString = sanitizeString;
const escapeXml = (input) => {
    return input.replace(XML_SPECIAL_CHARS_REGEX, (char) => XML_ESCAPE_MAP.get(char) || char);
};
exports.escapeXml = escapeXml;
const unescapeXml = (input) => {
    return input.replace(XML_ENTITY_REGEX, (entity) => XML_UNESCAPE_MAP.get(entity) || entity);
};
exports.unescapeXml = unescapeXml;
const createValidationResult = (isValid, errors = [], warnings = []) => ({
    isValid,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
});
const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return createValidationResult(false, ['Email is required']);
    }
    const sanitized = (0, exports.sanitizeString)(email, { maxLength: constants_1.VALIDATION_LIMITS.MAX_EMAIL_LENGTH });
    if (!constants_1.PATTERNS.EMAIL.test(sanitized)) {
        return createValidationResult(false, ['Invalid email format']);
    }
    if (sanitized.length > constants_1.VALIDATION_LIMITS.MAX_EMAIL_LENGTH) {
        return createValidationResult(false, [
            `Email too long (max ${constants_1.VALIDATION_LIMITS.MAX_EMAIL_LENGTH} characters)`,
        ]);
    }
    return createValidationResult(true);
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return createValidationResult(false, ['Phone is required']);
    }
    const sanitized = (0, exports.sanitizeString)(phone, { maxLength: constants_1.VALIDATION_LIMITS.MAX_PHONE_LENGTH });
    if (!constants_1.PATTERNS.PHONE.test(sanitized)) {
        return createValidationResult(false, ['Invalid phone number format']);
    }
    return createValidationResult(true);
};
exports.validatePhone = validatePhone;
const validateInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber || invoiceNumber.trim() === '') {
        return createValidationResult(false, ['Invoice number is required']);
    }
    const sanitized = (0, exports.sanitizeString)(invoiceNumber, {
        maxLength: constants_1.VALIDATION_LIMITS.MAX_INVOICE_NUMBER_LENGTH,
    });
    if (!/^[A-Z0-9\-_]+$/i.test(sanitized)) {
        return createValidationResult(false, [
            'Invoice number must contain only alphanumeric characters, hyphens, and underscores',
        ]);
    }
    return createValidationResult(true);
};
exports.validateInvoiceNumber = validateInvoiceNumber;
const validateCountryCode = (code) => {
    if (!code || code.trim() === '') {
        return createValidationResult(false, ['Country code is required']);
    }
    const sanitized = code.trim().toUpperCase();
    if (!constants_1.PATTERNS.COUNTRY_CODE.test(sanitized)) {
        return createValidationResult(false, [
            'Invalid country code (must be 2-letter ISO 3166-1 alpha-2 code)',
        ]);
    }
    return createValidationResult(true);
};
exports.validateCountryCode = validateCountryCode;
const validateCurrencyCode = (code) => {
    if (!code || code.trim() === '') {
        return createValidationResult(false, ['Currency code is required']);
    }
    const sanitized = code.trim().toUpperCase();
    if (!constants_1.PATTERNS.CURRENCY_CODE.test(sanitized)) {
        return createValidationResult(false, [
            'Invalid currency code (must be 3-letter ISO 4217 code)',
        ]);
    }
    return createValidationResult(true);
};
exports.validateCurrencyCode = validateCurrencyCode;
const validateVatNumber = (vat) => {
    if (!vat || vat.trim() === '') {
        return createValidationResult(false, ['VAT number is required']);
    }
    const sanitized = vat.trim().toUpperCase();
    if (!constants_1.PATTERNS.VAT_ID.test(sanitized)) {
        return createValidationResult(false, [
            'Invalid VAT number format (must start with 2-letter country code followed by 2-13 alphanumeric characters)',
        ]);
    }
    if (sanitized.length > constants_1.VALIDATION_LIMITS.MAX_VAT_ID_LENGTH) {
        return createValidationResult(false, [
            `VAT number too long (max ${constants_1.VALIDATION_LIMITS.MAX_VAT_ID_LENGTH} characters)`,
        ]);
    }
    return createValidationResult(true);
};
exports.validateVatNumber = validateVatNumber;
const validateAmount = (amount, min, max) => {
    if (amount === null || amount === undefined) {
        return createValidationResult(false, ['Amount is required']);
    }
    if (isNaN(amount)) {
        return createValidationResult(false, ['Amount must be a number']);
    }
    if (!isFinite(amount)) {
        return createValidationResult(false, ['Amount must be finite']);
    }
    if (min !== undefined && amount < min) {
        return createValidationResult(false, [`Amount must be at least ${min}`]);
    }
    if (max !== undefined && amount > max) {
        return createValidationResult(false, [`Amount must be at most ${max}`]);
    }
    const amountStr = amount.toFixed(constants_1.VALIDATION_LIMITS.MAX_DECIMAL_PLACES + 1);
    const decimalPart = amountStr.split('.')[1];
    if (decimalPart && decimalPart.replace(/0+$/, '').length > constants_1.VALIDATION_LIMITS.MAX_DECIMAL_PLACES) {
        return createValidationResult(false, [
            `Amount cannot have more than ${constants_1.VALIDATION_LIMITS.MAX_DECIMAL_PLACES} decimal places`,
        ]);
    }
    return createValidationResult(true);
};
exports.validateAmount = validateAmount;
const validateDate = (date, minDate, maxDate) => {
    if (!date) {
        return createValidationResult(false, ['Date is required']);
    }
    if (isNaN(date.getTime())) {
        return createValidationResult(false, ['Invalid date']);
    }
    if (minDate && date < minDate) {
        return createValidationResult(false, [
            `Date must be on or after ${minDate.toISOString().split('T')[0]}`,
        ]);
    }
    if (maxDate && date > maxDate) {
        return createValidationResult(false, [
            `Date must be on or before ${maxDate.toISOString().split('T')[0]}`,
        ]);
    }
    return createValidationResult(true);
};
exports.validateDate = validateDate;
const combineValidationResults = (...results) => {
    const errors = [];
    const warnings = [];
    let isValid = true;
    for (const result of results) {
        if (!result.isValid) {
            isValid = false;
        }
        errors.push(...result.errors);
        warnings.push(...result.warnings);
    }
    return createValidationResult(isValid, errors, warnings);
};
exports.combineValidationResults = combineValidationResults;
exports.InputSanitizer = {
    sanitizeString: exports.sanitizeString,
    escapeXml: exports.escapeXml,
    unescapeXml: exports.unescapeXml,
    validateEmail: exports.validateEmail,
    validatePhone: exports.validatePhone,
    validateInvoiceNumber: exports.validateInvoiceNumber,
    validateCountryCode: exports.validateCountryCode,
    validateCurrencyCode: exports.validateCurrencyCode,
    validateVatNumber: exports.validateVatNumber,
    validateAmount: exports.validateAmount,
    validateDate: exports.validateDate,
    combineValidationResults: exports.combineValidationResults,
};
//# sourceMappingURL=InputSanitizer.js.map