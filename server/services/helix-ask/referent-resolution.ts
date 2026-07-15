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

export type HelixAskConversationalReferentResolutionTrace = {
  schema: "helix.ask.conversational_referent_resolution.v1";
  referent_detected: boolean;
  referent_phrase: string | null;
  source_kind: "chat_history" | null;
  resolved_source_ref: string | null;
  resolved_text_hash: string | null;
  resolution_confidence: "high" | "medium" | "blocked" | "not_applicable";
  resolution_block_reason: string | null;
  explicit_topic_phrase: string | null;
  explicit_topic_terms: string[];
  candidate_count: number;
  matched_candidate_count: number;
  selection_policy: "latest_answer" | "explicit_topic_match" | "blocked_topic_mismatch" | null;
  context_role: "evidence_for_followup_reasoning" | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixAskConversationalReferentResolution = {
  trace: HelixAskConversationalReferentResolutionTrace;
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

type ConversationalReferentCandidate = {
  text: string;
  ref: string;
};

const readRecentAssistantFinalAnswers = (
  body: Record<string, unknown>,
): ConversationalReferentCandidate[] => {
  const context = readChatReferentContext(body);
  const recent = readArray(
    context?.recent_assistant_final_answers ?? context?.recentAssistantFinalAnswers,
  )
    .map(readRecord)
    .flatMap((answer): ConversationalReferentCandidate[] => {
      const text = readString(answer?.text);
      if (!text) return [];
      return [{
        text,
        ref:
          readString(answer?.source_ref ?? answer?.sourceRef ?? answer?.reply_id ?? answer?.replyId) ??
          `chat.final_answer.recent:${sha256Short(text)}`,
      }];
    });
  const previous = readPreviousAssistantFinalAnswer(body);
  const ordered = previous ? [previous, ...recent] : recent;
  const seenHashes = new Set<string>();
  return ordered.filter((candidate) => {
    const hash = sha256Short(candidate.text);
    if (seenHashes.has(hash)) return false;
    seenHashes.add(hash);
    return true;
  });
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

const blankConversationalReferentTrace = (
  overrides: Partial<HelixAskConversationalReferentResolutionTrace> = {},
): HelixAskConversationalReferentResolutionTrace => ({
  schema: "helix.ask.conversational_referent_resolution.v1",
  referent_detected: false,
  referent_phrase: null,
  source_kind: null,
  resolved_source_ref: null,
  resolved_text_hash: null,
  resolution_confidence: "not_applicable",
  resolution_block_reason: null,
  explicit_topic_phrase: null,
  explicit_topic_terms: [],
  candidate_count: 0,
  matched_candidate_count: 0,
  selection_policy: null,
  context_role: null,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const EXPLICIT_REFERENT_TOPIC_STOP_WORDS = new Set([
  "claim",
  "concept",
  "discussion",
  "evidence",
  "finding",
  "paper",
  "physic",
  "physical",
  "physics",
  "point",
  "previous",
  "prior",
  "reference",
  "research",
  "response",
  "scholarly",
  "science",
  "scientific",
  "source",
  "topic",
]);

const normalizeTopicToken = (token: string): string => {
  const normalized = token.toLowerCase();
  if (normalized.endsWith("ies") && normalized.length > 4) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("s") && normalized.length > 4 && !normalized.endsWith("ss")) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const explicitTopicTerms = (value: string): string[] =>
  [...new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map(normalizeTopicToken)
      .filter((token) => token.length >= 3 && !EXPLICIT_REFERENT_TOPIC_STOP_WORDS.has(token)),
  )];

const explicitConversationalTopicPhrase = (prompt: string): string | null => {
  const unquoted = unquotePrompt(prompt).replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(?:supporting|for|about|on)\s+(?:the\s+)?([a-z0-9][a-z0-9\s-]{1,100}?)\s+(?:claims?|points?|topics?|concepts?)\s+(?:that\s+)?(?:we|you)\s+(?:just\s+)?(?:discussed|were\s+(?:just\s+)?discussing|have\s+been\s+discussing|talked\s+about|were\s+talking\s+about)\b/i,
    /\b(?:supporting|for|about|on)\s+(?:the\s+)?([a-z0-9][a-z0-9\s-]{1,100}?)\s+(?:claims?|points?|topics?|concepts?)\s+(?:from|in)\s+(?:(?:the|our|your)\s+)?(?:earlier|previous|prior|last)\s+(?:answer|response|discussion|conversation)\b/i,
  ];
  for (const pattern of patterns) {
    const phrase = readString(unquoted.match(pattern)?.[1]);
    if (phrase && explicitTopicTerms(phrase).length > 0) return phrase;
  }
  return null;
};

const conversationalCandidateTopicScore = (candidate: string, terms: string[]): number => {
  const candidateTerms = new Set(explicitTopicTerms(candidate));
  return terms.reduce((score, term) => score + (candidateTerms.has(term) ? 1 : 0), 0);
};

export const conversationalReferentTextCannotSupplyRequestedEvidence = (value: string): boolean => {
  const text = value.trim();
  return (
    /^i\s+(?:therefore\s+)?(?:could\s+not|cannot|couldn['’]?t|can['’]?t)\b[\s\S]{0,220}\b(?:complete|answer|produce|provide|create|present|treat|use|cite|map|support|verify)\b/i.test(text) ||
    /\b(?:could\s+not|cannot|couldn['’]?t|can['’]?t)\s+honestly\s+(?:present|treat|use|cite|map|offer)\b[\s\S]{0,180}\b(?:claims?|evidence|support)\b/i.test(text) ||
    /^(?:these|those|the)\s+(?:results?|search(?:es)?|papers?|sources?|evidence)\b[\s\S]{0,180}\b(?:do|does|did|can|could|would)\s+not\b[\s\S]{0,100}\b(?:support|match|address|establish|verify)\b/i.test(text) ||
    /^(?:the\s+)?(?:conversational\s+)?referent\b[\s\S]{0,120}\b(?:incorrectly\s+resolved|resolution\s+failed|was\s+missing)\b/i.test(text) ||
    /^backend\s+ask\s+was\s+reached\b/i.test(text) ||
    /^the\s+turn\s+failed\b/i.test(text) ||
    /^the\s+(?:immediately\s+)?(?:previous|prior|last)\s+(?:answer|response)\s+(?:contained|contains|had|has)\s+no\s+(?:scientific|physics|research)\s+claims?\b/i.test(text) ||
    /^there\s+(?:are|were)\s+no\s+(?:scientific|physics|research)\s+claims?\b/i.test(text)
  );
};

const conversationalReferentPhrase = (prompt: string): string | null => {
  const unquoted = unquotePrompt(prompt).replace(/\s+/g, " ").trim();
  if (!unquoted) return null;
  if (
    /\b(?:ignore|disregard|avoid|do\s+not\s+use|don't\s+use|dont\s+use)\b[\s\S]{0,100}\b(?:what\s+we\s+(?:just\s+)?(?:discussed|were\s+discussing|talked\s+about)|the\s+(?:previous|last|prior)\s+(?:answer|response|discussion|claims?|points?|topics?))\b/i.test(unquoted) ||
    /\b(?:do\s+not|don't|dont|without|avoid|ignore|disregard)\s+(?:using|use|relying\s+on|rely\s+on|referencing|reference|considering|consider|carrying\s+over|carry\s+over|restoring|restore)?\s*(?:the\s+|your\s+)?(?:previous|last|prior)\s+(?:assistant\s+)?(?:answer|response|reply|explanation|statement|summary|discussion|claims?|points?|topics?)\b/i.test(unquoted)
  ) {
    return null;
  }
  if (
    /^\s*(?:if|when)\b[\s\S]{0,180}\b(?:later|eventually|next\s+time|in\s+the\s+future)\b/i.test(unquoted) &&
    !/\b(?:now|right\s+now|you\s+just|just\s+(?:said|described|explained|mentioned|listed|identified|outlined))\b/i.test(unquoted)
  ) {
    return null;
  }
  if (
    /\b(?:those|these|the)\s+(?:(?:two|three|four|five|\d+)\s+)?(?:(?:failure|evidence|route|tool|scientific|execution|context)\s+)?(?:things?|causes?|reasons?|failures?|issues?|points?|steps?|items?|layers?|problems?|options?|examples?|prompts?|results?|findings?|details?)\s+(?:that\s+)?you\s+(?:just|previously)\s+(?:described|mentioned|explained|listed|identified|gave|said|outlined)\b/i.test(unquoted) ||
    /\b(?:what|the\s+thing|that)\s+you\s+(?:just|previously)\s+(?:said|described|mentioned|explained|listed|identified|outlined)\b/i.test(unquoted) ||
    /\b(?:the\s+)?(?:(?:scientific|physics|physical|research)\s+)?(?:claims?|points?|topics?|concepts?|things?)\s+(?:that\s+)?(?:we|you)\s+(?:just\s+)?(?:discussed|were\s+(?:just\s+)?discussing|have\s+been\s+discussing|talked\s+about|were\s+talking\s+about)\b/i.test(unquoted) ||
    /\b(?:the\s+)?(?:(?:scientific|physics|physical|research)\s+)?(?:claims?|points?|topics?|concepts?|things?)\s+(?:in|from|of)\s+(?:(?:the|your)\s+)?(?:immediately\s+)?(?:previous|last|prior)\s+(?:assistant\s+)?(?:answer|response|reply|explanation|statement|summary)\b/i.test(unquoted) ||
    /\bwhat\s+(?:we|you)\s+(?:just\s+)?(?:discussed|were\s+(?:just\s+)?discussing|have\s+been\s+discussing|talked\s+about|were\s+talking\s+about)\b/i.test(unquoted)
  ) {
    return "deictic_previous_assistant_answer";
  }
  if (
    /\b(?:the|your)\s+(?:immediately\s+)?(?:previous|last|prior)\s+(?:assistant\s+)?(?:answer|response|reply|explanation|statement|summary)\b/i.test(unquoted)
  ) {
    return "previous_assistant_final_answer";
  }
  if (
    /\bbased\s+on\s+(?:that|those|this|the\s+(?:previous|last|prior)\s+(?:answer|response|reply|explanation|statement|summary))\b/i.test(unquoted) ||
    /\b(?:can|could|would)\s+you\s+(?:do|apply|explain|continue|expand\s+on|clarify)\s+that\b/i.test(unquoted)
  ) {
    return "deictic_previous_assistant_answer";
  }
  return null;
};

export const resolveHelixAskConversationalReferent = (
  body: Record<string, unknown>,
): HelixAskConversationalReferentResolution => {
  const referentPhrase = conversationalReferentPhrase(readQuestion(body));
  if (!referentPhrase) {
    return { trace: blankConversationalReferentTrace(), resolvedText: null };
  }
  const candidates = readRecentAssistantFinalAnswers(body);
  const explicitTopicPhrase = explicitConversationalTopicPhrase(readQuestion(body));
  const topicTerms = explicitTopicPhrase ? explicitTopicTerms(explicitTopicPhrase) : [];
  if (candidates.length === 0) {
    return {
      resolvedText: null,
      trace: blankConversationalReferentTrace({
        referent_detected: true,
        referent_phrase: referentPhrase,
        source_kind: "chat_history",
        resolution_confidence: "blocked",
        resolution_block_reason: "referent_resolution_required:missing_previous_assistant_final_answer",
        explicit_topic_phrase: explicitTopicPhrase,
        explicit_topic_terms: topicTerms,
        context_role: "evidence_for_followup_reasoning",
      }),
    };
  }
  const minimumTopicMatches = Math.max(1, Math.ceil(topicTerms.length * 0.6));
  const matchingCandidates = topicTerms.length > 0
    ? candidates.filter((candidate) =>
        !conversationalReferentTextCannotSupplyRequestedEvidence(candidate.text) &&
        conversationalCandidateTopicScore(candidate.text, topicTerms) >= minimumTopicMatches)
    : candidates;
  if (topicTerms.length > 0 && matchingCandidates.length === 0) {
    return {
      resolvedText: null,
      trace: blankConversationalReferentTrace({
        referent_detected: true,
        referent_phrase: referentPhrase,
        source_kind: "chat_history",
        resolution_confidence: "blocked",
        resolution_block_reason: "referent_resolution_required:explicit_topic_mismatch",
        explicit_topic_phrase: explicitTopicPhrase,
        explicit_topic_terms: topicTerms,
        candidate_count: candidates.length,
        matched_candidate_count: 0,
        selection_policy: "blocked_topic_mismatch",
        context_role: "evidence_for_followup_reasoning",
      }),
    };
  }
  const selectedAnswer = matchingCandidates[0] ?? candidates[0]!;
  return {
    resolvedText: selectedAnswer.text,
    trace: blankConversationalReferentTrace({
      referent_detected: true,
      referent_phrase: referentPhrase,
      source_kind: "chat_history",
      resolved_source_ref: selectedAnswer.ref,
      resolved_text_hash: sha256Short(selectedAnswer.text),
      resolution_confidence: "high",
      explicit_topic_phrase: explicitTopicPhrase,
      explicit_topic_terms: topicTerms,
      candidate_count: candidates.length,
      matched_candidate_count: matchingCandidates.length,
      selection_policy: topicTerms.length > 0 ? "explicit_topic_match" : "latest_answer",
      context_role: "evidence_for_followup_reasoning",
    }),
  };
};

export const conversationalReferentCannotSupplyRequestedEvidence = (
  body: Record<string, unknown>,
): boolean => {
  const resolution = resolveHelixAskConversationalReferent(body);
  const retainedText = resolution.resolvedText?.trim() ?? "";
  return (
    resolution.trace.referent_detected === true &&
    (
      resolution.trace.resolution_confidence === "blocked" ||
      (
        resolution.trace.resolution_confidence === "high" &&
        conversationalReferentTextCannotSupplyRequestedEvidence(retainedText)
      )
    )
  );
};

export const conversationalReferentHasExplicitTopicFallback = (
  body: Record<string, unknown>,
): boolean => {
  const resolution = resolveHelixAskConversationalReferent(body);
  return Boolean(
    resolution.trace.referent_detected === true &&
    resolution.trace.resolution_confidence === "blocked" &&
    resolution.trace.explicit_topic_phrase?.trim() &&
    resolution.trace.explicit_topic_terms.length > 0
  );
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
