"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentHeader = void 0;
const EnumInvoiceType_1 = require("./EnumInvoiceType");
/** En-tête de la facture */
class DocumentHeader {
    constructor(id, // identifiant interne du doc Ex. "Doc2025-0001"
    invoiceNumber, name, // libellé ex. "FACTURE"
    invoiceDate, issueDate = new Date(), typeCode = EnumInvoiceType_1.DocTypeCode.INVOICE, // 380=Invoice, 381=CreditNote
    notes = []) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.name = name;
        this.invoiceDate = invoiceDate;
        this.issueDate = issueDate;
        this.typeCode = typeCode;
        this.notes = notes;
    }
    addNote(note) {
        this.notes.push(note);
    }
}
exports.DocumentHeader = DocumentHeader;
