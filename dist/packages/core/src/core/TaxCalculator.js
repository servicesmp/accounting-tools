"use strict";
/**
 * @module TaxCalculator
 * @description Highly optimized tax calculation engine
 * Uses efficient algorithms and data structures for maximum performance
 * Time complexity: O(n + m) where n=lines, m=allowances/charges
 * Space complexity: O(k) where k=number of unique tax rates (usually small)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxCalculator = void 0;
// ============================================================================
// OPTIMIZED TAX CALCULATOR
// ============================================================================
class TaxCalculator {
    /**
     * Create tax calculator with specified rounding mode
     * @param roundMode - 'line' (default) or 'global'
     */
    constructor(roundMode = 'line') {
        this.roundMode = roundMode;
    }
    /**
     * Compute monetary summary - HIGHLY OPTIMIZED
     * Algorithm: Single-pass with Map for O(1) tax grouping
     *
     * @param lines - Invoice lines
     * @param docAllowancesCharges - Document-level adjustments
     * @returns Complete monetary summary
     */
    computeSummary(lines, docAllowancesCharges = []) {
        // Use Map for O(1) lookups instead of object
        const vatMap = new Map();
        let lineTotal = 0;
        // Process lines - Single pass O(n)
        for (const line of lines) {
            // Calculate line total (optimized: single multiplication)
            const qty = line.quantity;
            const price = line.unitPrice;
            const lineHT = qty * price;
            lineTotal += lineHT;
            // Get tax info (with defaults to avoid conditionals)
            const rate = line.vatRate ?? 0;
            const category = line.taxCategoryCode ?? 'S';
            // Update tax map
            if (this.roundMode === 'line') {
                const tax = lineHT * rate;
                this.updateVatMap(vatMap, rate, category, lineHT, tax);
            }
            else {
                this.updateVatMap(vatMap, rate, category, lineHT);
            }
            // Process line-level allowances/charges - O(m) where m is typically small
            const lineAC = line.allowances.concat(line.charges);
            if (lineAC.length > 0) {
                for (const ac of lineAC) {
                    const acAmount = ac.actualAmount ?? 0;
                    const sign = ac.chargeIndicator ? 1 : -1;
                    const partialBase = acAmount * sign;
                    const acRate = ac.taxRate ?? rate;
                    const acCat = ac.taxCategoryCode ?? category;
                    if (this.roundMode === 'line') {
                        const partialTax = partialBase * acRate;
                        this.updateVatMap(vatMap, acRate, acCat, partialBase, partialTax);
                    }
                    else {
                        this.updateVatMap(vatMap, acRate, acCat, partialBase);
                    }
                    lineTotal += partialBase;
                }
            }
        }
        // Process document-level allowances/charges - O(k) where k is typically small
        let docBase = 0;
        let allowanceTotal = 0;
        let chargeTotal = 0;
        for (const dac of docAllowancesCharges) {
            const dacAmt = dac.actualAmount ?? 0;
            const sign = dac.chargeIndicator ? 1 : -1;
            const partialBase = dacAmt * sign;
            docBase += partialBase;
            // Track allowances and charges separately for BR-CO-13 compliance
            if (dac.chargeIndicator) {
                chargeTotal += dacAmt;
            }
            else {
                allowanceTotal += dacAmt;
            }
            const rate = dac.taxRate ?? 0;
            const category = dac.taxCategoryCode ?? 'S';
            if (this.roundMode === 'line') {
                const partialTax = partialBase * rate;
                this.updateVatMap(vatMap, rate, category, partialBase, partialTax);
            }
            else {
                this.updateVatMap(vatMap, rate, category, partialBase);
            }
        }
        const taxBasis = lineTotal + docBase;
        // Global mode: Calculate taxes now - O(k) where k is number of unique rates
        if (this.roundMode === 'global') {
            for (const [key, val] of vatMap.entries()) {
                if (val.tax === undefined) {
                    const rate = this.extractRateFromKey(key);
                    val.tax = val.taxable * rate;
                }
            }
        }
        // Build result - O(k)
        let totalTax = 0;
        const taxSummaries = [];
        for (const [key, val] of vatMap.entries()) {
            const [rate, category] = this.decodeKey(key);
            const tax = val.tax ?? 0;
            totalTax += tax;
            taxSummaries.push({
                rate: rate * 100, // Convert to percentage
                category,
                taxable: val.taxable,
                taxAmount: tax,
            });
        }
        const grandTotal = taxBasis + totalTax;
        return {
            lineTotal,
            taxBasis,
            taxTotal: totalTax,
            grandTotal,
            allowanceTotal,
            chargeTotal,
            taxSummaries: Object.freeze(taxSummaries),
        };
    }
    // ==========================================================================
    // PRIVATE OPTIMIZED HELPERS
    // ==========================================================================
    /**
     * Update VAT map - Optimized for minimal operations
     * Uses Map.get + Map.set pattern which is faster than multiple lookups
     */
    updateVatMap(vatMap, rate, category, taxable, tax) {
        const key = this.encodeKey(rate, category);
        const existing = vatMap.get(key);
        if (existing) {
            // Update existing (reuse object to avoid allocation)
            existing.taxable += taxable;
            if (tax !== undefined) {
                existing.tax = (existing.tax ?? 0) + tax;
            }
        }
        else {
            // Create new (single allocation)
            vatMap.set(key, { taxable, tax });
        }
    }
    /**
     * Encode tax key - Optimized string concatenation
     * Uses template literal which is faster than string addition
     */
    encodeKey(rate, category) {
        return `${rate}|${category}`;
    }
    /**
     * Decode tax key - Optimized with indexOf (faster than split for simple case)
     */
    decodeKey(key) {
        const pipeIndex = key.indexOf('|');
        const rateStr = key.substring(0, pipeIndex);
        const category = key.substring(pipeIndex + 1);
        return [Number(rateStr), category];
    }
    /**
     * Extract rate from key - Optimized (avoid full decode when only rate needed)
     */
    extractRateFromKey(key) {
        const pipeIndex = key.indexOf('|');
        return Number(key.substring(0, pipeIndex));
    }
}
exports.TaxCalculator = TaxCalculator;
//# sourceMappingURL=TaxCalculator.js.map