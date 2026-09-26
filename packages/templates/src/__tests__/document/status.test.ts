/**
 * États des documents et filigranes : une seule règle pour l'écran, le PDF et le
 * filigrane. Avant, toute facture non payée partait avec « BROUILLON », y compris
 * une facture déjà envoyée au client ; un devis périmé n'était signalé nulle part.
 */
import { billingInvoiceStatus, billingInvoiceToDocumentData, estimateDocumentStatus, estimateToDocumentData, isBillingInvoicePaid } from '../../document/records';
import { buildDocumentView, watermarkFontSize } from '../../document/view';
import { renderDocumentHtml } from '../../document/html';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS } from '../../document/settings';
import { generateDocumentPdf } from '../../document-pdf';
import { sampleData } from './fixtures';
import type { DocumentKind, DocumentStatus } from '../../document/types';

const settings = (over: any = {}) => normalizeDocumentSettings({ statusWatermark: true, ...over }, FULL_DOCUMENT_ENTITLEMENTS).settings;
const asOf = new Date('2026-10-01T12:00:00Z');

const invoice = (over: any = {}) => ({
  invoiceId: 'inv-1', paymentStatus: 'pending', state: 'online', dueDate: '2026-10-25T10:00:00Z',
  header: { invoiceNumber: 'FA-1', typeCode: '380' }, seller: { name: 'Vendeur' }, buyer: { name: 'Client' },
  payment: { dueDate: '2026-10-25T10:00:00Z' }, lines: [{ description: 'x', quantity: 1, unitPrice: 1000, vatRate: 0.2 }],
  ...over,
});
const manual = { transactionData: { metadata: { source: 'manual' }, viewInvitations: [], paymentInvitations: [] } };

describe('billingInvoiceStatus', () => {
  it('facture saisie à la main, jamais envoyée → brouillon', () => {
    expect(billingInvoiceStatus(invoice(manual), asOf)).toBe('draft');
    expect(billingInvoiceStatus(invoice({ ...manual, transactionData: JSON.stringify(manual.transactionData) }), asOf)).toBe('draft');
  });

  it('facture envoyée (état SENT ou invitation) → émise, plus brouillon', () => {
    expect(billingInvoiceStatus(invoice({ ...manual, state: 'SENT' }), asOf)).toBe('pending');
    const invited = { transactionData: { metadata: { source: 'manual' }, paymentInvitations: [{ email: 'a@b.fr' }] } };
    expect(billingInvoiceStatus(invoice(invited), asOf)).toBe('pending');
  });

  it('facture émise par la plateforme (sans source manuelle) → émise même si non payée', () => {
    expect(billingInvoiceStatus(invoice({ state: 'ACTIVE', paymentStatus: 'PENDING' }), asOf)).toBe('pending');
  });

  it('échéance dépassée et non payée → en retard ; payée → payée quel que soit le délai', () => {
    const late = { dueDate: '2026-09-01T00:00:00Z', payment: { dueDate: '2026-09-01T00:00:00Z' } };
    expect(billingInvoiceStatus(invoice({ ...late, state: 'SENT' }), asOf)).toBe('overdue');
    expect(billingInvoiceStatus(invoice({ ...late, paymentStatus: 'PAID' }), asOf)).toBe('paid');
    expect(billingInvoiceStatus(invoice({ paymentStatus: 'completed' }), asOf)).toBe('paid');
  });

  it('annulée / remboursée', () => {
    expect(billingInvoiceStatus(invoice({ paymentStatus: 'CANCELLED' }), asOf)).toBe('cancelled');
    expect(billingInvoiceStatus(invoice({ state: 'VOID' }), asOf)).toBe('cancelled');
    expect(billingInvoiceStatus(invoice({ paymentStatus: 'REFUNDED' }), asOf)).toBe('refunded');
  });

  it('isBillingInvoicePaid ignore la casse', () => {
    expect(isBillingInvoicePaid({ paymentStatus: 'paid' })).toBe(true);
    expect(isBillingInvoicePaid({ paymentStatus: 'pending' })).toBe(false);
  });
});

describe('billingInvoiceToDocumentData : état et lien de paiement', () => {
  const link = 'https://app.services.ceo/pay/invoice/tok';
  it('brouillon : pas de lien de paiement, filigrane BROUILLON', () => {
    const d = billingInvoiceToDocumentData(invoice(manual), { paymentLink: link, asOf });
    expect(d.status).toBe('draft');
    expect(d.payment?.link).toBeUndefined();
    expect(buildDocumentView(d, { settings: settings() }).watermark).toBe('BROUILLON');
  });

  it('émise à payer : lien de paiement, aucun filigrane', () => {
    const d = billingInvoiceToDocumentData(invoice({ state: 'SENT' }), { paymentLink: link, asOf });
    expect(d.status).toBe('pending');
    expect(d.payment?.link).toBe(link);
    expect(buildDocumentView(d, { settings: settings() }).watermark).toBeUndefined();
  });

  it('en retard : lien conservé, filigrane EN RETARD', () => {
    const d = billingInvoiceToDocumentData(invoice({ state: 'SENT', payment: { dueDate: '2026-09-01' } }), { paymentLink: link, asOf });
    expect(d.status).toBe('overdue');
    expect(d.payment?.link).toBe(link);
    expect(buildDocumentView(d, { settings: settings() }).watermark).toBe('EN RETARD');
  });

  it('payée : ni lien ni « brouillon », filigrane PAYÉE (accord féminin)', () => {
    const d = billingInvoiceToDocumentData(invoice({ paymentStatus: 'PAID' }), { paymentLink: link, asOf });
    expect(d.payment?.link).toBeUndefined();
    expect(buildDocumentView(d, { settings: settings() }).watermark).toBe('PAYÉE');
  });

  it('isDraft force le brouillon (éditeur de brouillon)', () => {
    expect(billingInvoiceToDocumentData(invoice({ state: 'SENT' }), { isDraft: true, asOf }).status).toBe('draft');
  });
});

describe('devis : état', () => {
  it('statuts métier', () => {
    expect(estimateDocumentStatus('DRAFT', undefined, asOf)).toBe('draft');
    expect(estimateDocumentStatus('client_validated', undefined, asOf)).toBe('accepted');
    expect(estimateDocumentStatus('REJECTED', undefined, asOf)).toBe('rejected');
    expect(estimateDocumentStatus('EXPIRED', undefined, asOf)).toBe('expired');
    expect(estimateDocumentStatus('CLOSED', undefined, asOf)).toBe('cancelled');
  });

  it('sans réponse après la date de validité → expiré ; encore valable → en attente', () => {
    expect(estimateDocumentStatus('PENDING', new Date('2026-09-15'), asOf)).toBe('expired');
    expect(estimateDocumentStatus('NEGOTIATING', new Date('2026-09-15'), asOf)).toBe('expired');
    expect(estimateDocumentStatus('PENDING', new Date('2026-12-01'), asOf)).toBe('pending');
    // Un devis accepté ne « périme » pas.
    expect(estimateDocumentStatus('ACCEPTED', new Date('2026-09-15'), asOf)).toBe('accepted');
  });

  it('estimateToDocumentData applique la règle et asOf', () => {
    const est = { estimateId: 'e1', status: 'PENDING', details: { validUntil: '2026-09-15', services: [], from: {}, to: {} } };
    expect(estimateToDocumentData(est, { asOf }).status).toBe('expired');
    expect(estimateToDocumentData(est, { asOf: new Date('2026-09-01') }).status).toBe('pending');
  });
});

describe('filigranes', () => {
  const wm = (kind: DocumentKind, status: DocumentStatus, language = 'fr') =>
    buildDocumentView(sampleData(kind, { status, ...(kind === 'credit' ? {} : {}) }), { settings: settings({ language }) }).watermark;

  it('accord en genre (fr) : facture au féminin, avoir et devis au masculin', () => {
    expect(wm('invoice', 'paid')).toBe('PAYÉE');
    expect(wm('invoice', 'cancelled')).toBe('ANNULÉE');
    expect(wm('invoice', 'refunded')).toBe('REMBOURSÉE');
    expect(wm('credit', 'cancelled')).toBe('ANNULÉ');
    expect(wm('quote', 'accepted')).toBe('ACCEPTÉ');
    expect(wm('quote', 'rejected')).toBe('REFUSÉ');
    expect(wm('quote', 'expired')).toBe('EXPIRÉ');
    expect(wm('order', 'draft')).toBe('BROUILLON');
  });

  it('aucun filigrane pour un document en attente, ni si le réglage est désactivé', () => {
    expect(wm('invoice', 'pending')).toBeUndefined();
    expect(buildDocumentView(sampleData('invoice', { status: 'paid' }), { settings: settings({ statusWatermark: false }) }).watermark).toBeUndefined();
  });

  it('autres langues', () => {
    expect(wm('quote', 'expired', 'en')).toBe('EXPIRED');
    expect(wm('invoice', 'overdue', 'de')).toBe('ÜBERFÄLLIG');
  });

  it('taille : 110 px pour un mot court, réduite pour un mot long, identique HTML et vue', () => {
    expect(watermarkFontSize('PAYÉE')).toBe(110);
    expect(watermarkFontSize('REMBOURSÉE')).toBeLessThan(110);
    const v = buildDocumentView(sampleData('invoice', { status: 'refunded' }), { settings: settings() });
    expect(v.watermarkSize).toBe(watermarkFontSize('REMBOURSÉE'));
    const html = renderDocumentHtml(v);
    expect(html).toContain('REMBOURSÉE');
    expect(html).toContain(`${v.watermarkSize}px`);
  });

  it('le PDF porte le filigrane (texte présent dans le flux)', async () => {
    const withWm = await generateDocumentPdf({ data: sampleData('quote', { status: 'expired' }), settings: { statusWatermark: true }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    const without = await generateDocumentPdf({ data: sampleData('quote', { status: 'pending' }), settings: { statusWatermark: true }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(withWm.view.watermark).toBe('EXPIRÉ');
    expect(without.view.watermark).toBeUndefined();
    // Le filigrane ajoute des glyphes : le PDF est plus lourd que le même devis sans filigrane.
    expect(withWm.pdf.length).toBeGreaterThan(without.pdf.length);
  });
});

describe('espagnol', () => {
  it('langue disponible, libellés et filigranes accordés', () => {
    const v = buildDocumentView(sampleData('invoice', { status: 'paid' }), { settings: settings({ language: 'es' }) });
    expect(v.title).toBe('FACTURA');
    expect(v.watermark).toBe('PAGADA');
    expect(buildDocumentView(sampleData('quote', { status: 'expired' }), { settings: settings({ language: 'es' }) }).watermark).toBe('CADUCADO');
    expect(buildDocumentView(sampleData('quote'), { settings: settings({ language: 'es' }) }).title).toBe('PRESUPUESTO');
  });
  it('un réglage « es » n’est plus ramené au français', () => {
    expect(normalizeDocumentSettings({ language: 'es' }, FULL_DOCUMENT_ENTITLEMENTS).settings.language).toBe('es');
  });
  it('le PDF espagnol se génère (dates et montants au format es-ES)', async () => {
    const out = await generateDocumentPdf({ data: sampleData('invoice'), settings: { language: 'es' }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(out.view.title).toBe('FACTURA');
    expect(out.pdf.length).toBeGreaterThan(1000);
  });
});
