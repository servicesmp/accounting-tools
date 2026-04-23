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
export declare const getGuidelineUrn: (profile: FacturxProfile) => string;
export declare const getProfilePolicy: (profile: FacturxProfile) => ProfilePolicy;
export declare const formatDateFacturX: (date: Date) => string;
export declare const formatAmount: (amount: number) => string;
export declare const isValidAmount: (amount: number) => boolean;
export declare const REGIONAL_CONFIGS: Map<string, RegionalConfig>;
export declare const getRegionalConfig: (countryCode: string) => RegionalConfig | undefined;
export declare const getRegionalConfigOrDefault: (countryCode: string, fallbackCode?: string) => RegionalConfig;
//# sourceMappingURL=constants.d.ts.map