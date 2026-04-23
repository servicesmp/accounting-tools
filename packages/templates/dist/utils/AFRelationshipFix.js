"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachFileWithAFRelationship = attachFileWithAFRelationship;
const pdf_lib_1 = require("pdf-lib");
async function attachFileWithAFRelationship(pdfDoc, fileData, fileName, options = {}) {
    const { mimeType = 'text/xml', description = '', creationDate = new Date(), modificationDate = new Date(), relationship = 'Data', } = options;
    const fileBytes = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
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
    const fileSpecDict = pdfDoc.context.obj({
        Type: 'Filespec',
        F: pdf_lib_1.PDFString.of(fileName),
        UF: pdf_lib_1.PDFString.of(fileName),
        Desc: pdf_lib_1.PDFString.of(description),
        AFRelationship: pdf_lib_1.PDFName.of(relationship),
        EF: {
            F: embeddedFileStreamRef,
            UF: embeddedFileStreamRef,
        },
    });
    const fileSpecRef = pdfDoc.context.register(fileSpecDict);
    const catalog = pdfDoc.catalog;
    let names = catalog.get(pdf_lib_1.PDFName.of('Names'));
    if (!names) {
        names = pdfDoc.context.obj({});
        catalog.set(pdf_lib_1.PDFName.of('Names'), names);
    }
    const namesDict = names;
    let embeddedFiles = namesDict.get(pdf_lib_1.PDFName.of('EmbeddedFiles'));
    if (!embeddedFiles) {
        embeddedFiles = pdfDoc.context.obj({});
        namesDict.set(pdf_lib_1.PDFName.of('EmbeddedFiles'), embeddedFiles);
    }
    const embeddedFilesDict = embeddedFiles;
    let namesArray = embeddedFilesDict.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesArray) {
        namesArray = pdfDoc.context.obj([]);
        embeddedFilesDict.set(pdf_lib_1.PDFName.of('Names'), namesArray);
    }
    const array = namesArray;
    array.push(pdf_lib_1.PDFString.of(fileName));
    array.push(fileSpecRef);
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