export interface RawCurrency {
  code: string;
  name: string;
  symbol?: string;
}

export interface RawLanguage {
  iso639_1?: string;
  iso639_2?: string;
  name: string;
  nativeName?: string;
}

export interface RawCountry {
  name: string;
  alpha2Code?: string;
  alpha3Code?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  borders?: string[];
  currencies?: RawCurrency[];
  languages?: RawLanguage[];
  flag?: string;
  flags?: { svg?: string; png?: string };
}

export interface CountryCard {
  id: string;
  name: string;
  flagUrl: string | null;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  area: number | null;
  languages: string[];
  currencies: string[];
  borders: string[];
}
