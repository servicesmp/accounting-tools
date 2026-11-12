"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FR_FRANCHISE_MENTION = exports.FR_MANDATORY_NOTES = void 0;
exports.buildFacturXInvoice = buildFacturXInvoice;
/**
 * Données d'un document → facture Factur-X (XML CII EN 16931).
 *
 * C'est ici — et seulement ici — que se fait la conversion vers le modèle de la
 * librairie cœur : unités mineures → unités majeures, pourcentages → fractions,
 * pays → codes ISO, notes françaises obligatoires (BR-FR-05), identifiants
 * (SIREN BT-30, adresses électroniques BT-34/BT-49), avoir (BT-25).
 */
const core_1 = require("../../../core/src");
const country_1 = require("../document/country");
const format_1 = require("../document/format");
const view_1 = require("../document/view");
/** Notes obligatoires françaises portées dans le XML (BR-FR-05). */
exports.FR_MANDATORY_NOTES = [
    { subjectCode: 'PMD', content: "En cas de retard de paiement, des pénalités de retard sont exigibles dès le premier jour suivant la date d'échéance, au taux de 3 fois le taux d'intérêt légal en vigueur (art. L.441-10 C.com)." },
    { subjectCode: 'PMT', content: 'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 € (art. D.441-5 C.com).' },
    { subjectCode: 'AAB', content: "Pas d'escompte accordé pour paiement anticipé." },
];
const records_1 = require("../document/records");
Object.defineProperty(exports, "FR_FRANCHISE_MENTION", { enumerable: true, get: function () { return records_1.FR_FRANCHISE_MENTION; } });
function siren(p) {
    const digits = (p.siren || p.siret || '').replace(/\D/g, '');
    return digits.length >= 9 ? digits.slice(0, 9) : undefined;
}
function vatId(raw, warnings, who) {
    if (!raw)
        return undefined;
    const v = raw.replace(/\s+/g, '').toUpperCase();
    if (v.length < 4)
        return undefined;
    if (!/^[A-Z]{2}/.test(v)) {
        warnings.push(`N° de TVA ${who} sans préfixe pays : « FR » ajouté (BR-CO-09).`);
        return `FR${v}`;
    }
    return v;
}
function address(a, fallbackCountry, warnings, who) {
    const iso = (0, country_1.toIsoCountryCode)(a?.country);
    if (a?.country && !iso)
        warnings.push(`Pays ${who} « ${a.country} » inconnu : ${fallbackCountry} utilisé.`);
    const country = iso ?? fallbackCountry;
    // Ville et code postal sont exigés par le modèle : on n'invente pas d'adresse
    // (« N/A », « 00000 ») — une adresse incomplète est signalée à l'appelant.
    const city = a?.city?.trim() || '';
    const postal = a?.postalCode?.trim() || '';
    if (!city || !postal)
        warnings.push(`Adresse ${who} incomplète (ville ou code postal manquant).`);
    return new core_1.PostalAddressImpl(city || '-', postal || '-', country, (0, view_1.streetWithoutLocality)(a?.street, a?.postalCode, a?.city), a?.additionalStreet?.trim() || undefined);
}
function means(data, warnings) {
    // BR-50 / BR-61 : un virement ou un prélèvement exige le compte (IBAN) ; sans lui, la facture
    // se règle par le lien de paiement en ligne — carte.
    if ((data.payment?.means === 'transfer' || data.payment?.means === 'direct_debit') && !data.payment?.iban) {
        warnings.push('Virement ou prélèvement sans IBAN : moyen de paiement déclaré « carte » (BR-50).');
        return core_1.PaymentMeansCode.BANK_CARD;
    }
    switch (data.payment?.means) {
        case 'transfer': return core_1.PaymentMeansCode.SEPA_CREDIT_TRANSFER;
        case 'direct_debit': return core_1.PaymentMeansCode.SEPA_DIRECT_DEBIT;
        case 'cash': return core_1.PaymentMeansCode.CASH;
        case 'cheque': return core_1.PaymentMeansCode.CHEQUE;
        case 'card': return core_1.PaymentMeansCode.BANK_CARD;
        case 'clearing': return core_1.PaymentMeansCode.CLEARING_BETWEEN_PARTNERS;
        default: return data.payment?.iban ? core_1.PaymentMeansCode.SEPA_CREDIT_TRANSFER : core_1.PaymentMeansCode.BANK_CARD;
    }
}
/**
 * Construit la facture Factur-X d'une facture ou d'un avoir. Lève pour un devis
 * ou un bon de commande : ils n'ont pas de représentation Factur-X.
 */
function buildFacturXInvoice(data, options = {}) {
    if (data.kind !== 'invoice' && data.kind !== 'credit') {
        throw new Error(`Un document « ${data.kind} » n'a pas de représentation Factur-X.`);
    }
    const warnings = [];
    const fallbackCountry = (0, country_1.toIsoCountryCode)(options.defaultCountry) ?? 'FR';
    const decimals = (0, format_1.currencyDecimals)(data.currency);
    const toMajor = (minor) => Math.round(Number(minor) || 0) / Math.pow(10, decimals);
    const toMinor = (major) => Math.round((Number(major) || 0) * Math.pow(10, decimals));
    const sellerSiren = siren(data.seller);
    const sellerParty = new core_1.TradePartyImpl(data.seller.legalName || data.seller.name, address(data.seller.address, fallbackCountry, warnings, 'du vendeur'), data.seller.legalName && data.seller.legalName !== data.seller.name ? data.seller.name : undefined, vatId(data.seller.vatId, warnings, 'du vendeur'), undefined, sellerSiren, sellerSiren ? '0002' : undefined, data.seller.email, data.seller.phone, undefined, data.seller.email, data.seller.email ? 'EM' : undefined, 
    // BT-33 : forme juridique, capital, immatriculation (profils EN16931 / EXTENDED).
    (0, view_1.sellerLegalInformation)(data.seller));
    const buyerSiren = siren(data.buyer);
    const buyerParty = new core_1.TradePartyImpl(data.buyer.legalName || data.buyer.name || 'Client', address(data.buyer.address, fallbackCountry, warnings, 'du client'), undefined, vatId(data.buyer.vatId, warnings, 'du client'), undefined, buyerSiren, buyerSiren ? '0002' : undefined, data.buyer.email, data.buyer.phone, undefined, data.buyer.email, data.buyer.email ? 'EM' : undefined);
    const issueDate = (0, format_1.toDate)(data.issueDate) ?? new Date();
    let dueDate = (0, format_1.toDate)(data.dueDate) ?? new Date(issueDate.getTime() + 30 * 86400000);
    if (dueDate < issueDate) {
        warnings.push("Échéance antérieure à l'émission : fixée à émission + 30 jours (BR-FR-CO-07).");
        dueDate = new Date(issueDate.getTime() + 30 * 86400000);
    }
    const hb = core_1.DocumentHeaderImpl.builder()
        .id(data.number)
        .invoiceNumber(data.number)
        .name(data.kind === 'credit' ? 'AVOIR' : 'FACTURE')
        .invoiceDate(issueDate)
        .typeCode(data.kind === 'credit' ? core_1.DocTypeCode.CREDIT_NOTE : core_1.DocTypeCode.INVOICE)
        .dueDate(dueDate);
    for (const n of exports.FR_MANDATORY_NOTES)
        hb.addNoteWithCode(n.content, n.subjectCode);
    if (data.notes?.trim())
        hb.addNote(data.notes.trim());
    // BT-23 (BR-FR-08) : cadre de facturation obligatoire. Nature : services par défaut. Cadre : 2
    // (facture déjà payée) pour une facture réglée, sinon 1 (dépôt d'une facture à payer).
    {
        const nature = { goods: core_1.OperationNature.GOODS, services: core_1.OperationNature.SERVICES, mixed: core_1.OperationNature.MIXED }[data.operationNature ?? 'services'];
        const fullyPaid = data.status === 'paid';
        hb.businessProcessType((0, core_1.buildBusinessProcessType)(nature, fullyPaid ? 2 : 1));
    }
    if (data.vatOnDebits)
        hb.vatDueDateTypeCode(core_1.VatDueDateTypeCode.INVOICE_DATE);
    if (data.delivery?.address) {
        hb.deliveryParty({ name: data.delivery.name, address: address(data.delivery.address, fallbackCountry, warnings, 'de livraison') });
    }
    const deliveryDate = (0, format_1.toDate)(data.deliveryDate);
    if (deliveryDate)
        hb.deliveryDate(deliveryDate);
    const periodStart = (0, format_1.toDate)(data.billingPeriod?.start);
    const periodEnd = (0, format_1.toDate)(data.billingPeriod?.end);
    if (periodStart && periodEnd && periodEnd >= periodStart)
        hb.billingPeriod(periodStart, periodEnd);
    else if (data.billingPeriod)
        warnings.push('Période facturée incomplète ou inversée : non portée dans le XML (BG-14).');
    if (data.precedingInvoice?.number) {
        hb.precedingInvoice(data.precedingInvoice.number, (0, format_1.toDate)(data.precedingInvoice.issueDate) ?? undefined);
    }
    const meansCode = means(data, warnings);
    const payment = new core_1.PaymentDetailsImpl(meansCode, data.payment?.iban?.replace(/\s+/g, '') || undefined, data.payment?.bic || undefined, 
    // Identifiant de compte (BT-84) : l'IBAN seul, jamais le numéro de facture déguisé en compte.
    undefined, dueDate, data.payment?.terms || 'Paiement à réception');
    const invoice = new core_1.FacturXInvoice(options.profile ?? core_1.FacturxProfile.EN16931, hb.build(), sellerParty, buyerParty, payment, [], [], data.currency.toUpperCase());
    const lineTotals = [];
    data.lines.forEach((line, i) => {
        const rate = Number(line.vatRate) || 0;
        const ht = (0, view_1.computeLineTotal)(line);
        lineTotals.push(ht);
        const qty = Number(line.quantity) || 1;
        // Prix net unitaire (BT-146) : remise incluse, pour que qté × prix = total HT.
        const net = toMajor(ht) / qty;
        const exempt = rate === 0;
        invoice.addLine(new core_1.InvoiceLineImpl(String(i + 1), [line.description, line.details].filter(Boolean).join(' — ').slice(0, 500) || `Article ${i + 1}`, qty, Math.round(net * 1e6) / 1e6, rate / 100, exempt ? 'E' : 'S', 'C62', undefined, undefined, undefined, line.ref, undefined, exempt ? (data.vatExemptionReason || records_1.FR_FRANCHISE_MENTION) : undefined, exempt ? 'VATEX-FR-FRANCHISE' : undefined));
    });
    // BG-20 : remises au niveau du document, au taux de TVA des lignes qu'elles réduisent (BR-S-08).
    for (const a of data.allowances ?? []) {
        const amount = Math.round(Number(a.amount) || 0);
        if (amount <= 0)
            continue;
        const rate = Number(a.vatRate) || 0;
        invoice.addDocAllowanceCharge(new core_1.AllowanceChargeImpl(false, toMajor(amount), a.reason.slice(0, 200), '95', rate / 100, rate === 0 ? 'E' : 'S'));
    }
    // BT-113 : facture réglée à l'émission → reste à payer (BT-115) diminué d'autant.
    if (data.paidAmount && data.paidAmount > 0)
        invoice.setPrepaidAmount(toMajor(data.paidAmount));
    const s = invoice.finalizeTotals();
    const totals = {
        subtotal: toMinor(s.lineTotal),
        taxTotal: toMinor(s.taxTotal),
        total: toMinor(s.grandTotal),
        ...(s.allowanceTotal ? { allowanceTotal: toMinor(s.allowanceTotal) } : {}),
        ...(s.paidAmount ? { paidAmount: toMinor(s.paidAmount) } : {}),
        taxBreakdown: s.taxSummaries.map((t) => ({
            rate: Math.round(Number(t.rate) * 100) / 100, // TaxCalculator renvoie déjà un pourcentage
            base: toMinor(t.taxable),
            amount: toMinor(t.taxAmount),
            ...(t.exemptionReason ? { exemptionReason: t.exemptionReason } : {}),
        })),
    };
    return { invoice, totals, lineTotals, warnings };
}
//# sourceMappingURL=facturx.js.map