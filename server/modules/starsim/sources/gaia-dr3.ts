import fs from "node:fs/promises";
import path from "node:path";
import type { StarSimRequest } from "../contract";
import type { StarSimSourceAdapterResult, StarSimSourceIdentifiers, StarSimSourceRecord } from "./types";
import {
  buildStarSimSourceAdapterRuntime,
  fetchJsonWithRuntime,
  StarSimSourceFetchError,
} from "./runtime";

const GAIA_DR3_ADAPTER_VERSION = "gaia_dr3.live/2";
const FIXTURE_ROOT = path.resolve(process.cwd(), "tests", "fixtures", "starsim", "sources", "gaia-dr3");
const DEFAULT_GAIA_DR3_ENDPOINT = "https://gea.esac.esa.int/tap-server/tap/sync";

const normalize = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9:.\- ]+/g, "");

const readFixtures = async (): Promise<StarSimSourceRecord[]> => {
  try {
    const entries = await fs.readdir(FIXTURE_ROOT, { withFileTypes: true });
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    const fixtures = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const raw = await fs.readFile(path.join(FIXTURE_ROOT, fileName), "utf8");
        const parsed = JSON.parse(raw) as Omit<StarSimSourceRecord, "catalog" | "adapter_version" | "fetch_mode">;
        return {
          ...parsed,
          catalog: "gaia_dr3",
          adapter_version: GAIA_DR3_ADAPTER_VERSION,
          fetch_mode: "fixture",
        } satisfies StarSimSourceRecord;
      }),
    );
    return fixtures;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const matchesIdentifiers = (record: StarSimSourceRecord, identifiers: StarSimSourceIdentifiers): boolean =>
  Boolean(
    identifiers.gaia_dr3_source_id
    && record.identifiers.gaia_dr3_source_id
    && normalize(record.identifiers.gaia_dr3_source_id) === normalize(identifiers.gaia_dr3_source_id),
  );

const matchesTarget = (record: StarSimSourceRecord, target: StarSimRequest["target"]): boolean => {
  const candidates = [target?.object_id, target?.name].map((value) => normalize(value)).filter(Boolean);
  const aliases = new Set(
    [record.record_id, record.target?.object_id, record.target?.name, ...record.aliases].map((value) => normalize(value)),
  );
  return candidates.some((candidate) => aliases.has(candidate));
};

const findFixture = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const fixtures = await readFixtures();
  if (fixtures.length === 0) {
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: null,
      reason: "gaia_dr3_fixture_unavailable",
    };
  }

  const byIdentifier = fixtures.find((record) => matchesIdentifiers(record, args.identifiers));
  if (byIdentifier) {
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: byIdentifier,
      reason: null,
    };
  }

  const byTarget = fixtures.find((record) => matchesTarget(record, args.request.target));
  if (byTarget) {
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: byTarget,
      reason: null,
    };
  }

  return {
    catalog: "gaia_dr3",
    attempted: true,
    record: null,
    reason: "gaia_target_not_found",
  };
};

const resolveSourceId = (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): string | null => {
  const direct = args.identifiers.gaia_dr3_source_id?.trim();
  if (direct) {
    return direct;
  }
  const objectId = args.request.target?.object_id?.trim() ?? "";
  if (/^\d{6,}$/.test(objectId)) {
    return objectId;
  }
  return null;
};

const maybeNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const buildNormalizedLiveRecord = (args: {
  request: StarSimRequest;
  fetched_at_iso: string;
  query_metadata: Record<string, unknown>;
  payload: Record<string, unknown>;
}): StarSimSourceRecord | null => {
  if (typeof args.payload.record_id === "string" && typeof args.payload.catalog !== "string") {
    const payload = args.payload as Omit<StarSimSourceRecord, "catalog" | "adapter_version" | "fetch_mode">;
    return {
      ...payload,
      catalog: "gaia_dr3",
      adapter_version: GAIA_DR3_ADAPTER_VERSION,
      fetch_mode: "live",
      fetched_at_iso: args.fetched_at_iso,
      query_metadata: args.query_metadata,
      raw_payload: args.payload,
    };
  }

  const metadata = Array.isArray(args.payload.metadata) ? args.payload.metadata : null;
  const rows = Array.isArray(args.payload.data) ? args.payload.data : null;
  if (!metadata || !rows || rows.length === 0 || !Array.isArray(rows[0])) {
    return null;
  }

  const columns = metadata.map((column) => String((column as { name?: unknown }).name ?? ""));
  const row = rows[0] as unknown[];
  const byName = (name: string): unknown => {
    const index = columns.indexOf(name);
    return index >= 0 ? row[index] : undefined;
  };

  const sourceId = String(byName("source_id") ?? "");
  if (!sourceId) {
    return null;
  }
  const ruwe = maybeNumber(byName("ruwe"));
  return {
    catalog: "gaia_dr3",
    adapter_version: GAIA_DR3_ADAPTER_VERSION,
    fetch_mode: "live",
    fetched_at_iso: args.fetched_at_iso,
    query_metadata: args.query_metadata,
    record_id: `gaia_dr3:${sourceId}`,
    identifiers: {
      gaia_dr3_source_id: sourceId,
    },
    aliases: [sourceId, args.request.target?.name ?? "", args.request.target?.object_id ?? ""].filter(Boolean),
    quality_flags: [
      ruwe !== undefined ? (ruwe <= 1.4 ? "ruwe_good" : "ruwe_high") : "ruwe_unknown",
      "live_fetch",
    ],
    quality_score: ruwe !== undefined ? Math.max(0, Math.round(100 - Math.max(0, ruwe - 1) * 20)) : 70,
    notes: ["Gaia DR3 TAP sync live fetch"],
    target: {
      object_id: sourceId,
      name: args.request.target?.name ?? `Gaia DR3 ${sourceId}`,
      spectral_type: args.request.target?.spectral_type,
      luminosity_class: args.request.target?.luminosity_class,
      epoch_iso: args.request.target?.epoch_iso ?? "2016-01-01T00:00:00.000Z",
    },
    astrometry: {
      parallax_mas: maybeNumber(byName("parallax")),
      proper_motion_ra_masyr: maybeNumber(byName("pmra")),
      proper_motion_dec_masyr: maybeNumber(byName("pmdec")),
      radial_velocity_kms: maybeNumber(byName("radial_velocity")),
      uncertainties: {
        ...(maybeNumber(byName("parallax_error")) !== undefined ? { parallax_mas: Number(byName("parallax_error")) } : {}),
        ...(maybeNumber(byName("pmra_error")) !== undefined ? { proper_motion_ra_masyr: Number(byName("pmra_error")) } : {}),
        ...(maybeNumber(byName("pmdec_error")) !== undefined ? { proper_motion_dec_masyr: Number(byName("pmdec_error")) } : {}),
        ...(maybeNumber(byName("radial_velocity_error")) !== undefined ? { radial_velocity_kms: Number(byName("radial_velocity_error")) } : {}),
      },
    },
    photometry: {
      bands: {
        ...(maybeNumber(byName("phot_g_mean_mag")) !== undefined ? { G: Number(byName("phot_g_mean_mag")) } : {}),
        ...(maybeNumber(byName("phot_bp_mean_mag")) !== undefined ? { BP: Number(byName("phot_bp_mean_mag")) } : {}),
        ...(maybeNumber(byName("phot_rp_mean_mag")) !== undefined ? { RP: Number(byName("phot_rp_mean_mag")) } : {}),
      },
    },
    raw_payload: args.payload,
  };
};

const fetchLiveRecord = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("gaia_dr3");
  if (!runtime.endpoint) {
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: null,
      reason: "source_unconfigured",
    };
  }
  const sourceId = resolveSourceId(args);
  const nameHint = args.request.target?.name?.trim();
  const usingDefaultEndpoint = runtime.endpoint === DEFAULT_GAIA_DR3_ENDPOINT;

  if (!sourceId && (usingDefaultEndpoint || !nameHint)) {
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: null,
      reason: "no_supported_identifier",
    };
  }

  try {
    const fetched = usingDefaultEndpoint
      ? await fetchJsonWithRuntime({
          runtime,
          url: runtime.endpoint,
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            body: new URLSearchParams({
              REQUEST: "doQuery",
              LANG: "ADQL",
              FORMAT: "json",
              QUERY: [
                "SELECT TOP 1",
                "source_id, ra, dec, parallax, parallax_error, pmra, pmra_error, pmdec, pmdec_error,",
                "radial_velocity, radial_velocity_error, phot_g_mean_mag, phot_bp_mean_mag, phot_rp_mean_mag, ruwe",
                "FROM gaiadr3.gaia_source",
                `WHERE source_id = ${sourceId}`,
              ].join(" "),
            }).toString(),
          },
          query_metadata: {
            identifier_kind: "gaia_dr3_source_id",
            source_id: sourceId,
          },
        })
      : await fetchJsonWithRuntime({
          runtime,
          url: (() => {
            const url = new URL(runtime.endpoint);
            if (sourceId) {
              url.searchParams.set("gaia_dr3_source_id", sourceId);
            }
            if (nameHint) {
              url.searchParams.set("name", nameHint);
            }
            if (args.request.target?.object_id) {
              url.searchParams.set("object_id", args.request.target.object_id);
            }
            return url.toString();
          })(),
          query_metadata: {
            identifier_kind: sourceId ? "gaia_dr3_source_id" : "name_hint",
            source_id: sourceId,
            name: nameHint ?? null,
          },
        });

    const payload = fetched.payload as Record<string, unknown>;
    const record = buildNormalizedLiveRecord({
      request: args.request,
      fetched_at_iso: fetched.fetched_at_iso,
      query_metadata: fetched.query_metadata,
      payload,
    });
    if (!record) {
      return {
        catalog: "gaia_dr3",
        attempted: true,
        record: null,
        reason: "source_malformed",
      };
    }
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record,
      reason: null,
    };
  } catch (error) {
    if (error instanceof StarSimSourceFetchError) {
      return {
        catalog: "gaia_dr3",
        attempted: true,
        record: null,
        reason: error.reason,
      };
    }
    return {
      catalog: "gaia_dr3",
      attempted: true,
      record: null,
      reason: "source_unavailable",
    };
  }
};

export const resolveGaiaDr3Source = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("gaia_dr3");
  if (runtime.mode === "disabled") {
    return {
      catalog: "gaia_dr3",
      attempted: false,
      record: null,
      reason: "source_disabled",
    };
  }
  if (runtime.mode === "cache_only") {
    return {
      catalog: "gaia_dr3",
      attempted: false,
      record: null,
      reason: "cache_only_miss",
    };
  }
  if (runtime.mode === "live") {
    return fetchLiveRecord(args);
  }
  return findFixture(args);
};

export const getGaiaDr3AdapterVersion = (): string => GAIA_DR3_ADAPTER_VERSION;
