import type {
  HelixTurnLifecycleEvent,
  HelixTurnLifecycleIntegrity,
  HelixTurnLifecycleIntegrityViolation,
  HelixTurnLifecycleReduction,
  HelixTurnLifecycleToolCallReduction,
} from "@shared/helix-turn-lifecycle";

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value: string | null | undefined): value is string => Boolean(value))));

const terminalKinds = new Set([
  "turn.completed",
  "turn.failed",
  "turn.needs_input",
]);

export const reduceHelixTurnLifecycle = (input: {
  turnId: string;
  events: HelixTurnLifecycleEvent[];
}): HelixTurnLifecycleReduction => {
  const events = [...input.events].sort((left, right) => left.sequence - right.sequence);
  const calls = new Map<string, HelixTurnLifecycleToolCallReduction>();
  let routeCommitId: string | null = null;
  const admittedCapabilityIds: string[] = [];
  const latestAdmissionByCapabilityId = new Map<string, HelixTurnLifecycleEvent>();
  let latestReentryEvent: HelixTurnLifecycleEvent | null = null;
  let finalAgentMessageEvent: HelixTurnLifecycleEvent | null = null;
  let runtimeTurnCompleted = false;
  let terminalEligibilityEvent: HelixTurnLifecycleEvent | null = null;

  for (const event of events) {
    if (event.kind === "route.committed") {
      routeCommitId = event.route_commit_id ?? event.event_id;
    }
    if (event.kind === "capability.admitted" && event.capability_id) {
      admittedCapabilityIds.push(event.capability_id);
      latestAdmissionByCapabilityId.set(event.capability_id, event);
    }
    if (event.kind === "runtime.turn.completed") runtimeTurnCompleted = true;
    if (event.kind === "terminal.eligibility.checked") terminalEligibilityEvent = event;
    if (event.kind === "agent.message.completed") finalAgentMessageEvent = event;
    if (event.kind === "observation.reentered") latestReentryEvent = event;
    if (!event.call_id) continue;

    const current = calls.get(event.call_id) ?? {
      call_id: event.call_id,
      capability_id: event.capability_id ?? null,
      admission_event_id: event.capability_id
        ? latestAdmissionByCapabilityId.get(event.capability_id)?.event_id ?? null
        : null,
      started_event_id: null,
      completion_event_id: null,
      completion_kind: null,
      completion_observation_refs: [],
      reentry_observation_refs: [],
      observation_refs: [],
      reentry_event_id: null,
      reentered: false,
    };
    if (!current.capability_id && event.capability_id) current.capability_id = event.capability_id;
    if (!current.admission_event_id && event.capability_id) {
      current.admission_event_id = latestAdmissionByCapabilityId.get(event.capability_id)?.event_id ?? null;
    }
    if (event.kind === "tool.call.started") current.started_event_id = event.event_id;
    if (
      event.kind === "tool.call.completed" ||
      event.kind === "tool.call.failed" ||
      event.kind === "tool.call.rejected"
    ) {
      current.completion_event_id = event.event_id;
      current.completion_kind = event.kind;
      current.completion_observation_refs = unique(event.observation_refs ?? []);
    }
    if (event.kind === "observation.reentered") {
      current.reentry_event_id = event.event_id;
      current.reentered = true;
      current.reentry_observation_refs = unique(event.observation_refs ?? []);
    }
    current.observation_refs = unique([
      ...current.completion_observation_refs,
      ...current.reentry_observation_refs,
    ]);
    calls.set(event.call_id, current);
  }

  const terminalEvents = events.filter((event: HelixTurnLifecycleEvent) => terminalKinds.has(event.kind));
  const terminalEvent = terminalEvents.at(-1) ?? null;
  const postObservationReasoningCompleted = Boolean(
    finalAgentMessageEvent &&
      (!latestReentryEvent || finalAgentMessageEvent.sequence > latestReentryEvent.sequence),
  );
  const toolCalls = Array.from(calls.values());

  return {
    schema: "helix.turn_lifecycle_reduction.v1",
    turn_id: input.turnId,
    phase: events.at(-1)?.kind ?? "empty",
    route_commit_id: routeCommitId,
    admitted_capability_ids: unique(admittedCapabilityIds),
    tool_calls: toolCalls,
    pending_call_ids: toolCalls
      .filter((call: HelixTurnLifecycleToolCallReduction) => call.started_event_id && !call.completion_event_id)
      .map((call: HelixTurnLifecycleToolCallReduction) => call.call_id),
    observation_reentry_refs: unique(
      toolCalls.flatMap((call: HelixTurnLifecycleToolCallReduction) => call.reentry_observation_refs),
    ),
    latest_reentry_event_id: latestReentryEvent?.event_id ?? null,
    final_agent_message_event_id: finalAgentMessageEvent?.event_id ?? null,
    post_observation_reasoning_completed: postObservationReasoningCompleted,
    runtime_turn_completed: runtimeTurnCompleted,
    terminal_eligibility_event_id: terminalEligibilityEvent?.event_id ?? null,
    terminal_eligible:
      terminalEligibilityEvent && typeof terminalEligibilityEvent.terminal_eligible === "boolean"
        ? terminalEligibilityEvent.terminal_eligible
        : null,
    terminal_event_count: terminalEvents.length,
    terminal_outcome:
      terminalEvent?.kind === "turn.completed"
        ? "completed"
        : terminalEvent?.kind === "turn.failed"
          ? "failed"
          : terminalEvent?.kind === "turn.needs_input"
            ? "needs_input"
            : null,
    complete:
      terminalEvent?.kind === "turn.completed" &&
      runtimeTurnCompleted &&
      postObservationReasoningCompleted,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const auditHelixTurnLifecycleIntegrity = (input: {
  turnId: string;
  events: HelixTurnLifecycleEvent[];
  reduction?: HelixTurnLifecycleReduction;
}): HelixTurnLifecycleIntegrity => {
  const events = [...input.events].sort((left, right) => left.sequence - right.sequence);
  const reduction = input.reduction ?? reduceHelixTurnLifecycle(input);
  const violations: HelixTurnLifecycleIntegrityViolation[] = [];
  const eventIds = new Set<string>();
  const eventSequenceById = new Map(events.map((event) => [event.event_id, event.sequence]));
  const admittedCapabilitySequence = new Map<string, number>();
  const startedCalls = new Map<string, HelixTurnLifecycleEvent>();
  const settledCalls = new Map<string, HelixTurnLifecycleEvent>();
  const reenteredCalls = new Map<string, HelixTurnLifecycleEvent>();

  events.forEach((event: HelixTurnLifecycleEvent, index: number) => {
    if (event.sequence !== index + 1) {
      violations.push({
        code: "event_sequence_invalid",
        event_id: event.event_id,
        detail: `Expected sequence ${index + 1}, received ${event.sequence}.`,
      });
    }
    if (event.turn_id !== input.turnId) {
      violations.push({
        code: "event_turn_id_mismatch",
        event_id: event.event_id,
        detail: `Expected turn ${input.turnId}, received ${event.turn_id}.`,
      });
    }
    if (eventIds.has(event.event_id)) {
      violations.push({
        code: "duplicate_event_id",
        event_id: event.event_id,
        detail: `Event ID ${event.event_id} was emitted more than once.`,
      });
    }
    eventIds.add(event.event_id);
    if (event.causation_id) {
      const causationSequence = eventSequenceById.get(event.causation_id);
      if (causationSequence === undefined) {
        violations.push({
          code: "event_causation_missing",
          event_id: event.event_id,
          detail: `Causation event ${event.causation_id} is absent from this lifecycle.`,
        });
      } else if (causationSequence >= event.sequence) {
        violations.push({
          code: "event_causation_not_prior",
          event_id: event.event_id,
          detail: `Causation event ${event.causation_id} does not precede ${event.event_id}.`,
        });
      }
    }
    if (event.kind === "capability.admitted" && event.capability_id) {
      admittedCapabilitySequence.set(event.capability_id, event.sequence);
    }
    if (event.kind === "tool.call.started" && event.call_id) {
      const priorStart = startedCalls.get(event.call_id);
      if (priorStart) {
        violations.push({
          code: "duplicate_tool_call_start",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} started more than once.`,
        });
      } else {
        startedCalls.set(event.call_id, event);
      }
      const admissionSequence = event.capability_id
        ? admittedCapabilitySequence.get(event.capability_id)
        : undefined;
      if (!event.capability_id || admissionSequence === undefined || admissionSequence >= event.sequence) {
        violations.push({
          code: "tool_call_started_without_admission",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} started without a prior capability.admitted event.`,
        });
      }
    }
    if (
      (event.kind === "tool.call.completed" || event.kind === "tool.call.failed" || event.kind === "tool.call.rejected") &&
      event.call_id
    ) {
      const priorSettlement = settledCalls.get(event.call_id);
      if (priorSettlement) {
        violations.push({
          code: "duplicate_tool_call_settlement",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} settled more than once.`,
        });
      } else {
        settledCalls.set(event.call_id, event);
      }
      const start = startedCalls.get(event.call_id);
      if (event.kind !== "tool.call.rejected" && !start) {
        violations.push({
          code: "tool_call_settled_without_start",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} settled without a prior tool.call.started event.`,
        });
      }
      if (start && start.capability_id !== event.capability_id) {
        violations.push({
          code: "tool_call_capability_mismatch",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} changed capability identity between start and settlement.`,
        });
      }
      if (event.kind === "tool.call.completed" && unique(event.observation_refs ?? []).length === 0) {
        violations.push({
          code: "tool_call_completed_without_observation",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Successful tool call ${event.call_id} completed without an observation reference.`,
        });
      }
    }
    if (event.kind === "observation.reentered" && event.call_id) {
      const priorReentry = reenteredCalls.get(event.call_id);
      if (priorReentry) {
        violations.push({
          code: "duplicate_observation_reentry",
          event_id: event.event_id,
          call_id: event.call_id,
          detail: `Tool call ${event.call_id} recorded observation re-entry more than once.`,
        });
      } else {
        reenteredCalls.set(event.call_id, event);
      }
    }
  });

  for (const call of reduction.tool_calls) {
    if (call.reentered && !call.completion_event_id) {
      violations.push({
        code: "observation_reentry_without_tool_completion",
        event_id: call.reentry_event_id ?? undefined,
        call_id: call.call_id,
        detail: "The adapter recorded observation re-entry without a completed, failed, or rejected tool call.",
      });
    }
    if (call.reentered && call.completion_event_id) {
      const completedRefs = [...call.completion_observation_refs].sort();
      const reenteredRefs = [...call.reentry_observation_refs].sort();
      if (
        completedRefs.length !== reenteredRefs.length ||
        completedRefs.some((ref, index) => ref !== reenteredRefs[index])
      ) {
        violations.push({
          code: "observation_reentry_ref_mismatch",
          event_id: call.reentry_event_id ?? undefined,
          call_id: call.call_id,
          detail: "The re-entered observation references do not exactly match the settled tool observation references.",
        });
      }
    }
    if (
      reduction.terminal_outcome === "completed" &&
      call.completion_event_id &&
      !call.reentered
    ) {
      violations.push({
        code: "completed_tool_observation_not_reentered",
        event_id: call.completion_event_id,
        call_id: call.call_id,
        detail: "The turn completed after a tool result without recording transport-level re-entry.",
      });
    }
  }

  if (
    reduction.latest_reentry_event_id &&
    reduction.final_agent_message_event_id &&
    !reduction.post_observation_reasoning_completed
  ) {
    violations.push({
      code: "agent_message_precedes_latest_reentry",
      event_id: reduction.final_agent_message_event_id,
      detail: "The final agent message was emitted before the latest observation re-entered the runtime.",
    });
  }
  if (reduction.terminal_outcome === "completed" && !reduction.final_agent_message_event_id) {
    violations.push({
      code: "turn_completed_without_agent_message",
      detail: "The turn completed without an agent.message.completed event.",
    });
  }
  const finalAgentMessageEvent = events
    .filter((event) => event.kind === "agent.message.completed")
    .at(-1) ?? null;
  const runtimeCompletionEvent = events
    .filter((event) => event.kind === "runtime.turn.completed")
    .at(-1) ?? null;
  const turnCompletionEvent = events
    .filter((event) => event.kind === "turn.completed")
    .at(-1) ?? null;
  if (
    runtimeCompletionEvent &&
    (!finalAgentMessageEvent || finalAgentMessageEvent.sequence >= runtimeCompletionEvent.sequence)
  ) {
    violations.push({
      code: "runtime_completion_without_prior_agent_message",
      event_id: runtimeCompletionEvent.event_id,
      detail: "runtime.turn.completed must follow the final agent.message.completed event.",
    });
  }
  if (
    turnCompletionEvent &&
    (!runtimeCompletionEvent || runtimeCompletionEvent.sequence >= turnCompletionEvent.sequence)
  ) {
    violations.push({
      code: "turn_completion_without_prior_runtime_completion",
      event_id: turnCompletionEvent.event_id,
      detail: "turn.completed must follow runtime.turn.completed.",
    });
  }
  const terminalEligibilityEvent = events
    .filter((event) => event.kind === "terminal.eligibility.checked")
    .at(-1) ?? null;
  if (
    turnCompletionEvent &&
    (!terminalEligibilityEvent ||
      terminalEligibilityEvent.sequence >= turnCompletionEvent.sequence ||
      terminalEligibilityEvent.terminal_eligible !== true)
  ) {
    violations.push({
      code: "turn_completion_without_terminal_eligibility",
      event_id: turnCompletionEvent.event_id,
      detail: "turn.completed requires a prior successful terminal.eligibility.checked event.",
    });
  }
  if (reduction.terminal_event_count > 1) {
    violations.push({
      code: "multiple_terminal_events",
      detail: `The lifecycle contains ${reduction.terminal_event_count} terminal events.`,
    });
  }
  const terminalOutcomes = unique(
    events
      .filter((event: HelixTurnLifecycleEvent) => terminalKinds.has(event.kind))
      .map((event: HelixTurnLifecycleEvent) => event.kind),
  );
  if (terminalOutcomes.length > 1) {
    violations.push({
      code: "conflicting_terminal_events",
      detail: `Conflicting terminal events were emitted: ${terminalOutcomes.join(", ")}.`,
    });
  }

  return {
    schema: "helix.turn_lifecycle_integrity.v1",
    ok: violations.length === 0,
    violations,
    assistant_answer: false,
    raw_content_included: false,
  };
};
