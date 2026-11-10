"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetPdfRenderer = void 0;
exports.renderTimesheetPdf = renderTimesheetPdf;
const timesheet_html_1 = require("../document/timesheet-html");
const PdfCanvas_1 = require("./PdfCanvas");
const PDFA3Compliance_1 = require("../utils/PDFA3Compliance");
const CONTENT_W = PdfCanvas_1.CANVAS_PAGE_W - 2 * timesheet_html_1.TIMESHEET_SIDE;
const LIMIT = PdfCanvas_1.CANVAS_PAGE_H - timesheet_html_1.TIMESHEET_FOOT_RESERVE;
const FOOT_BOTTOM = 34;
/** Marge verticale des lignes de tableau (comme `padding:6px 12px` du HTML). */
const ROW_PAD = 6;
const X0 = timesheet_html_1.TIMESHEET_SIDE;
const X1 = PdfCanvas_1.CANVAS_PAGE_W - timesheet_html_1.TIMESHEET_SIDE;
class TimesheetPdfRenderer {
    constructor(v, options = {}) {
        this.v = v;
        this.options = options;
        /** En-tête de colonnes à répéter en haut des pages suivantes, pendant le tableau. */
        this.repeatHead = null;
    }
    s(size, o = {}) { return { size, color: timesheet_html_1.TIMESHEET_COLORS.text, ...o }; }
    caps(color = timesheet_html_1.TIMESHEET_COLORS.slate600) { return { size: 9, bold: true, ls: 0.1, upper: true, color }; }
    async render() {
        const v = this.v;
        this.c = await PdfCanvas_1.PdfCanvas.create({ body: 'chillax' });
        const doc = this.c.doc;
        const title = [v.title, v.meta.find((m) => m.label === v.labels.number)?.value].filter(Boolean).join(' ');
        await (0, PDFA3Compliance_1.setupPDFA3Compliance)(doc, {
            title, author: v.provider.name, subject: v.shortTitle, creator: 'accounting-tools',
            keywords: [v.title, v.variant, 'PDF/A-3'], conformanceLevel: 'EN 16931', facturX: false,
        });
        doc.setTitle(title);
        doc.setAuthor(v.provider.name);
        doc.setSubject(v.shortTitle);
        doc.setProducer('Services');
        if (this.options.generatedAt)
            doc.setCreationDate(this.options.generatedAt);
        if (v.showLogo)
            this.logo = await this.c.embedImage(this.options.logo);
        if (v.poweredBy)
            this.servicesLogo = await this.c.embedAsset('brand', 'services-logo.png');
        this.newPage();
        let y = this.header(52);
        y = this.parties(y + 28);
        y = this.band(y + 24);
        y = v.variant === 'detailed' ? this.detailed(y + 24) : this.simple(y + 24);
        this.validation(y + 26);
        this.footers();
        const pdf = await doc.save();
        return { pdf, pageCount: this.c.pages.length };
    }
    // ─── Pages ────────────────────────────────────────────────────────────────
    newPage() {
        this.c.newPage();
        if (this.v.watermark)
            this.c.watermark(this.v.watermark, this.v.watermarkSize ?? 110, timesheet_html_1.TIMESHEET_COLORS.ink);
    }
    /** Nouvelle page : en-tête allégé (et en-tête de colonnes si un tableau est en cours). */
    continuation() {
        this.newPage();
        const c = this.c;
        const t = this.s(13, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
        const r = this.s(9, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 });
        const lh = c.lineHeight(t);
        c.textClip(this.v.runningRef, X1, 52 + (lh - c.lineHeight(r)) / 2, CONTENT_W / 2, r, 'right');
        c.textClip(this.v.shortTitle, X0, 52, CONTENT_W / 2 - 16, t);
        const rule = 52 + lh + 12;
        c.hline(X0, X1, rule, 1, timesheet_html_1.TIMESHEET_COLORS.line);
        let y = rule + 24;
        if (this.repeatHead) {
            this.repeatHead.draw(y);
            y += this.repeatHead.h;
        }
        return y;
    }
    /** Place `h` sur la page courante ou sur une nouvelle page ; renvoie le y de départ. */
    ensure(y, h) {
        return y + h <= LIMIT ? y : this.continuation();
    }
    flow(y, units) {
        units.forEach((u, i) => {
            const next = u.keepWithNext ? units[i + 1] : undefined;
            y = this.ensure(y, u.h + (next ? next.h : 0));
            u.draw(y);
            y += u.h;
        });
        return y;
    }
    // ─── En-tête ──────────────────────────────────────────────────────────────
    header(top) {
        const c = this.c;
        const v = this.v;
        // Méta à droite : étiquettes alignées à gauche, valeurs à droite (grille auto auto, écart 18).
        const lab = this.s(11, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 });
        const val = this.s(11, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
        const pillS = { size: 8, bold: true, ls: 0.08, upper: true, color: timesheet_html_1.TIMESHEET_TONES[v.status.tone].fg };
        const pillW = c.width(v.status.label, pillS) + 16 + 2;
        const pillH = c.lineHeight(pillS) + 6 + 2;
        const labelW = Math.max(...v.meta.map((m) => c.width(m.label, lab)), c.width(v.labels.status, lab));
        const valueW = Math.max(...v.meta.map((m) => c.width(m.value, val)), pillW);
        const lx = X1 - valueW - 18 - labelW;
        const rowH = c.lineHeight(lab);
        let my = top;
        for (const m of v.meta) {
            c.text(m.label, lx, my, lab);
            c.text(m.value, X1, my, val, 'right');
            my += rowH + 6;
        }
        c.text(v.labels.status, lx, my + (pillH - rowH) / 2, lab);
        const tone = timesheet_html_1.TIMESHEET_TONES[v.status.tone];
        c.rect(X1 - pillW, my, pillW, pillH, { stroke: tone.border, sw: 1, r: 4 });
        c.text(v.status.label, X1 - pillW + 9, my + 4, pillS);
        const metaBottom = my + pillH;
        // Gauche : logo (50 × 50, contenu) puis titre et sous-titre, centrés verticalement.
        const titleS = this.s(34, { bold: true, family: 'heading', color: timesheet_html_1.TIMESHEET_COLORS.ink, ls: -0.01, lh: 1.05 });
        const subS = this.s(11, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 });
        const tx = this.logo ? X0 + 50 + 14 : X0;
        const maxW = lx - 24 - tx;
        const subLines = c.lines(v.subtitle, maxW, subS);
        const textH = c.lineHeight(titleS) + 6 + subLines.length * c.lineHeight(subS);
        const blockH = Math.max(this.logo ? 50 : 0, textH);
        if (this.logo)
            c.imageContain(this.logo, X0, top + (blockH - 50) / 2, 50, 50);
        const ty = top + (blockH - textH) / 2;
        c.textClip(v.title, tx, ty, maxW, titleS);
        c.para(v.subtitle, tx, ty + c.lineHeight(titleS) + 6, maxW, subS);
        return Math.max(top + blockH, metaBottom);
    }
    // ─── Parties et bandeau ───────────────────────────────────────────────────
    partyHeight(p, w) {
        const c = this.c;
        let h = c.lineHeight(this.caps()) + 4;
        h += 4 + c.paraHeight(p.name, w, this.s(12, { bold: true }));
        for (const l of p.lines)
            h += 4 + c.paraHeight(l, w, this.s(11));
        p.muted.forEach((l, i) => { h += 4 + (i === 0 ? 4 : 0) + c.paraHeight(l, w, this.s(10)); });
        return h;
    }
    party(p, x, y, w) {
        const c = this.c;
        c.text(p.heading, x, y, this.caps());
        y += c.lineHeight(this.caps()) + 4 + 4;
        y += c.para(p.name, x, y, w, this.s(12, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink }));
        for (const l of p.lines)
            y += 4 + c.para(l, x, y + 4, w, this.s(11));
        p.muted.forEach((l, i) => { const gap = 4 + (i === 0 ? 4 : 0); y += gap + c.para(l, x, y + gap, w, this.s(10, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 })); });
    }
    parties(y) {
        const w = (CONTENT_W - 18) / 2;
        const h = Math.max(this.partyHeight(this.v.provider, w), this.partyHeight(this.v.client, w));
        y = this.ensure(y, h);
        this.party(this.v.provider, X0, y, w);
        this.party(this.v.client, X0 + w + 18, y, w);
        return y + h;
    }
    band(y) {
        const c = this.c;
        const fr = (CONTENT_W - 40) / 3.6;
        const widths = [1.6 * fr, fr, fr];
        const lab = { size: 8, ls: 0.12, upper: true, color: timesheet_html_1.TIMESHEET_COLORS.gray };
        const val = this.s(10.5, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink, lh: 1.55 });
        const h = Math.max(...this.v.band.map((b, i) => c.lineHeight(lab) + 6 + c.paraHeight(b.value, widths[i], val)));
        y = this.ensure(y, h);
        let x = X0;
        this.v.band.forEach((b, i) => {
            c.text(b.label, x, y, lab);
            c.para(b.value, x, y + c.lineHeight(lab) + 6, widths[i], val);
            x += widths[i] + 20;
        });
        return y + h;
    }
    // ─── Tableaux ─────────────────────────────────────────────────────────────
    headRow(cols) {
        const s = { size: 9, bold: true, ls: 0.06, upper: true, color: timesheet_html_1.TIMESHEET_COLORS.slate600 };
        const h = 9 + this.c.lineHeight(s) + 9 + 1;
        return {
            h,
            draw: (y) => {
                this.c.rect(X0, y, CONTENT_W, h - 1, { fill: timesheet_html_1.TIMESHEET_COLORS.surface });
                this.c.hline(X0, X1, y + h - 1, 1, timesheet_html_1.TIMESHEET_COLORS.line);
                for (const col of cols)
                    this.c.text(col.label, col.x, y + 9, s, col.align);
            },
        };
    }
    simple(y) {
        const c = this.c;
        const v = this.v;
        const three = v.simple.columns.length === 3;
        const right3 = X1 - 12;
        const right2 = three ? right3 - 90 - 10 : right3;
        const dayW = (right2 - 90) - 10 - (X0 + 12);
        const head = this.headRow(v.simple.columns.map((label, i) => ({ label, x: i === 0 ? X0 + 12 : i === 1 ? right2 : right3, align: i === 0 ? 'left' : 'right' })));
        const rowS = this.s(10.5);
        const units = [head];
        const rows = v.simple.rows.length ? v.simple.rows : [{ day: v.labels.noEntries, duration: '', muted: true }];
        for (const r of rows) {
            const lines = c.lines(r.day, dayW, rowS);
            const h = ROW_PAD + lines.length * c.lineHeight(rowS) + ROW_PAD + 1;
            units.push({
                h,
                draw: (yy) => {
                    c.para(r.day, X0 + 12, yy + ROW_PAD, dayW, { ...rowS, color: r.muted ? timesheet_html_1.TIMESHEET_COLORS.slate500 : timesheet_html_1.TIMESHEET_COLORS.text });
                    if (r.duration)
                        c.text(r.duration, right2, yy + ROW_PAD, this.s(10.5, { color: timesheet_html_1.TIMESHEET_COLORS.slate600 }), 'right');
                    if (three && r.equivalent)
                        c.text(r.equivalent, right3, yy + ROW_PAD, this.s(10.5, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink }), 'right');
                    c.hline(X0, X1, yy + h - 1, 1, timesheet_html_1.TIMESHEET_COLORS.rowRule);
                },
            });
        }
        const totS = this.s(12, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
        const t = v.simple.total;
        units.push({
            h: 1 + 12 + c.lineHeight(totS) + 12,
            draw: (yy) => {
                c.hline(X0, X1, yy, 1, timesheet_html_1.TIMESHEET_COLORS.ink);
                c.textClip(t.day, X0 + 12, yy + 13, dayW, totS);
                c.text(t.duration, right2, yy + 13, totS, 'right');
                if (three && t.equivalent)
                    c.text(t.equivalent, right3, yy + 13, totS, 'right');
            },
        });
        this.repeatHead = head;
        head.keepWithNext = true;
        y = this.flow(y, units);
        this.repeatHead = null;
        return this.callout(y + 18, v.note);
    }
    detailed(y) {
        const c = this.c;
        const v = this.v;
        const d = v.detailed;
        // Grille « 62 96 1fr 54 44 84 », écart 10, marges intérieures 12.
        const xDate = X0 + 12;
        const xSlot = xDate + 62 + 10;
        const xTask = xSlot + 96 + 10;
        const rAmount = X1 - 12;
        const cFact = rAmount - 84 - 10 - 22;
        const rDur = rAmount - 84 - 10 - 44 - 10;
        const taskW = rDur - 54 - 10 - xTask;
        const head = this.headRow([
            { label: d.columns[0], x: xDate, align: 'left' }, { label: d.columns[1], x: xSlot, align: 'left' }, { label: d.columns[2], x: xTask, align: 'left' },
            { label: d.columns[3], x: rDur, align: 'right' }, { label: d.columns[4], x: cFact, align: 'center' }, { label: d.columns[5], x: rAmount, align: 'right' },
        ]);
        const rowS = this.s(10);
        const detS = this.s(9.5, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 });
        const bold95 = this.s(9.5, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
        const units = [head];
        const slotRow = (r) => {
            const taskLines = c.lines(r.task, taskW, rowS);
            const detLines = r.detail ? c.lines(r.detail, taskW, detS) : [];
            const inner = taskLines.length * c.lineHeight(rowS) + (detLines.length ? 2 + detLines.length * c.lineHeight(detS) : 0);
            const h = ROW_PAD + inner + ROW_PAD + 1;
            return {
                h,
                draw: (yy) => {
                    const fg = r.excluded ? timesheet_html_1.TIMESHEET_COLORS.slate400 : timesheet_html_1.TIMESHEET_COLORS.text;
                    const st = { ...rowS, color: fg };
                    c.text(r.date, xDate, yy + ROW_PAD, st);
                    c.text(r.slot, xSlot, yy + ROW_PAD, st);
                    c.para(r.task, xTask, yy + ROW_PAD, taskW, st);
                    if (detLines.length)
                        c.para(r.detail, xTask, yy + ROW_PAD + taskLines.length * c.lineHeight(rowS) + 2, taskW, detS);
                    c.text(r.duration, rDur, yy + ROW_PAD, st, 'right');
                    c.text(r.billable, cFact, yy + ROW_PAD, { ...rowS, color: r.excluded ? timesheet_html_1.TIMESHEET_TONES.danger.fg : timesheet_html_1.TIMESHEET_COLORS.slate500 }, 'center');
                    c.text(r.amount, rAmount, yy + ROW_PAD, st, 'right');
                    c.hline(X0, X1, yy + h - 1, 1, timesheet_html_1.TIMESHEET_COLORS.rowRule);
                },
            };
        };
        if (!d.weeks.length) {
            const h = 14 + c.lineHeight(this.s(10.5)) + 14;
            units.push({ h, draw: (yy) => c.text(v.labels.noEntries, xDate, yy + 14, this.s(10.5, { color: timesheet_html_1.TIMESHEET_COLORS.slate500 })) });
        }
        for (const w of d.weeks) {
            const th = 9 + c.lineHeight(bold95) + 7 + 1;
            units.push({ h: th, keepWithNext: true, draw: (yy) => { c.textClip(w.label, xDate, yy + 9, CONTENT_W - 24, bold95); c.hline(X0, X1, yy + th - 1, 1, timesheet_html_1.TIMESHEET_COLORS.rowRule); } });
            w.rows.forEach((r) => units.push(slotRow(r)));
            const sh = 8 + c.lineHeight(bold95) + 8 + 1;
            units.push({
                h: sh,
                draw: (yy) => {
                    c.rect(X0, yy, CONTENT_W, sh - 1, { fill: timesheet_html_1.TIMESHEET_COLORS.surface });
                    c.hline(X0, X1, yy + sh - 1, 1, timesheet_html_1.TIMESHEET_COLORS.rowRule);
                    c.textClip(w.subtotal.label, xDate, yy + 8, rDur - 54 - 10 - xDate, bold95);
                    c.text(w.subtotal.duration, rDur, yy + 8, bold95, 'right');
                    if (w.subtotal.amount)
                        c.text(w.subtotal.amount, rAmount, yy + 8, bold95, 'right');
                },
            });
        }
        head.keepWithNext = true;
        this.repeatHead = head;
        y = this.flow(y, units);
        this.repeatHead = null;
        for (const n of d.notes)
            y = this.callout(y + 14, n);
        return this.billing(y + 22);
    }
    /** Encart à filet gauche (texte, ou texte et valeur). */
    callout(y, content) {
        const c = this.c;
        const s = this.s(10, { lh: 1.55, color: timesheet_html_1.TIMESHEET_COLORS.slate700 });
        const isCell = typeof content !== 'string';
        const valueS = this.s(10, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink, lh: 1.55 });
        const valueW = isCell ? c.width(content.value, valueS) + 16 : 0;
        const text = isCell ? content.label : content;
        const w = CONTENT_W - 3 - 28 - valueW;
        const h = 10 + c.paraHeight(text, w, s) + 10;
        y = this.ensure(y, h);
        c.rect(X0, y, CONTENT_W, h, { fill: timesheet_html_1.TIMESHEET_COLORS.surface });
        c.rect(X0, y, 3, h, { fill: timesheet_html_1.TIMESHEET_COLORS.ink });
        c.para(text, X0 + 3 + 14, y + 10, w, s);
        if (isCell)
            c.text(content.value, X1 - 14, y + 10, valueS, 'right');
        return y + h;
    }
    billing(y) {
        const c = this.c;
        const d = this.v.detailed;
        const colW = (CONTENT_W - 28) / 2;
        const lineS = this.s(9.5, { lh: 1.55, color: timesheet_html_1.TIMESHEET_COLORS.slate600 });
        const leftH = c.lineHeight(this.caps()) + 3 + d.billing.lines.reduce((s, l) => s + 5 + c.paraHeight(l, colW, lineS), 0);
        const sumS = this.s(10.5, { color: timesheet_html_1.TIMESHEET_COLORS.slate600 });
        const rowH = 4 + c.lineHeight(sumS) + 4;
        const grandS = this.s(16, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
        const rightH = d.summary.length * rowH + (d.grandTotal ? 10 + 1 + 12 + c.lineHeight(grandS) : 0);
        const h = Math.max(leftH, rightH);
        y = this.ensure(y, h);
        c.text(d.billing.heading, X0, y, this.caps());
        let ly = y + c.lineHeight(this.caps()) + 3;
        for (const l of d.billing.lines) {
            ly += 5;
            ly += c.para(l, X0, ly, colW, lineS);
        }
        const rx = X0 + colW + 28;
        let ry = y;
        for (const s of d.summary) {
            c.textClip(s.label, rx, ry + 4, colW - c.width(s.value, sumS) - 16, sumS);
            c.text(s.value, X1, ry + 4, this.s(10.5, { color: timesheet_html_1.TIMESHEET_COLORS.text }), 'right');
            ry += rowH;
        }
        if (d.grandTotal) {
            ry += 10;
            c.hline(rx, X1, ry, 1, timesheet_html_1.TIMESHEET_COLORS.ink);
            ry += 1 + 12;
            const lab = this.s(12, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
            c.text(d.grandTotal.label, rx, ry + (c.lineHeight(grandS) - c.lineHeight(lab)) / 2 + 2, lab);
            c.text(d.grandTotal.value, X1, ry, grandS, 'right');
        }
        return y + h;
    }
    // ─── Validation ───────────────────────────────────────────────────────────
    blockHeight(b, w) {
        const c = this.c;
        const lineS = this.s(9.5, { lh: 1.5 });
        let h = c.lineHeight(this.caps()) + 4;
        if (b.name)
            h += 4 + c.paraHeight(b.name, w, this.s(12, { bold: true }));
        for (const l of b.lines)
            h += 4 + c.paraHeight(l, w, lineS);
        if (b.emphasis)
            h += 4 + c.paraHeight(b.emphasis, w, lineS);
        return h;
    }
    block(b, x, y, w) {
        const c = this.c;
        const tone = timesheet_html_1.TIMESHEET_TONES[b.tone];
        c.text(b.heading, x, y, this.caps(b.tone === 'neutral' ? timesheet_html_1.TIMESHEET_COLORS.slate600 : tone.fg));
        y += c.lineHeight(this.caps()) + 4;
        if (b.name)
            y += 4 + c.para(b.name, x, y + 4, w, this.s(12, { bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink }));
        for (const l of b.lines)
            y += 4 + c.para(l, x, y + 4, w, this.s(9.5, { lh: 1.5, color: timesheet_html_1.TIMESHEET_COLORS.slate500 }));
        if (b.emphasis)
            c.para(b.emphasis, x, y + 4, w, this.s(9.5, { lh: 1.5, color: tone.fg }));
    }
    validation(y) {
        const w = (CONTENT_W - 18) / 2;
        const h = 22 + Math.max(this.blockHeight(this.v.submitted, w), this.blockHeight(this.v.decision, w));
        y = this.ensure(y, h);
        this.c.hline(X0, X1, y, 1, timesheet_html_1.TIMESHEET_COLORS.line);
        this.block(this.v.submitted, X0, y + 22, w);
        this.block(this.v.decision, X0 + w + 18, y + 22, w);
    }
    // ─── Pieds ────────────────────────────────────────────────────────────────
    footers() {
        const v = this.v;
        const c = this.c;
        const total = c.pages.length;
        const s = { size: 8.5, color: timesheet_html_1.TIMESHEET_COLORS.slate500 };
        const legalS = { size: 8.5, lh: 1.5, color: timesheet_html_1.TIMESHEET_COLORS.slate500 };
        const lh = c.lineHeight(s);
        c.pages.forEach((p, i) => {
            c.page = p;
            const last = i === total - 1;
            const legal = last
                ? [v.legal, v.closing].filter(Boolean).map((t) => (/[.!?]$/.test(String(t).trim()) ? String(t).trim() : `${String(t).trim()}.`)).join(' ')
                : `${v.title} ${v.runningRef}, ${v.shortTitle.split(', ').slice(1).join(', ')}, ${v.labels.continuedOn} ${i + 2}`;
            // Groupe de droite : [émis avec Services] | Page i / n.
            const pageTxt = `${v.labels.page} ${i + 1} ${v.labels.of} ${total}`;
            let groupW = c.width(pageTxt, s);
            const tS = { size: 8, color: timesheet_html_1.TIMESHEET_COLORS.slate500 };
            const lw = this.servicesLogo ? (this.servicesLogo.width / this.servicesLogo.height) * 11 : c.width('Services', { size: 9, bold: true });
            const poweredW = v.poweredBy ? c.width(v.labels.poweredBy, tS) + 6 + lw + 10 + 1 : 0;
            if (poweredW)
                groupW += poweredW + 10;
            const legalW = Math.min(500, CONTENT_W - groupW - 20);
            const legalH = c.paraHeight(legal, legalW, legalS);
            const bottom = PdfCanvas_1.CANVAS_PAGE_H - FOOT_BOTTOM;
            const h = Math.max(legalH, lh);
            c.hline(X0, X1, bottom - h - 12 - 1, 1, timesheet_html_1.TIMESHEET_COLORS.line);
            c.para(legal, X0, bottom - legalH, legalW, legalS);
            const top = bottom - lh;
            c.text(pageTxt, X1, top, s, 'right');
            if (v.poweredBy) {
                const bx = X1 - c.width(pageTxt, s) - 10 - poweredW;
                const tw = c.width(v.labels.poweredBy, tS);
                c.text(v.labels.poweredBy, bx, top + (lh - c.lineHeight(tS)) / 2, tS);
                if (this.servicesLogo)
                    c.image(this.servicesLogo, bx + tw + 6, top + (lh - 11) / 2, lw, 11);
                else
                    c.text('Services', bx + tw + 6, top + (lh - c.lineHeight({ size: 9 })) / 2, { size: 9, bold: true, color: timesheet_html_1.TIMESHEET_COLORS.ink });
                c.vline(bx + poweredW - 1, top + (lh - 11) / 2, top + (lh + 11) / 2, 1, timesheet_html_1.TIMESHEET_COLORS.line);
            }
        });
    }
}
exports.TimesheetPdfRenderer = TimesheetPdfRenderer;
async function renderTimesheetPdf(view, options = {}) {
    return new TimesheetPdfRenderer(view, options).render();
}
//# sourceMappingURL=TimesheetPdfRenderer.js.map