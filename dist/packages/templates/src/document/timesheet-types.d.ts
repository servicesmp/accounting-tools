/**
 * Relevé de temps — données, vue et libellés.
 *
 * Même principe que les documents commerciaux (`types.ts`) et les rapports (`report-types.ts`) :
 * des DONNÉES déjà calculées par la plateforme (mu-command : lignes, totaux, validation du client),
 * le réglage de présentation de l'organisation (logo selon le plan, mention « Services », langue)
 * et une VUE normalisée que le HTML (`timesheet-html.ts`) et le PDF
 * (`document-pdf/TimesheetPdfRenderer.ts`) rendent à l'identique.
 *
 * Les types de données sont le miroir de `mu-command/src/engagement/timesheet-metadata.ts`
 * (TimesheetLine, TimesheetTotals, TimesheetAdjustment, TimesheetClientValidation) : la librairie
 * ne recalcule jamais les totaux, la source de vérité est le serveur.
 */
import type { DocumentLanguage, DocumentTemplateSettings } from './types';
export type TimesheetUnit = 'hour' | 'day' | 'deliverable';
export type TimesheetVariant = 'simple' | 'detailed';
export type TimesheetDisplayStatus = 'draft' | 'submitted' | 'rejected' | 'approved' | 'invoiced' | 'paid' | 'cancelled';
/** Une ligne = un créneau saisi sur la prestation. */
export interface TimesheetLineData {
    /** Jour, `AAAA-MM-JJ`. */
    readonly date: string;
    /** `HH:MM` ou null. */
    readonly start?: string | null;
    readonly end?: string | null;
    /** Tâche (libellé court). */
    readonly label: string;
    /** Travail réalisé (version détaillée). */
    readonly description?: string | null;
    readonly minutes: number;
    readonly billable: boolean;
    /** Montant de la ligne en unité mineure (×100). */
    readonly amountMinor: number;
}
export interface TimesheetTotalsData {
    /** Tout le temps saisi, facturable ou non (hors ajustements). */
    readonly totalMinutes: number;
    /** Temps facturé : lignes facturables + ajustements. */
    readonly billableMinutes: number;
    readonly adjustmentMinutes: number;
    readonly billableLines: number;
    /** Jours distincts avec du temps facturable. */
    readonly workedDays: number;
    /** Quantité dans l'unité du relevé (heures, jours ou livrables). */
    readonly quantity: number;
    /** Montant HT en unité mineure. */
    readonly amountMinor: number;
}
export interface TimesheetAdjustmentData {
    /** Minutes signées : + ajout, − retrait (geste commercial…). */
    readonly minutes: number;
    readonly label: string;
    readonly reason?: string | null;
}
export interface TimesheetValidationData {
    readonly decision: 'approved' | 'rejected';
    readonly name: string;
    readonly decidedAt: string;
    readonly reason?: string | null;
    /** `link` : lien signé reçu par e-mail ; `account` : depuis l'espace du client. */
    readonly channel: 'link' | 'account';
    /** Empreinte courte de la décision, si la plateforme en conserve une. */
    readonly fingerprint?: string | null;
}
export interface TimesheetPartyData {
    readonly name: string;
    /** Adresse, une ligne par élément (« 95 rue du Capitaine Guynemer », « 92400 Courbevoie, France »). */
    readonly addressLines?: readonly string[];
    /** Identifiants légaux déjà formatés (« SIRET 915 335 517 00024 »). */
    readonly legalIds?: readonly string[];
    /** Ville seule, pour le sous-titre de l'en-tête. */
    readonly city?: string | null;
    /** Personne : intervenant (prestataire) ou contact (client). */
    readonly person?: string | null;
    /** Référence côté client (« BC-2026-044 », bon de commande). */
    readonly purchaseOrder?: string | null;
}
/** Données d'un relevé, calculées par la plateforme. */
export interface TimesheetDocumentData {
    /** Numéro attribué à la soumission (« RT-2026-05-014 ») ; absent en brouillon. */
    readonly reference?: string | null;
    readonly month: number;
    readonly year: number;
    /** Date d'émission (ISO). */
    readonly issuedAt: string;
    readonly status: TimesheetDisplayStatus;
    readonly provider: TimesheetPartyData;
    readonly client: TimesheetPartyData;
    readonly projectName: string;
    readonly unit: TimesheetUnit;
    /** Taux en unité mineure (par heure, jour ou livrable) ; 0 = non communiqué. */
    readonly rateMinor: number;
    readonly currency: string;
    /** TVA de la commande d'origine (%) ; null = inconnue, aucun TTC imprimé. */
    readonly vatPercent?: number | null;
    readonly lines: readonly TimesheetLineData[];
    readonly adjustments?: readonly TimesheetAdjustmentData[];
    readonly totals: TimesheetTotalsData;
    readonly submittedAt?: string | null;
    readonly submittedBy?: string | null;
    readonly validation?: TimesheetValidationData | null;
    /** Langue du document (sinon celle du réglage). */
    readonly language?: string;
    /** Mentions du prestataire en pied de page (raison sociale · adresse · SIRET). */
    readonly legal?: string | null;
    /** Durée d'une journée de référence (minutes), 480 par défaut. */
    readonly minutesPerDay?: number;
    /**
     * Temps facturé au relevé (`time`, défaut) ou inclus (`included`) : mission au forfait, réglée
     * par l'échéancier (acompte, jalons, solde) ou sans taux. Inclus : ni taux ni montant imprimés,
     * la raison les remplace (jamais « 0,00 € »).
     */
    readonly billing?: {
        readonly mode: TimesheetBillingMode;
        readonly reason?: TimesheetBillingReason | null;
    } | null;
}
export type TimesheetBillingMode = 'time' | 'included';
export type TimesheetBillingReason = 'fixed_price' | 'schedule' | 'no_rate';
export interface TimesheetLabels {
    readonly title: string;
    /** Deux-points selon la langue (« : » en français, « : » sans espace ailleurs). */
    readonly colon: string;
    readonly detailedVersion: string;
    readonly number: string;
    readonly period: string;
    readonly issued: string;
    readonly status: string;
    readonly statuses: Record<TimesheetDisplayStatus, string>;
    readonly provider: string;
    readonly client: string;
    readonly contributor: string;
    readonly attention: string;
    readonly purchaseOrder: string;
    readonly service: string;
    readonly workedDays: string;
    readonly referenceDay: string;
    readonly timeEntered: string;
    readonly deliverables: string;
    readonly rate: string;
    readonly slots: string;
    readonly day: string;
    readonly date: string;
    readonly slot: string;
    readonly task: string;
    readonly duration: string;
    readonly equivalent: string;
    readonly billable: string;
    readonly amount: string;
    readonly yes: string;
    readonly no: string;
    readonly week: string;
    readonly subtotal: string;
    readonly total: string;
    readonly adjustment: string;
    readonly offBilling: string;
    readonly billingMode: string;
    readonly billingModes: Record<TimesheetUnit, string>;
    readonly quantity: string;
    readonly preTax: string;
    readonly vat: string;
    readonly toInvoice: string;
    readonly toInvoicePreTax: string;
    readonly submittedBy: string;
    readonly notSubmitted: string;
    readonly contributorOn: string;
    readonly clientDecision: Record<'pending' | 'approved' | 'rejected' | 'none', string>;
    readonly channel: Record<'link' | 'account', string>;
    readonly pendingSince: string;
    readonly reason: string;
    readonly fingerprint: string;
    readonly poweredBy: string;
    readonly page: string;
    readonly of: string;
    readonly continuedOn: string;
    readonly draft: string;
    readonly noEntries: string;
    /** Unité courte d'une journée (« j »). */
    readonly dayUnit: string;
    readonly daysCount: (n: number) => string;
    readonly deliverablesCount: (n: number) => string;
    readonly slotsCount: (n: number) => string;
    readonly totalWorked: (days: string) => string;
    readonly excluded: (what: string) => string;
    readonly referenceDayNote: (duration: string) => string;
    readonly approvalNote: string;
    readonly closingSimple: string;
    readonly closingDetailed: string;
    readonly at: (date: string, time: string) => string;
    /** Temps inclus : texte à la place du taux et des montants, selon la raison. */
    readonly included: Record<TimesheetBillingReason, string>;
    readonly timeBilled: string;
}
/** Une cellule « étiquette / valeur » (méta de l'en-tête, bandeau de prestation, récapitulatif). */
export interface TimesheetCell {
    readonly label: string;
    readonly value: string;
}
export interface TimesheetViewParty {
    readonly heading: string;
    readonly name: string;
    /** Lignes d'adresse (texte courant). */
    readonly lines: readonly string[];
    /** Lignes secondaires, en gris (SIRET, intervenant, bon de commande). */
    readonly muted: readonly string[];
}
export type TimesheetTone = 'neutral' | 'success' | 'danger' | 'info';
export interface TimesheetDayRow {
    readonly day: string;
    readonly duration: string;
    readonly equivalent?: string;
    readonly muted?: boolean;
}
export interface TimesheetSlotRow {
    readonly date: string;
    readonly slot: string;
    readonly task: string;
    readonly detail?: string;
    readonly duration: string;
    readonly billable: string;
    readonly amount: string;
    /** Créneau hors facturation : ligne grisée, « Non » en rouge. */
    readonly excluded: boolean;
}
export interface TimesheetWeek {
    readonly label: string;
    readonly rows: readonly TimesheetSlotRow[];
    readonly subtotal: {
        readonly label: string;
        readonly duration: string;
        readonly amount: string;
    };
}
export interface TimesheetValidationBlock {
    readonly heading: string;
    readonly tone: TimesheetTone;
    readonly name?: string;
    readonly lines: readonly string[];
    /** Ligne mise en avant (motif d'un refus), dans le ton du bloc. */
    readonly emphasis?: string;
}
/** Vue normalisée, prête à dessiner (HTML et PDF). */
export interface TimesheetView {
    readonly variant: TimesheetVariant;
    readonly language: DocumentLanguage;
    readonly locale: string;
    readonly settings: DocumentTemplateSettings;
    readonly labels: TimesheetLabels;
    readonly title: string;
    readonly subtitle: string;
    /** Titre court des pages suivantes (« Relevé de temps · mai 2026 »). */
    readonly shortTitle: string;
    /** Rappel à droite des pages suivantes (« RT-2026-05-014 · ZIT SAS · Haddad Réceptions »). */
    readonly runningRef: string;
    readonly meta: readonly TimesheetCell[];
    readonly status: {
        readonly label: string;
        readonly tone: TimesheetTone;
    };
    readonly provider: TimesheetViewParty;
    readonly client: TimesheetViewParty;
    /** Bandeau sous les parties : prestation puis deux chiffres. */
    readonly band: readonly TimesheetCell[];
    /** Version simple : une ligne par jour. */
    readonly simple: {
        readonly columns: readonly string[];
        readonly rows: readonly TimesheetDayRow[];
        readonly total: TimesheetDayRow;
    };
    /** Version détaillée : un créneau par ligne, groupés par semaine. */
    readonly detailed: {
        readonly columns: readonly string[];
        readonly weeks: readonly TimesheetWeek[];
        /** Encarts sous le tableau (hors facturation, ajustements) : texte et durée signée. */
        readonly notes: readonly TimesheetCell[];
        readonly billing: {
            readonly heading: string;
            readonly lines: readonly string[];
        };
        readonly summary: readonly TimesheetCell[];
        readonly grandTotal?: TimesheetCell;
    };
    /** Encart de la version simple (journée de référence, facturation). */
    readonly note: string;
    readonly submitted: TimesheetValidationBlock;
    readonly decision: TimesheetValidationBlock;
    readonly legal: string;
    /** Mention ajoutée au pied de la dernière page. */
    readonly closing: string;
    readonly showLogo: boolean;
    readonly poweredBy: boolean;
    readonly watermark?: string;
    readonly watermarkSize?: number;
}
//# sourceMappingURL=timesheet-types.d.ts.map