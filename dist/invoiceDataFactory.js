"use strict";
// invoiceDataFactory.ts (exemple)
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSampleInvoice = buildSampleInvoice;
const FacturXInvoice_1 = require("./core/FacturXInvoice");
const EnumInvoiceType_1 = require("./core/EnumInvoiceType");
// Imaginons un helper qui construit un FacturXInvoice pour la démo
function buildSampleInvoice() {
    const seller = {
        name: 'My Company SAS',
        postalAddress: {
            line1: '10 Rue de la Paix',
            line2: '',
            city: 'Paris',
            postalCode: '75002',
            countryCode: 'FR',
        },
        vatNumber: 'FR123456789',
        contacts: [
            {
                contactName: 'Service Facturation',
                contactPhoneNumber: '+33 1 23 45 67 89',
                contactEmail: 'facture@mycompany.fr',
                getFullContactInfo: function () {
                    throw new Error('Function not implemented.');
                },
                hasValidEmailForm: function () {
                    throw new Error('Function not implemented.');
                },
                hasValidPhoneNumberForm: function () {
                    throw new Error('Function not implemented.');
                }
            },
        ],
        addContact: function (contact) {
            throw new Error('Function not implemented.');
        }
    };
    const buyer = {
        name: 'Client SA',
        postalAddress: {
            line1: '100 Avenue Montaigne',
            line2: '',
            city: 'Bordeaux',
            postalCode: '33000',
            countryCode: 'FR',
        },
        vatNumber: 'FR987654321',
        contacts: [],
        addContact: function (contact) {
            throw new Error('Function not implemented.');
        }
    };
    const lines = [
        {
            id: '1',
            description: 'Produit A',
            quantity: 2,
            unitPrice: 50,
            vatRate: 0.20, // 20%
            lineTotal: 120, // ex. 2 * 50 + TVA => À calculer précisément
            unitCode: 'C62', // code unit
            allowances: [],
            charges: [],
            taxCategoryCode: '',
            lineTotalWithoutTax: 0,
            addAllowance: function (amount, reasonText) {
                throw new Error('Function not implemented.');
            },
            addCharge: function (amount, reasonText) {
                throw new Error('Function not implemented.');
            },
            addAllowanceCharge: function (amount, isCharge, reasonText) {
                throw new Error('Function not implemented.');
            },
            getAllAllowancesCharges: function () {
                throw new Error('Function not implemented.');
            },
            clearAllowancesCharges: function () {
                throw new Error('Function not implemented.');
            }
        },
        {
            id: '2',
            description: 'Produit B',
            quantity: 1,
            unitPrice: 100,
            vatRate: 0.20,
            lineTotal: 120, // 100 + 20% = 120
            unitCode: 'C62',
            allowances: [],
            charges: [],
            taxCategoryCode: '',
            lineTotalWithoutTax: 0,
            addAllowance: function (amount, reasonText) {
                throw new Error('Function not implemented.');
            },
            addCharge: function (amount, reasonText) {
                throw new Error('Function not implemented.');
            },
            addAllowanceCharge: function (amount, isCharge, reasonText) {
                throw new Error('Function not implemented.');
            },
            getAllAllowancesCharges: function () {
                throw new Error('Function not implemented.');
            },
            clearAllowancesCharges: function () {
                throw new Error('Function not implemented.');
            }
        },
    ];
    const payment = {
        paymentMeansCode: '42',
        payeeIBAN: 'FR7612345987XXXX',
        payeeBIC: 'PSSTFRPP',
        dueDate: new Date('2025-04-10'),
        paymentTermsText: 'Règlement 30 jours',
    };
    const header = {
        id: 'INV-2025-123',
        typeCode: EnumInvoiceType_1.DocTypeCode.INVOICE, // "380" => Facture
        issueDate: new Date(), // date du jour
        invoiceDate: new Date(),
        name: 'Facture de démonstration',
        notes: ['Note interne n°1', 'Note interne n°2'],
        invoiceNumber: '',
        addNote: function (note) {
            throw new Error('Function not implemented.');
        }
    };
    const invoice = new FacturXInvoice_1.FacturXInvoice(EnumInvoiceType_1.FacturxProfile.EXTENDED, header, seller, buyer, payment, lines);
    // On peut ajouter disclaimers, docAllowanceCharges, etc.
    invoice.disclaimers = ['Usage strictement interne', 'Données confidentielles'];
    // Ex: remise doc-level
    invoice.docAllowanceCharges.push({
        chargeIndicator: false,
        actualAmount: 10,
        reason: 'Remise globale',
    });
    // On appelle finalizeTotals() si besoin pour calculer lineTotal, grandTotal, etc.
    invoice.finalizeTotals();
    return invoice;
}
