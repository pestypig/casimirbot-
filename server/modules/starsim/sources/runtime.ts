import type { StarSimSourceCatalog, StarSimSourceFetchMode } from "../contract";

export type StarSimSourceAdapterMode = Exclude<StarSimSourceFetchMode, "cache">;

export interface StarSimSourceAdapterRuntime {
  catalog: StarSimSourceCatalog;
  mode: StarSimSourceAdapterMode;
  endpoint: string | null;
  timeout_ms: number;
  user_agent: string;
  endpoint_identity: string;
}

export interface StarSimFetchedJson {
  payload: unknown;
  fetched_at_iso: string;
  query_metadata: Record<string, unknown>;
}

export class StarSimSourceFetchError extends Error {
  readonly reason: string;
  readonly detail?: string;

  constructor(reason: string, message: string, detail?: string) {
    super(message);
    this.reason = reason;
    this.detail = detail;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_USER_AGENT = "casimirbot-starsim/1.0";
const DEFAULT_GAIA_DR3_ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync";

const SOURCE_MODE_KEYS: Record<StarSimSourceCatalog, string> = {
  gaia_dr3: "STAR_SIM_GAIA_DR3_MODE",
  sdss_astra: "STAR_SIM_SDSS_ASTRA_MODE",
  lamost_dr10: "STAR_SIM_LAMOST_DR10_MODE",
  tess_mast: "STAR_SIM_TESS_MAST_MODE",
  tasoc: "STAR_SIM_TASOC_MODE",
};

const SOURCE_ENDPOINT_KEYS: Record<StarSimSourceCatalog, string> = {
  gaia_dr3: "STAR_SIM_GAIA_DR3_ENDPOINT",
  sdss_astra: "STAR_SIM_SDSS_ASTRA_ENDPOINT",
  lamost_dr10: "STAR_SIM_LAMOST_DR10_ENDPOINT",
  tess_mast: "STAR_SIM_TESS_MAST_ENDPOINT",
  tasoc: "STAR_SIM_TASOC_ENDPOINT",
};

const DEFAULT_ENDPOINTS: Partial<Record<StarSimSourceCatalog, string>> = {
  gaia_dr3: DEFAULT_GAIA_DR3_ENDPOINT,
};

const parseSourceMode = (value: string | undefined): StarSimSourceAdapterMode | null => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "fixture" || normalized === "live" || normalized === "cache_only" || normalized === "disabled") {
    return normalized;
  }
  return null;
};

export const resolveStarSimSourceAdapterMode = (catalog: StarSimSourceCatalog): StarSimSourceAdapterMode => {
  const specific = parseSourceMode(process.env[SOURCE_MODE_KEYS[catalog]]);
  if (specific) {
    return specific;
  }
  const globalMode = parseSourceMode(process.env.STAR_SIM_SOURCE_FETCH_MODE);
  return globalMode ?? "fixture";
};

export const resolveStarSimSourceTimeoutMs = (): number => {
  const parsed = Number(process.env.STAR_SIM_SOURCE_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_TIMEOUT_MS;
};

export const resolveStarSimSourceUserAgent = (): string => {
  const explicit = process.env.STAR_SIM_SOURCE_USER_AGENT?.trim();
  return explicit && explicit.length > 0 ? explicit : DEFAULT_USER_AGENT;
};

export const resolveStarSimSourceEndpoint = (catalog: StarSimSourceCatalog): string | null => {
  const explicit = process.env[SOURCE_ENDPOINT_KEYS[catalog]]?.trim();
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  return DEFAULT_ENDPOINTS[catalog] ?? null;
};

export const buildStarSimSourceAdapterRuntime = (catalog: StarSimSourceCatalog): StarSimSourceAdapterRuntime => {
  const mode = resolveStarSimSourceAdapterMode(catalog);
  const endpoint = resolveStarSimSourceEndpoint(catalog);
  const endpointIdentity = mode === "live"
    ? endpoint
      ? `live:${endpoint}`
      : "live:unconfigured"
    : `${mode}:builtin`;
  return {
    catalog,
    mode,
    endpoint,
    timeout_ms: resolveStarSimSourceTimeoutMs(),
    user_agent: resolveStarSimSourceUserAgent(),
    endpoint_identity: endpointIdentity,
  };
};

const loadFetch = async (): Promise<typeof fetch> => {
  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }
  const imported = await import("node-fetch");
  return imported.default as unknown as typeof fetch;
};

export const fetchJsonWithRuntime = async (args: {
  runtime: StarSimSourceAdapterRuntime;
  url: string;
  init?: RequestInit;
  query_metadata?: Record<string, unknown>;
}): Promise<StarSimFetchedJson> => {
  if (args.runtime.mode !== "live") {
    throw new StarSimSourceFetchError("source_unavailable", `Catalog ${args.runtime.catalog} is not in live mode.`);
  }
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), args.runtime.timeout_ms);
  const startedAt = Date.now();
  const fetchImpl = await loadFetch();
  try {
    const response = await fetchImpl(args.url, {
      ...args.init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": args.runtime.user_agent,
        ...(args.init?.headers ?? {}),
      },
    });
    const fetchedAt = new Date().toISOString();
    if (!response.ok) {
      throw new StarSimSourceFetchError(
        response.status === 408 ? "source_timeout" : "source_unavailable",
        `Catalog ${args.runtime.catalog} returned HTTP ${response.status}.`,
        `status=${response.status}`,
      );
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new StarSimSourceFetchError(
        "source_malformed",
        `Catalog ${args.runtime.catalog} returned invalid JSON.`,
        error instanceof Error ? error.message : String(error),
      );
    }
    return {
      payload,
      fetched_at_iso: fetchedAt,
      query_metadata: {
        catalog: args.runtime.catalog,
        endpoint: args.runtime.endpoint_identity,
        url: args.url,
        method: (args.init?.method ?? "GET").toUpperCase(),
        duration_ms: Date.now() - startedAt,
        ...(args.query_metadata ?? {}),
      },
    };
  } catch (error) {
    if (error instanceof StarSimSourceFetchError) {
      throw error;
    }
    if ((error as Error).name === "AbortError") {
      throw new StarSimSourceFetchError(
        "source_timeout",
        `Catalog ${args.runtime.catalog} timed out after ${args.runtime.timeout_ms} ms.`,
      );
    }
    throw new StarSimSourceFetchError(
      "source_unavailable",
      `Catalog ${args.runtime.catalog} fetch failed.`,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
};
