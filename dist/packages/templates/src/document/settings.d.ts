/**
 * Réglages de mise en page des documents : préréglages (les 5 modèles de la
 * librairie), valeurs par défaut, et normalisation d'une entrée non fiable
 * selon les droits du plan de l'organisation.
 */
import { DocumentTemplateSettings, DocumentEntitlements, PresetId, DocumentLayout, ColumnKey, DocumentLanguage } from './types';
export declare const DOCUMENT_SETTINGS_VERSION: 2;
export declare const FOOTER_NOTE_MAX_LENGTH = 280;
/** Contraste minimal sur blanc : texte courant (WCAG AA). */
export declare const PRIMARY_MIN_CONTRAST = 4.5;
/** Contraste minimal sur blanc : texte large ou gras, aplats portant du texte blanc. */
export declare const ACCENT_MIN_CONTRAST = 3;
export interface DocumentPreset {
    readonly id: PresetId;
    readonly label: string;
    /** Nom de la classe historique de la librairie dont le préréglage reprend la mise en page. */
    readonly legacyTemplate: string;
    readonly description: string;
    readonly layout: DocumentLayout;
    readonly colors: {
        readonly primary: string;
        readonly accent: string;
    };
}
/** Les 5 modèles de la librairie, devenus des préréglages de blocs. */
export declare const DOCUMENT_PRESETS: readonly DocumentPreset[];
export declare function getDocumentPreset(id: string | undefined): DocumentPreset;
export declare const DEFAULT_COLUMNS: readonly ColumnKey[];
/** Réglage d'une organisation sans personnalisation (et de tout plan qui ne l'autorise pas). */
export declare function presetSettings(id?: PresetId, language?: DocumentLanguage): DocumentTemplateSettings;
export declare const DEFAULT_DOCUMENT_SETTINGS: DocumentTemplateSettings;
/**
 * Modèle imposé aux plans sans personnalisation (Standard) : Modern, sans logo,
 * mention « Émis avec Services ». Seule la langue reste au choix.
 */
export declare const BASIC_DOCUMENT_SETTINGS: DocumentTemplateSettings;
/** Aucun droit : modèle par défaut, mention « Émis avec Services » imposée. */
export declare const NO_DOCUMENT_ENTITLEMENTS: DocumentEntitlements;
export declare const FULL_DOCUMENT_ENTITLEMENTS: DocumentEntitlements;
export interface NormalizedDocumentSettings {
    readonly settings: DocumentTemplateSettings;
    /** Corrections appliquées, à afficher à l'utilisateur. */
    readonly warnings: string[];
}
/**
 * Valide et complète un réglage venant d'une source non fiable (formulaire,
 * base, ancien format). Ne lève jamais. Les droits du plan sont appliqués ici :
 * c'est la règle unique, côté serveur comme côté navigateur.
 */
export declare function normalizeDocumentSettings(input: unknown, entitlements?: DocumentEntitlements): NormalizedDocumentSettings;
/** Le réglage diffère-t-il de son préréglage (bouton « Revenir au modèle ») ? */
export declare function isModifiedFromPreset(settings: DocumentTemplateSettings): boolean;
//# sourceMappingURL=settings.d.ts.map