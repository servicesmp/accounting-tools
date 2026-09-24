/**
 * Données d'un document → facture Factur-X (XML CII EN 16931).
 *
 * C'est ici — et seulement ici — que se fait la conversion vers le modèle de la
 * librairie cœur : unités mineures → unités majeures, pourcentages → fractions,
 * pays → codes ISO, notes françaises obligatoires (BR-FR-05), identifiants
 * (SIREN BT-30, adresses électroniques BT-34/BT-49), avoir (BT-25).
 */
import {
  FacturXInvoice, FacturxProfile, DocTypeCode, PaymentMeansCode, PostalAddressImpl,
  TradePartyImpl, DocumentHeaderImpl, PaymentDetailsImpl, InvoiceLineImpl, VatDueDateTypeCode,
  OperationNature, buildBusinessProcessType,
} from '@facturx/core';
import type { DocumentData, DocumentParty, DocumentAddress, DocumentTotals } from '../document/types';
import { toIsoCountryCode } from '../document/country';
import { currencyDecimals, toDate } from '../document/format';
import { computeLineTotal } from '../document/view';

/** Notes obligatoires françaises portées dans le XML (BR-FR-05). */
export const FR_MANDATORY_NOTES: ReadonlyArray<{ subjectCode: string; content: string }> = [
  { subjectCode: 'PMD', content: "En cas de retard de paiement, des pénalités de retard sont exigibles dès le premier jour suivant la date d'échéance, au taux de 3 fois le taux d'intérêt légal en vigueur (art. L.441-10 C.com)." },
  { subjectCode: 'PMT', content: 'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 € (art. D.441-5 C.com).' },
  { subjectCode: 'AAB', content: "Pas d'escompte accordé pour paiement anticipé." },
];

export const FR_FRANCHISE_MENTION = 'TVA non applicable, art. 293 B du CGI';

export interface FacturXBuildResult {
  readonly invoice: FacturXInvoice;
  /** Totaux du XML, en unités mineures : à réutiliser tels quels pour l'affichage. */
  readonly totals: DocumentTotals;
  /** Totaux HT par ligne (unités mineures), dans l'ordre des lignes. */
  readonly lineTotals: number[];
  /** Corrections appliquées (pays inconnu, TVA sans préfixe…). */
  readonly warnings: string[];
}

function siren(p: DocumentParty): string | undefined {
  const digits = (p.siren || p.siret || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(0, 9) : undefined;
}

function vatId(raw: string | undefined, warnings: string[], who: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.replace(/\s+/g, '').toUpperCase();
  if (v.length < 4) return undefined;
  if (!/^[A-Z]{2}/.test(v)) {
    warnings.push(`N° de TVA ${who} sans préfixe pays : « FR » ajouté (BR-CO-09).`);
    return `FR${v}`;
  }
  return v;
}

function address(a: DocumentAddress | undefined, fallbackCountry: string, warnings: string[], who: string): PostalAddressImpl {
  const iso = toIsoCountryCode(a?.country);
  if (a?.country && !iso) warnings.push(`Pays ${who} « ${a.country} » inconnu : ${fallbackCountry} utilisé.`);
  const country = iso ?? fallbackCountry;
  // Ville et code postal sont exigés par le modèle : on n'invente pas d'adresse
  // (« N/A », « 00000 ») — une adresse incomplète est signalée à l'appelant.
  const city = a?.city?.trim() || '';
  const postal = a?.postalCode?.trim() || '';
  if (!city || !postal) warnings.push(`Adresse ${who} incomplète (ville ou code postal manquant).`);
  return new PostalAddressImpl(city || '-', postal || '-', country, a?.street?.trim() || undefined, a?.additionalStreet?.trim() || undefined);
}

function means(data: DocumentData): PaymentMeansCode {
  switch (data.payment?.means) {
    case 'transfer': return PaymentMeansCode.SEPA_CREDIT_TRANSFER;
    case 'direct_debit': return PaymentMeansCode.SEPA_DIRECT_DEBIT;
    case 'cash': return PaymentMeansCode.CASH;
    case 'cheque': return PaymentMeansCode.CHEQUE;
    case 'card': return PaymentMeansCode.BANK_CARD;
    default: return data.payment?.iban ? PaymentMeansCode.SEPA_CREDIT_TRANSFER : PaymentMeansCode.BANK_CARD;
  }
}

/**
 * Construit la facture Factur-X d'une facture ou d'un avoir. Lève pour un devis
 * ou un bon de commande : ils n'ont pas de représentation Factur-X.
 */
export function buildFacturXInvoice(
  data: DocumentData,
  options: { profile?: FacturxProfile; defaultCountry?: string } = {},
): FacturXBuildResult {
  if (data.kind !== 'invoice' && data.kind !== 'credit') {
    throw new Error(`Un document « ${data.kind} » n'a pas de représentation Factur-X.`);
  }
  const warnings: string[] = [];
  const fallbackCountry = toIsoCountryCode(options.defaultCountry) ?? 'FR';
  const decimals = currencyDecimals(data.currency);
  const toMajor = (minor: number) => Math.round(Number(minor) || 0) / Math.pow(10, decimals);
  const toMinor = (major: number) => Math.round((Number(major) || 0) * Math.pow(10, decimals));

  const sellerSiren = siren(data.seller);
  const sellerParty = new TradePartyImpl(
    data.seller.legalName || data.seller.name,
    address(data.seller.address, fallbackCountry, warnings, 'du vendeur'),
    data.seller.legalName && data.seller.legalName !== data.seller.name ? data.seller.name : undefined,
    vatId(data.seller.vatId, warnings, 'du vendeur'),
    undefined,
    sellerSiren,
    sellerSiren ? '0002' : undefined,
    data.seller.email,
    data.seller.phone,
    undefined,
    data.seller.email,
    data.seller.email ? 'EM' : undefined,
  );
  const buyerSiren = siren(data.buyer);
  const buyerParty = new TradePartyImpl(
    data.buyer.legalName || data.buyer.name || 'Client',
    address(data.buyer.address, fallbackCountry, warnings, 'du client'),
    undefined,
    vatId(data.buyer.vatId, warnings, 'du client'),
    undefined,
    buyerSiren,
    buyerSiren ? '0002' : undefined,
    data.buyer.email,
    data.buyer.phone,
    undefined,
    data.buyer.email,
    data.buyer.email ? 'EM' : undefined,
  );

  const issueDate = toDate(data.issueDate) ?? new Date();
  let dueDate = toDate(data.dueDate) ?? new Date(issueDate.getTime() + 30 * 86400000);
  if (dueDate < issueDate) {
    warnings.push("Échéance antérieure à l'émission : fixée à émission + 30 jours (BR-FR-CO-07).");
    dueDate = new Date(issueDate.getTime() + 30 * 86400000);
  }

  const hb = DocumentHeaderImpl.builder()
    .id(data.number)
    .invoiceNumber(data.number)
    .name(data.kind === 'credit' ? 'AVOIR' : 'FACTURE')
    .invoiceDate(issueDate)
    .typeCode(data.kind === 'credit' ? DocTypeCode.CREDIT_NOTE : DocTypeCode.INVOICE)
    .dueDate(dueDate);
  for (const n of FR_MANDATORY_NOTES) hb.addNoteWithCode(n.content, n.subjectCode);
  if (data.notes?.trim()) hb.addNote(data.notes.trim());
  if (data.operationNature) {
    const nature = { goods: OperationNature.GOODS, services: OperationNature.SERVICES, mixed: OperationNature.MIXED }[data.operationNature];
    hb.businessProcessType(buildBusinessProcessType(nature, 1));
  }
  if (data.vatOnDebits) hb.vatDueDateTypeCode(VatDueDateTypeCode.INVOICE_DATE);
  if (data.delivery?.address) {
    hb.deliveryParty({ name: data.delivery.name, address: address(data.delivery.address, fallbackCountry, warnings, 'de livraison') });
  }
  const deliveryDate = toDate(data.deliveryDate);
  if (deliveryDate) hb.deliveryDate(deliveryDate);
  if (data.precedingInvoice?.number) {
    hb.precedingInvoice(data.precedingInvoice.number, toDate(data.precedingInvoice.issueDate) ?? undefined);
  }

  const payment = new PaymentDetailsImpl(
    means(data),
    data.payment?.iban?.replace(/\s+/g, '') || undefined,
    data.payment?.bic || undefined,
    data.payment?.iban ? undefined : data.number, // BR-CO-27 : ProprietaryID à défaut d'IBAN
    dueDate,
    data.payment?.terms || 'Paiement à réception',
  );

  const invoice = new FacturXInvoice(options.profile ?? FacturxProfile.EN16931, hb.build(), sellerParty, buyerParty, payment, [], [], data.currency.toUpperCase());

  const lineTotals: number[] = [];
  data.lines.forEach((line, i) => {
    const rate = Number(line.vatRate) || 0;
    const ht = computeLineTotal(line);
    lineTotals.push(ht);
    const qty = Number(line.quantity) || 1;
    // Prix net unitaire (BT-146) : remise incluse, pour que qté × prix = total HT.
    const net = toMajor(ht) / qty;
    const exempt = rate === 0;
    invoice.addLine(new InvoiceLineImpl(
      String(i + 1),
      [line.description, line.details].filter(Boolean).join(' — ').slice(0, 500) || `Article ${i + 1}`,
      qty,
      Math.round(net * 1e6) / 1e6,
      rate / 100,
      exempt ? 'E' : 'S',
      'C62',
      undefined, undefined, undefined, line.ref, undefined,
      exempt ? (data.vatExemptionReason || FR_FRANCHISE_MENTION) : undefined,
      exempt ? 'VATEX-FR-FRANCHISE' : undefined,
    ));
  });

  const s = invoice.finalizeTotals();
  const totals: DocumentTotals = {
    subtotal: toMinor(s.lineTotal),
    taxTotal: toMinor(s.taxTotal),
    total: toMinor(s.grandTotal),
    taxBreakdown: s.taxSummaries.map((t: any) => ({
      rate: Math.round(Number(t.rate) * 100) / 100, // TaxCalculator renvoie déjà un pourcentage
      base: toMinor(t.taxable),
      amount: toMinor(t.taxAmount),
      ...(t.exemptionReason ? { exemptionReason: t.exemptionReason } : {}),
    })),
  };
  return { invoice, totals, lineTotals, warnings };
}
