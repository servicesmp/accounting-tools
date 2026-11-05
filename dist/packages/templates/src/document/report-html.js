"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_TONE_SOLID = exports.REPORT_TONE_COLORS = exports.REPORT_PAGE_H = exports.REPORT_PAGE_W = void 0;
exports.reportInitials = reportInitials;
exports.reportAvatarColor = reportAvatarColor;
exports.renderReportHtml = renderReportHtml;
const html_1 = require("./html");
const color_1 = require("./color");
exports.REPORT_PAGE_W = 794;
exports.REPORT_PAGE_H = 1123;
const PAD_X = 60;
const PAD_TOP = 56;
const FOOT_RESERVE = 90;
const C = {
    ink: '#111827', text: '#1F2937', gray: '#6B7280', gray400: '#9CA3AF', gray500: '#4B5563',
    line: '#F3F4F6', line2: '#E5E7EB', surface: '#FAFAFA', white: '#ffffff', slate400: '#94a3b8',
};
/** Couleurs des teintes (identiques dans le PDF). */
exports.REPORT_TONE_COLORS = {
    neutral: { fg: '#374151', bg: '#F3F4F6', border: '#E5E7EB' },
    muted: { fg: '#6B7280', bg: '#F9FAFB', border: '#F3F4F6' },
    primary: { fg: '#111827', bg: '#F3F4F6', border: '#E5E7EB' },
    accent: { fg: '#FF315D', bg: '#FFF1F4', border: '#FFC7D3' },
    success: { fg: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
    warning: { fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    danger: { fg: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    info: { fg: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
};
/** Couleur pleine d'une teinte (pastilles, barres). */
exports.REPORT_TONE_SOLID = {
    neutral: '#9CA3AF', muted: '#D1D5DB', primary: '#111827', accent: '#FF315D', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6',
};
const e = html_1.escapeHtml;
function fontStack(f, fallback) {
    const v = (f ?? '').replace(/[^a-z0-9 ,'"-]/gi, '').trim();
    return v || fallback;
}
/** Initiales d'un nom (2 lettres), pour les avatars. */
function reportInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const ini = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '').slice(0, 2);
    return ini.toLocaleUpperCase('fr-FR');
}
/** Couleur stable d'un avatar à partir du nom. */
function reportAvatarColor(name) {
    const palette = ['#111827', '#2980FF', '#01A888', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];
    let h = 0;
    for (const ch of name)
        h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return palette[h % palette.length];
}
function renderReportHtml(view, options = {}) {
    const v = view;
    const primary = v.theme.primary;
    const accent = v.theme.accent;
    const font = fontStack(options.fontFamily, 'Helvetica, Arial, sans-serif');
    const hfont = fontStack(options.headingFontFamily, `Chillax, ${font}`);
    const logoUrl = v.showLogo ? (0, html_1.safeImageUrl)(options.logoUrl) : null;
    const servicesLogo = (0, html_1.safeImageUrl)(options.servicesLogoUrl);
    const toneFg = (t, fallback = C.text) => (t ? (t === 'primary' ? primary : t === 'accent' ? accent : exports.REPORT_TONE_COLORS[t].fg) : fallback);
    const toneSolid = (t, fallback = C.gray400) => (t ? (t === 'primary' ? primary : t === 'accent' ? accent : exports.REPORT_TONE_SOLID[t]) : fallback);
    const F = (w, size, lh = 'normal', family = font) => `font:${w} ${size}px/${lh} ${family}`;
    const H = (size, w = 600) => `margin:0;${F(w, size, '1.2', hfont)};color:${C.ink}`;
    const small = `${F(600, 10)};letter-spacing:.14em;text-transform:uppercase;color:${C.gray}`;
    const avatar = (name, size, fs) => `<span style="flex:none;width:${size}px;height:${size}px;border-radius:50%;background:${reportAvatarColor(name)};color:#fff;${F(700, fs)};display:flex;align-items:center;justify-content:center">${e(reportInitials(name))}</span>`;
    const chip = (text, t) => {
        const c = exports.REPORT_TONE_COLORS[t ?? 'neutral'];
        return `<span style="height:18px;padding:0 7px;border-radius:5px;display:inline-flex;align-items:center;${F(700, 10)};background:${c.bg};color:${t === 'primary' ? primary : t === 'accent' ? accent : c.fg};border:1px solid ${c.border};box-sizing:border-box;white-space:nowrap">${e(text)}</span>`;
    };
    const sectionTitle = (title, note, size = 18) => (title
        ? `<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><h2 style="${H(size)}">${e(title)}</h2>${note ? `<span style="${F(400, 12)};color:${C.gray}">${e(note)}</span>` : ''}</div>`
        : '');
    // ── En-tête ──────────────────────────────────────────────────────────────
    const header = () => {
        const brand = logoUrl
            ? `<img src="${e(logoUrl)}" alt="" style="display:block;height:28px;max-width:160px;object-fit:contain;object-position:left center">`
            : `<span style="${F(700, 14)};color:${C.ink}">${e(v.issuer.name)}</span>`;
        const meta = v.meta.map((m) => `<div style="display:flex;flex-direction:column;gap:2px;${F(400, 12)};min-width:0"><span style="color:${C.gray}">${e(m.label)}</span><b style="font-weight:600;color:${C.ink}">${e(m.value)}</b></div>`).join('');
        return `<div style="display:flex;flex-direction:column;gap:16px;padding-bottom:18px;border-bottom:2px solid ${primary}">
<div style="display:flex;justify-content:space-between;align-items:center;gap:16px">${brand}<span style="${small}">${e(v.typeLabel)}</span></div>
<div style="display:flex;flex-direction:column;gap:6px"><h1 style="margin:0;${F(700, 32, '1.05', hfont)};letter-spacing:-.02em;color:${C.ink};overflow-wrap:anywhere">${e(v.title)}</h1>${v.subtitle ? `<span style="${F(500, 15)};color:${accent}">${e(v.subtitle)}</span>` : ''}</div>
${meta ? `<div style="display:grid;grid-template-columns:repeat(${Math.max(1, Math.min(4, v.meta.length))},minmax(0,1fr));gap:14px">${meta}</div>` : ''}
</div>`;
    };
    // ── Blocs ────────────────────────────────────────────────────────────────
    const paragraph = (b) => `<div style="display:flex;flex-direction:column;gap:10px">
${b.title || b.badge ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${b.title ? `<h2 style="${H(20)}">${e(b.title)}</h2>` : ''}${b.badge ? `<span style="display:inline-flex;align-items:center;gap:6px;height:20px;padding:0 8px;border-radius:6px;background:${C.line};${F(600, 10)};color:${C.ink}"><span style="width:6px;height:6px;border-radius:50%;background:${primary}"></span>${e(b.badge)}</span>` : ''}</div>` : ''}
<p style="margin:0;${F(400, 14, '1.65')};color:${C.text};white-space:pre-line;overflow-wrap:anywhere">${e(b.text)}</p>
</div>`;
    const callout = (b) => {
        const dark = b.style === 'dark';
        const bg = dark ? primary : b.style === 'tint' ? C.line : C.surface;
        const fg = dark ? C.white : C.ink;
        const border = b.style === 'light' ? `1px solid ${C.line}` : 'none';
        const numbered = b.style !== 'light';
        const items = b.items.map((it, i) => (numbered
            ? `<div style="display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;${F(400, 13, '1.5')}"><b style="font-weight:700;color:${dark ? accent : primary}">${i + 1}</b><span style="overflow-wrap:anywhere">${e(it.text)}</span></div>`
            : `<div style="display:grid;grid-template-columns:8px minmax(0,1fr);gap:10px;align-items:baseline;${F(400, 13, '1.5')}"><span style="width:7px;height:7px;border-radius:50%;background:${toneSolid(it.tone, C.gray400)}"></span><span style="overflow-wrap:anywhere">${e(it.text)}</span></div>`)).join('');
        return `<div style="padding:${dark ? '18px 20px' : '16px 18px'};border-radius:14px;background:${bg};color:${fg};border:${border};display:flex;flex-direction:column;gap:${dark ? 10 : 8}px">
<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="${H(dark ? 17 : 16)};color:${fg}">${e(b.title)}</h2>${b.note ? `<span style="${F(400, 11)};color:${dark ? (0, color_1.blend)(C.white, primary, 0.7) : C.gray}">${e(b.note)}</span>` : ''}</div>
${items}</div>`;
    };
    const list = (b) => {
        const items = b.items.map((it, i) => {
            const details = it.details?.length
                ? `<div style="display:flex;flex-direction:column;gap:6px;padding-left:12px;border-left:2px solid ${C.line};margin:6px 0 2px 36px">${it.details.map((d) => `<div style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start;${F(400, 12, '1.5')}">${avatar(d.who, 20, 7)}<span style="overflow-wrap:anywhere"><b style="font-weight:600">${e(d.who)}</b><span style="color:${C.gray500}"> : ${e(d.text)}</span></span></div>`).join('')}</div>`
                : '';
            return `<div style="display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;padding:8px 0;border-bottom:1px solid ${C.line};${F(400, 13, '1.55')}"><span style="font-weight:600;color:${C.gray400}">${b.numbered ? i + 1 : '•'}</span><span style="overflow-wrap:anywhere">${e(it.text)}</span></div>${details}`;
        }).join('');
        return `<div style="display:flex;flex-direction:column;gap:8px">${sectionTitle(b.title, b.note)}${items}</div>`;
    };
    const rowHtml = (r) => {
        const lead = r.check
            ? `<span style="flex:none;width:16px;height:16px;margin-top:1px;border-radius:50%;background:${exports.REPORT_TONE_SOLID.success};color:#fff;${F(700, 9)};display:flex;align-items:center;justify-content:center">✓</span>`
            : r.lead ? chip(r.lead.text, r.lead.tone) : '';
        const meta = r.meta?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px 12px;${F(400, 11)};color:${C.gray500}">${r.meta.map((m) => `<span>${e(m)}</span>`).join('')}</div>` : '';
        const note = r.note ? `<span style="${F(400, 12)};color:${toneFg(r.noteTone, C.gray500)}">${e(r.note)}</span>` : '';
        const progress = r.progress
            ? `<div style="display:flex;flex-direction:column;gap:5px;width:150px;flex:none;padding-top:3px"><div style="display:flex;justify-content:space-between;${F(400, 11)};color:${C.gray}"><span></span><b style="font-weight:600;color:${C.ink};font-variant-numeric:tabular-nums">${e(r.progress.label)}</b></div><span style="display:block;height:5px;border-radius:3px;background:${C.line};overflow:hidden"><span style="display:block;height:100%;border-radius:3px;background:${toneSolid(r.progress.tone, primary)};width:${Math.round(r.progress.ratio * 100)}%"></span></span></div>`
            : '';
        const right = r.right ? `<span style="flex:none;${F(600, 13)};color:${toneFg(r.rightTone, C.ink)};white-space:nowrap;font-variant-numeric:tabular-nums">${e(r.right)}</span>` : '';
        return `<div style="display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-bottom:1px solid ${C.line}">
${lead}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="${F(400, 13, '1.4')};overflow-wrap:anywhere"><b style="font-weight:600;color:${C.ink}">${e(r.title)}</b>${r.subtitle ? `<span style="color:${C.gray}">, ${e(r.subtitle)}</span>` : ''}</span>${meta}${note}</div>${progress}${right}
</div>`;
    };
    const rows = (b) => `<div style="display:flex;flex-direction:column;gap:4px">${sectionTitle(b.title, b.note)}${b.rows.map(rowHtml).join('')}${!b.rows.length && b.empty ? `<p style="margin:8px 0 0;${F(400, 13)};color:${C.gray}">${e(b.empty)}</p>` : ''}</div>`;
    const stats = (b) => `<div style="display:grid;grid-template-columns:repeat(${b.tiles.length},minmax(0,1fr));border:1px solid ${C.line2};border-radius:12px;overflow:hidden">
${b.tiles.map((t, i) => `<div style="display:flex;flex-direction:column;gap:3px;padding:13px 15px;border-left:${i ? `1px solid ${C.line2}` : 'none'};min-width:0"><span style="${F(600, 25, '1.1', hfont)};color:${toneFg(t.tone, C.ink)};font-variant-numeric:tabular-nums">${e(t.value)}</span><span style="${F(600, 11)};color:${C.ink}">${e(t.label)}</span>${t.note ? `<span style="${F(400, 10.5)};color:${C.gray}">${e(t.note)}</span>` : ''}</div>`).join('')}
</div>`;
    const bars = (b) => `<div style="display:flex;flex-direction:column;gap:9px;min-width:0">
<h3 style="margin:0;${small}">${e(b.title)}</h3>
${b.items.map((it) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) 90px 52px;align-items:center;gap:10px;${F(400, 12)}"><span style="min-width:0;display:flex;flex-direction:column"><b style="font-weight:600;color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(it.label)}</b>${it.note ? `<span style="color:${C.gray};font-size:10.5px">${e(it.note)}</span>` : ''}</span><span style="height:6px;border-radius:3px;background:${C.line};overflow:hidden"><span style="display:block;height:100%;border-radius:3px;background:${toneSolid(it.tone, primary)};width:${Math.round(it.ratio * 100)}%"></span></span><b style="font-weight:600;text-align:right;font-variant-numeric:tabular-nums;color:${C.ink}">${e(it.value)}</b></div>`).join('')}
</div>`;
    const distribution = (b) => {
        const total = b.segments.reduce((s, x) => s + x.count, 0) || 1;
        return `<div style="display:flex;flex-direction:column;gap:9px;min-width:0">
<h3 style="margin:0;${small}">${e(b.title)}</h3>
<div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:${C.line}">${b.segments.map((s) => `<span style="height:100%;background:${toneSolid(s.tone)};width:${(100 * s.count) / total}%"></span>`).join('')}</div>
${b.segments.map((s) => `<div style="display:flex;align-items:center;gap:8px;${F(400, 12)}"><span style="width:8px;height:8px;border-radius:2px;background:${toneSolid(s.tone)}"></span><span style="flex:1;color:${C.ink}">${e(s.label)}</span><b style="font-weight:600;color:${C.ink}">${s.count}</b></div>`).join('')}
</div>`;
    };
    const people = (b) => `<div style="display:flex;flex-direction:column;gap:10px">
<span style="${small}">${e(b.title)}</span>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 16px">${b.people.map((p) => `<div style="display:flex;align-items:center;gap:8px;min-width:0">${avatar(p.name, 26, 9)}<span style="min-width:0;display:flex;flex-direction:column;line-height:1.25"><b style="${F(600, 12)};color:${C.ink};overflow-wrap:anywhere">${e(p.name)}</b>${p.role ? `<span style="${F(400, 11)};color:${C.gray}">${e(p.role)}</span>` : ''}</span></div>`).join('')}</div>
</div>`;
    const actions = (b) => `<div style="display:flex;flex-direction:column;gap:6px">
${sectionTitle(b.title, b.note)}
${b.items.map((a, i) => `<div style="display:grid;grid-template-columns:22px minmax(0,1fr) 140px 90px 110px;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid ${C.line};${F(400, 12)}">
<span style="color:${C.gray400};font-weight:600">${i + 1}</span>
<div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${a.badge ? chip(a.badge, 'info') : ''}<b style="${F(600, 13)};color:${C.ink};overflow-wrap:anywhere">${e(a.title)}</b></span>${a.with ? `<span style="${F(400, 11)};color:${exports.REPORT_TONE_COLORS.info.fg}">${e(a.with)}</span>` : ''}</div>
<span style="display:flex;align-items:center;gap:6px;min-width:0">${a.owner ? avatar(a.owner, 18, 7) : ''}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${C.ink}">${e(a.owner)}</span></span>
<span style="white-space:nowrap;color:${C.ink}">${e(a.due ?? '')}</span>
<span style="text-align:right;font-weight:600;color:${toneFg(a.statusTone, C.gray)};white-space:nowrap">${e(a.status ?? '')}</span>
</div>`).join('')}
</div>`;
    const agendaDay = (d) => `<div style="display:grid;grid-template-columns:90px minmax(0,1fr);gap:14px">
<b style="${F(600, 12)};color:${C.ink};padding-top:6px">${e(d.label)}</b>
<div style="display:flex;flex-direction:column">${d.items.map((it) => `<div style="display:grid;grid-template-columns:78px minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid ${C.line};${F(400, 12)}">
<span style="color:${C.gray};font-variant-numeric:tabular-nums">${e(it.time)}</span>
<span style="min-width:0;display:flex;flex-direction:column;gap:1px"><span style="display:flex;align-items:center;gap:6px;min-width:0">${it.kind ? `<span style="${F(700, 9)};letter-spacing:.06em;text-transform:uppercase;color:${toneSolid(it.kindTone, C.gray)}">${e(it.kind)}</span>` : ''}<b style="font-weight:600;color:${it.cancelled ? C.gray400 : C.ink};text-decoration:${it.cancelled ? 'line-through' : 'none'};overflow-wrap:anywhere">${e(it.title)}</b></span>${it.location ? `<span style="${F(400, 11)};color:${C.gray}">${e(it.location)}</span>` : ''}</span>
<span style="display:flex;gap:2px">${(it.people ?? []).map((p) => avatar(p, 16, 6)).join('')}</span>
</div>`).join('')}</div>
</div>`;
    const agenda = (b) => `<div style="display:flex;flex-direction:column;gap:12px">${sectionTitle(b.title, b.note)}${b.days.map(agendaDay).join('')}</div>`;
    const block = (b) => {
        switch (b.type) {
            case 'paragraph': return paragraph(b);
            case 'callout': return callout(b);
            case 'list': return list(b);
            case 'rows': return rows(b);
            case 'stats': return stats(b);
            case 'bars': return bars(b);
            case 'distribution': return distribution(b);
            case 'people': return people(b);
            case 'actions': return actions(b);
            case 'agenda': return agenda(b);
            case 'columns': return `<div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:28px">${block(b.left)}${block(b.right)}</div>`;
        }
    };
    // ── Pied ─────────────────────────────────────────────────────────────────
    const powered = v.poweredBy
        ? `<span style="display:flex;align-items:center;gap:6px;padding-right:10px;border-right:1px solid ${C.line2}"><span style="${F(400, 8)};color:${C.slate400};white-space:nowrap">${e(v.labels.poweredBy)}</span>${servicesLogo ? `<img src="${e(servicesLogo)}" alt="Services" style="height:11px;display:block">` : `<b style="font-size:9px;color:${C.ink}">Services</b>`}</span>`
        : '';
    const footer = `<div style="position:absolute;left:${PAD_X}px;right:${PAD_X}px;bottom:34px;padding-top:10px;border-top:1px solid ${C.line};display:flex;justify-content:space-between;align-items:center;gap:16px;${F(400, 9)};color:${C.gray}">
<span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(v.footer.left ?? v.issuer.name)}</span>
<div style="display:flex;align-items:center;gap:10px;flex:none">${v.footer.right ? `<span style="white-space:nowrap">${e(v.footer.right)}</span>` : ''}${powered}<span style="white-space:nowrap;color:${C.slate400}">${e(`${v.labels.page} 1 ${v.labels.of} 1`)}</span></div>
</div>`;
    const sources = v.footer.sources ? `<p style="margin:auto 0 0;padding-top:20px;${F(400, 11, '1.5')};color:${C.gray400};overflow-wrap:anywhere">${e(v.footer.sources)}</p>` : '';
    const watermark = v.watermark
        ? `<div aria-hidden="true" style="position:absolute;left:58%;top:${Math.round(exports.REPORT_PAGE_H * 0.54)}px;transform:translate(-50%,-50%) rotate(-32deg);${F(700, v.watermarkSize ?? 110)};letter-spacing:.06em;color:${primary};opacity:.07;white-space:nowrap;pointer-events:none">${e(v.watermark)}</div>`
        : '';
    const id = options.id ? ` id="${e(options.id)}"` : '';
    return `<div${id} class="acc-report acc-report--${e(v.kind)}" lang="${e(v.language)}" style="width:${exports.REPORT_PAGE_W}px;min-height:${exports.REPORT_PAGE_H}px;background:#fff;position:relative;overflow:hidden;font-family:${font};font-size:13px;line-height:normal;color:${C.ink};box-sizing:border-box;text-align:left">
${watermark}
<div style="position:relative;padding:${PAD_TOP}px ${PAD_X}px ${FOOT_RESERVE}px;min-height:${exports.REPORT_PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;gap:26px">
${header()}
${v.blocks.map(block).join('\n')}
${sources}
</div>
${footer}
</div>`;
}
//# sourceMappingURL=report-html.js.map