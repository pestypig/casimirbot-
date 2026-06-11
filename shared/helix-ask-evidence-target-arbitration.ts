import type {
  HelixAskSourceTarget,
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "./helix-ask-source-target-intent";

export const HELIX_ASK_EVIDENCE_TARGET_ARBITRATION_SCHEMA =
  "helix.ask_evidence_target_arbitration.v1" as const;

export type HelixAskEvidenceTargetCandidate = {
  candidate_id: string;
  target_source: HelixAskSourceTarget;
  target_kind: HelixAskSourceTarget;
  strength: HelixAskSourceTargetStrength;
  score: number;
  confidence: "high" | "medium" | "low";
  reason_codes: string[];
  requested_outputs: HelixAskSourceTargetRequestedOutput[];
  capability_keys: string[];
  terminal_product_constraints: string[];
  disallowed: boolean;
  disallowed_reason?: string | null;
};

export type HelixAskEvidenceTargetArbitration = {
  schema: typeof HELIX_ASK_EVIDENCE_TARGET_ARBITRATION_SCHEMA;
  turn_id: string;
  thread_id: string;
  prompt_intent_candidates: string[];
  evidence_target_candidates: HelixAskEvidenceTargetCandidate[];
  source_targets: HelixAskSourceTarget[];
  available_capabilities: string[];
  disallowed_capabilities: string[];
  selected_candidate_id: string | null;
  selected_target_source: HelixAskSourceTarget;
  selected_target_kind: HelixAskSourceTarget;
  confidence: "high" | "medium" | "low";
  reason_codes: string[];
  reason?: string | null;
  locked?: boolean;
  must_enter_backend_ask: boolean;
  allow_no_tool_direct: boolean;
  terminal_product_constraints: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_role: "admission_control";
};
