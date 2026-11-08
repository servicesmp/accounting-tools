import { type DocumentLanguage, type DocumentTemplateSettings } from './types';
import type { TimesheetDocumentData, TimesheetLabels, TimesheetVariant, TimesheetView } from './timesheet-types';
export declare const TIMESHEET_MAX_LINES = 2000;
export declare const TIMESHEET_LABELS: Record<DocumentLanguage, TimesheetLabels>;
/** 210 → « 3 h 30 », 180 → « 3 h ». */
export declare function timesheetDuration(minutes: number): string;
export interface BuildTimesheetViewOptions {
    /** Réglage normalisé (`normalizeDocumentSettings`) : logo, mention Services, langue, filigrane. */
    readonly settings?: DocumentTemplateSettings;
    readonly variant?: TimesheetVariant;
    /** Fuseau des horodatages (soumission, décision). Défaut : Europe/Paris. */
    readonly timeZone?: string;
}
export declare function buildTimesheetView(data: TimesheetDocumentData, options?: BuildTimesheetViewOptions): TimesheetView;
//# sourceMappingURL=timesheet-view.d.ts.map