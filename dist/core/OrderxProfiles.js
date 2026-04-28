"use strict";
// src/core/OrderxProfiles.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.OrderPriority = exports.OrderTypeCode = exports.ORDERX_PROFILE_CONFIGS = exports.OrderxProfiles = void 0;
exports.getOrderxProfileConfig = getOrderxProfileConfig;
exports.supportsFeature = supportsFeature;
/**
 * Profils Order-X disponibles
 *
 * Order-X est basé sur le standard UN/CEFACT Cross Industry Order
 * et propose plusieurs profils selon le niveau de détail requis.
 *
 * @see https://www.fnfe-mpe.org/order-x/
 */
var OrderxProfiles;
(function (OrderxProfiles) {
    /**
     * BASIC - Profil de base pour commandes simples
     * Contient les informations minimales requises :
     * - Numéro de commande
     * - Date
     * - Parties (vendeur/acheteur)
     * - Lignes de commande basiques
     */
    OrderxProfiles["BASIC"] = "BASIC";
    /**
     * COMFORT - Profil intermédiaire
     * Ajoute au profil BASIC :
     * - Détails de livraison
     * - Informations de paiement
     * - Dates de livraison souhaitées
     * - Remises/Frais au niveau document
     */
    OrderxProfiles["COMFORT"] = "COMFORT";
    /**
     * EXTENDED - Profil complet
     * Contient tous les champs possibles :
     * - Tous les champs COMFORT
     * - Remises/Frais au niveau ligne
     * - Documents additionnels
     * - Informations logistiques détaillées
     * - Références croisées
     * - Conditions commerciales complètes
     */
    OrderxProfiles["EXTENDED"] = "EXTENDED";
})(OrderxProfiles || (exports.OrderxProfiles = OrderxProfiles = {}));
/**
 * Configurations des profils Order-X
 */
exports.ORDERX_PROFILE_CONFIGS = {
    [OrderxProfiles.BASIC]: {
        profile: OrderxProfiles.BASIC,
        urn: "urn:order-x.eu:1p0:basic",
        requiredFields: [
            "orderNumber",
            "orderDate",
            "seller",
            "buyer",
            "currency",
            "items"
        ],
        optionalFields: [
            "notes",
            "disclaimers"
        ],
        forbiddenFields: [
            "lineAllowances",
            "docAllowances",
            "additionalDocuments",
            "deliveryDetails"
        ],
        supportsLineAllowances: false,
        supportsDocAllowances: false,
        supportsAdditionalDocuments: false,
        supportsDeliveryDetails: false
    },
    [OrderxProfiles.COMFORT]: {
        profile: OrderxProfiles.COMFORT,
        urn: "urn:order-x.eu:1p0:comfort",
        requiredFields: [
            "orderNumber",
            "orderDate",
            "seller",
            "buyer",
            "currency",
            "items"
        ],
        optionalFields: [
            "notes",
            "disclaimers",
            "requestedDeliveryDate",
            "shippingAddress",
            "docAllowances",
            "paymentTerms"
        ],
        forbiddenFields: [
            "lineAllowances"
        ],
        supportsLineAllowances: false,
        supportsDocAllowances: true,
        supportsAdditionalDocuments: false,
        supportsDeliveryDetails: true
    },
    [OrderxProfiles.EXTENDED]: {
        profile: OrderxProfiles.EXTENDED,
        urn: "urn:order-x.eu:1p0:extended",
        requiredFields: [
            "orderNumber",
            "orderDate",
            "seller",
            "buyer",
            "currency",
            "items"
        ],
        optionalFields: [
            "notes",
            "disclaimers",
            "requestedDeliveryDate",
            "shippingAddress",
            "docAllowances",
            "lineAllowances",
            "additionalDocuments",
            "paymentTerms",
            "deliveryDetails",
            "references"
        ],
        forbiddenFields: [],
        supportsLineAllowances: true,
        supportsDocAllowances: true,
        supportsAdditionalDocuments: true,
        supportsDeliveryDetails: true
    }
};
/**
 * Obtenir la configuration d'un profil Order-X
 * @param profile Le profil Order-X
 * @returns La configuration du profil
 */
function getOrderxProfileConfig(profile) {
    return exports.ORDERX_PROFILE_CONFIGS[profile];
}
/**
 * Vérifier si un profil supporte une fonctionnalité
 * @param profile Le profil Order-X
 * @param feature La fonctionnalité à vérifier
 * @returns true si la fonctionnalité est supportée
 */
function supportsFeature(profile, feature) {
    const config = getOrderxProfileConfig(profile);
    return config[feature];
}
/**
 * Codes de type de commande Order-X
 * Basés sur UNTDID 1001
 */
var OrderTypeCode;
(function (OrderTypeCode) {
    /** Commande standard */
    OrderTypeCode["ORDER"] = "220";
    /** Commande express */
    OrderTypeCode["EXPRESS_ORDER"] = "221";
    /** Commande cadre */
    OrderTypeCode["BLANKET_ORDER"] = "222";
    /** Appel de livraison */
    OrderTypeCode["CALL_OFF_ORDER"] = "226";
    /** Commande de remplacement */
    OrderTypeCode["REPLACEMENT_ORDER"] = "227";
    /** Devis/Pro forma */
    OrderTypeCode["QUOTATION"] = "310";
})(OrderTypeCode || (exports.OrderTypeCode = OrderTypeCode = {}));
/**
 * Priorités de commande
 */
var OrderPriority;
(function (OrderPriority) {
    /** Priorité basse */
    OrderPriority["LOW"] = "5";
    /** Priorité normale */
    OrderPriority["NORMAL"] = "3";
    /** Priorité haute */
    OrderPriority["HIGH"] = "2";
    /** Urgente */
    OrderPriority["URGENT"] = "1";
})(OrderPriority || (exports.OrderPriority = OrderPriority = {}));
/**
 * Statuts de commande
 */
var OrderStatus;
(function (OrderStatus) {
    /** Brouillon */
    OrderStatus["DRAFT"] = "1";
    /** Soumise */
    OrderStatus["SUBMITTED"] = "2";
    /** Acceptée */
    OrderStatus["ACCEPTED"] = "3";
    /** Rejetée */
    OrderStatus["REJECTED"] = "4";
    /** En cours */
    OrderStatus["IN_PROGRESS"] = "5";
    /** Complétée */
    OrderStatus["COMPLETED"] = "6";
    /** Annulée */
    OrderStatus["CANCELLED"] = "7";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
