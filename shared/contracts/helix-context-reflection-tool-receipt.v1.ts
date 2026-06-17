export const HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID =
  "helix_context_reflection_tool_receipt" as const;

export const HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION =
  "helix_context_reflection_tool_receipt/v1" as const;

export const HELIX_CONTEXT_ATTACHMENT_KINDS = [
  "ui_region",
  "workstation_panel",
  "live_source_span",
  "micro_reasoner_deck",
  "macro_reasoner_deck",
  "mail_loop_packet",
  "document_span",
  "voice_region",
  "unknown",
] as const;

export const HELIX_CONTEXT_ATTACHMENT_SOURCE_ROLES = [
  "explicit_user_selection",
  "dragged_cutout",
  "hover_region",
  "tool_receipt_ref",
  "live_source_reference",
  "system_projection",
] as const;

export type HelixContextAttachmentKind = (typeof HELIX_CONTEXT_ATTACHMENT_KINDS)[number];
export type HelixContextAttachmentSourceRole = (typeof HELIX_CONTEXT_ATTACHMENT_SOURCE_ROLES)[number];

export type HelixContextRegionV1 = {
  unit: "css_px" | "normalized";
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HelixContextTimeSpanV1 = {
  startMs: number;
  endMs: number;
  expiresAt: string | null;
};

export type HelixContextAttachmentV1 = {
  attachmentId: string;
  kind: HelixContextAttachmentKind;
  sourceRole: HelixContextAttachmentSourceRole;
  label: string | null;
  panelId: string | null;
  sourceId: string | null;
  artifactRef: string | null;
  sourceRefs: string[];
  region: HelixContextRegionV1 | null;
  timeSpan: HelixContextTimeSpanV1 | null;
  contentDigest: string | null;
  excerpt: string | null;
  bounded: boolean;
  stale: boolean;
};

export type HelixContextReflectionRecommendedActionV1 = {
  actionId: string;
  label: string;
  toolFamily: string;
  requiresOperatorCommand: boolean;
  reasonCodes: string[];
};

export type HelixContextReflectionEvidenceV1 = {
  summary: string;
  selectedReferenceRefs: string[];
  likelyToolFamilies: string[];
  missingEvidence: string[];
  claimBoundaries: string[];
  recommendedNextActions: HelixContextReflectionRecommendedActionV1[];
};

export type HelixContextReflectionToolReceiptAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "context_binding_not_answer";
  execution_permission: false;
};

export type HelixContextReflectionToolReceiptV1 = {
  artifactId: typeof HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;
  turnId: string;
  threadId: string | null;
  prompt: string;
  attachments: HelixContextAttachmentV1[];
  reflection: HelixContextReflectionEvidenceV1;
  authority: HelixContextReflectionToolReceiptAuthorityV1;
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "context_binding_not_answer";
  execution_permission: false;
};

type BuildHelixContextReflectionToolReceiptInput = Omit<
  HelixContextReflectionToolReceiptV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "receiptId"
  | "authority"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "panel_generated_answer"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
  | "execution_permission"
> & {
  generatedAt?: string;
  receiptId?: string;
};

const AUTHORITY: HelixContextReflectionToolReceiptAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  panel_generated_answer: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  deterministic_content_role: "context_binding_not_answer",
  execution_permission: false,
};

const FORBIDDEN_CONTEXT_REFLECTION_PATTERNS = [
  /\bterminal answer\b/i,
  /\bexecuted the change\b/i,
  /\bpermission granted\b/i,
  /\bmutated\b/i,
  /\bchanged the microreasoner\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newReceiptId(): string {
  return `helix-context-reflection-tool-receipt:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) issues.push(`${prefix}[${index}] must be a non-empty string`);
  });
}

function validateAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.assistant_answer !== false) issues.push(`${prefix}.assistant_answer must be false`);
  if (value.raw_content_included !== false) issues.push(`${prefix}.raw_content_included must be false`);
  if (value.terminal_eligible !== false) issues.push(`${prefix}.terminal_eligible must be false`);
  if (value.panel_generated_answer !== false) issues.push(`${prefix}.panel_generated_answer must be false`);
  if (value.context_role !== "tool_evidence") issues.push(`${prefix}.context_role must be tool_evidence`);
  if (value.ask_context_policy !== "evidence_only") {
    issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  }
  if (value.deterministic_content_role !== "context_binding_not_answer") {
    issues.push(`${prefix}.deterministic_content_role must be context_binding_not_answer`);
  }
  if (value.execution_permission !== false) issues.push(`${prefix}.execution_permission must be false`);
}

function validateRegion(prefix: string, value: unknown, issues: string[]): void {
  if (value === null) return;
  if (!isRecord(value)) {
    issues.push(`${prefix} must be null or an object`);
    return;
  }
  if (value.unit !== "css_px" && value.unit !== "normalized") issues.push(`${prefix}.unit is invalid`);
  for (const field of ["left", "top", "width", "height"] as const) {
    if (typeof value[field] !== "number" || !Number.isFinite(value[field])) {
      issues.push(`${prefix}.${field} must be a finite number`);
    }
  }
}

function validateTimeSpan(prefix: string, value: unknown, issues: string[]): void {
  if (value === null) return;
  if (!isRecord(value)) {
    issues.push(`${prefix} must be null or an object`);
    return;
  }
  for (const field of ["startMs", "endMs"] as const) {
    if (typeof value[field] !== "number" || !Number.isFinite(value[field])) {
      issues.push(`${prefix}.${field} must be a finite number`);
    }
  }
  if (typeof value.startMs === "number" && typeof value.endMs === "number" && value.endMs < value.startMs) {
    issues.push(`${prefix}.endMs must be greater than or equal to startMs`);
  }
  if (!isNullableString(value.expiresAt)) issues.push(`${prefix}.expiresAt must be a string or null`);
}

function validateAttachment(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.attachmentId)) issues.push(`${prefix}.attachmentId must be a non-empty string`);
  if (!includes(HELIX_CONTEXT_ATTACHMENT_KINDS, value.kind)) issues.push(`${prefix}.kind is invalid`);
  if (!includes(HELIX_CONTEXT_ATTACHMENT_SOURCE_ROLES, value.sourceRole)) {
    issues.push(`${prefix}.sourceRole is invalid`);
  }
  for (const field of ["label", "panelId", "sourceId", "artifactRef", "contentDigest", "excerpt"] as const) {
    if (!isNullableString(value[field])) issues.push(`${prefix}.${field} must be a string or null`);
  }
  validateStringArray(`${prefix}.sourceRefs`, value.sourceRefs, issues);
  validateRegion(`${prefix}.region`, value.region, issues);
  validateTimeSpan(`${prefix}.timeSpan`, value.timeSpan, issues);
  if (typeof value.bounded !== "boolean") issues.push(`${prefix}.bounded must be boolean`);
  if (typeof value.stale !== "boolean") issues.push(`${prefix}.stale must be boolean`);
  if (value.bounded !== true) issues.push(`${prefix}.bounded must be true`);
  if (!value.sourceId && !value.artifactRef && (!Array.isArray(value.sourceRefs) || value.sourceRefs.length === 0)) {
    issues.push(`${prefix} must include sourceId, artifactRef, or sourceRefs`);
  }
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["actionId", "label", "toolFamily"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (typeof value.requiresOperatorCommand !== "boolean") {
    issues.push(`${prefix}.requiresOperatorCommand must be boolean`);
  }
  validateStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
}

function validateReflection(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("reflection must be an object");
    return;
  }
  if (!isNonEmptyString(value.summary)) issues.push("reflection.summary must be a non-empty string");
  for (const field of ["selectedReferenceRefs", "likelyToolFamilies", "missingEvidence", "claimBoundaries"] as const) {
    validateStringArray(`reflection.${field}`, value[field], issues);
  }
  if (!Array.isArray(value.recommendedNextActions)) {
    issues.push("reflection.recommendedNextActions must be an array");
  } else {
    value.recommendedNextActions.forEach((action, index) =>
      validateRecommendedAction(`reflection.recommendedNextActions[${index}]`, action, issues),
    );
  }
}

export function buildHelixContextReflectionToolReceiptV1(
  input: BuildHelixContextReflectionToolReceiptInput,
): HelixContextReflectionToolReceiptV1 {
  return {
    artifactId: HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID,
    schemaVersion: HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptId: input.receiptId ?? newReceiptId(),
    turnId: input.turnId,
    threadId: input.threadId,
    prompt: input.prompt,
    attachments: input.attachments,
    reflection: input.reflection,
    authority: { ...AUTHORITY },
    ...AUTHORITY,
  };
}

export function validateHelixContextReflectionToolReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["helix context reflection tool receipt must be an object"];

  if (value.artifactId !== HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "receiptId", "turnId", "prompt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isNullableString(value.threadId)) issues.push("threadId must be a string or null");
  if (!Array.isArray(value.attachments) || value.attachments.length === 0) {
    issues.push("attachments must be a non-empty array");
  } else {
    value.attachments.forEach((attachment, index) =>
      validateAttachment(`attachments[${index}]`, attachment, issues),
    );
  }
  validateReflection(value.reflection, issues);
  validateAuthority("authority", value.authority, issues);
  validateAuthority("top-level authority", value, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_CONTEXT_REFLECTION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden context-reflection authority text matched: ${pattern.source}`);
  }
  return issues;
}

export function isHelixContextReflectionToolReceiptV1(
  value: unknown,
): value is HelixContextReflectionToolReceiptV1 {
  return validateHelixContextReflectionToolReceiptV1(value).length === 0;
}
