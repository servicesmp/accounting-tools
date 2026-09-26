"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.safeImageUrl = safeImageUrl;
exports.renderDocumentHtml = renderDocumentHtml;
const color_1 = require("./color");
const pattern_1 = require("./pattern");
const PAGE_W = 794;
const PAGE_H = 1123;
const SIDE = 56;
const SIDEBAR_W = 236;
const SIDEBAR_MAIN_L = 272;
/** Place réservée au pied de page (mentions légales + marge basse), pour que le contenu ne passe pas dessous. */
const FOOT_RESERVE = 130;
const C = {
    text: '#1e293b', ink: '#111111', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
    slate400: '#94a3b8', slate300: '#cbd5e1', line: '#e2e8f0', rowRule: '#eef0f2', surface: '#f8fafc',
    gray: '#808080', white: '#ffffff',
};
// ─── Sécurité ────────────────────────────────────────────────────────────────
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Échappe un texte pour le contenu ou un attribut HTML. */
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}
const e = escapeHtml;
/** URL d'image autorisée : http(s), chemin relatif à l'origine, ou data:image raster/SVG en base64. */
function safeImageUrl(url) {
    if (typeof url !== 'string')
        return null;
    const u = url.trim();
    if (!u)
        return null;
    if (/^https?:\/\/[^\s"'<>]+$/i.test(u))
        return u;
    if (/^\/(?!\/)[^\s"'<>]*$/.test(u))
        return u;
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(u))
        return u.replace(/\s+/g, '');
    return null;
}
function color(c, fallback) {
    return (0, color_1.normalizeHex)(c) ?? fallback;
}
function fontStack(f) {
    const v = (f ?? '').replace(/[^a-z0-9 ,'"-]/gi, '').trim();
    return v || 'Helvetica, Arial, sans-serif';
}
// ─── Rendu ───────────────────────────────────────────────────────────────────
/** Rend la vue d'un document en fragment HTML fidèle à la maquette. */
function renderDocumentHtml(view, options = {}) {
    const v = view;
    const s = v.settings;
    const L = v.labels;
    const frame = s.layout.frame;
    const primary = color(v.theme.primary, '#111111');
    const accent = color(v.theme.accent, '#067d62');
    const accentTint = color(v.theme.accentTint, (0, color_1.mix)(accent, 0.14));
    const font = fontStack(options.fontFamily);
    const sb = frame === 'sidebar';
    const labelC = frame === 'hero' ? C.gray : accent;
    const logoUrl = s.logo !== 'none' ? safeImageUrl(options.logoUrl) : null;
    const qrUrl = safeImageUrl(options.qrImageUrl);
    const servicesLogo = safeImageUrl(options.servicesLogoUrl);
    const above = s.logo === 'above';
    const white = C.white;
    const F = (w, size, lineHeight = '') => `font:${w} ${size}px${lineHeight} ${font}`;
    const lab = (c) => `${F(700, 9)};letter-spacing:.1em;text-transform:uppercase;color:${c}`;
    const img = (url, w, h, style = '') => `<img src="${e(url)}" alt="" style="width:${w}px;height:${h}px;object-fit:contain;display:block;${style}">`;
    // Cadre blanc du QR : marge intérieure en plus de l'image (content-box explicite).
    // Avec box-sizing:border-box hérité de la page (Tailwind), l'ancien cadre à
    // bordure rognait l'image : QR coupé en bas et à droite, donc illisible.
    const qrFrame = (size, pad, line) => `display:block;flex:none;box-sizing:content-box;width:${size}px;height:${size}px;padding:${pad}px;background:#fff;line-height:0;overflow:hidden${line ? `;border:1px solid ${line}` : ''}`;
    // ── En-têtes ──────────────────────────────────────────────────────────────
    // Logo affiché tel quel (proportions conservées), sans pastille ni cadre de couleur :
    // l'ancien rond / carré arrondi recadrait les logos et ajoutait une forme étrangère.
    const logoBox = (size, _inner, _bg, _radius) => logoUrl ? img(logoUrl, size, size, 'flex:none') : '';
    const logoWrap = `display:flex;gap:14px;align-items:${above ? 'flex-start' : 'center'};flex-direction:${above ? 'column' : 'row'}`;
    const headerStandard = () => {
        const meta = [
            `<span style="color:${C.slate500}">${e(L.number)}</span><span style="font-weight:700;text-align:right">${e(v.number)}</span>`,
            `<span style="color:${C.slate500}">${e(L.issue)}</span><span style="text-align:right">${e(v.issueDate)}</span>`,
            v.due ? `<span style="color:${C.slate500}">${e(v.due.label)}</span><span style="text-align:right;font-weight:700;color:${accent}">${e(v.due.value)}</span>` : '',
        ].join('');
        return `<div style="padding:52px 0 0;display:flex;justify-content:space-between;align-items:flex-start">
<div style="${logoWrap}">${logoBox(50, 50, null, '0')}<div style="display:flex;flex-direction:column;gap:6px"><span style="${F(700, 34)};letter-spacing:-.01em;color:${C.ink}">${e(v.title)}</span><span style="${F(400, 11)};color:${C.slate500}">${e([v.seller.name, v.seller.city].filter(Boolean).join(' · '))}</span></div></div>
<div style="display:grid;grid-template-columns:auto auto;gap:6px 18px;font-size:11px">${meta}</div>
</div><div style="margin-top:26px;height:1px;background:${C.line}"></div>`;
    };
    const headerBand = () => {
        const cell = (label, value) => `<div style="padding:14px 0;display:flex;flex-direction:column;gap:4px"><span style="font-size:8px;color:${(0, color_1.blend)(white, primary, 0.65)};text-transform:uppercase;letter-spacing:.1em">${e(label)}</span><span style="${F(700, 12)}">${e(value)}</span></div>`;
        return `<div style="position:relative;margin:0 -56px 0 -56px;background:${primary};color:#fff;padding:40px 56px 0">
${s.pattern ? pattern() : ''}
<div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start">
<div style="${logoWrap}">${logoBox(50, 40, white, '12px')}<div style="display:flex;flex-direction:column;gap:4px"><span style="${F(700, 19)}">${e(v.seller.name)}</span><span style="${F(400, 10)};color:${(0, color_1.blend)(white, primary, 0.78)}">${e([v.seller.oneLineNoCountry, v.seller.id].filter(Boolean).join(' · '))}</span></div></div>
<span style="${F(700, 28)};letter-spacing:.05em;color:${accent}">${e(v.title)}</span></div>
<div style="position:relative;margin-top:28px;display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid ${(0, color_1.blend)(white, primary, 0.18)}">
${cell(L.number, v.number)}${cell(L.issue, v.issueDate)}${v.due ? cell(v.due.label, v.due.value) : '<div></div>'}
<div style="padding:14px 0;display:flex;flex-direction:column;gap:4px;background:${accent};margin-right:-56px;padding-left:18px"><span style="font-size:8px;color:${(0, color_1.blend)(white, accent, 0.85)};text-transform:uppercase;letter-spacing:.1em">${e(L.grandTotal)}</span><span style="${F(700, 14)}">${e(v.grandTotal)}</span></div>
</div></div>`;
    };
    const headerSidebarTitle = () => `<div style="padding:52px 0 0;display:flex;flex-direction:column;gap:6px"><span style="${F(700, 40, '/1')};letter-spacing:-.02em;color:${primary}">${e(v.title)}</span><span style="width:48px;height:4px;background:${accent};margin-top:10px"></span></div>`;
    const headerHero = () => `<div style="padding:52px 0 0">
<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:10px;align-items:center">${logoBox(30, 30, null, '0')}<span style="${F(700, 12)};color:${C.ink}">${e(v.seller.name)}</span></div><span style="${F(700, 11)};letter-spacing:.2em;color:${C.ink}">${e(`${v.title} · ${v.number}`)}</span></div>
<div style="margin-top:44px;padding:0 0 30px;border-bottom:2px solid ${C.ink};display:flex;justify-content:space-between;align-items:flex-end">
<div style="display:flex;flex-direction:column;gap:8px"><span style="${F(400, 11)};color:${C.slate500}">${e(v.amountLabel)}</span><span style="${F(700, 64, '/1')};letter-spacing:-.035em;color:${primary};white-space:nowrap">${e(v.grandTotal)}</span></div>
${v.due ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:11px"><span style="color:${C.slate500}">${e(v.due.label)}</span><span style="${F(700, 16)};color:${C.ink}">${e(v.due.value)}</span></div>` : ''}
</div></div>`;
    const headerCentered = () => {
        const meta = [`${L.number} ${v.number}`, `${L.issue} ${v.issueDate}`, ...(v.due ? [`${v.due.label} ${v.due.value}`] : [])].join(' · ');
        return `<div style="padding:48px 0 0;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
${logoBox(60, 42, primary, '9999px')}
<span style="${F(700, 17)};color:${C.ink}">${e(v.seller.name)}</span><span style="${F(400, 10)};color:${C.slate500}">${e([v.seller.oneLineNoCountry, v.seller.vat].filter(Boolean).join(' · '))}</span>
<span style="margin-top:14px;padding:8px 22px;border-radius:9999px;background:${accentTint};color:${accent};${F(700, 14)};letter-spacing:.14em">${e(v.title)}</span>
<span style="${F(400, 11)};color:${C.slate600}">${e(meta)}</span>
</div>`;
    };
    // ── Parties ───────────────────────────────────────────────────────────────
    const partyStyle = s.layout.parties;
    const partyPad = partyStyle === 'plain' ? '0' : '14px 16px';
    const partyRad = partyStyle === 'card' ? '12px' : '0';
    const partyBg = partyStyle === 'card' ? (0, color_1.mix)(accent, 0.08) : 'transparent';
    const partyBorder = partyStyle === 'framed' ? `1px solid ${C.line}` : partyStyle === 'card' ? `1px solid ${(0, color_1.mix)(accent, 0.35)}` : 'none';
    const bandBuyer = frame === 'band' && partyStyle !== 'plain';
    const partyBox = (p, heading, buyer) => {
        const bg = buyer && bandBuyer ? (0, color_1.mix)(accent, 0.10) : partyBg;
        const border = buyer && bandBuyer ? `1px solid ${(0, color_1.mix)(accent, 0.40)}` : partyBorder;
        return `<div style="padding:${partyPad};border-radius:${partyRad};background:${bg};border:${border};display:flex;flex-direction:column;gap:4px;font-size:11px"><span style="${lab(labelC)};margin-bottom:4px">${e(heading)}</span><span style="font-weight:700;font-size:12px;color:${C.ink}">${e(p.name)}</span>${[...p.street, p.cityLine].filter(Boolean).map((l) => `<span>${e(l)}</span>`).join('')}${p.vat ? `<span style="color:${C.slate500};font-size:10px;margin-top:4px">${e(p.vat)}</span>` : ''}${buyer && p.id ? `<span style="color:${C.slate500};font-size:10px">${e(p.id)}</span>` : ''}</div>`;
    };
    const partiesTwo = () => `<div style="padding-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${partyBox(v.seller, L.seller, false)}${partyBox(v.buyer, L.buyer, true)}</div>`;
    const partiesBuyer = () => `<div style="padding-top:34px;display:flex;flex-direction:column;gap:4px;font-size:11px"><span style="${lab(labelC)};margin-bottom:6px">${e(L.buyer)}</span><span style="font-weight:700;font-size:16px;color:${C.ink}">${e(v.buyer.name)}</span><span>${e(v.buyer.oneLine)}</span>${v.buyer.vat ? `<span style="color:${C.slate500};font-size:10px">${e(v.buyer.vat)}</span>` : ''}${v.buyer.id ? `<span style="color:${C.slate500};font-size:10px">${e(v.buyer.id)}</span>` : ''}</div>`;
    const partiesRow = () => {
        const small = `font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:${C.gray}`;
        const col = (heading, p) => `<div style="display:flex;flex-direction:column"><span style="${small};margin-bottom:6px">${e(heading)}</span><b>${e(p.name)}</b><span>${e(p.oneLineNoCountry)}</span>${p.vat ? `<span style="color:${C.gray}">${e(p.vat)}</span>` : ''}</div>`;
        return `<div style="padding-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;font-size:10.5px;line-height:1.55">
${col(L.seller, v.seller)}${col(L.buyer, v.buyer)}
<div style="display:flex;flex-direction:column"><span style="${small};margin-bottom:6px">${e(L.issue)}</span><b>${e(v.issueDate)}</b><span style="${small};margin:8px 0 2px">${e(L.number)}</span><b>${e(v.number)}</b></div>
</div>`;
    };
    const refLine = () => (v.refLine
        ? `<div style="margin-top:18px;padding:10px 14px;border-left:3px solid ${accent};background:${C.surface};font-size:10px;color:${C.slate700}">${e(v.refLine)}</div>`
        : '');
    // ── Tableau ───────────────────────────────────────────────────────────────
    const table = () => {
        const style = s.layout.table;
        const bordered = frame === 'centered';
        const grid = v.columns.map((c) => (c.width === null ? 'minmax(0,1fr)' : `${c.width}px`)).join(' ');
        const thBg = style === 'filled' ? primary : style === 'zebra' ? (0, color_1.mix)(primary, 0.12) : 'transparent';
        const thFg = style === 'filled' ? white : primary;
        const thRule = style === 'lines' ? `1.5px solid ${primary}` : 'none';
        const rowRule = style === 'lines' ? `1px solid ${C.rowRule}` : 'none';
        const zebra = (0, color_1.mix)(primary, 0.05);
        const head = v.columns.map((c) => `<span style="text-align:${c.align}">${e(c.label)}</span>`).join('');
        let i = 0;
        const row = (r) => {
            if (r.kind === 'group') {
                return `<div style="display:grid;grid-template-columns:${grid};gap:10px;padding:11px 12px;border-bottom:${rowRule};font-size:10.5px;font-weight:700;color:${primary}"><span style="grid-column:1 / -2">${e(r.title)}</span><span style="text-align:right">${e(r.subtotal)}</span></div>`;
            }
            const bg = style === 'zebra' && i % 2 === 1 ? zebra : 'transparent';
            i++;
            const cells = v.columns.map((c) => {
                const details = c.key === 'description' && r.details
                    ? `<span style="display:block;margin-top:2px;font-weight:400;font-size:9.5px;color:${C.slate500}">${e(r.details)}</span>` : '';
                return `<span style="text-align:${c.align};font-weight:${c.bold ? 700 : 400};color:${c.primary ? primary : C.text};overflow-wrap:anywhere">${e(r.cells[c.key])}${details}</span>`;
            }).join('');
            return `<div style="display:grid;grid-template-columns:${grid};gap:10px;padding:11px 12px;background:${bg};border-bottom:${rowRule};font-size:10.5px;align-items:start">${cells}</div>`;
        };
        return `<div style="margin-top:26px;border-radius:${bordered ? '12px' : '0'};overflow:hidden;border:${bordered ? `1px solid ${C.rowRule}` : 'none'}">
<div style="display:grid;grid-template-columns:${grid};gap:10px;padding:10px 12px;background:${thBg};color:${thFg};border-bottom:${thRule};${F(700, 9)};letter-spacing:.06em;text-transform:uppercase">${head}</div>
${v.rows.map(row).join('\n')}
</div>`;
    };
    // ── Bas : TVA, paiement, totaux ───────────────────────────────────────────
    const taxLine = (t) => `${t.rate} · ${L.taxBase} ${t.base} · ${L.taxAmount} ${t.amount}`;
    const grandBox = () => {
        const t = s.layout.totals;
        const pad = t === 'plain' ? '10px 0 0' : '12px 14px';
        const bg = t === 'block' ? primary : t === 'tint' ? (0, color_1.mix)(accent, 0.14) : 'transparent';
        const fg = t === 'block' ? white : C.ink;
        const rule = t === 'plain' ? `2px solid ${primary}` : 'none';
        const rad = t === 'plain' ? '0' : '8px';
        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:${pad};background:${bg};color:${fg};border-top:${rule};border-radius:${rad}"><span style="font-weight:700;font-size:12px;white-space:nowrap">${e(L.grandTotal)}</span><span style="font-weight:700;font-size:16px;white-space:nowrap">${e(v.grandTotal)}</span></div>`;
    };
    const bottomStd = () => {
        const pay = v.payment && !sb ? v.payment : undefined;
        const left = [];
        if (v.taxes.length) {
            left.push(`<div style="display:flex;flex-direction:column;gap:5px"><span style="${lab(labelC)}">${e(L.taxBreakdown)}</span>${v.taxes.map((t) => `<span style="color:${C.slate600}">${e(taxLine(t))}</span>`).join('')}</div>`);
        }
        if (pay) {
            const lines = [...(pay.iban ? [`${L.iban} ${pay.iban}`] : []), ...(pay.bic ? [`${L.bic} ${pay.bic}`] : [])];
            left.push(`<div style="display:flex;gap:14px;align-items:flex-start">${qrUrl ? `<span style="${qrFrame(62, 4, C.line)}">${img(qrUrl, 62, 62)}</span>` : ''}<div style="display:flex;flex-direction:column;gap:3px;color:${C.slate600}"><span style="${lab(labelC)}">${e(L.paymentTerms)}</span>${lines.map((l) => `<span>${e(l)}</span>`).join('')}${qrUrl ? `<span style="font-weight:700;color:${primary}">${e(L.scanToPay)}</span>` : ''}</div></div>`);
        }
        const row = (l, val) => `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:${C.slate500}">${e(l)}</span><span>${e(val)}</span></div>`;
        return `<div style="margin-top:22px;display:grid;grid-template-columns:minmax(0,1fr) ${sb ? 270 : 250}px;gap:${sb ? 16 : 26}px;align-items:start">
<div style="display:flex;flex-direction:column;gap:14px;font-size:10px">${left.join('')}</div>
<div style="display:flex;flex-direction:column;gap:7px;font-size:11px">${row(L.subtotal, v.subtotal)}${row(L.taxTotal, v.taxTotal)}${v.extraCharges.map((c) => row(c.label, c.value)).join('')}${grandBox()}</div>
</div>`;
    };
    const bottomBand = () => {
        const col = (title, lines) => `<div style="padding:14px 16px;border-right:1px solid ${C.line};display:flex;flex-direction:column;gap:5px;font-size:10px;color:${C.slate600}">${title ? `<span style="${lab(primary)}">${e(title)}</span>` : ''}${lines.map((l) => `<span>${e(l)}</span>`).join('')}</div>`;
        const c1 = v.taxes.flatMap((t) => [`${t.rate} · ${L.taxBase} ${t.base}`, `${L.taxAmount} ${t.amount}`]);
        const c2 = v.payment ? [v.payment.iban, v.payment.bic].filter((x) => !!x) : [];
        const r = `display:flex;justify-content:space-between;gap:12px;color:${(0, color_1.blend)(white, primary, 0.8)}`;
        const rows = [[L.subtotal, v.subtotal], [L.taxTotal, v.taxTotal], ...v.extraCharges.map((c) => [c.label, c.value])]
            .map(([l, val]) => `<div style="${r}"><span>${e(l)}</span><span>${e(val)}</span></div>`).join('');
        return `<div style="margin-top:22px;display:grid;grid-template-columns:1fr 1fr 1.4fr;border:1px solid ${C.line}">
${col(v.taxes.length ? L.taxBreakdown : '', c1)}${col(v.payment ? L.paymentTerms : '', c2)}
<div style="padding:14px 16px;background:${primary};color:#fff;display:flex;flex-direction:column;gap:6px;font-size:10.5px">${rows}<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;padding-top:8px;border-top:1px solid ${(0, color_1.blend)(white, primary, 0.25)}"><span style="font-weight:700">${e(L.grandTotal)}</span><span style="${F(700, 17)};color:${accent};white-space:nowrap">${e(v.grandTotal)}</span></div></div>
</div>`;
    };
    const bottomCard = () => {
        const lines = [...(v.payment?.iban ? [`${L.iban} ${v.payment.iban}`] : []), ...(v.payment?.bic ? [`${L.bic} ${v.payment.bic}`] : [])];
        const taxes = v.taxes.map((t) => `${L.taxAmount} ${t.rate} · ${t.amount}`);
        const extra = v.extraCharges.map((c) => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:${(0, color_1.blend)(white, primary, 0.85)}"><span>${e(c.label)}</span><span>${e(c.value)}</span></div>`).join('');
        return `<div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
<div style="padding:16px 18px;border-radius:14px;background:${C.surface};display:flex;flex-direction:column;gap:6px;font-size:10px;color:${C.slate600}"><span style="${lab(accent)}">${e(L.paymentTerms)}</span>${lines.map((l) => `<span>${e(l)}</span>`).join('')}${taxes.map((l) => `<span style="margin-top:4px">${e(l)}</span>`).join('')}</div>
<div style="padding:18px 20px;border-radius:14px;background:${primary};color:#fff;display:flex;flex-direction:column;justify-content:space-between;gap:10px"><div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;color:${(0, color_1.blend)(white, primary, 0.85)}"><span>${e(`${L.subtotal} ${v.subtotal}`)}</span><span>${e(`${L.taxTotal} ${v.taxTotal}`)}</span></div>${extra}</div><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700;font-size:12px">${e(L.grandTotal)}</span><span style="${F(700, 26)};white-space:nowrap">${e(v.grandTotal)}</span></div></div>
</div>`;
    };
    const notes = () => (v.notes
        ? `<div style="margin-top:22px;font-size:10px;color:${C.slate600};white-space:pre-line">${e(v.notes)}</div>`
        : '');
    // ── Pied ──────────────────────────────────────────────────────────────────
    const powered = (extra) => (v.poweredBy
        ? `<span style="display:flex;align-items:center;gap:6px;padding-right:10px;border-right:1px solid ${C.line};${extra}"><span style="${F(400, 8)};color:${C.slate400};white-space:nowrap">${e(L.poweredBy)}</span>${servicesLogo ? `<img src="${e(servicesLogo)}" alt="Services" style="height:11px;display:block">` : `<b style="font-size:9px;color:${C.ink}">Services</b>`}</span>`
        : '');
    const badge = () => (v.badge
        ? `<span style="padding:3px 7px;border:1px solid ${C.slate300};border-radius:4px;${F(700, 8)};color:${C.slate600};white-space:nowrap">${e(v.badge)}</span>`
        : '');
    const page = `<span style="white-space:nowrap">${e(`${L.page} 1 ${L.of} 1`)}</span>`;
    const footer = () => (sb
        ? `<div style="position:absolute;left:0;right:56px;bottom:34px;display:flex;justify-content:flex-end;align-items:center;gap:10px;font-size:8.5px;color:${C.slate400}">${powered('margin-right:auto')}${badge()}${page}</div>`
        : `<div style="position:absolute;left:0;right:56px;bottom:34px;padding-top:12px;border-top:1px solid ${C.line};display:flex;justify-content:space-between;align-items:flex-end;gap:20px;font-size:8.5px;color:${C.slate400}">
<span style="max-width:500px;line-height:1.5">${e(v.legal)}</span>
<div style="display:flex;align-items:center;gap:10px;flex:none">${powered('')}${badge()}${page}</div>
</div>`);
    // ── Colonne latérale (composition Colonne) ────────────────────────────────
    const sidebar = () => {
        const faint = (0, color_1.blend)(white, primary, 0.65);
        const item = (label, val, acc = false) => `<div style="display:flex;flex-direction:column;gap:3px"><span style="color:${faint};text-transform:uppercase;letter-spacing:.1em;font-size:8px">${e(label)}</span><span style="font-weight:700;font-size:12px;${acc ? `color:${accent}` : ''}">${e(val)}</span></div>`;
        const addr = [...v.seller.street, v.seller.cityLine, ...(v.seller.vat ? [v.seller.vat] : []), ...(v.seller.id ? [v.seller.id] : [])];
        const pay = v.payment
            ? `<div style="display:flex;flex-direction:column;gap:8px;padding-top:22px;border-top:1px solid ${(0, color_1.blend)(white, primary, 0.2)};font-size:9.5px;line-height:1.55"><span style="color:${faint};text-transform:uppercase;letter-spacing:.1em;font-size:8px">${e(L.paymentTerms)}</span>${v.payment.iban ? `<span>${e(`${L.iban} ${v.payment.iban}`)}</span>` : ''}${v.payment.bic ? `<span>${e(`${L.bic} ${v.payment.bic}`)}</span>` : ''}${qrUrl ? `<span style="${qrFrame(74, 5, null)};margin-top:6px">${img(qrUrl, 74, 74)}</span><span style="font-weight:700">${e(L.scanToPay)}</span>` : ''}</div>`
            : '';
        return `<div style="position:absolute;left:0;top:0;bottom:0;width:${SIDEBAR_W}px;background:${primary};color:#fff;padding:52px 28px 34px;box-sizing:border-box;display:flex;flex-direction:column;gap:30px">
<div style="display:flex;flex-direction:column;gap:12px">${logoBox(52, 42, white, '12px')}<span style="${F(700, 16)}">${e(v.seller.name)}</span><span style="${F(400, 10, '/1.6')};color:${(0, color_1.blend)(white, primary, 0.8)}">${addr.map(e).join('<br>')}</span></div>
<div style="display:flex;flex-direction:column;gap:12px;padding-top:22px;border-top:1px solid ${(0, color_1.blend)(white, primary, 0.2)};font-size:10px">${item(L.number, v.number)}${item(L.issue, v.issueDate)}${v.due ? item(v.due.label, v.due.value, true) : ''}</div>
${pay}
<span style="margin-top:auto;${F(400, 8, '/1.55')};color:${(0, color_1.blend)(white, primary, 0.6)}">${e(v.legal)}</span>
</div>`;
    };
    function pattern() {
        const paths = pattern_1.PATTERN_4_PATHS.map((d) => `<path d="${e(d)}"/>`).join('');
        return `<svg aria-hidden="true" viewBox="0 0 ${pattern_1.PATTERN_4_VIEWBOX} ${pattern_1.PATTERN_4_VIEWBOX}" style="position:absolute;right:-120px;top:-110px;width:420px;height:420px;opacity:.07;pointer-events:none" fill="#000">${paths}</svg>`;
    }
    const watermark = () => (v.watermark
        ? `<div aria-hidden="true" style="position:absolute;left:58%;top:${Math.round(PAGE_H * 0.54)}px;transform:translate(-50%,-50%) rotate(-32deg);${F(700, v.watermarkSize ?? 110)};letter-spacing:.06em;color:${primary};opacity:.07;white-space:nowrap;pointer-events:none">${e(v.watermark)}</div>`
        : '');
    // ── Assemblage ────────────────────────────────────────────────────────────
    const header = frame === 'band' ? headerBand() : frame === 'sidebar' ? headerSidebarTitle() : frame === 'hero' ? headerHero() : frame === 'centered' ? headerCentered() : headerStandard();
    const parties = sb ? partiesBuyer() : frame === 'hero' ? partiesRow() : partiesTwo();
    const bottom = frame === 'band' ? bottomBand() : frame === 'centered' ? bottomCard() : bottomStd();
    const mainL = sb ? SIDEBAR_MAIN_L : SIDE;
    const id = options.id ? ` id="${e(options.id)}"` : '';
    return `<div${id} class="acc-document acc-document--${e(v.kind)}" lang="${e(v.language)}" style="width:${PAGE_W}px;min-height:${PAGE_H}px;background:#fff;position:relative;overflow:hidden;font-family:${font};font-size:11px;line-height:normal;color:${C.text};box-sizing:border-box;text-align:left">
${s.pattern && frame !== 'band' && !sb ? pattern() : ''}
${watermark()}
${sb ? sidebar() : ''}
<div style="position:relative;margin-left:${mainL}px;padding-right:${SIDE}px;padding-bottom:${FOOT_RESERVE}px;min-height:${PAGE_H}px;box-sizing:border-box">
${header}
${parties}
${refLine()}
${table()}
${bottom}
${notes()}
${footer()}
</div>
</div>`;
}
//# sourceMappingURL=html.js.map