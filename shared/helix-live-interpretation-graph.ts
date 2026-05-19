export const HELIX_LIVE_INTERPRETATION_GRAPH_SCHEMA =
  "helix.live_interpretation_graph.v1" as const;

export type HelixLiveInterpretationGraphRelation =
  | "seeded_by"
  | "observed_in"
  | "emitted_by"
  | "supports"
  | "reinforces"
  | "contradicts"
  | "supersedes"
  | "expires"
  | "derived_from"
  | "reviewed_by"
  | "blocked_by_gate";

export type HelixLiveInterpretationGraph = {
  schema: typeof HELIX_LIVE_INTERPRETATION_GRAPH_SCHEMA;
  graph_id: string;
  interpretation_run_id: string;
  situation_run_id: string;
  thread_id: string;
  nodes: string[];
  edges: Array<{
    from: string;
    to: string;
    relation: HelixLiveInterpretationGraphRelation;
    weight?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
