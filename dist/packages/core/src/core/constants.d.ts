/**
 * @module constants
 * @description Factur-X constants and profile policies
 * Optimized for fast lookups using Maps and frozen objects
 */
import { FacturxProfile, ProfilePolicy, RegionalConfig } from '../types';
export declare const XML_NAMESPACES: Readonly<{
    readonly QDT: "urn:un:unece:uncefact:data:standard:QualifiedDataType:100";
    readonly RAM: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100";
    readonly RSM: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100";
    readonly UDT: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100";
    readonly XSI: "http://www.w3.org/2001/XMLSchema-instance";
}>;
export declare const GUIDELINE_URNS: Map<FacturxProfile, string>;
export declare const PROFILE_POLICIES: Map<FacturxProfile, ProfilePolicy>;
/**
 * Format code for dates in Factur-X XML (CCYYMMDD)
 */
export declare const DATE_FORMAT_CODE: "102";
export declare const VALIDATION_LIMITS: Readonly<{
    readonly MAX_INVOICE_NUMBER_LENGTH: 50;
    readonly MAX_DESCRIPTION_LENGTH: 500;
    readonly MAX_NOTE_LENGTH: 1000;
    readonly MAX_EMAIL_LENGTH: 254;
    readonly MAX_PHONE_LENGTH: 30;
    readonly MAX_VAT_ID_LENGTH: 15;
    readonly MAX_IBAN_LENGTH: 34;
    readonly MAX_BIC_LENGTH: 11;
    readonly MIN_AMOUNT: 0;
    readonly MAX_AMOUNT: 999999999.99;
    readonly MAX_QUANTITY: 999999999.99;
    readonly MAX_DECIMAL_PLACES: 2;
    readonly MAX_LINES: 9999;
}>;
export declare const PATTERNS: Readonly<{
    readonly EMAIL: RegExp;
    readonly PHONE: RegExp;
    readonly INVOICE_NUMBER: RegExp;
    readonly VAT_ID: RegExp;
    readonly COUNTRY_CODE: RegExp;
    readonly CURRENCY_CODE: RegExp;
    readonly IBAN: RegExp;
    readonly BIC: RegExp;
}>;
/**
 * Get guideline URN for a profile (O(1) lookup)
 */
export declare const getGuidelineUrn: (profile: FacturxProfile) => string;
/**
 * Get profile policy (O(1) lookup)
 */
export declare const getProfilePolicy: (profile: FacturxProfile) => ProfilePolicy;
/**
 * Format date to CCYYMMDD (Factur-X format)
 * Optimized for performance - no regex, direct string manipulation
 */
export declare const formatDateFacturX: (date: Date) => string;
/**
 * Format amount with exactly 2 decimal places
 * Optimized: uses toFixed which is faster than regex
 */
export declare const formatAmount: (amount: number) => string;
/**
 * Validate amount is within acceptable range
 * Optimized: simple comparison operations
 */
export declare const isValidAmount: (amount: number) => boolean;
/**
 * Regional configurations Map - O(1) lookup by country code
 */
export declare const REGIONAL_CONFIGS: Map<string, RegionalConfig>;
/**
 * Get regional configuration by country code - O(1)
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Regional configuration or undefined
 */
export declare const getRegionalConfig: (countryCode: string) => RegionalConfig | undefined;
/**
 * Get regional configuration with fallback - O(1)
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @param fallbackCode Fallback country code (default: 'FR')
 * @returns Regional configuration (never undefined)
 */
export declare const getRegionalConfigOrDefault: (countryCode: string, fallbackCode?: string) => RegionalConfig;
//# sourceMappingURL=constants.d.ts.map