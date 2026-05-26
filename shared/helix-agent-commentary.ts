export const HELIX_AGENT_COMMENTARY_SCHEMA = "helix.agent_commentary.v1" as const;
export const HELIX_DOTTIE_OBSERVER_SUBSCRIPTION_SCHEMA = "helix.dottie_observer_subscription.v1" as const;
export const HELIX_DOTTIE_VOICE_RECEIPT_SCHEMA = "helix.dottie_voice_receipt.v1" as const;

export type HelixAgentCommentaryPhase =
  | "orientation"
  | "route_admission"
  | "evidence_plan"
  | "tool_start"
  | "fail_closed"
  | "final_ready";

export type HelixAgentCommentaryCertaintyClass =
  | "unknown"
  | "hypothesis"
  | "reasoned"
  | "confirmed";

export type HelixAgentCommentaryV1 = {
  schema: typeof HELIX_AGENT_COMMENTARY_SCHEMA;
  source_agent_id: string;
  turn_id: string;
  trace_id: string;
  phase: HelixAgentCommentaryPhase;
  text: string;
  certainty_class: HelixAgentCommentaryCertaintyClass;
  source_authority: "solver_public_commentary";
  assistant_answer: false;
  raw_reasoning_included: false;
};

export type HelixDottieObserverSubscriptionV1 = {
  schema: typeof HELIX_DOTTIE_OBSERVER_SUBSCRIPTION_SCHEMA;
  observer_id: string;
  observer_profile: string;
  target_run_id: string;
  target_agent_id: string;
  target_turn_id?: string | null;
  thread_id?: string | null;
  voice_mode: string;
  max_chars: number;
  event_filter: string[];
  status: "active" | "detached";
  authority: "witness_only";
  can_execute_tools: false;
  assistant_answer: false;
  raw_reasoning_included: false;
};

export type HelixDottieVoiceReceiptV1 = {
  schema: typeof HELIX_DOTTIE_VOICE_RECEIPT_SCHEMA;
  observer_id: string;
  target_agent_id: string;
  target_turn_id?: string | null;
  source_event_id: string;
  source_event_schema: string;
  spoken_text: string;
  spoken_text_hash: string;
  source_text_hash: string;
  transform: {
    citation_stripped: boolean;
    truncated: boolean;
    max_chars: number;
  };
  certainty_parity_ok: boolean;
  evidence_parity_ok: boolean;
  spoken: boolean;
  assistant_answer: false;
  authority: "witness_only";
  raw_reasoning_included: false;
};

const DEFAULT_DOTTIE_MAX_CHARS = 220;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function clipDottieVoiceText(value: unknown, maxChars = DEFAULT_DOTTIE_MAX_CHARS): string {
  const text = asNonEmptyString(value) ?? "";
  const boundedMax = Math.max(24, Math.min(500, Math.floor(Number.isFinite(maxChars) ? maxChars : DEFAULT_DOTTIE_MAX_CHARS)));
  if (text.length <= boundedMax) return text;
  return `${text.slice(0, Math.max(0, boundedMax - 3)).trimEnd()}...`;
}

export function hashDottieWitnessText(value: unknown): string {
  const text = asNonEmptyString(value) ?? "";
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (const char of text) {
    hash ^= BigInt(char.codePointAt(0) ?? 0);
    hash = (hash * prime) & mask;
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

export function isHelixAgentCommentary(value: unknown): value is HelixAgentCommentaryV1 {
  const record = asRecord(value);
  return (
    record?.schema === HELIX_AGENT_COMMENTARY_SCHEMA &&
    asNonEmptyString(record.source_agent_id) !== null &&
    asNonEmptyString(record.turn_id) !== null &&
    asNonEmptyString(record.trace_id) !== null &&
    asNonEmptyString(record.text) !== null &&
    record.assistant_answer === false &&
    record.raw_reasoning_included === false &&
    record.source_authority === "solver_public_commentary"
  );
}

export function buildDottieVoiceReceipt(input: {
  observer_id?: string | null;
  target_agent_id?: string | null;
  target_turn_id?: string | null;
  source_event_id: string;
  source_event_schema?: string | null;
  source_text: string;
  max_chars?: number | null;
  spoken?: boolean;
}): HelixDottieVoiceReceiptV1 {
  const maxChars = Math.max(24, Math.min(500, Math.floor(input.max_chars ?? DEFAULT_DOTTIE_MAX_CHARS)));
  const spokenText = clipDottieVoiceText(input.source_text, maxChars);
  return {
    schema: HELIX_DOTTIE_VOICE_RECEIPT_SCHEMA,
    observer_id: input.observer_id?.trim() || "observer:dottie:unassigned",
    target_agent_id: input.target_agent_id?.trim() || "agent:helix_ask",
    target_turn_id: input.target_turn_id?.trim() || null,
    source_event_id: input.source_event_id,
    source_event_schema: input.source_event_schema?.trim() || HELIX_AGENT_COMMENTARY_SCHEMA,
    spoken_text: spokenText,
    spoken_text_hash: hashDottieWitnessText(spokenText),
    source_text_hash: hashDottieWitnessText(input.source_text),
    transform: {
      citation_stripped: false,
      truncated: spokenText !== input.source_text,
      max_chars: maxChars,
    },
    certainty_parity_ok: true,
    evidence_parity_ok: true,
    spoken: input.spoken ?? false,
    assistant_answer: false,
    authority: "witness_only",
    raw_reasoning_included: false,
  };
}
