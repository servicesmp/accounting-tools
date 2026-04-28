"use strict";
// src/core/AdditionalDocument.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdditionalDocument = void 0;
// Classe Document additionnel (références supplémentaires, pièces jointes)
class AdditionalDocument {
    constructor(documentTypeCode, // ex: "130" (order), "916" (supporting document)
    id, // identifiant du document (e.g., numéro de commande)
    name, // nom du document
    attachmentPath // chemin ou référence de la pièce jointe si applicable
    ) {
        this.documentTypeCode = documentTypeCode;
        this.id = id;
        this.name = name;
        this.attachmentPath = attachmentPath;
    }
    getDocumentDetails() {
        return `Type: ${this.documentTypeCode}, ID: ${this.id || 'N/A'}, Name: ${this.name || 'N/A'}, Attachment: ${this.attachmentPath || 'None'}`;
    }
    isAttachmentPresent() {
        return !!this.attachmentPath;
    }
    getAttachmentPath() {
        return this.attachmentPath || null;
    }
}
exports.AdditionalDocument = AdditionalDocument;
