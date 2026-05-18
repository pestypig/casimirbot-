import type { HelixLiveInterpretationLens } from "./helix-live-interpretation-run";

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
  worker_role: HelixLiveInterpretationWorkerRole;
  input_policy: {
    allowed_inputs: string[];
    forbidden_inputs: string[];
  };
  model_budget: "none" | "cheap" | "normal";
  may_execute_tool: false;
  may_emit_assistant_answer: false;
  assistant_answer: false;
  raw_content_included: false;
};
