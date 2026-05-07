import crypto from "node:crypto";
import type { HelixSituationThreadBinding } from "@shared/helix-situation-thread-binding";
import type {
  SituationEventSignal,
  SituationGoalHypothesis,
  SituationInterjectionProposal,
  SituationSalienceReceipt,
  SituationStateProjection,
} from "@shared/helix-situation-standby";
import type { SituationNarrationReceipt } from "@shared/helix-situation-narration";
import type { SituationPrediction } from "@shared/helix-situation-prediction";
import type { SituationSemanticEvent } from "@shared/helix-situation-semantics";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { InterjectionDecision } from "./interjection-policy";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

export type StandbyObservationAppendReason =
  | "appended"
  | "no_binding"
  | "not_salient"
  | "binding_observe_only"
  | "append_policy_blocked"
  | "thread_append_failed";

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export const compactWorldEvent = (worldEvent?: HelixWorldEvent | null): Record<string, unknown> | null => {
  if (!worldEvent) return null;
  return {
    event_type: worldEvent.event_type,
    actor_id: worldEvent.actor_id ?? null,
    actor_label: worldEvent.actor_label ?? null,
    location: worldEvent.location ?? null,
    inventory_delta: worldEvent.inventory_delta ?? null,
    health_delta: worldEvent.health_delta ?? null,
    objective_delta: worldEvent.objective_delta ?? null,
    evidence_refs: worldEvent.evidence_refs ?? [],
    ts: worldEvent.ts,
  };
};

export const compactProjection = (
  projection?: SituationStateProjection | null,
): Record<string, unknown> | null => {
  if (!projection) return null;
  return {
    projection_id: projection.projection_id,
    updated_at: projection.updated_at,
    window: projection.window,
    active_sources: projection.active_sources,
    world_state: projection.world_state ?? null,
    recent_facts: projection.recent_facts.slice(-5),
  };
};

export const compactGoals = (goals?: SituationGoalHypothesis[]): SituationGoalHypothesis[] =>
  (goals ?? []).slice(-6).map((goal: SituationGoalHypothesis) => ({
    ...goal,
    evidence_refs: goal.evidence_refs.slice(-8),
    derived_from_signal_ids: goal.derived_from_signal_ids.slice(-8),
  }));

export async function appendStandbyObservationToThread(input: {
  binding: HelixSituationThreadBinding | null;
  world_event?: HelixWorldEvent | null;
  signal?: SituationEventSignal | null;
  state_projection?: SituationStateProjection | null;
  goal_hypotheses?: SituationGoalHypothesis[];
  salience_receipt?: SituationSalienceReceipt | null;
  interjection_proposal?: SituationInterjectionProposal | null;
}): Promise<{
  appended: boolean;
  reason: StandbyObservationAppendReason;
  thread_id?: string;
  turn_id?: string;
  item_id?: string;
}> {
  const binding = input.binding;
  if (!binding) return { appended: false, reason: "no_binding" };
  if (binding.mode === "observe_only") {
    return {
      appended: false,
      reason: "binding_observe_only",
      thread_id: binding.thread_id,
      turn_id: binding.turn_id ?? undefined,
    };
  }
  if (
    binding.append_policy === "salient_only" &&
    input.salience_receipt?.should_notify_helix !== true
  ) {
    return {
      appended: false,
      reason: "not_salient",
      thread_id: binding.thread_id,
      turn_id: binding.turn_id ?? undefined,
    };
  }

  const signalId = input.signal?.signal_id ?? input.salience_receipt?.receipt_id ?? "event";
  const turnId =
    binding.turn_id ??
    `standby_observation:${hashShort([binding.binding_id, signalId, input.world_event?.ts])}`;
  const itemId = `standby_observation:${hashShort([binding.binding_id, signalId], 16)}`;
  const now = new Date().toISOString();
  const observationRef = buildStandbyObservationRef(input);

  try {
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "turn_started",
      thread_id: binding.thread_id,
      turn_id: turnId,
      session_id: binding.session_id ?? null,
      trace_id: binding.trace_id ?? null,
      turn_kind: "auxiliary",
      meta: {
        kind: "standby_observation",
        binding_id: binding.binding_id,
        room_id: binding.room_id,
        source_id: binding.source_id ?? null,
        world_id: binding.world_id ?? null,
      },
      ts: now,
    });
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "item_started",
      thread_id: binding.thread_id,
      turn_id: turnId,
      session_id: binding.session_id ?? null,
      trace_id: binding.trace_id ?? null,
      item_id: itemId,
      item_type: "toolObservation",
      item_status: "in_progress",
      item_stream: "observation",
      meta: { kind: "standby_observation", binding_id: binding.binding_id },
    });
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "item_completed",
      thread_id: binding.thread_id,
      turn_id: turnId,
      session_id: binding.session_id ?? null,
      trace_id: binding.trace_id ?? null,
      item_id: itemId,
      item_type: "toolObservation",
      item_status: "completed",
      item_stream: "observation",
      observation_ref: observationRef,
      meta: {
        kind: "standby_observation",
        binding_id: binding.binding_id,
        salience_reason: input.salience_receipt?.reason ?? null,
      },
    });
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "turn_completed",
      thread_id: binding.thread_id,
      turn_id: turnId,
      session_id: binding.session_id ?? null,
      trace_id: binding.trace_id ?? null,
      turn_kind: "auxiliary",
      meta: {
        kind: "standby_observation",
        binding_id: binding.binding_id,
        item_id: itemId,
      },
    });
    return {
      appended: true,
      reason: "appended",
      thread_id: binding.thread_id,
      turn_id: turnId,
      item_id: itemId,
    };
  } catch {
    return {
      appended: false,
      reason: "thread_append_failed",
      thread_id: binding.thread_id,
      turn_id: turnId,
      item_id: itemId,
    };
  }
}

export function buildStandbyObservationRef(input: {
  binding: HelixSituationThreadBinding;
  world_event?: HelixWorldEvent | null;
  signal?: SituationEventSignal | null;
  state_projection?: SituationStateProjection | null;
  goal_hypotheses?: SituationGoalHypothesis[];
  salience_receipt?: SituationSalienceReceipt | null;
  interjection_proposal?: SituationInterjectionProposal | null;
  semantic_events?: SituationSemanticEvent[];
  narration_receipts?: SituationNarrationReceipt[];
  predictions?: SituationPrediction[];
  interjection_decision?: InterjectionDecision;
}): Record<string, unknown> {
  const binding = input.binding;
  return {
    schema: "helix.standby_thread_observation.v1",
    source: "minecraft_event",
    room_id: binding.room_id,
    source_id: binding.source_id ?? input.world_event?.source_id ?? null,
    graph_id: binding.graph_id ?? input.signal?.graph_id ?? null,
    world_id: binding.world_id ?? input.world_event?.world_id ?? null,
    world_event: compactWorldEvent(input.world_event),
    signal: input.signal
      ? {
          signal_id: input.signal.signal_id,
          source: input.signal.source,
          event_type: input.signal.event_type,
          actor: input.signal.actor ?? null,
          evidence_refs: input.signal.evidence_refs,
          ts: input.signal.ts,
        }
      : null,
    salience_receipt: input.salience_receipt ?? null,
    interjection_proposal: input.interjection_proposal ?? null,
    semantic_events: (input.semantic_events ?? []).slice(-8),
    narration_receipts: (input.narration_receipts ?? []).slice(-8),
    predictions: (input.predictions ?? []).slice(-8).map((prediction: SituationPrediction) => ({
      ...prediction,
      evidence_refs: prediction.evidence_refs.slice(-8),
      derived_from_narration_ids: prediction.derived_from_narration_ids.slice(-8),
    })),
    interjection_decision: input.interjection_decision ?? null,
    state_projection_summary: compactProjection(input.state_projection),
    goal_hypotheses: compactGoals(input.goal_hypotheses),
    append_policy: binding.append_policy,
    context_policy: "explicit_attachment_only",
    command_lane_enabled: false,
  };
}
