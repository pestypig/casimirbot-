export const HELIX_LIVE_CARD_LINE_STATE_SCHEMA =
  "helix.live_card_line_state.v1" as const;

export type HelixLiveCardLineEvidenceStatus =
  | "none"
  | "partial"
  | "supported"
  | "contradicted"
  | "unknown";

export type HelixLiveCardLineLastCheckResult =
  | "supports"
  | "partial"
  | "contradicts"
  | "unknown";

export type HelixLiveCardLineState = {
  schema: typeof HELIX_LIVE_CARD_LINE_STATE_SCHEMA;
  line_key: string;
  label: string;
  value: string;
  confidence: number | null;
  evidence_status: HelixLiveCardLineEvidenceStatus;
  evidence_refs: string[];
  missing_evidence: string[];
  next_best_tool?: string | null;
  last_check_result?: HelixLiveCardLineLastCheckResult | null;
  last_check_refs: string[];
  updated_at: string;
  assistant_answer: false;
  role: "ui_projection";
};
