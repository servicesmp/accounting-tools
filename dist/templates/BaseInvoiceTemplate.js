"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseInvoiceTemplate = void 0;
class BaseInvoiceTemplate {
    validate(invoiceData) {
        // Validation basique
        if (!invoiceData.invoiceNumber) {
            console.error('invoiceNumber is required');
            return false;
        }
        if (!invoiceData.invoiceDate) {
            console.error('invoiceDate is required');
            return false;
        }
        if (!invoiceData.seller) {
            console.error('seller is required');
            return false;
        }
        if (!invoiceData.buyer) {
            console.error('buyer is required');
            return false;
        }
        if (!invoiceData.items || invoiceData.items.length === 0) {
            console.error('items is required');
            return false;
        }
        if (!invoiceData.currency) {
            console.error('currency is required');
            return false;
        }
        return true;
    }
}
exports.BaseInvoiceTemplate = BaseInvoiceTemplate;
