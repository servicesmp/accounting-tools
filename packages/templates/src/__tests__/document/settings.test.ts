import {
  normalizeDocumentSettings, presetSettings, DEFAULT_DOCUMENT_SETTINGS, DOCUMENT_PRESETS,
  FULL_DOCUMENT_ENTITLEMENTS, NO_DOCUMENT_ENTITLEMENTS, BASIC_DOCUMENT_SETTINGS, isModifiedFromPreset, PRIMARY_MIN_CONTRAST,
} from '../../document/settings';
import { contrastRatio } from '../../document/color';

const STARTER = { canCustomize: true, canRemovePoweredBy: false };

describe('normalizeDocumentSettings', () => {
  it('sans droit : modèle par défaut SANS logo et mention « Émis avec Services » imposés', () => {
    const { settings, warnings } = normalizeDocumentSettings({ preset: 'brand', logo: 'left', showPoweredBy: false }, NO_DOCUMENT_ENTITLEMENTS);
    expect(settings).toEqual(BASIC_DOCUMENT_SETTINGS);
    expect(settings.logo).toBe('none');
    expect(settings.preset).toBe('modern');
    expect(settings.showPoweredBy).toBe(true);
    expect(warnings[0]).toMatch(/pas incluse dans votre plan/);
  });

  it('avec droit, le modèle par défaut garde le logo (le modèle sans logo est réservé aux plans sans personnalisation)', () => {
    expect(DEFAULT_DOCUMENT_SETTINGS.logo).toBe('left');
    expect(normalizeDocumentSettings(undefined, FULL_DOCUMENT_ENTITLEMENTS).settings).toEqual(DEFAULT_DOCUMENT_SETTINGS);
    expect(BASIC_DOCUMENT_SETTINGS).toEqual({ ...DEFAULT_DOCUMENT_SETTINGS, logo: 'none' });
  });

  it('sans droit mais sans demande : aucune alerte', () => {
    expect(normalizeDocumentSettings(undefined).warnings).toEqual([]);
  });

  it('la langue reste choisissable sans droit', () => {
    expect(normalizeDocumentSettings({ language: 'en' }).settings.language).toBe('en');
  });

  it('Starter : personnalisation complète mais mention « Émis avec Services » conservée', () => {
    const { settings, warnings } = normalizeDocumentSettings({
      preset: 'corporate', colors: { primary: '#123456', accent: '#7a1f1f' },
      layout: { frame: 'band', parties: 'card', table: 'filled', totals: 'plain' },
      logo: 'above', columns: ['ref', 'description', 'quantity', 'lineTotal'], showPoweredBy: false,
    }, STARTER);
    expect(settings.preset).toBe('corporate');
    expect(settings.layout).toEqual({ frame: 'band', parties: 'card', table: 'filled', totals: 'plain' });
    expect(settings.logo).toBe('above');
    expect(settings.columns).toEqual(['ref', 'description', 'quantity', 'lineTotal']);
    expect(settings.showPoweredBy).toBe(true);
    expect(warnings).toEqual(['Retirer « Émis avec Services » est inclus à partir du plan Pro.']);
  });

  it('Pro : la mention peut être retirée', () => {
    expect(normalizeDocumentSettings({ showPoweredBy: false }, FULL_DOCUMENT_ENTITLEMENTS).settings.showPoweredBy).toBe(false);
  });

  it('colonnes obligatoires toujours présentes, ordre canonique, inconnues ignorées', () => {
    const { settings } = normalizeDocumentSettings({ columns: ['vatRate', 'hack', 'unit'] }, STARTER);
    expect(settings.columns).toEqual(['description', 'quantity', 'unit', 'vatRate', 'lineTotal']);
  });

  it('valeurs de mise en page inconnues → valeurs du préréglage', () => {
    const { settings } = normalizeDocumentSettings({ preset: 'minimal', layout: { frame: 'x', table: 'y' } }, STARTER);
    expect(settings.layout).toEqual(DOCUMENT_PRESETS.find((p) => p.id === 'minimal')!.layout);
  });

  it('respecte une couleur peu lisible choisie par l’organisation mais la signale', () => {
    const { settings, warnings } = normalizeDocumentSettings({ colors: { primary: '#fff59d', accent: '#ffeb3b' } }, STARTER);
    expect(settings.colors).toEqual({ primary: '#fff59d', accent: '#ffeb3b' });
    expect(warnings).toHaveLength(2);
    expect(warnings.join(' ')).toMatch(/principale peu contrastée/);
    expect(warnings.join(' ')).toMatch(/accent peu contrastée/);
  });

  it('ne signale pas les couleurs d’un préréglage (couleurs de la maquette)', () => {
    for (const p of DOCUMENT_PRESETS) {
      const { settings, warnings } = normalizeDocumentSettings({ preset: p.id, colors: p.colors }, STARTER);
      expect(settings.colors).toEqual(p.colors);
      expect(warnings).toEqual([]);
    }
  });

  it('accepte l’ancien format v1 (templateId, logo.position)', () => {
    const { settings } = normalizeDocumentSettings({ templateId: 'bold', logo: { position: 'hidden' }, footerNote: ' Merci ' }, STARTER);
    expect(settings.preset).toBe('brand');
    expect(settings.logo).toBe('none');
    expect(settings.footerNote).toBe('Merci');
  });

  it('borne la mention libre', () => {
    const { settings, warnings } = normalizeDocumentSettings({ footerNote: 'x'.repeat(400) }, STARTER);
    expect(settings.footerNote).toHaveLength(280);
    expect(warnings[0]).toMatch(/tronquée/);
  });

  it('couleur principale des préréglages lisible et « modifié » détecté', () => {
    for (const p of DOCUMENT_PRESETS) {
      // Couleur principale = couleur du texte des totaux / en-têtes : doit rester lisible.
      expect(contrastRatio(p.colors.primary, '#fff')).toBeGreaterThanOrEqual(PRIMARY_MIN_CONTRAST);
      expect(isModifiedFromPreset(presetSettings(p.id))).toBe(false);
    }
    expect(isModifiedFromPreset({ ...presetSettings('brand'), layout: { ...presetSettings('brand').layout, table: 'lines' } })).toBe(true);
  });
});
