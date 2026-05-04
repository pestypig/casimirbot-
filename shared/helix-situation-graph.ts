export const HELIX_SITUATION_GRAPH_SCHEMA = "helix.situation_graph.v1" as const;

export type SituationGraphLane =
  | "audio"
  | "speaker_identity"
  | "transcript"
  | "translation"
  | "context"
  | "command"
  | "voice_output";

export type SituationGraphNodeType =
  | "source.audio.mic"
  | "source.audio.display"
  | "source.screen"
  | "speaker.identity"
  | "speaker.filter"
  | "transcript.buffer"
  | "language.detect"
  | "translate"
  | "helix.reason"
  | "helix.interjection_gate"
  | "output.voice"
  | "output.panel"
  | "output.note"
  | "output.history";

export type SituationGraphNodeColumn =
  | "sources"
  | "speakers"
  | "jobs"
  | "outputs"
  | "helix";

export type SituationGraphNodeStatus =
  | "idle"
  | "active"
  | "running"
  | "blocked"
  | "complete"
  | "error";

export type SituationGraphPolicyKind =
  | "speaker_authority"
  | "unknown_speaker"
  | "translation_direction"
  | "interjection"
  | "context_attachment"
  | "privacy";

export type TranslationPairNodeConfig = {
  speaker_a_id: string;
  speaker_b_id: string;
  speaker_a_native_language: string;
  speaker_b_native_language: string;
  a_to_b_job_id: string;
  b_to_a_job_id: string;
  render_policy: "target_language" | "native_language" | "dual";
  voice_output: "off" | "on_confirm" | "auto_when_direct_addressed";
};

export type SituationGraphNode = {
  node_id: string;
  type: SituationGraphNodeType;
  title: string;
  column: SituationGraphNodeColumn;
  status: SituationGraphNodeStatus;
  subtitle?: string;
  source_id?: string;
  speaker_id?: string;
  job_id?: string;
  output_id?: string;
  config?: Record<string, unknown>;
  runtime?: {
    last_event_id?: string;
    last_output_id?: string;
    event_count?: number;
    output_count?: number;
    last_error?: string | null;
    last_updated_at?: string;
  };
  created_at: string;
  updated_at: string;
};

export type SituationGraphEdge = {
  edge_id: string;
  from_node_id: string;
  from_port: string;
  to_node_id: string;
  to_port: string;
  lane: SituationGraphLane;
};

export type SituationGraphPolicy = {
  policy_id: string;
  kind: SituationGraphPolicyKind;
  config: Record<string, unknown>;
};

export type SituationRoomGraph = {
  schema: typeof HELIX_SITUATION_GRAPH_SCHEMA;
  graph_id: string;
  room_id: string;
  title: string;
  nodes: SituationGraphNode[];
  edges: SituationGraphEdge[];
  policies: SituationGraphPolicy[];
  created_at: string;
  updated_at: string;
};
