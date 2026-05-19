import crypto from "node:crypto";
import type { HelixLiveInterpretationLens } from "@shared/helix-live-interpretation-run";
import {
  HELIX_LIVE_INTERPRETATION_WORKER_SCHEMA,
  type HelixLiveInterpretationWorker,
  type HelixLiveInterpretationWorkerRole,
} from "@shared/helix-live-interpretation-worker";
import type { HelixLiveInterpretationRun } from "@shared/helix-live-interpretation-run";
import { workerKindForLens } from "./live-interpretation-run-store";

const workersByRun = new Map<string, HelixLiveInterpretationWorker[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const roleForLens = (lens: HelixLiveInterpretationLens): HelixLiveInterpretationWorkerRole => {
  if (lens === "scene_neutral") return "scene_interpreter";
  if (lens === "activity") return "activity_interpreter";
  if (lens === "objects") return "object_interpreter";
  if (lens === "uncertainty") return "uncertainty_interpreter";
  if (lens === "protocol_lane") return "protocol_interpreter";
  if (lens === "verifier_lane") return "verifier_interpreter";
  if (lens === "risk_lane") return "risk_interpreter";
  if (lens === "workstation_affordance_lane") return "affordance_interpreter";
  return "notice_interpreter";
};

const modelBudgetForLens = (lens: HelixLiveInterpretationLens): HelixLiveInterpretationWorker["model_budget"] =>
  lens === "scene_neutral" || lens === "objects" || lens === "user_notice_lane" ? "none" : "cheap";

const descriptionForLens = (lens: HelixLiveInterpretationLens): string => {
  if (lens === "scene_neutral") return "Restates observable scene facts in neutral language without intent or instruction.";
  if (lens === "activity") return "Identifies likely activities and task transitions with confidence and uncertainty.";
  if (lens === "objects") return "Identifies salient observed objects and separates them from inferred objects.";
  if (lens === "uncertainty") return "Captures ambiguity, missing data, occlusion, stale inputs, and competing readings.";
  if (lens === "verifier_lane") return "Checks new epochs against active hypotheses and emits validation only.";
  if (lens === "protocol_lane") return "Evaluates applicable procedures with over-trust warning metadata.";
  if (lens === "risk_lane") return "Identifies possible risks or escalation cues as hypotheses only.";
  if (lens === "workstation_affordance_lane") return "Identifies available workstation affordances without planning action.";
  return "Emits user notice candidates only; it cannot send user-facing messages.";
};

export function registerLiveInterpretationWorkers(input: {
  interpretationRun: HelixLiveInterpretationRun;
  now?: string;
}): HelixLiveInterpretationWorker[] {
  const now = input.now ?? new Date().toISOString();
  const existingByLens = new Map(
    (workersByRun.get(input.interpretationRun.interpretation_run_id) ?? [])
      .map((worker: HelixLiveInterpretationWorker) => [worker.lens, worker]),
  );
  const workers = input.interpretationRun.active_lenses.map((lens: HelixLiveInterpretationLens) => {
    const existing = existingByLens.get(lens);
    return {
      schema: HELIX_LIVE_INTERPRETATION_WORKER_SCHEMA,
      interpretation_worker_id: existing?.interpretation_worker_id ?? `live_interpretation_worker:${hashShort([
        input.interpretationRun.interpretation_run_id,
        lens,
      ])}`,
      interpretation_run_id: input.interpretationRun.interpretation_run_id,
      situation_run_id: input.interpretationRun.situation_run_id,
      thread_id: input.interpretationRun.thread_id,
      lens,
      kind: workerKindForLens(lens),
      name: workerKindForLens(lens),
      description: descriptionForLens(lens),
      enabled: true,
      worker_role: roleForLens(lens),
      max_reasoning_steps: 4,
      max_artifacts_per_epoch: 3,
      max_hypotheses_per_epoch: 1,
      input_policy: {
        allowed_inputs: [
          "model_perception_observation",
          "transcript_observation",
          "field_evaluation",
          "interpretation_hypothesis",
        ],
        forbidden_inputs: ["assistant_answer", "raw_image", "raw_audio", "raw_logs"],
      },
      model_budget: modelBudgetForLens(lens),
      can_execute_tools: false,
      can_create_ask_handoff: false,
      can_create_plan_contract: false,
      can_emit_assistant_answer: false,
      may_execute_tool: false,
      may_emit_assistant_answer: false,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      assistant_answer: false,
      raw_content_included: false,
    } satisfies HelixLiveInterpretationWorker;
  });
  workersByRun.set(input.interpretationRun.interpretation_run_id, workers);
  return workers;
}

export function listLiveInterpretationWorkers(input: {
  threadId?: string | null;
  interpretationRunId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationWorker[] {
  const limit = Math.max(0, Math.min(500, Math.trunc(input.limit ?? 200)));
  return (Array.from(workersByRun.values()).flat() as HelixLiveInterpretationWorker[])
    .filter((worker: HelixLiveInterpretationWorker) => !input.threadId || worker.thread_id === input.threadId)
    .filter((worker: HelixLiveInterpretationWorker) => !input.interpretationRunId || worker.interpretation_run_id === input.interpretationRunId)
    .filter((worker: HelixLiveInterpretationWorker) => !input.situationRunId || worker.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function resetLiveInterpretationWorkersForTest(): void {
  workersByRun.clear();
}
