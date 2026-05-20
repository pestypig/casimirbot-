export const HELIX_FINAL_ROUTE_RECONCILIATION_SCHEMA = "helix.final_route_reconciliation.v1" as const;

export type HelixFinalRouteReconciliationViolationCode =
  | "terminal_authority_route_stale"
  | "terminal_artifact_forbidden_by_final_route"
  | "route_product_contract_mismatch";

export type HelixFinalRouteReconciliation = {
  schema: typeof HELIX_FINAL_ROUTE_RECONCILIATION_SCHEMA;
  turn_id: string;
  ok: boolean;
  final_route: string | null;
  final_route_base: string | null;
  terminal_authority_route: string | null;
  terminal_authority_route_base: string | null;
  selected_terminal_artifact_kind: string | null;
  route_difference_changes_terminal_products: boolean;
  violations: Array<{
    code: HelixFinalRouteReconciliationViolationCode;
    summary: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
};
