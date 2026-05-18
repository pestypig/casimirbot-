export type HelixEvidenceSourceKind =
  | "repo_code"
  | "repo_doc"
  | "artifact"
  | "telemetry"
  | "live_screen"
  | "live_audio"
  | "browser"
  | "operator_text";

export type HelixEvidenceObservationProvenance =
  | "measured"
  | "retrieved"
  | "declared"
  | "inferred";

export type HelixEvidenceObservationContentRole =
  | "evidence_not_assistant_answer"
  | "observation_not_assistant_answer";

export type HelixEvidenceObservationConsentState =
  | "not_required"
  | "requested"
  | "granted"
  | "revoked";

export type HelixEvidenceObservation = {
  source_kind: HelixEvidenceSourceKind;
  source_id: string;
  observed_at: string;
  freshness_ms?: number;
  provenance: HelixEvidenceObservationProvenance;
  confidence: number;
  refs: string[];
  content_role: HelixEvidenceObservationContentRole;
  consent_state?: HelixEvidenceObservationConsentState;
};

export type HelixEvidenceObservationInput = Omit<
  HelixEvidenceObservation,
  "observed_at" | "confidence" | "refs" | "source_id"
> & {
  source_id?: string | null;
  observed_at?: string | Date | null;
  confidence?: number | null;
  refs?: Array<string | null | undefined> | null;
};

const normalizeRef = (value: string | null | undefined): string => {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\\/g, "/")
    .trim();
};

const uniqueRefs = (refs: Array<string | null | undefined> | null | undefined): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ref of refs ?? []) {
    const normalized = normalizeRef(ref);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const normalizeObservedAt = (value: string | Date | null | undefined): string => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  const parsed = Date.parse(String(value ?? ""));
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
};

const clampConfidence = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, Number(value)));
};

export const inferHelixEvidenceSourceKindFromRef = (ref: string): HelixEvidenceSourceKind => {
  const normalized = normalizeRef(ref).toLowerCase();
  if (/^(?:server|client|shared|modules|scripts|tools)\//.test(normalized)) {
    return "repo_code";
  }
  if (/^docs\//.test(normalized)) {
    return "repo_doc";
  }
  if (/^(?:artifacts|reports|uploads|exports)\//.test(normalized)) {
    return "artifact";
  }
  return "artifact";
};

export const buildHelixEvidenceObservation = (
  input: HelixEvidenceObservationInput,
): HelixEvidenceObservation => {
  const refs = uniqueRefs(input.refs);
  const sourceId = normalizeRef(input.source_id) || refs[0] || input.source_kind;
  return {
    source_kind: input.source_kind,
    source_id: sourceId,
    observed_at: normalizeObservedAt(input.observed_at),
    ...(Number.isFinite(input.freshness_ms)
      ? { freshness_ms: Math.max(0, Number(input.freshness_ms)) }
      : {}),
    provenance: input.provenance,
    confidence: clampConfidence(input.confidence),
    refs,
    content_role: input.content_role,
    ...(input.consent_state ? { consent_state: input.consent_state } : {}),
  };
};

export const assertHelixEvidenceObservationRole = (
  observation: Pick<HelixEvidenceObservation, "content_role">,
): void => {
  if (
    observation.content_role !== "evidence_not_assistant_answer" &&
    observation.content_role !== "observation_not_assistant_answer"
  ) {
    throw new Error("helix_evidence_observation_invalid_content_role");
  }
};
