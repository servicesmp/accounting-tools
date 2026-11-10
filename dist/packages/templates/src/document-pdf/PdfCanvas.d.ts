import { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
export declare const CANVAS_PAGE_W = 794;
export declare const CANVAS_PAGE_H = 1123;
export declare const PX: number;
export type CanvasAlign = 'left' | 'right' | 'center';
export type CanvasFamily = 'body' | 'heading';
export interface CanvasTextStyle {
    size: number;
    bold?: boolean;
    /**
     * Graisse Chillax exacte (500 Medium, 600 Semibold, 700 Bold) — seulement si la toile a été créée
     * avec `weights: true` (factures de la plateforme). Prioritaire sur `bold` et `family`.
     */
    weight?: 500 | 600 | 700;
    family?: CanvasFamily;
    color?: string;
    /** letter-spacing en em */
    ls?: number;
    /** line-height en multiple de la taille (sinon « normal ») */
    lh?: number;
    upper?: boolean;
}
export declare function pdfColor(hex: string): import("pdf-lib").RGB;
export declare class PdfCanvas {
    readonly doc: PDFDocument;
    page: PDFPage;
    readonly pages: PDFPage[];
    private fonts;
    private constructor();
    /**
     * `body: 'chillax'` : corps en Chillax (Regular / Bold), comme la webapp — relevé de temps.
     * Chillax n'a ni espace insécable ni flèche : `prep` les remplace (espace, tiret demi-cadratin).
     */
    static create(options?: {
        body?: 'liberation' | 'chillax';
        weights?: boolean;
    }): Promise<PdfCanvas>;
    private weights?;
    private chillaxBody;
    newPage(): PDFPage;
    embedImage(bytes: Uint8Array | null | undefined): Promise<PDFImage | undefined>;
    embedAsset(...p: string[]): Promise<PDFImage | undefined>;
    font(s: CanvasTextStyle): PDFFont;
    private metrics;
    /** Hauteur de ligne (px) : `lh` × taille, sinon « normale » (métriques arrondies au pixel). */
    lineHeight(s: CanvasTextStyle): number;
    /** Distance (px) entre le haut de la boîte de ligne et la ligne de base : alignement sur la base. */
    baseline(s: CanvasTextStyle): number;
    private baselineOffset;
    private prep;
    /** Segments sans crénage interne, placés aux positions exactes (pdf-lib n'applique pas le crénage). */
    private shape;
    width(t: string, s: CanvasTextStyle): number;
    /** Ligne de texte ; `top` = haut de la boîte de ligne. */
    text(t: string, x: number, top: number, s: CanvasTextStyle, align?: CanvasAlign, opacity?: number): void;
    /** Texte tronqué avec « … » s'il dépasse `maxW` (white-space:nowrap; text-overflow:ellipsis). */
    textClip(t: string, x: number, top: number, maxW: number, s: CanvasTextStyle, align?: CanvasAlign): void;
    /** Découpe aux espaces et traits d'union ; un mot trop long est coupé au caractère. */
    wrap(t: string, maxW: number, s: CanvasTextStyle): string[];
    /** Paragraphe (une chaîne, sauts de ligne respectés) ; renvoie les lignes. */
    lines(t: string, maxW: number, s: CanvasTextStyle): string[];
    paraHeight(t: string, maxW: number, s: CanvasTextStyle): number;
    /** Dessine un paragraphe ; renvoie sa hauteur. */
    para(t: string, x: number, top: number, maxW: number, s: CanvasTextStyle, align?: CanvasAlign): number;
    rect(x: number, y: number, w: number, h: number, o: {
        fill?: string;
        stroke?: string;
        sw?: number;
        r?: number;
        opacity?: number;
    }): void;
    hline(x1: number, x2: number, y: number, t: number, c: string): void;
    vline(x: number, y1: number, y2: number, t: number, c: string): void;
    circle(cx: number, cy: number, r: number, fill: string): void;
    image(img: PDFImage, x: number, y: number, w: number, h: number): void;
    /** Image contenue dans une boîte (object-fit: contain), alignée à gauche et centrée verticalement. */
    imageContain(img: PDFImage, x: number, y: number, w: number, h: number, align?: CanvasAlign): void;
    /** Filigrane diagonal, comme sur les documents commerciaux. */
    watermark(text: string, size: number, color: string): void;
}
//# sourceMappingURL=PdfCanvas.d.ts.map