"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FULL_DOCUMENT_ENTITLEMENTS = exports.NO_DOCUMENT_ENTITLEMENTS = exports.DEFAULT_DOCUMENT_SETTINGS = exports.DEFAULT_COLUMNS = exports.DOCUMENT_PRESETS = exports.ACCENT_MIN_CONTRAST = exports.PRIMARY_MIN_CONTRAST = exports.FOOTER_NOTE_MAX_LENGTH = exports.DOCUMENT_SETTINGS_VERSION = void 0;
exports.getDocumentPreset = getDocumentPreset;
exports.presetSettings = presetSettings;
exports.normalizeDocumentSettings = normalizeDocumentSettings;
exports.isModifiedFromPreset = isModifiedFromPreset;
/**
 * Réglages de mise en page des documents : préréglages (les 5 modèles de la
 * librairie), valeurs par défaut, et normalisation d'une entrée non fiable
 * selon les droits du plan de l'organisation.
 */
const types_1 = require("./types");
const color_1 = require("./color");
exports.DOCUMENT_SETTINGS_VERSION = 2;
exports.FOOTER_NOTE_MAX_LENGTH = 280;
/** Contraste minimal sur blanc : texte courant (WCAG AA). */
exports.PRIMARY_MIN_CONTRAST = 4.5;
/** Contraste minimal sur blanc : texte large ou gras, aplats portant du texte blanc. */
exports.ACCENT_MIN_CONTRAST = 3;
// Couleurs exactes de la maquette (aucun ajustement : le rendu doit être fidèle).
const readable = (primary, accent) => ({ primary, accent });
/** Les 5 modèles de la librairie, devenus des préréglages de blocs. */
exports.DOCUMENT_PRESETS = Object.freeze([
    {
        id: 'modern', label: 'Modern', legacyTemplate: 'ModernTemplate',
        description: 'Classique : en-tête scindé, parties côte à côte, total à droite.',
        layout: { frame: 'standard', parties: 'plain', table: 'lines', totals: 'block' },
        colors: readable('#111111', '#067d62'),
    },
    {
        id: 'brand', label: 'Brand', legacyTemplate: 'BrandTemplate',
        description: 'Bandeau pleine largeur avec dates et total.',
        layout: { frame: 'band', parties: 'framed', table: 'filled', totals: 'block' },
        colors: readable('#0d2f5e', '#ff6600'),
    },
    {
        id: 'corporate', label: 'Corporate', legacyTemplate: 'CorporateTemplate',
        description: 'Colonne latérale : émetteur, dates et paiement à gauche.',
        layout: { frame: 'sidebar', parties: 'plain', table: 'zebra', totals: 'tint' },
        colors: readable('#293a73', '#b8a643'),
    },
    {
        id: 'minimal', label: 'Minimal', legacyTemplate: 'MinimalTemplate',
        description: 'Montant à payer en très grand, parties sur une ligne.',
        layout: { frame: 'hero', parties: 'plain', table: 'lines', totals: 'plain' },
        colors: readable('#000000', '#555555'),
    },
    {
        id: 'fancy', label: 'Fancy', legacyTemplate: 'FancyTemplate',
        description: 'Centré : logo et titre au milieu, total en carte.',
        layout: { frame: 'centered', parties: 'card', table: 'zebra', totals: 'block' },
        colors: readable('#db2777', '#3b82f6'),
    },
]);
const PRESET_BY_ID = new Map(exports.DOCUMENT_PRESETS.map((p) => [p.id, p]));
function getDocumentPreset(id) {
    return PRESET_BY_ID.get(id) ?? exports.DOCUMENT_PRESETS[0];
}
exports.DEFAULT_COLUMNS = ['description', 'quantity', 'unitPrice', 'vatRate', 'lineTotal'];
/** Réglage d'une organisation sans personnalisation (et de tout plan qui ne l'autorise pas). */
function presetSettings(id = 'modern', language = 'fr') {
    const p = getDocumentPreset(id);
    return {
        version: exports.DOCUMENT_SETTINGS_VERSION,
        preset: p.id,
        colors: { ...p.colors },
        layout: { ...p.layout },
        logo: 'left',
        columns: [...exports.DEFAULT_COLUMNS],
        language,
        statusWatermark: true,
        pattern: false,
        showTaxBreakdown: true,
        showPaymentBlock: true,
        showPoweredBy: true,
        footerNote: '',
    };
}
exports.DEFAULT_DOCUMENT_SETTINGS = Object.freeze(presetSettings());
/** Aucun droit : modèle par défaut, mention « Émis avec Services » imposée. */
exports.NO_DOCUMENT_ENTITLEMENTS = Object.freeze({ canCustomize: false, canRemovePoweredBy: false });
exports.FULL_DOCUMENT_ENTITLEMENTS = Object.freeze({ canCustomize: true, canRemovePoweredBy: true });
function pick(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}
function cleanText(input, max, warnings) {
    if (typeof input !== 'string')
        return '';
    // eslint-disable-next-line no-control-regex
    let v = input.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
    if (v.length > max) {
        v = v.slice(0, max).trim();
        warnings.push(`Mention de pied de page tronquée à ${max} caractères.`);
    }
    return v;
}
/**
 * Valide et complète un réglage venant d'une source non fiable (formulaire,
 * base, ancien format). Ne lève jamais. Les droits du plan sont appliqués ici :
 * c'est la règle unique, côté serveur comme côté navigateur.
 */
function normalizeDocumentSettings(input, entitlements = exports.NO_DOCUMENT_ENTITLEMENTS) {
    const warnings = [];
    const raw = input && typeof input === 'object' ? input : {};
    const language = pick(raw.language, types_1.DOCUMENT_LANGUAGES, 'fr');
    if (!entitlements.canCustomize) {
        const base = presetSettings('modern', language);
        const customized = input !== undefined && input !== null && Object.keys(raw).some((k) => !['version', 'language'].includes(k));
        if (customized)
            warnings.push('La personnalisation des documents n’est pas incluse dans votre plan : modèle par défaut appliqué.');
        return { settings: base, warnings };
    }
    // Ancien format (v1 : templateId/colors/logo.position/footerNote) → v2.
    const presetId = pick(raw.preset ?? LEGACY_TEMPLATE_IDS[raw.templateId], exports.DOCUMENT_PRESETS.map((p) => p.id), 'modern');
    if (raw.preset !== undefined && raw.preset !== presetId)
        warnings.push(`Modèle inconnu « ${String(raw.preset)} » : Modern utilisé.`);
    const preset = getDocumentPreset(presetId);
    const layoutIn = raw.layout ?? {};
    const layout = {
        frame: pick(layoutIn.frame, types_1.FRAME_LAYOUTS, preset.layout.frame),
        parties: pick(layoutIn.parties, types_1.PARTIES_LAYOUTS, preset.layout.parties),
        table: pick(layoutIn.table, types_1.TABLE_LAYOUTS, preset.layout.table),
        totals: pick(layoutIn.totals, types_1.TOTALS_LAYOUTS, preset.layout.totals),
    };
    const primary = (0, color_1.normalizeHex)(raw.colors?.primary) ?? preset.colors.primary;
    const accent = (0, color_1.normalizeHex)(raw.colors?.accent) ?? preset.colors.accent;
    if (raw.colors?.primary !== undefined && !(0, color_1.normalizeHex)(raw.colors.primary))
        warnings.push('Couleur principale invalide : couleur du modèle utilisée.');
    if (raw.colors?.accent !== undefined && !(0, color_1.normalizeHex)(raw.colors.accent))
        warnings.push("Couleur d'accent invalide : couleur du modèle utilisée.");
    // La couleur choisie est respectée telle quelle ; un contraste faible est seulement signalé,
    // et uniquement pour une couleur choisie par l'organisation (les couleurs des modèles sont celles de la maquette).
    if (primary !== preset.colors.primary && (0, color_1.ensureContrastOnWhite)(primary, exports.PRIMARY_MIN_CONTRAST).adjusted)
        warnings.push('Couleur principale peu contrastée : le texte risque d’être difficile à lire à l’impression.');
    if (accent !== preset.colors.accent && (0, color_1.ensureContrastOnWhite)(accent, exports.ACCENT_MIN_CONTRAST).adjusted)
        warnings.push("Couleur d'accent peu contrastée : le texte risque d’être difficile à lire à l’impression.");
    const legacyLogo = { left: 'left', above: 'above', hidden: 'none' };
    const logo = pick(raw.logo?.position !== undefined ? legacyLogo[raw.logo.position] : raw.logo, types_1.LOGO_LAYOUTS, 'left');
    const requested = Array.isArray(raw.columns) ? raw.columns : [...exports.DEFAULT_COLUMNS];
    const columns = types_1.COLUMN_KEYS.filter((k) => types_1.REQUIRED_COLUMNS.includes(k) || requested.includes(k));
    const bool = (v, d) => (typeof v === 'boolean' ? v : d);
    let showPoweredBy = bool(raw.showPoweredBy, true);
    if (!showPoweredBy && !entitlements.canRemovePoweredBy) {
        showPoweredBy = true;
        warnings.push('Retirer « Émis avec Services » est inclus à partir du plan Pro.');
    }
    return {
        settings: {
            version: exports.DOCUMENT_SETTINGS_VERSION,
            preset: presetId,
            colors: { primary, accent },
            layout,
            logo,
            columns,
            language,
            statusWatermark: bool(raw.statusWatermark, true),
            pattern: bool(raw.pattern, false),
            showTaxBreakdown: bool(raw.showTaxBreakdown, true),
            showPaymentBlock: bool(raw.showPaymentBlock, true),
            showPoweredBy,
            footerNote: cleanText(raw.footerNote, exports.FOOTER_NOTE_MAX_LENGTH, warnings),
        },
        warnings,
    };
}
/** Identifiants du format v1 (catalogue « classic/bold/… ») vers les préréglages v2. */
const LEGACY_TEMPLATE_IDS = {
    classic: 'modern', bold: 'brand', corporate: 'corporate', creative: 'fancy', minimal: 'minimal',
};
/** Le réglage diffère-t-il de son préréglage (bouton « Revenir au modèle ») ? */
function isModifiedFromPreset(settings) {
    const p = getDocumentPreset(settings.preset);
    return (settings.colors.primary !== p.colors.primary ||
        settings.colors.accent !== p.colors.accent ||
        Object.keys(p.layout).some((k) => settings.layout[k] !== p.layout[k]));
}
//# sourceMappingURL=settings.js.map