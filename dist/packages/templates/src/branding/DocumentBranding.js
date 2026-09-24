"use strict";
/**
 * @module DocumentBranding
 * @description Contrat de personnalisation des documents commerciaux (factures, devis).
 *
 * Une organisation choisit un MODÈLE (mise en page) et l'habille de SA marque
 * (couleurs, logo, mention de pied de page). Le contrat est :
 *  - versionné (`version`) pour que les modèles futurs (maquettes Claude Design)
 *    puissent ajouter des options sans casser les personnalisations existantes ;
 *  - sérialisable en JSON : il est stocké sur l'organisation, puis copié tel quel
 *    dans chaque document au moment de son émission (une facture émise ne change
 *    jamais d'apparence) ;
 *  - purement visuel : il n'influence JAMAIS le XML Factur-X ni les mentions légales.
 *
 * Toute entrée non fiable (formulaire, base, API) passe par `normalizeBranding`,
 * qui applique des valeurs par défaut sûres au lieu d'échouer, et renvoie la liste
 * des corrections appliquées.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOCUMENT_BRANDING = exports.ACCENT_MIN_CONTRAST = exports.PRIMARY_MIN_CONTRAST = exports.FOOTER_NOTE_MAX_LENGTH = exports.DOCUMENT_TEMPLATES = exports.DOCUMENT_BRANDING_VERSION = void 0;
exports.getDocumentTemplate = getDocumentTemplate;
exports.normalizeBranding = normalizeBranding;
exports.brandingToRenderOptions = brandingToRenderOptions;
const types_1 = require("../types");
const color_1 = require("./color");
exports.DOCUMENT_BRANDING_VERSION = 1;
/**
 * Catalogue des modèles. L'ordre est l'ordre d'affichage dans le sélecteur.
 * Ajouter un modèle : une entrée ici + une classe de rendu déclarant ses `brandSlots`.
 */
exports.DOCUMENT_TEMPLATES = Object.freeze([
    {
        id: 'classic',
        label: 'Classique',
        description: 'Sobre et aéré, la couleur de marque souligne titres et en-têtes.',
        kinds: ['invoice', 'estimate'],
        supportsColors: true,
        defaultColors: { primary: '#222223', accent: '#222223' },
        renderer: types_1.TemplateType.MODERN,
    },
    {
        id: 'bold',
        label: 'Affirmé',
        description: 'Bandeaux pleins aux couleurs de la marque, total très visible.',
        kinds: ['invoice', 'estimate'],
        supportsColors: true,
        defaultColors: { primary: '#0d2f5e', accent: '#c2410c' },
        renderer: types_1.TemplateType.BRAND,
    },
    {
        id: 'corporate',
        label: 'Corporate',
        description: 'Mise en page institutionnelle, filets et accents discrets.',
        kinds: ['invoice', 'estimate'],
        supportsColors: true,
        defaultColors: { primary: '#293a73', accent: '#8a7a1f' },
        renderer: types_1.TemplateType.CORPORATE,
    },
    {
        id: 'creative',
        label: 'Créatif',
        description: 'Deux couleurs vives et des formes arrondies.',
        kinds: ['invoice', 'estimate'],
        supportsColors: true,
        defaultColors: { primary: '#1d4ed8', accent: '#db2777' },
        renderer: types_1.TemplateType.FANCY,
    },
    {
        id: 'minimal',
        label: 'Minimal',
        description: 'Noir et blanc, typographie seule. Le logo reste disponible.',
        kinds: ['invoice', 'estimate'],
        supportsColors: false,
        defaultColors: { primary: '#000000', accent: '#000000' },
        renderer: types_1.TemplateType.MINIMAL,
    },
]);
const TEMPLATE_BY_ID = new Map(exports.DOCUMENT_TEMPLATES.map((t) => [t.id, t]));
function getDocumentTemplate(id) {
    return TEMPLATE_BY_ID.get(id) ?? exports.DOCUMENT_TEMPLATES[0];
}
exports.FOOTER_NOTE_MAX_LENGTH = 280;
exports.PRIMARY_MIN_CONTRAST = 4.5; // WCAG AA, texte courant
exports.ACCENT_MIN_CONTRAST = 3; // WCAG AA, texte large / gras
exports.DEFAULT_DOCUMENT_BRANDING = Object.freeze({
    version: exports.DOCUMENT_BRANDING_VERSION,
    templateId: 'classic',
    colors: Object.freeze({ ...exports.DOCUMENT_TEMPLATES[0].defaultColors }),
    logo: Object.freeze({ position: 'left' }),
    footerNote: '',
});
function cleanFooterNote(input, warnings) {
    if (typeof input !== 'string')
        return '';
    // Texte brut sur une ligne logique : pas de caractères de contrôle.
    // eslint-disable-next-line no-control-regex
    let v = input.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
    if (v.length > exports.FOOTER_NOTE_MAX_LENGTH) {
        v = v.slice(0, exports.FOOTER_NOTE_MAX_LENGTH).trim();
        warnings.push(`Mention de pied de page tronquée à ${exports.FOOTER_NOTE_MAX_LENGTH} caractères.`);
    }
    return v;
}
/**
 * Valide et complète une personnalisation venant d'une source non fiable.
 * Ne lève jamais : toute valeur invalide est remplacée par une valeur sûre.
 */
function normalizeBranding(input) {
    const warnings = [];
    const raw = input && typeof input === 'object' ? input : {};
    const templateId = TEMPLATE_BY_ID.has(raw.templateId) ? raw.templateId : 'classic';
    if (raw.templateId !== undefined && raw.templateId !== templateId) {
        warnings.push(`Modèle inconnu « ${String(raw.templateId)} » : modèle Classique utilisé.`);
    }
    const template = getDocumentTemplate(templateId);
    let primary = template.defaultColors.primary;
    let accent = template.defaultColors.accent;
    if (template.supportsColors) {
        const p = (0, color_1.normalizeHex)(raw.colors?.primary);
        const a = (0, color_1.normalizeHex)(raw.colors?.accent);
        if (raw.colors?.primary !== undefined && !p)
            warnings.push('Couleur principale invalide : couleur du modèle utilisée.');
        if (raw.colors?.accent !== undefined && !a)
            warnings.push("Couleur d'accent invalide : couleur du modèle utilisée.");
        if (p)
            primary = p;
        if (a)
            accent = a;
        else if (p)
            accent = p; // une seule couleur choisie → elle sert aussi d'accent
        const pc = (0, color_1.ensureContrastOnWhite)(primary, exports.PRIMARY_MIN_CONTRAST);
        if (pc.adjusted)
            warnings.push('Couleur principale assombrie pour rester lisible à l’impression.');
        primary = pc.color;
        const ac = (0, color_1.ensureContrastOnWhite)(accent, exports.ACCENT_MIN_CONTRAST);
        if (ac.adjusted)
            warnings.push("Couleur d'accent assombrie pour rester lisible à l’impression.");
        accent = ac.color;
    }
    const position = ['left', 'above', 'hidden'].includes(raw.logo?.position) ? raw.logo.position : 'left';
    return {
        branding: {
            version: exports.DOCUMENT_BRANDING_VERSION,
            templateId,
            colors: { primary, accent },
            logo: { position },
            footerNote: cleanFooterNote(raw.footerNote, warnings),
        },
        warnings,
    };
}
/**
 * Traduit une personnalisation en options de rendu PDF.
 * `logo` : contenu binaire du logo de l'organisation (PNG/JPEG), s'il existe.
 * Sans logo, rien n'est dessiné à sa place.
 */
function brandingToRenderOptions(branding, logo) {
    const template = getDocumentTemplate(branding.templateId);
    const hasLogo = !!logo && logo.length > 0 && branding.logo.position !== 'hidden';
    return {
        templateType: template.renderer,
        options: {
            brandColors: template.supportsColors ? { ...branding.colors } : undefined,
            logoLayout: hasLogo ? branding.logo.position : 'none',
            ...(hasLogo ? { logoData: logo } : {}),
            customFooter: branding.footerNote || '',
        },
    };
}
//# sourceMappingURL=DocumentBranding.js.map