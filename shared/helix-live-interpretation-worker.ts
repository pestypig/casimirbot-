import type {
  HelixLiveInterpretationLens,
  HelixLiveInterpretationWorkerKind,
} from "./helix-live-interpretation-run";

export const HELIX_LIVE_INTERPRETATION_WORKER_SCHEMA =
  "helix.live_interpretation_worker.v1" as const;

export type HelixLiveInterpretationWorkerRole =
  | "scene_interpreter"
  | "activity_interpreter"
  | "object_interpreter"
  | "uncertainty_interpreter"
  | "protocol_interpreter"
  | "verifier_interpreter"
  | "risk_interpreter"
  | "affordance_interpreter"
  | "notice_interpreter";

export type HelixLiveInterpretationWorker = {
  schema: typeof HELIX_LIVE_INTERPRETATION_WORKER_SCHEMA;
  interpretation_worker_id: string;
  interpretation_run_id: string;
  situation_run_id: string;
  thread_id: string;
  lens: HelixLiveInterpretationLens;
  kind: HelixLiveInterpretationWorkerKind;
  name: string;
  description: string;
  enabled: boolean;
  worker_role: HelixLiveInterpretationWorkerRole;
  max_reasoning_steps: number;
  max_artifacts_per_epoch: number;
  max_hypotheses_per_epoch: number;
  input_policy: {
    allowed_inputs: string[];
    forbidden_inputs: string[];
  };
  model_budget: "none" | "cheap" | "normal";
  can_execute_tools: false;
  can_create_ask_handoff: false;
  can_create_plan_contract: false;
  can_emit_assistant_answer: false;
  may_execute_tool: false;
  may_emit_assistant_answer: false;
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
