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
import type { LocaleCode, LocaleData, I18nOptions, TranslationOptions, I18nPlugin, FormatterPlugin } from './types';
export declare class I18n {
    private locales;
    private plugins;
    private formatters;
    private messageCache;
    private currentLocale;
    private readonly options;
    constructor(options?: I18nOptions);
    /**
     * Register a locale - O(1)
     */
    registerLocale(localeData: LocaleData): void;
    /**
     * Register multiple locales - O(n)
     */
    registerLocales(locales: readonly LocaleData[]): void;
    /**
     * Get registered locale - O(1)
     */
    getLocale(code: LocaleCode): LocaleData | undefined;
    /**
     * Get all registered locales
     */
    getAvailableLocales(): LocaleCode[];
    /**
     * Check if locale is registered - O(1)
     */
    hasLocale(code: LocaleCode): boolean;
    /**
     * Set current locale
     */
    setLocale(code: LocaleCode): void;
    /**
     * Get current locale code
     */
    getCurrentLocale(): LocaleCode;
    /**
     * Register i18n plugin
     */
    registerPlugin(plugin: I18nPlugin): void;
    /**
     * Register formatter plugin
     */
    registerFormatter(formatter: FormatterPlugin): void;
    /**
     * Get registered plugin
     */
    getPlugin(id: string): I18nPlugin | undefined;
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
    getMessage(key: string, options?: TranslationOptions): string;
    /**
     * Shorthand for getMessage
     */
    t(key: string, options?: TranslationOptions): string;
    /**
     * Check if translation exists
     */
    hasMessage(key: string, locale?: LocaleCode): boolean;
    /**
     * Format date according to locale
     *
     * @param date Date to format
     * @param format Format name ('short', 'medium', 'long', 'full') or custom pattern
     * @param locale Override locale
     * @returns Formatted date string
     */
    formatDate(date: Date, format?: string, locale?: LocaleCode): string;
    /**
     * Format number according to locale
     */
    formatNumber(value: number, locale?: LocaleCode): string;
    /**
     * Format currency according to locale
     */
    formatCurrencyLocalized(value: number, currency: string, locale?: LocaleCode): string;
    /**
     * Get raw message from locale - O(log n) for nested keys
     */
    private getRawMessage;
    /**
     * Interpolate message with context - O(n) where n is number of placeholders
     */
    private interpolate;
    /**
     * Apply pluralization rules - O(1)
     */
    private applyPluralization;
    /**
     * Handle missing translation based on options
     */
    private handleMissingTranslation;
    /**
     * Apply date pattern - Basic implementation
     */
    private applyDatePattern;
    /**
     * Build cache key - O(1)
     */
    private buildCacheKey;
    /**
     * Invalidate message cache
     */
    private invalidateCache;
}
/**
 * Get default I18n instance - Lazy singleton
 */
export declare function getDefaultI18n(): I18n;
/**
 * Convenience function - translate with default instance
 */
export declare function t(key: string, options?: TranslationOptions): string;
//# sourceMappingURL=I18n.d.ts.map