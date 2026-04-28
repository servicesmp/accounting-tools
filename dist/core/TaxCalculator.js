"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxCalculator = void 0;
/**
 * Le TaxCalculator final, capable de :
 *  - Calculer un total HT, TVA, TTC,
 *  - Gérer l'arrondi par ligne ou global,
 *  - Gérer multiple taux, multiple catégories,
 *  - Incorporer allowances/charges au niveau ligne et doc-level.
 */
class TaxCalculator {
    /**
     * Si roundMode='line' => on calcule la TVA (et on arrondit) à chaque ligne
     * avant de sommer.
     * roundMode='global' => on somme la base imposable, puis on calcule la TVA.
     */
    constructor(roundMode = 'line') {
        this.roundMode = roundMode;
    }
    /**
     * @param lines : liste des lignes (qty, unitPrice, vatRate, lineAllowancesCharges...)
     * @param docAllowancesCharges : liste des remises/frais globaux (doc-level).
     */
    computeSummary(lines, docAllowancesCharges = []) {
        // 1) lineTotal (somme HT brute des lignes sans doc-level)
        let lineTotal = 0;
        // On indexe la TVA par (rate, category) => { taxable, tax? }
        const vatMap = new Map();
        // Traitement des LIGNES
        for (const line of lines) {
            const qty = line.quantity;
            const up = line.unitPrice;
            const lineHT = qty * up;
            lineTotal += lineHT;
            const lineRate = line.vatRate ?? 0;
            const lineCat = line.taxCategoryCode ?? "S"; // par défaut "S"
            if (this.roundMode === 'line') {
                // calcul TVA de la ligne
                const tva = lineHT * lineRate;
                updateVatMap(vatMap, lineRate, lineCat, lineHT, tva);
            }
            else {
                // on ajoute juste la base, on calculera la TVA plus tard
                updateVatMap(vatMap, lineRate, lineCat, lineHT);
            }
            // Gérer lineAllowancesCharges
            const lineAllowances = line.allowances.concat(line.charges || []);
            if (lineAllowances && lineAllowances.length > 0) {
                for (const lac of lineAllowances) {
                    const lacAmount = lac.actualAmount || 0;
                    // sign : + si charge, - si remise
                    const sign = lac.chargeIndicator ? +1 : -1;
                    const partialBase = lacAmount * sign;
                    // par défaut, on applique la TVA du lac ou (lineRate + lineCat)
                    const lacRate = (lac.taxRate !== undefined) ? lac.taxRate : lineRate;
                    const lacCat = (lac.taxCategoryCode) ? lac.taxCategoryCode : lineCat;
                    if (this.roundMode === 'line') {
                        const partialTax = partialBase * lacRate;
                        updateVatMap(vatMap, lacRate, lacCat, partialBase, partialTax);
                    }
                    else {
                        updateVatMap(vatMap, lacRate, lacCat, partialBase);
                    }
                    // Cela modifie la base lineTotal
                    lineTotal += partialBase;
                }
            }
        }
        // 2) doc-level allowances/charges
        let docBase = 0;
        for (const dac of docAllowancesCharges) {
            const dacAmt = dac.actualAmount || 0;
            const sign = dac.chargeIndicator ? +1 : -1;
            const partialBase = dacAmt * sign;
            docBase += partialBase;
            const rate = dac.taxRate ?? 0;
            const cat = dac.taxCategoryCode ?? "S";
            if (this.roundMode === 'line') {
                const partialTax = partialBase * rate;
                updateVatMap(vatMap, rate, cat, partialBase, partialTax);
            }
            else {
                updateVatMap(vatMap, rate, cat, partialBase);
            }
        }
        // => base imposable
        const taxBasis = lineTotal + docBase;
        // 3) Si roundMode='global', on calcule la TVA maintenant
        if (this.roundMode === 'global') {
            for (const [key, val] of vatMap.entries()) {
                if (val.tax === undefined) {
                    // on récupère (rate, category) 
                    const [rStr, cStr] = decodeKey(key);
                    const rate = Number(rStr);
                    const tva = val.taxable * rate;
                    val.tax = tva;
                }
            }
        }
        // 4) totalTax => somme de val.tax
        let totalTax = 0;
        const results = [];
        for (const [key, val] of vatMap.entries()) {
            const [rStr, cStr] = decodeKey(key);
            if (!val.tax) {
                val.tax = 0;
            }
            totalTax += val.tax;
            results.push({
                rate: Number(rStr) * 100,
                category: cStr,
                taxable: val.taxable,
                taxAmount: val.tax
            });
        }
        // => grandTotal
        const grandTotal = taxBasis + totalTax;
        // => on renvoie
        return {
            lineTotal,
            taxBasis,
            taxTotal: totalTax,
            grandTotal,
            taxSummaries: results
        };
    }
}
exports.TaxCalculator = TaxCalculator;
//----------------------------------------
// FONCTIONS UTILITAIRES
//----------------------------------------
function encodeKey(rate, cat) {
    // ex. 0.20 + "S" => "0.20|S"
    return `${rate}|${cat}`;
}
function decodeKey(key) {
    const [r, c] = key.split('|');
    return [r, c];
}
/**
 * Met à jour vatMap[ (rate, cat) ]
 * @param taxable base imposable
 * @param tax si défini => on stocke la TVA calculée,
 * sinon on la calculera plus tard (roundMode='global').
 */
function updateVatMap(vatMap, rate, category, taxable, tax) {
    const key = encodeKey(rate, category);
    const existing = vatMap.get(key) || { taxable: 0, tax: undefined };
    existing.taxable += taxable;
    if (tax !== undefined) {
        existing.tax = (existing.tax || 0) + tax;
    }
    vatMap.set(key, existing);
}
