"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyFormatter = void 0;
exports.isValidCurrency = isValidCurrency;
exports.getCurrencyInfo = getCurrencyInfo;
exports.formatCurrency = formatCurrency;
exports.formatAmountForXml = formatAmountForXml;
exports.parseCurrency = parseCurrency;
exports.convertCurrency = convertCurrency;
const types_1 = require("../types");
const CURRENCY_INFO = new Map([
    [types_1.CurrencyCode.EUR, {
            code: 'EUR',
            symbol: '€',
            name: 'Euro',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.USD, {
            code: 'USD',
            symbol: '$',
            name: 'US Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.GBP, {
            code: 'GBP',
            symbol: '£',
            name: 'British Pound',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.CHF, {
            code: 'CHF',
            symbol: 'CHF',
            name: 'Swiss Franc',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.JPY, {
            code: 'JPY',
            symbol: '¥',
            name: 'Japanese Yen',
            decimalPlaces: 0,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.CAD, {
            code: 'CAD',
            symbol: 'CA$',
            name: 'Canadian Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.AUD, {
            code: 'AUD',
            symbol: 'A$',
            name: 'Australian Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.CNY, {
            code: 'CNY',
            symbol: '¥',
            name: 'Chinese Yuan',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.SEK, {
            code: 'SEK',
            symbol: 'kr',
            name: 'Swedish Krona',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.NOK, {
            code: 'NOK',
            symbol: 'kr',
            name: 'Norwegian Krone',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.DKK, {
            code: 'DKK',
            symbol: 'kr',
            name: 'Danish Krone',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.PLN, {
            code: 'PLN',
            symbol: 'zł',
            name: 'Polish Zloty',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.CZK, {
            code: 'CZK',
            symbol: 'Kč',
            name: 'Czech Koruna',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.HUF, {
            code: 'HUF',
            symbol: 'Ft',
            name: 'Hungarian Forint',
            decimalPlaces: 0,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.RON, {
            code: 'RON',
            symbol: 'lei',
            name: 'Romanian Leu',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.BRL, {
            code: 'BRL',
            symbol: 'R$',
            name: 'Brazilian Real',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.MXN, {
            code: 'MXN',
            symbol: '$',
            name: 'Mexican Peso',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.ZAR, {
            code: 'ZAR',
            symbol: 'R',
            name: 'South African Rand',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.INR, {
            code: 'INR',
            symbol: '₹',
            name: 'Indian Rupee',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.SGD, {
            code: 'SGD',
            symbol: 'S$',
            name: 'Singapore Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.HKD, {
            code: 'HKD',
            symbol: 'HK$',
            name: 'Hong Kong Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.NZD, {
            code: 'NZD',
            symbol: 'NZ$',
            name: 'New Zealand Dollar',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.TRY, {
            code: 'TRY',
            symbol: '₺',
            name: 'Turkish Lira',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.RUB, {
            code: 'RUB',
            symbol: '₽',
            name: 'Russian Ruble',
            decimalPlaces: 2,
            symbolPosition: 'after',
        }],
    [types_1.CurrencyCode.AED, {
            code: 'AED',
            symbol: 'د.إ',
            name: 'UAE Dirham',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.SAR, {
            code: 'SAR',
            symbol: 'ر.س',
            name: 'Saudi Riyal',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.THB, {
            code: 'THB',
            symbol: '฿',
            name: 'Thai Baht',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
    [types_1.CurrencyCode.MYR, {
            code: 'MYR',
            symbol: 'RM',
            name: 'Malaysian Ringgit',
            decimalPlaces: 2,
            symbolPosition: 'before',
        }],
]);
function isValidCurrency(code) {
    return CURRENCY_INFO.has(code.toUpperCase());
}
function getCurrencyInfo(code) {
    const info = CURRENCY_INFO.get(code.toUpperCase());
    if (!info) {
        throw new Error(`Unsupported currency code: ${code}`);
    }
    return info;
}
function formatCurrency(amount, currencyCode, options = {}) {
    const { showSymbol = true, showCode = false, useGrouping = true, } = options;
    const info = getCurrencyInfo(currencyCode);
    const formattedAmount = amount.toFixed(info.decimalPlaces);
    const parts = formattedAmount.split('.');
    if (useGrouping) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    const numberStr = parts.join('.');
    let result = numberStr;
    if (showSymbol) {
        if (info.symbolPosition === 'before') {
            result = info.symbol + result;
        }
        else {
            result = result + ' ' + info.symbol;
        }
    }
    if (showCode) {
        result = result + ' ' + info.code;
    }
    return result;
}
function formatAmountForXml(amount) {
    return amount.toFixed(2);
}
function parseCurrency(formattedAmount, currencyCode) {
    const info = getCurrencyInfo(currencyCode);
    let cleanStr = formattedAmount.replace(info.symbol, '').replace(info.code, '').trim();
    cleanStr = cleanStr.replace(/[\s,]/g, '');
    const amount = parseFloat(cleanStr);
    if (isNaN(amount)) {
        throw new Error(`Invalid currency amount: ${formattedAmount}`);
    }
    return amount;
}
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRate) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    if (!exchangeRate) {
        throw new Error('Exchange rate required for currency conversion');
    }
    return amount * exchangeRate;
}
exports.CurrencyFormatter = {
    isValid: isValidCurrency,
    getInfo: getCurrencyInfo,
    format: formatCurrency,
    formatForXml: formatAmountForXml,
    parse: parseCurrency,
    convert: convertCurrency,
};
//# sourceMappingURL=CurrencyFormatter.js.map