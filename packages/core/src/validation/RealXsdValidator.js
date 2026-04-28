"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealXsdValidator = void 0;
exports.resetEngineDetection = resetEngineDetection;
exports.getDefaultRealXsdValidator = getDefaultRealXsdValidator;
exports.realValidateXsd = realValidateXsd;
const types_1 = require("../types");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const PROFILE_SCHEMA_MAP = {
    [types_1.FacturxProfile.MINIMUM]: {
        dir: 'facturx-minimum',
        mainXsd: 'Factur-X_1.07.2_MINIMUM.xsd',
    },
    [types_1.FacturxProfile.BASICWL]: {
        dir: 'facturx-basicwl',
        mainXsd: 'Factur-X_1.07.2_BASICWL.xsd',
    },
    [types_1.FacturxProfile.BASIC]: {
        dir: 'facturx-basic',
        mainXsd: 'Factur-X_1.07.2_BASIC.xsd',
    },
    [types_1.FacturxProfile.EN16931]: {
        dir: 'facturx-en16931',
        mainXsd: 'Factur-X_1.07.2_EN16931.xsd',
    },
    [types_1.FacturxProfile.EXTENDED]: {
        dir: 'facturx-extended',
        mainXsd: 'Factur-X_1.07.2_EXTENDED.xsd',
    },
};
class ValidationCache {
    constructor(maxSize = 200) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry;
    }
    set(key, result) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, result);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
    getMaxSize() {
        return this.maxSize;
    }
}
let _detectedEngine = null;
let _nodeLibxml = null;
let _libxmljs = null;
function detectEngine() {
    if (_detectedEngine !== null)
        return _detectedEngine;
    try {
        _nodeLibxml = require('node-libxml');
        if (_nodeLibxml && _nodeLibxml.Libxml) {
            const testInstance = new _nodeLibxml.Libxml();
            const loaded = testInstance.loadXmlFromString('<?xml version="1.0"?><root/>');
            testInstance.freeXml();
            testInstance.clearAll();
            if (loaded) {
                _detectedEngine = 'node-libxml';
                return _detectedEngine;
            }
        }
    }
    catch (_e) {
    }
    try {
        _libxmljs = require('libxmljs');
        if (_libxmljs && (_libxmljs.parseXml || _libxmljs.default?.parseXml)) {
            if (_libxmljs.default)
                _libxmljs = _libxmljs.default;
            const doc = _libxmljs.parseXml('<?xml version="1.0"?><root/>');
            if (doc) {
                _detectedEngine = 'libxmljs';
                return _detectedEngine;
            }
        }
    }
    catch (_e) {
    }
    try {
        const { execFileSync } = require('child_process');
        execFileSync('xmllint', ['--version'], { timeout: 5000, stdio: 'pipe' });
        _detectedEngine = 'xmllint-cli';
        return _detectedEngine;
    }
    catch (_e) {
    }
    _detectedEngine = 'none';
    return _detectedEngine;
}
function resetEngineDetection() {
    _detectedEngine = null;
    _nodeLibxml = null;
    _libxmljs = null;
}
function validateWithNodeLibxml(xmlContent, schemaPath) {
    const { Libxml } = _nodeLibxml;
    const libxml = new Libxml();
    try {
        const wellformed = libxml.loadXmlFromString(xmlContent);
        if (!wellformed) {
            const errors = [];
            if (libxml.wellformedErrors && Array.isArray(libxml.wellformedErrors)) {
                for (const err of libxml.wellformedErrors) {
                    errors.push({
                        message: typeof err === 'string' ? err : (err.message || String(err)),
                        line: typeof err === 'object' && err !== null ? err.line : undefined,
                        column: typeof err === 'object' && err !== null ? err.column : undefined,
                    });
                }
            }
            if (errors.length === 0) {
                errors.push({ message: 'XML is not well-formed' });
            }
            return { isValid: false, errors };
        }
        libxml.loadSchemas([schemaPath]);
        if (libxml.schemasLoadedErrors) {
            const errors = [];
            if (Array.isArray(libxml.schemasLoadedErrors)) {
                for (const err of libxml.schemasLoadedErrors) {
                    errors.push({
                        message: typeof err === 'string' ? err : (err.message || String(err)),
                        line: typeof err === 'object' && err !== null ? err.line : undefined,
                        column: typeof err === 'object' && err !== null ? err.column : undefined,
                    });
                }
            }
            if (errors.length === 0) {
                errors.push({ message: 'Failed to load XSD schema' });
            }
            return { isValid: false, errors };
        }
        const result = libxml.validateAgainstSchemas();
        if (result === null) {
            return {
                isValid: false,
                errors: [{ message: 'No schemas were loaded correctly for validation' }],
            };
        }
        if (result === false) {
            const errors = [];
            const schemaErrors = libxml.validationSchemaErrors;
            if (schemaErrors && typeof schemaErrors === 'object') {
                for (const schemaName of Object.keys(schemaErrors)) {
                    const errList = schemaErrors[schemaName];
                    if (Array.isArray(errList)) {
                        for (const err of errList) {
                            errors.push({
                                message: typeof err === 'string' ? err : (err.message || String(err)),
                                line: typeof err === 'object' && err !== null ? err.line : undefined,
                                column: typeof err === 'object' && err !== null ? err.column : undefined,
                            });
                        }
                    }
                }
            }
            if (errors.length === 0) {
                errors.push({ message: 'XSD validation failed (no detailed errors returned)' });
            }
            return { isValid: false, errors };
        }
        return { isValid: true, errors: [] };
    }
    finally {
        libxml.clearAll();
    }
}
function validateWithLibxmljs(xmlContent, schemaPath) {
    try {
        let xmlDoc;
        try {
            xmlDoc = _libxmljs.parseXml(xmlContent, { nonet: true, noent: false, dtdload: false });
        }
        catch (parseErr) {
            return {
                isValid: false,
                errors: [{
                        message: `XML parse error: ${parseErr.message || String(parseErr)}`,
                        line: parseErr.line,
                        column: parseErr.column,
                    }],
            };
        }
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        const schemaDir = path.dirname(schemaPath);
        let schemaDoc;
        try {
            schemaDoc = _libxmljs.parseXml(schemaContent, {
                baseUrl: schemaDir + '/',
            });
        }
        catch (schemaErr) {
            return {
                isValid: false,
                errors: [{
                        message: `Schema parse error: ${schemaErr.message || String(schemaErr)}`,
                    }],
            };
        }
        const isValid = xmlDoc.validate(schemaDoc);
        if (isValid) {
            return { isValid: true, errors: [] };
        }
        const validationErrors = xmlDoc.validationErrors || [];
        const errors = validationErrors.map((err) => ({
            message: typeof err === 'string' ? err : (err.message || String(err)),
            line: typeof err === 'object' && err !== null ? err.line : undefined,
            column: typeof err === 'object' && err !== null ? err.column : undefined,
        }));
        if (errors.length === 0) {
            errors.push({ message: 'XSD validation failed (no detailed errors returned)' });
        }
        return { isValid: false, errors };
    }
    catch (err) {
        return {
            isValid: false,
            errors: [{ message: `libxmljs validation error: ${err.message || String(err)}` }],
        };
    }
}
function validateWithXmllintCli(xmlContent, schemaPath) {
    const { execFileSync } = require('child_process');
    const os = require('os');
    const tmpDir = os.tmpdir();
    const tmpXmlPath = path.join(tmpDir, `facturx-validate-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`);
    try {
        fs.writeFileSync(tmpXmlPath, xmlContent, 'utf-8');
        try {
            execFileSync('xmllint', ['--noout', '--schema', schemaPath, tmpXmlPath], {
                timeout: 30000,
                encoding: 'utf-8',
                stdio: 'pipe',
            });
            return { isValid: true, errors: [] };
        }
        catch (execErr) {
            const output = execErr.stderr || execErr.stdout || execErr.message || '';
            const errors = [];
            const lines = output.split('\n').filter((l) => l.trim().length > 0);
            for (const line of lines) {
                if (line.includes('fails to validate') || line.includes('validates'))
                    continue;
                const lineMatch = line.match(/:(\d+):\s*(.*)/);
                if (lineMatch) {
                    errors.push({
                        message: lineMatch[2].trim(),
                        line: parseInt(lineMatch[1], 10),
                    });
                }
                else {
                    errors.push({ message: line.trim() });
                }
            }
            if (errors.length === 0) {
                errors.push({ message: 'xmllint validation failed' });
            }
            return { isValid: false, errors };
        }
    }
    finally {
        try {
            fs.unlinkSync(tmpXmlPath);
        }
        catch (_e) {
        }
    }
}
class RealXsdValidator {
    constructor(complianceBasePath, options) {
        if (complianceBasePath) {
            this.complianceBasePath = complianceBasePath;
        }
        else {
            const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
            this.complianceBasePath = path.join(repoRoot, 'legacy', 'compliance');
        }
        this.enableCache = options?.enableCache ?? true;
        this.cache = new ValidationCache(options?.cacheSize ?? 200);
        this.engine = detectEngine();
    }
    getEngine() {
        return this.engine;
    }
    getSchemaPath(profile) {
        const mapping = PROFILE_SCHEMA_MAP[profile];
        if (!mapping) {
            throw new Error(`Unknown Factur-X profile: ${profile}`);
        }
        return path.join(this.complianceBasePath, 'xsd', mapping.dir, mapping.mainXsd);
    }
    schemaExists(profile) {
        try {
            const schemaPath = this.getSchemaPath(profile);
            return fs.existsSync(schemaPath);
        }
        catch {
            return false;
        }
    }
    getSchemaFiles(profile) {
        const mapping = PROFILE_SCHEMA_MAP[profile];
        if (!mapping)
            return [];
        const dir = path.join(this.complianceBasePath, 'xsd', mapping.dir);
        try {
            return fs.readdirSync(dir)
                .filter(f => f.endsWith('.xsd'))
                .map(f => path.join(dir, f));
        }
        catch {
            return [];
        }
    }
    validate(xmlContent, profile) {
        const startTime = Date.now();
        const schemaPath = this.getSchemaPath(profile);
        if (this.enableCache) {
            const cacheKey = this.buildCacheKey(xmlContent, profile);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        if (!fs.existsSync(schemaPath)) {
            const result = {
                isValid: false,
                errors: [{
                        message: `XSD schema file not found: ${schemaPath}`,
                    }],
                profile,
                schemaPath,
                durationMs: Date.now() - startTime,
                engine: this.engine,
            };
            return result;
        }
        let validationResult;
        switch (this.engine) {
            case 'node-libxml':
                validationResult = validateWithNodeLibxml(xmlContent, schemaPath);
                break;
            case 'libxmljs':
                validationResult = validateWithLibxmljs(xmlContent, schemaPath);
                break;
            case 'xmllint-cli':
                validationResult = validateWithXmllintCli(xmlContent, schemaPath);
                break;
            case 'none':
                validationResult = {
                    isValid: false,
                    errors: [{
                            message: 'No XSD validation engine available. Install node-libxml, libxmljs, or ensure xmllint is on PATH.',
                        }],
                };
                break;
        }
        const result = {
            isValid: validationResult.isValid,
            errors: Object.freeze(validationResult.errors),
            profile,
            schemaPath,
            durationMs: Date.now() - startTime,
            engine: this.engine,
        };
        if (this.enableCache) {
            const cacheKey = this.buildCacheKey(xmlContent, profile);
            this.cache.set(cacheKey, result);
        }
        return result;
    }
    async validateAsync(xmlContent, profile) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const result = this.validate(xmlContent, profile);
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    validateBatch(documents) {
        return documents.map(doc => this.validate(doc.xml, doc.profile));
    }
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.cache.getMaxSize(),
        };
    }
    buildCacheKey(xmlContent, profile) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(profile);
        hash.update(xmlContent);
        return hash.digest('hex');
    }
}
exports.RealXsdValidator = RealXsdValidator;
let _defaultInstance = null;
function getDefaultRealXsdValidator(complianceBasePath) {
    if (!_defaultInstance) {
        _defaultInstance = new RealXsdValidator(complianceBasePath);
    }
    return _defaultInstance;
}
function realValidateXsd(xmlContent, profile, complianceBasePath) {
    return getDefaultRealXsdValidator(complianceBasePath).validate(xmlContent, profile);
}
//# sourceMappingURL=RealXsdValidator.js.map