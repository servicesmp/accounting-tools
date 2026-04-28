"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOrderTemplate = void 0;
class BaseOrderTemplate {
    validate(orderData) {
        // Validation basique
        if (!orderData.orderNumber) {
            console.error('orderNumber is required');
            return false;
        }
        if (!orderData.orderDate) {
            console.error('orderDate is required');
            return false;
        }
        if (!orderData.seller) {
            console.error('seller is required');
            return false;
        }
        if (!orderData.buyer) {
            console.error('buyer is required');
            return false;
        }
        if (!orderData.items || orderData.items.length === 0) {
            console.error('items is required');
            return false;
        }
        if (!orderData.currency) {
            console.error('currency is required');
            return false;
        }
        return true;
    }
}
exports.BaseOrderTemplate = BaseOrderTemplate;
