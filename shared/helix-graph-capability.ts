export const HELIX_GRAPH_CAPABILITY_SCHEMA = "helix.graph_capability.v1" as const;

export type HelixGraphPortKind =
  | "audio"
  | "speaker_identity"
  | "transcript"
  | "language"
  | "text"
  | "translation"
  | "context"
  | "command"
  | "voice_output"
  | "receipt"
  | "monitor_signal";

export type HelixGraphCapabilityRisk = "low" | "medium" | "high";

export type HelixGraphCapabilityFamily =
  | "source"
  | "identity"
  | "transform"
  | "policy"
  | "output"
  | "monitor"
  | "helix_bridge";

export type HelixGraphPort = {
  port_id: string;
  kind: HelixGraphPortKind;
  required?: boolean;
};

export type HelixGraphCapability = {
  schema: typeof HELIX_GRAPH_CAPABILITY_SCHEMA;
  capability_id: string;
  title: string;
  description: string;
  family: HelixGraphCapabilityFamily;
  input_ports: Array<HelixGraphPort & { required: boolean }>;
  output_ports: HelixGraphPort[];
  parameter_schema: Record<string, unknown>;
  default_params?: Record<string, unknown>;
  risk: HelixGraphCapabilityRisk;
  requires_confirmation: boolean;
  execution_mode: "manual" | "on_event" | "continuous" | "helix_requested";
  attachment_policy: "manual_only";
  context_injection: "explicit_attachment_only";
  command_lane_enabled: false;
};

const capability = (
  input: Omit<
    HelixGraphCapability,
    "schema" | "attachment_policy" | "context_injection" | "command_lane_enabled"
  >,
): HelixGraphCapability => ({
  schema: HELIX_GRAPH_CAPABILITY_SCHEMA,
  attachment_policy: "manual_only",
  context_injection: "explicit_attachment_only",
  command_lane_enabled: false,
  ...input,
});

export const HELIX_GRAPH_CAPABILITIES: HelixGraphCapability[] = [
  capability({
    capability_id: "source.mic_audio",
    title: "Mic audio source",
    description: "Permission-bound microphone capture lane.",
    family: "source",
    input_ports: [],
    output_ports: [{ port_id: "audio", kind: "audio" }],
    parameter_schema: { type: "object", properties: { source_id: { type: "string" } } },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "source.browser_tab_audio",
    title: "Browser tab audio source",
    description: "Permission-bound browser or display audio capture lane.",
    family: "source",
    input_ports: [],
    output_ports: [{ port_id: "audio", kind: "audio" }],
    parameter_schema: { type: "object", properties: { source_ids: { type: "array", items: { type: "string" } } } },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "source.minecraft_events",
    title: "Minecraft events source",
    description: "Permission-bound world/plugin event source for Minecraft rooms.",
    family: "source",
    input_ports: [],
    output_ports: [{ port_id: "event", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { world_id: { type: "string" }, source_id: { type: "string" } } },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "source.screen_summary",
    title: "Screen summary source",
    description: "Explicit screen-summary evidence source without raw screen injection.",
    family: "source",
    input_ports: [],
    output_ports: [{ port_id: "summary", kind: "text" }],
    parameter_schema: { type: "object", properties: { source_id: { type: "string" }, cadence: { type: "string" } } },
    default_params: { cadence: "manual" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "identity.speaker_split",
    title: "Speaker split",
    description: "Speaker activity and diarization observation lane.",
    family: "identity",
    input_ports: [{ port_id: "audio", kind: "audio", required: true }],
    output_ports: [{ port_id: "speakers", kind: "speaker_identity" }],
    parameter_schema: { type: "object", properties: { shadow_only: { type: "boolean" } } },
    default_params: { shadow_only: true },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "on_event",
  }),
  capability({
    capability_id: "identity.speaker_profile_map",
    title: "Speaker profile map",
    description: "Maps session speaker ids to explicit session/profile labels.",
    family: "identity",
    input_ports: [{ port_id: "speaker", kind: "speaker_identity", required: true }],
    output_ports: [{ port_id: "speaker", kind: "speaker_identity" }],
    parameter_schema: { type: "object", properties: { speaker_mappings: { type: "array" } } },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "transform.language_detect",
    title: "Language detect",
    description: "Detects likely source language from transcript text.",
    family: "transform",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "language", kind: "language" }],
    parameter_schema: { type: "object", properties: {} },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "on_event",
  }),
  capability({
    capability_id: "transform.translate",
    title: "Translate",
    description: "Transforms transcript text into a target language.",
    family: "transform",
    input_ports: [
      { port_id: "text", kind: "text", required: true },
      { port_id: "language", kind: "language", required: false },
    ],
    output_ports: [{ port_id: "translation", kind: "translation" }],
    parameter_schema: {
      type: "object",
      properties: {
        source_language: { type: "string" },
        target_language: { type: "string" },
        output_mode: { type: "string", enum: ["target_language", "native_language", "dual"] },
      },
    },
    risk: "medium",
    requires_confirmation: false,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "transform.rolling_summary",
    title: "Rolling summary",
    description: "Creates summary outputs from selected room evidence.",
    family: "transform",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "summary", kind: "text" }],
    parameter_schema: { type: "object", properties: { cadence: { type: "string" } } },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "transform.action_items",
    title: "Action items",
    description: "Extracts action items from selected room evidence.",
    family: "transform",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "items", kind: "text" }],
    parameter_schema: { type: "object", properties: { assignee_policy: { type: "string" } } },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "transform.prompt_composer",
    title: "Prompt composer",
    description: "Turns selected room evidence into a reusable prompt draft.",
    family: "transform",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "prompt", kind: "text" }],
    parameter_schema: { type: "object", properties: { prompt_goal: { type: "string" } } },
    risk: "medium",
    requires_confirmation: false,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "transform.episode_narrator",
    title: "Episode narrator",
    description: "Groups world events into compact third-person situation episodes.",
    family: "transform",
    input_ports: [{ port_id: "signal", kind: "monitor_signal", required: true }],
    output_ports: [{ port_id: "narration", kind: "text" }],
    parameter_schema: {
      type: "object",
      properties: {
        window_ms: { type: "number" },
        mode: { type: "string", enum: ["deterministic_only", "llm_on_salience"] },
      },
    },
    default_params: { window_ms: 12000, mode: "deterministic_only" },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "transform.goal_predictor",
    title: "Goal predictor",
    description: "Turns episode narration into evidence-linked goal hypotheses.",
    family: "transform",
    input_ports: [{ port_id: "narration", kind: "text", required: true }],
    output_ports: [{ port_id: "goal", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { confidence_floor: { type: "number" } } },
    default_params: { confidence_floor: 0.5 },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "policy.unknown_speaker_filter",
    title: "Unknown speaker filter",
    description: "Keeps unknown speakers transcribe-only unless explicitly trusted.",
    family: "policy",
    input_ports: [{ port_id: "speaker", kind: "speaker_identity", required: true }],
    output_ports: [{ port_id: "speaker", kind: "speaker_identity" }],
    parameter_schema: { type: "object", properties: { unknown_behavior: { type: "string" } } },
    default_params: { unknown_behavior: "transcribe_only" },
    risk: "medium",
    requires_confirmation: false,
    execution_mode: "on_event",
  }),
  capability({
    capability_id: "policy.interjection_gate",
    title: "Interjection gate",
    description: "Controls when Situation Room observations may notify Helix.",
    family: "policy",
    input_ports: [{ port_id: "signal", kind: "monitor_signal", required: true }],
    output_ports: [{ port_id: "context", kind: "context" }],
    parameter_schema: { type: "object", properties: { mode: { type: "string" } } },
    default_params: { mode: "direct_address_only" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "on_event",
  }),
  capability({
    capability_id: "policy.interjection_review",
    title: "Interjection review",
    description: "Reviews salient episodes for silent context, visual callouts, or voice-on-confirm proposals.",
    family: "policy",
    input_ports: [{ port_id: "receipt", kind: "receipt", required: true }],
    output_ports: [{ port_id: "context", kind: "context" }],
    parameter_schema: {
      type: "object",
      properties: {
        voice_output: { type: "string", enum: ["off", "on_confirm"] },
        default_decision: { type: "string", enum: ["silent_keep_in_context", "text_callout"] },
      },
    },
    default_params: { voice_output: "off", default_decision: "silent_keep_in_context" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "output.panel_transcript",
    title: "Panel transcript output",
    description: "Renders transcript or translated output inside the Situation Room.",
    family: "output",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: {} },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "on_event",
  }),
  capability({
    capability_id: "output.voice_on_confirm",
    title: "Voice output on confirm",
    description: "Speaks output only after explicit confirmation.",
    family: "output",
    input_ports: [{ port_id: "voice", kind: "voice_output", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: { voice_output: { type: "string" } } },
    default_params: { voice_output: "on_confirm" },
    risk: "high",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "output.note",
    title: "Note output",
    description: "Saves selected output as a note after explicit action.",
    family: "output",
    input_ports: [{ port_id: "text", kind: "text", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: { note_title: { type: "string" } } },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "monitor.translation_health",
    title: "Translation health monitor",
    description: "Reports translation counts, errors, and missing language mappings.",
    family: "monitor",
    input_ports: [{ port_id: "translation", kind: "translation", required: true }],
    output_ports: [{ port_id: "signal", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { notify_on_error: { type: "boolean" } } },
    default_params: { notify_on_error: true },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.source_activity",
    title: "Source activity monitor",
    description: "Reports capture health and activity without injecting transcript text.",
    family: "monitor",
    input_ports: [{ port_id: "audio", kind: "audio", required: true }],
    output_ports: [{ port_id: "signal", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { idle_threshold_ms: { type: "number" } } },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.timeline_join",
    title: "Timeline join",
    description: "Joins granted transcript, graph-runtime, and world signals into a typed event timeline.",
    family: "monitor",
    input_ports: [
      { port_id: "signal", kind: "monitor_signal", required: true },
      { port_id: "text", kind: "text", required: false },
    ],
    output_ports: [{ port_id: "timeline", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { window_ms: { type: "number" } } },
    default_params: { window_ms: 300000 },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.world_state_projection",
    title: "World state projection",
    description: "Projects recent event signals into a compact state summary with evidence refs.",
    family: "monitor",
    input_ports: [{ port_id: "timeline", kind: "monitor_signal", required: true }],
    output_ports: [{ port_id: "projection", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { projection_policy: { type: "string" } } },
    default_params: { projection_policy: "deterministic_first" },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.goal_hypothesis",
    title: "Goal hypothesis",
    description: "Infers simple deterministic goal hypotheses from transcript/world cues.",
    family: "monitor",
    input_ports: [{ port_id: "projection", kind: "monitor_signal", required: true }],
    output_ports: [{ port_id: "goal", kind: "monitor_signal" }],
    parameter_schema: { type: "object", properties: { confidence_floor: { type: "number" } } },
    default_params: { confidence_floor: 0.5 },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.salience_gate",
    title: "Salience gate",
    description: "Deterministically decides whether standby signals should produce a receipt or proposal.",
    family: "monitor",
    input_ports: [{ port_id: "signal", kind: "monitor_signal", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["off", "direct_address_only", "high_salience", "translation_mediator", "game_master", "research_assistant"],
        },
        cooldown_ms: { type: "number" },
      },
    },
    default_params: { mode: "high_salience", cooldown_ms: 45000 },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "monitor.interjection_proposal",
    title: "Interjection proposal",
    description: "Creates confirmable user-visible proposals from salience receipts without calling an LLM.",
    family: "monitor",
    input_ports: [{ port_id: "receipt", kind: "receipt", required: true }],
    output_ports: [{ port_id: "context", kind: "context" }],
    parameter_schema: {
      type: "object",
      properties: { voice_output: { type: "string", enum: ["off", "on_confirm", "auto_when_allowed"] } },
    },
    default_params: { voice_output: "on_confirm" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "continuous",
  }),
  capability({
    capability_id: "helix.attach_context",
    title: "Attach context to Helix",
    description: "Explicitly attaches selected graph output to Helix Ask context.",
    family: "helix_bridge",
    input_ports: [{ port_id: "context", kind: "context", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: { attach_mode: { type: "string" } } },
    default_params: { attach_mode: "manual_only" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "manual",
  }),
  capability({
    capability_id: "helix.standby_reasoning",
    title: "Standby reasoning trace",
    description: "Records visible auxiliary standby reasoning items in Helix thread history.",
    family: "helix_bridge",
    input_ports: [{ port_id: "context", kind: "context", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: { cognition_mode: { type: "string" } } },
    default_params: { cognition_mode: "deterministic_only" },
    risk: "medium",
    requires_confirmation: true,
    execution_mode: "helix_requested",
  }),
  capability({
    capability_id: "output.standby_trace",
    title: "Standby trace output",
    description: "Displays episode, prediction, and interjection review traces without speaking automatically.",
    family: "output",
    input_ports: [{ port_id: "receipt", kind: "receipt", required: true }],
    output_ports: [{ port_id: "receipt", kind: "receipt" }],
    parameter_schema: { type: "object", properties: { visible: { type: "boolean" } } },
    default_params: { visible: true },
    risk: "low",
    requires_confirmation: false,
    execution_mode: "on_event",
  }),
];

export const getHelixGraphCapability = (capabilityId: string): HelixGraphCapability | undefined =>
  HELIX_GRAPH_CAPABILITIES.find((capabilityEntry) => capabilityEntry.capability_id === capabilityId);
