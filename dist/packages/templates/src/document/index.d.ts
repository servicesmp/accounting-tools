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
export * from './types';
export * from './settings';
export * from './view';
export * from './records';
export * from './format';
export * from './country';
export { DOCUMENT_LABELS, DOCUMENT_LOCALES, getDocumentLabels } from './i18n';
export type { DocumentLabels } from './i18n';
export { renderDocumentHtml, escapeHtml, safeImageUrl } from './html';
export type { RenderDocumentHtmlOptions } from './html';
export { normalizeHex, contrastRatio, ensureContrastOnWhite, tint, shade, relativeLuminance, mix, blend } from './color';
export * from './report-types';
export { buildReportView, normalizeReportBlock, reportLine, reportText, REPORT_MAX_BLOCKS, REPORT_MAX_ITEMS, REPORT_MAX_META, REPORT_MAX_TILES, REPORT_TITLE_MAX, REPORT_LINE_MAX, REPORT_TEXT_MAX } from './report-view';
export type { BuildReportViewOptions } from './report-view';
export { renderReportHtml, reportInitials, reportAvatarColor, REPORT_PAGE_W, REPORT_PAGE_H, REPORT_TONE_COLORS, REPORT_TONE_SOLID } from './report-html';
export type { RenderReportHtmlOptions } from './report-html';
export * from './timesheet-types';
export { buildTimesheetView, timesheetDuration, TIMESHEET_LABELS, TIMESHEET_MAX_LINES } from './timesheet-view';
export type { BuildTimesheetViewOptions } from './timesheet-view';
export { renderTimesheetHtml, TIMESHEET_PAGE_W, TIMESHEET_PAGE_H, TIMESHEET_SIDE, TIMESHEET_FOOT_RESERVE, TIMESHEET_COLORS, TIMESHEET_TONES } from './timesheet-html';
export type { RenderTimesheetHtmlOptions } from './timesheet-html';
export * from './platform-invoice-types';
export { buildPlatformInvoiceView, computePlatformTotals, platformInvoiceToDocumentData, platformSubscriptionLineLabel, platformDiscountRate, formatSiret, formatVatNumber, currencyDisplayName, PLATFORM_ALERT_COLOR } from './platform-invoice-view';
export type { BuildPlatformInvoiceViewOptions } from './platform-invoice-view';
export { renderPlatformInvoiceHtml, PLATFORM_COLORS, PLATFORM_PAGE_W, PLATFORM_PAGE_H } from './platform-invoice-html';
export type { RenderPlatformInvoiceHtmlOptions } from './platform-invoice-html';
export { billingRecordToPlatformInvoiceData, platformInvoiceKindOf, platformPlanName, platformSubscriptionReference, PLATFORM_PLAN_NAMES } from './platform-invoice-records';
export type { PlatformInvoiceRecordOptions } from './platform-invoice-records';
//# sourceMappingURL=index.d.ts.map