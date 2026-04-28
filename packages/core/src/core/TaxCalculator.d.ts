import { MonetarySummary, InvoiceLine, AllowanceCharge } from '../types';
export type RoundMode = 'line' | 'global';
export declare class TaxCalculator {
    private readonly roundMode;
    constructor(roundMode?: RoundMode);
    computeSummary(lines: readonly InvoiceLine[], docAllowancesCharges?: readonly AllowanceCharge[]): MonetarySummary;
    private updateVatMap;
    private encodeKey;
    private decodeKey;
    private extractRateFromKey;
}
//# sourceMappingURL=TaxCalculator.d.ts.map