import { toIsoCountryCode, countryDisplayName } from '../../document/country';

describe('toIsoCountryCode', () => {
  it.each([
    ['FR', 'FR'], ['fr', 'FR'], ['France', 'FR'], ['france', 'FR'], [' FRANCE ', 'FR'], ['FRA', 'FR'],
    ['Allemagne', 'DE'], ['Deutschland', 'DE'], ['Suisse', 'CH'], ['Belgique', 'BE'], ['Espagne', 'ES'],
    ["Côte d'Ivoire", 'CI'], ['Cote d’Ivoire', 'CI'], ['Cameroun', 'CM'], ['Sénégal', 'SN'],
    ['Royaume-Uni', 'GB'], ['UK', 'GB'], ['United States', 'US'], ['Pays-Bas', 'NL'],
  ])('%s → %s', (input, code) => expect(toIsoCountryCode(input)).toBe(code));

  it.each(['XX', 'Atlantis', '', '  ', null, undefined, 42])('inconnu : %s → null', (input) => {
    expect(toIsoCountryCode(input as any)).toBeNull();
  });

  it('régression : « Allemagne » ne donne plus « AL » (Albanie), « Suisse » plus « SU »', () => {
    expect(toIsoCountryCode('Allemagne')).not.toBe('AL');
    expect(toIsoCountryCode('Suisse')).not.toBe('SU');
  });

  it('nom lisible dans la langue du document', () => {
    expect(countryDisplayName('DE', 'fr')).toBe('Allemagne');
    expect(countryDisplayName('france', 'en')).toBe('France');
  });
});
