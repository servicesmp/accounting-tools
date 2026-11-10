import type { PlatformInvoiceView } from './platform-invoice-types';
export declare const PLATFORM_COLORS: {
    readonly ink: "#111111";
    readonly text: "#45423C";
    readonly label: "#6B675F";
    readonly rule: "#EAE8E3";
    readonly accent: "#FF3864";
    readonly accentText: "#E31E55";
    readonly white: "#FFFFFF";
};
export declare const PLATFORM_PAGE_W = 794;
export declare const PLATFORM_PAGE_H = 1123;
export interface RenderPlatformInvoiceHtmlOptions {
    /** Logo Services (en tête 24 px et en pied 13 px). */
    readonly logoUrl?: string | null;
    /** Police (défaut : Chillax, puis system-ui). */
    readonly fontFamily?: string;
    readonly id?: string;
}
export declare function renderPlatformInvoiceHtml(view: PlatformInvoiceView, options?: RenderPlatformInvoiceHtmlOptions): string;
//# sourceMappingURL=platform-invoice-html.d.ts.map