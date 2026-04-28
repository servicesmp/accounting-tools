"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxTotal = exports.FACTURX_DEFAULTS = exports.PaymentMeansCode = exports.FacturxDocumentType = exports.FacturXInvoice = void 0;
exports.generateFacturxXml = generateFacturxXml;
exports.validateFacturxXml = validateFacturxXml;
exports.createMinimalInvoice = createMinimalInvoice;
const EnumInvoiceType_1 = require("./EnumInvoiceType");
/**********************************************************************************************
 * FacturXInvoice.ts
 *
 * Gère une facture Factur-X conforme aux standards européens (EN 16931) et français (X-Factur).
 *
 * FONCTIONNALITÉS :
 *  - Support des profils Factur-X : MINIMUM, BASIC, BASICWL, EN16931, EXTENDED
 *  - Génération XML conforme avec tous les espaces de noms requis
 *  - Gestion complète des taxes (TVA, exemptions, taux multiples)
 *  - Support des remises et frais au niveau document et ligne
 *  - Validation des données selon le profil sélectionné
 *  - Calcul automatique des totaux avec arrondis corrects
 *
 * CONFORMITÉ :
 *  - Norme EN 16931 (factures électroniques européennes)
 *  - Standard Factur-X (France/Allemagne)
 *  - Format CII (Cross Industry Invoice) UN/CEFACT
 *
 * USAGE :
 *  const invoice = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);
 *  invoice.lines.push(new InvoiceLine(...));
 *  const xml = invoice.generateXml();
 **********************************************************************************************/
const xmlbuilder2_1 = require("xmlbuilder2");
const TaxCalculator_1 = require("./TaxCalculator");
const EnumInvoiceType_2 = require("./EnumInvoiceType");
const ConstanteInvoiceData_1 = require("./ConstanteInvoiceData");
//------------------------------------
//  STRUCTURES DE DONNÉES
//------------------------------------
/**
 * Représente le total des taxes pour une catégorie donnée
 * Utilisé pour la ventilation des taxes dans le XML final
 */
class TaxTotal {
    constructor(
    /** Catégorie de taxe (S=Standard, Z=Zero rated, E=Exempt, etc.) */
    taxCategory, 
    /** Taux de taxe en décimal (ex: 0.20 pour 20%) */
    taxRate, 
    /** Montant hors taxe soumis à cette taxe */
    taxableAmount, 
    /** Montant de taxe calculé */
    taxAmount) {
        this.taxCategory = taxCategory;
        this.taxRate = taxRate;
        this.taxableAmount = taxableAmount;
        this.taxAmount = taxAmount;
    }
}
exports.TaxTotal = TaxTotal;
//------------------------------------
//  CLASSE PRINCIPALE FacturXInvoice
//------------------------------------
/**
 * Classe principale pour gérer une facture Factur-X
 *
 * Cette classe encapsule toutes les données nécessaires à la génération
 * d'une facture électronique conforme aux standards européens.
 */
class FacturXInvoice {
    /**
     * Constructeur de la facture Factur-X
     *
     * @param profile Profil Factur-X à utiliser (détermine les champs obligatoires/interdits)
     * @param header En-tête du document (numéro, date, type, etc.)
     * @param seller Informations du vendeur/émetteur
     * @param buyer Informations de l'acheteur
     * @param payment Détails de paiement (IBAN, échéance, etc.)
     * @param lines Lignes de facture (optionnel, peut être ajouté après)
     */
    constructor(profile, header, seller, buyer, payment, lines = []) {
        this.profile = profile;
        this.header = header;
        this.seller = seller;
        this.buyer = buyer;
        this.payment = payment;
        this.lines = lines;
        /** Documents référencés ou pièces jointes */
        this.additionalDocs = [];
        /** Remises ou frais appliqués au niveau document */
        this.docAllowanceCharges = [];
        // ========== CHAMPS TECHNIQUES ==========
        /** Code devise ISO (EUR, USD, GBP, etc.) */
        this.currency = "EUR";
        /** Calculateur de taxes avec gestion des arrondis */
        this.calculator = new TaxCalculator_1.TaxCalculator('line');
        /** Totaux de taxes par catégorie (calculés automatiquement) */
        this.taxTotals = [];
    }
    //-------------------------------------
    // VALIDATION DU PROFIL
    //-------------------------------------
    /**
     * Valide que la facture respecte les contraintes du profil sélectionné
     *
     * Chaque profil Factur-X a ses propres règles :
     * - MINIMUM : données minimales uniquement
     * - BASIC : informations de base + quelques détails
     * - EN16931 : conformité totale EN 16931 (obligatoire pour B2B en Europe)
     * - EXTENDED : toutes les fonctionnalités possibles
     *
     * @throws Error si la facture ne respecte pas les contraintes du profil
     */
    validateProfile() {
        const policy = ConstanteInvoiceData_1.PROFILE_POLICIES[this.profile];
        // 1) Vérification des champs interdits pour ce profil
        for (const field of policy.forbiddenFields) {
            if (this.hasField(field)) {
                throw new Error(`[FacturX] Le profil ${this.profile} interdit le champ '${field}', mais il est renseigné.`);
            }
        }
        // 2) Vérification des champs obligatoires pour ce profil
        for (const field of policy.mandatoryFields) {
            if (!this.hasField(field)) {
                throw new Error(`[FacturX] Le profil ${this.profile} exige le champ '${field}', qui est manquant.`);
            }
        }
        // 3) Règles spécifiques EN16931 (obligatoire pour factures B2B européennes)
        if (this.profile === EnumInvoiceType_2.FacturxProfile.EN16931) {
            this.validateEN16931Compliance();
        }
    }
    /**
     * Validation spécifique pour la conformité EN 16931
     * Cette norme est obligatoire pour les factures B2B en Europe depuis 2019
     */
    validateEN16931Compliance() {
        // Le vendeur DOIT avoir un numéro de TVA
        if (!this.seller?.vatNumber) {
            throw new Error(`[FacturX] Profil EN16931: le vendeur doit avoir un numéro de TVA (vatNumber).`);
        }
        // Vérification du format du numéro de TVA (basique)
        if (this.seller.vatNumber.length < 4) {
            throw new Error(`[FacturX] Profil EN16931: le numéro de TVA semble invalide (trop court).`);
        }
        // Au moins une ligne de facture doit exister
        if (this.lines.length === 0) {
            throw new Error(`[FacturX] Profil EN16931: au moins une ligne de facture est requise.`);
        }
        // Tous les montants doivent être cohérents
        for (const line of this.lines) {
            if (line.quantity <= 0) {
                throw new Error(`[FacturX] Profil EN16931: la quantité de la ligne ${line.id} doit être positive.`);
            }
            if (line.unitPrice < 0) {
                throw new Error(`[FacturX] Profil EN16931: le prix unitaire de la ligne ${line.id} ne peut pas être négatif.`);
            }
        }
    }
    //-------------------------------------
    // CALCULS FINANCIERS
    //-------------------------------------
    /**
     * Calcule tous les totaux de la facture
     *
     * Effectue les calculs suivants :
     * - Total des lignes (HT)
     * - Application des remises/frais document
     * - Calcul des taxes par catégorie
     * - Total TTC final
     *
     * Gère correctement les arrondis selon les règles comptables européennes.
     *
     * @returns Résumé monétaire complet avec ventilation des taxes
     */
    finalizeTotals() {
        // 1) Préparer les données des lignes pour le calculateur
        const linesData = this.lines.map(line => ({
            ...line,
            // S'assurer que tous les champs nécessaires sont présents
            netAmount: line.lineTotal || (line.quantity * line.unitPrice),
            taxRate: line.vatRate,
            taxCategory: line.taxCategoryCode || EnumInvoiceType_1.TaxCategoryCode.STANDARD
        }));
        // 2) Récupérer les remises/frais au niveau document
        const docAllowanceCharges = this.docAllowanceCharges;
        // 3) Calculer via le TaxCalculator (gère les arrondis et multi-taux)
        const summary = this.calculator.computeSummary(this.lines, docAllowanceCharges);
        // 4) Mettre à jour les totaux de taxes par catégorie
        this.updateTaxTotals(summary);
        return summary;
    }
    /**
     * Met à jour la liste des totaux par catégorie de taxe
     * Utilisé pour la génération du XML (section taxes)
     */
    updateTaxTotals(summary) {
        this.taxTotals = summary.taxSummaries.map(ts => new TaxTotal(ts.category, ts.rate, ts.taxable, ts.taxAmount));
    }
    //-------------------------------------
    // GÉNÉRATION XML
    //-------------------------------------
    /**
     * Génère le XML Factur-X complet et conforme
     *
     * @param checkProfile Si true, valide la conformité au profil avant génération
     * @returns String XML prêt à être sauvegardé ou transmis
     */
    generateXml(checkProfile = true) {
        // 1) Validation optionnelle du profil
        console.log(`[FacturX] Génération XML pour le profil: ${this.profile}`);
        if (checkProfile) {
            this.validateProfile();
            console.log(`[FacturX] Validation du profil: ${this.profile} réussie.`);
        }
        // 2) Calcul des totaux finaux
        const summary = this.finalizeTotals();
        console.log(`[FacturX] Totaux calculés: ${JSON.stringify(summary)}`);
        // 3) Génération du XML
        const xml = this.generateFacturxXmlInternal(summary);
        console.log(`[FacturX] XML généré avec succès.`);
        const str = this.validateGeneratedXml(xml);
        console.log(`[FacturX] Validation du XML réussie: ${str}`);
        // AJOUT : Validation stricte du XML généré
        if (!this.validateGeneratedXml(xml)) {
            throw new Error('[FacturX] Le XML généré ne respecte pas la structure Factur-X');
        }
        // 4) Retourner le XML final
        return xml;
    }
    /**
     * Validation stricte du XML généré
     */
    validateGeneratedXml(xml) {
        // Vérifier la présence de tous les espaces de noms requis
        const requiredNamespaces = [
            'xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"',
            'xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"',
            'xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"',
            'xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"'
        ];
        for (const ns of requiredNamespaces) {
            if (!xml.includes(ns)) {
                console.error(`Espace de noms manquant: ${ns}`);
                return false;
            }
        }
        // Vérifier la structure de base
        const requiredElements = [
            '<rsm:CrossIndustryInvoice',
            '<rsm:ExchangedDocumentContext>',
            '<ram:GuidelineSpecifiedDocumentContextParameter>',
            '<rsm:ExchangedDocument>',
            '<rsm:SupplyChainTradeTransaction>'
        ];
        for (const element of requiredElements) {
            if (!xml.includes(element)) {
                console.error(`Élément manquant: ${element}`);
                return false;
            }
        }
        // Vérifier que l'URN du profil est correct
        const profileUrn = this.getGuidelineURN();
        if (!xml.includes(profileUrn)) {
            console.error(`URN de profil manquant: ${profileUrn}`);
            return false;
        }
        return true;
    }
    /**
     * Génération interne du XML avec la structure correcte Factur-X
     */
    generateFacturxXmlInternal(summary) {
        // Création du document XML avec TOUS les espaces de noms requis dans le bon ordre
        const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
            .ele('rsm:CrossIndustryInvoice', {
            // ORDRE IMPORTANT des espaces de noms selon le standard Factur-X
            'xmlns:qdt': 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
            'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
            'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
            'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
        });
        // Construction des sections principales
        this.buildDocumentContext(root);
        this.buildDocumentHeader(root);
        this.buildTradeTransaction(root, summary);
        // Génération du XML final
        return root.end({ prettyPrint: true, indent: '  ' });
    }
    //-------------------------------------
    // CONSTRUCTION DES SECTIONS XML
    //-------------------------------------
    /**
     * Section 1 : Contexte du document avec paramètres corrects
     */
    /**
     * Section 1 : Contexte du document avec paramètres Factur-X conformes
     *
     * Selon la spécification Factur-X 1.07.2:
     * - GuidelineSpecifiedDocumentContextParameter: OBLIGATOIRE (identifie le profil)
     * - BusinessProcessSpecifiedDocumentContextParameter: OPTIONNEL (processus métier spécifique)
     *
     * Référence: Section 5.2.1 de la spécification Factur-X 1.07.2
     */
    buildDocumentContext(root) {
        const contextNode = root.ele('rsm:ExchangedDocumentContext');
        // Paramètre de profil Factur-X (OBLIGATOIRE)
        const guidelineParam = contextNode.ele('ram:GuidelineSpecifiedDocumentContextParameter');
        guidelineParam.ele('ram:ID').txt(this.getGuidelineURN());
        // BusinessProcessSpecifiedDocumentContextParameter est OPTIONNEL
        // Il n'est inclus que si un processus métier spécifique est défini
        // Pour la conformité standard, nous ne l'incluons pas
        // Si nécessaire à l'avenir, ajouter une propriété businessProcessId au constructeur
    }
    /**
     * Section 2 : En-tête du document (numéro, date, type, notes)
     */
    buildDocumentHeader(root) {
        const docNode = root.ele('rsm:ExchangedDocument');
        // Informations principales
        docNode.ele('ram:ID').txt(this.header.id);
        docNode.ele('ram:TypeCode').txt(this.header.typeCode.toString());
        // Date d'émission au format YYYYMMDD
        docNode.ele('ram:IssueDateTime')
            .ele('udt:DateTimeString', { format: '102' })
            .txt(this.formatDate(this.header.issueDate));
        // Nom du document (optionnel)
        if (this.header.name) {
            docNode.ele('ram:Name').txt(this.header.name);
        }
        // Notes et commentaires
        for (const note of this.header.notes || []) {
            docNode.ele('ram:IncludedNote')
                .ele('ram:Content').txt(note);
        }
    }
    /**
     * Section 3 : Transaction commerciale (parties, livraison, règlement, lignes)
     */
    buildTradeTransaction(root, summary) {
        const tradeNode = root.ele('rsm:SupplyChainTradeTransaction');
        // 3.1 Accord commercial (vendeur/acheteur)
        this.buildTradeAgreement(tradeNode);
        // 3.2 Livraison
        this.buildTradeDelivery(tradeNode);
        // 3.3 Règlement (taxes, totaux, paiement)
        this.buildTradeSettlement(tradeNode, summary);
        // 3.4 Lignes de facture
        this.buildTradeLines(tradeNode);
    }
    /**
     * Section 3.1 : Accord commercial (vendeur et acheteur)
     */
    buildTradeAgreement(tradeNode) {
        const agreementNode = tradeNode.ele('ram:ApplicableHeaderTradeAgreement');
        // Référence commande acheteur (si disponible)
        if (this.buyerOrderReference) {
            const orderRef = agreementNode.ele('ram:BuyerOrderReferencedDocument');
            orderRef.ele('ram:IssuerAssignedID').txt(this.buyerOrderReference);
        }
        // Informations vendeur
        this.buildSellerInfo(agreementNode);
        // Informations acheteur  
        this.buildBuyerInfo(agreementNode);
    }
    /**
     * Informations détaillées du vendeur
     */
    buildSellerInfo(agreementNode) {
        const sellerNode = agreementNode.ele('ram:SellerTradeParty');
        // Nom commercial
        sellerNode.ele('ram:Name').txt(this.seller.name);
        // Adresse postale complète
        const sAddr = sellerNode.ele('ram:PostalTradeAddress');
        sAddr.ele('ram:PostcodeCode').txt(this.seller.postalAddress.postalCode);
        sAddr.ele('ram:LineOne').txt(this.seller.postalAddress.line1);
        if (this.seller.postalAddress.line2) {
            sAddr.ele('ram:LineTwo').txt(this.seller.postalAddress.line2);
        }
        sAddr.ele('ram:CityName').txt(this.seller.postalAddress.city);
        sAddr.ele('ram:CountryID').txt(this.seller.postalAddress.countryCode);
        // Numéro de TVA (obligatoire pour profils avancés)
        if (this.seller.vatNumber) {
            const taxReg = sellerNode.ele('ram:SpecifiedTaxRegistration');
            taxReg.ele('ram:ID', { schemeID: 'VA' }).txt(this.seller.vatNumber);
        }
        // Identifiant légal (SIRET, etc.)
        if ('legalRegistrationId' in this.seller && this.seller.legalRegistrationId) {
            const legalReg = sellerNode.ele('ram:URIUniversalCommunication');
            legalReg.ele('ram:URIID', { schemeID: 'EM' }).txt(this.seller.legalRegistrationId);
        }
        // Contacts (téléphone, email)
        this.buildContactInfo(sellerNode, this.seller);
    }
    /**
     * Informations détaillées de l'acheteur
     */
    buildBuyerInfo(agreementNode) {
        const buyerNode = agreementNode.ele('ram:BuyerTradeParty');
        // Nom commercial
        buyerNode.ele('ram:Name').txt(this.buyer.name);
        // Adresse postale complète
        const bAddr = buyerNode.ele('ram:PostalTradeAddress');
        bAddr.ele('ram:PostcodeCode').txt(this.buyer.postalAddress.postalCode);
        bAddr.ele('ram:LineOne').txt(this.buyer.postalAddress.line1);
        if (this.buyer.postalAddress.line2) {
            bAddr.ele('ram:LineTwo').txt(this.buyer.postalAddress.line2);
        }
        bAddr.ele('ram:CityName').txt(this.buyer.postalAddress.city);
        bAddr.ele('ram:CountryID').txt(this.buyer.postalAddress.countryCode);
        // Numéro de TVA (si disponible)
        if (this.buyer.vatNumber) {
            const buyerTaxReg = buyerNode.ele('ram:SpecifiedTaxRegistration');
            buyerTaxReg.ele('ram:ID', { schemeID: 'VA' }).txt(this.buyer.vatNumber);
        }
        // Contacts
        this.buildContactInfo(buyerNode, this.buyer);
    }
    /**
     * Ajout des informations de contact (téléphone, email)
     */
    buildContactInfo(partyNode, party) {
        if ('contacts' in party && party.contacts && party.contacts.length > 0) {
            for (const contact of party.contacts) {
                const contactNode = partyNode.ele('ram:DefinedTradeContact');
                if (contact.contactName) {
                    contactNode.ele('ram:PersonName').txt(contact.contactName);
                }
                if (contact.contactPhoneNumber) {
                    const phoneNode = contactNode.ele('ram:TelephoneUniversalCommunication');
                    phoneNode.ele('ram:CompleteNumber').txt(contact.contactPhoneNumber);
                }
                if (contact.contactEmail) {
                    const emailNode = contactNode.ele('ram:EmailURIUniversalCommunication');
                    emailNode.ele('ram:URIID').txt(contact.contactEmail);
                }
            }
        }
    }
    /**
     * Section 3.2 : Informations de livraison
     */
    buildTradeDelivery(tradeNode) {
        const deliveryNode = tradeNode.ele('ram:ApplicableHeaderTradeDelivery');
        // Destinataire de livraison (si différent de l'acheteur)
        if (this.deliveryParty) {
            const shipToNode = deliveryNode.ele('ram:ShipToTradeParty');
            shipToNode.ele('ram:Name').txt(this.deliveryParty.name);
            // Adresse de livraison complète
            const deliveryAddr = shipToNode.ele('ram:PostalTradeAddress');
            deliveryAddr.ele('ram:PostcodeCode').txt(this.deliveryParty.postalAddress.postalCode);
            deliveryAddr.ele('ram:LineOne').txt(this.deliveryParty.postalAddress.line1);
            if (this.deliveryParty.postalAddress.line2) {
                deliveryAddr.ele('ram:LineTwo').txt(this.deliveryParty.postalAddress.line2);
            }
            deliveryAddr.ele('ram:CityName').txt(this.deliveryParty.postalAddress.city);
            deliveryAddr.ele('ram:CountryID').txt(this.deliveryParty.postalAddress.countryCode);
        }
        // Date de livraison (si spécifiée)
        if ('deliveryDate' in this.header && this.header.deliveryDate) {
            deliveryNode.ele('ram:ActualDeliverySupplyChainEvent')
                .ele('ram:OccurrenceDateTime')
                .ele('udt:DateTimeString', { format: '102' })
                .txt(this.formatDate(this.header.issueDate));
        }
    }
    /**
     * Section 3.3 : Règlement (taxes, totaux, conditions de paiement)
     */
    buildTradeSettlement(tradeNode, summary) {
        const settlementNode = tradeNode.ele('ram:ApplicableHeaderTradeSettlement');
        // Devise de facturation
        settlementNode.ele('ram:InvoiceCurrencyCode').txt(this.currency);
        // Bénéficiaire du paiement (si différent du vendeur)
        if (this.payeeParty) {
            const payeeNode = settlementNode.ele('ram:PayeeTradeParty');
            payeeNode.ele('ram:Name').txt(this.payeeParty.name);
        }
        // Remises et frais au niveau document
        this.buildDocumentAllowanceCharges(settlementNode);
        // Taxes par catégorie
        this.buildTaxBreakdown(settlementNode, summary);
        // Résumé monétaire
        this.buildMonetarySummation(settlementNode, summary);
        // Conditions de paiement
        this.buildPaymentTerms(settlementNode);
    }
    /**
     * Remises et frais appliqués au niveau du document
     */
    buildDocumentAllowanceCharges(settlementNode) {
        for (const allowanceCharge of this.docAllowanceCharges) {
            this.addAllowanceChargeNode(settlementNode, allowanceCharge, true);
        }
    }
    /**
     * Ventilation des taxes par catégorie et taux
     */
    buildTaxBreakdown(settlementNode, summary) {
        // Une section par taux de taxe
        for (const taxSummary of summary.taxSummaries) {
            const taxNode = settlementNode.ele('ram:ApplicableTradeTax');
            // Montant de taxe calculé
            taxNode.ele('ram:CalculatedAmount').txt(taxSummary.taxAmount.toFixed(2));
            // Type de taxe (toujours VAT pour la TVA)
            taxNode.ele('ram:TypeCode').txt('VAT');
            // Base de calcul (montant HT soumis à cette taxe)
            taxNode.ele('ram:BasisAmount').txt(taxSummary.taxable.toFixed(2));
            // Catégorie (S=Standard, Z=Zéro, E=Exempté, etc.)
            taxNode.ele('ram:CategoryCode').txt(taxSummary.category);
            // Taux en pourcentage
            taxNode.ele('ram:RateApplicablePercent').txt(taxSummary.rate.toFixed(2));
        }
        // Total général des taxes
        const taxTotalNode = settlementNode.ele('ram:TaxTotal');
        taxTotalNode.ele('ram:TaxTotalAmount').txt(summary.taxTotal.toFixed(2));
    }
    /**
     * Résumé monétaire global de la facture
     */
    buildMonetarySummation(settlementNode, summary) {
        const monetaryNode = settlementNode.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation');
        // Total des lignes HT (avant remises/frais document)
        monetaryNode.ele('ram:LineTotalAmount').txt(summary.lineTotal.toFixed(2));
        // Montant des remises au niveau document (si applicable)
        if (summary.allowanceTotal && summary.allowanceTotal > 0) {
            monetaryNode.ele('ram:AllowanceTotalAmount').txt(summary.allowanceTotal.toFixed(2));
        }
        // Montant des frais au niveau document (si applicable)
        if (summary.chargeTotal && summary.chargeTotal > 0) {
            monetaryNode.ele('ram:ChargeTotalAmount').txt(summary.chargeTotal.toFixed(2));
        }
        // Base de calcul des taxes (après remises/frais)
        monetaryNode.ele('ram:TaxBasisTotalAmount').txt(summary.taxBasis.toFixed(2));
        // Total des taxes
        monetaryNode.ele('ram:TaxTotalAmount').txt(summary.taxTotal.toFixed(2));
        // Total TTC final
        monetaryNode.ele('ram:GrandTotalAmount').txt(summary.grandTotal.toFixed(2));
        // Montant dû (peut différer du total si acomptes)
        monetaryNode.ele('ram:DuePayableAmount').txt(summary.grandTotal.toFixed(2));
    }
    /**
     * Conditions et moyens de paiement (STRUCTURE CORRIGÉE)
     */
    buildPaymentTerms(settlementNode) {
        // Moyen de paiement
        const paymentMeans = settlementNode.ele('ram:SpecifiedTradePaymentMeans');
        paymentMeans.ele('ram:TypeCode').txt(this.payment.paymentMeansCode);
        // CORRECTION : Structure correcte pour les informations bancaires
        if (this.payment.payeeIBAN) {
            const payeeAccount = paymentMeans.ele('ram:PayeePartyCreditorFinancialAccount');
            payeeAccount.ele('ram:IBANID').txt(this.payment.payeeIBAN);
            if (this.payment.payeeBIC) {
                const financialInstitution = payeeAccount.ele('ram:PayeeSpecifiedCreditorFinancialInstitution');
                financialInstitution.ele('ram:BICID').txt(this.payment.payeeBIC);
            }
        }
        // CORRECTION : Conditions de paiement dans la bonne section
        if (this.payment.dueDate || this.payment.paymentTermsText) {
            const paymentTerms = settlementNode.ele('ram:SpecifiedTradePaymentTerms');
            if (this.payment.dueDate) {
                paymentTerms.ele('ram:DueDateDateTime')
                    .ele('udt:DateTimeString', { format: '102' })
                    .txt(this.formatDate(this.payment.dueDate));
            }
            if (this.payment.paymentTermsText) {
                paymentTerms.ele('ram:Description').txt(this.payment.paymentTermsText);
            }
        }
    }
    /**
     * Section 3.4 : Lignes de facture détaillées
     */
    buildTradeLines(tradeNode) {
        for (const line of this.lines) {
            const lineItemNode = tradeNode.ele('ram:IncludedSupplyChainTradeLineItem');
            // Identification de la ligne
            const docLineNode = lineItemNode.ele('ram:AssociatedDocumentLineDocument');
            docLineNode.ele('ram:LineID').txt(line.id);
            // Description du produit/service
            const productNode = lineItemNode.ele('ram:SpecifiedTradeProduct');
            productNode.ele('ram:Name').txt(line.description);
            // Code produit (si disponible)
            if ('productCode' in line && line.productCode) {
                const productId = productNode.ele('ram:GlobalID');
                productId.ele('ram:SchemeID').txt('GTIN');
                productId.ele('ram:Value').txt(line.productCode);
            }
            // Accord commercial de la ligne (prix, remises ligne)
            this.buildLineTradeAgreement(lineItemNode, line);
            // Livraison de la ligne (quantités)
            this.buildLineTradeDelivery(lineItemNode, line);
            // Règlement de la ligne (taxes, totaux)
            this.buildLineTradeSettlement(lineItemNode, line);
        }
    }
    /**
     * Accord commercial au niveau ligne (prix, remises ligne)
     */
    buildLineTradeAgreement(lineItemNode, line) {
        const lineAgreement = lineItemNode.ele('ram:SpecifiedLineTradeAgreement');
        // Remises spécifiques à cette ligne
        for (const allowance of line.allowances || []) {
            this.addAllowanceChargeNode(lineAgreement, allowance, false);
        }
        // Frais spécifiques à cette ligne
        for (const charge of line.charges || []) {
            this.addAllowanceChargeNode(lineAgreement, charge, false);
        }
        // Prix unitaire brut (avant remises ligne)
        const grossPriceNode = lineAgreement.ele('ram:GrossPriceProductTradePrice');
        grossPriceNode.ele('ram:ChargeAmount').txt(line.unitPrice.toFixed(2));
        grossPriceNode.ele('ram:BasisQuantity', { unitCode: line.unitCode }).txt('1');
        // Prix unitaire net (après remises ligne, si applicable)
        const netPriceNode = lineAgreement.ele('ram:NetPriceProductTradePrice');
        const netPrice = this.calculateNetLinePrice(line);
        netPriceNode.ele('ram:ChargeAmount').txt(netPrice.toFixed(2));
        netPriceNode.ele('ram:BasisQuantity', { unitCode: line.unitCode }).txt('1');
    }
    /**
     * Livraison au niveau ligne (quantités facturées)
     */
    buildLineTradeDelivery(lineItemNode, line) {
        const lineDelivery = lineItemNode.ele('ram:SpecifiedLineTradeDelivery');
        // Quantité facturée
        lineDelivery.ele('ram:BilledQuantity', { unitCode: line.unitCode })
            .txt(line.quantity.toString());
        // Quantité livrée (si différente de la quantité facturée)
        if ('deliveredQuantity' in line && line.deliveredQuantity !== undefined) {
            lineDelivery.ele('ram:ActualDeliveredQuantity', { unitCode: line.unitCode })
                .txt(line.deliveredQuantity !== undefined ? line.deliveredQuantity.toString() : line.quantity.toString());
        }
    }
    /**
     * Règlement au niveau ligne (taxes et totaux)
     */
    buildLineTradeSettlement(lineItemNode, line) {
        const lineSettlement = lineItemNode.ele('ram:SpecifiedLineTradeSettlement');
        // Information sur la taxe applicable à cette ligne
        const taxNode = lineSettlement.ele('ram:ApplicableTradeTax');
        taxNode.ele('ram:TypeCode').txt('VAT');
        taxNode.ele('ram:CategoryCode').txt(line.taxCategoryCode || 'S');
        taxNode.ele('ram:RateApplicablePercent').txt((line.vatRate * 100).toFixed(2));
        // Période de facturation (si applicable)
        if ('billingPeriodStart' in line && 'billingPeriodEnd' in line) {
            const periodNode = lineSettlement.ele('ram:BillingSpecifiedPeriod');
            if (line.billingPeriodStart) {
                periodNode.ele('ram:StartDateTime')
                    .ele('udt:DateTimeString', { format: '102' })
                    .txt(this.formatDate(line.billingPeriodStart));
            }
            if (line.billingPeriodEnd) {
                periodNode.ele('ram:EndDateTime')
                    .ele('udt:DateTimeString', { format: '102' })
                    .txt(this.formatDate(line.billingPeriodEnd));
            }
        }
        // Total de la ligne (HT)
        const lineSummation = lineSettlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation');
        lineSummation.ele('ram:LineTotalAmount').txt(line.lineTotal.toFixed(2));
    }
    //-------------------------------------
    // FONCTIONS UTILITAIRES
    //-------------------------------------
    /**
     * Ajoute un nœud remise/frais dans le XML
     *
     * @param parentNode Nœud parent (settlement ou lineAgreement)
     * @param allowanceCharge Objet remise/frais à ajouter
     * @param isDocumentLevel true si c'est au niveau document, false si niveau ligne
     */
    addAllowanceChargeNode(parentNode, allowanceCharge, isDocumentLevel) {
        const acNode = parentNode.ele('ram:SpecifiedTradeAllowanceCharge');
        // Indicateur : true = frais, false = remise
        acNode.ele('ram:ChargeIndicator')
            .ele('udt:Indicator').txt(allowanceCharge.chargeIndicator ? "true" : "false");
        // Séquence (optionnel, pour l'ordre d'application)
        if ('sequenceNumeric' in allowanceCharge && allowanceCharge.sequenceNumeric) {
            acNode.ele('ram:SequenceNumeric').txt(allowanceCharge.sequenceNumeric.toString());
        }
        // Montant de la remise/frais
        acNode.ele('ram:ActualAmount').txt(allowanceCharge.actualAmount.toFixed(2));
        // Motif en texte libre
        if (allowanceCharge.reason) {
            acNode.ele('ram:Reason').txt(allowanceCharge.reason);
        }
        // Code motif normalisé (ex: 95 pour remise commerciale)
        if (allowanceCharge.reasonCode) {
            acNode.ele('ram:ReasonCode').txt(allowanceCharge.reasonCode);
        }
        // Pourcentage (si la remise/frais est en %)
        if ('percentage' in allowanceCharge && allowanceCharge.percentage !== undefined) {
            acNode.ele('ram:CalculationPercent').txt(allowanceCharge.percentage.toFixed(2));
        }
        // Base de calcul (montant sur lequel s'applique le %)
        if ('basisAmount' in allowanceCharge && allowanceCharge.basisAmount !== undefined) {
            acNode.ele('ram:BasisAmount').txt(allowanceCharge.basisAmount.toFixed(2));
        }
        // Taxe applicable à la remise/frais
        if (allowanceCharge.taxRate !== undefined) {
            const taxNode = acNode.ele('ram:CategoryTradeTax');
            taxNode.ele('ram:TypeCode').txt('VAT');
            taxNode.ele('ram:CategoryCode').txt(allowanceCharge.taxCategoryCode || "S");
            taxNode.ele('ram:RateApplicablePercent').txt((allowanceCharge.taxRate * 100).toFixed(2));
        }
        // Période d'application (pour les remises/frais temporaires)
        if (allowanceCharge.startDate || allowanceCharge.endDate) {
            const periodNode = acNode.ele('ram:EffectiveSpecifiedPeriod');
            if (allowanceCharge.startDate) {
                periodNode.ele('ram:StartDateTime')
                    .ele('udt:DateTimeString', { format: "102" })
                    .txt(this.formatDate(allowanceCharge.startDate));
            }
            if (allowanceCharge.endDate) {
                periodNode.ele('ram:EndDateTime')
                    .ele('udt:DateTimeString', { format: "102" })
                    .txt(this.formatDate(allowanceCharge.endDate));
            }
        }
    }
    /**
     * Calcule le prix net d'une ligne après application des remises/frais ligne
     */
    calculateNetLinePrice(line) {
        let netPrice = line.unitPrice;
        // Application des remises ligne (diminuent le prix)
        for (const allowance of line.allowances || []) {
            if (!allowance.chargeIndicator) { // false = remise
                netPrice -= allowance.actualAmount;
            }
        }
        // Application des frais ligne (augmentent le prix)
        for (const charge of line.charges || []) {
            if (charge.chargeIndicator) { // true = frais
                netPrice += charge.actualAmount;
            }
        }
        return Math.max(0, netPrice); // Prix ne peut pas être négatif
    }
    /**
     * Génère l'URN du profil Factur-X selon le standard officiel
     */
    /**
     * Retourne l'URN du profil selon la spécification Factur-X 1.07.2
     * Référence: https://fnfe-mpe.org/factur-x/factur-x_en/
     */
    getGuidelineURN() {
        switch (this.profile) {
            case EnumInvoiceType_2.FacturxProfile.MINIMUM:
                // Profil MINIMUM: Données minimales (montant total, devise, dates)
                return "urn:factur-x.eu:1p0:minimum";
            case EnumInvoiceType_2.FacturxProfile.BASICWL:
                // Profil BASIC WL (Without Lines): Conforme EN16931 mais sans détail des lignes
                return "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basicwl";
            case EnumInvoiceType_2.FacturxProfile.BASIC:
                // Profil BASIC: Conforme EN16931 avec lignes basiques
                return "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic";
            case EnumInvoiceType_2.FacturxProfile.EN16931:
                // Profil EN16931: Conformité complète (COMPLIANT) à la norme européenne
                return "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931";
            case EnumInvoiceType_2.FacturxProfile.EXTENDED:
                // Profil EXTENDED: Conformité complète + fonctionnalités étendues
                return "urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:extended";
            default:
                // Par défaut, utiliser BASIC (sécurité)
                return "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:basic";
        }
    }
    /**
     * Formate une date au format YYYYMMDD requis par le standard
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    /**
     * Vérifie si un champ existe dans l'objet (notation pointée supportée)
     */
    hasField(fieldPath) {
        const parts = fieldPath.split('.');
        let current = this;
        for (const part of parts) {
            if (current == null || !(part in current)) {
                return false;
            }
            current = current[part];
        }
        // Le champ existe s'il n'est pas null/undefined et pas une chaîne vide
        return current != null && current !== '';
    }
    //-------------------------------------
    // MÉTHODES D'ASSISTANCE PUBLIQUES
    //-------------------------------------
    /**
     * Ajoute une ligne de facture
     */
    addLine(line) {
        this.lines.push(line);
    }
    /**
     * Ajoute une remise au niveau document
     */
    addDocumentAllowance(allowance) {
        this.docAllowanceCharges.push(allowance);
    }
    /**
     * Ajoute un frais au niveau document
     */
    addDocumentCharge(charge) {
        this.docAllowanceCharges.push(charge);
    }
    /**
     * Retourne un résumé des totaux sans générer le XML
     */
    getTotalsSummary() {
        return this.finalizeTotals();
    }
    /**
     * Valide la facture et retourne les erreurs éventuelles
     * @returns Array des erreurs trouvées (vide si tout est OK)
     */
    validate() {
        const errors = [];
        try {
            this.validateProfile();
        }
        catch (error) {
            if (error instanceof Error) {
                errors.push(error.message);
            }
        }
        // Validations supplémentaires
        try {
            const summary = this.finalizeTotals();
            // Vérifier que les totaux sont cohérents
            if (summary.grandTotal < 0) {
                errors.push('[FacturX] Le total TTC ne peut pas être négatif');
            }
            if (summary.taxTotal < 0) {
                errors.push('[FacturX] Le total des taxes ne peut pas être négatif');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                errors.push(`[FacturX] Erreur de calcul: ${error.message}`);
            }
        }
        return errors;
    }
    /**
     * Génère un aperçu texte de la facture pour debug
     */
    getTextSummary() {
        const summary = this.finalizeTotals();
        return `
FACTURE FACTUR-X - ${this.profile}
================================
Numéro: ${this.header.id}
Date: ${this.header.issueDate.toLocaleDateString('fr-FR')}
Devise: ${this.currency}

Vendeur: ${this.seller.name}
Acheteur: ${this.buyer.name}

Lignes: ${this.lines.length}
Total HT: ${summary.lineTotal.toFixed(2)} ${this.currency}
Total TVA: ${summary.taxTotal.toFixed(2)} ${this.currency}
Total TTC: ${summary.grandTotal.toFixed(2)} ${this.currency}

Remises/Frais doc: ${this.docAllowanceCharges.length}
Profil valide: ${this.validate().length === 0 ? 'OUI' : 'NON'}
   `.trim();
    }
}
exports.FacturXInvoice = FacturXInvoice;
//-------------------------------------
// FONCTIONS EXPORTÉES STANDALONE
//-------------------------------------
/**
* Fonction utilitaire pour générer rapidement un XML Factur-X
* sans instancier la classe complète
*
* @param invoice Instance FacturXInvoice configurée
* @param summary Résumé monétaire précalculé
* @returns XML Factur-X complet
*/
function generateFacturxXml(invoice, summary) {
    return invoice.generateXml(true);
}
/**
* Valide qu'une chaîne XML est un Factur-X valide (validation basique)
*
* @param xmlString Chaîne XML à valider
* @returns true si le XML semble valide
*/
function validateFacturxXml(xmlString) {
    try {
        // Vérifications basiques de structure
        const requiredElements = [
            'rsm:CrossIndustryInvoice',
            'rsm:ExchangedDocumentContext',
            'rsm:ExchangedDocument',
            'rsm:SupplyChainTradeTransaction'
        ];
        for (const element of requiredElements) {
            if (!xmlString.includes(element)) {
                return false;
            }
        }
        // Vérifier les espaces de noms requis
        const requiredNamespaces = [
            'xmlns:rsm=',
            'xmlns:ram=',
            'xmlns:udt=',
            'xmlns:qdt='
        ];
        for (const ns of requiredNamespaces) {
            if (!xmlString.includes(ns)) {
                return false;
            }
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
* Crée une facture Factur-X minimale pour tests rapides
*
* @param invoiceNumber Numéro de facture
* @param sellerName Nom du vendeur
* @param buyerName Nom de l'acheteur
* @returns Instance FacturXInvoice basique
*/
function createMinimalInvoice(invoiceNumber, sellerName, buyerName) {
    // Cette fonction nécessiterait l'implémentation des classes DocumentHeader, TradeParty, etc.
    // Elle est fournie comme exemple d'API utilitaire
    throw new Error('createMinimalInvoice: À implémenter selon vos classes de données');
}
//-------------------------------------
// TYPES ET CONSTANTES EXPORTÉS
//-------------------------------------
/**
* Types de documents Factur-X supportés
*/
var FacturxDocumentType;
(function (FacturxDocumentType) {
    /** Facture standard */
    FacturxDocumentType[FacturxDocumentType["INVOICE"] = 380] = "INVOICE";
    /** Avoir (note de crédit) */
    FacturxDocumentType[FacturxDocumentType["CREDIT_NOTE"] = 381] = "CREDIT_NOTE";
    /** Facture de débit */
    FacturxDocumentType[FacturxDocumentType["DEBIT_NOTE"] = 383] = "DEBIT_NOTE";
    /** Facture corrective */
    FacturxDocumentType[FacturxDocumentType["CORRECTED_INVOICE"] = 384] = "CORRECTED_INVOICE";
    /** Facture pro forma */
    FacturxDocumentType[FacturxDocumentType["PROFORMA_INVOICE"] = 325] = "PROFORMA_INVOICE";
})(FacturxDocumentType || (exports.FacturxDocumentType = FacturxDocumentType = {}));
/**
* Codes de moyens de paiement standardisés
*/
var PaymentMeansCode;
(function (PaymentMeansCode) {
    /** Virement bancaire */
    PaymentMeansCode["BANK_TRANSFER"] = "30";
    /** Chèque */
    PaymentMeansCode["CHEQUE"] = "20";
    /** Espèces */
    PaymentMeansCode["CASH"] = "10";
    /** Carte bancaire */
    PaymentMeansCode["CARD"] = "48";
    /** Prélèvement automatique */
    PaymentMeansCode["DIRECT_DEBIT"] = "49";
    /** Autre moyen */
    PaymentMeansCode["OTHER"] = "1";
})(PaymentMeansCode || (exports.PaymentMeansCode = PaymentMeansCode = {}));
/**
* Configuration par défaut recommandée pour différents cas d'usage
*/
exports.FACTURX_DEFAULTS = {
    /** Configuration pour factures B2B européennes */
    B2B_EU: {
        profile: EnumInvoiceType_2.FacturxProfile.EN16931,
        currency: 'EUR',
        documentType: FacturxDocumentType.INVOICE,
        paymentMeans: PaymentMeansCode.BANK_TRANSFER
    },
    /** Configuration pour factures B2C simplifiées */
    B2C_SIMPLE: {
        profile: EnumInvoiceType_2.FacturxProfile.BASIC,
        currency: 'EUR',
        documentType: FacturxDocumentType.INVOICE,
        paymentMeans: PaymentMeansCode.CARD
    },
    /** Configuration maximale avec toutes les fonctionnalités */
    EXTENDED: {
        profile: EnumInvoiceType_2.FacturxProfile.EXTENDED,
        currency: 'EUR',
        documentType: FacturxDocumentType.INVOICE,
        paymentMeans: PaymentMeansCode.BANK_TRANSFER
    }
};
