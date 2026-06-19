export const NARRATOR_EVENT_SCHEMA = "helix.narrator_event/v1" as const;

export type NarratorSourceKind =
  | "final_answer"
  | "helix_console"
  | "voice_receipt"
  | "workstation_panel"
  | "live_answer"
  | "image_lens"
  | "situation_room"
  | "microdeck"
  | "hover_focus_inspector";

export type NarratorDeliveryMode =
  | "hidden"
  | "visible_only"
  | "confirm_to_speak"
  | "auto_speak";

export type NarratorAuthority =
  | "terminal_answer"
  | "tool_evidence"
  | "panel_observation"
  | "live_observation"
  | "voice_receipt"
  | "inspection_hint";

export type NarratorCertainty = "low" | "medium" | "high";

export type NarratorEventV1 = {
  schemaVersion: typeof NARRATOR_EVENT_SCHEMA;
  eventId: string;
  sourceKind: NarratorSourceKind;
  sourceId: string;
  sourceLabelMessageId?: string;
  text: string;
  language?: string;
  authority: NarratorAuthority;
  assistant_answer: boolean;
  terminal_eligible: boolean;
  certainty?: NarratorCertainty | null;
  evidenceRefs: string[];
  goalId?: string | null;
  goalContextUpdateId?: string | null;
  producedRefs?: string[];
  traceId?: string;
  turnKey?: string;
  rawContentIncluded: boolean;
  speakable: boolean;
  requestedDeliveryMode: NarratorDeliveryMode;
  defaultDeliveryMode: NarratorDeliveryMode;
  dedupeKey: string;
  createdAtMs: number;
};

export const NARRATOR_SOURCE_KINDS: readonly NarratorSourceKind[] = [
  "final_answer",
  "helix_console",
  "voice_receipt",
  "workstation_panel",
  "live_answer",
  "image_lens",
  "situation_room",
  "microdeck",
  "hover_focus_inspector",
];

export const NARRATOR_DELIVERY_MODES: readonly NarratorDeliveryMode[] = [
  "hidden",
  "visible_only",
  "confirm_to_speak",
  "auto_speak",
];

export const NARRATOR_AUTHORITIES: readonly NarratorAuthority[] = [
  "terminal_answer",
  "tool_evidence",
  "panel_observation",
  "live_observation",
  "voice_receipt",
  "inspection_hint",
];

const sourceKinds = new Set<string>(NARRATOR_SOURCE_KINDS);
const deliveryModes = new Set<string>(NARRATOR_DELIVERY_MODES);
const authorities = new Set<string>(NARRATOR_AUTHORITIES);
const certainties = new Set<string>(["low", "medium", "high"]);

const stringArrayIssues = (value: unknown, field: string, options: { requireNonEmpty?: boolean } = {}): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  if (options.requireNonEmpty && value.length === 0) issues.push(`${field} must include at least one reference`);
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      issues.push(`${field}[${index}] must be a non-empty string`);
    }
  });
  return issues;
};

export function validateNarratorEventV1(value: NarratorEventV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== NARRATOR_EVENT_SCHEMA) issues.push("schemaVersion must match narrator event schema");
  if (!value.eventId) issues.push("eventId is required");
  if (!sourceKinds.has(value.sourceKind)) issues.push("sourceKind is invalid");
  if (!value.sourceId) issues.push("sourceId is required");
  if (!value.text.trim()) issues.push("text is required");
  if (!authorities.has(value.authority)) issues.push("authority is invalid");
  issues.push(...stringArrayIssues(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  if (value.goalId !== undefined && value.goalId !== null && !value.goalId.trim()) {
    issues.push("goalId must be a non-empty string or null");
  }
  if (value.goalContextUpdateId !== undefined && value.goalContextUpdateId !== null && !value.goalContextUpdateId.trim()) {
    issues.push("goalContextUpdateId must be a non-empty string or null");
  }
  if (value.producedRefs !== undefined) {
    issues.push(...stringArrayIssues(value.producedRefs, "producedRefs", { requireNonEmpty: true }));
  }
  if (
    value.goalContextUpdateId &&
    Array.isArray(value.evidenceRefs) &&
    !value.evidenceRefs.includes(value.goalContextUpdateId)
  ) {
    issues.push("evidenceRefs must include goalContextUpdateId");
  }
  if (value.goalContextUpdateId) {
    if (!Array.isArray(value.producedRefs)) {
      issues.push("producedRefs must be provided when goalContextUpdateId is present");
    } else {
      if (value.eventId && !value.producedRefs.includes(value.eventId)) {
        issues.push("producedRefs must include eventId");
      }
      if (!value.producedRefs.includes(value.goalContextUpdateId)) {
        issues.push("producedRefs must include goalContextUpdateId");
      }
    }
  }
  if (!deliveryModes.has(value.requestedDeliveryMode)) issues.push("requestedDeliveryMode is invalid");
  if (!deliveryModes.has(value.defaultDeliveryMode)) issues.push("defaultDeliveryMode is invalid");
  if (!value.dedupeKey) issues.push("dedupeKey is required");
  if (!Number.isFinite(value.createdAtMs) || value.createdAtMs <= 0) issues.push("createdAtMs must be a positive timestamp");
  if (value.certainty !== undefined && value.certainty !== null && !certainties.has(value.certainty)) {
    issues.push("certainty is invalid");
  }

  if (value.sourceKind === "final_answer") {
    if (value.authority !== "terminal_answer") issues.push("final_answer requires terminal_answer authority");
    if (value.assistant_answer !== true) issues.push("final_answer requires assistant_answer true");
    if (value.terminal_eligible !== true) issues.push("final_answer requires terminal_eligible true");
  } else {
    if (value.authority === "terminal_answer") issues.push("non-final narrator events must not use terminal_answer authority");
    if (value.assistant_answer !== false) issues.push("non-final narrator events must not be assistant answers");
    if (value.terminal_eligible !== false) issues.push("non-final narrator events must not be terminal eligible");
    if (value.rawContentIncluded !== false) issues.push("non-final narrator events must not include raw content");
  }

  if (value.authority === "inspection_hint" && value.terminal_eligible !== false) {
    issues.push("inspection hints must not be terminal eligible");
  }
  if (value.sourceKind === "voice_receipt" && value.requestedDeliveryMode === "auto_speak") {
    issues.push("voice receipts must not auto-speak");
  }
  if (!value.speakable && value.requestedDeliveryMode === "auto_speak") {
    issues.push("unspeakable events cannot request auto_speak");
  }

  return issues;
}
