import type { PlatformFeesOperation, PlatformInvoiceData, PlatformInvoiceKind } from './platform-invoice-types';
/** Libellés des plans, ceux de la webapp. */
export declare const PLATFORM_PLAN_NAMES: Record<string, string>;
export declare function platformPlanName(plan: unknown): string;
/** Série de la facture d'après son numéro : PLAN- (abonnement), FEES- (frais de service). */
export declare function platformInvoiceKindOf(record: any): PlatformInvoiceKind | null;
/**
 * Référence d'abonnement propre à Services, stable pour un abonnement : « ABO-7K2F9Q-PRO ».
 * Dérivée de l'identifiant technique de l'abonnement, qui n'est jamais imprimé.
 */
export declare function platformSubscriptionReference(subscriptionId: string | undefined, plan: string | undefined): string | undefined;
export interface PlatformInvoiceRecordOptions {
    /** Opération concernée d'une facture de frais (facture client, client final, HT encaissé). */
    readonly operation?: PlatformFeesOperation;
}
export declare function billingRecordToPlatformInvoiceData(record: any, options?: PlatformInvoiceRecordOptions): PlatformInvoiceData;
//# sourceMappingURL=platform-invoice-records.d.ts.map