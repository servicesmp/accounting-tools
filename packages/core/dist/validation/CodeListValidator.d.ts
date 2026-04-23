export type CodeListName = 'ISO4217' | 'ISO3166' | 'UNTDID1001' | 'UNTDID5305' | 'UNTDID4461' | 'UNECE20' | 'EAS' | 'ICD';
export interface CodeListValidationError {
    readonly field: string;
    readonly value: string;
    readonly codeList: string;
    readonly message: string;
}
export interface CodeListValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<CodeListValidationError>;
}
export declare class CodeListValidator {
    private readonly codeLists;
    private readonly xmlMappings;
    constructor();
    validateCode(value: string, codeList: CodeListName): boolean;
    validateInvoiceCodes(xmlContent: string): CodeListValidationResult;
    getCodeList(name: CodeListName): ReadonlySet<string>;
    getSupportedCodeLists(): ReadonlyArray<CodeListName>;
    getCodeListSize(name: CodeListName): number;
    private findRoot;
    private extractValues;
    private extractAttribute;
    private buildXmlMappings;
}
export declare function getDefaultCodeListValidator(): CodeListValidator;
export declare function isValidCode(value: string, codeList: CodeListName): boolean;
export declare function validateInvoiceCodes(xmlContent: string): CodeListValidationResult;
//# sourceMappingURL=CodeListValidator.d.ts.map