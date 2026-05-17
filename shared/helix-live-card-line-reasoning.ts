export const HELIX_LIVE_CARD_LINE_REASONING_SCHEMA =
  "helix.live_card_line_reasoning.v1" as const;

export type HelixLiveCardLineReasoningModalityScope =
  | "generic_visual"
  | "minecraft_visual"
  | "minecraft_world"
  | "audio_transcript"
  | "calculator_stream"
  | "document_context"
  | "mixed";

export type HelixLiveCardLineReasoning = {
  schema: typeof HELIX_LIVE_CARD_LINE_REASONING_SCHEMA;
  reasoning_id: string;
  thread_id: string;
  environment_id: string;
  line_key: string;
  value: string;
  confidence: number | null;
  evidence_refs: string[];
  missing_evidence: string[];
  next_check: string;
  next_best_tool?: string | null;
  model_invoked: boolean;
  deterministic: boolean;
  assistant_answer: false;
  raw_content_included: false;
  role: "ui_projection";
};
