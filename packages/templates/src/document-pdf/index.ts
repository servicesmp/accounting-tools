/**
 * Génération PDF des documents commerciaux par blocs (Node uniquement).
 */
import type { DocumentData, DocumentEntitlements, DocumentView } from '../document/types';
import { normalizeDocumentSettings, NO_DOCUMENT_ENTITLEMENTS } from '../document/settings';
import { buildDocumentView, isFacturXDocument } from '../document/view';
import { renderDocumentPdf } from './DocumentPdfRenderer';
import { buildFacturXInvoice } from './facturx';

export { DocumentPdfRenderer, renderDocumentPdf } from './DocumentPdfRenderer';
export type { RenderDocumentPdfOptions, RenderedDocumentPdf } from './DocumentPdfRenderer';
export { buildFacturXInvoice, FR_MANDATORY_NOTES, FR_FRANCHISE_MENTION } from './facturx';
export type { FacturXBuildResult } from './facturx';

export interface GenerateDocumentPdfInput {
  readonly data: DocumentData;
  /** Réglage enregistré de l'organisation (non fiable : normalisé ici). */
  readonly settings?: unknown;
  /** Droits du plan de l'organisation émettrice. */
  readonly entitlements?: DocumentEntitlements;
  readonly logo?: Uint8Array | null;
  readonly defaultCountry?: string;
}

export interface GeneratedDocumentPdf {
  readonly pdf: Uint8Array;
  readonly pageCount: number;
  readonly view: DocumentView;
  /** XML Factur-X embarqué (facture et avoir), sinon undefined. */
  readonly xml?: string;
  readonly warnings: string[];
}

/**
 * Point d'entrée unique : facture, avoir, devis ou bon de commande.
 * Facture/avoir : le XML Factur-X est construit à partir des MÊMES données et ses
 * totaux sont ceux affichés (aucun écart possible entre PDF et XML).
 */
export async function generateDocumentPdf(input: GenerateDocumentPdfInput): Promise<GeneratedDocumentPdf> {
  const { settings, warnings } = normalizeDocumentSettings(input.settings, input.entitlements ?? NO_DOCUMENT_ENTITLEMENTS);
  let data = input.data;
  let xml: string | undefined;
  const allWarnings = [...warnings];
  if (isFacturXDocument(data.kind)) {
    const built = buildFacturXInvoice(data, { defaultCountry: input.defaultCountry });
    allWarnings.push(...built.warnings);
    xml = built.invoice.generateXml(true);
    data = { ...data, totals: built.totals, lines: data.lines.map((l, i) => ({ ...l, lineTotal: built.lineTotals[i] })) };
  }
  const view = buildDocumentView(data, { settings });
  const { pdf, pageCount } = await renderDocumentPdf(view, { logo: input.logo, facturXml: xml });
  return { pdf, pageCount, view, xml, warnings: allWarnings };
}

// ─── Rapports par blocs ──────────────────────────────────────────────────────
import { buildReportView } from '../document/report-view';
import type { ReportDocumentData, ReportView } from '../document/report-types';
import { renderReportPdf } from './ReportPdfRenderer';
export { renderReportPdf, ReportPdfRenderer } from './ReportPdfRenderer';
export type { RenderReportPdfOptions, RenderedReportPdf } from './ReportPdfRenderer';

export interface GenerateReportPdfInput {
  readonly data: ReportDocumentData;
  /** Réglage enregistré de l'organisation (non fiable : normalisé ici), le même que pour les factures. */
  readonly settings?: unknown;
  readonly entitlements?: DocumentEntitlements;
  readonly logo?: Uint8Array | null;
  readonly generatedAt?: Date;
}

export interface GeneratedReportPdf {
  readonly pdf: Uint8Array;
  readonly pageCount: number;
  readonly view: ReportView;
  readonly warnings: string[];
}

/** Point d'entrée des rapports : rapport de tâche, compte rendu de réunion, rapport d'activité… */
export async function generateReportPdf(input: GenerateReportPdfInput): Promise<GeneratedReportPdf> {
  const { settings, warnings } = normalizeDocumentSettings(input.settings, input.entitlements ?? NO_DOCUMENT_ENTITLEMENTS);
  const view = buildReportView(input.data, { settings });
  const { pdf, pageCount } = await renderReportPdf(view, { logo: input.logo, generatedAt: input.generatedAt });
  return { pdf, pageCount, view, warnings: [...warnings] };
}

// ─── Relevé de temps ─────────────────────────────────────────────────────────
import { buildTimesheetView } from '../document/timesheet-view';
import type { TimesheetDocumentData, TimesheetVariant, TimesheetView } from '../document/timesheet-types';
import { renderTimesheetPdf } from './TimesheetPdfRenderer';
export { renderTimesheetPdf, TimesheetPdfRenderer } from './TimesheetPdfRenderer';
export type { RenderTimesheetPdfOptions, RenderedTimesheetPdf } from './TimesheetPdfRenderer';

export interface GenerateTimesheetPdfInput {
  readonly data: TimesheetDocumentData;
  readonly variant?: TimesheetVariant;
  /** Réglage enregistré de l'organisation (non fiable : normalisé ici), le même que pour les factures. */
  readonly settings?: unknown;
  /** Droits du plan : sans `canCustomize`, ni logo ni personnalisation. */
  readonly entitlements?: DocumentEntitlements;
  readonly logo?: Uint8Array | null;
  readonly generatedAt?: Date;
  /** Fuseau des horodatages (défaut Europe/Paris). */
  readonly timeZone?: string;
}

export interface GeneratedTimesheetPdf {
  readonly pdf: Uint8Array;
  readonly pageCount: number;
  readonly view: TimesheetView;
  readonly warnings: string[];
}

/** Point d'entrée du relevé de temps (versions simple et détaillée). */
export async function generateTimesheetPdf(input: GenerateTimesheetPdfInput): Promise<GeneratedTimesheetPdf> {
  const { settings, warnings } = normalizeDocumentSettings(input.settings, input.entitlements ?? NO_DOCUMENT_ENTITLEMENTS);
  const view = buildTimesheetView(input.data, { settings, variant: input.variant, timeZone: input.timeZone });
  const { pdf, pageCount } = await renderTimesheetPdf(view, { logo: input.logo, generatedAt: input.generatedAt });
  return { pdf, pageCount, view, warnings: [...warnings] };
}
