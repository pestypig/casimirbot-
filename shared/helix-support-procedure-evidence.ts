import type { LiveScenarioSafetyEnvelope } from "./helix-live-scenario-evidence.ts";

export const HELIX_SUPPORT_PROCEDURE_EVIDENCE_SCHEMA =
  "helix.support_procedure_evidence.v1" as const;

export type SupportProcedureEvidence = LiveScenarioSafetyEnvelope & {
  schema: typeof HELIX_SUPPORT_PROCEDURE_EVIDENCE_SCHEMA;
  support_evidence_id: string;
  scenario_kind: "support_procedure_monitor";
  evidence_layer: "procedure_graph" | "audio_transcript" | "visual_capture";
  evidence_trust: "procedure_observation" | "audio_transcript" | "visual_capture";
  issue_summary: string;
  tried_steps: string[];
  current_blocker?: string | null;
  next_check_candidates: string[];
  risk_flags: string[];
  confidence: number;
  evidence_refs: string[];
  ts: string;
};

export function createSupportProcedureEvidence(
  input: Omit<SupportProcedureEvidence, "schema" | keyof LiveScenarioSafetyEnvelope>,
): SupportProcedureEvidence {
  return {
    schema: HELIX_SUPPORT_PROCEDURE_EVIDENCE_SCHEMA,
    ...liveToolSafety(input.evidence_layer, input.evidence_trust),
    ...input,
  };
}

function liveToolSafety(
  evidence_layer: SupportProcedureEvidence["evidence_layer"],
  evidence_trust: SupportProcedureEvidence["evidence_trust"],
): LiveScenarioSafetyEnvelope {
  return {
    scenario_kind: "support_procedure_monitor",
    evidence_layer,
    evidence_trust,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    ask_context_policy: "evidence_only",
    context_role: "tool_evidence",
    creates_ask_turn: false,
    turn_triggered: false,
    raw_user_text_included: false,
    raw_transcript_included: false,
    raw_image_included: false,
    raw_audio_included: false,
    raw_logs_included: false,
    raw_content_included: false,
    model_invoked: false,
  };
}
