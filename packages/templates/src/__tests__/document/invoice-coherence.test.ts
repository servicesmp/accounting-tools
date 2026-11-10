import { buildDocumentView, buyerIdentity } from '../../document/view';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS } from '../../document/settings';
import { sampleData } from './fixtures';

/**
 * Cohérence des factures de services (10/11), d'après INV-20261106-0001 : colonne « Unité » vide
 * sous son en-tête, client particulier imprimé avec le n° de TVA du prestataire.
 */
const settings = (over: any = {}) => normalizeDocumentSettings(over, FULL_DOCUMENT_ENTITLEMENTS).settings;
/** Colonne « Unité » activée par l'organisation (cas de ZIT). */
const withUnit = () => settings({ columns: ['description', 'quantity', 'unit', 'unitPrice', 'vatRate', 'lineTotal'] });

describe('cohérence des factures', () => {
  it('colonne « Unité » activée mais aucune unité renseignée : colonne retirée ; une unité : colonne gardée', () => {
    const data = sampleData('invoice');
    const noUnit = { ...data, lines: data.lines.map((l) => ({ ...l, unit: undefined })) };
    expect(buildDocumentView(noUnit, { settings: withUnit() }).columns.map((c) => c.key)).not.toContain('unit');
    expect(buildDocumentView(data, { settings: withUnit() }).columns.map((c) => c.key)).toContain('unit');
  });

  it('client particulier : jamais de n° de TVA ni de SIRET', () => {
    const b = buyerIdentity({ name: 'leonce yopa', vatId: 'FR98765432109', address: {} }, { vatId: 'FR01915335517' });
    expect(b.vatId).toBeUndefined();
  });

  it('identifiant du client égal à celui du vendeur : jamais imprimé, même pour une entreprise', () => {
    const b = buyerIdentity({ name: 'ZIT', legalName: 'ZIT', vatId: 'FR 01 915 335 517', siret: '91533551700011', address: {} }, { vatId: 'FR01915335517', siret: '91533551700011' });
    expect(b.vatId).toBeUndefined();
    expect(b.siret).toBeUndefined();
  });

  it('client entreprise distinct : n° de TVA et SIRET imprimés', () => {
    const data = sampleData('invoice');
    const v = buildDocumentView(data, { settings: settings() });
    if (data.buyer.vatId) expect(v.buyer.vat).toContain(data.buyer.vatId);
  });

  it('sans TVA (franchise art. 293 B) : ni HT, ni TTC, ni colonne ou ligne de TVA ; total « Total »', () => {
    const data = sampleData('invoice');
    const franchise = { ...data, vatExemptionReason: 'TVA non applicable, art. 293 B du CGI', lines: data.lines.map((l) => ({ ...l, vatRate: 0 })) };
    const v = buildDocumentView(franchise, { settings: withUnit() });
    expect(v.vatApplicable).toBe(false);
    expect(v.columns.map((c) => c.key)).not.toContain('vatRate');
    expect(v.columns.map((c) => c.label)).toEqual(expect.arrayContaining(['Prix unitaire', 'Montant']));
    expect(v.columns.map((c) => c.label).join(' ')).not.toMatch(/HT|TTC/);
    expect(v.taxes).toEqual([]);
    expect(v.labels.grandTotal).toBe('Total');
    expect(v.legal).toContain('TVA non applicable, art. 293 B du CGI.');
  });

  it('avec TVA : libellés HT / TTC et lignes de TVA inchangés', () => {
    const v = buildDocumentView(sampleData('invoice'), { settings: settings() });
    expect(v.vatApplicable).toBe(true);
    expect(v.labels.grandTotal).toBe('Total TTC');
    expect(v.taxes.length).toBeGreaterThan(0);
  });
});
