"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegionalConfigOrDefault = exports.getRegionalConfig = exports.REGIONAL_CONFIGS = exports.isValidAmount = exports.formatAmount = exports.formatDateFacturX = exports.getProfilePolicy = exports.getGuidelineUrn = exports.PATTERNS = exports.VALIDATION_LIMITS = exports.DATE_FORMAT_CODE = exports.PROFILE_POLICIES = exports.GUIDELINE_URNS = exports.XML_NAMESPACES = void 0;
const types_1 = require("../types");
exports.XML_NAMESPACES = Object.freeze({
    QDT: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
    RAM: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
    RSM: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    UDT: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
    XSI: 'http://www.w3.org/2001/XMLSchema-instance',
});
exports.GUIDELINE_URNS = new Map([
    [types_1.FacturxProfile.MINIMUM, 'urn:factur-x.eu:1p0:minimum'],
    [types_1.FacturxProfile.BASICWL, 'urn:factur-x.eu:1p0:basicwl'],
    [
        types_1.FacturxProfile.BASIC,
        'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic',
    ],
    [types_1.FacturxProfile.EN16931, 'urn:cen.eu:en16931:2017'],
    [
        types_1.FacturxProfile.EXTENDED,
        'urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended',
    ],
]);
const createProfilePolicy = (profile, mandatoryFields, forbiddenFields) => Object.freeze({
    profile,
    mandatoryFields: Object.freeze(mandatoryFields),
    forbiddenFields: Object.freeze(forbiddenFields),
    guidelineUrn: exports.GUIDELINE_URNS.get(profile),
});
exports.PROFILE_POLICIES = new Map([
    [
        types_1.FacturxProfile.MINIMUM,
        createProfilePolicy(types_1.FacturxProfile.MINIMUM, [
            'header.id',
            'header.invoiceDate',
            'header.typeCode',
            'seller.name',
            'buyer.name',
            'totals.grandTotal',
        ], [
            'lines',
            'payment.iban',
            'payment.bic',
            'header.purchaseOrderReference',
        ]),
    ],
    [
        types_1.FacturxProfile.BASICWL,
        createProfilePolicy(types_1.FacturxProfile.BASICWL, [
            'header.id',
            'header.invoiceDate',
            'header.typeCode',
            'seller.name',
            'seller.address',
            'buyer.name',
            'buyer.address',
            'totals.grandTotal',
            'totals.taxTotal',
        ], ['lines']),
    ],
    [
        types_1.FacturxProfile.BASIC,
        createProfilePolicy(types_1.FacturxProfile.BASIC, [
            'header.id',
            'header.invoiceDate',
            'header.typeCode',
            'seller.name',
            'seller.address',
            'buyer.name',
            'buyer.address',
            'lines',
            'totals.grandTotal',
            'totals.taxTotal',
        ], []),
    ],
    [
        types_1.FacturxProfile.EN16931,
        createProfilePolicy(types_1.FacturxProfile.EN16931, [
            'header.id',
            'header.invoiceDate',
            'header.typeCode',
            'seller.name',
            'seller.address.city',
            'seller.address.postalCode',
            'seller.address.countryCode',
            'buyer.name',
            'buyer.address.city',
            'buyer.address.postalCode',
            'buyer.address.countryCode',
            'lines',
            'payment.meansCode',
            'totals.lineTotal',
            'totals.taxBasis',
            'totals.taxTotal',
            'totals.grandTotal',
        ], []),
    ],
    [
        types_1.FacturxProfile.EXTENDED,
        createProfilePolicy(types_1.FacturxProfile.EXTENDED, [
            'header.id',
            'header.invoiceDate',
            'header.typeCode',
            'seller.name',
            'seller.address',
            'buyer.name',
            'buyer.address',
            'lines',
            'payment',
            'totals.lineTotal',
            'totals.taxBasis',
            'totals.taxTotal',
            'totals.grandTotal',
        ], []),
    ],
]);
exports.DATE_FORMAT_CODE = '102';
exports.VALIDATION_LIMITS = Object.freeze({
    MAX_INVOICE_NUMBER_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_NOTE_LENGTH: 1000,
    MAX_EMAIL_LENGTH: 254,
    MAX_PHONE_LENGTH: 30,
    MAX_VAT_ID_LENGTH: 15,
    MAX_IBAN_LENGTH: 34,
    MAX_BIC_LENGTH: 11,
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 999999999.99,
    MAX_QUANTITY: 999999999.99,
    MAX_DECIMAL_PLACES: 2,
    MAX_LINES: 9999,
});
exports.PATTERNS = Object.freeze({
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^[+]?[0-9\s\-()]{6,30}$/,
    INVOICE_NUMBER: /^[A-Z0-9\-_]{1,50}$/,
    VAT_ID: /^[A-Z]{2}[A-Z0-9]{2,13}$/,
    COUNTRY_CODE: /^[A-Z]{2}$/,
    CURRENCY_CODE: /^[A-Z]{3}$/,
    IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/,
    BIC: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
});
const getGuidelineUrn = (profile) => {
    const urn = exports.GUIDELINE_URNS.get(profile);
    if (!urn) {
        throw new Error(`Unknown profile: ${profile}`);
    }
    return urn;
};
exports.getGuidelineUrn = getGuidelineUrn;
const getProfilePolicy = (profile) => {
    const policy = exports.PROFILE_POLICIES.get(profile);
    if (!policy) {
        throw new Error(`Unknown profile: ${profile}`);
    }
    return policy;
};
exports.getProfilePolicy = getProfilePolicy;
const formatDateFacturX = (date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return year + month + day;
};
exports.formatDateFacturX = formatDateFacturX;
const formatAmount = (amount) => {
    return amount.toFixed(2);
};
exports.formatAmount = formatAmount;
const isValidAmount = (amount) => {
    return (!isNaN(amount) &&
        isFinite(amount) &&
        amount >= exports.VALIDATION_LIMITS.MIN_AMOUNT &&
        amount <= exports.VALIDATION_LIMITS.MAX_AMOUNT);
};
exports.isValidAmount = isValidAmount;
exports.REGIONAL_CONFIGS = new Map([
    ['FR', {
            countryCode: 'FR',
            compliance: types_1.ComplianceType.FACTUR_X,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'fr',
            taxIdLabel: 'TVA',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: ' ',
            },
        }],
    ['DE', {
            countryCode: 'DE',
            compliance: types_1.ComplianceType.FACTUR_X,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'de',
            taxIdLabel: 'USt-IdNr.',
            dateFormat: 'DD.MM.YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['GB', {
            countryCode: 'GB',
            compliance: types_1.ComplianceType.UBL,
            defaultCurrency: types_1.CurrencyCode.GBP,
            defaultLanguage: 'en',
            taxIdLabel: 'VAT',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['US', {
            countryCode: 'US',
            compliance: types_1.ComplianceType.UBL,
            defaultCurrency: types_1.CurrencyCode.USD,
            defaultLanguage: 'en',
            taxIdLabel: 'Tax ID',
            dateFormat: 'MM/DD/YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['CH', {
            countryCode: 'CH',
            compliance: types_1.ComplianceType.SWISS_EINVOICE,
            defaultCurrency: types_1.CurrencyCode.CHF,
            defaultLanguage: 'de',
            taxIdLabel: 'MWST',
            dateFormat: 'DD.MM.YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: '\'',
            },
        }],
    ['IT', {
            countryCode: 'IT',
            compliance: types_1.ComplianceType.FATTURA_PA,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'it',
            taxIdLabel: 'P.IVA',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['ES', {
            countryCode: 'ES',
            compliance: types_1.ComplianceType.FACTURAE,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'es',
            taxIdLabel: 'NIF/CIF',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['NL', {
            countryCode: 'NL',
            compliance: types_1.ComplianceType.UBL_OHNL,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'nl',
            taxIdLabel: 'BTW',
            dateFormat: 'DD-MM-YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['BE', {
            countryCode: 'BE',
            compliance: types_1.ComplianceType.BELGIAN_EINVOICE,
            defaultCurrency: types_1.CurrencyCode.EUR,
            defaultLanguage: 'nl',
            taxIdLabel: 'BTW',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['PL', {
            countryCode: 'PL',
            compliance: types_1.ComplianceType.PEPPOL,
            defaultCurrency: types_1.CurrencyCode.PLN,
            defaultLanguage: 'pl',
            taxIdLabel: 'NIP',
            dateFormat: 'DD.MM.YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: ' ',
            },
        }],
    ['SE', {
            countryCode: 'SE',
            compliance: types_1.ComplianceType.PEPPOL,
            defaultCurrency: types_1.CurrencyCode.SEK,
            defaultLanguage: 'sv',
            taxIdLabel: 'Momsnr',
            dateFormat: 'YYYY-MM-DD',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: ' ',
            },
        }],
    ['NO', {
            countryCode: 'NO',
            compliance: types_1.ComplianceType.PEPPOL,
            defaultCurrency: types_1.CurrencyCode.NOK,
            defaultLanguage: 'no',
            taxIdLabel: 'MVA',
            dateFormat: 'DD.MM.YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: ' ',
            },
        }],
    ['DK', {
            countryCode: 'DK',
            compliance: types_1.ComplianceType.PEPPOL,
            defaultCurrency: types_1.CurrencyCode.DKK,
            defaultLanguage: 'da',
            taxIdLabel: 'CVR',
            dateFormat: 'DD-MM-YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['CA', {
            countryCode: 'CA',
            compliance: types_1.ComplianceType.UBL,
            defaultCurrency: types_1.CurrencyCode.CAD,
            defaultLanguage: 'en',
            taxIdLabel: 'GST/HST',
            dateFormat: 'YYYY-MM-DD',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['AU', {
            countryCode: 'AU',
            compliance: types_1.ComplianceType.UBL,
            defaultCurrency: types_1.CurrencyCode.AUD,
            defaultLanguage: 'en',
            taxIdLabel: 'ABN',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['JP', {
            countryCode: 'JP',
            compliance: types_1.ComplianceType.OTHER,
            defaultCurrency: types_1.CurrencyCode.JPY,
            defaultLanguage: 'ja',
            taxIdLabel: '法人番号',
            dateFormat: 'YYYY/MM/DD',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['CN', {
            countryCode: 'CN',
            compliance: types_1.ComplianceType.OTHER,
            defaultCurrency: types_1.CurrencyCode.CNY,
            defaultLanguage: 'zh',
            taxIdLabel: '税号',
            dateFormat: 'YYYY-MM-DD',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['BR', {
            countryCode: 'BR',
            compliance: types_1.ComplianceType.OTHER,
            defaultCurrency: types_1.CurrencyCode.BRL,
            defaultLanguage: 'pt',
            taxIdLabel: 'CNPJ',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: ',',
                thousandsSeparator: '.',
            },
        }],
    ['MX', {
            countryCode: 'MX',
            compliance: types_1.ComplianceType.OTHER,
            defaultCurrency: types_1.CurrencyCode.MXN,
            defaultLanguage: 'es',
            taxIdLabel: 'RFC',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['IN', {
            countryCode: 'IN',
            compliance: types_1.ComplianceType.OTHER,
            defaultCurrency: types_1.CurrencyCode.INR,
            defaultLanguage: 'en',
            taxIdLabel: 'GSTIN',
            dateFormat: 'DD-MM-YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
    ['SG', {
            countryCode: 'SG',
            compliance: types_1.ComplianceType.PEPPOL,
            defaultCurrency: types_1.CurrencyCode.SGD,
            defaultLanguage: 'en',
            taxIdLabel: 'GST',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: {
                decimalSeparator: '.',
                thousandsSeparator: ',',
            },
        }],
]);
const getRegionalConfig = (countryCode) => {
    return exports.REGIONAL_CONFIGS.get(countryCode.toUpperCase());
};
exports.getRegionalConfig = getRegionalConfig;
const getRegionalConfigOrDefault = (countryCode, fallbackCode = 'FR') => {
    return (0, exports.getRegionalConfig)(countryCode) || (0, exports.getRegionalConfig)(fallbackCode);
};
exports.getRegionalConfigOrDefault = getRegionalConfigOrDefault;
//# sourceMappingURL=constants.js.map