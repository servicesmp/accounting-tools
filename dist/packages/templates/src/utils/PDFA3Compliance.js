"use strict";
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
// UUID generation utility (currently unused but kept for future use)
// function generateUUID(): string {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === 'x' ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }
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
// ============================================================================
// FILE ID GENERATION
// ============================================================================
/**
 * Generate MD5 hash for PDF File ID
 * PDF/A-3 requires a permanent identifier in the trailer dictionary
 */
function generatePDFFileID(pdfBytes) {
    const hash = (0, crypto_1.createHash)('md5').update(pdfBytes).digest('hex');
    return hash.toUpperCase();
}
/**
 * Generate a unique File ID based on current timestamp and random data
 * This creates a deterministic ID for the PDF document
 */
function generateFileIDArray() {
    // Create two IDs: permanent and changing
    // For PDF/A-3, both should be the same (permanent identifier)
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    const combinedData = timestamp + random;
    const hash = (0, crypto_1.createHash)('md5').update(combinedData).digest('hex');
    const id = hash.toUpperCase();
    // Return both IDs the same for PDF/A-3 compliance
    return [id, id];
}
/**
 * Load Chillax fonts from local assets directory
 * lib/ is autonomous and contains all necessary assets
 */
async function loadChillaxFonts() {
    const fontsDir = path.join(__dirname, '../../assets/fonts');
    const regular = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Regular.otf'));
    const bold = await fs.promises.readFile(path.join(fontsDir, 'Chillax-Bold.otf'));
    return {
        regular: new Uint8Array(regular),
        bold: new Uint8Array(bold),
    };
}
// ============================================================================
// ICC PROFILE LOADING
// ============================================================================
/**
 * Load sRGB ICC profile (version 2.0 for PDF/A-3 compliance) from local assets
 * lib/ is autonomous and contains all necessary assets
 */
async function loadSRGBProfile() {
    // Use sRGB2014.icc (version 2.0, RGB/XYZ-mntr) which is PDF/A-3 compliant
    // sRGB_v4 profiles are version 4.2 which is NOT accepted by veraPDF (must be < 5.0)
    const iccPath = path.join(__dirname, '../../assets/icc/sRGB2014.icc');
    const iccData = await fs.promises.readFile(iccPath);
    return new Uint8Array(iccData);
}
// ============================================================================
// PDF/A-3 COMPLIANCE APPLICATION
// ============================================================================
async function applyPDFA3Compliance(pdfDoc, options) {
    // 1. Add XMP Metadata
    const xmpMetadata = generatePDFA3XMP(options);
    const xmpBytes = new TextEncoder().encode(xmpMetadata);
    const metadataStreamRef = pdfDoc.context.register(pdfDoc.context.stream(xmpBytes, {
        Type: 'Metadata',
        Subtype: 'XML',
    }));
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('Metadata'), metadataStreamRef);
    // 2. Add OutputIntent (sRGB ICC Profile)
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
    // 3. Set PDF Version to 1.7
    pdfDoc.catalog.set(pdf_lib_1.PDFName.of('Version'), pdf_lib_1.PDFName.of('1.7'));
    // 4. Add File ID to trailer
    // PDF/A-3 requires a permanent identifier in the trailer
    const [id1, id2] = generateFileIDArray();
    const fileIdArray = pdf_lib_1.PDFArray.withContext(pdfDoc.context);
    fileIdArray.push(pdf_lib_1.PDFHexString.of(id1));
    fileIdArray.push(pdf_lib_1.PDFHexString.of(id2));
    // Set the ID in the PDF trailer
    pdfDoc.context.trailerInfo.ID = fileIdArray;
}
/**
 * Add AFRelationship to an embedded file
 */
function addAFRelationshipToFile(fileSpecDict, relationship = 'Data') {
    fileSpecDict.set(pdf_lib_1.PDFName.of('AFRelationship'), pdf_lib_1.PDFName.of(relationship));
}
/**
 * Attach a file to the PDF with AFRelationship for PDF/A-3 compliance
 * This manually creates the file specification with AFRelationship
 */
async function addFacturXAttachmentWithAFRelationship(pdfDoc, fileData, fileName, options) {
    const { mimeType = 'application/octet-stream', description = '', creationDate = new Date(), modificationDate = new Date(), } = options;
    // Create the embedded file stream
    const embeddedFileStream = pdfDoc.context.stream(fileData, {
        Type: 'EmbeddedFile',
        Subtype: mimeType,
    });
    const embeddedFileStreamRef = pdfDoc.context.register(embeddedFileStream);
    // Create the file specification dictionary WITH AFRelationship
    const fileSpecDict = pdfDoc.context.obj({
        Type: 'Filespec',
        F: pdf_lib_1.PDFString.of(fileName),
        UF: pdf_lib_1.PDFString.of(fileName), // Unicode filename
        Desc: pdf_lib_1.PDFString.of(description),
        AFRelationship: pdf_lib_1.PDFName.of('Data'), // PDF/A-3 requirement
        EF: {
            F: embeddedFileStreamRef,
            UF: embeddedFileStreamRef,
        },
    });
    // Add creation and modification dates if provided
    const params = pdfDoc.context.obj({
        Size: fileData.length,
        CreationDate: pdf_lib_1.PDFString.fromDate(creationDate),
        ModDate: pdf_lib_1.PDFString.fromDate(modificationDate),
    });
    // Link params to embedded file stream
    embeddedFileStream.dict.set(pdf_lib_1.PDFName.of('Params'), params);
    const fileSpecDictRef = pdfDoc.context.register(fileSpecDict);
    // Add to the PDF catalog's Names dictionary
    const catalog = pdfDoc.catalog;
    // Get or create Names dictionary
    let namesDict = catalog.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesDict) {
        namesDict = pdfDoc.context.obj({});
        catalog.set(pdf_lib_1.PDFName.of('Names'), namesDict);
    }
    // Get or create EmbeddedFiles dictionary
    let embeddedFilesDict = namesDict.get(pdf_lib_1.PDFName.of('EmbeddedFiles'));
    if (!embeddedFilesDict) {
        embeddedFilesDict = pdfDoc.context.obj({});
        namesDict.set(pdf_lib_1.PDFName.of('EmbeddedFiles'), embeddedFilesDict);
    }
    // Get or create Names array
    let namesArray = embeddedFilesDict.get(pdf_lib_1.PDFName.of('Names'));
    if (!namesArray) {
        namesArray = pdfDoc.context.obj([]);
        embeddedFilesDict.set(pdf_lib_1.PDFName.of('Names'), namesArray);
    }
    // Add filename and file spec to Names array
    // Format: [name1, filespec1, name2, filespec2, ...]
    if (namesArray instanceof pdf_lib_1.PDFArray || namesArray.push) {
        namesArray.push(pdf_lib_1.PDFString.of(fileName));
        namesArray.push(fileSpecDictRef);
    }
    // Add to /AF array in catalog (PDF/A-3 requirement)
    // This is critical for PDF/A-3 compliance
    let afArray = catalog.get(pdf_lib_1.PDFName.of('AF'));
    if (!afArray) {
        afArray = pdfDoc.context.obj([]);
        catalog.set(pdf_lib_1.PDFName.of('AF'), afArray);
    }
    const arrayAF = afArray;
    arrayAF.push(fileSpecDictRef);
    console.log('✓ Factur-X XML attached with AFRelationship and added to /AF array');
}
/**
 * Set File ID in PDF trailer (done during save)
 * Note: pdf-lib handles File ID generation automatically during save
 * This function is kept for API compatibility but currently unused
 */
function setPDFFileID(_pdfDoc, _fileId) {
    // Note: pdf-lib sets the ID automatically during save
    // We'll add it manually after the PDF is generated if needed
    // Currently unused - pdf-lib handles this
}
/**
 * Apply all PDF/A-3 compliance measures to a PDF document
 */
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