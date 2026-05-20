import crypto from "node:crypto";
import { getActiveLiveAnswerEnvironmentForThread } from "../situation-room/live-answer-environment-store";
import { listLiveFieldEvaluations } from "../situation-room/live-field-evaluation-store";
import { listInterpretationCards } from "../situation-room/interpretation-card-store";
import { listLiveSituationRuns } from "../situation-room/live-situation-run-store";
import {
  getLatestLiveSourceChunk,
  listLiveSourceAnalysisJobs,
  listLiveSourceProducers,
} from "../situation-room/live-source-chunk-buffer";
import { readLiveSourceProducerFreshness } from "../situation-room/live-source-producer-freshness";
import { listObservationJournalEntries } from "../situation-room/observation-journal-store";

type RecordLike = Record<string, unknown>;

export type HelixLiveSourceIdentityAuditDiagnosis =
  | "ok"
  | "active_environment_missing"
  | "active_environment_source_missing"
  | "producer_source_mismatch"
  | "fresh_source_unbound"
  | "fresh_source_wrong_environment"
  | "fresh_observation_not_in_situation_run"
  | "situation_run_missing"
  | "field_evaluations_missing"
  | "interpretations_missing";

export type HelixLiveSourceIdentityAudit = {
  schema: "helix.live_source_identity_audit.v1";
  audit_id: string;
  turn_id: string;
  thread_id: string;

  active_environment_id: string | null;
  active_environment_source_id: string | null;

  active_visual_producer_id: string | null;
  active_visual_producer_source_id: string | null;

  freshest_visual_source_id: string | null;
  freshest_visual_source_environment_id: string | null;
  freshest_visual_observation_ref: string | null;
  freshest_visual_analysis_job_id: string | null;

  selected_situation_run_id: string | null;
  selected_observation_refs: string[];

  identity_ok: boolean;
  freshness_ok: boolean;
  environment_binding_ok: boolean;
  situation_run_binding_ok: boolean;

  diagnosis: HelixLiveSourceIdentityAuditDiagnosis;

  repair_candidate?: {
    action:
      | "bind_fresh_visual_source"
      | "create_situation_run"
      | "attach_source_to_environment"
      | "run_field_evaluations";
    source_id?: string;
    environment_id?: string;
    reason: string;
    mutating: boolean;
  };

  assistant_answer: false;
  raw_content_included: false;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const latestByIso = <T>(entries: T[], readIso: (entry: T) => string | null | undefined): T | null =>
  [...entries]
    .sort((a, b) => (readIso(a) ?? "").localeCompare(readIso(b) ?? ""))
    .at(-1) ?? null;

const selectedObservationRefsFromPayload = (payload: RecordLike | null): string[] => {
  const selection = readRecord(payload?.situation_evidence_selection);
  const explicit = readStringArray(selection?.selected_observation_refs);
  if (explicit.length > 0) return explicit;
  return readStringArray(readRecord(payload?.active_situation_context)?.selected_observation_refs);
};

const selectedSituationRunIdFromPayload = (payload: RecordLike | null): string | null => {
  const selection = readRecord(payload?.situation_evidence_selection);
  return (
    readString(selection?.situation_run_id) ??
    readString(readRecord(payload?.active_situation_context)?.situation_run_id) ??
    readString(payload?.situation_run_id)
  );
};

export const isLiveSourceIdentityAuditRelevant = (input: {
  promptText?: string | null;
  sourceTarget?: string | null;
  selectedRoute?: string | null;
  terminalArtifactKind?: string | null;
  payload?: RecordLike | null;
}): boolean => {
  const sourceTarget = input.sourceTarget ?? readString(readRecord(input.payload?.source_target_intent)?.target_source) ?? "";
  const route = input.selectedRoute ?? "";
  const terminal = input.terminalArtifactKind ?? "";
  const prompt = input.promptText ?? "";
  if (
    sourceTarget === "live_pipeline" &&
    terminal === "live_pipeline_receipt" &&
    /^live_(?:source_continuation|pipeline_control|pipeline_inspect|pipeline_repair|runtime_repair|answer_environment_setup)$/i.test(route)
  ) {
    return false;
  }
  if (
    /visual_capture|visual_scene_memory|situation_epoch|procedure_memory/i.test(sourceTarget) ||
    /situation_context|visual_scene|procedure_epoch|live_interpretation|live_answer/i.test(route) ||
    /situation_context_pack|procedure_memory|visual/i.test(terminal)
  ) {
    return true;
  }
  return /\b(?:screen|screenshot|visual|capture|camera|live answer|what is happening|what's happening)\b/i.test(prompt);
};

export function buildLiveSourceIdentityAudit(input: {
  turnId: string;
  threadId: string;
  payload?: RecordLike | null;
}): HelixLiveSourceIdentityAudit {
  const activeEnvironment = getActiveLiveAnswerEnvironmentForThread(input.threadId);
  const activeEnvironmentSourceId = activeEnvironment?.source_ids?.[0] ?? null;
  const latestVisualChunk = getLatestLiveSourceChunk({
    threadId: input.threadId,
    modality: "visual_frame",
  });
  const visualProducers = listLiveSourceProducers({ threadId: input.threadId })
    .filter((producer) => producer.modality === "visual_frame");
  const activeVisualProducer =
    (activeEnvironmentSourceId
      ? visualProducers.find((producer) => producer.source_id === activeEnvironmentSourceId)
      : null) ??
    (latestVisualChunk
      ? visualProducers.find((producer) => producer.source_id === latestVisualChunk.source_id)
      : null) ??
    visualProducers.at(-1) ??
    null;
  const freshness = activeVisualProducer
    ? readLiveSourceProducerFreshness({ producerId: activeVisualProducer.producer_id })
    : null;
  const latestObservation = latestByIso(
    listObservationJournalEntries({ threadId: input.threadId, limit: 300 })
      .filter((entry) => entry.modality === "visual_frame")
      .filter((entry) => !latestVisualChunk || entry.source_id === latestVisualChunk.source_id),
    (entry) => entry.created_at,
  );
  const freshestAnalysisJob = latestVisualChunk
    ? latestByIso(
        listLiveSourceAnalysisJobs({
          threadId: input.threadId,
          sourceId: latestVisualChunk.source_id,
          chunkId: latestVisualChunk.chunk_id,
          status: "any",
          limit: 50,
        }),
        () => "",
      )
    : null;
  const selectedSituationRunId = selectedSituationRunIdFromPayload(input.payload ?? null);
  const latestRun =
    (selectedSituationRunId
      ? listLiveSituationRuns({ threadId: input.threadId, limit: 100 })
          .find((run) => run.situation_run_id === selectedSituationRunId)
      : null) ??
    (activeEnvironment
      ? listLiveSituationRuns({
          threadId: input.threadId,
          environmentId: activeEnvironment.environment_id,
          limit: 20,
        }).at(-1)
      : null) ??
    listLiveSituationRuns({ threadId: input.threadId, limit: 20 }).at(-1) ??
    null;
  const selectedObservationRefs = Array.from(new Set([
    ...selectedObservationRefsFromPayload(input.payload ?? null),
    ...(latestRun?.latest_epoch_observation_refs ?? []),
    ...(latestRun?.latest_observation_ref ? [latestRun.latest_observation_ref] : []),
    ...(latestRun?.selected_evidence_refs ?? []).filter((ref) => /^observation:/i.test(ref)),
  ]));
  const fieldEvaluations = listLiveFieldEvaluations({
    threadId: input.threadId,
    environmentId: activeEnvironment?.environment_id ?? latestRun?.environment_id ?? null,
    situationRunId: latestRun?.situation_run_id ?? null,
    limit: 50,
  });
  const nowMs = Date.now();
  const interpretationCards = listInterpretationCards({ threadId: input.threadId, limit: 50 })
    .filter((card) => Date.parse(card.expires_at) > nowMs);
  const freshestVisualSourceId = latestVisualChunk?.source_id ?? freshness?.source_id ?? null;
  const freshestVisualObservationRef = latestObservation?.observation_id ?? null;
  const freshnessOk = Boolean(latestVisualChunk && freshestVisualSourceId && (freshness?.is_fresh !== false));
  const environmentSourceSet = new Set(activeEnvironment?.source_ids ?? []);
  const producerSourceMatches =
    !activeVisualProducer ||
    !activeEnvironmentSourceId ||
    activeVisualProducer.source_id === activeEnvironmentSourceId;
  const environmentBindingOk = Boolean(
    activeEnvironment &&
    activeEnvironmentSourceId &&
    (!freshestVisualSourceId || environmentSourceSet.has(freshestVisualSourceId)),
  );
  const situationRunBindingOk = Boolean(
    latestRun &&
    freshestVisualObservationRef &&
    selectedObservationRefs.includes(freshestVisualObservationRef),
  );

  let diagnosis: HelixLiveSourceIdentityAuditDiagnosis = "ok";
  if (!activeEnvironment) diagnosis = "active_environment_missing";
  else if (!activeEnvironmentSourceId) diagnosis = "active_environment_source_missing";
  else if (!producerSourceMatches) diagnosis = "producer_source_mismatch";
  else if (freshestVisualSourceId && !environmentSourceSet.has(freshestVisualSourceId)) diagnosis = "fresh_source_unbound";
  else if (
    latestVisualChunk?.environment_id &&
    activeEnvironment.environment_id &&
    latestVisualChunk.environment_id !== activeEnvironment.environment_id
  ) {
    diagnosis = "fresh_source_wrong_environment";
  } else if (!latestRun) diagnosis = "situation_run_missing";
  else if (freshestVisualObservationRef && !selectedObservationRefs.includes(freshestVisualObservationRef)) {
    diagnosis = "fresh_observation_not_in_situation_run";
  } else if (fieldEvaluations.length === 0) diagnosis = "field_evaluations_missing";
  else if (interpretationCards.length === 0) diagnosis = "interpretations_missing";

  const repairCandidate = (() => {
    if (diagnosis === "active_environment_source_missing" || diagnosis === "fresh_source_unbound") {
      return freshestVisualSourceId
        ? {
            action: "bind_fresh_visual_source" as const,
            source_id: freshestVisualSourceId,
            environment_id: activeEnvironment?.environment_id,
            reason: "Fresh visual source exists but is not bound to the active Live Answer environment.",
            mutating: false,
          }
        : undefined;
    }
    if (diagnosis === "fresh_source_wrong_environment" || diagnosis === "producer_source_mismatch") {
      return freshestVisualSourceId
        ? {
            action: "attach_source_to_environment" as const,
            source_id: freshestVisualSourceId,
            environment_id: activeEnvironment?.environment_id,
            reason: "Visual producer/source identity does not reconcile with the active environment.",
            mutating: false,
          }
        : undefined;
    }
    if (diagnosis === "situation_run_missing") {
      return {
        action: "create_situation_run" as const,
        source_id: activeEnvironmentSourceId ?? freshestVisualSourceId ?? undefined,
        environment_id: activeEnvironment?.environment_id,
        reason: "Active visual source needs a SituationRun before it can answer.",
        mutating: false,
      };
    }
    if (diagnosis === "field_evaluations_missing") {
      return {
        action: "run_field_evaluations" as const,
        source_id: activeEnvironmentSourceId ?? freshestVisualSourceId ?? undefined,
        environment_id: activeEnvironment?.environment_id ?? latestRun?.environment_id,
        reason: "SituationRun exists but has no current field evaluations.",
        mutating: false,
      };
    }
    return undefined;
  })();

  const identityOk =
    diagnosis === "ok" &&
    freshnessOk &&
    environmentBindingOk &&
    situationRunBindingOk;

  return {
    schema: "helix.live_source_identity_audit.v1",
    audit_id: `live_source_identity_audit:${hashShort([
      input.turnId,
      input.threadId,
      activeEnvironment?.environment_id ?? null,
      freshestVisualSourceId,
      diagnosis,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    active_environment_id: activeEnvironment?.environment_id ?? null,
    active_environment_source_id: activeEnvironmentSourceId,
    active_visual_producer_id: activeVisualProducer?.producer_id ?? null,
    active_visual_producer_source_id: activeVisualProducer?.source_id ?? null,
    freshest_visual_source_id: freshestVisualSourceId,
    freshest_visual_source_environment_id: latestVisualChunk?.environment_id ?? null,
    freshest_visual_observation_ref: freshestVisualObservationRef,
    freshest_visual_analysis_job_id: freshness?.last_analysis_job_id ?? freshestAnalysisJob?.job_id ?? null,
    selected_situation_run_id: latestRun?.situation_run_id ?? null,
    selected_observation_refs: selectedObservationRefs,
    identity_ok: identityOk,
    freshness_ok: freshnessOk,
    environment_binding_ok: environmentBindingOk,
    situation_run_binding_ok: situationRunBindingOk,
    diagnosis,
    ...(repairCandidate ? { repair_candidate: repairCandidate } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
}
