"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicePDF = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_lib_1 = require("pdf-lib");
const Signer_1 = require("../signature/Signer");
class InvoicePDF {
    constructor(pdfBytes, invoice) {
        this.pdfBytes = pdfBytes;
        this.invoice = invoice;
    }
    sign(privateKey) {
        return Signer_1.Signer.sign(this.pdfBytes, privateKey);
    }
    verify(signature, publicKey) {
        return Signer_1.Signer.verify(this.pdfBytes, signature, publicKey);
    }
    async save(destinationPath, options) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(this.pdfBytes);
        if (options?.title)
            pdfDoc.setTitle(options.title);
        if (options?.subject)
            pdfDoc.setSubject(options.subject);
        if (options?.author)
            pdfDoc.setAuthor(options.author);
        if (options?.keywords)
            pdfDoc.setKeywords(options.keywords);
        if (options?.creator)
            pdfDoc.setCreator(options.creator);
        if (options?.producer)
            pdfDoc.setProducer(options.producer);
        if (options?.summary)
            pdfDoc.setSubject(options.summary);
        if (options?.provider)
            pdfDoc.setAuthor(options.provider);
        const finalBytes = await pdfDoc.save();
        fs_1.default.writeFileSync(destinationPath, finalBytes);
    }
    getBytes() {
        return this.pdfBytes;
    }
    /**
     * Extract the embedded XML from the PDF.
     * Assumes the embedded file is named "factur-x.xml" and was attached via pdf-lib's attach() method.
     */
    async extractEmbeddedXml() {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(this.pdfBytes);
        const catalog = pdfDoc.catalog;
        // Look up the "Names" dictionary in the catalog.
        const names = catalog.get(pdf_lib_1.PDFName.of('Names'));
        if (!names) {
            throw new Error("No Names dictionary found in PDF.");
        }
        const namesDict = names; // Using any because of internal structure.
        // Look for the EmbeddedFiles dictionary.
        const embeddedFiles = namesDict.get(pdf_lib_1.PDFName.of('EmbeddedFiles'));
        if (!embeddedFiles) {
            throw new Error("No EmbeddedFiles found in the Names dictionary.");
        }
        const embeddedFilesDict = embeddedFiles;
        const filesArray = embeddedFilesDict.get(pdf_lib_1.PDFName.of('Names'));
        if (!filesArray || !(filesArray instanceof pdf_lib_1.PDFArray)) {
            throw new Error("EmbeddedFiles Names array is missing or invalid.");
        }
        let lookUpContent = null;
        // Iterate over the array: [ name1, fileSpec1, name2, fileSpec2, ... ]
        const array = filesArray.asArray();
        for (let i = 0; i < array.length; i += 2) {
            const fileNameObj = array[i];
            const fileName = fileNameObj.value; // PDFString value.
            if (fileName === 'factur-x.xml') {
                // Next element is the file specification dictionary.
                const fileSpec = array[i + 1];
                const efDict = fileSpec.get(pdf_lib_1.PDFName.of('EF'));
                if (!efDict) {
                    throw new Error("No EF dictionary found in the file specification for factur-x.xml.");
                }
                const fileStreamRef = efDict.get(pdf_lib_1.PDFName.of('F'));
                if (!fileStreamRef) {
                    throw new Error("No file stream reference found in the EF dictionary.");
                }
                const fileStream = pdfDoc.context.lookup(fileStreamRef);
                if (!fileStream || !fileStream.contents) {
                    throw new Error("Unable to retrieve the embedded XML file stream.");
                }
                lookUpContent = fileStream.contents;
                return lookUpContent;
            }
        }
        if (!lookUpContent) {
            throw new Error("Embedded XML file 'factur-x.xml' not found in PDF.");
        }
        return lookUpContent;
        // throw new Error("Embedded XML file 'factur-x.xml' not found in PDF.");
    }
}
exports.InvoicePDF = InvoicePDF;
