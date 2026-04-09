import type { StarSimSourceCatalog, StarSimSourceIdentifiers } from "../contract";
import type { StarSimSourceRecord } from "./types";

export type CrossmatchOutcomeCode =
  | "accepted"
  | "rejected_quality"
  | "rejected_identifier_conflict"
  | "rejected_name_mismatch"
  | "rejected_missing_link"
  | "fallback_used";

export interface CrossmatchOutcome {
  from_catalog: StarSimSourceCatalog;
  to_catalog: StarSimSourceCatalog;
  status: CrossmatchOutcomeCode;
  reason: string;
  quality_flags: string[];
}

const normalize = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const hasBadQualityFlag = (flags: string[]): boolean =>
  flags.some((flag) => {
    const normalized = normalize(flag);
    return normalized.includes("bad")
      || normalized.includes("reject")
      || normalized.includes("low_snr")
      || normalized.includes("quality_fail")
      || normalized.includes("mismatch");
  });

const identifiersConflict = (record: StarSimSourceRecord, expected: StarSimSourceIdentifiers): boolean =>
  Object.entries(expected).some(([key, value]) => {
    if (!value) return false;
    const recordValue = record.identifiers[key as keyof StarSimSourceIdentifiers];
    return Boolean(recordValue) && normalize(recordValue) !== normalize(value);
  });

export const evaluateCrossmatch = (args: {
  primary: StarSimSourceRecord | null;
  candidate: StarSimSourceRecord | null;
  expectedIdentifiers: StarSimSourceIdentifiers;
  fallbackAvailable: boolean;
}): CrossmatchOutcome | null => {
  if (!args.primary || !args.candidate) {
    return null;
  }

  if (hasBadQualityFlag(args.candidate.quality_flags)) {
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_quality",
      reason: "candidate_quality_flags_blocked",
      quality_flags: [...args.candidate.quality_flags],
    };
  }

  if (identifiersConflict(args.candidate, args.expectedIdentifiers)) {
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_identifier_conflict",
      reason: "identifier_conflict",
      quality_flags: [...args.candidate.quality_flags],
    };
  }

  const primaryName = normalize(args.primary.target?.name);
  const candidateName = normalize(args.candidate.target?.name);
  if (primaryName && candidateName && primaryName !== candidateName) {
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_name_mismatch",
      reason: "name_mismatch",
      quality_flags: [...args.candidate.quality_flags],
    };
  }

  if (!args.candidate.identifiers.gaia_dr3_source_id && args.primary.identifiers.gaia_dr3_source_id) {
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_missing_link",
      reason: "missing_gaia_link",
      quality_flags: [...args.candidate.quality_flags],
    };
  }

  return {
    from_catalog: args.primary.catalog,
    to_catalog: args.candidate.catalog,
    status: args.fallbackAvailable ? "fallback_used" : "accepted",
    reason: args.fallbackAvailable ? "fallback_path_active" : "crossmatch_ok",
    quality_flags: [...args.candidate.quality_flags],
  };
};
