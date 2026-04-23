"use strict";
/**
 * Manual File Attachment with AFRelationship for PDF/A-3 Compliance
 *
 * pdf-lib's attach() doesn't create the proper structure or add AFRelationship.
 * This module creates the complete embedded file structure manually.
 *
 * Based on src/core/PDFA3Conformance.ts approach
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachFileWithAFRelationship = attachFileWithAFRelationship;
const pdf_lib_1 = require("pdf-lib");
/**
 * Manually attach a file with complete PDF/A-3 compliance
 * Creates the entire Names/EmbeddedFiles structure with AFRelationship
 */
async function attachFileWithAFRelationship(pdfDoc, fileData, fileName, options = {}) {
    const { mimeType = 'text/xml', description = '', creationDate = new Date(), modificationDate = new Date(), relationship = 'Data', } = options;
    // Step 1: Create the embedded file stream
    const fileBytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
    // PDF/A-3: Subtype must be a PDFName with encoded MIME type
    // 'text/xml' → 'text#2Fxml' (/ encoded as #2F in PDF name encoding)
    const subtypeName = pdf_lib_1.PDFName.of(mimeType.replace('/', '#2F'));
    const embeddedFileStream = pdfDoc.context.stream(fileBytes, {
        Type: 'EmbeddedFile',
        Subtype: subtypeName,
        Params: {
            Size: fileBytes.length,
            CreationDate: pdf_lib_1.PDFString.fromDate(creationDate),
            ModDate: pdf_lib_1.PDFString.fromDate(modificationDate),
        },
    });
    const embeddedFileStreamRef = pdfDoc.context.register(embeddedFileStream);
    // Step 2: Create the file specification dictionary WITH AFRelationship
    const fileSpecDict = pdfDoc.context.obj({
        Type: 'Filespec',
        F: pdf_lib_1.PDFString.of(fileName),
        UF: pdf_lib_1.PDFString.of(fileName),
        Desc: pdf_lib_1.PDFString.of(description),
        AFRelationship: pdf_lib_1.PDFName.of(relationship), // PDF/A-3 requirement
        EF: {
            F: embeddedFileStreamRef,
            UF: embeddedFileStreamRef,
        },
    });
    const fileSpecRef = pdfDoc.context.register(fileSpecDict);
    // Step 3: Add to catalog's Names/EmbeddedFiles structure
    const catalog = pdfDoc.catalog;
    // Get or create /Names dictionary
    let names = catalog.get(pdf_lib_1.PDFName.of('Names'));
    if (!names) {
        names = pdfDoc.context.obj({});
        catalog.set(pdf_lib_1.PDFName.of('Names'), names);
    }
    const namesDict = names;
    // Get or create /EmbeddedFiles dictionary
    let embeddedFiles = namesDict.get(pdf_lib_1.PDFName.of('EmbeddedFiles'));
    if (!embeddedFiles) {
        embeddedFiles = pdfDoc.context.obj({});
        namesDict.set(pdf_lib_1.PDFName.of('EmbeddedFiles'), embeddedFiles);
    }
    const embeddedFilesDict = embeddedFiles;
    // Get or create /Names array
    let namesArray = embeddedFilesDict.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesArray) {
        namesArray = pdfDoc.context.obj([]);
        embeddedFilesDict.set(pdf_lib_1.PDFName.of('Names'), namesArray);
    }
    const array = namesArray;
    // Add [fileName, fileSpecRef] to the Names array
    array.push(pdf_lib_1.PDFString.of(fileName));
    array.push(fileSpecRef);
    // Step 4: Add to /AF array in catalog (PDF/A-3 requirement)
    let afArray = catalog.get(pdf_lib_1.PDFName.of('AF'));
    if (!afArray) {
        afArray = pdfDoc.context.obj([]);
        catalog.set(pdf_lib_1.PDFName.of('AF'), afArray);
    }
    afArray.push(fileSpecRef);
    console.log(`✓ ${fileName} attached with AFRelationship='${relationship}' and added to /AF array`);
    return fileSpecRef;
}
//# sourceMappingURL=AFRelationshipFix.js.map