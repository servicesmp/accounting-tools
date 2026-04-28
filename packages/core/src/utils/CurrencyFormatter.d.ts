interface CurrencyInfo {
    readonly code: string;
    readonly symbol: string;
    readonly name: string;
    readonly decimalPlaces: number;
    readonly symbolPosition: 'before' | 'after';
}
export declare function isValidCurrency(code: string): boolean;
export declare function getCurrencyInfo(code: string): CurrencyInfo;
export declare function formatCurrency(amount: number, currencyCode: string, options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    useGrouping?: boolean;
}): string;
export declare function formatAmountForXml(amount: number): string;
export declare function parseCurrency(formattedAmount: string, currencyCode: string): number;
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