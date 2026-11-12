import { billingInvoiceToDocumentData } from '../../document/records';
import { buildDocumentView, sellerDisplayParty, streetWithoutLocality } from '../../document/view';
import { renderDocumentHtml } from '../../document/html';
import { DOCUMENT_PRESETS } from '../../document/settings';
import { buildFacturXInvoice } from '../../document-pdf/facturx';

/**
 * Facture brouillon du 12/11 : le PDF nommait le vendeur « SMP-DEMO » (nom commercial), le XML
 * « Services CEO » (raison sociale) ; l'adresse d'un contact du CRM imprimait « 92400 COURBEVOIE » deux fois.
 */
function invoice(): any {
  return {
    invoiceId: 'inv', slug: 'BROUILLON-1', currency: 'EUR', paymentStatus: 'pending', state: 'draft',
    emittedDate: '2026-11-12T12:00:00Z', dueDate: '2026-12-12T00:00:00Z',
    header: { invoiceNumber: 'BROUILLON', typeCode: '380', issueDate: '2026-11-12T12:00:00Z', notes: [] },
    seller: {
      name: 'SMP-DEMO',
      legalInfo: { siret: '91533551700024', vatNumber: 'FR01915335517', legalName: 'Services CEO' },
      postalAddress: { line1: '23 rue Henri Legay', city: 'Villeurbanne', postalCode: '69100', countryCode: 'FR' },
    },
    buyer: {
      name: 'Adifep',
      legalInfo: { siret: '98442548800017', vatNumber: 'FR23984425488', legalName: 'Adifep' },
      postalAddress: { line1: '95 RUE DU CAPITAINE GUYNEMER 92400 COURBEVOIE', city: 'COURBEVOIE', postalCode: '92400', countryCode: 'FR' },
    },
    payment: { paymentMeansCode: '58', iban: 'FR7630004004500000204352128' },
    lines: [{ description: 'Développement', quantity: 10, unitPrice: 33000, vatRate: 0 }],
  };
}
const flat = (s: string) => s.replace(/\s+/g, ' ');
const tag = (xml: string, t: string) => xml.match(new RegExp(`<ram:${t}>([\\s\\S]*?)</ram:${t}>`))?.[1] ?? '';

describe('vendeur : même nom sur le PDF et dans le XML', () => {
  it('raison sociale en nom, nom commercial dessous ; XML BT-27 = la même raison sociale', () => {
    const data = billingInvoiceToDocumentData(invoice());
    const view = buildDocumentView(data, {});
    expect(view.seller.name).toBe('Services CEO');
    expect(view.seller.tradeName).toBe('SMP-DEMO');
    const seller = tag(buildFacturXInvoice(data, { defaultCountry: 'FR' }).invoice.generateXml(true), 'SellerTradeParty');
    expect(seller).toMatch(/<ram:Name>Services CEO<\/ram:Name>/);
    expect(seller).not.toMatch(/<ram:Name>SMP-DEMO<\/ram:Name>/);
  });

  it('toutes les mises en page impriment la raison sociale et le nom commercial', () => {
    for (const preset of Object.values(DOCUMENT_PRESETS)) {
      const html = flat(renderDocumentHtml(buildDocumentView(billingInvoiceToDocumentData(invoice()), preset as any)));
      expect(html).toContain('Services CEO');
    }
    const html = flat(renderDocumentHtml(buildDocumentView(billingInvoiceToDocumentData(invoice()), {})));
    expect(html).toContain('SMP-DEMO');
  });

  it('nom commercial compris dans la raison sociale, ou absent : une seule ligne', () => {
    expect(sellerDisplayParty({ name: 'Atelier Vertex', legalName: 'Atelier Vertex SAS' } as any)).toMatchObject({ name: 'Atelier Vertex SAS' });
    expect(sellerDisplayParty({ name: 'Atelier Vertex', legalName: 'Atelier Vertex SAS' } as any).tradeName).toBeUndefined();
    expect(sellerDisplayParty({ name: 'ZIT' } as any)).toMatchObject({ name: 'ZIT' });
    expect(sellerDisplayParty({ name: 'ZIT' } as any).tradeName).toBeUndefined();
    expect(sellerDisplayParty({ name: '—', legalName: 'ZIT SAS' } as any)).toMatchObject({ name: 'ZIT SAS' });
  });
});

describe('adresse : la localité n’est pas répétée dans la rue', () => {
  it('PDF et XML : « 95 RUE DU CAPITAINE GUYNEMER » puis « 92400 COURBEVOIE », une seule fois', () => {
    const data = billingInvoiceToDocumentData(invoice());
    const view = buildDocumentView(data, {});
    expect(view.buyer.street).toEqual(['95 RUE DU CAPITAINE GUYNEMER']);
    expect(view.buyer.cityLine).toBe('92400 COURBEVOIE, FR');
    expect(flat(renderDocumentHtml(view)).match(/92400 COURBEVOIE/g)).toHaveLength(1);
    const buyer = tag(buildFacturXInvoice(data, { defaultCountry: 'FR' }).invoice.generateXml(true), 'BuyerTradeParty');
    expect(buyer).toMatch(/<ram:LineOne>95 RUE DU CAPITAINE GUYNEMER<\/ram:LineOne>/);
  });

  it.each([
    // Formats de plusieurs pays : code postal puis ville, ville puis code postal, pays en fin.
    ['95 RUE DU CAPITAINE GUYNEMER 92400 COURBEVOIE', '92400', 'COURBEVOIE', '95 RUE DU CAPITAINE GUYNEMER'],
    ['95 rue du Capitaine Guynemer, 92400 Courbevoie, France', '92400', 'Courbevoie', '95 rue du Capitaine Guynemer'],
    ['Rue de la Loi 16, 1000 Bruxelles', '1000', 'Bruxelles', 'Rue de la Loi 16'],
    ['Friedrichstraße 43 10117 Berlin Deutschland', '10117', 'Berlin', 'Friedrichstraße 43'],
    ['221B Baker Street, London NW1 6XE', 'NW1 6XE', 'London', '221B Baker Street'],
    ['12 rue A 75001', '75001', 'Paris', '12 rue A'],
  ])('« %s » → rue seule', (street, pc, city, expected) => {
    expect(streetWithoutLocality(street, pc, city)).toBe(expected);
  });

  it.each([
    // Rien à retirer, ou rien de sûr : l'adresse reste telle quelle.
    ['12 rue de Paris', '75001', 'Paris'],          // la rue porte le nom de la ville, sans code postal
    ['Rue de Bruxelles 4', undefined, 'Bruxelles'], // pas de code postal (pays sans code, saisie incomplète)
    ['Boulevard Saint-Germain', '75006', 'Paris'],
    ['Akwa, rue Joffre', '', 'Douala'],
  ])('« %s » inchangée', (street, pc, city) => {
    expect(streetWithoutLocality(street, pc as any, city)).toBe(street);
  });

  it('ne vide jamais la rue : une rue réduite au code postal et à la ville est gardée', () => {
    expect(streetWithoutLocality('92400 COURBEVOIE', '92400', 'COURBEVOIE')).toBe('92400 COURBEVOIE');
  });
});
