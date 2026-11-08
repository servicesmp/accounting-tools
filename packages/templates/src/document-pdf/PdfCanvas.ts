/**
 * Toile PDF en coordonnées CSS (px de la maquette, origine en haut à gauche) : texte avec
 * crénage et letter-spacing, césure aux espaces, rectangles arrondis, filets, images.
 * Page A4 de 794 × 1123 px convertie en points (1 px = 595,28 / 794 pt), hauteur de ligne
 * « normale » à la Chromium (métriques arrondies au pixel).
 *
 * Deux familles : le corps (Liberation Sans, métriques d'Helvetica/Arial) et les titres
 * (Chillax, comme la webapp). Utilisée par `ReportPdfRenderer` ; le moteur des documents
 * commerciaux (`DocumentPdfRenderer`) garde ses primitives propres, calibrées au pixel.
 */
import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, degrees, pushGraphicsState, popGraphicsState, setCharacterSpacing } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const CANVAS_PAGE_W = 794;
export const CANVAS_PAGE_H = 1123;
export const PX = 595.28 / CANVAS_PAGE_W; // px → pt

export type CanvasAlign = 'left' | 'right' | 'center';
export type CanvasFamily = 'body' | 'heading';

export interface CanvasTextStyle {
  size: number;
  bold?: boolean;
  family?: CanvasFamily;
  color?: string;
  /** letter-spacing en em */
  ls?: number;
  /** line-height en multiple de la taille (sinon « normal ») */
  lh?: number;
  upper?: boolean;
}

interface Metrics { asc: number; desc: number; gap: number }
/** Métriques Liberation Sans (unitsPerEm 2048) — repli si fontkit n'expose pas la police. */
const LIBERATION: Metrics = { asc: 1854 / 2048, desc: 434 / 2048, gap: 67 / 2048 };
const BASELINE_NUDGE = 0.5;

export function pdfColor(hex: string) {
  const h = (hex || '#000000').replace('#', '');
  return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

function assetPath(...p: string[]) {
  return path.join(__dirname, '../../assets', ...p);
}

export class PdfCanvas {
  readonly doc: PDFDocument;
  page!: PDFPage;
  readonly pages: PDFPage[] = [];
  private fonts!: Record<'body' | 'bodyBold' | 'heading' | 'headingBold', PDFFont>;

  private constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  /**
   * `body: 'chillax'` : corps en Chillax (Regular / Bold), comme la webapp — relevé de temps.
   * Chillax n'a ni espace insécable ni flèche : `prep` les remplace (espace, tiret demi-cadratin).
   */
  static async create(options: { body?: 'liberation' | 'chillax' } = {}): Promise<PdfCanvas> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const c = new PdfCanvas(doc);
    // Chillax (OpenType CFF) est embarquée entière : le sous-ensemble produit par pdf-lib sur une
    // police CFF est invalide pour certains lecteurs (poppler). Liberation Sans (TrueType) est sous-ensemblée.
    const cache = new Map<string, Promise<PDFFont>>();
    const embed = (file: string, subset: boolean) => {
      if (!cache.has(file)) cache.set(file, doc.embedFont(fs.readFileSync(assetPath('fonts', file)), { subset }));
      return cache.get(file)!;
    };
    const chillaxBody = options.body === 'chillax';
    c.chillaxBody = chillaxBody;
    c.fonts = {
      body: await (chillaxBody ? embed('Chillax-Regular.otf', false) : embed('LiberationSans-Regular.ttf', true)),
      bodyBold: await (chillaxBody ? embed('Chillax-Bold.otf', false) : embed('LiberationSans-Bold.ttf', true)),
      heading: await embed('Chillax-Semibold.otf', false),
      headingBold: await embed('Chillax-Bold.otf', false),
    };
    return c;
  }

  private chillaxBody = false;

  newPage(): PDFPage {
    this.page = this.doc.addPage([CANVAS_PAGE_W * PX, CANVAS_PAGE_H * PX]);
    this.pages.push(this.page);
    return this.page;
  }

  async embedImage(bytes: Uint8Array | null | undefined): Promise<PDFImage | undefined> {
    if (!bytes || bytes.length === 0) return undefined;
    try { return bytes[0] === 0x89 && bytes[1] === 0x50 ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes); } catch { return undefined; }
  }

  async embedAsset(...p: string[]): Promise<PDFImage | undefined> {
    try { return await this.doc.embedPng(fs.readFileSync(assetPath(...p))); } catch { return undefined; }
  }

  // ─── Polices et métriques ──────────────────────────────────────────────────

  font(s: CanvasTextStyle): PDFFont {
    const heading = s.family === 'heading';
    return heading ? (s.bold ? this.fonts.headingBold : this.fonts.heading) : (s.bold ? this.fonts.bodyBold : this.fonts.body);
  }

  private metrics(s: CanvasTextStyle): Metrics {
    const fk = (this.font(s) as any).embedder?.font;
    if (!fk || !fk.unitsPerEm) return LIBERATION;
    return { asc: Math.abs(fk.ascent) / fk.unitsPerEm, desc: Math.abs(fk.descent) / fk.unitsPerEm, gap: Math.max(0, fk.lineGap || 0) / fk.unitsPerEm };
  }

  /** Hauteur de ligne (px) : `lh` × taille, sinon « normale » (métriques arrondies au pixel). */
  lineHeight(s: CanvasTextStyle): number {
    if (s.lh) return s.lh * s.size;
    const m = this.metrics(s);
    return Math.round(m.asc * s.size) + Math.round(m.desc * s.size) + Math.round(m.gap * s.size);
  }

  private baselineOffset(s: CanvasTextStyle): number {
    const m = this.metrics(s);
    const a = Math.round(m.asc * s.size);
    const d = Math.round(m.desc * s.size);
    return (this.lineHeight(s) - (a + d)) / 2 + a + BASELINE_NUDGE;
  }

  private prep(t: string, s: CanvasTextStyle) {
    let txt = String(t ?? '').replace(/[\r\n\t]+/g, ' ');
    // Glyphes absents de Chillax : espaces insécables → espace, flèche → tiret.
    if (this.chillaxBody || s.family === 'heading') txt = txt.replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/\u2192/g, '–');
    return s.upper ? txt.toLocaleUpperCase('fr-FR') : txt;
  }

  /** Segments sans crénage interne, placés aux positions exactes (pdf-lib n'applique pas le crénage). */
  private shape(txt: string, s: CanvasTextStyle): { segments: { text: string; x: number }[]; width: number } {
    const font = this.font(s);
    const fk = (font as any).embedder?.font;
    const ls = (s.ls ?? 0) * s.size;
    if (!fk) {
      const w = font.widthOfTextAtSize(txt, s.size) + ls * [...txt].length;
      return { segments: [{ text: txt, x: 0 }], width: w };
    }
    const run = fk.layout(txt);
    const scale = s.size / fk.unitsPerEm;
    const segments: { text: string; x: number }[] = [];
    let x = 0; let cur = ''; let curX = 0;
    run.glyphs.forEach((g: any, i: number) => {
      const chars = String.fromCodePoint(...g.codePoints);
      if (!cur) curX = x;
      cur += chars;
      const adv = run.positions[i].xAdvance;
      x += adv * scale + ls * chars.length;
      if (adv !== g.advanceWidth) { segments.push({ text: cur, x: curX }); cur = ''; }
    });
    if (cur) segments.push({ text: cur, x: curX });
    return { segments, width: x };
  }

  width(t: string, s: CanvasTextStyle): number {
    const txt = this.prep(t, s);
    return txt ? this.shape(txt, s).width : 0;
  }

  /** Ligne de texte ; `top` = haut de la boîte de ligne. */
  text(t: string, x: number, top: number, s: CanvasTextStyle, align: CanvasAlign = 'left', opacity?: number) {
    const txt = this.prep(t, s);
    if (!txt) return;
    const shaped = this.shape(txt, s);
    const dx = align === 'right' ? -shaped.width : align === 'center' ? -shaped.width / 2 : 0;
    const base = Math.round(top + this.baselineOffset(s));
    const cs = (s.ls ?? 0) * s.size * PX;
    if (cs) this.page.pushOperators(pushGraphicsState(), setCharacterSpacing(cs));
    for (const seg of shaped.segments) {
      this.page.drawText(seg.text, {
        x: (x + dx + seg.x) * PX, y: (CANVAS_PAGE_H - base) * PX, size: s.size * PX, font: this.font(s),
        color: pdfColor(s.color ?? '#1F2937'), ...(opacity !== undefined ? { opacity } : {}),
      });
    }
    if (cs) this.page.pushOperators(popGraphicsState());
  }

  /** Texte tronqué avec « … » s'il dépasse `maxW` (white-space:nowrap; text-overflow:ellipsis). */
  textClip(t: string, x: number, top: number, maxW: number, s: CanvasTextStyle, align: CanvasAlign = 'left') {
    let txt = this.prep(t, s);
    if (this.width(txt, { ...s, upper: false }) <= maxW) { this.text(txt, x, top, { ...s, upper: false }, align); return; }
    const chars = [...txt];
    while (chars.length && this.width(chars.join('') + '…', { ...s, upper: false }) > maxW) chars.pop();
    txt = chars.join('').trimEnd() + '…';
    this.text(txt, x, top, { ...s, upper: false }, align);
  }

  /** Découpe aux espaces et traits d'union ; un mot trop long est coupé au caractère. */
  wrap(t: string, maxW: number, s: CanvasTextStyle): string[] {
    const st = { ...s, upper: false };
    const parts: { t: string; sep: string }[] = [];
    for (const w of this.prep(t, s).split(' ').filter(Boolean)) {
      w.split(/(?<=\p{L}-)(?=\p{L})/u).forEach((piece, i) => parts.push({ t: piece, sep: i === 0 ? ' ' : '' }));
    }
    const lines: string[] = [];
    let cur = '';
    const push = (w: string) => {
      // Mot plus large que la ligne : coupé au caractère (overflow-wrap:anywhere).
      if (this.width(w, st) <= maxW) { cur = w; return; }
      let piece = '';
      for (const ch of w) {
        if (piece && this.width(piece + ch, st) > maxW) { lines.push(piece); piece = ch; } else piece += ch;
      }
      cur = piece;
    };
    for (const { t: w, sep } of parts) {
      const test = cur ? `${cur}${sep}${w}` : w;
      if (cur && this.width(test, st) > maxW + 0.01) { lines.push(cur); push(w); } else if (!cur) push(w); else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /** Paragraphe (une chaîne, sauts de ligne respectés) ; renvoie les lignes. */
  lines(t: string, maxW: number, s: CanvasTextStyle): string[] {
    return String(t ?? '').split('\n').flatMap((p) => (p.trim() ? this.wrap(p, maxW, s) : ['']));
  }

  paraHeight(t: string, maxW: number, s: CanvasTextStyle): number {
    return this.lines(t, maxW, s).length * this.lineHeight(s);
  }

  /** Dessine un paragraphe ; renvoie sa hauteur. */
  para(t: string, x: number, top: number, maxW: number, s: CanvasTextStyle, align: CanvasAlign = 'left'): number {
    const lines = this.lines(t, maxW, s);
    const lh = this.lineHeight(s);
    lines.forEach((l, i) => this.text(l, align === 'right' ? x + maxW : align === 'center' ? x + maxW / 2 : x, top + i * lh, { ...s, upper: false }, align));
    return lines.length * lh;
  }

  // ─── Formes ──────────────────────────────────────────────────────────────

  rect(x: number, y: number, w: number, h: number, o: { fill?: string; stroke?: string; sw?: number; r?: number; opacity?: number }) {
    if (w <= 0 || h <= 0) return;
    const r = Math.max(0, Math.min(o.r ?? 0, w / 2, h / 2));
    if (r > 0) {
      const path = (i: number) => {
        const a = Math.max(0, r - i);
        const arc = (ex: number, ey: number) => (a > 0 ? ` A${a},${a} 0 0 1 ${ex},${ey}` : ` L${ex},${ey}`);
        return `M${x + Math.max(r, i)},${y + i} H${x + w - Math.max(r, i)}${arc(x + w - i, y + Math.max(r, i))}`
          + ` V${y + h - Math.max(r, i)}${arc(x + w - Math.max(r, i), y + h - i)}`
          + ` H${x + Math.max(r, i)}${arc(x + i, y + h - Math.max(r, i))}`
          + ` V${y + Math.max(r, i)}${arc(x + Math.max(r, i), y + i)} Z`;
      };
      if (o.fill) this.page.drawSvgPath(path(0), { x: 0, y: CANVAS_PAGE_H * PX, scale: PX, color: pdfColor(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
      if (o.stroke) this.page.drawSvgPath(path((o.sw ?? 1) / 2), { x: 0, y: CANVAS_PAGE_H * PX, scale: PX, borderColor: pdfColor(o.stroke), borderWidth: (o.sw ?? 1) * PX });
      return;
    }
    if (o.fill) this.page.drawRectangle({ x: x * PX, y: (CANVAS_PAGE_H - y - h) * PX, width: w * PX, height: h * PX, color: pdfColor(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
    if (o.stroke) {
      const sw = o.sw ?? 1;
      this.page.drawRectangle({ x: (x + sw / 2) * PX, y: (CANVAS_PAGE_H - y - h + sw / 2) * PX, width: (w - sw) * PX, height: (h - sw) * PX, borderColor: pdfColor(o.stroke), borderWidth: sw * PX });
    }
  }

  hline(x1: number, x2: number, y: number, t: number, c: string) { this.rect(x1, y, x2 - x1, t, { fill: c }); }
  vline(x: number, y1: number, y2: number, t: number, c: string) { this.rect(x, y1, t, y2 - y1, { fill: c }); }

  circle(cx: number, cy: number, r: number, fill: string) {
    this.page.drawCircle({ x: cx * PX, y: (CANVAS_PAGE_H - cy) * PX, size: r * PX, color: pdfColor(fill) });
  }

  image(img: PDFImage, x: number, y: number, w: number, h: number) {
    this.page.drawImage(img, { x: x * PX, y: (CANVAS_PAGE_H - y - h) * PX, width: w * PX, height: h * PX });
  }

  /** Image contenue dans une boîte (object-fit: contain), alignée à gauche et centrée verticalement. */
  imageContain(img: PDFImage, x: number, y: number, w: number, h: number, align: CanvasAlign = 'left') {
    const s = Math.min(w / img.width, h / img.height);
    const iw = img.width * s; const ih = img.height * s;
    const dx = align === 'center' ? (w - iw) / 2 : align === 'right' ? w - iw : 0;
    this.image(img, x + dx, y + (h - ih) / 2, iw, ih);
  }

  /** Filigrane diagonal, comme sur les documents commerciaux. */
  watermark(text: string, size: number, color: string) {
    const s: CanvasTextStyle = { size, bold: true, ls: 0.06, color };
    const w = this.width(text, s);
    const cx = CANVAS_PAGE_W * 0.58; const cy = CANVAS_PAGE_H * 0.54;
    const ang = (32 * Math.PI) / 180;
    const rx = -(w / 2) * Math.cos(ang); const ry = (w / 2) * Math.sin(ang);
    const cs = s.ls! * size * PX;
    this.page.pushOperators(pushGraphicsState(), setCharacterSpacing(cs));
    this.page.drawText(text, { x: (cx + rx) * PX, y: (CANVAS_PAGE_H - (cy + ry)) * PX, size: size * PX, font: this.font(s), color: pdfColor(color), opacity: 0.07, rotate: degrees(32) });
    this.page.pushOperators(popGraphicsState());
  }
}
