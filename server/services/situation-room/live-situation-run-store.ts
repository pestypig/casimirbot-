import crypto from "node:crypto";
import {
  HELIX_LIVE_SITUATION_RUN_SCHEMA,
  type HelixLiveSituationRun,
  type HelixLiveSituationRunModalityScope,
} from "@shared/helix-live-situation-run";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import { inferLineReasoningModalityScope } from "./live-line-observation-context-selector";

const runsByEnvironment = new Map<string, HelixLiveSituationRun>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const reasoningBudgetFor = (objective: string): "cheap" | "normal" | "deep" => {
  if (/\b(?:deep|analy[sz]e|debug|compare|plan)\b/i.test(objective)) return "deep";
  if (/\b(?:interpret|explain|summari[sz]e|describe)\b/i.test(objective)) return "normal";
  return "cheap";
};

const scopeFor = (environment: LiveAnswerEnvironment): HelixLiveSituationRunModalityScope => {
  const scope = inferLineReasoningModalityScope({ environment });
  if (scope === "generic_visual" || scope === "minecraft_visual" || scope === "minecraft_world" || scope === "audio_transcript" || scope === "calculator_stream") {
    return scope;
  }
  return "mixed";
};

export function ensureLiveSituationRunForEnvironment(input: {
  environment: LiveAnswerEnvironment;
  pipelineId?: string | null;
  now?: string;
}): HelixLiveSituationRun {
  const now = input.now ?? new Date().toISOString();
  const existing = runsByEnvironment.get(input.environment.environment_id);
  const modalityScope = scopeFor(input.environment);
  const activeFields = input.environment.line_schema.map((line) => line.key);
  const genericVisual = modalityScope === "generic_visual";
  const sourceBindingId = `source_binding:${hashShort([
    input.environment.thread_id,
    input.environment.environment_id,
    input.environment.source_ids,
  ])}`;
  const run: HelixLiveSituationRun = {
    schema: HELIX_LIVE_SITUATION_RUN_SCHEMA,
    situation_run_id: existing?.situation_run_id ?? `live_situation_run:${hashShort([
      input.environment.thread_id,
      input.environment.environment_id,
      input.environment.objective,
    ])}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    pipeline_id: input.pipelineId ?? existing?.pipeline_id ?? null,
    source_ids: input.environment.source_ids,
    source_binding_id: sourceBindingId,
    objective_text: input.environment.objective,
    modality_scope: modalityScope,
    active_fields: activeFields,
    current_epoch: existing?.current_epoch ?? 1,
    corroboration_policy: {
      audio_required: false,
      user_steering_required: false,
      world_event_required: modalityScope === "minecraft_world",
      missing_corroboration_effect: genericVisual ? "lower_confidence_not_block" : "lower_confidence_not_block",
    },
    reasoning_budget: reasoningBudgetFor(input.environment.objective),
    terminal_policy: {
      worker_outputs_are_terminal: false,
      tangent_outputs_are_terminal: false,
      terminal_authority_required: true,
    },
    status: existing?.status === "paused" ? "paused" : "active",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  runsByEnvironment.set(run.environment_id, run);
  return run;
}

export function getLiveSituationRunForEnvironment(environmentId: string): HelixLiveSituationRun | null {
  return runsByEnvironment.get(environmentId) ?? null;
}

export function listLiveSituationRuns(input: {
  threadId?: string | null;
  environmentId?: string | null;
  limit?: number;
} = {}): HelixLiveSituationRun[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  return Array.from(runsByEnvironment.values())
    .filter((run) => !input.threadId || run.thread_id === input.threadId)
    .filter((run) => !input.environmentId || run.environment_id === input.environmentId)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(-limit);
}

export function resetLiveSituationRunsForTest(): void {
  runsByEnvironment.clear();
}
