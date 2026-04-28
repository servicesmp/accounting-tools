"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const node_libxml_1 = require("node-libxml");
const fs_1 = __importDefault(require("fs"));
async function validate(xmlContent, xsdPath) {
    try {
        const libxml = new node_libxml_1.Libxml();
        libxml.loadXml(xmlContent);
        const xsdContent = fs_1.default.readFileSync(xsdPath, 'utf-8');
        console.log("\n\n\nXSD path: " + xsdPath);
        // Charger le schéma XSD
        libxml.loadSchemas([xsdContent]);
        // Valider l’XML
        const result = libxml.validateAgainstSchemas(1);
        console.log("\n\nValidation result: " + result);
        if (!result) {
            const errors = libxml.validationSchemaErrors ?? [];
            if (errors.length !== 0) {
                // const errorMsg = errors.map((e) => `${e.message} (ligne ${e.line})`).join("; ");
                throw new Error("\n\n\nValidation échouée: " + JSON.stringify(errors, null, 2));
            }
        }
    }
    catch (e) {
        const errorMsg = e; // .forEach((e) => `${e.message} (line ${e.line})`).join("; ");
        throw new Error("Validation Error: " + errorMsg);
    }
}
