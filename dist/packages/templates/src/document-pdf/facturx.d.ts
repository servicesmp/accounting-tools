/**
 * Données d'un document → facture Factur-X (XML CII EN 16931).
 *
 * C'est ici — et seulement ici — que se fait la conversion vers le modèle de la
 * librairie cœur : unités mineures → unités majeures, pourcentages → fractions,
 * pays → codes ISO, notes françaises obligatoires (BR-FR-05), identifiants
 * (SIREN BT-30, adresses électroniques BT-34/BT-49), avoir (BT-25).
 */
import { FacturXInvoice, FacturxProfile } from '../../../core/src';
import type { DocumentData, DocumentTotals } from '../document/types';
/** Notes obligatoires françaises portées dans le XML (BR-FR-05). */
export declare const FR_MANDATORY_NOTES: ReadonlyArray<{
    subjectCode: string;
    content: string;
}>;
export declare const FR_FRANCHISE_MENTION = "TVA non applicable, art. 293 B du CGI";
export interface FacturXBuildResult {
    readonly invoice: FacturXInvoice;
    /** Totaux du XML, en unités mineures : à réutiliser tels quels pour l'affichage. */
    readonly totals: DocumentTotals;
    /** Totaux HT par ligne (unités mineures), dans l'ordre des lignes. */
    readonly lineTotals: number[];
    /** Corrections appliquées (pays inconnu, TVA sans préfixe…). */
    readonly warnings: string[];
}
/**
 * Construit la facture Factur-X d'une facture ou d'un avoir. Lève pour un devis
 * ou un bon de commande : ils n'ont pas de représentation Factur-X.
 */
export declare function buildFacturXInvoice(data: DocumentData, options?: {
    profile?: FacturxProfile;
    defaultCountry?: string;
}): FacturXBuildResult;
//# sourceMappingURL=facturx.d.ts.map