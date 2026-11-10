/**
 * `PlatformInvoiceData` → `PlatformInvoiceView` (textes prêts à dessiner) et → `DocumentData`
 * (XML Factur-X). Les deux partent des mêmes données : ce qui est imprimé est dans le XML.
 */
import type { DocumentData, DocumentParty, DocumentTotals } from './types';
import type { PlatformInvoiceData, PlatformInvoiceView, PlatformInfoRow, PlatformTotalRow } from './platform-invoice-types';
import { formatDate, formatMoney, formatPercent, formatQuantity, toDate } from './format';
import { countryDisplayName } from './country';
import { computeLineTotal } from './view';

const LOCALE = 'fr-FR';
/** Statut refusé (maquette). */
export const PLATFORM_ALERT_COLOR = '#C1123C';

const PLAN_INTERVAL = { monthly: 'mensuel', annual: 'annuel' } as const;
const PLAN_BILLING = { monthly: 'facturation mensuelle', annual: 'facturation annuelle' } as const;

// ─── Mise en forme des identifiants ──────────────────────────────────────────

/** « 92910142600013 » → « 929 101 426 00013 » ; SIREN « 929101426 » → « 929 101 426 ». */
export function formatSiret(value: string | undefined): string | undefined {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length === 14) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return value || undefined;
}

/** « FR75929101426 » → « FR75 929 101 426 » (TVA française) ; autres pays inchangés. */
export function formatVatNumber(value: string | undefined): string | undefined {
  const v = (value ?? '').replace(/\s/g, '').toUpperCase();
  if (!v) return undefined;
  const fr = /^FR([0-9A-Z]{2})(\d{9})$/.exec(v);
  return fr ? `FR${fr[1]} ${fr[2].slice(0, 3)} ${fr[2].slice(3, 6)} ${fr[2].slice(6)}` : v;
}

/** Nom de la devise : « Euro », « Dollar des États-Unis ». */
export function currencyDisplayName(currency: string): string {
  const code = (currency || 'EUR').toUpperCase();
  try {
    const DisplayNames = (Intl as any).DisplayNames;
    const name: string | undefined = DisplayNames && new DisplayNames(['fr'], { type: 'currency' }).of(code);
    return name ? name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1) : code;
  } catch {
    return code;
  }
}

function addressParts(p: DocumentParty): { street?: string; city?: string } {
  const a = p.address ?? {};
  const street = [a.street, a.additionalStreet].filter(Boolean).join(', ') || undefined;
  const country = a.country ? countryDisplayName(a.country, 'fr') : undefined;
  const cityLine = [[a.postalCode, a.city].filter(Boolean).join(' '), country].filter(Boolean).join(', ') || undefined;
  return { street, city: cityLine };
}

/** « SAS au capital de 1 000 € » ; forme ou capital seul si l'autre manque. */
function legalLine(p: DocumentParty): string | undefined {
  if (p.legalForm && p.capital) return `${p.legalForm} au capital de ${p.capital}`;
  if (p.capital) return `Société au capital de ${p.capital}`;
  return p.legalForm || undefined;
}

function idLines(p: DocumentParty): string[] {
  const out: string[] = [];
  const siret = formatSiret(p.siret);
  const siren = formatSiret(p.siren);
  if (siret) out.push(`SIRET ${siret}`);
  else if (siren) out.push(`SIREN ${siren}`);
  const vat = formatVatNumber(p.vatId);
  if (vat) out.push(`TVA intracommunautaire ${vat}`);
  return out;
}

// ─── Totaux ──────────────────────────────────────────────────────────────────

/** Taux de la remise de document : celui de la première ligne (une seule base imposable en pratique). */
export function platformDiscountRate(data: PlatformInvoiceData): number {
  return Number(data.lines[0]?.vatRate) || 0;
}

/** Totaux calculés (HT des lignes, remise, base, TVA par taux arrondie par taux, TTC). */
export function computePlatformTotals(data: PlatformInvoiceData): DocumentTotals {
  const byRate = new Map<number, number>();
  let subtotal = 0;
  for (const l of data.lines) {
    const ht = computeLineTotal(l);
    subtotal += ht;
    const rate = Number(l.vatRate) || 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + ht);
  }
  const discount = Math.max(0, Math.round(Number(data.discount?.amount) || 0));
  if (discount > 0) {
    const r = platformDiscountRate(data);
    byRate.set(r, (byRate.get(r) ?? 0) - discount);
  }
  const taxBreakdown = [...byRate.entries()].sort((a, b) => b[0] - a[0]).map(([rate, base]) => ({ rate, base, amount: Math.round((base * rate) / 100) }));
  const taxTotal = taxBreakdown.reduce((s, t) => s + t.amount, 0);
  return { subtotal, taxTotal, total: subtotal - discount + taxTotal, taxBreakdown, ...(discount ? { allowanceTotal: discount } : {}) };
}

// ─── Données → XML Factur-X ──────────────────────────────────────────────────

function infoAsText(view: Pick<PlatformInvoiceView, 'info'>): string {
  return `${view.info.title} : ${view.info.rows.map((r) => `${r.label} ${r.value}`).join(' ; ')}.`;
}

/**
 * `DocumentData` du XML : lignes, remise (BG-20), période (BG-14), moyen de paiement (carte,
 * compensation sur le wallet), et en notes (BT-22) le bloc d'information, les mentions sous le
 * tableau et les conditions du pied — tout ce que le PDF imprime.
 */
export function platformInvoiceToDocumentData(data: PlatformInvoiceData, view: PlatformInvoiceView = buildPlatformInvoiceView(data)): DocumentData {
  const issue = toDate(data.issueDate) ?? new Date();
  const due = toDate(data.dueDate) ?? issue;
  const discount = Math.max(0, Math.round(Number(data.discount?.amount) || 0));
  const subscription = data.kind === 'subscription';
  const notes = [infoAsText(view), ...view.notes, ...(view.alert ? [view.alert] : []), ...view.footer.filter((f) => f.title !== 'Mentions légales').map((f) => `${f.title} : ${f.text}`)];
  return {
    kind: 'invoice',
    number: data.number,
    issueDate: issue,
    dueDate: due < issue ? issue : due,
    currency: data.currency,
    status: data.state === 'paid' ? 'paid' : data.state === 'cancelled' ? 'cancelled' : data.state === 'refunded' ? 'refunded' : 'pending',
    seller: data.seller,
    buyer: data.buyer,
    lines: data.lines,
    ...(data.period ? { billingPeriod: data.period } : {}),
    ...(discount ? { allowances: [{ amount: discount, reason: data.discount?.reason || 'Remise', vatRate: platformDiscountRate(data) }] } : {}),
    operationNature: 'services',
    payment: subscription
      ? { means: 'card', terms: 'Prélèvement automatique sur carte bancaire à chaque échéance' }
      : { means: 'clearing', terms: 'Prélevé sur le wallet du prestataire au moment de l’encaissement' },
    notes: notes.join('\n'),
  };
}

// ─── Vue ─────────────────────────────────────────────────────────────────────

export interface BuildPlatformInvoiceViewOptions {
  /** Totaux imposés (ceux du XML Factur-X) ; calculés depuis les lignes sinon. */
  readonly totals?: DocumentTotals;
}

export function buildPlatformInvoiceView(data: PlatformInvoiceData, options: BuildPlatformInvoiceViewOptions = {}): PlatformInvoiceView {
  const cur = (data.currency || 'EUR').toUpperCase();
  const money = (n: number) => formatMoney(n, cur, LOCALE);
  const date = (d: string | Date | undefined) => formatDate(d, LOCALE);
  const subscription = data.kind === 'subscription';
  const totals = options.totals ?? computePlatformTotals(data);
  const discount = totals.allowanceTotal ?? Math.max(0, Math.round(Number(data.discount?.amount) || 0));
  const taxBasis = totals.subtotal - discount;
  const paid = data.state === 'paid' ? totals.total : 0;
  const due = totals.total - paid;
  const issue = toDate(data.issueDate) ?? new Date();
  const dueDate = toDate(data.dueDate) ?? issue;
  const paidAt = toDate(data.paidAt) ?? (data.state === 'paid' ? issue : null);

  // Émetteur
  const s = data.seller;
  const sAddr = addressParts(s);
  const sellerLegal = legalLine(s);
  const seller = {
    name: s.name.toLocaleUpperCase('fr-FR'),
    firstLineRest: sellerLegal ? `, ${sellerLegal}` : '',
    lines: [[sAddr.street, sAddr.city].filter(Boolean).join(', '), ...idLines(s), ...(s.registration ? [s.registration] : [])].filter(Boolean),
  };

  // En-tête
  const meta: { label: string; value: string }[] = [{ label: 'Date d’émission', value: date(issue) }];
  if (data.period) meta.push({ label: 'Période facturée', value: `${date(data.period.start)} au ${date(data.period.end)}` });
  meta.push({ label: 'Échéance', value: date(dueDate < issue ? issue : dueDate) });
  if (!subscription && paidAt) meta.push({ label: 'Date de règlement', value: date(paidAt) });
  meta.push({ label: 'Devise', value: currencyDisplayName(cur) });

  // Client
  const b = data.buyer;
  const bAddr = addressParts(b);
  const buyerLines = subscription
    ? [bAddr.street, bAddr.city, b.email]
    : [legalLine(b), [bAddr.street, bAddr.city].filter(Boolean).join(', '), ...idLines(b), b.email];
  const buyer = { name: b.legalName && !subscription ? b.legalName : b.name, lines: buyerLines.filter((l): l is string => !!l) };

  // Statut
  const statusRow = (): PlatformInfoRow => {
    switch (data.state) {
      case 'paid': return { label: 'Statut', value: paidAt ? `Réglée le ${date(paidAt)}` : 'Réglée', strong: true };
      case 'payment_failed': return { label: 'Statut', value: 'Prélèvement refusé', strong: true, color: PLATFORM_ALERT_COLOR };
      case 'refunded': return { label: 'Statut', value: 'Remboursée', strong: true };
      case 'cancelled': return { label: 'Statut', value: 'Annulée', strong: true };
      default: return { label: 'Statut', value: `À régler avant le ${date(dueDate)}`, strong: true };
    }
  };

  // Bloc d'information
  const op = data.operation ?? {};
  const sub = data.subscription;
  const rate = op.commissionRate !== undefined ? formatPercent(op.commissionRate, LOCALE) : undefined;
  const info = subscription
    ? {
      title: 'Abonnement',
      rows: [
        ...(sub ? [{ label: 'Formule', value: `Plan ${sub.planName}, ${PLAN_BILLING[sub.interval]}${sub.planChange ? ' (changement de plan)' : ''}` }] : []),
        ...(sub?.account ?? b.email ? [{ label: 'Compte', value: (sub?.account ?? b.email)! }] : []),
        ...(sub?.reference ? [{ label: 'N° d’abonnement', value: sub.reference }] : []),
        { label: 'Règlement', value: 'Carte bancaire, prélèvement automatique' },
        statusRow(),
      ],
    }
    : {
      title: 'Opération concernée',
      rows: [
        ...(op.invoiceNumber ? [{ label: 'Facture', value: op.invoiceNumber }] : []),
        ...(op.clientName ? [{ label: 'Client final', value: op.clientName }] : []),
        ...(op.collectedAmount !== undefined ? [{ label: 'Montant encaissé', value: `${money(op.collectedAmount)} HT` }] : []),
        { label: 'Règlement', value: 'Prélèvement sur le wallet' },
        statusRow(),
      ],
    };

  // Lignes
  const rows = data.lines.map((l) => ({
    description: [l.description, l.details].filter(Boolean).join(' — '),
    quantity: formatQuantity(l.quantity, LOCALE),
    unitPrice: money(l.unitPrice),
    vat: formatPercent(Number(l.vatRate) || 0, LOCALE),
    total: money(computeLineTotal(l)),
  }));

  // Mentions sous le tableau
  const notes: string[] = [];
  if (discount > 0) notes.push(`Remise appliquée : ${money(discount)} HT, prix avant remise ${money(totals.subtotal)} HT.`);
  if (!subscription && rate && op.collectedAmount !== undefined) {
    const by = op.clientName ? ` réglés par ${op.clientName}` : ' encaissés';
    const when = op.collectedAt ? ` le ${date(op.collectedAt)}` : '';
    notes.push(`Commission de ${rate} du montant hors taxes encaissé, soit ${money(op.collectedAmount)} HT${by}${when}.`);
  }
  if (!subscription && data.lines.length > 1) notes.push('Les frais de paiement par carte de l’encaissement sont refacturés avec la commission, au même taux de TVA.');
  for (const n of data.notes ?? []) if (n && n.trim()) notes.push(n.trim());

  // Totaux
  const taxRows: PlatformTotalRow[] = totals.taxBreakdown.length
    ? totals.taxBreakdown.map((t) => ({ label: `TVA ${formatPercent(t.rate, LOCALE)}`, value: money(t.amount), strong: true }))
    : [{ label: 'TVA', value: money(totals.taxTotal), strong: true }];
  const totalRows: PlatformTotalRow[] = discount > 0
    ? [
      { label: 'Sous-total HT', value: money(totals.subtotal) },
      { label: 'Remise', value: `− ${money(discount)}` },
      { label: 'Total HT', value: money(taxBasis), strong: true, ruleTop: true },
      ...taxRows,
    ]
    : [{ label: 'Total HT', value: money(taxBasis), strong: true }, ...taxRows];

  // Prélèvement refusé
  let alert: string | undefined;
  if (data.state === 'payment_failed') {
    const failed = sub?.failedAt ? ` du ${date(sub.failedAt)}` : '';
    alert = sub?.nextAttemptAt
      ? `Le prélèvement${failed} a été refusé. Une nouvelle tentative sera effectuée le ${date(sub.nextAttemptAt)}. Mettez votre moyen de paiement à jour pour éviter la suspension du plan.`
      : `Le prélèvement${failed} a été refusé. Mettez votre moyen de paiement à jour pour régler cette facture et éviter la suspension du plan.`;
  }

  // Pied
  const rates = [...new Set(data.lines.map((l) => Number(l.vatRate) || 0))].map((r) => formatPercent(r, LOCALE));
  const vatText = rates.length === 1 ? `TVA française au taux de ${rates[0]}.` : `TVA française aux taux de ${rates.join(', ')}.`;
  const legal = `${vatText} Facture émise au format Factur-X (PDF/A-3, norme EN 16931). En cas de retard de paiement : pénalités au taux de 3\u00a0fois le taux d’intérêt légal et indemnité forfaitaire de 40\u00a0€ pour frais de recouvrement, article L441-10 du Code de commerce. Pas d’escompte pour paiement anticipé.`;
  const conditions = subscription
    ? { title: 'Abonnement', text: 'Abonnement sans engagement, renouvelé automatiquement à chaque échéance. Résiliable à tout moment, l’arrêt prenant effet à la fin de la période en cours.' }
    : {
      title: 'Frais de service',
      text: `Commission${rate ? ` de ${rate}` : ''} du montant hors taxes de la vente, ajoutée au prix payé par le client. Elle est prélevée sur le wallet du prestataire au moment de l’encaissement.`,
    };

  return {
    kind: data.kind,
    locale: LOCALE,
    title: subscription ? 'Facture d’abonnement' : 'Facture de frais de service',
    number: data.number,
    seller,
    meta,
    buyerTitle: 'Facturé à',
    buyer,
    info,
    columns: { description: 'Désignation', quantity: 'Qté', unitPrice: 'Prix HT', vat: 'TVA', total: 'Montant HT' },
    rows,
    notes,
    totals: totalRows,
    grandTotal: { label: 'Total TTC', value: money(totals.total) },
    rest: data.state === 'paid' ? { label: 'Reste à payer', value: money(0) } : { label: 'Montant dû', value: money(due) },
    alert,
    footer: [conditions, { title: 'Mentions légales', text: legal }],
    pageLabel: (page, total) => `Page ${page} sur ${total}`,
    totalsRaw: { lines: totals.subtotal, discount, taxBasis, tax: totals.taxTotal, total: totals.total, paid, due },
  };
}

/** Libellé de ligne d'un abonnement : « Plan Pro, abonnement mensuel du 01/11/2026 au 01/12/2026 ». */
export function platformSubscriptionLineLabel(planName: string, interval: 'monthly' | 'annual', period?: { start?: string | Date | null; end?: string | Date | null }, planChange = false): string {
  const start = period?.start ? formatDate(period.start, LOCALE) : '';
  const end = period?.end ? formatDate(period.end, LOCALE) : '';
  const span = start && end ? ` du ${start} au ${end}` : start ? ` à partir du ${start}` : '';
  return `Plan ${planName}, abonnement ${PLAN_INTERVAL[interval]}${planChange ? ' (changement de plan)' : ''}${span}`;
}
