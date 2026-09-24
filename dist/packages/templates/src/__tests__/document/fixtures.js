"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleData = sampleData;
function sampleData(kind = 'invoice', over = {}) {
    return {
        kind,
        number: kind === 'quote' ? 'DV-2026-0012' : kind === 'order' ? 'BC-2026-0007' : kind === 'credit' ? 'AV-2026-0003' : 'FA-2026-0042',
        issueDate: '2026-09-24',
        dueDate: '2026-10-24',
        validUntil: '2026-10-24',
        currency: 'EUR',
        status: 'pending',
        seller: {
            name: 'Atelier Vertex', legalName: 'Atelier Vertex SAS',
            address: { street: '12 rue Oberkampf', postalCode: '75011', city: 'Paris', country: 'France' },
            email: 'contact@vertex.fr', vatId: 'FR12345678901', siret: '12345678900012', capital: '10 000 €', registration: 'RCS Paris 123 456 789',
        },
        buyer: {
            name: 'Leonce Yopa',
            address: { street: '83 rue Henri Legay', postalCode: '69100', city: 'Villeurbanne', country: 'france' },
            email: 'l.yopa@services.ceo',
        },
        lines: [
            { description: 'Audit RAG', details: 'Analyse de la chaîne de récupération', quantity: 1, unitPrice: 50000, vatRate: 20, group: 'Intelligence artificielle' },
            { description: 'Atelier de cadrage', quantity: 2, unit: 'jour', unitPrice: 65000, vatRate: 20, discountPercent: 10, group: 'Intelligence artificielle' },
            { description: 'Hébergement', quantity: 3, unit: 'mois', unitPrice: 2999, vatRate: 10, group: 'Infrastructure' },
        ],
        payment: { terms: 'Paiement à 30 jours', iban: 'FR76 3000 4000 0312 3456 7890 143', link: 'https://pay.services.ceo/i/abc' },
        operationNature: 'services',
        ...(kind === 'credit' ? { precedingInvoice: { number: 'FA-2026-0042', issueDate: '2026-09-01' } } : {}),
        ...over,
    };
}
//# sourceMappingURL=fixtures.js.map