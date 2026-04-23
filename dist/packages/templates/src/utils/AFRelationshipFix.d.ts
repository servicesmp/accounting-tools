/**
 * Manual File Attachment with AFRelationship for PDF/A-3 Compliance
 *
 * pdf-lib's attach() doesn't create the proper structure or add AFRelationship.
 * This module creates the complete embedded file structure manually.
 *
 * Based on src/core/PDFA3Conformance.ts approach
 */
import { PDFDocument, PDFRef } from 'pdf-lib';
/**
 * Manually attach a file with complete PDF/A-3 compliance
 * Creates the entire Names/EmbeddedFiles structure with AFRelationship
 */
export declare function attachFileWithAFRelationship(pdfDoc: PDFDocument, fileData: Buffer | Uint8Array, fileName: string, options?: {
    mimeType?: string;
    description?: string;
    creationDate?: Date;
    modificationDate?: Date;
    relationship?: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified';
}): Promise<PDFRef>;
//# sourceMappingURL=AFRelationshipFix.d.ts.map