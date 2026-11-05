/**
 * Rapports par blocs — rapport de tâche, compte rendu de réunion, rapport hebdomadaire
 * d'activité, ou tout autre document de restitution d'une organisation.
 *
 * Même principe que les documents commerciaux (`types.ts`) : des DONNÉES déjà calculées
 * par l'appelant (la plateforme calcule, la librairie dessine), un réglage de présentation
 * de l'organisation (couleurs, logo, mention « Services ») et une VUE normalisée que le
 * HTML (`report-html.ts`) et le PDF (`document-pdf/ReportPdfRenderer.ts`) rendent à
 * l'identique.
 *
 * Le modèle est volontairement générique (titre, sous-titre, métadonnées, blocs typés) :
 * un nouveau genre de rapport n'ajoute aucun type ici, il compose des blocs.
 */
import type { DocumentLanguage, DocumentTemplateSettings, DocumentTheme } from './types';

/** Teinte d'un élément (chiffre, pastille, statut). */
export type ReportTone = 'neutral' | 'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export const REPORT_TONES: readonly ReportTone[] = ['neutral', 'muted', 'primary', 'accent', 'success', 'warning', 'danger', 'info'];

export interface ReportMeta { readonly label: string; readonly value: string }
export interface ReportPerson { readonly name: string; readonly role?: string | null }
export interface ReportIntervention { readonly who: string; readonly text: string }

/** Ligne d'une liste de faits (travail réalisé, livrables, tâches terminées, échéances…). */
export interface ReportRow {
  /** Pastille de statut en tête (« En cours », « Bloquée »). */
  readonly lead?: { readonly text: string; readonly tone?: ReportTone } | null;
  /** Coche verte en tête (tâche terminée). */
  readonly check?: boolean;
  readonly title: string;
  /** Complément en gris après le titre (« , Camille Roux »). */
  readonly subtitle?: string | null;
  /** Petits éléments gris sous le titre (document lié, date, livrables). */
  readonly meta?: readonly string[];
  /** Valeur à droite (durée, statut). */
  readonly right?: string | null;
  readonly rightTone?: ReportTone;
  /** Ligne d'alerte sous le titre (« Bloquée : … »). */
  readonly note?: string | null;
  readonly noteTone?: ReportTone;
  /** Barre de progression (temps / estimation). */
  readonly progress?: { readonly ratio: number; readonly label: string; readonly tone?: ReportTone } | null;
}

export interface ReportStatTile { readonly value: string; readonly label: string; readonly note?: string | null; readonly tone?: ReportTone }
export interface ReportBarItem { readonly label: string; readonly note?: string | null; readonly value: string; readonly ratio: number; readonly tone?: ReportTone }
export interface ReportSegment { readonly label: string; readonly count: number; readonly tone?: ReportTone }
export interface ReportActionItem {
  readonly title: string;
  /** Badge avant le titre (« Réunion »). */
  readonly badge?: string | null;
  /** « avec … » (réunion). */
  readonly with?: string | null;
  readonly owner: string;
  readonly due?: string | null;
  readonly status?: string | null;
  readonly statusTone?: ReportTone;
}
export interface ReportAgendaItem {
  readonly time: string;
  readonly kind?: string | null;
  readonly kindTone?: ReportTone;
  readonly title: string;
  readonly cancelled?: boolean;
  readonly location?: string | null;
  readonly people?: readonly string[];
}
export interface ReportAgendaDay { readonly label: string; readonly items: readonly ReportAgendaItem[] }

export type ReportBlock =
  /** Titre + texte (synthèse). `badge` : « Fils d'Iro » / « Fils d'Iro, modifiée ». */
  | { readonly type: 'paragraph'; readonly title?: string | null; readonly badge?: string | null; readonly text: string }
  /** Encart : `dark` (décisions, numérotées), `light` (points d'attention, pastilles), `tint` (priorités, numérotées). */
  | { readonly type: 'callout'; readonly title: string; readonly note?: string | null; readonly style: 'dark' | 'light' | 'tint'; readonly items: readonly { readonly text: string; readonly tone?: ReportTone }[] }
  /** Liste numérotée ou à puces, chaque élément pouvant porter des interventions (qui a dit quoi). */
  | { readonly type: 'list'; readonly title: string; readonly note?: string | null; readonly numbered?: boolean; readonly items: readonly { readonly text: string; readonly details?: readonly ReportIntervention[] }[] }
  /** Lignes de faits. `empty` : texte affiché quand il n'y a aucune ligne. */
  | { readonly type: 'rows'; readonly title?: string | null; readonly note?: string | null; readonly rows: readonly ReportRow[]; readonly empty?: string | null }
  /** Tuiles de chiffres clés (2 à 6). */
  | { readonly type: 'stats'; readonly tiles: readonly ReportStatTile[] }
  /** Barres horizontales (temps par mission). */
  | { readonly type: 'bars'; readonly title: string; readonly items: readonly ReportBarItem[] }
  /** Répartition (état des tâches) : barre segmentée + légende. */
  | { readonly type: 'distribution'; readonly title: string; readonly segments: readonly ReportSegment[] }
  /** Participants (réunion). */
  | { readonly type: 'people'; readonly title: string; readonly people: readonly ReportPerson[] }
  /** Actions à réaliser, numérotées. */
  | { readonly type: 'actions'; readonly title: string; readonly note?: string | null; readonly items: readonly ReportActionItem[] }
  /** Agenda par jour. */
  | { readonly type: 'agenda'; readonly title: string; readonly note?: string | null; readonly days: readonly ReportAgendaDay[] }
  /** Deux blocs côte à côte (`bars`, `distribution`, `rows`, `list` seulement). */
  | { readonly type: 'columns'; readonly left: ReportBlock; readonly right: ReportBlock };

export type ReportBlockType = ReportBlock['type'];
export const REPORT_BLOCK_TYPES: readonly ReportBlockType[] = ['paragraph', 'callout', 'list', 'rows', 'stats', 'bars', 'distribution', 'people', 'actions', 'agenda', 'columns'];
/** Blocs admis dans une colonne. */
export const REPORT_COLUMN_BLOCK_TYPES: readonly ReportBlockType[] = ['bars', 'distribution', 'rows', 'list'];

export type ReportStatus = 'draft' | 'final';

/** Données d'un rapport, calculées par l'appelant. */
export interface ReportDocumentData {
  /** Genre libre (`task_report`, `meeting_minutes`, `weekly_report`…) : classe CSS et métadonnées du PDF. */
  readonly kind: string;
  /** Libellé du genre, affiché en capitales (« Rapport Services », « Rapport hebdomadaire »). */
  readonly typeLabel: string;
  readonly title: string;
  /** Ligne d'accent sous le titre (date, plage de dates). */
  readonly subtitle?: string | null;
  /** Métadonnées d'en-tête (4 au plus). */
  readonly meta?: readonly ReportMeta[];
  /** Organisation émettrice. */
  readonly issuer: { readonly name: string };
  readonly language?: string;
  /** Date de génération (ISO) ; métadonnées du PDF. */
  readonly generatedAt?: string;
  readonly blocks: readonly ReportBlock[];
  readonly footer?: {
    /** Gauche du pied (« Atelier Roux, rapport hebdomadaire »). */
    readonly left?: string | null;
    /** Droite du pied (« Semaine 43, toute l'équipe »). */
    readonly right?: string | null;
    /** Ligne de sources en fin de document (« Généré par le fils d'Iro à partir de : … »). */
    readonly sources?: string | null;
  };
  /** `draft` : filigrane BROUILLON si le réglage de l'organisation l'active. */
  readonly status?: ReportStatus;
}

export interface ReportLabels {
  readonly poweredBy: string;
  readonly page: string;
  readonly of: string;
  readonly continuation: string;
  readonly draft: string;
}

/** Vue normalisée, prête à dessiner (HTML et PDF). */
export interface ReportView {
  readonly kind: string;
  readonly language: DocumentLanguage;
  readonly locale: string;
  readonly settings: DocumentTemplateSettings;
  readonly theme: DocumentTheme;
  readonly typeLabel: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly meta: readonly ReportMeta[];
  readonly issuer: { readonly name: string };
  readonly generatedAt?: string;
  readonly blocks: readonly ReportBlock[];
  readonly footer: { readonly left?: string; readonly right?: string; readonly sources?: string };
  readonly labels: ReportLabels;
  /** Logo de l'organisation autorisé par le réglage (le fichier reste fourni au rendu). */
  readonly showLogo: boolean;
  readonly poweredBy: boolean;
  readonly watermark?: string;
  readonly watermarkSize?: number;
}
