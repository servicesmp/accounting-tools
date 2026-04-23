/**
 * @module i18n/locales
 * @description Default locale exports and helpers
 */
import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import type { LocaleData } from '../types';
export { en, fr, de };
/**
 * All default locales
 */
export declare const DEFAULT_LOCALES: ReadonlyArray<LocaleData>;
/**
 * Get locale by code - O(n) linear search (small n=3)
 */
export declare function getLocaleByCode(code: string): LocaleData | undefined;
/**
 * Get all available locale codes
 */
export declare function getAvailableLocaleCodes(): string[];
//# sourceMappingURL=index.d.ts.map