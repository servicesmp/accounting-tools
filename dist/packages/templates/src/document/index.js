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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatVatNumber = exports.formatSiret = exports.platformDiscountRate = exports.platformSubscriptionLineLabel = exports.platformInvoiceToDocumentData = exports.computePlatformTotals = exports.buildPlatformInvoiceView = exports.TIMESHEET_TONES = exports.TIMESHEET_COLORS = exports.TIMESHEET_FOOT_RESERVE = exports.TIMESHEET_SIDE = exports.TIMESHEET_PAGE_H = exports.TIMESHEET_PAGE_W = exports.renderTimesheetHtml = exports.TIMESHEET_MAX_LINES = exports.TIMESHEET_LABELS = exports.timesheetDuration = exports.buildTimesheetView = exports.REPORT_TONE_SOLID = exports.REPORT_TONE_COLORS = exports.REPORT_PAGE_H = exports.REPORT_PAGE_W = exports.reportAvatarColor = exports.reportInitials = exports.renderReportHtml = exports.REPORT_TEXT_MAX = exports.REPORT_LINE_MAX = exports.REPORT_TITLE_MAX = exports.REPORT_MAX_TILES = exports.REPORT_MAX_META = exports.REPORT_MAX_ITEMS = exports.REPORT_MAX_BLOCKS = exports.reportText = exports.reportLine = exports.normalizeReportBlock = exports.buildReportView = exports.blend = exports.mix = exports.relativeLuminance = exports.shade = exports.tint = exports.ensureContrastOnWhite = exports.contrastRatio = exports.normalizeHex = exports.safeImageUrl = exports.escapeHtml = exports.renderDocumentHtml = exports.getDocumentLabels = exports.DOCUMENT_LOCALES = exports.DOCUMENT_LABELS = void 0;
exports.PLATFORM_PLAN_NAMES = exports.platformSubscriptionReference = exports.platformPlanName = exports.platformInvoiceKindOf = exports.billingRecordToPlatformInvoiceData = exports.PLATFORM_PAGE_H = exports.PLATFORM_PAGE_W = exports.PLATFORM_COLORS = exports.renderPlatformInvoiceHtml = exports.PLATFORM_ALERT_COLOR = exports.currencyDisplayName = void 0;
/**
 * accounting-tools/document — module NAVIGATEUR-COMPATIBLE.
 *
 * Tout ce qu'il faut pour afficher une facture, un avoir, un devis ou un bon de
 * commande exactement comme la librairie l'imprime : types, réglages par
 * organisation (préréglages, normalisation, droits du plan), calcul des totaux,
 * libellés, mentions obligatoires, vue prête à dessiner.
 *
 * Aucune dépendance à pdf-lib, fs, Buffer ou au XML Factur-X : importable depuis
 * la webapp (`import … from 'accounting-tools/document'`).
 */
__exportStar(require("./types"), exports);
__exportStar(require("./settings"), exports);
__exportStar(require("./view"), exports);
__exportStar(require("./records"), exports);
__exportStar(require("./format"), exports);
__exportStar(require("./country"), exports);
var i18n_1 = require("./i18n");
Object.defineProperty(exports, "DOCUMENT_LABELS", { enumerable: true, get: function () { return i18n_1.DOCUMENT_LABELS; } });
Object.defineProperty(exports, "DOCUMENT_LOCALES", { enumerable: true, get: function () { return i18n_1.DOCUMENT_LOCALES; } });
Object.defineProperty(exports, "getDocumentLabels", { enumerable: true, get: function () { return i18n_1.getDocumentLabels; } });
var html_1 = require("./html");
Object.defineProperty(exports, "renderDocumentHtml", { enumerable: true, get: function () { return html_1.renderDocumentHtml; } });
Object.defineProperty(exports, "escapeHtml", { enumerable: true, get: function () { return html_1.escapeHtml; } });
Object.defineProperty(exports, "safeImageUrl", { enumerable: true, get: function () { return html_1.safeImageUrl; } });
var color_1 = require("./color");
Object.defineProperty(exports, "normalizeHex", { enumerable: true, get: function () { return color_1.normalizeHex; } });
Object.defineProperty(exports, "contrastRatio", { enumerable: true, get: function () { return color_1.contrastRatio; } });
Object.defineProperty(exports, "ensureContrastOnWhite", { enumerable: true, get: function () { return color_1.ensureContrastOnWhite; } });
Object.defineProperty(exports, "tint", { enumerable: true, get: function () { return color_1.tint; } });
Object.defineProperty(exports, "shade", { enumerable: true, get: function () { return color_1.shade; } });
Object.defineProperty(exports, "relativeLuminance", { enumerable: true, get: function () { return color_1.relativeLuminance; } });
Object.defineProperty(exports, "mix", { enumerable: true, get: function () { return color_1.mix; } });
Object.defineProperty(exports, "blend", { enumerable: true, get: function () { return color_1.blend; } });
// Rapports par blocs (rapport de tâche, compte rendu de réunion, rapport d'activité…)
__exportStar(require("./report-types"), exports);
var report_view_1 = require("./report-view");
Object.defineProperty(exports, "buildReportView", { enumerable: true, get: function () { return report_view_1.buildReportView; } });
Object.defineProperty(exports, "normalizeReportBlock", { enumerable: true, get: function () { return report_view_1.normalizeReportBlock; } });
Object.defineProperty(exports, "reportLine", { enumerable: true, get: function () { return report_view_1.reportLine; } });
Object.defineProperty(exports, "reportText", { enumerable: true, get: function () { return report_view_1.reportText; } });
Object.defineProperty(exports, "REPORT_MAX_BLOCKS", { enumerable: true, get: function () { return report_view_1.REPORT_MAX_BLOCKS; } });
Object.defineProperty(exports, "REPORT_MAX_ITEMS", { enumerable: true, get: function () { return report_view_1.REPORT_MAX_ITEMS; } });
Object.defineProperty(exports, "REPORT_MAX_META", { enumerable: true, get: function () { return report_view_1.REPORT_MAX_META; } });
Object.defineProperty(exports, "REPORT_MAX_TILES", { enumerable: true, get: function () { return report_view_1.REPORT_MAX_TILES; } });
Object.defineProperty(exports, "REPORT_TITLE_MAX", { enumerable: true, get: function () { return report_view_1.REPORT_TITLE_MAX; } });
Object.defineProperty(exports, "REPORT_LINE_MAX", { enumerable: true, get: function () { return report_view_1.REPORT_LINE_MAX; } });
Object.defineProperty(exports, "REPORT_TEXT_MAX", { enumerable: true, get: function () { return report_view_1.REPORT_TEXT_MAX; } });
var report_html_1 = require("./report-html");
Object.defineProperty(exports, "renderReportHtml", { enumerable: true, get: function () { return report_html_1.renderReportHtml; } });
Object.defineProperty(exports, "reportInitials", { enumerable: true, get: function () { return report_html_1.reportInitials; } });
Object.defineProperty(exports, "reportAvatarColor", { enumerable: true, get: function () { return report_html_1.reportAvatarColor; } });
Object.defineProperty(exports, "REPORT_PAGE_W", { enumerable: true, get: function () { return report_html_1.REPORT_PAGE_W; } });
Object.defineProperty(exports, "REPORT_PAGE_H", { enumerable: true, get: function () { return report_html_1.REPORT_PAGE_H; } });
Object.defineProperty(exports, "REPORT_TONE_COLORS", { enumerable: true, get: function () { return report_html_1.REPORT_TONE_COLORS; } });
Object.defineProperty(exports, "REPORT_TONE_SOLID", { enumerable: true, get: function () { return report_html_1.REPORT_TONE_SOLID; } });
// Relevé de temps (versions simple et détaillée), même feuille que les devis et factures
__exportStar(require("./timesheet-types"), exports);
var timesheet_view_1 = require("./timesheet-view");
Object.defineProperty(exports, "buildTimesheetView", { enumerable: true, get: function () { return timesheet_view_1.buildTimesheetView; } });
Object.defineProperty(exports, "timesheetDuration", { enumerable: true, get: function () { return timesheet_view_1.timesheetDuration; } });
Object.defineProperty(exports, "TIMESHEET_LABELS", { enumerable: true, get: function () { return timesheet_view_1.TIMESHEET_LABELS; } });
Object.defineProperty(exports, "TIMESHEET_MAX_LINES", { enumerable: true, get: function () { return timesheet_view_1.TIMESHEET_MAX_LINES; } });
var timesheet_html_1 = require("./timesheet-html");
Object.defineProperty(exports, "renderTimesheetHtml", { enumerable: true, get: function () { return timesheet_html_1.renderTimesheetHtml; } });
Object.defineProperty(exports, "TIMESHEET_PAGE_W", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_PAGE_W; } });
Object.defineProperty(exports, "TIMESHEET_PAGE_H", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_PAGE_H; } });
Object.defineProperty(exports, "TIMESHEET_SIDE", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_SIDE; } });
Object.defineProperty(exports, "TIMESHEET_FOOT_RESERVE", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_FOOT_RESERVE; } });
Object.defineProperty(exports, "TIMESHEET_COLORS", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_COLORS; } });
Object.defineProperty(exports, "TIMESHEET_TONES", { enumerable: true, get: function () { return timesheet_html_1.TIMESHEET_TONES; } });
// Factures émises par la plateforme (abonnement, frais de service) — modèle distinct, non personnalisable
__exportStar(require("./platform-invoice-types"), exports);
var platform_invoice_view_1 = require("./platform-invoice-view");
Object.defineProperty(exports, "buildPlatformInvoiceView", { enumerable: true, get: function () { return platform_invoice_view_1.buildPlatformInvoiceView; } });
Object.defineProperty(exports, "computePlatformTotals", { enumerable: true, get: function () { return platform_invoice_view_1.computePlatformTotals; } });
Object.defineProperty(exports, "platformInvoiceToDocumentData", { enumerable: true, get: function () { return platform_invoice_view_1.platformInvoiceToDocumentData; } });
Object.defineProperty(exports, "platformSubscriptionLineLabel", { enumerable: true, get: function () { return platform_invoice_view_1.platformSubscriptionLineLabel; } });
Object.defineProperty(exports, "platformDiscountRate", { enumerable: true, get: function () { return platform_invoice_view_1.platformDiscountRate; } });
Object.defineProperty(exports, "formatSiret", { enumerable: true, get: function () { return platform_invoice_view_1.formatSiret; } });
Object.defineProperty(exports, "formatVatNumber", { enumerable: true, get: function () { return platform_invoice_view_1.formatVatNumber; } });
Object.defineProperty(exports, "currencyDisplayName", { enumerable: true, get: function () { return platform_invoice_view_1.currencyDisplayName; } });
Object.defineProperty(exports, "PLATFORM_ALERT_COLOR", { enumerable: true, get: function () { return platform_invoice_view_1.PLATFORM_ALERT_COLOR; } });
var platform_invoice_html_1 = require("./platform-invoice-html");
Object.defineProperty(exports, "renderPlatformInvoiceHtml", { enumerable: true, get: function () { return platform_invoice_html_1.renderPlatformInvoiceHtml; } });
Object.defineProperty(exports, "PLATFORM_COLORS", { enumerable: true, get: function () { return platform_invoice_html_1.PLATFORM_COLORS; } });
Object.defineProperty(exports, "PLATFORM_PAGE_W", { enumerable: true, get: function () { return platform_invoice_html_1.PLATFORM_PAGE_W; } });
Object.defineProperty(exports, "PLATFORM_PAGE_H", { enumerable: true, get: function () { return platform_invoice_html_1.PLATFORM_PAGE_H; } });
var platform_invoice_records_1 = require("./platform-invoice-records");
Object.defineProperty(exports, "billingRecordToPlatformInvoiceData", { enumerable: true, get: function () { return platform_invoice_records_1.billingRecordToPlatformInvoiceData; } });
Object.defineProperty(exports, "platformInvoiceKindOf", { enumerable: true, get: function () { return platform_invoice_records_1.platformInvoiceKindOf; } });
Object.defineProperty(exports, "platformPlanName", { enumerable: true, get: function () { return platform_invoice_records_1.platformPlanName; } });
Object.defineProperty(exports, "platformSubscriptionReference", { enumerable: true, get: function () { return platform_invoice_records_1.platformSubscriptionReference; } });
Object.defineProperty(exports, "PLATFORM_PLAN_NAMES", { enumerable: true, get: function () { return platform_invoice_records_1.PLATFORM_PLAN_NAMES; } });
//# sourceMappingURL=index.js.map