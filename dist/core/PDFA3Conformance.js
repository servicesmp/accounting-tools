"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedIccProfile = embedIccProfile;
exports.embedPdfA3Xmp = embedPdfA3Xmp;
exports.markAsPdfA3 = markAsPdfA3;
// src/core/PdfA3Conformance.ts
const pdf_lib_1 = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
/**
 * Injecte un profil ICC et crée un OutputIntent.
 * @param pdfDoc Le document PDF
 * @param iccPath Chemin local du fichier sRGB.icc (ou autre).
 */
async function embedIccProfile(pdfDoc, iccPath) {
    const iccData = fs_1.default.readFileSync(iccPath); // charge le binaire ICC
    const iccBuffer = Uint8Array.from(iccData);
    const iccStream = pdfDoc.context.flateStream(iccBuffer, {
        // Dictionnaire PDF
        Type: pdf_lib_1.PDFName.of('OutputIntent'),
        S: pdf_lib_1.PDFName.of('GTS_PDFA1'), // Sur PDF/A-3, la clef reste GTS_PDFA1
        N: pdf_lib_1.PDFName.of('RGB'),
    });
    const iccRef = pdfDoc.context.register(iccStream);
    // Crée le dictionnaire OutputIntent
    const outputIntentDict = pdfDoc.context.obj({
        Type: 'OutputIntent',
        S: 'GTS_PDFA1',
        OutputCondition: 'sRGB ICC Profile',
        OutputConditionIdentifier: 'sRGB',
        Info: 'sRGB',
        DestOutputProfile: iccRef,
    });
    const outputIntentRef = pdfDoc.context.register(outputIntentDict);
    // Ajoute ce OutputIntent dans le catalogue PDF
    const catalog = pdfDoc.catalog; // => PDFDict
    let outputIntents = catalog.get(pdf_lib_1.PDFName.of('OutputIntents'));
    if (!outputIntents) {
        outputIntents = pdfDoc.context.obj([]);
        catalog.set(pdf_lib_1.PDFName.of('OutputIntents'), outputIntents);
    }
    const arr = outputIntents;
    arr.push(outputIntentRef);
    return outputIntentRef;
}
/**
 * Crée ou remplace le flux XMP Metadata PDF/A-3,
 * indiquant part=3, conformance=B (ou autre).
 */
function embedPdfA3Xmp(pdfDoc, isInvoiceOrOrder = 'invoice') {
    // 1. Exemple minimal de XMP pour PDF/A-3B
    // On peut l'adapter (dc:title, pdf:Producer, etc.).
    const xmp = `<?xpacket begin=\"\uFEFF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>
<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">
 <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">
  <rdf:Description rdf:about=\"\"
    xmlns:pdfaExtension=\"http://www.aiim.org/pdfa/ns/extension/\"
    xmlns:pdfaSchema=\"http://www.aiim.org/pdfa/ns/schema#\"
    xmlns:pdfaProperty=\"http://www.aiim.org/pdfa/ns/property#\"
    xmlns:pdfaid=\"http://www.aiim.org/pdfa/ns/id/\"
    xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\"
  >
    <pdfaid:part>3</pdfaid:part>
    <pdfaid:conformance>B</pdfaid:conformance>
    <xmp:CreatorTool>My FacturX/OrderX Generator</xmp:CreatorTool>
    <!-- Optionnel: on peut distinguer Factur-X vs Order-X ici -->
    <xmp:Description>${isInvoiceOrOrder}</xmp:Description>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end=\"w\"?>`;
    // 2. On crée un flux PDF binaire
    const xmpUint8 = new TextEncoder().encode(xmp);
    const xmpStream = pdfDoc.context.flateStream(xmpUint8, {
        Type: pdf_lib_1.PDFName.of('Metadata'),
        Subtype: pdf_lib_1.PDFName.of('XML'),
    });
    const xmpRef = pdfDoc.context.register(xmpStream);
    // 3. On l'inscrit dans le catalogue (clé /Metadata)
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('Metadata'), xmpRef);
}
/**
 * Marque le document comme PDF/A-3 en:
 *  - configurant l'OutputIntent (ICC),
 *  - injectant un flux XMP pdfaid:part=3,
 *  - plaçant le ou les fichiers attachés dans /AF (Associated Files),
 *  - positionnant /AFRelationship dans la FileSpec.
 * @param pdfDoc Le document PDF
 * @param attachedFileRefs tableau de références vers les FileSpec joints (XML Factur-X, Order-X, etc.)
 * @param iccPath Chemin vers l'ICC sRGB
 * @param isInvoiceOrOrder Simple tag pour info XMP
 */
async function markAsPdfA3(pdfDoc, attachedFileRefs, iccPath, isInvoiceOrOrder = 'invoice') {
    // 1. Embedding ICC + OutputIntent
    await embedIccProfile(pdfDoc, iccPath);
    // 2. Embedding XMP
    embedPdfA3Xmp(pdfDoc, isInvoiceOrOrder);
    // 3. /AF array dans le catalogue
    const catalog = pdfDoc.catalog;
    let afArray = catalog.get(pdf_lib_1.PDFName.of('AF'));
    if (!afArray) {
        afArray = pdfDoc.context.obj([]);
        catalog.set(pdf_lib_1.PDFName.of('AF'), afArray);
    }
    const arrayAF = afArray;
    for (const fRef of attachedFileRefs) {
        // On ajoute le fileSpec dans la liste /AF
        arrayAF.push(fRef);
        // On définit /AFRelationship sur la FileSpec => /Alternative, /Source, /Data, etc.
        const fileSpecDict = pdfDoc.context.lookup(fRef);
        fileSpecDict.set(pdf_lib_1.PDFName.of('AFRelationship'), pdf_lib_1.PDFName.of('Source'));
        // "Source" ou "Alternative" selon la sémantique (Factur-X => "Source" est standard)
    }
    // 4. Autres ajustements pour PDF/A-3
    // - Marquer /Lang (optionnel)
    // - Marquer /MarkInfo => /Marked true
    catalog.set(pdf_lib_1.PDFName.of('Lang'), pdf_lib_1.PDFString.of('fr-FR'));
    catalog.set(pdf_lib_1.PDFName.of('MarkInfo'), pdfDoc.context.obj({ Marked: true }));
}
