import crypto from "node:crypto";
import type { HelixCapabilityLifecycleLedger } from "@shared/helix-capability-lifecycle-ledger";
import type { HelixEnvironmentEvent } from "@shared/helix-environment-event-stream";
import type {
  HelixAgentRunEvent,
  HelixAgentRunEventType,
} from "@shared/contracts/helix-agent-api.v1";
import {
  HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
  helixOperatorActivityEventSchema,
  type HelixOperatorActivityEvent,
} from "@shared/helix-operator-activity";

export type HelixOperatorActivityScope = {
  profileRef: string;
  nodeRef: string;
  oauthClientRef?: string | null;
  clientSessionRef?: string | null;
  providerThreadRef?: string | null;
  providerThreadEpoch?: string | null;
  runId?: string | null;
  environmentBindingRef?: string | null;
};

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const safeReferencePattern = /^[a-zA-Z0-9:._/-]+$/u;
const sensitiveReferencePattern =
  /(?:^|[._:/-])(?:bearer|authorization|password|passwd|secret|token|api[_-]?key|private[_-]?key)(?:$|[._:/-])|^sk-[a-z0-9_-]+$/iu;
const safeReference = (value: string): string => {
  const normalized = value.trim();
  if (
    normalized.length > 0 &&
    normalized.length <= 512 &&
    safeReferencePattern.test(normalized) &&
    !sensitiveReferencePattern.test(normalized)
  ) {
    return normalized;
  }
  return `operator_activity_ref_hash:${sha256(normalized).slice(0, 48)}`;
};

const uniqueSafeReferences = (values: string[]): string[] =>
  [...new Set(values.map(safeReference))].slice(0, 128);

const eventId = (input: {
  sourceKind: string;
  sourceSchema: string;
  sourceEventRef: string;
  profileRef: string;
  nodeRef: string;
}): string =>
  `operator_activity:${sha256(JSON.stringify(input)).slice(0, 48)}`;

const stageEventKind = (
  stage: HelixCapabilityLifecycleLedger["stages"][number]["stage"],
): HelixOperatorActivityEvent["event_kind"] => {
  switch (stage) {
    case "planned":
      return "request";
    case "admitted":
      return "admission";
    case "dispatched":
      return "dispatch";
    case "result_validated":
      return "evidence";
    case "reentered_solver":
      return "checkpoint";
    case "terminal_considered":
      return "status";
    default:
      return "observation";
  }
};

const capabilitySummary = (
  stage: HelixCapabilityLifecycleLedger["stages"][number]["stage"],
  status: HelixCapabilityLifecycleLedger["stages"][number]["status"],
): string =>
  `Capability ${stage.replaceAll("_", " ")}: ${status}.`;

export const normalizeCapabilityLifecycleActivity = (input: {
  ledger: HelixCapabilityLifecycleLedger;
  scope: HelixOperatorActivityScope;
  projectionSequenceStart: number;
  occurredAt: string;
  observedAt: string;
}): HelixOperatorActivityEvent[] =>
  input.ledger.stages.map((stage, index) => {
    const sourceEventRef = safeReference(
      `${input.ledger.turn_id}:${stage.stage}:${index}`,
    );
    const base = {
      sourceKind: "mcp_capability_lifecycle" as const,
      sourceSchema: input.ledger.schema,
      sourceEventRef,
      profileRef: input.scope.profileRef,
      nodeRef: input.scope.nodeRef,
    };
    return helixOperatorActivityEventSchema.parse({
      schema: HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
      activity_event_id: eventId(base),
      projection_sequence: input.projectionSequenceStart + index,
      source_kind: base.sourceKind,
      source_schema: base.sourceSchema,
      source_event_ref: base.sourceEventRef,
      profile_ref: base.profileRef,
      node_ref: base.nodeRef,
      oauth_client_ref: input.scope.oauthClientRef ?? null,
      client_session_ref: input.scope.clientSessionRef ?? null,
      provider_thread_ref: input.scope.providerThreadRef ?? null,
      provider_thread_epoch: input.scope.providerThreadEpoch ?? null,
      run_id: input.scope.runId ?? null,
      turn_id: input.ledger.turn_id,
      capability_call_ref:
        input.ledger.capability_plan_id ?? input.ledger.capability_result_id,
      environment_binding_ref: input.scope.environmentBindingRef ?? null,
      room_ref: null,
      source_ref: null,
      world_ref: null,
      workflow_ref: null,
      effect_lease_ref: null,
      terminal_product_ref: null,
      event_kind: stageEventKind(stage.stage),
      lifecycle_stage: stage.stage,
      outcome: stage.status,
      summary: capabilitySummary(stage.stage, stage.status),
      evidence_refs: uniqueSafeReferences(stage.refs),
      occurred_at: input.occurredAt,
      observed_at: input.observedAt,
      provenance: "derived",
      redaction_state: "sanitized",
      visibility: "profile",
      content_role: "operator_activity_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

const environmentOutcome = (
  eventType: string,
): HelixOperatorActivityEvent["outcome"] => {
  if (
    eventType === "workflow.failed" ||
    eventType === "workflow.timed_out" ||
    eventType === "actor.died"
  ) {
    return "failed";
  }
  if (
    eventType === "workflow.canceled" ||
    eventType === "workflow.emergency_stopped"
  ) {
    return "canceled";
  }
  if (
    eventType === "workflow.completed" ||
    eventType === "workflow.succeeded"
  ) {
    return "succeeded";
  }
  return "pending";
};

const environmentEventKind = (
  eventType: string,
): HelixOperatorActivityEvent["event_kind"] => {
  const outcome = environmentOutcome(eventType);
  if (outcome === "failed") return "failure";
  if (outcome === "canceled") return "cancellation";
  if (outcome === "succeeded") return "completion";
  return "observation";
};

export const normalizeEnvironmentEventActivity = (input: {
  event: HelixEnvironmentEvent;
  scope: HelixOperatorActivityScope;
  projectionSequence: number;
}): HelixOperatorActivityEvent => {
  const sourceEventRef = safeReference(input.event.event_id);
  const base = {
    sourceKind: "environment_event" as const,
    sourceSchema: input.event.schema,
    sourceEventRef,
    profileRef: input.scope.profileRef,
    nodeRef: input.scope.nodeRef,
  };
  const outcome = environmentOutcome(input.event.event_type);
  return helixOperatorActivityEventSchema.parse({
    schema: HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
    activity_event_id: eventId(base),
    projection_sequence: input.projectionSequence,
    source_kind: base.sourceKind,
    source_schema: base.sourceSchema,
    source_event_ref: base.sourceEventRef,
    profile_ref: base.profileRef,
    node_ref: base.nodeRef,
    oauth_client_ref: input.scope.oauthClientRef ?? null,
    client_session_ref: input.scope.clientSessionRef ?? null,
    provider_thread_ref: input.scope.providerThreadRef ?? null,
    provider_thread_epoch: input.scope.providerThreadEpoch ?? null,
    run_id: input.scope.runId ?? null,
    turn_id: null,
    capability_call_ref: null,
    environment_binding_ref: input.scope.environmentBindingRef ?? null,
    room_ref: input.event.room_id,
    source_ref: input.event.source_id,
    world_ref: input.event.world_id,
    workflow_ref: input.event.workflow_ref,
    effect_lease_ref: null,
    terminal_product_ref: null,
    event_kind: environmentEventKind(input.event.event_type),
    lifecycle_stage: "environment_observed",
    outcome,
    summary: `Environment ${input.event.event_type.replaceAll(".", " ")}: ${outcome}.`,
    evidence_refs: uniqueSafeReferences([
      input.event.event_id,
      ...input.event.evidence_refs,
    ]),
    occurred_at: input.event.occurred_at,
    observed_at: input.event.observed_at,
    provenance: input.event.provenance,
    redaction_state: "sanitized",
    visibility: "profile",
    content_role: "operator_activity_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

const agentEventOutcome = (
  eventType: HelixAgentRunEventType,
): HelixOperatorActivityEvent["outcome"] => {
  switch (eventType) {
    case "run_completed":
      return "succeeded";
    case "run_failed":
      return "failed";
    case "run_cancelled":
      return "canceled";
    case "run_blocked":
    case "budget_exhausted":
      return "blocked";
    default:
      return "pending";
  }
};

const agentEventKind = (
  eventType: HelixAgentRunEventType,
): HelixOperatorActivityEvent["event_kind"] => {
  switch (eventType) {
    case "run_started":
      return "request";
    case "continuation_received":
      return "dispatch";
    case "evidence_reentered":
      return "evidence";
    case "run_completed":
      return "completion";
    case "run_failed":
      return "failure";
    case "run_cancelled":
      return "cancellation";
    case "issues_resolved":
    case "terminal_authority_evaluated":
      return "checkpoint";
    default:
      return "status";
  }
};

export const normalizeAgentRunEventActivity = (input: {
  event: HelixAgentRunEvent;
  scope: HelixOperatorActivityScope;
  projectionSequence: number;
  observedAt?: string;
}): HelixOperatorActivityEvent => {
  const sourceEventRef = safeReference(input.event.event_id);
  const base = {
    sourceKind: "agent_turn_lifecycle" as const,
    sourceSchema: input.event.schema,
    sourceEventRef,
    profileRef: input.scope.profileRef,
    nodeRef: input.scope.nodeRef,
  };
  const outcome = agentEventOutcome(input.event.event_type);
  return helixOperatorActivityEventSchema.parse({
    schema: HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
    activity_event_id: eventId(base),
    projection_sequence: input.projectionSequence,
    source_kind: base.sourceKind,
    source_schema: base.sourceSchema,
    source_event_ref: base.sourceEventRef,
    profile_ref: base.profileRef,
    node_ref: base.nodeRef,
    oauth_client_ref: input.scope.oauthClientRef ?? null,
    client_session_ref: input.scope.clientSessionRef ?? null,
    provider_thread_ref: input.scope.providerThreadRef ?? null,
    provider_thread_epoch: input.scope.providerThreadEpoch ?? null,
    run_id: input.scope.runId ?? input.event.run_id,
    turn_id: null,
    capability_call_ref: null,
    environment_binding_ref: input.scope.environmentBindingRef ?? null,
    room_ref: null,
    source_ref: null,
    world_ref: null,
    workflow_ref: null,
    effect_lease_ref: null,
    terminal_product_ref: null,
    event_kind: agentEventKind(input.event.event_type),
    lifecycle_stage: "agent_run_observed",
    outcome,
    summary: `Agent run ${input.event.event_type.replaceAll("_", " ")}: ${outcome}.`,
    evidence_refs: uniqueSafeReferences([
      input.event.event_id,
      input.event.run_id,
    ]),
    occurred_at: input.event.created_at,
    observed_at: input.observedAt ?? input.event.created_at,
    provenance: "derived",
    redaction_state: "sanitized",
    visibility: "profile",
    content_role: "operator_activity_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};
