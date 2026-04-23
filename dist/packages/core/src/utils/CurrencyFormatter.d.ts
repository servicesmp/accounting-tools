/**
 * @module CurrencyFormatter
 * @description Currency formatting and validation utilities
 *
 * Supports ISO 4217 currency codes with regional formatting
 *
 * Performance: O(1) for all operations with pre-built Maps
 */
/**
 * Currency metadata for formatting
 */
interface CurrencyInfo {
    readonly code: string;
    readonly symbol: string;
    readonly name: string;
    readonly decimalPlaces: number;
    readonly symbolPosition: 'before' | 'after';
}
/**
 * Validate if currency code is supported - O(1)
 */
export declare function isValidCurrency(code: string): boolean;
/**
 * Get currency metadata - O(1)
 * @throws Error if currency not supported
 */
export declare function getCurrencyInfo(code: string): CurrencyInfo;
/**
 * Format amount with currency - Optimized
 *
 * @param amount - Numeric amount
 * @param currencyCode - ISO 4217 code
 * @param options - Formatting options
 * @returns Formatted string with currency symbol
 *
 * @example
 * formatCurrency(1234.56, 'EUR') // "1234.56 €"
 * formatCurrency(1234.56, 'USD') // "$1234.56"
 * formatCurrency(1234.56, 'JPY') // "¥1235" (no decimals for JPY)
 */
export declare function formatCurrency(amount: number, currencyCode: string, options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    useGrouping?: boolean;
}): string;
/**
 * Format amount for XML (no symbols, fixed decimals) - Optimized
 *
 * Always uses 2 decimal places regardless of currency for XML compliance
 *
 * @param amount - Numeric amount
 * @returns Formatted string for XML
 *
 * @example
 * formatAmountForXml(1234.5) // "1234.50"
 * formatAmountForXml(100) // "100.00"
 */
export declare function formatAmountForXml(amount: number): string;
/**
 * Parse formatted currency string to number
 *
 * @param formattedAmount - Formatted currency string
 * @param currencyCode - Expected currency code
 * @returns Numeric amount
 *
 * @example
 * parseCurrency("1234.56 €", "EUR") // 1234.56
 * parseCurrency("$1,234.56", "USD") // 1234.56
 */
export declare function parseCurrency(formattedAmount: string, currencyCode: string): number;
/**
 * Convert between currencies
 * NOTE: This is a placeholder - real implementation would fetch live rates
 *
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param exchangeRate - Exchange rate (optional, from external API)
 * @returns Converted amount
 */
export declare function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, exchangeRate?: number): number;
export declare const CurrencyFormatter: {
    isValid: typeof isValidCurrency;
    getInfo: typeof getCurrencyInfo;
    format: typeof formatCurrency;
    formatForXml: typeof formatAmountForXml;
    parse: typeof parseCurrency;
    convert: typeof convertCurrency;
};
export {};
//# sourceMappingURL=CurrencyFormatter.d.ts.map