"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableLocaleCodes = exports.getLocaleByCode = exports.DEFAULT_LOCALES = exports.de = exports.fr = exports.en = exports.t = exports.getDefaultI18n = exports.I18n = void 0;
exports.createI18n = createI18n;
exports.translate = translate;
var I18n_1 = require("./I18n");
Object.defineProperty(exports, "I18n", { enumerable: true, get: function () { return I18n_1.I18n; } });
Object.defineProperty(exports, "getDefaultI18n", { enumerable: true, get: function () { return I18n_1.getDefaultI18n; } });
Object.defineProperty(exports, "t", { enumerable: true, get: function () { return I18n_1.t; } });
var locales_1 = require("./locales");
Object.defineProperty(exports, "en", { enumerable: true, get: function () { return locales_1.en; } });
Object.defineProperty(exports, "fr", { enumerable: true, get: function () { return locales_1.fr; } });
Object.defineProperty(exports, "de", { enumerable: true, get: function () { return locales_1.de; } });
Object.defineProperty(exports, "DEFAULT_LOCALES", { enumerable: true, get: function () { return locales_1.DEFAULT_LOCALES; } });
Object.defineProperty(exports, "getLocaleByCode", { enumerable: true, get: function () { return locales_1.getLocaleByCode; } });
Object.defineProperty(exports, "getAvailableLocaleCodes", { enumerable: true, get: function () { return locales_1.getAvailableLocaleCodes; } });
const I18n_2 = require("./I18n");
const locales_2 = require("./locales");
function createI18n(defaultLocale = 'en') {
    const i18n = new I18n_2.I18n({ defaultLocale, fallbackLocale: 'en' });
    i18n.registerLocales(locales_2.DEFAULT_LOCALES);
    return i18n;
}
function translate(key, locale = 'en', context) {
    const i18n = createI18n(locale);
    return i18n.getMessage(key, { context });
}
//# sourceMappingURL=index.js.map