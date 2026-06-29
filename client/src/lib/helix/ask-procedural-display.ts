function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readProceduralActionLabel(value: unknown): string {
  const action = readRecord(value);
  if (!action) return "model step";
  const panelId = typeof action.panel_id === "string" && action.panel_id.trim() ? action.panel_id.trim() : "";
  const actionId = typeof action.action_id === "string" && action.action_id.trim() ? action.action_id.trim() : "";
  if (panelId && actionId) return `${panelId}.${actionId}`;
  if (actionId) return actionId;
  return "model step";
}

export type WorkstationIntentStageOutcome =
  | "command_parse"
  | "classifier_match"
  | "deterministic_match"
  | "fallback_timeout_match"
  | "fallback_classifier_error_match"
  | "fallback_low_confidence_match"
  | "no_match_timeout"
  | "no_match_classifier_error"
  | "no_match_low_confidence"
  | "no_match_not_probed";

export function formatWorkstationIntentStageDetail(result: {
  action?: unknown;
  outcome: WorkstationIntentStageOutcome;
}): string {
  const prefix = result.action
    ? "workstation_intent_stage | action_resolved"
    : "workstation_intent_stage | no_action_match";
  const outcomeLabelMap: Record<WorkstationIntentStageOutcome, string> = {
    command_parse: "command_parse",
    classifier_match: "classifier_match",
    deterministic_match: "deterministic_match",
    fallback_timeout_match: "timeout_fallback",
    fallback_classifier_error_match: "classifier_error_fallback",
    fallback_low_confidence_match: "low_confidence_fallback",
    no_match_timeout: "timeout_fallback",
    no_match_classifier_error: "classifier_error",
    no_match_low_confidence: "low_confidence",
    no_match_not_probed: "not_probed",
  };
  return `${prefix} | ${outcomeLabelMap[result.outcome]}`;
}
