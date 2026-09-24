/**
 * Modèles historiques (ModernTemplate… utilisés par generateModernPDF) :
 * couleurs de marque, titre légal, devise, mention libre.
 */
import { FacturXInvoice, FacturxProfile, DocTypeCode, PaymentMeansCode } from '@facturx/core';
import { TemplateRenderer } from '../../core/TemplateRenderer';
import { ModernTemplate } from '../../templates/ModernTemplate';
import { BrandTemplate } from '../../templates/BrandTemplate';
import { MinimalTemplate } from '../../templates/MinimalTemplate';
import { getDocumentTitle } from '../../types';

function invoice(typeCode: DocTypeCode = DocTypeCode.INVOICE, currency = 'EUR'): FacturXInvoice {
  return new FacturXInvoice(
    FacturxProfile.EN16931,
    { id: 'FA-1', invoiceNumber: 'FA-1', name: 'INVOICE', invoiceDate: new Date('2026-09-24'), typeCode, precedingInvoice: { id: 'FA-0' } } as any,
    { name: 'Vendeur SAS', address: { street: '1 rue A', postalCode: '75001', city: 'Paris', countryCode: 'FR' } } as any,
    { name: 'Client SARL', address: { street: '2 rue B', postalCode: '69001', city: 'Lyon', countryCode: 'FR' } } as any,
    { meansCode: PaymentMeansCode.CREDIT_TRANSFER, dueDate: new Date('2026-10-24') } as any,
    [{ id: '1', description: 'Conseil', quantity: 1, unitPrice: 100, vatRate: 0.2, taxCategoryCode: 'S', unitCode: 'C62', lineTotal: 100, allowances: [], charges: [] } as any],
    [],
    currency,
  );
}
const quiet = { validateBeforeGeneration: false, validateAfterGeneration: false };
const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  return { red: parseInt(h.slice(0, 2), 16) / 255, green: parseInt(h.slice(2, 4), 16) / 255, blue: parseInt(h.slice(4, 6), 16) / 255 };
};
function spyColors() {
  const spy = jest.spyOn(TemplateRenderer.prototype as any, 'parseColor');
  return (h: string) => { const i = spy.mock.calls.findIndex((c) => String(c[0]).toLowerCase() === h); return i >= 0 ? spy.mock.results[i].value : undefined; };
}
function drawnTexts() {
  const spy = jest.spyOn(TemplateRenderer.prototype as any, 'drawText');
  return () => spy.mock.calls.map((c) => String(c[0]));
}
afterEach(() => jest.restoreAllMocks());

it('remplace les teintes du modèle par les couleurs de marque', async () => {
  const resolved = spyColors();
  await new BrandTemplate().generate(invoice(), { ...quiet, brandColors: { primary: '#123456', accent: '#7a1f1f' } });
  expect(resolved('#0d2f5e')).toEqual(expect.objectContaining(rgbOf('#123456')));
  expect(resolved('#ff6600')).toEqual(expect.objectContaining(rgbOf('#7a1f1f')));
});

it('Modern porte la couleur de marque sur ses emplacements', async () => {
  const resolved = spyColors();
  await new ModernTemplate().generate(invoice(), { ...quiet, brandColors: { primary: '#123456', accent: '#123456' } });
  expect(resolved('#222223')).toEqual(expect.objectContaining(rgbOf('#123456')));
});

it('Minimal reste monochrome', async () => {
  const spy = jest.spyOn(TemplateRenderer.prototype as any, 'parseColor');
  await new MinimalTemplate().generate(invoice(), { ...quiet, brandColors: { primary: '#123456', accent: '#123456' } });
  expect(spy.mock.results.map((r: any) => r.value)).not.toContainEqual(expect.objectContaining(rgbOf('#123456')));
});

it('un avoir est intitulé AVOIR', async () => {
  const texts = drawnTexts();
  await new ModernTemplate().generate(invoice(DocTypeCode.CREDIT_NOTE), quiet);
  expect(texts()).toContain('AVOIR');
  expect(texts()).not.toContain('FACTURE');
});

it('devise de la facture (plus de « € » codé en dur)', async () => {
  const texts = drawnTexts();
  await new ModernTemplate().generate(invoice(DocTypeCode.INVOICE, 'USD'), quiet);
  const amounts = texts().filter((t) => /\d[.,]\d\d/.test(t) && /[$€]/.test(t));
  expect(amounts.length).toBeGreaterThan(0);
  expect(amounts.every((t) => t.includes('$') && !t.includes('€'))).toBe(true);
});

it('imprime la mention libre', async () => {
  const texts = drawnTexts();
  await new ModernTemplate().generate(invoice(), { ...quiet, customFooter: 'Merci pour votre confiance' });
  expect(texts()).toContain('Merci pour votre confiance');
});

it.each([[380, 'fr', 'FACTURE'], [381, 'fr', 'AVOIR'], [384, 'fr', 'FACTURE RECTIFICATIVE'], [381, 'en', 'CREDIT NOTE'], [999, 'fr', 'FACTURE']])(
  'getDocumentTitle(%s, %s) = %s', (c, l, t) => expect(getDocumentTitle(c, l)).toBe(t));
