import { FacturxProfile, DocumentHeader, TradeParty, PaymentDetails, InvoiceLine, AllowanceCharge, MonetarySummary, CurrencyCode, ComplianceType, RegionalConfig } from '../types';
export declare class FacturXInvoice {
    readonly profile: FacturxProfile;
    readonly header: DocumentHeader;
    readonly seller: TradeParty;
    readonly buyer: TradeParty;
    readonly payment: PaymentDetails;
    readonly lines: InvoiceLine[];
    readonly docAllowancesCharges: AllowanceCharge[];
    readonly currency: CurrencyCode | string;
    readonly compliance: ComplianceType;
    readonly regionalConfig?: RegionalConfig | undefined;
    private readonly taxCalculator;
    private cachedSummary?;
    private cachedXml?;
    constructor(profile: FacturxProfile, header: DocumentHeader, seller: TradeParty, buyer: TradeParty, payment: PaymentDetails, lines?: InvoiceLine[], docAllowancesCharges?: AllowanceCharge[], currency?: CurrencyCode | string, compliance?: ComplianceType, regionalConfig?: RegionalConfig | undefined);
    addLine(line: InvoiceLine): void;
    addDocAllowanceCharge(ac: AllowanceCharge): void;
    finalizeTotals(): MonetarySummary;
    get totals(): MonetarySummary;
    validateProfile(): void;
    generateXml(checkProfile?: boolean): string;
    private buildXmlDocument;
    private buildDocumentContext;
    private buildDocumentHeader;
    private buildSupplyChainTransaction;
    private buildHeaderTradeAgreement;
    private buildHeaderTradeDelivery;
    private buildHeaderTradeSettlement;
    private buildLineItems;
    private hasField;
    private invalidateCaches;
    static builder(profile: FacturxProfile): FacturXInvoiceBuilder;
}
export declare class FacturXInvoiceBuilder {
    private readonly profile;
    private _header?;
    private _seller?;
    private _buyer?;
    private _payment?;
    private _lines;
    private _docAC;
    constructor(profile: FacturxProfile);
    header(value: DocumentHeader): this;
    seller(value: TradeParty): this;
    buyer(value: TradeParty): this;
    payment(value: PaymentDetails): this;
    addLine(line: InvoiceLine): this;
    addDocAllowanceCharge(ac: AllowanceCharge): this;
    build(): FacturXInvoice;
}
//# sourceMappingURL=FacturXInvoice.d.ts.map