/**
 * Vue d'un rapport : normalisation STRICTE des données reçues (bornes, teintes connues,
 * blocs connus, textes nettoyés) et application du réglage de présentation de
 * l'organisation. Aucun calcul métier : la librairie ne fait que borner et mettre en forme.
 */
import { DEFAULT_DOCUMENT_SETTINGS } from './settings';
import { DOCUMENT_LOCALES, getDocumentLabels } from './i18n';
import { mix } from './color';
import { watermarkFontSize } from './view';
import type { DocumentTemplateSettings } from './types';
import {
  REPORT_COLUMN_BLOCK_TYPES, REPORT_TONES,
  type ReportActionItem, type ReportAgendaDay, type ReportBlock, type ReportDocumentData, type ReportLabels, type ReportMeta,
  type ReportRow, type ReportTone, type ReportView,
} from './report-types';

export const REPORT_MAX_BLOCKS = 40;
export const REPORT_MAX_ITEMS = 200;
export const REPORT_MAX_META = 4;
export const REPORT_MAX_TILES = 6;
export const REPORT_TITLE_MAX = 200;
export const REPORT_LINE_MAX = 400;
export const REPORT_TEXT_MAX = 6000;

const REPORT_LABELS: Record<string, Pick<ReportLabels, 'draft'>> = {
  fr: { draft: 'BROUILLON' }, en: { draft: 'DRAFT' }, es: { draft: 'BORRADOR' }, de: { draft: 'ENTWURF' },
};

/** Texte d'une ligne : contrôles retirés, espaces réduits, tronqué. */
export function reportLine(v: unknown, max = REPORT_LINE_MAX): string {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  return String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
/** Texte multi-lignes (synthèse) : sauts de ligne gardés. */
export function reportText(v: unknown, max = REPORT_TEXT_MAX): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
const opt = (v: unknown, max = REPORT_LINE_MAX): string | undefined => reportLine(v, max) || undefined;
const tone = (v: unknown): ReportTone | undefined => ((REPORT_TONES as readonly unknown[]).includes(v) ? (v as ReportTone) : undefined);
const ratio = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
const arr = <T>(v: unknown, max = REPORT_MAX_ITEMS): T[] => (Array.isArray(v) ? (v as T[]).slice(0, max) : []);
const strs = (v: unknown, max = 20): string[] => arr<unknown>(v, max).map((x) => reportLine(x, 120)).filter(Boolean);

function row(r: Partial<ReportRow> | null | undefined): ReportRow | null {
  if (!r || typeof r !== 'object') return null;
  const title = reportLine(r.title);
  if (!title) return null;
  const out: { -readonly [K in keyof ReportRow]: ReportRow[K] } = { title };
  if (r.lead && typeof r.lead === 'object' && reportLine(r.lead.text, 60)) out.lead = { text: reportLine(r.lead.text, 60), tone: tone(r.lead.tone) };
  if (r.check) out.check = true;
  if (opt(r.subtitle)) out.subtitle = opt(r.subtitle);
  const meta = strs(r.meta, 6);
  if (meta.length) out.meta = meta;
  if (opt(r.right, 80)) { out.right = opt(r.right, 80); out.rightTone = tone(r.rightTone); }
  if (opt(r.note)) { out.note = opt(r.note); out.noteTone = tone(r.noteTone); }
  if (r.progress && typeof r.progress === 'object' && reportLine(r.progress.label, 60)) {
    out.progress = { ratio: ratio(r.progress.ratio), label: reportLine(r.progress.label, 60), tone: tone(r.progress.tone) };
  }
  return out;
}

function action(a: Partial<ReportActionItem> | null | undefined): ReportActionItem | null {
  if (!a || typeof a !== 'object') return null;
  const title = reportLine(a.title);
  if (!title) return null;
  return {
    title, badge: opt(a.badge, 40), with: opt(a.with), owner: reportLine(a.owner, 120),
    due: opt(a.due, 60), status: opt(a.status, 60), statusTone: tone(a.statusTone),
  };
}

function day(d: Partial<ReportAgendaDay> | null | undefined): ReportAgendaDay | null {
  if (!d || typeof d !== 'object') return null;
  const label = reportLine(d.label, 60);
  if (!label) return null;
  const items = arr<any>(d.items, 40).map((i) => {
    const title = reportLine(i?.title);
    if (!title) return null;
    return {
      time: reportLine(i?.time, 30), kind: opt(i?.kind, 30), kindTone: tone(i?.kindTone), title,
      cancelled: !!i?.cancelled, location: opt(i?.location, 120), people: strs(i?.people, 8),
    };
  }).filter((x): x is NonNullable<typeof x> => !!x);
  return { label, items };
}

/** Bloc normalisé, ou null s'il est vide ou inconnu (il est alors ignoré, jamais inventé). */
export function normalizeReportBlock(raw: unknown, inColumn = false): ReportBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as any;
  const type = String(b.type ?? '');
  if (inColumn && !(REPORT_COLUMN_BLOCK_TYPES as readonly string[]).includes(type)) return null;
  switch (type) {
    case 'paragraph': {
      const text = reportText(b.text);
      return text ? { type, title: opt(b.title, 120), badge: opt(b.badge, 60), text } : null;
    }
    case 'callout': {
      const style = ['dark', 'light', 'tint'].includes(b.style) ? b.style : 'light';
      const items = arr<any>(b.items).map((i) => (typeof i === 'string' ? { text: reportLine(i) } : { text: reportLine(i?.text), tone: tone(i?.tone) })).filter((i) => i.text);
      return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), style, items } : null;
    }
    case 'list': {
      const items = arr<any>(b.items).map((i) => {
        const text = typeof i === 'string' ? reportLine(i) : reportLine(i?.text);
        if (!text) return null;
        const details = arr<any>(i?.details, 20).map((d) => ({ who: reportLine(d?.who, 80), text: reportLine(d?.text) })).filter((d) => d.who && d.text);
        return details.length ? { text, details } : { text };
      }).filter((i): i is NonNullable<typeof i> => !!i);
      return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), numbered: b.numbered !== false, items } : null;
    }
    case 'rows': {
      const rows = arr<any>(b.rows).map(row).filter((r): r is ReportRow => !!r);
      const empty = opt(b.empty, 160);
      if (!rows.length && !empty) return null;
      return { type, title: opt(b.title, 120), note: opt(b.note, 120), rows, empty };
    }
    case 'stats': {
      const tiles = arr<any>(b.tiles, REPORT_MAX_TILES).map((t) => ({ value: reportLine(t?.value, 24), label: reportLine(t?.label, 60), note: opt(t?.note, 80), tone: tone(t?.tone) })).filter((t) => t.value && t.label);
      return tiles.length ? { type, tiles } : null;
    }
    case 'bars': {
      const items = arr<any>(b.items, 30).map((i) => ({ label: reportLine(i?.label, 120), note: opt(i?.note, 120), value: reportLine(i?.value, 30), ratio: ratio(i?.ratio), tone: tone(i?.tone) })).filter((i) => i.label);
      return items.length ? { type, title: reportLine(b.title, 120), items } : null;
    }
    case 'distribution': {
      const segments = arr<any>(b.segments, 8).map((s) => ({ label: reportLine(s?.label, 60), count: typeof s?.count === 'number' && Number.isFinite(s.count) ? Math.max(0, Math.round(s.count)) : 0, tone: tone(s?.tone) })).filter((s) => s.label);
      return segments.length ? { type, title: reportLine(b.title, 120), segments } : null;
    }
    case 'people': {
      const people = arr<any>(b.people, 60).map((p) => ({ name: reportLine(p?.name, 120), role: opt(p?.role, 120) })).filter((p) => p.name);
      return people.length ? { type, title: reportLine(b.title, 120), people } : null;
    }
    case 'actions': {
      const items = arr<any>(b.items, 50).map(action).filter((a): a is ReportActionItem => !!a);
      return items.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), items } : null;
    }
    case 'agenda': {
      const days = arr<any>(b.days, 14).map(day).filter((d): d is ReportAgendaDay => !!d);
      return days.length ? { type, title: reportLine(b.title, 120), note: opt(b.note, 120), days } : null;
    }
    case 'columns': {
      if (inColumn) return null;
      const left = normalizeReportBlock(b.left, true);
      const right = normalizeReportBlock(b.right, true);
      if (left && right) return { type, left, right };
      return left ?? right;
    }
    default:
      return null;
  }
}

export interface BuildReportViewOptions {
  /** Réglage DÉJÀ normalisé (`normalizeDocumentSettings`) ; sinon le modèle par défaut. */
  readonly settings?: DocumentTemplateSettings;
}

export function buildReportView(data: ReportDocumentData, options: BuildReportViewOptions = {}): ReportView {
  const settings = options.settings ?? DEFAULT_DOCUMENT_SETTINGS;
  const language = settings.language;
  const L = getDocumentLabels(language);
  const locale = DOCUMENT_LOCALES[language];
  const primary = settings.colors.primary;
  const accent = settings.colors.accent;
  const blocks = (Array.isArray(data.blocks) ? data.blocks : []).slice(0, REPORT_MAX_BLOCKS)
    .map((b) => normalizeReportBlock(b)).filter((b): b is ReportBlock => !!b);
  const meta = (Array.isArray(data.meta) ? data.meta : []).slice(0, REPORT_MAX_META)
    .map((m): ReportMeta => ({ label: reportLine(m?.label, 60), value: reportLine(m?.value, 120) })).filter((m) => m.label && m.value);
  const draftLabel = (REPORT_LABELS[language] ?? REPORT_LABELS.fr).draft;
  const watermark = data.status === 'draft' && settings.statusWatermark ? draftLabel : undefined;
  const generatedAt = typeof data.generatedAt === 'string' && Number.isFinite(Date.parse(data.generatedAt)) ? data.generatedAt : undefined;
  return {
    kind: reportLine(data.kind, 40).replace(/[^a-z0-9_-]/gi, '') || 'report',
    language,
    locale,
    settings,
    theme: { primary, accent, accentTint: mix(accent, 0.14) },
    typeLabel: reportLine(data.typeLabel, 60),
    title: reportLine(data.title, REPORT_TITLE_MAX) || reportLine(data.typeLabel, 60),
    subtitle: opt(data.subtitle, 120),
    meta,
    issuer: { name: reportLine(data.issuer?.name, 120) },
    generatedAt,
    blocks,
    footer: { left: opt(data.footer?.left, 120), right: opt(data.footer?.right, 120), sources: opt(data.footer?.sources, 400) },
    labels: { poweredBy: L.poweredBy, page: L.page, of: L.of, continuation: L.continuation, draft: draftLabel },
    showLogo: settings.logo !== 'none',
    poweredBy: settings.showPoweredBy,
    watermark,
    watermarkSize: watermark ? watermarkFontSize(watermark) : undefined,
  };
}
