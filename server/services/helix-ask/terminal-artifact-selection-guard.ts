import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";

export type HelixTerminalArtifactSelectionGuard = {
  schema: "helix.terminal_artifact_selection_guard.v1";
  terminal_artifact_kind: string;
  source_target: HelixRouteProductContract["source_target"];
  allowed: boolean;
  reason: string;
  rejected_terminal_candidate?: {
    terminal_artifact_kind: string;
    reason: string;
    source_target: HelixRouteProductContract["source_target"];
    assistant_answer: false;
    raw_content_included: false;
  } | null;
  assistant_answer: false;
  raw_content_included: false;
};

export function guardTerminalArtifactSelection(input: {
  contract: HelixRouteProductContract;
  terminalArtifactKind: string | null | undefined;
}): HelixTerminalArtifactSelectionGuard {
  const terminalArtifactKind = input.terminalArtifactKind?.trim() || "unknown";
  const forbidden = input.contract.forbidden_terminal_artifact_kinds.includes(terminalArtifactKind);
  const allowed =
    !forbidden &&
    (
      input.contract.allowed_terminal_artifact_kinds.length === 0 ||
      input.contract.allowed_terminal_artifact_kinds.includes(terminalArtifactKind)
    );
  const reason = allowed
    ? "terminal_artifact_satisfies_route_product_contract"
    : forbidden
      ? "terminal_artifact_forbidden_by_route_product_contract"
      : "terminal_artifact_not_allowed_by_route_product_contract";
  return {
    schema: "helix.terminal_artifact_selection_guard.v1",
    terminal_artifact_kind: terminalArtifactKind,
    source_target: input.contract.source_target,
    allowed,
    reason,
    rejected_terminal_candidate: allowed
      ? null
      : {
          terminal_artifact_kind: terminalArtifactKind,
          reason,
          source_target: input.contract.source_target,
          assistant_answer: false,
          raw_content_included: false,
        },
    assistant_answer: false,
    raw_content_included: false,
  };
}
