import crypto from "node:crypto";
import {
  VOICE_INTERPRETATION_CONTEXT_SCHEMA,
  type VoiceInterpretationAppliesUntil,
  type VoiceInterpretationCertaintyCeiling,
  type VoiceInterpretationContext,
  type VoiceInterpretationContextDebugSummary,
  type VoiceInterpretationJob,
  type VoiceInterpretationOutputMode,
  type VoiceInterpretationSaliencePolicy,
  type VoiceInterpretationScope,
  type VoiceInterpretationSpeakPolicy,
} from "@shared/voice-interpretation-context";

type VoiceInterpretationContextInput = {
  context_id?: string | null;
  scope?: VoiceInterpretationScope | null;
  thread_id: string;
  turn_id?: string | null;
  persona_profile?: string | null;
  interpretation_job?: VoiceInterpretationJob | null;
  output_mode?: VoiceInterpretationOutputMode | null;
  salience_policy?: VoiceInterpretationSaliencePolicy | null;
  speak_policy?: VoiceInterpretationSpeakPolicy | null;
  max_chars?: number | null;
  certainty_ceiling?: VoiceInterpretationCertaintyCeiling | null;
  applies_until?: VoiceInterpretationAppliesUntil | null;
  evidence_refs?: readonly string[] | null;
  reason_codes?: readonly string[] | null;
};

const activeContextsByThreadId = new Map<string, VoiceInterpretationContext>();

const clampMaxChars = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return 180;
  return Math.max(40, Math.min(500, Math.trunc(value)));
};

const normalizeRequiredToken = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label}_required`);
  return normalized;
};

const normalizeNullableString = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
};

const normalizePersonaProfile = (value: string | null | undefined): string => {
  if (typeof value !== "string") return "none";
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return normalized || "none";
};

const normalizeStringList = (values: readonly string[] | null | undefined, limit: number): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const item = value.trim().slice(0, 180);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    normalized.push(item);
    if (normalized.length >= limit) break;
  }
  return normalized;
};

const buildContextId = (input: Pick<VoiceInterpretationContextInput, "thread_id" | "turn_id" | "persona_profile">): string => {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify([input.thread_id, input.turn_id ?? null, normalizePersonaProfile(input.persona_profile)]))
    .digest("hex")
    .slice(0, 16);
  return `voice_interpretation_context:${hash}`;
};

export const upsertVoiceInterpretationContext = (
  input: VoiceInterpretationContextInput,
): VoiceInterpretationContext => {
  const threadId = normalizeRequiredToken(input.thread_id, "thread_id");
  const previous = activeContextsByThreadId.get(threadId);
  const contextId =
    normalizeNullableString(input.context_id) ??
    previous?.context_id ??
    buildContextId({ ...input, thread_id: threadId });

  const context: VoiceInterpretationContext = {
    schema: VOICE_INTERPRETATION_CONTEXT_SCHEMA,
    context_id: contextId,
    scope: input.scope ?? previous?.scope ?? "chat_session",
    thread_id: threadId,
    turn_id: normalizeNullableString(input.turn_id) ?? previous?.turn_id ?? null,
    persona_profile: normalizePersonaProfile(input.persona_profile ?? previous?.persona_profile ?? "none"),
    interpretation_job: input.interpretation_job ?? previous?.interpretation_job ?? "manual_read_style",
    output_mode: input.output_mode ?? previous?.output_mode ?? "no_voice",
    salience_policy: input.salience_policy ?? previous?.salience_policy ?? "manual_only",
    speak_policy: input.speak_policy ?? previous?.speak_policy ?? "muted",
    max_chars: clampMaxChars(input.max_chars ?? previous?.max_chars ?? 180),
    certainty_ceiling: input.certainty_ceiling ?? previous?.certainty_ceiling ?? "source_answer_snapshot",
    applies_until: input.applies_until ?? previous?.applies_until ?? "explicit_cancel",
    evidence_refs: normalizeStringList(input.evidence_refs ?? previous?.evidence_refs ?? [], 24),
    reason_codes: normalizeStringList(input.reason_codes ?? previous?.reason_codes ?? [], 12),
    assistant_answer: false,
    raw_content_included: false,
    output_authority: "steering_context",
    instruction_authority: "none",
    context_role: "tool_evidence",
  };

  activeContextsByThreadId.set(threadId, context);
  return context;
};

export const getActiveVoiceInterpretationContext = (
  threadId: string | null | undefined,
): VoiceInterpretationContext | null => {
  const normalized = normalizeNullableString(threadId);
  if (!normalized) return null;
  return activeContextsByThreadId.get(normalized) ?? null;
};

export const cancelVoiceInterpretationContext = (
  threadId: string | null | undefined,
): VoiceInterpretationContext | null => {
  const normalized = normalizeNullableString(threadId);
  if (!normalized) return null;
  const previous = activeContextsByThreadId.get(normalized) ?? null;
  activeContextsByThreadId.delete(normalized);
  return previous;
};

export const summarizeVoiceInterpretationContext = (
  context: VoiceInterpretationContext,
): VoiceInterpretationContextDebugSummary => ({
  schema: context.schema,
  context_id: context.context_id,
  scope: context.scope,
  thread_id: context.thread_id,
  turn_id: context.turn_id ?? null,
  persona_profile: context.persona_profile,
  interpretation_job: context.interpretation_job,
  output_mode: context.output_mode,
  salience_policy: context.salience_policy,
  speak_policy: context.speak_policy,
  max_chars: context.max_chars,
  certainty_ceiling: context.certainty_ceiling,
  applies_until: context.applies_until,
  evidence_refs: [...context.evidence_refs],
  reason_codes: [...context.reason_codes],
  assistant_answer: false,
  raw_content_included: false,
  output_authority: "steering_context",
  instruction_authority: "none",
  context_role: "tool_evidence",
});

export const getActiveVoiceInterpretationContextDebugSummary = (
  threadId: string | null | undefined,
): VoiceInterpretationContextDebugSummary | null => {
  const context = getActiveVoiceInterpretationContext(threadId);
  return context ? summarizeVoiceInterpretationContext(context) : null;
};

export const clearVoiceInterpretationContextsForTest = (): void => {
  activeContextsByThreadId.clear();
};
