"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_PLAN_NAMES = void 0;
exports.platformPlanName = platformPlanName;
exports.platformInvoiceKindOf = platformInvoiceKindOf;
exports.platformSubscriptionReference = platformSubscriptionReference;
exports.billingRecordToPlatformInvoiceData = billingRecordToPlatformInvoiceData;
const records_1 = require("./records");
const platform_invoice_view_1 = require("./platform-invoice-view");
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
    const s = String(v).replace(/\s+/g, ' ').trim();
    return s && !/^(n\/a|null|undefined|-)$/i.test(s) ? s : undefined;
};
const int = (v) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.round(n) : undefined;
};
function date(v) {
    if (v === null || v === undefined || v === '')
        return undefined;
    if (v instanceof Date)
        return isNaN(v.getTime()) ? undefined : v;
    const s = String(v);
    const d = /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
}
/** Libellés des plans, ceux de la webapp. */
exports.PLATFORM_PLAN_NAMES = { standard: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Entreprise' };
function platformPlanName(plan) {
    const key = typeof plan === 'string' ? plan.trim().toLowerCase() : '';
    return exports.PLATFORM_PLAN_NAMES[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Services');
}
/** Série de la facture d'après son numéro : PLAN- (abonnement), FEES- (frais de service). */
function platformInvoiceKindOf(record) {
    const inv = record ?? {};
    const header = json(inv.header) ?? {};
    const number = String(header.invoiceNumber ?? inv.slug ?? '');
    const td = json(inv.transactionData) ?? {};
    if (/^PLAN-/i.test(number) || td.platformPlan || td.kind === 'platform_plan')
        return 'subscription';
    if (/^FEES-/i.test(number))
        return 'service_fees';
    return null;
}
/**
 * Référence d'abonnement propre à Services, stable pour un abonnement : « ABO-7K2F9Q-PRO ».
 * Dérivée de l'identifiant technique de l'abonnement, qui n'est jamais imprimé.
 */
function platformSubscriptionReference(subscriptionId, plan) {
    if (!subscriptionId)
        return undefined;
    let h = 0x811c9dc5;
    for (let i = 0; i < subscriptionId.length; i++) {
        h ^= subscriptionId.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    const code = h.toString(36).toUpperCase().padStart(6, '0').slice(-6);
    const suffix = (plan ?? '').trim().toUpperCase();
    return `ABO-${code}${suffix ? `-${suffix}` : ''}`;
}
/** Mentions techniques à ne jamais imprimer (anciennes factures). */
const TECHNICAL_NOTE = /stripe|référence de paiement|^remise appliquée/i;
function stateOf(record) {
    const status = (0, records_1.billingInvoiceStatus)(record);
    if (status === 'paid')
        return 'paid';
    if (status === 'refunded')
        return 'refunded';
    if (status === 'cancelled')
        return 'cancelled';
    const td = json(record?.transactionData) ?? {};
    const attempts = Array.isArray(td.paymentAttempts) ? td.paymentAttempts : [];
    return attempts.some((a) => a && a.paid === false) ? 'payment_failed' : 'pending';
}
function billingRecordToPlatformInvoiceData(record, options = {}) {
    const inv = record ?? {};
    const kind = platformInvoiceKindOf(inv) ?? 'service_fees';
    const header = json(inv.header) ?? {};
    const payment = json(inv.payment) ?? {};
    const td = json(inv.transactionData) ?? {};
    const currency = (str(inv.currency) ?? 'EUR').toUpperCase();
    const issue = date(header.issueDate ?? header.invoiceDate ?? inv.emittedDate) ?? new Date();
    const due = date(payment.dueDate ?? inv.dueDate);
    const state = stateOf(inv);
    const paidAt = state === 'paid' ? date(payment.paidAt ?? td.paymentCompletedAt ?? td.processedAt) ?? issue : undefined;
    const rawLines = Array.isArray(json(inv.lines)) ? json(inv.lines) : [];
    const vatPercent = (l) => {
        const r = Number(l?.vatPercent ?? l?.vatRate);
        if (!Number.isFinite(r))
            return 20;
        return r > 0 && r <= 1 ? Math.round(r * 10000) / 100 : r;
    };
    let lines = rawLines.map((l, i) => ({
        ref: undefined,
        description: (str(l?.description ?? l?.title) ?? `Article ${i + 1}`).slice(0, 300),
        quantity: Number(l?.quantity) || 1,
        unitPrice: Math.round(Number(l?.unitPrice) || 0),
        vatRate: vatPercent(l),
    }));
    const customNotes = (Array.isArray(header.notes) ? header.notes : [])
        .map((n) => (typeof n === 'string' ? n : n?.subjectCode ? undefined : n?.content))
        .map(str)
        .filter((n) => !!n && !TECHNICAL_NOTE.test(n));
    const base = {
        number: str(header.invoiceNumber ?? header.id ?? inv.slug ?? inv.invoiceId) ?? 'SANS-NUMERO',
        issueDate: issue,
        dueDate: due && due >= issue ? due : issue,
        ...(paidAt ? { paidAt } : {}),
        currency,
        state,
        seller: (0, records_1.billingPartyToDocumentParty)(inv.seller, currency),
        buyer: (0, records_1.billingPartyToDocumentParty)(inv.buyer, currency),
    };
    if (kind === 'subscription') {
        const pp = td.platformPlan ?? {};
        const plan = str(pp.plan);
        const interval = pp.billingInterval === 'annual' ? 'annual' : 'monthly';
        const planChange = pp.billingReason === 'subscription_update';
        const periodStart = date(pp.periodStart);
        const periodEnd = date(pp.periodEnd);
        const discount = Math.max(0, int(pp.discountCents) ?? 0);
        const subtotal = int(pp.subtotalCents);
        // Ligne stockée au HT après remise : reconstruite au prix avant remise, la remise devenant
        // une remise de document (Sous-total HT, Remise, Total HT — comme le XML BG-20).
        if (lines.length === 1 && discount > 0 && subtotal !== undefined && lines[0].unitPrice * lines[0].quantity === subtotal - discount) {
            lines = [{ ...lines[0], unitPrice: subtotal, quantity: 1 }];
        }
        if (plan && lines.length === 1) {
            lines = [{ ...lines[0], description: (0, platform_invoice_view_1.platformSubscriptionLineLabel)(platformPlanName(plan), interval, { start: periodStart, end: periodEnd }, planChange) }];
        }
        const attempts = Array.isArray(td.paymentAttempts) ? td.paymentAttempts : [];
        const lastFailed = [...attempts].reverse().find((a) => a && a.paid === false);
        const buyerEmail = base.buyer.email;
        return {
            ...base,
            kind,
            ...(periodStart && periodEnd ? { period: { start: periodStart, end: periodEnd } } : {}),
            lines,
            ...(discount > 0 && lines[0] && lines[0].unitPrice === subtotal ? { discount: { amount: discount, reason: 'Remise' } } : {}),
            subscription: {
                planName: plan ? platformPlanName(plan) : 'Services',
                interval,
                account: buyerEmail,
                reference: platformSubscriptionReference(str(pp.stripeSubscriptionId), plan),
                planChange,
                ...(lastFailed?.at ? { failedAt: lastFailed.at } : {}),
                ...(state === 'payment_failed' && (td.nextPaymentAttempt || lastFailed?.nextPaymentAttempt) ? { nextAttemptAt: td.nextPaymentAttempt ?? lastFailed.nextPaymentAttempt } : {}),
            },
            notes: customNotes,
        };
    }
    // Frais de service : opération fournie par l'appelant, sinon celle enregistrée sur la facture.
    const stored = td.feesOperation ?? {};
    const operation = {
        invoiceNumber: options.operation?.invoiceNumber ?? str(stored.invoiceNumber),
        clientName: options.operation?.clientName ?? str(stored.clientName),
        collectedAmount: options.operation?.collectedAmount ?? int(stored.collectedAmount),
        collectedAt: options.operation?.collectedAt ?? str(stored.collectedAt),
        commissionRate: options.operation?.commissionRate ?? (Number.isFinite(Number(stored.commissionRate)) && stored.commissionRate !== null && stored.commissionRate !== undefined ? Number(stored.commissionRate) : undefined),
    };
    // Libellé de la commission : rattaché à la facture client quand elle est connue.
    if (operation.invoiceNumber && lines[0]) {
        lines = [{ ...lines[0], description: `Commission Services sur le règlement de la facture ${operation.invoiceNumber}` }, ...lines.slice(1)];
    }
    return { ...base, kind, lines, operation, notes: customNotes };
}
//# sourceMappingURL=platform-invoice-records.js.map