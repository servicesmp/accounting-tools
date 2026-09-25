/**
 * Construction de la VUE d'un document, trait pour trait selon la maquette
 * « Document Page » : tout texte imprimé est décidé ici, une seule fois. Les
 * moteurs PDF et HTML ne font que la dessiner.
 */
import { DocumentData, DocumentTemplateSettings, DocumentView, DocumentTotals, ColumnKey, DocumentKind } from './types';
/** Total HT d'une ligne (unités mineures) : quantité × prix, remise déduite. */
export declare function computeLineTotal(line: {
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    lineTotal?: number;
}): number;
/** Totaux calculés depuis les lignes : TVA ventilée par taux, arrondie par taux. */
export declare function computeDocumentTotals(data: Pick<DocumentData, 'lines' | 'vatExemptionReason'>): DocumentTotals;
export declare const COLUMN_SPEC: Record<ColumnKey, {
    width: number | null;
    align: 'left' | 'right';
    bold: boolean;
    primary: boolean;
}>;
/** Le document embarque-t-il un XML Factur-X ? (facture et avoir uniquement) */
export declare function isFacturXDocument(kind: DocumentKind): boolean;
export interface BuildDocumentViewOptions {
    /** Réglage déjà normalisé (normalizeDocumentSettings). */
    readonly settings?: DocumentTemplateSettings;
}
/**
 * Corps du filigrane : 110 px (maquette) pour les mots courts, réduit pour que les
 * mots longs (« REMBOURSÉE », « ÜBERFÄLLIG ») tiennent dans la diagonale de la page.
 * Même valeur pour le HTML et le PDF : les deux rendus restent identiques.
 */
export declare function watermarkFontSize(text: string): number;
export declare function buildDocumentView(data: DocumentData, options?: BuildDocumentViewOptions): DocumentView;
//# sourceMappingURL=view.d.ts.map