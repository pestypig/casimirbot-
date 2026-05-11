import crypto from "node:crypto";
import {
  HELIX_LIVE_WORKSTATION_PIPELINE_RECEIPT_SCHEMA,
  HELIX_LIVE_WORKSTATION_PIPELINE_SCHEMA,
  type LivePipelineStatus,
  type LiveWorkstationPipeline,
  type LiveWorkstationPipelinePlan,
  type LiveWorkstationPipelineReceipt,
} from "@shared/helix-live-workstation-pipeline";

const pipelines = new Map<string, LiveWorkstationPipeline>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const clean = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const unique = (values: unknown[]): string[] =>
  Array.from(new Set(values.map(clean).filter((value): value is string => Boolean(value))));

export function createLiveWorkstationPipeline(input: {
  thread_id: string;
  created_turn_id?: string | null;
  objective: string;
  source_ids?: string[];
  environment_id?: string | null;
  plan: LiveWorkstationPipelinePlan;
  now?: string;
}): { pipeline: LiveWorkstationPipeline; receipt: LiveWorkstationPipelineReceipt } {
  const now = input.now ?? new Date().toISOString();
  const threadId = clean(input.thread_id) ?? "helix-ask:desktop";
  const objective = clean(input.objective) ?? input.plan.objective;
  const createdTurnId = clean(input.created_turn_id) ?? `turn:live_pipeline:${hashShort([threadId, objective], 12)}`;
  const sourceIds = unique(input.source_ids ?? []);
  const pipelineId = `live_pipeline:${hashShort([threadId, createdTurnId, objective, sourceIds, input.plan.pipeline_recipe_id], 18)}`;
  const existing = pipelines.get(pipelineId);
  const pipeline: LiveWorkstationPipeline = {
    schema: HELIX_LIVE_WORKSTATION_PIPELINE_SCHEMA,
    pipeline_id: pipelineId,
    thread_id: threadId,
    created_turn_id: createdTurnId,
    objective,
    source_ids: sourceIds,
    environment_id: clean(input.environment_id) ?? existing?.environment_id ?? null,
    status: existing?.status ?? "active",
    transforms: input.plan.transforms,
    sinks: input.plan.sinks,
    line_schema: input.plan.line_schema,
    window_policy: {
      mode: input.plan.pipeline_recipe_id === "transcript_sentence_note" ? "sentence" : "rolling_window",
      max_events_per_window: 20,
      max_window_ms: 15_000,
    },
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
    raw_transcript_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  pipelines.set(pipelineId, pipeline);
  return {
    pipeline,
    receipt: {
      schema: HELIX_LIVE_WORKSTATION_PIPELINE_RECEIPT_SCHEMA,
      ok: true,
      pipeline_id: pipeline.pipeline_id,
      thread_id: pipeline.thread_id,
      created_turn_id: pipeline.created_turn_id,
      objective: pipeline.objective,
      source_ids: pipeline.source_ids,
      environment_id: pipeline.environment_id ?? null,
      transform_ids: pipeline.transforms.map((transform) => transform.transform_id),
      sink_ids: pipeline.sinks.map((sink) => sink.sink_id),
      context_policy: "compact_context_pack_only",
      raw_logs_included: false,
      raw_transcript_included: false,
      deterministic_content_role: "observation_not_assistant_answer",
      error: null,
    },
  };
}

export function listLiveWorkstationPipelines(): LiveWorkstationPipeline[] {
  return Array.from(pipelines.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function listLiveWorkstationPipelinesForSource(sourceId: string): LiveWorkstationPipeline[] {
  return listLiveWorkstationPipelines().filter((pipeline) =>
    pipeline.status === "active" && pipeline.source_ids.includes(sourceId),
  );
}

export function getLiveWorkstationPipeline(pipelineId: string): LiveWorkstationPipeline | null {
  return pipelines.get(pipelineId) ?? null;
}

export function setLiveWorkstationPipelineStatus(input: {
  pipeline_id: string;
  status: LivePipelineStatus;
  now?: string;
}): LiveWorkstationPipeline | null {
  const existing = pipelines.get(input.pipeline_id);
  if (!existing) return null;
  const next = { ...existing, status: input.status, updated_at: input.now ?? new Date().toISOString() };
  pipelines.set(next.pipeline_id, next);
  return next;
}

export function resetLiveWorkstationPipelines(): void {
  pipelines.clear();
}
