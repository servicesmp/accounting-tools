"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_LOCALES = exports.DOCUMENT_LABELS = void 0;
exports.getDocumentLabels = getDocumentLabels;
const fr = {
    titles: { invoice: 'FACTURE', credit: 'AVOIR', quote: 'DEVIS', order: 'BON DE COMMANDE' },
    number: 'N°', issue: "Date d'émission", due: 'Échéance', valid: "Valable jusqu'au", delivery: 'Livraison prévue',
    seller: 'Vendeur', buyer: 'Client', vat: 'N° TVA', siret: 'SIRET', siren: 'SIREN',
    columns: { ref: 'Réf.', description: 'Description', quantity: 'Qté', unit: 'Unité', unitPrice: 'PU HT', discount: 'Remise', vatRate: 'TVA', lineTotal: 'Total HT' },
    subtotal: 'Sous-total HT', taxTotal: 'Total TVA', grandTotal: 'Total TTC',
    taxBreakdown: 'Détail de la TVA', taxBase: 'Base', taxAmount: 'TVA',
    paymentTerms: 'Paiement', iban: 'IBAN', bic: 'BIC', scanToPay: 'Scannez pour payer',
    poweredBy: 'Document émis avec', page: 'Page', of: 'sur',
    watermark: (kind, status) => {
        // Facture : féminin ; avoir, devis, bon de commande : masculin.
        const f = kind === 'invoice';
        const w = {
            draft: 'BROUILLON',
            paid: f ? 'PAYÉE' : 'PAYÉ',
            cancelled: f ? 'ANNULÉE' : 'ANNULÉ',
            refunded: f ? 'REMBOURSÉE' : 'REMBOURSÉ',
            overdue: 'EN RETARD',
            accepted: 'ACCEPTÉ',
            rejected: 'REFUSÉ',
            expired: 'EXPIRÉ',
        };
        return w[status];
    },
    status: { draft: 'Brouillon', pending: 'En attente', paid: 'Payée', accepted: 'Accepté', rejected: 'Refusé', cancelled: 'Annulé', expired: 'Expiré', overdue: 'En retard', refunded: 'Remboursée' },
    amount: { invoice: 'Montant à payer', credit: 'Montant crédité', quote: 'Montant du devis', order: 'Montant de la commande' },
    creditRef: (n, d, r) => `Avoir sur la facture ${n}${d ? ` du ${d}` : ''}.${r ? ` Motif : ${r}.` : ''}`,
    quoteRef: (days, until) => `${days ? `Devis valable ${days} jours. ` : until ? `Devis valable jusqu'au ${until}. ` : ''}Bon pour accord : date, signature et cachet du client.`,
    orderRef: (n, ref) => `Commande n° ${n}${ref ? ` · référence acheteur ${ref}` : ''}.`,
    capital: (name, cap) => `${name} au capital de ${cap}`,
    mentions: {
        latePenalties: "Pénalités de retard : 3 fois le taux d'intérêt légal",
        recoveryIndemnity: 'Indemnité forfaitaire pour frais de recouvrement : 40 €.',
        noDiscount: "Pas d'escompte pour paiement anticipé.",
        nature: (l) => `Nature de l'opération : ${l}.`,
        natureLabels: { goods: 'livraison de biens', services: 'prestation de services', mixed: 'opération mixte' },
        vatOnDebits: "Option pour le paiement de la taxe d'après les débits.",
        deliveryAddress: (a) => `Adresse de livraison : ${a}.`,
        orderNoPayment: "Ce bon de commande n'est pas une facture.",
    },
    continuation: 'suite',
};
const en = {
    titles: { invoice: 'INVOICE', credit: 'CREDIT NOTE', quote: 'QUOTE', order: 'PURCHASE ORDER' },
    number: 'No.', issue: 'Issue date', due: 'Due date', valid: 'Valid until', delivery: 'Expected delivery',
    seller: 'Seller', buyer: 'Buyer', vat: 'VAT No.', siret: 'SIRET', siren: 'SIREN',
    columns: { ref: 'Ref.', description: 'Description', quantity: 'Qty', unit: 'Unit', unitPrice: 'Unit price', discount: 'Discount', vatRate: 'VAT', lineTotal: 'Total' },
    subtotal: 'Subtotal', taxTotal: 'Total VAT', grandTotal: 'Grand total',
    taxBreakdown: 'Tax breakdown', taxBase: 'Base', taxAmount: 'VAT',
    paymentTerms: 'Payment', iban: 'IBAN', bic: 'BIC', scanToPay: 'Scan to pay',
    poweredBy: 'Issued with', page: 'Page', of: 'of',
    watermark: (_kind, status) => ({
        draft: 'DRAFT', paid: 'PAID', cancelled: 'CANCELLED', refunded: 'REFUNDED', overdue: 'OVERDUE',
        accepted: 'ACCEPTED', rejected: 'DECLINED', expired: 'EXPIRED',
    }[status]),
    status: { draft: 'Draft', pending: 'Pending', paid: 'Paid', accepted: 'Accepted', rejected: 'Rejected', cancelled: 'Cancelled', expired: 'Expired', overdue: 'Overdue', refunded: 'Refunded' },
    amount: { invoice: 'Amount due', credit: 'Amount credited', quote: 'Quote amount', order: 'Order amount' },
    creditRef: (n, d, r) => `Credit note for invoice ${n}${d ? ` dated ${d}` : ''}.${r ? ` Reason: ${r}.` : ''}`,
    quoteRef: (days, until) => `${days ? `Quote valid for ${days} days. ` : until ? `Quote valid until ${until}. ` : ''}Approval: date, signature and stamp.`,
    orderRef: (n, ref) => `Order no. ${n}${ref ? ` · buyer reference ${ref}` : ''}.`,
    capital: (name, cap) => `${name}, share capital ${cap}`,
    mentions: {
        latePenalties: 'Late payment penalties: 3× the legal interest rate',
        recoveryIndemnity: 'Fixed recovery fee: €40.',
        noDiscount: 'No discount for early payment.',
        nature: (l) => `Nature of the transaction: ${l}.`,
        natureLabels: { goods: 'supply of goods', services: 'supply of services', mixed: 'mixed supply' },
        vatOnDebits: 'VAT paid on an accrual basis.',
        deliveryAddress: (a) => `Delivery address: ${a}.`,
        orderNoPayment: 'This purchase order is not an invoice.',
    },
    continuation: 'continued',
};
const de = {
    titles: { invoice: 'RECHNUNG', credit: 'GUTSCHRIFT', quote: 'ANGEBOT', order: 'BESTELLUNG' },
    number: 'Nr.', issue: 'Ausstellungsdatum', due: 'Fälligkeitsdatum', valid: 'Gültig bis', delivery: 'Liefertermin',
    seller: 'Verkäufer', buyer: 'Käufer', vat: 'USt-IdNr.', siret: 'SIRET', siren: 'SIREN',
    columns: { ref: 'Art.-Nr.', description: 'Beschreibung', quantity: 'Menge', unit: 'Einheit', unitPrice: 'Einzelpreis', discount: 'Rabatt', vatRate: 'MwSt', lineTotal: 'Gesamt' },
    subtotal: 'Zwischensumme', taxTotal: 'MwSt Gesamt', grandTotal: 'Endsumme',
    taxBreakdown: 'Steueraufschlüsselung', taxBase: 'Basis', taxAmount: 'MwSt',
    paymentTerms: 'Zahlung', iban: 'IBAN', bic: 'BIC', scanToPay: 'Scannen zum Bezahlen',
    poweredBy: 'Erstellt mit', page: 'Seite', of: 'von',
    watermark: (_kind, status) => ({
        draft: 'ENTWURF', paid: 'BEZAHLT', cancelled: 'STORNIERT', refunded: 'ERSTATTET', overdue: 'ÜBERFÄLLIG',
        accepted: 'ANGENOMMEN', rejected: 'ABGELEHNT', expired: 'ABGELAUFEN',
    }[status]),
    status: { draft: 'Entwurf', pending: 'Offen', paid: 'Bezahlt', accepted: 'Angenommen', rejected: 'Abgelehnt', cancelled: 'Storniert', expired: 'Abgelaufen', overdue: 'Überfällig', refunded: 'Erstattet' },
    amount: { invoice: 'Zu zahlender Betrag', credit: 'Gutgeschriebener Betrag', quote: 'Angebotsbetrag', order: 'Bestellbetrag' },
    creditRef: (n, d, r) => `Gutschrift zur Rechnung ${n}${d ? ` vom ${d}` : ''}.${r ? ` Grund: ${r}.` : ''}`,
    quoteRef: (days, until) => `${days ? `Angebot ${days} Tage gültig. ` : until ? `Angebot gültig bis ${until}. ` : ''}Auftragsbestätigung: Datum, Unterschrift, Stempel.`,
    orderRef: (n, ref) => `Bestellung Nr. ${n}${ref ? ` · Käuferreferenz ${ref}` : ''}.`,
    capital: (name, cap) => `${name}, Stammkapital ${cap}`,
    mentions: {
        latePenalties: 'Verzugszinsen: 3-facher gesetzlicher Zinssatz',
        recoveryIndemnity: 'Pauschale Beitreibungskosten: 40 €.',
        noDiscount: 'Kein Skonto bei vorzeitiger Zahlung.',
        nature: (l) => `Art des Umsatzes: ${l}.`,
        natureLabels: { goods: 'Lieferung von Waren', services: 'Dienstleistung', mixed: 'gemischter Umsatz' },
        vatOnDebits: 'Soll-Versteuerung der Mehrwertsteuer.',
        deliveryAddress: (a) => `Lieferadresse: ${a}.`,
        orderNoPayment: 'Diese Bestellung ist keine Rechnung.',
    },
    continuation: 'Fortsetzung',
};
exports.DOCUMENT_LABELS = { fr, en, de };
exports.DOCUMENT_LOCALES = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };
function getDocumentLabels(language) {
    return exports.DOCUMENT_LABELS[language] ?? fr;
}
//# sourceMappingURL=i18n.js.map