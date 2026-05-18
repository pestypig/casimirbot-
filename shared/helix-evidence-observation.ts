export type HelixEvidenceSourceKind =
  | "repo_code"
  | "repo_doc"
  | "artifact"
  | "telemetry"
  | "live_screen"
  | "live_audio"
  | "live_voice_speaker"
  | "live_translation"
  | "world_event"
  | "minecraft_event"
  | "discord_call"
  | "browser"
  | "operator_text"
  | "situation_goal_session";

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

export type HelixEvidenceObservationLane =
  | "repo_search"
  | "git_tracked"
  | "stage0"
  | "atlas"
  | "manual_contract"
  | "live_source"
  | "voice_lane"
  | "translation_procedure";

export type HelixEvidenceObservationSourceStage =
  | "preflight"
  | "fallback_repo_search"
  | "stage0_code_floor"
  | "objective_recovery";

export type HelixEvidenceObservation = {
  id: string;
  lane: HelixEvidenceObservationLane;
  source_kind: HelixEvidenceSourceKind;
  source_id: string;
  observed_at: string;
  freshness_ms?: number;
  provenance: HelixEvidenceObservationProvenance;
  confidence: number;
  refs: string[];
  content_role: HelixEvidenceObservationContentRole;
  consent_state?: HelixEvidenceObservationConsentState;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  term?: string;
  query?: string;
  score?: number;
  sourceStage?: HelixEvidenceObservationSourceStage;
};

export type HelixEvidenceObservationInput = Omit<
  HelixEvidenceObservation,
  "id" | "lane" | "observed_at" | "confidence" | "refs" | "source_id"
> & {
  id?: string | null;
  lane?: HelixEvidenceObservationLane | null;
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

const normalizeLineNumber = (value: number | null | undefined): number | undefined => {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(1, Math.trunc(Number(value)));
};

const stableObservationHash = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const buildHelixEvidenceObservationId = (input: {
  lane?: HelixEvidenceObservationLane | null;
  filePath?: string | null;
  lineStart?: number | null;
  lineEnd?: number | null;
  term?: string | null;
  snippet?: string | null;
  source_id?: string | null;
}): string => {
  const filePath = normalizeRef(input.filePath ?? input.source_id);
  const lineStart = normalizeLineNumber(input.lineStart) ?? 1;
  const lineEnd = normalizeLineNumber(input.lineEnd) ?? lineStart;
  const key = [
    input.lane ?? "repo_search",
    filePath,
    lineStart,
    lineEnd,
    normalizeRef(input.term),
    normalizeRef(input.snippet),
  ].join(":");
  return `obs_${stableObservationHash(key)}`;
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
  const filePath = normalizeRef(input.filePath);
  const lineStart = normalizeLineNumber(input.lineStart);
  const lineEnd = normalizeLineNumber(input.lineEnd) ?? lineStart;
  const sourceId = normalizeRef(input.source_id) || refs[0] || filePath || input.source_kind;
  const lane = input.lane ?? "repo_search";
  const snippet = normalizeRef(input.snippet);
  const term = normalizeRef(input.term);
  const query = normalizeRef(input.query);
  const id =
    normalizeRef(input.id) ||
    buildHelixEvidenceObservationId({
      lane,
      filePath,
      lineStart,
      lineEnd,
      term,
      snippet,
      source_id: sourceId,
    });
  return {
    id,
    lane,
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
    ...(filePath ? { filePath } : {}),
    ...(lineStart ? { lineStart } : {}),
    ...(lineEnd ? { lineEnd } : {}),
    ...(snippet ? { snippet } : {}),
    ...(term ? { term } : {}),
    ...(query ? { query } : {}),
    ...(Number.isFinite(input.score) ? { score: Number(input.score) } : {}),
    ...(input.sourceStage ? { sourceStage: input.sourceStage } : {}),
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

export const mergeHelixEvidenceObservations = (
  ...groups: Array<Array<HelixEvidenceObservation | null | undefined> | null | undefined>
): HelixEvidenceObservation[] => {
  const seen = new Set<string>();
  const out: HelixEvidenceObservation[] = [];
  for (const group of groups) {
    for (const observation of group ?? []) {
      if (!observation) continue;
      const key =
        normalizeRef(observation.id) ||
        buildHelixEvidenceObservationId({
          lane: observation.lane,
          filePath: observation.filePath,
          lineStart: observation.lineStart,
          lineEnd: observation.lineEnd,
          term: observation.term,
          snippet: observation.snippet,
          source_id: observation.source_id,
        });
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(observation.id ? observation : { ...observation, id: key });
    }
  }
  return out;
};
