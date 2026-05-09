export const HELIX_LIVE_ANSWER_ENVIRONMENT_SCHEMA =
  "helix.live_answer_environment.v1" as const;
export const HELIX_LIVE_ANSWER_ENVIRONMENT_DELTA_SCHEMA =
  "helix.live_answer_environment_delta.v1" as const;
export const HELIX_LIVE_ANSWER_ENVIRONMENT_RECEIPT_SCHEMA =
  "helix.live_answer_environment_receipt.v1" as const;

export type LiveAnswerLineUpdatePolicy =
  | "projection_only"
  | "salience_only"
  | "episode_based"
  | "tick_based"
  | "windowed_summary"
  | "computation_tick"
  | "stability_window"
  | "anomaly_only"
  | "model_reviewed";

export type LiveAnswerLineVisibility =
  | "answer_card"
  | "situation_panel"
  | "debug_only";

export type LiveAnswerEnvironmentPreset =
  | "minecraft_run_monitor"
  | "calculator_prime_stream"
  | "physics_stability_tracker"
  | "browser_video_argument_tracker"
  | "discord_interpreter"
  | "browser_video_tracker"
  | "research_session"
  | "custom";

export type LiveAnswerEnvironmentMode =
  | "text_only"
  | "voice_on_confirm"
  | "critical_voice"
  | "direct_address_only";

export type LiveAnswerEnvironmentStatus =
  | "active"
  | "paused"
  | "completed"
  | "error";

export type LiveAnswerLineDefinition = {
  key: string;
  label: string;
  description?: string;
  update_policy: LiveAnswerLineUpdatePolicy;
  visibility: LiveAnswerLineVisibility;
  priority?: "info" | "warn" | "critical" | "action";
};

export type LiveAnswerLineState = LiveAnswerLineDefinition & {
  value: string;
  confidence?: number | null;
  source_event_ids?: string[];
  evidence_refs: string[];
  updated_at: string;
  source: "deterministic_reducer" | "tool_observation" | "model_review" | "manual";
  model_invoked: boolean;
  deterministic?: boolean;
};

export type LiveAnswerEnvironmentSubgoal = {
  subgoal_id: string;
  label: string;
  status: "hypothesis" | "active" | "progress" | "blocked" | "completed" | "stale";
  confidence: number;
  evidence_refs: string[];
  updated_at: string;
};

export type LiveAnswerEvaluation = {
  evaluation_id: string;
  reason:
    | "source_event"
    | "episode_update"
    | "salience_update"
    | "line_schema_update"
    | "tick_based"
    | "windowed_summary"
    | "model_review"
    | "manual_refresh";
  summary: string;
  priority: "info" | "warn" | "critical" | "action";
  model_invoked: boolean;
  deterministic: boolean;
  evidence_refs: string[];
  ts: string;
};

export type LiveAnswerSubgoal = LiveAnswerEnvironmentSubgoal;

export type LiveAnswerEnvironment = {
  schema: typeof HELIX_LIVE_ANSWER_ENVIRONMENT_SCHEMA;
  environment_id: string;
  thread_id: string;
  created_turn_id: string;
  objective: string;
  preset?: string | null;
  room_id?: string | null;
  source_ids: string[];
  graph_id?: string | null;
  status: LiveAnswerEnvironmentStatus;
  mode: LiveAnswerEnvironmentMode;
  line_schema: LiveAnswerLineDefinition[];
  lines: LiveAnswerLineState[];
  lines_by_key?: Record<string, LiveAnswerLineState>;
  subgoals: LiveAnswerEnvironmentSubgoal[];
  latest_evaluation?: LiveAnswerEvaluation | null;
  latest_summary: string;
  evidence_refs: string[];
  created_at: string;
  updated_at: string;
  context_policy: "compact_context_pack_only";
  raw_logs_included?: false;
  raw_transcript_included: false;
  raw_audio_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
};

export type LiveAnswerEnvironmentDelta = {
  schema: typeof HELIX_LIVE_ANSWER_ENVIRONMENT_DELTA_SCHEMA;
  delta_id: string;
  environment_id: string;
  thread_id: string;
  reason:
    | "source_event"
    | "episode_update"
    | "salience_update"
    | "line_schema_update"
    | "computation_tick"
    | "tick_based"
    | "windowed_summary"
    | "subgoal_update"
    | "model_review"
    | "manual_refresh";
  changed_line_keys: string[];
  previous_hash?: string | null;
  next_hash: string;
  environment_snapshot: LiveAnswerEnvironment;
  evidence_refs: string[];
  ts: string;
};

export type LiveAnswerEnvironmentReceipt = {
  schema: typeof HELIX_LIVE_ANSWER_ENVIRONMENT_RECEIPT_SCHEMA;
  ok: boolean;
  environment_id?: string | null;
  thread_id: string;
  created_turn_id?: string | null;
  objective: string;
  room_id?: string | null;
  source_ids: string[];
  graph_id?: string | null;
  line_keys: string[];
  attachment_policy: "manual_only";
  context_injection: "explicit_attachment_only";
  command_lane_enabled: false;
  error?: string | null;
};

const answer = (key: string, label: string, update_policy: LiveAnswerLineUpdatePolicy, description?: string): LiveAnswerLineDefinition => ({
  key,
  label,
  description,
  update_policy,
  visibility: "answer_card",
});

const panel = (key: string, label: string, update_policy: LiveAnswerLineUpdatePolicy, description?: string): LiveAnswerLineDefinition => ({
  key,
  label,
  description,
  update_policy,
  visibility: "situation_panel",
});

export const LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS: Record<
  Exclude<LiveAnswerEnvironmentPreset, "custom">,
  LiveAnswerLineDefinition[]
> = {
  minecraft_run_monitor: [
    answer("now", "Now", "episode_based", "Current compact world state."),
    answer("goal", "Goal", "episode_based", "Likely objective or user goal."),
    answer("risk", "Risk", "salience_only", "Danger or safety status."),
    answer("progress", "Progress", "episode_based", "Meaningful progress updates."),
    answer("unknowns", "Unknowns", "projection_only", "Known sensor or context gaps."),
    answer("last_decision", "Last decision", "salience_only", "Latest interjection decision."),
    answer("next_check", "Next check", "episode_based", "What the monitor should watch next."),
  ],
  calculator_prime_stream: [
    answer("current_candidate", "Current candidate", "computation_tick", "Current integer being checked."),
    answer("latest_prime", "Latest prime", "salience_only", "Most recent prime emitted by the stream."),
    answer("prime_count", "Prime count", "computation_tick", "Number of primes found so far."),
    answer("gap", "Gap", "computation_tick", "Gap from the previous prime."),
    answer("last_test", "Last test", "computation_tick", "Latest deterministic primality result."),
    answer("stability_rate", "Rate", "windowed_summary", "Compact stream progress rate."),
    answer("next_check", "Next check", "computation_tick", "Next candidate expected from the stream."),
  ],
  physics_stability_tracker: [
    answer("current_parameters", "Current parameters", "projection_only", "Current simulation parameters."),
    answer("latest_result", "Latest result", "computation_tick", "Latest simulation output."),
    answer("residual", "Residual", "computation_tick", "Latest residual or error value."),
    answer("stability_window", "Stability window", "stability_window", "Windowed stability summary."),
    answer("margin_of_accuracy", "Margin of accuracy", "stability_window", "Tolerance or confidence margin."),
    answer("anomaly", "Anomaly", "anomaly_only", "Current anomaly state."),
    answer("next_sample", "Next sample", "computation_tick", "Next expected sample."),
  ],
  browser_video_argument_tracker: [
    answer("claim", "Claim", "episode_based"),
    answer("evidence", "Evidence", "episode_based"),
    answer("counterpoint", "Counterpoint", "episode_based"),
    answer("contradiction", "Contradiction", "salience_only"),
    answer("confidence", "Confidence", "model_reviewed"),
    answer("open_question", "Open question", "episode_based"),
    answer("next_segment", "Next segment", "projection_only"),
  ],
  discord_interpreter: [
    answer("speaker_a", "Speaker A", "projection_only"),
    answer("speaker_b", "Speaker B", "projection_only"),
    answer("translation", "Translation", "episode_based"),
    answer("ambiguity", "Ambiguity", "salience_only"),
    answer("next_reply", "Next reply", "model_reviewed"),
    answer("callout", "Callout", "salience_only"),
  ],
  browser_video_tracker: [
    answer("claim", "Claim", "episode_based"),
    answer("evidence", "Evidence", "episode_based"),
    answer("contradiction", "Contradiction", "salience_only"),
    answer("open_question", "Open question", "episode_based"),
    answer("confidence", "Confidence", "model_reviewed"),
    answer("next_segment", "Next segment", "projection_only"),
  ],
  research_session: [
    answer("hypothesis", "Hypothesis", "episode_based"),
    answer("evidence", "Evidence", "episode_based"),
    answer("caveat", "Caveat", "salience_only"),
    answer("computation", "Computation", "projection_only"),
    answer("follow_up", "Follow-up", "episode_based"),
    answer("confidence", "Confidence", "model_reviewed"),
    panel("debug_basis", "Debug basis", "projection_only"),
  ],
};
