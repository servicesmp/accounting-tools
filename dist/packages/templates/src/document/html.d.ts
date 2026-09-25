/**
 * Rendu HTML d'un document commercial (facture, avoir, devis, bon de commande).
 *
 * Même vue (`DocumentView`) et même maquette (« Document Page », 794 × 1123 px)
 * que le PDF produit par `generateDocumentPdf` : la webapp, la page de paiement
 * et les aperçus affichent EXACTEMENT ce que la librairie imprime.
 *
 * Module navigateur-compatible : aucune dépendance. Le HTML produit est un
 * fragment autonome (styles en ligne), toutes les chaînes sont échappées et les
 * URL filtrées : il peut être injecté tel quel (`dangerouslySetInnerHTML`).
 *
 * Différence assumée avec le PDF : à l'écran la page s'allonge au lieu de se
 * paginer (le pied reste en bas de la dernière « feuille »).
 */
import type { DocumentView } from './types';
export interface RenderDocumentHtmlOptions {
    /** Logo de l'organisation (https:, chemin relatif ou data:image). Ignoré si le réglage masque le logo. */
    readonly logoUrl?: string | null;
    /** Image du QR code de paiement (https: ou data:image). Sans elle, pas de QR. */
    readonly qrImageUrl?: string | null;
    /** Logo « Services » de la mention « Document émis avec ». Sans lui, le mot Services en gras. */
    readonly servicesLogoUrl?: string | null;
    /** Police (défaut : Helvetica, Arial — la même famille métrique que le PDF). */
    readonly fontFamily?: string;
    /** Attribut `id` du conteneur racine. */
    readonly id?: string;
}
/** Échappe un texte pour le contenu ou un attribut HTML. */
export declare function escapeHtml(value: unknown): string;
/** URL d'image autorisée : http(s), chemin relatif à l'origine, ou data:image raster/SVG en base64. */
export declare function safeImageUrl(url: unknown): string | null;
/** Rend la vue d'un document en fragment HTML fidèle à la maquette. */
export declare function renderDocumentHtml(view: DocumentView, options?: RenderDocumentHtmlOptions): string;
//# sourceMappingURL=html.d.ts.map