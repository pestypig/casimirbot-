import crypto from "node:crypto";

const TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY = "text_to_speech.speak_text" as const;

export type HelixAskReferentResolutionTrace = {
  schema: "helix.ask.referent_resolution_trace.v1";
  requested_action: string | null;
  referent_phrase: string | null;
  source_kind: string | null;
  resolved_source_ref: string | null;
  resolved_text_hash: string | null;
  resolution_confidence: "high" | "medium" | "low" | "blocked" | "not_applicable";
  resolution_block_reason: string | null;
  tool_argument_source: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixAskReferentResolution = {
  trace: HelixAskReferentResolutionTrace;
  resolvedText: string | null;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readQuestion = (body: Record<string, unknown>): string =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt) ?? "";

const sha256Short = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);

const unquotePrompt = (prompt: string): string =>
  prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

const blankTrace = (
  overrides: Partial<HelixAskReferentResolutionTrace> = {},
): HelixAskReferentResolutionTrace => ({
  schema: "helix.ask.referent_resolution_trace.v1",
  requested_action: null,
  referent_phrase: null,
  source_kind: null,
  resolved_source_ref: null,
  resolved_text_hash: null,
  resolution_confidence: "not_applicable",
  resolution_block_reason: null,
  tool_argument_source: null,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const isTextToSpeechCandidate = (candidate: Record<string, unknown> | null): boolean => {
  const capability = readString(candidate?.capability ?? candidate?.capability_id ?? candidate?.capabilityId);
  return capability === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY;
};

export const isAffirmativeReadAloudPrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (!/\b(?:read|speak|say|play|narrat(?:e|or)|voice)\b[\s\S]{0,100}\b(?:aloud|out\s*loud|outload|to\s+me)\b/i.test(unquoted)) {
    return false;
  }
  return !(
    /\b(?:do\s+not|don't|dont|without|not\s+now|no\s+need\s+to|avoid|stop)\b[\s\S]{0,120}\b(?:read|speak|say|play|narrat|voice)\b/i.test(unquoted) ||
    /\b(?:later|eventually|hypothetically|would|could|might|if|when|before|after|earlier|previously|historically)\b[\s\S]{0,160}\b(?:read|speak|say|play|narrat|voice)\b/i.test(unquoted)
  );
};

const readWorkspaceSnapshot = (body: Record<string, unknown>): Record<string, unknown> | null =>
  readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot);

const readChatReferentContext = (body: Record<string, unknown>): Record<string, unknown> | null => {
  const workspace = readWorkspaceSnapshot(body);
  return readRecord(workspace?.chat_referent_context ?? workspace?.chatReferentContext);
};

const readPreviousAssistantFinalAnswer = (body: Record<string, unknown>): { text: string; ref: string } | null => {
  const context = readChatReferentContext(body);
  const answer = readRecord(context?.previous_assistant_final_answer ?? context?.previousAssistantFinalAnswer);
  const text = readString(answer?.text);
  if (!text) return null;
  return {
    text,
    ref:
      readString(answer?.source_ref ?? answer?.sourceRef ?? answer?.reply_id ?? answer?.replyId) ??
      `chat.final_answer.previous:${sha256Short(text)}`,
  };
};

const readPreviousChatMessage = (body: Record<string, unknown>): { text: string; ref: string; role: string | null } | null => {
  const context = readChatReferentContext(body);
  const message = readRecord(context?.previous_chat_message ?? context?.previousChatMessage);
  const text = readString(message?.text);
  if (!text) return null;
  return {
    text,
    role: readString(message?.role),
    ref:
      readString(message?.source_ref ?? message?.sourceRef ?? message?.message_id ?? message?.messageId) ??
      `chat.message.previous:${sha256Short(text)}`,
  };
};

export const resolveHelixAskReadAloudReferent = (
  body: Record<string, unknown>,
): HelixAskReferentResolution => {
  const prompt = readQuestion(body);
  if (!prompt || !isAffirmativeReadAloudPrompt(prompt)) {
    return { trace: blankTrace(), resolvedText: null };
  }

  const unquoted = unquotePrompt(prompt);
  const requestedAction = TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY;
  const exactQuotedText =
    prompt.match(/\b(?:say|speak|read|play)\s+(?:exactly\s+)?["“]([^"”]{1,4000})["”]\s+(?:aloud|out\s*loud|outload|to\s+me)\b/i)?.[1] ??
    prompt.match(/\b(?:say|speak|read|play)\s+(?:exactly\s+)?'([^']{1,4000})'\s+(?:aloud|out\s*loud|outload|to\s+me)\b/i)?.[1];
  if (exactQuotedText?.trim()) {
    const text = exactQuotedText.trim();
    return {
      resolvedText: text,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "explicit_quoted_text",
        source_kind: "user_prompt_literal",
        resolved_source_ref: `prompt.literal:${sha256Short(text)}`,
        resolved_text_hash: sha256Short(text),
        resolution_confidence: "high",
        tool_argument_source: "referent_resolution:user_prompt_literal",
      }),
    };
  }

  if (/\b(?:last|previous|prior)\s+(?:final\s+)?(?:statement|answer|response|reply)\b/i.test(unquoted) ||
      /\byour\s+(?:last|previous|prior)\s+(?:final\s+)?(?:statement|answer|response|reply)\b/i.test(unquoted) ||
      /\b(?:what|thing)\s+you\s+(?:just|last|previously)\s+said\b/i.test(unquoted) ||
      /\bsay\s+that\s+again\b/i.test(unquoted)) {
    const previousAnswer = readPreviousAssistantFinalAnswer(body);
    if (previousAnswer) {
      return {
        resolvedText: previousAnswer.text,
        trace: blankTrace({
          requested_action: requestedAction,
          referent_phrase: "previous_assistant_final_answer",
          source_kind: "chat_history",
          resolved_source_ref: previousAnswer.ref,
          resolved_text_hash: sha256Short(previousAnswer.text),
          resolution_confidence: "high",
          tool_argument_source: "referent_resolution:chat_history",
        }),
      };
    }
    return {
      resolvedText: null,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "previous_assistant_final_answer",
        source_kind: "chat_history",
        resolution_confidence: "blocked",
        resolution_block_reason: "referent_resolution_required:missing_previous_assistant_final_answer",
        tool_argument_source: "referent_resolution:blocked",
      }),
    };
  }

  if (/\b(?:last|previous|prior)\s+message\b/i.test(unquoted)) {
    const previousMessage = readPreviousChatMessage(body);
    if (previousMessage) {
      return {
        resolvedText: previousMessage.text,
        trace: blankTrace({
          requested_action: requestedAction,
          referent_phrase: "previous_chat_message",
          source_kind: "chat_history",
          resolved_source_ref: previousMessage.ref,
          resolved_text_hash: sha256Short(previousMessage.text),
          resolution_confidence: previousMessage.role === "assistant" ? "high" : "medium",
          tool_argument_source: "referent_resolution:chat_history",
        }),
      };
    }
    return {
      resolvedText: null,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "previous_chat_message",
        source_kind: "chat_history",
        resolution_confidence: "blocked",
        resolution_block_reason: "referent_resolution_required:missing_previous_chat_message",
        tool_argument_source: "referent_resolution:blocked",
      }),
    };
  }

  if (/\b(?:selected|highlighted)\s+(?:text|sentence|paragraph|section|block)\b/i.test(unquoted)) {
    return {
      resolvedText: null,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "selected_text",
        source_kind: "selected_text",
        resolution_confidence: "medium",
        tool_argument_source: "referent_resolution:explicit_selected_surface",
      }),
    };
  }

  if (/\babstract\b/i.test(unquoted)) {
    return {
      resolvedText: null,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "abstract",
        source_kind: "active_document_named_section",
        resolution_confidence: "medium",
        tool_argument_source: "referent_resolution:explicit_document_section",
      }),
    };
  }

  if (/\b(?:this|that|it)\b/i.test(unquoted)) {
    return {
      resolvedText: null,
      trace: blankTrace({
        requested_action: requestedAction,
        referent_phrase: "deictic_read_aloud",
        source_kind: "ambiguous",
        resolution_confidence: "blocked",
        resolution_block_reason: "referent_resolution_required:ambiguous_deictic_read_aloud",
        tool_argument_source: "referent_resolution:blocked",
      }),
    };
  }

  return {
    resolvedText: null,
    trace: blankTrace({
      requested_action: requestedAction,
      referent_phrase: "unspecified_read_aloud_target",
      source_kind: "ambiguous",
      resolution_confidence: "blocked",
      resolution_block_reason: "referent_resolution_required:unspecified_read_aloud_target",
      tool_argument_source: "referent_resolution:blocked",
    }),
  };
};

export const enrichTextToSpeechCandidateWithResolvedReferent = (
  body: Record<string, unknown>,
  candidate: Record<string, unknown>,
): Record<string, unknown> => {
  if (!isTextToSpeechCandidate(candidate)) return candidate;
  const resolution = resolveHelixAskReadAloudReferent(body);
  if (resolution.trace.resolution_confidence === "not_applicable") return candidate;
  const enriched: Record<string, unknown> = {
    ...candidate,
    referent_resolution_trace: resolution.trace,
    source_target_intent: {
      ...readRecord(candidate.source_target_intent),
      referent_resolution_trace: resolution.trace,
      requested_action: resolution.trace.requested_action,
      source_kind: resolution.trace.source_kind,
      resolved_source_ref: resolution.trace.resolved_source_ref,
      tool_argument_source: resolution.trace.tool_argument_source,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    assistant_answer: false,
    terminal_eligible: false,
  };
  if (resolution.resolvedText) {
    enriched.text = resolution.resolvedText;
    enriched.source_observation_ref = resolution.trace.resolved_source_ref ?? undefined;
    enriched.source_text_hash = resolution.trace.resolved_text_hash ?? undefined;
    enriched.tool_argument_source = resolution.trace.tool_argument_source ?? undefined;
    return enriched;
  }
  if (resolution.trace.resolution_confidence === "blocked") {
    enriched.text = "";
    enriched.source_observation_ref = undefined;
    enriched.tool_argument_source = resolution.trace.tool_argument_source ?? undefined;
    enriched.reason_codes = [
      ...readArray(candidate.reason_codes).map(readString).filter((entry): entry is string => Boolean(entry)),
      resolution.trace.resolution_block_reason ?? "referent_resolution_required",
    ];
  }
  return enriched;
};

export const synthesizeTextToSpeechCandidateFromResolvedReferent = (
  body: Record<string, unknown>,
): Record<string, unknown> | null => {
  const resolution = resolveHelixAskReadAloudReferent(body);
  if (!resolution.resolvedText) return null;
  return {
    capability: TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
    text: resolution.resolvedText,
    source_observation_ref: resolution.trace.resolved_source_ref,
    source_text_hash: resolution.trace.resolved_text_hash,
    voice_playback_kind: "narrator_read",
    tool_argument_source: resolution.trace.tool_argument_source,
    referent_resolution_trace: resolution.trace,
    source_target_intent: {
      referent_resolution_trace: resolution.trace,
      requested_action: resolution.trace.requested_action,
      source_kind: resolution.trace.source_kind,
      resolved_source_ref: resolution.trace.resolved_source_ref,
      tool_argument_source: resolution.trace.tool_argument_source,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    assistant_answer: false,
    terminal_eligible: false,
  };
};
