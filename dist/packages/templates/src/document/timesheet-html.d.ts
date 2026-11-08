import type { TimesheetTone, TimesheetView } from './timesheet-types';
export interface RenderTimesheetHtmlOptions {
    /** Logo de l'organisation (ignoré si le réglage — donc le plan — masque le logo). */
    readonly logoUrl?: string | null;
    /** Logo « Services » de la mention « Document émis avec ». */
    readonly servicesLogoUrl?: string | null;
    /** Police (défaut : Chillax, puis Helvetica, Arial). */
    readonly fontFamily?: string;
    readonly id?: string;
}
export declare const TIMESHEET_PAGE_W = 794;
export declare const TIMESHEET_PAGE_H = 1123;
export declare const TIMESHEET_SIDE = 56;
export declare const TIMESHEET_FOOT_RESERVE = 130;
/** Palette des documents commerciaux (`html.ts`) ; pied en #64748b (contraste 4,8:1). */
export declare const TIMESHEET_COLORS: {
    readonly text: "#1e293b";
    readonly ink: "#111111";
    readonly slate500: "#64748b";
    readonly slate600: "#475569";
    readonly slate700: "#334155";
    readonly slate400: "#94a3b8";
    readonly line: "#e2e8f0";
    readonly rowRule: "#eef0f2";
    readonly surface: "#f8fafc";
    readonly gray: "#808080";
    readonly white: "#ffffff";
};
export declare const TIMESHEET_TONES: Record<TimesheetTone, {
    fg: string;
    border: string;
}>;
export declare function renderTimesheetHtml(view: TimesheetView, options?: RenderTimesheetHtmlOptions): string;
//# sourceMappingURL=timesheet-html.d.ts.map