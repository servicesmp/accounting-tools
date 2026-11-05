import type { DocumentTemplateSettings } from './types';
import { type ReportBlock, type ReportDocumentData, type ReportView } from './report-types';
export declare const REPORT_MAX_BLOCKS = 40;
export declare const REPORT_MAX_ITEMS = 200;
export declare const REPORT_MAX_META = 4;
export declare const REPORT_MAX_TILES = 6;
export declare const REPORT_TITLE_MAX = 200;
export declare const REPORT_LINE_MAX = 400;
export declare const REPORT_TEXT_MAX = 6000;
/** Texte d'une ligne : contrôles retirés, espaces réduits, tronqué. */
export declare function reportLine(v: unknown, max?: number): string;
/** Texte multi-lignes (synthèse) : sauts de ligne gardés. */
export declare function reportText(v: unknown, max?: number): string;
/** Bloc normalisé, ou null s'il est vide ou inconnu (il est alors ignoré, jamais inventé). */
export declare function normalizeReportBlock(raw: unknown, inColumn?: boolean): ReportBlock | null;
export interface BuildReportViewOptions {
    /** Réglage DÉJÀ normalisé (`normalizeDocumentSettings`) ; sinon le modèle par défaut. */
    readonly settings?: DocumentTemplateSettings;
}
export declare function buildReportView(data: ReportDocumentData, options?: BuildReportViewOptions): ReportView;
//# sourceMappingURL=report-view.d.ts.map