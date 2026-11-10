"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMESHEET_LABELS = exports.TIMESHEET_MAX_LINES = void 0;
exports.timesheetDuration = timesheetDuration;
exports.buildTimesheetView = buildTimesheetView;
/**
 * Vue d'un relevé de temps : textes prêts à imprimer (dates, durées, montants, libellés dans la
 * langue du document), lignes groupées par jour (version simple) ou par semaine (version
 * détaillée), blocs de validation. Aucun total recalculé : ceux de la plateforme font foi ; les
 * sous-totaux de semaine additionnent les lignes reçues.
 */
const settings_1 = require("./settings");
const types_1 = require("./types");
const format_1 = require("./format");
const view_1 = require("./view");
exports.TIMESHEET_MAX_LINES = 2000;
const TEXT_MAX = 300;
const DEFAULT_MINUTES_PER_DAY = 480;
const LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE' };
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const fr = {
    title: 'Relevé de temps', colon: ' : ', detailedVersion: 'version détaillée', number: 'Numéro', period: 'Période', issued: 'Émis le', status: 'Statut',
    statuses: { draft: 'Brouillon', submitted: 'Chez le client', rejected: 'Refusé', approved: 'Approuvé', invoiced: 'Facturé', paid: 'Payé', cancelled: 'Annulé' },
    provider: 'Prestataire', client: 'Client', contributor: 'Intervenant', attention: "À l'attention de", purchaseOrder: 'Bon de commande',
    service: 'Prestation', workedDays: 'Jours travaillés', referenceDay: 'Journée de référence', timeEntered: 'Temps saisi', deliverables: 'Livrables',
    rate: 'Taux', slots: 'Créneaux saisis', day: 'Jour', date: 'Date', slot: 'Créneau', task: 'Tâche', duration: 'Durée', equivalent: 'Équivalent',
    billable: 'Fact.', amount: 'Montant', yes: 'Oui', no: 'Non', week: 'Semaine', subtotal: 'Sous-total', total: 'Total', adjustment: 'Ajustement',
    offBilling: 'Hors facturation', billingMode: 'Mode de facturation',
    billingModes: {
        hour: 'Régie au temps passé, facturation sur relevé validé par le client.',
        day: 'Régie au jour, facturation sur relevé validé par le client.',
        deliverable: 'Au livrable, facturation sur relevé validé par le client.',
    },
    quantity: 'Quantité facturable', preTax: 'Hors taxes', vat: 'TVA', toInvoice: 'À facturer TTC', toInvoicePreTax: 'À facturer HT',
    submittedBy: 'Soumis par', notSubmitted: 'Non encore soumis', contributorOn: 'intervenant sur la prestation',
    clientDecision: { pending: 'Validation du client', approved: 'Approuvé par le client', rejected: 'Refusé par le client', none: 'Validation du client' },
    channel: { link: 'Lien de validation reçu par e-mail', account: 'Depuis son espace client' },
    pendingSince: 'En attente depuis le', reason: 'Motif', fingerprint: 'empreinte', poweredBy: 'Document émis avec', page: 'Page', of: '/',
    continuedOn: 'suite page', draft: 'BROUILLON', noEntries: 'Aucun temps saisi sur la période.', dayUnit: 'j',
    daysCount: (n) => plural(n, 'jour', 'jours'), deliverablesCount: (n) => plural(n, 'livrable', 'livrables'), slotsCount: (n) => plural(n, 'créneau', 'créneaux'),
    totalWorked: (days) => `Total : ${days} travaillé${days.startsWith('1 ') ? '' : 's'}`,
    excluded: (what) => `Hors facturation : ${what}, exclu du décompte.`,
    referenceDayNote: (d) => `Journée de référence ${d}.`,
    approvalNote: 'Une fois ce relevé approuvé, la facture correspondante est établie au tarif prévu au contrat.',
    closingSimple: 'Le détail des créneaux figure dans la version détaillée de ce relevé.',
    closingDetailed: "Chaque créneau provient d'une saisie horodatée sur la prestation.",
    at: (d, t) => `Le ${d} à ${t.replace(':', ' h ')}`,
    included: { fixed_price: 'Temps inclus au forfait', schedule: "Réglé selon l'échéancier de la prestation", no_rate: 'Taux non communiqué' },
    timeBilled: 'Temps facturé',
};
const en = {
    ...fr,
    colon: ': ',
    title: 'Timesheet', detailedVersion: 'detailed version', number: 'Number', period: 'Period', issued: 'Issued on', status: 'Status',
    statuses: { draft: 'Draft', submitted: 'With the client', rejected: 'Rejected', approved: 'Approved', invoiced: 'Invoiced', paid: 'Paid', cancelled: 'Cancelled' },
    provider: 'Provider', client: 'Client', contributor: 'Consultant', attention: 'Attention of', purchaseOrder: 'Purchase order',
    service: 'Service', workedDays: 'Days worked', referenceDay: 'Reference day', timeEntered: 'Time entered', deliverables: 'Deliverables',
    rate: 'Rate', slots: 'Time entries', day: 'Day', date: 'Date', slot: 'Slot', task: 'Task', duration: 'Duration', equivalent: 'Equivalent',
    billable: 'Bill.', amount: 'Amount', yes: 'Yes', no: 'No', week: 'Week', subtotal: 'Subtotal', total: 'Total', adjustment: 'Adjustment',
    offBilling: 'Not billed', billingMode: 'Billing',
    billingModes: {
        hour: 'Time and materials, hourly, invoiced on the timesheet approved by the client.',
        day: 'Time and materials, daily, invoiced on the timesheet approved by the client.',
        deliverable: 'Per deliverable, invoiced on the timesheet approved by the client.',
    },
    quantity: 'Billable quantity', preTax: 'Excl. tax', vat: 'VAT', toInvoice: 'To invoice incl. tax', toInvoicePreTax: 'To invoice excl. tax',
    submittedBy: 'Submitted by', notSubmitted: 'Not submitted yet', contributorOn: 'consultant on the engagement',
    clientDecision: { pending: 'Client approval', approved: 'Approved by the client', rejected: 'Rejected by the client', none: 'Client approval' },
    channel: { link: 'Approval link received by email', account: 'From their client area' },
    pendingSince: 'Pending since', reason: 'Reason', fingerprint: 'fingerprint', poweredBy: 'Issued with', continuedOn: 'continued on page',
    draft: 'DRAFT', noEntries: 'No time entered for the period.', dayUnit: 'd',
    daysCount: (n) => plural(n, 'day', 'days'), deliverablesCount: (n) => plural(n, 'deliverable', 'deliverables'), slotsCount: (n) => plural(n, 'entry', 'entries'),
    totalWorked: (days) => `Total: ${days} worked`,
    excluded: (what) => `Not billed: ${what}, excluded from the count.`,
    referenceDayNote: (d) => `Reference day ${d}.`,
    approvalNote: 'Once this timesheet is approved, the matching invoice is issued at the rate set in the contract.',
    closingSimple: 'Each time entry is listed in the detailed version of this timesheet.',
    closingDetailed: 'Each entry comes from a time-stamped record on the engagement.',
    at: (d, t) => `On ${d} at ${t}`,
    included: { fixed_price: 'Time included in the fixed price', schedule: 'Settled per the engagement payment schedule', no_rate: 'Rate not provided' },
    timeBilled: 'Time billed',
};
const es = {
    ...fr,
    colon: ': ',
    title: 'Relación de horas', detailedVersion: 'versión detallada', number: 'Número', period: 'Periodo', issued: 'Emitido el', status: 'Estado',
    statuses: { draft: 'Borrador', submitted: 'En el cliente', rejected: 'Rechazado', approved: 'Aprobado', invoiced: 'Facturado', paid: 'Pagado', cancelled: 'Cancelado' },
    provider: 'Proveedor', client: 'Cliente', contributor: 'Consultor', attention: 'A la atención de', purchaseOrder: 'Orden de compra',
    service: 'Servicio', workedDays: 'Días trabajados', referenceDay: 'Jornada de referencia', timeEntered: 'Tiempo registrado', deliverables: 'Entregables',
    rate: 'Tarifa', slots: 'Franjas registradas', day: 'Día', date: 'Fecha', slot: 'Franja', task: 'Tarea', duration: 'Duración', equivalent: 'Equivalente',
    billable: 'Fact.', amount: 'Importe', yes: 'Sí', no: 'No', week: 'Semana', subtotal: 'Subtotal', total: 'Total', adjustment: 'Ajuste',
    offBilling: 'No facturado', billingMode: 'Modo de facturación',
    billingModes: {
        hour: 'Por horas, facturación según la relación aprobada por el cliente.',
        day: 'Por jornadas, facturación según la relación aprobada por el cliente.',
        deliverable: 'Por entregable, facturación según la relación aprobada por el cliente.',
    },
    quantity: 'Cantidad facturable', preTax: 'Sin impuestos', vat: 'IVA', toInvoice: 'A facturar con IVA', toInvoicePreTax: 'A facturar sin IVA',
    submittedBy: 'Enviado por', notSubmitted: 'Aún no enviado', contributorOn: 'consultor del servicio',
    clientDecision: { pending: 'Validación del cliente', approved: 'Aprobado por el cliente', rejected: 'Rechazado por el cliente', none: 'Validación del cliente' },
    channel: { link: 'Enlace de validación recibido por correo', account: 'Desde su espacio de cliente' },
    pendingSince: 'Pendiente desde el', reason: 'Motivo', fingerprint: 'huella', poweredBy: 'Documento emitido con', continuedOn: 'continúa en la página',
    draft: 'BORRADOR', noEntries: 'Sin tiempo registrado en el periodo.', dayUnit: 'd',
    daysCount: (n) => plural(n, 'día', 'días'), deliverablesCount: (n) => plural(n, 'entregable', 'entregables'), slotsCount: (n) => plural(n, 'franja', 'franjas'),
    totalWorked: (days) => `Total: ${days} trabajado${days.startsWith('1 ') ? '' : 's'}`,
    excluded: (what) => `No facturado: ${what}, excluido del cómputo.`,
    referenceDayNote: (d) => `Jornada de referencia ${d}.`,
    approvalNote: 'Una vez aprobada esta relación, la factura correspondiente se emite a la tarifa prevista en el contrato.',
    closingSimple: 'El detalle de las franjas figura en la versión detallada de esta relación.',
    closingDetailed: 'Cada franja procede de un registro con fecha y hora en el servicio.',
    at: (d, t) => `El ${d} a las ${t}`,
    included: { fixed_price: 'Tiempo incluido en el precio cerrado', schedule: 'Pagado según el calendario del servicio', no_rate: 'Tarifa no comunicada' },
    timeBilled: 'Tiempo facturado',
};
const de = {
    ...fr,
    colon: ': ',
    title: 'Zeitnachweis', detailedVersion: 'Detailfassung', number: 'Nummer', period: 'Zeitraum', issued: 'Ausgestellt am', status: 'Status',
    statuses: { draft: 'Entwurf', submitted: 'Beim Kunden', rejected: 'Abgelehnt', approved: 'Freigegeben', invoiced: 'Abgerechnet', paid: 'Bezahlt', cancelled: 'Storniert' },
    provider: 'Auftragnehmer', client: 'Kunde', contributor: 'Berater', attention: 'z. Hd.', purchaseOrder: 'Bestellung',
    service: 'Leistung', workedDays: 'Arbeitstage', referenceDay: 'Referenztag', timeEntered: 'Erfasste Zeit', deliverables: 'Lieferungen',
    rate: 'Satz', slots: 'Zeiteinträge', day: 'Tag', date: 'Datum', slot: 'Zeitraum', task: 'Aufgabe', duration: 'Dauer', equivalent: 'Entspricht',
    billable: 'Abr.', amount: 'Betrag', yes: 'Ja', no: 'Nein', week: 'KW', subtotal: 'Zwischensumme', total: 'Summe', adjustment: 'Korrektur',
    offBilling: 'Nicht abgerechnet', billingMode: 'Abrechnung',
    billingModes: {
        hour: 'Nach Aufwand, stundenweise, Abrechnung nach vom Kunden freigegebenem Nachweis.',
        day: 'Nach Aufwand, tageweise, Abrechnung nach vom Kunden freigegebenem Nachweis.',
        deliverable: 'Pro Lieferung, Abrechnung nach vom Kunden freigegebenem Nachweis.',
    },
    quantity: 'Abrechenbare Menge', preTax: 'Netto', vat: 'USt.', toInvoice: 'Abzurechnen brutto', toInvoicePreTax: 'Abzurechnen netto',
    submittedBy: 'Eingereicht von', notSubmitted: 'Noch nicht eingereicht', contributorOn: 'Berater der Leistung',
    clientDecision: { pending: 'Freigabe des Kunden', approved: 'Vom Kunden freigegeben', rejected: 'Vom Kunden abgelehnt', none: 'Freigabe des Kunden' },
    channel: { link: 'Freigabelink per E-Mail erhalten', account: 'Aus dem Kundenbereich' },
    pendingSince: 'Ausstehend seit', reason: 'Grund', fingerprint: 'Prüfsumme', poweredBy: 'Erstellt mit', continuedOn: 'weiter auf Seite',
    draft: 'ENTWURF', noEntries: 'Keine Zeit im Zeitraum erfasst.', dayUnit: 'T',
    daysCount: (n) => plural(n, 'Tag', 'Tage'), deliverablesCount: (n) => plural(n, 'Lieferung', 'Lieferungen'), slotsCount: (n) => plural(n, 'Eintrag', 'Einträge'),
    totalWorked: (days) => `Summe: ${days} gearbeitet`,
    excluded: (what) => `Nicht abgerechnet: ${what}, nicht berücksichtigt.`,
    referenceDayNote: (d) => `Referenztag ${d}.`,
    approvalNote: 'Nach Freigabe dieses Nachweises wird die Rechnung zum vertraglich vereinbarten Satz erstellt.',
    closingSimple: 'Alle Zeiteinträge stehen in der Detailfassung dieses Nachweises.',
    closingDetailed: 'Jeder Eintrag stammt aus einer zeitgestempelten Erfassung der Leistung.',
    at: (d, t) => `Am ${d} um ${t}`,
    included: { fixed_price: 'Im Pauschalpreis enthalten', schedule: 'Gemäß Zahlungsplan der Leistung abgerechnet', no_rate: 'Satz nicht angegeben' },
    timeBilled: 'Abgerechnete Zeit',
};
exports.TIMESHEET_LABELS = { fr, en, es, de };
// ─── Nettoyage et formats ────────────────────────────────────────────────────
const line = (v, max = TEXT_MAX) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const lines = (v, max = 6) => (Array.isArray(v) ? v.slice(0, max).map((x) => line(x)).filter(Boolean) : []);
const int = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);
const capitalize = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);
const nbsp = (s) => s.replace(/[  ]/g, ' ');
const MINUS = '−';
/** 210 → « 3 h 30 », 180 → « 3 h ». */
function timesheetDuration(minutes) {
    const m = Math.round(Math.abs(minutes));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${minutes < 0 && m ? `${MINUS} ` : ''}${r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`}`;
}
const signed = (minutes) => (minutes > 0 ? `+ ${timesheetDuration(minutes)}` : timesheetDuration(minutes));
function number(value, locale, max = 2) {
    return nbsp(new Intl.NumberFormat(locale, { maximumFractionDigits: max }).format(value));
}
const isoDay = (day) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day ?? ''));
    return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
};
/** Semaine ISO 8601 d'une date UTC. */
function isoWeek(d) {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dow = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dow);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) };
}
function buildTimesheetView(data, options = {}) {
    const settings = options.settings ?? settings_1.DEFAULT_DOCUMENT_SETTINGS;
    const variant = options.variant === 'detailed' ? 'detailed' : 'simple';
    const language = types_1.DOCUMENT_LANGUAGES.includes(data.language) ? data.language : settings.language;
    const L = exports.TIMESHEET_LABELS[language];
    const locale = LOCALES[language];
    const timeZone = options.timeZone ?? 'Europe/Paris';
    const unit = data.unit === 'hour' || data.unit === 'deliverable' ? data.unit : 'day';
    const perDay = int(data.minutesPerDay) > 0 ? int(data.minutesPerDay) : DEFAULT_MINUTES_PER_DAY;
    const currency = line(data.currency, 3).toUpperCase() || 'EUR';
    const money = (minor) => nbsp((0, format_1.formatMoney)(minor, currency, locale));
    // Temps inclus (forfait, échéancier, sans taux) : aucun taux ni montant imprimé, la raison les remplace.
    const included = data.billing?.mode === 'included';
    const includedReason = included ? (data.billing?.reason === 'schedule' || data.billing?.reason === 'no_rate' ? data.billing.reason : 'fixed_price') : null;
    const rate = !included && int(data.rateMinor) > 0 ? int(data.rateMinor) : 0;
    const totals = data.totals;
    const vat = typeof data.vatPercent === 'number' && Number.isFinite(data.vatPercent) && data.vatPercent >= 0 ? data.vatPercent : null;
    const dateFmt = (d, o) => nbsp(d.toLocaleDateString(locale, { timeZone: 'UTC', ...o }));
    const longDay = (day) => { const d = isoDay(day); return d ? capitalize(dateFmt(d, { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')) : day; };
    const shortDate = (day) => { const d = isoDay(day); return d ? dateFmt(d, { day: '2-digit', month: '2-digit' }) : day; };
    const dayMonth = (day) => { const d = isoDay(day); return d ? dateFmt(d, { day: 'numeric', month: 'long' }) : day; };
    const stamp = (iso) => {
        const d = (0, format_1.toDate)(iso ?? null);
        if (!d)
            return '';
        const date = nbsp(d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone }));
        const time = nbsp(d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone }));
        return L.at(date, time);
    };
    const longDate = (iso) => { const d = (0, format_1.toDate)(iso ?? null); return d ? nbsp(d.toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone })) : ''; };
    const month = Math.min(12, Math.max(1, int(data.month) || 1));
    const year = int(data.year) || new Date().getUTCFullYear();
    const periodLong = dateFmt(new Date(Date.UTC(year, month - 1, 1)), { month: 'long', year: 'numeric' });
    const period = capitalize(periodLong);
    // Lignes reçues, nettoyées et triées.
    const rows = (Array.isArray(data.lines) ? data.lines : []).slice(0, exports.TIMESHEET_MAX_LINES)
        .filter((l) => l && isoDay(l.date))
        .map((l) => ({
        date: l.date, start: line(l.start, 5) || null, end: line(l.end, 5) || null, label: line(l.label, 160) || '—',
        description: line(l.description, 400) || null, minutes: Math.max(0, int(l.minutes)), billable: !!l.billable, amountMinor: Math.max(0, int(l.amountMinor)),
    }))
        .sort((a, b) => (a.date + (a.start ?? '')).localeCompare(b.date + (b.start ?? '')));
    const adjustments = (Array.isArray(data.adjustments) ? data.adjustments : []).slice(0, 50)
        .map((a) => ({ minutes: int(a?.minutes), label: line(a?.label, 120) || L.adjustment, reason: line(a?.reason, 200) || null }))
        .filter((a) => a.minutes !== 0 && unit !== 'deliverable');
    const billable = rows.filter((l) => l.billable && l.minutes > 0);
    const excluded = rows.filter((l) => !l.billable && l.minutes > 0);
    const excludedMinutes = excluded.reduce((s, l) => s + l.minutes, 0);
    const dayEquivalent = (minutes) => `${minutes < 0 ? `${MINUS} ` : ''}${number(Math.abs(minutes) / perDay, locale)} ${L.dayUnit}`;
    // ── En-tête ────────────────────────────────────────────────────────────────
    const provider = data.provider ?? { name: '' };
    const client = data.client ?? { name: '' };
    const providerName = line(provider.name, 160) || '—';
    const clientName = line(client.name, 160) || '—';
    const reference = line(data.reference, 60);
    const status = ['draft', 'submitted', 'rejected', 'approved', 'invoiced', 'paid', 'cancelled'].includes(data.status) ? data.status : 'draft';
    const statusTone = status === 'approved' || status === 'invoiced' || status === 'paid' ? 'success'
        : status === 'rejected' || status === 'cancelled' ? 'danger' : status === 'submitted' ? 'info' : 'neutral';
    const issued = (0, format_1.toDate)(data.issuedAt);
    const meta = [
        ...(reference ? [{ label: L.number, value: reference }] : []),
        { label: L.period, value: period },
        ...(issued ? [{ label: L.issued, value: nbsp(issued.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone })) }] : []),
    ];
    // ── Parties ────────────────────────────────────────────────────────────────
    const person = line(provider.person, 120);
    const contact = line(client.person, 120);
    const po = line(client.purchaseOrder, 60);
    const providerAddress = lines(provider.addressLines);
    const clientAddress = lines(client.addressLines);
    const providerIds = lines(provider.legalIds, 4);
    const detailed = variant === 'detailed';
    const providerMuted = [...providerIds, ...(person ? [`${L.contributor}${L.colon}${person}`] : [])];
    const clientMuted = [...(contact ? [`${L.attention} ${contact}`] : []), ...(po ? [`${L.purchaseOrder} ${po}`] : [])];
    // ── Bandeau ────────────────────────────────────────────────────────────────
    const rateText = includedReason ? L.included[includedReason]
        : rate ? `${money(rate)} / ${unit === 'day' ? L.day.toLocaleLowerCase(locale) : unit === 'hour' ? 'h' : L.deliverablesCount(1).replace(/^1 /, '')}` : '—';
    const band = detailed
        ? [
            { label: L.service, value: line(data.projectName, 200) || '—' },
            { label: L.rate, value: rateText },
            { label: L.slots, value: `${rows.length} (${timesheetDuration(totals?.totalMinutes ?? rows.reduce((s, l) => s + l.minutes, 0))}` },
        ]
        : [
            { label: L.service, value: line(data.projectName, 200) || '—' },
            { label: L.workedDays, value: String(int(totals?.workedDays)) },
            unit === 'day' ? { label: L.referenceDay, value: timesheetDuration(perDay) }
                : unit === 'deliverable' ? { label: L.deliverables, value: String(int(totals?.billableLines)) }
                    : { label: L.timeEntered, value: timesheetDuration(int(totals?.billableMinutes)) },
        ];
    // ── Version simple : une ligne par jour facturé ────────────────────────────
    const byDay = new Map();
    for (const l of billable) {
        const d = byDay.get(l.date) ?? { minutes: 0, count: 0 };
        d.minutes += l.minutes;
        d.count += 1;
        byDay.set(l.date, d);
    }
    const equivalentOf = (minutes, count) => (unit === 'day' ? dayEquivalent(minutes) : unit === 'deliverable' ? String(count) : undefined);
    const simpleRows = [
        ...[...byDay.entries()].map(([day, d]) => ({ day: longDay(day), duration: timesheetDuration(d.minutes), equivalent: equivalentOf(d.minutes, d.count) })),
        ...adjustments.map((a) => ({ day: `${L.adjustment}${L.colon}${a.label}`, duration: signed(a.minutes), equivalent: unit === 'day' ? dayEquivalent(a.minutes) : undefined, muted: true })),
    ];
    const worked = L.daysCount(int(totals?.workedDays));
    const simpleTotal = {
        day: L.totalWorked(worked),
        duration: timesheetDuration(int(totals?.billableMinutes)),
        equivalent: unit === 'day' ? `${number(Number(totals?.quantity) || 0, locale)} ${L.dayUnit}` : unit === 'deliverable' ? String(int(totals?.billableLines)) : undefined,
    };
    const simpleColumns = [L.day, L.duration, ...(unit === 'hour' ? [] : [unit === 'day' ? L.equivalent : L.deliverables])];
    // ── Version détaillée : créneaux groupés par semaine ───────────────────────
    const weeks = [];
    let current = null;
    const closeWeek = () => {
        if (!current)
            return;
        const first = current.days[0];
        const last = current.days[current.days.length - 1];
        const d1 = isoDay(first);
        const d2 = isoDay(last);
        const range = first === last ? dayMonth(first)
            : d1.getUTCMonth() === d2.getUTCMonth() ? `${d1.getUTCDate()} – ${dayMonth(last)}` : `${dayMonth(first)} – ${dayMonth(last)}`;
        const label = `${L.week} ${isoWeek(d1).week}, ${range}`;
        weeks.push({ label, rows: current.rows, subtotal: { label: `${L.subtotal}${L.colon}${label}`, duration: timesheetDuration(current.minutes), amount: rate ? money(current.amount) : '' } });
        current = null;
    };
    for (const l of rows) {
        const w = isoWeek(isoDay(l.date));
        const key = `${w.year}-${w.week}`;
        if (!current || current.key !== key) {
            closeWeek();
            current = { key, days: [], rows: [], minutes: 0, amount: 0 };
        }
        const cur = current;
        if (!cur.days.includes(l.date))
            cur.days.push(l.date);
        if (l.billable) {
            cur.minutes += l.minutes;
            cur.amount += l.amountMinor;
        }
        cur.rows.push({
            date: shortDate(l.date),
            slot: l.start ? `${l.start}${l.end ? ` – ${l.end}` : ''}` : '—',
            task: l.label,
            ...(l.description && l.description !== l.label ? { detail: l.description } : {}),
            duration: timesheetDuration(l.minutes),
            billable: l.billable ? L.yes : L.no,
            amount: l.billable && rate ? money(l.amountMinor) : '—',
            excluded: !l.billable,
        });
    }
    closeWeek();
    const detailNotes = [
        ...(excluded.length
            ? [{ label: L.excluded(excluded.length === 1 ? `${excluded[0].label} (${dayMonth(excluded[0].date)})` : L.slotsCount(excluded.length)), value: timesheetDuration(-excludedMinutes) }]
            : []),
        ...adjustments.map((a) => ({ label: `${L.adjustment}${L.colon}${a.label}${a.reason ? ` (${a.reason})` : ''}`, value: signed(a.minutes) })),
    ];
    const distinctDays = new Set(rows.map((l) => l.date)).size;
    const amount = Math.max(0, int(totals?.amountMinor));
    const quantityText = unit === 'day' ? `${number(Number(totals?.quantity) || 0, locale)} ${L.dayUnit}` : unit === 'deliverable' ? L.deliverablesCount(int(totals?.billableLines)) : timesheetDuration(int(totals?.billableMinutes));
    const summary = [
        { label: `${L.timeEntered} (${L.daysCount(distinctDays)})`, value: timesheetDuration(int(totals?.totalMinutes)) },
        ...(excludedMinutes ? [{ label: L.offBilling, value: timesheetDuration(-excludedMinutes) }] : []),
        ...(int(totals?.adjustmentMinutes) && unit !== 'deliverable' ? [{ label: L.adjustment, value: signed(int(totals?.adjustmentMinutes)) }] : []),
        { label: includedReason ? L.timeBilled : L.quantity, value: rate ? `${quantityText} × ${money(rate)}` : quantityText },
        ...(includedReason ? [{ label: L.billingMode, value: L.included[includedReason] }] : []),
    ];
    let grandTotal;
    if (rate) {
        if (vat !== null) {
            const tax = Math.round((amount * vat) / 100);
            summary.push({ label: `${L.preTax}, ${L.vat} ${number(vat, locale)} %`, value: `${money(amount)}, ${money(tax)}` });
            grandTotal = { label: L.toInvoice, value: money(amount + tax) };
        }
        else {
            grandTotal = { label: L.toInvoicePreTax, value: money(amount) };
        }
    }
    // ── Validation ─────────────────────────────────────────────────────────────
    const submittedAt = (0, format_1.toDate)(data.submittedAt ?? null);
    const submitter = line(data.submittedBy, 120) || person || providerName;
    const submitted = submittedAt
        ? { heading: L.submittedBy, tone: 'neutral', name: submitter, lines: [`${providerName}, ${L.contributorOn}`, stamp(data.submittedAt)] }
        : { heading: L.submittedBy, tone: 'neutral', name: person || providerName, lines: [L.notSubmitted] };
    const v = data.validation;
    let decision;
    if (v && (v.decision === 'approved' || v.decision === 'rejected')) {
        const fp = line(v.fingerprint, 24);
        decision = {
            heading: L.clientDecision[v.decision], tone: v.decision === 'approved' ? 'success' : 'danger', name: line(v.name, 120) || clientName,
            lines: [L.channel[v.channel === 'account' ? 'account' : 'link'], [stamp(v.decidedAt), fp ? `${L.fingerprint} ${fp}` : ''].filter(Boolean).join(', ')].filter(Boolean),
            ...(v.decision === 'rejected' && line(v.reason, 300) ? { emphasis: `${L.reason} : ${line(v.reason, 300)}` } : {}),
        };
    }
    else if (submittedAt && status !== 'draft') {
        decision = { heading: L.clientDecision.pending, tone: 'neutral', name: clientName, lines: [`${L.pendingSince} ${longDate(data.submittedAt)}`] };
    }
    else {
        decision = { heading: L.clientDecision.none, tone: 'neutral', lines: [] };
    }
    const legal = line(data.legal, 400) || [providerName, providerAddress.join(', '), ...providerIds].filter(Boolean).join(', ');
    const watermark = status === 'draft' && settings.statusWatermark ? L.draft : undefined;
    const note = [unit === 'day' ? L.referenceDayNote(timesheetDuration(perDay)) : '', includedReason ? `${L.included[includedReason]}.` : L.approvalNote].filter(Boolean).join(' ');
    return {
        variant, language, locale, settings, labels: L,
        title: L.title,
        subtitle: [providerName, line(provider.city, 80), detailed ? L.detailedVersion : ''].filter(Boolean).join(', '),
        shortTitle: `${L.title}, ${periodLong}`,
        runningRef: [reference, providerName, clientName].filter(Boolean).join(', '),
        meta,
        status: { label: L.statuses[status], tone: statusTone },
        provider: { heading: L.provider, name: providerName, lines: detailed ? (providerAddress.length ? [providerAddress.join(', ')] : []) : providerAddress, muted: detailed ? (providerMuted.length ? [providerMuted.join(', ')] : []) : providerMuted },
        client: { heading: L.client, name: clientName, lines: detailed ? (clientAddress.length ? [clientAddress.join(', ')] : []) : clientAddress, muted: detailed ? (clientMuted.length ? [clientMuted.join(', ')] : []) : clientMuted },
        band,
        simple: { columns: simpleColumns, rows: simpleRows, total: simpleTotal },
        detailed: {
            columns: [L.date, L.slot, L.task, L.duration, L.billable, L.amount],
            weeks,
            notes: detailNotes,
            billing: { heading: L.billingMode, lines: [includedReason ? `${L.included[includedReason]}.` : L.billingModes[unit], unit === 'day' ? L.referenceDayNote(timesheetDuration(perDay)) : ''].filter(Boolean) },
            summary,
            grandTotal,
        },
        note,
        submitted,
        decision,
        legal,
        closing: detailed ? L.closingDetailed : L.closingSimple,
        showLogo: settings.logo !== 'none',
        poweredBy: settings.showPoweredBy,
        watermark,
        watermarkSize: watermark ? (0, view_1.watermarkFontSize)(watermark) : undefined,
    };
}
//# sourceMappingURL=timesheet-view.js.map