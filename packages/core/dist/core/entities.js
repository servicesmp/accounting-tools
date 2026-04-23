"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceLine = exports.AllowanceCharge = exports.DocumentHeaderImpl = exports.PaymentDetailsImpl = exports.TradePartyImpl = exports.PostalAddressImpl = void 0;
const types_1 = require("../types");
class PostalAddressImpl {
    constructor(city, postalCode, countryCode, street, additionalStreet, additionalStreet2, subdivision) {
        this.city = city;
        this.postalCode = postalCode;
        this.countryCode = countryCode;
        this.street = street;
        this.additionalStreet = additionalStreet;
        this.additionalStreet2 = additionalStreet2;
        this.subdivision = subdivision;
        if (!city || !postalCode || !countryCode) {
            throw new Error('City, postal code, and country code are required');
        }
        Object.freeze(this);
    }
    static builder() {
        return new PostalAddressBuilder();
    }
}
exports.PostalAddressImpl = PostalAddressImpl;
class PostalAddressBuilder {
    city(value) {
        this._city = value;
        return this;
    }
    postalCode(value) {
        this._postalCode = value;
        return this;
    }
    countryCode(value) {
        this._countryCode = value;
        return this;
    }
    street(value) {
        this._street = value;
        return this;
    }
    additionalStreet(value) {
        this._additionalStreet = value;
        return this;
    }
    additionalStreet2(value) {
        this._additionalStreet2 = value;
        return this;
    }
    subdivision(value) {
        this._subdivision = value;
        return this;
    }
    build() {
        if (!this._city || !this._postalCode || !this._countryCode) {
            throw new Error('City, postal code, and country code are required');
        }
        return new PostalAddressImpl(this._city, this._postalCode, this._countryCode, this._street, this._additionalStreet, this._additionalStreet2, this._subdivision);
    }
}
class TradePartyImpl {
    constructor(name, address, tradingName, vatId, taxId, legalId, legalIdScheme, email, phone, globalId, electronicAddress, electronicAddressScheme) {
        this.name = name;
        this.address = address;
        this.tradingName = tradingName;
        this.vatId = vatId;
        this.taxId = taxId;
        this.legalId = legalId;
        this.legalIdScheme = legalIdScheme;
        this.email = email;
        this.phone = phone;
        this.globalId = globalId;
        this.electronicAddress = electronicAddress;
        this.electronicAddressScheme = electronicAddressScheme;
        if (!name || !address) {
            throw new Error('Name and address are required');
        }
        Object.freeze(this);
    }
    static builder() {
        return new TradePartyBuilder();
    }
}
exports.TradePartyImpl = TradePartyImpl;
class TradePartyBuilder {
    name(value) {
        this._name = value;
        return this;
    }
    address(value) {
        this._address = value;
        return this;
    }
    tradingName(value) {
        this._tradingName = value;
        return this;
    }
    vatId(value) {
        this._vatId = value;
        return this;
    }
    taxId(value) {
        this._taxId = value;
        return this;
    }
    legalId(value) {
        this._legalId = value;
        return this;
    }
    legalIdScheme(value) {
        this._legalIdScheme = value;
        return this;
    }
    email(value) {
        this._email = value;
        return this;
    }
    phone(value) {
        this._phone = value;
        return this;
    }
    globalId(value) {
        this._globalId = value;
        return this;
    }
    electronicAddress(value) {
        this._electronicAddress = value;
        return this;
    }
    electronicAddressScheme(value) {
        this._electronicAddressScheme = value;
        return this;
    }
    build() {
        if (!this._name || !this._address) {
            throw new Error('Name and address are required');
        }
        return new TradePartyImpl(this._name, this._address, this._tradingName, this._vatId, this._taxId, this._legalId, this._legalIdScheme, this._email, this._phone, this._globalId, this._electronicAddress, this._electronicAddressScheme);
    }
}
class PaymentDetailsImpl {
    constructor(meansCode, iban, bic, reference, dueDate, termsDescription) {
        this.meansCode = meansCode;
        this.iban = iban;
        this.bic = bic;
        this.reference = reference;
        this.dueDate = dueDate;
        this.termsDescription = termsDescription;
        Object.freeze(this);
    }
    static builder() {
        return new PaymentDetailsBuilder();
    }
}
exports.PaymentDetailsImpl = PaymentDetailsImpl;
class PaymentDetailsBuilder {
    meansCode(value) {
        this._meansCode = value;
        return this;
    }
    iban(value) {
        this._iban = value;
        return this;
    }
    bic(value) {
        this._bic = value;
        return this;
    }
    reference(value) {
        this._reference = value;
        return this;
    }
    dueDate(value) {
        this._dueDate = value;
        return this;
    }
    termsDescription(value) {
        this._termsDescription = value;
        return this;
    }
    build() {
        if (!this._meansCode) {
            throw new Error('Payment means code is required');
        }
        return new PaymentDetailsImpl(this._meansCode, this._iban, this._bic, this._reference, this._dueDate, this._termsDescription);
    }
}
class DocumentHeaderImpl {
    constructor(id, invoiceNumber, name, invoiceDate, typeCode, dueDate, billingPeriodStart, billingPeriodEnd, purchaseOrderReference, salesOrderReference, contractReference, notes) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.name = name;
        this.invoiceDate = invoiceDate;
        this.typeCode = typeCode;
        this.dueDate = dueDate;
        this.billingPeriodStart = billingPeriodStart;
        this.billingPeriodEnd = billingPeriodEnd;
        this.purchaseOrderReference = purchaseOrderReference;
        this.salesOrderReference = salesOrderReference;
        this.contractReference = contractReference;
        this.notes = notes;
        if (!id || !invoiceNumber || !invoiceDate) {
            throw new Error('ID, invoice number, and date are required');
        }
        if (notes) {
            Object.freeze(notes);
        }
        Object.freeze(this);
    }
    static builder() {
        return new DocumentHeaderBuilder();
    }
}
exports.DocumentHeaderImpl = DocumentHeaderImpl;
class DocumentHeaderBuilder {
    constructor() {
        this._name = 'INVOICE';
        this._typeCode = types_1.DocTypeCode.INVOICE;
    }
    id(value) {
        this._id = value;
        return this;
    }
    invoiceNumber(value) {
        this._invoiceNumber = value;
        return this;
    }
    name(value) {
        this._name = value;
        return this;
    }
    invoiceDate(value) {
        this._invoiceDate = value;
        return this;
    }
    typeCode(value) {
        this._typeCode = value;
        return this;
    }
    dueDate(value) {
        this._dueDate = value;
        return this;
    }
    billingPeriod(start, end) {
        this._billingPeriodStart = start;
        this._billingPeriodEnd = end;
        return this;
    }
    purchaseOrderReference(value) {
        this._purchaseOrderReference = value;
        return this;
    }
    salesOrderReference(value) {
        this._salesOrderReference = value;
        return this;
    }
    contractReference(value) {
        this._contractReference = value;
        return this;
    }
    addNote(note) {
        if (!this._notes) {
            this._notes = [];
        }
        this._notes.push(note);
        return this;
    }
    addNoteWithCode(content, subjectCode) {
        if (!this._notes) {
            this._notes = [];
        }
        this._notes.push({ content, subjectCode });
        return this;
    }
    build() {
        if (!this._id || !this._invoiceNumber || !this._invoiceDate) {
            throw new Error('ID, invoice number, and date are required');
        }
        return new DocumentHeaderImpl(this._id, this._invoiceNumber, this._name, this._invoiceDate, this._typeCode, this._dueDate, this._billingPeriodStart, this._billingPeriodEnd, this._purchaseOrderReference, this._salesOrderReference, this._contractReference, this._notes ? [...this._notes] : undefined);
    }
}
class AllowanceCharge {
    constructor(chargeIndicator, actualAmount, reason, reasonCode, taxRate, taxCategoryCode, baseAmount, percentage) {
        this.chargeIndicator = chargeIndicator;
        this.actualAmount = actualAmount;
        this.reason = reason;
        this.reasonCode = reasonCode;
        this.taxRate = taxRate;
        this.taxCategoryCode = taxCategoryCode;
        this.baseAmount = baseAmount;
        this.percentage = percentage;
        if (actualAmount < 0) {
            throw new Error('Amount must be non-negative');
        }
        Object.freeze(this);
    }
    static allowance(amount, reason, reasonCode) {
        return new AllowanceCharge(false, amount, reason, reasonCode);
    }
    static charge(amount, reason, reasonCode) {
        return new AllowanceCharge(true, amount, reason, reasonCode);
    }
}
exports.AllowanceCharge = AllowanceCharge;
class InvoiceLine {
    constructor(id, description, quantity, unitPrice, vatRate, taxCategoryCode = 'S', unitCode = 'C62', billingPeriodStart, billingPeriodEnd, deliveredQuantity, productId, ean) {
        this.id = id;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.vatRate = vatRate;
        this.taxCategoryCode = taxCategoryCode;
        this.unitCode = unitCode;
        this.billingPeriodStart = billingPeriodStart;
        this.billingPeriodEnd = billingPeriodEnd;
        this.deliveredQuantity = deliveredQuantity;
        this.productId = productId;
        this.ean = ean;
        this.allowances = [];
        this.charges = [];
        if (!id || !description) {
            throw new Error('ID and description are required');
        }
        if (quantity < 0 || unitPrice < 0) {
            throw new Error('Quantity and price must be non-negative');
        }
    }
    get lineTotal() {
        return this.quantity * this.unitPrice;
    }
    addAllowance(amount, reason) {
        this.allowances.push(AllowanceCharge.allowance(amount, reason));
    }
    addCharge(amount, reason) {
        this.charges.push(AllowanceCharge.charge(amount, reason));
    }
    addAllowanceCharge(amount, isCharge, reason) {
        isCharge ? this.addCharge(amount, reason) : this.addAllowance(amount, reason);
    }
    getAllAllowancesCharges() {
        return [...this.allowances, ...this.charges];
    }
    clearAllowancesCharges() {
        this.allowances.length = 0;
        this.charges.length = 0;
    }
    static builder() {
        return new InvoiceLineBuilder();
    }
}
exports.InvoiceLine = InvoiceLine;
class InvoiceLineBuilder {
    constructor() {
        this._quantity = 1;
        this._unitPrice = 0;
        this._vatRate = 0.20;
        this._taxCategoryCode = 'S';
        this._unitCode = 'C62';
    }
    id(value) {
        this._id = value;
        return this;
    }
    description(value) {
        this._description = value;
        return this;
    }
    quantity(value) {
        this._quantity = value;
        return this;
    }
    unitPrice(value) {
        this._unitPrice = value;
        return this;
    }
    vatRate(value) {
        this._vatRate = value;
        return this;
    }
    taxCategoryCode(value) {
        this._taxCategoryCode = value;
        return this;
    }
    unitCode(value) {
        this._unitCode = value;
        return this;
    }
    billingPeriod(start, end) {
        this._billingPeriodStart = start;
        this._billingPeriodEnd = end;
        return this;
    }
    deliveredQuantity(value) {
        this._deliveredQuantity = value;
        return this;
    }
    productId(value) {
        this._productId = value;
        return this;
    }
    ean(value) {
        this._ean = value;
        return this;
    }
    build() {
        if (!this._id || !this._description) {
            throw new Error('ID and description are required');
        }
        return new InvoiceLine(this._id, this._description, this._quantity, this._unitPrice, this._vatRate, this._taxCategoryCode, this._unitCode, this._billingPeriodStart, this._billingPeriodEnd, this._deliveredQuantity, this._productId, this._ean);
    }
}
//# sourceMappingURL=entities.js.map