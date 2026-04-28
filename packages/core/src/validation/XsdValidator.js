"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdValidator = void 0;
exports.getDefaultValidator = getDefaultValidator;
exports.validateXml = validateXml;
exports.validateXmlAsync = validateXmlAsync;
const types_1 = require("../types");
const crypto_1 = require("crypto");
const fast_xml_parser_1 = require("fast-xml-parser");
const xmldom_1 = require("@xmldom/xmldom");
class LRUCache {
    constructor(capacity) {
        this.head = null;
        this.tail = null;
        this.capacity = capacity;
        this.cache = new Map();
    }
    get(key) {
        const node = this.cache.get(key);
        if (!node) {
            return undefined;
        }
        this.moveToHead(node);
        return node.value;
    }
    set(key, value) {
        let node = this.cache.get(key);
        if (node) {
            node.value = value;
            this.moveToHead(node);
        }
        else {
            node = { key, value, prev: null, next: null };
            this.cache.set(key, node);
            this.addToHead(node);
            if (this.cache.size > this.capacity) {
                const tailKey = this.removeTail();
                if (tailKey !== undefined) {
                    this.cache.delete(tailKey);
                }
            }
        }
    }
    has(key) {
        return this.cache.has(key);
    }
    clear() {
        this.cache.clear();
        this.head = null;
        this.tail = null;
    }
    size() {
        return this.cache.size;
    }
    addToHead(node) {
        node.next = this.head;
        node.prev = null;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
        if (!this.tail) {
            this.tail = node;
        }
    }
    removeNode(node) {
        if (node.prev) {
            node.prev.next = node.next;
        }
        else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        else {
            this.tail = node.prev;
        }
    }
    moveToHead(node) {
        this.removeNode(node);
        this.addToHead(node);
    }
    removeTail() {
        if (!this.tail) {
            return undefined;
        }
        const key = this.tail.key;
        this.removeNode(this.tail);
        return key;
    }
}
class XsdValidator {
    constructor(options = {}) {
        this.options = {
            cacheSize: options.cacheSize ?? 100,
            enableCache: options.enableCache ?? true,
            strictMode: options.strictMode ?? false,
            validateExtensions: options.validateExtensions ?? false,
        };
        this.cache = new LRUCache(this.options.cacheSize);
    }
    validate(xml, profile) {
        const cacheKey = this.options.enableCache ? this.generateCacheKey(xml, profile) : '';
        if (this.options.enableCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return { ...cached, cached: true };
            }
        }
        const result = this.performValidation(xml, profile);
        if (this.options.enableCache) {
            this.cache.set(cacheKey, result);
        }
        return { ...result, cached: false };
    }
    async validateAsync(xml, profile) {
        return new Promise((resolve) => {
            setImmediate(() => {
                const result = this.validate(xml, profile);
                resolve(result);
            });
        });
    }
    validateBatch(documents) {
        return documents.map((doc) => this.validate(doc.xml, doc.profile));
    }
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        return {
            size: this.cache.size(),
            capacity: this.options.cacheSize,
            hitRate: 0,
        };
    }
    performValidation(xml, profile) {
        const errors = [];
        const warnings = [];
        const validationResult = fast_xml_parser_1.XMLValidator.validate(xml, {
            allowBooleanAttributes: true,
        });
        if (validationResult !== true) {
            errors.push({
                line: validationResult.err.line,
                column: validationResult.err.col,
                message: validationResult.err.msg,
                code: 'XML_SYNTAX_ERROR',
                severity: 'error',
            });
            return {
                isValid: false,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                validatedAt: new Date(),
                profile,
                cached: false,
            };
        }
        let parsedXml;
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
            });
            parsedXml = parser.parse(xml);
        }
        catch (error) {
            errors.push({
                line: 0,
                column: 0,
                message: `Failed to parse XML: ${error.message}`,
                code: 'XML_PARSE_ERROR',
                severity: 'error',
            });
            return {
                isValid: false,
                errors: Object.freeze(errors),
                warnings: Object.freeze(warnings),
                validatedAt: new Date(),
                profile,
                cached: false,
            };
        }
        try {
            const domParser = new xmldom_1.DOMParser();
            const doc = domParser.parseFromString(xml, 'text/xml');
            const root = doc.documentElement;
            const requiredNamespaces = [
                { prefix: 'rsm', uri: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100' },
                { prefix: 'ram', uri: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100' },
                { prefix: 'udt', uri: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100' },
            ];
            for (const ns of requiredNamespaces) {
                const nsUri = root.lookupNamespaceURI(ns.prefix);
                if (!nsUri) {
                    errors.push({
                        line: 0,
                        column: 0,
                        message: `Missing namespace declaration for prefix '${ns.prefix}'`,
                        code: 'MISSING_NAMESPACE',
                        severity: 'error',
                    });
                }
                else if (nsUri !== ns.uri) {
                    errors.push({
                        line: 0,
                        column: 0,
                        message: `Incorrect namespace URI for prefix '${ns.prefix}'. Expected '${ns.uri}', got '${nsUri}'`,
                        code: 'INVALID_NAMESPACE_URI',
                        severity: 'error',
                    });
                }
            }
        }
        catch (error) {
            warnings.push(`Could not validate namespaces: ${error.message}`);
        }
        this.validateRequiredElements(parsedXml, profile, errors);
        this.validateDataTypes(parsedXml, profile, errors, warnings);
        this.validateBusinessRules(parsedXml, profile, errors, warnings);
        return {
            isValid: errors.length === 0,
            errors: Object.freeze(errors),
            warnings: Object.freeze(warnings),
            validatedAt: new Date(),
            profile,
            cached: false,
        };
    }
    validateRequiredElements(parsedXml, profile, errors) {
        const requiredPaths = this.getRequiredElementPaths(profile);
        for (const path of requiredPaths) {
            if (!this.hasElement(parsedXml, path)) {
                errors.push({
                    line: 0,
                    column: 0,
                    message: `Required element '${path}' is missing for profile ${profile}`,
                    code: 'REQUIRED_ELEMENT_MISSING',
                    severity: 'error',
                });
            }
        }
    }
    validateDataTypes(parsedXml, _profile, errors, _warnings) {
        const currency = this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:InvoiceCurrencyCode');
        if (currency && !/^[A-Z]{3}$/.test(currency)) {
            errors.push({
                line: 0,
                column: 0,
                message: `Invalid currency code '${currency}'. Must be 3-letter ISO 4217 code.`,
                code: 'INVALID_CURRENCY_CODE',
                severity: 'error',
            });
        }
        const amountPaths = [
            'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:TaxBasisTotalAmount',
            'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:GrandTotalAmount',
        ];
        for (const path of amountPaths) {
            const amount = this.getElementValue(parsedXml, path);
            if (amount && isNaN(parseFloat(amount))) {
                errors.push({
                    line: 0,
                    column: 0,
                    message: `Invalid amount format at '${path}': '${amount}' is not a valid decimal number.`,
                    code: 'INVALID_AMOUNT_FORMAT',
                    severity: 'error',
                });
            }
        }
        const dateValue = this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:IssueDateTime.udt:DateTimeString');
        if (dateValue && !/^\d{8}$/.test(dateValue) && !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            errors.push({
                line: 0,
                column: 0,
                message: `Invalid date format '${dateValue}'. Expected YYYYMMDD or YYYY-MM-DD.`,
                code: 'INVALID_DATE_FORMAT',
                severity: 'error',
            });
        }
    }
    validateBusinessRules(parsedXml, _profile, errors, warnings) {
        const grandTotal = parseFloat(this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:GrandTotalAmount') || '0');
        const taxBasisTotal = parseFloat(this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:TaxBasisTotalAmount') || '0');
        const taxTotal = parseFloat(this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:TaxTotalAmount') || '0');
        const expectedGrandTotal = taxBasisTotal + taxTotal;
        const tolerance = 0.02;
        if (Math.abs(grandTotal - expectedGrandTotal) > tolerance) {
            warnings.push(`Grand total (${grandTotal}) does not match tax basis (${taxBasisTotal}) + tax (${taxTotal}) = ${expectedGrandTotal}. Difference: ${Math.abs(grandTotal - expectedGrandTotal).toFixed(2)}`);
        }
        const sellerName = this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty.ram:Name');
        const buyerName = this.getElementValue(parsedXml, 'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty.ram:Name');
        if (!sellerName) {
            errors.push({
                line: 0,
                column: 0,
                message: 'Seller name is required',
                code: 'MISSING_SELLER_NAME',
                severity: 'error',
            });
        }
        if (!buyerName) {
            errors.push({
                line: 0,
                column: 0,
                message: 'Buyer name is required',
                code: 'MISSING_BUYER_NAME',
                severity: 'error',
            });
        }
    }
    hasElement(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (!current || typeof current !== 'object' || !(part in current)) {
                return false;
            }
            current = current[part];
        }
        return current !== undefined && current !== null;
    }
    getElementValue(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (!current || typeof current !== 'object') {
                return null;
            }
            current = current[part];
        }
        if (typeof current === 'object' && current !== null) {
            if ('#text' in current) {
                return String(current['#text']);
            }
            return null;
        }
        return current !== undefined && current !== null ? String(current) : null;
    }
    getRequiredElementPaths(profile) {
        const requiredByProfile = new Map([
            [
                types_1.FacturxProfile.MINIMUM,
                [
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext.ram:GuidelineSpecifiedDocumentContextParameter',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:ID',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:TypeCode',
                ],
            ],
            [
                types_1.FacturxProfile.BASICWL,
                [
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:ID',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:TypeCode',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:IssueDateTime',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction',
                ],
            ],
            [
                types_1.FacturxProfile.BASIC,
                [
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:ID',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:TypeCode',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:IssueDateTime',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:InvoiceCurrencyCode',
                ],
            ],
            [
                types_1.FacturxProfile.EN16931,
                [
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext.ram:GuidelineSpecifiedDocumentContextParameter',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:ID',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:TypeCode',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:IssueDateTime',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:InvoiceCurrencyCode',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:TaxBasisTotalAmount',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:TaxTotalAmount',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:SpecifiedTradeSettlementHeaderMonetarySummation.ram:GrandTotalAmount',
                ],
            ],
            [
                types_1.FacturxProfile.EXTENDED,
                [
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocumentContext.ram:GuidelineSpecifiedDocumentContextParameter',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:ID',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:TypeCode',
                    'rsm:CrossIndustryInvoice.rsm:ExchangedDocument.ram:IssueDateTime',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:SellerTradeParty',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeAgreement.ram:BuyerTradeParty',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement',
                    'rsm:CrossIndustryInvoice.rsm:SupplyChainTradeTransaction.ram:ApplicableHeaderTradeSettlement.ram:InvoiceCurrencyCode',
                ],
            ],
        ]);
        return requiredByProfile.get(profile) || [];
    }
    generateCacheKey(xml, profile) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(xml);
        hash.update(profile);
        return hash.digest('hex');
    }
}
exports.XsdValidator = XsdValidator;
let defaultValidator = null;
function getDefaultValidator() {
    if (!defaultValidator) {
        defaultValidator = new XsdValidator({
            cacheSize: 100,
            enableCache: true,
            strictMode: false,
        });
    }
    return defaultValidator;
}
function validateXml(xml, profile) {
    return getDefaultValidator().validate(xml, profile);
}
async function validateXmlAsync(xml, profile) {
    return getDefaultValidator().validateAsync(xml, profile);
}
//# sourceMappingURL=XsdValidator.js.map