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
