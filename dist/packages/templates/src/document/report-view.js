"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_TEXT_MAX = exports.REPORT_LINE_MAX = exports.REPORT_TITLE_MAX = exports.REPORT_MAX_TILES = exports.REPORT_MAX_META = exports.REPORT_MAX_ITEMS = exports.REPORT_MAX_BLOCKS = void 0;
exports.reportLine = reportLine;
exports.reportText = reportText;
exports.normalizeReportBlock = normalizeReportBlock;
exports.buildReportView = buildReportView;
/**
 * Vue d'un rapport : normalisation STRICTE des données reçues (bornes, teintes connues,
 * blocs connus, textes nettoyés) et application du réglage de présentation de
 * l'organisation. Aucun calcul métier : la librairie ne fait que borner et mettre en forme.
 */
const settings_1 = require("./settings");
const i18n_1 = require("./i18n");
const color_1 = require("./color");
const view_1 = require("./view");
const report_types_1 = require("./report-types");
exports.REPORT_MAX_BLOCKS = 40;
exports.REPORT_MAX_ITEMS = 200;
exports.REPORT_MAX_META = 4;
exports.REPORT_MAX_TILES = 6;
exports.REPORT_TITLE_MAX = 200;
exports.REPORT_LINE_MAX = 400;
exports.REPORT_TEXT_MAX = 6000;
const REPORT_LABELS = {
    fr: { draft: 'BROUILLON' }, en: { draft: 'DRAFT' }, es: { draft: 'BORRADOR' }, de: { draft: 'ENTWURF' },
};
/** Texte d'une ligne : contrôles retirés, espaces réduits, tronqué. */
function reportLine(v, max = exports.REPORT_LINE_MAX) {
    if (typeof v !== 'string' && typeof v !== 'number')
        return '';
    return String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
/** Texte multi-lignes (synthèse) : sauts de ligne gardés. */
function reportText(v, max = exports.REPORT_TEXT_MAX) {
    if (typeof v !== 'string')
        return '';
    return v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
const opt = (v, max = exports.REPORT_LINE_MAX) => reportLine(v, max) || undefined;
const tone = (v) => (report_types_1.REPORT_TONES.includes(v) ? v : undefined);
const ratio = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
const arr = (v, max = exports.REPORT_MAX_ITEMS) => (Array.isArray(v) ? v.slice(0, max) : []);
const strs = (v, max = 20) => arr(v, max).map((x) => reportLine(x, 120)).filter(Boolean);
function row(r) {
    if (!r || typeof r !== 'object')
        return null;
    const title = reportLine(r.title);
    if (!title)
        return null;
    const out = { title };
    if (r.lead && typeof r.lead === 'object' && reportLine(r.lead.text, 60))
        out.lead = { text: reportLine(r.lead.text, 60), tone: tone(r.lead.tone) };
    if (r.check)
        out.check = true;
    if (opt(r.subtitle))
        out.subtitle = opt(r.subtitle);
    const meta = strs(r.meta, 6);
    if (meta.length)
        out.meta = meta;
    if (opt(r.right, 80)) {
        out.right = opt(r.right, 80);
        out.rightTone = tone(r.rightTone);
    }
    if (opt(r.note)) {
        out.note = opt(r.note);
        out.noteTone = tone(r.noteTone);
    }
    if (r.progress && typeof r.progress === 'object' && reportLine(r.progress.label, 60)) {
        out.progress = { ratio: ratio(r.progress.ratio), label: reportLine(r.progress.label, 60), tone: tone(r.progress.tone) };
    }
    return out;
}
function action(a) {
    if (!a || typeof a !== 'object')
        return null;
    const title = reportLine(a.title);
    if (!title)
        return null;
    return {
        title, badge: opt(a.badge, 40), with: opt(a.with), owner: reportLine(a.owner, 120),
        due: opt(a.due, 60), status: opt(a.status, 60), statusTone: tone(a.statusTone),
    };
}
function day(d) {
    if (!d || typeof d !== 'object')
        return null;
    const label = reportLine(d.label, 60);
    if (!label)
        return null;
    const items = arr(d.items, 40).map((i) => {
        const title = reportLine(i?.title);
        if (!title)
            return null;
        return {
            time: reportLine(i?.time, 30), kind: opt(i?.kind, 30), kindTone: tone(i?.kindTone), title,
            cancelled: !!i?.cancelled, location: opt(i?.location, 120), people: strs(i?.people, 8),
        };
    }).filter((x) => !!x);
    return { label, items };
}
/** Bloc normalisé, ou null s'il est vide ou inconnu (il est alors ignoré, jamais inventé). */
function normalizeReportBlock(raw, inColumn = false) {
    if (!raw || typeof raw !== 'object')
        return null;
    const b = raw;
    const type = String(b.type ?? '');
    if (inColumn && !report_types_1.REPORT_COLUMN_BLOCK_TYPES.includes(type))
        return null;
    switch (type) {
        case 'paragraph': {
            const text = reportText(b.text);
            return text ? { type, title: opt(b.title, 120), badge: opt(b.badge, 60), text } : null;
        }
        case 'callout': {
            const style = ['dark', 'light', 'tint'].includes(b.style) ? b.style : 'light';
            const items = arr(b.items).map((i) => (typeof i === 'string' ? { text: reportLine(i) } : { text: reportLine(i?.text), tone: tone(i?.tone) })).filter((i) => i.text);
            return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), style, items } : null;
        }
        case 'list': {
            const items = arr(b.items).map((i) => {
                const text = typeof i === 'string' ? reportLine(i) : reportLine(i?.text);
                if (!text)
                    return null;
                const details = arr(i?.details, 20).map((d) => ({ who: reportLine(d?.who, 80), text: reportLine(d?.text) })).filter((d) => d.who && d.text);
                return details.length ? { text, details } : { text };
            }).filter((i) => !!i);
            return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), numbered: b.numbered !== false, items } : null;
        }
        case 'rows': {
            const rows = arr(b.rows).map(row).filter((r) => !!r);
            const empty = opt(b.empty, 160);
            if (!rows.length && !empty)
                return null;
            return { type, title: opt(b.title, 120), note: opt(b.note, 120), rows, empty };
        }
        case 'stats': {
            const tiles = arr(b.tiles, exports.REPORT_MAX_TILES).map((t) => ({ value: reportLine(t?.value, 24), label: reportLine(t?.label, 60), note: opt(t?.note, 80), tone: tone(t?.tone) })).filter((t) => t.value && t.label);
            return tiles.length ? { type, tiles } : null;
        }
        case 'bars': {
            const items = arr(b.items, 30).map((i) => ({ label: reportLine(i?.label, 120), note: opt(i?.note, 120), value: reportLine(i?.value, 30), ratio: ratio(i?.ratio), tone: tone(i?.tone) })).filter((i) => i.label);
            return items.length ? { type, title: reportLine(b.title, 120), items } : null;
        }
        case 'distribution': {
            const segments = arr(b.segments, 8).map((s) => ({ label: reportLine(s?.label, 60), count: typeof s?.count === 'number' && Number.isFinite(s.count) ? Math.max(0, Math.round(s.count)) : 0, tone: tone(s?.tone) })).filter((s) => s.label);
            return segments.length ? { type, title: reportLine(b.title, 120), segments } : null;
        }
        case 'people': {
            const people = arr(b.people, 60).map((p) => ({ name: reportLine(p?.name, 120), role: opt(p?.role, 120) })).filter((p) => p.name);
            return people.length ? { type, title: reportLine(b.title, 120), people } : null;
        }
        case 'actions': {
            const items = arr(b.items, 50).map(action).filter((a) => !!a);
            return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), items } : null;
        }
        case 'agenda': {
            const days = arr(b.days, 14).map(day).filter((d) => !!d);
            return days.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), days } : null;
        }
        case 'columns': {
            if (inColumn)
                return null;
            const left = normalizeReportBlock(b.left, true);
            const right = normalizeReportBlock(b.right, true);
            if (left && right)
                return { type, left, right };
            return left ?? right;
        }
        default:
            return null;
    }
}
function buildReportView(data, options = {}) {
    const settings = options.settings ?? settings_1.DEFAULT_DOCUMENT_SETTINGS;
    const language = settings.language;
    const L = (0, i18n_1.getDocumentLabels)(language);
    const locale = i18n_1.DOCUMENT_LOCALES[language];
    const primary = settings.colors.primary;
    const accent = settings.colors.accent;
    const blocks = (Array.isArray(data.blocks) ? data.blocks : []).slice(0, exports.REPORT_MAX_BLOCKS)
        .map((b) => normalizeReportBlock(b)).filter((b) => !!b);
    const meta = (Array.isArray(data.meta) ? data.meta : []).slice(0, exports.REPORT_MAX_META)
        .map((m) => ({ label: reportLine(m?.label, 60), value: reportLine(m?.value, 120) })).filter((m) => m.label && m.value);
    const draftLabel = (REPORT_LABELS[language] ?? REPORT_LABELS.fr).draft;
    const watermark = data.status === 'draft' && settings.statusWatermark ? draftLabel : undefined;
    const generatedAt = typeof data.generatedAt === 'string' && Number.isFinite(Date.parse(data.generatedAt)) ? data.generatedAt : undefined;
    return {
        kind: reportLine(data.kind, 40).replace(/[^a-z0-9_-]/gi, '') || 'report',
        language,
        locale,
        settings,
        theme: { primary, accent, accentTint: (0, color_1.mix)(accent, 0.14) },
        typeLabel: reportLine(data.typeLabel, 60),
        title: reportLine(data.title, exports.REPORT_TITLE_MAX) || reportLine(data.typeLabel, 60),
        subtitle: opt(data.subtitle, 120),
        meta,
        issuer: { name: reportLine(data.issuer?.name, 120) },
        generatedAt,
        blocks,
        footer: { left: opt(data.footer?.left, 120), right: opt(data.footer?.right, 120), sources: opt(data.footer?.sources, 400) },
        labels: { poweredBy: L.poweredBy, page: L.page, of: L.of, continuation: L.continuation, draft: draftLabel },
        showLogo: settings.logo !== 'none',
        poweredBy: settings.showPoweredBy,
        watermark,
        watermarkSize: watermark ? (0, view_1.watermarkFontSize)(watermark) : undefined,
    };
}
//# sourceMappingURL=report-view.js.map