import crypto from "node:crypto";
import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import type { HelixToolCallAdmissionDecision } from "@shared/helix-tool-call-admission";
import type { HelixTerminalArtifactSelectionGuard } from "./terminal-artifact-selection-guard";
import type { HelixProductAuthorityGuard } from "./product-authority-guard";

export type HelixRouteAuthorityViolationCode =
  | "terminal_product_authority_mismatch"
  | "receipt_used_as_content_answer"
  | "client_projection_used_as_answer"
  | "process_graph_used_as_visual_evidence"
  | "pipeline_status_used_as_live_cognition"
  | "model_only_used_for_source_targeted_turn"
  | "no_tool_direct_used_for_hard_source_target"
  | "procedure_memory_bypassed"
  | "repo_evidence_bypassed"
  | "visual_evidence_bypassed";

export type HelixRouteAuthorityAudit = {
  schema: "helix.route_authority_audit.v1";
  audit_id: string;
  turn_id: string;
  prompt_hash: string;
  source_target: string;
  target_kind: string;
  selected_route: string;
  terminal_artifact_kind: string;
  final_answer_source: string;
  route_product_precedence_reason: string;
  allowed_terminal_artifact_kinds: string[];
  forbidden_terminal_artifact_kinds: string[];
  terminal_artifact_allowed: boolean;
  route_authority_ok: boolean;
  route_authority_violation_code: HelixRouteAuthorityViolationCode | null;
  assistant_answer: false;
  raw_content_included: false;
};

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const sourceTargeted = new Set([
  "visual_capture",
  "procedure_memory",
  "situation_epoch",
  "visual_scene_memory",
  "repo_code",
  "runtime_evidence",
  "docs_viewer",
  "active_doc",
  "process_graph",
  "live_pipeline",
  "world_event",
  "active_note",
]);

const classifyViolation = (input: {
  sourceTarget: string;
  targetKind: string;
  selectedRoute: string;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  terminalArtifactAllowed: boolean;
}): HelixRouteAuthorityViolationCode | null => {
  const terminal = input.terminalArtifactKind;
  const route = input.selectedRoute;
  const sourceTarget = input.sourceTarget;
  const targetKind = input.targetKind;

  if (!input.terminalArtifactAllowed) return "terminal_product_authority_mismatch";
  if (terminal === "client_projection" || input.finalAnswerSource === "client_projection") return "client_projection_used_as_answer";
  if (sourceTargeted.has(sourceTarget) && terminal === "model_only_concept") return "model_only_used_for_source_targeted_turn";
  if (sourceTargeted.has(sourceTarget) && terminal === "no_tool_direct") return "no_tool_direct_used_for_hard_source_target";
  if ((sourceTarget === "visual_capture" || /visual|screen|capture/i.test(route)) && terminal === "process_graph_overview") {
    return "process_graph_used_as_visual_evidence";
  }
  if ((sourceTarget === "visual_capture" || sourceTarget === "procedure_memory" || targetKind === "situation_epoch") && terminal === "live_pipeline_receipt") {
    return "receipt_used_as_content_answer";
  }
  if ((sourceTarget === "visual_capture" || sourceTarget === "procedure_memory" || targetKind === "situation_epoch") && route === "live_pipeline_control") {
    return "pipeline_status_used_as_live_cognition";
  }
  if ((sourceTarget === "procedure_memory" || targetKind === "situation_epoch") && terminal !== "procedure_epoch_replay" && terminal !== "visual_scene_comparison_result" && terminal !== "typed_failure") {
    return "procedure_memory_bypassed";
  }
  if ((sourceTarget === "repo_code" || sourceTarget === "runtime_evidence") && terminal !== "repo_code_evidence_answer" && terminal !== "repo_entity_definition" && terminal !== "typed_failure") {
    return "repo_evidence_bypassed";
  }
  if (sourceTarget === "visual_capture" && terminal === "live_pipeline_receipt") return "visual_evidence_bypassed";
  return null;
};

export function auditRouteAuthority(input: {
  turnId: string;
  promptText: string;
  selectedRoute: string;
  terminalArtifactKind: string | null | undefined;
  finalAnswerSource: string | null | undefined;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  routeProductContract?: HelixRouteProductContract | Record<string, unknown> | null;
  toolCallAdmissionDecision?: HelixToolCallAdmissionDecision | Record<string, unknown> | null;
  terminalArtifactSelectionGuard?: HelixTerminalArtifactSelectionGuard | Record<string, unknown> | null;
  productAuthorityGuard?: HelixProductAuthorityGuard | Record<string, unknown> | null;
}): HelixRouteAuthorityAudit {
  const sourceTargetRecord = input.sourceTargetIntent as Record<string, unknown> | null | undefined;
  const contract = input.routeProductContract as Record<string, unknown> | null | undefined;
  const selectionGuard = input.terminalArtifactSelectionGuard as Record<string, unknown> | null | undefined;
  const productGuard = input.productAuthorityGuard as Record<string, unknown> | null | undefined;
  const sourceTarget = readString(sourceTargetRecord?.target_source) || readString(contract?.source_target) || "unknown";
  const targetKind = readString(sourceTargetRecord?.target_kind) || sourceTarget;
  const terminalArtifactKind = readString(input.terminalArtifactKind) || "unknown";
  const finalAnswerSource = readString(input.finalAnswerSource) || "unknown";
  const allowedTerminalArtifactKinds = readStringArray(contract?.allowed_terminal_artifact_kinds);
  const forbiddenTerminalArtifactKinds = readStringArray(contract?.forbidden_terminal_artifact_kinds);
  const terminalArtifactAllowed =
    selectionGuard?.allowed !== false &&
    productGuard?.allowed !== false &&
    !forbiddenTerminalArtifactKinds.includes(terminalArtifactKind) &&
    (allowedTerminalArtifactKinds.length === 0 || allowedTerminalArtifactKinds.includes(terminalArtifactKind));
  const violationCode = classifyViolation({
    sourceTarget,
    targetKind,
    selectedRoute: input.selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    terminalArtifactAllowed,
  });
  return {
    schema: "helix.route_authority_audit.v1",
    audit_id: `route-authority:${hashShort([input.turnId, input.promptText, sourceTarget, input.selectedRoute, terminalArtifactKind])}`,
    turn_id: input.turnId,
    prompt_hash: hashShort(input.promptText),
    source_target: sourceTarget,
    target_kind: targetKind,
    selected_route: input.selectedRoute,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    route_product_precedence_reason: readString(contract?.precedence_reason),
    allowed_terminal_artifact_kinds: allowedTerminalArtifactKinds,
    forbidden_terminal_artifact_kinds: forbiddenTerminalArtifactKinds,
    terminal_artifact_allowed: terminalArtifactAllowed,
    route_authority_ok: terminalArtifactAllowed && violationCode === null,
    route_authority_violation_code: violationCode,
    assistant_answer: false,
    raw_content_included: false,
  };
}
