"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
exports.getDefaultI18n = getDefaultI18n;
exports.t = t;
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
    registerLocale(localeData) {
        this.locales.set(localeData.code, localeData);
        this.invalidateCache();
    }
    registerLocales(locales) {
        for (const locale of locales) {
            this.locales.set(locale.code, locale);
        }
        this.invalidateCache();
    }
    getLocale(code) {
        return this.locales.get(code);
    }
    getAvailableLocales() {
        return Array.from(this.locales.keys());
    }
    hasLocale(code) {
        return this.locales.has(code);
    }
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
    getCurrentLocale() {
        return this.currentLocale;
    }
    registerPlugin(plugin) {
        this.plugins.set(plugin.id, plugin);
        const locales = plugin.register();
        this.registerLocales(locales);
    }
    registerFormatter(formatter) {
        this.formatters.set(formatter.id, formatter);
    }
    getPlugin(id) {
        return this.plugins.get(id);
    }
    getMessage(key, options = {}) {
        const locale = options.locale || this.currentLocale;
        const cacheKey = this.buildCacheKey(key, locale, options);
        if (this.messageCache.has(cacheKey)) {
            return this.messageCache.get(cacheKey);
        }
        let message = this.getRawMessage(key, locale);
        if (!message && locale !== this.options.fallbackLocale) {
            message = this.getRawMessage(key, this.options.fallbackLocale);
        }
        if (!message) {
            return this.handleMissingTranslation(key, options);
        }
        if (options.count !== undefined && this.options.enablePluralization) {
            message = this.applyPluralization(message, options.count, locale);
        }
        if (options.context && this.options.enableInterpolation) {
            message = this.interpolate(message, options.context);
        }
        this.messageCache.set(cacheKey, message);
        return message;
    }
    t(key, options) {
        return this.getMessage(key, options);
    }
    hasMessage(key, locale) {
        const loc = locale || this.currentLocale;
        return this.getRawMessage(key, loc) !== null;
    }
    formatDate(date, format = 'medium', locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return date.toLocaleDateString();
        }
        for (const formatter of this.formatters.values()) {
            if (formatter.formatDate) {
                const result = formatter.formatDate(date, format, loc);
                if (result)
                    return result;
            }
        }
        const pattern = localeData.dateFormats[format] || format;
        return this.applyDatePattern(date, pattern);
    }
    formatNumber(value, locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return value.toString();
        }
        for (const formatter of this.formatters.values()) {
            if (formatter.formatNumber) {
                const result = formatter.formatNumber(value, localeData.numberFormats, loc);
                if (result)
                    return result;
            }
        }
        const { decimal, thousands } = localeData.numberFormats;
        const parts = value.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
        return parts.join(decimal);
    }
    formatCurrencyLocalized(value, currency, locale) {
        const loc = locale || this.currentLocale;
        const localeData = this.locales.get(loc);
        if (!localeData) {
            return `${value.toFixed(2)} ${currency}`;
        }
        for (const formatter of this.formatters.values()) {
            if (formatter.formatCurrency) {
                const result = formatter.formatCurrency(value, currency, loc);
                if (result)
                    return result;
            }
        }
        const formattedNumber = this.formatNumber(value, loc);
        return localeData.numberFormats.currency
            .replace('{amount}', formattedNumber)
            .replace('{currency}', currency);
    }
    getRawMessage(key, locale) {
        const localeData = this.locales.get(locale);
        if (!localeData) {
            return null;
        }
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
    interpolate(message, context) {
        return message.replace(/\{(\w+)\}/g, (match, key) => {
            const value = context[key];
            return value !== undefined && value !== null ? String(value) : match;
        });
    }
    applyPluralization(message, count, locale) {
        const parts = message.split('|').map(p => p.trim());
        if (parts.length === 1) {
            return message;
        }
        const rule = this.options.pluralizationRules.get(locale);
        if (rule) {
            const form = rule(count, locale);
            const index = form === 'one' ? 0 : 1;
            return parts[index] || parts[parts.length - 1];
        }
        return count === 1 ? parts[0] : parts[parts.length - 1];
    }
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
    applyDatePattern(date, pattern) {
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
    invalidateCache() {
        this.messageCache.clear();
    }
}
exports.I18n = I18n;
let defaultI18n = null;
function getDefaultI18n() {
    if (!defaultI18n) {
        defaultI18n = new I18n();
    }
    return defaultI18n;
}
function t(key, options) {
    return getDefaultI18n().getMessage(key, options);
}
//# sourceMappingURL=I18n.js.map