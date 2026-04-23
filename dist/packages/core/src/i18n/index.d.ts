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
export { I18n, getDefaultI18n, t } from './I18n';
export type { LocaleCode, LocaleData, Messages, I18nOptions, TranslationOptions, I18nPlugin, FormatterPlugin, InterpolationContext, DateFormats, NumberFormats, PluralizationRule, TextDirection, } from './types';
export { en, fr, de, DEFAULT_LOCALES, getLocaleByCode, getAvailableLocaleCodes } from './locales';
import { I18n } from './I18n';
import type { LocaleCode } from './types';
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
export declare function createI18n(defaultLocale?: LocaleCode): I18n;
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
export declare function translate(key: string, locale?: LocaleCode, context?: Record<string, any>): string;
//# sourceMappingURL=index.d.ts.map