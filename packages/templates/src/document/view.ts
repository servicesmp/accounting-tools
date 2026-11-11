/**
 * Construction de la VUE d'un document, trait pour trait selon la maquette
 * « Document Page » : tout texte imprimé est décidé ici, une seule fois. Les
 * moteurs PDF et HTML ne font que la dessiner.
 */
import {
  DocumentData, DocumentTemplateSettings, DocumentView, DocumentTotals, DocumentTaxLine,
  ViewColumn, ViewRow, ViewParty, ColumnKey, DocumentParty, DocumentAddress, DocumentKind,
} from './types';
import { getDocumentLabels, DOCUMENT_LOCALES } from './i18n';
import { formatMoney, formatAmount, formatPercent, formatQuantity, formatDate, daysBetween } from './format';
import { toIsoCountryCode } from './country';
import { mix } from './color';
import { DEFAULT_DOCUMENT_SETTINGS } from './settings';

// ─── Totaux ──────────────────────────────────────────────────────────────────

/** Total HT d'une ligne (unités mineures) : quantité × prix, remise déduite. */
export function computeLineTotal(line: { quantity: number; unitPrice: number; discountPercent?: number; lineTotal?: number }): number {
  if (typeof line.lineTotal === 'number' && Number.isFinite(line.lineTotal)) return Math.round(line.lineTotal);
  const gross = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
  const discount = Math.min(100, Math.max(0, Number(line.discountPercent) || 0));
  return Math.round(gross * (1 - discount / 100));
}

/** Totaux calculés depuis les lignes : TVA ventilée par taux, arrondie par taux. */
export function computeDocumentTotals(data: Pick<DocumentData, 'lines' | 'vatExemptionReason'>): DocumentTotals {
  const byRate = new Map<number, number>();
  let subtotal = 0;
  for (const line of data.lines) {
    const ht = computeLineTotal(line);
    subtotal += ht;
    const rate = Number(line.vatRate) || 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + ht);
  }
  const taxBreakdown: DocumentTaxLine[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => ({
      rate,
      base,
      amount: Math.round((base * rate) / 100),
      ...(rate === 0 && data.vatExemptionReason ? { exemptionReason: data.vatExemptionReason } : {}),
    }));
  const taxTotal = taxBreakdown.reduce((s, t) => s + t.amount, 0);
  return { subtotal, taxTotal, total: subtotal + taxTotal, taxBreakdown };
}

// ─── Colonnes (largeurs de la maquette, px CSS) ──────────────────────────────

export const COLUMN_SPEC: Record<ColumnKey, { width: number | null; align: 'left' | 'right'; bold: boolean; primary: boolean }> = {
  ref: { width: 58, align: 'left', bold: false, primary: false },
  description: { width: null, align: 'left', bold: true, primary: false },
  quantity: { width: 34, align: 'right', bold: false, primary: false },
  unit: { width: 52, align: 'left', bold: false, primary: false },
  unitPrice: { width: 66, align: 'right', bold: false, primary: false },
  discount: { width: 48, align: 'right', bold: false, primary: false },
  vatRate: { width: 40, align: 'right', bold: false, primary: false },
  lineTotal: { width: 72, align: 'right', bold: true, primary: true },
};

// ─── Aides ───────────────────────────────────────────────────────────────────

function partyView(party: DocumentParty, vatLabel: string, idLabels: { siret: string; siren: string; attention?: string }, withContact = false): ViewParty {
  const a: DocumentAddress = party.address ?? {};
  const cc = toIsoCountryCode(a.country) ?? (a.country ?? '');
  const street = [a.street, a.additionalStreet].filter((x): x is string => !!x && !!x.trim());
  const city = [a.postalCode, a.city].filter(Boolean).join(' ');
  const cityLine = [city, cc].filter(Boolean).join(', ');
  return {
    name: party.name || '—',
    street,
    cityLine,
    oneLine: [...street, city, cc].filter(Boolean).join(', '),
    oneLineNoCountry: [...street, city].filter(Boolean).join(', '),
    city: a.city ?? '',
    vat: party.vatId ? `${vatLabel} ${party.vatId}` : undefined,
    id: party.siret ? `${idLabels.siret} ${party.siret}` : party.siren ? `${idLabels.siren} ${party.siren}` : undefined,
    // Client entreprise : son interlocuteur, s'il diffère de la raison sociale.
    contact: withContact && idLabels.attention && party.contactName?.trim() && party.contactName.trim() !== (party.name || '').trim()
      ? `${idLabels.attention} ${party.contactName.trim()}`
      : undefined,
  };
}

/**
 * Identifiants imprimés pour le client (10/11). Un particulier n'a ni n° de TVA intracommunautaire
 * ni SIRET : ils ne sont repris que pour un client entreprise (raison sociale ou SIRET / SIREN).
 * Un identifiant égal à celui du vendeur est une erreur de saisie (facture INV-20261106-0001 :
 * client particulier portant le n° de TVA du prestataire) : jamais imprimé.
 */
export function buyerIdentity(buyer: DocumentParty, seller: Pick<DocumentParty, 'vatId' | 'siret' | 'siren'>): DocumentParty {
  const norm = (v?: string) => (v ?? '').replace(/[\s.\-]/g, '').toUpperCase();
  const isCompany = isProfessionalParty(buyer);
  const sameAsSeller = (a?: string, b?: string) => !!norm(a) && norm(a) === norm(b);
  return {
    ...buyer,
    vatId: isCompany && !sameAsSeller(buyer.vatId, seller.vatId) ? buyer.vatId : undefined,
    siret: sameAsSeller(buyer.siret, seller.siret) ? undefined : buyer.siret,
    siren: sameAsSeller(buyer.siren, seller.siren) ? undefined : buyer.siren,
  };
}

const HAS_FACTURX: Record<DocumentKind, boolean> = { invoice: true, credit: true, quote: false, order: false };

/** Le document embarque-t-il un XML Factur-X ? (facture et avoir uniquement) */
export function isFacturXDocument(kind: DocumentKind): boolean {
  return HAS_FACTURX[kind];
}

// ─── Vue ─────────────────────────────────────────────────────────────────────

export interface BuildDocumentViewOptions {
  /** Réglage déjà normalisé (normalizeDocumentSettings). */
  readonly settings?: DocumentTemplateSettings;
}

/**
 * Corps du filigrane : 110 px (maquette) pour les mots courts, réduit pour que les
 * mots longs (« REMBOURSÉE », « ÜBERFÄLLIG ») tiennent dans la diagonale de la page.
 * Même valeur pour le HTML et le PDF : les deux rendus restent identiques.
 */
export function watermarkFontSize(text: string): number {
  const len = Math.max(1, [...text].length);
  return Math.max(56, Math.min(110, Math.floor(700 / (len * 0.66))));
}

export function buildDocumentView(data: DocumentData, options: BuildDocumentViewOptions = {}): DocumentView {
  const settings = options.settings ?? DEFAULT_DOCUMENT_SETTINGS;
  const language = settings.language;
  const L = getDocumentLabels(language);
  const locale = DOCUMENT_LOCALES[language];
  const currency = (data.currency || 'EUR').toUpperCase();
  const money = (v: number) => formatMoney(v, currency, locale);
  const amount = (v: number) => formatAmount(v, currency, locale);
  const kind = data.kind;

  if (kind === 'credit' && !data.precedingInvoice?.number) {
    throw new Error("Un avoir doit mentionner la facture d'origine (precedingInvoice).");
  }

  const totals = data.totals ?? computeDocumentTotals(data);
  // Document sans TVA (franchise, exonération) : « HT », « TTC » et lignes de TVA n'ont pas de sens.
  const hasExemption = !!data.vatExemptionReason || totals.taxBreakdown.some((t) => !!t.exemptionReason);
  const vatApplicable = !(hasExemption && totals.taxTotal === 0 && data.lines.every((l) => !(Number(l.vatRate) > 0)));
  const extra = data.extraCharges ?? [];
  const amountDue = totals.total + extra.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  // Colonnes : la remise DOIT figurer si une ligne en porte une (art. 242 nonies A CGI).
  const keys = [...settings.columns];
  if (!keys.includes('discount') && data.lines.some((l) => (Number(l.discountPercent) || 0) > 0)) keys.push('discount');
  if (!vatApplicable) keys.splice(0, keys.length, ...keys.filter((k) => k !== 'vatRate'));
  // Colonne « Unité » sans aucune unité renseignée : en-tête au-dessus de cases vides (10/11).
  if (!data.lines.some((l) => (l.unit ?? '').trim())) keys.splice(0, keys.length, ...keys.filter((k) => k !== 'unit'));
  const ORDER: ColumnKey[] = ['ref', 'description', 'quantity', 'unit', 'unitPrice', 'discount', 'vatRate', 'lineTotal'];
  const columnLabel = (key: ColumnKey): string =>
    !vatApplicable && key === 'unitPrice' ? L.noVat.unitPrice : !vatApplicable && key === 'lineTotal' ? L.noVat.lineTotal : L.columns[key];
  // Sans TVA, « Prix unitaire » est plus long que « PU HT » : la colonne reprend la place de la colonne TVA.
  const columnSpec = (key: ColumnKey) => (!vatApplicable && key === 'unitPrice' ? { ...COLUMN_SPEC.unitPrice, width: (COLUMN_SPEC.unitPrice.width ?? 66) + COLUMN_SPEC.vatRate.width! } : COLUMN_SPEC[key]);
  const columns: ViewColumn[] = ORDER.filter((k) => keys.includes(k)).map((key) => ({ key, label: columnLabel(key), ...columnSpec(key) }));

  // Lignes (regroupées par service quand il y en a plusieurs)
  const rows: ViewRow[] = [];
  const groupTotals = new Map<string, number>();
  // Colonne « Total TTC » : montant de la ligne TVA comprise (11/11, Leonce : un « Total HT » de ligne ne
  // fait que répéter PU HT × quantité). Sans TVA, HT = TTC : la colonne reste « Montant ». Affichage seul :
  // le Factur-X garde les montants HT par ligne (EN 16931, BT-131).
  const lineAmount = (line: DocumentData['lines'][number]) => {
    const ht = computeLineTotal(line);
    return vatApplicable ? Math.round(ht * (1 + (Number(line.vatRate) || 0) / 100)) : ht;
  };
  for (const line of data.lines) if (line.group) groupTotals.set(line.group, (groupTotals.get(line.group) ?? 0) + lineAmount(line));
  const grouped = groupTotals.size > 1;
  let currentGroup: string | undefined;
  for (const line of data.lines) {
    if (grouped && line.group && line.group !== currentGroup) {
      currentGroup = line.group;
      rows.push({ kind: 'group', cells: {}, title: line.group, subtotal: amount(groupTotals.get(line.group) ?? 0) });
    }
    const discount = Number(line.discountPercent) || 0;
    rows.push({
      kind: 'line',
      details: line.details,
      cells: {
        ref: line.ref ?? '',
        description: line.description,
        quantity: formatQuantity(line.quantity, locale),
        unit: line.unit ?? '',
        unitPrice: amount(line.unitPrice),
        discount: discount > 0 ? formatPercent(discount, locale) : '—',
        vatRate: formatPercent(line.vatRate, locale),
        lineTotal: amount(lineAmount(line)),
      },
    });
  }

  // Échéance / validité / livraison
  const due = (kind === 'invoice' || kind === 'credit') && data.dueDate
    ? { label: L.due, value: formatDate(data.dueDate, locale) }
    : kind === 'quote' && data.validUntil
      ? { label: L.valid, value: formatDate(data.validUntil, locale) }
      : kind === 'order' && data.deliveryDate
        ? { label: L.delivery, value: formatDate(data.deliveryDate, locale) }
        : undefined;

  // Bandeau de référence
  let refLine: string | undefined;
  if (kind === 'credit') refLine = L.creditRef(data.precedingInvoice!.number, data.precedingInvoice!.issueDate ? formatDate(data.precedingInvoice!.issueDate, locale) : undefined, data.creditReason);
  if (kind === 'quote') refLine = L.quoteRef(daysBetween(data.issueDate, data.validUntil) ?? undefined, data.validUntil ? formatDate(data.validUntil, locale) : undefined);
  if (kind === 'order') refLine = L.orderRef(data.number, data.buyerReference);

  // Pied légal : identité du vendeur puis mentions obligatoires
  const seller = data.seller;
  // « Atelier Demo, SAS » : la forme juridique n'est pas répétée si la raison
  // sociale la contient déjà (« Atelier Demo SAS »).
  const identity = sellerIdentity(seller);
  const head: string[] = [];
  // SIREN / SIRET du vendeur : mention obligatoire. Repris du RCS s'il y figure, sinon imprimé — avant,
  // un vendeur avec un capital mais sans RCS n'avait aucun identifiant sur sa facture.
  const sellerId = seller.siret ? `${L.siret} ${seller.siret}` : seller.siren ? `${L.siren} ${seller.siren}` : undefined;
  const sirenDigits = (seller.siren || seller.siret || '').replace(/\D/g, '').slice(0, 9);
  const registrationHasSiren = !!sirenDigits && (seller.registration ?? '').replace(/\D/g, '').includes(sirenDigits);
  if (seller.capital) head.push(L.capital(identity, seller.capital));
  if (seller.registration) head.push(seller.registration);
  if (sellerId && !registrationHasSiren) head.push(seller.capital ? sellerId : `${identity}, ${sellerId}`);
  else if (!seller.capital && !seller.registration && identity !== (seller.legalName || seller.name)) head.push(identity);
  // Conditions de règlement (pénalités de retard, indemnité de 40 €, escompte) : obligatoires sur une
  // FACTURE entre professionnels seulement (art. L441-9 et L441-10 C. com.). Ni sur un devis, un bon
  // de commande ou un avoir, ni envers un particulier, à qui l'indemnité de 40 € ne s'applique pas.
  if (kind === 'invoice' && isProfessionalParty(data.buyer)) {
    head.push(L.mentions.latePenalties, L.mentions.recoveryIndemnity);
  }
  const tail: string[] = kind === 'invoice' && isProfessionalParty(data.buyer) ? [L.mentions.noDiscount] : [];
  const exemptions = new Set<string>();
  if (data.vatExemptionReason) exemptions.add(data.vatExemptionReason);
  for (const t of totals.taxBreakdown) if (t.exemptionReason) exemptions.add(t.exemptionReason);
  for (const e of exemptions) tail.push(/[.!?]$/.test(e) ? e : `${e}.`);
  if (data.operationNature) tail.push(L.mentions.nature(L.mentions.natureLabels[data.operationNature]));
  if (data.vatOnDebits && kind !== 'order') tail.push(L.mentions.vatOnDebits);
  if (data.delivery?.address) {
    const d = partyView({ name: data.delivery.name ?? '', address: data.delivery.address }, L.vat, L);
    tail.push(L.mentions.deliveryAddress([data.delivery.name, d.oneLine].filter(Boolean).join(', ')));
  }
  // Mention libre de l'organisation (réglage « footerNote ») en fin de pied légal.
  // Mentions en phrases (10/11) : plus de « · » entre elles.
  const sentence = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
  const legal = [head.map(sentence).join(' '), tail.join(' '), settings.footerNote?.trim()].filter(Boolean).join(' ');

  const payment = kind !== 'order' && settings.showPaymentBlock && data.payment && (data.payment.iban || data.payment.bic || data.payment.link)
    // IBAN par groupes de 4 (« FR76 3000 6000 … »), lisible et recopiable comme sur un RIB.
    ? { iban: data.payment.iban ? data.payment.iban.replace(/\s+/g, '').toUpperCase().replace(/(.{4})(?=.)/g, '$1 ') : undefined, bic: data.payment.bic, terms: data.payment.terms, qrData: data.payment.link || undefined }
    : undefined;

  const status = data.status;
  const watermark = settings.statusWatermark && status ? L.watermark(kind, status) : undefined;
  const primary = settings.colors.primary;
  const accent = settings.colors.accent;

  // Un seul taux de TVA (hors exonération) : le taux est porté par la ligne de total de TVA.
  const taxedRates = [...new Set(totals.taxBreakdown.filter((t) => t.rate > 0).map((t) => t.rate))];
  const singleRate = taxedRates.length === 1 && totals.taxBreakdown.length === 1 ? taxedRates[0] : null;
  return {
    kind,
    language,
    locale,
    settings,
    theme: { primary, accent, accentTint: mix(accent, 0.14) },
    title: L.titles[kind],
    number: data.number,
    labels: {
      number: L.number, issue: L.issue, seller: L.seller, buyer: L.buyer,
      subtotal: L.subtotal, taxTotal: singleRate !== null ? `${L.taxAmount} ${formatPercent(singleRate, locale)}` : L.taxTotal, grandTotal: vatApplicable ? L.grandTotal : L.noVat.grandTotal,
      taxBreakdown: L.taxBreakdown, taxBase: L.taxBase, taxAmount: L.taxAmount,
      paymentTerms: L.paymentTerms, iban: L.iban, bic: L.bic, scanToPay: L.scanToPay,
      poweredBy: L.poweredBy, page: L.page, of: L.of, continuation: L.continuation,
    },
    issueDate: formatDate(data.issueDate, locale),
    due,
    seller: partyView(seller, L.vat, L),
    buyer: partyView(buyerIdentity(data.buyer, seller), L.vat, L, isProfessionalParty(data.buyer)),
    delivery: data.delivery?.address ? partyView({ name: data.delivery.name ?? '', address: data.delivery.address }, L.vat, L) : undefined,
    refLine,
    columns,
    rows,
    vatApplicable,
    // Détail par taux seulement s'il y a PLUSIEURS taux (art. 242 nonies A, ann. II CGI) : avec un seul
    // taux, il répétait mot pour mot les totaux ; le taux figure alors dans la ligne « TVA 20 % ».
    taxes: vatApplicable && settings.showTaxBreakdown && singleRate === null
      ? totals.taxBreakdown.map((t) => ({ rate: formatPercent(t.rate, locale), base: money(t.base), amount: money(t.amount) }))
      : [],
    subtotal: money(totals.subtotal),
    taxTotal: money(totals.taxTotal),
    extraCharges: extra.map((c) => ({ label: c.label, value: money(c.amount) })),
    grandTotal: (kind === 'credit' ? '−' : '') + money(amountDue),
    amountLabel: L.amount[kind],
    payment,
    legal,
    notes: data.notes?.trim() || undefined,
    badge: isFacturXDocument(kind) ? 'Factur-X EN 16931' : undefined,
    poweredBy: settings.showPoweredBy,
    watermark,
    watermarkSize: watermark ? watermarkFontSize(watermark) : undefined,
    statusLabel: status ? L.status[status] : undefined,
    totalsRaw: { ...totals, amountDue },
  };
}

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Client entreprise : raison sociale, SIRET ou SIREN connus — même définition pour les mentions de
 * règlement et pour les identifiants imprimés (`buyerIdentity`). Sans aucun d'eux : un particulier.
 */
export function isProfessionalParty(party: Pick<DocumentParty, 'siren' | 'siret' | 'legalName'> | undefined): boolean {
  if (!party) return false;
  return [party.siren, party.siret, party.legalName].some((v) => typeof v === 'string' && v.replace(/[\s.\-]/g, '').length > 0);
}

/** Raison sociale suivie de la forme juridique si elle n'y figure pas déjà. */
export function sellerIdentity(seller: Pick<DocumentParty, 'name' | 'legalName' | 'legalForm'>): string {
  const legalName = seller.legalName || seller.name;
  const form = seller.legalForm?.trim();
  if (!form) return legalName;
  const already = new RegExp(`(^|[\\s,(])${escapeRegExp(form)}($|[\\s,).])`, 'i').test(legalName);
  return already ? legalName : `${legalName}, ${form}`;
}

/**
 * Mentions légales complémentaires du vendeur pour le Factur-X (BT-33) :
 * forme juridique, capital, immatriculation. `undefined` si aucune.
 */
export function sellerLegalInformation(seller: Pick<DocumentParty, 'legalForm' | 'capital' | 'registration'>): string | undefined {
  const parts = [
    seller.legalForm?.trim() && seller.capital ? `${seller.legalForm.trim()} au capital de ${seller.capital}` : seller.legalForm?.trim() || (seller.capital ? `Capital ${seller.capital}` : undefined),
    seller.registration?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}
