import crypto from "node:crypto";
import {
  HELIX_VOICE_STEERING_DECISION_SCHEMA,
  HELIX_VOICE_STEERING_EVENT_SCHEMA,
  type HelixVoiceSteeringClassification,
  type HelixVoiceSteeringDecisionV1,
  type HelixVoiceSteeringEventV1,
  type HelixVoiceSteeringQueueDecision,
  type HelixVoiceSteeringTiming,
  validateHelixVoiceSteeringDecisionV1,
  validateHelixVoiceSteeringEventV1,
} from "@shared/contracts/helix-voice-steering-event.v1";

export type HelixVoiceSteeringBoundary =
  | "after_tool_result"
  | "before_next_model_step"
  | "before_final_synthesis"
  | "after_turn_complete";

const MAX_EVENTS_PER_KEY = 100;
const MAX_DECISIONS = 200;

const eventsById = new Map<string, HelixVoiceSteeringEventV1>();
const eventIdsByKey = new Map<string, string[]>();
const pendingIdsByKey = new Map<string, string[]>();
const decisionsById = new Map<string, HelixVoiceSteeringDecisionV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeText = (value: string | null | undefined): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeReasonCodes = (values: string[] | null | undefined): string[] => {
  const result = new Set<string>();
  for (const value of values ?? []) {
    const normalized = normalizeText(value);
    if (normalized) result.add(normalized);
  }
  return Array.from(result);
};

const storeKey = (threadId: string, turnId: string | null | undefined): string =>
  `${threadId.trim()}::${normalizeText(turnId) || "idle"}`;

const pushLimited = (map: Map<string, string[]>, key: string, value: string, limit: number) => {
  const current = map.get(key) ?? [];
  const next = [...current.filter((entry) => entry !== value), value].slice(-limit);
  map.set(key, next);
};

const pruneDecisions = () => {
  while (decisionsById.size > MAX_DECISIONS) {
    const firstKey = decisionsById.keys().next().value;
    if (!firstKey) break;
    decisionsById.delete(firstKey);
  }
};

export function classifyVoiceSteeringTranscript(args: {
  transcriptText: string;
  activeTurnPresent: boolean;
  activeGoalText?: string | null;
}): {
  classification: HelixVoiceSteeringClassification;
  queueDecision: HelixVoiceSteeringQueueDecision;
  confidence: "low" | "medium" | "high";
  reasonCodes: string[];
} {
  const text = args.transcriptText.trim();

  if (/\b(stop|cancel|abort|pause|never mind|nevermind)\b/i.test(text)) {
    return {
      classification: "cancel_or_stop",
      queueDecision: "cancel_requested",
      confidence: "high",
      reasonCodes: ["explicit_cancel_phrase"],
    };
  }

  if (!text || text.length < 3) {
    return {
      classification: "ambient",
      queueDecision: "ambient_ignored",
      confidence: "low",
      reasonCodes: ["too_short_or_empty"],
    };
  }

  if (/\b(actually|correction|i meant|not that|use .* instead)\b/i.test(text)) {
    return {
      classification: "correction",
      queueDecision: "queued_for_safe_boundary",
      confidence: "high",
      reasonCodes: ["correction_phrase"],
    };
  }

  if (/\b(do not|don't|dont|only|never|make sure|must|instead)\b/i.test(text)) {
    return {
      classification: "constraint",
      queueDecision: "queued_for_safe_boundary",
      confidence: "medium",
      reasonCodes: ["constraint_phrase"],
    };
  }

  if (/\b(also|while you|check|look at|remember|include)\b/i.test(text)) {
    return {
      classification: "on_topic_additive",
      queueDecision: args.activeTurnPresent ? "queued_for_safe_boundary" : "deferred_to_new_turn",
      confidence: "medium",
      reasonCodes: ["additive_phrase"],
    };
  }

  return {
    classification: args.activeTurnPresent ? "off_topic_new_goal" : "on_topic_additive",
    queueDecision: args.activeTurnPresent ? "deferred_to_new_turn" : "queued_for_safe_boundary",
    confidence: "low",
    reasonCodes: ["default_classifier"],
  };
}

const targetForQueueDecision = (
  queueDecision: HelixVoiceSteeringQueueDecision,
): HelixVoiceSteeringEventV1["target"] => {
  switch (queueDecision) {
    case "queued_for_safe_boundary":
      return "active_turn";
    case "applied_to_next_step":
      return "next_solver_step";
    case "deferred_to_new_turn":
      return "new_turn";
    case "cancel_requested":
      return "active_turn";
    case "ambient_ignored":
    case "rejected_off_topic":
      return "none";
  }
};

export function recordVoiceSteeringEvent(input: {
  threadId: string;
  turnId?: string | null;
  expectedTurnId?: string | null;
  source?: HelixVoiceSteeringEventV1["source"] | null;
  transcriptText: string;
  timing?: HelixVoiceSteeringTiming | null;
  classification?: HelixVoiceSteeringClassification | null;
  queueDecision?: HelixVoiceSteeringQueueDecision | null;
  confidence?: "low" | "medium" | "high" | null;
  target?: HelixVoiceSteeringEventV1["target"] | null;
  activeGoalText?: string | null;
  capturedAt?: string | null;
  evidenceRefs?: string[];
  reasonCodes?: string[];
}): HelixVoiceSteeringEventV1 {
  const threadId = normalizeText(input.threadId);
  const turnId = normalizeText(input.turnId) || null;
  const transcriptText = normalizeText(input.transcriptText);
  const activeTurnPresent = Boolean(turnId);
  const classified = classifyVoiceSteeringTranscript({
    transcriptText,
    activeTurnPresent,
    activeGoalText: input.activeGoalText,
  });
  const classification = input.classification ?? classified.classification;
  const queueDecision = input.queueDecision ?? classified.queueDecision;
  const confidence = input.confidence ?? classified.confidence;
  const target = input.target ?? targetForQueueDecision(queueDecision);
  const expectedTurnId =
    normalizeText(input.expectedTurnId) ||
    (target === "active_turn" && turnId ? turnId : null);
  const capturedAt = normalizeText(input.capturedAt) || new Date().toISOString();
  const normalizedText = transcriptText.toLowerCase();
  const steeringEventId = `helix_voice_steering_event:${hashShort([
    threadId,
    turnId,
    transcriptText,
    classification,
    queueDecision,
    capturedAt,
  ])}`;
  const event: HelixVoiceSteeringEventV1 = {
    artifactId: "helix_voice_steering_event",
    schemaVersion: HELIX_VOICE_STEERING_EVENT_SCHEMA,
    steeringEventId,
    threadId,
    turnId,
    expectedTurnId,
    source: input.source ?? "voice_capture",
    transcriptText,
    normalizedText,
    capturedAt,
    timing: input.timing ?? (activeTurnPresent ? "during_reasoning" : "idle"),
    classification,
    queueDecision,
    target,
    confidence,
    evidenceRefs: normalizeReasonCodes(input.evidenceRefs),
    reasonCodes: normalizeReasonCodes([...classified.reasonCodes, ...(input.reasonCodes ?? [])]),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
  const issues = validateHelixVoiceSteeringEventV1(event);
  if (issues.length > 0) {
    throw new Error(`invalid voice steering event: ${issues.join("; ")}`);
  }
  eventsById.set(event.steeringEventId, event);
  const key = storeKey(event.threadId, event.turnId);
  pushLimited(eventIdsByKey, key, event.steeringEventId, MAX_EVENTS_PER_KEY);
  if (event.queueDecision === "queued_for_safe_boundary") {
    pushLimited(pendingIdsByKey, key, event.steeringEventId, MAX_EVENTS_PER_KEY);
  }
  return event;
}

export function listVoiceSteeringEvents(input: {
  threadId: string;
  turnId?: string | null;
  limit?: number | null;
}): HelixVoiceSteeringEventV1[] {
  const key = storeKey(input.threadId, input.turnId);
  const limit = Math.max(1, Math.min(Math.floor(input.limit ?? MAX_EVENTS_PER_KEY), MAX_EVENTS_PER_KEY));
  return (eventIdsByKey.get(key) ?? [])
    .slice(-limit)
    .map((id) => eventsById.get(id))
    .filter((event): event is HelixVoiceSteeringEventV1 => Boolean(event));
}

export function listPendingVoiceSteeringEvents(input: {
  threadId: string;
  turnId: string;
  limit?: number | null;
}): HelixVoiceSteeringEventV1[] {
  const key = storeKey(input.threadId, input.turnId);
  const limit = Math.max(1, Math.min(Math.floor(input.limit ?? MAX_EVENTS_PER_KEY), MAX_EVENTS_PER_KEY));
  return (pendingIdsByKey.get(key) ?? [])
    .slice(0, limit)
    .map((id) => eventsById.get(id))
    .filter((event): event is HelixVoiceSteeringEventV1 => Boolean(event));
}

const decisionForEvent = (
  event: HelixVoiceSteeringEventV1,
): HelixVoiceSteeringDecisionV1["decision"] => {
  switch (event.queueDecision) {
    case "queued_for_safe_boundary":
    case "applied_to_next_step":
      return "steering_applied";
    case "deferred_to_new_turn":
      return "steering_requires_new_turn";
    case "rejected_off_topic":
      return "steering_rejected_off_topic";
    case "cancel_requested":
      return "turn_cancel_requested";
    case "ambient_ignored":
      return "ambient_ignored";
  }
};

export function recordVoiceSteeringDecision(input: {
  steeringEventId: string;
  decision?: HelixVoiceSteeringDecisionV1["decision"] | null;
  appliedAtBoundary?: HelixVoiceSteeringDecisionV1["appliedAtBoundary"];
  modelVisibleSummary?: string | null;
  newTurnCandidateText?: string | null;
  interimVoiceCalloutRequestRef?: string | null;
  evidenceRefs?: string[];
  reasonCodes?: string[];
}): HelixVoiceSteeringDecisionV1 {
  const event = eventsById.get(input.steeringEventId);
  if (!event) {
    throw new Error(`voice steering event not found: ${input.steeringEventId}`);
  }
  const decision = input.decision ?? decisionForEvent(event);
  const decisionId = `helix_voice_steering_decision:${hashShort([
    event.steeringEventId,
    decision,
    input.appliedAtBoundary ?? null,
    Date.now(),
  ])}`;
  const modelVisibleSummary =
    input.modelVisibleSummary ??
    (decision === "steering_applied"
      ? `User voice steering received: ${event.transcriptText}`
      : null);
  const steeringDecision: HelixVoiceSteeringDecisionV1 = {
    artifactId: "helix_voice_steering_decision",
    schemaVersion: HELIX_VOICE_STEERING_DECISION_SCHEMA,
    decisionId,
    steeringEventId: event.steeringEventId,
    threadId: event.threadId,
    turnId: event.turnId,
    decision,
    appliedAtBoundary: input.appliedAtBoundary ?? null,
    modelVisibleSummary,
    newTurnCandidateText:
      input.newTurnCandidateText ??
      (decision === "steering_requires_new_turn" ? event.transcriptText : null),
    interimVoiceCalloutRequestRef: input.interimVoiceCalloutRequestRef ?? null,
    evidenceRefs: normalizeReasonCodes([
      event.steeringEventId,
      ...event.evidenceRefs,
      ...(input.evidenceRefs ?? []),
    ]),
    reasonCodes: normalizeReasonCodes([
      ...event.reasonCodes,
      ...(input.reasonCodes ?? []),
    ]),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    instruction_authority: "none",
    context_role: "tool_evidence",
  };
  const issues = validateHelixVoiceSteeringDecisionV1(steeringDecision);
  if (issues.length > 0) {
    throw new Error(`invalid voice steering decision: ${issues.join("; ")}`);
  }
  decisionsById.set(steeringDecision.decisionId, steeringDecision);
  pruneDecisions();
  return steeringDecision;
}

export function drainPendingVoiceSteeringEvents(input: {
  threadId: string;
  turnId: string;
  boundary: HelixVoiceSteeringBoundary;
  limit?: number | null;
}): {
  events: HelixVoiceSteeringEventV1[];
  decisions: HelixVoiceSteeringDecisionV1[];
} {
  const key = storeKey(input.threadId, input.turnId);
  const pendingIds = pendingIdsByKey.get(key) ?? [];
  const limit = Math.max(1, Math.min(Math.floor(input.limit ?? pendingIds.length), MAX_EVENTS_PER_KEY));
  const drainedIds = pendingIds.slice(0, limit);
  pendingIdsByKey.set(key, pendingIds.slice(drainedIds.length));
  const events = drainedIds
    .map((id) => eventsById.get(id))
    .filter((event): event is HelixVoiceSteeringEventV1 => Boolean(event));
  const decisions = events.map((event) =>
    recordVoiceSteeringDecision({
      steeringEventId: event.steeringEventId,
      decision: "steering_applied",
      appliedAtBoundary: input.boundary,
      reasonCodes: [`drained_${input.boundary}`],
    }),
  );
  return { events, decisions };
}

export function resetVoiceSteeringEventsForTest(): void {
  eventsById.clear();
  eventIdsByKey.clear();
  pendingIdsByKey.clear();
  decisionsById.clear();
}
