"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxCalculator = void 0;
class TaxCalculator {
    constructor(roundMode = 'line') {
        this.roundMode = roundMode;
    }
    computeSummary(lines, docAllowancesCharges = []) {
        const vatMap = new Map();
        let lineTotal = 0;
        for (const line of lines) {
            const qty = line.quantity;
            const price = line.unitPrice;
            const lineHT = qty * price;
            lineTotal += lineHT;
            const rate = line.vatRate ?? 0;
            const category = line.taxCategoryCode ?? 'S';
            if (this.roundMode === 'line') {
                const tax = lineHT * rate;
                this.updateVatMap(vatMap, rate, category, lineHT, tax);
            }
            else {
                this.updateVatMap(vatMap, rate, category, lineHT);
            }
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
        let docBase = 0;
        let allowanceTotal = 0;
        let chargeTotal = 0;
        for (const dac of docAllowancesCharges) {
            const dacAmt = dac.actualAmount ?? 0;
            const sign = dac.chargeIndicator ? 1 : -1;
            const partialBase = dacAmt * sign;
            docBase += partialBase;
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
        if (this.roundMode === 'global') {
            for (const [key, val] of vatMap.entries()) {
                if (val.tax === undefined) {
                    const rate = this.extractRateFromKey(key);
                    val.tax = val.taxable * rate;
                }
            }
        }
        let totalTax = 0;
        const taxSummaries = [];
        for (const [key, val] of vatMap.entries()) {
            const [rate, category] = this.decodeKey(key);
            const tax = val.tax ?? 0;
            totalTax += tax;
            taxSummaries.push({
                rate: rate * 100,
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
    updateVatMap(vatMap, rate, category, taxable, tax) {
        const key = this.encodeKey(rate, category);
        const existing = vatMap.get(key);
        if (existing) {
            existing.taxable += taxable;
            if (tax !== undefined) {
                existing.tax = (existing.tax ?? 0) + tax;
            }
        }
        else {
            vatMap.set(key, { taxable, tax });
        }
    }
    encodeKey(rate, category) {
        return `${rate}|${category}`;
    }
    decodeKey(key) {
        const pipeIndex = key.indexOf('|');
        const rateStr = key.substring(0, pipeIndex);
        const category = key.substring(pipeIndex + 1);
        return [Number(rateStr), category];
    }
    extractRateFromKey(key) {
        const pipeIndex = key.indexOf('|');
        return Number(key.substring(0, pipeIndex));
    }
}
exports.TaxCalculator = TaxCalculator;
//# sourceMappingURL=TaxCalculator.js.map