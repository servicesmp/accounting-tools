"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformInvoicePdfRenderer = void 0;
exports.renderPlatformInvoicePdf = renderPlatformInvoicePdf;
const PdfCanvas_1 = require("./PdfCanvas");
const PDFA3Compliance_1 = require("../utils/PDFA3Compliance");
const AFRelationshipFix_1 = require("../utils/AFRelationshipFix");
const platform_invoice_html_1 = require("../document/platform-invoice-html");
// Géométrie de la maquette (px CSS).
const L = 68;
const R = PdfCanvas_1.CANVAS_PAGE_W - 68; // 726
const W = R - L; // 658
const TOP = 64;
/** Largeur du bloc de conditions du pied (maquette : max-width 420). */
const FOOT_W = 420;
const COL_W = 305;
const COL2_X = L + COL_W + 48; // 421
/** Colonnes du tableau : désignation flexible, puis 44 / 88 / 78 / 100, espacées de 12. */
const COLS = { qtyR: 424, priceR: 524, vatR: 614, totalR: R, descW: 300 };
const TOTALS_X = R - 300; // 426
const st = (size, weight = 500, color = platform_invoice_html_1.PLATFORM_COLORS.ink, extra = {}) => ({ size, weight, color, ...extra });
class PlatformInvoicePdfRenderer {
    constructor(v, options = {}) {
        this.v = v;
        this.options = options;
        /** Ordonnée du filet de la barre du pied : dépend du nombre de lignes de l'identité légale. */
        this.barY = 1071;
        this.legalLines = [];
    }
    async render() {
        const v = this.v;
        this.c = await PdfCanvas_1.PdfCanvas.create({ weights: true });
        const c = this.c;
        const embedsXml = !!this.options.facturXml;
        const title = `${v.title} ${v.number}`;
        await (0, PDFA3Compliance_1.setupPDFA3Compliance)(c.doc, {
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
        this.layoutBar();
        c.newPage();
        let y = this.header();
        y = this.parties(y);
        y = this.table(y);
        this.closing(y);
        this.bars();
        if (this.options.facturXml) {
            const at = this.options.generatedAt ?? new Date();
            await (0, AFRelationshipFix_1.attachFileWithAFRelationship)(c.doc, Buffer.from(this.options.facturXml, 'utf-8'), 'factur-x.xml', {
                mimeType: 'text/xml', description: 'Factur-X XML Invoice', creationDate: at, modificationDate: at, relationship: 'Data',
            });
        }
        const pdf = await c.doc.save();
        return { pdf, pageCount: c.pages.length };
    }
    // ─── Aides ────────────────────────────────────────────────────────────────
    lh(s) { return this.c.lineHeight(s); }
    /** Texte aligné sur la ligne de base d'un autre style (alignement « baseline » de la maquette). */
    onBaseline(t, x, top, s, ref, align = 'left') {
        this.c.text(t, x, top + this.c.baseline(ref) - this.c.baseline(s), s, align);
    }
    sectionTitle(t, x, y) {
        const s = st(8.5, 600, platform_invoice_html_1.PLATFORM_COLORS.accentText, { ls: 0.22, upper: true });
        this.c.text(t, x, y, s);
        const ruleY = y + this.lh(s) + 5;
        this.c.hline(x, x + COL_W, ruleY, 1, platform_invoice_html_1.PLATFORM_COLORS.rule);
        return ruleY + 1 + 8;
    }
    // ─── Barre du pied : logo, identité légale (retour à la ligne possible), pagination ──
    get legalStyle() { return st(8.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.5 }); }
    get pageStyle() { return st(8.5, 600, platform_invoice_html_1.PLATFORM_COLORS.text); }
    logoWidth() {
        if (!this.logo)
            return 0;
        return this.logo.width * Math.min(120 / this.logo.width, 13 / this.logo.height);
    }
    /** Largeur offerte à l'identité légale entre le logo et « Page x sur n » (espacés de 16). */
    legalWidth() {
        const label = this.c.width(this.v.pageLabel(1, 1), this.pageStyle);
        return W - this.logoWidth() - label - (this.logo ? 32 : 16);
    }
    layoutBar() {
        const { c, v } = this;
        this.legalLines = v.legalBar ? c.lines(v.legalBar, this.legalWidth(), this.legalStyle) : [];
        const rowH = Math.max(13, this.legalLines.length * this.lh(this.legalStyle));
        this.barY = PdfCanvas_1.CANVAS_PAGE_H - (1 + 14 + rowH + 24);
    }
    // ─── En-tête ──────────────────────────────────────────────────────────────
    header() {
        const { c, v } = this;
        // Émetteur
        if (this.logo)
            c.imageContain(this.logo, L, TOP, 266, 24, 'left');
        const sellerStyle = st(9.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.8 });
        const lh = this.lh(sellerStyle);
        let sy = TOP + 24 + 13;
        const nameStyle = st(9.5, 700, platform_invoice_html_1.PLATFORM_COLORS.ink, { lh: 1.8 });
        const first = `${v.seller.name}${v.seller.firstLineRest}`;
        if (c.width(first, sellerStyle) <= 280) {
            c.text(v.seller.name, L, sy, nameStyle);
            c.text(v.seller.firstLineRest, L + c.width(v.seller.name, nameStyle), sy, sellerStyle);
            sy += lh;
        }
        else {
            c.text(v.seller.name, L, sy, nameStyle);
            sy += lh;
            if (v.seller.firstLineRest)
                sy += c.para(v.seller.firstLineRest.replace(/^,\s*/, ''), L, sy, 280, sellerStyle);
        }
        for (const line of v.seller.lines)
            sy += c.para(line, L, sy, 280, sellerStyle);
        // Titre, numéro, dates
        c.rect(R - 26, TOP, 26, 2, { fill: platform_invoice_html_1.PLATFORM_COLORS.accent });
        const titleStyle = st(8.5, 600, platform_invoice_html_1.PLATFORM_COLORS.accentText, { ls: 0.26, upper: true });
        let ry = TOP + 2 + 2 + 6;
        c.text(v.title, R, ry, titleStyle, 'right');
        ry += this.lh(titleStyle) + 6;
        const numberStyle = st(19, 700, platform_invoice_html_1.PLATFORM_COLORS.ink, { ls: -0.01 });
        c.text(v.number, R, ry, numberStyle, 'right');
        ry += this.lh(numberStyle) + 6 + 6;
        const label = st(10, 500, platform_invoice_html_1.PLATFORM_COLORS.text);
        const value = st(10, 600, platform_invoice_html_1.PLATFORM_COLORS.ink);
        // Valeurs alignées à gauche dans une colonne qui se termine à la marge, libellés à droite (maquette).
        const valueW = Math.max(...v.meta.map((m) => c.width(m.value, value)));
        const valueX = R - valueW;
        const rowH = this.lh(label);
        v.meta.forEach((m, i) => {
            const top = ry + i * (rowH + 5);
            c.text(m.label, valueX - 10, top, label, 'right');
            c.text(m.value, valueX, top, value, 'left');
        });
        ry += v.meta.length * rowH + (v.meta.length - 1) * 5;
        const ruleY = Math.max(sy, ry) + 26;
        c.hline(L, R, ruleY, 1, platform_invoice_html_1.PLATFORM_COLORS.ink);
        return ruleY + 1;
    }
    // ─── Client et bloc d'information ────────────────────────────────────────
    parties(y0) {
        const { c, v } = this;
        const top = y0 + 28;
        // Facturé à
        let ly = this.sectionTitle(v.buyerTitle, L, top);
        ly += c.para(v.buyer.name, L, ly, COL_W, st(13, 700));
        ly += 8;
        const bStyle = st(10, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.8 });
        for (const line of v.buyer.lines)
            ly += c.para(line, L, ly, COL_W, bStyle);
        // Abonnement / Opération concernée
        let ry = this.sectionTitle(v.info.title, COL2_X, top);
        const label = st(10, 500, platform_invoice_html_1.PLATFORM_COLORS.text);
        const labelW = Math.max(...v.info.rows.map((r) => c.width(r.label, label)));
        const vx = COL2_X + labelW + 14;
        const vw = COL2_X + COL_W - vx;
        v.info.rows.forEach((r, i) => {
            if (i > 0)
                ry += 6;
            const vs = st(10, r.strong ? 700 : 600, r.color ?? platform_invoice_html_1.PLATFORM_COLORS.ink);
            c.text(r.label, COL2_X, ry, label);
            ry += Math.max(this.lh(label), c.para(r.value, vx, ry, vw, vs));
        });
        return Math.max(ly, ry);
    }
    // ─── Tableau ──────────────────────────────────────────────────────────────
    tableHeader(y) {
        const { c, v } = this;
        const s = st(8.5, 600, platform_invoice_html_1.PLATFORM_COLORS.text, { ls: 0.18, upper: true });
        c.text(v.columns.description, L, y, s);
        c.text(v.columns.quantity, COLS.qtyR, y, s, 'right');
        c.text(v.columns.unitPrice, COLS.priceR, y, s, 'right');
        c.text(v.columns.vat, COLS.vatR, y, s, 'right');
        c.text(v.columns.total, COLS.totalR, y, s, 'right');
        const ruleY = y + this.lh(s) + 9;
        c.hline(L, R, ruleY, 1.5, platform_invoice_html_1.PLATFORM_COLORS.ink);
        return ruleY + 1.5;
    }
    table(partiesBottom) {
        const { c, v } = this;
        let y = this.tableHeader(partiesBottom + 38);
        const desc = st(11.5, 600);
        const cell = st(11.5, 500);
        for (const row of v.rows) {
            const lines = c.lines(row.description, COLS.descW, desc);
            const h = 14 + lines.length * this.lh(desc) + 14;
            if (y + h > this.barY - 24) {
                c.newPage();
                y = this.tableHeader(TOP);
            }
            const top = y + 14;
            c.para(row.description, L, top, COLS.descW, desc);
            c.text(row.quantity, COLS.qtyR, top, cell, 'right');
            c.text(row.unitPrice, COLS.priceR, top, cell, 'right');
            c.text(row.vat, COLS.vatR, top, st(11.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text), 'right');
            c.text(row.total, COLS.totalR, top, st(11.5, 600), 'right');
            y += h;
            c.hline(L, R, y, 1, platform_invoice_html_1.PLATFORM_COLORS.rule);
            y += 1;
        }
        return y;
    }
    // ─── Mentions, totaux, encadré, pied légal (dernière page) ───────────────
    footerHeight() {
        const { c, v } = this;
        const s = st(9, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.75 });
        const cols = v.footer.map((f) => this.lh(s) + 3 + c.paraHeight(f.text, FOOT_W, s));
        return 22 + Math.max(0, ...cols) + 16;
    }
    closing(tableBottom) {
        const { c, v } = this;
        const noteStyle = st(9.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.7 });
        const notesH = v.notes.length ? 12 + v.notes.reduce((s, n) => s + c.paraHeight(n, W, noteStyle), 0) : 0;
        const totalsH = v.totals.reduce((s, t) => s + (t.ruleTop ? 1 : 0) + 7 + this.lh(st(11.5)) + 7, 0) + 1.5 + 12 + this.lh(st(17, 700)) + 10 + this.lh(st(10.5));
        const alertStyle = st(10.5, 500, platform_invoice_html_1.PLATFORM_COLORS.ink, { lh: 1.6 });
        const alertH = v.alert ? 24 + 13 + c.paraHeight(v.alert, W - 32, alertStyle) + 13 + 2 : 0;
        const footH = this.footerHeight();
        const footTop = this.barY - footH;
        let y = tableBottom;
        if (y + notesH + 28 + totalsH + alertH > footTop - 16) {
            c.newPage();
            y = TOP;
        }
        // Mentions sous le tableau
        if (v.notes.length) {
            y += 12;
            for (const n of v.notes)
                y += c.para(n, L, y, W, noteStyle);
        }
        // Totaux
        y += 28;
        const label = st(11.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text);
        for (const t of v.totals) {
            if (t.ruleTop) {
                c.hline(TOTALS_X, R, y, 1, platform_invoice_html_1.PLATFORM_COLORS.rule);
                y += 1;
            }
            c.text(t.label, TOTALS_X, y + 7, label);
            c.text(t.value, R, y + 7, st(11.5, t.strong ? 600 : 500), 'right');
            y += 7 + this.lh(label) + 7;
        }
        c.hline(TOTALS_X, R, y, 1.5, platform_invoice_html_1.PLATFORM_COLORS.accent);
        y += 1.5 + 12;
        const big = st(17, 700);
        c.text(v.grandTotal.value, R, y, big, 'right');
        this.onBaseline(v.grandTotal.label, TOTALS_X, y, st(12, 700), big);
        y += this.lh(big) + 10;
        const restLabel = st(10.5, 500, platform_invoice_html_1.PLATFORM_COLORS.text);
        c.text(v.rest.label, TOTALS_X, y, restLabel);
        c.text(v.rest.value, R, y, st(10.5, 700), 'right');
        y += this.lh(restLabel);
        // Prélèvement refusé
        if (v.alert) {
            y += 24;
            const textH = c.paraHeight(v.alert, W - 32, alertStyle);
            c.rect(L, y, W, textH + 26 + 2, { stroke: platform_invoice_html_1.PLATFORM_COLORS.ink, sw: 1 });
            c.para(v.alert, L + 16, y + 14, W - 32, alertStyle);
        }
        // Conditions et mentions légales, au-dessus de la barre du pied
        c.hline(L, R, footTop, 1, platform_invoice_html_1.PLATFORM_COLORS.rule);
        const fs = st(9, 500, platform_invoice_html_1.PLATFORM_COLORS.text, { lh: 1.75 });
        let fy = footTop + 1 + 22;
        for (const f of v.footer) {
            c.text(f.title, L, fy, st(9, 700, platform_invoice_html_1.PLATFORM_COLORS.ink, { lh: 1.75 }));
            fy += this.lh(fs) + 3;
            fy += c.para(f.text, L, fy, FOOT_W, fs);
        }
    }
    // ─── Barre du pied (chaque page) ─────────────────────────────────────────
    bars() {
        const { c, v } = this;
        const total = c.pages.length;
        const top = this.barY + 1 + 14;
        const ls = this.legalStyle;
        const textH = this.legalLines.length * this.lh(ls);
        const rowH = Math.max(13, textH);
        const logoW = this.logoWidth();
        c.pages.forEach((page, i) => {
            c.page = page;
            c.hline(0, PdfCanvas_1.CANVAS_PAGE_W, this.barY, 1, platform_invoice_html_1.PLATFORM_COLORS.ink);
            if (this.logo)
                c.imageContain(this.logo, L, top + (rowH - 13) / 2, 120, 13, 'left');
            const lx = L + logoW + (this.logo ? 16 : 0);
            this.legalLines.forEach((line, k) => c.text(line, lx, top + (rowH - textH) / 2 + k * this.lh(ls), ls));
            c.text(v.pageLabel(i + 1, total), R, top + (rowH - this.lh(this.pageStyle)) / 2, this.pageStyle, 'right');
        });
    }
}
exports.PlatformInvoicePdfRenderer = PlatformInvoicePdfRenderer;
async function renderPlatformInvoicePdf(view, options = {}) {
    return new PlatformInvoicePdfRenderer(view, options).render();
}
//# sourceMappingURL=PlatformInvoicePdfRenderer.js.map