"use strict";
/**
 * @module BusinessRuleValidator
 * @description EN16931 Schematron business rules + French BR-FR rules for Factur-X
 *
 * Implements ~50 critical business rules operating on invoice DATA (not XML)
 * for fast pre-generation validation. Rules are organized by category:
 *
 * - BR-01 to BR-16:  Core presence rules
 * - BR-CO-10 to BR-CO-26: Calculation coherence rules
 * - BR-DEC-01 to BR-DEC-17: Decimal precision rules
 * - BR-S-01 to BR-S-08: VAT standard rate rules
 * - BR-FR-05 to BR-FR-13: French rules (XP Z12-012)
 *
 * Performance: O(n + m) where n = lines, m = tax summaries
 *
 * @see https://www.cen.eu/work/areas/ict/ebusiness/pages/ws-ebilling.aspx
 * @see https://fnfe-mpe.org/factur-x/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleValidator = void 0;
exports.getDefaultBusinessRuleValidator = getDefaultBusinessRuleValidator;
exports.validateBusinessRules = validateBusinessRules;
const types_1 = require("../types");
const constants_1 = require("../core/constants");
// ============================================================================
// PROFILE ORDERING - for minProfile comparison
// ============================================================================
const PROFILE_ORDER = [
    types_1.FacturxProfile.MINIMUM,
    types_1.FacturxProfile.BASICWL,
    types_1.FacturxProfile.BASIC,
    types_1.FacturxProfile.EN16931,
    types_1.FacturxProfile.EXTENDED,
];
/**
 * Returns true if `actual` profile is at or above `min` profile level
 */
function profileAtLeast(actual, min) {
    return PROFILE_ORDER.indexOf(actual) >= PROFILE_ORDER.indexOf(min);
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Rounds a number to 2 decimal places using banker's rounding
 */
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
/**
 * Checks if a number has at most `maxDecimals` decimal places
 */
function hasMaxDecimals(value, maxDecimals) {
    if (value === undefined || value === null) {
        return true; // Absent values are not checked for precision
    }
    if (!isFinite(value)) {
        return false;
    }
    // Multiply, round, and compare to detect excess precision
    const factor = Math.pow(10, maxDecimals);
    return Math.abs(value * factor - Math.round(value * factor)) < 1e-9;
}
/**
 * Safely gets the totals from an invoice, computing them if needed
 */
function getTotals(invoice) {
    try {
        return invoice.totals;
    }
    catch {
        return null;
    }
}
// ============================================================================
// BUSINESS RULE DEFINITIONS
// ============================================================================
/**
 * Build all business rules.
 * Rules are defined as pure functions testing a FacturXInvoice instance.
 */
function buildAllRules() {
    const rules = [];
    // --------------------------------------------------------------------------
    // BR-01 to BR-16: Core Presence Rules
    // --------------------------------------------------------------------------
    rules.push({
        id: 'BR-01',
        description: 'An Invoice shall have a Specification identifier (guideline URN)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            const urn = constants_1.GUIDELINE_URNS.get(inv.profile);
            return urn !== undefined && urn.length > 0;
        },
    });
    rules.push({
        id: 'BR-02',
        description: 'An Invoice shall have an Invoice number (BT-1)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return inv.header?.id !== undefined && inv.header.id.trim().length > 0;
        },
    });
    rules.push({
        id: 'BR-03',
        description: 'An Invoice shall have an Invoice issue date (BT-2)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return inv.header?.invoiceDate instanceof Date && !isNaN(inv.header.invoiceDate.getTime());
        },
    });
    rules.push({
        id: 'BR-04',
        description: 'An Invoice shall have an Invoice type code (BT-3)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return inv.header?.typeCode !== undefined && inv.header.typeCode !== null;
        },
    });
    rules.push({
        id: 'BR-05',
        description: 'An Invoice shall have an Invoice currency code (BT-5)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return (inv.currency !== undefined &&
                inv.currency !== null &&
                typeof inv.currency === 'string' &&
                inv.currency.trim().length === 3);
        },
    });
    rules.push({
        id: 'BR-06',
        description: 'An Invoice shall contain the Seller name (BT-27)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return inv.seller?.name !== undefined && inv.seller.name.trim().length > 0;
        },
    });
    rules.push({
        id: 'BR-07',
        description: 'An Invoice shall contain the Buyer name (BT-44)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            return inv.buyer?.name !== undefined && inv.buyer.name.trim().length > 0;
        },
    });
    rules.push({
        id: 'BR-08',
        description: 'An Invoice shall contain the Seller postal address (BG-5)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASICWL,
        test: (inv) => {
            return inv.seller?.address !== undefined && inv.seller.address !== null;
        },
    });
    rules.push({
        id: 'BR-09',
        description: 'The Seller postal address shall contain a Seller country code (BT-40)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASICWL,
        test: (inv) => {
            return (inv.seller?.address?.countryCode !== undefined &&
                inv.seller.address.countryCode.trim().length === 2);
        },
    });
    rules.push({
        id: 'BR-10',
        description: 'An Invoice shall contain the Buyer postal address (BG-8)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASICWL,
        test: (inv) => {
            return inv.buyer?.address !== undefined && inv.buyer.address !== null;
        },
    });
    rules.push({
        id: 'BR-11',
        description: 'The Buyer postal address shall contain a Buyer country code (BT-55)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASICWL,
        test: (inv) => {
            return (inv.buyer?.address?.countryCode !== undefined &&
                inv.buyer.address.countryCode.trim().length === 2);
        },
    });
    rules.push({
        id: 'BR-12',
        description: 'An Invoice shall have the Sum of Invoice line net amount (BT-106)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals !== null && totals.lineTotal !== undefined && isFinite(totals.lineTotal);
        },
    });
    rules.push({
        id: 'BR-13',
        description: 'An Invoice shall have the Invoice total amount without VAT (BT-109)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals !== null && totals.taxBasis !== undefined && isFinite(totals.taxBasis);
        },
    });
    rules.push({
        id: 'BR-14',
        description: 'An Invoice shall have the Invoice total amount with VAT (BT-112)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            const totals = getTotals(inv);
            return totals !== null && totals.grandTotal !== undefined && isFinite(totals.grandTotal);
        },
    });
    rules.push({
        id: 'BR-15',
        description: 'An Invoice shall have the Amount due for payment (BT-115)',
        severity: 'error',
        category: 'presence',
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return false;
            // dueAmount is optional; if absent, grandTotal is used as dueAmount
            const due = totals.dueAmount ?? totals.grandTotal;
            return due !== undefined && isFinite(due);
        },
    });
    rules.push({
        id: 'BR-16',
        description: 'An Invoice shall have at least one Invoice line (BG-25)',
        severity: 'error',
        category: 'presence',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            // MINIMUM and BASICWL do not require lines; this rule only applies to BASIC+
            return inv.lines !== undefined && inv.lines.length > 0;
        },
    });
    // --------------------------------------------------------------------------
    // BR-CO-10 to BR-CO-26: Calculation Coherence Rules
    // --------------------------------------------------------------------------
    rules.push({
        id: 'BR-CO-10',
        description: 'Sum of Invoice line net amount = Invoice total amount without VAT line total (BT-106)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !inv.lines || inv.lines.length === 0)
                return true;
            const sumOfLineNets = inv.lines.reduce((sum, line) => sum + (line.lineTotal ?? line.quantity * line.unitPrice), 0);
            return Math.abs(round2(sumOfLineNets) - round2(totals.lineTotal)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-11',
        description: 'Sum of allowances at document level = Invoice total allowances (BT-107)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const docAllowances = (inv.docAllowancesCharges || [])
                .filter((ac) => !ac.chargeIndicator);
            const sumAllowances = docAllowances.reduce((sum, ac) => sum + (ac.actualAmount ?? 0), 0);
            const invoiceAllowanceTotal = totals.allowanceTotal ?? 0;
            return Math.abs(round2(sumAllowances) - round2(invoiceAllowanceTotal)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-12',
        description: 'Sum of charges at document level = Invoice total charges (BT-108)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const docCharges = (inv.docAllowancesCharges || [])
                .filter((ac) => ac.chargeIndicator);
            const sumCharges = docCharges.reduce((sum, ac) => sum + (ac.actualAmount ?? 0), 0);
            const invoiceChargeTotal = totals.chargeTotal ?? 0;
            return Math.abs(round2(sumCharges) - round2(invoiceChargeTotal)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-13',
        description: 'Invoice total without VAT = Line total - Allowance total + Charge total (BT-109 = BT-106 - BT-107 + BT-108)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const expected = round2(totals.lineTotal - (totals.allowanceTotal ?? 0) + (totals.chargeTotal ?? 0));
            return Math.abs(expected - round2(totals.taxBasis)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-14',
        description: 'Invoice total VAT amount = Sum of VAT category tax amounts (BT-110)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            if (!totals.taxSummaries || totals.taxSummaries.length === 0) {
                // No tax summaries: taxTotal should be 0
                return Math.abs(totals.taxTotal) < 0.02;
            }
            const sumCategoryTax = totals.taxSummaries.reduce((sum, ts) => sum + ts.taxAmount, 0);
            return Math.abs(round2(sumCategoryTax) - round2(totals.taxTotal)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-15',
        description: 'Invoice total with VAT = Invoice total without VAT + Invoice total VAT amount (BT-112 = BT-109 + BT-110)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const expected = round2(totals.taxBasis + totals.taxTotal);
            return Math.abs(expected - round2(totals.grandTotal)) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-16',
        description: 'Amount due for payment = Invoice total with VAT - Paid amount + Rounding amount (BT-115 = BT-112 - BT-113 + BT-114)',
        severity: 'error',
        category: 'calculation',
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const dueAmount = totals.dueAmount ?? totals.grandTotal;
            const paidAmount = totals.paidAmount ?? 0;
            const expected = round2(totals.grandTotal - paidAmount);
            return Math.abs(round2(dueAmount) - expected) < 0.02;
        },
    });
    rules.push({
        id: 'BR-CO-17',
        description: 'VAT category tax amount = VAT category taxable amount * VAT category rate / 100 (within 0.02 tolerance)',
        severity: 'warning',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries)
                return true;
            for (const ts of totals.taxSummaries) {
                const expected = round2(ts.taxable * ts.rate / 100);
                if (Math.abs(round2(ts.taxAmount) - expected) > 0.02) {
                    return false;
                }
            }
            return true;
        },
    });
    rules.push({
        id: 'BR-CO-25',
        description: 'If the Amount due for payment is positive, either the Payment due date or the Payment terms shall be provided',
        severity: 'warning',
        category: 'calculation',
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null)
                return true;
            const dueAmount = totals.dueAmount ?? totals.grandTotal;
            if (dueAmount <= 0)
                return true;
            // Check for due date or payment terms
            const hasDueDate = inv.payment?.dueDate instanceof Date || inv.header?.dueDate instanceof Date;
            const hasTerms = inv.payment?.termsDescription !== undefined && inv.payment.termsDescription.trim().length > 0;
            return hasDueDate || hasTerms;
        },
    });
    rules.push({
        id: 'BR-CO-26',
        description: 'The Seller shall have at least one of: Seller identifier (BT-29), Seller legal registration (BT-30), or Seller VAT identifier (BT-31)',
        severity: 'error',
        category: 'calculation',
        minProfile: types_1.FacturxProfile.BASICWL,
        test: (inv) => {
            if (!inv.seller)
                return false;
            const hasGlobalId = inv.seller.globalId !== undefined && inv.seller.globalId.trim().length > 0;
            const hasLegalId = inv.seller.legalId !== undefined && inv.seller.legalId.trim().length > 0;
            const hasVatId = inv.seller.vatId !== undefined && inv.seller.vatId.trim().length > 0;
            return hasGlobalId || hasLegalId || hasVatId;
        },
    });
    // --------------------------------------------------------------------------
    // BR-DEC-01 to BR-DEC-17: Decimal Precision Rules
    // --------------------------------------------------------------------------
    rules.push({
        id: 'BR-DEC-01',
        description: 'The allowed maximum number of decimals for the Sum of Invoice line net amount is 2 (BT-106)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.lineTotal, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-02',
        description: 'The allowed maximum number of decimals for the Sum of allowances on document level is 2 (BT-107)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.allowanceTotal, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-03',
        description: 'The allowed maximum number of decimals for the Sum of charges on document level is 2 (BT-108)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.chargeTotal, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-04',
        description: 'The allowed maximum number of decimals for the Invoice total amount without VAT is 2 (BT-109)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.taxBasis, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-05',
        description: 'The allowed maximum number of decimals for the Invoice total VAT amount is 2 (BT-110)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.taxTotal, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-06',
        description: 'The allowed maximum number of decimals for the Invoice total amount with VAT is 2 (BT-112)',
        severity: 'error',
        category: 'decimal',
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.grandTotal, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-07',
        description: 'The allowed maximum number of decimals for the Amount due for payment is 2 (BT-115)',
        severity: 'error',
        category: 'decimal',
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.dueAmount, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-08',
        description: 'The allowed maximum number of decimals for the Paid amount is 2 (BT-113)',
        severity: 'error',
        category: 'decimal',
        test: (inv) => {
            const totals = getTotals(inv);
            return totals === null || hasMaxDecimals(totals.paidAmount, 2);
        },
    });
    rules.push({
        id: 'BR-DEC-09',
        description: 'The allowed maximum number of decimals for the VAT category taxable amount is 2 (BT-116)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries)
                return true;
            return totals.taxSummaries.every((ts) => hasMaxDecimals(ts.taxable, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-10',
        description: 'The allowed maximum number of decimals for the VAT category tax amount is 2 (BT-117)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries)
                return true;
            return totals.taxSummaries.every((ts) => hasMaxDecimals(ts.taxAmount, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-11',
        description: 'The allowed maximum number of decimals for the Invoice line net amount is 2 (BT-131)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            if (!inv.lines)
                return true;
            return inv.lines.every((line) => hasMaxDecimals(line.lineTotal, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-12',
        description: 'The allowed maximum number of decimals for the Invoice line allowance amount is 2',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            if (!inv.lines)
                return true;
            return inv.lines.every((line) => (line.allowances || []).every((ac) => hasMaxDecimals(ac.actualAmount, 2)));
        },
    });
    rules.push({
        id: 'BR-DEC-13',
        description: 'The allowed maximum number of decimals for the Invoice line charge amount is 2',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            if (!inv.lines)
                return true;
            return inv.lines.every((line) => (line.charges || []).every((ac) => hasMaxDecimals(ac.actualAmount, 2)));
        },
    });
    rules.push({
        id: 'BR-DEC-14',
        description: 'The allowed maximum number of decimals for the Document level allowance amount is 2 (BT-92)',
        severity: 'error',
        category: 'decimal',
        test: (inv) => {
            return (inv.docAllowancesCharges || [])
                .filter((ac) => !ac.chargeIndicator)
                .every((ac) => hasMaxDecimals(ac.actualAmount, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-15',
        description: 'The allowed maximum number of decimals for the Document level charge amount is 2 (BT-99)',
        severity: 'error',
        category: 'decimal',
        test: (inv) => {
            return (inv.docAllowancesCharges || [])
                .filter((ac) => ac.chargeIndicator)
                .every((ac) => hasMaxDecimals(ac.actualAmount, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-16',
        description: 'The allowed maximum number of decimals for the Item net price is 2 (BT-146)',
        severity: 'error',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            if (!inv.lines)
                return true;
            return inv.lines.every((line) => hasMaxDecimals(line.unitPrice, 2));
        },
    });
    rules.push({
        id: 'BR-DEC-17',
        description: 'The allowed maximum number of decimals for the Invoiced quantity is 2 (BT-129)',
        severity: 'warning',
        category: 'decimal',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            if (!inv.lines)
                return true;
            return inv.lines.every((line) => hasMaxDecimals(line.quantity, 2));
        },
    });
    // --------------------------------------------------------------------------
    // BR-S-01, BR-S-05, BR-S-08: VAT Standard Rate Rules
    // --------------------------------------------------------------------------
    rules.push({
        id: 'BR-S-01',
        description: 'An Invoice that contains a VAT category code "Standard rate" (S) shall have a positive VAT category taxable amount (BT-116)',
        severity: 'error',
        category: 'vat',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries)
                return true;
            for (const ts of totals.taxSummaries) {
                if (ts.category === 'S' && ts.taxable <= 0) {
                    return false;
                }
            }
            return true;
        },
    });
    rules.push({
        id: 'BR-S-05',
        description: 'In a VAT breakdown where the VAT category code is "Standard rate" (S), the VAT category rate shall be greater than zero',
        severity: 'error',
        category: 'vat',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries)
                return true;
            for (const ts of totals.taxSummaries) {
                if (ts.category === 'S' && ts.rate <= 0) {
                    return false;
                }
            }
            return true;
        },
    });
    rules.push({
        id: 'BR-S-08',
        description: 'For each VAT breakdown with category "Standard rate" (S), the taxable amount shall equal the sum of line net amounts for lines with the same rate, adjusted by doc-level allowances/charges for that rate',
        severity: 'warning',
        category: 'vat',
        minProfile: types_1.FacturxProfile.BASIC,
        test: (inv) => {
            const totals = getTotals(inv);
            if (totals === null || !totals.taxSummaries || !inv.lines)
                return true;
            // For each S-rate category in tax summaries, verify taxable base
            for (const ts of totals.taxSummaries) {
                if (ts.category !== 'S')
                    continue;
                // Sum line net amounts matching this rate (vatRate is decimal, ts.rate is percentage)
                const rateDecimal = ts.rate / 100;
                let sumLineNets = 0;
                for (const line of inv.lines) {
                    if (line.taxCategoryCode === 'S' && Math.abs(line.vatRate - rateDecimal) < 0.001) {
                        sumLineNets += line.lineTotal ?? line.quantity * line.unitPrice;
                    }
                }
                // Adjust for doc-level allowances/charges matching this rate
                for (const ac of inv.docAllowancesCharges || []) {
                    const acRate = ac.taxRate ?? 0;
                    const acCategory = ac.taxCategoryCode ?? 'S';
                    if (acCategory === 'S' && Math.abs(acRate - rateDecimal) < 0.001) {
                        if (ac.chargeIndicator) {
                            sumLineNets += ac.actualAmount ?? 0;
                        }
                        else {
                            sumLineNets -= ac.actualAmount ?? 0;
                        }
                    }
                }
                if (Math.abs(round2(sumLineNets) - round2(ts.taxable)) > 0.02) {
                    return false;
                }
            }
            return true;
        },
    });
    // --------------------------------------------------------------------------
    // BR-FR-05, BR-FR-10, BR-FR-12, BR-FR-13: French Rules (XP Z12-012)
    // --------------------------------------------------------------------------
    rules.push({
        id: 'BR-FR-05',
        description: 'For French invoices, notes with SubjectCode PMT (payment terms), PMD (payment means description), and AAB (contractual notes) are mandatory',
        severity: 'warning',
        category: 'french',
        test: (inv) => {
            if (!inv.header?.notes || inv.header.notes.length === 0)
                return false;
            const requiredCodes = ['PMT', 'PMD', 'AAB'];
            const presentCodes = new Set();
            for (const note of inv.header.notes) {
                if (typeof note !== 'string' && note.subjectCode) {
                    presentCodes.add(note.subjectCode);
                }
            }
            return requiredCodes.every((code) => presentCodes.has(code));
        },
    });
    rules.push({
        id: 'BR-FR-10',
        description: 'For French invoices, the Seller legal registration identifier (BT-30) with scheme 0002 (SIREN) is mandatory and must be 9 digits',
        severity: 'error',
        category: 'french',
        test: (inv) => {
            if (!inv.seller)
                return false;
            const legalId = inv.seller.legalId;
            const scheme = inv.seller.legalIdScheme ?? '0002';
            if (!legalId || scheme !== '0002')
                return false;
            // SIREN must be exactly 9 digits
            return /^\d{9}$/.test(legalId.trim());
        },
    });
    rules.push({
        id: 'BR-FR-12',
        description: 'For French invoices, the Buyer electronic address (BT-49) is mandatory',
        severity: 'error',
        category: 'french',
        test: (inv) => {
            return (inv.buyer?.electronicAddress !== undefined &&
                inv.buyer.electronicAddress.trim().length > 0);
        },
    });
    rules.push({
        id: 'BR-FR-13',
        description: 'For French invoices, the Seller electronic address (BT-34) is mandatory',
        severity: 'error',
        category: 'french',
        test: (inv) => {
            return (inv.seller?.electronicAddress !== undefined &&
                inv.seller.electronicAddress.trim().length > 0);
        },
    });
    return rules;
}
// ============================================================================
// BUSINESS RULE VALIDATOR
// ============================================================================
class BusinessRuleValidator {
    /**
     * Create a BusinessRuleValidator
     * @param options - Configuration options
     */
    constructor(options) {
        this.allRules = Object.freeze(buildAllRules());
        this.enableFrenchRules = options?.enableFrenchRules ?? false;
        this.overrideProfile = options?.profile;
    }
    /**
     * Validate an invoice against all applicable business rules
     *
     * @param invoice - The FacturXInvoice instance to validate
     * @returns Structured validation result with per-rule pass/fail
     */
    validate(invoice) {
        const profile = this.overrideProfile ?? invoice.profile;
        const applicableRules = this.getRulesForProfile(profile);
        const results = [];
        const errors = [];
        const warnings = [];
        for (const rule of applicableRules) {
            let passed;
            let message;
            try {
                passed = rule.test(invoice);
                message = passed ? rule.description : `FAILED: ${rule.description}`;
            }
            catch (e) {
                passed = false;
                message = `FAILED: ${rule.description} (exception: ${e instanceof Error ? e.message : 'Unknown'})`;
            }
            const result = {
                ruleId: rule.id,
                passed,
                message,
                severity: rule.severity,
            };
            results.push(result);
            if (!passed) {
                if (rule.severity === 'error') {
                    errors.push(result);
                }
                else {
                    warnings.push(result);
                }
            }
        }
        const totalRules = applicableRules.length;
        const passedCount = results.filter((r) => r.passed).length;
        const score = totalRules > 0 ? Math.round((passedCount / totalRules) * 100) : 100;
        return {
            isValid: errors.length === 0,
            results: Object.freeze(results),
            errors: Object.freeze(errors),
            warnings: Object.freeze(warnings),
            score,
            profile,
        };
    }
    /**
     * Validate a single rule by ID against an invoice
     *
     * @param ruleId - The rule identifier (e.g. 'BR-02', 'BR-CO-13')
     * @param invoice - The FacturXInvoice instance to validate
     * @returns Single rule result
     * @throws Error if ruleId is not found
     */
    validateRule(ruleId, invoice) {
        const rule = this.allRules.find((r) => r.id === ruleId);
        if (!rule) {
            throw new Error(`Unknown business rule: ${ruleId}`);
        }
        let passed;
        let message;
        try {
            passed = rule.test(invoice);
            message = passed ? rule.description : `FAILED: ${rule.description}`;
        }
        catch (e) {
            passed = false;
            message = `FAILED: ${rule.description} (exception: ${e instanceof Error ? e.message : 'Unknown'})`;
        }
        return {
            ruleId: rule.id,
            passed,
            message,
            severity: rule.severity,
        };
    }
    /**
     * Get all rules applicable to a given profile
     *
     * @param profile - The Factur-X profile level
     * @returns Array of applicable BusinessRule instances
     */
    getRulesForProfile(profile) {
        return this.allRules.filter((rule) => {
            // Filter out French rules if not enabled
            if (rule.category === 'french' && !this.enableFrenchRules) {
                return false;
            }
            // Filter by minimum profile requirement
            if (rule.minProfile && !profileAtLeast(profile, rule.minProfile)) {
                return false;
            }
            return true;
        });
    }
    /**
     * Get total number of rules registered
     */
    getTotalRuleCount() {
        return this.allRules.length;
    }
    /**
     * Get all rule IDs
     */
    getAllRuleIds() {
        return this.allRules.map((r) => r.id);
    }
}
exports.BusinessRuleValidator = BusinessRuleValidator;
// ============================================================================
// SINGLETON & CONVENIENCE FUNCTIONS
// ============================================================================
let defaultBusinessRuleValidator = null;
/**
 * Get default business rule validator - Lazy singleton
 */
function getDefaultBusinessRuleValidator() {
    if (!defaultBusinessRuleValidator) {
        defaultBusinessRuleValidator = new BusinessRuleValidator();
    }
    return defaultBusinessRuleValidator;
}
/**
 * Convenience function - validate with default validator
 */
function validateBusinessRules(invoice) {
    return getDefaultBusinessRuleValidator().validate(invoice);
}
//# sourceMappingURL=BusinessRuleValidator.js.map