import iso from 'iso-3166-1';

export interface CountryOption {
  name: string;
  iso3: string;
  numericCode: string;
}

export const ALL_COUNTRIES: CountryOption[] = iso.all().map((c) => ({
  name: c.country,
  iso3: c.alpha3,
  numericCode: c.numeric,
})).sort((a, b) => a.name.localeCompare(b.name));
