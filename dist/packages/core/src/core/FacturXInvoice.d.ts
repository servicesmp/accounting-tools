/**
 * @module FacturXInvoice
 * @description Core Factur-X invoice implementation - HIGHLY OPTIMIZED
 *
 * Performance optimizations:
 * - Lazy evaluation of totals (only when needed)
 * - Cached XML generation
 * - Optimized XML building with minimal allocations
 * - Fast profile validation with Map-based lookups
 * - Pre-compiled regex patterns
 * - Efficient date formatting
 *
 * Complexity: O(n + m) where n=lines, m=allowances/charges
 */
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
    /**
     * Add invoice line - Optimized: direct push + cache invalidation
     */
    addLine(line: InvoiceLine): void;
    /**
     * Add document-level allowance/charge
     */
    addDocAllowanceCharge(ac: AllowanceCharge): void;
    /**
     * Finalize and get totals - CACHED for performance
     */
    finalizeTotals(): MonetarySummary;
    /**
     * Get totals - Lazy getter for profile validation
     * This allows profile validation to check for totals.lineTotal, etc.
     */
    get totals(): MonetarySummary;
    /**
     * Validate profile compliance - Optimized with Map lookups
     */
    validateProfile(): void;
    /**
     * Generate Factur-X XML - HIGHLY OPTIMIZED
     * Caches result until invoice is modified
     */
    generateXml(checkProfile?: boolean): string;
    /**
     * Build complete XML document - Optimized structure
     */
    private buildXmlDocument;
    /**
     * Build document context section
     */
    private buildDocumentContext;
    /**
     * Build document header section
     */
    private buildDocumentHeader;
    /**
     * Build supply chain trade transaction - MAIN SECTION
     */
    private buildSupplyChainTransaction;
    /**
     * Build header trade agreement (parties)
     */
    private buildHeaderTradeAgreement;
    /**
     * Build header trade delivery
     * PEPPOL-EN16931-R008: Document MUST not contain empty elements
     */
    private buildHeaderTradeDelivery;
    /**
     * Build header trade settlement (payment, taxes, totals)
     */
    private buildHeaderTradeSettlement;
    /**
     * Build line items - Optimized iteration
     */
    private buildLineItems;
    /**
     * Check if field exists - Optimized with memoization potential
     * Supports dot notation: "seller.address.city"
     */
    private hasField;
    /**
     * Invalidate all caches - Called when invoice is modified
     */
    private invalidateCaches;
    /**
     * Create builder for fluent API
     */
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