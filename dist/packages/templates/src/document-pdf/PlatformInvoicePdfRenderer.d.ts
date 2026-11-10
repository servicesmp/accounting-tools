import type { PlatformInvoiceView } from '../document/platform-invoice-types';
export interface RenderPlatformInvoicePdfOptions {
    /** Logo Services (PNG / JPEG). Absent : logo haute définition de la librairie. */
    readonly logo?: Uint8Array | null;
    /** XML Factur-X à embarquer. */
    readonly facturXml?: string;
    readonly conformanceLevel?: string;
    readonly generatedAt?: Date;
}
export interface RenderedPlatformInvoicePdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
}
export declare class PlatformInvoicePdfRenderer {
    private readonly v;
    private readonly options;
    private c;
    private logo?;
    /** Ordonnée du filet de la barre du pied : dépend du nombre de lignes de l'identité légale. */
    private barY;
    private legalLines;
    constructor(v: PlatformInvoiceView, options?: RenderPlatformInvoicePdfOptions);
    render(): Promise<RenderedPlatformInvoicePdf>;
    private lh;
    /** Texte aligné sur la ligne de base d'un autre style (alignement « baseline » de la maquette). */
    private onBaseline;
    private sectionTitle;
    private get legalStyle();
    private get pageStyle();
    private logoWidth;
    /** Largeur offerte à l'identité légale entre le logo et « Page x sur n » (espacés de 16). */
    private legalWidth;
    private layoutBar;
    private header;
    private parties;
    private tableHeader;
    private table;
    private footerHeight;
    private closing;
    private bars;
}
export declare function renderPlatformInvoicePdf(view: PlatformInvoiceView, options?: RenderPlatformInvoicePdfOptions): Promise<RenderedPlatformInvoicePdf>;
//# sourceMappingURL=PlatformInvoicePdfRenderer.d.ts.map