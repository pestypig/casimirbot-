import fs from "node:fs/promises";
import path from "node:path";
import type { StarSimRequest } from "../contract";
import type { StarSimSourceAdapterResult, StarSimSourceIdentifiers, StarSimSourceRecord } from "./types";
import {
  buildStarSimSourceAdapterRuntime,
  fetchJsonWithRuntime,
  StarSimSourceFetchError,
} from "./runtime";

const TESS_MAST_ADAPTER_VERSION = "tess_mast.live/1";
const FIXTURE_ROOT = path.resolve(process.cwd(), "tests", "fixtures", "starsim", "sources", "tess-mast");

const normalize = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9:._+\- ]+/g, "");

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
          catalog: "tess_mast",
          adapter_version: TESS_MAST_ADAPTER_VERSION,
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
    (identifiers.tess_tic_id
      && record.identifiers.tess_tic_id
      && normalize(record.identifiers.tess_tic_id) === normalize(identifiers.tess_tic_id))
    || (identifiers.mast_obs_id
      && record.identifiers.mast_obs_id
      && normalize(record.identifiers.mast_obs_id) === normalize(identifiers.mast_obs_id))
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

const maybeNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const maybeNumberArray = (value: unknown): number[] | undefined =>
  Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
    ? [...value]
    : undefined;

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
      catalog: "tess_mast",
      adapter_version: TESS_MAST_ADAPTER_VERSION,
      fetch_mode: "live",
      fetched_at_iso: args.fetched_at_iso,
      query_metadata: args.query_metadata,
      raw_payload: args.payload,
    };
  }

  const ticId = String(args.payload.tess_tic_id ?? args.payload.tic_id ?? "");
  const mastObsId = String(args.payload.mast_obs_id ?? args.payload.obs_id ?? "");
  const gaiaSourceId = String(args.payload.gaia_dr3_source_id ?? "");
  const numax = maybeNumber(args.payload.numax_uHz ?? args.payload.numax);
  const deltanu = maybeNumber(args.payload.deltanu_uHz ?? args.payload.deltanu);
  const modeFrequencies = maybeNumberArray(args.payload.mode_frequencies_uHz ?? args.payload.mode_frequencies);
  const timeSeriesRef =
    typeof args.payload.time_series_ref === "string"
      ? args.payload.time_series_ref
      : typeof args.payload.product_ref === "string"
        ? args.payload.product_ref
        : undefined;

  if (!ticId && !mastObsId && !gaiaSourceId) {
    return null;
  }
  if (numax === undefined && deltanu === undefined && !modeFrequencies && !timeSeriesRef) {
    return null;
  }

  return {
    catalog: "tess_mast",
    adapter_version: TESS_MAST_ADAPTER_VERSION,
    fetch_mode: "live",
    fetched_at_iso: args.fetched_at_iso,
    query_metadata: args.query_metadata,
    record_id: `tess_mast:${ticId || mastObsId || gaiaSourceId}`,
    identifiers: {
      gaia_dr3_source_id: gaiaSourceId || undefined,
      tess_tic_id: ticId || undefined,
      mast_obs_id: mastObsId || undefined,
    },
    aliases: [args.request.target?.name ?? "", ticId, mastObsId].filter(Boolean),
    quality_flags: [
      ...(Array.isArray(args.payload.quality_flags) ? args.payload.quality_flags.filter((flag): flag is string => typeof flag === "string") : []),
      "live_fetch",
    ],
    quality_score: maybeNumber(args.payload.quality_score) ?? 70,
    notes: [
      typeof args.payload.pipeline === "string" ? `pipeline:${args.payload.pipeline}` : "TESS/MAST live summary fetch",
    ],
    target: {
      name: (args.payload.name as string | undefined) ?? args.request.target?.name,
      spectral_type: args.request.target?.spectral_type,
      luminosity_class: args.request.target?.luminosity_class,
    },
    photometry: {
      ...(timeSeriesRef ? { time_series_ref: timeSeriesRef } : {}),
    },
    asteroseismology: {
      ...(numax !== undefined ? { numax_uHz: numax } : {}),
      ...(deltanu !== undefined ? { deltanu_uHz: deltanu } : {}),
      ...(modeFrequencies ? { mode_frequencies_uHz: modeFrequencies } : {}),
      uncertainties: {
        ...(maybeNumber(args.payload.numax_error) !== undefined ? { numax_uHz: Number(args.payload.numax_error) } : {}),
        ...(maybeNumber(args.payload.deltanu_error) !== undefined ? { deltanu_uHz: Number(args.payload.deltanu_error) } : {}),
      },
    },
    raw_payload: args.payload,
  };
};

const findFixture = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const fixtures = await readFixtures();
  if (fixtures.length === 0) {
    return {
      catalog: "tess_mast",
      attempted: true,
      record: null,
      reason: "tess_mast_fixture_unavailable",
    };
  }

  const byIdentifier = fixtures.find((record) => matchesIdentifiers(record, args.identifiers));
  if (byIdentifier) {
    return {
      catalog: "tess_mast",
      attempted: true,
      record: byIdentifier,
      reason: null,
    };
  }

  const byTarget = fixtures.find((record) => matchesTarget(record, args.request.target));
  if (byTarget) {
    return {
      catalog: "tess_mast",
      attempted: true,
      record: byTarget,
      reason: null,
    };
  }

  return {
    catalog: "tess_mast",
    attempted: true,
    record: null,
    reason: "tess_mast_record_not_found",
  };
};

const fetchLiveRecord = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("tess_mast");
  if (!runtime.endpoint) {
    return {
      catalog: "tess_mast",
      attempted: true,
      record: null,
      reason: "source_unconfigured",
    };
  }
  const ticId = args.identifiers.tess_tic_id?.trim();
  const mastObsId = args.identifiers.mast_obs_id?.trim();
  const gaiaSourceId = args.identifiers.gaia_dr3_source_id?.trim();
  const name = args.request.target?.name?.trim();
  if (!ticId && !mastObsId && !gaiaSourceId && !name) {
    return {
      catalog: "tess_mast",
      attempted: true,
      record: null,
      reason: "no_supported_identifier",
    };
  }

  try {
    const url = new URL(runtime.endpoint);
    if (ticId) url.searchParams.set("tess_tic_id", ticId);
    if (mastObsId) url.searchParams.set("mast_obs_id", mastObsId);
    if (gaiaSourceId) url.searchParams.set("gaia_dr3_source_id", gaiaSourceId);
    if (name) url.searchParams.set("name", name);

    const fetched = await fetchJsonWithRuntime({
      runtime,
      url: url.toString(),
      query_metadata: {
        tess_tic_id: ticId ?? null,
        mast_obs_id: mastObsId ?? null,
        gaia_dr3_source_id: gaiaSourceId ?? null,
      },
    });
    const record = buildNormalizedLiveRecord({
      request: args.request,
      fetched_at_iso: fetched.fetched_at_iso,
      query_metadata: fetched.query_metadata,
      payload: fetched.payload as Record<string, unknown>,
    });
    if (!record) {
      return {
        catalog: "tess_mast",
        attempted: true,
        record: null,
        reason: "source_malformed",
      };
    }
    return {
      catalog: "tess_mast",
      attempted: true,
      record,
      reason: null,
    };
  } catch (error) {
    if (error instanceof StarSimSourceFetchError) {
      return {
        catalog: "tess_mast",
        attempted: true,
        record: null,
        reason: error.reason,
      };
    }
    return {
      catalog: "tess_mast",
      attempted: true,
      record: null,
      reason: "source_unavailable",
    };
  }
};

export const resolveTessMastSource = async (args: {
  request: StarSimRequest;
  identifiers: StarSimSourceIdentifiers;
}): Promise<StarSimSourceAdapterResult> => {
  const runtime = buildStarSimSourceAdapterRuntime("tess_mast");
  if (runtime.mode === "disabled") {
    return {
      catalog: "tess_mast",
      attempted: false,
      record: null,
      reason: "source_disabled",
    };
  }
  if (runtime.mode === "cache_only") {
    return {
      catalog: "tess_mast",
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

export const getTessMastAdapterVersion = (): string => TESS_MAST_ADAPTER_VERSION;
