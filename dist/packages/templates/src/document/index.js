"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blend = exports.mix = exports.relativeLuminance = exports.shade = exports.tint = exports.ensureContrastOnWhite = exports.contrastRatio = exports.normalizeHex = exports.getDocumentLabels = exports.DOCUMENT_LOCALES = exports.DOCUMENT_LABELS = void 0;
/**
 * accounting-tools/document — module NAVIGATEUR-COMPATIBLE.
 *
 * Tout ce qu'il faut pour afficher une facture, un avoir, un devis ou un bon de
 * commande exactement comme la librairie l'imprime : types, réglages par
 * organisation (préréglages, normalisation, droits du plan), calcul des totaux,
 * libellés, mentions obligatoires, vue prête à dessiner.
 *
 * Aucune dépendance à pdf-lib, fs, Buffer ou au XML Factur-X : importable depuis
 * la webapp (`import … from 'accounting-tools/document'`).
 */
__exportStar(require("./types"), exports);
__exportStar(require("./settings"), exports);
__exportStar(require("./view"), exports);
__exportStar(require("./format"), exports);
__exportStar(require("./country"), exports);
var i18n_1 = require("./i18n");
Object.defineProperty(exports, "DOCUMENT_LABELS", { enumerable: true, get: function () { return i18n_1.DOCUMENT_LABELS; } });
Object.defineProperty(exports, "DOCUMENT_LOCALES", { enumerable: true, get: function () { return i18n_1.DOCUMENT_LOCALES; } });
Object.defineProperty(exports, "getDocumentLabels", { enumerable: true, get: function () { return i18n_1.getDocumentLabels; } });
var color_1 = require("./color");
Object.defineProperty(exports, "normalizeHex", { enumerable: true, get: function () { return color_1.normalizeHex; } });
Object.defineProperty(exports, "contrastRatio", { enumerable: true, get: function () { return color_1.contrastRatio; } });
Object.defineProperty(exports, "ensureContrastOnWhite", { enumerable: true, get: function () { return color_1.ensureContrastOnWhite; } });
Object.defineProperty(exports, "tint", { enumerable: true, get: function () { return color_1.tint; } });
Object.defineProperty(exports, "shade", { enumerable: true, get: function () { return color_1.shade; } });
Object.defineProperty(exports, "relativeLuminance", { enumerable: true, get: function () { return color_1.relativeLuminance; } });
Object.defineProperty(exports, "mix", { enumerable: true, get: function () { return color_1.mix; } });
Object.defineProperty(exports, "blend", { enumerable: true, get: function () { return color_1.blend; } });
//# sourceMappingURL=index.js.map