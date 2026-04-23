export type LocaleCode = string;
export type TextDirection = 'ltr' | 'rtl';
export interface Messages {
    [key: string]: string | Messages;
}
export interface LocaleData {
    readonly code: LocaleCode;
    readonly name: string;
    readonly direction: TextDirection;
    readonly messages: Messages;
    readonly dateFormats: DateFormats;
    readonly numberFormats: NumberFormats;
}
export interface DateFormats {
    readonly short: string;
    readonly medium: string;
    readonly long: string;
    readonly full: string;
    readonly time: string;
    readonly datetime: string;
}
export interface NumberFormats {
    readonly decimal: string;
    readonly thousands: string;
    readonly currency: string;
    readonly percentage: string;
}
export interface I18nPlugin {
    readonly id: string;
    readonly locales: ReadonlyArray<LocaleCode>;
    register(): LocaleData[];
}
export interface FormatterPlugin {
    readonly id: string;
    formatDate?(date: Date, format: string, locale: LocaleCode): string;
    formatNumber?(value: number, options: Partial<NumberFormats>, locale: LocaleCode): string;
    formatCurrency?(value: number, currency: string, locale: LocaleCode): string;
}
export interface InterpolationContext {
    [key: string]: string | number | boolean | Date | null | undefined;
}
export type PluralizationRule = (count: number, locale: LocaleCode) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export interface I18nOptions {
    defaultLocale?: LocaleCode;
    fallbackLocale?: LocaleCode;
    missingTranslation?: 'error' | 'warn' | 'ignore' | 'key';
    enableInterpolation?: boolean;
    enablePluralization?: boolean;
    pluralizationRules?: Map<LocaleCode, PluralizationRule>;
}
export interface TranslationOptions {
    context?: InterpolationContext;
    count?: number;
    defaultValue?: string;
    locale?: LocaleCode;
}
//# sourceMappingURL=types.d.ts.map