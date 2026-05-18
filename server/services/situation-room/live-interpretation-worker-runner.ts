import crypto from "node:crypto";
import { HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA } from "@shared/helix-live-interpretation-worker-run";
import { HELIX_LIVE_TANGENT_EVALUATION_SCHEMA } from "@shared/helix-live-tangent-evaluation";
import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveInterpretationWorkerRun } from "@shared/helix-live-interpretation-worker-run";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveTangentEvaluation } from "@shared/helix-live-tangent-evaluation";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { runInterpretationReasoning } from "../helix-ask/internal/interpretation-reasoning-runner";
import { ensureLiveInterpretationRun } from "./live-interpretation-run-store";
import { registerLiveInterpretationWorkers } from "./live-interpretation-worker-registry";
import { recordLiveInterpretationWorkerRun } from "./live-interpretation-worker-run-store";
import {
  listLiveInterpretationHypotheses,
  recordLiveInterpretationHypothesis,
} from "./live-interpretation-hypothesis-store";
import { updateLiveInterpretationGraph } from "./live-interpretation-graph-store";
import { recordLiveTangentEvaluation } from "./live-tangent-evaluation-store";
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function runLiveInterpretationWorkersForObservation(input: {
  run: HelixLiveSituationRun;
  observation: HelixObservationJournalEntry | null;
  now?: string;
}) {
  if (!input.observation) {
    return {
      interpretation_run: null,
      interpretation_workers: [],
      interpretation_worker_runs: [],
      interpretation_hypotheses: [],
      interpretation_graph: null,
      interpretation_tangents: [],
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
  }
  if (
    input.run.source_ids.length > 0 &&
    input.observation.source_id &&
    !input.run.source_ids.includes(input.observation.source_id)
  ) {
    return {
      interpretation_run: null,
      interpretation_workers: [],
      interpretation_worker_runs: [],
      interpretation_hypotheses: [],
      interpretation_graph: null,
      interpretation_tangents: [],
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
  }
  const now = input.now ?? new Date().toISOString();
  const interpretationRun = ensureLiveInterpretationRun({
    run: input.run,
    observation: input.observation,
    now,
  });
  const workers = registerLiveInterpretationWorkers({ interpretationRun });
  appendProcedureEpochLedgerItem({
    situation_run_id: input.run.situation_run_id,
    source_binding_id: input.run.source_binding_id,
    thread_id: input.run.thread_id,
    environment_id: input.run.environment_id,
    epoch: input.run.current_epoch,
    item_kind: "interpretation_run",
    item_ref: interpretationRun.interpretation_run_id,
    summary: `Interpretation run active with ${interpretationRun.active_lenses.length} lenses.`,
    causality_refs: [input.observation.observation_id],
    created_at: now,
  });
  const previousHypotheses = listLiveInterpretationHypotheses({
    interpretationRunId: interpretationRun.interpretation_run_id,
    limit: 800,
  });
  const completedRuns: HelixLiveInterpretationWorkerRun[] = [];
  const hypotheses: HelixLiveInterpretationHypothesis[] = [];
  const tangents: HelixLiveTangentEvaluation[] = [];
  for (const worker of workers) {
    const workerRunId = `live_interpretation_worker_run:${hashShort([
      interpretationRun.interpretation_run_id,
      worker.interpretation_worker_id,
      input.observation.observation_id,
      input.run.current_epoch,
    ])}`;
    const started = recordLiveInterpretationWorkerRun({
      schema: HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA,
      interpretation_worker_run_id: workerRunId,
      interpretation_worker_id: worker.interpretation_worker_id,
      situation_run_id: input.run.situation_run_id,
      interpretation_run_id: interpretationRun.interpretation_run_id,
      thread_id: input.run.thread_id,
      source_epoch: input.run.current_epoch,
      trigger_observation_refs: [input.observation.observation_id],
      trigger_summary_refs: [input.observation.observation_id],
      status: "started",
      model_invoked: false,
      model_budget_used: worker.model_budget,
      started_at: now,
      completed_at: null,
      output_hypothesis_id: null,
      error: null,
      assistant_answer: false,
      raw_content_included: false,
      role: "validation",
    });
    appendProcedureEpochLedgerItem({
      situation_run_id: input.run.situation_run_id,
      source_binding_id: input.run.source_binding_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      epoch: input.run.current_epoch,
      item_kind: "interpretation_worker_run",
      item_ref: started.interpretation_worker_run_id,
      summary: `${worker.lens} interpretation worker started.`,
      causality_refs: started.trigger_observation_refs,
      created_at: now,
    });
    const hypothesis = recordLiveInterpretationHypothesis(runInterpretationReasoning({
      interpretationRun,
      worker,
      workerRun: started,
      observation: input.observation,
      previousHypotheses,
      now,
    }));
    const completed = recordLiveInterpretationWorkerRun({
      ...started,
      status: "completed",
      completed_at: now,
      output_hypothesis_id: hypothesis.hypothesis_id,
    });
    completedRuns.push(completed);
    hypotheses.push(hypothesis);
    appendProcedureEpochLedgerItem({
      situation_run_id: input.run.situation_run_id,
      source_binding_id: input.run.source_binding_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      epoch: input.run.current_epoch,
      item_kind: "interpretation_hypothesis",
      item_ref: hypothesis.hypothesis_id,
      summary: `${hypothesis.lens}: ${hypothesis.claim}`,
      causality_refs: [
        completed.interpretation_worker_run_id,
        ...hypothesis.evidence_refs,
        ...(hypothesis.supports ?? []),
        ...(hypothesis.contradicts ?? []),
      ],
      created_at: now,
    });
    if ((hypothesis.contradicts ?? []).length > 0) {
      const tangent = recordLiveTangentEvaluation({
        schema: HELIX_LIVE_TANGENT_EVALUATION_SCHEMA,
        tangent_id: `live_tangent:${hashShort([hypothesis.hypothesis_id, "contradiction"])}`,
        situation_run_id: input.run.situation_run_id,
        thread_id: input.run.thread_id,
        tangent_type: "contradiction_tangent",
        trigger_observation_refs: [input.observation.observation_id],
        claim: `Interpretation contradiction detected for ${hypothesis.lens}: ${hypothesis.claim}`,
        confidence: hypothesis.confidence,
        evidence_refs: hypothesis.evidence_refs,
        missing_evidence: hypothesis.missing_evidence,
        supports: hypothesis.supports ?? [],
        contradicts: hypothesis.contradicts ?? [],
        recommended_handoff: {
          type: "none",
          reason: "contradiction recorded as validation tangent only",
        },
        assistant_answer: false,
        raw_content_included: false,
        role: "validation",
        expires_at: hypothesis.expires_at,
      });
      tangents.push(tangent);
      appendProcedureEpochLedgerItem({
        situation_run_id: input.run.situation_run_id,
        source_binding_id: input.run.source_binding_id,
        thread_id: input.run.thread_id,
        environment_id: input.run.environment_id,
        epoch: input.run.current_epoch,
        item_kind: "tangent",
        item_ref: tangent.tangent_id,
        summary: tangent.claim,
        causality_refs: [hypothesis.hypothesis_id, ...tangent.contradicts],
        created_at: now,
      });
    }
  }
  const graph = updateLiveInterpretationGraph({
    interpretationRun,
    hypotheses,
    now,
  });
  return {
    interpretation_run: interpretationRun,
    interpretation_workers: workers,
    interpretation_worker_runs: completedRuns,
    interpretation_hypotheses: hypotheses,
    interpretation_graph: graph,
    interpretation_tangents: tangents,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
