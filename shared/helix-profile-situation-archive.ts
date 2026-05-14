export const HELIX_PROFILE_SITUATION_ARCHIVE_SCHEMA =
  "helix.profile_situation_archive.v1" as const;

export type ProfileSituationArchive = {
  schema: typeof HELIX_PROFILE_SITUATION_ARCHIVE_SCHEMA;
  archive_id: string;
  profile_id: string;
  thread_id: string;
  job_id?: string | null;
  source_family:
    | "minecraft_events"
    | "discord_voice"
    | "calculator_stream"
    | "physics_simulation"
    | "browser_transcript"
    | "research_session"
    | "custom";
  session_title: string;
  objective: string;
  started_at: string;
  ended_at: string;
  summary: string;
  evidence_index: Array<{
    evidence_id: string;
    category: string;
    summary: string;
    confidence: number;
    source_refs: string[];
  }>;
  interpreted_event_summaries?: Array<{
    event_id: string;
    kind: string;
    summary: string;
    confidence?: number | null;
  }>;
  user_steering_evidence?: Array<{
    steering_id: string;
    user_claim: string;
    effect: string;
    next_checks: string[];
    evidence_refs: string[];
  }>;
  subgoals: Array<{
    label: string;
    final_status: "completed" | "blocked" | "active" | "stale" | "unknown";
    evidence_ids: string[];
  }>;
  learned_pattern_candidates: string[];
  raw_logs_included: false;
  assistant_answer: false;
  created_at: string;
};
