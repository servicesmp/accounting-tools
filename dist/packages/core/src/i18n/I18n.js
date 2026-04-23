"use strict";
/**
 * @module i18n/I18n
 * @description Extensible internationalization system
 *
 * Features:
 * - Plugin-based locale registration
 * - Message interpolation with context
 * - Pluralization support
 * - Date/number formatting
 * - Nested message keys with dot notation
 * - Fallback locale chain
 * - O(1) message lookups with cache
 *
 * Performance: O(1) for cached messages, O(log n) for nested key lookups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
exports.getDefaultI18n = getDefaultI18n;
exports.t = t;
// ============================================================================
// I18N CLASS - Extensible Localization System
// ============================================================================
class I18n {
    constructor(options = {}) {
        this.locales = new Map();
        this.plugins = new Map();
        this.formatters = new Map();
        this.messageCache = new Map();
        this.options = {
            defaultLocale: options.defaultLocale || 'en',
            fallbackLocale: options.fallbackLocale || 'en',
            missingTranslation: options.missingTranslation || 'key',
            enableInterpolation: options.enableInterpolation ?? true,
            enablePluralization: options.enablePluralization ?? true,
            pluralizationRules: options.pluralizationRules || new Map(),
        };
        this.currentLocale = this.options.defaultLocale;
    }
    // ==========================================================================
    // LOCALE MANAGEMENT
    // ==========================================================================
    /**
     * Register a locale - O(1)
     */
    registerLocale(localeData) {
        this.locales.set(localeData.code, localeData);
        this.invalidateCache();
    }
    /**
     * Register multiple locales - O(n)
     */
    registerLocales(locales) {
        for (const locale of locales) {
            this.locales.set(locale.code, locale);
        }
        this.invalidateCache();
    }
    /**
     * Get registered locale - O(1)
     */
    getLocale(code) {
        return this.locales.get(code);
    }
    /**
     * Get all registered locales
     */
    getAvailableLocales() {
        return Array.from(this.locales.keys());
    }
    /**
     * Check if locale is registered - O(1)
     */
    hasLocale(code) {
        return this.locales.has(code);
    }
    /**
     * Set current locale
     */
    setLocale(code) {
        if (!this.hasLocale(code)) {
            console.warn(`[I18n] Locale '${code}' not registered, using default: ${this.options.defaultLocale}`);
            this.currentLocale = this.options.defaultLocale;
        }
        else {
            this.currentLocale = code;
        }
        this.invalidateCache();
    }
    /**
     * Get current locale code
     */
    getCurrentLocale() {
        return this.currentLocale;
    }
    // ==========================================================================
    // PLUGIN SYSTEM
    // ==========================================================================
    /**
     * Register i18n plugin
     */
    registerPlugin(plugin) {
        this.plugins.set(plugin.id, plugin);
        const locales = plugin.register();
        this.registerLocales(locales);
    }
    /**
     * Register formatter plugin
     */
    registerFormatter(formatter) {
        this.formatters.set(formatter.id, formatter);
    }
    /**
     * Get registered plugin
     */
    getPlugin(id) {
        return this.plugins.get(id);
    }
    // ==========================================================================
    // MESSAGE TRANSLATION
    // ==========================================================================
    /**
     * Get translated message - OPTIMIZED with cache
     *
     * Supports:
     * - Dot notation for nested keys: 'errors.validation.required'
     * - Interpolation: 'Hello {name}'
     * - Pluralization: 'You have {count} items | You have {count} item'
     * - Fallback chain: current → fallback → key
     *
     * @param key Message key (supports dot notation)
     * @param options Translation options
     * @returns Translated message
     *
     * @example
     * i18n.getMessage('welcome', { context: { name: 'John' } })
     * // Returns: "Welcome John" (if message is "Welcome {name}")
     *
     * i18n.getMessage('items.count', { count: 5 })
     * // Returns: "You have 5 items" (with pluralization)
     */
    getMessage(key, options = {}) {
        const locale = options.locale || this.currentLocale;
        const cacheKey = this.buildCacheKey(key, locale, options);
        // Check cache - O(1)
        if (this.messageCache.has(cacheKey)) {
            return this.messageCache.get(cacheKey);
        }
        // Get raw message from locale
        let message = this.getRawMessage(key, locale);
        // Fallback chain if not found
        if (!message && locale !== this.options.fallbackLocale) {
            message = this.getRawMessage(key, this.options.fallbackLocale);
        }
        // Handle missing translation
        if (!message) {
            return this.handleMissingTranslation(key, options);
        }
        // Apply pluralization if count provided
        if (options.count !== undefined && this.options.enablePluralization) {
            message = this.applyPluralization(message, options.count, locale);
        }
        // Apply interpolation if context provided
        if (options.context && this.options.enableInterpolation) {
            message = this.interpolate(message, options.context);
        }
        // Cache result
        this.messageCache.set(cacheKey, message);
        return message;
    }
    /**
     * Shorthand for getMessage
     */
    t(key, options) {
        return this.getMessage(key, options);
    }
    /**
     * Check if translation exists
     */
    hasMessage(key, locale) {
        const loc = locale || this.currentLocale;
        return this.getRawMessage(key, loc) !== null;
    }
    // ==========================================================================
    // FORMATTING
    // ==========================================================================
    /**
     * Format date according to locale
     *
     * @param date Date to format
     * @param format Format name ('short', 'medium', 'long', 'full') or custom pattern
     * @param locale Override locale
     * @returns Formatted date string
     */
    formatDate(date, format = 'medium', locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return date.toLocaleDateString();
        }
        // Check custom formatters first
        for (const formatter of this.formatters.values()) {
            if (formatter.formatDate) {
                const result = formatter.formatDate(date, format, loc);
                if (result)
                    return result;
            }
        }
        // Use built-in formats
        const pattern = localeData.dateFormats[format] || format;
        return this.applyDatePattern(date, pattern);
    }
    /**
     * Format number according to locale
     */
    formatNumber(value, locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return value.toString();
        }
        // Check custom formatters
        for (const formatter of this.formatters.values()) {
            if (formatter.formatNumber) {
                const result = formatter.formatNumber(value, localeData.numberFormats, loc);
                if (result)
                    return result;
            }
        }
        // Default formatting
        const { decimal, thousands } = localeData.numberFormats;
        const parts = value.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
        return parts.join(decimal);
    }
    /**
     * Format currency according to locale
     */
    formatCurrencyLocalized(value, currency, locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return `${value.toFixed(2)} ${currency}`;
        }
        // Check custom formatters
        for (const formatter of this.formatters.values()) {
            if (formatter.formatCurrency) {
                const result = formatter.formatCurrency(value, currency, loc);
                if (result)
                    return result;
            }
        }
        // Default currency formatting
        const formattedNumber = this.formatNumber(value, loc);
        return localeData.numberFormats.currency
            .replace('{amount}', formattedNumber)
            .replace('{currency}', currency);
    }
    // ==========================================================================
    // PRIVATE HELPERS
    // ==========================================================================
    /**
     * Get raw message from locale - O(log n) for nested keys
     */
    getRawMessage(key, locale) {
        const localeData = this.locales.get(locale);
        if (!localeData) {
            return null;
        }
        // Support dot notation for nested keys
        const keys = key.split('.');
        let current = localeData.messages;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return null;
            }
        }
        return typeof current === 'string' ? current : null;
    }
    /**
     * Interpolate message with context - O(n) where n is number of placeholders
     */
    interpolate(message, context) {
        return message.replace(/\{(\w+)\}/g, (match, key) => {
            const value = context[key];
            return value !== undefined && value !== null ? String(value) : match;
        });
    }
    /**
     * Apply pluralization rules - O(1)
     */
    applyPluralization(message, count, locale) {
        // Simple pluralization: "singular | plural"
        const parts = message.split('|').map(p => p.trim());
        if (parts.length === 1) {
            return message; // No pluralization
        }
        // Use custom rule if available
        const rule = this.options.pluralizationRules.get(locale);
        if (rule) {
            const form = rule(count, locale);
            // Map form to index (simplified)
            const index = form === 'one' ? 0 : 1;
            return parts[index] || parts[parts.length - 1];
        }
        // Default English rule: 1 = singular, else plural
        return count === 1 ? parts[0] : parts[parts.length - 1];
    }
    /**
     * Handle missing translation based on options
     */
    handleMissingTranslation(key, options) {
        const { missingTranslation } = this.options;
        switch (missingTranslation) {
            case 'error':
                throw new Error(`[I18n] Missing translation for key: ${key}`);
            case 'warn':
                console.warn(`[I18n] Missing translation for key: ${key}`);
                return options.defaultValue || key;
            case 'ignore':
                return options.defaultValue || '';
            case 'key':
            default:
                return options.defaultValue || key;
        }
    }
    /**
     * Apply date pattern - Basic implementation
     */
    applyDatePattern(date, pattern) {
        // Simple pattern replacements (can be enhanced)
        const replacements = {
            'YYYY': date.getFullYear().toString(),
            'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
            'DD': date.getDate().toString().padStart(2, '0'),
            'HH': date.getHours().toString().padStart(2, '0'),
            'mm': date.getMinutes().toString().padStart(2, '0'),
            'ss': date.getSeconds().toString().padStart(2, '0'),
        };
        let result = pattern;
        for (const [token, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(token, 'g'), value);
        }
        return result;
    }
    /**
     * Build cache key - O(1)
     */
    buildCacheKey(key, locale, options) {
        const parts = [locale, key];
        if (options.count !== undefined) {
            parts.push(`count:${options.count}`);
        }
        if (options.context) {
            parts.push(`ctx:${JSON.stringify(options.context)}`);
        }
        return parts.join('::');
    }
    /**
     * Invalidate message cache
     */
    invalidateCache() {
        this.messageCache.clear();
    }
}
exports.I18n = I18n;
// ============================================================================
// SINGLETON INSTANCE
// ============================================================================
let defaultI18n = null;
/**
 * Get default I18n instance - Lazy singleton
 */
function getDefaultI18n() {
    if (!defaultI18n) {
        defaultI18n = new I18n();
    }
    return defaultI18n;
}
/**
 * Convenience function - translate with default instance
 */
function t(key, options) {
    return getDefaultI18n().getMessage(key, options);
}
//# sourceMappingURL=I18n.js.map