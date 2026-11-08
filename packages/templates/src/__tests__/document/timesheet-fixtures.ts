/**
 * Relevé de la maquette « Relevé de temps » : ZIT SAS pour Haddad Réceptions, mai 2026, au jour
 * (450 € / jour, TVA 20 %), 24 créneaux facturables de 4 h et un point interne non facturé.
 */
import type { TimesheetDocumentData, TimesheetLineData } from '../../document/timesheet-types';

const slot = (date: string, start: string, end: string, label: string, billable = true): TimesheetLineData => {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  return { date, start, end, label, minutes, billable, amountMinor: billable ? Math.round((minutes / 480) * 45000) : 0 };
};

export function mayLines(): TimesheetLineData[] {
  const am = ['09:00', '13:00'] as const;
  const pm = ['14:00', '18:00'] as const;
  const day = (d: string, label: string, half = false) => (half ? [slot(d, ...am, label)] : [slot(d, ...am, label), slot(d, ...pm, label)]);
  return [
    ...day('2026-05-04', 'Cadrage technique'), ...day('2026-05-05', 'Schéma de données'), ...day('2026-05-06', 'API de réservation'),
    ...day('2026-05-07', 'API de réservation', true),
    ...day('2026-05-11', 'Portail — sélection du créneau'), ...day('2026-05-12', 'Portail — récapitulatif'), ...day('2026-05-13', 'Paiement et confirmation'),
    ...day('2026-05-15', 'Paiement et confirmation', true),
    ...day('2026-05-18', 'Recette client'), ...day('2026-05-19', 'Reprise des anomalies relevées pendant la recette client'),
    ...day('2026-05-20', 'Reprise des anomalies'), ...day('2026-05-21', 'Mise en production'),
    slot('2026-05-22', '09:00', '13:00', 'Mise en production'), slot('2026-05-22', '14:00', '18:00', 'Documentation technique'),
    slot('2026-05-22', '18:00', '19:00', "Point d'avancement interne", false),
  ];
}

export function mayTimesheet(over: Partial<TimesheetDocumentData> = {}): TimesheetDocumentData {
  const lines = mayLines();
  const billable = lines.filter((l) => l.billable);
  const billableMinutes = billable.reduce((s, l) => s + l.minutes, 0);
  return {
    reference: 'RT-2026-05-014', month: 5, year: 2026, issuedAt: '2026-06-02T07:14:00.000Z', status: 'approved',
    provider: {
      name: 'ZIT SAS', city: 'Courbevoie', addressLines: ['95 rue du Capitaine Guynemer', '92400 Courbevoie, France'],
      legalIds: ['SIRET 915 335 517 00024'], person: 'Zang N.',
    },
    client: { name: 'Haddad Réceptions', addressLines: ['14 avenue de la République', '75011 Paris, France'], person: 'Leïla Haddad', purchaseOrder: 'BC-2026-044' },
    projectName: 'Développement Web & API — Refonte du portail de réservation',
    unit: 'day', rateMinor: 45000, currency: 'EUR', vatPercent: 20,
    lines,
    adjustments: [],
    totals: {
      totalMinutes: lines.reduce((s, l) => s + l.minutes, 0), billableMinutes, adjustmentMinutes: 0, billableLines: billable.length,
      workedDays: new Set(billable.map((l) => l.date)).size, quantity: billableMinutes / 480, amountMinor: Math.round((billableMinutes / 480) * 45000),
    },
    submittedAt: '2026-06-02T07:14:00.000Z', submittedBy: 'Zang N.',
    validation: { decision: 'approved', name: 'Leïla Haddad', decidedAt: '2026-06-02T14:38:00.000Z', channel: 'link', fingerprint: '7F3A C041' },
    legal: 'ZIT SAS · 95 rue du Capitaine Guynemer, 92400 Courbevoie · SIRET 915 335 517 00024',
    ...over,
  };
}
