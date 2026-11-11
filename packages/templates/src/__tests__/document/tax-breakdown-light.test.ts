import { billingInvoiceToDocumentData } from '../../document/records';
import { buildDocumentView } from '../../document/view';
import { renderDocumentHtml } from '../../document/html';
import { DOCUMENT_PRESETS } from '../../document/settings';

/** Facture d'un seul taux : le « Détail de la TVA » répétait les totaux mot pour mot (11/11). */
function invoice(lines: any[]): any {
  return {
    invoiceId: 'inv', slug: 'INV-20261111-0001', currency: 'EUR', paymentStatus: 'pending', state: 'online',
    emittedDate: '2026-11-11T12:00:00Z', dueDate: '2026-11-12T00:00:00Z',
    header: { invoiceNumber: 'INV-20261111-0001', typeCode: '380', issueDate: '2026-11-11T12:00:00Z', notes: [] },
    seller: { name: 'ZIT', legalInfo: { siret: '91533551700024', vatNumber: 'FR01915335517', legalName: 'ZIT SAS' }, postalAddress: { line1: '95 rue du Capitaine Guynemer', city: 'Courbevoie', postalCode: '92400', countryCode: 'FR' } },
    buyer: { name: 'ADIFEP', postalAddress: { line1: '1 rue A', city: 'Paris', postalCode: '75001', countryCode: 'FR' } },
    payment: { paymentMeansCode: '48', paymentTermsText: 'Paiement à réception' },
    lines,
  };
}
const norm = (s: string) => s.replace(/\s/g, ' ');

describe('détail de la TVA : seulement avec plusieurs taux', () => {
  it('un seul taux : pas de bloc, le taux est dans la ligne de total (« TVA 20 % »)', () => {
    const v = buildDocumentView(billingInvoiceToDocumentData(invoice([{ description: 'MVP', quantity: 20, unitPrice: 30000, vatRate: 0.2 }])), {});
    expect(v.taxes).toEqual([]);
    expect(norm(v.labels.taxTotal)).toBe('TVA 20 %');
    expect(norm(v.taxTotal)).toBe('1 200,00 €');
    for (const preset of Object.keys(DOCUMENT_PRESETS)) {
      const html = norm(renderDocumentHtml(buildDocumentView(billingInvoiceToDocumentData(invoice([{ description: 'MVP', quantity: 20, unitPrice: 30000, vatRate: 0.2 }])), (DOCUMENT_PRESETS as any)[preset])));
      expect(html).not.toContain('Détail de la TVA');
      expect(html).toContain('TVA 20 %');
    }
  });

  it('plusieurs taux : détail par taux conservé (obligatoire), total « Total TVA »', () => {
    const v = buildDocumentView(billingInvoiceToDocumentData(invoice([
      { description: 'Prestation', quantity: 1, unitPrice: 100000, vatRate: 0.2 },
      { description: 'Livre', quantity: 1, unitPrice: 10000, vatRate: 0.055 },
    ])), {});
    expect(v.taxes).toHaveLength(2);
    expect(v.labels.taxTotal).toBe('Total TVA');
  });
});

describe('en-tête standard : titre seul', () => {
  it('pas de « vendeur, ville » sous FACTURE (déjà dans le bloc Vendeur)', () => {
    const html = norm(renderDocumentHtml(buildDocumentView(billingInvoiceToDocumentData(invoice([{ description: 'MVP', quantity: 1, unitPrice: 30000, vatRate: 0.2 }])), {})));
    expect(html).not.toContain('ZIT, Courbevoie');
    expect(html).toContain('95 rue du Capitaine Guynemer');
  });
});
