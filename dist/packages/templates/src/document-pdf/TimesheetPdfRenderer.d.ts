import type { TimesheetView } from '../document/timesheet-types';
export interface RenderTimesheetPdfOptions {
    /** Logo de l'organisation (PNG ou JPEG) — imprimé seulement si le réglage (le plan) le permet. */
    readonly logo?: Uint8Array | null;
    readonly generatedAt?: Date;
}
export interface RenderedTimesheetPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
}
export declare class TimesheetPdfRenderer {
    private readonly v;
    private readonly options;
    private c;
    private logo?;
    private servicesLogo?;
    /** En-tête de colonnes à répéter en haut des pages suivantes, pendant le tableau. */
    private repeatHead;
    constructor(v: TimesheetView, options?: RenderTimesheetPdfOptions);
    private s;
    private caps;
    render(): Promise<RenderedTimesheetPdf>;
    private newPage;
    /** Nouvelle page : en-tête allégé (et en-tête de colonnes si un tableau est en cours). */
    private continuation;
    /** Place `h` sur la page courante ou sur une nouvelle page ; renvoie le y de départ. */
    private ensure;
    private flow;
    private header;
    private partyHeight;
    private party;
    private parties;
    private band;
    private headRow;
    private simple;
    private detailed;
    /** Encart à filet gauche (texte, ou texte et valeur). */
    private callout;
    private billing;
    private blockHeight;
    private block;
    private validation;
    private footers;
}
export declare function renderTimesheetPdf(view: TimesheetView, options?: RenderTimesheetPdfOptions): Promise<RenderedTimesheetPdf>;
//# sourceMappingURL=TimesheetPdfRenderer.d.ts.map