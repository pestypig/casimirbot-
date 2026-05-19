import crypto from "node:crypto";
import { HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA } from "@shared/helix-live-interpretation-worker-run";
import {
  HELIX_LIVE_INTERPRETATION_VALIDATION_ARTIFACT_SCHEMA,
  type HelixLiveInterpretationValidationArtifact,
  type HelixLiveInterpretationValidationArtifactType,
} from "@shared/helix-live-interpretation-validation-artifact";
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
  updateLiveInterpretationHypothesis,
} from "./live-interpretation-hypothesis-store";
import { updateLiveInterpretationGraph } from "./live-interpretation-graph-store";
import { recordLiveInterpretationValidationArtifact } from "./live-interpretation-validation-artifact-store";
import { recordLiveTangentEvaluation } from "./live-tangent-evaluation-store";
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const digest = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const FORBIDDEN_OUTPUT_REASONS = [
  "tool_call_request",
  "ask_handoff_creation_payload",
  "plan_contract_creation_payload",
  "assistant_answer_true",
  "terminal_authority_true",
] as const;

export type InterpretationWorkerOutputValidation = {
  ok: boolean;
  failure_reasons: Array<typeof FORBIDDEN_OUTPUT_REASONS[number]>;
};

const hasForbiddenNestedKey = (value: unknown, predicate: (key: string, nested: unknown) => boolean): boolean => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((entry) => hasForbiddenNestedKey(entry, predicate));
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) =>
    predicate(key, nested) || hasForbiddenNestedKey(nested, predicate)
  );
};

export function validateInterpretationWorkerOutputPayload(output: unknown): InterpretationWorkerOutputValidation {
  const failure_reasons: InterpretationWorkerOutputValidation["failure_reasons"] = [];
  if (hasForbiddenNestedKey(output, (key, value) =>
    /tool[_-]?calls?|tool[_-]?request/i.test(key) && (Array.isArray(value) ? value.length > 0 : Boolean(value))
  )) failure_reasons.push("tool_call_request");
  if (hasForbiddenNestedKey(output, (key, value) =>
    /ask[_-]?handoff/i.test(key) || (key === "schema" && value === "helix.ask_handoff.v1")
  )) failure_reasons.push("ask_handoff_creation_payload");
  if (hasForbiddenNestedKey(output, (key, value) =>
    /plan[_-]?contract/i.test(key) || (key === "schema" && value === "helix.plan_contract.v1")
  )) failure_reasons.push("plan_contract_creation_payload");
  if (hasForbiddenNestedKey(output, (key, value) => key === "assistant_answer" && value === true)) {
    failure_reasons.push("assistant_answer_true");
  }
  if (hasForbiddenNestedKey(output, (key, value) => key === "terminal_authority" && value === true)) {
    failure_reasons.push("terminal_authority_true");
  }
  return {
    ok: failure_reasons.length === 0,
    failure_reasons: Array.from(new Set(failure_reasons)),
  };
}

const artifactTypeForHypothesis = (
  hypothesis: HelixLiveInterpretationHypothesis,
): HelixLiveInterpretationValidationArtifactType => {
  if (hypothesis.status === "reinforced") return "reinforcement";
  if (hypothesis.status === "contradicted") return "contradiction";
  if (hypothesis.status === "superseded") return "supersession";
  if (hypothesis.status === "expired") return "expiry";
  if (hypothesis.lens === "uncertainty") return "uncertainty";
  if (hypothesis.lens === "risk_lane") return "risk_notice";
  if (hypothesis.lens === "protocol_lane") return "protocol_notice";
  if (hypothesis.lens === "workstation_affordance_lane") return "affordance_notice";
  if (hypothesis.lens === "user_notice_lane") return "user_notice_candidate";
  if (hypothesis.status === "new" || hypothesis.status === "active") return "hypothesis_candidate";
  return "observation";
};

const recordValidationArtifactForHypothesis = (input: {
  workerRun: HelixLiveInterpretationWorkerRun;
  hypothesis: HelixLiveInterpretationHypothesis;
  now: string;
}): HelixLiveInterpretationValidationArtifact =>
  recordLiveInterpretationValidationArtifact({
    schema: HELIX_LIVE_INTERPRETATION_VALIDATION_ARTIFACT_SCHEMA,
    validation_artifact_id: `live_interpretation_artifact:${hashShort([
      input.workerRun.interpretation_worker_run_id,
      input.hypothesis.hypothesis_id,
      input.hypothesis.status,
    ])}`,
    interpretation_run_id: input.workerRun.interpretation_run_id,
    interpretation_worker_run_id: input.workerRun.interpretation_worker_run_id,
    scene_epoch_id: input.workerRun.scene_epoch_id,
    artifact_type: artifactTypeForHypothesis(input.hypothesis),
    payload: {
      hypothesis_id: input.hypothesis.hypothesis_id,
      worker_kind: input.workerRun.worker_kind,
      status: input.hypothesis.status,
      claim: input.hypothesis.claim,
      terminal_authority: false,
    },
    confidence: input.hypothesis.confidence,
    assistant_answer: false,
    raw_content_included: false,
    role: "validation",
    created_at: input.now,
  });

const recordGateBlockArtifact = (input: {
  workerRun: HelixLiveInterpretationWorkerRun;
  attemptedOutput: unknown;
  failureReasons: string[];
  now: string;
}): HelixLiveInterpretationValidationArtifact =>
  recordLiveInterpretationValidationArtifact({
    schema: HELIX_LIVE_INTERPRETATION_VALIDATION_ARTIFACT_SCHEMA,
    validation_artifact_id: `live_interpretation_artifact:${hashShort([
      input.workerRun.interpretation_worker_run_id,
      "gate_block",
      input.failureReasons,
    ])}`,
    interpretation_run_id: input.workerRun.interpretation_run_id,
    interpretation_worker_run_id: input.workerRun.interpretation_worker_run_id,
    scene_epoch_id: input.workerRun.scene_epoch_id,
    artifact_type: "gate_block",
    payload: {
      failure_reasons: input.failureReasons,
      attempted_output_digest: digest(input.attemptedOutput),
      terminal_authority: false,
    },
    confidence: null,
    assistant_answer: false,
    raw_content_included: false,
    role: "validation",
    created_at: input.now,
  });

const expireStaleHypotheses = (input: {
  previousHypotheses: HelixLiveInterpretationHypothesis[];
  currentHypotheses: HelixLiveInterpretationHypothesis[];
  now: string;
  currentEpoch: number;
}): HelixLiveInterpretationHypothesis[] => {
  const touched = new Set(input.currentHypotheses.flatMap((entry) => [
    entry.hypothesis_id,
    ...(entry.supports ?? []),
    ...(entry.contradicts ?? []),
    ...(entry.supersedes ?? []),
  ]));
  return input.previousHypotheses
    .filter((entry) => !["contradicted", "superseded", "expired", "rejected"].includes(entry.status))
    .filter((entry) => !touched.has(entry.hypothesis_id))
    .filter((entry) => {
      const staleAfter = entry.stale_after_epoch_count ?? null;
      const epochExpired = staleAfter !== null && input.currentEpoch - entry.source_epoch >= staleAfter;
      const timeExpired = Date.parse(entry.expires_at) <= Date.parse(input.now);
      return epochExpired || timeExpired;
    })
    .map((entry) => updateLiveInterpretationHypothesis({
      ...entry,
      status: "expired",
      latest_source_epoch: input.currentEpoch,
      expired_at: input.now,
      validation_state: {
        ...(entry.validation_state ?? {}),
        expiry_reason: "not_reinforced_by_later_epoch",
      },
    }));
};

export function rejectForbiddenInterpretationWorkerOutput(input: {
  interpretationRun: import("@shared/helix-live-interpretation-run").HelixLiveInterpretationRun;
  workerRun: HelixLiveInterpretationWorkerRun;
  attemptedOutput: unknown;
  now?: string;
}): {
  worker_run: HelixLiveInterpretationWorkerRun;
  artifact: HelixLiveInterpretationValidationArtifact;
  validation: InterpretationWorkerOutputValidation;
} {
  const now = input.now ?? new Date().toISOString();
  const validation = validateInterpretationWorkerOutputPayload(input.attemptedOutput);
  const failed = recordLiveInterpretationWorkerRun({
    ...input.workerRun,
    status: "failed",
    completed_at: now,
    output_digest: digest(input.attemptedOutput),
    artifact_count: 1,
    hypothesis_count: 0,
    failure_reason: validation.failure_reasons.join(",") || "worker_output_rejected",
    error: validation.failure_reasons.join(",") || "worker_output_rejected",
  });
  const artifact = recordGateBlockArtifact({
    workerRun: failed,
    attemptedOutput: input.attemptedOutput,
    failureReasons: validation.failure_reasons,
    now,
  });
  updateLiveInterpretationGraph({
    interpretationRun: input.interpretationRun,
    workerRuns: [failed],
    artifacts: [artifact],
    hypotheses: [],
    now,
  });
  return { worker_run: failed, artifact, validation };
}

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
      interpretation_validation_artifacts: [],
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
      interpretation_validation_artifacts: [],
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
  const workers = registerLiveInterpretationWorkers({ interpretationRun, now });
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
  const artifacts: HelixLiveInterpretationValidationArtifact[] = [];
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
      worker_kind: worker.kind,
      situation_run_id: input.run.situation_run_id,
      interpretation_run_id: interpretationRun.interpretation_run_id,
      thread_id: input.run.thread_id,
      source_epoch: input.run.current_epoch,
      scene_epoch_id: input.observation.observation_id,
      trigger_observation_refs: [input.observation.observation_id],
      trigger_summary_refs: [input.observation.observation_id],
      status: "started",
      model_invoked: false,
      model_budget_used: worker.model_budget,
      reasoning_budget: {
        max_reasoning_steps: worker.max_reasoning_steps,
        max_artifacts_per_epoch: worker.max_artifacts_per_epoch,
        max_hypotheses_per_epoch: worker.max_hypotheses_per_epoch,
      },
      input_digest: digest({
        observation_id: input.observation.observation_id,
        text: input.observation.text,
        previous_hypothesis_count: previousHypotheses.length,
      }),
      output_digest: null,
      artifact_count: 0,
      hypothesis_count: 0,
      failure_reason: null,
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
    const candidateHypothesis = runInterpretationReasoning({
      interpretationRun,
      worker,
      workerRun: started,
      observation: input.observation,
      previousHypotheses,
      now,
    });
    const outputValidation = validateInterpretationWorkerOutputPayload(candidateHypothesis);
    if (!outputValidation.ok) {
      const rejected = rejectForbiddenInterpretationWorkerOutput({
        interpretationRun,
        workerRun: started,
        attemptedOutput: candidateHypothesis,
        now,
      });
      completedRuns.push(rejected.worker_run);
      artifacts.push(rejected.artifact);
      continue;
    }
    const hypothesis = recordLiveInterpretationHypothesis(candidateHypothesis);
    for (const contradictedId of hypothesis.contradicts ?? []) {
      const contradicted = previousHypotheses.find((entry) => entry.hypothesis_id === contradictedId);
      if (contradicted && contradicted.status !== "expired") {
        updateLiveInterpretationHypothesis({
          ...contradicted,
          status: "contradicted",
          latest_source_epoch: input.run.current_epoch,
          expired_at: null,
          validation_state: {
            ...(contradicted.validation_state ?? {}),
            contradicted_by_hypothesis_id: hypothesis.hypothesis_id,
          },
        });
      }
    }
    const artifact = recordValidationArtifactForHypothesis({ workerRun: started, hypothesis, now });
    artifacts.push(artifact);
    const completed = recordLiveInterpretationWorkerRun({
      ...started,
      status: "completed",
      completed_at: now,
      output_digest: digest(hypothesis),
      artifact_count: 1,
      hypothesis_count: 1,
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
    appendProcedureEpochLedgerItem({
      situation_run_id: input.run.situation_run_id,
      source_binding_id: input.run.source_binding_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      epoch: input.run.current_epoch,
      item_kind: "interpretation_validation_artifact",
      item_ref: artifact.validation_artifact_id,
      summary: `${artifact.artifact_type}: ${hypothesis.claim}`,
      causality_refs: [
        completed.interpretation_worker_run_id,
        hypothesis.hypothesis_id,
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
  const expiredHypotheses = expireStaleHypotheses({
    previousHypotheses,
    currentHypotheses: hypotheses,
    now,
    currentEpoch: input.run.current_epoch,
  });
  for (const expired of expiredHypotheses) {
    const syntheticWorkerRun = completedRuns.find((entry) => entry.worker_kind === "uncertainty") ?? completedRuns[0];
    if (!syntheticWorkerRun) continue;
    const artifact = recordValidationArtifactForHypothesis({
      workerRun: syntheticWorkerRun,
      hypothesis: expired,
      now,
    });
    artifacts.push(artifact);
    hypotheses.push(expired);
  }
  const graph = updateLiveInterpretationGraph({
    interpretationRun,
    hypotheses,
    workerRuns: completedRuns,
    artifacts,
    now,
  });
  return {
    interpretation_run: interpretationRun,
    interpretation_workers: workers,
    interpretation_worker_runs: completedRuns,
    interpretation_hypotheses: hypotheses,
    interpretation_validation_artifacts: artifacts,
    interpretation_graph: graph,
    interpretation_tangents: tangents,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
