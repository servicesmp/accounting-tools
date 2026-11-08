/**
 * Relevé de temps : vue (textes, groupes par jour et par semaine, totaux de la plateforme,
 * validation), HTML (échappement, logo selon le plan, mention Services) et PDF (une page en
 * version simple, pagination de la version détaillée, logo seulement s'il est permis).
 */
import { PDFDocument } from 'pdf-lib';
import { buildTimesheetView, renderTimesheetHtml } from '../../document';
import { FULL_DOCUMENT_ENTITLEMENTS, NO_DOCUMENT_ENTITLEMENTS, normalizeDocumentSettings } from '../../document/settings';
import { generateTimesheetPdf } from '../../document-pdf';
import { mayTimesheet } from './timesheet-fixtures';

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const full = normalizeDocumentSettings({}, FULL_DOCUMENT_ENTITLEMENTS).settings;
/** Logo du prestataire (image 1 × 1 ici), distinct du logo Services du pied. */
const hasProviderLogo = (pdf: Uint8Array) => /\/Width 1\s*\/Height 1\b/.test(Buffer.from(pdf).toString('latin1'));

describe('buildTimesheetView', () => {
  it('version simple : une ligne par jour facturé, total de la plateforme, aucune somme', () => {
    const v = buildTimesheetView(mayTimesheet(), { settings: full });
    expect(v.title).toBe('Relevé de temps');
    expect(v.subtitle).toBe('ZIT SAS · Courbevoie');
    expect(v.meta).toEqual([{ label: 'Numéro', value: 'RT-2026-05-014' }, { label: 'Période', value: 'Mai 2026' }, { label: 'Émis le', value: '02/06/2026' }]);
    expect(v.status).toEqual({ label: 'Approuvé', tone: 'success' });
    expect(v.simple.columns).toEqual(['Jour', 'Durée', 'Équivalent']);
    expect(v.simple.rows).toHaveLength(13);
    expect(v.simple.rows[0]).toEqual({ day: 'Lundi 4 mai', duration: '8 h', equivalent: '1 j' });
    expect(v.simple.rows[3]).toMatchObject({ day: 'Jeudi 7 mai', duration: '4 h', equivalent: '0,5 j' });
    expect(v.simple.total).toEqual({ day: 'Total · 13 jours travaillés', duration: '96 h', equivalent: '12 j' });
    expect(v.band.map((b) => b.label)).toEqual(['Prestation', 'Jours travaillés', 'Journée de référence']);
    // Le titre de prestation n'est jamais tronqué ; aucune somme dans la version simple.
    expect(v.band[0].value).toBe('Développement Web & API — Refonte du portail de réservation');
    expect(JSON.stringify(v.simple)).not.toMatch(/€/);
  });

  it('version détaillée : semaines ISO, sous-totaux facturables, créneau hors facturation, décompte HT / TVA / TTC', () => {
    const v = buildTimesheetView(mayTimesheet(), { settings: full, variant: 'detailed' });
    expect(v.subtitle).toBe('ZIT SAS · Courbevoie · version détaillée');
    expect(v.detailed.weeks.map((w) => w.label)).toEqual(['Semaine 19 · 4 – 7 mai', 'Semaine 20 · 11 – 15 mai', 'Semaine 21 · 18 – 22 mai']);
    const w21 = v.detailed.weeks[2];
    expect(w21.subtotal).toEqual({ label: 'Sous-total · Semaine 21 · 18 – 22 mai', duration: '40 h', amount: '2 250,00 €' });
    expect(w21.rows[w21.rows.length - 1]).toMatchObject({ slot: '18:00 – 19:00', billable: 'Non', amount: '—', excluded: true });
    expect(v.detailed.notes).toEqual([{ label: "Hors facturation · Point d'avancement interne (22 mai), exclu du décompte.", value: '− 1 h' }]);
    expect(v.detailed.summary).toEqual([
      { label: 'Temps saisi · 13 jours', value: '97 h' },
      { label: 'Hors facturation', value: '− 1 h' },
      { label: 'Quantité facturable', value: '12 j × 450,00 €' },
      { label: 'Hors taxes · TVA 20 %', value: '5 400,00 € · 1 080,00 €' },
    ]);
    expect(v.detailed.grandTotal).toEqual({ label: 'À facturer TTC', value: '6 480,00 €' });
  });

  it('validation : soumis par, approuvé (canal, horodatage, empreinte), refusé (motif), en attente, brouillon', () => {
    const approved = buildTimesheetView(mayTimesheet(), { settings: full });
    expect(approved.submitted).toEqual({ heading: 'Soumis par', tone: 'neutral', name: 'Zang N.', lines: ['ZIT SAS · intervenant sur la prestation', 'Le 2 juin 2026 à 09 h 14'] });
    expect(approved.decision).toEqual({ heading: 'Approuvé par le client', tone: 'success', name: 'Leïla Haddad', lines: ['Lien de validation reçu par e-mail', 'Le 2 juin 2026 à 16 h 38 · empreinte 7F3A C041'] });
    const rejected = buildTimesheetView(mayTimesheet({ status: 'rejected', validation: { decision: 'rejected', name: 'L. H.', decidedAt: '2026-06-03T08:00:00Z', channel: 'account', reason: 'Le 22 est en double' } }), { settings: full });
    expect(rejected.decision).toMatchObject({ heading: 'Refusé par le client', tone: 'danger', emphasis: 'Motif : Le 22 est en double' });
    expect(rejected.decision.lines[0]).toBe('Depuis son espace client');
    const pending = buildTimesheetView(mayTimesheet({ status: 'submitted', validation: null }), { settings: full });
    expect(pending.decision).toMatchObject({ heading: 'Validation du client', lines: ['En attente depuis le 2 juin'] });
    const draft = buildTimesheetView(mayTimesheet({ status: 'draft', reference: null, submittedAt: null, validation: null }), { settings: full });
    expect(draft.submitted.lines).toEqual(['Non encore soumis']);
    expect(draft.decision.lines).toEqual([]);
    // Pas de « Référence : attribuée à la soumission » : le numéro est absent tant qu'il n'existe pas.
    expect(draft.meta.map((m) => m.label)).toEqual(['Période', 'Émis le']);
    expect(draft.watermark).toBe('BROUILLON');
  });

  it('au taux horaire : pas de colonne « Équivalent » ; sans taux ni TVA : aucun montant inventé', () => {
    const base = mayTimesheet();
    const hourly = buildTimesheetView({ ...base, unit: 'hour' }, { settings: full });
    expect(hourly.simple.columns).toEqual(['Jour', 'Durée']);
    expect(hourly.simple.total.equivalent).toBeUndefined();
    const noRate = buildTimesheetView({ ...base, rateMinor: 0, vatPercent: null }, { settings: full, variant: 'detailed' });
    expect(noRate.detailed.grandTotal).toBeUndefined();
    expect(noRate.detailed.weeks[0].rows[0].amount).toBe('—');
    const noVat = buildTimesheetView({ ...base, vatPercent: null }, { settings: full, variant: 'detailed' });
    expect(noVat.detailed.grandTotal).toEqual({ label: 'À facturer HT', value: '5 400,00 €' });
  });

  it('temps inclus (forfait, échéancier) : la raison remplace le taux et les montants, jamais « 0,00 € »', () => {
    const base = mayTimesheet();
    const fixed = buildTimesheetView({ ...base, billing: { mode: 'included', reason: 'fixed_price' } }, { settings: full, variant: 'detailed' });
    expect(fixed.band[1]).toEqual({ label: 'Taux', value: 'Temps inclus au forfait' });
    expect(fixed.detailed.grandTotal).toBeUndefined();
    expect(fixed.detailed.weeks[0].rows[0].amount).toBe('—');
    expect(fixed.detailed.weeks[0].subtotal.amount).toBe('');
    expect(fixed.detailed.summary).toContainEqual({ label: 'Mode de facturation', value: 'Temps inclus au forfait' });
    expect(JSON.stringify(fixed.detailed)).not.toMatch(/€/);
    const schedule = buildTimesheetView({ ...base, billing: { mode: 'included', reason: 'schedule' } }, { settings: full });
    expect(schedule.note).toContain("Réglé selon l'échéancier de la prestation.");
    expect(schedule.note).not.toContain('facture correspondante');
  });

  it('langue du document et plan : anglais ; sans personnalisation, pas de logo mais la mention Services', () => {
    const en = buildTimesheetView(mayTimesheet({ language: 'en' }), { settings: full });
    expect(en.title).toBe('Timesheet');
    expect(en.simple.rows[0].day).toBe('Monday 4 May');
    const basic = buildTimesheetView(mayTimesheet(), { settings: normalizeDocumentSettings({ logo: 'left' }, NO_DOCUMENT_ENTITLEMENTS).settings });
    expect(basic.showLogo).toBe(false);
    expect(basic.poweredBy).toBe(true);
  });
});

describe('renderTimesheetHtml', () => {
  it('échappe les textes, n’affiche le logo que si le réglage le permet, mention Services en pied', () => {
    const data = mayTimesheet({ projectName: '<script>alert(1)</script>' });
    const html = renderTimesheetHtml(buildTimesheetView(data, { settings: full }), { logoUrl: 'https://cdn.example.com/logo.png', servicesLogoUrl: '/services.png' });
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('src="https://cdn.example.com/logo.png"');
    expect(html).toContain('Document émis avec');
    expect(html).toContain('alt="Services"');
    expect(html).toContain('Page 1 / 1');
    const basic = renderTimesheetHtml(buildTimesheetView(data, { settings: normalizeDocumentSettings({}, NO_DOCUMENT_ENTITLEMENTS).settings }), { logoUrl: 'https://cdn.example.com/logo.png' });
    expect(basic).not.toContain('cdn.example.com');
    expect(renderTimesheetHtml(buildTimesheetView(data, { settings: full }), { logoUrl: 'javascript:alert(1)' })).not.toContain('javascript:');
  });
});

describe('generateTimesheetPdf', () => {
  it('version simple : une page ; détaillée : deux pages ; logo seulement avec le droit de personnaliser', async () => {
    const simple = await generateTimesheetPdf({ data: mayTimesheet(), logo: PNG_1PX, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(Buffer.from(simple.pdf).subarray(0, 5).toString()).toBe('%PDF-');
    expect(simple.pageCount).toBe(1);
    expect(hasProviderLogo(simple.pdf)).toBe(true);
    const detailed = await generateTimesheetPdf({ data: mayTimesheet(), variant: 'detailed', logo: PNG_1PX, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(detailed.pageCount).toBe(2);
    expect((await PDFDocument.load(detailed.pdf, { updateMetadata: false })).getPageCount()).toBe(2);
    const basic = await generateTimesheetPdf({ data: mayTimesheet(), logo: PNG_1PX, entitlements: NO_DOCUMENT_ENTITLEMENTS });
    expect(hasProviderLogo(basic.pdf)).toBe(false);
    const broken = await generateTimesheetPdf({ data: mayTimesheet(), logo: Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 9]), entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(broken.pageCount).toBe(1);
  }, 30000);

  it('beaucoup de créneaux : pagination sans erreur, une page de plus par débordement', async () => {
    const base = mayTimesheet();
    const many = Array.from({ length: 120 }, (_, i) => ({ ...base.lines[i % base.lines.length], label: `Tâche ${i} — ${'travail réalisé '.repeat(3)}` }));
    const r = await generateTimesheetPdf({ data: { ...base, lines: many }, variant: 'detailed', entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(r.pageCount).toBeGreaterThan(3);
    const empty = await generateTimesheetPdf({ data: { ...base, lines: [], totals: { ...base.totals, totalMinutes: 0, billableMinutes: 0, workedDays: 0, quantity: 0, amountMinor: 0, billableLines: 0 } }, variant: 'detailed' });
    expect(empty.pageCount).toBe(1);
  }, 30000);
});
