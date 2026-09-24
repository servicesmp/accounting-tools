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
import { TemplateType, TemplateOptions } from '../types';
export declare const DOCUMENT_BRANDING_VERSION: 1;
/** Identifiants publics et stables des modèles (indépendants des classes de rendu). */
export type DocumentTemplateId = 'classic' | 'bold' | 'corporate' | 'creative' | 'minimal';
export type DocumentKind = 'invoice' | 'estimate';
export type LogoPosition = 'left' | 'above' | 'hidden';
export interface DocumentBranding {
    readonly version: typeof DOCUMENT_BRANDING_VERSION;
    readonly templateId: DocumentTemplateId;
    readonly colors: {
        /** Couleur principale (titres, aplats). Contraste ≥ 4.5:1 sur blanc garanti. */
        readonly primary: string;
        /** Couleur d'accent (totaux, mises en avant). Contraste ≥ 3:1 sur blanc garanti. */
        readonly accent: string;
    };
    readonly logo: {
        readonly position: LogoPosition;
    };
    /** Mention libre imprimée en fin de document (ex. « Merci pour votre confiance »). */
    readonly footerNote: string;
}
export interface DocumentTemplateDescriptor {
    readonly id: DocumentTemplateId;
    readonly label: string;
    readonly description: string;
    readonly kinds: readonly DocumentKind[];
    /** Le modèle accepte-t-il les couleurs de marque ? (Minimal est volontairement monochrome.) */
    readonly supportsColors: boolean;
    /** Couleurs d'origine du modèle, proposées par défaut. */
    readonly defaultColors: {
        readonly primary: string;
        readonly accent: string;
    };
    /** Moteur de rendu PDF. */
    readonly renderer: TemplateType;
}
/**
 * Catalogue des modèles. L'ordre est l'ordre d'affichage dans le sélecteur.
 * Ajouter un modèle : une entrée ici + une classe de rendu déclarant ses `brandSlots`.
 */
export declare const DOCUMENT_TEMPLATES: readonly DocumentTemplateDescriptor[];
export declare function getDocumentTemplate(id: DocumentTemplateId): DocumentTemplateDescriptor;
export declare const FOOTER_NOTE_MAX_LENGTH = 280;
export declare const PRIMARY_MIN_CONTRAST = 4.5;
export declare const ACCENT_MIN_CONTRAST = 3;
export declare const DEFAULT_DOCUMENT_BRANDING: DocumentBranding;
export interface NormalizedBranding {
    readonly branding: DocumentBranding;
    /** Corrections appliquées (entrée invalide, contraste insuffisant…), à afficher à l'utilisateur. */
    readonly warnings: string[];
}
/**
 * Valide et complète une personnalisation venant d'une source non fiable.
 * Ne lève jamais : toute valeur invalide est remplacée par une valeur sûre.
 */
export declare function normalizeBranding(input: unknown): NormalizedBranding;
/**
 * Traduit une personnalisation en options de rendu PDF.
 * `logo` : contenu binaire du logo de l'organisation (PNG/JPEG), s'il existe.
 * Sans logo, rien n'est dessiné à sa place.
 */
export declare function brandingToRenderOptions(branding: DocumentBranding, logo?: Buffer | null): {
    templateType: TemplateType;
    options: Partial<TemplateOptions>;
};
//# sourceMappingURL=DocumentBranding.d.ts.map