"use strict";
/**
 * Modèle de document commercial — types partagés par le rendu PDF (Node) et le
 * rendu HTML (webapp). Ce fichier et tout le dossier `document/` sont
 * « navigateur-compatibles » : aucune dépendance à pdf-lib, fs ou Buffer.
 *
 * Montants : toujours en UNITÉS MINEURES entières (centimes), comme dans toute la
 * plateforme. Taux de TVA : en POURCENTAGE (20 = 20 %).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_COLUMNS = exports.COLUMN_KEYS = exports.LOGO_LAYOUTS = exports.TOTALS_LAYOUTS = exports.TABLE_LAYOUTS = exports.PARTIES_LAYOUTS = exports.FRAME_LAYOUTS = exports.DOCUMENT_LANGUAGES = exports.DOCUMENT_KINDS = void 0;
exports.DOCUMENT_KINDS = ['invoice', 'credit', 'quote', 'order'];
exports.DOCUMENT_LANGUAGES = ['fr', 'en', 'de'];
exports.FRAME_LAYOUTS = ['standard', 'band', 'sidebar', 'hero', 'centered'];
exports.PARTIES_LAYOUTS = ['plain', 'framed', 'card'];
exports.TABLE_LAYOUTS = ['lines', 'zebra', 'filled'];
exports.TOTALS_LAYOUTS = ['plain', 'tint', 'block'];
exports.LOGO_LAYOUTS = ['left', 'above', 'none'];
exports.COLUMN_KEYS = ['ref', 'description', 'quantity', 'unit', 'unitPrice', 'discount', 'vatRate', 'lineTotal'];
exports.REQUIRED_COLUMNS = ['description', 'quantity', 'lineTotal'];
//# sourceMappingURL=types.js.map