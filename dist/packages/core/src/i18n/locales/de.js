"use strict";
/**
 * @module i18n/locales/de
 * @description German locale for Factur-X
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.de = void 0;
exports.de = {
    code: 'de',
    name: 'Deutsch',
    direction: 'ltr',
    messages: {
        // Allgemeine Begriffe
        invoice: 'Rechnung',
        quote: 'Angebot',
        order: 'Bestellung',
        creditNote: 'Gutschrift',
        debitNote: 'Lastschrift',
        // Parteien
        seller: 'Verkäufer',
        buyer: 'Käufer',
        supplier: 'Lieferant',
        customer: 'Kunde',
        // Rechnungsdetails
        invoiceNumber: 'Rechnungsnummer',
        invoiceDate: 'Rechnungsdatum',
        dueDate: 'Fälligkeitsdatum',
        issueDate: 'Ausstellungsdatum',
        deliveryDate: 'Lieferdatum',
        // Beträge und Summen
        quantity: 'Menge',
        unitPrice: 'Einzelpreis',
        lineTotal: 'Zeilensumme',
        subtotal: 'Zwischensumme',
        taxTotal: 'MwSt. Gesamt',
        grandTotal: 'Endsumme',
        amountDue: 'Fälliger Betrag',
        totalWithoutTax: 'Summe ohne MwSt.',
        totalWithTax: 'Summe mit MwSt.',
        // Steuern
        vat: 'MwSt.',
        taxRate: 'Steuersatz',
        taxAmount: 'Steuerbetrag',
        taxBase: 'Steuerbasis',
        taxCategory: 'Steuerkategorie',
        // Zahlung
        payment: 'Zahlung',
        paymentTerms: 'Zahlungsbedingungen',
        paymentMethod: 'Zahlungsmethode',
        paymentReference: 'Zahlungsreferenz',
        iban: 'IBAN',
        bic: 'BIC/SWIFT',
        bankAccount: 'Bankkonto',
        // Dokumentfelder
        description: 'Beschreibung',
        reference: 'Referenz',
        notes: 'Notizen',
        remarks: 'Anmerkungen',
        comments: 'Kommentare',
        // Einheiten
        unit: 'Einheit',
        piece: 'Stück',
        hour: 'Stunde',
        day: 'Tag',
        month: 'Monat',
        // Validierungsfehler
        errors: {
            required: '{field} ist erforderlich',
            invalid: 'Ungültige {field}',
            tooShort: '{field} muss mindestens {min} Zeichen lang sein',
            tooLong: '{field} darf höchstens {max} Zeichen lang sein',
            minValue: '{field} muss mindestens {min} sein',
            maxValue: '{field} darf höchstens {max} sein',
            validation: {
                missingSeller: 'Verkäuferinformationen fehlen',
                missingBuyer: 'Käuferinformationen fehlen',
                missingInvoiceNumber: 'Rechnungsnummer fehlt',
                missingInvoiceDate: 'Rechnungsdatum fehlt',
                missingLines: 'Mindestens eine Rechnungszeile erforderlich',
                invalidAmount: 'Ungültiger Betrag: {amount}',
                invalidTaxRate: 'Ungültiger Steuersatz: {rate}',
                invalidCurrency: 'Nicht unterstützte Währung: {currency}',
                invalidProfile: 'Ungültiges Profil: {profile}',
                profileViolation: 'Profil {profile} verbietet Feld: {field}',
                missingMandatoryField: 'Profil {profile} erfordert Feld: {field}',
            },
            facturx: {
                xmlGenerationFailed: 'Factur-X XML-Generierung fehlgeschlagen',
                xmlValidationFailed: 'XML-Validierung für Profil {profile} fehlgeschlagen',
                unsupportedProfile: 'Nicht unterstütztes Factur-X Profil: {profile}',
                missingVatNumber: 'USt-IdNr. erforderlich für Profil {profile}',
            },
        },
        // Erfolgsmeldungen
        success: {
            invoiceGenerated: 'Rechnung erfolgreich erstellt',
            xmlGenerated: 'XML erfolgreich generiert',
            pdfGenerated: 'PDF erfolgreich generiert',
            validated: 'Validierung erfolgreich',
        },
        // Informationsmeldungen
        info: {
            generatingInvoice: 'Rechnung wird erstellt...',
            generatingXml: 'XML wird generiert...',
            generatingPdf: 'PDF wird generiert...',
            validating: 'Validierung läuft...',
            processing: 'Verarbeitung läuft...',
        },
        // Profile
        profiles: {
            minimum: 'Minimum',
            basicwl: 'Basis ohne Zeilen',
            basic: 'Basis',
            en16931: 'EN 16931 (Europäischer Standard)',
            extended: 'Erweitert',
        },
        // Währungen
        currency: {
            eur: 'Euro',
            usd: 'US-Dollar',
            gbp: 'Britisches Pfund',
            chf: 'Schweizer Franken',
            jpy: 'Japanischer Yen',
        },
        // Pluralisierung
        items: 'Sie haben {count} Elemente | Sie haben {count} Element',
        lines: '{count} Zeilen | {count} Zeile',
    },
    dateFormats: {
        short: 'DD.MM.YYYY',
        medium: 'DD. MMM YYYY',
        long: 'DD. MMMM YYYY',
        full: 'dddd, DD. MMMM YYYY',
        time: 'HH:mm',
        datetime: 'DD.MM.YYYY HH:mm',
    },
    numberFormats: {
        decimal: ',',
        thousands: '.',
        currency: '{amount} {currency}',
        percentage: '{amount} %',
    },
};
//# sourceMappingURL=de.js.map