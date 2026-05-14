import type { HelixWorldEvent } from "./helix-world-event";

export const HELIX_EVENT_JOURNAL_RECORD_SCHEMA = "helix.event_journal_record.v1" as const;
export const HELIX_EVENT_JOURNAL_QUERY_SCHEMA = "helix.event_journal_query.v1" as const;
export const HELIX_EVENT_JOURNAL_QUERY_RESULT_SCHEMA = "helix.event_journal_query_result.v1" as const;

export type HelixEventJournalSourceFamily =
  | "minecraft"
  | "discord_voice"
  | "calculator_stream"
  | "physics_simulation"
  | "browser_audio"
  | "unknown";

export type HelixEventJournalRecord = {
  schema: typeof HELIX_EVENT_JOURNAL_RECORD_SCHEMA;
  journal_event_id: string;
  source_family: HelixEventJournalSourceFamily;
  room_id: string;
  source_id?: string | null;
  world_id?: string | null;
  thread_id?: string | null;
  event_type: string;
  actor_id?: string | null;
  actor_label?: string | null;
  ts: string;
  evidence_refs: string[];
  compact_summary: string;
  raw_event?: HelixWorldEvent;
  raw_content_included: boolean;
  assistant_answer: false;
};

export type HelixEventJournalQuery = {
  schema: typeof HELIX_EVENT_JOURNAL_QUERY_SCHEMA;
  query_id: string;
  source_family?: HelixEventJournalSourceFamily | null;
  thread_id?: string | null;
  room_id?: string | null;
  source_id?: string | null;
  world_id?: string | null;
  event_types?: string[];
  actor_id?: string | null;
  from_ts?: string | null;
  to_ts?: string | null;
  limit: number;
  include_raw_events: boolean;
};

export type HelixEventJournalQueryResult = {
  schema: typeof HELIX_EVENT_JOURNAL_QUERY_RESULT_SCHEMA;
  query_id: string;
  matched_count: number;
  returned_count: number;
  events: HelixEventJournalRecord[];
  raw_content_included: boolean;
  assistant_answer: false;
  context_policy: "debug_or_replay_only" | "compact_context_pack_only";
  created_at: string;
};
