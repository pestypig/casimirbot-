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
): HelixLiveEnvironmentBindingDiagnosis["active_situation_context_status"] => {
  if (status === "active" || status === "stale" || status === "unbound" || status === "missing") return status;
  return "not_selected";
};

const mapNextAction = (
  blockingReason: HelixLiveEnvironmentBindingDiagnosisBlockingReason,
): HelixLiveEnvironmentBindingDiagnosisNextAction => {
  if (blockingReason === "producer_stale" || blockingReason === "client_adoption_pending") return "capture_frame_now";
  if (blockingReason === "no_active_situation_run") return "create_or_resume_situation_run";
  if (blockingReason === "no_field_evaluations") return "run_field_workers_for_latest_observation";
  if (blockingReason === "no_interpretation_artifacts") return "run_field_workers_for_latest_observation";
  if (blockingReason === "panel_unbound") return "repair_card_projection_binding";
  if (blockingReason === "cadence_mismatch") return "reconcile_cadence";
  return "none";
};

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
    clientAdoptionStatus === "adopted" &&
    observedState.client_stream_confirmed === true &&
    clientIntervalActive;
  const contextStatus = mapContextStatus(activeContext.status);
  const latestFieldEvaluationRefs = activeContext.latest_field_evaluation_refs;
  const sceneProcedureReady =
    captureReady &&
    freshness?.is_fresh === true &&
    contextStatus === "active" &&
    latestFieldEvaluationRefs.length > 0 &&
    latestInterpretationRefs.length > 0;
  const liveCardReady = sceneProcedureReady && Boolean(freshness?.last_card_delta_at);
  const producerStatus: HelixLiveEnvironmentBindingDiagnosis["producer_status"] =
    !freshness
      ? "missing"
      : freshness.is_fresh
        ? "fresh"
        : freshness.stale_reason
          ? "stale"
          : input.producerBindingStatus === "bound"
            ? "bound"
            : clientAdoptionStatus === "adopted"
              ? "adopted"
              : clientAdoptionStatus === "requested"
                ? "requested"
                : "missing";
  let blockingReason: HelixLiveEnvironmentBindingDiagnosisBlockingReason = "none";
  if (clientAdoptionStatus !== "adopted") blockingReason = "client_adoption_pending";
  else if (freshness && !freshness.is_fresh) blockingReason = "producer_stale";
  else if (contextStatus !== "active") blockingReason = "no_active_situation_run";
  else if (latestFieldEvaluationRefs.length === 0) blockingReason = "no_field_evaluations";
  else if (latestInterpretationRefs.length === 0) blockingReason = "no_interpretation_artifacts";
  else if (!freshness?.last_card_delta_at) blockingReason = "panel_unbound";
  else if (!cadenceMatch) blockingReason = "cadence_mismatch";
  const nextRequiredAction = mapNextAction(blockingReason);
  const summary = [
    captureReady ? "Visual capture is adopted by the browser." : "Visual capture is not fully adopted by the browser.",
    sceneProcedureReady
      ? "The live scene procedure has current cognition evidence."
      : "The live scene procedure is not currently healthy.",
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
    server_cadence_ms: serverCadenceMs,
    client_observed_cadence_ms: clientObservedCadenceMs,
    cadence_match: cadenceMatch,
    capture_ready: captureReady,
    scene_procedure_ready: sceneProcedureReady,
    live_card_ready: liveCardReady,
    active_situation_context_status: contextStatus,
    latest_observation_ref: activeContext.latest_observation_refs.at(-1) ?? null,
    latest_field_evaluation_refs: latestFieldEvaluationRefs,
    latest_interpretation_refs: latestInterpretationRefs,
    latest_card_delta_at: freshness?.last_card_delta_at ?? null,
    blocking_reason: blockingReason,
    next_required_action: nextRequiredAction,
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
    diagnosis.capture_ready
      ? "Visual capture is adopted, but capture alone is not live cognition."
      : "Visual capture is not fully ready yet.",
    diagnosis.scene_procedure_ready
      ? "The visual SituationRun has current field and interpretation evidence."
      : `The live scene procedure is not currently healthy: ${diagnosis.blocking_reason}.`,
    cadenceMismatch,
    `Next repair: ${diagnosis.next_required_action}.`,
  ].join(" ").replace(/\s+/g, " ").trim();
}
