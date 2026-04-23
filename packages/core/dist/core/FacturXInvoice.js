"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacturXInvoiceBuilder = exports.FacturXInvoice = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
const types_1 = require("../types");
const TaxCalculator_1 = require("./TaxCalculator");
const constants_1 = require("./constants");
class FacturXInvoice {
    constructor(profile, header, seller, buyer, payment, lines = [], docAllowancesCharges = [], currency = types_1.CurrencyCode.EUR, compliance = types_1.ComplianceType.FACTUR_X, regionalConfig) {
        this.profile = profile;
        this.header = header;
        this.seller = seller;
        this.buyer = buyer;
        this.payment = payment;
        this.lines = lines;
        this.docAllowancesCharges = docAllowancesCharges;
        this.currency = currency;
        this.compliance = compliance;
        this.regionalConfig = regionalConfig;
        this.taxCalculator = new TaxCalculator_1.TaxCalculator('line');
    }
    addLine(line) {
        this.lines.push(line);
        this.invalidateCaches();
    }
    addDocAllowanceCharge(ac) {
        this.docAllowancesCharges.push(ac);
        this.invalidateCaches();
    }
    finalizeTotals() {
        if (!this.cachedSummary) {
            this.cachedSummary = this.taxCalculator.computeSummary(this.lines, this.docAllowancesCharges);
        }
        return this.cachedSummary;
    }
    get totals() {
        return this.finalizeTotals();
    }
    validateProfile() {
        const policy = (0, constants_1.getProfilePolicy)(this.profile);
        for (const field of policy.forbiddenFields) {
            if (this.hasField(field)) {
                throw new Error(`[Factur-X] Profile ${this.profile} forbids field '${field}', but it is set.`);
            }
        }
        for (const field of policy.mandatoryFields) {
            if (!this.hasField(field)) {
                throw new Error(`[Factur-X] Profile ${this.profile} requires field '${field}', but it is missing.`);
            }
        }
    }
    generateXml(checkProfile = true) {
        if (this.cachedXml) {
            return this.cachedXml;
        }
        const summary = this.finalizeTotals();
        if (checkProfile) {
            this.validateProfile();
        }
        const xml = this.buildXmlDocument(summary);
        this.cachedXml = xml;
        return xml;
    }
    buildXmlDocument(summary) {
        const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' }).ele('rsm:CrossIndustryInvoice', {
            'xmlns:qdt': constants_1.XML_NAMESPACES.QDT,
            'xmlns:ram': constants_1.XML_NAMESPACES.RAM,
            'xmlns:rsm': constants_1.XML_NAMESPACES.RSM,
            'xmlns:udt': constants_1.XML_NAMESPACES.UDT,
            'xmlns:xsi': constants_1.XML_NAMESPACES.XSI,
        });
        this.buildDocumentContext(root);
        this.buildDocumentHeader(root);
        this.buildSupplyChainTransaction(root, summary);
        return root.end({ prettyPrint: true, indent: '  ' });
    }
    buildDocumentContext(root) {
        const ctx = root.ele('rsm:ExchangedDocumentContext');
        const guideline = ctx.ele('ram:GuidelineSpecifiedDocumentContextParameter');
        guideline.ele('ram:ID').txt((0, constants_1.getGuidelineUrn)(this.profile));
    }
    buildDocumentHeader(root) {
        const doc = root.ele('rsm:ExchangedDocument');
        doc.ele('ram:ID').txt(this.header.id);
        doc.ele('ram:TypeCode').txt(String(this.header.typeCode));
        const issueDate = doc.ele('ram:IssueDateTime');
        issueDate
            .ele('udt:DateTimeString', { format: '102' })
            .txt((0, constants_1.formatDateFacturX)(this.header.invoiceDate));
        if (this.header.notes && this.header.notes.length > 0) {
            for (const note of this.header.notes) {
                const noteNode = doc.ele('ram:IncludedNote');
                if (typeof note === 'string') {
                    noteNode.ele('ram:Content').txt(note);
                }
                else {
                    noteNode.ele('ram:Content').txt(note.content);
                    if (note.subjectCode) {
                        noteNode.ele('ram:SubjectCode').txt(note.subjectCode);
                    }
                }
            }
        }
    }
    buildSupplyChainTransaction(root, summary) {
        const tx = root.ele('rsm:SupplyChainTradeTransaction');
        if (this.profile !== types_1.FacturxProfile.BASICWL &&
            this.profile !== types_1.FacturxProfile.MINIMUM) {
            this.buildLineItems(tx);
        }
        this.buildHeaderTradeAgreement(tx);
        this.buildHeaderTradeDelivery(tx);
        this.buildHeaderTradeSettlement(tx, summary);
    }
    buildHeaderTradeAgreement(tx) {
        const agreement = tx.ele('ram:ApplicableHeaderTradeAgreement');
        const seller = agreement.ele('ram:SellerTradeParty');
        seller.ele('ram:Name').txt(this.seller.name);
        if (this.seller.legalId) {
            const legalOrg = seller.ele('ram:SpecifiedLegalOrganization');
            legalOrg.ele('ram:ID', { schemeID: this.seller.legalIdScheme || '0002' })
                .txt(this.seller.legalId);
        }
        if (this.seller.address) {
            const sellerAddr = seller.ele('ram:PostalTradeAddress');
            if (this.seller.address.postalCode) {
                sellerAddr.ele('ram:PostcodeCode').txt(this.seller.address.postalCode);
            }
            if (this.seller.address.street) {
                sellerAddr.ele('ram:LineOne').txt(this.seller.address.street);
            }
            if (this.seller.address.additionalStreet) {
                sellerAddr.ele('ram:LineTwo').txt(this.seller.address.additionalStreet);
            }
            if (this.seller.address.city) {
                sellerAddr.ele('ram:CityName').txt(this.seller.address.city);
            }
            if (this.seller.address.countryCode) {
                sellerAddr.ele('ram:CountryID').txt(this.seller.address.countryCode);
            }
        }
        if (this.seller.electronicAddress) {
            const uriComm = seller.ele('ram:URIUniversalCommunication');
            uriComm.ele('ram:URIID', { schemeID: this.seller.electronicAddressScheme || 'EM' })
                .txt(this.seller.electronicAddress);
        }
        if (this.seller.vatId) {
            const sellerTax = seller.ele('ram:SpecifiedTaxRegistration');
            sellerTax.ele('ram:ID', { schemeID: 'VA' }).txt(this.seller.vatId);
        }
        const buyer = agreement.ele('ram:BuyerTradeParty');
        buyer.ele('ram:Name').txt(this.buyer.name);
        if (this.buyer.legalId) {
            const legalOrg = buyer.ele('ram:SpecifiedLegalOrganization');
            legalOrg.ele('ram:ID', { schemeID: this.buyer.legalIdScheme || '0002' })
                .txt(this.buyer.legalId);
        }
        if (this.buyer.address) {
            const buyerAddr = buyer.ele('ram:PostalTradeAddress');
            if (this.buyer.address.postalCode) {
                buyerAddr.ele('ram:PostcodeCode').txt(this.buyer.address.postalCode);
            }
            if (this.buyer.address.street) {
                buyerAddr.ele('ram:LineOne').txt(this.buyer.address.street);
            }
            if (this.buyer.address.city) {
                buyerAddr.ele('ram:CityName').txt(this.buyer.address.city);
            }
            if (this.buyer.address.countryCode) {
                buyerAddr.ele('ram:CountryID').txt(this.buyer.address.countryCode);
            }
        }
        if (this.buyer.electronicAddress) {
            const uriComm = buyer.ele('ram:URIUniversalCommunication');
            uriComm.ele('ram:URIID', { schemeID: this.buyer.electronicAddressScheme || 'EM' })
                .txt(this.buyer.electronicAddress);
        }
        if (this.buyer.vatId) {
            const buyerTax = buyer.ele('ram:SpecifiedTaxRegistration');
            buyerTax.ele('ram:ID', { schemeID: 'VA' }).txt(this.buyer.vatId);
        }
    }
    buildHeaderTradeDelivery(tx) {
        const delivery = tx.ele('ram:ApplicableHeaderTradeDelivery');
        const event = delivery.ele('ram:ActualDeliverySupplyChainEvent');
        const dateTime = event.ele('ram:OccurrenceDateTime');
        dateTime.ele('udt:DateTimeString', { format: '102' })
            .txt((0, constants_1.formatDateFacturX)(this.header.invoiceDate));
    }
    buildHeaderTradeSettlement(tx, summary) {
        const settlement = tx.ele('ram:ApplicableHeaderTradeSettlement');
        settlement.ele('ram:InvoiceCurrencyCode').txt(this.currency);
        if (this.payment) {
            const paymentMeans = settlement.ele('ram:SpecifiedTradeSettlementPaymentMeans');
            paymentMeans.ele('ram:TypeCode').txt(String(this.payment.meansCode));
            if (this.payment.iban) {
                const account = paymentMeans.ele('ram:PayeePartyCreditorFinancialAccount');
                account.ele('ram:IBANID').txt(this.payment.iban);
            }
            else if (this.payment.reference) {
                const account = paymentMeans.ele('ram:PayeePartyCreditorFinancialAccount');
                account.ele('ram:ProprietaryID').txt(this.payment.reference);
            }
            if (this.payment.bic) {
                const institution = paymentMeans.ele('ram:PayeeSpecifiedCreditorFinancialInstitution');
                institution.ele('ram:BICID').txt(this.payment.bic);
            }
        }
        for (const taxSummary of summary.taxSummaries) {
            const tax = settlement.ele('ram:ApplicableTradeTax');
            tax.ele('ram:CalculatedAmount').txt((0, constants_1.formatAmount)(taxSummary.taxAmount));
            tax.ele('ram:TypeCode').txt('VAT');
            tax.ele('ram:BasisAmount').txt((0, constants_1.formatAmount)(taxSummary.taxable));
            tax.ele('ram:CategoryCode').txt(taxSummary.category);
            tax.ele('ram:RateApplicablePercent').txt((0, constants_1.formatAmount)(taxSummary.rate));
        }
        for (const ac of this.docAllowancesCharges) {
            const acNode = settlement.ele('ram:SpecifiedTradeAllowanceCharge');
            acNode.ele('ram:ChargeIndicator')
                .ele('udt:Indicator').txt(ac.chargeIndicator ? 'true' : 'false');
            acNode.ele('ram:ActualAmount').txt((0, constants_1.formatAmount)(ac.actualAmount));
            if (ac.reasonCode) {
                acNode.ele('ram:ReasonCode').txt(ac.reasonCode);
            }
            if (ac.reason) {
                acNode.ele('ram:Reason').txt(ac.reason);
            }
            const acTax = acNode.ele('ram:CategoryTradeTax');
            acTax.ele('ram:TypeCode').txt('VAT');
            acTax.ele('ram:CategoryCode').txt(ac.taxCategoryCode ?? 'S');
            acTax.ele('ram:RateApplicablePercent')
                .txt((0, constants_1.formatAmount)((ac.taxRate ?? 0) * 100));
        }
        if (this.payment?.dueDate || this.payment?.termsDescription) {
            const terms = settlement.ele('ram:SpecifiedTradePaymentTerms');
            if (this.payment.termsDescription) {
                terms.ele('ram:Description').txt(this.payment.termsDescription);
            }
            if (this.payment.dueDate) {
                const dueDate = terms.ele('ram:DueDateDateTime');
                dueDate
                    .ele('udt:DateTimeString', { format: '102' })
                    .txt((0, constants_1.formatDateFacturX)(this.payment.dueDate));
            }
        }
        const monetary = settlement.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation');
        monetary.ele('ram:LineTotalAmount').txt((0, constants_1.formatAmount)(summary.lineTotal));
        const hasCharges = (summary.chargeTotal ?? 0) > 0;
        const hasAllowances = (summary.allowanceTotal ?? 0) > 0;
        if (hasCharges) {
            monetary.ele('ram:ChargeTotalAmount').txt((0, constants_1.formatAmount)(summary.chargeTotal));
        }
        if (hasAllowances) {
            monetary.ele('ram:AllowanceTotalAmount').txt((0, constants_1.formatAmount)(summary.allowanceTotal));
        }
        monetary.ele('ram:TaxBasisTotalAmount').txt((0, constants_1.formatAmount)(summary.taxBasis));
        monetary.ele('ram:TaxTotalAmount', { currencyID: this.currency })
            .txt((0, constants_1.formatAmount)(summary.taxTotal));
        monetary.ele('ram:GrandTotalAmount').txt((0, constants_1.formatAmount)(summary.grandTotal));
        monetary.ele('ram:DuePayableAmount')
            .txt((0, constants_1.formatAmount)(summary.dueAmount ?? summary.grandTotal));
    }
    buildLineItems(tx) {
        for (const line of this.lines) {
            const lineNode = tx.ele('ram:IncludedSupplyChainTradeLineItem');
            const lineDoc = lineNode.ele('ram:AssociatedDocumentLineDocument');
            lineDoc.ele('ram:LineID').txt(line.id);
            const product = lineNode.ele('ram:SpecifiedTradeProduct');
            product.ele('ram:Name').txt(line.description);
            const lineAgreement = lineNode.ele('ram:SpecifiedLineTradeAgreement');
            const netPrice = lineAgreement.ele('ram:NetPriceProductTradePrice');
            netPrice.ele('ram:ChargeAmount').txt((0, constants_1.formatAmount)(line.unitPrice));
            const lineDelivery = lineNode.ele('ram:SpecifiedLineTradeDelivery');
            const billedQty = lineDelivery.ele('ram:BilledQuantity', { unitCode: line.unitCode });
            billedQty.txt(String(line.quantity));
            const lineSettlement = lineNode.ele('ram:SpecifiedLineTradeSettlement');
            const lineTax = lineSettlement.ele('ram:ApplicableTradeTax');
            lineTax.ele('ram:TypeCode').txt('VAT');
            lineTax.ele('ram:CategoryCode').txt(line.taxCategoryCode);
            lineTax.ele('ram:RateApplicablePercent').txt((0, constants_1.formatAmount)(line.vatRate * 100));
            const lineSummation = lineSettlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation');
            lineSummation.ele('ram:LineTotalAmount').txt((0, constants_1.formatAmount)(line.lineTotal));
        }
    }
    hasField(fieldPath) {
        const parts = fieldPath.split('.');
        let current = this;
        for (const part of parts) {
            if (current === null || current === undefined) {
                return false;
            }
            current = current[part];
        }
        if (current === null || current === undefined) {
            return false;
        }
        if (Array.isArray(current)) {
            return current.length > 0;
        }
        if (typeof current === 'string') {
            return current.trim().length > 0;
        }
        return true;
    }
    invalidateCaches() {
        this.cachedSummary = undefined;
        this.cachedXml = undefined;
    }
    static builder(profile) {
        return new FacturXInvoiceBuilder(profile);
    }
}
exports.FacturXInvoice = FacturXInvoice;
class FacturXInvoiceBuilder {
    constructor(profile) {
        this.profile = profile;
        this._lines = [];
        this._docAC = [];
    }
    header(value) {
        this._header = value;
        return this;
    }
    seller(value) {
        this._seller = value;
        return this;
    }
    buyer(value) {
        this._buyer = value;
        return this;
    }
    payment(value) {
        this._payment = value;
        return this;
    }
    addLine(line) {
        this._lines.push(line);
        return this;
    }
    addDocAllowanceCharge(ac) {
        this._docAC.push(ac);
        return this;
    }
    build() {
        if (!this._header || !this._seller || !this._buyer || !this._payment) {
            throw new Error('Header, seller, buyer, and payment are required');
        }
        return new FacturXInvoice(this.profile, this._header, this._seller, this._buyer, this._payment, this._lines, this._docAC);
    }
}
exports.FacturXInvoiceBuilder = FacturXInvoiceBuilder;
//# sourceMappingURL=FacturXInvoice.js.map