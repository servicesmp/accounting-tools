"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceLine = void 0;
// src/core/InvoiceLine.ts
const AllowanceCharge_1 = require("./AllowanceCharge");
/** Ligne de facture (HT).
 *  On autorise des "lineAllowanceCharges" pour gérer par-ligne.
 */
class InvoiceLine {
    constructor(id, description, quantity, unitPrice, vatRate, // ex. 0.20 = 20%
    taxCategoryCode = "S", // par défaut "S"
    unitCode = "C62", billingPeriodStart, billingPeriodEnd, deliveredQuantity) {
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
        this.allowances = [];
        this.charges = [];
    }
    /** Montant HT brut (avant remises-ligne, si on en gère) */
    get lineTotal() {
        return this.quantity * this.unitPrice;
    }
    get lineTotalWithoutTax() {
        return this.lineTotal;
    }
    addAllowance(amount, reasonText) {
        this.allowances.push(new AllowanceCharge_1.AllowanceCharge(false, amount, reasonText));
    }
    addCharge(amount, reasonText) {
        this.charges.push(new AllowanceCharge_1.AllowanceCharge(true, amount, reasonText));
    }
    addAllowanceCharge(amount, isCharge, reasonText) {
        if (isCharge) {
            this.addCharge(amount, reasonText);
        }
        else {
            this.addAllowance(amount, reasonText);
        }
    }
    getAllAllowancesCharges() {
        return [...this.allowances, ...this.charges];
    }
    clearAllowancesCharges() {
        this.allowances = [];
        this.charges = [];
    }
}
exports.InvoiceLine = InvoiceLine;
