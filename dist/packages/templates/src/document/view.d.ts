/**
 * Construction de la VUE d'un document, trait pour trait selon la maquette
 * « Document Page » : tout texte imprimé est décidé ici, une seule fois. Les
 * moteurs PDF et HTML ne font que la dessiner.
 */
import { DocumentData, DocumentTemplateSettings, DocumentView, DocumentTotals, ColumnKey, DocumentParty, DocumentKind } from './types';
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
/**
 * Identifiants imprimés pour le client (10/11). Un particulier n'a ni n° de TVA intracommunautaire
 * ni SIRET : ils ne sont repris que pour un client entreprise (raison sociale ou SIRET / SIREN).
 * Un identifiant égal à celui du vendeur est une erreur de saisie (facture INV-20261106-0001 :
 * client particulier portant le n° de TVA du prestataire) : jamais imprimé.
 */
export declare function buyerIdentity(buyer: DocumentParty, seller: Pick<DocumentParty, 'vatId' | 'siret' | 'siren'>): DocumentParty;
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
/**
 * Client entreprise : raison sociale, SIRET ou SIREN connus — même définition pour les mentions de
 * règlement et pour les identifiants imprimés (`buyerIdentity`). Sans aucun d'eux : un particulier.
 */
export declare function isProfessionalParty(party: Pick<DocumentParty, 'siren' | 'siret' | 'legalName'> | undefined): boolean;
/** Raison sociale suivie de la forme juridique si elle n'y figure pas déjà. */
export declare function sellerIdentity(seller: Pick<DocumentParty, 'name' | 'legalName' | 'legalForm'>): string;
/**
 * Mentions légales complémentaires du vendeur pour le Factur-X (BT-33) :
 * forme juridique, capital, immatriculation. `undefined` si aucune.
 */
export declare function sellerLegalInformation(seller: Pick<DocumentParty, 'legalForm' | 'capital' | 'registration'>): string | undefined;
//# sourceMappingURL=view.d.ts.map