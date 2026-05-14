import type { HelixArtifactRole, HelixPoisonAuditViolation } from "@shared/helix-turn-poison-guard";
import { normalizeHelixArtifactRole, type HelixNormalizedArtifactRole } from "./context-role-normalizer";

export type QuarantinedHelixArtifact = HelixNormalizedArtifactRole & {
  can_enter_model_context: boolean;
  can_be_assistant_answer: boolean;
  violations: HelixPoisonAuditViolation[];
};

export function quarantineHelixArtifact(value: unknown, roleHint?: HelixArtifactRole): QuarantinedHelixArtifact {
  const normalized = normalizeHelixArtifactRole(value, roleHint);
  const violations: HelixPoisonAuditViolation[] = [];

  if (normalized.deterministic && normalized.assistant_answer && normalized.role !== "assistant_answer") {
    violations.push({
      kind: "deterministic_as_answer",
      item_id: normalized.item_id ?? null,
      summary: `${normalized.role} artifact is deterministic but is marked assistant_answer=true.`,
    });
  }
  if (
    (normalized.raw_content_included || normalized.raw_logs_included) &&
    normalized.authority.can_enter_model_context
  ) {
    violations.push({
      kind: "raw_content_in_context",
      item_id: normalized.item_id ?? null,
      summary: `${normalized.role} artifact includes raw content/logs in normal model context.`,
    });
  }
  if (
    normalized.deterministic &&
    normalized.role !== "assistant_answer" &&
    normalized.role !== "request_user_input" &&
    normalized.role !== "user_steering" &&
    Boolean(normalized.schema) &&
    !normalized.deterministic_content_role &&
    normalized.authority.can_enter_model_context
  ) {
    violations.push({
      kind: "missing_deterministic_content_role",
      item_id: normalized.item_id ?? null,
      summary: `${normalized.role} artifact can enter model context but has no deterministic_content_role/context_role.`,
    });
  }
  if (normalized.role === "ui_projection" && normalized.assistant_answer) {
    violations.push({
      kind: "assistant_history_contains_projection",
      item_id: normalized.item_id ?? null,
      summary: "UI projection was marked as assistant answer.",
    });
  }
  if (normalized.role === "request_user_input" && normalized.assistant_answer) {
    violations.push({
      kind: "clarification_question_as_answer",
      item_id: normalized.item_id ?? null,
      summary: "Clarification/request-user-input artifact was marked as assistant answer.",
    });
  }
  if (normalized.role === "user_steering" && normalized.assistant_answer) {
    violations.push({
      kind: "steering_promoted_to_truth",
      item_id: normalized.item_id ?? null,
      summary: "User steering was marked as assistant answer instead of user-claim evidence.",
    });
  }

  return {
    ...normalized,
    can_enter_model_context: normalized.authority.can_enter_model_context && violations.every((v) => v.kind !== "raw_content_in_context"),
    can_be_assistant_answer: normalized.authority.can_be_assistant_answer,
    violations,
  };
}

export function quarantineHelixArtifacts(values: Array<{ artifact: unknown; role?: HelixArtifactRole }>): QuarantinedHelixArtifact[] {
  return values.map((entry) => quarantineHelixArtifact(entry.artifact, entry.role));
}
