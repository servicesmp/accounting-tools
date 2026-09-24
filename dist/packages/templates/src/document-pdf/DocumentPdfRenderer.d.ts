import type { DocumentView } from '../document/types';
export declare const PAGE_W = 794;
export declare const PAGE_H = 1123;
interface TextStyle {
    size: number;
    bold?: boolean;
    color?: string;
    /** letter-spacing en em */
    ls?: number;
    /** line-height en multiple de la taille (sinon « normal ») */
    lh?: number;
    upper?: boolean;
}
export interface RenderDocumentPdfOptions {
    /** Logo de l'organisation (PNG ou JPEG). Absent : rien n'est dessiné à sa place. */
    readonly logo?: Uint8Array | null;
    /** XML Factur-X à embarquer (facture et avoir uniquement). */
    readonly facturXml?: string;
    readonly conformanceLevel?: string;
    readonly generatedAt?: Date;
}
export interface RenderedDocumentPdf {
    readonly pdf: Uint8Array;
    readonly pageCount: number;
}
export declare class DocumentPdfRenderer {
    private readonly options;
    private doc;
    private regular;
    private bold;
    private page;
    private pages;
    private logo?;
    private servicesLogo?;
    private qr?;
    /** Bornes horizontales de la zone principale (px). */
    private L;
    private R;
    private readonly v;
    constructor(view: DocumentView, options?: RenderDocumentPdfOptions);
    private get frame();
    private get primary();
    private get accent();
    private font;
    private prep;
    /**
     * Mise en forme d'un texte avec le crénage de la police (paires comme « FA »,
     * « To ») — le navigateur l'applique ; pdf-lib non. On découpe le texte en
     * segments sans crénage interne, placés aux positions exactes.
     */
    private shape;
    /** Largeur d'un texte en px (crénage et letter-spacing compris, comme le navigateur). */
    width(t: string, s: TextStyle): number;
    /** Dessine une ligne de texte ; `top` = haut de la boîte de ligne. */
    private text;
    /** Découpe un texte en lignes pour une largeur donnée (césure aux espaces, comme CSS). */
    wrap(t: string, maxW: number, s: TextStyle): string[];
    /** Paragraphe multi-lignes ; renvoie sa hauteur. */
    private para;
    private paraHeight;
    /** Rectangle (arrondi possible), remplissage et/ou bordure. */
    private rect;
    /** Filet horizontal : épaisseur `t` à partir du haut `y`. */
    private hline;
    private vline;
    private image;
    /** Logo contenu dans une boîte (object-fit: contain), centré. */
    private logoIn;
    private get hasLogo();
    render(): Promise<RenderedDocumentPdf>;
    private newPage;
    /** Hauteur réservée en bas de page au pied (mentions légales, badge, pagination). */
    private footerTop;
    /** Continue sur une nouvelle page si `h` ne tient pas ; renvoie le y de départ. */
    private ensure;
    private pattern;
    private watermark;
    private header;
    private headerStandard;
    private headerBand;
    private headerSidebar;
    private headerHero;
    private headerCentered;
    private parties;
    private get labelColor();
    private partiesTwo;
    private partiesBuyer;
    private partiesRow;
    private refLine;
    private columnGeometry;
    private tableHeader;
    private rowHeight;
    private table;
    private bottom;
    private taxLine;
    private bottomStd;
    /** Bloc « Total TTC » des compositions Classique / Colonne / Montant. */
    private grandBox;
    private bottomBand;
    private bottomCard;
    private notes;
    private legalWidth;
    /** Hauteur du groupe de droite du pied (flex align-items:center) : badge, mention Services, pagination. */
    private footerGroupH;
    private footerRightWidth;
    private servicesLogoWidth;
    private footers;
}
export declare function renderDocumentPdf(view: DocumentView, options?: RenderDocumentPdfOptions): Promise<RenderedDocumentPdf>;
export {};
//# sourceMappingURL=DocumentPdfRenderer.d.ts.map