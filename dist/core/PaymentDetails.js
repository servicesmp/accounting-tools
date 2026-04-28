"use strict";
// src/core/PaymentDetails.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentDetails = void 0;
/** Informations de paiement simplifiées (code moyen, IBAN, etc.) */
class PaymentDetails {
    constructor(paymentMeansCode, // ex. "58" = virement SEPA
    payeeIBAN, payeeBIC, dueDate, paymentTermsText) {
        this.paymentMeansCode = paymentMeansCode;
        this.payeeIBAN = payeeIBAN;
        this.payeeBIC = payeeBIC;
        this.dueDate = dueDate;
        this.paymentTermsText = paymentTermsText;
    }
}
exports.PaymentDetails = PaymentDetails;
