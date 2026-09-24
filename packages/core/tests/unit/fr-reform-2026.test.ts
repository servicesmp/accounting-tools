/**
 * Réforme française de la facturation électronique (sept. 2026) :
 * nature de l'opération (BT-23), option TVA sur les débits (BT-8),
 * adresse de livraison (BT-70..80), période de facturation (BT-73/74).
 *
 * Les XML produits sont validés contre les XSD officiels Factur-X 1.07.2.
 */
import * as path from 'path';
import { FacturXInvoice } from '../../src/core/FacturXInvoice';
import {
  DocumentHeaderImpl,
  PaymentDetailsImpl,
  PostalAddressImpl,
  TradePartyImpl,
  InvoiceLine,
} from '../../src/core/entities';
import {
  DocTypeCode,
  FacturxProfile,
  PaymentMeansCode,
  VatDueDateTypeCode,
  OperationNature,
  buildBusinessProcessType,
} from '../../src/types';
import { RealXsdValidator, resetEngineDetection } from '../../src/validation/RealXsdValidator';

const COMPLIANCE_PATH = path.join(path.resolve(__dirname, '..', '..', '..', '..'), 'legacy', 'compliance');

const paris = () => PostalAddressImpl.builder().street('10 rue du Commerce').city('Paris').postalCode('75001').countryCode('FR').build();
const lyon = () => new PostalAddressImpl('Lyon', '69001', 'FR', '25 avenue Client', 'Bâtiment B');

function build(profile: FacturxProfile, headerExtras: (b: ReturnType<typeof DocumentHeaderImpl.builder>) => void = () => {}) {
  const hb = DocumentHeaderImpl.builder()
    .id('FA-2026-001')
    .invoiceNumber('FA-2026-001')
    .invoiceDate(new Date('2026-09-24'))
    .typeCode(DocTypeCode.INVOICE);
  headerExtras(hb);
  const seller = TradePartyImpl.builder().name('Vendeur SAS').address(paris()).vatId('FR12345678901').legalId('123456789').build();
  const buyer = TradePartyImpl.builder().name('Client SARL').address(lyon()).vatId('FR98765432100').legalId('987654321').build();
  const payment = PaymentDetailsImpl.builder()
    .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
    .iban('FR7630004000031234567890143')
    .dueDate(new Date('2026-10-24'))
    .build();
  const inv = new FacturXInvoice(profile, hb.build(), seller, buyer, payment);
  inv.addLine(new InvoiceLine('1', 'Prestation de conseil', 2, 500, 0.2));
  return inv;
}

const fullHeader = (b: any) => b
  .operationNature(OperationNature.SERVICES)
  .vatDueDateTypeCode(VatDueDateTypeCode.INVOICE_DATE)
  .deliveryParty({ name: 'Site Client', address: new PostalAddressImpl('Marseille', '13001', 'FR', '1 quai du Port') })
  .deliveryDate(new Date('2026-09-20'))
  .billingPeriod(new Date('2026-09-01'), new Date('2026-09-30'));

describe('Réforme FR 2026 — XML Factur-X', () => {
  let validator: RealXsdValidator;
  beforeAll(() => {
    resetEngineDetection();
    validator = new RealXsdValidator(COMPLIANCE_PATH);
  });

  it('BT-23 : cadre de facturation dans le contexte, avant le guideline', () => {
    const xml = build(FacturxProfile.EN16931, fullHeader).generateXml();
    expect(xml).toMatch(/<ram:BusinessProcessSpecifiedDocumentContextParameter>\s*<ram:ID>S1<\/ram:ID>/);
    expect(xml.indexOf('BusinessProcessSpecifiedDocumentContextParameter'))
      .toBeLessThan(xml.indexOf('GuidelineSpecifiedDocumentContextParameter'));
  });

  it('BT-8 : option TVA sur les débits dans chaque ventilation de TVA', () => {
    const xml = build(FacturxProfile.EN16931, fullHeader).generateXml();
    expect(xml).toMatch(/<ram:DueDateTypeCode>5<\/ram:DueDateTypeCode>\s*<ram:RateApplicablePercent>/);
  });

  it('BT-70..80 / BT-72 : adresse et date de livraison', () => {
    const xml = build(FacturxProfile.EN16931, fullHeader).generateXml();
    expect(xml).toMatch(/<ram:ShipToTradeParty>\s*<ram:Name>Site Client<\/ram:Name>/);
    expect(xml).toContain('<ram:CityName>Marseille</ram:CityName>');
    expect(xml).toMatch(/<ram:ActualDeliverySupplyChainEvent>[\s\S]*20260920/);
    expect(xml.indexOf('ShipToTradeParty')).toBeLessThan(xml.indexOf('ActualDeliverySupplyChainEvent'));
  });

  it('BT-73/74 : période de facturation', () => {
    const xml = build(FacturxProfile.EN16931, fullHeader).generateXml();
    expect(xml).toMatch(/<ram:BillingSpecifiedPeriod>[\s\S]*20260901[\s\S]*20260930[\s\S]*<\/ram:BillingSpecifiedPeriod>/);
  });

  it('adresse acheteur : LineTwo transmise', () => {
    const xml = build(FacturxProfile.EN16931).generateXml();
    expect(xml).toContain('<ram:LineTwo>Bâtiment B</ram:LineTwo>');
  });

  it('sans les nouveaux champs : XML inchangé (rétrocompatibilité)', () => {
    const xml = build(FacturxProfile.EN16931).generateXml();
    expect(xml).not.toContain('BusinessProcessSpecifiedDocumentContextParameter');
    expect(xml).not.toContain('DueDateTypeCode');
    expect(xml).not.toContain('ShipToTradeParty');
    expect(xml).not.toContain('BillingSpecifiedPeriod');
    expect(xml).toMatch(/<ram:ActualDeliverySupplyChainEvent>[\s\S]*20260924/);
  });

  it.each([FacturxProfile.EN16931, FacturxProfile.BASIC, FacturxProfile.EXTENDED])(
    'XML complet valide contre le XSD officiel (%s)',
    (profile) => {
      const xml = build(profile, fullHeader).generateXml();
      const result = validator.validate(xml, profile);
      if (!result.isValid) console.error(result.errors);
      expect(result.isValid).toBe(true);
    },
  );

  it('rejette un cadre de facturation inconnu ou retiré (8, 9)', () => {
    expect(() => build(FacturxProfile.EN16931, (b) => b.businessProcessType('S9'))).toThrow(/BT-23/);
    expect(() => build(FacturxProfile.EN16931, (b) => b.businessProcessType('X1'))).toThrow(/BT-23/);
    expect(() => buildBusinessProcessType(OperationNature.GOODS, 8)).toThrow(/BT-23/);
    expect(buildBusinessProcessType(OperationNature.MIXED, 2)).toBe('M2');
  });

  it('BR-29 : refuse une période dont la fin précède le début', () => {
    expect(() => build(FacturxProfile.EN16931, (b) => b.billingPeriod(new Date('2026-09-30'), new Date('2026-09-01'))))
      .toThrow(/BR-29/);
  });
});

describe('Avoir (381) — référence à la facture d’origine (BT-25/26)', () => {
  let validator: RealXsdValidator;
  beforeAll(() => { resetEngineDetection(); validator = new RealXsdValidator(COMPLIANCE_PATH); });

  const creditNote = (withRef: boolean) => build(FacturxProfile.EN16931, (b: any) => {
    b.typeCode(DocTypeCode.CREDIT_NOTE);
    if (withRef) b.precedingInvoice('FA-2026-0042', new Date('2026-09-01'));
  });

  it('écrit InvoiceReferencedDocument après la synthèse monétaire, valide XSD', () => {
    const xml = creditNote(true).generateXml();
    expect(xml).toMatch(/<ram:InvoiceReferencedDocument>\s*<ram:IssuerAssignedID>FA-2026-0042<\/ram:IssuerAssignedID>[\s\S]*20260901/);
    expect(xml.indexOf('InvoiceReferencedDocument')).toBeGreaterThan(xml.indexOf('SpecifiedTradeSettlementHeaderMonetarySummation'));
    const r = validator.validate(xml, FacturxProfile.EN16931);
    if (!r.isValid) console.error(r.errors);
    expect(r.isValid).toBe(true);
  });

  it('refuse un avoir sans facture d’origine', () => {
    expect(() => creditNote(false).generateXml()).toThrow(/BT-25/);
  });
});

describe('Exonération de TVA — XML valide', () => {
  it('une ligne exonérée (franchise en base) produit un XML conforme au XSD', () => {
    resetEngineDetection();
    const validator = new RealXsdValidator(COMPLIANCE_PATH);
    const inv = build(FacturxProfile.EN16931);
    (inv as any).lines.length = 0;
    inv.addLine(Object.assign(new InvoiceLine('1', 'Prestation', 1, 100, 0), {
      taxCategoryCode: 'E',
      taxExemptionReason: 'TVA non applicable, art. 293 B du CGI',
      taxExemptionReasonCode: 'VATEX-FR-FRANCHISE',
    }));
    const r = validator.validate(inv.generateXml(), FacturxProfile.EN16931);
    if (!r.isValid) console.error(r.errors);
    expect(r.isValid).toBe(true);
  });
});
