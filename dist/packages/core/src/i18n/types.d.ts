/**
 * @module i18n/types
 * @description Type definitions for internationalization system
 */
/**
 * Supported locale codes (ISO 639-1 with optional region)
 */
export type LocaleCode = string;
/**
 * Text direction for RTL languages
 */
export type TextDirection = 'ltr' | 'rtl';
/**
 * Translation messages for a specific domain
 */
export interface Messages {
    [key: string]: string | Messages;
}
/**
 * Complete locale data including messages and formatting
 */
export interface LocaleData {
    /** Locale code (e.g., 'en-US', 'fr-FR') */
    readonly code: LocaleCode;
    /** Display name of locale */
    readonly name: string;
    /** Text direction */
    readonly direction: TextDirection;
    /** Translation messages */
    readonly messages: Messages;
    /** Date formatting patterns */
    readonly dateFormats: DateFormats;
    /** Number formatting options */
    readonly numberFormats: NumberFormats;
}
/**
 * Date formatting patterns for a locale
 */
export interface DateFormats {
    /** Short date format (e.g., '01/15/2025', '15.01.2025') */
    readonly short: string;
    /** Medium date format (e.g., 'Jan 15, 2025', '15 janv. 2025') */
    readonly medium: string;
    /** Long date format (e.g., 'January 15, 2025', '15 janvier 2025') */
    readonly long: string;
    /** Full date format (e.g., 'Monday, January 15, 2025') */
    readonly full: string;
    /** Time format (e.g., '14:30', '2:30 PM') */
    readonly time: string;
    /** Date-time format */
    readonly datetime: string;
}
/**
 * Number formatting options for a locale
 */
export interface NumberFormats {
    /** Decimal separator (e.g., '.', ',') */
    readonly decimal: string;
    /** Thousands separator (e.g., ',', '.', ' ') */
    readonly thousands: string;
    /** Currency format pattern (e.g., '$ {amount}', '{amount} €') */
    readonly currency: string;
    /** Percentage format pattern */
    readonly percentage: string;
}
/**
 * Plugin for adding custom locale
 */
export interface I18nPlugin {
    /** Plugin identifier */
    readonly id: string;
    /** Locale codes provided by this plugin */
    readonly locales: ReadonlyArray<LocaleCode>;
    /** Register locale data */
    register(): LocaleData[];
}
/**
 * Formatter plugin for custom formatting logic
 */
export interface FormatterPlugin {
    /** Plugin identifier */
    readonly id: string;
    /** Format date with custom logic */
    formatDate?(date: Date, format: string, locale: LocaleCode): string;
    /** Format number with custom logic */
    formatNumber?(value: number, options: Partial<NumberFormats>, locale: LocaleCode): string;
    /** Format currency with custom logic */
    formatCurrency?(value: number, currency: string, locale: LocaleCode): string;
}
/**
 * Interpolation context for message formatting
 */
export interface InterpolationContext {
    [key: string]: string | number | boolean | Date | null | undefined;
}
/**
 * Pluralization rules
 */
export type PluralizationRule = (count: number, locale: LocaleCode) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
/**
 * Options for I18n instance
 */
export interface I18nOptions {
    /** Default locale code */
    defaultLocale?: LocaleCode;
    /** Fallback locale code */
    fallbackLocale?: LocaleCode;
    /** Missing translation behavior */
    missingTranslation?: 'error' | 'warn' | 'ignore' | 'key';
    /** Enable interpolation */
    enableInterpolation?: boolean;
    /** Enable pluralization */
    enablePluralization?: boolean;
    /** Custom pluralization rules */
    pluralizationRules?: Map<LocaleCode, PluralizationRule>;
}
/**
 * Translation options for getMessage()
 */
export interface TranslationOptions {
    /** Interpolation context */
    context?: InterpolationContext;
    /** Pluralization count */
    count?: number;
    /** Default value if translation missing */
    defaultValue?: string;
    /** Override locale for this translation */
    locale?: LocaleCode;
}
//# sourceMappingURL=types.d.ts.map