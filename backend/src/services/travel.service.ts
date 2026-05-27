/**
 * Travel data service — REST Countries + Teleport
 *
 * Both APIs are completely free and require no API key.
 *
 * REST Countries: https://restcountries.com  — country facts (capital, currency, language…)
 * Teleport:       https://api.teleport.org   — city quality-of-life scores
 */

const COUNTRIES_BASE = 'https://restcountries.com/v3.1';
const TELEPORT_BASE = 'https://api.teleport.org/api';

const FETCH_OPTS = { signal: AbortSignal.timeout(8000) };

// ─── Internal types ───────────────────────────────────────────────────────────

interface CountryInfo {
  name: string;
  capital: string;
  currency: string;      // e.g. "Euro (€)"
  languages: string;     // e.g. "French"
  region: string;
  population: number;
}

interface CityScores {
  fullName: string;
  teleportScore: number;
  categories: Array<{ name: string; score: number }>;
  summary: string;       // HTML stripped to plain text
}

// ─── Public response type ─────────────────────────────────────────────────────

export interface DestinationInfo {
  query: string;
  country?: CountryInfo;
  city?: CityScores;
}

// ─── REST Countries ───────────────────────────────────────────────────────────

async function getCountryInfo(query: string): Promise<CountryInfo | null> {
  try {
    const url =
      `${COUNTRIES_BASE}/name/${encodeURIComponent(query)}` +
      `?fields=name,capital,currencies,languages,region,population`;

    const res = await fetch(url, FETCH_OPTS);
    if (!res.ok) return null;

    const data = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const c = data[0];

    // name
    const nameObj = c.name as Record<string, unknown> | undefined;
    const name = (nameObj?.common as string) ?? query;

    // capital
    const capitalArr = c.capital as string[] | undefined;
    const capital = capitalArr?.[0] ?? 'N/A';

    // currency — first entry only
    const currObj = c.currencies as Record<string, { name: string; symbol: string }> | undefined;
    const currEntry = currObj ? Object.values(currObj)[0] : undefined;
    const currency = currEntry ? `${currEntry.name} (${currEntry.symbol})` : 'N/A';

    // languages
    const langObj = c.languages as Record<string, string> | undefined;
    const languages = langObj ? Object.values(langObj).join(', ') : 'N/A';

    // region
    const region = (c.region as string) ?? 'N/A';

    // population
    const population = (c.population as number) ?? 0;

    return { name, capital, currency, languages, region, population };
  } catch (err) {
    console.error('[travel] REST Countries error:', err);
    return null;
  }
}

// ─── Teleport ─────────────────────────────────────────────────────────────────

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getTeleportCityScores(query: string): Promise<CityScores | null> {
  try {
    // Step 1 — search for the city and embed the urban area link in one request
    const searchUrl =
      `${TELEPORT_BASE}/cities/?search=${encodeURIComponent(query)}` +
      `&embed=city:search-results/city:item/city:urban_area`;

    const searchRes = await fetch(searchUrl, FETCH_OPTS);
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as Record<string, unknown>;
    const embedded = searchData._embedded as Record<string, unknown> | undefined;
    const results = embedded?.['city:search-results'] as Array<Record<string, unknown>> | undefined;
    if (!results || results.length === 0) return null;

    // Find the first result that has an urban area
    let urbanAreaHref: string | null = null;
    let fullName = query;

    for (const result of results) {
      fullName = (result.matching_full_name as string) ?? query;
      const itemEmbed = result._embedded as Record<string, unknown> | undefined;
      const cityItem = itemEmbed?.['city:item'] as Record<string, unknown> | undefined;
      const links = cityItem?._links as Record<string, unknown> | undefined;
      const uaLink = links?.['city:urban_area'] as Record<string, string> | undefined;
      if (uaLink?.href) {
        urbanAreaHref = uaLink.href;
        break;
      }
    }

    if (!urbanAreaHref) return null;

    // Step 2 — fetch scores for the urban area
    const scoresRes = await fetch(`${urbanAreaHref}scores/`, FETCH_OPTS);
    if (!scoresRes.ok) return null;

    const scoresData = (await scoresRes.json()) as Record<string, unknown>;

    const rawCategories = scoresData.categories as
      | Array<{ name: string; score_out_of_10: number }>
      | undefined;

    const categories = (rawCategories ?? [])
      .map((c) => ({ name: c.name, score: Math.round(c.score_out_of_10 * 10) / 10 }))
      // Only show the most travel-relevant scores
      .filter((c) =>
        [
          'Cost of Living',
          'Culture & Entertainment',
          'Safety',
          'Healthcare',
          'Outdoors & Nature',
          'Internet Access',
          'Travel Connectivity',
          'Tolerance',
        ].includes(c.name)
      );

    const rawSummary = (scoresData.summary as string) ?? '';
    const summary = stripHtml(rawSummary).slice(0, 400);

    const teleportScore =
      Math.round(((scoresData.teleport_city_score as number) ?? 0) * 10) / 10;

    return { fullName, teleportScore, categories, summary };
  } catch (err) {
    console.error('[travel] Teleport error:', err);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch destination info from REST Countries and/or Teleport. */
export async function getDestinationInfo(query: string): Promise<DestinationInfo> {
  // Run both lookups in parallel — neither blocks the other
  const [country, city] = await Promise.all([
    getCountryInfo(query),
    getTeleportCityScores(query),
  ]);

  return { query, country: country ?? undefined, city: city ?? undefined };
}

/**
 * Build a plain-text context block for a destination.
 * Injected into the OpenAI system prompt so the AI grounds its response in real data.
 */
export async function buildTravelContext(destination: string): Promise<string> {
  const info = await getDestinationInfo(destination);

  if (!info.country && !info.city) return '';

  const lines: string[] = [
    `[Live destination data for "${destination}"]`,
  ];

  if (info.country) {
    const c = info.country;
    lines.push(
      `\nCountry: ${c.name}`,
      `  Capital: ${c.capital}`,
      `  Region: ${c.region}`,
      `  Currency: ${c.currency}`,
      `  Languages: ${c.languages}`,
      `  Population: ${c.population.toLocaleString()}`,
    );
  }

  if (info.city) {
    const s = info.city;
    lines.push(
      `\nCity quality scores for ${s.fullName} (Teleport — out of 10):`,
      ...s.categories.map((cat) => `  ${cat.name}: ${cat.score}`),
      `  Overall Teleport score: ${s.teleportScore}`,
    );
    if (s.summary) {
      lines.push(`\nCity overview: ${s.summary}`);
    }
  }

  lines.push('\nUse this real data to give specific, grounded travel advice.');

  return lines.join('\n');
}
