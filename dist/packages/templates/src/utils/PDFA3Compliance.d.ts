/**
 * PDF/A-3 Compliance Utilities
 *
 * This module provides utilities to ensure PDF/A-3 compliance:
 * 1. Embedded fonts (no standard fonts)
 * 2. ICC color profiles (OutputIntent)
 * 3. XMP Metadata
 * 4. File ID generation
 * 5. AFRelationship for embedded files
 */
import { PDFDocument, PDFDict } from 'pdf-lib';
export interface PDFA3MetadataOptions {
    title: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    keywords?: string[];
    createDate?: Date;
    modifyDate?: Date;
    documentId?: string;
    instanceId?: string;
    /** Factur-X conformance level for XMP metadata. Must match FNFE-MPE values exactly. */
    conformanceLevel?: string;
}
export declare function generatePDFA3XMP(options: PDFA3MetadataOptions): string;
/**
 * Generate MD5 hash for PDF File ID
 * PDF/A-3 requires a permanent identifier in the trailer dictionary
 */
export declare function generatePDFFileID(pdfBytes: Uint8Array): string;
/**
 * Generate a unique File ID based on current timestamp and random data
 * This creates a deterministic ID for the PDF document
 */
export declare function generateFileIDArray(): [string, string];
export interface EmbeddedFonts {
    regular: Uint8Array;
    bold: Uint8Array;
}
/**
 * Load Chillax fonts from local assets directory
 * lib/ is autonomous and contains all necessary assets
 */
export declare function loadChillaxFonts(): Promise<EmbeddedFonts>;
/**
 * Load sRGB ICC profile (version 2.0 for PDF/A-3 compliance) from local assets
 * lib/ is autonomous and contains all necessary assets
 */
export declare function loadSRGBProfile(): Promise<Uint8Array>;
export declare function applyPDFA3Compliance(pdfDoc: PDFDocument, options: PDFA3MetadataOptions): Promise<void>;
/**
 * Add AFRelationship to an embedded file
 */
export declare function addAFRelationshipToFile(fileSpecDict: PDFDict, relationship?: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified'): void;
/**
 * Attach a file to the PDF with AFRelationship for PDF/A-3 compliance
 * This manually creates the file specification with AFRelationship
 */
export declare function addFacturXAttachmentWithAFRelationship(pdfDoc: PDFDocument, fileData: Buffer, fileName: string, options: {
    mimeType?: string;
    description?: string;
    creationDate?: Date;
    modificationDate?: Date;
}): Promise<void>;
/**
 * Set File ID in PDF trailer (done during save)
 * Note: pdf-lib handles File ID generation automatically during save
 * This function is kept for API compatibility but currently unused
 */
export declare function setPDFFileID(_pdfDoc: PDFDocument, _fileId: string): void;
export interface PDFA3SetupOptions {
    title: string;
    author?: string;
    subject?: string;
    creator?: string;
    keywords?: string[];
    /** Factur-X conformance level for fx:ConformanceLevel XMP property */
    conformanceLevel?: string;
}
/**
 * Apply all PDF/A-3 compliance measures to a PDF document
 */
export declare function setupPDFA3Compliance(pdfDoc: PDFDocument, options: PDFA3SetupOptions): Promise<void>;
//# sourceMappingURL=PDFA3Compliance.d.ts.map