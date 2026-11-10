/**
 * PDF d'une facture de la plateforme (`PlatformInvoiceView`) — maquette « Factures Plateforme »
 * au pixel (coordonnées CSS de la page 794 × 1123), même dessin que `renderPlatformInvoiceHtml`.
 *
 * PDF/A-3 avec le XML Factur-X embarqué (`factur-x.xml`, relation Data). Pagination : les lignes
 * passent à la page suivante (en-tête du tableau répété) ; les mentions sous le tableau, les
 * totaux, l'encadré et le pied légal restent sur la dernière page ; la barre du pied (logo,
 * « Page x sur n ») est sur chaque page.
 */
import type { PDFImage } from 'pdf-lib';
import { PdfCanvas, CANVAS_PAGE_W, CANVAS_PAGE_H, type CanvasTextStyle } from './PdfCanvas';
import { setupPDFA3Compliance } from '../utils/PDFA3Compliance';
import { attachFileWithAFRelationship } from '../utils/AFRelationshipFix';
import { PLATFORM_COLORS as C } from '../document/platform-invoice-html';
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

// Géométrie de la maquette (px CSS).
const L = 68;
const R = CANVAS_PAGE_W - 68; // 726
const W = R - L; // 658
const TOP = 64;
const BAR_Y = 1071;
const COL_W = 305;
const COL2_X = L + COL_W + 48; // 421
/** Colonnes du tableau : désignation flexible, puis 44 / 92 / 52 / 100, espacées de 12. */
const COLS = { qtyR: 446, priceR: 550, vatR: 614, totalR: R, descW: 322 };
const TOTALS_X = R - 300; // 426

type W8 = 500 | 600 | 700;
const st = (size: number, weight: W8 = 500, color: string = C.ink, extra: Partial<CanvasTextStyle> = {}): CanvasTextStyle =>
  ({ size, weight, color, ...extra });

export class PlatformInvoicePdfRenderer {
  private c!: PdfCanvas;
  private logo?: PDFImage;

  constructor(private readonly v: PlatformInvoiceView, private readonly options: RenderPlatformInvoicePdfOptions = {}) {}

  async render(): Promise<RenderedPlatformInvoicePdf> {
    const v = this.v;
    this.c = await PdfCanvas.create({ weights: true });
    const c = this.c;
    const embedsXml = !!this.options.facturXml;
    const title = `${v.title} ${v.number}`;
    await setupPDFA3Compliance(c.doc, {
      title,
      author: v.seller.name,
      subject: title,
      creator: 'accounting-tools',
      keywords: embedsXml ? [v.title, 'Factur-X', 'PDF/A-3'] : [v.title, 'PDF/A-3'],
      conformanceLevel: this.options.conformanceLevel ?? 'EN 16931',
      facturX: embedsXml,
    });
    c.doc.setTitle(title);
    c.doc.setAuthor(v.seller.name);
    c.doc.setProducer('accounting-tools');
    this.logo = (await c.embedImage(this.options.logo)) ?? (await c.embedAsset('brand', 'services-logo-hd.png')) ?? (await c.embedAsset('brand', 'services-logo.png'));

    c.newPage();
    let y = this.header();
    y = this.parties(y);
    y = this.table(y);
    this.closing(y);
    this.bars();

    if (this.options.facturXml) {
      const at = this.options.generatedAt ?? new Date();
      await attachFileWithAFRelationship(c.doc, Buffer.from(this.options.facturXml, 'utf-8'), 'factur-x.xml', {
        mimeType: 'text/xml', description: 'Factur-X XML Invoice', creationDate: at, modificationDate: at, relationship: 'Data',
      });
    }
    const pdf = await c.doc.save();
    return { pdf, pageCount: c.pages.length };
  }

  // ─── Aides ────────────────────────────────────────────────────────────────

  private lh(s: CanvasTextStyle) { return this.c.lineHeight(s); }

  /** Texte aligné sur la ligne de base d'un autre style (alignement « baseline » de la maquette). */
  private onBaseline(t: string, x: number, top: number, s: CanvasTextStyle, ref: CanvasTextStyle, align: 'left' | 'right' = 'left') {
    this.c.text(t, x, top + this.c.baseline(ref) - this.c.baseline(s), s, align);
  }

  private sectionTitle(t: string, x: number, y: number): number {
    const s = st(8.5, 600, C.accentText, { ls: 0.22, upper: true });
    this.c.text(t, x, y, s);
    const ruleY = y + this.lh(s) + 5;
    this.c.hline(x, x + COL_W, ruleY, 1, C.rule);
    return ruleY + 1 + 8;
  }

  // ─── En-tête ──────────────────────────────────────────────────────────────

  private header(): number {
    const { c, v } = this;
    // Émetteur
    if (this.logo) c.imageContain(this.logo, L, TOP, 266, 24, 'left');
    const sellerStyle = st(9.5, 500, C.text, { lh: 1.8 });
    const lh = this.lh(sellerStyle);
    let sy = TOP + 24 + 13;
    const nameStyle = st(9.5, 700, C.ink, { lh: 1.8 });
    const first = `${v.seller.name}${v.seller.firstLineRest}`;
    if (c.width(first, sellerStyle) <= 280) {
      c.text(v.seller.name, L, sy, nameStyle);
      c.text(v.seller.firstLineRest, L + c.width(v.seller.name, nameStyle), sy, sellerStyle);
      sy += lh;
    } else {
      c.text(v.seller.name, L, sy, nameStyle);
      sy += lh;
      if (v.seller.firstLineRest) sy += c.para(v.seller.firstLineRest.replace(/^,\s*/, ''), L, sy, 280, sellerStyle);
    }
    for (const line of v.seller.lines) sy += c.para(line, L, sy, 280, sellerStyle);

    // Titre, numéro, dates
    c.rect(R - 26, TOP, 26, 2, { fill: C.accent });
    const titleStyle = st(8.5, 600, C.accentText, { ls: 0.26, upper: true });
    let ry = TOP + 2 + 2 + 6;
    c.text(v.title, R, ry, titleStyle, 'right');
    ry += this.lh(titleStyle) + 6;
    const numberStyle = st(19, 700, C.ink, { ls: -0.01 });
    c.text(v.number, R, ry, numberStyle, 'right');
    ry += this.lh(numberStyle) + 6 + 6;
    const label = st(10, 500, C.text);
    const value = st(10, 600, C.ink);
    const valueW = Math.max(...v.meta.map((m) => c.width(m.value, value)));
    const labelR = R - valueW - 16;
    const rowH = this.lh(label);
    v.meta.forEach((m, i) => {
      const top = ry + i * (rowH + 4);
      c.text(m.label, labelR, top, label, 'right');
      c.text(m.value, R, top, value, 'right');
    });
    ry += v.meta.length * rowH + (v.meta.length - 1) * 4;

    const ruleY = Math.max(sy, ry) + 26;
    c.hline(L, R, ruleY, 1, C.ink);
    return ruleY + 1;
  }

  // ─── Client et bloc d'information ────────────────────────────────────────

  private parties(y0: number): number {
    const { c, v } = this;
    const top = y0 + 28;
    // Facturé à
    let ly = this.sectionTitle(v.buyerTitle, L, top);
    ly += c.para(v.buyer.name, L, ly, COL_W, st(13, 700));
    ly += 8;
    const bStyle = st(10, 500, C.text, { lh: 1.8 });
    for (const line of v.buyer.lines) ly += c.para(line, L, ly, COL_W, bStyle);

    // Abonnement / Opération concernée
    let ry = this.sectionTitle(v.info.title, COL2_X, top);
    const label = st(10, 500, C.text);
    const labelW = Math.max(...v.info.rows.map((r) => c.width(r.label, label)));
    const vx = COL2_X + labelW + 14;
    const vw = COL2_X + COL_W - vx;
    v.info.rows.forEach((r, i) => {
      if (i > 0) ry += 4;
      const vs = st(10, r.strong ? 700 : 600, r.color ?? C.ink);
      c.text(r.label, COL2_X, ry, label);
      ry += Math.max(this.lh(label), c.para(r.value, vx, ry, vw, vs));
    });
    return Math.max(ly, ry);
  }

  // ─── Tableau ──────────────────────────────────────────────────────────────

  private tableHeader(y: number): number {
    const { c, v } = this;
    const s = st(8.5, 600, C.text, { ls: 0.18, upper: true });
    c.text(v.columns.description, L, y, s);
    c.text(v.columns.quantity, COLS.qtyR, y, s, 'right');
    c.text(v.columns.unitPrice, COLS.priceR, y, s, 'right');
    c.text(v.columns.vat, COLS.vatR, y, s, 'right');
    c.text(v.columns.total, COLS.totalR, y, s, 'right');
    const ruleY = y + this.lh(s) + 9;
    c.hline(L, R, ruleY, 1.5, C.ink);
    return ruleY + 1.5;
  }

  private table(partiesBottom: number): number {
    const { c, v } = this;
    let y = this.tableHeader(partiesBottom + 38);
    const desc = st(11.5, 600);
    const cell = st(11.5, 500);
    for (const row of v.rows) {
      const lines = c.lines(row.description, COLS.descW, desc);
      const h = 14 + lines.length * this.lh(desc) + 14;
      if (y + h > BAR_Y - 24) {
        c.newPage();
        y = this.tableHeader(TOP);
      }
      const top = y + 14;
      c.para(row.description, L, top, COLS.descW, desc);
      c.text(row.quantity, COLS.qtyR, top, cell, 'right');
      c.text(row.unitPrice, COLS.priceR, top, cell, 'right');
      c.text(row.vat, COLS.vatR, top, st(11.5, 500, C.text), 'right');
      c.text(row.total, COLS.totalR, top, st(11.5, 600), 'right');
      y += h;
      c.hline(L, R, y, 1, C.rule);
      y += 1;
    }
    return y;
  }

  // ─── Mentions, totaux, encadré, pied légal (dernière page) ───────────────

  private footerHeight(): number {
    const { c, v } = this;
    const s = st(9, 500, C.text, { lh: 1.75 });
    const colW = (W - 30) / 2;
    const cols = v.footer.map((f) => this.lh(s) + 3 + c.paraHeight(f.text, colW, s));
    return 22 + Math.max(...cols) + 16;
  }

  private closing(tableBottom: number) {
    const { c, v } = this;
    const noteStyle = st(9.5, 500, C.text, { lh: 1.7 });
    const notesH = v.notes.length ? 12 + v.notes.reduce((s, n) => s + c.paraHeight(n, W, noteStyle), 0) : 0;
    const totalsH = v.totals.reduce((s, t) => s + (t.ruleTop ? 1 : 0) + 7 + this.lh(st(11.5)) + 7, 0) + 1.5 + 12 + this.lh(st(17, 700)) + 10 + this.lh(st(10.5));
    const alertStyle = st(10.5, 500, C.ink, { lh: 1.6 });
    const alertH = v.alert ? 24 + 13 + c.paraHeight(v.alert, W - 32, alertStyle) + 13 + 2 : 0;
    const footH = this.footerHeight();
    const footTop = BAR_Y - footH;

    let y = tableBottom;
    if (y + notesH + 28 + totalsH + alertH > footTop - 16) {
      c.newPage();
      y = TOP;
    }

    // Mentions sous le tableau
    if (v.notes.length) {
      y += 12;
      for (const n of v.notes) y += c.para(n, L, y, W, noteStyle);
    }

    // Totaux
    y += 28;
    const label = st(11.5, 500, C.text);
    for (const t of v.totals) {
      if (t.ruleTop) { c.hline(TOTALS_X, R, y, 1, C.rule); y += 1; }
      c.text(t.label, TOTALS_X, y + 7, label);
      c.text(t.value, R, y + 7, st(11.5, t.strong ? 600 : 500), 'right');
      y += 7 + this.lh(label) + 7;
    }
    c.hline(TOTALS_X, R, y, 1.5, C.accent);
    y += 1.5 + 12;
    const big = st(17, 700);
    c.text(v.grandTotal.value, R, y, big, 'right');
    this.onBaseline(v.grandTotal.label, TOTALS_X, y, st(12, 700), big);
    y += this.lh(big) + 10;
    const restLabel = st(10.5, 500, C.text);
    c.text(v.rest.label, TOTALS_X, y, restLabel);
    c.text(v.rest.value, R, y, st(10.5, 700), 'right');
    y += this.lh(restLabel);

    // Prélèvement refusé
    if (v.alert) {
      y += 24;
      const textH = c.paraHeight(v.alert, W - 32, alertStyle);
      c.rect(L, y, W, textH + 26 + 2, { stroke: C.ink, sw: 1 });
      c.para(v.alert, L + 16, y + 14, W - 32, alertStyle);
    }

    // Conditions et mentions légales, au-dessus de la barre du pied
    c.hline(L, R, footTop, 1, C.rule);
    const fs = st(9, 500, C.text, { lh: 1.75 });
    const colW = (W - 30) / 2;
    v.footer.forEach((f, i) => {
      const x = L + i * (colW + 30);
      const ty = footTop + 1 + 22;
      c.text(f.title, x, ty, st(9, 700, C.ink, { lh: 1.75 }));
      c.para(f.text, x, ty + this.lh(fs) + 3, colW, fs);
    });
  }

  // ─── Barre du pied (chaque page) ─────────────────────────────────────────

  private bars() {
    const { c, v } = this;
    const total = c.pages.length;
    c.pages.forEach((page, i) => {
      c.page = page;
      c.hline(0, CANVAS_PAGE_W, BAR_Y, 1, C.ink);
      if (this.logo) c.imageContain(this.logo, L, BAR_Y + 1 + 14, 120, 13, 'left');
      c.text(v.pageLabel(i + 1, total), R, BAR_Y + 1 + 14, st(8.5, 600, C.text), 'right');
    });
    void CANVAS_PAGE_H;
  }
}

export async function renderPlatformInvoicePdf(view: PlatformInvoiceView, options: RenderPlatformInvoicePdfOptions = {}): Promise<RenderedPlatformInvoicePdf> {
  return new PlatformInvoicePdfRenderer(view, options).render();
}
