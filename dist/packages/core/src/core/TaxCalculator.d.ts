/**
 * @module TaxCalculator
 * @description Highly optimized tax calculation engine
 * Uses efficient algorithms and data structures for maximum performance
 * Time complexity: O(n + m) where n=lines, m=allowances/charges
 * Space complexity: O(k) where k=number of unique tax rates (usually small)
 */
import { MonetarySummary, InvoiceLine, AllowanceCharge } from '../types';
/**
 * Round mode for tax calculations
 * - 'line': Calculate and round tax for each line, then sum
 * - 'global': Sum all taxable amounts, then calculate tax once
 */
export type RoundMode = 'line' | 'global';
export declare class TaxCalculator {
    private readonly roundMode;
    /**
     * Create tax calculator with specified rounding mode
     * @param roundMode - 'line' (default) or 'global'
     */
    constructor(roundMode?: RoundMode);
    /**
     * Compute monetary summary - HIGHLY OPTIMIZED
     * Algorithm: Single-pass with Map for O(1) tax grouping
     *
     * @param lines - Invoice lines
     * @param docAllowancesCharges - Document-level adjustments
     * @returns Complete monetary summary
     */
    computeSummary(lines: readonly InvoiceLine[], docAllowancesCharges?: readonly AllowanceCharge[]): MonetarySummary;
    /**
     * Update VAT map - Optimized for minimal operations
     * Uses Map.get + Map.set pattern which is faster than multiple lookups
     */
    private updateVatMap;
    /**
     * Encode tax key - Optimized string concatenation
     * Uses template literal which is faster than string addition
     */
    private encodeKey;
    /**
     * Decode tax key - Optimized with indexOf (faster than split for simple case)
     */
    private decodeKey;
    /**
     * Extract rate from key - Optimized (avoid full decode when only rate needed)
     */
    private extractRateFromKey;
}
//# sourceMappingURL=TaxCalculator.d.ts.map