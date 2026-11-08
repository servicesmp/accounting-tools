"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfCanvas = exports.PX = exports.CANVAS_PAGE_H = exports.CANVAS_PAGE_W = void 0;
exports.pdfColor = pdfColor;
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
exports.CANVAS_PAGE_W = 794;
exports.CANVAS_PAGE_H = 1123;
exports.PX = 595.28 / exports.CANVAS_PAGE_W; // px → pt
/** Métriques Liberation Sans (unitsPerEm 2048) — repli si fontkit n'expose pas la police. */
const LIBERATION = { asc: 1854 / 2048, desc: 434 / 2048, gap: 67 / 2048 };
const BASELINE_NUDGE = 0.5;
function pdfColor(hex) {
    const h = (hex || '#000000').replace('#', '');
    return (0, pdf_lib_1.rgb)(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}
function assetPath(...p) {
    return path_1.default.join(__dirname, '../../assets', ...p);
}
class PdfCanvas {
    constructor(doc) {
        this.pages = [];
        this.chillaxBody = false;
        this.doc = doc;
    }
    /**
     * `body: 'chillax'` : corps en Chillax (Regular / Bold), comme la webapp — relevé de temps.
     * Chillax n'a ni espace insécable ni flèche : `prep` les remplace (espace, tiret demi-cadratin).
     */
    static async create(options = {}) {
        const doc = await pdf_lib_1.PDFDocument.create();
        doc.registerFontkit(fontkit_1.default);
        const c = new PdfCanvas(doc);
        // Chillax (OpenType CFF) est embarquée entière : le sous-ensemble produit par pdf-lib sur une
        // police CFF est invalide pour certains lecteurs (poppler). Liberation Sans (TrueType) est sous-ensemblée.
        const cache = new Map();
        const embed = (file, subset) => {
            if (!cache.has(file))
                cache.set(file, doc.embedFont(fs_1.default.readFileSync(assetPath('fonts', file)), { subset }));
            return cache.get(file);
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
    newPage() {
        this.page = this.doc.addPage([exports.CANVAS_PAGE_W * exports.PX, exports.CANVAS_PAGE_H * exports.PX]);
        this.pages.push(this.page);
        return this.page;
    }
    async embedImage(bytes) {
        if (!bytes || bytes.length === 0)
            return undefined;
        try {
            return bytes[0] === 0x89 && bytes[1] === 0x50 ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
        }
        catch {
            return undefined;
        }
    }
    async embedAsset(...p) {
        try {
            return await this.doc.embedPng(fs_1.default.readFileSync(assetPath(...p)));
        }
        catch {
            return undefined;
        }
    }
    // ─── Polices et métriques ──────────────────────────────────────────────────
    font(s) {
        const heading = s.family === 'heading';
        return heading ? (s.bold ? this.fonts.headingBold : this.fonts.heading) : (s.bold ? this.fonts.bodyBold : this.fonts.body);
    }
    metrics(s) {
        const fk = this.font(s).embedder?.font;
        if (!fk || !fk.unitsPerEm)
            return LIBERATION;
        return { asc: Math.abs(fk.ascent) / fk.unitsPerEm, desc: Math.abs(fk.descent) / fk.unitsPerEm, gap: Math.max(0, fk.lineGap || 0) / fk.unitsPerEm };
    }
    /** Hauteur de ligne (px) : `lh` × taille, sinon « normale » (métriques arrondies au pixel). */
    lineHeight(s) {
        if (s.lh)
            return s.lh * s.size;
        const m = this.metrics(s);
        return Math.round(m.asc * s.size) + Math.round(m.desc * s.size) + Math.round(m.gap * s.size);
    }
    baselineOffset(s) {
        const m = this.metrics(s);
        const a = Math.round(m.asc * s.size);
        const d = Math.round(m.desc * s.size);
        return (this.lineHeight(s) - (a + d)) / 2 + a + BASELINE_NUDGE;
    }
    prep(t, s) {
        let txt = String(t ?? '').replace(/[\r\n\t]+/g, ' ');
        // Glyphes absents de Chillax : espaces insécables → espace, flèche → tiret.
        if (this.chillaxBody || s.family === 'heading')
            txt = txt.replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/\u2192/g, '–');
        return s.upper ? txt.toLocaleUpperCase('fr-FR') : txt;
    }
    /** Segments sans crénage interne, placés aux positions exactes (pdf-lib n'applique pas le crénage). */
    shape(txt, s) {
        const font = this.font(s);
        const fk = font.embedder?.font;
        const ls = (s.ls ?? 0) * s.size;
        if (!fk) {
            const w = font.widthOfTextAtSize(txt, s.size) + ls * [...txt].length;
            return { segments: [{ text: txt, x: 0 }], width: w };
        }
        const run = fk.layout(txt);
        const scale = s.size / fk.unitsPerEm;
        const segments = [];
        let x = 0;
        let cur = '';
        let curX = 0;
        run.glyphs.forEach((g, i) => {
            const chars = String.fromCodePoint(...g.codePoints);
            if (!cur)
                curX = x;
            cur += chars;
            const adv = run.positions[i].xAdvance;
            x += adv * scale + ls * chars.length;
            if (adv !== g.advanceWidth) {
                segments.push({ text: cur, x: curX });
                cur = '';
            }
        });
        if (cur)
            segments.push({ text: cur, x: curX });
        return { segments, width: x };
    }
    width(t, s) {
        const txt = this.prep(t, s);
        return txt ? this.shape(txt, s).width : 0;
    }
    /** Ligne de texte ; `top` = haut de la boîte de ligne. */
    text(t, x, top, s, align = 'left', opacity) {
        const txt = this.prep(t, s);
        if (!txt)
            return;
        const shaped = this.shape(txt, s);
        const dx = align === 'right' ? -shaped.width : align === 'center' ? -shaped.width / 2 : 0;
        const base = Math.round(top + this.baselineOffset(s));
        const cs = (s.ls ?? 0) * s.size * exports.PX;
        if (cs)
            this.page.pushOperators((0, pdf_lib_1.pushGraphicsState)(), (0, pdf_lib_1.setCharacterSpacing)(cs));
        for (const seg of shaped.segments) {
            this.page.drawText(seg.text, {
                x: (x + dx + seg.x) * exports.PX, y: (exports.CANVAS_PAGE_H - base) * exports.PX, size: s.size * exports.PX, font: this.font(s),
                color: pdfColor(s.color ?? '#1F2937'), ...(opacity !== undefined ? { opacity } : {}),
            });
        }
        if (cs)
            this.page.pushOperators((0, pdf_lib_1.popGraphicsState)());
    }
    /** Texte tronqué avec « … » s'il dépasse `maxW` (white-space:nowrap; text-overflow:ellipsis). */
    textClip(t, x, top, maxW, s, align = 'left') {
        let txt = this.prep(t, s);
        if (this.width(txt, { ...s, upper: false }) <= maxW) {
            this.text(txt, x, top, { ...s, upper: false }, align);
            return;
        }
        const chars = [...txt];
        while (chars.length && this.width(chars.join('') + '…', { ...s, upper: false }) > maxW)
            chars.pop();
        txt = chars.join('').trimEnd() + '…';
        this.text(txt, x, top, { ...s, upper: false }, align);
    }
    /** Découpe aux espaces et traits d'union ; un mot trop long est coupé au caractère. */
    wrap(t, maxW, s) {
        const st = { ...s, upper: false };
        const parts = [];
        for (const w of this.prep(t, s).split(' ').filter(Boolean)) {
            w.split(/(?<=\p{L}-)(?=\p{L})/u).forEach((piece, i) => parts.push({ t: piece, sep: i === 0 ? ' ' : '' }));
        }
        const lines = [];
        let cur = '';
        const push = (w) => {
            // Mot plus large que la ligne : coupé au caractère (overflow-wrap:anywhere).
            if (this.width(w, st) <= maxW) {
                cur = w;
                return;
            }
            let piece = '';
            for (const ch of w) {
                if (piece && this.width(piece + ch, st) > maxW) {
                    lines.push(piece);
                    piece = ch;
                }
                else
                    piece += ch;
            }
            cur = piece;
        };
        for (const { t: w, sep } of parts) {
            const test = cur ? `${cur}${sep}${w}` : w;
            if (cur && this.width(test, st) > maxW + 0.01) {
                lines.push(cur);
                push(w);
            }
            else if (!cur)
                push(w);
            else
                cur = test;
        }
        if (cur)
            lines.push(cur);
        return lines;
    }
    /** Paragraphe (une chaîne, sauts de ligne respectés) ; renvoie les lignes. */
    lines(t, maxW, s) {
        return String(t ?? '').split('\n').flatMap((p) => (p.trim() ? this.wrap(p, maxW, s) : ['']));
    }
    paraHeight(t, maxW, s) {
        return this.lines(t, maxW, s).length * this.lineHeight(s);
    }
    /** Dessine un paragraphe ; renvoie sa hauteur. */
    para(t, x, top, maxW, s, align = 'left') {
        const lines = this.lines(t, maxW, s);
        const lh = this.lineHeight(s);
        lines.forEach((l, i) => this.text(l, align === 'right' ? x + maxW : align === 'center' ? x + maxW / 2 : x, top + i * lh, { ...s, upper: false }, align));
        return lines.length * lh;
    }
    // ─── Formes ──────────────────────────────────────────────────────────────
    rect(x, y, w, h, o) {
        if (w <= 0 || h <= 0)
            return;
        const r = Math.max(0, Math.min(o.r ?? 0, w / 2, h / 2));
        if (r > 0) {
            const path = (i) => {
                const a = Math.max(0, r - i);
                const arc = (ex, ey) => (a > 0 ? ` A${a},${a} 0 0 1 ${ex},${ey}` : ` L${ex},${ey}`);
                return `M${x + Math.max(r, i)},${y + i} H${x + w - Math.max(r, i)}${arc(x + w - i, y + Math.max(r, i))}`
                    + ` V${y + h - Math.max(r, i)}${arc(x + w - Math.max(r, i), y + h - i)}`
                    + ` H${x + Math.max(r, i)}${arc(x + i, y + h - Math.max(r, i))}`
                    + ` V${y + Math.max(r, i)}${arc(x + Math.max(r, i), y + i)} Z`;
            };
            if (o.fill)
                this.page.drawSvgPath(path(0), { x: 0, y: exports.CANVAS_PAGE_H * exports.PX, scale: exports.PX, color: pdfColor(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
            if (o.stroke)
                this.page.drawSvgPath(path((o.sw ?? 1) / 2), { x: 0, y: exports.CANVAS_PAGE_H * exports.PX, scale: exports.PX, borderColor: pdfColor(o.stroke), borderWidth: (o.sw ?? 1) * exports.PX });
            return;
        }
        if (o.fill)
            this.page.drawRectangle({ x: x * exports.PX, y: (exports.CANVAS_PAGE_H - y - h) * exports.PX, width: w * exports.PX, height: h * exports.PX, color: pdfColor(o.fill), ...(o.opacity !== undefined ? { opacity: o.opacity } : {}) });
        if (o.stroke) {
            const sw = o.sw ?? 1;
            this.page.drawRectangle({ x: (x + sw / 2) * exports.PX, y: (exports.CANVAS_PAGE_H - y - h + sw / 2) * exports.PX, width: (w - sw) * exports.PX, height: (h - sw) * exports.PX, borderColor: pdfColor(o.stroke), borderWidth: sw * exports.PX });
        }
    }
    hline(x1, x2, y, t, c) { this.rect(x1, y, x2 - x1, t, { fill: c }); }
    vline(x, y1, y2, t, c) { this.rect(x, y1, t, y2 - y1, { fill: c }); }
    circle(cx, cy, r, fill) {
        this.page.drawCircle({ x: cx * exports.PX, y: (exports.CANVAS_PAGE_H - cy) * exports.PX, size: r * exports.PX, color: pdfColor(fill) });
    }
    image(img, x, y, w, h) {
        this.page.drawImage(img, { x: x * exports.PX, y: (exports.CANVAS_PAGE_H - y - h) * exports.PX, width: w * exports.PX, height: h * exports.PX });
    }
    /** Image contenue dans une boîte (object-fit: contain), alignée à gauche et centrée verticalement. */
    imageContain(img, x, y, w, h, align = 'left') {
        const s = Math.min(w / img.width, h / img.height);
        const iw = img.width * s;
        const ih = img.height * s;
        const dx = align === 'center' ? (w - iw) / 2 : align === 'right' ? w - iw : 0;
        this.image(img, x + dx, y + (h - ih) / 2, iw, ih);
    }
    /** Filigrane diagonal, comme sur les documents commerciaux. */
    watermark(text, size, color) {
        const s = { size, bold: true, ls: 0.06, color };
        const w = this.width(text, s);
        const cx = exports.CANVAS_PAGE_W * 0.58;
        const cy = exports.CANVAS_PAGE_H * 0.54;
        const ang = (32 * Math.PI) / 180;
        const rx = -(w / 2) * Math.cos(ang);
        const ry = (w / 2) * Math.sin(ang);
        const cs = s.ls * size * exports.PX;
        this.page.pushOperators((0, pdf_lib_1.pushGraphicsState)(), (0, pdf_lib_1.setCharacterSpacing)(cs));
        this.page.drawText(text, { x: (cx + rx) * exports.PX, y: (exports.CANVAS_PAGE_H - (cy + ry)) * exports.PX, size: size * exports.PX, font: this.font(s), color: pdfColor(color), opacity: 0.07, rotate: (0, pdf_lib_1.degrees)(32) });
        this.page.pushOperators((0, pdf_lib_1.popGraphicsState)());
    }
}
exports.PdfCanvas = PdfCanvas;
//# sourceMappingURL=PdfCanvas.js.map