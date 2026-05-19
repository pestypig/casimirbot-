import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";
import type { HelixSourceBindingStatus } from "@shared/helix-source-binding-status";
import { appendSourceBindingStatusLedger, getSourceBindingStatus } from "../situation-room/source-binding-status-store";

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
  evidenceSelection?: HelixSituationEvidenceSelection | null;
  sourceBindingStatuses?: HelixSourceBindingStatus[] | null;
  terminalText?: string | null;
}): HelixTerminalArtifactSelectionGuard {
  const terminalArtifactKind = input.terminalArtifactKind?.trim() || "unknown";
  const selectedStatusRefs = input.evidenceSelection?.selected_source_binding_status_refs ?? [];
  const selectedStatusRefSet = new Set(selectedStatusRefs);
  const selectedStatuses = input.sourceBindingStatuses?.length
    ? input.sourceBindingStatuses.filter((status: HelixSourceBindingStatus) =>
        selectedStatusRefSet.size === 0 || selectedStatusRefSet.has(status.status_id)
      )
    : selectedStatusRefs.map((ref: string) => getSourceBindingStatus(ref)).filter((status: HelixSourceBindingStatus | null): status is HelixSourceBindingStatus => Boolean(status));
  const forbidden = input.contract.forbidden_terminal_artifact_kinds.includes(terminalArtifactKind);
  const routeAllowed =
    !forbidden &&
    (
      input.contract.allowed_terminal_artifact_kinds.length === 0 ||
      input.contract.allowed_terminal_artifact_kinds.includes(terminalArtifactKind)
    );
  const requiresSourceGate = selectedStatusRefs.length > 0 || selectedStatuses.length > 0;
  const hasSelectedSource = selectedStatuses.length > 0;
  const selectedSourcesBound = selectedStatuses.every((status: HelixSourceBindingStatus) => status.state === "bound" || status.state === "repair_applied");
  const terminalText = input.terminalText ?? "";
  const sourceRefsShown = !requiresSourceGate || /\bSource refs\s*:/i.test(terminalText);
  const allowed = routeAllowed && (!requiresSourceGate || (hasSelectedSource && selectedSourcesBound && sourceRefsShown));
  const reason = allowed
    ? "terminal_artifact_satisfies_route_product_contract"
    : forbidden
      ? "terminal_artifact_forbidden_by_route_product_contract"
      : requiresSourceGate && !hasSelectedSource
        ? "terminal_source_binding_status_missing"
        : requiresSourceGate && !selectedSourcesBound
          ? "terminal_source_binding_status_not_bound"
          : requiresSourceGate && !sourceRefsShown
            ? "terminal_output_missing_selected_source_refs"
      : "terminal_artifact_not_allowed_by_route_product_contract";
  for (const status of selectedStatuses) {
    appendSourceBindingStatusLedger({
      thread_id: status.thread_id,
      source_id: status.source_id,
      source_kind: status.source_kind,
      situation_run_id: status.situation_run_id,
      environment_id: status.environment_id,
      binding_id: status.binding_id,
      from_state: status.state,
      to_state: status.state,
      event_kind: allowed ? "terminal_selection_allowed" : "terminal_selection_rejected",
      reason,
      evidence_refs: [terminalArtifactKind, ...(input.evidenceSelection?.selected_observation_refs ?? [])],
    });
  }
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
