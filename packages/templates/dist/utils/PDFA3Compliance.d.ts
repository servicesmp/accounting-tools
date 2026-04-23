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
    conformanceLevel?: string;
}
export declare function generatePDFA3XMP(options: PDFA3MetadataOptions): string;
export declare function generatePDFFileID(pdfBytes: Uint8Array): string;
export declare function generateFileIDArray(): [string, string];
export interface EmbeddedFonts {
    regular: Uint8Array;
    bold: Uint8Array;
}
export declare function loadChillaxFonts(): Promise<EmbeddedFonts>;
export declare function loadSRGBProfile(): Promise<Uint8Array>;
export declare function applyPDFA3Compliance(pdfDoc: PDFDocument, options: PDFA3MetadataOptions): Promise<void>;
export declare function addAFRelationshipToFile(fileSpecDict: PDFDict, relationship?: 'Source' | 'Data' | 'Alternative' | 'Supplement' | 'Unspecified'): void;
export declare function addFacturXAttachmentWithAFRelationship(pdfDoc: PDFDocument, fileData: Buffer, fileName: string, options: {
    mimeType?: string;
    description?: string;
    creationDate?: Date;
    modificationDate?: Date;
}): Promise<void>;
export declare function setPDFFileID(_pdfDoc: PDFDocument, _fileId: string): void;
export interface PDFA3SetupOptions {
    title: string;
    author?: string;
    subject?: string;
    creator?: string;
    keywords?: string[];
    conformanceLevel?: string;
}
export declare function setupPDFA3Compliance(pdfDoc: PDFDocument, options: PDFA3SetupOptions): Promise<void>;
//# sourceMappingURL=PDFA3Compliance.d.ts.map