export const HELIX_IDEOLOGY_CONTEXT_RECEIPT_SCHEMA = "helix.ideology_context_receipt.v1" as const;
export const HELIX_IDEOLOGY_MOTIVE_COMPARISON_RECEIPT_SCHEMA =
  "helix.ideology_motive_comparison_receipt.v1" as const;

export type IdeologyFramework = "moral" | "mission_ethos" | "custom";

export type IdeologyNodeSummary = {
  node_id: string;
  slug?: string | null;
  title: string;
  excerpt?: string | null;
  tags: string[];
  path: string[];
  evidence_refs: string[];
};

export type IdeologyGuidanceSummary = {
  invariant: "system advises, user decides.";
  detectedBundles: string[];
  recommendedNodeIds: string[];
  warnings: string[];
  recommendedArtifacts: string[];
  suggestedVerificationSteps: string[];
};

export type IdeologyContextReceipt = {
  schema: typeof HELIX_IDEOLOGY_CONTEXT_RECEIPT_SCHEMA;
  ok: boolean;
  action: "open" | "open_node" | "search_nodes" | "build_context";
  panel_id: "mission-ethos";
  node_id?: string | null;
  query?: string | null;
  matches: IdeologyNodeSummary[];
  selected?: IdeologyNodeSummary | null;
  context_policy: "compact_context_only";
  raw_tree_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
  evidence_refs: string[];
  error?: string | null;
};

export type IdeologyMotiveComparisonReceipt = {
  schema: typeof HELIX_IDEOLOGY_MOTIVE_COMPARISON_RECEIPT_SCHEMA;
  ok: boolean;
  panel_id: "mission-ethos";
  motive_text: string;
  framework: IdeologyFramework;
  selected_node_ids: string[];
  nodes: IdeologyNodeSummary[];
  pressure_signals: string[];
  guidance?: IdeologyGuidanceSummary | null;
  comparison_prompt: string;
  boundary: {
    advisory_only: true;
    user_decides: true;
    not_action_authority: true;
  };
  context_policy: "compact_context_only";
  raw_tree_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
  model_invoked: false;
  evidence_refs: string[];
  error?: string | null;
};
