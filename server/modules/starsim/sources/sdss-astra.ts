import fs from "node:fs/promises";
import path from "node:path";
import type { StarSimRequest } from "../contract";
import type { StarSimSourceAdapterResult, StarSimSourceIdentifiers, StarSimSourceRecord } from "./types";
import {
  buildStarSimSourceAdapterRuntime,
  fetchJsonWithRuntime,
  StarSimSourceFetchError,
} from "./runtime";

const SDSS_ASTRA_ADAPTER_VERSION = "sdss_astra.live/2";
const FIXTURE_ROOT = path.resolve(process.cwd(), "tests", "fixtures", "starsim", "sources", "sdss-astra");

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
          catalog: "sdss_astra",
          adapter_version: SDSS_ASTRA_ADAPTER_VERSION,
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
    (identifiers.sdss_apogee_id
      && record.identifiers.sdss_apogee_id
      && normalize(record.identifiers.sdss_apogee_id) === normalize(identifiers.sdss_apogee_id))
    || (identifiers.gaia_dr3_source_id
      && record.identifiers.gaia_dr3_source_id
      && normalize(record.identifiers.gaia_dr3_source_id) === normalize(identifiers.gaia_dr3_source_id)),
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
      catalog: "sdss_astra",
      attempted: true,
      record: null,
      reason: "sdss_astra_fixture_unavailable",
    };
  }

  const byIdentifier = fixtures.find((record) => matchesIdentifiers(record, args.identifiers));
  if (byIdentifier) {
    return {
      catalog: "sdss_astra",
      attempted: true,
      record: byIdentifier,
      reason: null,
    };
  }

  const byTarget = fixtures.find((record) => matchesTarget(record, args.request.target));
  if (byTarget) {
    return {
      catalog: "sdss_astra",
      attempted: true,
      record: byTarget,
      reason: null,
    };
  }

  return {
    catalog: "sdss_astra",
    attempted: true,
    record: null,
    reason: "sdss_astra_record_not_found",
  };
};

const maybeNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const buildNormalizedLiveRecord = (args: {
  request: StarSimRequest;
  fetched_at_iso: string;
  query_metadata: Record<string, unknown>;
  payload: Record<string, unknown>;
}): StarSimSourceRecord | null => {
  if (typeof args.payload.record_id === "string") {
    const payload = args.payload as Omit<StarSimSourceRecord, "catalog" | "adapter_version" | "fetch_mode">;
    return {
      ...payload,
      catalog: "sdss_astra",
      adapter_version: SDSS_ASTRA_ADAPTER_VERSION,
      fetch_mode: "live",
      fetched_at_iso: args.fetched_at_iso,
      query_metadata: args.query_metadata,
      raw_payload: args.payload,
    };
  }

  const sourceId = String(args.payload.gaia_dr3_source_id ?? "");
  const apogeeId = String(args.payload.sdss_apogee_id ?? args.payload.apogee_id ?? "");
  if (!sourceId && !apogeeId) {
    return null;
  }
  const teff = maybeNumber(args.payload.teff_K ?? args.payload.teff);
  const logg = maybeNumber(args.payload.logg_cgs ?? args.payload.logg);
  const metallicity = maybeNumber(args.payload.metallicity_feh ?? args.payload.fe_h ?? args.payload.m_h);
  if (teff === undefined && logg === undefined && metallicity === undefined) {
    return null;
  }

  return {
    catalog: "sdss_astra",
    adapter_version: SDSS_ASTRA_ADAPTER_VERSION,
    fetch_mode: "live",
    fetched_at_iso: args.fetched_at_iso,
    query_metadata: args.query_metadata,
    record_id: `sdss_astra:${apogeeId || sourceId}`,
    identifiers: {
      gaia_dr3_source_id: sourceId || undefined,
      sdss_apogee_id: apogeeId || undefined,
    },
    aliases: [args.request.target?.name ?? "", sourceId, apogeeId].filter(Boolean),
    quality_flags: [
      ...(Array.isArray(args.payload.quality_flags) ? args.payload.quality_flags.filter((flag): flag is string => typeof flag === "string") : []),
      "live_fetch",
    ],
    quality_score: maybeNumber(args.payload.quality_score) ?? 80,
    notes: [typeof args.payload.pipeline === "string" ? `pipeline:${args.payload.pipeline}` : "SDSS Astra live fetch"],
    target: {
      name: (args.payload.name as string | undefined) ?? args.request.target?.name,
      spectral_type: args.request.target?.spectral_type,
      luminosity_class: args.request.target?.luminosity_class,
    },
    spectroscopy: {
      teff_K: teff,
      logg_cgs: logg,
      metallicity_feh: metallicity,
      vsini_kms: maybeNumber(args.payload.vsini_kms ?? args.payload.vsini),
      spectrum_ref: typeof args.payload.spectrum_ref === "string" ? args.payload.spectrum_ref : undefined,
      abundances:
        typeof args.payload.abundances === "object" && args.payload.abundances && !Array.isArray(args.payload.abundances)
          ? (args.payload.abundances as Record<string, number>)
          : undefined,
      uncertainties: {
        ...(maybeNumber(args.payload.teff_error) !== undefined ? { teff_K: Number(args.payload.teff_error) } : {}),
        ...(maybeNumber(args.payload.logg_error) !== undefined ? { logg_cgs: Number(args.payload.logg_error) } : {}),
        ...(maybeNumber(args.payload.feh_error) !== undefined ? { metallicity_feh: Number(args.payload.feh_error) } : {}),
        ...(maybeNumber(args.payload.vsini_error) !== undefined ? { vsini_kms: Number(args.payload.vsini_error) } : {}),
      },
    },
    raw_payload: args.payload,
  };
};

const fetchLiveRecord = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("sdss_astra");
  if (!runtime.endpoint) {
    return {
      catalog: "sdss_astra",
      attempted: true,
      record: null,
      reason: "source_unconfigured",
    };
  }
  const gaiaSourceId = args.identifiers.gaia_dr3_source_id?.trim();
  const sdssId = args.identifiers.sdss_apogee_id?.trim();
  if (!gaiaSourceId && !sdssId) {
    return {
      catalog: "sdss_astra",
      attempted: true,
      record: null,
      reason: "no_supported_identifier",
    };
  }

  try {
    const url = new URL(runtime.endpoint);
    if (sdssId) {
      url.searchParams.set("sdss_apogee_id", sdssId);
    }
    if (gaiaSourceId) {
      url.searchParams.set("gaia_dr3_source_id", gaiaSourceId);
    }
    if (args.request.target?.name) {
      url.searchParams.set("name", args.request.target.name);
    }
    const fetched = await fetchJsonWithRuntime({
      runtime,
      url: url.toString(),
      query_metadata: {
        gaia_dr3_source_id: gaiaSourceId ?? null,
        sdss_apogee_id: sdssId ?? null,
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
        catalog: "sdss_astra",
        attempted: true,
        record: null,
        reason: "source_malformed",
      };
    }
    return {
      catalog: "sdss_astra",
      attempted: true,
      record,
      reason: null,
    };
  } catch (error) {
    if (error instanceof StarSimSourceFetchError) {
      return {
        catalog: "sdss_astra",
        attempted: true,
        record: null,
        reason: error.reason,
      };
    }
    return {
      catalog: "sdss_astra",
      attempted: true,
      record: null,
      reason: "source_unavailable",
    };
  }
};

export const resolveSdssAstraSource = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("sdss_astra");
  if (runtime.mode === "disabled") {
    return {
      catalog: "sdss_astra",
      attempted: false,
      record: null,
      reason: "source_disabled",
    };
  }
  if (runtime.mode === "cache_only") {
    return {
      catalog: "sdss_astra",
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

export const getSdssAstraAdapterVersion = (): string => SDSS_ASTRA_ADAPTER_VERSION;
