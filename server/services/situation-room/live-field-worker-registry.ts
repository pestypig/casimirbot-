import crypto from "node:crypto";
import {
  HELIX_LIVE_FIELD_WORKER_SCHEMA,
  type HelixLiveFieldWorker,
  type HelixLiveFieldWorkerRole,
} from "@shared/helix-live-field-worker";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";

const workersByRun = new Map<string, HelixLiveFieldWorker[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const roleForField = (fieldKey: string): HelixLiveFieldWorkerRole => {
  if (fieldKey === "scene" || fieldKey === "place") return "scene_observer";
  if (fieldKey === "activity" || fieldKey === "progress") return "activity_interpreter";
  if (fieldKey === "objects" || fieldKey === "entities" || fieldKey === "participants") return "object_extractor";
  if (fieldKey === "evidence") return "evidence_curator";
  if (fieldKey === "uncertainty" || fieldKey === "missing_evidence" || fieldKey === "unknowns") return "uncertainty_tracker";
  if (fieldKey === "next_check" || fieldKey === "last_decision") return "next_check_planner";
  return "custom";
};

export function registerFieldWorkersForSituationRun(input: {
  run: HelixLiveSituationRun;
  environment: LiveAnswerEnvironment;
}): HelixLiveFieldWorker[] {
  const existingByField = new Map((workersByRun.get(input.run.situation_run_id) ?? []).map((worker) => [worker.field_key, worker]));
  const workers = input.environment.line_schema.map((line) => {
    const existing = existingByField.get(line.key);
    const worker: HelixLiveFieldWorker = {
      schema: HELIX_LIVE_FIELD_WORKER_SCHEMA,
      worker_id: existing?.worker_id ?? `live_field_worker:${hashShort([
        input.run.situation_run_id,
        line.key,
      ])}`,
      situation_run_id: input.run.situation_run_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      field_key: line.key,
      field_label: line.label,
      worker_role: roleForField(line.key),
      input_policy: {
        allowed_roles: ["raw_source_event", "model_perception_observation", "tool_observation", "client_capability_observation", "transcript_observation", "reference_observation"],
        forbidden_roles: ["assistant_answer"],
        max_observations: 8,
        allow_prior_field_evaluations: true,
      },
      output_type: "field_evaluation",
      may_execute_tool: false,
      status: existing?.status ?? "active",
      assistant_answer: false,
      raw_content_included: false,
    };
    return worker;
  });
  workersByRun.set(input.run.situation_run_id, workers);
  return workers;
}

export function listLiveFieldWorkers(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveFieldWorker[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 120)));
  return Array.from(workersByRun.values()).flat()
    .filter((worker) => !input.threadId || worker.thread_id === input.threadId)
    .filter((worker) => !input.environmentId || worker.environment_id === input.environmentId)
    .filter((worker) => !input.situationRunId || worker.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function resetLiveFieldWorkersForTest(): void {
  workersByRun.clear();
}
