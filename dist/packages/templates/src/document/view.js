"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLUMN_SPEC = void 0;
exports.computeLineTotal = computeLineTotal;
exports.computeDocumentTotals = computeDocumentTotals;
exports.buyerIdentity = buyerIdentity;
exports.isFacturXDocument = isFacturXDocument;
exports.watermarkFontSize = watermarkFontSize;
exports.buildDocumentView = buildDocumentView;
exports.sellerDisplayParty = sellerDisplayParty;
exports.streetWithoutLocality = streetWithoutLocality;
exports.isProfessionalParty = isProfessionalParty;
exports.isIndividualEnterprise = isIndividualEnterprise;
exports.meaningfulCapital = meaningfulCapital;
exports.sellerIdentity = sellerIdentity;
exports.sellerLegalInformation = sellerLegalInformation;
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
function partyView(party, vatLabel, idLabels, withContact = false) {
    const a = party.address ?? {};
    const cc = (0, country_1.toIsoCountryCode)(a.country) ?? (a.country ?? '');
    const street = [streetWithoutLocality(a.street, a.postalCode, a.city), a.additionalStreet].filter((x) => !!x && !!x.trim());
    const city = [a.postalCode, a.city].filter(Boolean).join(' ');
    const cityLine = [city, cc].filter(Boolean).join(', ');
    return {
        name: party.name || '—',
        ...(party.tradeName ? { tradeName: party.tradeName } : {}),
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
function buyerIdentity(buyer, seller) {
    const norm = (v) => (v ?? '').replace(/[\s.\-]/g, '').toUpperCase();
    const isCompany = isProfessionalParty(buyer);
    const sameAsSeller = (a, b) => !!norm(a) && norm(a) === norm(b);
    return {
        ...buyer,
        vatId: isCompany && !sameAsSeller(buyer.vatId, seller.vatId) ? buyer.vatId : undefined,
        siret: sameAsSeller(buyer.siret, seller.siret) ? undefined : buyer.siret,
        siren: sameAsSeller(buyer.siren, seller.siren) ? undefined : buyer.siren,
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
    // Document sans TVA (franchise, exonération) : « HT », « TTC » et lignes de TVA n'ont pas de sens.
    const hasExemption = !!data.vatExemptionReason || totals.taxBreakdown.some((t) => !!t.exemptionReason);
    const vatApplicable = !(hasExemption && totals.taxTotal === 0 && data.lines.every((l) => !(Number(l.vatRate) > 0)));
    const extra = data.extraCharges ?? [];
    const amountDue = totals.total + extra.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    // Colonnes : la remise DOIT figurer si une ligne en porte une (art. 242 nonies A CGI).
    const keys = [...settings.columns];
    if (!keys.includes('discount') && data.lines.some((l) => (Number(l.discountPercent) || 0) > 0))
        keys.push('discount');
    if (!vatApplicable)
        keys.splice(0, keys.length, ...keys.filter((k) => k !== 'vatRate'));
    // Colonne « Unité » sans aucune unité renseignée : en-tête au-dessus de cases vides (10/11).
    if (!data.lines.some((l) => (l.unit ?? '').trim()))
        keys.splice(0, keys.length, ...keys.filter((k) => k !== 'unit'));
    const ORDER = ['ref', 'description', 'quantity', 'unit', 'unitPrice', 'discount', 'vatRate', 'lineTotal'];
    const columnLabel = (key) => !vatApplicable && key === 'unitPrice' ? L.noVat.unitPrice : !vatApplicable && key === 'lineTotal' ? L.noVat.lineTotal : L.columns[key];
    // Sans TVA, « Prix unitaire » est plus long que « PU HT » : la colonne reprend la place de la colonne TVA.
    const columnSpec = (key) => (!vatApplicable && key === 'unitPrice' ? { ...exports.COLUMN_SPEC.unitPrice, width: (exports.COLUMN_SPEC.unitPrice.width ?? 66) + exports.COLUMN_SPEC.vatRate.width } : exports.COLUMN_SPEC[key]);
    const columns = ORDER.filter((k) => keys.includes(k)).map((key) => ({ key, label: columnLabel(key), ...columnSpec(key) }));
    // Lignes (regroupées par service quand il y en a plusieurs)
    const rows = [];
    const groupTotals = new Map();
    // Colonne « Total TTC » : montant de la ligne TVA comprise (11/11, Leonce : un « Total HT » de ligne ne
    // fait que répéter PU HT × quantité). Sans TVA, HT = TTC : la colonne reste « Montant ». Affichage seul :
    // le Factur-X garde les montants HT par ligne (EN 16931, BT-131).
    const lineAmount = (line) => {
        const ht = computeLineTotal(line);
        return vatApplicable ? Math.round(ht * (1 + (Number(line.vatRate) || 0) / 100)) : ht;
    };
    for (const line of data.lines)
        if (line.group)
            groupTotals.set(line.group, (groupTotals.get(line.group) ?? 0) + lineAmount(line));
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
                lineTotal: amount(lineAmount(line)),
            },
        });
    }
    // Échéance / validité / livraison
    // Un avoir ne s'encaisse pas : pas d'échéance (12/11).
    const due = kind === 'invoice' && data.dueDate
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
    // « Atelier Demo, SAS » : la forme juridique n'est pas répétée si la raison
    // sociale la contient déjà (« Atelier Demo SAS »).
    const identity = sellerIdentity(seller);
    // Capital social : seulement s'il est positif, et jamais pour une entreprise individuelle, qui n'en a
    // pas (INV-20261112-0002 : « Entrepreneur Individuel au capital de 0 € », 12/11).
    const sellerCapital = meaningfulCapital(seller);
    const head = [];
    // SIREN / SIRET du vendeur : mention obligatoire. Repris du RCS s'il y figure, sinon imprimé — avant,
    // un vendeur avec un capital mais sans RCS n'avait aucun identifiant sur sa facture.
    const sellerId = seller.siret ? `${L.siret} ${seller.siret}` : seller.siren ? `${L.siren} ${seller.siren}` : undefined;
    const sirenDigits = (seller.siren || seller.siret || '').replace(/\D/g, '').slice(0, 9);
    const registrationHasSiren = !!sirenDigits && (seller.registration ?? '').replace(/\D/g, '').includes(sirenDigits);
    if (sellerCapital)
        head.push(L.capital(identity, sellerCapital));
    if (seller.registration)
        head.push(seller.registration);
    if (sellerId && !registrationHasSiren)
        head.push(sellerCapital ? sellerId : `${identity}, ${sellerId}`);
    else if (!sellerCapital && !seller.registration && identity !== (seller.legalName || seller.name))
        head.push(identity);
    // Sans capital mais avec un RCS : la forme juridique disparaissait du pied (INV-20261112-0002 : ni
    // « Entrepreneur individuel » ni « EI », mention obligatoire à côté du nom d'un entrepreneur individuel).
    if (!sellerCapital && seller.registration && identity !== (seller.legalName || seller.name))
        head.unshift(identity);
    // Conditions de règlement (pénalités de retard, indemnité de 40 €, escompte) : obligatoires sur une
    // FACTURE entre professionnels seulement (art. L441-9 et L441-10 C. com.). Ni sur un devis, un bon
    // de commande ou un avoir, ni envers un particulier, à qui l'indemnité de 40 € ne s'applique pas.
    // Elles forment, avec l'échéance, le bloc « Conditions de paiement » du CORPS de la facture et non
    // une ligne du pied (12/11, demande de l'expert-comptable : mention obligatoire, pas une note).
    const tail = [];
    const sentence = (t) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
    const professional = isProfessionalParty(data.buyer);
    const paymentConditions = kind === 'invoice'
        ? [
            ...(data.payment?.terms?.trim() ? [sentence(data.payment.terms)] : data.dueDate ? [sentence(`${L.due} ${(0, format_1.formatDate)(data.dueDate, locale)}`)] : []),
            ...(professional ? [sentence(L.mentions.latePenalties), sentence(L.mentions.recoveryIndemnity), sentence(L.mentions.noDiscount)] : []),
        ]
        : [];
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
    // Mentions en phrases (10/11) : plus de « · » entre elles.
    const legal = [head.map(sentence).join(' '), tail.join(' '), settings.footerNote?.trim()].filter(Boolean).join(' ');
    const payment = kind !== 'order' && settings.showPaymentBlock && data.payment && (data.payment.iban || data.payment.bic || data.payment.link)
        // IBAN par groupes de 4 (« FR76 3000 6000 … »), lisible et recopiable comme sur un RIB.
        ? { iban: data.payment.iban ? data.payment.iban.replace(/\s+/g, '').toUpperCase().replace(/(.{4})(?=.)/g, '$1 ') : undefined, bic: data.payment.bic, terms: data.payment.terms, qrData: data.payment.link || undefined }
        : undefined;
    const status = data.status;
    // Un avoir soldé ne porte pas « PAYÉ » : il n'est pas payé, il annule (12/11).
    const watermark = settings.statusWatermark && status && !(kind === 'credit' && status === 'paid') ? L.watermark(kind, status) : undefined;
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
        theme: { primary, accent, accentTint: (0, color_1.mix)(accent, 0.14) },
        title: L.titles[kind],
        number: data.number,
        labels: {
            number: L.number, issue: L.issue, seller: L.seller, buyer: L.buyer,
            subtotal: L.subtotal, taxTotal: singleRate !== null ? `${L.taxAmount} ${(0, format_1.formatPercent)(singleRate, locale)}` : L.taxTotal, grandTotal: vatApplicable ? L.grandTotal : L.noVat.grandTotal,
            taxBreakdown: L.taxBreakdown, taxBase: L.taxBase, taxAmount: L.taxAmount,
            paymentTerms: L.paymentTerms, paymentConditions: L.paymentConditions, iban: L.iban, bic: L.bic, scanToPay: L.scanToPay,
            poweredBy: L.poweredBy, page: L.page, of: L.of, continuation: L.continuation,
        },
        issueDate: (0, format_1.formatDate)(data.issueDate, locale),
        due,
        seller: partyView(sellerDisplayParty(seller), L.vat, L),
        buyer: partyView(buyerIdentity(data.buyer, seller), L.vat, L, isProfessionalParty(data.buyer)),
        delivery: data.delivery?.address ? partyView({ name: data.delivery.name ?? '', address: data.delivery.address }, L.vat, L) : undefined,
        refLine,
        columns,
        rows,
        vatApplicable,
        ...(paymentConditions.length ? { paymentConditions } : {}),
        // Détail par taux seulement s'il y a PLUSIEURS taux (art. 242 nonies A, ann. II CGI) : avec un seul
        // taux, il répétait mot pour mot les totaux ; le taux figure alors dans la ligne « TVA 20 % ».
        taxes: vatApplicable && settings.showTaxBreakdown && singleRate === null
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
        badge: isFacturXDocument(kind) ? 'Factur-X EN 16931' : undefined,
        poweredBy: settings.showPoweredBy,
        watermark,
        watermarkSize: watermark ? watermarkFontSize(watermark) : undefined,
        statusLabel: status ? L.status[status] : undefined,
        totalsRaw: { ...totals, amountDue },
    };
}
const escapeRegExp = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * Vendeur affiché (12/11) : sa raison sociale, comme le XML Factur-X (BT-27), et son nom commercial
 * en dessous (BT-28) s'il apporte quelque chose. Avant, le PDF imprimait le nom commercial
 * (« SMP-DEMO ») et le XML la raison sociale (« Services CEO ») : deux vendeurs différents.
 */
function sellerDisplayParty(seller) {
    const legalName = seller.legalName?.trim();
    const name = seller.name?.trim();
    if (!legalName || !name || name === '—')
        return { ...seller, name: legalName || seller.name };
    const norm = (v) => v.toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const tradeName = norm(legalName).includes(norm(name)) ? undefined : name;
    return { ...seller, name: legalName, ...(tradeName ? { tradeName } : {}) };
}
/**
 * Rue sans la localité recopiée (12/11) : « 95 RUE DU CAPITAINE GUYNEMER 92400 COURBEVOIE » avec le
 * code postal 92400 et la ville COURBEVOIE donne « 95 RUE DU CAPITAINE GUYNEMER ». Certaines fiches
 * (contacts du CRM, adresses saisies d'un bloc) ont l'adresse complète en première ligne : elle
 * s'imprimait deux fois. Ne retire rien sans le code postal (une rue peut porter le nom de la ville :
 * « 12 rue de Paris, 75001 Paris »), ni quand il ne resterait rien ; aucun format de pays supposé.
 */
function streetWithoutLocality(street, postalCode, city) {
    const s = street?.trim();
    const pc = postalCode?.trim();
    if (!s || !pc)
        return s || undefined;
    const c = city?.trim();
    const P = escapeRegExp(pc);
    const C = c ? escapeRegExp(c) : undefined;
    const tails = [
        ...(C ? [`${P}[\\s,]+${C}(?:[\\s,]+[\\p{L} .'-]{2,40})?`, `${C}[\\s,]+${P}(?:[\\s,]+[\\p{L} .'-]{2,40})?`] : []),
        P,
    ];
    for (const tail of tails) {
        const cut = s.replace(new RegExp(`[\\s,]+${tail}\\s*$`, 'iu'), '').trim();
        if (cut !== s && cut)
            return cut;
    }
    return s;
}
/**
 * Client entreprise : raison sociale, SIRET ou SIREN connus — même définition pour les mentions de
 * règlement et pour les identifiants imprimés (`buyerIdentity`). Sans aucun d'eux : un particulier.
 */
function isProfessionalParty(party) {
    if (!party)
        return false;
    return [party.siren, party.siret, party.legalName].some((v) => typeof v === 'string' && v.replace(/[\s.\-]/g, '').length > 0);
}
/** Raison sociale suivie de la forme juridique si elle n'y figure pas déjà. */
/** Entreprise individuelle (EI, EIRL, micro-entrepreneur) : pas de capital social. */
function isIndividualEnterprise(legalForm) {
    const f = (legalForm ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return /^(ei|eirl)$/.test(f) || /(entrepreneur|entreprise)\s+individuel/.test(f) || /micro[- ]?entrepr|auto[- ]?entrepr/.test(f);
}
/** Capital imprimable : une somme non nulle, et jamais pour une entreprise individuelle. */
function meaningfulCapital(seller) {
    const c = (seller.capital ?? '').trim();
    if (!c || isIndividualEnterprise(seller.legalForm))
        return undefined;
    const digits = c.replace(/[^\d,.]/g, '').replace(',', '.');
    return digits && Number(digits) === 0 ? undefined : c;
}
function sellerIdentity(seller) {
    const legalName = seller.legalName || seller.name;
    const form = seller.legalForm?.trim();
    if (!form)
        return legalName;
    const already = new RegExp(`(^|[\\s,(])${escapeRegExp(form)}($|[\\s,).])`, 'i').test(legalName);
    return already ? legalName : `${legalName}, ${form}`;
}
/**
 * Mentions légales complémentaires du vendeur pour le Factur-X (BT-33) :
 * forme juridique, capital, immatriculation. `undefined` si aucune.
 */
function sellerLegalInformation(seller) {
    const parts = [
        seller.legalForm?.trim() && meaningfulCapital(seller) ? `${seller.legalForm.trim()} au capital de ${meaningfulCapital(seller)}` : seller.legalForm?.trim() || (meaningfulCapital(seller) ? `Capital ${meaningfulCapital(seller)}` : undefined),
        seller.registration?.trim(),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
}
//# sourceMappingURL=view.js.map