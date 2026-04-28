"use strict";
// transformForTemplate.ts (optionnel, on peut faire inline)
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceToHbsContext = invoiceToHbsContext;
/**
 * Cette fonction transforme un FacturXInvoice en un objet JSON
 * "plat" ou en tout cas structuré pour le template.
 */
function invoiceToHbsContext(invoice) {
    // On appelle finalizeTotals pour calculer TOTaux si pas déjà fait
    const summary = invoice.finalizeTotals();
    return {
        // Par exemple, on rend des champs typiques
        invoiceId: invoice.header.id,
        invoiceDate: invoice.header.invoiceDate.toLocaleDateString('fr-FR'),
        invoiceName: invoice.header.name,
        // notes
        headerNotes: invoice.header.notes, // array
        // disclaimers
        disclaimers: invoice.disclaimers, // array
        seller: {
            name: invoice.seller.name,
            addressLine: invoice.seller.postalAddress.line1,
            city: invoice.seller.postalAddress.city,
            countryCode: invoice.seller.postalAddress.countryCode,
            vat: invoice.seller.vatNumber,
        },
        buyer: {
            name: invoice.buyer.name,
            addressLine: invoice.buyer.postalAddress.line1,
            city: invoice.buyer.postalAddress.city,
            countryCode: invoice.buyer.postalAddress.countryCode,
            vat: invoice.buyer.vatNumber,
        },
        docAllowanceCharges: invoice.docAllowanceCharges.map((ac) => ({
            chargeIndicator: ac.chargeIndicator,
            actualAmount: ac.actualAmount,
            reason: ac.reason,
        })),
        lines: invoice.lines.map((line) => ({
            id: line.id,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice.toFixed(2),
            vatRate: (line.vatRate * 100).toFixed(2) + '%',
            lineTotal: line.lineTotal.toFixed(2),
        })),
        currency: invoice.currency,
        // TOTaux calculés
        lineTotal: summary.lineTotal.toFixed(2),
        taxTotal: summary.taxTotal.toFixed(2),
        grandTotal: summary.grandTotal.toFixed(2),
        // Payment
        payment: {
            meansCode: invoice.payment.paymentMeansCode,
            iban: invoice.payment.payeeIBAN,
            bic: invoice.payment.payeeBIC,
            dueDate: invoice.payment.dueDate?.toLocaleDateString('fr-FR'),
            terms: invoice.payment.paymentTermsText,
        },
    };
}
