export const HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA =
  "helix.route_product_contract.v1" as const;

export type HelixRouteProductSourceTarget =
  | "visual_capture"
  | "active_doc"
  | "docs_viewer"
  | "active_note"
  | "procedure_memory"
  | "world_event"
  | "workspace_action"
  | "model_only"
  | "unknown";

export type HelixRouteProductContract = {
  schema: typeof HELIX_ROUTE_PRODUCT_CONTRACT_SCHEMA;
  turn_id: string;
  source_target: HelixRouteProductSourceTarget;
  allowed_terminal_artifact_kinds: string[];
  forbidden_terminal_artifact_kinds: string[];
  required_artifact_refs?: string[];
  precedence_reason: string;
  assistant_answer: false;
  raw_content_included: false;
};
