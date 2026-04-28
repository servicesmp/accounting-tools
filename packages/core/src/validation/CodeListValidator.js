"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeListValidator = void 0;
exports.getDefaultCodeListValidator = getDefaultCodeListValidator;
exports.isValidCode = isValidCode;
exports.validateInvoiceCodes = validateInvoiceCodes;
const fast_xml_parser_1 = require("fast-xml-parser");
const ISO4217 = Object.freeze(new Set([
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV',
    'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
    'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE',
    'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD',
    'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD',
    'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD',
    'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD',
    'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA',
    'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV',
    'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB',
    'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB',
    'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL',
    'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT',
    'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN',
    'UYI', 'UYU', 'UYW', 'UZS', 'VED', 'VES', 'VND', 'VUV', 'WST', 'XAF',
    'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF', 'XPD',
    'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW', 'ZWL',
    'HRK',
]));
const ISO3166 = Object.freeze(new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
    'CH', 'GB', 'AL', 'AD', 'AM', 'AZ', 'BY', 'BA', 'GE', 'MD',
    'MC', 'ME', 'MK', 'RS', 'RU', 'SM', 'TR', 'UA', 'VA', 'XK',
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
    'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
    'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
    'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
    'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
    'TN', 'UG', 'ZM', 'ZW',
    'AG', 'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO',
    'CR', 'CU', 'DM', 'DO', 'EC', 'SV', 'GD', 'GT', 'GY', 'HT',
    'HN', 'JM', 'MX', 'NI', 'PA', 'PY', 'PE', 'KN', 'LC', 'VC',
    'SR', 'TT', 'US', 'UY', 'VE',
    'AF', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CX', 'CC', 'GE',
    'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KP',
    'KR', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM',
    'NP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'LK', 'SY',
    'TW', 'TJ', 'TH', 'TL', 'TM', 'AE', 'UZ', 'VN', 'YE',
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS',
    'SB', 'TO', 'TV', 'VU',
    'AW', 'AI', 'AQ', 'AS', 'BM', 'BQ', 'BV', 'IO', 'VG', 'VI',
    'KY', 'CK', 'CW', 'FK', 'FO', 'GF', 'PF', 'TF', 'GI', 'GL',
    'GP', 'GU', 'GG', 'HM', 'IM', 'JE', 'MQ', 'YT', 'MS', 'NC',
    'NU', 'NF', 'MP', 'PN', 'PR', 'RE', 'BL', 'SH', 'MF', 'PM',
    'SX', 'GS', 'SJ', 'TC', 'UM', 'WF', 'EH', 'AX',
]));
const UNTDID1001 = Object.freeze(new Set([
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
    '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
    '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
    '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
    '81', '82', '83', '84', '85', '86', '87', '88', '89', '130',
    '202', '203', '204', '211', '261', '262', '295', '296', '308',
    '325', '326', '380', '381', '382', '383', '384', '385', '386',
    '387', '388', '389', '390', '393', '394', '395', '396', '420',
    '456', '457', '458', '527', '553', '575', '580', '623', '633',
    '751', '780', '875', '876', '877',
]));
const UNTDID5305 = Object.freeze(new Set([
    'A',
    'AA',
    'AB',
    'AC',
    'AD',
    'AE',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'O',
    'S',
    'Z',
]));
const UNTDID4461 = Object.freeze(new Set([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '50',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59',
    '60',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '70',
    '74',
    '75',
    '76',
    '77',
    '78',
    '91',
    '92',
    '93',
    '94',
    '95',
    '96',
    '97',
    'ZZZ',
]));
const UNECE20 = Object.freeze(new Set([
    'C62',
    'H87',
    'EA',
    'SET',
    'PR',
    'DZN',
    'GRO',
    'PCE',
    'NAR',
    'NPR',
    'BX',
    'CT',
    'CS',
    'PK',
    'BG',
    'RL',
    'SH',
    'BT',
    'CL',
    'DR',
    'HUR',
    'DAY',
    'WEE',
    'MON',
    'ANN',
    'MIN',
    'SEC',
    'KGM',
    'GRM',
    'MGM',
    'TNE',
    'LBR',
    'ONZ',
    'DTN',
    'CTM',
    'MTR',
    'CMT',
    'MMT',
    'KMT',
    'DMT',
    'INH',
    'FOT',
    'YRD',
    'SMI',
    'NMI',
    'A11',
    'A71',
    'MTK',
    'CMK',
    'MMK',
    'KMK',
    'DMK',
    'INK',
    'FTK',
    'YDK',
    'HAR',
    'ACR',
    'MTQ',
    'CMQ',
    'MMQ',
    'LTR',
    'MLT',
    'CLT',
    'DLT',
    'HLT',
    'DMQ',
    'FTQ',
    'INQ',
    'GLI',
    'GLL',
    'PTI',
    'QTI',
    'OZI',
    'OZA',
    'BLL',
    'MTS',
    'KMH',
    'KNT',
    'CEL',
    'FAH',
    'KEL',
    'AMP',
    'VLT',
    'OHM',
    'WHR',
    'KWH',
    'MWH',
    'GWH',
    'WTT',
    'KWT',
    'MAW',
    'JOU',
    'KJO',
    'MJO',
    'GJO',
    'CAL',
    'BAR',
    'MBR',
    'KPA',
    'PAL',
    'ATM',
    'PSI',
    'E36',
    'E37',
    'AD',
    '4L',
    'E34',
    'E35',
    'P1',
    'E99',
    'LM',
    'LS',
    'XPP',
    'XBX',
    'XCT',
    'XPK',
    'XPA',
    'XSA',
    'XPL',
    'XTU',
    'XOW',
    'D64',
    'D63',
    'KWO',
    'MQH',
    'LPH',
    'A86',
    'A59',
    'E27',
    'XUN',
]));
const EAS = Object.freeze(new Set([
    '0002',
    '0007',
    '0009',
    '0037',
    '0060',
    '0088',
    '0096',
    '0097',
    '0106',
    '0130',
    '0135',
    '0142',
    '0151',
    '0170',
    '0183',
    '0184',
    '0188',
    '0190',
    '0191',
    '0192',
    '0193',
    '0194',
    '0195',
    '0196',
    '0198',
    '0199',
    '0200',
    '0201',
    '0202',
    '0203',
    '0204',
    '0205',
    '0208',
    '0209',
    '0210',
    '0211',
    '0212',
    '0213',
    '0215',
    '0216',
    '0218',
    '0221',
    '0230',
    '9901',
    '9902',
    '9904',
    '9905',
    '9906',
    '9907',
    '9910',
    '9913',
    '9914',
    '9915',
    '9918',
    '9919',
    '9920',
    '9921',
    '9922',
    '9923',
    '9924',
    '9925',
    '9926',
    '9927',
    '9928',
    '9929',
    '9930',
    '9931',
    '9932',
    '9933',
    '9934',
    '9935',
    '9936',
    '9937',
    '9938',
    '9939',
    '9940',
    '9941',
    '9942',
    '9943',
    '9944',
    '9945',
    '9946',
    '9947',
    '9948',
    '9949',
    '9950',
    '9951',
    '9952',
    '9953',
    '9955',
    '9957',
    '9958',
    'EM',
]));
const ICD = Object.freeze(new Set([
    '0002',
    '0003',
    '0004',
    '0007',
    '0008',
    '0009',
    '0010',
    '0011',
    '0012',
    '0013',
    '0014',
    '0015',
    '0016',
    '0017',
    '0018',
    '0019',
    '0020',
    '0021',
    '0022',
    '0023',
    '0024',
    '0025',
    '0026',
    '0027',
    '0028',
    '0029',
    '0030',
    '0031',
    '0032',
    '0033',
    '0034',
    '0035',
    '0036',
    '0037',
    '0038',
    '0039',
    '0040',
    '0041',
    '0042',
    '0043',
    '0044',
    '0045',
    '0046',
    '0047',
    '0048',
    '0049',
    '0050',
    '0051',
    '0052',
    '0053',
    '0054',
    '0055',
    '0056',
    '0057',
    '0058',
    '0059',
    '0060',
    '0061',
    '0062',
    '0063',
    '0064',
    '0065',
    '0066',
    '0067',
    '0068',
    '0069',
    '0070',
    '0071',
    '0072',
    '0073',
    '0074',
    '0075',
    '0076',
    '0077',
    '0078',
    '0079',
    '0080',
    '0081',
    '0082',
    '0083',
    '0084',
    '0085',
    '0086',
    '0087',
    '0088',
    '0089',
    '0090',
    '0091',
    '0093',
    '0094',
    '0095',
    '0096',
    '0097',
    '0098',
    '0099',
    '0100',
    '0101',
    '0102',
    '0104',
    '0105',
    '0106',
    '0107',
    '0108',
    '0109',
    '0110',
    '0111',
    '0112',
    '0113',
    '0114',
    '0115',
    '0116',
    '0117',
    '0118',
    '0119',
    '0120',
    '0121',
    '0122',
    '0123',
    '0124',
    '0125',
    '0126',
    '0127',
    '0128',
    '0129',
    '0130',
    '0131',
    '0132',
    '0133',
    '0134',
    '0135',
    '0136',
    '0137',
    '0138',
    '0139',
    '0140',
    '0141',
    '0142',
    '0143',
    '0144',
    '0145',
    '0146',
    '0147',
    '0148',
    '0149',
    '0150',
    '0151',
    '0152',
    '0153',
    '0154',
    '0155',
    '0156',
    '0157',
    '0158',
    '0159',
    '0160',
    '0161',
    '0170',
    '0171',
    '0172',
    '0173',
    '0174',
    '0175',
    '0176',
    '0177',
    '0178',
    '0179',
    '0180',
    '0183',
    '0184',
    '0185',
    '0186',
    '0187',
    '0188',
    '0189',
    '0190',
    '0191',
    '0192',
    '0193',
    '0194',
    '0195',
    '0196',
    '0197',
    '0198',
    '0199',
    '0200',
    '0201',
    '0202',
    '0203',
    '0204',
    '0205',
    '0206',
    '0207',
    '0208',
    '0209',
    '0210',
    '0211',
    '0212',
    '0213',
    '0215',
    '0216',
    '0217',
    '0218',
    '0219',
    '0220',
    '0221',
    '0230',
]));
const CODE_LISTS = new Map([
    ['ISO4217', ISO4217],
    ['ISO3166', ISO3166],
    ['UNTDID1001', UNTDID1001],
    ['UNTDID5305', UNTDID5305],
    ['UNTDID4461', UNTDID4461],
    ['UNECE20', UNECE20],
    ['EAS', EAS],
    ['ICD', ICD],
]);
class CodeListValidator {
    constructor() {
        this.codeLists = CODE_LISTS;
        this.xmlMappings = Object.freeze(this.buildXmlMappings());
    }
    validateCode(value, codeList) {
        const list = this.codeLists.get(codeList);
        if (!list) {
            return false;
        }
        return list.has(value);
    }
    validateInvoiceCodes(xmlContent) {
        const errors = [];
        let parsed;
        try {
            const parser = new fast_xml_parser_1.XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
                textNodeName: '#text',
                parseAttributeValue: false,
                parseTagValue: false,
                trimValues: true,
                processEntities: false,
                allowBooleanAttributes: true,
                isArray: (_tagName, _jPath, isLeafNode, isAttribute) => {
                    if (isAttribute)
                        return false;
                    if (!isLeafNode)
                        return false;
                    return false;
                },
            });
            parsed = parser.parse(xmlContent);
        }
        catch (_error) {
            return {
                isValid: false,
                errors: Object.freeze([{
                        field: 'XML',
                        value: '',
                        codeList: '',
                        message: `Failed to parse XML: ${_error instanceof Error ? _error.message : 'Unknown parse error'}`,
                    }]),
            };
        }
        const root = this.findRoot(parsed);
        if (!root) {
            return {
                isValid: true,
                errors: Object.freeze([]),
            };
        }
        for (const mapping of this.xmlMappings) {
            const values = mapping.extract(root);
            for (const value of values) {
                if (value && !this.validateCode(value, mapping.codeList)) {
                    errors.push({
                        field: mapping.field,
                        value,
                        codeList: mapping.codeList,
                        message: `Invalid ${mapping.codeList} code '${value}' in ${mapping.field}`,
                    });
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors: Object.freeze(errors),
        };
    }
    getCodeList(name) {
        const list = this.codeLists.get(name);
        if (!list) {
            return Object.freeze(new Set());
        }
        return list;
    }
    getSupportedCodeLists() {
        return Object.freeze(Array.from(this.codeLists.keys()));
    }
    getCodeListSize(name) {
        const list = this.codeLists.get(name);
        return list ? list.size : 0;
    }
    findRoot(parsed) {
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        const rootKeys = [
            'rsm:CrossIndustryInvoice',
            'CrossIndustryInvoice',
            'rsm\\:CrossIndustryInvoice',
        ];
        for (const key of rootKeys) {
            if (parsed[key]) {
                return parsed[key];
            }
        }
        for (const key of Object.keys(parsed)) {
            if (key.includes('CrossIndustryInvoice')) {
                return parsed[key];
            }
        }
        return null;
    }
    extractValues(obj, path) {
        if (obj === null || obj === undefined) {
            return [];
        }
        const parts = path.split('.');
        let current = [obj];
        for (const part of parts) {
            const next = [];
            for (const node of current) {
                if (node === null || node === undefined || typeof node !== 'object') {
                    continue;
                }
                const child = node[part];
                if (child === null || child === undefined) {
                    continue;
                }
                if (Array.isArray(child)) {
                    next.push(...child);
                }
                else {
                    next.push(child);
                }
            }
            current = next;
        }
        const results = [];
        for (const val of current) {
            if (val === null || val === undefined) {
                continue;
            }
            if (typeof val === 'object' && '#text' in val) {
                results.push(String(val['#text']));
            }
            else if (typeof val !== 'object') {
                results.push(String(val));
            }
        }
        return results;
    }
    extractAttribute(obj, path, attribute) {
        if (obj === null || obj === undefined) {
            return [];
        }
        const parts = path.split('.');
        let current = [obj];
        for (const part of parts) {
            const next = [];
            for (const node of current) {
                if (node === null || node === undefined || typeof node !== 'object') {
                    continue;
                }
                const child = node[part];
                if (child === null || child === undefined) {
                    continue;
                }
                if (Array.isArray(child)) {
                    next.push(...child);
                }
                else {
                    next.push(child);
                }
            }
            current = next;
        }
        const results = [];
        const attrKey = `@_${attribute}`;
        for (const val of current) {
            if (val === null || val === undefined || typeof val !== 'object') {
                continue;
            }
            if (attrKey in val) {
                results.push(String(val[attrKey]));
            }
        }
        return results;
    }
    buildXmlMappings() {
        return [
            {
                field: 'ram:InvoiceCurrencyCode',
                codeList: 'ISO4217',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:InvoiceCurrencyCode'),
            },
            {
                field: 'ram:TaxCurrencyCode',
                codeList: 'ISO4217',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:TaxCurrencyCode'),
            },
            {
                field: 'SellerTradeParty/ram:CountryID',
                codeList: 'ISO3166',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty.ram:PostalTradeAddress.ram:CountryID'),
            },
            {
                field: 'BuyerTradeParty/ram:CountryID',
                codeList: 'ISO3166',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty.ram:PostalTradeAddress.ram:CountryID'),
            },
            {
                field: 'ShipToTradeParty/ram:CountryID',
                codeList: 'ISO3166',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeDelivery.ram:ShipToTradeParty.ram:PostalTradeAddress.ram:CountryID'),
            },
            {
                field: 'TaxRepresentativeTradeParty/ram:CountryID',
                codeList: 'ISO3166',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTaxRepresentativeTradeParty.ram:PostalTradeAddress.ram:CountryID'),
            },
            {
                field: 'ExchangedDocument/ram:TypeCode',
                codeList: 'UNTDID1001',
                extract: (root) => this.extractValues(root, 'rsm:ExchangedDocument.ram:TypeCode'),
            },
            {
                field: 'ApplicableTradeTax/ram:CategoryCode',
                codeList: 'UNTDID5305',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:ApplicableTradeTax.ram:CategoryCode'),
            },
            {
                field: 'LineTax/ram:CategoryCode',
                codeList: 'UNTDID5305',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:IncludedSupplyChainTradeLineItem.ram:SpecifiedLineTradeSettlement.ram:ApplicableTradeTax.ram:CategoryCode'),
            },
            {
                field: 'SpecifiedTradeSettlementPaymentMeans/ram:TypeCode',
                codeList: 'UNTDID4461',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementPaymentMeans.ram:TypeCode'),
            },
            {
                field: 'BilledQuantity/@unitCode',
                codeList: 'UNECE20',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:IncludedSupplyChainTradeLineItem.ram:SpecifiedLineTradeDelivery.ram:BilledQuantity', 'unitCode'),
            },
            {
                field: 'SellerURIUniversalCommunication/@schemeID',
                codeList: 'EAS',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty.ram:URIUniversalCommunication.ram:URIID', 'schemeID'),
            },
            {
                field: 'BuyerURIUniversalCommunication/@schemeID',
                codeList: 'EAS',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty.ram:URIUniversalCommunication.ram:URIID', 'schemeID'),
            },
            {
                field: 'SellerSpecifiedLegalOrganization/@schemeID',
                codeList: 'ICD',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty.ram:SpecifiedLegalOrganization.ram:ID', 'schemeID'),
            },
            {
                field: 'BuyerSpecifiedLegalOrganization/@schemeID',
                codeList: 'ICD',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty.ram:SpecifiedLegalOrganization.ram:ID', 'schemeID'),
            },
        ];
    }
}
exports.CodeListValidator = CodeListValidator;
let defaultCodeListValidator = null;
function getDefaultCodeListValidator() {
    if (!defaultCodeListValidator) {
        defaultCodeListValidator = new CodeListValidator();
    }
    return defaultCodeListValidator;
}
function isValidCode(value, codeList) {
    return getDefaultCodeListValidator().validateCode(value, codeList);
}
function validateInvoiceCodes(xmlContent) {
    return getDefaultCodeListValidator().validateInvoiceCodes(xmlContent);
}
//# sourceMappingURL=CodeListValidator.js.map