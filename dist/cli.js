#!/usr/bin/env node
"use strict";
// src/cli.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
/**
 * CLI pour générer des factures Factur-X et des devis conformes
 *
 * Usage:
 *   npm run cli invoice    # Générer une facture
 *   npm run cli quote      # Générer un devis
 *   npm run cli order      # Générer une commande Order-X
 *   npm run cli validate   # Valider un fichier XML
 */
const fs_1 = __importDefault(require("fs"));
const pdf_lib_1 = require("pdf-lib");
const FacturXInvoice_1 = require("./core/FacturXInvoice");
const EnumInvoiceType_1 = require("./core/EnumInvoiceType");
const DocumentHeader_1 = require("./core/DocumentHeader");
const HeaderTradeAgreement_1 = require("./core/HeaderTradeAgreement");
const PaymentDetails_1 = require("./core/PaymentDetails");
const InvoiceLine_1 = require("./core/InvoiceLine");
const AllowanceCharge_1 = require("./core/AllowanceCharge");
const InvoiceTemplateFancy_1 = require("./templates/InvoiceTemplateFancy");
const InvoiceTemplateBrand_1 = require("./templates/InvoiceTemplateBrand");
// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function error(message) {
    log(`❌ ${message}`, 'red');
}
function success(message) {
    log(`✅ ${message}`, 'green');
}
function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}
function warn(message) {
    log(`⚠️  ${message}`, 'yellow');
}
/**
 * Affiche l'aide du CLI
 */
function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}Accounting Tools CLI${colors.reset}
${colors.bright}Version 1.0.0${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run cli <command> [options]

${colors.bright}COMMANDS:${colors.reset}
  ${colors.green}invoice${colors.reset}     Generate a Factur-X compliant invoice
  ${colors.green}quote${colors.reset}       Generate a compliant quote (pro forma)
  ${colors.green}order${colors.reset}       Generate an Order-X compliant order
  ${colors.green}validate${colors.reset}    Validate a Factur-X XML file
  ${colors.green}help${colors.reset}        Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.cyan}npm run cli invoice${colors.reset}
  ${colors.cyan}npm run cli quote${colors.reset}
  ${colors.cyan}npm run cli validate facture.xml${colors.reset}

${colors.bright}PROFILES:${colors.reset}
  ${colors.yellow}MINIMUM${colors.reset}    - Minimal information
  ${colors.yellow}BASICWL${colors.reset}    - Basic without lines
  ${colors.yellow}BASIC${colors.reset}      - Basic with lines
  ${colors.yellow}EN16931${colors.reset}    - European standard (recommended for B2B)
  ${colors.yellow}EXTENDED${colors.reset}   - All fields (for complex ERP systems)

${colors.bright}DOCUMENTATION:${colors.reset}
  See ANALYSE_COMPLETE_FACTURX_DEVIS.md for complete guide
`);
}
/**
 * Génère une facture interactive
 */
async function generateInvoice() {
    info('Génération d\'une facture Factur-X');
    console.log('');
    // 1. Demander le profil
    const profile = EnumInvoiceType_1.FacturxProfile.EN16931; // Par défaut EN16931
    info(`Profil sélectionné: ${profile}`);
    // 2. Créer les données de base (exemple simplifié)
    const sellerAddress = new HeaderTradeAgreement_1.PostalAddress("123 Rue du Commerce", "Paris", "75001", "FR", "Bâtiment A");
    const seller = new HeaderTradeAgreement_1.TradeParty("Ma Société SAS", sellerAddress, "FR12345678901");
    const buyerAddress = new HeaderTradeAgreement_1.PostalAddress("45 Avenue Client", "Lyon", "69001", "FR");
    const buyer = new HeaderTradeAgreement_1.TradeParty("Client ABC SARL", buyerAddress, "FR98765432100");
    const invoiceNumber = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const header = new DocumentHeader_1.DocumentHeader(invoiceNumber, invoiceNumber, "FACTURE", new Date(), new Date(), EnumInvoiceType_1.DocTypeCode.INVOICE);
    const payment = new PaymentDetails_1.PaymentDetails("58", "FR7630004000031234567890143", "BNPAFRPPXXX", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    "Paiement sous 30 jours");
    const invoice = new FacturXInvoice_1.FacturXInvoice(profile, header, seller, buyer, payment);
    // 3. Ajouter des lignes d'exemple
    invoice.lines.push(new InvoiceLine_1.InvoiceLine("1", "Prestation de conseil stratégique", 5, 800.00, 0.20, EnumInvoiceType_1.TaxCategoryCode.STANDARD, "DAY"));
    invoice.lines.push(new InvoiceLine_1.InvoiceLine("2", "Formation équipe", 3, 450.00, 0.20, EnumInvoiceType_1.TaxCategoryCode.STANDARD, "HUR"));
    // 4. Générer le XML
    info('Génération du XML Factur-X...');
    const xml = invoice.generateXml(true);
    const xmlFilename = `${invoiceNumber}.xml`;
    fs_1.default.writeFileSync(xmlFilename, xml);
    success(`XML généré: ${xmlFilename}`);
    // 5. Générer le PDF
    info('Génération du PDF...');
    const template = new InvoiceTemplateFancy_1.InvoiceTemplateFancy();
    const pdfBytes = await template.render(invoice);
    // 6. Embarquer le XML dans le PDF
    info('Embedding XML dans PDF...');
    const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
    await pdfDoc.attach((0, pdf_lib_1.utf8Encode)(xml), 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X XML Invoice',
        creationDate: new Date(),
        modificationDate: new Date()
    });
    pdfDoc.setTitle(`Facture ${header.invoiceNumber}`);
    pdfDoc.setSubject('Facture électronique Factur-X');
    pdfDoc.setAuthor(seller.name);
    pdfDoc.setKeywords(['facture', 'factur-x', 'b2b']);
    const pdfFilename = `${invoiceNumber}.pdf`;
    fs_1.default.writeFileSync(pdfFilename, await pdfDoc.save());
    success(`PDF généré: ${pdfFilename}`);
    // 7. Afficher le récapitulatif
    const summary = invoice.finalizeTotals();
    console.log('');
    info('RÉCAPITULATIF:');
    console.log(`  Numéro:         ${invoice.header.invoiceNumber}`);
    console.log(`  Date:           ${invoice.header.invoiceDate.toLocaleDateString('fr-FR')}`);
    console.log(`  Total HT:       ${summary.taxBasis.toFixed(2)} €`);
    console.log(`  TVA:            ${summary.taxTotal.toFixed(2)} €`);
    console.log(`  Total TTC:      ${summary.grandTotal.toFixed(2)} €`);
    console.log('');
    success('Facture générée avec succès !');
}
/**
 * Génère un devis interactif
 */
async function generateQuote() {
    info('Génération d\'un devis (Pro Forma)');
    console.log('');
    const profile = EnumInvoiceType_1.FacturxProfile.EN16931;
    info(`Profil sélectionné: ${profile}`);
    // Données de base
    const sellerAddress = new HeaderTradeAgreement_1.PostalAddress("123 Rue du Commerce", "Paris", "75001", "FR");
    const seller = new HeaderTradeAgreement_1.TradeParty("Ma Société SAS", sellerAddress, "FR12345678901");
    const buyerAddress = new HeaderTradeAgreement_1.PostalAddress("45 Avenue Prospect", "Lyon", "69001", "FR");
    const buyer = new HeaderTradeAgreement_1.TradeParty("Prospect XYZ SARL", buyerAddress, "FR98765432100");
    const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const header = new DocumentHeader_1.DocumentHeader(quoteNumber, quoteNumber, "DEVIS", new Date(), new Date(), EnumInvoiceType_1.DocTypeCode.PRO_FORMAT // 384 = Pro forma / Quote
    );
    header.notes = [
        "Devis valable 30 jours à compter de la date d'émission",
        "Acompte de 30% à la commande, solde à 30 jours",
        "Prix exprimés en euros HT"
    ];
    const payment = new PaymentDetails_1.PaymentDetails("58", "FR7630004000031234567890143", "BNPAFRPPXXX", undefined, "Acompte 30% à la commande - Solde à 30 jours");
    const quote = new FacturXInvoice_1.FacturXInvoice(profile, header, seller, buyer, payment);
    // Lignes du devis
    quote.lines.push(new InvoiceLine_1.InvoiceLine("1", "Développement application web sur mesure", 40, 650.00, 0.20, EnumInvoiceType_1.TaxCategoryCode.STANDARD, "DAY"));
    quote.lines.push(new InvoiceLine_1.InvoiceLine("2", "Design UI/UX", 10, 550.00, 0.20, EnumInvoiceType_1.TaxCategoryCode.STANDARD, "DAY"));
    // Remise commerciale
    quote.docAllowanceCharges.push(new AllowanceCharge_1.AllowanceCharge(false, 1500.00, "Remise lancement - Nouveau client", "PROMO", 0.20));
    // Générer XML
    info('Génération du XML...');
    const xml = quote.generateXml(true);
    const xmlFilename = `${quoteNumber}.xml`;
    fs_1.default.writeFileSync(xmlFilename, xml);
    success(`XML généré: ${xmlFilename}`);
    // Générer PDF
    info('Génération du PDF...');
    const template = new InvoiceTemplateBrand_1.InvoiceTemplateBrand();
    const pdfBytes = await template.render(quote);
    const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
    await pdfDoc.attach((0, pdf_lib_1.utf8Encode)(xml), 'factur-x.xml', {
        mimeType: 'application/xml',
        description: 'Factur-X Quotation',
        creationDate: new Date(),
        modificationDate: new Date()
    });
    pdfDoc.setTitle(`Devis ${header.invoiceNumber}`);
    pdfDoc.setSubject('Devis / Quotation - Pro Forma');
    pdfDoc.setAuthor(seller.name);
    const pdfFilename = `${quoteNumber}.pdf`;
    fs_1.default.writeFileSync(pdfFilename, await pdfDoc.save());
    success(`PDF généré: ${pdfFilename}`);
    // Récapitulatif
    const summary = quote.finalizeTotals();
    console.log('');
    info('RÉCAPITULATIF DEVIS:');
    console.log(`  Numéro:         ${quote.header.invoiceNumber}`);
    console.log(`  Date:           ${quote.header.invoiceDate.toLocaleDateString('fr-FR')}`);
    console.log(`  Total HT:       ${summary.taxBasis.toFixed(2)} €`);
    console.log(`  TVA:            ${summary.taxTotal.toFixed(2)} €`);
    console.log(`  Total TTC:      ${summary.grandTotal.toFixed(2)} €`);
    console.log(`  Acompte 30%:    ${(summary.grandTotal * 0.30).toFixed(2)} €`);
    console.log('');
    success('Devis généré avec succès !');
}
/**
 * Valide un fichier XML Factur-X
 */
async function validateXml(xmlPath) {
    if (!xmlPath) {
        error('Veuillez spécifier le chemin du fichier XML à valider');
        console.log('Usage: npm run cli validate <fichier.xml>');
        process.exit(1);
    }
    if (!fs_1.default.existsSync(xmlPath)) {
        error(`Fichier non trouvé: ${xmlPath}`);
        process.exit(1);
    }
    info(`Validation du fichier: ${xmlPath}`);
    try {
        const xmlContent = fs_1.default.readFileSync(xmlPath, 'utf-8');
        // Validation basique de la structure XML
        if (!xmlContent.includes('CrossIndustryInvoice')) {
            warn('Le fichier ne semble pas être un document Factur-X valide');
        }
        // Vérifier la présence des éléments obligatoires
        const requiredElements = [
            'ExchangedDocumentContext',
            'ExchangedDocument',
            'SupplyChainTradeTransaction'
        ];
        let valid = true;
        for (const element of requiredElements) {
            if (!xmlContent.includes(element)) {
                error(`Élément obligatoire manquant: ${element}`);
                valid = false;
            }
        }
        if (valid) {
            success('Fichier XML valide !');
            info('Note: Pour une validation XSD complète, utilisez un validateur externe');
        }
        else {
            error('Fichier XML invalide');
            process.exit(1);
        }
    }
    catch (err) {
        error(`Erreur lors de la validation: ${err.message}`);
        process.exit(1);
    }
}
/**
 * Point d'entrée principal
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    try {
        switch (command) {
            case 'invoice':
                await generateInvoice();
                break;
            case 'quote':
                await generateQuote();
                break;
            case 'order':
                warn('Order-X generation coming soon!');
                info('Use "quote" command for now (Pro Forma)');
                break;
            case 'validate':
                await validateXml(args[1]);
                break;
            default:
                error(`Commande inconnue: ${command}`);
                console.log('Utilisez "npm run cli help" pour voir les commandes disponibles');
                process.exit(1);
        }
    }
    catch (err) {
        error(`Erreur: ${err.message}`);
        if (err.stack) {
            console.log(err.stack);
        }
        process.exit(1);
    }
}
// Exécuter le CLI si appelé directement
if (require.main === module) {
    main().catch((err) => {
        error(`Erreur fatale: ${err.message}`);
        process.exit(1);
    });
}
