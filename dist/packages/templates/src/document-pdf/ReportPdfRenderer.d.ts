import type { ReportView } from '../document/report-types';
export interface RenderReportPdfOptions {
    /** Logo de l'organisation (PNG ou JPEG). Absent : le nom de l'organisation est écrit à sa place. */
    readonly logo?: Uint8Array | null;
    readonly generatedAt?: Date;
}
export interface RenderedReportPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
}
export declare class ReportPdfRenderer {
    private readonly options;
    private c;
    private logo?;
    private servicesLogo?;
    private readonly v;
    constructor(view: ReportView, options?: RenderReportPdfOptions);
    private get primary();
    private get accent();
    private toneFg;
    private toneSolid;
    private H;
    render(): Promise<RenderedReportPdf>;
    private newPage;
    private get footerTop();
    /** Place `h` sur la page courante, ou sur une nouvelle page ; renvoie le y de départ. */
    private ensure;
    /** Espace entre blocs, sauf en tête de page. */
    private gap;
    /** Dessine une suite d'unités insécables, en paginant entre elles ; renvoie le y final. */
    private flow;
    private header;
    private block;
    /** Titre de section (h2 + note), insécable avec ce qui suit via `units`. */
    private sectionTitle;
    private paragraph;
    /** Pastille « Fils d'Iro » : 20 px de haut, point de couleur, texte 10 px. */
    private badge;
    /** Pastille de statut (chip) ; renvoie sa largeur. */
    private chip;
    private avatar;
    private callout;
    private list;
    private rowUnit;
    private rows;
    private stats;
    private smallTitle;
    private bars;
    private distribution;
    private people;
    private actionUnit;
    private actions;
    private agendaDayUnits;
    private agenda;
    private columns;
    /** Hauteur d'un bloc dessiné sur une page de brouillon (retirée ensuite). */
    private measure;
    private sources;
    private footers;
}
export declare function renderReportPdf(view: ReportView, options?: RenderReportPdfOptions): Promise<RenderedReportPdf>;
//# sourceMappingURL=ReportPdfRenderer.d.ts.map