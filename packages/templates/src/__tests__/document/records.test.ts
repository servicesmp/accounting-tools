import { billingInvoiceToDocumentData, billingPartyToDocumentParty, estimateToDocumentData, normalizeVatId, FR_FRANCHISE_MENTION } from '../../document/records';
import { buildDocumentView } from '../../document/view';
import { buildFacturXInvoice } from '../../document-pdf/facturx';

/** Facture telle que le pipeline order.paid de mu-billing l'enregistre. */
function billingInvoice(over: any = {}): any {
  return {
    invoiceId: 'inv-1', slug: 'INV-20260925-0001', sellerOrganizationId: 'org-1', currency: 'EUR',
    paymentStatus: 'PENDING', emittedDate: '2026-09-25T10:00:00Z', dueDate: '2026-10-25T10:00:00Z',
    header: { id: 'INV-20260925-0001', invoiceNumber: 'INV-20260925-0001', typeCode: '380', issueDate: '2026-09-25T10:00:00Z', notes: [] },
    seller: {
      name: 'Atelier Nord SAS',
      contacts: [{ contactEmail: 'factu@atelier-nord.fr', contactName: 'Atelier Nord SAS' }],
      legalInfo: { siret: '812 456 789 00021', vatNumber: '42812456789', legalName: 'Atelier Nord SAS', capital: '10000' },
      postalAddress: { line1: '12 rue des Tanneurs', city: 'Lyon', postalCode: '69002', countryCode: 'France' },
      rcs: 'RCS Lyon 812 456 789',
    },
    buyer: {
      name: 'Studio Lumen', contacts: [{ contactEmail: 'compta@lumen.fr' }], legalInfo: { siret: '', vatNumber: '' },
      postalAddress: { line1: '4 quai de la Fosse', city: 'Nantes', postalCode: '44000', countryCode: 'france' },
    },
    payment: { paymentMeansCode: '48', paymentTermsText: 'Paiement à réception' },
    lines: [
      { description: 'Audit\nstratégique', quantity: 1, unitPrice: 320000, vatRate: 0.2 },
      { description: 'Accompagnement', quantity: 2, unitPrice: 80000, vatPercent: 20 },
    ],
    ...over,
  };
}

describe('billingInvoiceToDocumentData (mu-billing)', () => {
  it('montants en centimes, TVA en pourcentage, texte nettoyé', () => {
    const d = billingInvoiceToDocumentData(billingInvoice());
    expect(d).toMatchObject({ kind: 'invoice', number: 'INV-20260925-0001', currency: 'EUR' });
    expect(d.lines).toEqual([
      expect.objectContaining({ description: 'Audit stratégique', quantity: 1, unitPrice: 320000, vatRate: 20 }),
      expect.objectContaining({ description: 'Accompagnement', quantity: 2, unitPrice: 80000, vatRate: 20 }),
    ]);
  });

  it('accepte les champs JSON reçus en chaînes (GraphQL)', () => {
    const raw = billingInvoice();
    const d = billingInvoiceToDocumentData({ ...raw, header: JSON.stringify(raw.header), seller: JSON.stringify(raw.seller), lines: JSON.stringify(raw.lines), payment: JSON.stringify(raw.payment) });
    expect(d.number).toBe('INV-20260925-0001');
    expect(d.seller.name).toBe('Atelier Nord SAS');
    expect(d.lines).toHaveLength(2);
  });

  it('vendeur : SIRET, TVA préfixée, capital lisible, RCS', () => {
    const s = billingInvoiceToDocumentData(billingInvoice()).seller;
    expect(s).toMatchObject({ siret: '81245678900021', vatId: 'FR42812456789', capital: '10 000 €', registration: 'RCS Lyon 812 456 789', email: 'factu@atelier-nord.fr' });
  });

  it('pays saisi en toutes lettres → code ISO à l’affichage ET dans le XML Factur-X', () => {
    const d = billingInvoiceToDocumentData(billingInvoice());
    expect(buildDocumentView(d).seller.cityLine).toBe('69002 Lyon, FR');
    expect(buildDocumentView(d).buyer.cityLine).toBe('44000 Nantes, FR');
    const xml = buildFacturXInvoice(d).invoice.generateXml(true);
    expect(xml).toContain('<ram:CountryID>FR</ram:CountryID>');
    expect(xml).not.toMatch(/<ram:CountryID>(France|france)<\/ram:CountryID>/);
  });

  it('valeurs factices écartées (jamais imprimées ni envoyées dans le XML)', () => {
    const p = billingPartyToDocumentParty({ name: 'SMP Platform', legalInfo: { siret: 'PLATFORM-SIRET', vatNumber: 'FR-PLATFORM-VAT' }, postalAddress: { street: 'N/A', zip: '75001', country: 'France' } });
    expect(p.siret).toBeUndefined();
    expect(p.vatId).toBeUndefined();
    expect(p.address?.street).toBeUndefined();
    expect(p.address?.postalCode).toBe('75001');
    expect(normalizeVatId('fr 42 812 456 789')).toBe('FR42812456789');
  });

  it('échéance jamais antérieure à l’émission (BR-FR-CO-07)', () => {
    const d = billingInvoiceToDocumentData(billingInvoice({ dueDate: '2026-01-01' }));
    expect(new Date(d.dueDate as Date).getTime() - new Date(d.issueDate as Date).getTime()).toBe(30 * 24 * 3600 * 1000);
  });

  it('statut et lien de paiement : lien seulement pour une facture à payer', () => {
    expect(billingInvoiceToDocumentData(billingInvoice(), { isDraft: true, paymentLink: 'https://x' })).toMatchObject({ status: 'draft', payment: { link: undefined } });
    expect(billingInvoiceToDocumentData(billingInvoice({ paymentStatus: 'PAID' }), { paymentLink: 'https://x' })).toMatchObject({ status: 'paid', payment: { link: undefined } });
    expect(billingInvoiceToDocumentData(billingInvoice(), { paymentLink: 'https://x' })).toMatchObject({ status: 'pending', payment: { link: 'https://x', means: 'card' } });
  });

  it('TVA à 0 % : mention de franchise en base', () => {
    const d = billingInvoiceToDocumentData(billingInvoice({ lines: [{ description: 'Conseil', quantity: 1, unitPrice: 10000, vatRate: 0 }] }));
    expect(d.vatExemptionReason).toBe(FR_FRANCHISE_MENTION);
  });

  it('avoir 381 seulement avec la facture d’origine ; sinon facture (jamais d’exception)', () => {
    expect(billingInvoiceToDocumentData(billingInvoice({ header: { typeCode: '381', invoiceNumber: 'AV-1', precedingInvoice: { number: 'INV-1', issueDate: '2026-09-01' } } }))).toMatchObject({ kind: 'credit', precedingInvoice: { number: 'INV-1' } });
    expect(billingInvoiceToDocumentData(billingInvoice({ header: { typeCode: '381', invoiceNumber: 'AV-2' } })).kind).toBe('invoice');
  });
});

describe('estimateToDocumentData (mu-contract)', () => {
  const estimate = (over: any = {}) => ({
    estimateId: 'f5173fb7-ecf3-4a26-8168-4f8c72a9ea05', status: 'PROVIDER_VALIDATED', createdAt: '2026-09-23T10:00:00Z',
    details: {
      services: [{ serviceID: 's1', title: 'Intelligence artificielle', price: 50000, items: [
        { id: 'i1', title: 'Audit', description: 'Audit complet', quantity: 1, unitPrice: 50000 },
        { id: 'i2', title: 'Atelier', quantity: 2, unitPrice: 10000 },
      ] }],
      from: { organizationName: 'Eya Saffar Conseil', email: 'eya@x.fr', address: { street: '1 rue A', zip: '75001', city: 'Paris', country: 'France' } },
      to: { firstName: 'Leonce', lastName: 'Yopa', email: 'l.yopa@services.ceo', address: { street: '83 rue henri legay', zip: '69100', city: 'Villeurbanne', country: 'France' } },
      tax: 20, subTotal: 70000, total: 84000, issueDate: '2026-09-23T10:00:00Z', validUntil: '2026-10-23T10:00:00Z',
      ...over,
    },
  });

  it('lignes des éléments de service, TVA du devis, parties et validité', () => {
    const d = estimateToDocumentData(estimate(), { number: 'qte-4f8c72a9ea05' });
    expect(d).toMatchObject({ kind: 'quote', number: 'qte-4f8c72a9ea05', status: 'pending', currency: 'EUR' });
    expect(d.lines.map((l) => [l.description, l.quantity, l.unitPrice, l.vatRate])).toEqual([['Audit', 1, 50000, 20], ['Atelier', 2, 10000, 20]]);
    expect(d.lines[0].details).toBe('Audit complet');
    const v = buildDocumentView(d);
    expect(v.title).toBe('DEVIS');
    expect(v.buyer.name).toBe('Leonce Yopa');
    expect(v.buyer.cityLine).toBe('69100 Villeurbanne, FR');
    expect(v.due).toEqual({ label: "Valable jusqu'au", value: '23/10/2026' });
    expect(v.totalsRaw.total).toBe(84000);
  });

  it('service sans éléments : ligne au prix du service ; plusieurs services : groupes', () => {
    const d = estimateToDocumentData(estimate({ services: [
      { title: 'Forfait', price: 30000, quantity: 1, items: [] },
      { title: 'IA', items: [{ title: 'Audit', quantity: 1, unitPrice: 50000 }] },
    ] }));
    expect(d.lines.map((l) => [l.group, l.description, l.unitPrice])).toEqual([['Forfait', 'Forfait', 30000], ['IA', 'Audit', 50000]]);
  });

  it('prix imposé (tunnel de paiement) : total affiché = total débité, frais inclus', () => {
    const d = estimateToDocumentData(estimate(), { pricing: { subTotal: 70000, extraLines: [{ label: 'Frais de service', amount: 1500 }] } });
    const v = buildDocumentView(d);
    expect(v.totalsRaw).toMatchObject({ subtotal: 70000, taxTotal: 14000, total: 84000, amountDue: 85500 });
    expect(v.extraCharges.map((c) => c.label)).toEqual(['Frais de service']);
  });

  it('négociation close : le prix négocié remplace le calcul', () => {
    const d = estimateToDocumentData(estimate({ negotiationStatus: 'CLOSED', negotiationPrice: 60000 }));
    expect(buildDocumentView(d).totalsRaw.subtotal).toBe(60000);
  });

  it('client entreprise : raison sociale en nom, contact en second', () => {
    const d = estimateToDocumentData(estimate({ to: { type: 'COMPANY', company: { companyName: 'Lumen SARL', vatNumber: 'FR18903214567' }, firstName: 'Ana', lastName: 'B' } }));
    expect(d.buyer).toMatchObject({ name: 'Lumen SARL', contactName: 'Ana B', vatId: 'FR18903214567' });
  });

  it('statuts métier', () => {
    expect(estimateToDocumentData(estimate(), { status: 'DRAFT' }).status).toBe('draft');
    expect(estimateToDocumentData(estimate(), { status: 'ACCEPTED' }).status).toBe('accepted');
    expect(estimateToDocumentData(estimate(), { status: 'REJECTED' }).status).toBe('rejected');
  });
});
