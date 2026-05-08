import crypto from "node:crypto";
import {
  HELIX_LIVE_SITUATION_ARTIFACT_DELTA_SCHEMA,
  HELIX_LIVE_SITUATION_ARTIFACT_SCHEMA,
  HELIX_LIVE_SITUATION_EVALUATION_SCHEMA,
  HELIX_LIVE_SITUATION_SUBGOAL_SCHEMA,
  type LiveSituationArtifact,
  type LiveSituationArtifactDelta,
  type LiveSituationArtifactMode,
  type LiveSituationArtifactStatus,
  type LiveSituationEvaluation,
  type LiveSituationSubgoal,
  type LiveSituationSubgoalStatus,
} from "@shared/helix-live-situation-artifact";

const artifacts = new Map<string, LiveSituationArtifact>();
const deltasByArtifact = new Map<string, LiveSituationArtifactDelta[]>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

export const hashLiveSituationArtifact = (artifact: LiveSituationArtifact): string =>
  hashShort({
    schema: artifact.schema,
    artifact_id: artifact.artifact_id,
    thread_id: artifact.thread_id,
    room_id: artifact.room_id,
    world_id: artifact.world_id ?? null,
    source_ids: artifact.source_ids,
    status: artifact.status,
    mode: artifact.mode,
    objective: artifact.objective,
    current_state_lines: artifact.current_state_lines,
    subgoals: artifact.subgoals,
    latest_evaluation: artifact.latest_evaluation ?? null,
    evidence_refs: artifact.evidence_refs,
    updated_at: artifact.updated_at,
  }, 24);

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map(normalizeString).filter((value): value is string => Boolean(value)))).sort();

const clampConfidence = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5));

const normalizeMode = (value?: string | null): LiveSituationArtifactMode => {
  if (value === "voice_on_confirm" || value === "critical_voice" || value === "direct_address_only") return value;
  return "text_only";
};

const buildArtifactId = (input: {
  thread_id: string;
  room_id: string;
  session_id?: string | null;
  world_id?: string | null;
}): string =>
  `live_situation:${hashShort([input.thread_id, input.room_id, input.session_id ?? null, input.world_id ?? null], 18)}`;

const makeSubgoal = (input: {
  artifactId: string;
  label: string;
  status: LiveSituationSubgoalStatus;
  confidence?: number;
  evidenceRefs?: string[];
  now: string;
}): LiveSituationSubgoal => ({
  schema: HELIX_LIVE_SITUATION_SUBGOAL_SCHEMA,
  subgoal_id: `live_subgoal:${hashShort([input.artifactId, input.label], 14)}`,
  label: input.label,
  status: input.status,
  confidence: clampConfidence(input.confidence ?? 0.6),
  evidence_refs: uniqueStrings(input.evidenceRefs ?? []),
  updated_at: input.now,
});

export function createLiveSituationArtifact(input: {
  thread_id: string;
  created_turn_id: string;
  session_id?: string | null;
  room_id: string;
  world_id?: string | null;
  source_ids?: string[];
  graph_id?: string | null;
  mode?: string | null;
  objective?: string | null;
  current_goal?: string | null;
  now?: string;
}): LiveSituationArtifact {
  const now = input.now ?? new Date().toISOString();
  const threadId = normalizeString(input.thread_id);
  const turnId = normalizeString(input.created_turn_id);
  const roomId = normalizeString(input.room_id);
  if (!threadId || !turnId || !roomId) {
    throw new Error("LiveSituationArtifact requires thread_id, created_turn_id, and room_id.");
  }
  const sourceIds = uniqueStrings(input.source_ids ?? []);
  const artifactId = buildArtifactId({
    thread_id: threadId,
    room_id: roomId,
    session_id: input.session_id ?? null,
    world_id: input.world_id ?? null,
  });
  const existing = artifacts.get(artifactId);
  const objective =
    normalizeString(input.objective) ??
    existing?.objective ??
    "Watch for danger and meaningful progress.";
  const artifact: LiveSituationArtifact = {
    schema: HELIX_LIVE_SITUATION_ARTIFACT_SCHEMA,
    artifact_id: artifactId,
    thread_id: threadId,
    created_turn_id: turnId,
    session_id: normalizeString(input.session_id),
    room_id: roomId,
    world_id: normalizeString(input.world_id),
    source_ids: sourceIds,
    graph_id: normalizeString(input.graph_id),
    status: "active",
    mode: normalizeMode(input.mode),
    objective,
    current_state_lines: existing?.current_state_lines ?? {
      now: "Minecraft situation monitoring is active.",
      goal: normalizeString(input.current_goal) ?? objective,
      risk: "No current risk above policy threshold.",
      progress: "Waiting for meaningful progress events.",
      unknowns: "World events are compacted; raw logs are not in Ask context.",
      last_decision: "Silent keep-in-context until danger or progress matters.",
    },
    subgoals: existing?.subgoals?.length
      ? existing.subgoals
      : [
          makeSubgoal({
            artifactId,
            label: "Detect danger signals",
            status: "active",
            confidence: 0.72,
            evidenceRefs: [`live_situation:${artifactId}:setup`],
            now,
          }),
          makeSubgoal({
            artifactId,
            label: "Track meaningful progress",
            status: "active",
            confidence: 0.68,
            evidenceRefs: [`live_situation:${artifactId}:setup`],
            now,
          }),
        ],
    latest_evaluation: existing?.latest_evaluation ?? null,
    evidence_refs: uniqueStrings([
      ...(existing?.evidence_refs ?? []),
      `live_situation:${artifactId}:setup`,
      ...(sourceIds.length ? sourceIds.map((sourceId) => `source:${sourceId}`) : []),
    ]),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    context_policy: "compact_context_pack_only",
    raw_transcript_included: false,
    raw_audio_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
  artifacts.set(artifactId, artifact);
  return artifact;
}

export function getLiveSituationArtifact(artifactId: string): LiveSituationArtifact | null {
  return artifacts.get(artifactId) ?? null;
}

export function getActiveLiveSituationArtifactForThread(threadId: string): LiveSituationArtifact | null {
  return Array.from(artifacts.values())
    .filter((artifact) => artifact.thread_id === threadId && artifact.status === "active")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .at(0) ?? null;
}

export function getActiveLiveSituationArtifactForRoom(roomId: string): LiveSituationArtifact | null {
  return Array.from(artifacts.values())
    .filter((artifact) => artifact.room_id === roomId && artifact.status === "active")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .at(0) ?? null;
}

export function updateLiveSituationArtifact(input: {
  artifact_id: string;
  turn_id: string;
  reason: LiveSituationArtifactDelta["reason"];
  current_state_lines?: Partial<LiveSituationArtifact["current_state_lines"]>;
  subgoals?: LiveSituationSubgoal[];
  latest_evaluation?: LiveSituationEvaluation | null;
  evidence_refs?: string[];
  now?: string;
}): { artifact: LiveSituationArtifact; delta: LiveSituationArtifactDelta } | null {
  const existing = artifacts.get(input.artifact_id);
  if (!existing) return null;
  const now = input.now ?? new Date().toISOString();
  const previousHash = hashLiveSituationArtifact(existing);
  const next: LiveSituationArtifact = {
    ...existing,
    current_state_lines: {
      ...existing.current_state_lines,
      ...(input.current_state_lines ?? {}),
    },
    subgoals: input.subgoals ?? existing.subgoals,
    latest_evaluation: input.latest_evaluation ?? existing.latest_evaluation ?? null,
    evidence_refs: uniqueStrings([...(existing.evidence_refs ?? []), ...(input.evidence_refs ?? [])]).slice(-48),
    updated_at: now,
  };
  const changedFields: string[] = [];
  if (stableJson(existing.current_state_lines) !== stableJson(next.current_state_lines)) changedFields.push("current_state_lines");
  if (stableJson(existing.subgoals) !== stableJson(next.subgoals)) changedFields.push("subgoals");
  if (stableJson(existing.latest_evaluation ?? null) !== stableJson(next.latest_evaluation ?? null)) changedFields.push("latest_evaluation");
  if (stableJson(existing.evidence_refs) !== stableJson(next.evidence_refs)) changedFields.push("evidence_refs");
  if (changedFields.length === 0) changedFields.push("updated_at");
  artifacts.set(next.artifact_id, next);
  const delta: LiveSituationArtifactDelta = {
    schema: HELIX_LIVE_SITUATION_ARTIFACT_DELTA_SCHEMA,
    delta_id: `live_delta:${hashShort([next.artifact_id, input.turn_id, input.reason, now], 18)}`,
    artifact_id: next.artifact_id,
    thread_id: next.thread_id,
    turn_id: input.turn_id,
    reason: input.reason,
    previous_hash: previousHash,
    next_hash: hashLiveSituationArtifact(next),
    changed_fields: changedFields,
    artifact_snapshot: next,
    evidence_refs: uniqueStrings(input.evidence_refs ?? next.evidence_refs).slice(-24),
    ts: now,
  };
  deltasByArtifact.set(next.artifact_id, [...(deltasByArtifact.get(next.artifact_id) ?? []), delta].slice(-80));
  return { artifact: next, delta };
}

const updateStatus = (artifactId: string, status: LiveSituationArtifactStatus): LiveSituationArtifact | null => {
  const artifact = artifacts.get(artifactId);
  if (!artifact) return null;
  const updated = { ...artifact, status, updated_at: new Date().toISOString() };
  artifacts.set(artifactId, updated);
  return updated;
};

export const pauseLiveSituationArtifact = (artifactId: string): LiveSituationArtifact | null => updateStatus(artifactId, "paused");
export const resumeLiveSituationArtifact = (artifactId: string): LiveSituationArtifact | null => updateStatus(artifactId, "active");
export const archiveLiveSituationArtifact = (artifactId: string): LiveSituationArtifact | null => updateStatus(artifactId, "completed");

export function buildLiveSituationEvaluation(input: {
  artifact: LiveSituationArtifact;
  trigger: LiveSituationEvaluation["trigger"];
  summary: string;
  recommendation?: string | null;
  interjection_decision?: LiveSituationEvaluation["interjection_decision"];
  model_invoked?: boolean;
  deterministic_gate?: boolean;
  evidence_refs?: string[];
  now?: string;
}): LiveSituationEvaluation {
  const now = input.now ?? new Date().toISOString();
  return {
    schema: HELIX_LIVE_SITUATION_EVALUATION_SCHEMA,
    evaluation_id: `live_eval:${hashShort([input.artifact.artifact_id, input.trigger, input.summary, now], 18)}`,
    artifact_id: input.artifact.artifact_id,
    thread_id: input.artifact.thread_id,
    trigger: input.trigger,
    summary: input.summary,
    recommendation: input.recommendation ?? null,
    interjection_decision: input.interjection_decision ?? "silent_keep_in_context",
    model_invoked: input.model_invoked === true,
    deterministic_gate: input.deterministic_gate !== false,
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
    created_at: now,
  };
}

export function upsertLiveSituationSubgoal(input: {
  artifact: LiveSituationArtifact;
  label: string;
  status: LiveSituationSubgoalStatus;
  confidence?: number;
  evidence_refs?: string[];
  now?: string;
}): LiveSituationSubgoal[] {
  const now = input.now ?? new Date().toISOString();
  const next = makeSubgoal({
    artifactId: input.artifact.artifact_id,
    label: input.label,
    status: input.status,
    confidence: input.confidence,
    evidenceRefs: input.evidence_refs,
    now,
  });
  return [
    next,
    ...input.artifact.subgoals.filter((subgoal) => subgoal.subgoal_id !== next.subgoal_id),
  ].slice(0, 8);
}

export function listLiveSituationArtifactDeltas(artifactId: string): LiveSituationArtifactDelta[] {
  return deltasByArtifact.get(artifactId) ?? [];
}

export function resetLiveSituationArtifacts(): void {
  artifacts.clear();
  deltasByArtifact.clear();
}
