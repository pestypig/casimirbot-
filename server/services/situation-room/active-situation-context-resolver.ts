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
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import type { HelixSourceBindingStatus } from "@shared/helix-source-binding-status";
import type { HelixSourceBindingRepairCandidate } from "@shared/helix-source-binding-repair-candidate";
import type { HelixLiveInterpretationRun } from "@shared/helix-live-interpretation-run";
import type { HelixLiveInterpretationWorkerRun } from "@shared/helix-live-interpretation-worker-run";
import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveInterpretationGraph } from "@shared/helix-live-interpretation-graph";
import type { HelixLiveTangentEvaluation } from "@shared/helix-live-tangent-evaluation";
import { listLiveSituationRuns } from "./live-situation-run-store";
import { listObservationJournalEntries } from "./observation-journal-store";
import { listLiveFieldEvaluations } from "./live-field-evaluation-store";
import { listLiveProbeResults } from "./live-probe-result-store";
import { listProcedureEpochClosures } from "./procedure-epoch-closure";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { listLiveAnswerEnvironments } from "./live-answer-environment-store";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { readLiveSourceProducerFreshness } from "./live-source-producer-freshness";
import { listLiveInterpretationRuns } from "./live-interpretation-run-store";
import { listLiveInterpretationWorkerRuns } from "./live-interpretation-worker-run-store";
import { listLiveInterpretationHypotheses } from "./live-interpretation-hypothesis-store";
import { listLiveInterpretationGraphs } from "./live-interpretation-graph-store";
import { listLiveTangentEvaluations } from "./live-tangent-evaluation-store";
import {
  createSourceBindingRepairCandidate,
  listSourceBindingRepairCandidates,
  listSourceBindingStatuses,
  recordObservedUnboundSource,
} from "./source-binding-status-store";

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
        .filter((producer: HelixLiveSourceProducer) => producer.status === "active" || producer.status === "waiting_for_client")
        .filter((producer: HelixLiveSourceProducer) => threadCandidates.includes(producer.thread_id))
        .filter((producer: HelixLiveSourceProducer) => !input.sourceId || producer.source_id === input.sourceId)
        .map((producer: HelixLiveSourceProducer) => ({
          producer,
          freshness: readLiveSourceProducerFreshness({ producerId: producer.producer_id, now: now.toISOString() }),
        }))
        .sort((a: { producer: HelixLiveSourceProducer; freshness: ReturnType<typeof readLiveSourceProducerFreshness> }, b: { producer: HelixLiveSourceProducer; freshness: ReturnType<typeof readLiveSourceProducerFreshness> }) => {
          const bTime = Date.parse(b.freshness?.last_capture_at ?? "") || 0;
          const aTime = Date.parse(a.freshness?.last_capture_at ?? "") || 0;
          return bTime - aTime || b.producer.producer_id.localeCompare(a.producer.producer_id);
        })[0] ?? null;
  const threadId = run?.thread_id ?? activeEnvironment?.thread_id ?? activeProducer?.producer.thread_id ?? input.threadId;
  const activeSourceIds = unique([
    input.sourceId ?? null,
    ...(run?.source_ids ?? []),
  ]);
  const sourceStatuses = run
    ? listSourceBindingStatuses({ threadId, situationRunId: run.situation_run_id, limit: 200 })
        .filter((status: HelixSourceBindingStatus) => run.source_ids.includes(status.source_id))
    : [];
  const boundSourceStatuses = sourceStatuses.filter((status: HelixSourceBindingStatus) =>
    (status.state === "bound" || status.state === "repair_applied") &&
    status.situation_run_id === run?.situation_run_id
  );
  const boundBindingIds = new Set(unique([
    run?.source_binding_id ?? null,
    ...boundSourceStatuses.map((status: HelixSourceBindingStatus) => status.binding_id ?? null),
  ]));
  const observations = listObservationJournalEntries({ threadId, limit: 50 })
    .filter((entry: HelixObservationJournalEntry) =>
      activeSourceIds.length === 0 ||
      !entry.source_id ||
      activeSourceIds.includes(entry.source_id),
    )
    .filter((entry: HelixObservationJournalEntry) =>
      !run ||
      Boolean(entry.source_binding_id && boundBindingIds.has(entry.source_binding_id)) ||
      Boolean(entry.replay_status === "replayed" && entry.source_binding_id && boundBindingIds.has(entry.source_binding_id))
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
  const interpretationRuns = run
    ? listLiveInterpretationRuns({
        threadId,
        situationRunId: run.situation_run_id,
        limit: 12,
      })
    : [];
  const interpretationRunIds = new Set(interpretationRuns.map((entry: HelixLiveInterpretationRun) => entry.interpretation_run_id));
  const interpretationWorkerRuns = run
    ? listLiveInterpretationWorkerRuns({
        threadId,
        situationRunId: run.situation_run_id,
        limit: 80,
      }).filter((entry: HelixLiveInterpretationWorkerRun) => interpretationRunIds.size === 0 || interpretationRunIds.has(entry.interpretation_run_id))
    : [];
  const interpretationHypotheses = run
    ? listLiveInterpretationHypotheses({
        situationRunId: run.situation_run_id,
        limit: 80,
      }).filter((entry: HelixLiveInterpretationHypothesis) =>
        (interpretationRunIds.size === 0 || interpretationRunIds.has(entry.interpretation_run_id)) &&
        !["rejected", "expired", "stale"].includes(entry.status)
      )
    : [];
  const interpretationGraphs = run
    ? listLiveInterpretationGraphs({
        situationRunId: run.situation_run_id,
      }).filter((entry: HelixLiveInterpretationGraph) => interpretationRunIds.size === 0 || interpretationRunIds.has(entry.interpretation_run_id))
    : [];
  const interpretationTangents = run
    ? listLiveTangentEvaluations({
        threadId,
        situationRunId: run.situation_run_id,
        limit: 40,
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
  const boundSourceIds = new Set(boundSourceStatuses.map((status: HelixSourceBindingStatus) => status.source_id));
  const scopedDescriptors = run ? descriptors.filter((descriptor: HelixLiveSourceDescriptor) => boundSourceIds.has(descriptor.source_id)) : descriptors;
  const latestObservationRefs = unique([
    ...observations.slice(-3).map((entry: HelixObservationJournalEntry) => entry.observation_id),
    ...scopedDescriptors.flatMap((descriptor: HelixLiveSourceDescriptor) => descriptor.latest_observation_refs.slice(-2)),
  ]);
  const allowedObservationRefs = new Set(latestObservationRefs);
  const scopedFieldEvaluations = run
    ? fieldEvaluations.filter((entry: HelixLiveFieldEvaluation) =>
        entry.evidence_refs.length === 0 ||
        entry.evidence_refs.some((ref: string) => allowedObservationRefs.has(ref))
      )
    : fieldEvaluations;
  const latestFieldEvaluationRefs = unique(scopedFieldEvaluations.slice(-8).map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id));
  const latestInterpretationRunRefs = unique(interpretationRuns.slice(-4).map((entry: HelixLiveInterpretationRun) => entry.interpretation_run_id));
  const latestInterpretationWorkerRunRefs = unique(interpretationWorkerRuns.slice(-12).map((entry: HelixLiveInterpretationWorkerRun) => entry.interpretation_worker_run_id));
  const latestInterpretationHypothesisRefs = unique(interpretationHypotheses.slice(-12).map((entry: HelixLiveInterpretationHypothesis) => entry.hypothesis_id));
  const latestInterpretationGraphRefs = unique(interpretationGraphs.slice(-4).map((entry: HelixLiveInterpretationGraph) => entry.graph_id));
  const latestInterpretationTangentRefs = unique(interpretationTangents.slice(-8).map((entry: HelixLiveTangentEvaluation) => entry.tangent_id));
  const latestProbeResultRefs = unique(probeResults.slice(-4).map((entry: HelixLiveProbeResult) => entry.probe_result_id));
  const latestClosureRefs = unique(closures.slice(-3).map((entry: HelixProcedureEpochClosure) => entry.closure_id));
  const latestSourceDescriptorRefs = unique(scopedDescriptors.slice(-6).map((entry: HelixLiveSourceDescriptor) => entry.descriptor_id));
  const latestEvidenceTime = [
    ...fieldEvaluations.map((entry: HelixLiveFieldEvaluation) => entry.created_at),
    ...interpretationRuns.map((entry: HelixLiveInterpretationRun) => entry.updated_at),
    ...interpretationWorkerRuns.map((entry: HelixLiveInterpretationWorkerRun) => entry.completed_at ?? entry.started_at),
    ...interpretationGraphs.map((entry: HelixLiveInterpretationGraph) => entry.updated_at),
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
    : latestObservationRefs.length === 0 && latestFieldEvaluationRefs.length === 0 && latestInterpretationHypothesisRefs.length === 0
      ? "no_fresh_evidence"
      : stale
        ? "stale"
        : "active";
  const activeModalities = unique([
    run?.modality_scope ?? null,
    activeProducer?.producer.modality ?? null,
    ...scopedDescriptors.map((descriptor: HelixLiveSourceDescriptor) => descriptor.modality),
  ]);
  const unboundProducers = listLiveSourceProducers({ threadId })
    .filter((producer: HelixLiveSourceProducer) => producer.status === "active" || producer.status === "waiting_for_client")
    .filter((producer: HelixLiveSourceProducer) => !run || !boundSourceIds.has(producer.source_id));
  const observedUnboundStatuses = unboundProducers.map((producer: HelixLiveSourceProducer) => recordObservedUnboundSource({
    threadId: producer.thread_id,
    sourceId: producer.source_id,
    modality: producer.modality,
    chunkRef: producer.latest_chunk_id ?? null,
    evidenceRefs: producer.latest_chunk_id ? [producer.latest_chunk_id] : [],
    now: now.toISOString(),
  }));
  const repairCandidates = observedUnboundStatuses.map((status: HelixSourceBindingStatus) => createSourceBindingRepairCandidate({
    threadId: status.thread_id,
    sourceId: status.source_id,
    sourceKind: status.source_kind,
    modality: status.modality,
    targetSituationRunId: run?.situation_run_id ?? null,
    targetEnvironmentId: run?.environment_id ?? activeEnvironment?.environment_id ?? null,
    proposedReplayPolicy: "future_only",
    oldUnboundObservationRefs: status.latest_observation_refs,
    oldUnboundChunkRefs: status.latest_chunk_refs,
  }));
  const existingRepairCandidates = listSourceBindingRepairCandidates({ threadId, limit: 50 });
  const sourceBindingStatusRefs = unique([
    ...boundSourceStatuses.map((status: HelixSourceBindingStatus) => status.status_id),
    ...observedUnboundStatuses.map((status: HelixSourceBindingStatus) => status.status_id),
  ]);
  return {
    schema: HELIX_ACTIVE_SITUATION_CONTEXT_SCHEMA,
    context_id: `active_situation_context:${hashShort([
      threadId,
      run?.situation_run_id ?? activeEnvironment?.environment_id ?? activeProducer?.producer.producer_id ?? "missing",
      latestObservationRefs,
      latestFieldEvaluationRefs,
      latestInterpretationRunRefs,
      latestInterpretationWorkerRunRefs,
      latestInterpretationHypothesisRefs,
      latestInterpretationGraphRefs,
      latestInterpretationTangentRefs,
      latestProbeResultRefs,
      latestClosureRefs,
    ])}`,
    thread_id: threadId,
    situation_run_id: run?.situation_run_id ?? null,
    environment_id: run?.environment_id ?? activeEnvironment?.environment_id ?? null,
    source_binding_ids: run
        ? unique([run.source_binding_id, ...boundSourceStatuses.map((status: HelixSourceBindingStatus) => status.binding_id ?? null)])
      : activeProducer
        ? [activeProducer.producer.producer_id]
        : [],
    source_binding_status_refs: sourceBindingStatusRefs,
    observed_unbound_source_refs: observedUnboundStatuses.map((status) => status.status_id),
    repair_candidate_refs: unique([
      ...repairCandidates.map((candidate: HelixSourceBindingRepairCandidate) => candidate.repair_candidate_id),
      ...existingRepairCandidates.map((candidate: HelixSourceBindingRepairCandidate) => candidate.repair_candidate_id),
    ]),
    latest_epoch: run?.current_epoch ?? null,
    active_modalities: activeModalities,
    latest_observation_refs: latestObservationRefs,
    latest_field_evaluation_refs: latestFieldEvaluationRefs,
    latest_interpretation_run_refs: latestInterpretationRunRefs,
    latest_interpretation_worker_run_refs: latestInterpretationWorkerRunRefs,
    latest_interpretation_hypothesis_refs: latestInterpretationHypothesisRefs,
    latest_interpretation_graph_refs: latestInterpretationGraphRefs,
    latest_interpretation_tangent_refs: latestInterpretationTangentRefs,
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
