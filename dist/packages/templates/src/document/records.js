"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FR_FRANCHISE_MENTION = void 0;
exports.normalizeVatId = normalizeVatId;
exports.billingPartyToDocumentParty = billingPartyToDocumentParty;
exports.isBillingInvoicePaid = isBillingInvoicePaid;
exports.billingInvoiceStatus = billingInvoiceStatus;
exports.billingInvoiceToDocumentData = billingInvoiceToDocumentData;
exports.estimateDocumentStatus = estimateDocumentStatus;
exports.estimateToDocumentData = estimateToDocumentData;
const view_1 = require("./view");
exports.FR_FRANCHISE_MENTION = 'TVA non applicable, art. 293 B du CGI';
// ─── Aides ───────────────────────────────────────────────────────────────────
const json = (v) => {
    if (typeof v !== 'string')
        return v;
    try {
        return JSON.parse(v);
    }
    catch {
        return undefined;
    }
};
const str = (v) => {
    if (v === null || v === undefined || typeof v === 'object')
        return undefined;
    const s = String(v).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s && !/^(n\/a|null|undefined|-)$/i.test(s) ? s : undefined;
};
/** N° TVA intracommunautaire plausible (préfixe FR ajouté si absent) ; valeurs factices écartées. */
function normalizeVatId(value) {
    const v = str(value)?.replace(/[\s.-]/g, '').toUpperCase();
    if (!v)
        return undefined;
    const withPrefix = /^[A-Z]{2}/.test(v) ? v : `FR${v}`;
    return /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(withPrefix) && /\d/.test(withPrefix) ? withPrefix : undefined;
}
const digits = (value, len) => {
    const d = str(value)?.replace(/\s/g, '');
    return d && new RegExp(`^\\d{${len}}$`).test(d) ? d : undefined;
};
function capitalText(value, currency) {
    const s = str(value);
    if (!s)
        return undefined;
    if (/^\d+$/.test(s)) {
        const n = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return `${n} ${currency === 'EUR' ? '€' : currency}`;
    }
    return s;
}
function parseDate(value) {
    if (value === null || value === undefined || value === '')
        return undefined;
    if (value instanceof Date)
        return isNaN(value.getTime()) ? undefined : value;
    const s = String(value);
    const d = /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
}
// ─── Factures mu-billing ─────────────────────────────────────────────────────
/** Partie (vendeur / acheteur) au format JSON de mu-billing. */
function billingPartyToDocumentParty(raw, currency = 'EUR') {
    const p = json(raw) ?? {};
    const a = p.postalAddress ?? p.address ?? {};
    const li = p.legalInfo ?? {};
    const contact = Array.isArray(p.contacts) ? p.contacts[0] ?? {} : {};
    const siret = digits(li.siret ?? p.siret, 14);
    return {
        name: str(p.name) ?? '—',
        legalName: str(li.legalName),
        contactName: str(contact.contactName),
        address: {
            street: str(a.line1 ?? a.street),
            additionalStreet: str(a.line2),
            postalCode: str(a.postalCode ?? a.zip),
            city: str(a.city ?? a.locality),
            country: str(a.countryCode ?? a.country),
        },
        email: str(contact.contactEmail ?? p.email),
        phone: str(contact.contactPhoneNumber ?? p.phone),
        vatId: normalizeVatId(li.vatNumber ?? p.vatNumber),
        siret,
        siren: siret ? undefined : digits(li.siren, 9),
        capital: capitalText(li.capital ?? p.capital, currency),
        registration: str(p.rcs ?? li.rcs),
    };
}
function billingVatPercent(line) {
    if (line?.vatPercent !== undefined && line?.vatPercent !== null)
        return Number(line.vatPercent) || 0;
    if (line?.vatRate !== undefined && line?.vatRate !== null) {
        const r = Number(line.vatRate) || 0;
        return r > 0 && r <= 1 ? Math.round(r * 10000) / 100 : r; // 0.2 → 20 ; 20 → 20
    }
    return 20;
}
function paymentMeans(payment) {
    const code = String(payment?.paymentMeansCode ?? payment?.method ?? '');
    if (code === '10')
        return 'cash';
    if (code === '20')
        return 'cheque';
    if (code === '30' || code === '58' || code === 'transfer')
        return 'transfer';
    if (code === '49' || code === '59' || code === 'debit')
        return 'direct_debit';
    if (code === '48' || code === 'card')
        return 'card';
    return undefined;
}
const up = (v) => String(v ?? '').trim().toUpperCase();
/** Vrai si la facture est payée (paymentStatus PAID / COMPLETED, casse indifférente). */
function isBillingInvoicePaid(record) {
    return ['PAID', 'COMPLETED'].includes(up(record?.paymentStatus));
}
/**
 * Vrai si la facture a déjà été transmise au client : état SENT, ou au moins une
 * invitation de consultation / de paiement envoyée.
 */
function isInvoiceSent(inv) {
    if (up(inv?.state) === 'SENT')
        return true;
    const tx = json(inv?.transactionData) ?? {};
    const sent = (list) => Array.isArray(list) && list.length > 0;
    return sent(tx.viewInvitations) || sent(tx.paymentInvitations);
}
/**
 * État d'une facture mu-billing, seule règle partagée par l'écran, le PDF et le filigrane.
 *
 * - payée (PAID / COMPLETED) → `paid` ; remboursée → `refunded` ;
 *   annulée (CANCELLED / CANCELED / VOID) → `cancelled` ;
 * - facture saisie dans le tableau de bord (`transactionData.metadata.source`) et
 *   jamais transmise au client → `draft` : brouillon modifiable, filigrane BROUILLON ;
 * - sinon émise : échéance dépassée → `overdue`, sinon `pending` (pas de filigrane).
 *
 * Avant, toute facture non payée était traitée en brouillon : une facture envoyée
 * au client (ou une facture de frais émise par la plateforme) partait avec le
 * filigrane « Document provisoire ».
 */
function billingInvoiceStatus(record, asOf = new Date()) {
    const inv = record ?? {};
    const pay = up(inv.paymentStatus);
    const state = up(inv.state);
    const CANCELLED = ['CANCELLED', 'CANCELED', 'VOID', 'VOIDED'];
    if (['PAID', 'COMPLETED'].includes(pay))
        return 'paid';
    if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(pay))
        return 'refunded';
    if (CANCELLED.includes(pay) || CANCELLED.includes(state))
        return 'cancelled';
    const manual = !!(json(inv.transactionData) ?? {})?.metadata?.source;
    if (pay === 'DRAFT' || state === 'DRAFT' || (manual && !isInvoiceSent(inv)))
        return 'draft';
    const payment = json(inv.payment) ?? {};
    const due = parseDate(payment.dueDate ?? inv.dueDate);
    if (due && due.getTime() < asOf.getTime())
        return 'overdue';
    return 'pending';
}
/** Facture mu-billing → DocumentData (facture, ou avoir 381 si la facture d'origine est connue). */
function billingInvoiceToDocumentData(record, options = {}) {
    const inv = record ?? {};
    const header = json(inv.header) ?? {};
    const payment = json(inv.payment) ?? {};
    const rawLines = json(inv.lines) ?? [];
    const currency = (str(inv.currency) ?? 'EUR').toUpperCase();
    const issue = parseDate(header.issueDate ?? header.invoiceDate ?? inv.emittedDate) ?? new Date();
    let due = parseDate(payment.dueDate ?? inv.dueDate);
    // BR-FR-CO-07 : l'échéance ne peut précéder l'émission.
    if (!due || due < issue)
        due = new Date(issue.getTime() + 30 * 24 * 3600 * 1000);
    const lines = (Array.isArray(rawLines) ? rawLines : []).map((l, i) => {
        const discount = Number(l?.discountPercent);
        return {
            description: (str(l?.description ?? l?.title) ?? `Article ${i + 1}`).slice(0, 300),
            quantity: Number(l?.quantity) || 1,
            unit: str(l?.unit),
            unitPrice: Math.round(Number(l?.unitPrice) || 0),
            vatRate: billingVatPercent(l),
            ...(Number.isFinite(discount) && discount > 0 ? { discountPercent: discount } : {}),
        };
    });
    const status = options.isDraft ? 'draft' : billingInvoiceStatus(inv, options.asOf);
    // Lien de paiement (QR) : seulement pour une facture émise qu'il reste à payer.
    const payable = status === 'pending' || status === 'overdue';
    const seller = json(inv.seller) ?? {};
    const exempt = seller.isVatExempt === true || seller.legalInfo?.isVatExempt === true || lines.some((l) => l.vatRate === 0);
    const customNotes = (Array.isArray(header.notes) ? header.notes : [])
        .map((n) => (typeof n === 'string' ? n : n?.subjectCode ? undefined : n?.content))
        .map(str).filter(Boolean);
    const preceding = header.precedingInvoice ?? header.invoiceReferencedDocument;
    const precedingNumber = str(preceding?.number ?? preceding?.id);
    const isCredit = String(header.typeCode) === '381' && !!precedingNumber;
    return {
        kind: isCredit ? 'credit' : 'invoice',
        number: str(header.invoiceNumber ?? header.id ?? inv.slug ?? inv.invoiceId) ?? 'SANS-NUMERO',
        issueDate: issue,
        dueDate: due,
        currency,
        status,
        seller: billingPartyToDocumentParty(seller, currency),
        buyer: billingPartyToDocumentParty(inv.buyer, currency),
        lines,
        vatExemptionReason: exempt ? exports.FR_FRANCHISE_MENTION : undefined,
        payment: {
            terms: str(payment.paymentTermsText ?? inv.paymentTerms),
            iban: str(payment.iban),
            bic: str(payment.bic),
            link: payable ? options.paymentLink : undefined,
            means: paymentMeans(payment),
        },
        ...(isCredit ? { precedingInvoice: { number: precedingNumber, issueDate: parseDate(preceding.issueDate) } } : {}),
        notes: [...customNotes, str(inv.notes)].filter(Boolean).join('\n') || undefined,
    };
}
// ─── Devis mu-contract ───────────────────────────────────────────────────────
function estimateParty(raw, currency) {
    const p = raw ?? {};
    const a = p.address ?? { street: p.street, city: p.city, zip: p.zip, country: p.country };
    const company = p.type === 'COMPANY' && p.company?.companyName ? p.company.companyName : undefined;
    const person = [p.firstName, p.lastName].map(str).filter(Boolean).join(' ') || undefined;
    return {
        name: str(company ?? p.organizationName ?? p.name) ?? person ?? '—',
        contactName: company ? person : undefined,
        address: {
            street: str(a?.street ?? a?.line1),
            additionalStreet: str(a?.additionalStreet ?? a?.line2),
            postalCode: str(a?.zip ?? a?.postalCode),
            city: str(a?.city),
            country: str(a?.countryCode ?? a?.country),
        },
        email: str(p.email),
        phone: str(p.phone ?? p.phoneNumber),
        vatId: normalizeVatId(p.vatNumber ?? p.company?.vatNumber),
        siret: digits(p.siret ?? p.company?.siret, 14),
        capital: capitalText(p.capital, currency),
        registration: str(p.rcs),
    };
}
const ESTIMATE_STATUS = {
    DRAFT: 'draft', ACCEPTED: 'accepted', APPROVED: 'accepted', CLIENT_VALIDATED: 'accepted',
    REJECTED: 'rejected', DECLINED: 'rejected', CLOSED: 'cancelled', CANCELLED: 'cancelled', CANCELED: 'cancelled',
    EXPIRED: 'expired',
};
/**
 * État d'un devis. Un devis encore sans réponse (envoyé, en négociation…) dont la
 * date de validité est passée est `expired` : filigrane EXPIRÉ.
 */
function estimateDocumentStatus(rawStatus, validUntil, asOf = new Date()) {
    const mapped = ESTIMATE_STATUS[up(rawStatus)];
    if (mapped)
        return mapped;
    if (validUntil && validUntil.getTime() < asOf.getTime())
        return 'expired';
    return 'pending';
}
/** Devis mu-contract → DocumentData (kind 'quote'). */
function estimateToDocumentData(estimate, options = {}) {
    const det = json(estimate?.details) ?? {};
    const currency = (str(options.currency ?? det.currency) ?? 'EUR').toUpperCase();
    const vatRate = Number(det.tax ?? 0) || 0;
    const services = Array.isArray(det.services) ? det.services : [];
    const multi = services.length > 1;
    const lines = [];
    for (const svc of services) {
        const items = Array.isArray(svc?.items) ? svc.items : [];
        const group = multi ? str(svc?.title) : undefined;
        if (items.length) {
            for (const it of items) {
                lines.push({
                    description: str(it?.title) ?? str(svc?.title) ?? 'Prestation',
                    details: str(it?.description),
                    quantity: Number(it?.quantity) || 1,
                    unitPrice: Math.round(Number(it?.unitPrice ?? it?.price) || 0),
                    vatRate,
                    ...(group ? { group } : {}),
                });
            }
        }
        else {
            lines.push({
                description: str(svc?.title) ?? 'Prestation',
                details: str(svc?.description ?? svc?.synthese),
                quantity: Number(svc?.quantity) || 1,
                unitPrice: Math.round(Number(svc?.price) || 0),
                vatRate,
                ...(group ? { group } : {}),
            });
        }
    }
    // Prix imposé (négociation close / tunnel de paiement) : totaux forcés.
    const negotiationClosed = [det.negotiationStatus, det.negotiation?.status, det.negotiationData?.status].includes('CLOSED');
    const forcedSubtotal = options.pricing?.subTotal ?? (negotiationClosed ? Number(det.negotiationPrice ?? det.subTotal) || undefined : undefined);
    let totals;
    if (forcedSubtotal !== undefined) {
        const sub = Math.round(forcedSubtotal);
        const tax = Math.round((sub * vatRate) / 100);
        totals = { subtotal: sub, taxTotal: tax, total: sub + tax, taxBreakdown: [{ rate: vatRate, base: sub, amount: tax }] };
    }
    else if (!lines.length) {
        totals = { subtotal: 0, taxTotal: 0, total: 0, taxBreakdown: [] };
    }
    const rawStatus = options.status ?? estimate?.status;
    const validUntil = parseDate(det.validUntil);
    const id = str(estimate?.estimateId) ?? '';
    return {
        kind: 'quote',
        number: str(options.number) ?? str(det.estimateNumber) ?? id,
        issueDate: parseDate(det.issueDate ?? estimate?.createdAt) ?? new Date(),
        validUntil,
        currency,
        status: estimateDocumentStatus(rawStatus, validUntil, options.asOf),
        seller: estimateParty(det.from, currency),
        buyer: estimateParty(det.to, currency),
        lines: lines.map((l) => ({ ...l, lineTotal: (0, view_1.computeLineTotal)(l) })),
        ...(totals ? { totals } : {}),
        extraCharges: (options.pricing?.extraLines ?? []).map((l) => ({ label: l.label, amount: Math.round(l.amount) })),
        vatExemptionReason: vatRate === 0 && lines.length ? exports.FR_FRANCHISE_MENTION : undefined,
        notes: str(det.notes),
    };
}
//# sourceMappingURL=records.js.map