import {
  HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA,
  type HelixConversationMemoryAllowedUse,
  type HelixConversationMemoryPacket,
  type HelixConversationMemoryReference,
} from "../../../shared/helix-conversation-memory-packet";
import {
  buildConversationTurnsFromEvents,
  getConversationHistoryEvents,
} from "./conversation-history";
import {
  buildHelixThreadCitationView,
  buildHelixThreadExecutionView,
  buildHelixThreadState,
} from "../helix-thread/reducer";
import type {
  HelixThreadItem,
  HelixThreadServerRequest,
  HelixThreadTurn,
} from "../helix-thread/types";

export type BuildHelixConversationMemoryPacketInput = {
  threadId: string;
  currentTurnId: string;
  sessionId?: string | null;
  promptText: string;
  sourceTarget?: string | null;
  routeReason?: string | null;
  allowsPriorArtifacts?: boolean | null;
  maxTurns?: number;
  maxAnswers?: number;
  maxRefs?: number;
};

export type HelixFollowupKind =
  | "pronoun"
  | "continue"
  | "previous_answer"
  | "previous_failure"
  | "previous_evidence"
  | "same_transform"
  | "none";

export type HelixFollowupDetection = {
  is_followup: boolean;
  phrases: string[];
  followup_kind: HelixFollowupKind;
};

export type HelixConversationMemoryAdmission = {
  allowed_for_current_goal: boolean;
  allowed_reason: string;
  allowed_use: HelixConversationMemoryAllowedUse;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const textLimit = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_CONVERSATION_MEMORY_TEXT_CHARS, 440), 120, 1200);

const summaryLimit = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_CONVERSATION_MEMORY_SUMMARY_CHARS, 900), 240, 2400);

const normalizeText = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeLower = (value: unknown): string => normalizeText(value).toLowerCase();

const clip = (value: unknown, limit = textLimit()): string => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const unique = (values: string[], limit: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
};

const hasExplicitMemoryRejection = (text: string): boolean =>
  /\b(do not|don't|dont|without|no)\s+(use|reuse|continue from|continue|rely on)\s+(the\s+)?(previous|prior|last)\b/.test(text) ||
  /\bfrom scratch\b/.test(text) && /\b(previous|prior|last)\b/.test(text) ||
  /\bdo not reuse\b/.test(text);

const hasQuotedOrHypotheticalCue = (text: string): boolean =>
  /\b(if|when)\s+i\s+(later\s+)?say\s+["']?(continue|that|this|it)/.test(text) ||
  /\b(if|when)\s+.*\bcontinue\s+later\b/.test(text) ||
  /\b(screenshot|screen|quote|quoted|someone said|historically)\b.*\b(continue|that|this|it|previous answer|previous result)\b/.test(text);

const addPhrase = (phrases: string[], text: string, phrase: string): void => {
  if (text.includes(phrase)) phrases.push(phrase);
};

export function detectHelixFollowupReferences(promptText: string): HelixFollowupDetection {
  const text = normalizeLower(promptText);
  if (!text || hasExplicitMemoryRejection(text) || hasQuotedOrHypotheticalCue(text)) {
    return { is_followup: false, phrases: [], followup_kind: "none" };
  }

  const phrases: string[] = [];
  const previousEvidence = [
    "previous repo result",
    "last repo result",
    "previous docs result",
    "last docs result",
    "previous evidence",
    "last evidence",
    "previous result",
    "last result",
    "use the previous repo result",
  ];
  const previousFailure = ["why did it fail", "what failed", "why it failed", "last failure"];
  const previousAnswer = ["previous answer", "last answer", "what was the last answer"];
  const sameTransform = ["same thing", "do the same", "do that same", "same but"];
  const continuePhrases = ["continue", "keep going", "expand on that"];
  const pronouns = ["explain that more simply", "make that shorter", "fix that", "that", "this", "it", "those", "them"];

  for (const phrase of previousEvidence) addPhrase(phrases, text, phrase);
  if (phrases.length > 0) {
    return { is_followup: true, phrases: unique(phrases, 8), followup_kind: "previous_evidence" };
  }
  for (const phrase of previousFailure) addPhrase(phrases, text, phrase);
  if (phrases.length > 0) {
    return { is_followup: true, phrases: unique(phrases, 8), followup_kind: "previous_failure" };
  }
  for (const phrase of previousAnswer) addPhrase(phrases, text, phrase);
  if (phrases.length > 0) {
    return { is_followup: true, phrases: unique(phrases, 8), followup_kind: "previous_answer" };
  }
  for (const phrase of sameTransform) addPhrase(phrases, text, phrase);
  if (phrases.length > 0) {
    return { is_followup: true, phrases: unique(phrases, 8), followup_kind: "same_transform" };
  }
  for (const phrase of continuePhrases) addPhrase(phrases, text, phrase);
  if (phrases.length > 0) {
    return { is_followup: true, phrases: unique(phrases, 8), followup_kind: "continue" };
  }
  for (const phrase of pronouns) {
    if (phrase.length <= 4) {
      if (new RegExp(`\\b${phrase}\\b`).test(text)) phrases.push(phrase);
    } else {
      addPhrase(phrases, text, phrase);
    }
  }
  return phrases.length > 0
    ? { is_followup: true, phrases: unique(phrases, 8), followup_kind: "pronoun" }
    : { is_followup: false, phrases: [], followup_kind: "none" };
}

export function resolveConversationMemoryAdmission(input: {
  promptText: string;
  sourceTarget?: string | null;
  routeReason?: string | null;
  allowsPriorArtifacts?: boolean | null;
  followup: HelixFollowupDetection;
}): HelixConversationMemoryAdmission {
  const prompt = normalizeLower(input.promptText);
  if (hasExplicitMemoryRejection(prompt)) {
    return {
      allowed_for_current_goal: false,
      allowed_reason: "Current prompt explicitly rejects previous conversation context.",
      allowed_use: "blocked",
    };
  }
  if (!input.followup.is_followup) {
    return {
      allowed_for_current_goal: false,
      allowed_reason: "No current-thread follow-up reference was detected.",
      allowed_use: "blocked",
    };
  }
  if (input.followup.followup_kind === "previous_evidence") {
    if (input.allowsPriorArtifacts === true) {
      return {
        allowed_for_current_goal: true,
        allowed_reason: "Current prompt asks to reuse prior evidence and route admission allows prior artifact refs.",
        allowed_use: "reuse_prior_evidence_refs",
      };
    }
    return {
      allowed_for_current_goal: true,
      allowed_reason: "Prior evidence was referenced, but current route has not admitted prior artifacts as factual authority.",
      allowed_use: "pronoun_binding_only",
    };
  }
  if (input.followup.followup_kind === "previous_failure") {
    return {
      allowed_for_current_goal: true,
      allowed_reason: "Current prompt asks about a previous failure in the active thread.",
      allowed_use: "conversational_continuity",
    };
  }
  return {
    allowed_for_current_goal: true,
    allowed_reason: "Current prompt is a current-thread follow-up; memory is admitted only as non-terminal continuity context.",
    allowed_use: "conversational_continuity",
  };
}

const formatObservationRef = (item: HelixThreadItem): string | null => {
  const ref = item.observation_ref ?? {};
  const artifactRef = normalizeText((ref as { artifact_ref?: unknown }).artifact_ref);
  if (artifactRef) return artifactRef;
  const path = normalizeText((ref as { path?: unknown }).path);
  if (path) {
    const lineStart = (ref as { line_start?: unknown }).line_start;
    const lineEnd = (ref as { line_end?: unknown }).line_end;
    const suffix =
      typeof lineStart === "number" && Number.isFinite(lineStart)
        ? `:${Math.max(1, Math.floor(lineStart))}${typeof lineEnd === "number" && Number.isFinite(lineEnd) ? `-${Math.max(1, Math.floor(lineEnd))}` : ""}`
        : "";
    return `${path}${suffix}`;
  }
  return item.observation_ref ? `thread_item:${item.item_id}` : null;
};

const isStaleProjectionItem = (item: HelixThreadItem): boolean => {
  const meta = item.meta ?? {};
  const role = normalizeLower((meta as { role?: unknown }).role);
  const kind = normalizeLower((meta as { kind?: unknown }).kind);
  const source = normalizeLower((meta as { source?: unknown }).source);
  return (
    role.includes("projection") ||
    role.includes("receipt") ||
    kind.includes("projection") ||
    kind.includes("receipt") ||
    kind.includes("live_card") ||
    source.includes("client_projection") ||
    item.item_type === "commandExecution" ||
    item.item_type === "dynamicToolCall"
  );
};

const requestSummary = (request: HelixThreadServerRequest): string => {
  const payload = request.payload ?? {};
  const question = normalizeText((payload as { question?: unknown }).question);
  const prompt = normalizeText((payload as { prompt?: unknown }).prompt);
  const text = normalizeText((payload as { text?: unknown }).text);
  return clip(question || prompt || text || `${request.request_kind}:${request.request_id}`);
};

const buildEmptyPacket = (args: {
  threadId: string;
  currentTurnId: string;
  sessionId?: string | null;
  reason: string;
  followup?: HelixFollowupDetection;
}): HelixConversationMemoryPacket => ({
  schema: HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA,
  thread_id: args.threadId,
  current_turn_id: args.currentTurnId,
  session_id: args.sessionId ?? null,
  memory_scope: "current_thread",
  selector_version: "v1",
  recent_user_goals: [],
  recent_assistant_answers: [],
  resolved_references: [],
  reusable_evidence_refs: [],
  forbidden_or_stale_refs: [],
  open_failures: [],
  pending_user_inputs: [],
  latest_plan_summary: null,
  latest_answer_summary: null,
  latest_failure_summary: null,
  continuity_summary: "",
  missing_or_uncertain: [args.reason],
  allowed_for_current_goal: false,
  allowed_reason: args.reason,
  allowed_use: "blocked",
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const selectPriorTurns = (turns: HelixThreadTurn[], currentTurnId: string, maxTurns: number): HelixThreadTurn[] =>
  turns
    .filter((turn) => turn.turn_id !== currentTurnId)
    .filter((turn) => Boolean(turn.user_text || turn.assistant_text || turn.fail_reason || turn.latest_answer_summary))
    .sort((a, b) => a.last_seq - b.last_seq)
    .slice(-maxTurns);

const buildLegacyPriorTurns = (args: {
  sessionId?: string | null;
  currentTurnId: string;
  maxTurns: number;
}): HelixThreadTurn[] => {
  if (!args.sessionId) return [];
  return buildConversationTurnsFromEvents(
    getConversationHistoryEvents({ sessionId: args.sessionId, limit: Math.max(24, args.maxTurns * 4) }),
  )
    .filter((turn) => turn.turn_id !== args.currentTurnId)
    .slice(-args.maxTurns)
    .map((turn, index) => ({
      thread_id: `legacy:${args.sessionId}`,
      turn_id: turn.turn_id,
      route: "/ask",
      session_id: turn.session_id,
      status: turn.fail_reason ? "failed" : "completed",
      started_at: "",
      updated_at: "",
      user_text: turn.user_text,
      assistant_text: turn.assistant_text,
      fail_reason: turn.fail_reason,
      route_reason: turn.route_reason,
      final_gate_outcome: turn.final_gate_outcome,
      latest_answer_summary: turn.assistant_text,
      last_seq: index,
      event_count: 1,
      item_count: 0,
      request_count: 0,
    }));
};

export function buildHelixConversationMemoryPacket(
  input: BuildHelixConversationMemoryPacketInput,
): HelixConversationMemoryPacket {
  const threadId = normalizeText(input.threadId);
  const currentTurnId = normalizeText(input.currentTurnId);
  const sessionId = normalizeText(input.sessionId) || null;
  const followup = detectHelixFollowupReferences(input.promptText);
  const admission = resolveConversationMemoryAdmission({
    promptText: input.promptText,
    sourceTarget: input.sourceTarget ?? null,
    routeReason: input.routeReason ?? null,
    allowsPriorArtifacts: input.allowsPriorArtifacts ?? null,
    followup,
  });
  if (!threadId) {
    return buildEmptyPacket({
      threadId,
      currentTurnId,
      sessionId,
      reason: "No active thread is available for current-thread conversation memory.",
      followup,
    });
  }

  const maxTurns = clampNumber(
    input.maxTurns ?? readNumber(process.env.HELIX_ASK_CONVERSATION_MEMORY_MAX_TURNS, 6),
    1,
    12,
  );
  const maxAnswers = clampNumber(
    input.maxAnswers ?? readNumber(process.env.HELIX_ASK_CONVERSATION_MEMORY_MAX_ANSWERS, 3),
    1,
    8,
  );
  const maxRefs = clampNumber(
    input.maxRefs ?? readNumber(process.env.HELIX_ASK_CONVERSATION_MEMORY_MAX_REFS, 12),
    1,
    32,
  );

  const state = buildHelixThreadState({ threadId });
  let priorTurns = selectPriorTurns(state.turns, currentTurnId, maxTurns);
  const usedLegacyFallback = priorTurns.length === 0;
  if (usedLegacyFallback) {
    priorTurns = buildLegacyPriorTurns({ sessionId, currentTurnId, maxTurns });
  }

  const latestPrior = priorTurns.at(-1) ?? null;
  const recentUserGoals = unique(
    priorTurns.map((turn) => clip(turn.user_text)).filter(Boolean),
    maxTurns,
  );
  const recentAssistantAnswers = unique(
    priorTurns
      .map((turn) => clip(turn.latest_answer_summary ?? turn.assistant_text))
      .filter(Boolean)
      .reverse(),
    maxAnswers,
  ).reverse();
  const failures = priorTurns
    .filter((turn) => turn.status === "failed" || Boolean(turn.fail_reason))
    .map((turn) => clip(turn.fail_reason || turn.final_gate_outcome || `turn ${turn.turn_id} failed`, textLimit()));
  const latestFailure = failures.at(-1) ?? null;
  const pendingInputs = state.unresolved_requests.map(requestSummary).filter(Boolean).slice(0, maxTurns);
  let allowedUse = admission.allowed_use;
  if (allowedUse === "conversational_continuity" && pendingInputs.length > 0 && followup.followup_kind === "pronoun") {
    allowedUse = "pending_request_resolution";
  }

  const staleRefs: string[] = [];
  const evidenceRefs: string[] = [];
  const selectedPriorItemIds: string[] = [];
  for (const turn of priorTurns) {
    const execution = threadId.startsWith("legacy:")
      ? null
      : buildHelixThreadExecutionView({ threadId, turnId: turn.turn_id });
    const citation = threadId.startsWith("legacy:")
      ? null
      : buildHelixThreadCitationView({ threadId, turnId: turn.turn_id });
    const observationItems = [
      ...(execution?.observation_items ?? []),
      ...(citation?.observation_items ?? []),
    ];
    for (const item of observationItems) {
      selectedPriorItemIds.push(item.item_id);
      const ref = formatObservationRef(item) ?? `thread_item:${item.item_id}`;
      if (isStaleProjectionItem(item)) {
        staleRefs.push(ref);
      } else if (allowedUse === "reuse_prior_evidence_refs") {
        evidenceRefs.push(ref);
      }
    }
    if (allowedUse === "reuse_prior_evidence_refs") {
      for (const entry of citation?.memory_citation?.entries ?? []) {
        const line =
          typeof entry.line_start === "number"
            ? `:${entry.line_start}${typeof entry.line_end === "number" ? `-${entry.line_end}` : ""}`
            : "";
        evidenceRefs.push(`${entry.path}${line}`);
      }
      evidenceRefs.push(...(citation?.source_item_ids ?? []).map((itemId) => `thread_item:${itemId}`));
    }
  }

  const reusableEvidenceRefs = unique(evidenceRefs, maxRefs);
  const forbiddenOrStaleRefs = unique(staleRefs, maxRefs);
  const resolvedReferences: HelixConversationMemoryReference[] = [];
  if (admission.allowed_for_current_goal && followup.is_followup && latestPrior) {
    const phrase = followup.phrases[0] ?? "follow-up";
    const evidenceRef = reusableEvidenceRefs[0] ?? null;
    const latestAnswerItem = state.items
      .filter((item) => item.turn_id === latestPrior.turn_id && item.item_type === "answer")
      .at(-1);
    const priorEvidenceItemId = selectedPriorItemIds.at(-1) ?? null;
    const kind: HelixConversationMemoryReference["refers_to_kind"] =
      followup.followup_kind === "previous_failure"
        ? "prior_failure"
        : allowedUse === "reuse_prior_evidence_refs" && evidenceRef
          ? "prior_evidence"
          : pendingInputs.length > 0 && allowedUse === "pending_request_resolution"
            ? "pending_user_input"
            : "prior_assistant_answer";
    resolvedReferences.push({
      phrase,
      refers_to_turn_id: latestPrior.turn_id,
      refers_to_item_id: kind === "prior_evidence" ? priorEvidenceItemId : latestAnswerItem?.item_id ?? null,
      refers_to_artifact_ref: kind === "prior_evidence" ? evidenceRef : null,
      refers_to_kind: kind,
      confidence:
        followup.followup_kind === "pronoun" || allowedUse === "pronoun_binding_only"
          ? "medium"
          : "high",
      reason:
        kind === "prior_evidence"
          ? "Prompt explicitly referenced previous evidence and the selector found provenance refs."
          : kind === "prior_failure"
            ? "Prompt asks about the previous failure in the active thread."
            : "Prompt contains a follow-up reference that binds to the latest prior thread answer.",
    });
  }

  const missingOrUncertain: string[] = [];
  if (usedLegacyFallback) {
    missingOrUncertain.push("Thread ledger had no useful prior turns; legacy conversation history fallback was used.");
  }
  if (!admission.allowed_for_current_goal) {
    missingOrUncertain.push(admission.allowed_reason);
  }
  if (followup.followup_kind === "previous_evidence" && reusableEvidenceRefs.length === 0) {
    missingOrUncertain.push("No reusable prior evidence refs were admitted for the current goal.");
  }
  if (forbiddenOrStaleRefs.length > 0) {
    missingOrUncertain.push("Some prior projections, receipts, or tool surfaces were not admitted as evidence authority.");
  }

  const latestPlanSummary =
    clip(latestPrior?.latest_plan_summary ?? state.latest_plan_summary ?? "", textLimit()) || null;
  const latestAnswerSummary =
    clip(latestPrior?.latest_answer_summary ?? latestPrior?.assistant_text ?? state.latest_answer_summary ?? "", textLimit()) || null;
  const continuitySummary = clip(
    [
      latestAnswerSummary ? `latest answer: ${latestAnswerSummary}` : "",
      latestFailure ? `latest failure: ${latestFailure}` : "",
      pendingInputs.length > 0 ? `pending input: ${pendingInputs[0]}` : "",
      reusableEvidenceRefs.length > 0 ? `reusable evidence refs: ${reusableEvidenceRefs.slice(0, 3).join(", ")}` : "",
    ].filter(Boolean).join(" | "),
    summaryLimit(),
  );

  return {
    schema: HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA,
    thread_id: threadId,
    current_turn_id: currentTurnId,
    session_id: sessionId,
    memory_scope: "current_thread",
    selector_version: "v1",
    recent_user_goals: admission.allowed_for_current_goal ? recentUserGoals : [],
    recent_assistant_answers: admission.allowed_for_current_goal ? recentAssistantAnswers : [],
    resolved_references: admission.allowed_for_current_goal ? resolvedReferences : [],
    reusable_evidence_refs: reusableEvidenceRefs,
    forbidden_or_stale_refs: forbiddenOrStaleRefs,
    open_failures: unique(failures, maxTurns),
    pending_user_inputs: unique(pendingInputs, maxTurns),
    latest_plan_summary: latestPlanSummary,
    latest_answer_summary: admission.allowed_for_current_goal ? latestAnswerSummary : null,
    latest_failure_summary: latestFailure,
    continuity_summary: admission.allowed_for_current_goal ? continuitySummary : "",
    missing_or_uncertain: unique(missingOrUncertain, 8),
    allowed_for_current_goal: admission.allowed_for_current_goal,
    allowed_reason: admission.allowed_reason,
    allowed_use: allowedUse,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildHelixConversationMemoryDebug(packet: HelixConversationMemoryPacket): Record<string, unknown> {
  return {
    packet_schema: packet.schema,
    memory_scope: packet.memory_scope,
    thread_id: packet.thread_id,
    current_turn_id: packet.current_turn_id,
    selected_prior_turn_ids: unique(
      packet.resolved_references.map((entry) => entry.refers_to_turn_id),
      12,
    ),
    selected_prior_item_ids: unique(
      packet.resolved_references.map((entry) => entry.refers_to_item_id ?? "").filter(Boolean),
      12,
    ),
    reusable_evidence_refs: packet.reusable_evidence_refs,
    forbidden_or_stale_refs: packet.forbidden_or_stale_refs,
    followup_phrases: packet.resolved_references.map((entry) => entry.phrase),
    allowed_for_current_goal: packet.allowed_for_current_goal,
    allowed_reason: packet.allowed_reason,
    allowed_use: packet.allowed_use,
    raw_history_excluded_from_model_context: true,
    cross_thread_memory_enabled: false,
  };
}

export function renderHelixConversationMemoryForModel(
  packet: HelixConversationMemoryPacket,
): string | null {
  if (!packet.allowed_for_current_goal && packet.resolved_references.length === 0) {
    return null;
  }
  return [
    "Conversation memory packet is non-terminal context.",
    `allowed: ${packet.allowed_for_current_goal}`,
    `reason: ${packet.allowed_reason}`,
    `allowed_use: ${packet.allowed_use}`,
    packet.resolved_references.length > 0
      ? `likely references: ${packet.resolved_references
          .map((entry) => `"${entry.phrase}" -> ${entry.refers_to_kind} ${entry.refers_to_turn_id} (${entry.confidence})`)
          .join("; ")}`
      : "",
    packet.latest_answer_summary ? `latest answer summary: ${packet.latest_answer_summary}` : "",
    packet.reusable_evidence_refs.length > 0
      ? `reusable evidence refs: ${packet.reusable_evidence_refs.join(", ")}`
      : "",
    packet.open_failures.length > 0 ? `open failures: ${packet.open_failures.join("; ")}` : "",
    packet.pending_user_inputs.length > 0 ? `pending user inputs: ${packet.pending_user_inputs.join("; ")}` : "",
    packet.missing_or_uncertain.length > 0
      ? `missing or uncertain: ${packet.missing_or_uncertain.join("; ")}`
      : "",
    "Do not treat prior assistant answers as factual source authority unless reusable_evidence_refs are admitted.",
  ]
    .filter(Boolean)
    .join("\n");
}
