"use strict";
/**
 * Formatage des montants et des dates, identique à la maquette :
 * montants « 3 200,00 » dans le tableau, « 6 336,00 € » dans les totaux,
 * dates « 12/11/2026 ». La devise est celle du document (jamais d'« € » implicite).
 * Espaces fines d'Intl remplacées par des espaces insécables standard (même
 * chasse qu'une espace ordinaire, présentes dans toutes les polices embarquées).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyDecimals = currencyDecimals;
exports.formatMoney = formatMoney;
exports.formatAmount = formatAmount;
exports.formatPercent = formatPercent;
exports.formatQuantity = formatQuantity;
exports.toDate = toDate;
exports.formatDate = formatDate;
exports.daysBetween = daysBetween;
const nbsp = (s) => s.replace(/[  ]/g, ' ');
/** Nombre de décimales d'une devise (JPY, XOF, XAF : 0 ; EUR, USD : 2…). */
function currencyDecimals(currency) {
    try {
        return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
    }
    catch {
        return 2;
    }
}
function major(minor, currency) {
    const decimals = currencyDecimals((currency || 'EUR').toUpperCase());
    return { value: (Number(minor) || 0) / Math.pow(10, decimals), decimals };
}
/** Montant avec devise, symbole après : « 6 336,00 € », « 12 000 FCFA », « 1,250.00 $ ». */
function formatMoney(minor, currency, locale) {
    const code = (currency || 'EUR').toUpperCase();
    const { value, decimals } = major(minor, code);
    try {
        // Symbole TOUJOURS après le montant (« 6 480,00 € », « 6,480.00 € ») : convention
        // des documents comptables de la plateforme, quelle que soit la langue.
        const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: code, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).formatToParts(value);
        const symbol = parts.find((p) => p.type === 'currency')?.value ?? code;
        const amount = parts.filter((p) => p.type !== 'currency').map((p) => p.value).join('').trim();
        return nbsp(`${amount} ${symbol}`);
    }
    catch {
        return `${value.toFixed(decimals)} ${code}`;
    }
}
/** Montant sans devise (cellules du tableau) : « 3 200,00 ». */
function formatAmount(minor, currency, locale) {
    const { value, decimals } = major(minor, currency);
    return nbsp(new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value));
}
function formatPercent(rate, locale) {
    const n = Number(rate) || 0;
    const v = nbsp(new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n));
    return locale.startsWith('en') ? `${v}%` : `${v} %`;
}
function formatQuantity(q, locale) {
    return nbsp(new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(Number(q) || 0));
}
/** Accepte Date, ISO, ou timestamp (nombre ou chaîne numérique). */
function toDate(value) {
    if (value === undefined || value === null || value === '')
        return null;
    if (value instanceof Date)
        return isNaN(value.getTime()) ? null : value;
    const d = typeof value === 'number' || /^\d+$/.test(String(value)) ? new Date(Number(value)) : new Date(value);
    return isNaN(d.getTime()) ? null : d;
}
/** Date numérique : « 12/11/2026 » (fr, en), « 12.11.2026 » (de). */
function formatDate(value, locale) {
    const d = toDate(value);
    return d ? d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '';
}
/** Nombre de jours entiers entre deux dates (validité d'un devis). */
function daysBetween(from, to) {
    const a = toDate(from);
    const b = toDate(to);
    if (!a || !b)
        return null;
    const days = Math.round((b.getTime() - a.getTime()) / 86400000);
    return days > 0 ? days : null;
}
//# sourceMappingURL=format.js.map