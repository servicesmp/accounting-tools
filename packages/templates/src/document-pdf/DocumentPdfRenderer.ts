/**
 * Moteur PDF des documents commerciaux — reproduction au pixel près de la
 * maquette « Document Page » (Claude Design, page A4 de 794 × 1123 px CSS).
 *
 * Tout est calculé en px CSS de la maquette puis converti en points PDF
 * (1 px = 595,28 / 794 pt). Les règles de mise en page (flex, grille, marges,
 * hauteurs de ligne) reproduisent celles du navigateur : hauteur de ligne
 * « normale » = ascendante + descendante + interligne arrondies au pixel, comme
 * Chromium. Police : Liberation Sans (métriques identiques à Helvetica/Arial),
 * embarquée pour la conformité PDF/A.
 *
 * Ce moteur ne calcule aucun montant et n'invente aucun texte : il dessine une
 * DocumentView (voir ../document/view.ts).
 */
import fs from 'fs';
import path from 'path';
import {
  PDFDocument, PDFFont, PDFImage, PDFPage, rgb, degrees,
  pushGraphicsState, popGraphicsState, setCharacterSpacing,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import type { DocumentView, ViewColumn, ViewRow } from '../document/types';
import { mix, blend } from '../document/color';
import { PATTERN_4_PATHS, PATTERN_4_VIEWBOX } from '../document/pattern';
import { setupPDFA3Compliance } from '../utils/PDFA3Compliance';
import { attachFileWithAFRelationship } from '../utils/AFRelationshipFix';

// ─── Géométrie de la maquette ───────────────────────────────────────────────
export const PAGE_W = 794;
export const PAGE_H = 1123;
const K = 595.28 / PAGE_W; // px → pt
const SIDE = 56; // marge latérale
const SIDEBAR_W = 236;
const SIDEBAR_MAIN_L = 272;
const FOOT_BOTTOM = 34;

// Couleurs fixes de la maquette
const C = {
  text: '#1e293b', ink: '#111111', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
  slate400: '#94a3b8', slate300: '#cbd5e1', line: '#e2e8f0', rowRule: '#eef0f2', surface: '#f8fafc',
  gray: '#808080', white: '#ffffff',
};

// Métriques Liberation Sans (unitsPerEm 2048)
const ASC = 1854 / 2048;
const DESC = 434 / 2048;
const GAP = 67 / 2048;

type Align = 'left' | 'right' | 'center';

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

function assetPath(...p: string[]) {
  return path.join(__dirname, '../../assets', ...p);
}

function color(hex: string) {
  const h = hex.replace('#', '');
  return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

/** Hauteur de ligne « normale » à la Chromium : métriques arrondies au pixel. */
function normalLH(size: number): number {
  return Math.round(ASC * size) + Math.round(DESC * size) + Math.round(GAP * size);
}

function lineHeight(s: TextStyle): number {
  return s.lh ? s.lh * s.size : normalLH(s.size);
}

/** Décalage de la ligne de base depuis le haut de la boîte de ligne. */
function baselineOffset(s: TextStyle): number {
  const a = Math.round(ASC * s.size);
  const d = Math.round(DESC * s.size);
  const hl = (lineHeight(s) - (a + d)) / 2;
  return hl + a + BASELINE_NUDGE;
}

/**
 * Réglage fin de la ligne de base (px) : calibré par comparaison pixel à pixel avec
 * le rendu Chromium de la maquette (la ligne de base y est ensuite arrondie au pixel,
 * comme le fait le moteur de rendu du navigateur).
 */
const BASELINE_NUDGE = 0.5;

export class DocumentPdfRenderer {
  private doc!: PDFDocument;
  private regular!: PDFFont;
  private bold!: PDFFont;
  private page!: PDFPage;
  private pages: PDFPage[] = [];
  private logo?: PDFImage;
  private servicesLogo?: PDFImage;
  private qr?: PDFImage;
  /** Bornes horizontales de la zone principale (px). */
  private L = SIDE;
  private R = PAGE_W - SIDE;
  private readonly v: DocumentView;

  constructor(view: DocumentView, private readonly options: RenderDocumentPdfOptions = {}) {
    this.v = view;
  }

  private get frame() { return this.v.settings.layout.frame; }
  private get primary() { return this.v.theme.primary; }
  private get accent() { return this.v.theme.accent; }

  // ─── Primitives (coordonnées px, origine en haut à gauche) ────────────────

  private font(bold?: boolean) { return bold ? this.bold : this.regular; }

  private prep(t: string, s: TextStyle) {
    const txt = String(t ?? '').replace(/[\r\n\t]+/g, ' ');
    return s.upper ? txt.toLocaleUpperCase('fr-FR') : txt;
  }

  /**
   * Mise en forme d'un texte avec le crénage de la police (paires comme « FA »,
   * « To ») — le navigateur l'applique ; pdf-lib non. On découpe le texte en
   * segments sans crénage interne, placés aux positions exactes.
   */
  private shape(txt: string, s: TextStyle): { segments: { text: string; x: number }[]; width: number } {
    const fk = (this.font(s.bold) as any).embedder?.font;
    const ls = (s.ls ?? 0) * s.size;
    if (!fk) {
      const w = this.font(s.bold).widthOfTextAtSize(txt, s.size) + ls * [...txt].length;
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

  /** Largeur d'un texte en px (crénage et letter-spacing compris, comme le navigateur). */
  width(t: string, s: TextStyle): number {
    const txt = this.prep(t, s);
    if (!txt) return 0;
    return this.shape(txt, s).width;
  }

  /** Dessine une ligne de texte ; `top` = haut de la boîte de ligne. */
  private text(t: string, x: number, top: number, s: TextStyle, align: Align = 'left', opacity?: number) {
    const txt = this.prep(t, s);
    if (!txt) return;
    const shaped = this.shape(txt, s);
    const w = shaped.width;
    const dx = align === 'right' ? -w : align === 'center' ? -w / 2 : 0;
    const base = Math.round(top + baselineOffset(s));
    const cs = (s.ls ?? 0) * s.size * K;
    if (cs) this.page.pushOperators(pushGraphicsState(), setCharacterSpacing(cs));
    for (const seg of shaped.segments) {
      this.page.drawText(seg.text, {
        x: (x + dx + seg.x) * K, y: (PAGE_H - base) * K, size: s.size * K, font: this.font(s.bold),
        color: color(s.color ?? C.text), ...(opacity !== undefined ? { opacity } : {}),
      });
    }
    if (cs) this.page.pushOperators(popGraphicsState());
  }

  /** Découpe un texte en lignes pour une largeur donnée (césure aux espaces, comme CSS). */
  wrap(t: string, maxW: number, s: TextStyle): string[] {
    // Opportunités de coupure comme le navigateur : espaces et traits d'union entre lettres.
    const parts: { t: string; sep: string }[] = [];
    for (const w of this.prep(t, s).split(' ').filter(Boolean)) {
      w.split(/(?<=\p{L}-)(?=\p{L})/u).forEach((piece, i) => parts.push({ t: piece, sep: i === 0 ? ' ' : '' }));
    }
    const lines: string[] = [];
    let cur = '';
    for (const { t: w, sep } of parts) {
      const test = cur ? `${cur}${sep}${w}` : w;
      if (cur && this.width(test, { ...s, upper: false }) > maxW + 0.01) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /** Paragraphe multi-lignes ; renvoie sa hauteur. */
  private para(t: string, x: number, top: number, maxW: number, s: TextStyle, align: Align = 'left', draw = true): number {
    const lines = this.wrap(t, maxW, s);
    const lh = lineHeight(s);
    if (draw) lines.forEach((l, i) => this.text(l, align === 'right' ? x + maxW : x, top + i * lh, { ...s, upper: false }, align));
    return lines.length * lh;
  }

  private paraHeight(t: string, maxW: number, s: TextStyle) {
    return this.wrap(t, maxW, s).length * lineHeight(s);
  }

  /** Rectangle (arrondi possible), remplissage et/ou bordure. */
  private rect(x: number, y: number, w: number, h: number, o: { fill?: string; stroke?: string; sw?: number; r?: number | [number, number, number, number]; opacity?: number }) {
    const lim = (v: number) => Math.max(0, Math.min(v, w / 2, h / 2));
    const [tl, tr, br, bl] = (Array.isArray(o.r) ? o.r : [o.r ?? 0, o.r ?? 0, o.r ?? 0, o.r ?? 0]).map(lim);
    if (tl + tr + br + bl > 0) {
      // Chemin arrondi coin par coin ; `i` = demi-épaisseur du trait (bordure intérieure comme en CSS).
      const path = (i: number) => {
        const a = (r: number) => Math.max(0, r - i);
        const arc = (r: number, ex: number, ey: number) => (a(r) > 0 ? ` A${a(r)},${a(r)} 0 0 1 ${ex},${ey}` : ` L${ex},${ey}`);
        return `M${x + Math.max(tl, i)},${y + i} H${x + w - Math.max(tr, i)}${arc(tr, x + w - i, y + Math.max(tr, i))}`
          + ` V${y + h - Math.max(br, i)}${arc(br, x + w - Math.max(br, i), y + h - i)}`
          + ` H${x + Math.max(bl, i)}${arc(bl, x + i, y + h - Math.max(bl, i))}`
          + ` V${y + Math.max(tl, i)}${arc(tl, x + Math.max(tl, i), y + i)} Z`;
      };
      if (o.fill) this.page.drawSvgPath(path(0), { x: 0, y: PAGE_H * K, scale: K, color: color(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
      if (o.stroke) this.page.drawSvgPath(path((o.sw ?? 1) / 2), { x: 0, y: PAGE_H * K, scale: K, borderColor: color(o.stroke), borderWidth: (o.sw ?? 1) * K });
      return;
    }
    if (o.fill) this.page.drawRectangle({ x: x * K, y: (PAGE_H - y - h) * K, width: w * K, height: h * K, color: color(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
    if (o.stroke) {
      const sw = o.sw ?? 1;
      this.page.drawRectangle({ x: (x + sw / 2) * K, y: (PAGE_H - y - h + sw / 2) * K, width: (w - sw) * K, height: (h - sw) * K, borderColor: color(o.stroke), borderWidth: sw * K });
    }
  }

  /** Filet horizontal : épaisseur `t` à partir du haut `y`. */
  private hline(x1: number, x2: number, y: number, t: number, c: string) {
    this.rect(x1, y, x2 - x1, t, { fill: c });
  }

  private vline(x: number, y1: number, y2: number, t: number, c: string) {
    this.rect(x, y1, t, y2 - y1, { fill: c });
  }

  private image(img: PDFImage, x: number, y: number, w: number, h: number) {
    this.page.drawImage(img, { x: x * K, y: (PAGE_H - y - h) * K, width: w * K, height: h * K });
  }

  /** Logo contenu dans une boîte (object-fit: contain), centré. */
  private logoIn(x: number, y: number, w: number, h: number) {
    if (!this.logo) return;
    const s = Math.min(w / this.logo.width, h / this.logo.height);
    const lw = this.logo.width * s; const lh = this.logo.height * s;
    this.image(this.logo, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
  }

  private get hasLogo() { return !!this.logo && this.v.settings.logo !== 'none'; }

  // ─── Point d'entrée ───────────────────────────────────────────────────────

  async render(): Promise<RenderedDocumentPdf> {
    const v = this.v;
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.regular = await this.doc.embedFont(fs.readFileSync(assetPath('fonts', 'LiberationSans-Regular.ttf')), { subset: true });
    this.bold = await this.doc.embedFont(fs.readFileSync(assetPath('fonts', 'LiberationSans-Bold.ttf')), { subset: true });

    const embedsXml = !!this.options.facturXml;
    await setupPDFA3Compliance(this.doc, {
      title: `${v.title} ${v.number}`,
      author: v.seller.name,
      subject: `${v.title} ${v.number}`,
      creator: 'accounting-tools',
      keywords: embedsXml ? [v.title, 'Factur-X', 'PDF/A-3'] : [v.title, 'PDF/A-3'],
      conformanceLevel: this.options.conformanceLevel ?? 'EN 16931',
      facturX: embedsXml,
    });
    this.doc.setTitle(`${v.title} ${v.number}`);
    this.doc.setAuthor(v.seller.name);
    this.doc.setProducer('accounting-tools');

    const b = this.options.logo;
    if (b && b.length > 0 && v.settings.logo !== 'none') {
      try { this.logo = b[0] === 0x89 && b[1] === 0x50 ? await this.doc.embedPng(b) : await this.doc.embedJpg(b); } catch { this.logo = undefined; }
    }
    if (v.poweredBy) {
      try { this.servicesLogo = await this.doc.embedPng(fs.readFileSync(assetPath('brand', 'services-logo.png'))); } catch { /* facultatif */ }
    }
    if (v.payment?.qrData) {
      try {
        const png = await QRCode.toBuffer(v.payment.qrData, { type: 'png', width: 256, margin: 0, errorCorrectionLevel: 'M', color: { dark: '111111ff', light: 'ffffffff' } });
        this.qr = await this.doc.embedPng(png);
      } catch { /* facultatif */ }
    }

    this.newPage(true);
    let y = this.header();
    y = this.parties(y);
    y = this.refLine(y);
    y = this.table(y);
    y = this.bottom(y);
    this.notes(y);
    this.footers();

    if (this.options.facturXml) {
      const at = this.options.generatedAt ?? new Date();
      await attachFileWithAFRelationship(this.doc, Buffer.from(this.options.facturXml, 'utf-8'), 'factur-x.xml', {
        mimeType: 'text/xml', description: 'Factur-X XML Invoice', creationDate: at, modificationDate: at, relationship: 'Data',
      });
    }
    const pdf = await this.doc.save();
    return { pdf, pageCount: this.pages.length };
  }

  // ─── Pages ────────────────────────────────────────────────────────────────

  private newPage(first = false) {
    this.page = this.doc.addPage([PAGE_W * K, PAGE_H * K]);
    this.pages.push(this.page);
    const sb = this.frame === 'sidebar';
    this.L = sb ? SIDEBAR_MAIN_L : SIDE;
    this.R = PAGE_W - SIDE;
    if (this.v.settings.pattern && !sb && first) this.pattern();
    if (sb) this.rect(0, 0, SIDEBAR_W, PAGE_H, { fill: this.primary });
    if (this.v.watermark) this.watermark();
  }

  /** Hauteur réservée en bas de page au pied (mentions légales, badge, pagination). */
  private footerTop(): number {
    const v = this.v;
    if (this.frame === 'sidebar') return PAGE_H - FOOT_BOTTOM - normalLH(8.5) - 4;
    const legalH = this.paraHeight(v.legal, this.legalWidth(), { size: 8.5, lh: 1.5 });
    return PAGE_H - FOOT_BOTTOM - Math.max(legalH, this.footerGroupH()) - 12 - 1;
  }

  /** Continue sur une nouvelle page si `h` ne tient pas ; renvoie le y de départ. */
  private ensure(y: number, h: number): number {
    if (y + h <= this.footerTop() - 8) return y;
    this.newPage();
    const v = this.v;
    const top = 52;
    this.text(`${v.title} · ${v.number} · ${v.labels.continuation}`, this.L, top, { size: 9, bold: true, color: C.slate500, ls: 0.1, upper: false });
    return top + normalLH(9) + 16;
  }

  private pattern() {
    // <img src=Pattern-4.svg style="right:-120px;top:-110px;width:420px;opacity:.07">
    const size = 420;
    const x = PAGE_W + 120 - size;
    const y = -110;
    const scale = (size / PATTERN_4_VIEWBOX) * K;
    for (const d of PATTERN_4_PATHS) {
      this.page.drawSvgPath(d, { x: x * K, y: (PAGE_H - y) * K, scale, color: color('#000000'), opacity: 0.07 });
    }
  }

  private watermark() {
    // left:58%; top:54%; translate(-50%,-50%) rotate(-32deg); 700 110px; ls .06em; opacity .07
    const size = this.v.watermarkSize ?? 110;
    const s: TextStyle = { size, bold: true, ls: 0.06 };
    const txt = this.v.watermark!;
    const w = this.width(txt, s);
    const h = normalLH(size);
    const cx = PAGE_W * 0.58; const cy = PAGE_H * 0.54;
    const a = (32 * Math.PI) / 180;
    // point bas-gauche de la ligne de base, avant rotation, relatif au centre (repère y vers le bas)
    const bx = -w / 2; const by = -h / 2 + baselineOffset(s);
    // rotation anti-horaire de 32° à l'écran = rotation horaire en repère y-bas
    const rx = bx * Math.cos(a) + by * Math.sin(a);
    const ry = -bx * Math.sin(a) + by * Math.cos(a);
    const cs = (s.ls ?? 0) * s.size * K;
    this.page.pushOperators(pushGraphicsState(), setCharacterSpacing(cs));
    this.page.drawText(txt, { x: (cx + rx) * K, y: (PAGE_H - (cy + ry)) * K, size: s.size * K, font: this.bold, color: color(this.primary), opacity: 0.07, rotate: degrees(32) });
    this.page.pushOperators(popGraphicsState());
  }

  // ─── En-têtes (5 compositions) ────────────────────────────────────────────

  private header(): number {
    switch (this.frame) {
      case 'band': return this.headerBand();
      case 'sidebar': return this.headerSidebar();
      case 'hero': return this.headerHero();
      case 'centered': return this.headerCentered();
      default: return this.headerStandard();
    }
  }

  private headerStandard(): number {
    const v = this.v;
    const top = 52;
    const above = v.settings.logo === 'above';
    const logo = this.hasLogo;
    const titleS: TextStyle = { size: 34, bold: true, ls: -0.01, color: C.ink };
    const subS: TextStyle = { size: 11, color: C.slate500 };
    const textColH = normalLH(34) + 6 + normalLH(11);
    let leftH: number; let tx: number; let ty: number;
    if (logo && above) {
      this.logoIn(this.L, top, 50, 50);
      leftH = 50 + 14 + textColH; tx = this.L; ty = top + 64;
    } else if (logo) {
      leftH = Math.max(50, textColH);
      this.logoIn(this.L, top + (leftH - 50) / 2, 50, 50);
      tx = this.L + 64; ty = top + (leftH - textColH) / 2;
    } else { leftH = textColH; tx = this.L; ty = top; }
    this.text(v.title, tx, ty, titleS);
    this.text([v.seller.name, v.seller.city].filter(Boolean).join(' · '), tx, ty + normalLH(34) + 6, subS);

    // Grille N° / émission / échéance, alignée à droite (colonnes auto, écart 18)
    const rows: { l: string; val: string; bold: boolean; accent: boolean }[] = [
      { l: v.labels.number, val: v.number, bold: true, accent: false },
      { l: v.labels.issue, val: v.issueDate, bold: false, accent: false },
      ...(v.due ? [{ l: v.due.label, val: v.due.value, bold: true, accent: true }] : []),
    ];
    const lab: TextStyle = { size: 11, color: C.slate500 };
    const c2w = Math.max(...rows.map((r) => this.width(r.val, { size: 11, bold: r.bold })));
    const c1w = Math.max(...rows.map((r) => this.width(r.l, lab)));
    const gx = this.R - c2w - 18 - c1w;
    const rh = normalLH(11);
    rows.forEach((r, i) => {
      const y = top + i * (rh + 6);
      this.text(r.l, gx, y, lab);
      this.text(r.val, this.R, y, { size: 11, bold: r.bold, color: r.accent ? this.accent : C.text }, 'right');
    });
    const gridH = rows.length * rh + (rows.length - 1) * 6;
    const ruleY = top + Math.max(leftH, gridH) + 26;
    this.hline(this.L, this.R, ruleY, 1, C.line);
    return ruleY + 1;
  }

  private headerBand(): number {
    const v = this.v;
    const white = C.white;
    const above = v.settings.logo === 'above';
    const logo = this.hasLogo;
    // Ligne 1 : logo + raison sociale / sous-titre, titre à droite
    const nameS: TextStyle = { size: 19, bold: true, color: white };
    const subS: TextStyle = { size: 10, color: blend(white, this.primary, 0.78) };
    const textColH = normalLH(19) + 4 + normalLH(10);
    let leftH: number; let tx: number; let ty: number;
    const top = 40;
    if (logo && above) { leftH = 50 + 14 + textColH; tx = SIDE; ty = top + 64; } else if (logo) { leftH = Math.max(50, textColH); tx = SIDE + 64; ty = top + (leftH - textColH) / 2; } else { leftH = textColH; tx = SIDE; ty = top; }
    const titleS: TextStyle = { size: 28, bold: true, ls: 0.05, color: this.accent };
    const row1H = Math.max(leftH, normalLH(28));
    const cellsTop = top + row1H + 28;
    const cellValH = (sz: number) => 14 + normalLH(8) + 4 + normalLH(sz) + 14;
    const cellH = Math.max(cellValH(12), cellValH(14));
    const bandH = cellsTop + 1 + cellH;
    this.rect(0, 0, PAGE_W, bandH, { fill: this.primary });
    if (v.settings.pattern) this.pattern();
    if (logo) {
      const ly = above ? top : top + (leftH - 50) / 2;
      this.rect(SIDE, ly, 50, 50, { fill: white, r: 12 });
      this.logoIn(SIDE + 5, ly + 5, 40, 40);
    }
    this.text(v.seller.name, tx, ty, nameS);
    this.text([v.seller.oneLineNoCountry, v.seller.id].filter(Boolean).join(' · '), tx, ty + normalLH(19) + 4, subS);
    this.text(v.title, PAGE_W - SIDE, top, titleS, 'right');
    // Cellules : N°, émission, échéance, Total TTC (cellule accent jusqu'au bord)
    this.hline(SIDE, PAGE_W - SIDE, cellsTop, 1, blend(white, this.primary, 0.18));
    const cw = (PAGE_W - 2 * SIDE) / 4;
    const cells = [
      { l: v.labels.number, val: v.number },
      { l: v.labels.issue, val: v.issueDate },
      { l: v.due?.label ?? '', val: v.due?.value ?? '' },
    ];
    const cy = cellsTop + 1;
    cells.forEach((c, i) => {
      const x = SIDE + i * cw;
      this.text(c.l, x, cy + 14, { size: 8, ls: 0.1, upper: true, color: blend(white, this.primary, 0.65) });
      this.text(c.val, x, cy + 14 + normalLH(8) + 4, { size: 12, bold: true, color: white });
    });
    const tx4 = SIDE + 3 * cw;
    this.rect(tx4, cy, PAGE_W - tx4, cellH, { fill: this.accent });
    this.text(v.labels.grandTotal, tx4 + 18, cy + 14, { size: 8, ls: 0.1, upper: true, color: blend(white, this.accent, 0.85) });
    this.text(v.grandTotal, tx4 + 18, cy + 14 + normalLH(8) + 4, { size: 14, bold: true, color: white });
    return bandH;
  }

  private headerSidebar(): number {
    const v = this.v;
    const p = this.primary;
    const white = C.white;
    const x = 28; const w = SIDEBAR_W - 56;
    let y = 52;
    // Bloc 1 : logo, raison sociale, coordonnées
    if (this.hasLogo) { this.rect(x, y, 52, 52, { fill: white, r: 12 }); this.logoIn(x + 5, y + 5, 42, 42); y += 52 + 12; }
    this.text(v.seller.name, x, y, { size: 16, bold: true, color: white });
    y += normalLH(16) + 12;
    const addr = [...v.seller.street, v.seller.cityLine, ...(v.seller.vat ? [v.seller.vat] : []), ...(v.seller.id ? [v.seller.id] : [])];
    const aS: TextStyle = { size: 10, lh: 1.6, color: blend(white, p, 0.8) };
    for (const l of addr) y += this.para(l, x, y, w, aS);
    // Bloc 2 : N°, dates
    y += 30;
    this.hline(x, x + w, y, 1, blend(white, p, 0.2));
    y += 1 + 22;
    const item = (label: string, val: string, acc = false) => {
      this.text(label, x, y, { size: 8, ls: 0.1, upper: true, color: blend(white, p, 0.65) });
      y += normalLH(8) + 3;
      this.text(val, x, y, { size: 12, bold: true, color: acc ? this.accent : white });
      y += normalLH(12);
    };
    item(v.labels.number, v.number); y += 12;
    item(v.labels.issue, v.issueDate);
    if (v.due) { y += 12; item(v.due.label, v.due.value, true); }
    // Bloc 3 : paiement + QR
    if (v.payment) {
      y += 30;
      this.hline(x, x + w, y, 1, blend(white, p, 0.2));
      y += 1 + 22;
      const pS: TextStyle = { size: 9.5, lh: 1.55, color: white };
      this.text(v.labels.paymentTerms, x, y, { size: 8, lh: 1.55, ls: 0.1, upper: true, color: blend(white, p, 0.65) });
      y += 8 * 1.55 + 8;
      if (v.payment.iban) { y += this.para(`${v.labels.iban} ${v.payment.iban}`, x, y, w, pS) + 8; }
      if (v.payment.bic) { y += this.para(`${v.labels.bic} ${v.payment.bic}`, x, y, w, pS) + 8; }
      if (this.qr) {
        y += 6;
        this.rect(x, y, 84, 84, { fill: white });
        this.image(this.qr, x + 5, y + 5, 74, 74);
        y += 84 + 8;
        this.text(v.labels.scanToPay, x, y, { ...pS, bold: true });
      }
    }
    // Mentions légales en bas de la colonne
    const lS: TextStyle = { size: 8, lh: 1.55, color: blend(white, p, 0.6) };
    const lh = this.paraHeight(v.legal, w, lS);
    this.para(v.legal, x, PAGE_H - 34 - lh, w, lS);

    // Zone principale : titre 40 px + trait accent
    const tS: TextStyle = { size: 40, bold: true, lh: 1, ls: -0.02, color: p };
    this.text(v.title, this.L, 52, tS);
    const barY = 52 + 40 + 6 + 10;
    this.rect(this.L, barY, 48, 4, { fill: this.accent });
    return barY + 4;
  }

  private headerHero(): number {
    const v = this.v;
    const top = 52;
    const rowH = Math.max(this.hasLogo ? 30 : 0, normalLH(12), normalLH(11));
    let nx = this.L;
    if (this.hasLogo) { this.logoIn(this.L, top + (rowH - 30) / 2, 30, 30); nx += 40; }
    this.text(v.seller.name, nx, top + (rowH - normalLH(12)) / 2, { size: 12, bold: true, color: C.ink });
    this.text(`${v.title} · ${v.number}`, this.R, top + (rowH - normalLH(11)) / 2, { size: 11, bold: true, ls: 0.2, color: C.ink }, 'right');
    // Montant à payer en 64 px + échéance, filet noir 2 px
    const bTop = top + rowH + 44;
    const leftH = normalLH(11) + 8 + 64;
    const rightH = normalLH(11) + 6 + normalLH(16);
    const blockH = Math.max(leftH, v.due ? rightH : 0);
    this.text(v.amountLabel, this.L, bTop + blockH - leftH, { size: 11, color: C.slate500 });
    this.text(v.grandTotal, this.L, bTop + blockH - 64, { size: 64, bold: true, lh: 1, ls: -0.035, color: this.primary });
    if (v.due) {
      this.text(v.due.label, this.R, bTop + blockH - rightH, { size: 11, color: C.slate500 }, 'right');
      this.text(v.due.value, this.R, bTop + blockH - normalLH(16), { size: 16, bold: true, color: C.ink }, 'right');
    }
    const ruleY = bTop + blockH + 30;
    this.hline(this.L, this.R, ruleY, 2, C.ink);
    return ruleY + 2;
  }

  private headerCentered(): number {
    const v = this.v;
    const cx = (this.L + this.R) / 2;
    let y = 48;
    if (this.hasLogo) {
      this.rect(cx - 30, y, 60, 60, { fill: this.primary, r: 30 });
      this.logoIn(cx - 21, y + 9, 42, 42);
      y += 60 + 10;
    }
    this.text(v.seller.name, cx, y, { size: 17, bold: true, color: C.ink }, 'center');
    y += normalLH(17) + 10;
    this.text([v.seller.oneLineNoCountry, v.seller.vat].filter(Boolean).join(' · '), cx, y, { size: 10, color: C.slate500 }, 'center');
    y += normalLH(10) + 10 + 14;
    const pS: TextStyle = { size: 14, bold: true, ls: 0.14, color: this.accent };
    const pw = this.width(v.title, pS) + 44;
    const ph = normalLH(14) + 16;
    this.rect(cx - pw / 2, y, pw, ph, { fill: this.v.theme.accentTint, r: ph / 2 });
    this.text(v.title, cx - pw / 2 + 22, y + 8, pS);
    y += ph + 10;
    const meta = [`${v.labels.number} ${v.number}`, `${v.labels.issue} ${v.issueDate}`, ...(v.due ? [`${v.due.label} ${v.due.value}`] : [])].join(' · ');
    this.text(meta, cx, y, { size: 11, color: C.slate600 }, 'center');
    return y + normalLH(11);
  }

  // ─── Parties ──────────────────────────────────────────────────────────────

  private parties(y: number): number {
    if (this.frame === 'sidebar') return this.partiesBuyer(y);
    if (this.frame === 'hero') return this.partiesRow(y);
    return this.partiesTwo(y);
  }

  private get labelColor() { return this.frame === 'hero' ? C.gray : this.accent; }

  private partiesTwo(y0: number): number {
    const v = this.v;
    const style = v.settings.layout.parties;
    const top = y0 + 28;
    const gap = 18;
    const colW = (this.R - this.L - gap) / 2;
    const pad = style === 'plain' ? { x: 0, y: 0 } : { x: 16, y: 14 };
    const border = style === 'plain' ? 0 : 1;
    const inner = colW - 2 * pad.x - 2 * border;
    const lab: TextStyle = { size: 9, bold: true, ls: 0.1, upper: true, color: this.labelColor };
    const content = (p: typeof v.seller) => {
      const lines = [...p.street, p.cityLine].filter(Boolean);
      let h = normalLH(9) + 4 + 4 + normalLH(12);
      for (const l of lines) h += 4 + this.paraHeight(l, inner, { size: 11 });
      if (p.vat) h += 4 + 4 + normalLH(10);
      if (p.id && p !== v.seller) h += 4 + normalLH(10);
      return h;
    };
    const h = Math.max(content(v.seller), content(v.buyer)) + 2 * pad.y + 2 * border;
    const draw = (p: typeof v.seller, heading: string, x: number, buyer: boolean) => {
      const band = this.frame === 'band' && style !== 'plain' && buyer;
      const bg = band ? mix(this.accent, 0.10) : style === 'card' ? mix(this.accent, 0.08) : undefined;
      const bd = band ? mix(this.accent, 0.40) : style === 'framed' ? C.line : style === 'card' ? mix(this.accent, 0.35) : undefined;
      const r = style === 'card' ? 12 : 0;
      if (bg) this.rect(x, top, colW, h, { fill: bg, r });
      if (bd) this.rect(x, top, colW, h, { stroke: bd, sw: 1, r });
      const cx = x + border + pad.x;
      let y = top + border + pad.y;
      this.text(heading, cx, y, lab);
      y += normalLH(9) + 4 + 4;
      this.text(p.name, cx, y, { size: 12, bold: true, color: C.ink });
      y += normalLH(12);
      for (const l of [...p.street, p.cityLine].filter(Boolean)) { y += 4; y += this.para(l, cx, y, inner, { size: 11 }); }
      if (p.vat) { y += 4 + 4; this.text(p.vat, cx, y, { size: 10, color: C.slate500 }); y += normalLH(10); }
      if (p.id && buyer) { y += 4; this.text(p.id, cx, y, { size: 10, color: C.slate500 }); }
    };
    draw(v.seller, v.labels.seller, this.L, false);
    draw(v.buyer, v.labels.buyer, this.L + colW + gap, true);
    return top + h;
  }

  private partiesBuyer(y0: number): number {
    const v = this.v;
    let y = y0 + 34;
    this.text(v.labels.buyer, this.L, y, { size: 9, bold: true, ls: 0.1, upper: true, color: this.labelColor });
    y += normalLH(9) + 6 + 4;
    this.text(v.buyer.name, this.L, y, { size: 16, bold: true, color: C.ink });
    y += normalLH(16) + 4;
    y += this.para(v.buyer.oneLine, this.L, y, this.R - this.L, { size: 11 });
    if (v.buyer.vat) { y += 4; this.text(v.buyer.vat, this.L, y, { size: 10, color: C.slate500 }); y += normalLH(10); }
    if (v.buyer.id) { y += 4; this.text(v.buyer.id, this.L, y, { size: 10, color: C.slate500 }); y += normalLH(10); }
    return y;
  }

  private partiesRow(y0: number): number {
    const v = this.v;
    const top = y0 + 24;
    const gap = 20;
    const colW = (this.R - this.L - 2 * gap) / 3;
    const base: TextStyle = { size: 10.5, lh: 1.55 };
    const lab: TextStyle = { size: 8, lh: 1.55, ls: 0.12, upper: true, color: C.gray };
    const col = (x: number, heading: string, p: typeof v.seller) => {
      let y = top;
      this.text(heading, x, y, lab); y += 8 * 1.55 + 6;
      this.text(p.name, x, y, { ...base, bold: true }); y += 10.5 * 1.55;
      y += this.para(p.oneLineNoCountry, x, y, colW, base);
      if (p.vat) { this.text(p.vat, x, y, { ...base, color: C.gray }); y += 10.5 * 1.55; }
      return y - top;
    };
    const h1 = col(this.L, v.labels.seller, v.seller);
    const h2 = col(this.L + colW + gap, v.labels.buyer, v.buyer);
    let y = top; const x = this.L + 2 * (colW + gap);
    this.text(v.labels.issue, x, y, lab); y += 8 * 1.55 + 6;
    this.text(v.issueDate, x, y, { ...base, bold: true }); y += 10.5 * 1.55;
    y += 8; this.text(v.labels.number, x, y, lab); y += 8 * 1.55 + 2;
    this.text(v.number, x, y, { ...base, bold: true }); y += 10.5 * 1.55;
    return top + Math.max(h1, h2, y - top);
  }

  private refLine(y0: number): number {
    const v = this.v;
    if (!v.refLine) return y0;
    const top = y0 + 18;
    const s: TextStyle = { size: 10, color: C.slate700 };
    const innerW = this.R - this.L - 3 - 28;
    const h = this.paraHeight(v.refLine, innerW, s) + 20;
    this.rect(this.L, top, this.R - this.L, h, { fill: C.surface });
    this.rect(this.L, top, 3, h, { fill: this.accent });
    this.para(v.refLine, this.L + 3 + 14, top + 10, innerW, s);
    return top + h;
  }

  // ─── Tableau ──────────────────────────────────────────────────────────────

  private columnGeometry(): { x: number; w: number; col: ViewColumn }[] {
    const cols = this.v.columns;
    const bordered = this.frame === 'centered';
    const innerL = this.L + (bordered ? 1 : 0) + 12;
    const innerR = this.R - (bordered ? 1 : 0) - 12;
    const fixed = cols.reduce((s, c) => s + (c.width ?? 0), 0);
    const flex = Math.max(0, innerR - innerL - fixed - 10 * (cols.length - 1));
    let x = innerL;
    return cols.map((col) => { const w = col.width ?? flex; const r = { x, w, col }; x += w + 10; return r; });
  }

  private tableHeader(y: number): number {
    const v = this.v;
    const style = v.settings.layout.table;
    const geo = this.columnGeometry();
    const bordered = this.frame === 'centered';
    const hS: TextStyle = { size: 9, bold: true, ls: 0.06, upper: true, color: style === 'filled' ? C.white : this.primary };
    const h = 10 + normalLH(9) + 10;
    const bg = style === 'filled' ? this.primary : style === 'zebra' ? mix(this.primary, 0.12) : undefined;
    const x0 = this.L + (bordered ? 1 : 0); const x1 = this.R - (bordered ? 1 : 0);
    if (bordered) y += 1; // bordure haute du tableau arrondi
    const ir = bordered ? 11 : 0; // overflow:hidden + border-radius 12 − bordure 1
    if (bg) this.rect(x0, y, x1 - x0, h, { fill: bg, r: [ir, ir, 0, 0] });
    for (const g of geo) this.text(g.col.label, g.col.align === 'right' ? g.x + g.w : g.x, y + 10, hS, g.col.align);
    let bottom = y + h;
    if (style === 'lines') { this.hline(this.L, this.R, bottom, 1.5, this.primary); bottom += 1.5; }
    return bottom;
  }

  private rowHeight(r: ViewRow, geo: { x: number; w: number; col: ViewColumn }[]): number {
    const s: TextStyle = { size: 10.5 };
    if (r.kind === 'group') return 22 + normalLH(10.5);
    let h = normalLH(10.5);
    for (const g of geo) {
      const t = r.cells[g.col.key] ?? '';
      h = Math.max(h, this.paraHeight(t, g.w, { ...s, bold: g.col.bold }) || normalLH(10.5));
      if (g.col.key === 'description' && r.details) h = Math.max(h, this.paraHeight(t, g.w, { ...s, bold: true }) + 2 + this.paraHeight(r.details, g.w, { size: 9.5, color: C.slate500 }));
    }
    return 22 + h;
  }

  private table(y0: number): number {
    const v = this.v;
    const style = v.settings.layout.table;
    const bordered = this.frame === 'centered';
    const geo = this.columnGeometry();
    const tableTop = y0 + 26;
    let y = this.ensure(tableTop, 80);
    const startY = y;
    y = this.tableHeader(y);
    let segTop = startY;
    const zebra = mix(this.primary, 0.05);
    let i = 0;
    for (const r of v.rows) {
      const h = this.rowHeight(r, geo) + (style === 'lines' ? 1 : 0);
      if (y + h > this.footerTop() - 8) {
        if (bordered) this.rect(this.L, segTop, this.R - this.L, y - segTop, { stroke: C.rowRule, sw: 1, r: 12 });
        const ny = this.ensure(PAGE_H, 0);
        segTop = ny;
        y = this.tableHeader(ny);
      }
      const x0 = this.L + (bordered ? 1 : 0); const x1 = this.R - (bordered ? 1 : 0);
      if (r.kind === 'group') {
        this.text(r.title ?? '', geo[0].x, y + 11, { size: 10.5, bold: true, color: this.primary });
        if (r.subtotal) this.text(r.subtotal, geo[geo.length - 1].x + geo[geo.length - 1].w, y + 11, { size: 10.5, bold: true, color: this.primary }, 'right');
      } else {
        const last = r === v.rows[v.rows.length - 1];
        const ir = bordered && last ? 11 : 0;
        if (style === 'zebra' && i % 2 === 1) this.rect(x0, y, x1 - x0, h, { fill: zebra, r: [0, 0, ir, ir] });
        for (const g of geo) {
          const t = r.cells[g.col.key] ?? '';
          const s: TextStyle = { size: 10.5, bold: g.col.bold, color: g.col.primary ? this.primary : C.text };
          const ph = this.para(t, g.x, y + 11, g.w, s, g.col.align);
          if (g.col.key === 'description' && r.details) this.para(r.details, g.x, y + 11 + ph + 2, g.w, { size: 9.5, color: C.slate500 });
        }
        i++;
      }
      y += h;
      if (style === 'lines') this.hline(this.L, this.R, y - 1, 1, C.rowRule);
    }
    if (bordered) this.rect(this.L, segTop, this.R - this.L, y + 1 - segTop, { stroke: C.rowRule, sw: 1, r: 12 });
    return y + (bordered ? 1 : 0);
  }

  // ─── Bas de page : TVA, paiement, totaux ─────────────────────────────────

  private bottom(y0: number): number {
    if (this.frame === 'band') return this.bottomBand(y0);
    if (this.frame === 'centered') return this.bottomCard(y0);
    return this.bottomStd(y0);
  }

  private taxLine(t: { rate: string; base: string; amount: string }) {
    const L = this.v.labels;
    return `${t.rate} · ${L.taxBase} ${t.base} · ${L.taxAmount} ${t.amount}`;
  }

  private bottomStd(y0: number): number {
    const v = this.v;
    const sb = this.frame === 'sidebar';
    const totW = sb ? 270 : 250; const gap = sb ? 16 : 26;
    const leftW = this.R - this.L - totW - gap;
    const lab: TextStyle = { size: 9, bold: true, ls: 0.1, upper: true, color: this.labelColor };
    const small: TextStyle = { size: 10, color: C.slate600 };
    // Hauteurs
    const taxH = v.taxes.length ? normalLH(9) + v.taxes.reduce((s, t) => s + 5 + this.paraHeight(this.taxLine(t), leftW, small), 0) : 0;
    const pay = v.payment && !sb ? v.payment : undefined;
    const payTextW = leftW - 70 - 14;
    const payLines = pay ? [...(pay.iban ? [`${v.labels.iban} ${pay.iban}`] : []), ...(pay.bic ? [`${v.labels.bic} ${pay.bic}`] : [])] : [];
    const payTextH = pay ? normalLH(9) + payLines.reduce((s, l) => s + 3 + this.paraHeight(l, payTextW, small), 0) + (this.qr ? 3 + normalLH(10) : 0) : 0;
    const payH = pay ? Math.max(this.qr ? 70 : 0, payTextH) : 0;
    const leftH = taxH + (taxH && payH ? 14 : 0) + payH;
    const plain = v.settings.layout.totals === 'plain';
    const grandH = (plain ? 10 + 2 : 24) + normalLH(16);
    const extraN = v.extraCharges.length;
    const rightH = (2 + extraN) * normalLH(11) + (2 + extraN) * 7 + 6 + grandH;
    const top = this.ensure(y0 + 22, Math.max(leftH, rightH));
    // Colonne gauche
    let y = top;
    if (v.taxes.length) {
      this.text(v.labels.taxBreakdown, this.L, y, lab); y += normalLH(9);
      for (const t of v.taxes) { y += 5; y += this.para(this.taxLine(t), this.L, y, leftW, small); }
      y += pay ? 14 : 0;
    }
    if (pay) {
      if (this.qr) {
        this.rect(this.L - 1, y - 1, 72, 72, { fill: C.line });
        this.rect(this.L, y, 70, 70, { fill: C.white });
        this.image(this.qr, this.L + 4, y + 4, 62, 62);
      }
      const tx = this.qr ? this.L + 70 + 14 : this.L;
      let ty = y;
      this.text(v.labels.paymentTerms, tx, ty, lab); ty += normalLH(9);
      for (const l of payLines) { ty += 3; ty += this.para(l, tx, ty, payTextW, small); }
      if (this.qr) { ty += 3; this.text(v.labels.scanToPay, tx, ty, { size: 10, bold: true, color: this.primary }); }
    }
    // Colonne droite : totaux
    const tx = this.R - totW;
    let ry = top;
    const row = (l: string, val: string) => {
      this.text(l, tx, ry, { size: 11, color: C.slate500 });
      this.text(val, this.R, ry, { size: 11 }, 'right');
      ry += normalLH(11) + 7;
    };
    row(v.labels.subtotal, v.subtotal);
    row(v.labels.taxTotal, v.taxTotal);
    for (const c of v.extraCharges) row(c.label, c.value);
    // ry = fin de la dernière rangée + écart 7 ; le bloc total a en plus margin-top 6
    this.grandBox(tx, ry + 6, totW);
    return Math.max(top + leftH, ry + 6 + grandH);
  }

  /** Bloc « Total TTC » des compositions Classique / Colonne / Montant. */
  private grandBox(x: number, y: number, w: number) {
    const v = this.v;
    const style = v.settings.layout.totals;
    const plain = style === 'plain';
    const h = (plain ? 12 : 24) + normalLH(16);
    const fg = style === 'block' ? C.white : C.ink;
    if (style === 'block') this.rect(x, y, w, h, { fill: this.primary, r: 8 });
    if (style === 'tint') this.rect(x, y, w, h, { fill: mix(this.accent, 0.14), r: 8 });
    if (plain) this.hline(x, x + w, y, 2, this.primary);
    const padX = plain ? 0 : 14;
    const cTop = plain ? y + 12 : y + 12;
    const inner = h - (plain ? 12 : 24);
    this.text(v.labels.grandTotal, x + padX, cTop + (inner - normalLH(12)) / 2, { size: 12, bold: true, color: fg });
    this.text(v.grandTotal, x + w - padX, cTop + (inner - normalLH(16)) / 2, { size: 16, bold: true, color: fg }, 'right');
  }

  private bottomBand(y0: number): number {
    const v = this.v;
    const W = this.R - this.L - 2;
    const w1 = (W * 1) / 3.4;
    const s: TextStyle = { size: 10, color: C.slate600 };
    const lab: TextStyle = { size: 9, bold: true, ls: 0.1, upper: true, color: this.primary };
    const inner = w1 - 32 - 1;
    const c1 = v.taxes.flatMap((t) => [`${t.rate} · ${v.labels.taxBase} ${t.base}`, `${v.labels.taxAmount} ${t.amount}`]);
    const c2 = v.payment ? [v.payment.iban, v.payment.bic].filter((x): x is string => !!x) : [];
    const colH = (lines: string[]) => normalLH(9) + lines.reduce((a, l) => a + 5 + this.paraHeight(l, inner, s), 0);
    const white = C.white;
    const r: TextStyle = { size: 10.5, color: blend(white, this.primary, 0.8) };
    const c3H = (2 + v.extraCharges.length) * normalLH(10.5) + (1 + v.extraCharges.length) * 6 + 6 + 4 + 1 + 8 + Math.max(normalLH(10.5), normalLH(17));
    const h = 28 + Math.max(colH(c1), colH(c2), c3H - 0);
    const top = this.ensure(y0 + 22, h + 2);
    this.rect(this.L, top, this.R - this.L, h + 2, { stroke: C.line, sw: 1 });
    const x1 = this.L + 1; const x2 = x1 + w1; const x3 = x2 + w1;
    this.vline(x2 - 1, top + 1, top + 1 + h, 1, C.line);
    this.vline(x3 - 1, top + 1, top + 1 + h, 1, C.line);
    const col = (x: number, title: string, lines: string[]) => {
      let y = top + 1 + 14;
      this.text(title, x + 16, y, lab); y += normalLH(9);
      for (const l of lines) { y += 5; y += this.para(l, x + 16, y, inner, s); }
    };
    if (v.taxes.length) col(x1, v.labels.taxBreakdown, c1);
    if (v.payment) col(x2, v.labels.paymentTerms, c2);
    // Colonne totaux (fond principal)
    this.rect(x3, top + 1, this.R - 1 - x3, h, { fill: this.primary });
    let y = top + 1 + 14;
    const rx = x3 + 16; const rr = this.R - 1 - 16;
    const row = (l: string, val: string) => { this.text(l, rx, y, r); this.text(val, rr, y, r, 'right'); y += normalLH(10.5) + 6; };
    row(v.labels.subtotal, v.subtotal);
    row(v.labels.taxTotal, v.taxTotal);
    for (const c of v.extraCharges) row(c.label, c.value);
    // y = après la dernière rangée + gap 6 ; la ligne total a margin-top 4, border-top 1, padding-top 8
    y += 4;
    this.hline(rx, rr, y, 1, blend(white, this.primary, 0.25));
    const gy = y + 1 + 8;
    // alignement sur la ligne de base (align-items: baseline)
    const lb: TextStyle = { size: 10.5, bold: true, color: white };
    const gv: TextStyle = { size: 17, bold: true, color: this.accent };
    const base = gy + Math.max(baselineOffset(lb), baselineOffset(gv));
    this.text(v.labels.grandTotal, rx, base - baselineOffset(lb), lb);
    this.text(v.grandTotal, rr, base - baselineOffset(gv), gv, 'right');
    return top + h + 2;
  }

  private bottomCard(y0: number): number {
    const v = this.v;
    const gap = 16;
    const w = (this.R - this.L - gap) / 2;
    const s: TextStyle = { size: 10, color: C.slate600 };
    const lab: TextStyle = { size: 9, bold: true, ls: 0.1, upper: true, color: this.accent };
    const lines = [
      ...(v.payment?.iban ? [`${v.labels.iban} ${v.payment.iban}`] : []),
      ...(v.payment?.bic ? [`${v.labels.bic} ${v.payment.bic}`] : []),
    ];
    const taxLines = v.taxes.map((t) => `${v.labels.taxAmount} ${t.rate} · ${t.amount}`);
    const inner = w - 36;
    const leftH = 32 + normalLH(9) + lines.reduce((a, l) => a + 6 + this.paraHeight(l, inner, s), 0) + taxLines.reduce((a, l) => a + 6 + 4 + this.paraHeight(l, inner, s), 0);
    const rightH = 36 + normalLH(10.5) + 10 + Math.max(normalLH(12), normalLH(26)) + v.extraCharges.length * (normalLH(10.5) + 6);
    const h = Math.max(leftH, rightH);
    const top = this.ensure(y0 + 24, h);
    // Carte paiement
    this.rect(this.L, top, w, h, { fill: C.surface, r: 14 });
    let y = top + 16;
    this.text(v.labels.paymentTerms, this.L + 18, y, lab); y += normalLH(9);
    for (const l of lines) { y += 6; y += this.para(l, this.L + 18, y, inner, s); }
    for (const l of taxLines) { y += 6 + 4; y += this.para(l, this.L + 18, y, inner, s); }
    // Carte total
    const x = this.L + w + gap;
    this.rect(x, top, w, h, { fill: this.primary, r: 14 });
    const white = C.white;
    const r: TextStyle = { size: 10.5, color: blend(white, this.primary, 0.85) };
    let ry = top + 18;
    this.text(`${v.labels.subtotal} ${v.subtotal}`, x + 20, ry, r);
    this.text(`${v.labels.taxTotal} ${v.taxTotal}`, x + w - 20, ry, r, 'right');
    ry += normalLH(10.5);
    for (const c of v.extraCharges) { ry += 6; this.text(c.label, x + 20, ry, r); this.text(c.value, x + w - 20, ry, r, 'right'); ry += normalLH(10.5); }
    // dernière rangée collée en bas (justify-content: space-between)
    const lb: TextStyle = { size: 12, bold: true, color: white };
    const gv: TextStyle = { size: 26, bold: true, color: white };
    const rowH = Math.max(normalLH(12), normalLH(26));
    const rowTop = top + h - 18 - rowH;
    const base = rowTop + Math.max(baselineOffset(lb), baselineOffset(gv));
    this.text(v.labels.grandTotal, x + 20, base - baselineOffset(lb), lb);
    this.text(v.grandTotal, x + w - 20, base - baselineOffset(gv), gv, 'right');
    return top + h;
  }

  private notes(y0: number) {
    const v = this.v;
    if (!v.notes) return;
    const s: TextStyle = { size: 10, color: C.slate600 };
    const h = this.paraHeight(v.notes, this.R - this.L, s);
    const top = this.ensure(y0 + 22, h);
    this.para(v.notes, this.L, top, this.R - this.L, s);
  }

  // ─── Pied de page ─────────────────────────────────────────────────────────

  private legalWidth(): number {
    // max-width 500, dans un flex avec le groupe de droite (gap 20)
    const right = this.footerRightWidth();
    return Math.min(500, PAGE_W - 2 * SIDE - 20 - right);
  }

  /** Hauteur du groupe de droite du pied (flex align-items:center) : badge, mention Services, pagination. */
  private footerGroupH(): number {
    const v = this.v;
    return Math.max(v.badge ? 3 + normalLH(8) + 3 + 2 : 0, normalLH(8.5), v.poweredBy ? Math.max(11, normalLH(8)) : 0);
  }

  private footerRightWidth(): number {
    const v = this.v;
    let w = this.width(`${v.labels.page} 1 ${v.labels.of} 1`, { size: 8.5 });
    if (v.badge) w += 10 + this.width(v.badge, { size: 8, bold: true }) + 14 + 2;
    if (v.poweredBy) w += 10 + this.width(v.labels.poweredBy, { size: 8 }) + 6 + this.servicesLogoWidth() + 10 + 1;
    return w;
  }

  private servicesLogoWidth() {
    return this.servicesLogo ? (this.servicesLogo.width / this.servicesLogo.height) * 11 : 0;
  }

  private footers() {
    const v = this.v;
    const total = this.pages.length;
    this.pages.forEach((p, i) => {
      this.page = p;
      const sb = this.frame === 'sidebar';
      const bottom = PAGE_H - FOOT_BOTTOM;
      const pageTxt = `${v.labels.page} ${i + 1} ${v.labels.of} ${total}`;
      const small: TextStyle = { size: 8.5, color: C.slate400 };
      // Groupe de droite (aligné en bas) : [émis avec Services] | [badge] Page x sur y
      const badgeS: TextStyle = { size: 8, bold: true, color: C.slate600 };
      const badgeH = 3 + normalLH(8) + 3 + 2;
      const groupH = this.footerGroupH();
      const gTop = bottom - groupH;
      let x = PAGE_W - SIDE;
      const pw = this.width(pageTxt, small);
      this.text(pageTxt, x, gTop + (groupH - normalLH(8.5)) / 2, small, 'right');
      x -= pw;
      if (v.badge) {
        const bw = this.width(v.badge, badgeS) + 14 + 2;
        x -= 10 + bw;
        this.rect(x, gTop + (groupH - badgeH) / 2, bw, badgeH, { stroke: C.slate300, sw: 1, r: 4 });
        this.text(v.badge, x + 1 + 7, gTop + (groupH - badgeH) / 2 + 1 + 3, badgeS);
      }
      if (v.poweredBy) {
        const lw = this.servicesLogoWidth();
        const tS: TextStyle = { size: 8, color: C.slate400 };
        const tw = this.width(v.labels.poweredBy, tS);
        const blockW = tw + 6 + lw + 10 + 1;
        const bx = sb ? SIDEBAR_MAIN_L : x - 10 - blockW;
        this.text(v.labels.poweredBy, bx, gTop + (groupH - normalLH(8)) / 2, tS);
        if (this.servicesLogo) this.image(this.servicesLogo, bx + tw + 6, gTop + (groupH - 11) / 2, lw, 11);
        this.vline(bx + blockW - 1, gTop + (groupH - 11) / 2, gTop + (groupH + 11) / 2, 1, C.line);
      }
      if (!sb) {
        const lS: TextStyle = { size: 8.5, lh: 1.5, color: C.slate400 };
        const lw = this.legalWidth();
        const lh = this.paraHeight(v.legal, lw, lS);
        const h = Math.max(lh, groupH);
        this.hline(SIDE, PAGE_W - SIDE, bottom - h - 12 - 1, 1, C.line);
        this.para(v.legal, SIDE, bottom - lh, lw, lS);
      }
    });
  }
}

export async function renderDocumentPdf(view: DocumentView, options: RenderDocumentPdfOptions = {}): Promise<RenderedDocumentPdf> {
  return new DocumentPdfRenderer(view, options).render();
}
