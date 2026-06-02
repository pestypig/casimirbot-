import crypto from "node:crypto";
import {
  HELIX_CALLOUT_CANDIDATE_SCHEMA,
  HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA,
  HELIX_LIVE_CONTINUATION_TICK_SCHEMA,
  HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA,
  HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA,
  HELIX_WORKER_LANE_RECEIPT_SCHEMA,
  helixHypothesisNotAnswerFlags,
  helixObservationNotAnswerFlags,
  helixReceiptNotAnswerFlags,
  type HelixCalloutCandidate,
  type HelixGoalEvaluationReceipt,
  type HelixLiveContinuationTick,
  type HelixLiveSourceAdmissionReceipt,
  type HelixLiveSourceEventObservation,
  type HelixWorkerLaneReceipt,
} from "@shared/helix-live-continuation";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { WorldEventIngestResult } from "./world-event-ingest";
import type {
  LiveContinuationJob,
  LiveContinuationLane,
} from "./live-continuation-job-store";

export type LiveContinuationTrigger = HelixLiveContinuationTick["trigger"];

export type LiveContinuationRunDebug = {
  admission: HelixLiveSourceAdmissionReceipt;
  observation: HelixLiveSourceEventObservation | null;
  workers: HelixWorkerLaneReceipt[];
  goal: HelixGoalEvaluationReceipt;
  callout: HelixCalloutCandidate | null;
};

let latestDebugByTickId = new Map<string, LiveContinuationRunDebug>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value: string | null | undefined): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()))).sort();

const eventFromResult = (result?: WorldEventIngestResult | null): HelixWorldEvent | null =>
  result?.append_candidate?.event ?? null;

const eventIdFromResult = (result?: WorldEventIngestResult | null): string | null =>
  result?.append_candidate?.eventId ??
  result?.signal_id ??
  result?.minecraft_spatial_event?.event_id ??
  result?.event_type ??
  null;

const sourceIdFromResult = (result?: WorldEventIngestResult | null, event?: HelixWorldEvent | null): string | null =>
  result?.append_candidate?.sourceId ?? event?.source_id ?? null;

const evidenceRefsFromResult = (result?: WorldEventIngestResult | null, event?: HelixWorldEvent | null): string[] =>
  uniqueStrings([
    ...(event?.evidence_refs ?? []),
    ...(result?.append_candidate?.evidenceRefs ?? []),
    result?.signal_id ? `signal:${result.signal_id}` : null,
    result?.salience_receipt_id ? `salience:${result.salience_receipt_id}` : null,
    result?.projection_id ? `projection:${result.projection_id}` : null,
    result?.minecraft_spatial_episode?.episode_id ? `minecraft_spatial_episode:${result.minecraft_spatial_episode.episode_id}` : null,
    result?.minecraft_route_rehearsal?.rehearsal_id ? `minecraft_route_rehearsal:${result.minecraft_route_rehearsal.rehearsal_id}` : null,
    result?.minecraft_route_drift_event?.drift_id ? `minecraft_route_drift:${result.minecraft_route_drift_event.drift_id}` : null,
    ...(result?.synthetic_evidence ?? []).map((entry) => entry.evidence_id ? `synthetic_evidence:${entry.evidence_id}` : null),
  ]);

const hasCompactContext = (result?: WorldEventIngestResult | null): boolean =>
  Boolean(
    result?.episodes?.length ||
      result?.episode_predictions?.length ||
      result?.minecraft_spatial_episode ||
      result?.minecraft_world_sense_context ||
      result?.synthetic_evidence?.length ||
      result?.live_answer_environment_delta,
  );

const textForRiskScan = (event: HelixWorldEvent | null, result?: WorldEventIngestResult | null): string =>
  [
    event?.event_type,
    event?.text,
    stableJson(event?.health_delta ?? {}),
    stableJson(event?.objective_delta ?? {}),
    stableJson(event?.entities ?? []),
    stableJson(event?.meta ?? {}),
    result?.minecraft_route_drift_event ? "drift" : "",
    result?.environment_risk_resource_ledger ? "risk resource ledger" : "",
  ].join(" ").toLowerCase();

const isRiskEvent = (event: HelixWorldEvent | null, result?: WorldEventIngestResult | null): boolean =>
  /\b(health|hostile|damage|damaged|lava|low[_ -]?light|explosion|explode|drift|creeper|zombie|skeleton|danger|risk)\b/i.test(
    textForRiskScan(event, result),
  );

const isObjectiveEvent = (event: HelixWorldEvent | null): boolean =>
  Boolean(
    event?.objective_delta ||
      /\b(objective|advancement|item[_ -]?acquired|structure[_ -]?found|structure|progress|complete)\b/i.test(
        event?.event_type ?? "",
      ),
  );

const isRouteEvent = (event: HelixWorldEvent | null, result?: WorldEventIngestResult | null): boolean =>
  Boolean(
    event?.location ||
      result?.minecraft_spatial_event ||
      result?.minecraft_spatial_episode ||
      result?.minecraft_route_rehearsal ||
      result?.minecraft_route_drift_event ||
      /\b(location|position|move|spatial|route|drift|rehearsal)\b/i.test(event?.event_type ?? ""),
  );

function buildAdmission(input: {
  job: LiveContinuationJob;
  event: HelixWorldEvent | null;
  sourceId: string | null;
  now: string;
  evidenceRefs: string[];
}): HelixLiveSourceAdmissionReceipt {
  const missingSource = input.job.source_ids.length === 0 || !input.sourceId;
  const sourceBlocked = Boolean(input.sourceId && input.job.source_ids.length > 0 && !input.job.source_ids.includes(input.sourceId));
  const sourceStale = input.event?.event_type === "source_disconnected";
  return {
    schema: HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA,
    receipt_id: `live_source_admission:${hashShort([input.job.job_id, input.sourceId, input.now])}`,
    thread_id: input.job.thread_id,
    room_id: input.job.room_id,
    environment_id: input.job.environment_id ?? null,
    contract_id: input.job.contract_id ?? null,
    source_id: input.sourceId ?? input.job.source_ids[0] ?? "unknown",
    source_kind: "minecraft_world_events",
    transport: "cloudflarelink",
    source_identity: {
      world_id: input.event?.world_id ?? null,
      server_id: typeof input.event?.meta?.server_id === "string" ? input.event.meta.server_id : null,
      player_id: input.event?.actor_id ?? null,
      profile_id: typeof input.event?.meta?.profile_id === "string" ? input.event.meta.profile_id : null,
    },
    freshness: {
      status: sourceBlocked ? "blocked" : missingSource ? "missing" : sourceStale ? "stale" : "connected",
      last_seen_at: input.event?.ts ?? null,
      stale_after_ms: input.job.cooldowns.min_tick_interval_ms * 3,
    },
    trust_level: sourceBlocked ? "blocked" : missingSource || sourceStale ? "unverified" : "admitted_live_source",
    evidence_refs: input.evidenceRefs,
    ...helixReceiptNotAnswerFlags,
  };
}

function buildObservation(input: {
  job: LiveContinuationJob;
  result?: WorldEventIngestResult | null;
  event: HelixWorldEvent | null;
  eventId: string | null;
  sourceId: string | null;
  evidenceRefs: string[];
}): HelixLiveSourceEventObservation | null {
  if (!input.event || !input.eventId || !input.sourceId) return null;
  return {
    schema: HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA,
    observation_id: `live_source_observation:${hashShort([input.job.job_id, input.eventId, input.event.ts])}`,
    thread_id: input.job.thread_id,
    room_id: input.job.room_id,
    environment_id: input.job.environment_id ?? null,
    source_id: input.sourceId,
    world_event_id: input.eventId,
    signal_id: input.result?.signal_id ?? null,
    event_type: input.event.event_type,
    salience: {
      reason: input.result?.append_candidate?.salienceReason ?? input.result?.salience_receipt?.reason ?? null,
      priority: input.result?.append_candidate?.saliencePriority ?? input.result?.callout_proposal?.priority ?? null,
      should_notify_helix: Boolean(input.result?.salience_receipt || input.result?.callout_proposal || input.result?.interjection_proposal),
      should_speak: Boolean(input.result?.callout_delivery_receipt),
    },
    produced_refs: uniqueStrings([
      input.result?.signal_id ? `signal:${input.result.signal_id}` : null,
      input.result?.projection_id ? `projection:${input.result.projection_id}` : null,
      ...(input.result?.goal_hypothesis_ids ?? []).map((id) => `goal_hypothesis:${id}`),
    ]),
    missing_evidence: [],
    evidence_refs: input.evidenceRefs,
    ...helixObservationNotAnswerFlags,
  };
}

function selectLanes(input: {
  job: LiveContinuationJob;
  trigger: LiveContinuationTrigger;
  result?: WorldEventIngestResult | null;
  event: HelixWorldEvent | null;
  admission: HelixLiveSourceAdmissionReceipt;
}): LiveContinuationLane[] {
  const lanes = new Set<LiveContinuationLane>();
  if (input.trigger === "world_event" || input.trigger === "source_health" || input.trigger === "cadence") {
    lanes.add("source_health");
  }
  if (input.admission.freshness.status !== "connected" || input.event?.event_type === "source_disconnected") {
    lanes.add("source_health");
  }
  if (input.event) lanes.add("world_state");
  if (isRiskEvent(input.event, input.result)) lanes.add("risk_watch");
  if (isObjectiveEvent(input.event)) lanes.add("objective_progress");
  if (isRouteEvent(input.event, input.result)) lanes.add("route_watch");
  if (hasCompactContext(input.result)) lanes.add("prediction_reflection");
  if (
    input.trigger === "salience" ||
    input.trigger === "source_health" ||
    input.admission.freshness.status !== "connected" ||
    input.result?.salience_receipt_id ||
    input.result?.salience_receipt ||
    input.result?.callout_proposal ||
    input.result?.interjection_proposal
  ) {
    lanes.add("voice_gate");
  }
  return Array.from(lanes).filter((lane) => input.job.lanes_enabled.includes(lane));
}

function workerSummary(lane: LiveContinuationLane, event: HelixWorldEvent | null, admission: HelixLiveSourceAdmissionReceipt): string {
  if (lane === "source_health") return `Source health is ${admission.freshness.status}.`;
  if (lane === "world_state") return event ? `Observed Minecraft event: ${event.event_type}.` : "No world event available.";
  if (lane === "risk_watch") return "Risk cues detected in the canonical world-event result.";
  if (lane === "objective_progress") return "Objective progress cues detected in the canonical world-event result.";
  if (lane === "route_watch") return "Route or spatial cues detected in the canonical world-event result.";
  if (lane === "resource_status") return "Resource status lane had no dedicated reducer input.";
  if (lane === "prediction_reflection") return "Structured hypothesis generated from compact episode/context evidence.";
  return "Voice gate evaluated callout eligibility from salience and source-health evidence.";
}

function runWorkerLane(input: {
  lane: LiveContinuationLane;
  job: LiveContinuationJob;
  event: HelixWorldEvent | null;
  admission: HelixLiveSourceAdmissionReceipt;
  evidenceRefs: string[];
  missingEvidence: string[];
  now: string;
}): HelixWorkerLaneReceipt {
  const hypotheses =
    input.lane === "prediction_reflection"
      ? [
          {
            claim: input.event
              ? `The latest ${input.event.event_type} event may affect the objective: ${input.job.objective}.`
              : `Continuation should wait for fresh compact context before predicting objective progress.`,
            confidence: input.event ? 0.58 : 0.25,
            evidence_refs: input.evidenceRefs,
            missing_evidence: input.missingEvidence,
          },
        ]
      : [];
  return {
    schema: HELIX_WORKER_LANE_RECEIPT_SCHEMA,
    receipt_id: `worker_lane:${hashShort([input.job.job_id, input.lane, input.now, input.evidenceRefs])}`,
    lane: input.lane,
    status: input.admission.trust_level === "blocked" ? "blocked" : "succeeded",
    summary: workerSummary(input.lane, input.event, input.admission),
    hypotheses,
    recommended_next_observations:
      input.missingEvidence.length > 0 ? input.missingEvidence : ["continue canonical world-event observation"],
    evidence_refs: input.evidenceRefs,
    ...helixHypothesisNotAnswerFlags,
  };
}

function buildGoalEvaluation(input: {
  job: LiveContinuationJob;
  admission: HelixLiveSourceAdmissionReceipt;
  workers: HelixWorkerLaneReceipt[];
  evidenceRefs: string[];
  missingEvidence: string[];
  now: string;
}): HelixGoalEvaluationReceipt {
  const blocked = input.admission.trust_level === "blocked" || input.job.status === "blocked";
  const missing = input.admission.freshness.status === "missing";
  const stale = input.admission.freshness.status === "stale";
  const status: HelixGoalEvaluationReceipt["status"] = blocked
    ? "fail_closed"
    : missing || stale
      ? "ask_user"
      : input.missingEvidence.length > 0
      ? "needs_more_observation"
      : "needs_more_observation";
  return {
    schema: HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA,
    receipt_id: `goal_evaluation:${hashShort([input.job.job_id, input.now, input.workers.map((worker) => worker.receipt_id)])}`,
    job_id: input.job.job_id,
    thread_id: input.job.thread_id,
    room_id: input.job.room_id,
    environment_id: input.job.environment_id ?? null,
    objective_ref: `live_continuation_objective:${hashShort([input.job.job_id, input.job.objective], 12)}`,
    status,
    rationale_codes: uniqueStrings([
      blocked ? "source_admission_blocked" : null,
      missing ? "source_missing" : null,
      stale ? "source_stale" : null,
      input.workers.some((worker) => worker.lane === "risk_watch") ? "risk_watch_requires_followup" : null,
      input.workers.some((worker) => worker.lane === "prediction_reflection") ? "prediction_requires_model_reentry" : null,
    ]),
    satisfied_evidence_refs: [],
    missing_evidence: input.missingEvidence,
    next_step: blocked ? "fail_closed" : missing || stale ? "ask_user" : "continue",
    evidence_refs: input.evidenceRefs,
    ...helixReceiptNotAnswerFlags,
  };
}

const CALLOUT_CERTAINTY_RANK: Record<HelixCalloutCandidate["certainty"], number> = {
  unknown: 0,
  likely: 1,
  observed: 2,
  confirmed: 3,
};

function isCalloutIntervalCoolingDown(job: LiveContinuationJob, now: string): boolean {
  if (!job.cooldowns.last_tick_at || job.cooldowns.min_tick_interval_ms <= 0) return false;
  const last = Date.parse(job.cooldowns.last_tick_at);
  const current = Date.parse(now);
  if (!Number.isFinite(last) || !Number.isFinite(current)) return false;
  return current - last < job.cooldowns.min_tick_interval_ms;
}

function capCalloutCertainty(
  certainty: HelixCalloutCandidate["certainty"],
  threshold: LiveContinuationJob["evidence_threshold"],
): HelixCalloutCandidate["certainty"] {
  return CALLOUT_CERTAINTY_RANK[certainty] <= CALLOUT_CERTAINTY_RANK[threshold]
    ? certainty
    : threshold;
}

function buildCalloutCandidate(input: {
  job: LiveContinuationJob;
  trigger: LiveContinuationTrigger;
  admission: HelixLiveSourceAdmissionReceipt;
  observation: HelixLiveSourceEventObservation | null;
  workers: HelixWorkerLaneReceipt[];
  goal: HelixGoalEvaluationReceipt;
  evidenceRefs: string[];
  now: string;
}): HelixCalloutCandidate | null {
  const hasVoiceGate = input.workers.some((worker) => worker.lane === "voice_gate");
  const hasRisk = input.workers.some((worker) => worker.lane === "risk_watch");
  const sourceFresh = input.admission.freshness.status === "connected";
  const salient = input.trigger === "salience" || hasRisk || hasVoiceGate;
  if (!salient && input.admission.freshness.status !== "stale" && input.admission.freshness.status !== "missing") return null;
  const calloutType: HelixCalloutCandidate["callout_type"] =
    input.admission.freshness.status !== "connected"
      ? "source_health"
      : input.goal.status === "ask_user"
        ? "question"
        : hasRisk || input.goal.status === "fail_closed"
          ? "warning"
          : input.goal.status === "repair"
            ? "suggestion"
            : "status";
  const observedEvidence = input.evidenceRefs.length > 0 || input.workers.some((worker) => worker.hypotheses.length > 0);
  const inferredCertainty: HelixCalloutCandidate["certainty"] = sourceFresh && observedEvidence ? "observed" : "unknown";
  const certainty = capCalloutCertainty(inferredCertainty, input.job.evidence_threshold);
  const dedupeKey = `${calloutType}:${input.observation?.world_event_id ?? input.goal.receipt_id}`;
  const duplicateBlocked = Boolean(input.job.cooldowns.callout_dedupe_keys[dedupeKey]);
  const cooldownBlocked = isCalloutIntervalCoolingDown(input.job, input.now);
  const missingEvidenceBlocked = input.goal.missing_evidence.length > 0 && input.job.evidence_threshold === "confirmed";
  const automaticAllowed =
    input.job.voice_policy === "automatic_when_policy_allows" &&
    sourceFresh &&
    salient &&
    !duplicateBlocked &&
    !cooldownBlocked &&
    !missingEvidenceBlocked &&
    certainty !== "unknown";
  const blockedReason =
    input.job.voice_policy === "muted"
      ? "voice_policy_muted"
      : !sourceFresh
        ? `source_${input.admission.freshness.status}`
        : duplicateBlocked
          ? "callout_duplicate_cooldown"
          : cooldownBlocked
            ? "callout_interval_cooldown"
            : missingEvidenceBlocked
              ? "evidence_threshold_not_met"
              : input.job.voice_policy === "confirm_speak_required"
                ? "confirm_speak_required"
                : null;
  const delivery: HelixCalloutCandidate["delivery"] =
    input.job.voice_policy === "muted"
      ? "typed_only"
      : input.job.voice_policy === "propose_only"
        ? "voice_proposal"
        : input.job.voice_policy === "confirm_speak_required"
          ? "voice_proposal"
          : automaticAllowed
            ? "automatic_spoken"
            : blockedReason
              ? "suppressed"
              : "voice_proposal";
  return {
    schema: HELIX_CALLOUT_CANDIDATE_SCHEMA,
    candidate_id: `callout_candidate:${hashShort([input.job.job_id, input.now, input.goal.receipt_id])}`,
    thread_id: input.job.thread_id,
    room_id: input.job.room_id,
    source_event_id: input.observation?.world_event_id ?? null,
    salience_receipt_id:
      input.evidenceRefs.find((ref) => ref.startsWith("salience:"))?.slice("salience:".length) ?? null,
    callout_type: calloutType,
    text: hasRisk
      ? "Risk-relevant source event detected; voice delivery still requires policy confirmation."
      : "Source-health or salience update is eligible for a voice-gated proposal.",
    certainty,
    blocked_reason: blockedReason,
    delivery,
    evidence_refs: input.evidenceRefs,
    ...helixObservationNotAnswerFlags,
  };
}

export async function runLiveContinuationTick(input: {
  job: LiveContinuationJob;
  trigger: LiveContinuationTrigger;
  worldEventResult?: WorldEventIngestResult | null;
  now?: string;
}): Promise<HelixLiveContinuationTick> {
  const now = input.now ?? new Date().toISOString();
  const event = eventFromResult(input.worldEventResult);
  const eventId = eventIdFromResult(input.worldEventResult);
  const sourceId = sourceIdFromResult(input.worldEventResult, event);
  const evidenceRefs = uniqueStrings([
    `live_continuation_job:${input.job.job_id}`,
    ...(input.job.last_observation_refs ?? []),
    ...evidenceRefsFromResult(input.worldEventResult, event),
  ]);
  const admission = buildAdmission({
    job: input.job,
    event,
    sourceId,
    now,
    evidenceRefs,
  });
  const observation = buildObservation({
    job: input.job,
    result: input.worldEventResult,
    event,
    eventId,
    sourceId,
    evidenceRefs,
  });

  const hardBlocked = input.job.status !== "active" || admission.trust_level === "blocked";
  const missingEvidence = uniqueStrings([
    input.job.status !== "active" ? `job_status:${input.job.status}` : null,
    admission.freshness.status === "missing" ? "live_source_event" : null,
    admission.freshness.status === "stale" ? "live_source_freshness" : null,
    input.trigger === "world_event" && !observation ? "world_event_observation" : null,
    hasCompactContext(input.worldEventResult) ? null : "compact_episode_or_context",
  ]);
  const selectedLanes = hardBlocked
    ? []
    : selectLanes({
        job: input.job,
        trigger: input.trigger,
        result: input.worldEventResult,
        event,
        admission,
      });
  const workers = selectedLanes.map((lane) =>
    runWorkerLane({
      lane,
      job: input.job,
      event,
      admission,
      evidenceRefs,
      missingEvidence,
      now,
    }),
  );
  const goal = buildGoalEvaluation({
    job: input.job,
    admission,
    workers,
    evidenceRefs,
    missingEvidence,
    now,
  });
  const callout = hardBlocked
    ? null
    : buildCalloutCandidate({
        job: input.job,
        trigger: input.trigger,
        admission,
        observation,
        workers,
        goal,
        evidenceRefs,
        now,
      });
  const tick: HelixLiveContinuationTick = {
    schema: HELIX_LIVE_CONTINUATION_TICK_SCHEMA,
    tick_id: `live_continuation_tick:${hashShort([input.job.job_id, input.trigger, now, eventId])}`,
    job_id: input.job.job_id,
    thread_id: input.job.thread_id,
    room_id: input.job.room_id,
    environment_id: input.job.environment_id ?? null,
    contract_id: input.job.contract_id ?? null,
    trigger: input.trigger,
    status: input.job.status !== "active" ? "suppressed" : admission.trust_level === "blocked" ? "blocked" : "completed",
    selected_lanes: selectedLanes,
    worker_receipt_refs: workers.map((worker) => worker.receipt_id),
    goal_evaluation_ref: goal.receipt_id,
    callout_candidate_ref: callout?.candidate_id ?? null,
    next_step: input.job.status !== "active" ? "silent" : goal.next_step,
    evidence_refs: evidenceRefs,
    ...helixReceiptNotAnswerFlags,
  };
  latestDebugByTickId.set(tick.tick_id, {
    admission,
    observation,
    workers,
    goal,
    callout,
  });
  return tick;
}

export function getLiveContinuationRunDebug(tickId: string): LiveContinuationRunDebug | null {
  return latestDebugByTickId.get(tickId) ?? null;
}

export const getLiveContinuationRunDebugForTest = getLiveContinuationRunDebug;

export function resetLiveContinuationRunnerForTest(): void {
  latestDebugByTickId = new Map<string, LiveContinuationRunDebug>();
}
