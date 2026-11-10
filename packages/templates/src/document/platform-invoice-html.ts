/**
 * Rendu HTML d'une facture de la plateforme (`PlatformInvoiceView`) — maquette « Factures
 * Plateforme » trait pour trait (794 × 1123 px, marges 64 / 68, Chillax 500 / 600 / 700).
 * Le PDF (`PlatformInvoicePdfRenderer`) dessine la même chose.
 *
 * Fragment autonome (styles en ligne), chaînes échappées, URL d'image filtrées. À l'écran la
 * feuille s'allonge au lieu de se paginer (hauteur minimale A4).
 */
import { escapeHtml, safeImageUrl } from './html';
import type { PlatformInvoiceView } from './platform-invoice-types';

export const PLATFORM_COLORS = {
  ink: '#111111',
  text: '#45423C',
  label: '#6B675F',
  rule: '#EAE8E3',
  accent: '#FF3864',
  accentText: '#E31E55',
  white: '#FFFFFF',
} as const;

export const PLATFORM_PAGE_W = 794;
export const PLATFORM_PAGE_H = 1123;

export interface RenderPlatformInvoiceHtmlOptions {
  /** Logo Services (en tête 24 px et en pied 13 px). */
  readonly logoUrl?: string | null;
  /** Police (défaut : Chillax, puis system-ui). */
  readonly fontFamily?: string;
  readonly id?: string;
}

const C = PLATFORM_COLORS;
const e = escapeHtml;

function fontStack(f: string | undefined): string {
  const v = (f ?? '').replace(/[^a-z0-9 ,'"-]/gi, '').trim();
  return v || 'Chillax, system-ui, sans-serif';
}

export function renderPlatformInvoiceHtml(view: PlatformInvoiceView, options: RenderPlatformInvoiceHtmlOptions = {}): string {
  const v = view;
  const font = fontStack(options.fontFamily);
  const logo = safeImageUrl(options.logoUrl);
  const num = 'font-variant-numeric:tabular-nums';
  const grid = 'display:grid;grid-template-columns:minmax(0,1fr) 44px 88px 78px 100px;gap:12px';
  const section = (title: string) =>
    `<div style="font-size:8.5px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:${C.accentText};padding-bottom:5px;border-bottom:1px solid ${C.rule}">${e(title)}</div>`;

  const logoImg = (h: number) => (logo
    ? `<img src="${e(logo)}" alt="Services" style="height:${h}px;width:auto;object-fit:contain;object-position:left center;display:block;flex:none">`
    : `<span style="font-size:${h * 0.75}px;font-weight:700;color:${C.ink}">Services</span>`);

  const header = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:48px">
  <div style="display:flex;flex-direction:column;gap:13px;max-width:280px">
    ${logoImg(24)}
    <div style="font-size:9.5px;line-height:1.8;color:${C.text}"><span style="font-weight:700;color:${C.ink}">${e(v.seller.name)}</span>${e(v.seller.firstLineRest)}${v.seller.lines.map((l) => `<br>${e(l)}`).join('')}</div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;text-align:right">
    <span style="width:26px;height:2px;background:${C.accent};display:block;margin-bottom:2px"></span>
    <div style="font-size:8.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:${C.accentText}">${e(v.title)}</div>
    <div style="font-size:19px;font-weight:700;letter-spacing:-.01em;${num}">${e(v.number)}</div>
    <div style="margin-top:6px;display:grid;grid-template-columns:auto auto;gap:5px 10px;font-size:10px;color:${C.text};text-align:right;white-space:nowrap;align-items:baseline">
      ${v.meta.map((m) => `<span>${e(m.label)}</span><span style="font-weight:600;color:${C.ink};text-align:left;${num}">${e(m.value)}</span>`).join('')}
    </div>
  </div>
</div>
<div style="margin-top:26px;height:1px;background:${C.ink}"></div>`;

  const parties = `
<div style="margin-top:28px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px">
  <div style="display:flex;flex-direction:column;gap:8px">
    ${section(v.buyerTitle)}
    <div style="font-size:13px;font-weight:700;overflow-wrap:anywhere">${e(v.buyer.name)}</div>
    <div style="font-size:10px;line-height:1.8;color:${C.text};overflow-wrap:anywhere">${v.buyer.lines.map(e).join('<br>')}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${section(v.info.title)}
    <div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;font-size:10px;color:${C.text};align-items:baseline">
      ${v.info.rows.map((r) => `<span style="white-space:nowrap">${e(r.label)}</span><span style="font-weight:${r.strong ? 700 : 600};color:${r.color ?? C.ink};overflow-wrap:anywhere">${e(r.value)}</span>`).join('')}
    </div>
  </div>
</div>`;

  const table = `
<div style="margin-top:38px">
  <div style="${grid};padding-bottom:9px;border-bottom:1.5px solid ${C.ink};font-size:8.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${C.text}">
    <span>${e(v.columns.description)}</span><span style="text-align:right">${e(v.columns.quantity)}</span><span style="text-align:right">${e(v.columns.unitPrice)}</span><span style="text-align:right">${e(v.columns.vat)}</span><span style="text-align:right">${e(v.columns.total)}</span>
  </div>
  ${v.rows.map((r) => `<div style="${grid};padding:14px 0;border-bottom:1px solid ${C.rule};align-items:baseline;font-size:11.5px">
    <span style="font-weight:600;min-width:0;overflow-wrap:anywhere">${e(r.description)}</span><span style="text-align:right;${num}">${e(r.quantity)}</span><span style="text-align:right;${num}">${e(r.unitPrice)}</span><span style="text-align:right;${num}">${e(r.vat)}</span><span style="text-align:right;font-weight:600;${num}">${e(r.total)}</span>
  </div>`).join('')}
  ${v.notes.length ? `<div style="padding-top:12px;font-size:9.5px;line-height:1.7;color:${C.text}">${v.notes.map(e).join('<br>')}</div>` : ''}
</div>`;

  const totals = `
<div style="display:flex;justify-content:flex-end;margin-top:28px">
  <div style="width:300px;display:flex;flex-direction:column;font-size:11.5px">
    ${v.totals.map((t) => `<div style="display:flex;justify-content:space-between;padding:7px 0${t.ruleTop ? `;border-top:1px solid ${C.rule}` : ''}"><span style="color:${C.text}">${e(t.label)}</span><span style="${t.strong ? 'font-weight:600;' : ''}${num}">${e(t.value)}</span></div>`).join('')}
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0 0;border-top:1.5px solid ${C.accent}"><span style="font-size:12px;font-weight:700">${e(v.grandTotal.label)}</span><span style="font-size:17px;font-weight:700;${num}">${e(v.grandTotal.value)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:10.5px"><span style="color:${C.text}">${e(v.rest.label)}</span><span style="font-weight:700;${num}">${e(v.rest.value)}</span></div>
  </div>
</div>`;

  const alert = v.alert
    ? `<div style="margin-top:24px;padding:13px 15px;border:1px solid ${C.ink};font-size:10.5px;line-height:1.6">${e(v.alert)}</div>`
    : '';

  const footer = `
<div style="margin-top:auto;padding:22px 0 16px;border-top:1px solid ${C.rule};font-size:9px;line-height:1.75;color:${C.text};max-width:420px">
  ${v.footer.map((f) => `<div><span style="display:block;font-weight:700;color:${C.ink};margin-bottom:3px">${e(f.title)}</span>${e(f.text)}</div>`).join('')}
</div>`;

  const bar = `
<div style="flex:none;padding:14px 68px 24px;border-top:1px solid ${C.ink};display:flex;align-items:center;gap:16px">
  ${logoImg(13)}<span style="flex:1;min-width:0;font-size:8.5px;line-height:1.5;color:${C.text}">${e(v.legalBar)}</span>
  <span style="font-size:8.5px;font-weight:600;color:${C.text};${num};white-space:nowrap">${e(v.pageLabel(1, 1))}</span>
</div>`;

  return `<div${options.id ? ` id="${e(options.id)}"` : ''} class="smp-platform-invoice" style="width:${PLATFORM_PAGE_W}px;min-height:${PLATFORM_PAGE_H}px;box-sizing:border-box;background:${C.white};display:flex;flex-direction:column;position:relative;overflow:hidden;font-family:${font};font-weight:500;color:${C.ink}">
<div style="flex:1;min-height:0;padding:64px 68px 0;display:flex;flex-direction:column">${header}${parties}${table}${totals}${alert}${footer}</div>${bar}
</div>`;
}
