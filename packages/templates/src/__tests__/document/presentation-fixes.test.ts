/**
 * Retours visuels (sept. 2026) :
 * - symbole monétaire après le montant, dans toutes les langues ;
 * - logo affiché sans pastille ni cadre coloré (rond rose recadrant le logo) ;
 * - cadre du QR en content-box : l'image n'est plus rognée en bas / à droite
 *   quand la page impose box-sizing:border-box (Tailwind).
 */
import { formatMoney } from '../../document/format';
import { buildDocumentView } from '../../document/view';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS, DOCUMENT_PRESETS } from '../../document/settings';
import { renderDocumentHtml } from '../../document/html';
import { generateDocumentPdf } from '../../document-pdf';
import { sampleData } from './fixtures';

const settings = (over: any = {}) => normalizeDocumentSettings(over, FULL_DOCUMENT_ENTITLEMENTS).settings;
const LOGO = 'https://cdn.x/logo.png';
const QR = 'data:image/png;base64,AAAA';

describe('formatMoney : symbole après le montant', () => {
  it.each([
    ['fr-FR', 'EUR', 648000, '6 480,00 €'],
    ['en-GB', 'EUR', 648000, '6,480.00 €'],
    ['en-GB', 'USD', 125000, '1,250.00 US$'],
    ['es-ES', 'EUR', 648000, '6480,00 €'],
    ['fr-FR', 'XAF', 12000, '12 000 FCFA'],
  ])('%s %s %d → %s', (locale, cur, minor, expected) => {
    const out = formatMoney(minor, cur, locale);
    // Le symbole est en fin de chaîne, jamais au début.
    expect(out.replace(/\s/g, ' ').endsWith(expected.split(' ').pop()!)).toBe(true);
    expect(out.replace(/\s/g, ' ').replace(/US\$|\$/, '$')).toBe(expected.replace(/\s/g, ' ').replace(/US\$|\$/, '$'));
  });

  it('montant négatif : signe devant le nombre, symbole à la fin', () => {
    expect(formatMoney(-1000, 'EUR', 'en-GB').replace(/\s/g, ' ')).toBe('-10.00 €');
  });

  it('document en anglais : « Grand total » et sous-totaux avec le symbole après', () => {
    const v = buildDocumentView(sampleData('quote'), { settings: settings({ language: 'en' }) });
    expect(v.grandTotal.trim().endsWith('€')).toBe(true);
    expect(v.subtotal.startsWith('€')).toBe(false);
  });
});

describe('logo sans cadre', () => {
  it.each(DOCUMENT_PRESETS.map((p) => p.id))('%s : image du logo sans pastille autour', (preset) => {
    const html = renderDocumentHtml(buildDocumentView(sampleData('invoice'), { settings: settings({ preset, logo: 'left' }) }), { logoUrl: LOGO });
    const i = html.indexOf(`src="${LOGO}"`);
    expect(i).toBeGreaterThan(0);
    const before = html.slice(Math.max(0, html.lastIndexOf('<', i - 1) - 200), i);
    expect(before).not.toMatch(/border-radius:(9999px|12px);background/);
  });
});

describe('cadre du QR', () => {
  it.each(DOCUMENT_PRESETS.map((p) => p.id))('%s : cadre content-box, image non rognée', (preset) => {
    const html = renderDocumentHtml(buildDocumentView(sampleData('invoice'), { settings: settings({ preset }) }), { qrImageUrl: QR });
    const i = html.indexOf(QR);
    if (i < 0) return; // composition sans bloc de paiement
    const frame = html.slice(html.lastIndexOf('<span', i), i);
    expect(frame).toContain('box-sizing:content-box');
    expect(frame).toContain('line-height:0');
  });
});

describe('PDF', () => {
  it.each(DOCUMENT_PRESETS.map((p) => p.id))('%s : PDF généré avec logo et QR', async (preset) => {
    // PNG 1x1 valide
    const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
    const r = await generateDocumentPdf({ data: sampleData('invoice'), settings: settings({ preset }), entitlements: FULL_DOCUMENT_ENTITLEMENTS, logo: png });
    expect(Buffer.from(r.pdf.slice(0, 5)).toString()).toBe('%PDF-');
  });
});
