import type { StarSimSourceCatalog, StarSimSourceIdentifiers } from "../contract";
import type { StarSimSourceRecord } from "./types";

export type CrossmatchOutcomeCode =
  | "accepted"
  | "accepted_with_warning"
  | "rejected_quality"
  | "rejected_identifier_conflict"
  | "rejected_name_mismatch"
  | "rejected_missing_link";

export interface CrossmatchOutcome {
  from_catalog: StarSimSourceCatalog;
  to_catalog: StarSimSourceCatalog;
  status: CrossmatchOutcomeCode;
  reason: string;
  identity_basis?: string[];
  quality_flags: string[];
  warnings?: string[];
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

const getStrongIdentifierLinkBasis = (
  primary: StarSimSourceRecord,
  candidate: StarSimSourceRecord,
  explicit: StarSimSourceIdentifiers,
  trusted: StarSimSourceIdentifiers,
): string[] => {
  const bases = new Set<string>();
  const keys: Array<keyof StarSimSourceIdentifiers> = [
    "gaia_dr3_source_id",
    "sdss_apogee_id",
    "lamost_obsid",
    "tess_tic_id",
    "tasoc_target_id",
    "mast_obs_id",
  ];
  for (const key of keys) {
    const candidateValue = candidate.identifiers[key];
    if (!candidateValue) continue;
    const explicitValue = explicit[key];
    if (explicitValue && normalize(candidateValue) === normalize(explicitValue)) {
      bases.add("explicit_request_identifier");
    }
    const trustedValue = trusted[key];
    if (trustedValue && normalize(candidateValue) === normalize(trustedValue)) {
      bases.add("trusted_identifier");
    }
  }

  if (
    candidate.identifiers.gaia_dr3_source_id
    && primary.identifiers.gaia_dr3_source_id
    && normalize(candidate.identifiers.gaia_dr3_source_id) === normalize(primary.identifiers.gaia_dr3_source_id)
  ) {
    bases.add("trusted_gaia_link");
  }
  return [...bases];
};

export const evaluateCrossmatch = (args: {
  primary: StarSimSourceRecord | null;
  candidate: StarSimSourceRecord | null;
  explicitIdentifiers: StarSimSourceIdentifiers;
  trustedIdentifiers: StarSimSourceIdentifiers;
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

  if (identifiersConflict(args.candidate, args.trustedIdentifiers)) {
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_identifier_conflict",
      reason: "identifier_conflict",
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

  const primaryName = normalize(args.primary.target?.name);
  const candidateName = normalize(args.candidate.target?.name);
  const identityBasis = getStrongIdentifierLinkBasis(
    args.primary,
    args.candidate,
    args.explicitIdentifiers,
    args.trustedIdentifiers,
  );
  const strongIdentifierLink = identityBasis.length > 0;
  if (primaryName && candidateName && primaryName !== candidateName) {
    if (strongIdentifierLink) {
      return {
        from_catalog: args.primary.catalog,
        to_catalog: args.candidate.catalog,
        status: "accepted_with_warning",
        reason: "name_mismatch_identifier_linked",
        identity_basis: identityBasis,
        quality_flags: [...args.candidate.quality_flags],
        warnings: ["name_mismatch_identifier_linked"],
      };
    }
    return {
      from_catalog: args.primary.catalog,
      to_catalog: args.candidate.catalog,
      status: "rejected_name_mismatch",
      reason: "name_mismatch",
      quality_flags: [...args.candidate.quality_flags],
    };
  }

  return {
    from_catalog: args.primary.catalog,
    to_catalog: args.candidate.catalog,
    status: "accepted",
    reason: "crossmatch_ok",
    identity_basis: identityBasis,
    quality_flags: [...args.candidate.quality_flags],
  };
};
