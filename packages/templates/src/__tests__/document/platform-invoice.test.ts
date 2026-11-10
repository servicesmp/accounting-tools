/**
 * Factures émises par la plateforme (abonnement, frais de service) : conversion des
 * enregistrements mu-billing (y compris les factures déjà émises), vue (textes de la maquette
 * « Factures Plateforme »), HTML, et PDF/A-3 avec un XML Factur-X qui porte tout ce qui est
 * imprimé (remise BG-20, période BG-14, montant payé BT-113, compensation 97).
 */
import { PDFDocument } from 'pdf-lib';
import {
  billingRecordToPlatformInvoiceData, buildPlatformInvoiceView, platformInvoiceKindOf, platformSubscriptionReference,
  renderPlatformInvoiceHtml, formatSiret, formatVatNumber, currencyDisplayName,
} from '../../document';
import { generatePlatformInvoicePdf } from '../../document-pdf';

const DAY = '2026-11-01T09:00:00.000Z';
const SELLER = {
  name: 'Services CEO',
  contacts: [{ contactEmail: 'billing@services.ceo', contactName: 'Services CEO' }],
  legalInfo: { legalName: 'SERVICES', legalForm: 'SAS', siren: '929101426', siret: '92910142600013', vatNumber: 'FR75929101426', capital: '1000' },
  postalAddress: { line1: '95 rue du Capitaine Guynemer', line2: '', postalCode: '92400', city: 'Courbevoie', countryCode: 'FR' },
  rcs: 'RCS Nanterre 929 101 426',
};

/** Facture de plan telle que mu-billing l'enregistre (ligne au HT APRÈS remise, notes d'origine). */
function planRecord(paid = true, overrides: Record<string, unknown> = {}) {
  return {
    slug: 'PLAN-20261101-0001', currency: 'EUR', paymentStatus: paid ? 'PAID' : 'PENDING', emittedDate: DAY,
    dueDate: paid ? DAY : '2026-11-08T09:00:00.000Z',
    header: { invoiceNumber: 'PLAN-20261101-0001', issueDate: DAY, notes: ['Remise appliquée : 4,90 € HT (prix avant remise 49,00 € HT).', 'Référence Stripe : SRV-0042.'] },
    seller: SELLER,
    buyer: { name: 'Camille Roux', contacts: [{ contactEmail: 'camille.roux@mailbox.fr' }], legalInfo: { siret: '', vatNumber: '' }, postalAddress: { line1: '12 rue des Capucins', city: 'Lyon', postalCode: '69001', countryCode: 'FR' } },
    payment: paid ? { method: 'card', paymentMeansCode: '48', paidAt: DAY } : { method: 'card', paymentMeansCode: '48' },
    lines: [{ id: 'PLAN_PRO', description: 'Plan Pro — abonnement mensuel · 01/11/2026 → 01/12/2026', quantity: 1, unitPrice: 4410, vatRate: 0.2, totalAmount: 4410 }],
    totalAmount: 5292,
    transactionData: {
      platformPlan: { plan: 'pro', billingInterval: 'monthly', stripeSubscriptionId: 'sub_1QxYzAbCdEf', stripeInvoiceNumber: 'SRV-0042', periodStart: DAY, periodEnd: '2026-12-01T09:00:00.000Z', subtotalCents: 4900, discountCents: 490, totalExcludingTaxCents: 4410, taxCents: 882 },
      paymentAttempts: paid ? [{ attempt: 1, at: DAY, paid: true }] : [{ attempt: 1, at: DAY, paid: false, nextPaymentAttempt: '2026-11-08T09:00:00.000Z' }],
      nextPaymentAttempt: paid ? null : '2026-11-08T09:00:00.000Z',
    },
    ...overrides,
  };
}

function feesRecord(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'FEES-20261101-0004', currency: 'EUR', paymentStatus: 'PAID', emittedDate: DAY, dueDate: DAY,
    header: { invoiceNumber: 'FEES-20261101-0004', issueDate: DAY },
    seller: SELLER,
    buyer: { name: 'Studio Lumen', contacts: [{ contactEmail: 'camille@studio-lumen.fr' }], legalInfo: { legalForm: 'SASU', capital: '5000', siret: '91234567800021', vatNumber: 'FR12912345678' }, postalAddress: { line1: '14 rue Mercière', city: 'Lyon', postalCode: '69002', countryCode: 'FR' } },
    lines: [{ id: 'PLATFORM_FEE', description: 'Commission Services pour commande ord_123', quantity: 1, unitPrice: 8000, vatRate: 0.2, totalAmount: 8000 }],
    totalAmount: 9600,
    transactionData: { feesOperation: { invoiceNumber: 'INV-20261101-0012', clientName: 'Maison Pradel', collectedAmount: 120000, collectedAt: DAY, commissionRate: 8 } },
    ...overrides,
  };
}

const n = (s: string) => s.replace(/[  ]/g, ' ');

describe('enregistrement mu-billing → facture de la plateforme', () => {
  it('série : PLAN- (abonnement), FEES- (frais de service), autre : aucune', () => {
    expect(platformInvoiceKindOf(planRecord())).toBe('subscription');
    expect(platformInvoiceKindOf(feesRecord())).toBe('service_fees');
    expect(platformInvoiceKindOf({ slug: 'INV-20261101-0001', header: {} })).toBeNull();
  });

  it('abonnement : ligne reconstruite AVANT remise, remise de document, notes techniques retirées', () => {
    const d = billingRecordToPlatformInvoiceData(planRecord());
    expect(d.kind).toBe('subscription');
    expect(d.state).toBe('paid');
    expect(d.lines).toEqual([expect.objectContaining({ unitPrice: 4900, quantity: 1, vatRate: 20, description: 'Plan Pro, abonnement mensuel du 01/11/2026 au 01/12/2026' })]);
    expect(d.discount).toEqual({ amount: 490, reason: 'Remise' });
    expect(d.notes).toEqual([]); // « Référence Stripe » et l'ancienne mention de remise ne sont pas reprises
    expect(d.period).toBeDefined();
    expect(d.subscription).toEqual(expect.objectContaining({ planName: 'Pro', interval: 'monthly', account: 'camille.roux@mailbox.fr' }));
    expect(d.subscription!.reference).toMatch(/^ABO-[0-9A-Z]{6}-PRO$/);
    expect(d.subscription!.reference).not.toContain('sub_');
  });

  it('référence d\'abonnement stable, différente d\'un abonnement à l\'autre', () => {
    expect(platformSubscriptionReference('sub_A', 'pro')).toBe(platformSubscriptionReference('sub_A', 'pro'));
    expect(platformSubscriptionReference('sub_A', 'pro')).not.toBe(platformSubscriptionReference('sub_B', 'pro'));
    expect(platformSubscriptionReference(undefined, 'pro')).toBeUndefined();
  });

  it('prélèvement refusé : état, date du refus et de la prochaine tentative', () => {
    const d = billingRecordToPlatformInvoiceData(planRecord(false));
    expect(d.state).toBe('payment_failed');
    expect(d.subscription).toEqual(expect.objectContaining({ failedAt: DAY, nextAttemptAt: '2026-11-08T09:00:00.000Z' }));
  });

  it('frais : opération enregistrée, libellé rattaché à la facture client', () => {
    const d = billingRecordToPlatformInvoiceData(feesRecord());
    expect(d.kind).toBe('service_fees');
    expect(d.operation).toEqual({ invoiceNumber: 'INV-20261101-0012', clientName: 'Maison Pradel', collectedAmount: 120000, collectedAt: DAY, commissionRate: 8 });
    expect(d.lines[0].description).toBe('Commission Services sur le règlement de la facture INV-20261101-0012');
  });

  it('frais : l\'opération fournie par l\'appelant complète une facture ancienne', () => {
    const d = billingRecordToPlatformInvoiceData(feesRecord({ transactionData: {} }), { operation: { invoiceNumber: 'INV-1', clientName: 'Client', collectedAmount: 1000, commissionRate: 8 } });
    expect(d.operation).toEqual(expect.objectContaining({ invoiceNumber: 'INV-1', clientName: 'Client', collectedAmount: 1000 }));
  });
});

describe('vue de la facture d\'abonnement', () => {
  const v = buildPlatformInvoiceView(billingRecordToPlatformInvoiceData(planRecord()));

  it('en-tête : émetteur complet, titre, dates, devise', () => {
    expect(v.title).toBe('Facture d’abonnement');
    expect(v.number).toBe('PLAN-20261101-0001');
    expect(v.seller.name).toBe('SERVICES CEO');
    expect(n(v.seller.firstLineRest)).toBe(', SAS au capital de 1 000 €');
    expect(v.seller.lines).toEqual([
      '95 rue du Capitaine Guynemer, 92400 Courbevoie, France',
      'SIRET 929 101 426 00013',
      'TVA intracommunautaire FR75 929 101 426',
      'RCS Nanterre 929 101 426',
    ]);
    expect(v.meta).toEqual([
      { label: 'Date d’émission', value: '01/11/2026' },
      { label: 'Période facturée', value: '01/11/2026 au 01/12/2026' },
      { label: 'Échéance', value: '01/11/2026' },
      { label: 'Devise', value: 'Euro' },
    ]);
  });

  it('client et bloc Abonnement', () => {
    expect(v.buyer).toEqual({ name: 'Camille Roux', lines: ['12 rue des Capucins', '69001 Lyon, France', 'camille.roux@mailbox.fr'] });
    expect(v.info.title).toBe('Abonnement');
    expect(v.info.rows.map((r) => r.label)).toEqual(['Formule', 'Compte', 'N° d’abonnement', 'Règlement', 'Statut']);
    expect(v.info.rows[0].value).toBe('Plan Pro, facturation mensuelle');
    expect(v.info.rows[4]).toEqual(expect.objectContaining({ value: 'Réglée le 01/11/2026', strong: true }));
  });

  it('tableau, remise, totaux, reste à payer', () => {
    expect(v.rows).toEqual([{ description: 'Plan Pro, abonnement mensuel du 01/11/2026 au 01/12/2026', quantity: '1', unitPrice: expect.any(String), vat: expect.any(String), total: expect.any(String) }]);
    expect(n(v.rows[0].total)).toBe('49,00 €');
    expect(v.notes.map(n)).toEqual(['Remise appliquée : 4,90 € HT, prix avant remise 49,00 € HT.']);
    expect(v.totals.map((t) => [n(t.label), n(t.value)])).toEqual([
      ['Sous-total HT', '49,00 €'], ['Remise', '− 4,90 €'], ['Total HT', '44,10 €'], ['TVA 20 %', '8,82 €'],
    ]);
    expect(n(v.grandTotal.value)).toBe('52,92 €');
    expect(v.rest.label).toBe('Reste à payer');
    expect(n(v.rest.value)).toBe('0,00 €');
    expect(v.alert).toBeUndefined();
  });

  it('pied : conditions de l\'abonnement et mentions légales, sans prestataire de paiement', () => {
    expect(v.footer.map((f) => f.title)).toEqual(['Abonnement', 'Mentions légales']);
    expect(n(v.footer[1].text)).toContain('Factur-X');
    expect(n(v.footer[1].text)).toContain('40 €');
    expect(JSON.stringify(v).toLowerCase()).not.toContain('stripe');
  });

  it('prélèvement refusé : statut rouge, montant dû, encadré de relance', () => {
    const f = buildPlatformInvoiceView(billingRecordToPlatformInvoiceData(planRecord(false)));
    expect(f.info.rows[4]).toEqual(expect.objectContaining({ value: 'Prélèvement refusé', color: '#C1123C' }));
    expect(f.rest.label).toBe('Montant dû');
    expect(n(f.rest.value)).toBe('52,92 €');
    expect(f.alert).toBe('Le prélèvement du 01/11/2026 a été refusé. Une nouvelle tentative sera effectuée le 08/11/2026. Mettez votre moyen de paiement à jour pour éviter la suspension du plan.');
  });
});

describe('vue de la facture de frais de service', () => {
  const v = buildPlatformInvoiceView(billingRecordToPlatformInvoiceData(feesRecord()));

  it('client complet (forme, capital, SIRET, TVA, e-mail) et opération concernée', () => {
    expect(v.title).toBe('Facture de frais de service');
    expect(v.meta.map((m) => m.label)).toEqual(['Date d’émission', 'Échéance', 'Date de règlement', 'Devise']);
    expect(v.buyer.lines.map(n)).toEqual([
      'SASU au capital de 5 000 €', '14 rue Mercière, 69002 Lyon, France', 'SIRET 912 345 678 00021', 'TVA intracommunautaire FR12 912 345 678', 'camille@studio-lumen.fr',
    ]);
    expect(v.info.title).toBe('Opération concernée');
    expect(v.info.rows.map((r) => [r.label, n(r.value)])).toEqual([
      ['Facture', 'INV-20261101-0012'], ['Client final', 'Maison Pradel'], ['Montant encaissé', '1 200,00 € HT'],
      ['Règlement', 'Prélèvement sur le wallet'], ['Statut', 'Réglée le 01/11/2026'],
    ]);
  });

  it('commission : mention sous le tableau et conditions du pied', () => {
    expect(v.notes.map(n)).toEqual(['Commission de 8 % du montant hors taxes encaissé, soit 1 200,00 € HT réglés par Maison Pradel le 01/11/2026.']);
    expect(v.totals.map((t) => [n(t.label), n(t.value)])).toEqual([['Total HT', '80,00 €'], ['TVA 20 %', '16,00 €']]);
    expect(n(v.grandTotal.value)).toBe('96,00 €');
    expect(v.footer[0].title).toBe('Frais de service');
    expect(n(v.footer[0].text)).toContain('Commission de 8 % du montant hors taxes de la vente');
  });

  it('frais de paiement repris : seconde ligne et mention', () => {
    const rec = feesRecord({ lines: [
      { description: 'Commission', quantity: 1, unitPrice: 8000, vatRate: 0.2 },
      { description: 'Frais de paiement par carte', quantity: 1, unitPrice: 300, vatRate: 0.2 },
    ] });
    const f = buildPlatformInvoiceView(billingRecordToPlatformInvoiceData(rec));
    expect(f.rows).toHaveLength(2);
    expect(f.notes.some((x) => x.includes('frais de paiement par carte'))).toBe(true);
  });
});

describe('mise en forme des identifiants', () => {
  it('SIRET, SIREN, TVA, devise', () => {
    expect(formatSiret('92910142600013')).toBe('929 101 426 00013');
    expect(formatSiret('929101426')).toBe('929 101 426');
    expect(formatVatNumber('FR75929101426')).toBe('FR75 929 101 426');
    expect(formatVatNumber('DE123456789')).toBe('DE123456789');
    expect(currencyDisplayName('EUR')).toBe('Euro');
  });
});

describe('HTML', () => {
  it('échappe les textes, filtre les URL, reprend la maquette', () => {
    const d = billingRecordToPlatformInvoiceData(feesRecord({ buyer: { name: '<script>x</script>' } }));
    const html = renderPlatformInvoiceHtml(buildPlatformInvoiceView(d), { logoUrl: 'javascript:alert(1)' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Opération concernée');
    expect(html).toContain('#FF3864');
  });
});

describe('PDF et XML Factur-X', () => {
  it('abonnement réglé : PDF/A-3 d\'une page, XML avec remise, période et montant payé', async () => {
    const r = await generatePlatformInvoicePdf({ data: billingRecordToPlatformInvoiceData(planRecord()), expectedTotal: 5292 });
    expect(r.warnings).toEqual([]);
    expect(r.pageCount).toBe(1);
    expect(Buffer.from(r.pdf.slice(0, 5)).toString()).toBe('%PDF-');
    const doc = await PDFDocument.load(r.pdf);
    expect(doc.getPageCount()).toBe(1);
    expect(Buffer.from(r.pdf).toString('latin1')).toContain('factur-x.xml');
    expect(r.xml).toContain('<ram:LineTotalAmount>49.00</ram:LineTotalAmount>');
    expect(r.xml).toContain('<ram:AllowanceTotalAmount>4.90</ram:AllowanceTotalAmount>');
    expect(r.xml).toContain('<ram:TaxBasisTotalAmount>44.10</ram:TaxBasisTotalAmount>');
    expect(r.xml).toContain('<ram:GrandTotalAmount>52.92</ram:GrandTotalAmount>');
    expect(r.xml).toContain('<ram:TotalPrepaidAmount>52.92</ram:TotalPrepaidAmount>');
    expect(r.xml).toContain('<ram:DuePayableAmount>0.00</ram:DuePayableAmount>');
    expect(r.xml).toContain('<ram:BillingSpecifiedPeriod>');
    expect(r.xml).toContain('<ram:TypeCode>48</ram:TypeCode>');
    expect(r.xml).toContain('ABO-'); // bloc Abonnement en note
    expect(r.xml.toLowerCase()).not.toContain('stripe');
    expect(r.xml).not.toContain('sub_1Qx');
  });

  it('prélèvement refusé : rien de payé, montant dû = TTC', async () => {
    const r = await generatePlatformInvoicePdf({ data: billingRecordToPlatformInvoiceData(planRecord(false)) });
    expect(r.xml).not.toContain('TotalPrepaidAmount');
    expect(r.xml).toContain('<ram:DuePayableAmount>52.92</ram:DuePayableAmount>');
  });

  it('frais : compensation sur le wallet (97), opération en note, réglée', async () => {
    const r = await generatePlatformInvoicePdf({ data: billingRecordToPlatformInvoiceData(feesRecord()), expectedTotal: 9600 });
    expect(r.warnings).toEqual([]);
    expect(r.xml).toContain('<ram:TypeCode>97</ram:TypeCode>');
    expect(r.xml).toContain('INV-20261101-0012');
    expect(r.xml).toContain('<ram:DuePayableAmount>0.00</ram:DuePayableAmount>');
  });

  it('écart avec le montant prélevé : signalé', async () => {
    const r = await generatePlatformInvoicePdf({ data: billingRecordToPlatformInvoiceData(feesRecord()), expectedTotal: 9601 });
    expect(r.warnings.some((w) => w.includes('montant prélevé'))).toBe(true);
  });

  it('beaucoup de lignes : pagination, pied légal sur la dernière page', async () => {
    const lines = Array.from({ length: 40 }, (_, i) => ({ description: `Commission sur l'encaissement n° ${i + 1}`, quantity: 1, unitPrice: 100, vatRate: 0.2 }));
    const r = await generatePlatformInvoicePdf({ data: billingRecordToPlatformInvoiceData(feesRecord({ lines, totalAmount: 4800 })) });
    expect(r.pageCount).toBeGreaterThan(1);
    expect(r.view.rows).toHaveLength(40);
  });
});
