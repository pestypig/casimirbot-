export const HELIX_CATEGORIZATION_REPLAY_REQUEST_SCHEMA = "helix.categorization_replay_request.v1" as const;
export const HELIX_CATEGORIZATION_REPLAY_RESULT_SCHEMA = "helix.categorization_replay_result.v1" as const;

export type HelixCategorizationReplayRequest = {
  schema: typeof HELIX_CATEGORIZATION_REPLAY_REQUEST_SCHEMA;
  replay_id: string;
  thread_id: string;
  room_id?: string | null;
  from_ts?: string | null;
  to_ts?: string | null;
  event_types?: string[];
  max_events: number;
  include_raw_events: false;
};

export type HelixCategorizationReplayResult = {
  schema: typeof HELIX_CATEGORIZATION_REPLAY_RESULT_SCHEMA;
  replay_id: string;
  replay_thread_id: string;
  source_thread_id: string;
  room_id?: string | null;
  event_count: number;
  categorization_count: number;
  synthetic_evidence_count: number;
  utility_hypothesis_count: number;
  pattern_candidate_count: number;
  result_summary: string;
  raw_content_included: false;
  assistant_answer: false;
  created_at: string;
};
