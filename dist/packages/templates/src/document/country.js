"use strict";
/**
 * Normalisation des pays en code ISO 3166-1 alpha-2 (BT-40, BT-55, BT-80…).
 *
 * La plateforme stocke souvent un NOM de pays (« France », « Allemagne »,
 * « Côte d'Ivoire ») là où Factur-X exige un code à deux lettres. L'ancien
 * contournement (`substring(0, 2).toUpperCase()`) tombait juste par hasard
 * pour « France » mais produisait « AL » (Albanie) pour « Allemagne » ou
 * « SU » pour « Suisse ». Ce module résout les noms en français, anglais,
 * allemand et espagnol via Intl.DisplayNames. Aucune dépendance : utilisable
 * côté navigateur comme côté serveur.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toIsoCountryCode = toIsoCountryCode;
exports.toIsoCountryCodeOr = toIsoCountryCodeOr;
exports.countryDisplayName = countryDisplayName;
// ISO 3166-1 alpha-2 officiellement attribués.
const ISO_ALPHA2 = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO ' +
    'JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR ' +
    'MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO ' +
    'RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV ' +
    'TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');
const ISO_SET = new Set(ISO_ALPHA2);
/** Quelques alpha-3 et appellations courantes qu'Intl ne produit pas. */
const ALIASES = {
    fra: 'FR', deu: 'DE', bel: 'BE', che: 'CH', esp: 'ES', ita: 'IT', lux: 'LU', gbr: 'GB', usa: 'US', can: 'CA',
    cmr: 'CM', sen: 'SN', civ: 'CI', mar: 'MA', tun: 'TN', dza: 'DZ', prt: 'PT', nld: 'NL',
    uk: 'GB', 'royaume uni': 'GB', 'grande bretagne': 'GB', angleterre: 'GB', england: 'GB',
    'etats unis': 'US', 'etats unis d amerique': 'US', usa_: 'US', amerique: 'US',
    'cote divoire': 'CI', 'cote d ivoire': 'CI', 'ivory coast': 'CI',
    hollande: 'NL', 'pays bas': 'NL', holland: 'NL',
    'republique tcheque': 'CZ', tchequie: 'CZ', czechia: 'CZ',
    'rd congo': 'CD', rdc: 'CD', 'congo brazzaville': 'CG', 'congo kinshasa': 'CD',
    'la reunion': 'RE', reunion: 'RE',
};
function fold(value) {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[’'`´-]/g, ' ')
        .replace(/[^a-z ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
let byName = null;
function nameIndex() {
    if (byName)
        return byName;
    byName = new Map();
    const DisplayNames = Intl.DisplayNames;
    for (const locale of ['fr', 'en', 'de', 'es', 'it', 'pt']) {
        let dn;
        try {
            dn = DisplayNames ? new DisplayNames([locale], { type: 'region' }) : null;
        }
        catch {
            dn = null;
        }
        if (!dn)
            continue;
        for (const code of ISO_ALPHA2) {
            const name = dn.of(code);
            if (name && name !== code)
                byName.set(fold(name), code);
        }
    }
    for (const [k, v] of Object.entries(ALIASES))
        byName.set(fold(k), v);
    return byName;
}
/**
 * Code ISO alpha-2 d'un pays donné par code ou par nom ; `null` si inconnu.
 * « FR », « fr », « France », « france », « FRA » → « FR ».
 */
function toIsoCountryCode(input) {
    if (typeof input !== 'string')
        return null;
    const raw = input.trim();
    if (!raw)
        return null;
    if (/^[A-Za-z]{2}$/.test(raw)) {
        const code = raw.toUpperCase();
        return ISO_SET.has(code) ? code : (code === 'UK' ? 'GB' : null);
    }
    return nameIndex().get(fold(raw)) ?? null;
}
/** Comme toIsoCountryCode, avec un repli explicite (ex. pays de l'organisation). */
function toIsoCountryCodeOr(input, fallback) {
    return toIsoCountryCode(input) ?? fallback;
}
/** Nom lisible d'un pays dans la langue du document (« FR » → « France »). */
function countryDisplayName(code, language = 'fr') {
    const iso = toIsoCountryCode(code ?? '');
    if (!iso)
        return code ?? '';
    try {
        const DisplayNames = Intl.DisplayNames;
        return (DisplayNames && new DisplayNames([language], { type: 'region' }).of(iso)) || iso;
    }
    catch {
        return iso;
    }
}
//# sourceMappingURL=country.js.map