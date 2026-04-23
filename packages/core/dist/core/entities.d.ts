import { PostalAddress, TradeParty, PaymentDetails, DocumentHeader, AllowanceCharge as IAllowanceCharge, InvoiceLine as IInvoiceLine, NoteWithCode, DocTypeCode, PaymentMeansCode } from '../types';
export declare class PostalAddressImpl implements PostalAddress {
    readonly city: string;
    readonly postalCode: string;
    readonly countryCode: string;
    readonly street?: string | undefined;
    readonly additionalStreet?: string | undefined;
    readonly additionalStreet2?: string | undefined;
    readonly subdivision?: string | undefined;
    constructor(city: string, postalCode: string, countryCode: string, street?: string | undefined, additionalStreet?: string | undefined, additionalStreet2?: string | undefined, subdivision?: string | undefined);
    static builder(): PostalAddressBuilder;
}
declare class PostalAddressBuilder {
    private _city?;
    private _postalCode?;
    private _countryCode?;
    private _street?;
    private _additionalStreet?;
    private _additionalStreet2?;
    private _subdivision?;
    city(value: string): this;
    postalCode(value: string): this;
    countryCode(value: string): this;
    street(value: string): this;
    additionalStreet(value: string): this;
    additionalStreet2(value: string): this;
    subdivision(value: string): this;
    build(): PostalAddressImpl;
}
export declare class TradePartyImpl implements TradeParty {
    readonly name: string;
    readonly address: PostalAddress;
    readonly tradingName?: string | undefined;
    readonly vatId?: string | undefined;
    readonly taxId?: string | undefined;
    readonly legalId?: string | undefined;
    readonly legalIdScheme?: string | undefined;
    readonly email?: string | undefined;
    readonly phone?: string | undefined;
    readonly globalId?: string | undefined;
    readonly electronicAddress?: string | undefined;
    readonly electronicAddressScheme?: string | undefined;
    constructor(name: string, address: PostalAddress, tradingName?: string | undefined, vatId?: string | undefined, taxId?: string | undefined, legalId?: string | undefined, legalIdScheme?: string | undefined, email?: string | undefined, phone?: string | undefined, globalId?: string | undefined, electronicAddress?: string | undefined, electronicAddressScheme?: string | undefined);
    static builder(): TradePartyBuilder;
}
declare class TradePartyBuilder {
    private _name?;
    private _address?;
    private _tradingName?;
    private _vatId?;
    private _taxId?;
    private _legalId?;
    private _legalIdScheme?;
    private _email?;
    private _phone?;
    private _globalId?;
    private _electronicAddress?;
    private _electronicAddressScheme?;
    name(value: string): this;
    address(value: PostalAddress): this;
    tradingName(value: string): this;
    vatId(value: string): this;
    taxId(value: string): this;
    legalId(value: string): this;
    legalIdScheme(value: string): this;
    email(value: string): this;
    phone(value: string): this;
    globalId(value: string): this;
    electronicAddress(value: string): this;
    electronicAddressScheme(value: string): this;
    build(): TradePartyImpl;
}
export declare class PaymentDetailsImpl implements PaymentDetails {
    readonly meansCode: PaymentMeansCode;
    readonly iban?: string | undefined;
    readonly bic?: string | undefined;
    readonly reference?: string | undefined;
    readonly dueDate?: Date | undefined;
    readonly termsDescription?: string | undefined;
    constructor(meansCode: PaymentMeansCode, iban?: string | undefined, bic?: string | undefined, reference?: string | undefined, dueDate?: Date | undefined, termsDescription?: string | undefined);
    static builder(): PaymentDetailsBuilder;
}
declare class PaymentDetailsBuilder {
    private _meansCode?;
    private _iban?;
    private _bic?;
    private _reference?;
    private _dueDate?;
    private _termsDescription?;
    meansCode(value: PaymentMeansCode): this;
    iban(value: string): this;
    bic(value: string): this;
    reference(value: string): this;
    dueDate(value: Date): this;
    termsDescription(value: string): this;
    build(): PaymentDetailsImpl;
}
export declare class DocumentHeaderImpl implements DocumentHeader {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly name: string;
    readonly invoiceDate: Date;
    readonly typeCode: DocTypeCode;
    readonly dueDate?: Date | undefined;
    readonly billingPeriodStart?: Date | undefined;
    readonly billingPeriodEnd?: Date | undefined;
    readonly purchaseOrderReference?: string | undefined;
    readonly salesOrderReference?: string | undefined;
    readonly contractReference?: string | undefined;
    readonly notes?: (string | NoteWithCode)[] | undefined;
    constructor(id: string, invoiceNumber: string, name: string, invoiceDate: Date, typeCode: DocTypeCode, dueDate?: Date | undefined, billingPeriodStart?: Date | undefined, billingPeriodEnd?: Date | undefined, purchaseOrderReference?: string | undefined, salesOrderReference?: string | undefined, contractReference?: string | undefined, notes?: (string | NoteWithCode)[] | undefined);
    static builder(): DocumentHeaderBuilder;
}
declare class DocumentHeaderBuilder {
    private _id?;
    private _invoiceNumber?;
    private _name;
    private _invoiceDate?;
    private _typeCode;
    private _dueDate?;
    private _billingPeriodStart?;
    private _billingPeriodEnd?;
    private _purchaseOrderReference?;
    private _salesOrderReference?;
    private _contractReference?;
    private _notes?;
    id(value: string): this;
    invoiceNumber(value: string): this;
    name(value: string): this;
    invoiceDate(value: Date): this;
    typeCode(value: DocTypeCode): this;
    dueDate(value: Date): this;
    billingPeriod(start: Date, end: Date): this;
    purchaseOrderReference(value: string): this;
    salesOrderReference(value: string): this;
    contractReference(value: string): this;
    addNote(note: string): this;
    addNoteWithCode(content: string, subjectCode: string): this;
    build(): DocumentHeaderImpl;
}
export declare class AllowanceCharge implements IAllowanceCharge {
    readonly chargeIndicator: boolean;
    readonly actualAmount: number;
    readonly reason?: string | undefined;
    readonly reasonCode?: string | undefined;
    readonly taxRate?: number | undefined;
    readonly taxCategoryCode?: string | undefined;
    readonly baseAmount?: number | undefined;
    readonly percentage?: number | undefined;
    constructor(chargeIndicator: boolean, actualAmount: number, reason?: string | undefined, reasonCode?: string | undefined, taxRate?: number | undefined, taxCategoryCode?: string | undefined, baseAmount?: number | undefined, percentage?: number | undefined);
    static allowance(amount: number, reason?: string, reasonCode?: string): AllowanceCharge;
    static charge(amount: number, reason?: string, reasonCode?: string): AllowanceCharge;
}
export declare class InvoiceLine implements IInvoiceLine {
    readonly id: string;
    readonly description: string;
    quantity: number;
    unitPrice: number;
    readonly vatRate: number;
    readonly taxCategoryCode: string;
    readonly unitCode: string;
    readonly billingPeriodStart?: Date | undefined;
    readonly billingPeriodEnd?: Date | undefined;
    readonly deliveredQuantity?: number | undefined;
    readonly productId?: string | undefined;
    readonly ean?: string | undefined;
    readonly allowances: AllowanceCharge[];
    readonly charges: AllowanceCharge[];
    constructor(id: string, description: string, quantity: number, unitPrice: number, vatRate: number, taxCategoryCode?: string, unitCode?: string, billingPeriodStart?: Date | undefined, billingPeriodEnd?: Date | undefined, deliveredQuantity?: number | undefined, productId?: string | undefined, ean?: string | undefined);
    get lineTotal(): number;
    addAllowance(amount: number, reason?: string): void;
    addCharge(amount: number, reason?: string): void;
    addAllowanceCharge(amount: number, isCharge: boolean, reason?: string): void;
    getAllAllowancesCharges(): AllowanceCharge[];
    clearAllowancesCharges(): void;
    static builder(): InvoiceLineBuilder;
}
declare class InvoiceLineBuilder {
    private _id?;
    private _description?;
    private _quantity;
    private _unitPrice;
    private _vatRate;
    private _taxCategoryCode;
    private _unitCode;
    private _billingPeriodStart?;
    private _billingPeriodEnd?;
    private _deliveredQuantity?;
    private _productId?;
    private _ean?;
    id(value: string): this;
    description(value: string): this;
    quantity(value: number): this;
    unitPrice(value: number): this;
    vatRate(value: number): this;
    taxCategoryCode(value: string): this;
    unitCode(value: string): this;
    billingPeriod(start: Date, end: Date): this;
    deliveredQuantity(value: number): this;
    productId(value: string): this;
    ean(value: string): this;
    build(): InvoiceLine;
}
export {};
//# sourceMappingURL=entities.d.ts.map