"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLUMN_SPEC = void 0;
exports.computeLineTotal = computeLineTotal;
exports.computeDocumentTotals = computeDocumentTotals;
exports.isFacturXDocument = isFacturXDocument;
exports.watermarkFontSize = watermarkFontSize;
exports.buildDocumentView = buildDocumentView;
const i18n_1 = require("./i18n");
const format_1 = require("./format");
const country_1 = require("./country");
const color_1 = require("./color");
const settings_1 = require("./settings");
// ─── Totaux ──────────────────────────────────────────────────────────────────
/** Total HT d'une ligne (unités mineures) : quantité × prix, remise déduite. */
function computeLineTotal(line) {
    if (typeof line.lineTotal === 'number' && Number.isFinite(line.lineTotal))
        return Math.round(line.lineTotal);
    const gross = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
    const discount = Math.min(100, Math.max(0, Number(line.discountPercent) || 0));
    return Math.round(gross * (1 - discount / 100));
}
/** Totaux calculés depuis les lignes : TVA ventilée par taux, arrondie par taux. */
function computeDocumentTotals(data) {
    const byRate = new Map();
    let subtotal = 0;
    for (const line of data.lines) {
        const ht = computeLineTotal(line);
        subtotal += ht;
        const rate = Number(line.vatRate) || 0;
        byRate.set(rate, (byRate.get(rate) ?? 0) + ht);
    }
    const taxBreakdown = [...byRate.entries()]
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
exports.COLUMN_SPEC = {
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
function partyView(party, vatLabel, idLabels) {
    const a = party.address ?? {};
    const cc = (0, country_1.toIsoCountryCode)(a.country) ?? (a.country ?? '');
    const street = [a.street, a.additionalStreet].filter((x) => !!x && !!x.trim());
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
    };
}
const HAS_FACTURX = { invoice: true, credit: true, quote: false, order: false };
/** Le document embarque-t-il un XML Factur-X ? (facture et avoir uniquement) */
function isFacturXDocument(kind) {
    return HAS_FACTURX[kind];
}
/**
 * Corps du filigrane : 110 px (maquette) pour les mots courts, réduit pour que les
 * mots longs (« REMBOURSÉE », « ÜBERFÄLLIG ») tiennent dans la diagonale de la page.
 * Même valeur pour le HTML et le PDF : les deux rendus restent identiques.
 */
function watermarkFontSize(text) {
    const len = Math.max(1, [...text].length);
    return Math.max(56, Math.min(110, Math.floor(700 / (len * 0.66))));
}
function buildDocumentView(data, options = {}) {
    const settings = options.settings ?? settings_1.DEFAULT_DOCUMENT_SETTINGS;
    const language = settings.language;
    const L = (0, i18n_1.getDocumentLabels)(language);
    const locale = i18n_1.DOCUMENT_LOCALES[language];
    const currency = (data.currency || 'EUR').toUpperCase();
    const money = (v) => (0, format_1.formatMoney)(v, currency, locale);
    const amount = (v) => (0, format_1.formatAmount)(v, currency, locale);
    const kind = data.kind;
    if (kind === 'credit' && !data.precedingInvoice?.number) {
        throw new Error("Un avoir doit mentionner la facture d'origine (precedingInvoice).");
    }
    const totals = data.totals ?? computeDocumentTotals(data);
    const extra = data.extraCharges ?? [];
    const amountDue = totals.total + extra.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    // Colonnes : la remise DOIT figurer si une ligne en porte une (art. 242 nonies A CGI).
    const keys = [...settings.columns];
    if (!keys.includes('discount') && data.lines.some((l) => (Number(l.discountPercent) || 0) > 0))
        keys.push('discount');
    const ORDER = ['ref', 'description', 'quantity', 'unit', 'unitPrice', 'discount', 'vatRate', 'lineTotal'];
    const columns = ORDER.filter((k) => keys.includes(k)).map((key) => ({ key, label: L.columns[key], ...exports.COLUMN_SPEC[key] }));
    // Lignes (regroupées par service quand il y en a plusieurs)
    const rows = [];
    const groupTotals = new Map();
    for (const line of data.lines)
        if (line.group)
            groupTotals.set(line.group, (groupTotals.get(line.group) ?? 0) + computeLineTotal(line));
    const grouped = groupTotals.size > 1;
    let currentGroup;
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
                quantity: (0, format_1.formatQuantity)(line.quantity, locale),
                unit: line.unit ?? '',
                unitPrice: amount(line.unitPrice),
                discount: discount > 0 ? (0, format_1.formatPercent)(discount, locale) : '—',
                vatRate: (0, format_1.formatPercent)(line.vatRate, locale),
                lineTotal: amount(computeLineTotal(line)),
            },
        });
    }
    // Échéance / validité / livraison
    const due = (kind === 'invoice' || kind === 'credit') && data.dueDate
        ? { label: L.due, value: (0, format_1.formatDate)(data.dueDate, locale) }
        : kind === 'quote' && data.validUntil
            ? { label: L.valid, value: (0, format_1.formatDate)(data.validUntil, locale) }
            : kind === 'order' && data.deliveryDate
                ? { label: L.delivery, value: (0, format_1.formatDate)(data.deliveryDate, locale) }
                : undefined;
    // Bandeau de référence
    let refLine;
    if (kind === 'credit')
        refLine = L.creditRef(data.precedingInvoice.number, data.precedingInvoice.issueDate ? (0, format_1.formatDate)(data.precedingInvoice.issueDate, locale) : undefined, data.creditReason);
    if (kind === 'quote')
        refLine = L.quoteRef((0, format_1.daysBetween)(data.issueDate, data.validUntil) ?? undefined, data.validUntil ? (0, format_1.formatDate)(data.validUntil, locale) : undefined);
    if (kind === 'order')
        refLine = L.orderRef(data.number, data.buyerReference);
    // Pied légal : identité du vendeur puis mentions obligatoires
    const seller = data.seller;
    const legalName = seller.legalName || seller.name;
    const head = [];
    if (seller.capital)
        head.push(L.capital(legalName, seller.capital));
    if (seller.registration)
        head.push(seller.registration);
    else if (!seller.capital && seller.siret)
        head.push(`${legalName} · ${L.siret} ${seller.siret}`);
    // Conditions de règlement : sur tous les documents, comme dans la maquette
    // (obligatoires sur facture et avoir, informatives sur devis et commande).
    head.push(L.mentions.latePenalties, L.mentions.recoveryIndemnity);
    const tail = [L.mentions.noDiscount];
    const exemptions = new Set();
    if (data.vatExemptionReason)
        exemptions.add(data.vatExemptionReason);
    for (const t of totals.taxBreakdown)
        if (t.exemptionReason)
            exemptions.add(t.exemptionReason);
    for (const e of exemptions)
        tail.push(/[.!?]$/.test(e) ? e : `${e}.`);
    if (data.operationNature)
        tail.push(L.mentions.nature(L.mentions.natureLabels[data.operationNature]));
    if (data.vatOnDebits && kind !== 'order')
        tail.push(L.mentions.vatOnDebits);
    if (data.delivery?.address) {
        const d = partyView({ name: data.delivery.name ?? '', address: data.delivery.address }, L.vat, L);
        tail.push(L.mentions.deliveryAddress([data.delivery.name, d.oneLine].filter(Boolean).join(', ')));
    }
    // Mention libre de l'organisation (réglage « footerNote ») en fin de pied légal.
    const legal = [head.join(' · '), tail.join(' '), settings.footerNote?.trim()].filter(Boolean).join(' ');
    const payment = kind !== 'order' && settings.showPaymentBlock && data.payment && (data.payment.iban || data.payment.bic || data.payment.link)
        ? { iban: data.payment.iban, bic: data.payment.bic, terms: data.payment.terms, qrData: data.payment.link || undefined }
        : undefined;
    const status = data.status;
    const watermark = settings.statusWatermark && status ? L.watermark(kind, status) : undefined;
    const primary = settings.colors.primary;
    const accent = settings.colors.accent;
    return {
        kind,
        language,
        locale,
        settings,
        theme: { primary, accent, accentTint: (0, color_1.mix)(accent, 0.14) },
        title: L.titles[kind],
        number: data.number,
        labels: {
            number: L.number, issue: L.issue, seller: L.seller, buyer: L.buyer,
            subtotal: L.subtotal, taxTotal: L.taxTotal, grandTotal: L.grandTotal,
            taxBreakdown: L.taxBreakdown, taxBase: L.taxBase, taxAmount: L.taxAmount,
            paymentTerms: L.paymentTerms, iban: L.iban, bic: L.bic, scanToPay: L.scanToPay,
            poweredBy: L.poweredBy, page: L.page, of: L.of, continuation: L.continuation,
        },
        issueDate: (0, format_1.formatDate)(data.issueDate, locale),
        due,
        seller: partyView(seller, L.vat, L),
        buyer: partyView(data.buyer, L.vat, L),
        delivery: data.delivery?.address ? partyView({ name: data.delivery.name ?? '', address: data.delivery.address }, L.vat, L) : undefined,
        refLine,
        columns,
        rows,
        taxes: settings.showTaxBreakdown
            ? totals.taxBreakdown.map((t) => ({ rate: (0, format_1.formatPercent)(t.rate, locale), base: money(t.base), amount: money(t.amount) }))
            : [],
        subtotal: money(totals.subtotal),
        taxTotal: money(totals.taxTotal),
        extraCharges: extra.map((c) => ({ label: c.label, value: money(c.amount) })),
        grandTotal: (kind === 'credit' ? '−' : '') + money(amountDue),
        amountLabel: L.amount[kind],
        payment,
        legal,
        notes: data.notes?.trim() || undefined,
        badge: isFacturXDocument(kind) ? 'Factur-X · EN 16931' : undefined,
        poweredBy: settings.showPoweredBy,
        watermark,
        watermarkSize: watermark ? watermarkFontSize(watermark) : undefined,
        statusLabel: status ? L.status[status] : undefined,
        totalsRaw: { ...totals, amountDue },
    };
}
//# sourceMappingURL=view.js.map