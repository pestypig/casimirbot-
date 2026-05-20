import type { HelixPossibilityNodeKind } from "@shared/helix-environment-possibility-graph";

export type PathmindResearchNodeMapping = {
  pathmind_category: string;
  helix_node_kind: HelixPossibilityNodeKind;
  note: string;
};

export const PATHMIND_RESEARCH_NODE_CATALOG: PathmindResearchNodeMapping[] = [
  { pathmind_category: "flow/control", helix_node_kind: "condition", note: "Used only as validation vocabulary inspiration." },
  { pathmind_category: "sensors", helix_node_kind: "sensor_check", note: "Maps to read-only source checks." },
  { pathmind_category: "world/player navigation", helix_node_kind: "navigation", note: "Represents plausible movement, not backend execution." },
  { pathmind_category: "world/player interaction", helix_node_kind: "interaction", note: "Represents possible interaction with explicit rehearsal gates." },
  { pathmind_category: "GUI/inventory", helix_node_kind: "inventory_action", note: "Models an inventory operation as a dry-run candidate." },
  { pathmind_category: "data/parameters", helix_node_kind: "condition", note: "Stored as Helix args and preconditions." },
];

export const PATHMIND_INTEROP_POLICY = {
  schema: "helix.pathmind_interop_policy.v1",
  imports_pathmind_code: false,
  execution_enabled: false,
  may_execute_live_actions: false,
  requires_explicit_client_install: true,
  requires_server_permission: true,
  requires_user_confirmation: true,
  default_enabled: false,
  assistant_answer: false,
  raw_content_included: false,
} as const;
