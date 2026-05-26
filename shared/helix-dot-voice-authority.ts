import { createHash } from "node:crypto";
import {
  HELIX_TERMINAL_AUTHORITY_SCHEMA,
  type HelixTerminalAuthority,
} from "./helix-turn-poison-guard";

export type DotVoiceAuthorityState =
  | "transcribe_only"
  | "status_voice"
  | "callout_voice"
  | "command_confirm"
  | "command_execute";

export type AcceptedArbitrationCandidate = {
  schema: "helix.accepted_arbitration_candidate.v1";
  candidate_id: string;
  arbiter_id: string;
  accepted_at: string;
  expires_at?: string | null;
  status: "accepted";
  voice_authority_state: "callout_voice";
  source_kind: "operator_callout_v1" | "terminal_answer_authority" | "solver_public_commentary";
  source_event_ids: string[];
  evidence_refs: string[];
  text_certainty: "reasoned" | "confirmed";
  voice_certainty: "unknown" | "reasoned" | "confirmed";
  text_hash: string;
  normalized_text_preview: string;
  suppression_reason?: null;
  server_authoritative: true;
};

export type DotVoiceSourceSuppressionReason =
  | "transcribe_only"
  | "missing_terminal_authority"
  | "invalid_terminal_authority"
  | "terminal_text_hash_mismatch"
  | "terminal_kind_not_speakable"
  | "legacy_context_pack_not_speakable"
  | "raw_observation_not_speakable"
  | "raw_transcript_not_speakable"
  | "process_graph_summary_not_speakable"
  | "field_hypothesis_not_speakable"
  | "missing_accepted_arbitration_candidate"
  | "invalid_accepted_arbitration_candidate"
  | "candidate_not_accepted"
  | "candidate_expired"
  | "candidate_text_hash_mismatch"
  | "candidate_evidence_missing"
  | "command_execute_not_voice";

export type DotVoiceSourceDecision =
  | {
      ok: true;
      state: "status_voice" | "callout_voice";
      speak_text_hash: string;
      evidence_refs: string[];
      source_kind: "terminal_answer_authority" | "accepted_arbitration_candidate";
    }
  | {
      ok: false;
      reason: DotVoiceSourceSuppressionReason;
    };

const SPEAKABLE_TERMINAL_KINDS = new Set([
  "answer",
  "request_user_input",
  "workspace_action_receipt",
  "tool_evaluation",
  "failure",
]);

const LEGACY_TERMINAL_KINDS = new Set([
  "situation_context_pack",
  "live_answer_environment",
]);

const RAW_SOURCE_KINDS = new Set([
  "raw_observation",
  "raw_transcript",
  "live_voice_observation",
  "process_graph_summary",
  "legacy_context_pack",
  "compact_context_pack",
  "field_hypothesis",
  "ui_projection",
]);

const CERTAINTY_RANK: Record<string, number> = {
  unknown: 0,
  hypothesis: 1,
  reasoned: 2,
  confirmed: 3,
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

export function hashDotVoiceSourceText(value: unknown): string {
  return createHash("sha256").update(normalizeText(value)).digest("hex");
}

function classifyTerminalSuppression(authority: Record<string, unknown>): DotVoiceSourceSuppressionReason | null {
  const source = [
    authority.source_kind,
    authority.terminal_kind,
    authority.terminal_artifact_kind,
    authority.final_answer_source,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean)
    .join("|");

  if (/\braw_transcript\b/.test(source)) return "raw_transcript_not_speakable";
  if (/\b(?:raw_observation|live_voice_observation)\b/.test(source)) return "raw_observation_not_speakable";
  if (/\bprocess_graph_summary\b/.test(source)) return "process_graph_summary_not_speakable";
  if (/\bfield_hypothesis\b/.test(source)) return "field_hypothesis_not_speakable";
  if (/\b(?:legacy_context_pack|compact_context_pack|situation_context_pack|live_answer_environment)\b/.test(source)) {
    return "legacy_context_pack_not_speakable";
  }
  return null;
}

function classifySourceKindSuppression(sourceKind: unknown): DotVoiceSourceSuppressionReason | null {
  const normalized = normalizeText(sourceKind).toLowerCase();
  if (!normalized || !RAW_SOURCE_KINDS.has(normalized)) return null;
  if (normalized === "raw_transcript") return "raw_transcript_not_speakable";
  if (normalized === "raw_observation" || normalized === "live_voice_observation") {
    return "raw_observation_not_speakable";
  }
  if (normalized === "process_graph_summary") return "process_graph_summary_not_speakable";
  if (normalized === "field_hypothesis") return "field_hypothesis_not_speakable";
  return "legacy_context_pack_not_speakable";
}

function authorizeTerminalAuthority(input: {
  text: string;
  terminalAuthority: unknown;
  sourceTextHash?: unknown;
  terminalVoiceTextHash?: unknown;
  currentThreadId?: string | null;
  currentTurnId?: string | null;
}): DotVoiceSourceDecision {
  const terminal = readRecord(input.terminalAuthority);
  if (!terminal) return { ok: false, reason: "missing_terminal_authority" };

  const terminalSuppression = classifyTerminalSuppression(terminal);
  if (terminalSuppression) return { ok: false, reason: terminalSuppression };

  if (
    terminal.schema !== HELIX_TERMINAL_AUTHORITY_SCHEMA ||
    terminal.server_authoritative !== true ||
    typeof terminal.thread_id !== "string" ||
    !terminal.thread_id.trim() ||
    typeof terminal.route !== "string" ||
    !terminal.route.trim()
  ) {
    return { ok: false, reason: "invalid_terminal_authority" };
  }

  if (input.currentThreadId && terminal.thread_id !== input.currentThreadId) {
    return { ok: false, reason: "invalid_terminal_authority" };
  }
  if (input.currentTurnId && terminal.turn_id && terminal.turn_id !== input.currentTurnId) {
    return { ok: false, reason: "invalid_terminal_authority" };
  }

  const route = normalizeText(terminal.route);
  if (!/^\/(?:api\/)?ask(?:\/|$)/.test(route)) {
    return { ok: false, reason: "invalid_terminal_authority" };
  }

  const terminalKind = normalizeText(terminal.terminal_kind) as HelixTerminalAuthority["terminal_kind"];
  if (LEGACY_TERMINAL_KINDS.has(terminalKind)) {
    return { ok: false, reason: "legacy_context_pack_not_speakable" };
  }
  if (!SPEAKABLE_TERMINAL_KINDS.has(terminalKind)) {
    return { ok: false, reason: "terminal_kind_not_speakable" };
  }

  const artifactKind = normalizeText(terminal.terminal_artifact_kind);
  const finalAnswerSource = normalizeText(terminal.final_answer_source);
  if (!artifactKind || artifactKind === "unknown") {
    return { ok: false, reason: "invalid_terminal_authority" };
  }
  if ((!finalAnswerSource || finalAnswerSource === "unknown") && terminalKind !== "failure") {
    return { ok: false, reason: "invalid_terminal_authority" };
  }

  const speakTextHash = hashDotVoiceSourceText(input.text);
  if (
    (input.sourceTextHash && normalizeText(input.sourceTextHash) !== speakTextHash) ||
    (input.terminalVoiceTextHash && normalizeText(input.terminalVoiceTextHash) !== speakTextHash)
  ) {
    return { ok: false, reason: "terminal_text_hash_mismatch" };
  }
  if (normalizeText(terminal.terminal_text_hash) !== speakTextHash) {
    return { ok: false, reason: "terminal_text_hash_mismatch" };
  }

  const evidenceRefs = readStringArray(terminal.evidence_refs ?? terminal.evidenceRefs);
  return {
    ok: true,
    state: "status_voice",
    speak_text_hash: speakTextHash,
    evidence_refs: evidenceRefs,
    source_kind: "terminal_answer_authority",
  };
}

function authorizeAcceptedCandidate(input: {
  text: string;
  candidate: unknown;
  sourceTextHash?: unknown;
  nowMs?: number;
}): DotVoiceSourceDecision {
  const candidate = readRecord(input.candidate);
  if (!candidate) return { ok: false, reason: "missing_accepted_arbitration_candidate" };

  const sourceKind = normalizeText(candidate.source_kind).toLowerCase();
  const sourceKindSuppression = classifySourceKindSuppression(sourceKind);
  if (sourceKindSuppression) return { ok: false, reason: sourceKindSuppression };
  if (
    sourceKind !== "operator_callout_v1" &&
    sourceKind !== "terminal_answer_authority" &&
    sourceKind !== "solver_public_commentary"
  ) {
    return { ok: false, reason: "invalid_accepted_arbitration_candidate" };
  }

  const textCertainty = normalizeText(candidate.text_certainty);
  const voiceCertainty = normalizeText(candidate.voice_certainty);
  if (textCertainty === "hypothesis" || voiceCertainty === "hypothesis") {
    return { ok: false, reason: "field_hypothesis_not_speakable" };
  }

  if (
    candidate.schema !== "helix.accepted_arbitration_candidate.v1" ||
    candidate.server_authoritative !== true ||
    candidate.voice_authority_state !== "callout_voice"
  ) {
    return { ok: false, reason: "invalid_accepted_arbitration_candidate" };
  }

  if (candidate.status !== "accepted") {
    return { ok: false, reason: "candidate_not_accepted" };
  }

  const expiresAt = normalizeText(candidate.expires_at);
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt);
    const nowMs = input.nowMs ?? Date.now();
    if (Number.isFinite(expiresMs) && expiresMs <= nowMs) {
      return { ok: false, reason: "candidate_expired" };
    }
  }

  if (textCertainty !== "reasoned" && textCertainty !== "confirmed") {
    return { ok: false, reason: "field_hypothesis_not_speakable" };
  }
  if (voiceCertainty !== "unknown" && voiceCertainty !== "reasoned" && voiceCertainty !== "confirmed") {
    return { ok: false, reason: "invalid_accepted_arbitration_candidate" };
  }
  if ((CERTAINTY_RANK[voiceCertainty] ?? 99) > (CERTAINTY_RANK[textCertainty] ?? -1)) {
    return { ok: false, reason: "invalid_accepted_arbitration_candidate" };
  }

  const sourceEventIds = readStringArray(candidate.source_event_ids);
  const evidenceRefs = readStringArray(candidate.evidence_refs);
  if (sourceEventIds.length === 0 || evidenceRefs.length === 0) {
    return { ok: false, reason: "candidate_evidence_missing" };
  }

  const speakTextHash = hashDotVoiceSourceText(input.text);
  if (input.sourceTextHash && normalizeText(input.sourceTextHash) !== speakTextHash) {
    return { ok: false, reason: "candidate_text_hash_mismatch" };
  }
  if (normalizeText(candidate.text_hash) !== speakTextHash) {
    return { ok: false, reason: "candidate_text_hash_mismatch" };
  }

  return {
    ok: true,
    state: "callout_voice",
    speak_text_hash: speakTextHash,
    evidence_refs: evidenceRefs,
    source_kind: "accepted_arbitration_candidate",
  };
}

export function authorizeDotVoiceSource(input: {
  text: string;
  voiceAuthorityState?: DotVoiceAuthorityState | null;
  terminalAnswerAuthority?: unknown;
  acceptedArbitrationCandidate?: unknown;
  sourceKind?: unknown;
  sourceTextHash?: unknown;
  terminalVoiceTextHash?: unknown;
  currentThreadId?: string | null;
  currentTurnId?: string | null;
  nowMs?: number;
}): DotVoiceSourceDecision {
  const sourceKindSuppression = classifySourceKindSuppression(input.sourceKind);
  if (sourceKindSuppression) return { ok: false, reason: sourceKindSuppression };

  const state = input.voiceAuthorityState ?? "transcribe_only";
  if (state === "transcribe_only") return { ok: false, reason: "transcribe_only" };
  if (state === "command_execute" || state === "command_confirm") {
    return { ok: false, reason: "command_execute_not_voice" };
  }
  if (state === "status_voice") {
    return authorizeTerminalAuthority({
      text: input.text,
      terminalAuthority: input.terminalAnswerAuthority,
      sourceTextHash: input.sourceTextHash,
      terminalVoiceTextHash: input.terminalVoiceTextHash,
      currentThreadId: input.currentThreadId,
      currentTurnId: input.currentTurnId,
    });
  }
  return authorizeAcceptedCandidate({
    text: input.text,
    candidate: input.acceptedArbitrationCandidate,
    sourceTextHash: input.sourceTextHash,
    nowMs: input.nowMs,
  });
}
