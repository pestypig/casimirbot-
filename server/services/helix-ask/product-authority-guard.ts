import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import type { HelixToolCallAdmissionDecision } from "@shared/helix-tool-call-admission";
import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixTerminalArtifactSelectionGuard } from "./terminal-artifact-selection-guard";

export type HelixProductAuthorityGuard = {
  schema: "helix.product_authority_guard.v1";
  terminal_artifact_kind: string;
  source_target: string;
  allowed: boolean;
  reason: string;
  rejected_terminal_candidate?: {
    terminal_artifact_kind: string;
    reason: string;
    source_target: string;
    assistant_answer: false;
    raw_content_included: false;
  } | null;
  assistant_answer: false;
  raw_content_included: false;
};

export function guardProductAuthority(input: {
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  toolCallAdmissionDecision?: HelixToolCallAdmissionDecision | Record<string, unknown> | null;
  routeProductContract?: HelixRouteProductContract | Record<string, unknown> | null;
  terminalArtifactSelectionGuard?: HelixTerminalArtifactSelectionGuard | Record<string, unknown> | null;
  terminalArtifactKind: string | null | undefined;
}): HelixProductAuthorityGuard {
  const terminalArtifactKind = input.terminalArtifactKind?.trim() || "unknown";
  const sourceTarget = String(
    (input.sourceTargetIntent as Record<string, unknown> | null | undefined)?.target_source ??
    (input.routeProductContract as Record<string, unknown> | null | undefined)?.source_target ??
    (input.toolCallAdmissionDecision as Record<string, unknown> | null | undefined)?.source_target ??
    "unknown",
  );
  const toolForbidden = Array.isArray((input.toolCallAdmissionDecision as Record<string, unknown> | null | undefined)?.forbidden_terminal_artifact_kinds)
    ? (input.toolCallAdmissionDecision as Record<string, unknown>).forbidden_terminal_artifact_kinds as string[]
    : [];
  const routeAllowed = Boolean((input.terminalArtifactSelectionGuard as Record<string, unknown> | null | undefined)?.allowed ?? true);
  const forbiddenByToolAdmission = toolForbidden.includes(terminalArtifactKind);
  const allowed = routeAllowed && !forbiddenByToolAdmission;
  const reason = allowed
    ? "terminal_product_authorized_by_source_target_tool_admission_and_route_contract"
    : forbiddenByToolAdmission
      ? "terminal_product_forbidden_by_tool_call_admission"
      : "terminal_product_rejected_by_route_product_contract";
  return {
    schema: "helix.product_authority_guard.v1",
    terminal_artifact_kind: terminalArtifactKind,
    source_target: sourceTarget,
    allowed,
    reason,
    rejected_terminal_candidate: allowed
      ? null
      : {
          terminal_artifact_kind: terminalArtifactKind,
          reason,
          source_target: sourceTarget,
          assistant_answer: false,
          raw_content_included: false,
        },
    assistant_answer: false,
    raw_content_included: false,
  };
}
