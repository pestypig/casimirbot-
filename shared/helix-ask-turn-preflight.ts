export const HELIX_ASK_TURN_PREFLIGHT_CONTEXT_SCHEMA =
  "helix.ask_turn_preflight_context.v1" as const;

export type HelixAskTurnInputModality = "typed" | "voice" | "discord" | "system";

export type HelixRouteCandidate = {
  route: string;
  confidence?: number | null;
  reason?: string | null;
};

export type HelixAskTurnPreflightContext = {
  schema: typeof HELIX_ASK_TURN_PREFLIGHT_CONTEXT_SCHEMA;
  preflight_context_id: string;
  turn_id: string;
  thread_id: string;
  prompt_text: string;
  prompt_hash: string;
  input_modality: HelixAskTurnInputModality;
  created_at: string;
  retrieval_required_signal: unknown;
  route_candidates: HelixRouteCandidate[];
  live_source_continuation_intent?: unknown | null;
  live_environment_intent?: unknown | null;
  deictic_reference?: unknown | null;
  active_situation_context?: unknown | null;
  situation_evidence_selection?: unknown | null;
  pending_request_state?: unknown | null;
  workspace_snapshot?: unknown | null;
  assistant_answer: false;
  raw_content_included: false;
};
