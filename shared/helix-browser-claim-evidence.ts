import type { LiveScenarioSafetyEnvelope } from "./helix-live-scenario-evidence.ts";

export const HELIX_BROWSER_CLAIM_EVIDENCE_SCHEMA =
  "helix.browser_claim_evidence.v1" as const;

export type BrowserClaimEvidence = LiveScenarioSafetyEnvelope & {
  schema: typeof HELIX_BROWSER_CLAIM_EVIDENCE_SCHEMA;
  claim_id: string;
  scenario_kind: "browser_audio_claim_monitor";
  evidence_layer: "audio_transcript" | "visual_capture" | "document_context";
  evidence_trust: "audio_transcript" | "visual_capture" | "document_context";
  claim_summary: string;
  evidence_summary?: string | null;
  caveat_summary?: string | null;
  timestamp_range_ms?: { start: number; end: number } | null;
  confidence: number;
  evidence_refs: string[];
  ts: string;
};

export function createBrowserClaimEvidence(
  input: Omit<BrowserClaimEvidence, "schema" | keyof LiveScenarioSafetyEnvelope>,
): BrowserClaimEvidence {
  return {
    schema: HELIX_BROWSER_CLAIM_EVIDENCE_SCHEMA,
    ...liveToolSafety("browser_audio_claim_monitor", input.evidence_layer, input.evidence_trust),
    ...input,
  };
}

function liveToolSafety(
  scenario_kind: BrowserClaimEvidence["scenario_kind"],
  evidence_layer: BrowserClaimEvidence["evidence_layer"],
  evidence_trust: BrowserClaimEvidence["evidence_trust"],
): LiveScenarioSafetyEnvelope {
  return {
    scenario_kind,
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
