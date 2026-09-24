/**
 * Conformité indépendante du modèle : quel que soit le modèle choisi par
 * l'organisation, les mentions obligatoires sont imprimées et aucune mention
 * tierce (« @facturx/templates ») n'apparaît sur le document du client.
 */
import { PDFPage } from 'pdf-lib';
import { FacturXInvoice, FacturxProfile, DocTypeCode, PaymentMeansCode } from '@facturx/core';
import { TemplateRenderer } from '../../core/TemplateRenderer';
import { ModernTemplate } from '../../templates/ModernTemplate';
import { BrandTemplate } from '../../templates/BrandTemplate';
import { CorporateTemplate } from '../../templates/CorporateTemplate';
import { FancyTemplate } from '../../templates/FancyTemplate';
import { MinimalTemplate } from '../../templates/MinimalTemplate';

const quiet = { validateBeforeGeneration: false, validateAfterGeneration: false };

function invoice(extraHeader: Record<string, unknown> = {}, exemption?: string): FacturXInvoice {
  return new FacturXInvoice(
    FacturxProfile.EN16931,
    { id: 'FA-1', invoiceNumber: 'FA-1', name: 'INVOICE', invoiceDate: new Date('2026-09-24'), typeCode: DocTypeCode.INVOICE, ...extraHeader } as any,
    { name: 'Vendeur', address: { street: '1 rue A', postalCode: '75001', city: 'Paris', countryCode: 'FR' } } as any,
    { name: 'Client', address: { street: '2 rue B', postalCode: '69001', city: 'Lyon', countryCode: 'FR' } } as any,
    { meansCode: PaymentMeansCode.CREDIT_TRANSFER, dueDate: new Date('2026-10-24') } as any,
    [{
      id: '1', description: 'Conseil', quantity: 1, unitPrice: 100,
      vatRate: exemption ? 0 : 0.2, taxCategoryCode: exemption ? 'E' : 'S',
      ...(exemption ? { taxExemptionReason: exemption, taxExemptionReasonCode: 'VATEX-FR-FRANCHISE' } : {}),
      unitCode: 'C62', lineTotal: 100, allowances: [], charges: [],
    } as any],
  );
}

const TEMPLATES = [
  ['Classique (Modern)', () => new ModernTemplate()],
  ['Affirmé (Brand)', () => new BrandTemplate()],
  ['Corporate', () => new CorporateTemplate()],
  ['Créatif (Fancy)', () => new FancyTemplate()],
  ['Minimal', () => new MinimalTemplate()],
] as const;

afterEach(() => jest.restoreAllMocks());

async function renderTexts(make: () => TemplateRenderer, inv: FacturXInvoice) {
  const own = jest.spyOn(TemplateRenderer.prototype as any, 'drawText');
  const raw = jest.spyOn(PDFPage.prototype, 'drawText');
  await make().generate(inv, quiet);
  const all = [...own.mock.calls, ...raw.mock.calls].map((c) => String(c[0]));
  return all.join('\n');
}

describe.each(TEMPLATES)('%s', (_name, make) => {
  it('imprime pénalités de retard, indemnité de 40 € et escompte', async () => {
    const text = await renderTexts(make as any, invoice());
    expect(text).toMatch(/Pénalités de retard/);
    expect(text).toMatch(/40 €/);
    expect(text).toMatch(/escompte/);
  });

  it('imprime les mentions de la réforme 2026 quand elles sont renseignées', async () => {
    const text = await renderTexts(make as any, invoice({
      businessProcessType: 'S1',
      vatDueDateTypeCode: '5',
      deliveryParty: { name: 'Site', address: { street: '1 quai', postalCode: '13001', city: 'Marseille', countryCode: 'FR' } },
    }));
    expect(text).toMatch(/Nature de l’opération : Prestation de services/);
    expect(text).toMatch(/taxe d’après les débits/);
    expect(text).toMatch(/Adresse de livraison : Site, 1 quai, 13001 Marseille/);
  });

  it("imprime le motif d'exonération de TVA", async () => {
    const text = await renderTexts(make as any, invoice({}, 'TVA non applicable, art. 293 B du CGI'));
    expect(text).toMatch(/art\. 293 B du CGI/);
  });

  it("n'imprime aucune mention tierce « @facturx/templates »", async () => {
    const text = await renderTexts(make as any, invoice());
    expect(text).not.toMatch(/@facturx\/templates/);
  });
});
