const isHttpUrl = (value) => value !== undefined && /^https?:\/\//.test(value);
const nonEmpty = (value) => value !== undefined && value.trim() !== '' ? value : null;
const formatCurrency = ({ name, symbol }) => symbol ? `${name} (${symbol})` : name;
function pickFlagUrl(raw) {
    const candidates = [raw.flags?.svg, raw.flags?.png, raw.flag];
    return candidates.find(isHttpUrl) ?? null;
}
function mapCountry(raw) {
    return {
        id: raw.alpha3Code ?? raw.alpha2Code ?? raw.name,
        name: raw.name,
        flagUrl: pickFlagUrl(raw),
        capital: nonEmpty(raw.capital),
        region: nonEmpty(raw.region),
        subregion: nonEmpty(raw.subregion),
        population: raw.population ?? null,
        area: raw.area ?? null,
        languages: (raw.languages ?? []).map((language) => language.name),
        currencies: (raw.currencies ?? []).map(formatCurrency),
        borders: [...(raw.borders ?? [])],
    };
}
export function mapCountryResponse(raw) {
    return raw.map(mapCountry);
}
