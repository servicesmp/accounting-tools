"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPdfRenderer = exports.renderReportPdf = exports.FR_FRANCHISE_MENTION = exports.FR_MANDATORY_NOTES = exports.buildFacturXInvoice = exports.renderDocumentPdf = exports.DocumentPdfRenderer = void 0;
exports.generateDocumentPdf = generateDocumentPdf;
exports.generateReportPdf = generateReportPdf;
const settings_1 = require("../document/settings");
const view_1 = require("../document/view");
const DocumentPdfRenderer_1 = require("./DocumentPdfRenderer");
const facturx_1 = require("./facturx");
var DocumentPdfRenderer_2 = require("./DocumentPdfRenderer");
Object.defineProperty(exports, "DocumentPdfRenderer", { enumerable: true, get: function () { return DocumentPdfRenderer_2.DocumentPdfRenderer; } });
Object.defineProperty(exports, "renderDocumentPdf", { enumerable: true, get: function () { return DocumentPdfRenderer_2.renderDocumentPdf; } });
var facturx_2 = require("./facturx");
Object.defineProperty(exports, "buildFacturXInvoice", { enumerable: true, get: function () { return facturx_2.buildFacturXInvoice; } });
Object.defineProperty(exports, "FR_MANDATORY_NOTES", { enumerable: true, get: function () { return facturx_2.FR_MANDATORY_NOTES; } });
Object.defineProperty(exports, "FR_FRANCHISE_MENTION", { enumerable: true, get: function () { return facturx_2.FR_FRANCHISE_MENTION; } });
/**
 * Point d'entrée unique : facture, avoir, devis ou bon de commande.
 * Facture/avoir : le XML Factur-X est construit à partir des MÊMES données et ses
 * totaux sont ceux affichés (aucun écart possible entre PDF et XML).
 */
async function generateDocumentPdf(input) {
    const { settings, warnings } = (0, settings_1.normalizeDocumentSettings)(input.settings, input.entitlements ?? settings_1.NO_DOCUMENT_ENTITLEMENTS);
    let data = input.data;
    let xml;
    const allWarnings = [...warnings];
    if ((0, view_1.isFacturXDocument)(data.kind)) {
        const built = (0, facturx_1.buildFacturXInvoice)(data, { defaultCountry: input.defaultCountry });
        allWarnings.push(...built.warnings);
        xml = built.invoice.generateXml(true);
        data = { ...data, totals: built.totals, lines: data.lines.map((l, i) => ({ ...l, lineTotal: built.lineTotals[i] })) };
    }
    const view = (0, view_1.buildDocumentView)(data, { settings });
    const { pdf, pageCount } = await (0, DocumentPdfRenderer_1.renderDocumentPdf)(view, { logo: input.logo, facturXml: xml });
    return { pdf, pageCount, view, xml, warnings: allWarnings };
}
// ─── Rapports par blocs ──────────────────────────────────────────────────────
const report_view_1 = require("../document/report-view");
const ReportPdfRenderer_1 = require("./ReportPdfRenderer");
var ReportPdfRenderer_2 = require("./ReportPdfRenderer");
Object.defineProperty(exports, "renderReportPdf", { enumerable: true, get: function () { return ReportPdfRenderer_2.renderReportPdf; } });
Object.defineProperty(exports, "ReportPdfRenderer", { enumerable: true, get: function () { return ReportPdfRenderer_2.ReportPdfRenderer; } });
/** Point d'entrée des rapports : rapport de tâche, compte rendu de réunion, rapport d'activité… */
async function generateReportPdf(input) {
    const { settings, warnings } = (0, settings_1.normalizeDocumentSettings)(input.settings, input.entitlements ?? settings_1.NO_DOCUMENT_ENTITLEMENTS);
    const view = (0, report_view_1.buildReportView)(input.data, { settings });
    const { pdf, pageCount } = await (0, ReportPdfRenderer_1.renderReportPdf)(view, { logo: input.logo, generatedAt: input.generatedAt });
    return { pdf, pageCount, view, warnings: [...warnings] };
}
//# sourceMappingURL=index.js.map