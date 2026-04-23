/**
 * @module CodeListValidator
 * @description Validates codes against official EN16931/Factur-X code lists
 *
 * Code lists validated:
 * - ISO 4217: Currency codes
 * - ISO 3166-1 alpha-2: Country codes
 * - UNTDID 1001: Document type codes
 * - UNTDID 5305: Tax category codes
 * - UNTDID 4461: Payment means codes
 * - UN/ECE Rec 20/21: Unit of measure codes
 * - EAS: Electronic Address Scheme identifiers (CEF)
 * - ICD: ISO 6523 Identifier Component Data (scheme IDs)
 *
 * All code lists are embedded as frozen Sets for O(1) lookups.
 * No external file dependencies.
 *
 * Performance: O(1) per code lookup, O(n) for full invoice validation
 *
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/
 * @see https://service.unece.org/trade/untdid/d16b/tred/tredi2.htm
 */
/**
 * Supported code list names
 */
export type CodeListName = 'ISO4217' | 'ISO3166' | 'UNTDID1001' | 'UNTDID5305' | 'UNTDID4461' | 'UNECE20' | 'EAS' | 'ICD';
/**
 * Error detail for a code list validation failure
 */
export interface CodeListValidationError {
    /** The XML field path or element name */
    readonly field: string;
    /** The invalid value found */
    readonly value: string;
    /** The code list that was checked */
    readonly codeList: string;
    /** Human-readable error message */
    readonly message: string;
}
/**
 * Result of validating all codes in an invoice
 */
export interface CodeListValidationResult {
    readonly isValid: boolean;
    readonly errors: ReadonlyArray<CodeListValidationError>;
}
export declare class CodeListValidator {
    private readonly codeLists;
    private readonly xmlMappings;
    constructor();
    /**
     * Validate a single code against a named code list - O(1)
     */
    validateCode(value: string, codeList: CodeListName): boolean;
    /**
     * Validate all codes found in an invoice XML string
     * Parses the XML with fast-xml-parser and checks every code element
     * against its corresponding code list.
     *
     * @param xmlContent - Raw Factur-X CII XML string
     * @returns Validation result with all errors
     */
    validateInvoiceCodes(xmlContent: string): CodeListValidationResult;
    /**
     * Get the complete set of valid values for a named code list
     */
    getCodeList(name: CodeListName): ReadonlySet<string>;
    /**
     * Get all supported code list names
     */
    getSupportedCodeLists(): ReadonlyArray<CodeListName>;
    /**
     * Get the size (number of valid entries) for a code list
     */
    getCodeListSize(name: CodeListName): number;
    /**
     * Locate the CII root element regardless of namespace prefix
     */
    private findRoot;
    /**
     * Safely navigate a nested object by a dot-separated path.
     * Handles both single values and arrays at each level.
     * Returns the leaf value(s) as strings.
     */
    private extractValues;
    /**
     * Extract attribute values from parsed XML nodes.
     * The attributeNamePrefix in fast-xml-parser is '@_'.
     */
    private extractAttribute;
    /**
     * Build the complete set of XML element to code list mappings.
     * Each mapping knows how to extract values from the parsed XML tree
     * and which code list to validate against.
     */
    private buildXmlMappings;
}
/**
 * Get default code list validator - Lazy singleton
 */
export declare function getDefaultCodeListValidator(): CodeListValidator;
/**
 * Convenience function - validate a single code
 */
export declare function isValidCode(value: string, codeList: CodeListName): boolean;
/**
 * Convenience function - validate all codes in XML
 */
export declare function validateInvoiceCodes(xmlContent: string): CodeListValidationResult;
//# sourceMappingURL=CodeListValidator.d.ts.map