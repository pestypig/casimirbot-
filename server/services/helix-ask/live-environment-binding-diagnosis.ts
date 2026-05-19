import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_BINDING_DIAGNOSIS_SCHEMA,
  type HelixLiveEnvironmentBindingDiagnosis,
  type HelixLiveEnvironmentBindingDiagnosisBlockingReason,
  type HelixLiveEnvironmentBindingDiagnosisNextAction,
} from "@shared/helix-live-environment-binding-diagnosis";
import type { HelixLiveSourceProducerFreshness } from "@shared/helix-live-source-producer-freshness";
import { resolveActiveSituationContext } from "../situation-room/active-situation-context-resolver";
import { listLiveInterpretationHypotheses } from "../situation-room/live-interpretation-hypothesis-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const mapContextStatus = (
  status: string | null | undefined,
): HelixLiveEnvironmentBindingDiagnosis["active_situation_run_status"] => {
  if (
    status === "active" ||
    status === "stale" ||
    status === "unbound" ||
    status === "missing" ||
    status === "no_fresh_evidence"
  ) return status;
  return "not_selected";
};

const mapNextAction = (
  blockingReason: HelixLiveEnvironmentBindingDiagnosisBlockingReason,
): HelixLiveEnvironmentBindingDiagnosisNextAction => {
  if (blockingReason === "client_adoption_pending") return "request_or_adopt_capture";
  if (blockingReason === "producer_missing") return "request_or_adopt_capture";
  if (blockingReason === "producer_stale" || blockingReason === "source_not_fresh") return "capture_frame_now";
  if (blockingReason === "cadence_mismatch") return "reconcile_cadence";
  if (blockingReason === "no_active_situation_run") return "create_or_resume_situation_run";
  if (blockingReason === "no_latest_observation") return "capture_frame_now";
  if (blockingReason === "no_field_evaluations") return "run_field_workers_for_latest_observation";
  if (blockingReason === "no_interpretation_artifacts") return "run_interpretation_workers_for_latest_evaluations";
  if (blockingReason === "procedure_memory_unavailable") return "repair_procedure_memory";
  if (blockingReason === "panel_unbound" || blockingReason === "card_delta_missing") return "repair_card_projection_binding";
  return "none";
};

const mapProducerStatus = (input: {
  freshness: HelixLiveSourceProducerFreshness | null;
  producerBindingStatus?: string | null;
  clientAdoptionStatus: HelixLiveEnvironmentBindingDiagnosis["client_adoption_status"];
}): HelixLiveEnvironmentBindingDiagnosis["producer_status"] => {
  if (!input.freshness) return "missing";
  if (input.freshness.client_adoption_status === "failed" || input.freshness.readiness_state === "client_action_failed") {
    return "failed";
  }
  if (input.freshness.is_fresh) return "fresh";
  if (input.freshness.stale_reason || input.freshness.readiness_state === "stale") return "stale";
  if (input.producerBindingStatus === "bound") return "bound";
  if (input.clientAdoptionStatus === "adopted") return "adopted";
  if (input.clientAdoptionStatus === "requested") return "requested";
  return "missing";
};

const mapSourceFreshness = (
  freshness: HelixLiveSourceProducerFreshness | null,
): HelixLiveEnvironmentBindingDiagnosis["source_freshness"] => ({
  status: freshness ? (freshness.is_fresh ? "fresh" : "stale") : "unknown",
  last_capture_at: freshness?.last_capture_at ?? null,
  last_chunk_id: freshness?.last_chunk_id ?? null,
  last_analysis_job_id: freshness?.last_analysis_job_id ?? null,
  last_visual_evidence_id: freshness?.last_visual_evidence_id ?? null,
  stale_reason: freshness?.stale_reason ?? null,
});

const mapProcedureMemoryStatus = (
  activeSituationRunStatus: HelixLiveEnvironmentBindingDiagnosis["active_situation_run_status"],
): HelixLiveEnvironmentBindingDiagnosis["procedure_memory_status"] => {
  if (activeSituationRunStatus === "active") return "available";
  if (
    activeSituationRunStatus === "missing" ||
    activeSituationRunStatus === "unbound" ||
    activeSituationRunStatus === "no_fresh_evidence"
  ) return "unavailable";
  if (activeSituationRunStatus === "stale") return "unknown";
  return "unknown";
};

const mapCardDeltaStatus = (input: {
  freshness: HelixLiveSourceProducerFreshness | null;
  producerBindingStatus?: string | null;
  sourceFreshnessStatus: HelixLiveEnvironmentBindingDiagnosis["source_freshness"]["status"];
}): HelixLiveEnvironmentBindingDiagnosis["card_delta_status"] => {
  if (!input.freshness) return "unknown";
  if (input.producerBindingStatus && input.producerBindingStatus !== "bound") return "panel_unbound";
  if (!input.freshness.last_card_delta_at) {
    return input.producerBindingStatus === "bound" ? "missing" : "panel_unbound";
  }
  return input.sourceFreshnessStatus === "fresh" ? "fresh" : "stale";
};

const sensorSummary = (diagnosis: Pick<
  HelixLiveEnvironmentBindingDiagnosis,
  "capture_ready" | "producer_status" | "client_adoption_status" | "client_interval_active" | "cadence_match" | "source_freshness"
>): string =>
  diagnosis.capture_ready
    ? `Sensor readiness: visual capture is adopted and the browser interval is active; source freshness is ${diagnosis.source_freshness.status}.`
    : `Sensor readiness: visual capture is not ready; producer=${diagnosis.producer_status}, client=${diagnosis.client_adoption_status}, interval_active=${diagnosis.client_interval_active}, cadence_match=${diagnosis.cadence_match}.`;

const missionSummary = (diagnosis: Pick<
  HelixLiveEnvironmentBindingDiagnosis,
  "scene_procedure_ready" | "live_card_ready" | "active_situation_run_status" | "blocking_reason" | "next_required_action"
>): string =>
  diagnosis.scene_procedure_ready
    ? `Mission-state interpretation: ready from active SituationRun evidence; live_card_ready=${diagnosis.live_card_ready}.`
    : `Mission-state interpretation: unavailable or blocked; active_situation_run_status=${diagnosis.active_situation_run_status}, blocking_reason=${diagnosis.blocking_reason}, next_required_action=${diagnosis.next_required_action}.`;

export function buildLiveEnvironmentBindingDiagnosis(input: {
  turnId: string;
  threadId: string;
  sourceId?: string | null;
  producerId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  producerFreshness?: HelixLiveSourceProducerFreshness | null;
  producerBindingStatus?: string | null;
  serverCadenceMs?: number | null;
}): HelixLiveEnvironmentBindingDiagnosis {
  const freshness = input.producerFreshness ?? null;
  const observedState = readRecord(freshness?.client_observed_state);
  const clientObservedCadenceMs = readNumber(observedState.cadence_ms);
  const clientIntervalActive = observedState.interval_active === true;
  const clientAdoptionStatus: HelixLiveEnvironmentBindingDiagnosis["client_adoption_status"] =
    freshness?.client_adoption_status === "adopted"
      ? "adopted"
      : freshness?.client_adoption_status === "failed"
        ? "failed"
        : freshness?.client_action_status === "requested"
          ? "requested"
          : "missing";
  const producerStatus = mapProducerStatus({
    freshness,
    producerBindingStatus: input.producerBindingStatus,
    clientAdoptionStatus,
  });
  const sourceFreshness = mapSourceFreshness(freshness);
  const activeContext = resolveActiveSituationContext({
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? freshness?.source_id ?? null,
  });
  const latestInterpretationRefs = activeContext.situation_run_id
    ? listLiveInterpretationHypotheses({
        situationRunId: activeContext.situation_run_id,
        limit: 12,
      }).map((entry) => entry.hypothesis_id)
    : [];
  const serverCadenceMs = input.serverCadenceMs ?? freshness?.cadence_ms ?? null;
  const cadenceMatch =
    !serverCadenceMs ||
    !clientObservedCadenceMs ||
    Math.abs(serverCadenceMs - clientObservedCadenceMs) < 100;
  const captureReady =
    producerStatus !== "missing" &&
    clientAdoptionStatus === "adopted" &&
    observedState.client_stream_confirmed === true &&
    clientIntervalActive;
  const contextStatus = mapContextStatus(activeContext.status);
  const latestObservationRefs = activeContext.latest_observation_refs;
  const fieldEvaluationRefs = activeContext.latest_field_evaluation_refs;
  const procedureMemoryStatus = mapProcedureMemoryStatus(contextStatus);
  const cardDeltaStatus = mapCardDeltaStatus({
    freshness,
    producerBindingStatus: input.producerBindingStatus,
    sourceFreshnessStatus: sourceFreshness.status,
  });
  const sceneProcedureReady =
    captureReady &&
    sourceFreshness.status === "fresh" &&
    contextStatus === "active" &&
    latestObservationRefs.length > 0 &&
    fieldEvaluationRefs.length > 0 &&
    latestInterpretationRefs.length > 0 &&
    procedureMemoryStatus !== "unavailable";
  const liveCardReady = sceneProcedureReady && cardDeltaStatus === "fresh";
  let blockingReason: HelixLiveEnvironmentBindingDiagnosisBlockingReason = "none";
  if (clientAdoptionStatus !== "adopted") blockingReason = "client_adoption_pending";
  else if (producerStatus === "missing") blockingReason = "producer_missing";
  else if (producerStatus === "stale") blockingReason = "producer_stale";
  else if (sourceFreshness.status !== "fresh") blockingReason = "source_not_fresh";
  else if (!cadenceMatch) blockingReason = "cadence_mismatch";
  else if (contextStatus === "missing" || contextStatus === "unbound" || contextStatus === "not_selected") blockingReason = "no_active_situation_run";
  else if (latestObservationRefs.length === 0) blockingReason = "no_latest_observation";
  else if (fieldEvaluationRefs.length === 0) blockingReason = "no_field_evaluations";
  else if (latestInterpretationRefs.length === 0) blockingReason = "no_interpretation_artifacts";
  else if (procedureMemoryStatus === "unavailable") blockingReason = "procedure_memory_unavailable";
  else if (contextStatus !== "active") blockingReason = "no_active_situation_run";
  else if (cardDeltaStatus === "panel_unbound") blockingReason = "panel_unbound";
  else if (cardDeltaStatus !== "fresh") blockingReason = "card_delta_missing";
  const nextRequiredAction = mapNextAction(blockingReason);
  const auntieDot = {
    sensor_readiness_summary: sensorSummary({
      capture_ready: captureReady,
      producer_status: producerStatus,
      client_adoption_status: clientAdoptionStatus,
      client_interval_active: clientIntervalActive,
      cadence_match: cadenceMatch,
      source_freshness: sourceFreshness,
    }),
    mission_state_summary: missionSummary({
      scene_procedure_ready: sceneProcedureReady,
      live_card_ready: liveCardReady,
      active_situation_run_status: contextStatus,
      blocking_reason: blockingReason,
      next_required_action: nextRequiredAction,
    }),
  };
  const summary = [
    auntieDot.sensor_readiness_summary,
    auntieDot.mission_state_summary,
    `Blocking reason: ${blockingReason}.`,
    !cadenceMatch && serverCadenceMs && clientObservedCadenceMs
      ? `Server cadence is ${serverCadenceMs}ms, but the client reports ${clientObservedCadenceMs}ms.`
      : "",
    `Next repair: ${nextRequiredAction}.`,
  ].filter(Boolean).join(" ");
  return {
    schema: HELIX_LIVE_ENVIRONMENT_BINDING_DIAGNOSIS_SCHEMA,
    diagnosis_id: `live_environment_binding_diagnosis:${hashShort([
      input.turnId,
      input.threadId,
      freshness?.producer_id,
      activeContext.context_id,
      blockingReason,
      nextRequiredAction,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    target_source: "visual_capture",
    source_id: input.sourceId ?? freshness?.source_id ?? null,
    producer_id: input.producerId ?? freshness?.producer_id ?? null,
    live_environment_id: activeContext.environment_id ?? input.environmentId ?? null,
    situation_run_id: activeContext.situation_run_id ?? input.situationRunId ?? null,
    producer_status: producerStatus,
    client_adoption_status: clientAdoptionStatus,
    client_interval_active: clientIntervalActive,
    cadence_match: cadenceMatch,
    server_cadence_ms: serverCadenceMs,
    client_observed_cadence_ms: clientObservedCadenceMs,
    source_freshness: sourceFreshness,
    capture_ready: captureReady,
    scene_procedure_ready: sceneProcedureReady,
    active_situation_run_status: contextStatus,
    latest_observation_refs: latestObservationRefs,
    field_evaluation_refs: fieldEvaluationRefs,
    interpretation_refs: latestInterpretationRefs,
    procedure_memory_status: procedureMemoryStatus,
    live_card_ready: liveCardReady,
    card_delta_status: cardDeltaStatus,
    latest_card_delta_at: freshness?.last_card_delta_at ?? null,
    blocking_reason: blockingReason,
    next_required_action: nextRequiredAction,
    auntie_dot: auntieDot,
    summary,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function formatLiveEnvironmentBindingDiagnosisAnswer(
  diagnosis: HelixLiveEnvironmentBindingDiagnosis,
): string {
  const cadenceMismatch = !diagnosis.cadence_match &&
    diagnosis.server_cadence_ms &&
    diagnosis.client_observed_cadence_ms
      ? ` Server cadence is ${diagnosis.server_cadence_ms}ms, but the client reports ${diagnosis.client_observed_cadence_ms}ms.`
      : "";
  return [
    "Auntie Dot report:",
    diagnosis.capture_ready
      ? "Sensor readiness: visual capture is adopted and running. Capture alone is not live cognition."
      : `Sensor readiness: visual capture is not ready. Producer=${diagnosis.producer_status}; client=${diagnosis.client_adoption_status}; interval_active=${diagnosis.client_interval_active}.`,
    diagnosis.scene_procedure_ready
      ? "Mission-state interpretation: ready from fresh SituationRun observations, field evaluations, and interpretations."
      : `Mission-state interpretation: unavailable or blocked. ${diagnosis.auntie_dot.mission_state_summary}`,
    diagnosis.live_card_ready
      ? "Live Answer card: fresh."
      : `Live Answer card: not fresh or not bound; card_delta_status=${diagnosis.card_delta_status}.`,
    cadenceMismatch,
    `Blocking reason: ${diagnosis.blocking_reason}.`,
    `Next required action: ${diagnosis.next_required_action}.`,
  ].join(" ").replace(/\s+/g, " ").trim();
}
