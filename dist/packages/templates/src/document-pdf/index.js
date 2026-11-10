"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformInvoicePdfRenderer = exports.renderPlatformInvoicePdf = exports.TimesheetPdfRenderer = exports.renderTimesheetPdf = exports.ReportPdfRenderer = exports.renderReportPdf = exports.FR_FRANCHISE_MENTION = exports.FR_MANDATORY_NOTES = exports.buildFacturXInvoice = exports.renderDocumentPdf = exports.DocumentPdfRenderer = void 0;
exports.generateDocumentPdf = generateDocumentPdf;
exports.generateReportPdf = generateReportPdf;
exports.generateTimesheetPdf = generateTimesheetPdf;
exports.generatePlatformInvoicePdf = generatePlatformInvoicePdf;
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
// ─── Relevé de temps ─────────────────────────────────────────────────────────
const timesheet_view_1 = require("../document/timesheet-view");
const TimesheetPdfRenderer_1 = require("./TimesheetPdfRenderer");
var TimesheetPdfRenderer_2 = require("./TimesheetPdfRenderer");
Object.defineProperty(exports, "renderTimesheetPdf", { enumerable: true, get: function () { return TimesheetPdfRenderer_2.renderTimesheetPdf; } });
Object.defineProperty(exports, "TimesheetPdfRenderer", { enumerable: true, get: function () { return TimesheetPdfRenderer_2.TimesheetPdfRenderer; } });
/** Point d'entrée du relevé de temps (versions simple et détaillée). */
async function generateTimesheetPdf(input) {
    const { settings, warnings } = (0, settings_1.normalizeDocumentSettings)(input.settings, input.entitlements ?? settings_1.NO_DOCUMENT_ENTITLEMENTS);
    const view = (0, timesheet_view_1.buildTimesheetView)(input.data, { settings, variant: input.variant, timeZone: input.timeZone });
    const { pdf, pageCount } = await (0, TimesheetPdfRenderer_1.renderTimesheetPdf)(view, { logo: input.logo, generatedAt: input.generatedAt });
    return { pdf, pageCount, view, warnings: [...warnings] };
}
// ─── Factures émises par la plateforme (abonnement, frais de service) ───────
const platform_invoice_view_1 = require("../document/platform-invoice-view");
const PlatformInvoicePdfRenderer_1 = require("./PlatformInvoicePdfRenderer");
var PlatformInvoicePdfRenderer_2 = require("./PlatformInvoicePdfRenderer");
Object.defineProperty(exports, "renderPlatformInvoicePdf", { enumerable: true, get: function () { return PlatformInvoicePdfRenderer_2.renderPlatformInvoicePdf; } });
Object.defineProperty(exports, "PlatformInvoicePdfRenderer", { enumerable: true, get: function () { return PlatformInvoicePdfRenderer_2.PlatformInvoicePdfRenderer; } });
/**
 * Facture d'abonnement ou de frais de service de la plateforme : XML Factur-X (remise BG-20,
 * période BG-14, montant payé BT-113, blocs d'information en notes) puis PDF/A-3 dessiné avec
 * les totaux du XML — aucun écart possible entre ce qui est imprimé et ce qui est transmis.
 */
async function generatePlatformInvoicePdf(input) {
    const draft = (0, platform_invoice_view_1.buildPlatformInvoiceView)(input.data);
    const built = (0, facturx_1.buildFacturXInvoice)((0, platform_invoice_view_1.platformInvoiceToDocumentData)(input.data, draft), { defaultCountry: input.defaultCountry });
    const warnings = [...built.warnings];
    const computed = (0, platform_invoice_view_1.computePlatformTotals)(input.data);
    if (built.totals.total !== computed.total) {
        warnings.push(`TTC du XML (${built.totals.total}) différent du calcul par taux (${computed.total}) : le XML fait foi.`);
    }
    if (input.expectedTotal !== undefined && built.totals.total !== Math.round(input.expectedTotal)) {
        warnings.push(`TTC de la facture (${built.totals.total}) différent du montant prélevé (${Math.round(input.expectedTotal)}).`);
    }
    // Réglée à l'émission : montant payé = TTC (BT-113), reste à payer nul (BT-115).
    if (input.data.state === 'paid')
        built.invoice.setPrepaidAmount(built.invoice.finalizeTotals().grandTotal);
    const xml = built.invoice.generateXml(true);
    const view = (0, platform_invoice_view_1.buildPlatformInvoiceView)(input.data, { totals: built.totals });
    const { pdf, pageCount } = await (0, PlatformInvoicePdfRenderer_1.renderPlatformInvoicePdf)(view, { logo: input.logo, facturXml: xml, generatedAt: input.generatedAt });
    return { pdf, pageCount, view, xml, warnings };
}
//# sourceMappingURL=index.js.map