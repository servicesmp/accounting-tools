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
exports.ExternalValidator = exports.MustangprojectValidator = exports.VeraPDFValidator = void 0;
exports.findVeraPDF = findVeraPDF;
exports.findMustangproject = findMustangproject;
exports.checkExternalValidators = checkExternalValidators;
exports.getDefaultExternalValidator = getDefaultExternalValidator;
exports.validateWithExternalTools = validateWithExternalTools;
exports.extractXMLWithExternalTools = extractXMLWithExternalTools;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
async function findVeraPDF() {
    const possiblePaths = [
        process.env.VERAPDF_HOME ? path.join(process.env.VERAPDF_HOME, 'verapdf') : null,
        '/opt/verapdf/verapdf',
        path.join(process.env.HOME || '', 'verapdf', 'verapdf'),
        'verapdf',
    ].filter(Boolean);
    for (const verapdfPath of possiblePaths) {
        try {
            const { stdout } = await execFileAsync(verapdfPath, ['--version'], { timeout: 5000 });
            if (stdout.includes('veraPDF')) {
                return verapdfPath;
            }
        }
        catch (error) {
        }
    }
    return null;
}
async function findMustangproject() {
    const possiblePaths = [
        process.env.MUSTANG_JAR,
        '/opt/mustangproject/Mustang-CLI.jar',
        path.join(process.env.HOME || '', 'mustangproject', 'Mustang-CLI.jar'),
    ].filter(Boolean);
    for (const jarPath of possiblePaths) {
        if ((0, fs_1.existsSync)(jarPath)) {
            return jarPath;
        }
    }
    return null;
}
async function checkExternalValidators() {
    const veraPDFPath = await findVeraPDF();
    const mustangprojectPath = await findMustangproject();
    return {
        veraPDF: veraPDFPath !== null,
        mustangproject: mustangprojectPath !== null,
        veraPDFPath: veraPDFPath || undefined,
        mustangprojectPath: mustangprojectPath || undefined,
    };
}
class VeraPDFValidator {
    constructor(config = {}) {
        this.veraPDFPath = config.veraPDFPath || 'verapdf';
        this.timeout = config.timeout || 60000;
        this.saveReports = config.saveReports || false;
        this.reportsDir = config.reportsDir;
    }
    async validate(pdfPath) {
        try {
            const args = [
                '--format', 'mrr',
                '--flavour', '3b',
                pdfPath
            ];
            const { stdout } = await execFileAsync(this.veraPDFPath, args, {
                timeout: this.timeout,
                maxBuffer: 10 * 1024 * 1024
            });
            if (this.saveReports && this.reportsDir) {
                const reportPath = path.join(this.reportsDir, `verapdf-${Date.now()}.xml`);
                await fs.mkdir(this.reportsDir, { recursive: true });
                await fs.writeFile(reportPath, stdout);
            }
            return this.parseVeraPDFOutput(stdout, pdfPath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`veraPDF not found at '${this.veraPDFPath}'. ` +
                    'Please install veraPDF or specify the correct path.');
            }
            if (error.killed && error.signal === 'SIGTERM') {
                throw new Error(`veraPDF validation timeout after ${this.timeout}ms`);
            }
            throw new Error(`veraPDF validation failed: ${error.message}`);
        }
    }
    async parseVeraPDFOutput(output, pdfPath) {
        const errors = [];
        const warnings = [];
        const isCompliant = output.includes('compliant="true"') ||
            output.includes('<validationResult isCompliant="true"');
        const isValid = !output.includes('isValid="false"');
        let profile = 'PDF/A-3b';
        const profileMatch = output.match(/flavour="([^"]+)"/);
        if (profileMatch) {
            profile = profileMatch[1];
        }
        const errorPattern = /<error[^>]*specification="([^"]*)"[^>]*clause="([^"]*)"[^>]*>(.*?)<\/error>/gs;
        let match;
        while ((match = errorPattern.exec(output)) !== null) {
            errors.push({
                specification: match[1] || 'Unknown',
                clause: match[2] || 'Unknown',
                level: 'Error',
                message: match[3]?.trim() || 'Validation error',
            });
        }
        const stats = await fs.stat(pdfPath);
        const metadata = {
            pdfVersion: '1.7',
            fileSize: stats.size,
            pageCount: 0,
            hasAttachments: output.includes('EmbeddedFile') || output.includes('attachment'),
        };
        return {
            isValid,
            isCompliant,
            profile,
            errors,
            warnings,
            metadata,
            rawReport: output,
        };
    }
    async isAvailable() {
        try {
            await execFileAsync(this.veraPDFPath, ['--version'], { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.VeraPDFValidator = VeraPDFValidator;
class MustangprojectValidator {
    constructor(config = {}) {
        this.jarPath = config.mustangprojectPath ||
            process.env.MUSTANG_JAR ||
            '/opt/mustangproject/Mustang-CLI.jar';
        this.javaPath = process.env.JAVA_HOME
            ? path.join(process.env.JAVA_HOME, 'bin', 'java')
            : 'java';
        this.timeout = config.timeout || 60000;
        this.saveReports = config.saveReports || false;
        this.reportsDir = config.reportsDir;
    }
    async validate(pdfPath) {
        try {
            const args = [
                '-jar', this.jarPath,
                '--action', 'validate',
                '--source', pdfPath
            ];
            const { stdout, stderr } = await execFileAsync(this.javaPath, args, {
                timeout: this.timeout,
                maxBuffer: 10 * 1024 * 1024
            });
            const combinedOutput = stdout + '\n' + stderr;
            if (this.saveReports && this.reportsDir) {
                const reportPath = path.join(this.reportsDir, `mustang-${Date.now()}.txt`);
                await fs.mkdir(this.reportsDir, { recursive: true });
                await fs.writeFile(reportPath, combinedOutput);
            }
            return this.parseMustangOutput(combinedOutput);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Java or Mustangproject not found. ` +
                    `Java: '${this.javaPath}', JAR: '${this.jarPath}'. ` +
                    'Please install Java and Mustangproject or specify correct paths.');
            }
            if (error.killed && error.signal === 'SIGTERM') {
                throw new Error(`Mustangproject validation timeout after ${this.timeout}ms`);
            }
            if (error.stdout || error.stderr) {
                const combinedOutput = (error.stdout || '') + '\n' + (error.stderr || '');
                return this.parseMustangOutput(combinedOutput);
            }
            throw new Error(`Mustangproject validation failed: ${error.message}`);
        }
    }
    async extractXML(pdfPath, outputPath) {
        const tempOutput = outputPath || path.join(process.env.TMPDIR || '/tmp', `facturx-${Date.now()}.xml`);
        try {
            const args = [
                '-jar', this.jarPath,
                '--action', 'extract',
                '--source', pdfPath,
                '--out', tempOutput
            ];
            await execFileAsync(this.javaPath, args, { timeout: this.timeout });
            const xmlContent = await fs.readFile(tempOutput, 'utf-8');
            if (!outputPath) {
                await fs.unlink(tempOutput).catch(() => { });
            }
            return xmlContent;
        }
        catch (error) {
            throw new Error(`Failed to extract XML: ${error.message}`);
        }
    }
    parseMustangOutput(output) {
        const errors = [];
        const warnings = [];
        const isValid = output.includes('valid') &&
            !output.includes('invalid') &&
            !output.toLowerCase().includes('error');
        let profile = 'UNKNOWN';
        if (output.includes('MINIMUM'))
            profile = 'MINIMUM';
        else if (output.includes('BASIC-WL'))
            profile = 'BASIC-WL';
        else if (output.includes('BASIC'))
            profile = 'BASIC';
        else if (output.includes('EN16931'))
            profile = 'EN16931';
        else if (output.includes('EXTENDED'))
            profile = 'EXTENDED';
        const errorLines = output.split('\n').filter(line => line.toLowerCase().includes('error') ||
            line.toLowerCase().includes('exception') ||
            line.toLowerCase().includes('invalid'));
        errorLines.forEach(line => {
            if (line.trim()) {
                errors.push({
                    code: 'VALIDATION_ERROR',
                    message: line.trim(),
                    severity: 'ERROR',
                });
            }
        });
        const warningLines = output.split('\n').filter(line => line.toLowerCase().includes('warning') ||
            line.toLowerCase().includes('warn'));
        warningLines.forEach(line => {
            if (line.trim()) {
                warnings.push({
                    message: line.trim(),
                });
            }
        });
        return {
            isValid,
            profile,
            errors,
            warnings,
            xmlExtracted: output.includes('extracted') || output.includes('XML'),
            rawReport: output,
        };
    }
    async isAvailable() {
        try {
            await execFileAsync(this.javaPath, ['-version'], { timeout: 5000 });
            return (0, fs_1.existsSync)(this.jarPath);
        }
        catch {
            return false;
        }
    }
}
exports.MustangprojectValidator = MustangprojectValidator;
class ExternalValidator {
    constructor(config = {}) {
        this.veraPDF = new VeraPDFValidator(config);
        this.mustang = new MustangprojectValidator(config);
    }
    async validate(pdfPath) {
        const timestamp = new Date();
        let veraPDFResult;
        let mustangResult;
        const veraPDFAvailable = await this.veraPDF.isAvailable();
        if (veraPDFAvailable) {
            try {
                veraPDFResult = await this.veraPDF.validate(pdfPath);
            }
            catch (error) {
                console.warn(`veraPDF validation failed: ${error.message}`);
            }
        }
        const mustangAvailable = await this.mustang.isAvailable();
        if (mustangAvailable) {
            try {
                mustangResult = await this.mustang.validate(pdfPath);
            }
            catch (error) {
                console.warn(`Mustangproject validation failed: ${error.message}`);
            }
        }
        const summary = this.buildSummary(veraPDFResult, mustangResult);
        return {
            timestamp,
            veraPDF: veraPDFResult,
            mustangproject: mustangResult,
            isFullyValid: summary.pdfA3Compliant && summary.facturXCompliant,
            summary,
        };
    }
    buildSummary(veraPDF, mustang) {
        const totalErrors = (veraPDF?.errors.length || 0) +
            (mustang?.errors.length || 0);
        const totalWarnings = (veraPDF?.warnings.length || 0) +
            (mustang?.warnings.length || 0);
        const pdfA3Compliant = veraPDF?.isCompliant ?? false;
        const facturXCompliant = mustang?.isValid ?? false;
        const recommendations = [];
        if (!pdfA3Compliant && veraPDF) {
            recommendations.push('Fix PDF/A-3 compliance issues reported by veraPDF');
        }
        if (!facturXCompliant && mustang) {
            recommendations.push('Fix Factur-X compliance issues reported by Mustangproject');
        }
        if (!veraPDF && !mustang) {
            recommendations.push('Install external validation tools (veraPDF and Mustangproject)');
        }
        else if (!veraPDF) {
            recommendations.push('Install veraPDF for PDF/A-3 validation');
        }
        else if (!mustang) {
            recommendations.push('Install Mustangproject for Factur-X validation');
        }
        return {
            totalErrors,
            totalWarnings,
            pdfA3Compliant,
            facturXCompliant,
            recommendations,
        };
    }
    async getAvailableValidators() {
        return {
            veraPDF: await this.veraPDF.isAvailable(),
            mustangproject: await this.mustang.isAvailable(),
        };
    }
    async extractXML(pdfPath, outputPath) {
        const available = await this.mustang.isAvailable();
        if (!available) {
            return null;
        }
        try {
            return await this.mustang.extractXML(pdfPath, outputPath);
        }
        catch (error) {
            console.warn(`XML extraction failed: ${error.message}`);
            return null;
        }
    }
}
exports.ExternalValidator = ExternalValidator;
let defaultValidator = null;
function getDefaultExternalValidator(config) {
    if (!defaultValidator) {
        defaultValidator = new ExternalValidator(config);
    }
    return defaultValidator;
}
async function validateWithExternalTools(pdfPath, config) {
    const validator = getDefaultExternalValidator(config);
    return validator.validate(pdfPath);
}
async function extractXMLWithExternalTools(pdfPath, outputPath, config) {
    const validator = getDefaultExternalValidator(config);
    return validator.extractXML(pdfPath, outputPath);
}
//# sourceMappingURL=ExternalValidators.js.map