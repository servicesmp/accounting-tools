import { PDFDocument } from 'pdf-lib';
import { buildReportView, normalizeReportBlock, renderReportHtml, REPORT_MAX_BLOCKS } from '../../document';
import { normalizeDocumentSettings, FULL_DOCUMENT_ENTITLEMENTS, NO_DOCUMENT_ENTITLEMENTS, DOCUMENT_PRESETS } from '../../document/settings';
import { generateReportPdf } from '../../document-pdf';
import { activityReport, meetingMinutes, taskReport } from './report-fixtures';

describe('buildReportView', () => {
  it('normalise : blocs inconnus ignorés, textes nettoyés et bornés, teintes inconnues retirées', () => {
    const view = buildReportView({
      kind: 'x y/z', typeLabel: ' Rapport\u0000 ', title: 'T'.repeat(500), issuer: { name: 'Org' },
      blocks: [
        { type: 'unknown' } as any,
        { type: 'paragraph', text: '  ' } as any,
        { type: 'rows', rows: [{ title: 'A', right: 'B', rightTone: 'pink' as any }] },
        { type: 'stats', tiles: Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: 'l' })) },
        { type: 'columns', left: { type: 'actions', title: 'x', items: [{ title: 'a', owner: 'o' }] }, right: { type: 'bars', title: 'b', items: [{ label: 'l', value: '1', ratio: 7 }] } },
      ],
      meta: Array.from({ length: 8 }, (_, i) => ({ label: `l${i}`, value: `v${i}` })),
      status: 'draft',
    }, { settings: normalizeDocumentSettings({ statusWatermark: true }, FULL_DOCUMENT_ENTITLEMENTS).settings });
    expect(view.kind).toBe('xyz');
    expect(view.typeLabel).toBe('Rapport');
    expect(view.title).toHaveLength(200);
    expect(view.meta).toHaveLength(4);
    expect(view.blocks.map((b) => b.type)).toEqual(['rows', 'stats', 'bars']);
    expect((view.blocks[0] as any).rows[0].rightTone).toBeUndefined();
    expect((view.blocks[1] as any).tiles).toHaveLength(6);
    expect((view.blocks[2] as any).items[0].ratio).toBe(1);
    expect(view.watermark).toBe('BROUILLON');
  });

  it('limite le nombre de blocs et refuse les colonnes imbriquées', () => {
    const blocks = Array.from({ length: REPORT_MAX_BLOCKS + 5 }, () => ({ type: 'paragraph' as const, text: 'x' }));
    expect(buildReportView({ kind: 'k', typeLabel: 't', title: 't', issuer: { name: 'o' }, blocks }).blocks).toHaveLength(REPORT_MAX_BLOCKS);
    expect(normalizeReportBlock({ type: 'columns', left: { type: 'columns', left: {}, right: {} }, right: { type: 'list', title: 't', items: ['a'] } })).toMatchObject({ type: 'list' });
  });

  it('suit le réglage de présentation : langue, couleurs, logo, mention Services', () => {
    const s = normalizeDocumentSettings({ language: 'en', preset: 'fancy', logo: 'none', showPoweredBy: false }, FULL_DOCUMENT_ENTITLEMENTS).settings;
    const view = buildReportView(meetingMinutes(), { settings: s });
    expect(view.language).toBe('en');
    expect(view.labels.page).toBe('Page');
    expect(view.theme.primary).toBe(s.colors.primary);
    expect(view.showLogo).toBe(false);
    expect(view.poweredBy).toBe(false);
    const basic = buildReportView(meetingMinutes(), { settings: normalizeDocumentSettings({ showPoweredBy: false }, NO_DOCUMENT_ENTITLEMENTS).settings });
    expect(basic.poweredBy).toBe(true);
  });
});

describe('renderReportHtml', () => {
  it('rend les trois documents, échappe les textes et filtre les URL', () => {
    for (const data of [meetingMinutes(), taskReport(), activityReport()]) {
      const html = renderReportHtml(buildReportView(data), { logoUrl: 'javascript:alert(1)', servicesLogoUrl: '/brand/services-logo.png' });
      expect(html).toContain('class="acc-report acc-report--');
      expect(html).not.toContain('javascript:');
      expect(html).toContain('Document émis avec');
      expect(html).toContain('Page 1 sur 1');
    }
    const view = buildReportView({ ...taskReport(), title: '<b>x</b> & y' });
    const html = renderReportHtml(view);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt; &amp; y');
    expect(html).not.toContain('<b>x</b>');
  });

  it('n’affiche le logo que si le réglage l’autorise', () => {
    const withLogo = renderReportHtml(buildReportView(taskReport(), { settings: normalizeDocumentSettings({ logo: 'left' }, FULL_DOCUMENT_ENTITLEMENTS).settings }), { logoUrl: 'https://x/logo.png' });
    expect(withLogo).toContain('https://x/logo.png');
    const noLogo = renderReportHtml(buildReportView(taskReport(), { settings: normalizeDocumentSettings({ logo: 'none' }, FULL_DOCUMENT_ENTITLEMENTS).settings }), { logoUrl: 'https://x/logo.png' });
    expect(noLogo).not.toContain('https://x/logo.png');
    expect(noLogo).toContain('Atelier Roux');
  });
});

describe('generateReportPdf', () => {
  it.each([['compte rendu', meetingMinutes()], ['rapport de tâche', taskReport()], ['rapport d’activité', activityReport()]])('%s : PDF valide pour chaque préréglage', async (_n, data) => {
    for (const preset of DOCUMENT_PRESETS) {
      const res = await generateReportPdf({ data, settings: { preset: preset.id, statusWatermark: true }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
      expect(Buffer.from(res.pdf.subarray(0, 5)).toString()).toBe('%PDF-');
      expect(res.pageCount).toBeGreaterThanOrEqual(1);
      const doc = await PDFDocument.load(res.pdf);
      expect(doc.getPageCount()).toBe(res.pageCount);
      expect(doc.getTitle()).toBe(data.title);
    }
  }, 60000);

  it('pagine : beaucoup de lignes, un long encart et des colonnes trop hautes passent sur plusieurs pages', async () => {
    const data = activityReport();
    const many = { ...data, blocks: [
      ...data.blocks,
      { type: 'rows' as const, title: 'Beaucoup de lignes', rows: Array.from({ length: 80 }, (_, i) => ({ title: `Ligne ${i + 1}`, right: `${i} h` })) },
      { type: 'callout' as const, title: 'Long encart', style: 'dark' as const, items: Array.from({ length: 60 }, (_, i) => ({ text: `Décision ${i + 1} : un texte suffisamment long pour occuper une ligne entière de la page, voire deux lignes.` })) },
      { type: 'columns' as const, left: { type: 'rows' as const, title: 'Gauche', rows: Array.from({ length: 60 }, (_, i) => ({ title: `G ${i}` })) }, right: { type: 'rows' as const, title: 'Droite', rows: [{ title: 'D 1' }] } },
    ] };
    const res = await generateReportPdf({ data: many, settings: { preset: 'modern' }, entitlements: FULL_DOCUMENT_ENTITLEMENTS });
    expect(res.pageCount).toBeGreaterThan(3);
    const doc = await PDFDocument.load(res.pdf);
    expect(doc.getPageCount()).toBe(res.pageCount);
  }, 60000);

  it('sans droit de personnalisation : réglage ignoré, mention Services conservée', async () => {
    const res = await generateReportPdf({ data: taskReport(), settings: { preset: 'fancy', showPoweredBy: false }, entitlements: NO_DOCUMENT_ENTITLEMENTS });
    expect(res.view.poweredBy).toBe(true);
    expect(res.view.settings.preset).toBe('modern');
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
