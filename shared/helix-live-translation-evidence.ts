import type { LiveScenarioSafetyEnvelope } from "./helix-live-scenario-evidence.ts";

export const HELIX_LIVE_TRANSLATION_TURN_SCHEMA =
  "helix.live_translation_turn.v1" as const;

export type LiveTranslationTurn = LiveScenarioSafetyEnvelope & {
  schema: typeof HELIX_LIVE_TRANSLATION_TURN_SCHEMA;
  turn_id: string;
  scenario_kind: "live_translation";
  evidence_layer: "audio_transcript";
  evidence_trust: "audio_transcript";
  participant_hint: "speaker_a" | "speaker_b" | "unknown";
  language_detected?: string | null;
  compact_utterance_summary: string;
  translation_candidate: string;
  ambiguity_flags: string[];
  confidence: number;
  evidence_refs: string[];
  ts: string;
};

export function createLiveTranslationTurn(
  input: Omit<LiveTranslationTurn, "schema" | keyof LiveScenarioSafetyEnvelope>,
): LiveTranslationTurn {
  return {
    schema: HELIX_LIVE_TRANSLATION_TURN_SCHEMA,
    ...liveToolSafety(),
    ...input,
  };
}

function liveToolSafety(): LiveScenarioSafetyEnvelope {
  return {
    scenario_kind: "live_translation",
    evidence_layer: "audio_transcript",
    evidence_trust: "audio_transcript",
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
