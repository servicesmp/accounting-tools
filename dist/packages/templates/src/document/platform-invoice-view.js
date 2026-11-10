"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_ALERT_COLOR = void 0;
exports.formatSiret = formatSiret;
exports.formatVatNumber = formatVatNumber;
exports.currencyDisplayName = currencyDisplayName;
exports.platformDiscountRate = platformDiscountRate;
exports.computePlatformTotals = computePlatformTotals;
exports.platformInvoiceToDocumentData = platformInvoiceToDocumentData;
exports.buildPlatformInvoiceView = buildPlatformInvoiceView;
exports.platformSubscriptionLineLabel = platformSubscriptionLineLabel;
const format_1 = require("./format");
const country_1 = require("./country");
const view_1 = require("./view");
const LOCALE = 'fr-FR';
/** Statut refusé (maquette). */
exports.PLATFORM_ALERT_COLOR = '#C1123C';
const PLAN_INTERVAL = { monthly: 'mensuel', annual: 'annuel' };
const PLAN_BILLING = { monthly: 'facturation mensuelle', annual: 'facturation annuelle' };
// ─── Mise en forme des identifiants ──────────────────────────────────────────
/** « 92910142600013 » → « 929 101 426 00013 » ; SIREN « 929101426 » → « 929 101 426 ». */
function formatSiret(value) {
    const d = (value ?? '').replace(/\D/g, '');
    if (d.length === 14)
        return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
    if (d.length === 9)
        return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return value || undefined;
}
/** « FR75929101426 » → « FR75 929 101 426 » (TVA française) ; autres pays inchangés. */
function formatVatNumber(value) {
    const v = (value ?? '').replace(/\s/g, '').toUpperCase();
    if (!v)
        return undefined;
    const fr = /^FR([0-9A-Z]{2})(\d{9})$/.exec(v);
    return fr ? `FR${fr[1]} ${fr[2].slice(0, 3)} ${fr[2].slice(3, 6)} ${fr[2].slice(6)}` : v;
}
/** Nom de la devise : « Euro », « Dollar des États-Unis ». */
function currencyDisplayName(currency) {
    const code = (currency || 'EUR').toUpperCase();
    try {
        const DisplayNames = Intl.DisplayNames;
        const name = DisplayNames && new DisplayNames(['fr'], { type: 'currency' }).of(code);
        return name ? name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1) : code;
    }
    catch {
        return code;
    }
}
function addressParts(p) {
    const a = p.address ?? {};
    const street = [a.street, a.additionalStreet].filter(Boolean).join(', ') || undefined;
    const country = a.country ? (0, country_1.countryDisplayName)(a.country, 'fr') : undefined;
    const cityLine = [[a.postalCode, a.city].filter(Boolean).join(' '), country].filter(Boolean).join(', ') || undefined;
    return { street, city: cityLine };
}
/** « SAS au capital de 1 000 € » ; forme ou capital seul si l'autre manque. */
function legalLine(p) {
    if (p.legalForm && p.capital)
        return `${p.legalForm} au capital de ${p.capital}`;
    if (p.capital)
        return `Société au capital de ${p.capital}`;
    return p.legalForm || undefined;
}
function idLines(p) {
    const out = [];
    const siret = formatSiret(p.siret);
    const siren = formatSiret(p.siren);
    if (siret)
        out.push(`SIRET ${siret}`);
    else if (siren)
        out.push(`SIREN ${siren}`);
    const vat = formatVatNumber(p.vatId);
    if (vat)
        out.push(`TVA intracommunautaire ${vat}`);
    return out;
}
// ─── Totaux ──────────────────────────────────────────────────────────────────
/** Taux de la remise de document : celui de la première ligne (une seule base imposable en pratique). */
function platformDiscountRate(data) {
    return Number(data.lines[0]?.vatRate) || 0;
}
/** Totaux calculés (HT des lignes, remise, base, TVA par taux arrondie par taux, TTC). */
function computePlatformTotals(data) {
    const byRate = new Map();
    let subtotal = 0;
    for (const l of data.lines) {
        const ht = (0, view_1.computeLineTotal)(l);
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
function infoAsText(view) {
    return `${view.info.title} : ${view.info.rows.map((r) => `${r.label} ${r.value}`).join(' ; ')}.`;
}
/**
 * `DocumentData` du XML : lignes, remise (BG-20), période (BG-14), moyen de paiement (carte,
 * compensation sur le wallet), et en notes (BT-22) le bloc d'information, les mentions sous le
 * tableau et les conditions du pied — tout ce que le PDF imprime.
 */
function platformInvoiceToDocumentData(data, view = buildPlatformInvoiceView(data)) {
    const issue = (0, format_1.toDate)(data.issueDate) ?? new Date();
    const due = (0, format_1.toDate)(data.dueDate) ?? issue;
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
function buildPlatformInvoiceView(data, options = {}) {
    const cur = (data.currency || 'EUR').toUpperCase();
    const money = (n) => (0, format_1.formatMoney)(n, cur, LOCALE);
    const date = (d) => (0, format_1.formatDate)(d, LOCALE);
    const subscription = data.kind === 'subscription';
    const totals = options.totals ?? computePlatformTotals(data);
    const discount = totals.allowanceTotal ?? Math.max(0, Math.round(Number(data.discount?.amount) || 0));
    const taxBasis = totals.subtotal - discount;
    const paid = data.state === 'paid' ? totals.total : 0;
    const due = totals.total - paid;
    const issue = (0, format_1.toDate)(data.issueDate) ?? new Date();
    const dueDate = (0, format_1.toDate)(data.dueDate) ?? issue;
    const paidAt = (0, format_1.toDate)(data.paidAt) ?? (data.state === 'paid' ? issue : null);
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
    const meta = [{ label: 'Date d’émission', value: date(issue) }];
    if (data.period)
        meta.push({ label: 'Période facturée', value: `${date(data.period.start)} au ${date(data.period.end)}` });
    meta.push({ label: 'Échéance', value: date(dueDate < issue ? issue : dueDate) });
    if (!subscription && paidAt)
        meta.push({ label: 'Date de règlement', value: date(paidAt) });
    meta.push({ label: 'Devise', value: currencyDisplayName(cur) });
    // Client
    const b = data.buyer;
    const bAddr = addressParts(b);
    const buyerLines = subscription
        ? [bAddr.street, bAddr.city, b.email]
        : [legalLine(b), [bAddr.street, bAddr.city].filter(Boolean).join(', '), ...idLines(b), b.email];
    const buyer = { name: b.legalName && !subscription ? b.legalName : b.name, lines: buyerLines.filter((l) => !!l) };
    // Statut
    const statusRow = () => {
        switch (data.state) {
            case 'paid': return { label: 'Statut', value: paidAt ? `Réglée le ${date(paidAt)}` : 'Réglée', strong: true };
            case 'payment_failed': return { label: 'Statut', value: 'Prélèvement refusé', strong: true, color: exports.PLATFORM_ALERT_COLOR };
            case 'refunded': return { label: 'Statut', value: 'Remboursée', strong: true };
            case 'cancelled': return { label: 'Statut', value: 'Annulée', strong: true };
            default: return { label: 'Statut', value: `À régler avant le ${date(dueDate)}`, strong: true };
        }
    };
    // Bloc d'information
    const op = data.operation ?? {};
    const sub = data.subscription;
    const rate = op.commissionRate !== undefined ? (0, format_1.formatPercent)(op.commissionRate, LOCALE) : undefined;
    const info = subscription
        ? {
            title: 'Abonnement',
            rows: [
                ...(sub ? [{ label: 'Formule', value: `Plan ${sub.planName}, ${PLAN_BILLING[sub.interval]}${sub.planChange ? ' (changement de plan)' : ''}` }] : []),
                ...(sub?.account ?? b.email ? [{ label: 'Compte', value: (sub?.account ?? b.email) }] : []),
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
        quantity: (0, format_1.formatQuantity)(l.quantity, LOCALE),
        unitPrice: money(l.unitPrice),
        vat: (0, format_1.formatPercent)(Number(l.vatRate) || 0, LOCALE),
        total: money((0, view_1.computeLineTotal)(l)),
    }));
    // Mentions sous le tableau
    const notes = [];
    if (discount > 0)
        notes.push(`Remise appliquée : ${money(discount)} HT, prix avant remise ${money(totals.subtotal)} HT.`);
    if (!subscription && rate && op.collectedAmount !== undefined) {
        const by = op.clientName ? ` réglés par ${op.clientName}` : ' encaissés';
        const when = op.collectedAt ? ` le ${date(op.collectedAt)}` : '';
        notes.push(`Commission de ${rate} du montant hors taxes encaissé, soit ${money(op.collectedAmount)} HT${by}${when}.`);
    }
    if (!subscription && data.lines.length > 1)
        notes.push('Les frais de paiement par carte de l’encaissement sont refacturés avec la commission, au même taux de TVA.');
    for (const n of data.notes ?? [])
        if (n && n.trim())
            notes.push(n.trim());
    // Totaux
    const taxRows = totals.taxBreakdown.length
        ? totals.taxBreakdown.map((t) => ({ label: `TVA ${(0, format_1.formatPercent)(t.rate, LOCALE)}`, value: money(t.amount), strong: true }))
        : [{ label: 'TVA', value: money(totals.taxTotal), strong: true }];
    const totalRows = discount > 0
        ? [
            { label: 'Sous-total HT', value: money(totals.subtotal) },
            { label: 'Remise', value: `− ${money(discount)}` },
            { label: 'Total HT', value: money(taxBasis), strong: true, ruleTop: true },
            ...taxRows,
        ]
        : [{ label: 'Total HT', value: money(taxBasis), strong: true }, ...taxRows];
    // Prélèvement refusé
    let alert;
    if (data.state === 'payment_failed') {
        const failed = sub?.failedAt ? ` du ${date(sub.failedAt)}` : '';
        alert = sub?.nextAttemptAt
            ? `Le prélèvement${failed} a été refusé. Une nouvelle tentative sera effectuée le ${date(sub.nextAttemptAt)}. Mettez votre moyen de paiement à jour pour éviter la suspension du plan.`
            : `Le prélèvement${failed} a été refusé. Mettez votre moyen de paiement à jour pour régler cette facture et éviter la suspension du plan.`;
    }
    // Pied
    const rates = [...new Set(data.lines.map((l) => Number(l.vatRate) || 0))].map((r) => (0, format_1.formatPercent)(r, LOCALE));
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
function platformSubscriptionLineLabel(planName, interval, period, planChange = false) {
    const start = period?.start ? (0, format_1.formatDate)(period.start, LOCALE) : '';
    const end = period?.end ? (0, format_1.formatDate)(period.end, LOCALE) : '';
    const span = start && end ? ` du ${start} au ${end}` : start ? ` à partir du ${start}` : '';
    return `Plan ${planName}, abonnement ${PLAN_INTERVAL[interval]}${planChange ? ' (changement de plan)' : ''}${span}`;
}
//# sourceMappingURL=platform-invoice-view.js.map