import { buildDocumentView, computeDocumentTotals, computeLineTotal, isFacturXDocument } from '../../document/view';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS } from '../../document/settings';
import { formatMoney } from '../../document/format';
import { sampleData } from './fixtures';

const norm = (s: string) => s.replace(/[  ]/g, ' ');
const settings = (over: any = {}) => normalizeDocumentSettings(over, FULL_DOCUMENT_ENTITLEMENTS).settings;

describe('totaux', () => {
  it('total de ligne : quantité × prix, remise déduite, arrondi à l’unité mineure', () => {
    expect(computeLineTotal({ quantity: 2, unitPrice: 65000, discountPercent: 10 })).toBe(117000);
    expect(computeLineTotal({ quantity: 3, unitPrice: 2999 })).toBe(8997);
    expect(computeLineTotal({ quantity: 1, unitPrice: 1, lineTotal: 42 })).toBe(42);
  });

  it('TVA ventilée par taux', () => {
    const t = computeDocumentTotals(sampleData());
    expect(t.subtotal).toBe(50000 + 117000 + 8997);
    expect(t.taxBreakdown).toEqual([
      { rate: 20, base: 167000, amount: 33400 },
      { rate: 10, base: 8997, amount: 900 },
    ]);
    expect(t.total).toBe(175997 + 34300);
  });
});

describe('vue', () => {
  it('facture : titre, numéro, dates, mentions légales, paiement, badge', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings() });
    expect(v.title).toBe('FACTURE');
    expect(v.number).toBe('FA-2026-0042');
    expect(v.labels.number).toBe('N°');
    expect(v.issueDate).toBe('24/09/2026');
    expect(v.due).toEqual({ label: 'Échéance', value: '24/10/2026' });
    expect(v.legal).toMatch(/^Atelier Vertex SAS au capital de 10 000 € · RCS Paris 123 456 789 · Pénalités de retard/);
    expect(v.legal).toMatch(/40 €/);
    expect(v.legal).toMatch(/Pas d'escompte pour paiement anticipé/);
    expect(v.legal).toMatch(/Nature de l'opération : prestation de services\./);
    expect(v.payment).toEqual({ iban: 'FR76 3000 4000 0312 3456 7890 143', bic: undefined, terms: 'Paiement à 30 jours', qrData: 'https://pay.services.ceo/i/abc' });
    expect(v.badge).toBe('Factur-X · EN 16931');
    expect(v.refLine).toBeUndefined();
    expect(v.amountLabel).toBe('Montant à payer');
  });

  it('avoir : référence à la facture d’origine obligatoire, montant négatif', () => {
    const v = buildDocumentView(sampleData('credit', { creditReason: 'remise commerciale' }), { settings: settings() });
    expect(v.title).toBe('AVOIR');
    expect(v.refLine).toBe('Avoir sur la facture FA-2026-0042 du 01/09/2026. Motif : remise commerciale.');
    expect(v.grandTotal.startsWith('−')).toBe(true);
    expect(v.badge).toBe('Factur-X · EN 16931');
    expect(() => buildDocumentView(sampleData('credit', { precedingInvoice: undefined }))).toThrow(/facture d'origine/);
  });

  it('devis : validité, bon pour accord, pas de badge Factur-X', () => {
    const v = buildDocumentView(sampleData('quote'), { settings: settings() });
    expect(v.title).toBe('DEVIS');
    expect(v.due).toEqual({ label: "Valable jusqu'au", value: '24/10/2026' });
    expect(v.refLine).toBe('Devis valable 30 jours. Bon pour accord : date, signature et cachet du client.');
    expect(v.badge).toBeUndefined();
    expect(v.amountLabel).toBe('Montant du devis');
  });

  it('devis sans date de validité : jamais « undefined » dans le bandeau', () => {
    for (const language of ['fr', 'en', 'de'] as const) {
      const v = buildDocumentView(sampleData('quote', { validUntil: undefined }), { settings: settings({ language }) });
      expect(v.refLine).not.toMatch(/undefined/);
    }
    expect(buildDocumentView(sampleData('quote', { validUntil: undefined }), { settings: settings() }).refLine).toBe('Bon pour accord : date, signature et cachet du client.');
  });

  it('bon de commande : jamais de bloc de paiement, livraison prévue, référence acheteur', () => {
    const v = buildDocumentView(sampleData('order', { deliveryDate: '2026-12-12', buyerReference: 'PO-4471' }), { settings: settings({ showPaymentBlock: true }) });
    expect(v.title).toBe('BON DE COMMANDE');
    expect(v.payment).toBeUndefined();
    expect(v.due).toEqual({ label: 'Livraison prévue', value: '12/12/2026' });
    expect(v.refLine).toBe('Commande n° BC-2026-0007 · référence acheteur PO-4471.');
    expect(v.badge).toBeUndefined();
  });

  it('pays normalisé en code ISO (jamais « France » en toutes lettres)', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ language: 'en' }) });
    expect(v.buyer.cityLine).toBe('69100 Villeurbanne, FR');
    expect(v.seller.oneLine).toBe('12 rue Oberkampf, 75011 Paris, FR');
    expect(v.seller.oneLineNoCountry).toBe('12 rue Oberkampf, 75011 Paris');
    expect(v.title).toBe('INVOICE');
    expect(v.issueDate).toBe('24/09/2026');
  });

  it('devise dynamique : montants dans la devise du document', () => {
    const v = buildDocumentView(sampleData('invoice', { currency: 'XAF' }), { settings: settings() });
    expect(norm(v.grandTotal)).toMatch(/FCFA/);
    expect(v.grandTotal).not.toMatch(/€/);
    const usd = buildDocumentView(sampleData('invoice', { currency: 'usd' }), { settings: settings() });
    expect(usd.grandTotal).toMatch(/\$/);
  });

  it('frais additionnels : ajoutés au montant à payer', () => {
    const v = buildDocumentView(sampleData('invoice', { extraCharges: [{ label: 'Frais de service', amount: 1000 }] }), { settings: settings() });
    expect(v.totalsRaw.amountDue).toBe(v.totalsRaw.total + 1000);
    expect(v.extraCharges.map((t) => t.label)).toEqual(['Frais de service']);
    expect(norm(v.grandTotal)).toBe(norm(formatMoney(v.totalsRaw.amountDue, 'EUR', 'fr-FR')));
  });

  it('colonnes choisies, cellules formatées, groupes avec sous-total', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ columns: ['description', 'quantity', 'unit', 'discount', 'lineTotal'] }) });
    expect(v.columns.map((c) => c.key)).toEqual(['description', 'quantity', 'unit', 'discount', 'lineTotal']);
    expect(v.columns.map((c) => c.label)).toEqual(['Description', 'Qté', 'Unité', 'Remise', 'Total HT']);
    const groups = v.rows.filter((r) => r.kind === 'group');
    expect(groups.map((g) => g.title)).toEqual(['Intelligence artificielle', 'Infrastructure']);
    expect(norm(groups[0].subtotal!)).toBe('1 670,00');
    const atelier = v.rows.find((r) => r.cells.description === 'Atelier de cadrage')!;
    expect(norm(atelier.cells.discount ?? '')).toBe('10 %');
    expect(atelier.cells.unit).toBe('jour');
    const audit = v.rows.find((r) => r.cells.description === 'Audit RAG')!;
    expect(audit.cells.discount).toBe('—');
    expect(audit.details).toBe('Analyse de la chaîne de récupération');
  });

  it('mention libre de l’organisation imprimée en fin de pied légal', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ footerNote: 'Merci pour votre confiance.' }) });
    expect(v.legal.endsWith('Merci pour votre confiance.')).toBe(true);
    expect(buildDocumentView(sampleData('invoice'), { settings: settings() }).legal).not.toMatch(/\s$/);
  });

  it('ventilation de TVA masquable', () => {
    expect(buildDocumentView(sampleData('invoice'), { settings: settings() }).taxes).toHaveLength(2);
    expect(buildDocumentView(sampleData('invoice'), { settings: settings({ showTaxBreakdown: false }) }).taxes).toEqual([]);
  });

  it('franchise en base : motif d’exonération dans les mentions', () => {
    const data = sampleData('invoice', {
      lines: [{ description: 'Conseil', quantity: 1, unitPrice: 10000, vatRate: 0 }],
      vatExemptionReason: 'TVA non applicable, art. 293 B du CGI',
    });
    const v = buildDocumentView(data, { settings: settings() });
    expect(v.legal).toMatch(/TVA non applicable, art\. 293 B du CGI\./);
  });

  it('mention « Émis avec Services » et filigrane de statut selon le réglage', () => {
    expect(buildDocumentView(sampleData('invoice', { status: 'draft' }), { settings: settings({ statusWatermark: true }) }).watermark).toBe('BROUILLON');
    expect(buildDocumentView(sampleData('invoice', { status: 'draft' }), { settings: settings({ statusWatermark: false }) }).watermark).toBeUndefined();
    expect(buildDocumentView(sampleData('invoice'), { settings: settings() }).poweredBy).toBe(true);
    expect(buildDocumentView(sampleData('invoice'), { settings: settings({ showPoweredBy: false }) }).poweredBy).toBe(false);
  });

  it('thème : couleurs de l’organisation et teinte d’accent', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ colors: { primary: '#0d2f5e', accent: '#ff6600' } }) });
    expect(v.theme.primary).toBe('#0d2f5e');
    expect(v.theme.accent).toBe('#ff6600');
    expect(v.theme.accentTint).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('seuls facture et avoir sont des documents Factur-X', () => {
    expect([isFacturXDocument('invoice'), isFacturXDocument('credit'), isFacturXDocument('quote'), isFacturXDocument('order')]).toEqual([true, true, false, false]);
  });

  it('remise : colonne ajoutée d’office quand une ligne en porte une (mention obligatoire)', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings({ columns: ['description', 'quantity', 'unitPrice', 'lineTotal'] }) });
    expect(v.columns.map((c) => c.key)).toEqual(['description', 'quantity', 'unitPrice', 'discount', 'lineTotal']);
    const sans = buildDocumentView(sampleData('invoice', { lines: [{ description: 'x', quantity: 1, unitPrice: 100, vatRate: 20 }] }), { settings: settings({ columns: ['description', 'quantity', 'lineTotal'] }) });
    expect(sans.columns.map((c) => c.key)).toEqual(['description', 'quantity', 'lineTotal']);
  });
});
