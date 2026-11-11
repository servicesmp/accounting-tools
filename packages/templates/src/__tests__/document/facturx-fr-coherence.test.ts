import {
  billingInvoiceToDocumentData, coherentPaymentTerms, paymentTermsForDueDate,
} from '../../document/records';
import { buildFacturXInvoice } from '../../document-pdf/facturx';
import { buildDocumentView } from '../../document/view';

/**
 * Facture INV-20261111-0001 telle qu'enregistrée en production (saisie manuelle du tableau de bord) :
 * échéance choisie au lendemain, mais « Paiement à 30 jours » et virement (58) écrits en dur, sans IBAN.
 * Le validateur B2Brouter (BR FR Flux2) la refusait : BT-23 absent.
 */
function manualInvoice(over: any = {}): any {
  return {
    invoiceId: '480e4ee6', slug: 'INV-20261111-0001', currency: 'EUR', state: 'online', paymentStatus: 'pending',
    emittedDate: '2026-11-11T12:50:45.859Z', dueDate: '2026-11-12T00:00:00Z', paymentTerms: 'Paiement à 30 jours',
    header: { id: 'INV-20261111-0001', invoiceNumber: 'INV-20261111-0001', typeCode: '380', issueDate: '2026-11-11T12:50:45.858Z', notes: [], source: 'manual' },
    seller: {
      name: 'ZIT', rcs: 'RCS Nanterre 915335517', capital: '10000', legalForm: 'SAS',
      contacts: [{ contactName: 'ZIT SAS', contactEmail: 'factu@zit.example' }],
      legalInfo: { siren: '915335517', siret: '91533551700024', vatNumber: 'FR01915335517', legalName: 'ZIT SAS', legalForm: 'SAS', capital: '10000' },
      postalAddress: { line1: '95 Rue du Capitaine Guynemer', city: 'Courbevoie', postalCode: '92400', countryCode: 'FR' },
    },
    buyer: {
      name: 'ADIFEP', contacts: [{ contactName: 'ADIFEP', contactEmail: 'compta@adifep.example' }],
      postalAddress: { line1: '95 Rue Du Capitaine Guynemer', city: 'Courbevoie', postalCode: '92400', countryCode: 'FR' },
    },
    payment: { dueDate: '2026-11-12T00:00:00.000Z', paymentMeansCode: '58', paymentTermsText: 'Paiement à 30 jours' },
    transactionData: { viewInvitations: [{ at: '2026-11-11' }], metadata: { source: 'manual' } },
    lines: [{ description: 'Développement du MVP de Rekonect', quantity: 20, unitPrice: 30000, vatRate: 0.2 }],
    ...over,
  };
}

const xmlOf = (record: any) => buildFacturXInvoice(billingInvoiceToDocumentData(record)).invoice.generateXml(true);

describe('Factur-X — réforme FR et cohérence de bout en bout', () => {
  it('BT-23 (BR-FR-08) : cadre de facturation S1 pour une facture de services à payer', () => {
    const xml = xmlOf(manualInvoice());
    expect(xml).toMatch(/<ram:BusinessProcessSpecifiedDocumentContextParameter>\s*<ram:ID>S1<\/ram:ID>/);
    expect(xml.indexOf('BusinessProcessSpecifiedDocumentContextParameter')).toBeLessThan(xml.indexOf('GuidelineSpecifiedDocumentContextParameter'));
  });

  it('BT-23 : S2 quand la facture est déjà payée, nature lue dans l’en-tête si elle est connue', () => {
    expect(xmlOf(manualInvoice({ paymentStatus: 'PAID' }))).toMatch(/<ram:ID>S2<\/ram:ID>/);
    const goods = manualInvoice({ header: { ...manualInvoice().header, operationNature: 'goods' } });
    expect(xmlOf(goods)).toMatch(/<ram:BusinessProcessSpecifiedDocumentContextParameter>\s*<ram:ID>B1<\/ram:ID>/);
  });

  it('BT-23 : toujours présent, même quand l’appelant ne donne pas la nature', () => {
    const data = { ...billingInvoiceToDocumentData(manualInvoice()), operationNature: undefined };
    expect(buildFacturXInvoice(data).invoice.generateXml(true)).toMatch(/<ram:ID>S1<\/ram:ID>/);
  });

  it('virement sans IBAN : moyen déclaré carte (48), plus de numéro de facture déguisé en compte', () => {
    const data = billingInvoiceToDocumentData(manualInvoice());
    expect(data.payment?.means).toBe('card');
    const xml = xmlOf(manualInvoice());
    expect(xml).toMatch(/<ram:SpecifiedTradeSettlementPaymentMeans>\s*<ram:TypeCode>48<\/ram:TypeCode>/);
    expect(xml).not.toContain('PayeePartyCreditorFinancialAccount');
  });

  it('virement avec IBAN : conservé (58) avec le compte', () => {
    const record = manualInvoice({ payment: { ...manualInvoice().payment, iban: 'FR76 3000 6000 0112 3456 7890 189' } });
    const xml = xmlOf(record);
    expect(xml).toMatch(/<ram:TypeCode>58<\/ram:TypeCode>/);
    expect(xml).toContain('<ram:IBANID>FR7630006000011234567890189</ram:IBANID>');
  });

  it('conditions : « à 30 jours » qui contredit l’échéance est reformulé, partout pareil (écran, PDF, XML)', () => {
    const data = billingInvoiceToDocumentData(manualInvoice());
    expect(data.payment?.terms).toBe('Paiement à 1 jour, au plus tard le 12/11/2026');
    const xml = xmlOf(manualInvoice());
    expect(xml).toContain('<ram:Description>Paiement à 1 jour, au plus tard le 12/11/2026</ram:Description>');
    expect(xml).toMatch(/<ram:DueDateDateTime>\s*<udt:DateTimeString format="102">20261112</);
    expect(JSON.stringify(buildDocumentView(data))).not.toContain('30 jours');
  });

  it('conditions cohérentes ou libres : conservées', () => {
    const issue = new Date('2026-11-11T12:00:00Z');
    expect(coherentPaymentTerms('Paiement à 30 jours', issue, new Date('2026-12-11T00:00:00Z'))).toBe('Paiement à 30 jours');
    expect(coherentPaymentTerms('50 % à la commande, solde à la livraison', issue, new Date('2026-11-12T00:00:00Z'))).toBe('50 % à la commande, solde à la livraison');
    expect(coherentPaymentTerms(undefined, issue, new Date('2026-11-11T18:00:00Z'))).toBe('Paiement à réception');
    expect(paymentTermsForDueDate(issue, new Date('2026-12-11T00:00:00Z'))).toBe('Paiement à 30 jours, au plus tard le 11/12/2026');
  });
});

describe('conditions automatiques après changement d’échéance', () => {
  it('l’ancien texte « au plus tard le … » suit la nouvelle échéance ; un texte juste reste', () => {
    const record = manualInvoice({
      dueDate: '2026-12-11T00:00:00Z',
      payment: { dueDate: '2026-12-11T00:00:00Z', paymentMeansCode: '48', paymentTermsText: 'Paiement à 1 jour, au plus tard le 12/11/2026' },
    });
    expect(billingInvoiceToDocumentData(record).payment?.terms).toBe('Paiement à 30 jours, au plus tard le 11/12/2026');
    const issue = new Date('2026-11-11T12:00:00Z');
    const due = new Date('2026-12-11T00:00:00Z');
    expect(coherentPaymentTerms('Paiement à 30 jours, au plus tard le 11/12/2026', issue, due)).toBe('Paiement à 30 jours, au plus tard le 11/12/2026');
  });
});

describe('facture payée : conditions d’émission conservées', () => {
  it('commande réglée par carte : pas de « Paiement à 30 jours » sur une facture payée', () => {
    const record = manualInvoice({
      paymentStatus: 'PAID', dueDate: '2026-12-11T12:50:45.859Z',
      payment: { dueDate: '2026-12-11T12:50:45.859Z', paymentMeansCode: '48', status: 'paid', paymentTermsText: 'Paiement à réception' },
    });
    const data = billingInvoiceToDocumentData(record);
    expect(data.payment?.terms).toBe('Paiement à réception');
    expect(xmlOf(record)).toMatch(/<ram:ID>S2<\/ram:ID>/);
  });
});
