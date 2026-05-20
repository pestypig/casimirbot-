import type { LiveScenarioSafetyEnvelope } from "./helix-live-scenario-evidence.ts";

export const HELIX_RESEARCH_EVIDENCE_CLAIM_SCHEMA =
  "helix.research_evidence_claim.v1" as const;

export type ResearchEvidenceClaim = LiveScenarioSafetyEnvelope & {
  schema: typeof HELIX_RESEARCH_EVIDENCE_CLAIM_SCHEMA;
  research_claim_id: string;
  scenario_kind: "research_session";
  evidence_layer:
    | "document_context"
    | "note_context"
    | "calculator_stream"
    | "simulation_stream";
  evidence_trust:
    | "document_context"
    | "note_context"
    | "calculator_observation"
    | "simulation_observation";
  claim_summary: string;
  evidence_summary: string;
  caveat_summary?: string | null;
  source_refs: string[];
  confidence: number;
  evidence_refs: string[];
  ts: string;
};

export function createResearchEvidenceClaim(
  input: Omit<ResearchEvidenceClaim, "schema" | keyof LiveScenarioSafetyEnvelope>,
): ResearchEvidenceClaim {
  return {
    schema: HELIX_RESEARCH_EVIDENCE_CLAIM_SCHEMA,
    ...liveToolSafety(input.evidence_layer, input.evidence_trust),
    ...input,
  };
}

function liveToolSafety(
  evidence_layer: ResearchEvidenceClaim["evidence_layer"],
  evidence_trust: ResearchEvidenceClaim["evidence_trust"],
): LiveScenarioSafetyEnvelope {
  return {
    scenario_kind: "research_session",
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
