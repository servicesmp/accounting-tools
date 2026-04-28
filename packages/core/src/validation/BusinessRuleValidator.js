"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleValidator = void 0;
exports.getDefaultBusinessRuleValidator = getDefaultBusinessRuleValidator;
exports.validateBusinessRules = validateBusinessRules;
const types_1 = require("../types");
const constants_1 = require("../core/constants");
const PROFILE_ORDER = [
    types_1.FacturxProfile.MINIMUM,
    types_1.FacturxProfile.BASICWL,
    types_1.FacturxProfile.BASIC,
    types_1.FacturxProfile.EN16931,
    types_1.FacturxProfile.EXTENDED,
];
function profileAtLeast(actual, min) {
    return PROFILE_ORDER.indexOf(actual) >= PROFILE_ORDER.indexOf(min);
}
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function hasMaxDecimals(value, maxDecimals) {
    if (value === undefined || value === null) {
        return true;
    }
    if (!isFinite(value)) {
        return false;
    }
    const factor = Math.pow(10, maxDecimals);
    return Math.abs(value * factor - Math.round(value * factor)) < 1e-9;
}
function getTotals(invoice) {
    try {
        return invoice.totals;
    }
    catch {
        return null;
    }
}
function buildAllRules() {
    const rules = [];
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
            return inv.lines !== undefined && inv.lines.length > 0;
        },
    });
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
            for (const ts of totals.taxSummaries) {
                if (ts.category !== 'S')
                    continue;
                const rateDecimal = ts.rate / 100;
                let sumLineNets = 0;
                for (const line of inv.lines) {
                    if (line.taxCategoryCode === 'S' && Math.abs(line.vatRate - rateDecimal) < 0.001) {
                        sumLineNets += line.lineTotal ?? line.quantity * line.unitPrice;
                    }
                }
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
class BusinessRuleValidator {
    constructor(options) {
        this.allRules = Object.freeze(buildAllRules());
        this.enableFrenchRules = options?.enableFrenchRules ?? false;
        this.overrideProfile = options?.profile;
    }
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
    getRulesForProfile(profile) {
        return this.allRules.filter((rule) => {
            if (rule.category === 'french' && !this.enableFrenchRules) {
                return false;
            }
            if (rule.minProfile && !profileAtLeast(profile, rule.minProfile)) {
                return false;
            }
            return true;
        });
    }
    getTotalRuleCount() {
        return this.allRules.length;
    }
    getAllRuleIds() {
        return this.allRules.map((r) => r.id);
    }
}
exports.BusinessRuleValidator = BusinessRuleValidator;
let defaultBusinessRuleValidator = null;
function getDefaultBusinessRuleValidator() {
    if (!defaultBusinessRuleValidator) {
        defaultBusinessRuleValidator = new BusinessRuleValidator();
    }
    return defaultBusinessRuleValidator;
}
function validateBusinessRules(invoice) {
    return getDefaultBusinessRuleValidator().validate(invoice);
}
//# sourceMappingURL=BusinessRuleValidator.js.map