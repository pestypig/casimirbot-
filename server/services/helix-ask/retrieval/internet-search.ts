import crypto from "node:crypto";
import {
  HELIX_INTERNET_SEARCH_CAPABILITY,
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
  type HelixInternetSearchEvidenceRef,
  type HelixInternetSearchObservation,
  type HelixInternetSearchProvider,
  type HelixInternetSearchResult,
} from "@shared/helix-internet-search-observation";

type RecordLike = Record<string, unknown>;

export type InternetSearchFetchResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export type InternetSearchFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<InternetSearchFetchResponse>;

export type RunInternetSearchInput = {
  turnId: string;
  callId?: string | null;
  query: string;
  providers?: HelixInternetSearchProvider[] | null;
  domains?: string[] | null;
  recencyDays?: number | null;
  limit?: number | null;
  fetchImpl?: InternetSearchFetch;
};

const DEFAULT_PROVIDERS: HelixInternetSearchProvider[] = [
  "tavily",
  "exa",
  "google_custom_search",
];

const PROVIDER_CONFIGURATION_REQUIREMENTS: Record<HelixInternetSearchProvider, string> = {
  tavily: "tavily_requires_TAVILY_API_KEY",
  exa: "exa_requires_EXA_API_KEY",
  google_custom_search: "google_custom_search_requires_google_custom_search_key_and_engine_id",
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    url.hash = "";
    return url.toString();
  } catch {
    return /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
  }
};

const defaultFetch: InternetSearchFetch = async (url, init) => {
  const response = await fetch(url, init as RequestInit);
  return response;
};

const evidenceRef = (
  provider: HelixInternetSearchProvider,
  ref: string,
  url?: string | null,
): HelixInternetSearchEvidenceRef => ({
  ref: `${provider}:${ref}`,
  provider,
  ...(url ? { url } : {}),
  retrieved_at_ms: Date.now(),
});

const compactText = (value: unknown, maxChars = 1200): string | undefined => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 3).trimEnd()}...`;
};

const makeResult = (input: {
  provider: HelixInternetSearchProvider;
  ref: HelixInternetSearchEvidenceRef;
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  contentExcerpt?: string | null;
  publishedAt?: string | null;
  rank: number;
  confidence?: "high" | "medium" | "low";
}): HelixInternetSearchResult | null => {
  const url = normalizeUrl(input.url);
  if (!url) return null;
  const title = input.title?.trim() || url;
  return {
    result_id: `${input.provider}:${hashShort([title, url])}`,
    title,
    url,
    ...(compactText(input.snippet, 700) ? { snippet: compactText(input.snippet, 700) } : {}),
    ...(compactText(input.contentExcerpt, 1200) ? { content_excerpt: compactText(input.contentExcerpt, 1200) } : {}),
    ...(input.publishedAt ? { published_at: input.publishedAt } : {}),
    source_provider: input.provider,
    rank: input.rank,
    evidence_refs: [input.ref.ref],
    confidence: input.confidence ?? "medium",
  };
};

const dedupeResults = (results: HelixInternetSearchResult[]): HelixInternetSearchResult[] => {
  const byUrl = new Map<string, HelixInternetSearchResult>();
  for (const result of results) {
    const key = normalizeUrl(result.url)?.toLowerCase() ?? result.url.toLowerCase();
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, result);
      continue;
    }
    byUrl.set(key, {
      ...existing,
      snippet: existing.snippet ?? result.snippet,
      content_excerpt: existing.content_excerpt ?? result.content_excerpt,
      published_at: existing.published_at ?? result.published_at,
      evidence_refs: unique([...existing.evidence_refs, ...result.evidence_refs]),
      confidence: existing.confidence === "high" || result.confidence === "high" ? "high" : existing.confidence,
    });
  }
  return Array.from(byUrl.values()).sort((left, right) => left.rank - right.rank);
};

const fetchJson = async (input: {
  provider: HelixInternetSearchProvider;
  url: string;
  init?: Parameters<InternetSearchFetch>[1];
  fetchImpl: InternetSearchFetch;
  providersCalled: HelixInternetSearchProvider[];
  missingRequirements: string[];
}): Promise<unknown> => {
  input.providersCalled.push(input.provider);
  try {
    const response = await input.fetchImpl(input.url, input.init);
    if (!response.ok) {
      input.missingRequirements.push(`${input.provider}_http_${response.status}`);
      return null;
    }
    if (response.json) return await response.json();
    if (response.text) return JSON.parse(await response.text());
  } catch (error) {
    input.missingRequirements.push(`${input.provider}_request_failed`);
  }
  return null;
};

const lookupTavily = async (input: {
  query: string;
  domains: string[];
  recencyDays: number | null;
  limit: number;
  fetchImpl: InternetSearchFetch;
  providersCalled: HelixInternetSearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixInternetSearchEvidenceRef[];
}): Promise<HelixInternetSearchResult[]> => {
  const apiKey = readString(process.env.TAVILY_API_KEY);
  if (!apiKey) {
    input.missingRequirements.push(PROVIDER_CONFIGURATION_REQUIREMENTS.tavily);
    return [];
  }
  const json = await fetchJson({
    provider: "tavily",
    url: "https://api.tavily.com/search",
    fetchImpl: input.fetchImpl,
    providersCalled: input.providersCalled,
    missingRequirements: input.missingRequirements,
    init: {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CasimirBot-InternetSearch/1.0",
      },
      body: JSON.stringify({
        query: input.query,
        search_depth: "basic",
        max_results: input.limit,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        ...(input.domains.length ? { include_domains: input.domains } : {}),
        ...(input.recencyDays ? { days: input.recencyDays } : {}),
      }),
    },
  });
  const results = readArray(readRecord(json)?.results);
  return results
    .map((raw, index) => {
      const record = readRecord(raw);
      if (!record) return null;
      const url = normalizeUrl(firstString(record.url, record.link));
      const ref = evidenceRef("tavily", hashShort([url, record.title, index]), url);
      input.evidenceRefs.push(ref);
      return makeResult({
        provider: "tavily",
        ref,
        title: firstString(record.title),
        url,
        snippet: firstString(record.content, record.snippet),
        publishedAt: firstString(record.published_date, record.publishedAt),
        rank: index + 1,
      });
    })
    .filter((entry): entry is HelixInternetSearchResult => Boolean(entry));
};

const lookupExa = async (input: {
  query: string;
  domains: string[];
  limit: number;
  fetchImpl: InternetSearchFetch;
  providersCalled: HelixInternetSearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixInternetSearchEvidenceRef[];
}): Promise<HelixInternetSearchResult[]> => {
  const apiKey = readString(process.env.EXA_API_KEY);
  if (!apiKey) {
    input.missingRequirements.push(PROVIDER_CONFIGURATION_REQUIREMENTS.exa);
    return [];
  }
  const json = await fetchJson({
    provider: "exa",
    url: "https://api.exa.ai/search",
    fetchImpl: input.fetchImpl,
    providersCalled: input.providersCalled,
    missingRequirements: input.missingRequirements,
    init: {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "CasimirBot-InternetSearch/1.0",
      },
      body: JSON.stringify({
        query: input.query,
        numResults: input.limit,
        ...(input.domains.length ? { includeDomains: input.domains } : {}),
        contents: {
          text: { maxCharacters: 1000 },
          highlights: { numSentences: 2 },
        },
      }),
    },
  });
  const results = readArray(readRecord(json)?.results);
  return results
    .map((raw, index) => {
      const record = readRecord(raw);
      if (!record) return null;
      const url = normalizeUrl(firstString(record.url));
      const highlights = readArray(record.highlights).map(readString).filter(Boolean).join(" ");
      const ref = evidenceRef("exa", firstString(record.id) ?? hashShort([url, record.title, index]), url);
      input.evidenceRefs.push(ref);
      return makeResult({
        provider: "exa",
        ref,
        title: firstString(record.title),
        url,
        snippet: highlights || firstString(record.text),
        contentExcerpt: firstString(record.text),
        publishedAt: firstString(record.publishedDate, record.published_at),
        rank: index + 1,
      });
    })
    .filter((entry): entry is HelixInternetSearchResult => Boolean(entry));
};

const lookupGoogleCustomSearch = async (input: {
  query: string;
  domains: string[];
  limit: number;
  fetchImpl: InternetSearchFetch;
  providersCalled: HelixInternetSearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixInternetSearchEvidenceRef[];
}): Promise<HelixInternetSearchResult[]> => {
  const apiKey =
    readString(process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) ??
    readString(process.env.GOOGLE_CSE_API_KEY) ??
    readString(process.env.GOOGLE_API_KEY);
  const engineId =
    readString(process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) ??
    readString(process.env.GOOGLE_CUSTOM_SEARCH_CX) ??
    readString(process.env.GOOGLE_CSE_CX) ??
    readString(process.env.GOOGLE_CSE_ID) ??
    readString(process.env.GOOGLE_SEARCH_ENGINE_ID);
  if (!apiKey || !engineId) {
    input.missingRequirements.push(PROVIDER_CONFIGURATION_REQUIREMENTS.google_custom_search);
    return [];
  }
  const domainClause = input.domains.length ? ` ${input.domains.map((domain) => `site:${domain}`).join(" OR ")}` : "";
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", engineId);
  url.searchParams.set("q", `${input.query}${domainClause}`.trim());
  url.searchParams.set("num", String(Math.max(1, Math.min(input.limit, 10))));
  const json = await fetchJson({
    provider: "google_custom_search",
    url: url.toString(),
    fetchImpl: input.fetchImpl,
    providersCalled: input.providersCalled,
    missingRequirements: input.missingRequirements,
    init: {
      headers: {
        Accept: "application/json",
        "User-Agent": "CasimirBot-InternetSearch/1.0",
      },
    },
  });
  const results = readArray(readRecord(json)?.items);
  return results
    .map((raw, index) => {
      const record = readRecord(raw);
      if (!record) return null;
      const url = normalizeUrl(firstString(record.link, record.formattedUrl));
      const ref = evidenceRef("google_custom_search", firstString(record.cacheId) ?? hashShort([url, record.title, index]), url);
      input.evidenceRefs.push(ref);
      return makeResult({
        provider: "google_custom_search",
        ref,
        title: firstString(record.title, record.htmlTitle),
        url,
        snippet: firstString(record.snippet, record.htmlSnippet),
        rank: index + 1,
        confidence: "medium",
      });
    })
    .filter((entry): entry is HelixInternetSearchResult => Boolean(entry));
};

export const isInternetSearchProviderConfigurationMissing = (
  observation: Pick<HelixInternetSearchObservation, "providers_considered" | "providers_called" | "results" | "missing_requirements" | "selected_for_answer">,
): boolean => {
  if (observation.selected_for_answer) return false;
  if (observation.results.length > 0) return false;
  if (observation.providers_called.length > 0) return false;
  if (observation.providers_considered.length === 0) return false;
  const missing = new Set(observation.missing_requirements);
  return observation.providers_considered.every((provider) => missing.has(PROVIDER_CONFIGURATION_REQUIREMENTS[provider]));
};

export async function runInternetSearch(
  input: RunInternetSearchInput,
): Promise<HelixInternetSearchObservation> {
  const query = input.query.trim();
  const limit = Math.max(1, Math.min(Number(input.limit) || 8, 20));
  const domains = unique((input.domains ?? []).map((entry) => entry.trim().toLowerCase()).filter(Boolean)).slice(0, 8);
  const recencyDays = Number(input.recencyDays) > 0
    ? Math.max(1, Math.min(Math.floor(Number(input.recencyDays)), 365))
    : null;
  const providers = unique((input.providers?.length ? input.providers : DEFAULT_PROVIDERS)
    .filter((provider): provider is HelixInternetSearchProvider => DEFAULT_PROVIDERS.includes(provider)));
  const fetchImpl = input.fetchImpl ?? defaultFetch;
  const providersCalled: HelixInternetSearchProvider[] = [];
  const missingRequirements: string[] = [];
  const evidenceRefs: HelixInternetSearchEvidenceRef[] = [];
  const results: HelixInternetSearchResult[] = [];

  if (!query) {
    missingRequirements.push("query_required");
  }

  for (const provider of providers) {
    if (!query) break;
    if (provider === "tavily") {
      results.push(...await lookupTavily({ query, domains, recencyDays, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "exa") {
      results.push(...await lookupExa({ query, domains, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "google_custom_search") {
      results.push(...await lookupGoogleCustomSearch({ query, domains, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    }
  }

  const dedupedResults = dedupeResults(results).slice(0, limit);
  if (!dedupedResults.length && query) {
    missingRequirements.push("no_internet_search_results_returned");
  }
  const uniqueMissingRequirements = unique(missingRequirements);
  const providerConfigurationMissing = isInternetSearchProviderConfigurationMissing({
    providers_considered: providers,
    providers_called: unique(providersCalled),
    results: dedupedResults,
    missing_requirements: uniqueMissingRequirements,
    selected_for_answer: dedupedResults.length > 0,
  });

  return {
    schema: HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
    artifact_id: `${input.callId ?? input.turnId}:internet_search_observation`,
    turn_id: input.turnId,
    capability: HELIX_INTERNET_SEARCH_CAPABILITY,
    query,
    providers_considered: providers,
    providers_called: unique(providersCalled),
    evidence_refs: evidenceRefs,
    results: dedupedResults,
    ...(domains.length ? { domains } : {}),
    ...(recencyDays ? { recency_days: recencyDays } : {}),
    missing_requirements: uniqueMissingRequirements,
    provider_configuration_missing: providerConfigurationMissing,
    selected_for_answer: dedupedResults.length > 0,
    assistant_answer: false,
    raw_content_included: false,
  };
}
