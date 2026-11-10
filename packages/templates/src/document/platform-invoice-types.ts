/**
 * Factures émises PAR la plateforme Services — modèle distinct de celui des organisations.
 *
 * - `subscription` : facture d'abonnement à un plan (starter, pro, business), plateforme →
 *   souscripteur (personne physique), réglée par prélèvement automatique sur carte.
 * - `service_fees` : facture de frais de service, plateforme → organisation prestataire :
 *   commission sur un encaissement (et frais de paiement repris), prélevée sur son wallet.
 *
 * Maquette « Factures Plateforme » (A4, 794 × 1123 px) : Chillax 500 / 600 / 700, encre #111,
 * accent rouge Services limité au filet du titre, aux libellés de section et au total TTC,
 * logo Services en tête et en pied. Le modèle n'est PAS personnalisable : ni réglage
 * d'organisation, ni mention « Émis avec Services ».
 *
 * Factur-X : le PDF embarque le XML EN 16931 construit à partir des MÊMES données
 * (`platformInvoiceToDocumentData`) ; tout ce qui est imprimé existe dans le XML (lignes,
 * remise BG-20, période BG-14, montant payé BT-113, blocs d'information en notes BT-22).
 *
 * Montants : unités mineures entières. Taux : pourcentage (20 = 20 %). Navigateur-compatible.
 */
import type { DocumentLine, DocumentParty } from './types';

export type PlatformInvoiceKind = 'subscription' | 'service_fees';

/**
 * - paid : réglée (prélèvement réussi, compensation sur le wallet) ;
 * - payment_failed : prélèvement refusé, nouvelle tentative programmée ou non ;
 * - pending : émise, à régler ;
 * - refunded / cancelled.
 */
export type PlatformInvoiceState = 'paid' | 'payment_failed' | 'pending' | 'refunded' | 'cancelled';

export interface PlatformSubscriptionInfo {
  /** Nom du plan affiché : « Pro », « Starter », « Entreprise ». */
  readonly planName: string;
  readonly interval: 'monthly' | 'annual';
  /** Compte du souscripteur (e-mail de connexion). */
  readonly account?: string;
  /** Référence de l'abonnement propre à Services (jamais un identifiant du prestataire de paiement). */
  readonly reference?: string;
  /** Changement de plan en cours de période (prorata). */
  readonly planChange?: boolean;
  /** Prélèvement refusé : date du refus et de la prochaine tentative. */
  readonly failedAt?: string | Date;
  readonly nextAttemptAt?: string | Date;
}

export interface PlatformFeesOperation {
  /** Numéro de la facture client dont l'encaissement porte la commission. */
  readonly invoiceNumber?: string;
  /** Client final (acheteur de la prestation). */
  readonly clientName?: string;
  /** Montant HT encaissé, unités mineures. */
  readonly collectedAmount?: number;
  readonly collectedAt?: string | Date;
  /** Taux de commission en pourcentage du HT encaissé (8 = 8 %). */
  readonly commissionRate?: number;
}

export interface PlatformInvoiceData {
  readonly kind: PlatformInvoiceKind;
  readonly number: string;
  readonly issueDate: string | Date;
  /** Échéance (défaut : date d'émission, facture réglée à l'émission). */
  readonly dueDate?: string | Date;
  /** Date de règlement (prélèvement réussi, compensation). */
  readonly paidAt?: string | Date;
  readonly currency: string;
  readonly state: PlatformInvoiceState;

  readonly seller: DocumentParty;
  readonly buyer: DocumentParty;

  /** Période facturée (abonnement). */
  readonly period?: { readonly start: string | Date; readonly end: string | Date };
  /** Lignes HT AVANT remise (la remise est une remise de document, BG-20). */
  readonly lines: readonly DocumentLine[];
  /** Remise HT au niveau du document (code promotionnel, offre de lancement). */
  readonly discount?: { readonly amount: number; readonly reason?: string };

  readonly subscription?: PlatformSubscriptionInfo;
  readonly operation?: PlatformFeesOperation;

  /** Mentions libres sous le tableau, en plus de celles que le modèle compose. */
  readonly notes?: readonly string[];
}

// ─── Vue (consommée par les moteurs PDF et HTML) ─────────────────────────────

export interface PlatformInfoRow {
  readonly label: string;
  readonly value: string;
  /** Valeur en gras (statut). */
  readonly strong?: boolean;
  /** Couleur de la valeur (statut refusé : #C1123C). */
  readonly color?: string;
}

export interface PlatformTotalRow {
  readonly label: string;
  readonly value: string;
  /** Valeur en semi-gras (Total HT, TVA). */
  readonly strong?: boolean;
  /** Filet gris au-dessus de la ligne (Total HT après une remise). */
  readonly ruleTop?: boolean;
}

export interface PlatformInvoiceRow {
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly vat: string;
  readonly total: string;
}

export interface PlatformInvoiceView {
  readonly kind: PlatformInvoiceKind;
  readonly locale: string;
  /** « FACTURE D'ABONNEMENT », « FACTURE DE FRAIS DE SERVICE » (capitales au rendu). */
  readonly title: string;
  readonly number: string;
  /** Émetteur : nom en gras, suite de la première ligne (forme, capital), lignes suivantes. */
  readonly seller: { readonly name: string; readonly firstLineRest: string; readonly lines: readonly string[] };
  /** Dates et devise, à droite de l'en-tête. */
  readonly meta: readonly { readonly label: string; readonly value: string }[];
  readonly buyerTitle: string;
  readonly buyer: { readonly name: string; readonly lines: readonly string[] };
  /** Bloc de droite : « Abonnement » ou « Opération concernée ». */
  readonly info: { readonly title: string; readonly rows: readonly PlatformInfoRow[] };
  readonly columns: { readonly description: string; readonly quantity: string; readonly unitPrice: string; readonly vat: string; readonly total: string };
  readonly rows: readonly PlatformInvoiceRow[];
  /** Mentions sous le tableau (remise, assiette de la commission…). */
  readonly notes: readonly string[];
  readonly totals: readonly PlatformTotalRow[];
  readonly grandTotal: { readonly label: string; readonly value: string };
  /** « Reste à payer » (réglée) ou « Montant dû ». */
  readonly rest: { readonly label: string; readonly value: string };
  /** Encadré du prélèvement refusé. */
  readonly alert?: string;
  /** Deux colonnes du pied : conditions (abonnement / frais de service) et mentions légales. */
  readonly footer: readonly { readonly title: string; readonly text: string }[];
  readonly pageLabel: (page: number, total: number) => string;
  /** Totaux en unités mineures (contrôles, XML). */
  readonly totalsRaw: {
    readonly lines: number;
    readonly discount: number;
    readonly taxBasis: number;
    readonly tax: number;
    readonly total: number;
    readonly paid: number;
    readonly due: number;
  };
}
