import {
  HELIX_ITEM_ROLE_AUTHORITY,
  type HelixArtifactRole,
  type HelixArtifactRoleAuthority,
} from "@shared/helix-turn-poison-guard";

export type HelixNormalizedArtifactRole = {
  role: HelixArtifactRole;
  authority: HelixArtifactRoleAuthority;
  item_id?: string | null;
  schema?: string | null;
  deterministic: boolean;
  assistant_answer: boolean;
  raw_content_included: boolean;
  raw_logs_included: boolean;
  deterministic_content_role?: string | null;
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean => value === true;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function inferHelixArtifactRole(value: unknown, hint?: HelixArtifactRole): HelixArtifactRole {
  if (hint) return hint;
  const record = asRecord(value);
  if (!record) return "validation";

  const schema = readString(record.schema);
  const kind = readString(record.kind);
  const itemType = readString(record.item_type);
  const contextRole = readString(record.context_role) ?? readString(record.deterministic_content_role);

  if (itemType === "answer" || schema === "helix.assistant_answer.v1") return "assistant_answer";
  if (itemType === "toolObservation" || /toolObservation|tool_observation|receipt_not_assistant_answer/i.test(contextRole ?? "")) {
    return "tool_observation";
  }
  if (itemType === "validation") return "validation";
  if (schema === "helix.selected_evidence_pack.v1") return "validation";
  if (schema === "helix.synthetic_evidence.v1") return "synthetic_evidence";
  if (schema === "helix.subgoal_evaluation.v1" || schema === "helix.reasoning_subgoal_ledger.v1") {
    return "subgoal_evaluation";
  }
  if (schema === "helix.interpreted_event.v1" || schema === "helix.interpreted_event_log_entry.v1") {
    if (kind === "clarification_question") return "request_user_input";
    if (kind === "user_steering" || kind === "steering_applied") return "user_steering";
    return "interpreted_event";
  }
  if (schema === "helix.clarification_question_proposal.v1" || schema === "helix.agentic_request_input.v1") {
    return "request_user_input";
  }
  if (
    schema === "helix.user_steering_event.v1" ||
    schema === "helix.user_steering_evidence.v1" ||
    schema === "helix.steering_memory.v1"
  ) {
    return "user_steering";
  }
  if (schema === "helix.profile_situation_archive.v1") return "profile_archive";
  if (schema === "helix.present_state_card.v1" || /projection/i.test(contextRole ?? "")) return "ui_projection";
  if (schema === "helix.event_journal_record.v1" || schema === "helix.world_event.v1") return "source_event";
  if (/observation_not_assistant_answer|reference_not_assistant_answer/i.test(contextRole ?? "")) {
    return "tool_observation";
  }
  if (/evidence_not_assistant_answer/i.test(contextRole ?? "")) return "synthetic_evidence";
  return "validation";
}

export function normalizeHelixArtifactRole(value: unknown, hint?: HelixArtifactRole): HelixNormalizedArtifactRole {
  const record = asRecord(value);
  const role = inferHelixArtifactRole(value, hint);
  return {
    role,
    authority: HELIX_ITEM_ROLE_AUTHORITY[role],
    item_id:
      readString(record?.item_id) ??
      readString(record?.event_id) ??
      readString(record?.evidence_id) ??
      readString(record?.archive_id) ??
      readString(record?.question_id) ??
      readString(record?.steering_id),
    schema: readString(record?.schema),
    deterministic: record ? record.deterministic !== false : true,
    assistant_answer: readBoolean(record?.assistant_answer) || role === "assistant_answer",
    raw_content_included: readBoolean(record?.raw_content_included),
    raw_logs_included: readBoolean(record?.raw_logs_included),
    deterministic_content_role: readString(record?.deterministic_content_role) ?? readString(record?.context_role),
  };
}
