/**
 * Rendu HTML d'un rapport (`ReportView`) — même feuille (794 × 1123 px), même réglage de
 * présentation et même pied (« Document émis avec Services », pagination) que les documents
 * commerciaux ; mise en page reprise des maquettes « Tâches, rapports et comptes rendus » et
 * « Rapport d'activité » (Claude Design). Le PDF (`ReportPdfRenderer`) dessine la même chose.
 *
 * Fragment autonome (styles en ligne), toutes les chaînes échappées, URL filtrées :
 * injectable tel quel. À l'écran la page s'allonge au lieu de se paginer.
 */
import type { ReportTone, ReportView } from './report-types';
export interface RenderReportHtmlOptions {
    /** Logo de l'organisation (ignoré si le réglage masque le logo). */
    readonly logoUrl?: string | null;
    /** Logo « Services » de la mention « Document émis avec ». */
    readonly servicesLogoUrl?: string | null;
    /** Police du corps (défaut : Helvetica, Arial — même famille métrique que le PDF). */
    readonly fontFamily?: string;
    /** Police des titres (défaut : Chillax puis la police du corps). */
    readonly headingFontFamily?: string;
    readonly id?: string;
}
export declare const REPORT_PAGE_W = 794;
export declare const REPORT_PAGE_H = 1123;
/** Couleurs des teintes (identiques dans le PDF). */
export declare const REPORT_TONE_COLORS: Record<ReportTone, {
    fg: string;
    bg: string;
    border: string;
}>;
/** Couleur pleine d'une teinte (pastilles, barres). */
export declare const REPORT_TONE_SOLID: Record<ReportTone, string>;
/** Initiales d'un nom (2 lettres), pour les avatars. */
export declare function reportInitials(name: string): string;
/** Couleur stable d'un avatar à partir du nom. */
export declare function reportAvatarColor(name: string): string;
export declare function renderReportHtml(view: ReportView, options?: RenderReportHtmlOptions): string;
//# sourceMappingURL=report-html.d.ts.map