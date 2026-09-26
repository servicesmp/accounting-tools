/**
 * Modèle de document commercial — types partagés par le rendu PDF (Node) et le
 * rendu HTML (webapp). Ce fichier et tout le dossier `document/` sont
 * « navigateur-compatibles » : aucune dépendance à pdf-lib, fs ou Buffer.
 *
 * Montants : toujours en UNITÉS MINEURES entières (centimes), comme dans toute la
 * plateforme. Taux de TVA : en POURCENTAGE (20 = 20 %).
 */

// ─── Types de documents ──────────────────────────────────────────────────────

/**
 * - invoice : facture (UNTDID 380), Factur-X embarqué
 * - credit  : avoir (381), Factur-X embarqué, référence à la facture d'origine obligatoire
 * - quote   : devis — PAS de Factur-X (un devis n'est pas une facture)
 * - order   : bon de commande — pas de Factur-X, pas de bloc de paiement
 */
export type DocumentKind = 'invoice' | 'credit' | 'quote' | 'order';
export const DOCUMENT_KINDS: readonly DocumentKind[] = ['invoice', 'credit', 'quote', 'order'];

export type DocumentLanguage = 'fr' | 'en' | 'es' | 'de';
export const DOCUMENT_LANGUAGES: readonly DocumentLanguage[] = ['fr', 'en', 'es', 'de'];

/**
 * État métier du document, qui pilote le filigrane et le libellé d'état.
 * - facture / avoir : draft (jamais émise), pending (émise, à payer), overdue
 *   (échéance dépassée), paid, refunded, cancelled ;
 * - devis : draft, pending (envoyé), accepted, rejected, expired (validité
 *   dépassée sans réponse), cancelled ;
 * - bon de commande : draft, pending, cancelled.
 */
export type DocumentStatus =
  | 'draft' | 'pending' | 'paid' | 'accepted' | 'rejected' | 'cancelled'
  | 'expired' | 'overdue' | 'refunded';

// ─── Réglages de mise en page (blocs indépendants) ──────────────────────────

/** Composition de la page (en-tête et placement des blocs). */
export type FrameLayout = 'standard' | 'band' | 'sidebar' | 'hero' | 'centered';
export type PartiesLayout = 'plain' | 'framed' | 'card';
export type TableLayout = 'lines' | 'zebra' | 'filled';
export type TotalsLayout = 'plain' | 'tint' | 'block';
export type LogoLayout = 'left' | 'above' | 'none';

export const FRAME_LAYOUTS: readonly FrameLayout[] = ['standard', 'band', 'sidebar', 'hero', 'centered'];
export const PARTIES_LAYOUTS: readonly PartiesLayout[] = ['plain', 'framed', 'card'];
export const TABLE_LAYOUTS: readonly TableLayout[] = ['lines', 'zebra', 'filled'];
export const TOTALS_LAYOUTS: readonly TotalsLayout[] = ['plain', 'tint', 'block'];
export const LOGO_LAYOUTS: readonly LogoLayout[] = ['left', 'above', 'none'];

/** Colonnes du tableau des lignes. description, quantity et lineTotal sont toujours présentes. */
export type ColumnKey = 'ref' | 'description' | 'quantity' | 'unit' | 'unitPrice' | 'discount' | 'vatRate' | 'lineTotal';
export const COLUMN_KEYS: readonly ColumnKey[] = ['ref', 'description', 'quantity', 'unit', 'unitPrice', 'discount', 'vatRate', 'lineTotal'];
export const REQUIRED_COLUMNS: readonly ColumnKey[] = ['description', 'quantity', 'lineTotal'];

/** Modèles de départ : chacun n'est qu'un préréglage des blocs ci-dessus. */
export type PresetId = 'modern' | 'brand' | 'corporate' | 'minimal' | 'fancy';

export interface DocumentLayout {
  readonly frame: FrameLayout;
  readonly parties: PartiesLayout;
  readonly table: TableLayout;
  readonly totals: TotalsLayout;
}

/**
 * Réglage enregistré par organisation (et figé dans chaque document émis).
 * N'influence JAMAIS le XML Factur-X ni les mentions obligatoires.
 */
export interface DocumentTemplateSettings {
  readonly version: 2;
  readonly preset: PresetId;
  readonly colors: { readonly primary: string; readonly accent: string };
  readonly layout: DocumentLayout;
  readonly logo: LogoLayout;
  readonly columns: readonly ColumnKey[];
  readonly language: DocumentLanguage;
  /** Filigrane automatique selon le statut (BROUILLON, PAYÉ). */
  readonly statusWatermark: boolean;
  /** Motif discret aux couleurs de la marque en fond de l'en-tête. */
  readonly pattern: boolean;
  readonly showTaxBreakdown: boolean;
  /** Bloc de paiement (IBAN, lien, QR code). Jamais affiché sur un bon de commande. */
  readonly showPaymentBlock: boolean;
  /** Mention « Émis avec Services » — obligatoire tant que le plan ne permet pas de la retirer. */
  readonly showPoweredBy: boolean;
  /** Mention libre en fin de document. */
  readonly footerNote: string;
}

/** Droits de l'organisation, dérivés de son plan (matrice CUSTOMIZE_DOCUMENTS / REMOVE_POWERED_BY). */
export interface DocumentEntitlements {
  /** Modèle, couleurs, blocs, colonnes, logo — dès Starter. */
  readonly canCustomize: boolean;
  /** Retirer « Émis avec Services » — dès Pro. */
  readonly canRemovePoweredBy: boolean;
}

// ─── Données d'un document ───────────────────────────────────────────────────

export interface DocumentAddress {
  readonly street?: string;
  readonly additionalStreet?: string;
  readonly postalCode?: string;
  readonly city?: string;
  /** Code ISO alpha-2 ou nom de pays (normalisé au rendu). */
  readonly country?: string;
}

export interface DocumentParty {
  readonly name: string;
  /** Raison sociale si différente du nom commercial. */
  readonly legalName?: string;
  /** Contact (personne) pour un client entreprise. */
  readonly contactName?: string;
  readonly address?: DocumentAddress;
  readonly email?: string;
  readonly phone?: string;
  readonly vatId?: string;
  readonly siren?: string;
  readonly siret?: string;
  /** Capital social, ex. « 10 000 € » (mention vendeur « … au capital de … »). */
  readonly capital?: string;
  /** Immatriculation, ex. « RCS Lyon 812 456 789 ». */
  readonly registration?: string;
}

export interface DocumentLine {
  readonly id?: string;
  readonly ref?: string;
  readonly description: string;
  /** Texte secondaire sous la description. */
  readonly details?: string;
  readonly quantity: number;
  /** Unité (h, jour, pièce…). */
  readonly unit?: string;
  /** Prix unitaire HT, unités mineures. */
  readonly unitPrice: number;
  /** Remise en pourcentage (0–100). */
  readonly discountPercent?: number;
  /** Taux de TVA en pourcentage. */
  readonly vatRate: number;
  /** Total HT de la ligne, unités mineures (calculé si absent). */
  readonly lineTotal?: number;
  /** Titre de groupe (service) : les lignes consécutives de même groupe sont regroupées. */
  readonly group?: string;
}

export interface DocumentTaxLine {
  readonly rate: number;
  readonly base: number;
  readonly amount: number;
  readonly exemptionReason?: string;
}

export interface DocumentTotals {
  readonly subtotal: number;
  readonly taxTotal: number;
  /** Total TTC hors frais additionnels. */
  readonly total: number;
  readonly taxBreakdown: readonly DocumentTaxLine[];
}

export interface DocumentData {
  readonly kind: DocumentKind;
  readonly number: string;
  readonly issueDate: string | Date;
  /** Échéance de paiement (facture). */
  readonly dueDate?: string | Date;
  /** Fin de validité (devis). */
  readonly validUntil?: string | Date;
  /** Date de livraison / d'exécution. */
  readonly deliveryDate?: string | Date;
  /** Devise ISO 4217. */
  readonly currency: string;
  readonly status?: DocumentStatus;

  readonly seller: DocumentParty;
  readonly buyer: DocumentParty;
  /** Adresse de livraison si différente de celle du client (réforme 2026). */
  readonly delivery?: { readonly name?: string; readonly address: DocumentAddress };

  readonly lines: readonly DocumentLine[];
  /** Totaux imposés (ex. ceux du XML Factur-X) ; calculés depuis les lignes sinon. */
  readonly totals?: DocumentTotals;
  /** Frais hors TVA ajoutés au montant à payer (ex. frais de service du tunnel de paiement). */
  readonly extraCharges?: readonly { readonly label: string; readonly amount: number }[];

  /** Motif d'exonération de TVA au niveau du document (ex. art. 293 B du CGI). */
  readonly vatExemptionReason?: string;
  /** Nature de l'opération (réforme 2026). */
  readonly operationNature?: 'goods' | 'services' | 'mixed';
  /** Option pour le paiement de la TVA d'après les débits. */
  readonly vatOnDebits?: boolean;

  readonly payment?: {
    readonly terms?: string;
    readonly iban?: string;
    readonly bic?: string;
    /** Lien de paiement en ligne (encodé dans le QR code). */
    readonly link?: string;
    /** Moyen de paiement (Factur-X BT-81). Par défaut : virement si IBAN, carte sinon. */
    readonly means?: 'transfer' | 'card' | 'direct_debit' | 'cash' | 'cheque';
  };

  /** Facture d'origine — obligatoire pour un avoir. */
  readonly precedingInvoice?: { readonly number: string; readonly issueDate?: string | Date };
  /** Motif de l'avoir (affiché dans le bandeau de référence). */
  readonly creditReason?: string;
  /** Référence de commande côté acheteur (bon de commande). */
  readonly buyerReference?: string;
  readonly references?: { readonly quote?: string; readonly order?: string; readonly contract?: string };
  readonly notes?: string;
}

// ─── Vue calculée (consommée par les deux moteurs de rendu) ─────────────────
//
// La vue suit trait pour trait la maquette « Document Page » : chaque champ
// correspond à un texte ou à un bloc de la page. Les moteurs PDF et HTML ne font
// que la dessiner.

export interface DocumentTheme {
  readonly primary: string;
  readonly accent: string;
  /** mix(accent, 14 %) — pastille du titre (Centré), total Teinté. */
  readonly accentTint: string;
}

export interface ViewColumn {
  readonly key: ColumnKey;
  readonly label: string;
  readonly align: 'left' | 'right';
  /** Largeur fixe en px CSS (maquette 794 px), ou null pour la colonne flexible (description). */
  readonly width: number | null;
  /** Cellule en gras (description, total de ligne). */
  readonly bold: boolean;
  /** Cellule en couleur principale (total de ligne). */
  readonly primary: boolean;
}

export interface ViewRow {
  readonly kind: 'line' | 'group';
  readonly cells: Partial<Record<ColumnKey, string>>;
  readonly details?: string;
  readonly title?: string;
  readonly subtotal?: string;
}

export interface ViewParty {
  readonly name: string;
  /** Lignes d'adresse (rue, complément). */
  readonly street: readonly string[];
  /** « 69002 Lyon, FR » */
  readonly cityLine: string;
  /** Adresse sur une ligne : « 4 quai de la Fosse, 44000 Nantes, FR » */
  readonly oneLine: string;
  /** Adresse sans pays : « 12 rue des Tanneurs, 69002 Lyon » */
  readonly oneLineNoCountry: string;
  readonly city: string;
  /** « N° TVA FR42 812456789 » */
  readonly vat?: string;
  /** « SIRET 812 456 789 00021 » (ou SIREN) */
  readonly id?: string;
}

export interface DocumentView {
  readonly kind: DocumentKind;
  readonly language: DocumentLanguage;
  readonly locale: string;
  readonly settings: DocumentTemplateSettings;
  readonly theme: DocumentTheme;
  /** Titre en capitales (FACTURE, AVOIR…). */
  readonly title: string;
  readonly number: string;
  readonly labels: {
    readonly number: string; readonly issue: string; readonly seller: string; readonly buyer: string;
    readonly subtotal: string; readonly taxTotal: string; readonly grandTotal: string;
    readonly taxBreakdown: string; readonly taxBase: string; readonly taxAmount: string;
    readonly paymentTerms: string; readonly iban: string; readonly bic: string; readonly scanToPay: string;
    readonly poweredBy: string; readonly page: string; readonly of: string; readonly continuation: string;
  };
  readonly issueDate: string;
  /** Échéance (facture, avoir), validité (devis) ou livraison prévue (commande). */
  readonly due?: { readonly label: string; readonly value: string };
  readonly seller: ViewParty;
  readonly buyer: ViewParty;
  readonly delivery?: ViewParty;
  /** Bandeau de référence sous les parties (avoir, devis, commande). */
  readonly refLine?: string;
  readonly columns: readonly ViewColumn[];
  readonly rows: readonly ViewRow[];
  /** Détail de la TVA, une entrée par taux. */
  readonly taxes: readonly { readonly rate: string; readonly base: string; readonly amount: string }[];
  readonly subtotal: string;
  readonly taxTotal: string;
  /** Frais hors TVA ajoutés au montant à payer. */
  readonly extraCharges: readonly { readonly label: string; readonly value: string }[];
  /** Montant à payer (préfixé « − » pour un avoir). */
  readonly grandTotal: string;
  /** Libellé du montant mis en avant (composition Montant). */
  readonly amountLabel: string;
  readonly payment?: { readonly iban?: string; readonly bic?: string; readonly terms?: string; readonly qrData?: string };
  /** Pied légal : identité du vendeur + mentions obligatoires, en un paragraphe. */
  readonly legal: string;
  readonly notes?: string;
  /** « Factur-X · EN 16931 » si un XML est embarqué. */
  readonly badge?: string;
  readonly poweredBy: boolean;
  readonly watermark?: string;
  /** Corps du filigrane en px (réduit pour les mots longs : il tient dans la page). */
  readonly watermarkSize?: number;
  readonly statusLabel?: string;
  readonly totalsRaw: DocumentTotals & { readonly amountDue: number };
}
