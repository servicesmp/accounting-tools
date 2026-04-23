"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFA3XMP = generatePDFA3XMP;
exports.generatePDFFileID = generatePDFFileID;
exports.generateFileIDArray = generateFileIDArray;
exports.loadChillaxFonts = loadChillaxFonts;
exports.loadSRGBProfile = loadSRGBProfile;
exports.applyPDFA3Compliance = applyPDFA3Compliance;
exports.addAFRelationshipToFile = addAFRelationshipToFile;
exports.addFacturXAttachmentWithAFRelationship = addFacturXAttachmentWithAFRelationship;
exports.setPDFFileID = setPDFFileID;
exports.setupPDFA3Compliance = setupPDFA3Compliance;
const pdf_lib_1 = require("pdf-lib");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function escapeXML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function generatePDFA3XMP(options) {
    const { title, author = 'Factur-X Generator', subject = 'Electronic Invoice', creator = 'factur-x-ts', producer = 'pdf-lib + factur-x-ts', keywords = ['Invoice', 'Factur-X', 'EN16931'], createDate = new Date(), modifyDate = new Date(), conformanceLevel = 'EN 16931', } = options;
    const formatDate = (date) => date.toISOString();
    const keywordsXML = keywords.length > 0
        ? `<dc:subject>
        <rdf:Bag>
          ${keywords.map(k => `<rdf:li>${escapeXML(k)}</rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </dc:subject>`
        : '';
    return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#"
        xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">

      <!-- Dublin Core -->
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXML(author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(subject)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      ${keywordsXML}

      <!-- XMP Basic -->
      <xmp:CreateDate>${formatDate(createDate)}</xmp:CreateDate>
      <xmp:ModifyDate>${formatDate(modifyDate)}</xmp:ModifyDate>
      <xmp:MetadataDate>${formatDate(modifyDate)}</xmp:MetadataDate>
      <xmp:CreatorTool>${escapeXML(creator)}</xmp:CreatorTool>

      <!-- PDF -->
      <pdf:Producer>${escapeXML(producer)}</pdf:Producer>

      <!-- PDF/A-3 Identification -->
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>

      <!-- Factur-X Extension -->
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the Factur-X standard</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the embedded Factur-X data</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>

      <!-- Factur-X Properties -->
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${escapeXML(conformanceLevel)}</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
function generatePDFFileID(pdfBytes) {
    const hash = (0, crypto_1.createHash)('md5').update(pdfBytes).digest('hex');
    return hash.toUpperCase();
}
function generateFileIDArray() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    const combinedData = timestamp + random;
    const hash = (0, crypto_1.createHash)('md5').update(combinedData).digest('hex');
    const id = hash.toUpperCase();
    return [id, id];
}
async function loadChillaxFonts() {
    const fontsDir = path.join(__dirname, '../../assets/fonts');
    const regular = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Regular.otf'));
    const bold = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Bold.otf'));
    return {
        regular: new Uint8Array(regular),
        bold: new Uint8Array(bold),
    };
}
async function loadSRGBProfile() {
    const iccPath = path.join(__dirname, '../../assets/icc/sRGB2014.icc');
    const iccData = await fs.promises.readFile(iccPath);
    return new Uint8Array(iccData);
}
async function applyPDFA3Compliance(pdfDoc, options) {
    const xmpMetadata = generatePDFA3XMP(options);
    const xmpBytes = new TextEncoder().encode(xmpMetadata);
    const metadataStreamRef = pdfDoc.context.register(pdfDoc.context.stream(xmpBytes, {
        Type: 'Metadata',
        Subtype: 'XML',
    }));
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('Metadata'), metadataStreamRef);
    const srgbProfile = await loadSRGBProfile();
    const iccStreamRef = pdfDoc.context.register(pdfDoc.context.stream(srgbProfile));
    const outputIntentDict = pdfDoc.context.obj({
        Type: 'OutputIntent',
        S: 'GTS_PDFA1',
        OutputConditionIdentifier: 'sRGB IEC61966-2.1',
        RegistryName: 'http://www.color.org',
        Info: 'sRGB IEC61966-2.1',
        DestOutputProfile: iccStreamRef,
    });
    const outputIntents = pdfDoc.context.obj([outputIntentDict]);
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('OutputIntents'), outputIntents);
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('Version'), pdf_lib_1.PDFName.of('1.7'));
    const [id1, id2] = generateFileIDArray();
    const fileIdArray = pdf_lib_1.PDFArray.withContext(pdfDoc.context);
    fileIdArray.push(pdf_lib_1.PDFHexString.of(id1));
    fileIdArray.push(pdf_lib_1.PDFHexString.of(id2));
    pdfDoc.context.trailerInfo.ID = fileIdArray;
}
function addAFRelationshipToFile(fileSpecDict, relationship = 'Data') {
    fileSpecDict.set(pdf_lib_1.PDFName.of('AFRelationship'), pdf_lib_1.PDFName.of(relationship));
}
async function addFacturXAttachmentWithAFRelationship(pdfDoc, fileData, fileName, options) {
    const { mimeType = 'application/octet-stream', description = '', creationDate = new Date(), modificationDate = new Date(), } = options;
    const embeddedFileStream = pdfDoc.context.stream(fileData, {
        Type: 'EmbeddedFile',
        Subtype: mimeType,
    });
    const embeddedFileStreamRef = pdfDoc.context.register(embeddedFileStream);
    const fileSpecDict = pdfDoc.context.obj({
        Type: 'Filespec',
        F: pdf_lib_1.PDFString.of(fileName),
        UF: pdf_lib_1.PDFString.of(fileName),
        Desc: pdf_lib_1.PDFString.of(description),
        AFRelationship: pdf_lib_1.PDFName.of('Data'),
        EF: {
            F: embeddedFileStreamRef,
            UF: embeddedFileStreamRef,
        },
    });
    const params = pdfDoc.context.obj({
        Size: fileData.length,
        CreationDate: pdf_lib_1.PDFString.fromDate(creationDate),
        ModDate: pdf_lib_1.PDFString.fromDate(modificationDate),
    });
    embeddedFileStream.dict.set(pdf_lib_1.PDFName.of('Params'), params);
    const fileSpecDictRef = pdfDoc.context.register(fileSpecDict);
    const catalog = pdfDoc.catalog;
    let namesDict = catalog.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesDict) {
        namesDict = pdfDoc.context.obj({});
        catalog.set(pdf_lib_1.PDFName.of('Names'), namesDict);
    }
    let embeddedFilesDict = namesDict.get(pdf_lib_1.PDFName.of('EmbeddedFiles'));
    if (!embeddedFilesDict) {
        embeddedFilesDict = pdfDoc.context.obj({});
        namesDict.set(pdf_lib_1.PDFName.of('EmbeddedFiles'), embeddedFilesDict);
    }
    let namesArray = embeddedFilesDict.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesArray) {
        namesArray = pdfDoc.context.obj([]);
        embeddedFilesDict.set(pdf_lib_1.PDFName.of('Names'), namesArray);
    }
    if (namesArray instanceof pdf_lib_1.PDFArray || namesArray.push) {
        namesArray.push(pdf_lib_1.PDFString.of(fileName));
        namesArray.push(fileSpecDictRef);
    }
    let afArray = catalog.get(pdf_lib_1.PDFName.of('AF'));
    if (!afArray) {
        afArray = pdfDoc.context.obj([]);
        catalog.set(pdf_lib_1.PDFName.of('AF'), afArray);
    }
    const arrayAF = afArray;
    arrayAF.push(fileSpecDictRef);
    console.log('✓ Factur-X XML attached with AFRelationship and added to /AF array');
}
function setPDFFileID(_pdfDoc, _fileId) {
}
async function setupPDFA3Compliance(pdfDoc, options) {
    const metadataOptions = {
        ...options,
        conformanceLevel: options.conformanceLevel ?? 'EN 16931',
        createDate: new Date(),
        modifyDate: new Date(),
    };
    await applyPDFA3Compliance(pdfDoc, metadataOptions);
}
//# sourceMappingURL=PDFA3Compliance.js.map