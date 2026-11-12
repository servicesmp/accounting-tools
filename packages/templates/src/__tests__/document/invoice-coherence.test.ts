import { buildDocumentView, buyerIdentity, isIndividualEnterprise } from '../../document/view';
import { renderDocumentHtml } from '../../document/html';
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

  it('SIRET du vendeur imprimé dans son bloc (mention obligatoire, 12/11)', () => {
    const data = sampleData('invoice');
    const v = buildDocumentView(data, { settings: settings() });
    expect(v.seller.id).toContain(data.seller.siret!);
    expect(renderDocumentHtml(v)).toContain(v.seller.id!);
  });

  it('conditions de paiement dans le corps : échéance pour tous, pénalités et 40 € pour un client professionnel', () => {
    const pro = buildDocumentView(sampleData('invoice', { buyer: { name: 'ADIFEP', legalName: 'ADIFEP', siret: '81245678900021', address: {} } }), { settings: settings() });
    expect(pro.paymentConditions?.[0]).toMatch(/Échéance|Paiement/);
    expect(pro.paymentConditions?.join(' ')).toMatch(/Pénalités de retard.*40 €/s);
    expect(renderDocumentHtml(pro)).toContain('Conditions de paiement');
    const particulier = buildDocumentView(sampleData('invoice'), { settings: settings() });
    expect(particulier.paymentConditions?.join(' ') ?? '').not.toMatch(/Pénalités|40 €/);
  });

  it('entreprise individuelle ou capital nul : jamais « au capital de 0 € » (INV-20261112-0002)', () => {
    const data = sampleData('invoice');
    const ei = { ...data, seller: { ...data.seller, name: 'YOPA NANA LEONCE', legalName: 'YOPA NANA LEONCE', legalForm: 'Entrepreneur Individuel', capital: '0 €', registration: undefined } };
    expect(buildDocumentView(ei, { settings: settings() }).legal).not.toMatch(/capital/i);
    const zero = { ...data, seller: { ...data.seller, capital: '0 €' } };
    expect(buildDocumentView(zero, { settings: settings() }).legal).not.toMatch(/capital de 0/);
    expect(isIndividualEnterprise('Micro-entrepreneur')).toBe(true);
    expect(isIndividualEnterprise('SAS')).toBe(false);
  });

  it('entreprise individuelle avec RCS : la forme juridique reste dans le pied, en tête', () => {
    const data = sampleData('invoice');
    const ei = { ...data, seller: { ...data.seller, name: 'YOPA NANA LEONCE', legalName: 'YOPA NANA LEONCE', legalForm: 'Entrepreneur individuel', capital: undefined, registration: 'RCS Nanterre 915335517', siret: '91533551700024' } };
    expect(buildDocumentView(ei, { settings: settings() }).legal).toMatch(/^YOPA NANA LEONCE, Entrepreneur individuel\. RCS Nanterre 915335517\./);
  });
});
