import { PDFDocument, PDFRef } from 'pdf-lib';
export declare function attachFileWithAFRelationship(pdfDoc: PDFDocument, fileData: Buffer | Uint8Array, fileName: string, options?: {
    mimeType?: string;
    description?: string;
    creationDate?: Date;
    modificationDate?: Date;
    relationship?: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified';
}): Promise<PDFRef>;
//# sourceMappingURL=AFRelationshipFix.d.ts.map