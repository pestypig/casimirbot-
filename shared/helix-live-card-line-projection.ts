import type {
  HelixLiveCardLineLastCheckResult,
  HelixLiveCardLineSourceCoverage,
} from "./helix-live-card-line-state";

export const HELIX_LIVE_CARD_LINE_PROJECTION_SCHEMA =
  "helix.live_card_line_projection.v1" as const;

export type HelixLiveCardLineProjectionSource =
  | "line_reasoner"
  | "visual_observation"
  | "world_event"
  | "audio_transcript"
  | "calculator_stream"
  | "fallback";

export type HelixLiveCardLineProjectionLine = {
  key: string;
  label: string;
  value: string;
  confidence: number | null;
  evidence_refs: string[];
  missing_evidence: string[];
  next_best_tool?: string | null;
  last_check_result?: HelixLiveCardLineLastCheckResult | null;
  source_coverage: HelixLiveCardLineSourceCoverage;
  reasoner_id?: string | null;
  source: HelixLiveCardLineProjectionSource;
  assistant_answer: false;
  role: "ui_projection";
};

export type HelixLiveCardLineProjection = {
  schema: typeof HELIX_LIVE_CARD_LINE_PROJECTION_SCHEMA;
  projection_id: string;
  thread_id: string;
  environment_id: string;
  schema_selection_id: string;
  lines: HelixLiveCardLineProjectionLine[];
  stale_fallback_used: boolean;
  assistant_answer: false;
  raw_content_included: false;
};
