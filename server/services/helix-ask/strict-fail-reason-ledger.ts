import crypto from "node:crypto";

export type HelixAskStrictFailReasonCategory =
  | "bridge_contract"
  | "evidence_contract"
  | "runtime_contract"
  | "unknown";

export type HelixAskStrictFailReasonLedgerEntry = {
  ordinal: number;
  stage: "response" | "proof" | "arbiter" | "runtime";
  fail_reason: string;
  category: HelixAskStrictFailReasonCategory;
};

export type HelixAskStrictFailReasonHistogramEntry = {
  fail_reason: string;
  category: HelixAskStrictFailReasonCategory;
  count: number;
};

export type HelixAskStrictFailReasonLedgerOutput = {
  entries: HelixAskStrictFailReasonLedgerEntry[];
  histogram: HelixAskStrictFailReasonHistogramEntry[];
  histogram_artifact: {
    kind: "helix_ask.strict_fail_reason_histogram.v1";
    ref: string;
    sha256: string;
    integrity: "OK";
  };
};

const BRIDGE_CONTRACT_REASONS = new Set([
  "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING",
  "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY",
]);

const EVIDENCE_CONTRACT_REASONS = new Set([
  "CERTAINTY_EVIDENCE_MISSING",
  "CONCEPTS_PROVENANCE_MISSING",
  "EVIDENCE_CONTRACT_FIELD_MISSING",
  "PACKAGES_EVIDENCE_PROVENANCE_MISSING",
  "SCIENTIFIC_METHOD_MISSING_SLOT",
]);

const RUNTIME_CONTRACT_REASONS = new Set([
  "TIMEOUT",
  "SCHEMA_ERROR",
  "VALIDATION_FAIL",
  "LOW_EVIDENCE_UTILIZATION",
  "GENERIC_COLLAPSE",
  "TELEMETRY_LEAK_IN_ANSWER",
]);

const categorizeFailReason = (failReason: string): HelixAskStrictFailReasonCategory => {
  if (BRIDGE_CONTRACT_REASONS.has(failReason)) return "bridge_contract";
  if (EVIDENCE_CONTRACT_REASONS.has(failReason)) return "evidence_contract";
  if (RUNTIME_CONTRACT_REASONS.has(failReason)) return "runtime_contract";
  return "unknown";
};

const normalizeFailReason = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toHistogram = (
  entries: HelixAskStrictFailReasonLedgerEntry[],
): HelixAskStrictFailReasonHistogramEntry[] => {
  const counts = new Map<string, HelixAskStrictFailReasonHistogramEntry>();
  for (const entry of entries) {
    const key = `${entry.category}::${entry.fail_reason}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        fail_reason: entry.fail_reason,
        category: entry.category,
        count: 1,
      });
    }
  }
  return Array.from(counts.values()).sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    return a.fail_reason.localeCompare(b.fail_reason);
  });
};

export function buildHelixAskStrictFailReasonLedger(input: {
  strictEnabled: boolean;
  payload: unknown;
}): HelixAskStrictFailReasonLedgerOutput | null {
  if (!input.strictEnabled) return null;
  const payload = input.payload && typeof input.payload === "object" ? (input.payload as Record<string, unknown>) : {};
  const debug = payload.debug && typeof payload.debug === "object" ? (payload.debug as Record<string, unknown>) : {};
  const candidates: Array<{ stage: HelixAskStrictFailReasonLedgerEntry["stage"]; reason: string | null }> = [
    { stage: "response", reason: normalizeFailReason(payload.fail_reason) },
    {
      stage: "proof",
      reason: normalizeFailReason(
        payload.proof && typeof payload.proof === "object"
          ? (payload.proof as { firstFail?: { id?: string | null } | null }).firstFail?.id
          : null,
      ),
    },
    { stage: "arbiter", reason: normalizeFailReason(debug.arbiter_fail_reason) },
    { stage: "runtime", reason: normalizeFailReason(debug.helix_ask_fail_reason) },
  ];
  const deduped = new Set<string>();
  const entries: HelixAskStrictFailReasonLedgerEntry[] = [];
  for (const candidate of candidates) {
    if (!candidate.reason) continue;
    const dedupeKey = `${candidate.stage}:${candidate.reason}`;
    if (deduped.has(dedupeKey)) continue;
    deduped.add(dedupeKey);
    entries.push({
      ordinal: entries.length + 1,
      stage: candidate.stage,
      fail_reason: candidate.reason,
      category: categorizeFailReason(candidate.reason),
    });
  }
  const histogram = toHistogram(entries);
  const histogramJson = JSON.stringify(histogram);
  const sha256 = crypto.createHash("sha256").update(histogramJson).digest("hex");
  return {
    entries,
    histogram,
    histogram_artifact: {
      kind: "helix_ask.strict_fail_reason_histogram.v1",
      ref: `artifact:helix-ask/strict-fail-reason-histogram:${sha256.slice(0, 16)}`,
      sha256,
      integrity: "OK",
    },
  };
}
