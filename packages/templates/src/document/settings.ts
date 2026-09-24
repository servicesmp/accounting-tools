/**
 * Réglages de mise en page des documents : préréglages (les 5 modèles de la
 * librairie), valeurs par défaut, et normalisation d'une entrée non fiable
 * selon les droits du plan de l'organisation.
 */
import {
  DocumentTemplateSettings, DocumentEntitlements, PresetId, DocumentLayout, ColumnKey,
  FRAME_LAYOUTS, PARTIES_LAYOUTS, TABLE_LAYOUTS, TOTALS_LAYOUTS, LOGO_LAYOUTS, COLUMN_KEYS,
  REQUIRED_COLUMNS, DOCUMENT_LANGUAGES, DocumentLanguage, LogoLayout,
} from './types';
import { normalizeHex, ensureContrastOnWhite } from './color';

export const DOCUMENT_SETTINGS_VERSION = 2 as const;
export const FOOTER_NOTE_MAX_LENGTH = 280;
/** Contraste minimal sur blanc : texte courant (WCAG AA). */
export const PRIMARY_MIN_CONTRAST = 4.5;
/** Contraste minimal sur blanc : texte large ou gras, aplats portant du texte blanc. */
export const ACCENT_MIN_CONTRAST = 3;

export interface DocumentPreset {
  readonly id: PresetId;
  readonly label: string;
  /** Nom de la classe historique de la librairie dont le préréglage reprend la mise en page. */
  readonly legacyTemplate: string;
  readonly description: string;
  readonly layout: DocumentLayout;
  readonly colors: { readonly primary: string; readonly accent: string };
}

// Couleurs exactes de la maquette (aucun ajustement : le rendu doit être fidèle).
const readable = (primary: string, accent: string) => ({ primary, accent });

/** Les 5 modèles de la librairie, devenus des préréglages de blocs. */
export const DOCUMENT_PRESETS: readonly DocumentPreset[] = Object.freeze([
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

const PRESET_BY_ID = new Map(DOCUMENT_PRESETS.map((p) => [p.id, p]));

export function getDocumentPreset(id: string | undefined): DocumentPreset {
  return PRESET_BY_ID.get(id as PresetId) ?? DOCUMENT_PRESETS[0];
}

export const DEFAULT_COLUMNS: readonly ColumnKey[] = ['description', 'quantity', 'unitPrice', 'vatRate', 'lineTotal'];

/** Réglage d'une organisation sans personnalisation (et de tout plan qui ne l'autorise pas). */
export function presetSettings(id: PresetId = 'modern', language: DocumentLanguage = 'fr'): DocumentTemplateSettings {
  const p = getDocumentPreset(id);
  return {
    version: DOCUMENT_SETTINGS_VERSION,
    preset: p.id,
    colors: { ...p.colors },
    layout: { ...p.layout },
    logo: 'left',
    columns: [...DEFAULT_COLUMNS],
    language,
    statusWatermark: true,
    pattern: false,
    showTaxBreakdown: true,
    showPaymentBlock: true,
    showPoweredBy: true,
    footerNote: '',
  };
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentTemplateSettings = Object.freeze(presetSettings());

/** Aucun droit : modèle par défaut, mention « Émis avec Services » imposée. */
export const NO_DOCUMENT_ENTITLEMENTS: DocumentEntitlements = Object.freeze({ canCustomize: false, canRemovePoweredBy: false });
export const FULL_DOCUMENT_ENTITLEMENTS: DocumentEntitlements = Object.freeze({ canCustomize: true, canRemovePoweredBy: true });

export interface NormalizedDocumentSettings {
  readonly settings: DocumentTemplateSettings;
  /** Corrections appliquées, à afficher à l'utilisateur. */
  readonly warnings: string[];
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value as string) ? (value as T) : fallback;
}

function cleanText(input: unknown, max: number, warnings: string[]): string {
  if (typeof input !== 'string') return '';
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
export function normalizeDocumentSettings(
  input: unknown,
  entitlements: DocumentEntitlements = NO_DOCUMENT_ENTITLEMENTS,
): NormalizedDocumentSettings {
  const warnings: string[] = [];
  const raw: any = input && typeof input === 'object' ? input : {};
  const language = pick<DocumentLanguage>(raw.language, DOCUMENT_LANGUAGES, 'fr');

  if (!entitlements.canCustomize) {
    const base = presetSettings('modern', language);
    const customized = input !== undefined && input !== null && Object.keys(raw).some((k) => !['version', 'language'].includes(k));
    if (customized) warnings.push('La personnalisation des documents n’est pas incluse dans votre plan : modèle par défaut appliqué.');
    return { settings: base, warnings };
  }

  // Ancien format (v1 : templateId/colors/logo.position/footerNote) → v2.
  const presetId = pick<PresetId>(raw.preset ?? LEGACY_TEMPLATE_IDS[raw.templateId], DOCUMENT_PRESETS.map((p) => p.id), 'modern');
  if (raw.preset !== undefined && raw.preset !== presetId) warnings.push(`Modèle inconnu « ${String(raw.preset)} » : Modern utilisé.`);
  const preset = getDocumentPreset(presetId);

  const layoutIn = raw.layout ?? {};
  const layout: DocumentLayout = {
    frame: pick(layoutIn.frame, FRAME_LAYOUTS, preset.layout.frame),
    parties: pick(layoutIn.parties, PARTIES_LAYOUTS, preset.layout.parties),
    table: pick(layoutIn.table, TABLE_LAYOUTS, preset.layout.table),
    totals: pick(layoutIn.totals, TOTALS_LAYOUTS, preset.layout.totals),
  };

  const primary = normalizeHex(raw.colors?.primary) ?? preset.colors.primary;
  const accent = normalizeHex(raw.colors?.accent) ?? preset.colors.accent;
  if (raw.colors?.primary !== undefined && !normalizeHex(raw.colors.primary)) warnings.push('Couleur principale invalide : couleur du modèle utilisée.');
  if (raw.colors?.accent !== undefined && !normalizeHex(raw.colors.accent)) warnings.push("Couleur d'accent invalide : couleur du modèle utilisée.");
  // La couleur choisie est respectée telle quelle ; un contraste faible est seulement signalé,
  // et uniquement pour une couleur choisie par l'organisation (les couleurs des modèles sont celles de la maquette).
  if (primary !== preset.colors.primary && ensureContrastOnWhite(primary, PRIMARY_MIN_CONTRAST).adjusted) warnings.push('Couleur principale peu contrastée : le texte risque d’être difficile à lire à l’impression.');
  if (accent !== preset.colors.accent && ensureContrastOnWhite(accent, ACCENT_MIN_CONTRAST).adjusted) warnings.push("Couleur d'accent peu contrastée : le texte risque d’être difficile à lire à l’impression.");

  const legacyLogo: Record<string, LogoLayout> = { left: 'left', above: 'above', hidden: 'none' };
  const logo = pick<LogoLayout>(raw.logo?.position !== undefined ? legacyLogo[raw.logo.position] : raw.logo, LOGO_LAYOUTS, 'left');

  const requested: unknown[] = Array.isArray(raw.columns) ? raw.columns : [...DEFAULT_COLUMNS];
  const columns = COLUMN_KEYS.filter((k) => REQUIRED_COLUMNS.includes(k) || requested.includes(k));

  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  let showPoweredBy = bool(raw.showPoweredBy, true);
  if (!showPoweredBy && !entitlements.canRemovePoweredBy) {
    showPoweredBy = true;
    warnings.push('Retirer « Émis avec Services » est inclus à partir du plan Pro.');
  }

  return {
    settings: {
      version: DOCUMENT_SETTINGS_VERSION,
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
      footerNote: cleanText(raw.footerNote, FOOTER_NOTE_MAX_LENGTH, warnings),
    },
    warnings,
  };
}

/** Identifiants du format v1 (catalogue « classic/bold/… ») vers les préréglages v2. */
const LEGACY_TEMPLATE_IDS: Record<string, PresetId> = {
  classic: 'modern', bold: 'brand', corporate: 'corporate', creative: 'fancy', minimal: 'minimal',
};

/** Le réglage diffère-t-il de son préréglage (bouton « Revenir au modèle ») ? */
export function isModifiedFromPreset(settings: DocumentTemplateSettings): boolean {
  const p = getDocumentPreset(settings.preset);
  return (
    settings.colors.primary !== p.colors.primary ||
    settings.colors.accent !== p.colors.accent ||
    (Object.keys(p.layout) as (keyof DocumentLayout)[]).some((k) => settings.layout[k] !== p.layout[k])
  );
}
