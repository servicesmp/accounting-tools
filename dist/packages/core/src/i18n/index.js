"use strict";
/**
 * @module i18n
 * @description Extensible internationalization system for Factur-X
 *
 * Features:
 * - 3 built-in locales: English, French, German
 * - Plugin system for adding custom locales
 * - Message interpolation
 * - Pluralization support
 * - Date/number formatting per locale
 * - Nested message keys
 * - Fallback locale chain
 * - Performance optimized with caching
 *
 * @example Basic usage
 * ```typescript
 * import { I18n, en, fr } from '../i18n';
 *
 * const i18n = new I18n({ defaultLocale: 'en' });
 * i18n.registerLocales([en, fr]);
 *
 * i18n.getMessage('invoice'); // "Invoice"
 * i18n.setLocale('fr');
 * i18n.getMessage('invoice'); // "Facture"
 * ```
 *
 * @example With interpolation
 * ```typescript
 * i18n.getMessage('errors.validation.invalidAmount', {
 *   context: { amount: '1234.56' }
 * });
 * // Returns: "Invalid amount: 1234.56"
 * ```
 *
 * @example With pluralization
 * ```typescript
 * i18n.getMessage('items', { count: 5 });
 * // Returns: "You have 5 items"
 *
 * i18n.getMessage('items', { count: 1 });
 * // Returns: "You have 1 item"
 * ```
 *
 * @example Custom locale plugin
 * ```typescript
 * const spanishPlugin: I18nPlugin = {
 *   id: 'es',
 *   locales: ['es'],
 *   register() {
 *     return [{
 *       code: 'es',
 *       name: 'Español',
 *       direction: 'ltr',
 *       messages: { invoice: 'Factura', ... },
 *       dateFormats: { ... },
 *       numberFormats: { ... },
 *     }];
 *   }
 * };
 *
 * i18n.registerPlugin(spanishPlugin);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableLocaleCodes = exports.getLocaleByCode = exports.DEFAULT_LOCALES = exports.de = exports.fr = exports.en = exports.t = exports.getDefaultI18n = exports.I18n = void 0;
exports.createI18n = createI18n;
exports.translate = translate;
// ============================================================================
// EXPORTS
// ============================================================================
// Core classes
var I18n_1 = require("./I18n");
Object.defineProperty(exports, "I18n", { enumerable: true, get: function () { return I18n_1.I18n; } });
Object.defineProperty(exports, "getDefaultI18n", { enumerable: true, get: function () { return I18n_1.getDefaultI18n; } });
Object.defineProperty(exports, "t", { enumerable: true, get: function () { return I18n_1.t; } });
// Default locales
var locales_1 = require("./locales");
Object.defineProperty(exports, "en", { enumerable: true, get: function () { return locales_1.en; } });
Object.defineProperty(exports, "fr", { enumerable: true, get: function () { return locales_1.fr; } });
Object.defineProperty(exports, "de", { enumerable: true, get: function () { return locales_1.de; } });
Object.defineProperty(exports, "DEFAULT_LOCALES", { enumerable: true, get: function () { return locales_1.DEFAULT_LOCALES; } });
Object.defineProperty(exports, "getLocaleByCode", { enumerable: true, get: function () { return locales_1.getLocaleByCode; } });
Object.defineProperty(exports, "getAvailableLocaleCodes", { enumerable: true, get: function () { return locales_1.getAvailableLocaleCodes; } });
// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================
const I18n_2 = require("./I18n");
const locales_2 = require("./locales");
/**
 * Create pre-configured I18n instance with all default locales
 *
 * @param defaultLocale Default locale code (default: 'en')
 * @returns Configured I18n instance
 *
 * @example
 * const i18n = createI18n('fr');
 * i18n.getMessage('invoice'); // "Facture"
 */
function createI18n(defaultLocale = 'en') {
    const i18n = new I18n_2.I18n({ defaultLocale, fallbackLocale: 'en' });
    i18n.registerLocales(locales_2.DEFAULT_LOCALES);
    return i18n;
}
/**
 * Quick translation helper - uses default i18n instance
 *
 * @param key Message key
 * @param locale Locale code
 * @param context Interpolation context
 * @returns Translated message
 *
 * @example
 * translate('invoice', 'fr'); // "Facture"
 * translate('errors.validation.invalidAmount', 'en', { amount: '100' });
 * // "Invalid amount: 100"
 */
function translate(key, locale = 'en', context) {
    const i18n = createI18n(locale);
    return i18n.getMessage(key, { context });
}
//# sourceMappingURL=index.js.map