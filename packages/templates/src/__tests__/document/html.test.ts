import { buildDocumentView } from '../../document/view';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS, DOCUMENT_PRESETS } from '../../document/settings';
import { renderDocumentHtml, escapeHtml, safeImageUrl } from '../../document/html';
import { sampleData } from './fixtures';
import type { DocumentKind } from '../../document/types';

const settings = (over: any = {}) => normalizeDocumentSettings(over, FULL_DOCUMENT_ENTITLEMENTS).settings;
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('renderDocumentHtml', () => {
  it.each(DOCUMENT_PRESETS.map((p) => p.id))('préréglage %s : titre, numéro, parties, lignes et total affichés', (preset) => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ preset }) });
    const html = renderDocumentHtml(v);
    const t = text(html);
    expect(t).toContain('FACTURE');
    expect(t).toContain('FA-2026-0042');
    expect(t).toContain('Atelier Vertex');
    expect(t).toContain('Leonce Yopa');
    expect(t).toContain('Atelier de cadrage');
    expect(html).toContain(escapeHtml(v.grandTotal));
    expect(t).toContain('Factur-X · EN 16931');
    expect(html).toMatch(/^<div class="acc-document acc-document--invoice" lang="fr"/);
  });

  it.each<DocumentKind>(['credit', 'quote', 'order'])('%s : bandeau de référence et badge selon le type', (kind) => {
    const v = buildDocumentView(sampleData(kind), { settings: settings() });
    const t = text(renderDocumentHtml(v));
    expect(t).toContain(v.title);
    expect(t).toContain(escapeHtml(v.refLine));
    expect(t.includes('Factur-X')).toBe(kind === 'credit');
  });

  it('échappe toutes les données (aucune injection HTML possible)', () => {
    const evil = '<img src=x onerror=alert(1)>"\'&';
    const v = buildDocumentView(sampleData('invoice', {
      number: evil,
      seller: { ...sampleData().seller, name: evil },
      lines: [{ description: evil, details: evil, quantity: 1, unitPrice: 100, vatRate: 20 }],
      notes: evil,
    }), { settings: settings() });
    const html = renderDocumentHtml(v);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toMatch(/<[^>]*\sonerror=/i);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;');
  });

  it('filtre les URL d’image (pas de javascript:, pas d’attribut cassé)', () => {
    expect(safeImageUrl('https://cdn.services.ceo/logo.png')).toBe('https://cdn.services.ceo/logo.png');
    expect(safeImageUrl('/brand/services.png')).toBe('/brand/services.png');
    expect(safeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(safeImageUrl('javascript:alert(1)')).toBeNull();
    expect(safeImageUrl('//evil.example/x.png')).toBeNull();
    expect(safeImageUrl('https://x.png" onload="alert(1)')).toBeNull();
    expect(safeImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    const v = buildDocumentView(sampleData('invoice'), { settings: settings() });
    expect(renderDocumentHtml(v, { logoUrl: 'javascript:alert(1)' })).not.toContain('javascript:');
  });

  it('logo affiché seulement si le réglage le demande', () => {
    const v1 = buildDocumentView(sampleData('invoice'), { settings: settings({ logo: 'left' }) });
    expect(renderDocumentHtml(v1, { logoUrl: 'https://cdn.x/logo.png' })).toContain('src="https://cdn.x/logo.png"');
    const v2 = buildDocumentView(sampleData('invoice'), { settings: settings({ logo: 'none' }) });
    expect(renderDocumentHtml(v2, { logoUrl: 'https://cdn.x/logo.png' })).not.toContain('cdn.x/logo.png');
  });

  it('pas de lettre ni de pavé à la place du logo quand il manque', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ logo: 'left' }) });
    const html = renderDocumentHtml(v);
    expect(html).not.toMatch(/<img[^>]*alt=""[^>]*object-fit/);
  });

  it('QR, mention « Émis avec Services », filigrane et motif selon le réglage', () => {
    const qr = 'data:image/png;base64,AAAA';
    const v = buildDocumentView(sampleData('invoice', { status: 'draft' }), { settings: settings({ statusWatermark: true, pattern: true }) });
    const html = renderDocumentHtml(v, { qrImageUrl: qr, servicesLogoUrl: '/services.png' });
    expect(html).toContain(qr);
    expect(text(html)).toContain('Scannez pour payer');
    expect(text(html)).toContain('BROUILLON');
    expect(html).toContain('<svg aria-hidden="true"');
    expect(html).toContain('src="/services.png"');
    const off = buildDocumentView(sampleData('invoice'), { settings: settings({ showPoweredBy: false }) });
    expect(text(renderDocumentHtml(off))).not.toContain('Document émis avec');
    const noQr = renderDocumentHtml(buildDocumentView(sampleData('invoice'), { settings: settings() }));
    expect(text(noQr)).not.toContain('Scannez pour payer');
  });

  it('couleurs de thème invalides : jamais injectées dans le CSS', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings() });
    const html = renderDocumentHtml({ ...v, theme: { primary: 'red;background:url(x)', accent: '#067d62', accentTint: '#e0f0ec' } });
    expect(html).not.toContain('url(x)');
    expect(html).toContain('#111111');
  });
});
