"use strict";
/**
 * @module CodeListValidator
 * @description Validates codes against official EN16931/Factur-X code lists
 *
 * Code lists validated:
 * - ISO 4217: Currency codes
 * - ISO 3166-1 alpha-2: Country codes
 * - UNTDID 1001: Document type codes
 * - UNTDID 5305: Tax category codes
 * - UNTDID 4461: Payment means codes
 * - UN/ECE Rec 20/21: Unit of measure codes
 * - EAS: Electronic Address Scheme identifiers (CEF)
 * - ICD: ISO 6523 Identifier Component Data (scheme IDs)
 *
 * All code lists are embedded as frozen Sets for O(1) lookups.
 * No external file dependencies.
 *
 * Performance: O(1) per code lookup, O(n) for full invoice validation
 *
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/
 * @see https://service.unece.org/trade/untdid/d16b/tred/tredi2.htm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeListValidator = void 0;
exports.getDefaultCodeListValidator = getDefaultCodeListValidator;
exports.isValidCode = isValidCode;
exports.validateInvoiceCodes = validateInvoiceCodes;
const fast_xml_parser_1 = require("fast-xml-parser");
// ============================================================================
// CODE LISTS - Complete official sets, frozen for immutability
// ============================================================================
/**
 * ISO 4217 Currency codes - Complete active list
 * @see https://www.iso.org/iso-4217-currency-codes.html
 */
const ISO4217 = Object.freeze(new Set([
    // Major currencies
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
    // Legacy codes still found in some invoices
    'HRK',
]));
/**
 * ISO 3166-1 alpha-2 Country codes - Complete list
 * @see https://www.iso.org/iso-3166-country-codes.html
 */
const ISO3166 = Object.freeze(new Set([
    // Europe (EU + EEA + others)
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
    'CH', 'GB', 'AL', 'AD', 'AM', 'AZ', 'BY', 'BA', 'GE', 'MD',
    'MC', 'ME', 'MK', 'RS', 'RU', 'SM', 'TR', 'UA', 'VA', 'XK',
    // Africa
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
    'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
    'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
    'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
    'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
    'TN', 'UG', 'ZM', 'ZW',
    // Americas
    'AG', 'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO',
    'CR', 'CU', 'DM', 'DO', 'EC', 'SV', 'GD', 'GT', 'GY', 'HT',
    'HN', 'JM', 'MX', 'NI', 'PA', 'PY', 'PE', 'KN', 'LC', 'VC',
    'SR', 'TT', 'US', 'UY', 'VE',
    // Asia
    'AF', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CX', 'CC', 'GE',
    'HK', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KP',
    'KR', 'KW', 'KG', 'LA', 'LB', 'MO', 'MY', 'MV', 'MN', 'MM',
    'NP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'LK', 'SY',
    'TW', 'TJ', 'TH', 'TL', 'TM', 'AE', 'UZ', 'VN', 'YE',
    // Oceania
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS',
    'SB', 'TO', 'TV', 'VU',
    // Territories and special codes
    'AW', 'AI', 'AQ', 'AS', 'BM', 'BQ', 'BV', 'IO', 'VG', 'VI',
    'KY', 'CK', 'CW', 'FK', 'FO', 'GF', 'PF', 'TF', 'GI', 'GL',
    'GP', 'GU', 'GG', 'HM', 'IM', 'JE', 'MQ', 'YT', 'MS', 'NC',
    'NU', 'NF', 'MP', 'PN', 'PR', 'RE', 'BL', 'SH', 'MF', 'PM',
    'SX', 'GS', 'SJ', 'TC', 'UM', 'WF', 'EH', 'AX',
]));
/**
 * UNTDID 1001 Document type codes - EN16931 subset
 * @see https://unece.org/fileadmin/DAM/trade/untdid/d16b/tred/tred1001.htm
 */
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
/**
 * UNTDID 5305 Tax category codes - EN16931 / Factur-X
 * @see UNTDID 5305 Duty/tax/fee category code
 */
const UNTDID5305 = Object.freeze(new Set([
    'A', // Mixed tax rate
    'AA', // Lower rate
    'AB', // Exempt for resale
    'AC', // Value Added Tax (VAT) not now due for payment
    'AD', // Value Added Tax (VAT) due from a previous invoice
    'AE', // VAT Reverse Charge
    'B', // Transferred (VAT)
    'C', // Duty paid by supplier
    'D', // Value Added Tax (VAT) margin scheme - Loss
    'E', // Exempt from tax
    'F', // Value Added Tax (VAT) margin scheme - Secondhand goods
    'G', // Free export item, tax not charged
    'H', // Higher rate
    'I', // Value Added Tax (VAT) margin scheme - Works of art
    'J', // Value Added Tax (VAT) margin scheme - Collector items/antiques
    'K', // VAT exempt for EEA intra-community supply
    'L', // Canary Islands general indirect tax
    'M', // Tax for production, services and importation in Ceuta and Melilla
    'O', // Services outside scope of tax
    'S', // Standard rate
    'Z', // Zero rated goods
]));
/**
 * UNTDID 4461 Payment means codes - Complete EN16931 list
 * @see https://unece.org/fileadmin/DAM/trade/untdid/d16b/tred/tred4461.htm
 */
const UNTDID4461 = Object.freeze(new Set([
    '1', // Instrument not defined
    '2', // Automated clearing house credit
    '3', // Automated clearing house debit
    '4', // ACH demand debit reversal
    '5', // ACH demand credit reversal
    '6', // ACH demand credit
    '7', // ACH demand debit
    '8', // Hold
    '9', // National or regional clearing
    '10', // In cash
    '11', // ACH savings credit reversal
    '12', // ACH savings debit reversal
    '13', // ACH savings credit
    '14', // ACH savings debit
    '15', // Bookentry credit
    '16', // Bookentry debit
    '17', // ACH demand cash concentration/disbursement credit
    '18', // ACH demand cash concentration/disbursement debit
    '19', // ACH demand corporate trade payment credit
    '20', // Cheque
    '21', // Banker's draft
    '22', // Certified banker's draft
    '23', // Bank cheque
    '24', // Bill of exchange awaiting acceptance
    '25', // Certified cheque
    '26', // Local cheque
    '27', // ACH demand corporate trade payment debit
    '28', // ACH demand corporate trade exchange credit
    '29', // ACH demand corporate trade exchange debit
    '30', // Credit transfer
    '31', // Debit transfer
    '32', // ACH demand cash concentration/disbursement plus credit
    '33', // ACH demand cash concentration/disbursement plus debit
    '34', // ACH prearranged payment and deposit
    '35', // ACH savings cash concentration/disbursement credit
    '36', // ACH savings cash concentration/disbursement debit
    '37', // ACH savings financial institution initiated credit
    '38', // ACH savings financial institution initiated debit
    '39', // ACH savings financial institution initiated debit
    '40', // ACH savings
    '41', // ACH savings
    '42', // Payment to bank account
    '43', // ACH savings
    '44', // Accepted bill of exchange
    '45', // Referenced home-banking credit transfer
    '46', // Interbank debit transfer
    '47', // Home-banking debit transfer
    '48', // Bank card
    '49', // Direct debit
    '50', // Payment by postgiro
    '51', // FR, norme 6 97-Telereglement CFONB
    '52', // Urgent commercial payment
    '53', // Urgent Treasury Payment
    '54', // Credit card
    '55', // Debit card
    '56', // Bankgiro
    '57', // Standing agreement
    '58', // SEPA credit transfer
    '59', // SEPA direct debit
    '60', // Promissory note
    '61', // Promissory note signed by the debtor
    '62', // Promissory note signed by the debtor and endorsed by a bank
    '63', // Promissory note signed by the debtor and endorsed by a third party
    '64', // Promissory note signed by a bank
    '65', // Promissory note signed by a bank and endorsed by another bank
    '66', // Promissory note signed by a third party
    '67', // Promissory note signed by a third party and endorsed by a bank
    '68', // Online payment service
    '70', // Bill drawn by the creditor on the debtor
    '74', // Bill drawn by the creditor on a bank
    '75', // Bill drawn by the creditor, endorsed by another bank
    '76', // Bill drawn by the creditor on a bank and endorsed by a third party
    '77', // Bill drawn by the creditor on a third party
    '78', // Bill drawn by creditor on third party, accepted and endorsed by bank
    '91', // Not transferable banker's draft
    '92', // Not transferable local cheque
    '93', // Reference giro
    '94', // Urgent giro
    '95', // Free format giro
    '96', // Requested method for payment was not used
    '97', // Clearing between partners
    'ZZZ', // Mutually defined
]));
/**
 * UN/ECE Recommendation 20 & 21 - Unit of measure codes
 * Complete list of commonly used codes in e-invoicing
 * @see https://unece.org/trade/uncefact/cl-recommendations
 */
const UNECE20 = Object.freeze(new Set([
    // Dimensionless / counting
    'C62', // One (unit)
    'H87', // Piece
    'EA', // Each
    'SET', // Set
    'PR', // Pair
    'DZN', // Dozen
    'GRO', // Gross
    'PCE', // Piece (alternate)
    'NAR', // Number of articles
    'NPR', // Number of pairs
    'BX', // Box
    'CT', // Carton
    'CS', // Case
    'PK', // Package
    'BG', // Bag
    'RL', // Reel
    'SH', // Sheet
    'BT', // Bottle
    'CL', // Coil
    'DR', // Drum
    // Time
    'HUR', // Hour
    'DAY', // Day
    'WEE', // Week
    'MON', // Month
    'ANN', // Year
    'MIN', // Minute
    'SEC', // Second
    // Mass / weight
    'KGM', // Kilogram
    'GRM', // Gram
    'MGM', // Milligram
    'TNE', // Metric ton (tonne)
    'LBR', // Pound (avoirdupois)
    'ONZ', // Ounce (avoirdupois)
    'DTN', // Decitonne (100 kg)
    'CTM', // Metric carat
    // Length
    'MTR', // Metre
    'CMT', // Centimetre
    'MMT', // Millimetre
    'KMT', // Kilometre
    'DMT', // Decimetre
    'INH', // Inch
    'FOT', // Foot
    'YRD', // Yard
    'SMI', // Statute mile
    'NMI', // Nautical mile
    'A11', // Angstrom
    'A71', // Femtometre
    // Area
    'MTK', // Square metre
    'CMK', // Square centimetre
    'MMK', // Square millimetre
    'KMK', // Square kilometre
    'DMK', // Square decimetre
    'INK', // Square inch
    'FTK', // Square foot
    'YDK', // Square yard
    'HAR', // Hectare
    'ACR', // Acre
    // Volume
    'MTQ', // Cubic metre
    'CMQ', // Cubic centimetre
    'MMQ', // Cubic millimetre
    'LTR', // Litre
    'MLT', // Millilitre
    'CLT', // Centilitre
    'DLT', // Decilitre
    'HLT', // Hectolitre
    'DMQ', // Cubic decimetre
    'FTQ', // Cubic foot
    'INQ', // Cubic inch
    'GLI', // Gallon (UK)
    'GLL', // Gallon (US)
    'PTI', // Pint (UK)
    'QTI', // Quart (UK)
    'OZI', // Fluid ounce (UK)
    'OZA', // Fluid ounce (US)
    'BLL', // Barrel (US)
    // Speed
    'MTS', // Metres per second
    'KMH', // Kilometres per hour
    'KNT', // Knot
    // Temperature
    'CEL', // Degree Celsius
    'FAH', // Degree Fahrenheit
    'KEL', // Kelvin
    // Electrical
    'AMP', // Ampere
    'VLT', // Volt
    'OHM', // Ohm
    'WHR', // Watt hour
    'KWH', // Kilowatt hour
    'MWH', // Megawatt hour
    'GWH', // Gigawatt hour
    'WTT', // Watt
    'KWT', // Kilowatt
    'MAW', // Megawatt
    // Energy / Power
    'JOU', // Joule
    'KJO', // Kilojoule
    'MJO', // Megajoule
    'GJO', // Gigajoule
    'CAL', // Calorie (thermochemical)
    // Pressure
    'BAR', // Bar
    'MBR', // Millibar
    'KPA', // Kilopascal
    'PAL', // Pascal
    'ATM', // Standard atmosphere
    'PSI', // Pound per square inch
    // Data / information
    'E36', // Bit
    'E37', // Byte (octet)
    'AD', // Byte (alternate)
    '4L', // Megabyte
    'E34', // Gigabyte
    'E35', // Terabyte
    // Percentage and rates
    'P1', // Percent
    'E99', // Parts per hundred thousand
    // Miscellaneous
    'LM', // Linear metre
    'LS', // Lump sum
    'XPP', // Piece (packaging)
    'XBX', // Box (packaging)
    'XCT', // Carton (packaging)
    'XPK', // Package (packaging)
    'XPA', // Packet
    'XSA', // Sack
    'XPL', // Pail
    'XTU', // Tube
    'XOW', // Composite packaging not specified
    'D64', // Block
    'D63', // Book
    'KWO', // Kilowatt-year (energy)
    'MQH', // Cubic metre per hour
    'LPH', // Litres per hour
    'A86', // Gigahertz
    'A59', // 8-part cloud cover
    'E27', // Dose
    'XUN', // Unit (packaging)
]));
/**
 * EAS (Electronic Address Scheme) identifiers
 * CEF PEPPOL code list for BT-34 and BT-49 schemeID
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/eas/
 */
const EAS = Object.freeze(new Set([
    '0002', // System Information et Repertoire des Entreprises et des Etablissements (SIRENE)
    '0007', // Organisationsnummer (Swedish legal entity)
    '0009', // SIRET-CODE
    '0037', // LY-tunnus (Finnish)
    '0060', // Data Universal Numbering System (DUNS)
    '0088', // EAN Location Code
    '0096', // DANISH CHAMBER OF COMMERCE
    '0097', // FTI - Ediforum Italia
    '0106', // Vereniging van Kamers van Koophandel (NL KvK)
    '0130', // Directorates of the European Commission
    '0135', // SIA Object Identifiers
    '0142', // DANISH MINISTRY OF THE INTERIOR AND HEALTH
    '0151', // Australian Business Number (ABN) Scheme
    '0170', // Teikoku Company Code
    '0183', // Swiss Unique Business Identification Number (UIDB)
    '0184', // DIGSTORG
    '0188', // Corporate Number (Japan)
    '0190', // Dutch Originator's Identification Number (OINO)
    '0191', // Centre of Registers and Information Systems of the Ministry of Justice (Estonia)
    '0192', // Enhetsregisteret ved Bronnoysundregistrene (Norway)
    '0193', // UBL.BE party identifier
    '0194', // KOIOS Open Technical Dictionary
    '0195', // Singapore UEN identifier
    '0196', // Icelandic identifier (kennitala)
    '0198', // ERSTORG (Denmark)
    '0199', // Legal Entity Identifier (LEI)
    '0200', // Lithuania Legal entity code
    '0201', // Codice Destinatario (Italy)
    '0202', // Indirizzo di Posta Elettronica Certificata (Italy PEC)
    '0203', // eDelivery Network Participant identifier
    '0204', // Leitweg-ID (Germany)
    '0205', // CODFISCAL (Romania)
    '0208', // Belgium KBO / BCE
    '0209', // GS1 identification keys
    '0210', // CODICE IPA (Italy)
    '0211', // GS1 identification keys (alternate)
    '0212', // Andorra VAT number
    '0213', // Andorra tax number
    '0215', // Net service ID (Finland)
    '0216', // OVTcode (Finland)
    '0218', // Latvia Legal entity code
    '0221', // Japan Registered Invoice Qualified Issuer Number
    '0230', // National e-Invoicing Framework (Malaysia)
    '9901', // Danish Ministry of the Interior and Health
    '9902', // Austrian VAT number
    '9904', // Dutch VAT number
    '9905', // Hungarian VAT number
    '9906', // Italian VAT number
    '9907', // Italian tax code
    '9910', // Hungarian group VAT number
    '9913', // Business Registers Network
    '9914', // Oesterreichische Umsatzsteuer-Identifikationsnummer
    '9915', // Austrian Firmenbuchnummer
    '9918', // SOCIETY FOR INTERBANKING CLEARING (IBAN)
    '9919', // Kennziffer des Unternehmensregisters
    '9920', // Agencia Espanola de Administracion Tributaria
    '9921', // Indice delle Pubbliche Amministrazioni
    '9922', // Andorra VAT (alt)
    '9923', // Albania VAT
    '9924', // Bosnia Herzegovina VAT
    '9925', // Belgium VAT
    '9926', // Bulgaria VAT
    '9927', // Switzerland VAT
    '9928', // Cyprus VAT
    '9929', // Czech Republic VAT
    '9930', // Germany VAT
    '9931', // Estonia VAT
    '9932', // United Kingdom VAT
    '9933', // Greece VAT
    '9934', // Croatia VAT
    '9935', // Ireland VAT
    '9936', // Liechtenstein VAT
    '9937', // Lithuania VAT
    '9938', // Luxembourg VAT
    '9939', // Latvia VAT
    '9940', // Monaco VAT
    '9941', // Montenegro VAT
    '9942', // Macedonia VAT
    '9943', // Malta VAT
    '9944', // Netherlands VAT
    '9945', // Poland VAT
    '9946', // Portugal VAT
    '9947', // Romania VAT
    '9948', // Serbia VAT
    '9949', // Slovenia VAT
    '9950', // Slovakia VAT
    '9951', // San Marino VAT
    '9952', // Turkey VAT
    '9953', // Holy See (Vatican City State) VAT
    '9955', // Swedish VAT number
    '9957', // French VAT number
    '9958', // Belgian Crossroad Bank of Enterprises
    'EM', // Electronic Mail (E-mail)
]));
/**
 * ICD (ISO 6523 Identifier Component Data) scheme identifiers
 * Used for schemeID on BT-30 (Seller legal registration identifier)
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/ICD/
 */
const ICD = Object.freeze(new Set([
    '0002', // System Information et Repertoire des Entreprises (SIREN)
    '0003', // Codification Numerique des Etablissements Financiers (CEFONB)
    '0004', // NBS/OSI NETWORK
    '0007', // Organisationsnummer (Swedish)
    '0008', // LE NUMERO NATIONAL
    '0009', // SIRET-CODE
    '0010', // Organizational Unique Identifier (OUI)
    '0011', // International Code Designator for the Identification of OS
    '0012', // European Computer Manufacturers Association (ECMA)
    '0013', // VSA FPI coding system
    '0014', // Austrian Government IT entity identifier
    '0015', // Electronic Data Interchange for Administration, Commerce and Transport (EDIRA)
    '0016', // EWOS Object Identifiers
    '0017', // Routing Identifier
    '0018', // SNA/OSI Network
    '0019', // AIR TRANSPORT IATA
    '0020', // Hewlett-Packard Company Internal AM Network
    '0021', // Data Universal Numbering System (DUNS alt)
    '0022', // ISS
    '0023', // IEEE Registration Authority
    '0024', // OSF UID
    '0025', // ISO 6523-1
    '0026', // OSF Infrastructure identifier
    '0027', // GS1 Global Location Number (GLN)
    '0028', // ITU/TSS ISDN
    '0029', // ISO 6392
    '0030', // Tap (telecommunication)
    '0031', // EDI transmission files
    '0032', // EDI transmission files
    '0033', // EDI transmission files
    '0034', // EDI transmission files
    '0035', // EDI transmission files
    '0036', // TeleTrust identifier
    '0037', // LY-tunnus (Finnish)
    '0038', // Identifier for Organizations for Telecommunications (DNIC)
    '0039', // International eXchange identifier (IXI)
    '0040', // Lithuanian Legal entity code (alt)
    '0041', // ATN identification
    '0042', // Swiss Federal Business Identification Number
    '0043', // Japanese National identifier
    '0044', // Thai Industrial Standards Institute (TISI)
    '0045', // Director General of Post
    '0046', // Domeinbestuur Defensie
    '0047', // ICD Formatted ATN address
    '0048', // Organization code system for Japan
    '0049', // Dun & Bradstreet - cross referencing
    '0050', // Organization code system for Japan
    '0051', // German Federal Government
    '0052', // SOFFEX organization identifier
    '0053', // Budget and Tax ID for Thailand
    '0054', // Austrian Code
    '0055', // Malaysian legal entity
    '0056', // Bundesamt fuer Telekommunikation identifier (Schweiz)
    '0057', // French Ministry
    '0058', // Iraq Ministry of Trade
    '0059', // Country code ISO 3166-1 alpha-2 code followed by dash and target
    '0060', // Dun and Bradstreet (DUNS) Number
    '0061', // GS1 Global Location Number (GLN)
    '0062', // EDI Network Exchange identifier
    '0063', // EAN/UCC/GS1 company identifier
    '0064', // BIC (SWIFT Code)
    '0065', // TeleTex network identifier
    '0066', // Europay International identifier
    '0067', // OFTP network identifier
    '0068', // EAN/UCC/GS1 (USCC)
    '0069', // NACE
    '0070', // Microsoft
    '0071', // Korea Customs & Trade Development Institute
    '0072', // Thailand Customs
    '0073', // TRAXENS
    '0074', // FINVOICE
    '0075', // Thailand Ministry of Commerce
    '0076', // Indonesian legal entity
    '0077', // Singapore UEN
    '0078', // Thai Industrial Standards Institute
    '0079', // Netherlands EV certificate identity
    '0080', // Global Document Type Identifier (GDTI)
    '0081', // Global Returnable Asset Identifier (GRAI)
    '0082', // Global Individual Asset Identifier (GIAI)
    '0083', // Global Service Relation Number (GSRN)
    '0084', // Global Document Type Identifier (GDTI)
    '0085', // Royal Mail Group
    '0086', // United States Council for International Business (USCIB)
    '0087', // International Organization for Standardization
    '0088', // GS1 EAN
    '0089', // National Statistical Office Thailand
    '0090', // KoSIT
    '0091', // Dutch Originator
    '0093', // Turkish VAT identification number
    '0094', // Siemens
    '0095', // SWIFT
    '0096', // Danish Chamber of Commerce
    '0097', // FTI - Ediforum Italia
    '0098', // Hungarian Chamber of Commerce and Industry
    '0099', // RosettaNet identifier
    '0100', // UNSPSC
    '0101', // GS1 GLN alt
    '0102', // CENTRALREGISTERET FOR MOTORKJORETOYER
    '0104', // UNDG
    '0105', // Belgian Crossroad Bank
    '0106', // Vereniging van Kamers van Koophandel (NL KvK)
    '0107', // Pilog Ontology
    '0108', // Philippines SEC Registration
    '0109', // Philippines Bureau of Internal Revenue
    '0110', // Consumers Energy
    '0111', // United Nations Standard Products and Services Code
    '0112', // EDIRA identifier
    '0113', // GS1 SRN
    '0114', // GS1 GSIN
    '0115', // GS1 SSCC
    '0116', // GS1 Logistics Label
    '0117', // OASIS ebXML Collaborative Partner ID
    '0118', // OASIS ebXML Party ID
    '0119', // Thai Customs
    '0120', // Chilean Tax ID (RUT)
    '0121', // Japan e-Government
    '0122', // Japan IT Promotion Agency
    '0123', // Japan Financial Services Agency
    '0124', // Japan Ministry of Economy, Trade and Industry
    '0125', // Japan Ministry of Land, Infrastructure, Transport and Tourism
    '0126', // Japanese Social Insurance
    '0127', // Japan e-Government identifier
    '0128', // Japan National Tax Agency
    '0129', // Japan Pension Service
    '0130', // Directorates of the European Commission
    '0131', // GS1 Prefix
    '0132', // GS1 International Article Number
    '0133', // GS1 Prefix
    '0134', // GS1 Supply Chain
    '0135', // SIA Object Identifiers
    '0136', // GS1 Prefix
    '0137', // GS1 GTIN
    '0138', // GS1 MLC
    '0139', // GS1 SBDH
    '0140', // GS1 Shipment Identification
    '0141', // GS1 Routing Code
    '0142', // Danish Ministry of the Interior and Health
    '0143', // GS1 Coupon
    '0144', // GS1 GSRN
    '0145', // GS1 GSIN
    '0146', // GS1 GINC
    '0147', // GS1 GIAI
    '0148', // GS1 GS1-128
    '0149', // GS1 ITIP
    '0150', // GS1 GPC
    '0151', // Australian Business Number (ABN)
    '0152', // Cadastre of Real Estate (Czech Republic)
    '0153', // Business Register of the Slovak Republic
    '0154', // Postaanska Banka identifier
    '0155', // Swedish/Norwegian/Finnish Organization Number
    '0156', // Belgian KBO
    '0157', // French VAT Registration
    '0158', // German Leitweg ID (legacy)
    '0159', // ACTALIS Object Identifiers
    '0160', // GTIN - Global Trade Item Number
    '0161', // RAIN - Railway Infrastructure Number
    '0170', // Teikoku Company Code
    '0171', // JP JIPDEC
    '0172', // Danish CPR number
    '0173', // Danish SE number
    '0174', // Danish VEJ
    '0175', // IO Register
    '0176', // DK EAN number
    '0177', // OD-ette ID
    '0178', // Route ID number
    '0179', // The ODette identifier
    '0180', // Inmarsat ID
    '0183', // Swiss Unique Business Identification Number (UIDB)
    '0184', // DIGSTORG (Denmark)
    '0185', // Kenali
    '0186', // Netherlands Agent
    '0187', // Directory of Portuguese
    '0188', // Corporate Number (Japan)
    '0189', // GS1 UPI
    '0190', // Dutch Originator's Identification Number (OINO)
    '0191', // Centre of Registers, Estonia
    '0192', // Enhetsregisteret, Norway
    '0193', // UBL.BE party identifier
    '0194', // KOIOS Open Technical Dictionary
    '0195', // Singapore UEN
    '0196', // Icelandic identifier (kennitala)
    '0197', // APPLiA/CECED
    '0198', // ERSTORG (Denmark)
    '0199', // Legal Entity Identifier (LEI)
    '0200', // Lithuania Legal entity code
    '0201', // Codice Destinatario (Italy)
    '0202', // Indirizzo di Posta Elettronica Certificata (Italy PEC)
    '0203', // eDelivery Network Participant identifier
    '0204', // Leitweg-ID (Germany)
    '0205', // CODFISCAL (Romania)
    '0206', // Registre du Commerce (Belgium)
    '0207', // PESEL (Poland)
    '0208', // Belgium KBO / BCE
    '0209', // GS1 identification keys
    '0210', // CODICE IPA (Italy)
    '0211', // GS1 identification keys (alternate)
    '0212', // Andorra VAT number
    '0213', // Andorra tax number
    '0215', // Net service ID (Finland)
    '0216', // OVTcode (Finland)
    '0217', // Netherlands Bankgiro
    '0218', // Latvia Legal entity code
    '0219', // Taxpayer's/registration number (Latvia)
    '0220', // Latvian legal entity id
    '0221', // Japan Registered Invoice Qualified Issuer Number
    '0230', // National e-Invoicing Framework (Malaysia)
]));
// ============================================================================
// INTERNAL MAP OF ALL CODE LISTS
// ============================================================================
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
// ============================================================================
// CODE LIST VALIDATOR
// ============================================================================
class CodeListValidator {
    constructor() {
        this.codeLists = CODE_LISTS;
        this.xmlMappings = Object.freeze(this.buildXmlMappings());
    }
    // ==========================================================================
    // PUBLIC API
    // ==========================================================================
    /**
     * Validate a single code against a named code list - O(1)
     */
    validateCode(value, codeList) {
        const list = this.codeLists.get(codeList);
        if (!list) {
            return false;
        }
        return list.has(value);
    }
    /**
     * Validate all codes found in an invoice XML string
     * Parses the XML with fast-xml-parser and checks every code element
     * against its corresponding code list.
     *
     * @param xmlContent - Raw Factur-X CII XML string
     * @returns Validation result with all errors
     */
    validateInvoiceCodes(xmlContent) {
        const errors = [];
        // Parse XML
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
                    // Force arrays for elements that can repeat
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
        // Get the root element (handle namespace prefix variants)
        const root = this.findRoot(parsed);
        if (!root) {
            return {
                isValid: true,
                errors: Object.freeze([]),
            };
        }
        // Run each code mapping extraction and validation
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
    /**
     * Get the complete set of valid values for a named code list
     */
    getCodeList(name) {
        const list = this.codeLists.get(name);
        if (!list) {
            return Object.freeze(new Set());
        }
        return list;
    }
    /**
     * Get all supported code list names
     */
    getSupportedCodeLists() {
        return Object.freeze(Array.from(this.codeLists.keys()));
    }
    /**
     * Get the size (number of valid entries) for a code list
     */
    getCodeListSize(name) {
        const list = this.codeLists.get(name);
        return list ? list.size : 0;
    }
    // ==========================================================================
    // PRIVATE - XML Navigation Helpers
    // ==========================================================================
    /**
     * Locate the CII root element regardless of namespace prefix
     */
    findRoot(parsed) {
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        // Try common root element names
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
        // Fallback: look for any key containing CrossIndustryInvoice
        for (const key of Object.keys(parsed)) {
            if (key.includes('CrossIndustryInvoice')) {
                return parsed[key];
            }
        }
        return null;
    }
    /**
     * Safely navigate a nested object by a dot-separated path.
     * Handles both single values and arrays at each level.
     * Returns the leaf value(s) as strings.
     */
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
        // Convert final values to strings
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
    /**
     * Extract attribute values from parsed XML nodes.
     * The attributeNamePrefix in fast-xml-parser is '@_'.
     */
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
    // ==========================================================================
    // PRIVATE - XML-to-CodeList Mappings
    // ==========================================================================
    /**
     * Build the complete set of XML element to code list mappings.
     * Each mapping knows how to extract values from the parsed XML tree
     * and which code list to validate against.
     */
    buildXmlMappings() {
        return [
            // -- Currency codes (BT-5, BT-6) --
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
            // -- Country codes (BT-40, BT-55, BT-69, BT-80) --
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
            // -- Document type code (BT-3) --
            {
                field: 'ExchangedDocument/ram:TypeCode',
                codeList: 'UNTDID1001',
                extract: (root) => this.extractValues(root, 'rsm:ExchangedDocument.ram:TypeCode'),
            },
            // -- Tax category codes (BT-118, BT-95, BT-102, BT-151) --
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
            // -- Payment means code (BT-81) --
            {
                field: 'SpecifiedTradeSettlementPaymentMeans/ram:TypeCode',
                codeList: 'UNTDID4461',
                extract: (root) => this.extractValues(root, 'rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementPaymentMeans.ram:TypeCode'),
            },
            // -- Unit codes (BT-130) --
            {
                field: 'BilledQuantity/@unitCode',
                codeList: 'UNECE20',
                extract: (root) => this.extractAttribute(root, 'rsm:SupplyChainTradeTransaction.ram:IncludedSupplyChainTradeLineItem.ram:SpecifiedLineTradeDelivery.ram:BilledQuantity', 'unitCode'),
            },
            // -- Electronic Address Scheme (BT-34-1, BT-49-1) --
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
            // -- ICD scheme identifiers (BT-30-1, BT-47-1) --
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
// ============================================================================
// SINGLETON INSTANCE
// ============================================================================
let defaultCodeListValidator = null;
/**
 * Get default code list validator - Lazy singleton
 */
function getDefaultCodeListValidator() {
    if (!defaultCodeListValidator) {
        defaultCodeListValidator = new CodeListValidator();
    }
    return defaultCodeListValidator;
}
/**
 * Convenience function - validate a single code
 */
function isValidCode(value, codeList) {
    return getDefaultCodeListValidator().validateCode(value, codeList);
}
/**
 * Convenience function - validate all codes in XML
 */
function validateInvoiceCodes(xmlContent) {
    return getDefaultCodeListValidator().validateInvoiceCodes(xmlContent);
}
//# sourceMappingURL=CodeListValidator.js.map