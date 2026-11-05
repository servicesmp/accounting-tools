/** Exemples de rapports (données fictives), repris des maquettes « Tâches, rapports et comptes rendus » et « Rapport d'activité ». */
import type { ReportDocumentData } from '../../document/report-types';

export function meetingMinutes(): ReportDocumentData {
  return {
    kind: 'meeting_minutes',
    typeLabel: 'Rapport Services · Compte rendu',
    title: 'Point client, Clinique Saint-Roch',
    subtitle: 'Vendredi 16 octobre 2026, 16:00–16:45',
    meta: [
      { label: 'Organisation', value: 'Atelier Roux' },
      { label: 'Lieu', value: 'Visio' },
      { label: 'Dossier', value: 'Mission · Audit SEO · Clinique Saint-Roch' },
      { label: 'Généré le', value: 'lun. 19 oct. 2026, 10:12' },
    ],
    issuer: { name: 'Atelier Roux' },
    language: 'fr',
    generatedAt: '2026-10-19T08:12:00.000Z',
    status: 'draft',
    blocks: [
      { type: 'people', title: 'Participants', people: [
        { name: 'Camille Roux', role: 'Consultante' }, { name: 'Anne Vidal', role: 'Dir. communication, Clinique Saint-Roch' }, { name: 'Marc Petit', role: 'Resp. informatique, Clinique Saint-Roch' },
      ] },
      { type: 'paragraph', title: 'Synthèse', badge: "Fils d'Iro", text: 'Le point du 16 octobre a permis de partager les premiers constats de l’audit : 40 % des pages sont sans description et le chargement mobile dépasse 6 secondes. La clinique souhaite prioriser les pages services et la prise de rendez-vous. Deux décisions ont été prises et trois actions sont attendues, dont un atelier à planifier.' },
      { type: 'callout', title: 'Décisions', style: 'dark', items: [{ text: 'Restitution complète le 28/10 à 15 h' }, { text: 'Prioriser les pages services dans les recommandations' }] },
      { type: 'list', title: 'Points abordés', numbered: true, items: [
        { text: 'Premiers constats : 40 % des pages sans description' },
        { text: 'Chargement mobile supérieur à 6 s', details: [{ who: 'Anne Vidal', text: 'priorité aux pages services et à la prise de rendez-vous' }, { who: 'Marc Petit', text: 'ouvre l’accès Search Console cette semaine' }] },
      ] },
      { type: 'callout', title: "Points d'attention", style: 'light', note: "détectés par le fils d'Iro", items: [{ text: 'Livrable « Compte rendu de réunion » attendu le 19/10 : non fourni', tone: 'warning' }] },
      { type: 'actions', title: 'Actions à réaliser', note: '3 actions, 1 réunion', items: [
        { title: 'Envoyer la liste des pages prioritaires', owner: 'Camille Roux', due: '21/10', status: 'À créer', statusTone: 'info' },
        { title: 'Marc ouvre l’accès Search Console', owner: 'Marc Petit', due: '22/10', status: 'Côté client', statusTone: 'muted' },
        { title: 'Atelier prise de rendez-vous', badge: 'Réunion', with: 'avec Anne Vidal, Marc Petit', owner: 'Camille Roux', due: '31/10', status: 'À planifier', statusTone: 'info' },
      ] },
    ],
    footer: { sources: 'Généré par le fils d’Iro à partir de : notes de la réunion (9 lignes), invitation de l’agenda (3 participants), dossier Audit SEO · Clinique Saint-Roch.' },
  };
}

export function taskReport(): ReportDocumentData {
  return {
    kind: 'task_report',
    typeLabel: 'Rapport Services · Rapport de tâche',
    title: 'Préparer la livraison des maquettes',
    subtitle: 'Échéance lundi 19 octobre 2026, 16:00',
    meta: [
      { label: 'Organisation', value: 'Atelier Roux' }, { label: 'Responsable', value: 'Camille Roux' },
      { label: 'Dossier', value: 'Mission · Refonte site e-commerce · Maison Pradel' }, { label: 'Généré le', value: 'lun. 19 oct. 2026, 10:12' },
    ],
    issuer: { name: 'Atelier Roux' },
    status: 'final',
    blocks: [
      { type: 'paragraph', title: 'Synthèse', badge: "Fils d'Iro, modifiée", text: 'La tâche avance : 6 h 10 ont été saisies sur une estimation de 6 h, l’export Figma est fourni et deux livrables restent attendus pour ce soir.' },
      { type: 'stats', tiles: [{ value: '6 h 10', label: 'Temps saisi', note: 'sur 6 h estimées' }, { value: '1 / 3', label: 'Livrables fournis' }, { value: '2', label: 'Suites', tone: 'accent' }] },
      { type: 'rows', title: 'Travail réalisé', note: '2 saisies', rows: [
        { title: 'Écrans panier et paiement', subtitle: 'Camille Roux', meta: ['sam. 17 oct.'], right: '2 h 40' },
        { title: 'Fiches produit, version mobile', subtitle: 'Camille Roux', meta: ['dim. 18 oct.'], right: '3 h 15' },
      ] },
      { type: 'rows', title: 'Livrables', rows: [
        { title: 'Export Figma des maquettes', subtitle: 'Camille Roux', right: 'Fourni', rightTone: 'success' },
        { title: 'Maquettes desktop et mobile (12 écrans, PDF)', subtitle: 'Camille Roux', right: 'Attendu le 19/10', rightTone: 'warning' },
        { title: 'Guide de style', subtitle: 'Inès Ferreira', right: 'Attendu le 19/10', rightTone: 'warning' },
      ] },
      { type: 'callout', title: "Points d'attention", style: 'light', items: [{ text: 'Dépassement d’estimation : 6 h 10 saisies pour 6 h prévues', tone: 'warning' }] },
      { type: 'actions', title: 'Actions à réaliser', items: [
        { title: 'Fournir « Maquettes desktop et mobile (12 écrans, PDF) »', owner: 'Camille Roux', due: '19/10', status: 'Tâche créée', statusTone: 'success' },
        { title: 'Point d’avancement avec Maison Pradel', badge: 'Réunion', with: 'avec Camille Roux', owner: 'Camille Roux', due: '20/10', status: 'Réunion planifiée', statusTone: 'success' },
      ] },
    ],
    footer: { sources: 'Généré par le fils d’Iro à partir de : description, temps saisi (2 saisies), livrables (1/3), activité (4 événements).' },
  };
}

export function activityReport(): ReportDocumentData {
  const task = (i: number) => ({ title: `Tâche terminée n° ${i + 1} avec un titre assez long pour vérifier le retour à la ligne des faits`, check: true, meta: ['Facture F-2026-118 · Maison Pradel', 'Terminée mer. 21 oct.', 'Livrables 1/1'], right: '1 h 20' });
  return {
    kind: 'weekly_report',
    typeLabel: 'Rapport d’activité',
    title: 'Semaine 43',
    subtitle: 'Du 19 au 25 octobre 2026',
    meta: [{ label: 'Organisation', value: 'Atelier Roux' }, { label: 'Périmètre', value: 'Toute l’équipe' }, { label: 'Généré le', value: 'ven. 23 oct. 2026, 18:00' }],
    issuer: { name: 'Atelier Roux' },
    blocks: [
      { type: 'paragraph', title: 'Synthèse', badge: "Fils d'Iro", text: 'Semaine dense : 6 tâches terminées sur 10, 38 h 35 saisies pour 48 h planifiées. « Valider le contrat Groupe Altis » reste bloquée en attente de signature. Deux livrables attendus sont échus.' },
      { type: 'stats', tiles: [{ value: '6', label: 'Tâches terminées', note: '4 encore ouvertes' }, { value: '38 h 35', label: 'Temps saisi', note: '48 h planifiées' }, { value: '8', label: 'RDV tenus', note: '1 annulé' }, { value: '6 / 8', label: 'Livrables fournis' }] },
      { type: 'columns',
        left: { type: 'bars', title: 'Temps saisi par mission', items: [{ label: 'Refonte site e-commerce', note: 'Maison Pradel', value: '11 h 40', ratio: 1 }, { label: 'Audit SEO', note: 'Clinique Saint-Roch', value: '8 h 05', ratio: 0.69 }, { label: 'Hors mission', value: '6 h 20', ratio: 0.54, tone: 'muted' }] },
        right: { type: 'distribution', title: 'État des tâches', segments: [{ label: 'Terminées', count: 6, tone: 'success' }, { label: 'En cours', count: 2, tone: 'info' }, { label: 'Bloquées', count: 1, tone: 'danger' }, { label: 'À faire', count: 1, tone: 'neutral' }] } },
      { type: 'rows', title: 'Tâches terminées', rows: Array.from({ length: 6 }, (_, i) => task(i)) },
      { type: 'rows', title: 'En cours et bloquées', rows: [
        { lead: { text: 'En cours', tone: 'info' }, title: 'Envoyer le devis à Nova Habitat', meta: ['Camille Roux', 'Devis D-2026-041 · Nova Habitat', 'Échéance lun. 19 oct. 09:30'], progress: { ratio: 0.4, label: '0 h 45 / 2 h', tone: 'success' } },
        { lead: { text: 'Bloquée', tone: 'danger' }, title: 'Valider le contrat Groupe Altis', meta: ['Malik Benali', 'Contrat C-2026-007 · Groupe Altis', 'Échéance dépassée'], note: 'Bloquée : en attente de la signature du directeur général.', noteTone: 'danger', progress: { ratio: 1, label: '3 h / 2 h', tone: 'danger' } },
      ], empty: 'Rien en cours.' },
      { type: 'callout', title: "Points d'attention", style: 'light', note: 'détectés par règles', items: [{ text: '« Valider le contrat Groupe Altis » est bloquée depuis 2 jours', tone: 'danger' }, { text: 'Livrable « Liste des produits à photographier » attendu le 16/10, non fourni', tone: 'warning' }, { text: 'RDV « Point mensuel Ferme du Val » annulé', tone: 'neutral' }] },
      { type: 'agenda', title: 'Agenda de la semaine', note: '9 rendez-vous, 3 rappels', days: [
        { label: 'Lundi 19', items: [{ time: '09:30–10:00', kind: 'RDV', kindTone: 'info', title: 'Kick-off Nova Habitat', location: 'Visio', people: ['Camille Roux', 'Malik Benali'] }, { time: '14:00', kind: 'Rappel', kindTone: 'muted', title: 'Relancer la facture F-2026-118' }] },
        { label: 'Mardi 20', items: [{ time: '11:00–12:00', kind: 'RDV', kindTone: 'info', title: 'Point mensuel Ferme du Val', cancelled: true, people: ['Inès Ferreira'] }] },
      ] },
      { type: 'columns',
        left: { type: 'rows', title: 'Échéances', rows: [{ title: 'Rédiger le rapport mensuel Altis', right: 'ven. 23' }, { title: 'Préparer l’atelier stratégie T4', right: 'ven. 23' }] },
        right: { type: 'rows', title: 'Rendez-vous', rows: [{ title: 'Restitution Clinique Saint-Roch', right: 'mer. 28, 15:00' }] } },
      { type: 'callout', title: "Priorités proposées par le fils d'Iro", style: 'tint', items: [{ text: 'Obtenir la signature du contrat Groupe Altis avant mercredi' }, { text: 'Fournir les deux livrables échus' }, { text: 'Préparer la restitution du 28/10' }] },
    ],
    footer: { left: 'Atelier Roux, rapport d’activité', right: 'Semaine 43, toute l’équipe' },
  };
}
