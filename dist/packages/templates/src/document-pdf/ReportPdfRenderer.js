"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPdfRenderer = void 0;
exports.renderReportPdf = renderReportPdf;
const report_html_1 = require("../document/report-html");
const color_1 = require("../document/color");
const PdfCanvas_1 = require("./PdfCanvas");
const PDFA3Compliance_1 = require("../utils/PDFA3Compliance");
const PAD_X = 60;
const PAD_TOP = 56;
const FOOT_BOTTOM = 34;
const GAP = 26;
const CONTENT_W = PdfCanvas_1.CANVAS_PAGE_W - 2 * PAD_X;
const C = {
    ink: '#111827', text: '#1F2937', gray: '#6B7280', gray400: '#9CA3AF', gray500: '#4B5563',
    line: '#F3F4F6', line2: '#E5E7EB', surface: '#FAFAFA', white: '#ffffff', slate400: '#94a3b8',
};
class ReportPdfRenderer {
    constructor(view, options = {}) {
        this.options = options;
        this.v = view;
    }
    get primary() { return this.v.theme.primary; }
    get accent() { return this.v.theme.accent; }
    toneFg(t, fallback) { return t ? (t === 'primary' ? this.primary : t === 'accent' ? this.accent : report_html_1.REPORT_TONE_COLORS[t].fg) : fallback; }
    toneSolid(t, fallback = C.gray400) { return t ? (t === 'primary' ? this.primary : t === 'accent' ? this.accent : report_html_1.REPORT_TONE_SOLID[t]) : fallback; }
    H(size, bold = false, lh = 1.2) { return { size, family: 'heading', bold, lh, color: C.ink }; }
    async render() {
        const v = this.v;
        this.c = await PdfCanvas_1.PdfCanvas.create();
        const doc = this.c.doc;
        await (0, PDFA3Compliance_1.setupPDFA3Compliance)(doc, {
            title: v.title, author: v.issuer.name, subject: v.typeLabel, creator: 'accounting-tools',
            keywords: [v.typeLabel, v.kind, 'PDF/A-3'], conformanceLevel: 'EN 16931', facturX: false,
        });
        doc.setTitle(v.title);
        doc.setAuthor(v.issuer.name);
        doc.setSubject(v.typeLabel);
        doc.setProducer('accounting-tools');
        if (this.options.generatedAt)
            doc.setCreationDate(this.options.generatedAt);
        if (v.showLogo)
            this.logo = await this.c.embedImage(this.options.logo);
        if (v.poweredBy)
            this.servicesLogo = await this.c.embedAsset('brand', 'services-logo.png');
        this.newPage();
        let y = this.header(PAD_TOP);
        for (const b of v.blocks) {
            y = this.gap(y);
            y = this.block(b, PAD_X, CONTENT_W, y);
        }
        this.sources(y);
        this.footers();
        const pdf = await doc.save();
        return { pdf, pageCount: this.c.pages.length };
    }
    // ─── Pages et flux ────────────────────────────────────────────────────────
    newPage() {
        this.c.newPage();
        if (this.v.watermark)
            this.c.watermark(this.v.watermark, this.v.watermarkSize ?? 110, this.primary);
    }
    get footerTop() {
        return PdfCanvas_1.CANVAS_PAGE_H - FOOT_BOTTOM - this.c.lineHeight({ size: 9 }) - 10 - 1 - 8;
    }
    /** Place `h` sur la page courante, ou sur une nouvelle page ; renvoie le y de départ. */
    ensure(y, h) {
        if (y + h <= this.footerTop)
            return y;
        this.newPage();
        const top = 52;
        const s = { size: 9, bold: true, color: C.gray, ls: 0.1, upper: true };
        this.c.textClip(`${this.v.title}, ${this.v.labels.continuation}`, PAD_X, top, CONTENT_W, s);
        return top + this.c.lineHeight(s) + 16;
    }
    /** Espace entre blocs, sauf en tête de page. */
    gap(y) {
        return y + GAP;
    }
    /** Dessine une suite d'unités insécables, en paginant entre elles ; renvoie le y final. */
    flow(y, units) {
        for (const u of units) {
            y = this.ensure(y, u.h);
            u.draw(y);
            y += u.h;
        }
        return y;
    }
    // ─── En-tête ──────────────────────────────────────────────────────────────
    header(y) {
        const v = this.v;
        const c = this.c;
        const x = PAD_X;
        // Marque (logo 28 px ou nom) et libellé du genre à droite.
        const typeS = { size: 10, bold: true, ls: 0.14, upper: true, color: C.gray };
        const brandH = 28;
        if (this.logo)
            c.imageContain(this.logo, x, y, 160, brandH);
        else
            c.textClip(v.issuer.name, x, y + (brandH - c.lineHeight({ size: 14, bold: true })) / 2, CONTENT_W - 220, { size: 14, bold: true, color: C.ink });
        c.text(v.typeLabel, x + CONTENT_W, y + (brandH - c.lineHeight(typeS)) / 2, typeS, 'right');
        y += brandH + 16;
        const titleS = { size: 32, family: 'heading', bold: true, lh: 1.05, ls: -0.02, color: C.ink };
        y += c.para(v.title, x, y, CONTENT_W, titleS);
        if (v.subtitle) {
            y += 6;
            y += c.para(v.subtitle, x, y, CONTENT_W, { size: 15, color: this.accent });
        }
        if (v.meta.length) {
            y += 16;
            const cols = Math.min(4, v.meta.length);
            const colW = (CONTENT_W - 14 * (cols - 1)) / cols;
            const labS = { size: 12, color: C.gray };
            const valS = { size: 12, bold: true, color: C.ink };
            let rowH = 0;
            v.meta.forEach((m, i) => {
                const cx = x + i * (colW + 14);
                c.textClip(m.label, cx, y, colW, labS);
                const vh = c.para(m.value, cx, y + c.lineHeight(labS) + 2, colW, valS);
                rowH = Math.max(rowH, c.lineHeight(labS) + 2 + vh);
            });
            y += rowH;
        }
        y += 18;
        c.hline(x, x + CONTENT_W, y, 2, this.primary);
        return y + 2;
    }
    // ─── Blocs ────────────────────────────────────────────────────────────────
    block(b, x, w, y) {
        switch (b.type) {
            case 'paragraph': return this.paragraph(b, x, w, y);
            case 'callout': return this.callout(b, x, w, y);
            case 'list': return this.list(b, x, w, y);
            case 'rows': return this.rows(b, x, w, y);
            case 'stats': return this.stats(b, x, w, y);
            case 'bars': return this.bars(b, x, w, y);
            case 'distribution': return this.distribution(b, x, w, y);
            case 'people': return this.people(b, x, w, y);
            case 'actions': return this.actions(b, x, w, y);
            case 'agenda': return this.agenda(b, x, w, y);
            case 'columns': return this.columns(b, x, w, y);
        }
    }
    /** Titre de section (h2 + note), insécable avec ce qui suit via `units`. */
    sectionTitle(title, note, x, w, size = 18) {
        if (!title)
            return null;
        const c = this.c;
        const hs = this.H(size);
        const h = c.lineHeight(hs);
        return {
            h,
            draw: (y) => {
                const tw = Math.min(c.width(title, hs), w);
                c.textClip(title, x, y, w, hs);
                if (note && tw + 10 < w)
                    c.textClip(note, x + tw + 10, y + (h - c.lineHeight({ size: 12 })) / 2 + 1, w - tw - 10, { size: 12, color: C.gray });
            },
        };
    }
    paragraph(b, x, w, y) {
        const c = this.c;
        const units = [];
        const bodyS = { size: 14, lh: 1.65, color: C.text };
        const lines = c.lines(b.text, w, bodyS);
        const lh = c.lineHeight(bodyS);
        if (b.title || b.badge) {
            const hs = this.H(20);
            const th = Math.max(b.title ? c.lineHeight(hs) : 0, 20);
            // Titre + badge + deux premières lignes, insécables.
            const first = lines.slice(0, 2);
            units.push({
                h: th + 10 + first.length * lh,
                draw: (yy) => {
                    let bx = x;
                    if (b.title) {
                        c.textClip(b.title, x, yy, w - 120, hs);
                        bx = x + Math.min(c.width(b.title, hs), w - 120) + 10;
                    }
                    if (b.badge)
                        this.badge(b.badge, bx, yy + (th - 20) / 2);
                    first.forEach((l, i) => c.text(l, x, yy + th + 10 + i * lh, bodyS));
                },
            });
            lines.slice(2).forEach((l) => units.push({ h: lh, draw: (yy) => c.text(l, x, yy, bodyS) }));
        }
        else {
            lines.forEach((l) => units.push({ h: lh, draw: (yy) => c.text(l, x, yy, bodyS) }));
        }
        return this.flow(y, units);
    }
    /** Pastille « Fils d'Iro » : 20 px de haut, point de couleur, texte 10 px. */
    badge(text, x, y) {
        const c = this.c;
        const s = { size: 10, bold: true, color: C.ink };
        const w = 8 + 6 + 6 + c.width(text, s) + 8;
        c.rect(x, y, w, 20, { fill: C.line, r: 6 });
        c.circle(x + 8 + 3, y + 10, 3, this.primary);
        c.text(text, x + 8 + 6 + 6, y + (20 - c.lineHeight(s)) / 2, s);
    }
    /** Pastille de statut (chip) ; renvoie sa largeur. */
    chip(text, tone, x, y, draw = true) {
        const c = this.c;
        const t = report_html_1.REPORT_TONE_COLORS[tone ?? 'neutral'];
        const s = { size: 10, bold: true, color: this.toneFg(tone, t.fg) };
        const w = 7 + c.width(text, s) + 7;
        if (draw) {
            c.rect(x, y, w, 18, { fill: t.bg, stroke: t.border, sw: 1, r: 5 });
            c.text(text, x + 7, y + (18 - c.lineHeight(s)) / 2, s);
        }
        return w;
    }
    avatar(name, x, y, size, fs) {
        const c = this.c;
        c.circle(x + size / 2, y + size / 2, size / 2, (0, report_html_1.reportAvatarColor)(name));
        const s = { size: fs, bold: true, color: C.white };
        c.text((0, report_html_1.reportInitials)(name), x + size / 2, y + (size - c.lineHeight(s)) / 2, s, 'center');
    }
    callout(b, x, w, y) {
        const c = this.c;
        const dark = b.style === 'dark';
        const padX = dark ? 20 : 18;
        const padY = dark ? 18 : 16;
        const bg = dark ? this.primary : b.style === 'tint' ? C.line : C.surface;
        const fg = dark ? C.white : C.ink;
        const numbered = b.style !== 'light';
        const innerW = w - 2 * padX;
        const itemS = { size: 13, lh: 1.5, color: fg };
        const itemGap = dark ? 10 : 8;
        const titleS = { ...this.H(dark ? 17 : 16), color: fg };
        const titleH = c.lineHeight(titleS);
        const items = b.items.map((it) => {
            const tx = numbered ? 22 + 8 : 8 + 10;
            const lines = c.lines(it.text, innerW - tx, itemS);
            return { it, tx, lines, h: lines.length * c.lineHeight(itemS) };
        });
        // Une ou plusieurs tranches : chaque tranche dessine son fond (coins arrondis) et ses éléments.
        const drawSlice = (yy, h, withTitle, slice, firstIndex) => {
            c.rect(x, yy, w, h, { fill: bg, r: 14, ...(b.style === 'light' ? { stroke: C.line, sw: 1 } : {}) });
            let iy = yy + padY;
            if (withTitle) {
                const tw = Math.min(c.width(b.title, titleS), innerW);
                c.textClip(b.title, x + padX, iy, innerW, titleS);
                if (b.note && tw + 10 < innerW)
                    c.textClip(b.note, x + padX + tw + 10, iy + (titleH - c.lineHeight({ size: 11 })) / 2, innerW - tw - 10, { size: 11, color: dark ? (0, color_1.blend)(C.white, this.primary, 0.7) : C.gray });
                iy += titleH + itemGap;
            }
            slice.forEach(({ lines, tx }, i) => {
                const lh = c.lineHeight(itemS);
                if (numbered)
                    c.text(String(firstIndex + i + 1), x + padX, iy, { size: 13, lh: 1.5, bold: true, color: dark ? this.accent : this.primary });
                else
                    c.circle(x + padX + 3.5, iy + lh / 2, 3.5, this.toneSolid(slice[i].it.tone, C.gray400));
                lines.forEach((l, j) => c.text(l, x + padX + tx, iy + j * lh, itemS));
                iy += lines.length * lh + itemGap;
            });
        };
        const totalH = padY + titleH + itemGap + items.reduce((s, i) => s + i.h + itemGap, 0) - itemGap + padY;
        if (y + totalH <= this.footerTop) {
            drawSlice(y, totalH, true, items, 0);
            return y + totalH;
        }
        if (totalH <= this.footerTop - 80) {
            y = this.ensure(y, totalH);
            drawSlice(y, totalH, true, items, 0);
            return y + totalH;
        }
        // Découpage par tranches d'éléments.
        let idx = 0;
        let first = true;
        while (idx < items.length) {
            let h = padY + (first ? titleH + itemGap : 0) + padY;
            const start = idx;
            y = this.ensure(y, h + items[idx].h);
            while (idx < items.length && y + h + items[idx].h + (idx > start ? itemGap : 0) <= this.footerTop) {
                h += items[idx].h + (idx > start ? itemGap : 0);
                idx++;
            }
            if (idx === start) {
                h += items[idx].h;
                idx++;
            }
            drawSlice(y, h, first, items.slice(start, idx), start);
            y += h;
            first = false;
        }
        return y;
    }
    list(b, x, w, y) {
        const c = this.c;
        const units = [];
        const t = this.sectionTitle(b.title, b.note, x, w);
        const itemS = { size: 13, lh: 1.55, color: C.ink };
        const dS = { size: 12, lh: 1.5, color: C.gray500 };
        b.items.forEach((it, i) => {
            const lines = c.lines(it.text, w - 36, itemS);
            const lh = c.lineHeight(itemS);
            const h = 8 + lines.length * lh + 8 + 1;
            const u = {
                h,
                draw: (yy) => {
                    c.text(b.numbered ? String(i + 1) : '•', x, yy + 8, { ...itemS, bold: true, color: C.gray400 });
                    lines.forEach((l, j) => c.text(l, x + 36, yy + 8 + j * lh, itemS));
                    c.hline(x, x + w, yy + h - 1, 1, C.line);
                },
            };
            if (i === 0 && t)
                units.push({ h: t.h + 8 + u.h, draw: (yy) => { t.draw(yy); u.draw(yy + t.h + 8); } });
            else
                units.push(u);
            if (it.details?.length) {
                const dx = x + 36 + 12 + 2;
                const dw = w - 36 - 14 - 28;
                it.details.forEach((d, k) => {
                    const text = `${d.who} : ${d.text}`;
                    const lines = c.lines(text, dw, dS);
                    const lh = c.lineHeight(dS);
                    const h = (k === 0 ? 6 : 0) + lines.length * lh + (k === it.details.length - 1 ? 2 : 6);
                    units.push({
                        h,
                        draw: (yy) => {
                            const top = yy + (k === 0 ? 6 : 0);
                            c.vline(x + 36, yy, yy + h, 2, C.line);
                            this.avatar(d.who, dx, top, 20, 7);
                            lines.forEach((l, j) => {
                                if (j === 0) {
                                    c.text(d.who, dx + 28, top, { ...dS, bold: true, color: C.ink });
                                    const ww = c.width(d.who, { ...dS, bold: true });
                                    c.text(l.slice(d.who.length), dx + 28 + ww, top, dS);
                                }
                                else
                                    c.text(l, dx + 28, top + j * lh, dS);
                            });
                        },
                    });
                });
            }
        });
        if (!units.length && t)
            units.push(t);
        return this.flow(y, units);
    }
    rowUnit(r, x, w) {
        const c = this.c;
        const titleS = { size: 13, lh: 1.4, bold: true, color: C.ink };
        const subS = { size: 13, lh: 1.4, color: C.gray };
        const metaS = { size: 11, color: C.gray500 };
        const noteS = { size: 12, color: this.toneFg(r.noteTone, C.gray500) };
        const rightS = { size: 13, bold: true, color: this.toneFg(r.rightTone, C.ink) };
        const leadW = r.check ? 16 + 12 : r.lead ? this.chip(r.lead.text, r.lead.tone, 0, 0, false) + 12 : 0;
        const rightW = r.right ? c.width(r.right, rightS) + 12 : 0;
        const progW = r.progress ? 150 + 12 : 0;
        const textW = w - leadW - rightW - progW;
        const titleText = r.subtitle ? `${r.title}, ${r.subtitle}` : r.title;
        const titleLines = c.lines(titleText, textW, titleS);
        const metaText = r.meta?.length ? r.meta.join('    ') : '';
        const metaLines = metaText ? c.lines(metaText, textW, metaS) : [];
        const noteLines = r.note ? c.lines(r.note, textW, noteS) : [];
        const bodyH = titleLines.length * c.lineHeight(titleS)
            + (metaLines.length ? 4 + metaLines.length * c.lineHeight(metaS) : 0)
            + (noteLines.length ? 4 + noteLines.length * c.lineHeight(noteS) : 0);
        const progH = r.progress ? 3 + c.lineHeight({ size: 11 }) + 5 + 5 : 0;
        const h = 9 + Math.max(bodyH, progH) + 9 + 1;
        return {
            h,
            draw: (yy) => {
                const top = yy + 9;
                let tx = x;
                if (r.check) {
                    c.circle(x + 8, top + 1 + 8, 8, report_html_1.REPORT_TONE_SOLID.success);
                    c.text('✓', x + 8, top + 1 + (16 - c.lineHeight({ size: 9 })) / 2, { size: 9, bold: true, color: C.white }, 'center');
                    tx += 16 + 12;
                }
                else if (r.lead) {
                    tx += this.chip(r.lead.text, r.lead.tone, x, top) + 12;
                }
                let ty = top;
                titleLines.forEach((l, i) => {
                    // Complément en gris quand il clôt la dernière ligne (sinon tout en gras, lisible quand même).
                    if (i === titleLines.length - 1 && r.subtitle && l.endsWith(r.subtitle)) {
                        const head = l.slice(0, l.length - r.subtitle.length);
                        c.text(head, tx, ty, titleS);
                        c.text(r.subtitle, tx + c.width(head, titleS), ty, subS);
                    }
                    else
                        c.text(l, tx, ty, titleS);
                    ty += c.lineHeight(titleS);
                });
                if (metaLines.length) {
                    ty += 4;
                    metaLines.forEach((l) => { c.text(l, tx, ty, metaS); ty += c.lineHeight(metaS); });
                }
                if (noteLines.length) {
                    ty += 4;
                    noteLines.forEach((l) => { c.text(l, tx, ty, noteS); ty += c.lineHeight(noteS); });
                }
                let rx = x + w;
                if (r.right) {
                    c.text(r.right, rx, top, rightS, 'right');
                    rx -= rightW;
                }
                if (r.progress) {
                    const px = rx - 150;
                    const ls = { size: 11, bold: true, color: C.ink };
                    c.text(r.progress.label, px + 150, top + 3, ls, 'right');
                    const by = top + 3 + c.lineHeight(ls) + 5;
                    c.rect(px, by, 150, 5, { fill: C.line, r: 3 });
                    c.rect(px, by, Math.round(150 * r.progress.ratio), 5, { fill: this.toneSolid(r.progress.tone, this.primary), r: 3 });
                }
                c.hline(x, x + w, yy + h - 1, 1, C.line);
            },
        };
    }
    rows(b, x, w, y) {
        const c = this.c;
        const units = [];
        const t = this.sectionTitle(b.title, b.note, x, w);
        const rows = b.rows.map((r) => this.rowUnit(r, x, w));
        if (t) {
            if (rows.length) {
                const first = rows.shift();
                units.push({ h: t.h + 4 + first.h, draw: (yy) => { t.draw(yy); first.draw(yy + t.h + 4); } });
            }
            else
                units.push(t);
        }
        units.push(...rows);
        if (!b.rows.length && b.empty) {
            const s = { size: 13, color: C.gray };
            units.push({ h: 8 + c.paraHeight(b.empty, w, s), draw: (yy) => c.para(b.empty, x, yy + 8, w, s) });
        }
        return this.flow(y, units);
    }
    stats(b, x, w, y) {
        const c = this.c;
        const n = b.tiles.length;
        const tileW = w / n;
        const valS = { size: 25, family: 'heading', lh: 1.1, color: C.ink };
        const labS = { size: 11, bold: true, color: C.ink };
        const noteS = { size: 10.5, color: C.gray };
        const hasNote = b.tiles.some((t) => t.note);
        const h = 13 + c.lineHeight(valS) + 3 + c.lineHeight(labS) + (hasNote ? 3 + c.lineHeight(noteS) : 0) + 13;
        const u = {
            h,
            draw: (yy) => {
                c.rect(x, yy, w, h, { stroke: C.line2, sw: 1, r: 12 });
                b.tiles.forEach((t, i) => {
                    const tx = x + i * tileW;
                    if (i)
                        c.vline(tx, yy + 1, yy + h - 1, 1, C.line2);
                    let ty = yy + 13;
                    c.textClip(t.value, tx + 15, ty, tileW - 30, { ...valS, color: this.toneFg(t.tone, C.ink) });
                    ty += c.lineHeight(valS) + 3;
                    c.textClip(t.label, tx + 15, ty, tileW - 30, labS);
                    ty += c.lineHeight(labS) + 3;
                    if (t.note)
                        c.textClip(t.note, tx + 15, ty, tileW - 30, noteS);
                });
            },
        };
        return this.flow(y, [u]);
    }
    smallTitle(title, x, w) {
        const s = { size: 10, bold: true, ls: 0.14, upper: true, color: C.gray };
        return { h: this.c.lineHeight(s), draw: (yy) => this.c.textClip(title, x, yy, w, s) };
    }
    bars(b, x, w, y) {
        const c = this.c;
        const units = [this.smallTitle(b.title, x, w)];
        const labS = { size: 12, bold: true, color: C.ink };
        const noteS = { size: 10.5, color: C.gray };
        const valS = { size: 12, bold: true, color: C.ink };
        const labelW = w - 90 - 52 - 20;
        b.items.forEach((it) => {
            const h = c.lineHeight(labS) + (it.note ? c.lineHeight(noteS) : 0);
            units.push({
                h: 9 + h,
                draw: (yy) => {
                    const top = yy + 9;
                    c.textClip(it.label, x, top, labelW, labS);
                    if (it.note)
                        c.textClip(it.note, x, top + c.lineHeight(labS), labelW, noteS);
                    const by = top + (h - 6) / 2;
                    const bx = x + labelW + 10;
                    c.rect(bx, by, 90, 6, { fill: C.line, r: 3 });
                    c.rect(bx, by, Math.round(90 * it.ratio), 6, { fill: this.toneSolid(it.tone, this.primary), r: 3 });
                    c.text(it.value, x + w, top + (h - c.lineHeight(valS)) / 2, valS, 'right');
                },
            });
        });
        return this.flow(y, units);
    }
    distribution(b, x, w, y) {
        const c = this.c;
        const total = b.segments.reduce((s, seg) => s + seg.count, 0) || 1;
        const units = [this.smallTitle(b.title, x, w)];
        units.push({
            h: 9 + 8,
            draw: (yy) => {
                c.rect(x, yy + 9, w, 8, { fill: C.line, r: 4 });
                let sx = x;
                b.segments.forEach((s) => { const sw = (w * s.count) / total; c.rect(sx, yy + 9, sw, 8, { fill: this.toneSolid(s.tone) }); sx += sw; });
            },
        });
        const s = { size: 12, color: C.ink };
        b.segments.forEach((seg) => units.push({
            h: 9 + c.lineHeight(s),
            draw: (yy) => {
                const top = yy + 9;
                c.rect(x, top + (c.lineHeight(s) - 8) / 2, 8, 8, { fill: this.toneSolid(seg.tone), r: 2 });
                c.textClip(seg.label, x + 16, top, w - 16 - 40, s);
                c.text(String(seg.count), x + w, top, { ...s, bold: true }, 'right');
            },
        }));
        return this.flow(y, units);
    }
    people(b, x, w, y) {
        const c = this.c;
        const units = [this.smallTitle(b.title, x, w)];
        const colW = (w - 32) / 3;
        const nameS = { size: 12, bold: true, lh: 1.25, color: C.ink };
        const roleS = { size: 11, lh: 1.25, color: C.gray };
        for (let i = 0; i < b.people.length; i += 3) {
            const row = b.people.slice(i, i + 3);
            const h = Math.max(26, ...row.map((p) => c.lineHeight(nameS) + (p.role ? c.lineHeight(roleS) : 0)));
            units.push({
                h: (i === 0 ? 10 : 8) + h,
                draw: (yy) => {
                    const top = yy + (i === 0 ? 10 : 8);
                    row.forEach((p, j) => {
                        const px = x + j * (colW + 16);
                        this.avatar(p.name, px, top + (h - 26) / 2, 26, 9);
                        const th = c.lineHeight(nameS) + (p.role ? c.lineHeight(roleS) : 0);
                        c.textClip(p.name, px + 34, top + (h - th) / 2, colW - 34, nameS);
                        if (p.role)
                            c.textClip(p.role, px + 34, top + (h - th) / 2 + c.lineHeight(nameS), colW - 34, roleS);
                    });
                },
            });
        }
        return this.flow(y, units);
    }
    actionUnit(a, i, x, w) {
        const c = this.c;
        const cols = [22, 0, 140, 90, 110];
        cols[1] = w - 22 - 140 - 90 - 110 - 4 * 10;
        const titleS = { size: 13, bold: true, color: C.ink };
        const withS = { size: 11, color: report_html_1.REPORT_TONE_COLORS.info.fg };
        const badgeW = a.badge ? this.chip(a.badge, 'info', 0, 0, false) + 6 : 0;
        const firstW = cols[1] - badgeW;
        // Première ligne à côté du badge (largeur réduite), les suivantes sur toute la colonne.
        let lines;
        if (a.badge) {
            const first = c.wrap(a.title, firstW, titleS)[0] ?? '';
            const rest = a.title.slice(first.length).trim();
            lines = [first, ...(rest ? c.wrap(rest, cols[1], titleS) : [])];
        }
        else
            lines = c.wrap(a.title, cols[1], titleS);
        const withLines = a.with ? c.lines(a.with, cols[1], withS) : [];
        const h = 10 + lines.length * c.lineHeight(titleS) + (withLines.length ? 3 + withLines.length * c.lineHeight(withS) : 0) + 10 + 1;
        return {
            h,
            draw: (yy) => {
                const top = yy + 10;
                c.text(String(i + 1), x, top, { size: 12, bold: true, color: C.gray400 });
                let tx = x + 22 + 10;
                if (a.badge) {
                    this.chip(a.badge, 'info', tx, top);
                    tx += badgeW;
                }
                lines.forEach((l, j) => c.text(l, j === 0 ? tx : x + 22 + 10, top + j * c.lineHeight(titleS), titleS));
                let wy = top + lines.length * c.lineHeight(titleS) + 3;
                withLines.forEach((l) => { c.text(l, x + 22 + 10, wy, withS); wy += c.lineHeight(withS); });
                const ox = x + 22 + 10 + cols[1] + 10;
                if (a.owner) {
                    this.avatar(a.owner, ox, top, 18, 7);
                    c.textClip(a.owner, ox + 24, top + (18 - c.lineHeight({ size: 12 })) / 2, 140 - 24, { size: 12, color: C.ink });
                }
                const dx = ox + 140 + 10;
                if (a.due)
                    c.textClip(a.due, dx, top + (18 - c.lineHeight({ size: 12 })) / 2, 90, { size: 12, color: C.ink });
                if (a.status)
                    c.textClip(a.status, x + w, top + (18 - c.lineHeight({ size: 12 })) / 2, 110, { size: 12, bold: true, color: this.toneFg(a.statusTone, C.gray) }, 'right');
                c.hline(x, x + w, yy + h - 1, 1, C.line);
            },
        };
    }
    actions(b, x, w, y) {
        const units = [];
        const t = this.sectionTitle(b.title, b.note, x, w);
        const items = b.items.map((a, i) => this.actionUnit(a, i, x, w));
        if (t) {
            const first = items.shift();
            units.push({ h: t.h + 6 + first.h, draw: (yy) => { t.draw(yy); first.draw(yy + t.h + 6); } });
        }
        units.push(...items);
        return this.flow(y, units);
    }
    agendaDayUnits(d, x, w) {
        const c = this.c;
        const dayS = { size: 12, bold: true, color: C.ink };
        const itemW = w - 90 - 14;
        const ix = x + 90 + 14;
        const titleS = { size: 12, bold: true, color: C.ink };
        const kindS = { size: 9, bold: true, ls: 0.06, upper: true };
        const locS = { size: 11, color: C.gray };
        const units = [];
        d.items.forEach((it, i) => {
            const peopleW = (it.people?.length ?? 0) * 18;
            const kindW = it.kind ? c.width(it.kind, kindS) + 6 : 0;
            const tw = itemW - 78 - 10 - peopleW - 10;
            const h = 6 + c.lineHeight(titleS) + (it.location ? 1 + c.lineHeight(locS) : 0) + 6 + 1;
            units.push({
                h,
                draw: (yy) => {
                    if (i === 0)
                        c.textClip(d.label, x, yy + 6, 90, dayS);
                    const top = yy + 6;
                    c.text(it.time, ix, top, { size: 12, color: C.gray });
                    let tx = ix + 78 + 10;
                    if (it.kind) {
                        c.text(it.kind, tx, top + 1.5, { ...kindS, color: this.toneSolid(it.kindTone, C.gray) });
                        tx += kindW;
                    }
                    const ts = { ...titleS, color: it.cancelled ? C.gray400 : C.ink };
                    c.textClip(it.title, tx, top, tw - kindW, ts);
                    if (it.cancelled)
                        c.hline(tx, tx + Math.min(c.width(it.title, ts), tw - kindW), top + c.lineHeight(ts) / 2, 1, C.gray400);
                    if (it.location)
                        c.textClip(it.location, ix + 78 + 10, top + c.lineHeight(titleS) + 1, tw, locS);
                    (it.people ?? []).forEach((p, k) => this.avatar(p, ix + itemW - peopleW + k * 18, top + (c.lineHeight(titleS) - 16) / 2, 16, 6));
                    c.hline(ix, ix + itemW, yy + h - 1, 1, C.line);
                },
            });
        });
        if (!units.length)
            units.push({ h: c.lineHeight(dayS) + 6, draw: (yy) => c.textClip(d.label, x, yy + 6, 90, dayS) });
        return units;
    }
    agenda(b, x, w, y) {
        const units = [];
        const t = this.sectionTitle(b.title, b.note, x, w);
        if (t)
            units.push({ h: t.h + 12, draw: t.draw });
        b.days.forEach((d, i) => {
            const du = this.agendaDayUnits(d, x, w);
            if (i > 0) {
                const first = du[0];
                du[0] = { h: first.h + 12, draw: (yy) => first.draw(yy + 12) };
            }
            units.push(...du);
        });
        return this.flow(y, units);
    }
    columns(b, x, w, y) {
        const gapW = 28;
        const leftW = ((w - gapW) * 1.4) / 2.4;
        const rightW = w - gapW - leftW;
        // Les deux colonnes sont d'abord mesurées sur une page vierge virtuelle : si l'ensemble tient
        // sur la page courante, dessin côte à côte ; sinon l'une sous l'autre, paginées.
        const hL = this.measure((yy) => this.block(b.left, x, leftW, yy));
        const hR = this.measure((yy) => this.block(b.right, x + leftW + gapW, rightW, yy));
        const h = Math.max(hL, hR);
        if (h <= this.footerTop - 120) {
            y = this.ensure(y, h);
            const yl = this.block(b.left, x, leftW, y);
            const yr = this.block(b.right, x + leftW + gapW, rightW, y);
            return Math.max(yl, yr);
        }
        y = this.block(b.left, x, w, y);
        return this.block(b.right, x, w, this.gap(y));
    }
    /** Hauteur d'un bloc dessiné sur une page de brouillon (retirée ensuite). */
    measure(draw) {
        const saved = this.c.page;
        const n = this.c.pages.length;
        this.c.newPage();
        const h = draw(0);
        // Un saut de page pendant la mesure : le bloc ne tient pas sur une page.
        const broke = this.c.pages.length > n + 1;
        while (this.c.pages.length > n) {
            this.c.pages.pop();
            this.c.doc.removePage(this.c.doc.getPageCount() - 1);
        }
        this.c.page = saved;
        return broke ? Number.POSITIVE_INFINITY : h;
    }
    // ─── Sources et pieds ─────────────────────────────────────────────────────
    sources(y) {
        const v = this.v;
        if (!v.footer.sources)
            return;
        const c = this.c;
        const s = { size: 11, lh: 1.5, color: C.gray400 };
        const h = c.paraHeight(v.footer.sources, CONTENT_W, s);
        // Au bas de la dernière page si la place le permet (margin-top:auto), sinon à la suite.
        const bottom = this.footerTop - 8;
        let top = Math.max(y + 20, bottom - h);
        if (top + h > this.footerTop)
            top = this.ensure(y + 20, h);
        c.para(v.footer.sources, PAD_X, top, CONTENT_W, s);
    }
    footers() {
        const v = this.v;
        const c = this.c;
        const total = c.pages.length;
        const s = { size: 9, color: C.gray };
        const lh = c.lineHeight(s);
        c.pages.forEach((p, i) => {
            c.page = p;
            const top = PdfCanvas_1.CANVAS_PAGE_H - FOOT_BOTTOM - lh;
            c.hline(PAD_X, PdfCanvas_1.CANVAS_PAGE_W - PAD_X, top - 10 - 1, 1, C.line);
            let x = PdfCanvas_1.CANVAS_PAGE_W - PAD_X;
            const pageTxt = `${v.labels.page} ${i + 1} ${v.labels.of} ${total}`;
            c.text(pageTxt, x, top, { ...s, color: C.slate400 }, 'right');
            x -= c.width(pageTxt, s) + 10;
            if (v.poweredBy) {
                const tS = { size: 8, color: C.slate400 };
                const lw = this.servicesLogo ? (this.servicesLogo.width / this.servicesLogo.height) * 11 : c.width('Services', { size: 9, bold: true });
                const tw = c.width(v.labels.poweredBy, tS);
                const blockW = tw + 6 + lw + 10;
                const bx = x - blockW;
                c.text(v.labels.poweredBy, bx, top + (lh - c.lineHeight(tS)) / 2, tS);
                if (this.servicesLogo)
                    c.image(this.servicesLogo, bx + tw + 6, top + (lh - 11) / 2, lw, 11);
                else
                    c.text('Services', bx + tw + 6, top + (lh - c.lineHeight({ size: 9 })) / 2, { size: 9, bold: true, color: C.ink });
                c.vline(bx + blockW - 1, top + (lh - 11) / 2, top + (lh + 11) / 2, 1, C.line2);
                x = bx - 10;
            }
            if (v.footer.right) {
                c.text(v.footer.right, x, top, s, 'right');
                x -= c.width(v.footer.right, s) + 10;
            }
            c.textClip(v.footer.left ?? v.issuer.name, PAD_X, top, Math.max(40, x - PAD_X - 16), s);
        });
    }
}
exports.ReportPdfRenderer = ReportPdfRenderer;
async function renderReportPdf(view, options = {}) {
    return new ReportPdfRenderer(view, options).render();
}
//# sourceMappingURL=ReportPdfRenderer.js.map