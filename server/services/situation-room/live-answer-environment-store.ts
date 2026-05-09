import crypto from "node:crypto";
import {
  HELIX_LIVE_ANSWER_ENVIRONMENT_DELTA_SCHEMA,
  HELIX_LIVE_ANSWER_ENVIRONMENT_RECEIPT_SCHEMA,
  HELIX_LIVE_ANSWER_ENVIRONMENT_SCHEMA,
  LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS,
  type LiveAnswerEnvironment,
  type LiveAnswerEnvironmentDelta,
  type LiveAnswerEnvironmentMode,
  type LiveAnswerEnvironmentPreset,
  type LiveAnswerEnvironmentReceipt,
  type LiveAnswerLineDefinition,
  type LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";

const environments = new Map<string, LiveAnswerEnvironment>();
const deltasByEnvironment = new Map<string, LiveAnswerEnvironmentDelta[]>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => normalizeString(value)).filter((value: string | null): value is string => Boolean(value))));

const normalizeMode = (value?: string | null): LiveAnswerEnvironmentMode => {
  if (value === "voice_on_confirm" || value === "critical_voice" || value === "direct_address_only") return value;
  return "text_only";
};

const normalizePreset = (value?: string | null): LiveAnswerEnvironmentPreset => {
  if (
    value === "discord_interpreter" ||
    value === "calculator_prime_stream" ||
    value === "physics_stability_tracker" ||
    value === "browser_video_argument_tracker" ||
    value === "browser_video_tracker" ||
    value === "research_session" ||
    value === "custom"
  ) {
    return value;
  }
  return "minecraft_run_monitor";
};

export const normalizeLiveAnswerLineKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ -]+/g, "")
    .replace(/[\s-]+/g, "_")
    .slice(0, 48);

const normalizeLineDefinition = (line: LiveAnswerLineDefinition): LiveAnswerLineDefinition | null => {
  const key = normalizeLiveAnswerLineKey(String(line.key ?? ""));
  const label = normalizeString(line.label) ?? key.replace(/_/g, " ");
  if (!key || !label) return null;
  const updatePolicy =
    line.update_policy === "projection_only" ||
    line.update_policy === "salience_only" ||
    line.update_policy === "computation_tick" ||
    line.update_policy === "stability_window" ||
    line.update_policy === "anomaly_only" ||
    line.update_policy === "model_reviewed"
      ? line.update_policy
      : "episode_based";
  const visibility =
    line.visibility === "situation_panel" || line.visibility === "debug_only"
      ? line.visibility
      : "answer_card";
  const priority =
    line.priority === "warn" || line.priority === "critical" || line.priority === "action"
      ? line.priority
      : "info";
  return {
    key,
    label,
    description: normalizeString(line.description ?? null) ?? undefined,
    update_policy: updatePolicy,
    visibility,
    priority,
  };
};

export function resolveLiveAnswerLineSchema(input: {
  preset?: string | null;
  line_schema?: LiveAnswerLineDefinition[] | null;
}): LiveAnswerLineDefinition[] {
  const custom = Array.isArray(input.line_schema)
    ? input.line_schema.map((line: LiveAnswerLineDefinition) => normalizeLineDefinition(line)).filter((line: LiveAnswerLineDefinition | null): line is LiveAnswerLineDefinition => Boolean(line))
    : [];
  if (custom.length > 0) return custom.slice(0, 16);
  const preset = normalizePreset(input.preset);
  return LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS[preset === "custom" ? "minecraft_run_monitor" : preset].map((line: LiveAnswerLineDefinition) => ({ ...line }));
}

const initialValueForLine = (line: LiveAnswerLineDefinition, objective: string): string => {
  if (line.key === "now") return "Live answer environment is active.";
  if (line.key === "goal" || line.key === "hypothesis") return objective;
  if (line.key === "risk") return "No current risk above policy threshold.";
  if (line.key === "progress") return "Waiting for meaningful progress events.";
  if (line.key === "unknowns" || line.key === "open_question") return "Source updates are compacted; raw logs are not in Ask context.";
  if (line.key === "last_decision") return "Silent keep-in-context until the line policy surfaces an update.";
  if (line.key === "next_check") return "Watch for source events that affect the requested categories.";
  if (line.key === "current_candidate") return "Waiting for the first candidate.";
  if (line.key === "latest_prime") return "No prime emitted yet.";
  if (line.key === "prime_count") return "0";
  if (line.key === "gap") return "Waiting for a prime gap.";
  if (line.key === "last_test") return "No primality test yet.";
  if (line.key === "stability_rate") return "Waiting for stream ticks.";
  return "Waiting for source evidence.";
};

const makeLineState = (line: LiveAnswerLineDefinition, objective: string, now: string, evidenceRefs: string[]): LiveAnswerLineState => ({
  ...line,
  value: initialValueForLine(line, objective),
  confidence: null,
  evidence_refs: evidenceRefs,
  updated_at: now,
  source: "deterministic_reducer",
  model_invoked: false,
  deterministic: true,
  source_event_ids: [],
});

const buildEnvironmentId = (input: {
  thread_id: string;
  created_turn_id: string;
  objective: string;
  room_id?: string | null;
}): string =>
  `live_answer:${hashShort([input.thread_id, input.created_turn_id, input.room_id ?? null, input.objective], 18)}`;

export const hashLiveAnswerEnvironment = (environment: LiveAnswerEnvironment): string =>
  hashShort({
    environment_id: environment.environment_id,
    thread_id: environment.thread_id,
    objective: environment.objective,
    status: environment.status,
    mode: environment.mode,
    preset: environment.preset ?? null,
    line_schema: environment.line_schema,
    lines: environment.lines,
    subgoals: environment.subgoals,
    latest_summary: environment.latest_summary,
    evidence_refs: environment.evidence_refs,
    updated_at: environment.updated_at,
  }, 24);

export function createLiveAnswerEnvironment(input: {
  thread_id: string;
  created_turn_id: string;
  objective: string;
  room_id?: string | null;
  source_ids?: string[];
  graph_id?: string | null;
  preset?: string | null;
  line_schema?: LiveAnswerLineDefinition[] | null;
  mode?: string | null;
  now?: string;
}): { environment: LiveAnswerEnvironment; receipt: LiveAnswerEnvironmentReceipt } {
  const now = input.now ?? new Date().toISOString();
  const threadId = normalizeString(input.thread_id);
  const turnId = normalizeString(input.created_turn_id);
  const objective = normalizeString(input.objective);
  if (!threadId || !turnId || !objective) {
    throw new Error("LiveAnswerEnvironment requires thread_id, created_turn_id, and objective.");
  }
  const roomId = normalizeString(input.room_id);
  const sourceIds = uniqueStrings(input.source_ids ?? []);
  const environmentId = buildEnvironmentId({
    thread_id: threadId,
    created_turn_id: turnId,
    objective,
    room_id: roomId,
  });
  const existing = environments.get(environmentId);
  const lineSchema = resolveLiveAnswerLineSchema({
    preset: input.preset,
    line_schema: input.line_schema ?? null,
  });
  const setupEvidence = uniqueStrings([
    `live_answer_environment:${environmentId}:setup`,
    ...sourceIds.map((sourceId: string) => `source:${sourceId}`),
  ]);
  const environment: LiveAnswerEnvironment = {
    schema: HELIX_LIVE_ANSWER_ENVIRONMENT_SCHEMA,
    environment_id: environmentId,
    thread_id: threadId,
    created_turn_id: turnId,
    objective,
    preset: normalizePreset(input.preset),
    room_id: roomId,
    source_ids: sourceIds,
    graph_id: normalizeString(input.graph_id),
    status: "active",
    mode: normalizeMode(input.mode),
    line_schema: lineSchema,
    lines: existing?.lines?.length
      ? existing.lines
      : lineSchema.map((line: LiveAnswerLineDefinition) => makeLineState(line, objective, now, setupEvidence)),
    subgoals: existing?.subgoals ?? [],
    latest_summary: existing?.latest_summary ?? "Live answer environment is active.",
    evidence_refs: uniqueStrings([...(existing?.evidence_refs ?? []), ...setupEvidence]),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    context_policy: "compact_context_pack_only",
    raw_transcript_included: false,
    raw_audio_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
  environments.set(environmentId, environment);
  const receipt: LiveAnswerEnvironmentReceipt = {
    schema: HELIX_LIVE_ANSWER_ENVIRONMENT_RECEIPT_SCHEMA,
    ok: true,
    environment_id: environmentId,
    thread_id: threadId,
    created_turn_id: turnId,
    objective,
    room_id: roomId,
    source_ids: sourceIds,
    graph_id: environment.graph_id ?? null,
    line_keys: lineSchema.map((line: LiveAnswerLineDefinition) => line.key),
    attachment_policy: "manual_only",
    context_injection: "explicit_attachment_only",
    command_lane_enabled: false,
    error: null,
  };
  return { environment, receipt };
}

export function getLiveAnswerEnvironment(environmentId: string): LiveAnswerEnvironment | null {
  return environments.get(environmentId) ?? null;
}

export function getActiveLiveAnswerEnvironmentForThread(threadId: string): LiveAnswerEnvironment | null {
  return Array.from(environments.values())
    .filter((environment: LiveAnswerEnvironment) => environment.thread_id === threadId && environment.status === "active")
    .sort((a: LiveAnswerEnvironment, b: LiveAnswerEnvironment) => b.updated_at.localeCompare(a.updated_at))
    .at(0) ?? null;
}

export function getActiveLiveAnswerEnvironmentForRoom(roomId: string): LiveAnswerEnvironment | null {
  return Array.from(environments.values())
    .filter((environment: LiveAnswerEnvironment) => environment.room_id === roomId && environment.status === "active")
    .sort((a: LiveAnswerEnvironment, b: LiveAnswerEnvironment) => b.updated_at.localeCompare(a.updated_at))
    .at(0) ?? null;
}

export function getActiveLiveAnswerEnvironmentForSource(sourceId: string): LiveAnswerEnvironment | null {
  return Array.from(environments.values())
    .filter((environment: LiveAnswerEnvironment) => environment.source_ids.includes(sourceId) && environment.status === "active")
    .sort((a: LiveAnswerEnvironment, b: LiveAnswerEnvironment) => b.updated_at.localeCompare(a.updated_at))
    .at(0) ?? null;
}

export function listLiveAnswerEnvironments(): LiveAnswerEnvironment[] {
  return Array.from(environments.values()).sort((a: LiveAnswerEnvironment, b: LiveAnswerEnvironment) => b.updated_at.localeCompare(a.updated_at));
}

export function updateLiveAnswerEnvironment(input: {
  environment_id: string;
  reason: LiveAnswerEnvironmentDelta["reason"];
  line_values: Record<string, {
    value: string;
    confidence?: number | null;
    evidence_refs?: string[];
    source_event_ids?: string[];
    source?: LiveAnswerLineState["source"];
    model_invoked?: boolean;
    deterministic?: boolean;
  }>;
  latest_summary?: string | null;
  evidence_refs?: string[];
  now?: string;
}): { environment: LiveAnswerEnvironment; delta: LiveAnswerEnvironmentDelta } | null {
  const existing = environments.get(input.environment_id);
  if (!existing) return null;
  const now = input.now ?? new Date().toISOString();
  const previousHash = hashLiveAnswerEnvironment(existing);
  const changedLineKeys: string[] = [];
  const nextLines = existing.lines.map((line: LiveAnswerLineState) => {
    const update = input.line_values[line.key];
    if (!update || !normalizeString(update.value)) return line;
    const next: LiveAnswerLineState = {
      ...line,
      value: normalizeString(update.value) ?? line.value,
      confidence: typeof update.confidence === "number" && Number.isFinite(update.confidence) ? update.confidence : line.confidence ?? null,
      evidence_refs: uniqueStrings([...(line.evidence_refs ?? []), ...(update.evidence_refs ?? input.evidence_refs ?? [])]).slice(-16),
      source_event_ids: uniqueStrings([...(line.source_event_ids ?? []), ...(update.source_event_ids ?? [])]).slice(-24),
      updated_at: now,
      source: update.source ?? "deterministic_reducer",
      model_invoked: update.model_invoked === true,
      deterministic: update.deterministic ?? update.model_invoked !== true,
    };
    if (stableJson(next) !== stableJson(line)) changedLineKeys.push(line.key);
    return next;
  });
  if (changedLineKeys.length === 0) return null;
  const next: LiveAnswerEnvironment = {
    ...existing,
    lines: nextLines,
    latest_summary: normalizeString(input.latest_summary) ?? nextLines.find((line: LiveAnswerLineState) => line.key === changedLineKeys[0])?.value ?? existing.latest_summary,
    evidence_refs: uniqueStrings([...(existing.evidence_refs ?? []), ...(input.evidence_refs ?? [])]).slice(-48),
    updated_at: now,
  };
  environments.set(next.environment_id, next);
  const delta: LiveAnswerEnvironmentDelta = {
    schema: HELIX_LIVE_ANSWER_ENVIRONMENT_DELTA_SCHEMA,
    delta_id: `live_answer_delta:${hashShort([next.environment_id, input.reason, changedLineKeys, now], 18)}`,
    environment_id: next.environment_id,
    thread_id: next.thread_id,
    reason: input.reason,
    changed_line_keys: changedLineKeys,
    previous_hash: previousHash,
    next_hash: hashLiveAnswerEnvironment(next),
    environment_snapshot: next,
    evidence_refs: uniqueStrings(input.evidence_refs ?? next.evidence_refs).slice(-24),
    ts: now,
  };
  deltasByEnvironment.set(next.environment_id, [...(deltasByEnvironment.get(next.environment_id) ?? []), delta].slice(-80));
  return { environment: next, delta };
}

export function listLiveAnswerEnvironmentDeltas(environmentId: string): LiveAnswerEnvironmentDelta[] {
  return deltasByEnvironment.get(environmentId) ?? [];
}

export function resetLiveAnswerEnvironments(): void {
  environments.clear();
  deltasByEnvironment.clear();
}
