import crypto from "node:crypto";
import {
  HELIX_ACTIVE_SITUATION_CONTEXT_SCHEMA,
  type HelixActiveSituationContext,
  type HelixActiveSituationContextStatus,
} from "@shared/helix-active-situation-context";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixLiveProbeResult } from "@shared/helix-live-probe-result";
import type { HelixProcedureEpochClosure } from "@shared/helix-procedure-epoch-closure";
import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import { listLiveSituationRuns } from "./live-situation-run-store";
import { listObservationJournalEntries } from "./observation-journal-store";
import { listLiveFieldEvaluations } from "./live-field-evaluation-store";
import { listLiveProbeResults } from "./live-probe-result-store";
import { listProcedureEpochClosures } from "./procedure-epoch-closure";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { listLiveAnswerEnvironments } from "./live-answer-environment-store";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { readLiveSourceProducerFreshness } from "./live-source-producer-freshness";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => String(value ?? "").trim()).filter(Boolean)));

export function resolveActiveSituationContext(input: {
  threadId: string;
  environmentId?: string | null;
  sourceId?: string | null;
  now?: Date;
}): HelixActiveSituationContext {
  const now = input.now ?? new Date();
  const threadCandidates = unique([input.threadId, "helix-ask:desktop"]);
  const runs = threadCandidates
    .flatMap((threadId: string) => listLiveSituationRuns({
      threadId,
      environmentId: input.environmentId ?? null,
      limit: 50,
    }))
    .filter((run: HelixLiveSituationRun) => run.status === "active")
    .filter((run: HelixLiveSituationRun) => !input.sourceId || run.source_ids.includes(input.sourceId))
    .sort((a: HelixLiveSituationRun, b: HelixLiveSituationRun) => b.updated_at.localeCompare(a.updated_at));
  const run = runs[0] ?? null;
  const activeEnvironment = run
    ? null
    : listLiveAnswerEnvironments()
        .filter((environment: LiveAnswerEnvironment) => environment.status === "active")
        .filter((environment: LiveAnswerEnvironment) => threadCandidates.includes(environment.thread_id))
        .filter((environment: LiveAnswerEnvironment) => !input.environmentId || environment.environment_id === input.environmentId)
        .sort((a: LiveAnswerEnvironment, b: LiveAnswerEnvironment) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
  const activeProducer = run || activeEnvironment
    ? null
    : listLiveSourceProducers()
        .filter((producer) => producer.status === "active" || producer.status === "waiting_for_client")
        .filter((producer) => producer.modality === "visual_frame")
        .filter((producer) => threadCandidates.includes(producer.thread_id))
        .filter((producer) => !input.sourceId || producer.source_id === input.sourceId)
        .map((producer) => ({
          producer,
          freshness: readLiveSourceProducerFreshness({ producerId: producer.producer_id, now: now.toISOString() }),
        }))
        .sort((a, b) => {
          const bTime = Date.parse(b.freshness?.last_capture_at ?? "") || 0;
          const aTime = Date.parse(a.freshness?.last_capture_at ?? "") || 0;
          return bTime - aTime || b.producer.producer_id.localeCompare(a.producer.producer_id);
        })[0] ?? null;
  const threadId = run?.thread_id ?? activeEnvironment?.thread_id ?? activeProducer?.producer.thread_id ?? input.threadId;
  const activeSourceIds = unique([
    input.sourceId ?? null,
    ...(run?.source_ids ?? []),
  ]);
  const observations = listObservationJournalEntries({ threadId, limit: 50 })
    .filter((entry: HelixObservationJournalEntry) =>
      activeSourceIds.length === 0 ||
      !entry.source_id ||
      activeSourceIds.includes(entry.source_id),
    )
    .slice(-12);
  const fieldEvaluations = run
    ? listLiveFieldEvaluations({
        threadId,
        environmentId: run.environment_id,
        situationRunId: run.situation_run_id,
        limit: 24,
      })
    : [];
  const probeResults = run
    ? listLiveProbeResults({
        threadId,
        environmentId: run.environment_id,
        situationRunId: run.situation_run_id,
        limit: 12,
      })
    : [];
  const closures = run
    ? listProcedureEpochClosures({
        threadId,
        environmentId: run.environment_id,
        situationRunId: run.situation_run_id,
        limit: 6,
      })
    : [];
  const descriptors = run
    ? run.source_ids.flatMap((sourceId: string) =>
        listLiveSourceDescriptors({
          threadId,
          sourceId,
          environmentId: run.environment_id,
          limit: 3,
        }),
      )
    : [];
  const latestObservationRefs = unique([
    ...observations.slice(-3).map((entry: HelixObservationJournalEntry) => entry.observation_id),
    ...descriptors.flatMap((descriptor: HelixLiveSourceDescriptor) => descriptor.latest_observation_refs.slice(-2)),
  ]);
  const latestFieldEvaluationRefs = unique(fieldEvaluations.slice(-8).map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id));
  const latestProbeResultRefs = unique(probeResults.slice(-4).map((entry: HelixLiveProbeResult) => entry.probe_result_id));
  const latestClosureRefs = unique(closures.slice(-3).map((entry: HelixProcedureEpochClosure) => entry.closure_id));
  const latestSourceDescriptorRefs = unique(descriptors.slice(-6).map((entry: HelixLiveSourceDescriptor) => entry.descriptor_id));
  const latestEvidenceTime = [
    ...fieldEvaluations.map((entry: HelixLiveFieldEvaluation) => entry.created_at),
    ...probeResults.map((entry: HelixLiveProbeResult) => entry.created_at),
    ...closures.map((entry: HelixProcedureEpochClosure) => entry.created_at),
    ...observations.map((entry: HelixObservationJournalEntry) => entry.created_at),
  ]
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0] ?? null;
  const stale = latestEvidenceTime !== null && now.getTime() - latestEvidenceTime > 120_000;
  const status: HelixActiveSituationContextStatus = !run
    ? activeEnvironment
      ? "missing"
      : "missing"
    : latestObservationRefs.length === 0 && latestFieldEvaluationRefs.length === 0
      ? "no_fresh_evidence"
      : stale
        ? "stale"
        : "active";
  const activeModalities = unique([
    run?.modality_scope ?? null,
    activeProducer?.producer.modality ?? null,
    ...descriptors.map((descriptor: HelixLiveSourceDescriptor) => descriptor.modality),
  ]);
  return {
    schema: HELIX_ACTIVE_SITUATION_CONTEXT_SCHEMA,
    context_id: `active_situation_context:${hashShort([
      threadId,
      run?.situation_run_id ?? activeEnvironment?.environment_id ?? activeProducer?.producer.producer_id ?? "missing",
      latestObservationRefs,
      latestFieldEvaluationRefs,
      latestProbeResultRefs,
      latestClosureRefs,
    ])}`,
    thread_id: threadId,
    situation_run_id: run?.situation_run_id ?? null,
    environment_id: run?.environment_id ?? activeEnvironment?.environment_id ?? null,
    source_binding_ids: run ? [run.source_binding_id] : activeProducer ? [activeProducer.producer.producer_id] : [],
    latest_epoch: run?.current_epoch ?? null,
    active_modalities: activeModalities,
    latest_observation_refs: latestObservationRefs,
    latest_field_evaluation_refs: latestFieldEvaluationRefs,
    latest_probe_result_refs: latestProbeResultRefs,
    latest_closure_refs: latestClosureRefs,
    latest_source_descriptor_refs: latestSourceDescriptorRefs,
    status: !run && !activeEnvironment && activeProducer ? "unbound" : status,
    freshness_summary: run
      ? status === "active"
        ? `Active SituationRun ${run.situation_run_id} has selected procedure evidence.`
        : status === "stale"
          ? "SituationRun exists, but latest evidence is stale."
          : "SituationRun exists, but no fresh evidence was selected."
      : activeEnvironment
        ? "A live answer environment exists, but no active SituationRun is bound yet."
        : activeProducer
          ? [
              `A live visual source producer exists (${activeProducer.producer.producer_id}), but it is not bound to an active SituationRun/live-answer environment.`,
              activeProducer.freshness
                ? `Producer freshness: ${activeProducer.freshness.is_fresh ? "fresh" : activeProducer.freshness.stale_reason ?? "not fresh"}; latest chunk: ${activeProducer.freshness.last_chunk_id ?? "none"}; latest analysis: ${activeProducer.freshness.last_analysis_job_id ?? "none"}.`
                : "Producer freshness is unavailable.",
            ].join(" ")
        : "No active SituationRun or live answer environment is available.",
    next_required_action: run
      ? status === "active"
        ? null
        : "wait_for_next_bound_observation"
      : activeEnvironment
        ? "create_or_bind_situation_run"
        : activeProducer
          ? "create_or_bind_situation_run"
        : "start_live_visual_source",
    assistant_answer: false,
    raw_content_included: false,
  };
}
