export { I18n, getDefaultI18n, t } from './I18n';
export type { LocaleCode, LocaleData, Messages, I18nOptions, TranslationOptions, I18nPlugin, FormatterPlugin, InterpolationContext, DateFormats, NumberFormats, PluralizationRule, TextDirection, } from './types';
export { en, fr, de, DEFAULT_LOCALES, getLocaleByCode, getAvailableLocaleCodes } from './locales';
import { I18n } from './I18n';
import type { LocaleCode } from './types';
export declare function createI18n(defaultLocale?: LocaleCode): I18n;
export declare function translate(key: string, locale?: LocaleCode, context?: Record<string, any>): string;
//# sourceMappingURL=index.d.ts.map