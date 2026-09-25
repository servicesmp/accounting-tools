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
export * from './types';
export * from './settings';
export * from './view';
export * from './records';
export * from './format';
export * from './country';
export { DOCUMENT_LABELS, DOCUMENT_LOCALES, getDocumentLabels } from './i18n';
export type { DocumentLabels } from './i18n';
export { renderDocumentHtml, escapeHtml, safeImageUrl } from './html';
export type { RenderDocumentHtmlOptions } from './html';
export { normalizeHex, contrastRatio, ensureContrastOnWhite, tint, shade, relativeLuminance, mix, blend } from './color';
