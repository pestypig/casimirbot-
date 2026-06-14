import {
  HELIX_ROLLING_SESSION_CONTEXT_PACKET_SCHEMA,
  type HelixRollingSessionContextPacket,
  type HelixContextFidelityMeter,
  type HelixRollingSessionCompactionMode,
} from "../../../shared/helix-rolling-session-context";
import type { HelixTurnAttachmentArtifact } from "../../../shared/helix-multimodal-turn-context";
import type { HelixConversationMemoryPacket } from "../../../shared/helix-conversation-memory-packet";
import { resolveLocalContextTokens } from "../llm/local-runtime";
import { buildHelixThreadState } from "../helix-thread/reducer";
import type { HelixThreadTurn } from "../helix-thread/types";

export type BuildHelixRollingSessionContextPacketInput = {
  threadId: string;
  currentTurnId: string;
  sessionId?: string | null;
  promptText: string;
  attachmentArtifacts?: HelixTurnAttachmentArtifact[] | null;
  conversationMemoryPacket?: HelixConversationMemoryPacket | null;
  modelContextWindowTokens?: number | null;
  maxRetainedTurns?: number;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.floor(value)));

const normalizeText = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const estimateTokens = (value: unknown): number => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return Math.max(0, Math.ceil(text.length / 4));
};

const latestRollingSessionContextByThread = new Map<string, HelixRollingSessionContextPacket>();
const latestRollingSessionContextBySession = new Map<string, HelixRollingSessionContextPacket>();

const textLimit = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_ROLLING_CONTEXT_TEXT_CHARS, 520), 160, 1600);

const summaryLimit = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_ROLLING_CONTEXT_SUMMARY_CHARS, 1200), 320, 4000);

const autoCompactRatio = (): number =>
  Math.max(0.25, Math.min(0.95, readNumber(process.env.HELIX_ASK_ROLLING_CONTEXT_COMPACT_RATIO, 0.8)));

const compactWarningRatio = (): number =>
  Math.max(0.1, Math.min(0.95, readNumber(process.env.HELIX_ASK_CONTEXT_WARNING_RATIO, 0.7)));

const maxRetainedTurns = (override?: number): number =>
  clampNumber(override ?? readNumber(process.env.HELIX_ASK_ROLLING_CONTEXT_MAX_RETAINED_TURNS, 6), 1, 16);

const clip = (value: unknown, limit = textLimit()): string => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const turnText = (turn: HelixThreadTurn): string =>
  [
    turn.user_text ? `user: ${turn.user_text}` : "",
    turn.latest_answer_summary || turn.assistant_text
      ? `assistant: ${turn.latest_answer_summary ?? turn.assistant_text}`
      : "",
    turn.fail_reason ? `failure: ${turn.fail_reason}` : "",
  ].filter(Boolean).join("\n");

const summarizeTurns = (turns: HelixThreadTurn[], limit: number): string => {
  const lines = turns
    .map((turn) => {
      const user = clip(turn.user_text, Math.floor(limit / 4));
      const answer = clip(turn.latest_answer_summary ?? turn.assistant_text, Math.floor(limit / 4));
      const failure = clip(turn.fail_reason, Math.floor(limit / 6));
      return [
        `turn ${turn.turn_id}`,
        user ? `user=${user}` : "",
        answer ? `answer=${answer}` : "",
        failure ? `failure=${failure}` : "",
      ].filter(Boolean).join(" | ");
    })
    .filter(Boolean);
  return clip(lines.join("\n"), limit);
};

const buildContextFidelityMeter = (args: {
  contextWindow: number;
  autoCompactTokenLimit: number;
  activeContextTotal: number;
  compactionMode: HelixRollingSessionCompactionMode;
  retainedTurnIds: string[];
  compactedTurnIds: string[];
  pendingUserInputsCount: number;
  unresolvedTaskFramesCount: number;
  modelVisibleContextIncluded: boolean;
  modelVisibleContextTokenEstimate: number;
  reason: string;
}): HelixContextFidelityMeter => {
  const usageRatio =
    args.contextWindow > 0
      ? Math.round((args.activeContextTotal / args.contextWindow) * 1000) / 1000
      : 0;
  const mode =
    args.compactionMode === "required"
      ? "forced"
      : args.compactionMode === "recommended"
        ? "eligible"
        : "none";
  const handoffState =
    args.compactionMode === "required"
      ? "pause_required"
      : args.compactionMode === "recommended"
        ? "pause_recommended"
        : "idle";
  return {
    schema: "helix.context_fidelity_meter.v1",
    model_context_window_tokens: args.contextWindow,
    active_context_total_tokens: args.activeContextTotal,
    usage_ratio: usageRatio,
    auto_compact_token_limit: args.autoCompactTokenLimit,
    compact_warning_ratio: compactWarningRatio(),
    compaction_mode: mode,
    retained_turn_ids: args.retainedTurnIds,
    compacted_turn_ids: args.compactedTurnIds,
    pending_user_inputs_count: args.pendingUserInputsCount,
    unresolved_task_frames_count: args.unresolvedTaskFramesCount,
    model_visible_context_included: args.modelVisibleContextIncluded,
    model_visible_context_token_estimate: args.modelVisibleContextTokenEstimate,
    raw_history_excluded: true,
    handoff_state: {
      state: handoffState,
      chat_turns_paused: handoffState === "pause_required" || handoffState === "compacting",
      reason: args.reason,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const rememberRollingSessionContextPacket = (packet: HelixRollingSessionContextPacket): void => {
  if (packet.thread_id) latestRollingSessionContextByThread.set(packet.thread_id, packet);
  if (packet.session_id) latestRollingSessionContextBySession.set(packet.session_id, packet);
};

export const getLatestHelixRollingSessionContextPacket = (args?: {
  threadId?: string | null;
  sessionId?: string | null;
}): HelixRollingSessionContextPacket | null => {
  const threadId = normalizeText(args?.threadId);
  const sessionId = normalizeText(args?.sessionId);
  if (threadId && latestRollingSessionContextByThread.has(threadId)) {
    return latestRollingSessionContextByThread.get(threadId) ?? null;
  }
  if (sessionId && latestRollingSessionContextBySession.has(sessionId)) {
    return latestRollingSessionContextBySession.get(sessionId) ?? null;
  }
  return Array.from(latestRollingSessionContextByThread.values()).at(-1) ?? null;
};

export const __resetHelixRollingSessionContextStoreForTest = (): void => {
  latestRollingSessionContextByThread.clear();
  latestRollingSessionContextBySession.clear();
};

const emptyPacket = (args: {
  threadId: string;
  currentTurnId: string;
  sessionId?: string | null;
  promptText: string;
  attachmentArtifacts?: HelixTurnAttachmentArtifact[] | null;
  modelContextWindowTokens: number;
  reason: string;
}): HelixRollingSessionContextPacket => {
  const promptTokens = estimateTokens(args.promptText);
  const attachmentTokens = (args.attachmentArtifacts ?? []).reduce(
    (sum, artifact) => sum + Math.max(0, artifact.estimated_tokens ?? 0),
    0,
  );
  const autoLimit = Math.floor(args.modelContextWindowTokens * autoCompactRatio());
  const packet: HelixRollingSessionContextPacket = {
    schema: HELIX_ROLLING_SESSION_CONTEXT_PACKET_SCHEMA,
    thread_id: args.threadId,
    current_turn_id: args.currentTurnId,
    session_id: args.sessionId ?? null,
    context_scope: "current_thread",
    accounting_version: "v1",
    model_context_window_tokens: args.modelContextWindowTokens,
    auto_compact_token_limit: autoLimit,
    estimated_tokens: {
      current_user_prompt: promptTokens,
      prior_thread_turns: 0,
      retained_turns: 0,
      compacted_summary: 0,
      conversation_memory_packet: 0,
      current_turn_attachments: attachmentTokens,
      active_context_total: promptTokens + attachmentTokens,
    },
    compaction_mode: "none",
    compaction_reason: args.reason,
    full_context_window_limit_reached: false,
    context_fidelity_meter: buildContextFidelityMeter({
      contextWindow: args.modelContextWindowTokens,
      autoCompactTokenLimit: autoLimit,
      activeContextTotal: promptTokens + attachmentTokens,
      compactionMode: "none",
      retainedTurnIds: [],
      compactedTurnIds: [],
      pendingUserInputsCount: 0,
      unresolvedTaskFramesCount: 0,
      modelVisibleContextIncluded: false,
      modelVisibleContextTokenEstimate: promptTokens + attachmentTokens,
      reason: args.reason,
    }),
    retained_turn_ids: [],
    compacted_turn_ids: [],
    dropped_turn_ids: [],
    retained_context_summary: "",
    compacted_context_summary: "",
    model_visible_summary: "",
    missing_or_uncertain: [args.reason],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  rememberRollingSessionContextPacket(packet);
  return packet;
};

export function buildHelixRollingSessionContextPacket(
  input: BuildHelixRollingSessionContextPacketInput,
): HelixRollingSessionContextPacket {
  const threadId = normalizeText(input.threadId);
  const currentTurnId = normalizeText(input.currentTurnId);
  const sessionId = normalizeText(input.sessionId) || null;
  const contextWindow = clampNumber(
    input.modelContextWindowTokens ?? resolveLocalContextTokens(),
    512,
    1_000_000,
  );
  if (!threadId) {
    return emptyPacket({
      threadId,
      currentTurnId,
      sessionId,
      promptText: input.promptText,
      attachmentArtifacts: input.attachmentArtifacts,
      modelContextWindowTokens: contextWindow,
      reason: "No active thread is available for rolling session context.",
    });
  }

  const state = buildHelixThreadState({ threadId });
  const priorTurns = state.turns
    .filter((turn) => turn.turn_id !== currentTurnId)
    .filter((turn) => Boolean(turn.user_text || turn.assistant_text || turn.latest_answer_summary || turn.fail_reason))
    .sort((a, b) => a.last_seq - b.last_seq);

  const promptTokens = estimateTokens(input.promptText);
  const attachmentArtifacts = input.attachmentArtifacts ?? [];
  const attachmentTokens = attachmentArtifacts.reduce(
    (sum, artifact) => sum + Math.max(0, artifact.estimated_tokens ?? 0),
    0,
  );
  const memoryTokens = input.conversationMemoryPacket ? estimateTokens(input.conversationMemoryPacket) : 0;
  const priorTokens = priorTurns.reduce((sum, turn) => sum + estimateTokens(turnText(turn)), 0);
  const retainedTurns = priorTurns.slice(-maxRetainedTurns(input.maxRetainedTurns));
  const compactedTurns = priorTurns.slice(0, Math.max(0, priorTurns.length - retainedTurns.length));
  const retainedSummary = summarizeTurns(retainedTurns, summaryLimit());
  const compactedSummary = summarizeTurns(compactedTurns, summaryLimit());
  const retainedTokens = estimateTokens(retainedSummary);
  const compactedTokens = estimateTokens(compactedSummary);
  const activeContextTotal = promptTokens + attachmentTokens + memoryTokens + retainedTokens + compactedTokens;
  const autoLimit = Math.max(1, Math.floor(contextWindow * autoCompactRatio()));
  const fullLimitReached = activeContextTotal >= contextWindow;
  const compactionMode: HelixRollingSessionCompactionMode =
    fullLimitReached
      ? "required"
      : activeContextTotal >= autoLimit || compactedTurns.length > 0
        ? "recommended"
        : "none";
  const compactionReason =
    compactionMode === "required"
      ? "Estimated rolling context reaches or exceeds the model context window."
      : compactionMode === "recommended"
        ? "Older turns should be represented through compact summaries before model re-entry."
        : "Rolling context fits current compact packet limits.";
  const modelVisibleSummary = clip(
    [
      attachmentArtifacts.length > 0
        ? `Current turn pasted-text attachments:\n${attachmentArtifacts.map((artifact) => artifact.model_visible_summary).join("\n\n")}`
        : "",
      compactedSummary ? `Compacted prior turns:\n${compactedSummary}` : "",
      retainedSummary ? `Retained recent turns:\n${retainedSummary}` : "",
      input.conversationMemoryPacket?.continuity_summary
        ? `Conversation memory: ${input.conversationMemoryPacket.continuity_summary}`
        : "",
    ].filter(Boolean).join("\n\n"),
    summaryLimit() * 2,
  );
  const modelVisibleContextTokens = estimateTokens(modelVisibleSummary) + memoryTokens + promptTokens + attachmentTokens;
  const contextFidelityMeter = buildContextFidelityMeter({
    contextWindow,
    autoCompactTokenLimit: autoLimit,
    activeContextTotal,
    compactionMode,
    retainedTurnIds: retainedTurns.map((turn) => turn.turn_id),
    compactedTurnIds: compactedTurns.map((turn) => turn.turn_id),
    pendingUserInputsCount: input.conversationMemoryPacket?.pending_user_inputs.length ?? 0,
    unresolvedTaskFramesCount: input.conversationMemoryPacket?.unresolved_task_frames.length ?? 0,
    modelVisibleContextIncluded: Boolean(modelVisibleSummary || input.conversationMemoryPacket),
    modelVisibleContextTokenEstimate: modelVisibleContextTokens,
    reason: compactionReason,
  });

  const packet: HelixRollingSessionContextPacket = {
    schema: HELIX_ROLLING_SESSION_CONTEXT_PACKET_SCHEMA,
    thread_id: threadId,
    current_turn_id: currentTurnId,
    session_id: sessionId,
    context_scope: "current_thread",
    accounting_version: "v1",
    model_context_window_tokens: contextWindow,
    auto_compact_token_limit: autoLimit,
    estimated_tokens: {
      current_user_prompt: promptTokens,
      prior_thread_turns: priorTokens,
      retained_turns: retainedTokens,
      compacted_summary: compactedTokens,
      conversation_memory_packet: memoryTokens,
      current_turn_attachments: attachmentTokens,
      active_context_total: activeContextTotal,
    },
    compaction_mode: compactionMode,
    compaction_reason: compactionReason,
    full_context_window_limit_reached: fullLimitReached,
    context_fidelity_meter: contextFidelityMeter,
    retained_turn_ids: retainedTurns.map((turn) => turn.turn_id),
    compacted_turn_ids: compactedTurns.map((turn) => turn.turn_id),
    dropped_turn_ids: [],
    retained_context_summary: retainedSummary,
    compacted_context_summary: compactedSummary,
    model_visible_summary: modelVisibleSummary,
    missing_or_uncertain: priorTurns.length === 0 ? ["No prior turns were available in the active thread."] : [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  rememberRollingSessionContextPacket(packet);
  return packet;
}

export function renderHelixRollingSessionContextForModel(
  packet: HelixRollingSessionContextPacket,
): string {
  return [
    `Rolling session context (${packet.schema})`,
    `scope=${packet.context_scope}`,
    `compaction=${packet.compaction_mode}`,
    `reason=${packet.compaction_reason}`,
    `tokens=${packet.estimated_tokens.active_context_total}/${packet.model_context_window_tokens}`,
    packet.model_visible_summary ? `summary:\n${packet.model_visible_summary}` : "",
    packet.missing_or_uncertain.length > 0
      ? `missing_or_uncertain=${packet.missing_or_uncertain.join("; ")}`
      : "",
    "terminal_eligible=false assistant_answer=false raw_content_included=false",
  ].filter(Boolean).join("\n");
}

export function buildHelixRollingSessionContextDebug(
  packet: HelixRollingSessionContextPacket,
): Record<string, unknown> {
  return {
    packet_schema: packet.schema,
    context_scope: packet.context_scope,
    thread_id: packet.thread_id,
    current_turn_id: packet.current_turn_id,
    selected_prior_turn_ids: packet.retained_turn_ids,
    compacted_turn_ids: packet.compacted_turn_ids,
    dropped_turn_ids: packet.dropped_turn_ids,
    estimated_tokens: packet.estimated_tokens,
    context_fidelity_meter: packet.context_fidelity_meter,
    model_context_window_tokens: packet.model_context_window_tokens,
    auto_compact_token_limit: packet.auto_compact_token_limit,
    compaction_mode: packet.compaction_mode,
    compaction_reason: packet.compaction_reason,
    full_context_window_limit_reached: packet.full_context_window_limit_reached,
    raw_history_excluded_from_model_context: true,
    terminal_eligible: packet.terminal_eligible,
    assistant_answer: packet.assistant_answer,
    raw_content_included: packet.raw_content_included,
  };
}
