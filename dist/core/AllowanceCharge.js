"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowanceCharge = void 0;
/**
 * Informations de remise ou de charge (au niveau document ou ligne),
 * conformes à la structure "ram:SpecifiedTradeAllowanceCharge" en Factur-X.
 */
class AllowanceCharge {
    /**
     * true => charge (frais / surcoût),
     * false => remise/rabais
     */
    constructor(chargeIndicator, 
    /** Montant fixe si applicable, ex. 10.00 => 10 EUR */
    actualAmount, 
    /** Raison textuelle */
    reason, 
    /** Code motif (ex. liste UN/CEFACT 7161 ou 5189) */
    reasonCode, 
    /**
     * Taux de taxe applicable à cette charge/remise, ex. 0.20 => 20%.
     * (Peut être 0 pour exonération.)
     */
    taxRate, 
    /** Catégorie de taxe (S, Z, E...) */
    taxCategoryCode, 
    /**
     * (Optionnel) Période de validité,
     * ex. remise appliquée du 01/04/2025 au 30/04/2025
     */
    startDate, endDate, 
    /**
     * (Optionnel) Mode de calcul, ex. pourcent => 0.10 => 10%.
     * Si set, on peut calculer actualAmount en fonction du "basis"
     */
    percentage, basisAmount // Base de calcul si percentage est utilisé
    ) {
        this.chargeIndicator = chargeIndicator;
        this.actualAmount = actualAmount;
        this.reason = reason;
        this.reasonCode = reasonCode;
        this.taxRate = taxRate;
        this.taxCategoryCode = taxCategoryCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.percentage = percentage;
        this.basisAmount = basisAmount;
    }
}
exports.AllowanceCharge = AllowanceCharge;
