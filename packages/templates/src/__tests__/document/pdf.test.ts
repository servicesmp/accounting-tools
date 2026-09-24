import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { RealXsdValidator, FacturxProfile } from '@facturx/core';
import { generateDocumentPdf } from '../../document-pdf';
import { buildFacturXInvoice } from '../../document-pdf/facturx';
import { DOCUMENT_PRESETS, FULL_DOCUMENT_ENTITLEMENTS } from '../../document/settings';
import type { DocumentKind } from '../../document/types';
import { sampleData } from './fixtures';

const COMPLIANCE = path.join(__dirname, '..', '..', '..', '..', '..', 'legacy', 'compliance');

async function attachments(pdf: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(pdf);
  const names = (doc.catalog as any).lookup((await import('pdf-lib')).PDFName.of('Names'));
  if (!names) return [];
  return [String(names)];
}

describe('generateDocumentPdf', () => {
  const kinds: DocumentKind[] = ['invoice', 'credit', 'quote', 'order'];

  it.each(kinds)('%s : PDF valide pour chacun des 5 préréglages', async (kind) => {
    for (const preset of DOCUMENT_PRESETS) {
      const res = await generateDocumentPdf({ data: sampleData(kind), settings: { preset: preset.id, pattern: true }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
      expect(Buffer.from(res.pdf.subarray(0, 5)).toString()).toBe('%PDF-');
      expect(res.pageCount).toBeGreaterThanOrEqual(1);
      await expect(PDFDocument.load(res.pdf)).resolves.toBeDefined();
    }
  });

  it('facture et avoir embarquent factur-x.xml, valide au XSD EN 16931 ; devis et commande non', async () => {
    const validator = new RealXsdValidator(COMPLIANCE);
    for (const kind of kinds) {
      const res = await generateDocumentPdf({ data: sampleData(kind) });
      const embedded = (await attachments(res.pdf)).join('');
      if (kind === 'invoice' || kind === 'credit') {
        expect(res.xml).toBeDefined();
        expect(embedded).toMatch(/EmbeddedFiles/);
        const r = validator.validate(res.xml!, FacturxProfile.EN16931);
        if (!r.isValid) console.error(kind, r.errors);
        expect(r.isValid).toBe(true);
      } else {
        expect(res.xml).toBeUndefined();
        expect(embedded).not.toMatch(/EmbeddedFiles/);
        expect(Buffer.from(res.pdf).toString('latin1')).not.toMatch(/fx:DocumentType/);
      }
    }
  });

  it('les totaux affichés sont ceux du XML', async () => {
    const res = await generateDocumentPdf({ data: sampleData('invoice') });
    const built = buildFacturXInvoice(sampleData('invoice'));
    expect(res.view.totalsRaw.total).toBe(built.totals.total);
    expect(res.xml).toContain('<ram:GrandTotalAmount>');
  });

  it('pays saisi en toutes lettres → code ISO dans le XML', () => {
    const { invoice } = buildFacturXInvoice(sampleData('invoice', {
      buyer: { name: 'Kunde GmbH', address: { street: 'Hauptstr. 1', postalCode: '10115', city: 'Berlin', country: 'Allemagne' } },
    }));
    const xml = invoice.generateXml();
    expect(xml).toMatch(/<ram:BuyerTradeParty>[\s\S]*<ram:CountryID>DE<\/ram:CountryID>/);
    expect(xml).not.toContain('<ram:CountryID>AL</ram:CountryID>');
  });

  it('avoir : BT-25 présent dans le XML', async () => {
    const res = await generateDocumentPdf({ data: sampleData('credit') });
    expect(res.xml).toMatch(/<ram:TypeCode>381<\/ram:TypeCode>/);
    expect(res.xml).toMatch(/<ram:InvoiceReferencedDocument>\s*<ram:IssuerAssignedID>FA-2026-0042/);
  });

  it('refuse de fabriquer un XML pour un devis', () => {
    expect(() => buildFacturXInvoice(sampleData('quote'))).toThrow(/pas de représentation Factur-X/);
  });

  it('adresse incomplète : signalée, jamais inventée (« N/A », « 00000 »)', () => {
    const { invoice, warnings } = buildFacturXInvoice(sampleData('invoice', { buyer: { name: 'Client', address: { country: 'FR' } } }));
    expect(warnings.join(' ')).toMatch(/Adresse du client incomplète/);
    expect(invoice.generateXml()).not.toMatch(/N\/A|00000/);
  });

  it('plan sans personnalisation : réglage demandé ignoré, alerte renvoyée', async () => {
    const res = await generateDocumentPdf({ data: sampleData('invoice'), settings: { preset: 'brand' } });
    expect(res.view.settings.preset).toBe('modern');
    expect(res.view.poweredBy).toBe(true);
    expect(res.warnings.join(' ')).toMatch(/pas incluse/);
  });

  it('beaucoup de lignes : pagination sur plusieurs pages', async () => {
    const lines = Array.from({ length: 60 }, (_, i) => ({ description: `Ligne ${i + 1}`, quantity: 1, unitPrice: 1000, vatRate: 20 }));
    const res = await generateDocumentPdf({ data: sampleData('invoice', { lines }) });
    expect(res.pageCount).toBeGreaterThan(1);
  });
});
