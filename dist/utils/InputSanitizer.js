"use strict";
// src/utils/InputSanitizer.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSanitizer = void 0;
/**
 * Classe utilitaire pour sanitizer et valider les entrées
 */
class InputSanitizer {
    /**
     * Sanitize une chaîne de caractères pour utilisation dans XML
     * @param input La chaîne à sanitizer
     * @param options Options de sanitization
     * @returns La chaîne sanitizée
     */
    static sanitizeString(input, options) {
        if (!input)
            return '';
        let result = input;
        // Trim si demandé (par défaut: oui)
        if (options?.trim !== false) {
            result = result.trim();
        }
        // Limiter la longueur
        if (options?.maxLength && result.length > options.maxLength) {
            result = result.substring(0, options.maxLength);
        }
        // Supprimer les caractères de contrôle dangereux (sauf newlines si autorisés)
        if (!options?.allowNewlines) {
            result = result.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        }
        else {
            result = result.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        }
        // Échapper les caractères spéciaux XML si non autorisés
        if (!options?.allowXmlChars) {
            result = this.escapeXml(result);
        }
        // Validation pattern custom
        if (options?.pattern && !options.pattern.test(result)) {
            throw new Error(`Input does not match required pattern: ${options.pattern}`);
        }
        return result;
    }
    /**
     * Échappe les caractères spéciaux XML
     * @param input La chaîne à échapper
     * @returns La chaîne échappée
     */
    static escapeXml(input) {
        return input.replace(/[&<>"']/g, (char) => this.XML_SPECIAL_CHARS[char] || char);
    }
    /**
     * Déséchappe les caractères XML (inverse de escapeXml)
     * @param input La chaîne échappée
     * @returns La chaîne déséchappée
     */
    static unescapeXml(input) {
        return input
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }
    /**
     * Valide et sanitize un email
     * @param email L'email à valider
     * @returns ValidationResult
     */
    static validateEmail(email) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!email || email.trim() === '') {
            result.isValid = false;
            result.errors.push('Email is required');
            return result;
        }
        const sanitized = this.sanitizeString(email, { maxLength: 254 });
        if (!this.EMAIL_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invalid email format');
        }
        if (sanitized.length > 254) {
            result.isValid = false;
            result.errors.push('Email too long (max 254 characters)');
        }
        return result;
    }
    /**
     * Valide et sanitize un numéro de téléphone
     * @param phone Le numéro de téléphone
     * @returns ValidationResult
     */
    static validatePhone(phone) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!phone || phone.trim() === '') {
            result.isValid = false;
            result.errors.push('Phone number is required');
            return result;
        }
        const sanitized = this.sanitizeString(phone, { maxLength: 20 });
        if (!this.PHONE_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invalid phone number format');
        }
        return result;
    }
    /**
     * Valide un numéro de facture/commande
     * @param number Le numéro à valider
     * @returns ValidationResult
     */
    static validateInvoiceNumber(number) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!number || number.trim() === '') {
            result.isValid = false;
            result.errors.push('Invoice/Order number is required');
            return result;
        }
        const sanitized = this.sanitizeString(number, { maxLength: 50 });
        if (!this.INVOICE_NUMBER_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invoice number must contain only alphanumeric characters, hyphens, and underscores');
        }
        if (sanitized.length > 50) {
            result.isValid = false;
            result.errors.push('Invoice number too long (max 50 characters)');
        }
        return result;
    }
    /**
     * Valide un code pays ISO 3166-1 alpha-2
     * @param code Le code pays (ex: FR, DE, US)
     * @returns ValidationResult
     */
    static validateCountryCode(code) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!code || code.trim() === '') {
            result.isValid = false;
            result.errors.push('Country code is required');
            return result;
        }
        const sanitized = this.sanitizeString(code).toUpperCase();
        if (!this.COUNTRY_CODE_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invalid country code (must be 2-letter ISO 3166-1 alpha-2 code)');
        }
        return result;
    }
    /**
     * Valide un code devise ISO 4217
     * @param code Le code devise (ex: EUR, USD, GBP)
     * @returns ValidationResult
     */
    static validateCurrencyCode(code) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!code || code.trim() === '') {
            result.isValid = false;
            result.errors.push('Currency code is required');
            return result;
        }
        const sanitized = this.sanitizeString(code).toUpperCase();
        if (!this.CURRENCY_CODE_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invalid currency code (must be 3-letter ISO 4217 code)');
        }
        return result;
    }
    /**
     * Valide un numéro de TVA intracommunautaire
     * @param vatNumber Le numéro de TVA (ex: FR12345678901)
     * @returns ValidationResult
     */
    static validateVatNumber(vatNumber) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!vatNumber || vatNumber.trim() === '') {
            // VAT number is optional in many cases
            return result;
        }
        const sanitized = this.sanitizeString(vatNumber).toUpperCase().replace(/\s/g, '');
        if (!this.VAT_NUMBER_PATTERN.test(sanitized)) {
            result.isValid = false;
            result.errors.push('Invalid VAT number format (must start with 2-letter country code followed by 2-13 alphanumeric characters)');
        }
        if (sanitized.length > 15) {
            result.isValid = false;
            result.errors.push('VAT number too long (max 15 characters)');
        }
        return result;
    }
    /**
     * Valide un montant (prix, total, etc.)
     * @param amount Le montant à valider
     * @param min Montant minimum (optionnel)
     * @param max Montant maximum (optionnel)
     * @returns ValidationResult
     */
    static validateAmount(amount, min, max) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (amount === undefined || amount === null) {
            result.isValid = false;
            result.errors.push('Amount is required');
            return result;
        }
        if (isNaN(amount)) {
            result.isValid = false;
            result.errors.push('Amount must be a number');
            return result;
        }
        if (!isFinite(amount)) {
            result.isValid = false;
            result.errors.push('Amount must be finite');
            return result;
        }
        if (min !== undefined && amount < min) {
            result.isValid = false;
            result.errors.push(`Amount must be at least ${min}`);
        }
        if (max !== undefined && amount > max) {
            result.isValid = false;
            result.errors.push(`Amount must be at most ${max}`);
        }
        // Vérifier nombre de décimales (max 2 pour les montants)
        const decimals = (amount.toString().split('.')[1] || '').length;
        if (decimals > 2) {
            result.warnings.push('Amount has more than 2 decimal places, will be rounded');
        }
        return result;
    }
    /**
     * Valide une quantité
     * @param quantity La quantité à valider
     * @returns ValidationResult
     */
    static validateQuantity(quantity) {
        const result = this.validateAmount(quantity, 0);
        if (result.isValid && quantity <= 0) {
            result.isValid = false;
            result.errors.push('Quantity must be greater than 0');
        }
        return result;
    }
    /**
     * Valide un taux de TVA
     * @param rate Le taux de TVA (ex: 0.20 pour 20%)
     * @returns ValidationResult
     */
    static validateVatRate(rate) {
        const result = this.validateAmount(rate, 0, 1);
        if (result.isValid && (rate < 0 || rate > 1)) {
            result.isValid = false;
            result.errors.push('VAT rate must be between 0 and 1 (ex: 0.20 for 20%)');
        }
        return result;
    }
    /**
     * Valide une date
     * @param date La date à valider
     * @param minDate Date minimale (optionnel)
     * @param maxDate Date maximale (optionnel)
     * @returns ValidationResult
     */
    static validateDate(date, minDate, maxDate) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        if (!date) {
            result.isValid = false;
            result.errors.push('Date is required');
            return result;
        }
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            result.isValid = false;
            result.errors.push('Invalid date');
            return result;
        }
        if (minDate && date < minDate) {
            result.isValid = false;
            result.errors.push(`Date must be after ${minDate.toISOString()}`);
        }
        if (maxDate && date > maxDate) {
            result.isValid = false;
            result.errors.push(`Date must be before ${maxDate.toISOString()}`);
        }
        return result;
    }
    /**
     * Combine plusieurs résultats de validation
     * @param results Les résultats à combiner
     * @returns Un résultat combiné
     */
    static combineValidationResults(...results) {
        const combined = {
            isValid: true,
            errors: [],
            warnings: []
        };
        for (const result of results) {
            if (!result.isValid) {
                combined.isValid = false;
            }
            combined.errors.push(...result.errors);
            combined.warnings.push(...result.warnings);
        }
        return combined;
    }
}
exports.InputSanitizer = InputSanitizer;
/**
 * Caractères dangereux à échapper dans XML
 */
InputSanitizer.XML_SPECIAL_CHARS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
};
/**
 * Pattern pour email valide
 */
InputSanitizer.EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
/**
 * Pattern pour téléphone (format international ou français)
 */
InputSanitizer.PHONE_PATTERN = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
/**
 * Pattern pour numéro de facture/commande (alphanumérique + tirets)
 */
InputSanitizer.INVOICE_NUMBER_PATTERN = /^[A-Z0-9\-_]+$/i;
/**
 * Pattern pour code pays ISO 3166-1 alpha-2
 */
InputSanitizer.COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
/**
 * Pattern pour code devise ISO 4217
 */
InputSanitizer.CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
/**
 * Pattern pour numéro de TVA intracommunautaire
 */
InputSanitizer.VAT_NUMBER_PATTERN = /^[A-Z]{2}[A-Z0-9]{2,13}$/;
