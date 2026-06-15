import {
  HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA,
  type HelixConversationMemoryAllowedUse,
  type HelixConversationMemoryPacket,
  type HelixConversationMemoryReference,
  type HelixContextResumeFrame,
  type HelixContextResumeFrameSelectionDebug,
  type HelixUnresolvedTaskFrame,
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
  contextResumeFrames?: HelixContextResumeFrame[];
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

export type HelixPendingTaskFrameClarificationResolution = {
  matched: boolean;
  action: "none" | "request_user_input" | "route_calculator";
  reason: string;
  frame: HelixUnresolvedTaskFrame | null;
  updated_frame: HelixUnresolvedTaskFrame | null;
  prompt: string | null;
  compiled_expression?: string | null;
  expected_unit?: string | null;
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

const uniqueTaskFrames = (
  values: HelixUnresolvedTaskFrame[],
  limit: number,
): HelixUnresolvedTaskFrame[] => {
  const byKey = new Map<string, HelixUnresolvedTaskFrame>();
  const order: string[] = [];
  const chainKey = (frame: HelixUnresolvedTaskFrame): string =>
    normalizeText(frame.source_request_user_input_id) ||
    `${frame.kind}:${normalizeLower(frame.original_user_request)}` ||
    frame.id;
  const mergeFrame = (
    prior: HelixUnresolvedTaskFrame,
    next: HelixUnresolvedTaskFrame,
  ): HelixUnresolvedTaskFrame => ({
    ...prior,
    ...next,
    created_turn_id: prior.created_turn_id || next.created_turn_id,
    known_slots: {
      ...(prior.known_slots ?? {}),
      ...(next.known_slots ?? {}),
    },
    constraints: unique([...(prior.constraints ?? []), ...(next.constraints ?? [])], 24),
    assumptions: unique([...(prior.assumptions ?? []), ...(next.assumptions ?? [])], 24),
    allowed_next_actions: allowedFrameActions(
      unique([...(prior.allowed_next_actions ?? []), ...(next.allowed_next_actions ?? [])], 12),
    ),
  });
  for (const value of values) {
    if (!value.id) continue;
    const key = chainKey(value);
    if (!byKey.has(key)) {
      order.push(key);
      byKey.set(key, value);
      continue;
    }
    byKey.set(key, mergeFrame(byKey.get(key)!, value));
  }
  const result: HelixUnresolvedTaskFrame[] = [];
  for (const key of order) {
    const frame = byKey.get(key);
    if (!frame) continue;
    result.push(frame);
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

const readString = (value: unknown): string | null => normalizeText(value) || null;

const readStringArray = (value: unknown, limit = 16): string[] => {
  if (!Array.isArray(value)) return [];
  return unique(value.map((entry) => normalizeText(entry)).filter(Boolean), limit);
};

const readTimestampMs = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  const text = normalizeText(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const isTriangleMissingSlotSet = (slots: string[]): boolean => {
  const set = new Set(slots.map((slot) => slot.toLowerCase()));
  return set.has("triangle_type") || set.has("angle") || set.has("another_side") || set.has("side_ratio");
};

const inferTriangleKnownSlotsFromPayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const explicitFrame = readRecord(payload.unresolved_task_frame);
  const explicitKnown = readRecord(explicitFrame?.known_slots);
  if (explicitKnown) return explicitKnown;

  const interpretation = readRecord(payload.calculator_problem_interpretation);
  const normalizedQuantities = Array.isArray(interpretation?.normalized_quantities)
    ? interpretation.normalized_quantities
    : [];
  const firstQuantity = normalizedQuantities
    .map((entry) => readRecord(entry))
    .find((entry) => readString(entry?.normalized_expression) && readString(entry?.unit));
  if (!firstQuantity) return {};
  return {
    longest_side: {
      raw: readString(firstQuantity.raw_token) ?? readString(firstQuantity.raw),
      expression: readString(firstQuantity.normalized_expression),
      decimal: typeof firstQuantity.decimal_value === "number" ? firstQuantity.decimal_value : null,
      unit: readString(firstQuantity.unit),
    },
  };
};

const allowedFrameActions = (
  values: string[],
): HelixUnresolvedTaskFrame["allowed_next_actions"] =>
  values.filter((action): action is HelixUnresolvedTaskFrame["allowed_next_actions"][number] =>
    action === "ask_user" ||
    action === "merge_clarification" ||
    action === "route_calculator" ||
    action === "route_tool" ||
    action === "answer_directly",
  );

const coerceUnresolvedTaskFrame = (
  request: HelixThreadServerRequest,
): HelixUnresolvedTaskFrame | null => {
  const payload = readRecord(request.payload);
  if (!payload) return null;
  const explicit = readRecord(payload.unresolved_task_frame);
  if (explicit) {
    const kind = readString(explicit.kind);
    const status = readString(explicit.status);
    if (
      kind === "math_geometry_triangle" ||
      kind === "calculator_problem" ||
      kind === "code_debugging" ||
      kind === "research_task" ||
      kind === "general_clarification"
    ) {
      return {
        id: readString(explicit.id) ?? `frame:${request.request_id}`,
        kind,
        created_turn_id: readString(explicit.created_turn_id) ?? request.turn_id,
        updated_turn_id: readString(explicit.updated_turn_id) ?? request.turn_id,
        status:
          status === "ready_to_solve" ||
          status === "resolved" ||
          status === "abandoned" ||
          status === "missing_slots"
            ? status
            : "missing_slots",
        original_user_request:
          readString(explicit.original_user_request) ??
          readString(payload.user_goal_summary) ??
          requestSummary(request),
        known_slots: readRecord(explicit.known_slots) ?? {},
        missing_slots: readStringArray(explicit.missing_slots),
        constraints: readStringArray(explicit.constraints),
        assumptions: readStringArray(explicit.assumptions),
        source_terminal_artifact_id: readString(explicit.source_terminal_artifact_id),
        source_request_user_input_id: readString(explicit.source_request_user_input_id) ?? request.request_id,
        allowed_next_actions: allowedFrameActions(readStringArray(explicit.allowed_next_actions)),
      };
    }
  }

  const requiredFields = readStringArray(payload.required_fields ?? payload.missing_requirement_ids);
  const prompt = [
    readString(payload.prompt),
    readString(payload.question),
    readString(payload.user_goal_summary),
    requestSummary(request),
  ].filter(Boolean).join(" ");
  if (!isTriangleMissingSlotSet(requiredFields) && !/\btriangle\b/i.test(prompt)) return null;

  return {
    id: `math_geometry_triangle:${request.request_id}`,
    kind: "math_geometry_triangle",
    created_turn_id: request.turn_id,
    updated_turn_id: request.turn_id,
    status: "missing_slots",
    original_user_request: readString(payload.user_goal_summary) ?? requestSummary(request),
    known_slots: inferTriangleKnownSlotsFromPayload(payload),
    missing_slots:
      requiredFields.length > 0
        ? requiredFields
        : ["triangle_type", "angle", "another_side", "perimeter", "area", "side_ratio"],
    constraints: readStringArray(payload.constraints),
    assumptions: [],
    source_terminal_artifact_id: readString(payload.terminal_artifact_id),
    source_request_user_input_id: request.request_id,
    allowed_next_actions: ["ask_user", "merge_clarification", "route_calculator"],
  };
};

const coerceContextResumeFrame = (
  request: HelixThreadServerRequest,
): HelixContextResumeFrame | null => {
  const payload = readRecord(request.payload);
  const resumeFrame = readRecord(payload?.resume_frame);
  if (!resumeFrame || readString(resumeFrame.schema) !== "helix.pasted_text_attachment_resume_frame.v1") {
    return null;
  }
  const turnInputItems = Array.isArray(resumeFrame.turn_input_items) ? resumeFrame.turn_input_items : [];
  const attachmentPreviews = unique(
    turnInputItems
      .map((entry) => readRecord(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry))
      .filter((entry) => readString(entry.type) === "attachment")
      .map((entry) => (typeof entry.preview === "string" ? entry.preview.trim() : ""))
      .filter((entry) => entry.length > 0),
    6,
  );
  return {
    id: `context_resume:${request.request_id}`,
    schema: "helix.pasted_text_attachment_resume_frame.v1",
    thread_id: request.thread_id,
    session_id: request.session_id ?? null,
    source_request_id: request.request_id,
    source_turn_id: readString(resumeFrame.source_turn_id) ?? request.turn_id,
    source_message_id: readString(resumeFrame.source_message_id),
    original_prompt: readString(resumeFrame.original_prompt) ?? requestSummary(request),
    pasted_attachment_id: readString(resumeFrame.pasted_attachment_id),
    pasted_attachment_sha256:
      readString(resumeFrame.pasted_attachment_sha256) ??
      readString(resumeFrame.attachment_sha256) ??
      readString(resumeFrame.sha256),
    context_compaction_job_id: readString(resumeFrame.context_compaction_job_id),
    created_at_ms: readTimestampMs(resumeFrame.created_at_ms) ?? readTimestampMs(request.created_at),
    installed_at_ms:
      readTimestampMs(resumeFrame.installed_at_ms) ??
      readTimestampMs(resumeFrame.created_at_ms) ??
      readTimestampMs(request.created_at),
    status:
      resumeFrame.status === "pending" || resumeFrame.status === "failed" || resumeFrame.status === "installed"
        ? resumeFrame.status
        : "installed",
    supersedes_resume_frame_ids: readStringArray(resumeFrame.supersedes_resume_frame_ids),
    attachment_artifact_refs: readStringArray(resumeFrame.attachment_artifact_refs, 12),
    attachment_previews: attachmentPreviews,
    turn_input_item_count: turnInputItems.length,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const detectContextResumeCue = (promptText: string): boolean => {
  const text = normalizeLower(promptText);
  if (!text) return false;
  return /\b(?:pasted\s+(?:text|memo|note|document)|attached\s+(?:text|memo|note|document)|copied\s+(?:text|memo|note|document)|(?:text|memo|note|document)\s+attachment|attachment|previous\s+(?:paste|memo|note|document)|last\s+(?:paste|memo|note|document)|(?:paste|memo|note|document|text)\s+from\s+the\s+previous|pasted\s+(?:text|memo|note|document)\s+from\s+the\s+previous)\b/.test(text);
};

const contextResumeFrameArtifactKey = (frame: HelixContextResumeFrame): string =>
  frame.attachment_artifact_refs.length > 0
    ? `refs:${frame.attachment_artifact_refs.join("\u001f")}`
    : frame.pasted_attachment_sha256
      ? `sha256:${frame.pasted_attachment_sha256}`
      : frame.pasted_attachment_id
        ? `attachment:${frame.pasted_attachment_id}`
        : `frame:${frame.id}`;

const contextResumeFrameFreshness = (frame: HelixContextResumeFrame): number =>
  frame.installed_at_ms ?? frame.created_at_ms ?? 0;

const compareContextResumeFrameFreshness = (
  a: HelixContextResumeFrame,
  b: HelixContextResumeFrame,
): number => {
  const byTime = contextResumeFrameFreshness(a) - contextResumeFrameFreshness(b);
  if (byTime !== 0) return byTime;
  return String(a.source_turn_id).localeCompare(String(b.source_turn_id));
};

const normalizeExplicitContextResumeFrame = (
  frame: HelixContextResumeFrame,
): HelixContextResumeFrame => ({
  ...frame,
  created_at_ms: readTimestampMs(frame.created_at_ms),
  installed_at_ms: readTimestampMs(frame.installed_at_ms) ?? readTimestampMs(frame.created_at_ms),
  status:
    frame.status === "pending" || frame.status === "failed" || frame.status === "installed"
      ? frame.status
      : "installed",
  supersedes_resume_frame_ids: Array.isArray(frame.supersedes_resume_frame_ids)
    ? frame.supersedes_resume_frame_ids.map((entry) => normalizeText(entry)).filter(Boolean)
    : [],
});

const selectContextResumeFrames = (input: {
  frames: HelixContextResumeFrame[];
  threadId: string;
  sessionId?: string | null;
  maxTurns: number;
}): { frames: HelixContextResumeFrame[]; debug: HelixContextResumeFrameSelectionDebug } => {
  const rejected: HelixContextResumeFrameSelectionDebug["rejected_context_resume_frames"] = [];
  const candidateIds = input.frames.map((frame) => frame.id);
  const validFrames = input.frames.filter((frame) => {
    if (frame.thread_id && frame.thread_id !== input.threadId) {
      rejected.push({
        frame_id: frame.id,
        source_turn_id: frame.source_turn_id,
        status: frame.status ?? null,
        reason: "thread_mismatch",
      });
      return false;
    }
    if (input.sessionId && frame.session_id && frame.session_id !== input.sessionId) {
      rejected.push({
        frame_id: frame.id,
        source_turn_id: frame.source_turn_id,
        status: frame.status ?? null,
        reason: "session_mismatch",
      });
      return false;
    }
    return true;
  });
  const ordered = [...validFrames].sort(compareContextResumeFrameFreshness);
  const freshest = ordered.at(-1) ?? null;
  if (!freshest) {
    return {
      frames: [],
      debug: {
        selected_context_resume_frame_id: null,
        selected_context_resume_source_turn_id: null,
        selected_context_resume_reason: "no_current_thread_attachment_frame",
        current_thread_id: input.threadId,
        current_session_id: input.sessionId ?? null,
        candidate_context_resume_frame_ids: candidateIds,
        rejected_context_resume_frames: rejected,
      },
    };
  }
  const selectedKey = contextResumeFrameArtifactKey(freshest);
  const selectedFrames = ordered
    .filter((frame) => contextResumeFrameArtifactKey(frame) === selectedKey)
    .slice(-input.maxTurns);
  for (const frame of ordered) {
    if (contextResumeFrameArtifactKey(frame) === selectedKey) continue;
    rejected.push({
      frame_id: frame.id,
      source_turn_id: frame.source_turn_id,
      status: frame.status ?? null,
      reason: "superseded_by_newer_pasted_attachment",
    });
  }
  return {
    frames: selectedFrames,
    debug: {
      selected_context_resume_frame_id: freshest.id,
      selected_context_resume_source_turn_id: freshest.source_turn_id,
      selected_context_resume_reason: "freshest_installed_current_thread_frame",
      current_thread_id: input.threadId,
      current_session_id: input.sessionId ?? null,
      candidate_context_resume_frame_ids: candidateIds,
      rejected_context_resume_frames: rejected,
    },
  };
};

const detectPendingSlotFillCue = (promptText: string): boolean => {
  const text = normalizeLower(promptText);
  if (!text) return false;
  return (
    /\b(?:other\s+two\s+sides|two\s+sides|both\s+sides|sides)\s+(?:are|were|should\s+be)?\s*(?:equal|same|identical)\b/.test(text) ||
    /\b(?:equal\s+sides|same\s+length|isosceles)\b/.test(text) ||
    /\b(?:middle|midpoint|center|centre)\b[\s\S]{0,80}\b(?:point|vertex|opposite|other\s+sides)\b/.test(text) ||
    /\b(?:height|altitude|median)\b[\s\S]{0,60}\b\d/.test(text)
  );
};

const extractFractionalLengthExpression = (text: string): { expression: string; unit: string } | null => {
  const match =
    text.match(/\b(\d+)\s*\/\s*(\d+)\s*(inches?|inch|in|feet|foot|ft|cm|centimeters?|centimetres?|m|meters?|metres?)\b/i) ??
    text.match(/\b(\d+(?:\.\d+)?)\s*(inches?|inch|in|feet|foot|ft|cm|centimeters?|centimetres?|m|meters?|metres?)\b/i);
  if (!match) return null;
  if (match.length >= 4) {
    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return { expression: `${numerator}/${denominator}`, unit: normalizeText(match[3]).toLowerCase() };
  }
  return { expression: normalizeText(match[1]), unit: normalizeText(match[2]).toLowerCase() };
};

const readKnownSlotRecord = (
  frame: HelixUnresolvedTaskFrame,
  key: string,
): Record<string, unknown> | null => readRecord(frame.known_slots?.[key]);

const sideUnitFromFrame = (frame: HelixUnresolvedTaskFrame): string | null =>
  readString(readKnownSlotRecord(frame, "longest_side")?.unit);

export function resolveHelixPendingTaskFrameClarification(input: {
  promptText: string;
  frames: HelixUnresolvedTaskFrame[];
  turnId: string;
}): HelixPendingTaskFrameClarificationResolution {
  const frame = input.frames.find((entry) => entry.kind === "math_geometry_triangle" && entry.status !== "resolved") ?? null;
  if (!frame || !detectPendingSlotFillCue(input.promptText)) {
    return {
      matched: false,
      action: "none",
      reason: "no_pending_task_frame_slot_fill",
      frame,
      updated_frame: null,
      prompt: null,
      compiled_expression: null,
      expected_unit: null,
    };
  }

  const text = normalizeLower(input.promptText);
  const knownSlots: Record<string, unknown> = { ...(frame.known_slots ?? {}) };
  const missingSlots = new Set(frame.missing_slots);
  if (
    /\b(?:other\s+two\s+sides|two\s+sides|both\s+sides|sides)\s+(?:are|were|should\s+be)?\s*(?:equal|same|identical)\b/.test(text) ||
    /\b(?:equal\s+sides|same\s+length|isosceles)\b/.test(text)
  ) {
    knownSlots.equal_other_sides = true;
    missingSlots.delete("triangle_type");
    missingSlots.delete("side_ratio");
  }
  const height = extractFractionalLengthExpression(input.promptText);
  if (
    height &&
    (
      /\b(?:middle|midpoint|center|centre)\b[\s\S]{0,80}\b(?:point|vertex|opposite|other\s+sides)\b/i.test(input.promptText) ||
      /\b(?:height|altitude|median)\b/i.test(input.promptText)
    )
  ) {
    knownSlots.median_or_altitude_from_midpoint_to_opposite_vertex = {
      expression: height.expression,
      unit: height.unit,
      raw: input.promptText,
    };
    missingSlots.delete("angle");
    missingSlots.delete("another_side");
    missingSlots.delete("perimeter");
    missingSlots.delete("area");
  }

  const longestSide = readKnownSlotRecord({ ...frame, known_slots: knownSlots }, "longest_side");
  const longestExpression = readString(longestSide?.expression);
  const heightSlot = readKnownSlotRecord({ ...frame, known_slots: knownSlots }, "median_or_altitude_from_midpoint_to_opposite_vertex");
  const heightExpression = readString(heightSlot?.expression);
  const expectedUnit = sideUnitFromFrame({ ...frame, known_slots: knownSlots }) ?? readString(heightSlot?.unit) ?? "in";
  const readyToSolve =
    knownSlots.equal_other_sides === true &&
    Boolean(longestExpression) &&
    Boolean(heightExpression);
  const updatedFrame: HelixUnresolvedTaskFrame = {
    ...frame,
    updated_turn_id: input.turnId,
    known_slots: knownSlots,
    missing_slots: readyToSolve ? [] : Array.from(missingSlots),
    status: readyToSolve ? "ready_to_solve" : "missing_slots",
    allowed_next_actions: readyToSolve ? ["route_calculator"] : ["ask_user", "merge_clarification", "route_calculator"],
  };
  if (readyToSolve && longestExpression && heightExpression) {
    const expression = `(((${longestExpression})/2)^2+(${heightExpression})^2)^(1/2)`;
    return {
      matched: true,
      action: "route_calculator",
      reason: "pending_triangle_frame_ready_to_solve",
      frame,
      updated_frame: updatedFrame,
      prompt: `Use the scientific calculator to evaluate ${expression}. The result is each equal side of the prior isosceles triangle, in ${expectedUnit}.`,
      compiled_expression: expression,
      expected_unit: expectedUnit,
    };
  }
  return {
    matched: true,
    action: "request_user_input",
    reason: "pending_triangle_frame_still_missing_constraints",
    frame,
    updated_frame: updatedFrame,
    prompt:
      "I have the triangle carryover and the equal-side constraint. I still need one more determining constraint before calculating the side lengths: an angle, another side, perimeter/area, or a height/altitude/median.",
    compiled_expression: null,
    expected_unit: expectedUnit,
  };
}

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
  unresolved_task_frames: [],
  context_resume_frames: [],
  context_resume_frame_selection: null,
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
  const unresolvedTaskFrames = uniqueTaskFrames(
    state.unresolved_requests
      .map(coerceUnresolvedTaskFrame)
      .filter((frame): frame is HelixUnresolvedTaskFrame => Boolean(frame)),
    maxTurns,
  );
  const contextResumeFrames = state.unresolved_requests
    .map(coerceContextResumeFrame)
    .filter((frame): frame is HelixContextResumeFrame => Boolean(frame))
    .slice(-maxTurns);
  const explicitContextResumeFrames = Array.isArray(input.contextResumeFrames)
    ? input.contextResumeFrames
        .filter((frame): frame is HelixContextResumeFrame =>
          Boolean(frame && frame.schema === "helix.pasted_text_attachment_resume_frame.v1"),
        )
        .map(normalizeExplicitContextResumeFrame)
    : [];
  const contextResumeFrameSelection = selectContextResumeFrames({
    frames: [
      ...contextResumeFrames,
      ...explicitContextResumeFrames,
    ],
    threadId,
    sessionId,
    maxTurns,
  });
  const selectedContextResumeFrames = contextResumeFrameSelection.frames;
  const pendingSlotFillCue =
    unresolvedTaskFrames.length > 0 &&
    detectPendingSlotFillCue(input.promptText) &&
    !hasExplicitMemoryRejection(normalizeLower(input.promptText)) &&
    !hasQuotedOrHypotheticalCue(normalizeLower(input.promptText));
  const pendingContextResumeCue =
    selectedContextResumeFrames.length > 0 &&
    detectContextResumeCue(input.promptText) &&
    !hasExplicitMemoryRejection(normalizeLower(input.promptText)) &&
    !hasQuotedOrHypotheticalCue(normalizeLower(input.promptText));
  const memoryAllowedForCurrentGoal = admission.allowed_for_current_goal || pendingSlotFillCue || pendingContextResumeCue;
  const memoryAllowedReason = pendingSlotFillCue
    ? "Current prompt appears to fill a slot for an unresolved prior task frame."
    : pendingContextResumeCue
      ? "Current prompt references a pending context-compaction resume frame."
    : admission.allowed_reason;
  let allowedUse = admission.allowed_use;
  if (allowedUse === "conversational_continuity" && pendingInputs.length > 0 && followup.followup_kind === "pronoun") {
    allowedUse = "pending_request_resolution";
  }
  if (pendingSlotFillCue) {
    allowedUse = "pending_request_resolution";
  }
  if (pendingContextResumeCue) {
    allowedUse = "reuse_prior_evidence_refs";
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
  if (memoryAllowedForCurrentGoal && (followup.is_followup || pendingSlotFillCue) && latestPrior) {
    const phrase = followup.phrases[0] ?? (pendingSlotFillCue ? "pending task slot fill" : "follow-up");
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
  if (!memoryAllowedForCurrentGoal) {
    missingOrUncertain.push(memoryAllowedReason);
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
      selectedContextResumeFrames.length > 0
        ? `context resume frame: ${selectedContextResumeFrames[0].attachment_artifact_refs.slice(0, 3).join(", ")}`
        : "",
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
    recent_user_goals: memoryAllowedForCurrentGoal ? recentUserGoals : [],
    recent_assistant_answers: memoryAllowedForCurrentGoal ? recentAssistantAnswers : [],
    resolved_references: memoryAllowedForCurrentGoal ? resolvedReferences : [],
    reusable_evidence_refs: reusableEvidenceRefs,
    forbidden_or_stale_refs: forbiddenOrStaleRefs,
    open_failures: unique(failures, maxTurns),
    pending_user_inputs: unique(pendingInputs, maxTurns),
    unresolved_task_frames: unresolvedTaskFrames,
    context_resume_frames: selectedContextResumeFrames,
    context_resume_frame_selection: contextResumeFrameSelection.debug,
    latest_plan_summary: latestPlanSummary,
    latest_answer_summary: memoryAllowedForCurrentGoal ? latestAnswerSummary : null,
    latest_failure_summary: latestFailure,
    continuity_summary: memoryAllowedForCurrentGoal ? continuitySummary : "",
    missing_or_uncertain: unique(missingOrUncertain, 8),
    allowed_for_current_goal: memoryAllowedForCurrentGoal,
    allowed_reason: memoryAllowedReason,
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
    pending_user_inputs_count: packet.pending_user_inputs.length,
    unresolved_task_frames: packet.unresolved_task_frames.map((frame) => ({
      id: frame.id,
      kind: frame.kind,
      status: frame.status,
      missing_slots: frame.missing_slots,
      known_slot_keys: Object.keys(frame.known_slots ?? {}),
      allowed_next_actions: frame.allowed_next_actions,
    })),
    context_resume_frames: packet.context_resume_frames.map((frame) => ({
      id: frame.id,
      schema: frame.schema,
      thread_id: frame.thread_id ?? null,
      session_id: frame.session_id ?? null,
      source_request_id: frame.source_request_id,
      source_turn_id: frame.source_turn_id,
      created_at_ms: frame.created_at_ms ?? null,
      installed_at_ms: frame.installed_at_ms ?? null,
      status: frame.status ?? null,
      attachment_artifact_refs: frame.attachment_artifact_refs,
      attachment_preview_count: frame.attachment_previews.length,
    })),
    context_resume_frame_selection: packet.context_resume_frame_selection ?? null,
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
    packet.unresolved_task_frames.length > 0
      ? `unresolved task frames: ${packet.unresolved_task_frames
          .map((frame) =>
            [
              `${frame.id} kind=${frame.kind} status=${frame.status}`,
              `known=${Object.keys(frame.known_slots ?? {}).join(",") || "none"}`,
              `missing=${frame.missing_slots.join(",") || "none"}`,
            ].join(" "),
          )
          .join("; ")}`
      : "",
    packet.context_resume_frames.length > 0
      ? `context resume frames: ${packet.context_resume_frames
          .map((frame) =>
            [
              `${frame.id} schema=${frame.schema}`,
              `source_turn=${frame.source_turn_id}`,
              `original_prompt=${clip(frame.original_prompt, 180)}`,
              `attachment_refs=${frame.attachment_artifact_refs.join(",") || "none"}`,
              frame.attachment_previews.length > 0
                ? `attachment_previews=${frame.attachment_previews.map((preview) => clip(preview, 260)).join(" | ")}`
                : "attachment_previews=none",
            ].join(" "),
          )
          .join("; ")}`
      : "",
    packet.context_resume_frame_selection?.selected_context_resume_frame_id
      ? `selected context resume frame: ${packet.context_resume_frame_selection.selected_context_resume_frame_id} reason=${packet.context_resume_frame_selection.selected_context_resume_reason}`
      : "",
    packet.missing_or_uncertain.length > 0
      ? `missing or uncertain: ${packet.missing_or_uncertain.join("; ")}`
      : "",
    "Do not treat prior assistant answers as factual source authority unless reusable_evidence_refs are admitted.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function resolveHelixContextResumeFrameRecallText(input: {
  packet: HelixConversationMemoryPacket | null;
  promptText: string;
}): string | null {
  const packet = input.packet;
  if (!packet?.allowed_for_current_goal || packet.allowed_use !== "reuse_prior_evidence_refs") return null;
  if (!detectContextResumeCue(input.promptText)) return null;
  const prompt = normalizeLower(input.promptText);
  const asksForExactMarker =
    /\b(?:sentinel|marker|exact\s+line|marker\s+line|top\s+line|first\s+line)\b/.test(prompt);
  if (!asksForExactMarker) return null;
  let fallbackLine: string | null = null;
  for (const frame of [...packet.context_resume_frames].reverse()) {
    for (const preview of frame.attachment_previews) {
      const firstLine = normalizeText(preview.split(/\r?\n/).find((line: string) => line.trim()) ?? "");
      if (!firstLine) continue;
      fallbackLine ??= firstLine;
      const markerToken =
        firstLine.match(/\b[A-Z][A-Z0-9]+(?:_[A-Za-z0-9]+){2,}\b/)?.[0] ??
        firstLine.match(/\bsentinel\s+(?:token|marker)\s+(?:is|:)\s*([A-Za-z0-9_:-]+)\b/i)?.[1] ??
        null;
      if (markerToken) return markerToken;
    }
  }
  return fallbackLine;
}
