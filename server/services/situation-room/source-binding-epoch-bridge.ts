import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_LIVE_FIELD_EVALUATION_SCHEMA,
  type HelixLiveFieldEvaluation,
} from "@shared/helix-live-field-evaluation";
import {
  emptyProcedureEpochSourceSet,
  type HelixProcedureEpochSourceSet,
} from "@shared/helix-procedure-epoch-source-set";
import type { SituationSalienceReceipt } from "@shared/helix-situation-standby";
import type { HelixSituationSourceBinding } from "@shared/helix-situation-source-binding";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { appendObservationJournalEntry } from "./observation-journal-store";
import {
  getSituationSourceBinding,
  getSituationSourceBindingForSource,
  listSituationSourceBindings,
} from "./situation-source-binding-store";
import { getLiveAnswerEnvironment } from "./live-answer-environment-store";
import { ensureLiveSituationRunForEnvironment } from "./live-situation-run-store";
import { recordLiveFieldEvaluation } from "./live-field-evaluation-store";
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";
import { recordProcedureEpochClosure } from "./procedure-epoch-closure";
import {
  recordSourceBindingRepairCandidate,
  recordSourceBindingStatusTransitions,
} from "./source-binding-status-ledger";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniq = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => String(value ?? "").trim()).filter(Boolean)));

const sourceIdFor = (event: HelixWorldEvent): string =>
  event.source_id?.trim() || `minecraft:${event.world_id}`;

const compactWorldEventText = (
  event: HelixWorldEvent,
  salienceReceipt?: SituationSalienceReceipt | null,
): string => {
  const actor = event.actor_label ?? event.actor_id ?? "Minecraft";
  const base = event.text?.trim() || `${actor} emitted ${event.event_type}.`;
  const salience = salienceReceipt?.summary?.trim();
  return salience && salience !== base ? `${base} ${salience}` : base;
};

const findBindingForWorldEvent = (input: {
  event: HelixWorldEvent;
  threadId?: string | null;
}): HelixSituationSourceBinding | null => {
  const sourceId = sourceIdFor(input.event);
  if (input.threadId) {
    const exact = getSituationSourceBindingForSource({
      threadId: input.threadId,
      sourceId,
      modality: "world_event",
    });
    if (exact) return exact;
  }
  return listSituationSourceBindings({
    sourceId,
    modality: "world_event",
    limit: 1,
  }).at(-1) ?? null;
};

const buildSourceSet = (input: {
  observation: HelixObservationJournalEntry;
  replayed: boolean;
}): HelixProcedureEpochSourceSet => {
  const set = emptyProcedureEpochSourceSet();
  set.world_event_refs = [input.observation.observation_id];
  if (input.replayed) set.replayed_observation_refs = [input.observation.observation_id];
  return set;
};

const eventLooksRisky = (
  event: HelixWorldEvent,
  salienceReceipt?: SituationSalienceReceipt | null,
): boolean => {
  const text = `${event.event_type} ${event.text ?? ""} ${JSON.stringify(event.health_delta ?? {})} ${salienceReceipt?.reason ?? ""} ${salienceReceipt?.priority ?? ""}`.toLowerCase();
  return /\b(?:damage|hurt|death|critical|hostile|risk|warn|low health|lava|fire|blaze|creeper)\b/.test(text);
};

const recordFusionEvaluation = (input: {
  binding: HelixSituationSourceBinding;
  observation: HelixObservationJournalEntry;
  epoch: number;
  fieldKey: "risk" | "activity";
  value: string;
  confidence: number;
  status: HelixLiveFieldEvaluation["status"];
  now: string;
  salienceReceipt?: SituationSalienceReceipt | null;
}): HelixLiveFieldEvaluation => {
  const workerRunId = `live_field_worker_run:${hashShort([
    input.binding.situation_run_id,
    input.fieldKey,
    input.observation.observation_id,
    input.now,
  ])}`;
  const evaluation = recordLiveFieldEvaluation({
    schema: HELIX_LIVE_FIELD_EVALUATION_SCHEMA,
    evaluation_id: `live_field_eval:${hashShort([
      input.binding.situation_run_id,
      input.fieldKey,
      input.value,
      input.observation.observation_id,
      input.now,
    ])}`,
    worker_run_id: workerRunId,
    worker_id: `source_binding_epoch_bridge:${input.fieldKey}`,
    situation_run_id: input.binding.situation_run_id,
    thread_id: input.binding.thread_id,
    environment_id: input.binding.environment_id ?? "",
    field_key: input.fieldKey,
    value: input.value,
    status: input.status,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    evidence_refs: uniq([
      input.observation.observation_id,
      input.salienceReceipt?.receipt_id,
      ...input.observation.evidence_refs,
    ]),
    missing_evidence: [],
    corroboration_state: {
      world_event: "present",
      visual_frame: "missing_not_required",
      audio_transcript: "missing_not_required",
      user_steering: "missing_not_required",
    },
    next_check:
      input.fieldKey === "risk"
        ? "Watch the next bound world event or visual frame for risk resolution."
        : "Compare the next bound event with visual and transcript context.",
    expires_at: new Date(Date.parse(input.now) + 60_000).toISOString(),
    created_at: input.now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
  appendProcedureEpochLedgerItem({
    situation_run_id: input.binding.situation_run_id,
    source_binding_id: input.binding.binding_id,
    thread_id: input.binding.thread_id,
    environment_id: input.binding.environment_id ?? "",
    epoch: input.epoch,
    item_kind: "field_worker_run",
    item_ref: workerRunId,
    summary: `${input.fieldKey} fusion worker completed from bound world-event source.`,
    causality_refs: [input.observation.observation_id],
    created_at: input.now,
  });
  appendProcedureEpochLedgerItem({
    situation_run_id: input.binding.situation_run_id,
    source_binding_id: input.binding.binding_id,
    thread_id: input.binding.thread_id,
    environment_id: input.binding.environment_id ?? "",
    epoch: input.epoch,
    item_kind: "field_evaluation",
    item_ref: evaluation.evaluation_id,
    summary: `${evaluation.field_key}: ${evaluation.value}`,
    causality_refs: evaluation.evidence_refs,
    created_at: input.now,
  });
  return evaluation;
};

export type SourceBindingEpochBridgeReceipt = {
  schema: "helix.source_binding_epoch_bridge_receipt.v1";
  ok: boolean;
  status: "observed_unbound" | "bound" | "stale" | "detached" | "missing";
  source_id: string;
  modality: "world_event";
  binding_id?: string | null;
  situation_run_id?: string | null;
  environment_id?: string | null;
  observation?: HelixObservationJournalEntry | null;
  source_set?: HelixProcedureEpochSourceSet | null;
  field_evaluation_refs: string[];
  ledger_item_refs: string[];
  replay_status: "live" | "replayed";
  repair_candidate_created: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export function bridgeWorldEventToBoundSituationProcedure(input: {
  event: HelixWorldEvent;
  threadId?: string | null;
  salienceReceipt?: SituationSalienceReceipt | null;
  replayed?: boolean;
  now?: string;
}): SourceBindingEpochBridgeReceipt {
  const now = input.now ?? input.event.ts ?? new Date().toISOString();
  const sourceId = sourceIdFor(input.event);
  const binding = findBindingForWorldEvent({
    event: input.event,
    threadId: input.threadId ?? null,
  });
  if (!binding) {
    const status = {
      schema: "helix.source_binding_status.v1" as const,
      source_id: sourceId,
      thread_id: input.threadId ?? null,
      environment_id: null,
      situation_run_id: null,
      modality: "world_event",
      status: "observed_unbound" as const,
      evidence_refs: uniq([
        ...input.event.evidence_refs,
        input.salienceReceipt?.receipt_id,
      ]),
      next_required_action: "attach_source_to_active_run",
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
    recordSourceBindingStatusTransitions({
      statuses: [status],
      reason: "world event observed without SituationRun source binding",
      now,
    });
    recordSourceBindingRepairCandidate({
      source_id: sourceId,
      thread_id: input.threadId ?? null,
      modality: "world_event",
      reason: "world event ingested with no SituationRun source binding",
      evidence_refs: status.evidence_refs,
      now,
    });
    return {
      schema: "helix.source_binding_epoch_bridge_receipt.v1",
      ok: true,
      status: "observed_unbound",
      source_id: sourceId,
      modality: "world_event",
      binding_id: null,
      situation_run_id: null,
      environment_id: null,
      observation: null,
      source_set: null,
      field_evaluation_refs: [],
      ledger_item_refs: [],
      replay_status: input.replayed ? "replayed" : "live",
      repair_candidate_created: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (binding.status !== "bound") {
    return {
      schema: "helix.source_binding_epoch_bridge_receipt.v1",
      ok: true,
      status: binding.status === "detached" ? "detached" : "stale",
      source_id: sourceId,
      modality: "world_event",
      binding_id: binding.binding_id,
      situation_run_id: binding.situation_run_id,
      environment_id: binding.environment_id ?? null,
      observation: null,
      source_set: null,
      field_evaluation_refs: [],
      ledger_item_refs: [],
      replay_status: input.replayed ? "replayed" : "live",
      repair_candidate_created: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const environment = binding.environment_id ? getLiveAnswerEnvironment(binding.environment_id) : null;
  if (!environment) {
    return {
      schema: "helix.source_binding_epoch_bridge_receipt.v1",
      ok: false,
      status: "missing",
      source_id: sourceId,
      modality: "world_event",
      binding_id: binding.binding_id,
      situation_run_id: binding.situation_run_id,
      environment_id: binding.environment_id ?? null,
      observation: null,
      source_set: null,
      field_evaluation_refs: [],
      ledger_item_refs: [],
      replay_status: input.replayed ? "replayed" : "live",
      repair_candidate_created: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const run = ensureLiveSituationRunForEnvironment({
    environment,
    advanceEpoch: true,
    now,
  });
  const replayed = input.replayed === true;
  const observation = appendObservationJournalEntry({
    thread_id: binding.thread_id,
    room_id: input.event.room_id,
    source_id: sourceId,
    source_binding_id: binding.binding_id,
    role: "raw_source_event",
    modality: "world_event",
    text: compactWorldEventText(input.event, input.salienceReceipt),
    evidence_refs: uniq([
      ...input.event.evidence_refs,
      input.salienceReceipt?.receipt_id,
      `world_event:${input.event.event_type}`,
    ]),
    model_invoked: false,
    confidence: input.salienceReceipt ? 0.84 : 0.7,
    replay_status: replayed ? "replayed" : "live",
    created_at: now,
  });
  const sourceSet = buildSourceSet({ observation, replayed });
  const observationLedger = appendProcedureEpochLedgerItem({
    situation_run_id: run.situation_run_id,
    source_binding_id: binding.binding_id,
    thread_id: binding.thread_id,
    environment_id: binding.environment_id ?? run.environment_id,
    epoch: run.current_epoch,
    item_kind: "observation",
    item_ref: observation.observation_id,
    summary: `${replayed ? "Replayed" : "Bound"} world-event observation: ${observation.text}`,
    causality_refs: observation.evidence_refs,
    created_at: now,
  });
  const evaluations: HelixLiveFieldEvaluation[] = [];
  evaluations.push(recordFusionEvaluation({
    binding,
    observation,
    epoch: run.current_epoch,
    fieldKey: "activity",
    value: `Bound world-event activity: ${input.event.event_type}.`,
    confidence: replayed ? 0.68 : 0.78,
    status: replayed ? "tentative" : "supported",
    now,
    salienceReceipt: input.salienceReceipt ?? null,
  }));
  if (eventLooksRisky(input.event, input.salienceReceipt)) {
    evaluations.push(recordFusionEvaluation({
      binding,
      observation,
      epoch: run.current_epoch,
      fieldKey: "risk",
      value: input.salienceReceipt?.summary?.trim()
        || `Bound world event indicates risk: ${input.event.event_type}.`,
      confidence: replayed ? 0.72 : 0.88,
      status: replayed ? "tentative" : "supported",
      now,
      salienceReceipt: input.salienceReceipt ?? null,
    }));
  }
  const closure = recordProcedureEpochClosure({
    situation_run_id: run.situation_run_id,
    thread_id: binding.thread_id,
    environment_id: binding.environment_id ?? run.environment_id,
    source_binding_id: binding.binding_id,
    epoch: run.current_epoch,
    status: "silent_update",
    card_updated: false,
    confidence_changes: evaluations.map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id),
    created_at: now,
  });
  return {
    schema: "helix.source_binding_epoch_bridge_receipt.v1",
    ok: true,
    status: "bound",
    source_id: sourceId,
    modality: "world_event",
    binding_id: binding.binding_id,
    situation_run_id: run.situation_run_id,
    environment_id: binding.environment_id ?? run.environment_id,
    observation,
    source_set: sourceSet,
    field_evaluation_refs: evaluations.map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id),
    ledger_item_refs: uniq([
      observationLedger.ledger_item_id,
      closure.closure_id,
      ...evaluations.map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id),
    ]),
    replay_status: replayed ? "replayed" : "live",
    repair_candidate_created: false,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function replaySourceWindowIntoRun(input: {
  bindingId: string;
  events: HelixWorldEvent[];
  reason: string;
  maxEvents?: number;
  now?: string;
}): {
  schema: "helix.source_binding_replay_window_receipt.v1";
  ok: boolean;
  binding: HelixSituationSourceBinding | null;
  reason: string;
  replayed_count: number;
  replayed_observation_refs: string[];
  bridge_receipts: SourceBindingEpochBridgeReceipt[];
  assistant_answer: false;
  raw_content_included: false;
} {
  const binding = getSituationSourceBinding(input.bindingId);
  if (!binding) {
    return {
      schema: "helix.source_binding_replay_window_receipt.v1",
      ok: false,
      binding: null,
      reason: "binding_not_found",
      replayed_count: 0,
      replayed_observation_refs: [],
      bridge_receipts: [],
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const selected = input.events
    .filter((event: HelixWorldEvent) => sourceIdFor(event) === binding.source_id)
    .slice(-(Math.max(1, Math.min(input.maxEvents ?? 30, 200))));
  const receipts = selected.map((event: HelixWorldEvent) =>
    bridgeWorldEventToBoundSituationProcedure({
      event,
      threadId: binding.thread_id,
      replayed: true,
      now: input.now ?? event.ts,
    }),
  );
  return {
    schema: "helix.source_binding_replay_window_receipt.v1",
    ok: true,
    binding,
    reason: input.reason,
    replayed_count: receipts.filter((receipt: SourceBindingEpochBridgeReceipt) => receipt.observation).length,
    replayed_observation_refs: receipts
      .map((receipt: SourceBindingEpochBridgeReceipt) => receipt.observation?.observation_id ?? null)
      .filter((entry: string | null): entry is string => Boolean(entry)),
    bridge_receipts: receipts,
    assistant_answer: false,
    raw_content_included: false,
  };
}
