import type { LocaleCode, LocaleData, I18nOptions, TranslationOptions, I18nPlugin, FormatterPlugin } from './types';
export declare class I18n {
    private locales;
    private plugins;
    private formatters;
    private messageCache;
    private currentLocale;
    private readonly options;
    constructor(options?: I18nOptions);
    registerLocale(localeData: LocaleData): void;
    registerLocales(locales: readonly LocaleData[]): void;
    getLocale(code: LocaleCode): LocaleData | undefined;
    getAvailableLocales(): LocaleCode[];
    hasLocale(code: LocaleCode): boolean;
    setLocale(code: LocaleCode): void;
    getCurrentLocale(): LocaleCode;
    registerPlugin(plugin: I18nPlugin): void;
    registerFormatter(formatter: FormatterPlugin): void;
    getPlugin(id: string): I18nPlugin | undefined;
    getMessage(key: string, options?: TranslationOptions): string;
    t(key: string, options?: TranslationOptions): string;
    hasMessage(key: string, locale?: LocaleCode): boolean;
    formatDate(date: Date, format?: string, locale?: LocaleCode): string;
    formatNumber(value: number, locale?: LocaleCode): string;
    formatCurrencyLocalized(value: number, currency: string, locale?: LocaleCode): string;
    private getRawMessage;
    private interpolate;
    private applyPluralization;
    private handleMissingTranslation;
    private applyDatePattern;
    private buildCacheKey;
    private invalidateCache;
}
export declare function getDefaultI18n(): I18n;
export declare function t(key: string, options?: TranslationOptions): string;
//# sourceMappingURL=I18n.d.ts.map