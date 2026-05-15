import type { HelixLiveCardLineState } from "./helix-live-card-line-state";
import type { HelixLiveEnvironmentFidelity } from "./helix-live-environment-fidelity";

export const HELIX_PRESENT_STATE_SYNTHESIS_SCHEMA =
  "helix.present_state_synthesis.v1" as const;

export type HelixPresentStateSynthesisMode =
  | "deterministic_rewrite"
  | "model_reviewed"
  | "debug_trace";

export type HelixPresentStateSynthesisLine = {
  key: string;
  label: string;
  value: string;
  confidence: number | null;
  evidence_refs: string[];
  missing_evidence: string[];
  next_best_tool?: string | null;
  last_check_result?: HelixLiveCardLineState["last_check_result"];
  source_coverage?: HelixLiveCardLineState["source_coverage"];
  updated_at: string;
  assistant_answer: false;
  role: "ui_projection";
};

export type HelixPresentStateSynthesis = {
  schema: typeof HELIX_PRESENT_STATE_SYNTHESIS_SCHEMA;
  synthesis_id: string;
  thread_id: string;
  room_id?: string | null;
  mode: HelixPresentStateSynthesisMode;
  summary: string;
  lines: HelixPresentStateSynthesisLine[];
  evidence_refs: string[];
  confidence_change_sources: string[];
  fidelity_profile?: HelixLiveEnvironmentFidelity | null;
  live_cognition_tool_registry_version: string;
  model_invoked: boolean;
  deterministic: boolean;
  assistant_answer: false;
  role: "ui_projection";
  created_at: string;
};
