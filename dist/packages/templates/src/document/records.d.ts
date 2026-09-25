/**
 * Enregistrements de la plateforme Services → `DocumentData`.
 *
 * - `billingInvoiceToDocumentData` : facture de mu-billing (modèle Prisma `Invoice`,
 *   champs JSON `header`, `seller`, `buyer`, `payment`, `lines`, parfois reçus en
 *   chaînes JSON via GraphQL).
 * - `estimateToDocumentData` : devis de mu-contract (`details.services[].items`).
 *
 * Utilisé par mu-billing (PDF + XML Factur-X) ET par la webapp (rendu HTML) : les
 * deux affichent donc le même document à partir du même enregistrement.
 * Montants : unités mineures. Pays : laissés tels quels, convertis en ISO au rendu.
 */
import type { DocumentData, DocumentParty, DocumentStatus } from './types';
export declare const FR_FRANCHISE_MENTION = "TVA non applicable, art. 293 B du CGI";
/** N° TVA intracommunautaire plausible (préfixe FR ajouté si absent) ; valeurs factices écartées. */
export declare function normalizeVatId(value: unknown): string | undefined;
/** Partie (vendeur / acheteur) au format JSON de mu-billing. */
export declare function billingPartyToDocumentParty(raw: unknown, currency?: string): DocumentParty;
export interface BillingInvoiceOptions {
    /**
     * Force l'aperçu provisoire (filigrane BROUILLON) — éditeur de brouillon.
     * Absent ou `false` : l'état est déduit de la facture (`billingInvoiceStatus`).
     */
    readonly isDraft?: boolean;
    /** Date de référence pour « en retard » (défaut : maintenant). */
    readonly asOf?: Date;
    /** Lien de paiement en ligne (QR code) — ignoré si la facture est payée ou provisoire. */
    readonly paymentLink?: string;
}
/** Vrai si la facture est payée (paymentStatus PAID / COMPLETED, casse indifférente). */
export declare function isBillingInvoicePaid(record: any): boolean;
/**
 * État d'une facture mu-billing, seule règle partagée par l'écran, le PDF et le filigrane.
 *
 * - payée (PAID / COMPLETED) → `paid` ; remboursée → `refunded` ;
 *   annulée (CANCELLED / CANCELED / VOID) → `cancelled` ;
 * - facture saisie dans le tableau de bord (`transactionData.metadata.source`) et
 *   jamais transmise au client → `draft` : brouillon modifiable, filigrane BROUILLON ;
 * - sinon émise : échéance dépassée → `overdue`, sinon `pending` (pas de filigrane).
 *
 * Avant, toute facture non payée était traitée en brouillon : une facture envoyée
 * au client (ou une facture de frais émise par la plateforme) partait avec le
 * filigrane « Document provisoire ».
 */
export declare function billingInvoiceStatus(record: any, asOf?: Date): DocumentStatus;
/** Facture mu-billing → DocumentData (facture, ou avoir 381 si la facture d'origine est connue). */
export declare function billingInvoiceToDocumentData(record: any, options?: BillingInvoiceOptions): DocumentData;
/**
 * État d'un devis. Un devis encore sans réponse (envoyé, en négociation…) dont la
 * date de validité est passée est `expired` : filigrane EXPIRÉ.
 */
export declare function estimateDocumentStatus(rawStatus: unknown, validUntil: Date | undefined, asOf?: Date): DocumentStatus;
export interface EstimateToDocumentOptions {
    /** Numéro affiché (sinon `details.estimateNumber`, sinon l'identifiant). */
    readonly number?: string;
    /** Devise (sinon `details.currency`, sinon EUR). */
    readonly currency?: string;
    /** Statut métier effectif (DRAFT, PENDING, ACCEPTED…). */
    readonly status?: string;
    /**
     * Montants imposés (tunnel de paiement, prix négocié) : le total affiché doit être
     * exactement celui débité. `subTotal` HT ; `extraLines` = frais hors TVA.
     */
    readonly pricing?: {
        readonly subTotal: number;
        readonly extraLines?: readonly {
            readonly label: string;
            readonly amount: number;
        }[];
    };
    /** Date de référence pour « expiré » (défaut : maintenant). */
    readonly asOf?: Date;
}
/** Devis mu-contract → DocumentData (kind 'quote'). */
export declare function estimateToDocumentData(estimate: any, options?: EstimateToDocumentOptions): DocumentData;
//# sourceMappingURL=records.d.ts.map