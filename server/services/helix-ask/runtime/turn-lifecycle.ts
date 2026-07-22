import {
  HELIX_TURN_LIFECYCLE_EVENT_SCHEMA,
  HELIX_TURN_LIFECYCLE_SCHEMA,
  type HelixTurnLifecycle,
  type HelixTurnLifecycleEvent,
  type HelixTurnLifecycleEventKind,
  type HelixTurnLifecycleProducer,
  type HelixTurnLifecycleScope,
} from "@shared/helix-turn-lifecycle";
import {
  auditHelixTurnLifecycleIntegrity,
  reduceHelixTurnLifecycle,
} from "./turn-lifecycle-reducer";

type AppendLifecycleEvent = Omit<
  HelixTurnLifecycleEvent,
  | "schema"
  | "turn_id"
  | "event_id"
  | "sequence"
  | "occurred_at_ms"
  | "assistant_answer"
  | "raw_content_included"
> & {
  event_id?: string;
  occurred_at_ms?: number;
};

const normalizeEventKind = (value: string): string => value.replace(/[^a-z0-9]+/gi, "_");

export type HelixTurnLifecycleRecorder = {
  append: (event: AppendLifecycleEvent) => HelixTurnLifecycleEvent;
  latest: (kind?: HelixTurnLifecycleEvent["kind"]) => HelixTurnLifecycleEvent | null;
  snapshot: () => HelixTurnLifecycle;
};

export const createHelixTurnLifecycleRecorder = (input: {
  turnId: string;
  scope?: HelixTurnLifecycleScope;
  now?: () => number;
}): HelixTurnLifecycleRecorder => {
  const events: HelixTurnLifecycleEvent[] = [];
  const now = input.now ?? Date.now;

  const append = (entry: AppendLifecycleEvent): HelixTurnLifecycleEvent => {
    const sequence = events.length + 1;
    const event: HelixTurnLifecycleEvent = {
      schema: HELIX_TURN_LIFECYCLE_EVENT_SCHEMA,
      turn_id: input.turnId,
      event_id:
        entry.event_id ??
        `${input.turnId}:lifecycle:${String(sequence).padStart(3, "0")}:${normalizeEventKind(entry.kind)}`,
      sequence,
      occurred_at_ms: entry.occurred_at_ms ?? now(),
      assistant_answer: false,
      raw_content_included: false,
      ...entry,
    };
    events.push(event);
    return event;
  };

  const latest = (kind?: HelixTurnLifecycleEvent["kind"]): HelixTurnLifecycleEvent | null =>
    [...events].reverse().find((event: HelixTurnLifecycleEvent) => !kind || event.kind === kind) ?? null;

  const snapshot = (): HelixTurnLifecycle => {
    const copiedEvents = events.map((event: HelixTurnLifecycleEvent) => ({ ...event }));
    const reduction = reduceHelixTurnLifecycle({ turnId: input.turnId, events: copiedEvents });
    return {
      schema: HELIX_TURN_LIFECYCLE_SCHEMA,
      turn_id: input.turnId,
      scope: input.scope ?? "helix_ask_turn",
      authority: "runtime_event_log",
      events: copiedEvents,
      reduction,
      integrity: auditHelixTurnLifecycleIntegrity({
        turnId: input.turnId,
        events: copiedEvents,
        reduction,
      }),
      assistant_answer: false,
      raw_content_included: false,
    };
  };

  return { append, latest, snapshot };
};

const EVENT_KINDS = new Set<HelixTurnLifecycleEventKind>([
  "turn.started",
  "route.proposed",
  "route.committed",
  "route.rejected",
  "capability.proposed",
  "capability.admitted",
  "capability.rejected",
  "tool.call.started",
  "tool.call.completed",
  "tool.call.failed",
  "tool.call.rejected",
  "observation.reentered",
  "agent.message.completed",
  "runtime.turn.completed",
  "runtime.turn.failed",
  "terminal.eligibility.checked",
  "turn.completed",
  "turn.failed",
  "turn.needs_input",
]);

const EVENT_PRODUCERS = new Set<HelixTurnLifecycleProducer>([
  "codex_runtime",
  "helix_adapter",
  "helix_policy",
  "helix_terminal_authority",
]);

const LIFECYCLE_SCOPES = new Set<HelixTurnLifecycleScope>([
  "codex_native_provider_cycle",
  "helix_ask_turn",
]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readLifecycleEvent = (value: unknown): HelixTurnLifecycleEvent | null => {
  const event = readRecord(value);
  if (
    event?.schema !== HELIX_TURN_LIFECYCLE_EVENT_SCHEMA ||
    typeof event.turn_id !== "string" ||
    typeof event.event_id !== "string" ||
    typeof event.sequence !== "number" ||
    !Number.isInteger(event.sequence) ||
    event.sequence < 1 ||
    typeof event.occurred_at_ms !== "number" ||
    !Number.isFinite(event.occurred_at_ms) ||
    !EVENT_KINDS.has(event.kind as HelixTurnLifecycleEventKind) ||
    !EVENT_PRODUCERS.has(event.producer as HelixTurnLifecycleProducer) ||
    event.assistant_answer !== false ||
    event.raw_content_included !== false
  ) {
    return null;
  }
  return event as HelixTurnLifecycleEvent;
};

export const readVerifiedHelixTurnLifecycle = (input: {
  value: unknown;
  turnId: string;
  requiredScope?: HelixTurnLifecycleScope;
}): HelixTurnLifecycle | null => {
  const lifecycle = readRecord(input.value);
  const scope = lifecycle?.scope as HelixTurnLifecycleScope | undefined;
  if (
    lifecycle?.schema !== HELIX_TURN_LIFECYCLE_SCHEMA ||
    lifecycle.turn_id !== input.turnId ||
    lifecycle.authority !== "runtime_event_log" ||
    !scope ||
    !LIFECYCLE_SCOPES.has(scope) ||
    (input.requiredScope && scope !== input.requiredScope) ||
    !Array.isArray(lifecycle.events)
  ) {
    return null;
  }
  const events = lifecycle.events.map(readLifecycleEvent);
  if (events.some((event: HelixTurnLifecycleEvent | null) => event === null)) return null;
  const verifiedEvents = events as HelixTurnLifecycleEvent[];
  const reduction = reduceHelixTurnLifecycle({ turnId: input.turnId, events: verifiedEvents });
  const integrity = auditHelixTurnLifecycleIntegrity({
    turnId: input.turnId,
    events: verifiedEvents,
    reduction,
  });
  if (!integrity.ok) return null;
  return {
    schema: HELIX_TURN_LIFECYCLE_SCHEMA,
    turn_id: input.turnId,
    scope,
    authority: "runtime_event_log",
    events: verifiedEvents.map((event: HelixTurnLifecycleEvent) => ({ ...event })),
    reduction,
    integrity,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const readVerifiedHelixTurnLifecycleFromPayload = (input: {
  payload: Record<string, unknown>;
  turnId: string;
  requiredScope?: HelixTurnLifecycleScope;
}): HelixTurnLifecycle | null => {
  const debug = readRecord(input.payload.debug);
  for (const value of [input.payload.turn_lifecycle, debug?.turn_lifecycle]) {
    const lifecycle = readVerifiedHelixTurnLifecycle({
      value,
      turnId: input.turnId,
      requiredScope: input.requiredScope,
    });
    if (lifecycle) return lifecycle;
  }
  return null;
};

export const readVerifiedHelixRuntimeLifecycleFromPayload = (input: {
  payload: Record<string, unknown>;
  turnId: string;
}): HelixTurnLifecycle | null => {
  const debug = readRecord(input.payload.debug);
  const nativeBridge =
    readRecord(input.payload.codex_native_provider_bridge) ??
    readRecord(debug?.codex_native_provider_bridge);
  const nativeWorkstationTurn = readRecord(nativeBridge?.native_workstation_turn);
  const nativeCandidates = [
    input.payload.native_provider_turn_lifecycle,
    debug?.native_provider_turn_lifecycle,
    nativeWorkstationTurn?.turn_lifecycle,
  ];
  for (const value of nativeCandidates) {
    const lifecycle = readVerifiedHelixTurnLifecycle({
      value,
      turnId: input.turnId,
      requiredScope: "codex_native_provider_cycle",
    });
    if (lifecycle) return lifecycle;
  }
  return readVerifiedHelixTurnLifecycleFromPayload({
    payload: input.payload,
    turnId: input.turnId,
  });
};

export type HelixRuntimeObservationReentryResolution = {
  authority: "runtime_event_log" | "compatibility_projection";
  runtime_lifecycle_verified: boolean;
  reentered: boolean;
  candidate_refs: string[];
  matched_reentry_refs: string[];
  runtime_observation_reentry_refs: string[];
};

export const resolveHelixRuntimeObservationReentry = (input: {
  payload: Record<string, unknown>;
  turnId: string;
  candidateRefs: string[];
  compatibilityProjected?: boolean;
}): HelixRuntimeObservationReentryResolution => {
  const candidateRefs = Array.from(new Set(
    input.candidateRefs.map((ref) => ref.trim()).filter(Boolean),
  ));
  const lifecycle = readVerifiedHelixRuntimeLifecycleFromPayload({
    payload: input.payload,
    turnId: input.turnId,
  });
  if (lifecycle) {
    const runtimeObservationReentryRefs = lifecycle.reduction.observation_reentry_refs;
    const runtimeRefSet = new Set(runtimeObservationReentryRefs);
    const matchedReentryRefs = candidateRefs.filter((ref) => runtimeRefSet.has(ref));
    return {
      authority: "runtime_event_log",
      runtime_lifecycle_verified: true,
      reentered: matchedReentryRefs.length > 0,
      candidate_refs: candidateRefs,
      matched_reentry_refs: matchedReentryRefs,
      runtime_observation_reentry_refs: runtimeObservationReentryRefs,
    };
  }
  return {
    authority: "compatibility_projection",
    runtime_lifecycle_verified: false,
    reentered: input.compatibilityProjected === true,
    candidate_refs: candidateRefs,
    matched_reentry_refs: input.compatibilityProjected === true ? candidateRefs : [],
    runtime_observation_reentry_refs: [],
  };
};
