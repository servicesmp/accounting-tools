"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
// ==================================================
// File: services/accounting/src/signature/Signer.ts
// (Example digital signature; real PDF signing needs more advanced approach.)
// ==================================================
const crypto_1 = __importDefault(require("crypto"));
class Signer {
    static sign(data, privateKey) {
        const sign = crypto_1.default.createSign('RSA-SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey);
    }
    static verify(data, signature, publicKey) {
        const verify = crypto_1.default.createVerify('RSA-SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature);
    }
}
exports.Signer = Signer;
