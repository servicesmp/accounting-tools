"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMESHEET_TONES = exports.TIMESHEET_COLORS = exports.TIMESHEET_FOOT_RESERVE = exports.TIMESHEET_SIDE = exports.TIMESHEET_PAGE_H = exports.TIMESHEET_PAGE_W = void 0;
exports.renderTimesheetHtml = renderTimesheetHtml;
/**
 * Rendu HTML d'un relevé de temps (`TimesheetView`) — même feuille que les devis et factures
 * (`html.ts` : 794 × 1123 px, marges de 56, pied réservé de 130, palette ardoise, corps 11 px) et
 * même pied (mentions, « Document émis avec Services », pagination). Maquette « Relevé de temps »
 * (Claude Design, variantes simple et détaillée). Le PDF (`TimesheetPdfRenderer`) dessine la même
 * chose, paginée.
 *
 * Fragment autonome (styles en ligne), toutes les chaînes échappées, URL filtrées. À l'écran la
 * feuille s'allonge au lieu de se paginer.
 */
const html_1 = require("./html");
exports.TIMESHEET_PAGE_W = 794;
exports.TIMESHEET_PAGE_H = 1123;
exports.TIMESHEET_SIDE = 56;
exports.TIMESHEET_FOOT_RESERVE = 130;
/** Palette des documents commerciaux (`html.ts`) ; pied en #64748b (contraste 4,8:1). */
exports.TIMESHEET_COLORS = {
    text: '#1e293b', ink: '#111111', slate500: '#64748b', slate600: '#475569', slate700: '#334155', slate400: '#94a3b8',
    line: '#e2e8f0', rowRule: '#eef0f2', surface: '#f8fafc', gray: '#808080', white: '#ffffff',
};
exports.TIMESHEET_TONES = {
    neutral: { fg: '#475569', border: '#cbd5e1' },
    info: { fg: '#1D4ED8', border: '#BFDBFE' },
    success: { fg: '#047857', border: '#A7F3D0' },
    danger: { fg: '#B91C1C', border: '#FECACA' },
};
const C = exports.TIMESHEET_COLORS;
const e = html_1.escapeHtml;
function fontStack(f) {
    const v = (f ?? '').replace(/[^a-z0-9 ,'"-]/gi, '').trim();
    return v || 'Chillax, Helvetica, Arial, sans-serif';
}
function renderTimesheetHtml(view, options = {}) {
    const v = view;
    const L = v.labels;
    const font = fontStack(options.fontFamily);
    const logoUrl = v.showLogo ? (0, html_1.safeImageUrl)(options.logoUrl) : null;
    const servicesLogo = (0, html_1.safeImageUrl)(options.servicesLogoUrl);
    const F = (w, size, lh = 'normal') => `font:${w} ${size}px/${lh} ${font}`;
    const caps = (color = C.slate600) => `${F(700, 9)};letter-spacing:.1em;text-transform:uppercase;color:${color}`;
    const small = `${F(400, 8)};letter-spacing:.12em;text-transform:uppercase;color:${C.gray}`;
    const wrap = 'overflow-wrap:anywhere';
    // ── En-tête ──────────────────────────────────────────────────────────────
    const tone = exports.TIMESHEET_TONES[v.status.tone];
    const pill = `<span style="display:inline-block;padding:3px 8px;border:1px solid ${tone.border};border-radius:4px;${F(700, 8)};letter-spacing:.08em;text-transform:uppercase;color:${tone.fg};white-space:nowrap">${e(v.status.label)}</span>`;
    const meta = [...v.meta.map((m) => `<span style="color:${C.slate500}">${e(m.label)}</span><span style="font-weight:700;text-align:right;color:${C.ink}">${e(m.value)}</span>`),
        `<span style="color:${C.slate500};align-self:center">${e(L.status)}</span><span style="text-align:right">${pill}</span>`].join('');
    const header = `<div style="padding:52px 0 0;display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
<div style="display:flex;gap:14px;align-items:center;min-width:0">${logoUrl ? `<img src="${e(logoUrl)}" alt="" style="width:50px;height:50px;object-fit:contain;display:block;flex:none">` : ''}<div style="display:flex;flex-direction:column;gap:6px;min-width:0"><span style="${F(700, 34, '1.05')};letter-spacing:-.01em;color:${C.ink}">${e(v.title)}</span><span style="${F(400, 11)};color:${C.slate500};${wrap}">${e(v.subtitle)}</span></div></div>
<div style="display:grid;grid-template-columns:auto auto;gap:6px 18px;font-size:11px;flex:none">${meta}</div>
</div>`;
    // ── Parties et bandeau ───────────────────────────────────────────────────
    const party = (p) => `<div style="display:flex;flex-direction:column;gap:4px;font-size:11px;min-width:0"><span style="${caps()};margin-bottom:4px">${e(p.heading)}</span><span style="${F(700, 12)};color:${C.ink};${wrap}">${e(p.name)}</span>${p.lines.map((l) => `<span style="${wrap}">${e(l)}</span>`).join('')}${p.muted.map((l, i) => `<span style="color:${C.slate500};font-size:10px;${i === 0 ? 'margin-top:4px;' : ''}${wrap}">${e(l)}</span>`).join('')}</div>`;
    const parties = `<div style="padding-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${party(v.provider)}${party(v.client)}</div>`;
    const band = `<div style="padding-top:24px;display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:20px;${F(400, 10.5, '1.55')}">${v.band.map((c) => `<div style="display:flex;flex-direction:column;min-width:0"><span style="${small};margin-bottom:6px">${e(c.label)}</span><b style="color:${C.ink};${wrap}">${e(c.value)}</b></div>`).join('')}</div>`;
    const th = (label, align = 'left') => `<span style="${F(700, 9)};letter-spacing:.06em;text-transform:uppercase;color:${C.slate600};text-align:${align}">${e(label)}</span>`;
    const callout = (c) => typeof c === 'string'
        ? `<div style="margin-top:18px;padding:10px 14px;border-left:3px solid ${C.ink};background:${C.surface};font-size:10px;line-height:1.55;color:${C.slate700}">${e(c)}</div>`
        : `<div style="margin-top:14px;padding:10px 14px;border-left:3px solid ${C.ink};background:${C.surface};display:flex;justify-content:space-between;gap:16px;font-size:10px;line-height:1.55;color:${C.slate700}"><span style="${wrap}">${e(c.label)}</span><b style="color:${C.ink};white-space:nowrap">${e(c.value)}</b></div>`;
    // ── Version simple ───────────────────────────────────────────────────────
    const simple = () => {
        const cols = v.simple.columns;
        const grid = cols.length === 3 ? 'minmax(0,1fr) 90px 90px' : 'minmax(0,1fr) 90px';
        const row = (cells) => `<div style="display:grid;grid-template-columns:${grid};gap:10px;align-items:baseline">${cells.join('')}</div>`;
        const head = `<div style="padding:9px 12px;background:${C.surface};border-bottom:1px solid ${C.line}">${row(cols.map((c, i) => th(c, i === 0 ? 'left' : 'right')))}</div>`;
        const body = v.simple.rows.length
            ? v.simple.rows.map((r) => `<div style="padding:6px 12px;border-bottom:1px solid ${C.rowRule};font-size:10.5px">${row([
                `<span style="color:${r.muted ? C.slate500 : C.text};${wrap}">${e(r.day)}</span>`,
                `<span style="text-align:right;color:${C.slate600};white-space:nowrap">${e(r.duration)}</span>`,
                ...(cols.length === 3 ? [`<span style="text-align:right;font-weight:700;color:${C.ink};white-space:nowrap">${e(r.equivalent ?? '')}</span>`] : []),
            ])}</div>`).join('')
            : `<div style="padding:14px 12px;border-bottom:1px solid ${C.rowRule};font-size:10.5px;color:${C.slate500}">${e(L.noEntries)}</div>`;
        const t = v.simple.total;
        const total = `<div style="padding:12px 12px;border-top:1px solid ${C.ink};${F(700, 12)};color:${C.ink}">${row([
            `<span>${e(t.day)}</span>`, `<span style="text-align:right;white-space:nowrap">${e(t.duration)}</span>`,
            ...(cols.length === 3 ? [`<span style="text-align:right;white-space:nowrap">${e(t.equivalent ?? '')}</span>`] : []),
        ])}</div>`;
        return `<div style="margin-top:24px">${head}${body}${total}</div>${callout(v.note)}`;
    };
    // ── Version détaillée ────────────────────────────────────────────────────
    const detailed = () => {
        const d = v.detailed;
        const grid = '62px 96px minmax(0,1fr) 54px 44px 84px';
        const row = (cells, extra = '') => `<div style="display:grid;grid-template-columns:${grid};gap:10px;align-items:baseline;${extra}">${cells.join('')}</div>`;
        const head = `<div style="padding:9px 12px;background:${C.surface};border-bottom:1px solid ${C.line}">${row(d.columns.map((c, i) => th(c, i >= 3 ? (i === 4 ? 'center' : 'right') : 'left')))}</div>`;
        const weeks = d.weeks.map((w) => {
            const title = `<div style="padding:9px 12px 7px;border-bottom:1px solid ${C.rowRule};${F(700, 9.5)};color:${C.ink}">${e(w.label)}</div>`;
            const rows = w.rows.map((r) => {
                const fg = r.excluded ? C.slate400 : C.text;
                return `<div style="padding:6px 12px;border-bottom:1px solid ${C.rowRule};font-size:10px">${row([
                    `<span style="color:${fg};white-space:nowrap">${e(r.date)}</span>`,
                    `<span style="color:${fg};white-space:nowrap">${e(r.slot)}</span>`,
                    `<span style="color:${fg};${wrap}">${e(r.task)}${r.detail ? `<span style="display:block;margin-top:2px;font-size:9.5px;color:${C.slate500}">${e(r.detail)}</span>` : ''}</span>`,
                    `<span style="text-align:right;color:${fg};white-space:nowrap">${e(r.duration)}</span>`,
                    `<span style="text-align:center;color:${r.excluded ? exports.TIMESHEET_TONES.danger.fg : C.slate500}">${e(r.billable)}</span>`,
                    `<span style="text-align:right;color:${fg};white-space:nowrap">${e(r.amount)}</span>`,
                ])}</div>`;
            }).join('');
            const sub = `<div style="padding:8px 12px;background:${C.surface};border-bottom:1px solid ${C.rowRule};${F(700, 9.5)};color:${C.ink}"><div style="display:grid;grid-template-columns:minmax(0,1fr) 54px 44px 84px;gap:10px"><span>${e(w.subtotal.label)}</span><span style="text-align:right">${e(w.subtotal.duration)}</span><span></span><span style="text-align:right">${e(w.subtotal.amount)}</span></div></div>`;
            return title + rows + sub;
        }).join('') || `<div style="padding:14px 12px;font-size:10.5px;color:${C.slate500}">${e(L.noEntries)}</div>`;
        const summary = d.summary.map((c) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:4px 0;font-size:10.5px;color:${C.slate600}"><span>${e(c.label)}</span><span style="color:${C.text};white-space:nowrap">${e(c.value)}</span></div>`).join('');
        const grand = d.grandTotal
            ? `<div style="margin-top:10px;padding-top:12px;border-top:1px solid ${C.ink};display:flex;justify-content:space-between;align-items:baseline;gap:16px"><span style="${F(700, 12)};color:${C.ink}">${e(d.grandTotal.label)}</span><span style="${F(700, 16)};color:${C.ink};white-space:nowrap">${e(d.grandTotal.value)}</span></div>`
            : '';
        const billing = `<div style="margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:28px">
<div style="display:flex;flex-direction:column;gap:5px"><span style="${caps()};margin-bottom:3px">${e(d.billing.heading)}</span>${d.billing.lines.map((l) => `<span style="font-size:9.5px;line-height:1.55;color:${C.slate600}">${e(l)}</span>`).join('')}</div>
<div>${summary}${grand}</div></div>`;
        return `<div style="margin-top:24px">${head}${weeks}</div>${d.notes.map(callout).join('')}${billing}`;
    };
    // ── Validation ───────────────────────────────────────────────────────────
    const block = (b) => {
        const t = exports.TIMESHEET_TONES[b.tone];
        return `<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span style="${caps(b.tone === 'neutral' ? C.slate600 : t.fg)};margin-bottom:4px">${e(b.heading)}</span>${b.name ? `<span style="${F(700, 12)};color:${C.ink};${wrap}">${e(b.name)}</span>` : ''}${b.lines.map((l) => `<span style="font-size:9.5px;line-height:1.5;color:${C.slate500};${wrap}">${e(l)}</span>`).join('')}${b.emphasis ? `<span style="font-size:9.5px;line-height:1.5;color:${t.fg};${wrap}">${e(b.emphasis)}</span>` : ''}</div>`;
    };
    const validation = `<div style="margin-top:26px;padding-top:22px;border-top:1px solid ${C.line};display:grid;grid-template-columns:1fr 1fr;gap:18px">${block(v.submitted)}${block(v.decision)}</div>`;
    // ── Pied ─────────────────────────────────────────────────────────────────
    const powered = v.poweredBy
        ? `<span style="display:flex;align-items:center;gap:6px;padding-right:10px;border-right:1px solid ${C.line}"><span style="${F(400, 8)};color:${C.slate500};white-space:nowrap">${e(L.poweredBy)}</span>${servicesLogo ? `<img src="${e(servicesLogo)}" alt="Services" style="height:11px;display:block">` : `<b style="font-size:9px;color:${C.ink}">Services</b>`}</span>`
        : '';
    const footer = `<div style="position:absolute;left:${exports.TIMESHEET_SIDE}px;right:${exports.TIMESHEET_SIDE}px;bottom:34px;padding-top:12px;border-top:1px solid ${C.line};display:flex;justify-content:space-between;align-items:flex-end;gap:20px;font-size:8.5px;color:${C.slate500}">
<span style="max-width:500px;line-height:1.5;${wrap}">${e([v.legal, v.closing].filter(Boolean).map((t) => (/[.!?]$/.test(String(t).trim()) ? String(t).trim() : `${String(t).trim()}.`)).join(' '))}</span>
<div style="display:flex;align-items:center;gap:10px;flex:none">${powered}<span style="white-space:nowrap">${e(`${L.page} 1 ${L.of} 1`)}</span></div>
</div>`;
    const watermark = v.watermark
        ? `<div aria-hidden="true" style="position:absolute;left:58%;top:${Math.round(exports.TIMESHEET_PAGE_H * 0.54)}px;transform:translate(-50%,-50%) rotate(-32deg);${F(700, v.watermarkSize ?? 110)};letter-spacing:.06em;color:${C.ink};opacity:.07;white-space:nowrap;pointer-events:none">${e(v.watermark)}</div>`
        : '';
    const id = options.id ? ` id="${e(options.id)}"` : '';
    return `<div${id} class="acc-document acc-timesheet acc-timesheet--${e(v.variant)}" lang="${e(v.language)}" style="width:${exports.TIMESHEET_PAGE_W}px;min-height:${exports.TIMESHEET_PAGE_H}px;background:#fff;position:relative;overflow:hidden;font-family:${font};font-size:11px;line-height:normal;color:${C.text};box-sizing:border-box;text-align:left">
${watermark}
<div style="position:relative;padding:0 ${exports.TIMESHEET_SIDE}px ${exports.TIMESHEET_FOOT_RESERVE}px;min-height:${exports.TIMESHEET_PAGE_H}px;box-sizing:border-box">
${header}
${parties}
${band}
${v.variant === 'detailed' ? detailed() : simple()}
${validation}
</div>
${footer}
</div>`;
}
//# sourceMappingURL=timesheet-html.js.map