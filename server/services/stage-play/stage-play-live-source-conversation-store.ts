import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_CONVERSATION_CONTEXT_PACK_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_CONVERSATION_EVENT_SCHEMA,
  type StagePlayLiveSourceConversationContextPackV1,
  type StagePlayLiveSourceConversationEventSourceV1,
  type StagePlayLiveSourceConversationEventV1,
  type StagePlayLiveSourceConversationIntentV1,
  type StagePlayLiveSourceConversationPriorityV1,
} from "@shared/contracts/stage-play-live-source-conversation.v1";

const conversationEventsById = new Map<string, StagePlayLiveSourceConversationEventV1>();
const MAX_EVENTS_PER_THREAD = 250;

type StagePlayConversationListener = (
  event: StagePlayLiveSourceConversationEventV1,
) => void;

const conversationListeners = new Set<StagePlayConversationListener>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 360): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

export function classifyStagePlayLiveSourceConversationEvent(input: {
  text: string;
  source?: StagePlayLiveSourceConversationEventSourceV1 | null;
}): {
  intent: StagePlayLiveSourceConversationIntentV1;
  priority: StagePlayLiveSourceConversationPriorityV1;
} {
  const text = input.text.trim();
  if (/\b(?:stop|cancel|pause|shut up|be quiet|silent|stop talking|don't talk|do not talk)\b/i.test(text)) {
    return { intent: "pause_or_stop", priority: "urgent_user_interrupt" };
  }
  if (/\b(?:only|never|always|unless|don't|do not|must|make sure|call out|tell me if|announce if)\b/i.test(text)) {
    if (/\b(?:voice|speak|talk|callout|call out|announce|say aloud|out loud|urgent|danger|diamonds)\b/i.test(text)) {
      return { intent: "voice_preference_update", priority: "policy_update" };
    }
    return { intent: "constrain_policy", priority: "policy_update" };
  }
  if (/\b(?:actually|correction|i meant|not that|instead|wrong|fix that)\b/i.test(text)) {
    return { intent: "correct_agent", priority: "active_user_prompt" };
  }
  if (/\b(?:urgent|priority|prioritize|asap|right now|first)\b/i.test(text)) {
    return { intent: "priority_update", priority: "active_user_prompt" };
  }
  if (/\b(?:what should i do|what do you think|should i|recommend|strategy|next move|what next)\b/i.test(text)) {
    return { intent: "ask_strategy", priority: "active_user_prompt" };
  }
  if (/\b(?:what do you think|opinion|does this seem|is this good)\b/i.test(text)) {
    return { intent: "ask_opinion", priority: "active_user_prompt" };
  }
  if (/\b(?:yes|no|correct|that's right|that is right|answer is|it is|i choose)\b/i.test(text)) {
    return { intent: "answer_agent_question", priority: "active_user_prompt" };
  }
  if (input.source === "assistant_question") {
    return { intent: "ask_strategy", priority: "background_context" };
  }
  if (input.source === "assistant_answer") {
    return { intent: "casual_comment", priority: "background_context" };
  }
  return { intent: "casual_comment", priority: "background_context" };
}

const trimThreadEvents = (threadId: string): void => {
  const events = Array.from(conversationEventsById.values())
    .filter((event) => event.threadId === threadId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  if (events.length <= MAX_EVENTS_PER_THREAD) return;
  for (const event of events.slice(0, events.length - MAX_EVENTS_PER_THREAD)) {
    conversationEventsById.delete(event.eventId);
  }
};

export function recordStagePlayLiveSourceConversationEvent(input: {
  threadId: string;
  text: string;
  source: StagePlayLiveSourceConversationEventSourceV1;
  jobId?: string | null;
  turnId?: string | null;
  intent?: StagePlayLiveSourceConversationIntentV1 | null;
  priority?: StagePlayLiveSourceConversationPriorityV1 | null;
  mailIds?: string[];
  narrativeStateId?: string | null;
  watchJobPolicyRef?: string | null;
  evidenceRefs?: string[];
  now?: string;
}): StagePlayLiveSourceConversationEventV1 {
  const createdAt = input.now ?? new Date().toISOString();
  const classified = classifyStagePlayLiveSourceConversationEvent({
    text: input.text,
    source: input.source,
  });
  const textPreview = clipText(input.text);
  const evidenceRefs = uniqueStrings([
    ...(input.evidenceRefs ?? []),
    ...(input.mailIds ?? []),
    input.narrativeStateId,
    input.watchJobPolicyRef,
    input.jobId,
    input.turnId,
  ]);
  const event: StagePlayLiveSourceConversationEventV1 = {
    artifactId: "stage_play_live_source_conversation_event",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_CONVERSATION_EVENT_SCHEMA,
    eventId: `stage_play_live_source_conversation_event:${hashShort([
      input.threadId,
      input.jobId ?? null,
      input.turnId ?? null,
      input.source,
      textPreview,
      createdAt,
    ])}`,
    threadId: input.threadId,
    jobId: input.jobId ?? null,
    turnId: input.turnId ?? null,
    source: input.source,
    textPreview,
    intent: input.intent ?? classified.intent,
    priority: input.priority ?? classified.priority,
    appliesTo: {
      mailIds: uniqueStrings(input.mailIds ?? []),
      narrativeStateId: input.narrativeStateId ?? null,
      watchJobPolicyRef: input.watchJobPolicyRef ?? null,
    },
    evidenceRefs,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  conversationEventsById.set(event.eventId, event);
  trimThreadEvents(input.threadId);
  for (const listener of conversationListeners) {
    try {
      listener(event);
    } catch {
      // Observers cannot roll back or block the canonical conversation write.
    }
  }
  return event;
}

export function subscribeStagePlayLiveSourceConversationEvents(
  listener: StagePlayConversationListener,
): () => void {
  conversationListeners.add(listener);
  return () => conversationListeners.delete(listener);
}

export function listStagePlayLiveSourceConversationEvents(input: {
  threadId?: string | null;
  jobId?: string | null;
  turnId?: string | null;
  source?: StagePlayLiveSourceConversationEventSourceV1 | null;
  intent?: StagePlayLiveSourceConversationIntentV1 | null;
  limit?: number;
} = {}): StagePlayLiveSourceConversationEventV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(conversationEventsById.values())
    .filter((event) => {
      if (input.threadId && event.threadId !== input.threadId) return false;
      if (input.jobId && event.jobId !== input.jobId) return false;
      if (input.turnId && event.turnId !== input.turnId) return false;
      if (input.source && event.source !== input.source) return false;
      if (input.intent && event.intent !== input.intent) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

const compactEvent = (event: StagePlayLiveSourceConversationEventV1) => ({
  eventId: event.eventId,
  textPreview: event.textPreview,
  intent: event.intent,
  priority: event.priority,
  evidenceRefs: event.evidenceRefs,
  createdAt: event.createdAt,
});

export function buildStagePlayLiveSourceConversationContextPack(input: {
  threadId: string;
  jobId?: string | null;
  turnId?: string | null;
  limit?: number;
  now?: string;
}): StagePlayLiveSourceConversationContextPackV1 {
  const createdAt = input.now ?? new Date().toISOString();
  const events = listStagePlayLiveSourceConversationEvents({
    threadId: input.threadId,
    jobId: input.jobId ?? null,
    limit: input.limit ?? 40,
  });
  const recentUserQuestions = events
    .filter((event) =>
      (event.source === "user_text" || event.source === "user_voice") &&
      (event.intent === "ask_opinion" || event.intent === "ask_strategy" || event.intent === "answer_agent_question")
    )
    .slice(-8)
    .map(compactEvent);
  const recentAssistantAnswers = events
    .filter((event) => event.source === "assistant_answer")
    .slice(-6)
    .map((event) => ({
      eventId: event.eventId,
      textPreview: event.textPreview,
      evidenceRefs: event.evidenceRefs,
      createdAt: event.createdAt,
    }));
  const activeConstraints = events
    .filter((event) =>
      event.intent === "constrain_policy" ||
      event.intent === "priority_update" ||
      event.intent === "voice_preference_update"
    )
    .slice(-10)
    .map(compactEvent);
  const openQuestions = events
    .filter((event) => event.source === "assistant_question" || event.intent === "ask_opinion" || event.intent === "ask_strategy")
    .slice(-8)
    .map((event) => ({
      eventId: event.eventId,
      textPreview: event.textPreview,
      source: event.source,
      evidenceRefs: event.evidenceRefs,
      createdAt: event.createdAt,
    }));
  const heldCallouts = events
    .filter((event) => (
      event.intent === "pause_or_stop" ||
      (event.intent === "voice_preference_update" && /\b(?:silent|quiet|urgent|danger|diamonds|only)\b/i.test(event.textPreview))
    ))
    .slice(-8)
    .map(compactEvent);
  const lastAgreedObjectiveEvent = [...events]
    .reverse()
    .find((event) => (
      event.intent === "constrain_policy" ||
      event.intent === "priority_update" ||
      /\b(?:objective|goal|watch for|only call out|only tell me)\b/i.test(event.textPreview)
    )) ?? null;
  const voicePreferences = events
    .filter((event) =>
      event.intent === "voice_preference_update" ||
      (event.intent === "pause_or_stop" && /\b(?:voice|speak|talk|callout|announce|silent|quiet|urgent)\b/i.test(event.textPreview)) ||
      /\b(?:voice|speak|talk|callout|announce|silent|quiet)\b/i.test(event.textPreview)
    )
    .slice(-8)
    .map(compactEvent);
  const evidenceRefs = uniqueStrings(events.flatMap((event) => [event.eventId, ...event.evidenceRefs]));
  return {
    artifactId: "stage_play_live_source_conversation_context_pack",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_CONVERSATION_CONTEXT_PACK_SCHEMA,
    contextPackId: `stage_play_live_source_conversation_context_pack:${hashShort([
      input.threadId,
      input.jobId ?? null,
      events.map((event) => event.eventId),
      createdAt,
    ])}`,
    threadId: input.threadId,
    jobId: input.jobId ?? null,
    turnId: input.turnId ?? null,
    recentUserQuestions,
    recentAssistantAnswers,
    activeConstraints,
    openQuestions,
    heldCallouts,
    lastAgreedObjective: lastAgreedObjectiveEvent
      ? {
          eventId: lastAgreedObjectiveEvent.eventId,
          textPreview: lastAgreedObjectiveEvent.textPreview,
          evidenceRefs: lastAgreedObjectiveEvent.evidenceRefs,
          createdAt: lastAgreedObjectiveEvent.createdAt,
        }
      : null,
    voicePreferences,
    events,
    evidenceRefs,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function resetStagePlayLiveSourceConversationStoreForTest(): void {
  conversationEventsById.clear();
}
