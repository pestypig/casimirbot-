import crypto from "node:crypto";
import {
  HELIX_LIVE_SITUATION_PREDICTION_SCHEMA,
  type HelixLiveSituationPrediction,
  type HelixLiveSituationProbeType,
} from "@shared/helix-live-situation-prediction";
import {
  HELIX_LIVE_OBSERVATION_PROBE_SCHEMA,
  type HelixLiveObservationProbe,
} from "@shared/helix-live-observation-probe";
import {
  HELIX_LIVE_PROBE_RESULT_SCHEMA,
  type HelixLiveProbeResult,
  type HelixLiveProbeResultStatus,
} from "@shared/helix-live-probe-result";
import {
  HELIX_LIVE_CONFIDENCE_UPDATE_SCHEMA,
  type HelixLiveConfidenceUpdate,
} from "@shared/helix-live-confidence-update";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { recordLiveSituationPrediction, listLiveSituationPredictions, updateLiveSituationPredictionStatus } from "./live-situation-prediction-store";
import { recordLiveObservationProbe, listLiveObservationProbes, updateLiveObservationProbeStatus } from "./live-observation-probe-store";
import { recordLiveProbeResult } from "./live-probe-result-store";
import { recordLiveConfidenceUpdate } from "./live-confidence-update-store";
import { recordLiveTangentEvaluation } from "./live-tangent-evaluation-store";
import { HELIX_LIVE_TANGENT_EVALUATION_SCHEMA } from "@shared/helix-live-tangent-evaluation";
import { recordLiveArbitrationCandidate } from "./live-arbitration-candidate-store";
import { HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA } from "@shared/helix-live-arbitration-candidate";
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();
const clamp = (value: number): number => Math.max(0, Math.min(1, value));

type ProbeComparison = {
  status: HelixLiveProbeResultStatus;
  observedSignals: string[];
  confidenceDelta: number;
  reason: string;
  contradiction: boolean;
};

const signalsForText = (text: string): string[] => {
  const normalized = lower(text);
  const signals: string[] = [];
  if (/\bselection|selected|highlighted|chosen|clicked\b/.test(normalized)) signals.push("selection_changed");
  if (/\bopened|open document|document opened|opened document|viewer\b/.test(normalized)) signals.push("opened_document");
  if (/\bfolder path|folder path changes?|navigated|different folder|new folder|directory changed|path changed\b/.test(normalized)) signals.push("folder_path_changed");
  if (/\bsame folder|same file explorer|stable|still showing|remains|unchanged|list remains|files remain|folder remains\b/.test(normalized)) signals.push("file_list_stable");
  if (/\bwindow changes?|window changed|different app|browser|terminal|editor|replaced the expected view|instead of the folder view\b/.test(normalized)) signals.push("window_changed");
  if (signals.length === 0 && /\bfile explorer|folder|files?\b/.test(normalized)) signals.push("file_list_stable");
  return Array.from(new Set(signals));
};

const expectedSignalsFor = (evaluation: HelixLiveFieldEvaluation): string[] => {
  const fromNextCheck = signalsForText(evaluation.next_check);
  const fromEvaluationValue = signalsForText(evaluation.value);
  const combined = Array.from(new Set([...fromNextCheck, ...fromEvaluationValue]));
  if (combined.length > 0) return combined;
  return ["file_list_stable"];
};

const probeTypeFor = (evaluation: HelixLiveFieldEvaluation): HelixLiveSituationProbeType => {
  const text = lower(evaluation.next_check);
  if (/\bcompare\b/.test(text)) return "compare_recent_frames";
  if (/\buser|permission|input\b/.test(text)) return "request_user_input";
  return "passive_next_frame";
};

function classifyProbeAgainstObservation(input: {
  probe: HelixLiveObservationProbe;
  prediction: HelixLiveSituationPrediction;
  observation: HelixObservationJournalEntry;
  now: string;
}): ProbeComparison {
  const observedSignals = signalsForText(input.observation.text);
  if (Date.parse(input.probe.expires_at) <= Date.parse(input.now)) {
    return {
      status: "expired",
      observedSignals,
      confidenceDelta: -0.04,
      reason: `Probe expired for ${input.prediction.field_key}.`,
      contradiction: false,
    };
  }
  const expectedSignals = input.probe.expected_observation_signals;
  const matches = observedSignals.filter((signal: string) => expectedSignals.includes(signal));
  const expectedContinuity = expectedSignals.includes("file_list_stable");
  const observedChangedWindow = observedSignals.includes("window_changed");
  const strongIncompatibleSignal = expectedContinuity && observedChangedWindow;
  if (strongIncompatibleSignal) {
    return {
      status: "contradicted",
      observedSignals,
      confidenceDelta: -0.18,
      reason: `Probe contradicted for ${input.prediction.field_key}.`,
      contradiction: true,
    };
  }
  if (matches.length > 0) {
    return {
      status: "satisfied",
      observedSignals,
      confidenceDelta: 0.08,
      reason: `Probe satisfied for ${input.prediction.field_key}.`,
      contradiction: false,
    };
  }
  return {
    status: "inconclusive",
    observedSignals,
    confidenceDelta: 0,
    reason: `Probe inconclusive for ${input.prediction.field_key}.`,
    contradiction: false,
  };
}

export function createPredictionsForFieldEvaluations(input: {
  run: HelixLiveSituationRun;
  evaluations: HelixLiveFieldEvaluation[];
  now?: string;
}): {
  predictions: HelixLiveSituationPrediction[];
  probes: HelixLiveObservationProbe[];
} {
  const now = input.now ?? new Date().toISOString();
  const predictions: HelixLiveSituationPrediction[] = [];
  const probes: HelixLiveObservationProbe[] = [];
  for (const evaluation of input.evaluations) {
    if (!evaluation.next_check || evaluation.status === "blocked" || evaluation.status === "expired") continue;
    const expected = expectedSignalsFor(evaluation);
    const prediction = recordLiveSituationPrediction({
      schema: HELIX_LIVE_SITUATION_PREDICTION_SCHEMA,
      prediction_id: `live_prediction:${hashShort([
        input.run.situation_run_id,
        input.run.current_epoch,
        evaluation.evaluation_id,
        evaluation.next_check,
      ])}`,
      situation_run_id: input.run.situation_run_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      source_binding_id: input.run.source_binding_id,
      source_epoch: input.run.current_epoch,
      field_key: evaluation.field_key,
      based_on_evaluation_refs: [evaluation.evaluation_id],
      claim: evaluation.next_check,
      expected_observation_signals: expected,
      probe_type: probeTypeFor(evaluation),
      confidence: evaluation.confidence,
      status: "active",
      expires_at: new Date(Date.parse(now) + 60_000).toISOString(),
      created_at: now,
      assistant_answer: false,
      raw_content_included: false,
      role: "validation",
    });
    const probe = recordLiveObservationProbe({
      schema: HELIX_LIVE_OBSERVATION_PROBE_SCHEMA,
      probe_id: `live_probe:${hashShort([prediction.prediction_id, prediction.probe_type])}`,
      prediction_id: prediction.prediction_id,
      situation_run_id: prediction.situation_run_id,
      thread_id: prediction.thread_id,
      environment_id: prediction.environment_id,
      source_binding_id: prediction.source_binding_id,
      source_epoch: prediction.source_epoch,
      probe_type: prediction.probe_type,
      expected_observation_signals: prediction.expected_observation_signals,
      status: "waiting_for_observation",
      expires_at: prediction.expires_at,
      created_at: now,
      assistant_answer: false,
      raw_content_included: false,
      role: "validation",
    });
    predictions.push(prediction);
    probes.push(probe);
  }
  return { predictions, probes };
}

export function runObservationProbesForObservation(input: {
  run: HelixLiveSituationRun;
  observation: HelixObservationJournalEntry;
  now?: string;
}): {
  probe_results: HelixLiveProbeResult[];
  confidence_updates: HelixLiveConfidenceUpdate[];
  spawned_tangent_refs: string[];
  spawned_candidate_refs: string[];
} {
  const now = input.now ?? new Date().toISOString();
  const pending = listLiveObservationProbes({
    threadId: input.run.thread_id,
    situationRunId: input.run.situation_run_id,
    status: "waiting_for_observation",
    includeExpired: true,
    limit: 200,
  }).filter((probe: HelixLiveObservationProbe) => probe.source_epoch < input.run.current_epoch);
  const predictions = listLiveSituationPredictions({
    threadId: input.run.thread_id,
    situationRunId: input.run.situation_run_id,
    status: "active",
    includeExpired: true,
    limit: 400,
  });
  const results: HelixLiveProbeResult[] = [];
  const updates: HelixLiveConfidenceUpdate[] = [];
  const spawnedTangentRefs: string[] = [];
  const spawnedCandidateRefs: string[] = [];
  for (const probe of pending) {
    const prediction = predictions.find((entry: HelixLiveSituationPrediction) => entry.prediction_id === probe.prediction_id);
    if (!prediction) continue;
    const sourceBindingMismatch =
      probe.source_binding_id !== input.run.source_binding_id ||
      Boolean(input.observation.source_binding_id && input.observation.source_binding_id !== probe.source_binding_id);
    const comparison: ProbeComparison = sourceBindingMismatch
      ? {
          status: "blocked",
          observedSignals: signalsForText(input.observation.text),
          confidenceDelta: 0,
          reason: `Probe blocked for ${prediction.field_key}: source binding mismatch.`,
          contradiction: false,
        }
      : classifyProbeAgainstObservation({
          probe,
          prediction,
          observation: input.observation,
          now,
        });
    const tangentRefs: string[] = [];
    const candidateRefs: string[] = [];
    if (comparison.contradiction) {
      const tangent = recordLiveTangentEvaluation({
        schema: HELIX_LIVE_TANGENT_EVALUATION_SCHEMA,
        tangent_id: `live_tangent:${hashShort([prediction.prediction_id, input.observation.observation_id, "contradiction"])}`,
        situation_run_id: input.run.situation_run_id,
        thread_id: input.run.thread_id,
        tangent_type: "contradiction_tangent",
        trigger_observation_refs: [input.observation.observation_id],
        claim: `Prediction contradicted by latest observation: ${prediction.claim}`,
        confidence: 0.72,
        evidence_refs: [input.observation.observation_id, ...prediction.based_on_evaluation_refs],
        missing_evidence: [],
        supports: [],
        contradicts: [prediction.prediction_id],
        recommended_handoff: {
          type: "ask_handoff",
          reason: "A prior live prediction was contradicted by the latest visual observation.",
        },
        assistant_answer: false,
        raw_content_included: false,
        role: "validation",
        expires_at: new Date(Date.parse(now) + 45_000).toISOString(),
      });
      const candidate = recordLiveArbitrationCandidate({
        schema: HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA,
        candidate_id: `live_arbitration_candidate:${hashShort([tangent.tangent_id, "contradiction"])}`,
        situation_run_id: input.run.situation_run_id,
        thread_id: input.run.thread_id,
        environment_id: input.run.environment_id,
        source_binding_id: input.run.source_binding_id,
        epoch: input.run.current_epoch,
        candidate_type: "ask_handoff_candidate",
        reason: "Contradicted live prediction may warrant user-facing explanation.",
        priority: "notice",
        evidence_refs: [input.observation.observation_id],
        field_evaluation_refs: prediction.based_on_evaluation_refs,
        tangent_refs: [tangent.tangent_id],
        proposed_output: {
          handoff_type: "helix_ask_reasoning",
          question: "A prior live prediction was contradicted. Explain what changed using selected evidence.",
        },
        status: "pending",
        expires_at: new Date(Date.parse(now) + 45_000).toISOString(),
        assistant_answer: false,
        raw_content_included: false,
      });
      tangentRefs.push(tangent.tangent_id);
      candidateRefs.push(candidate.candidate_id);
      appendProcedureEpochLedgerItem({
        situation_run_id: input.run.situation_run_id,
        source_binding_id: input.run.source_binding_id,
        thread_id: input.run.thread_id,
        environment_id: input.run.environment_id,
        epoch: input.run.current_epoch,
        item_kind: "tangent",
        item_ref: tangent.tangent_id,
        summary: tangent.claim,
        causality_refs: tangent.evidence_refs,
        created_at: now,
      });
      appendProcedureEpochLedgerItem({
        situation_run_id: input.run.situation_run_id,
        source_binding_id: input.run.source_binding_id,
        thread_id: input.run.thread_id,
        environment_id: input.run.environment_id,
        epoch: input.run.current_epoch,
        item_kind: "arbitration_candidate",
        item_ref: candidate.candidate_id,
        summary: candidate.reason,
        causality_refs: [
          ...candidate.evidence_refs,
          ...candidate.field_evaluation_refs,
          ...candidate.tangent_refs,
        ],
        created_at: now,
      });
    }
    const result = recordLiveProbeResult({
      schema: HELIX_LIVE_PROBE_RESULT_SCHEMA,
      probe_result_id: `live_probe_result:${hashShort([probe.probe_id, input.observation.observation_id, comparison.status])}`,
      prediction_id: prediction.prediction_id,
      probe_id: probe.probe_id,
      situation_run_id: input.run.situation_run_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      source_binding_id: probe.source_binding_id,
      tested_at_epoch: input.run.current_epoch,
      status: comparison.status,
      observed_signals: comparison.observedSignals,
      evidence_refs: [input.observation.observation_id],
      confidence_delta: comparison.confidenceDelta,
      spawned_tangent_refs: tangentRefs,
      spawned_candidate_refs: candidateRefs,
      assistant_answer: false,
      raw_content_included: false,
      role: "validation",
      created_at: now,
    });
    const update = recordLiveConfidenceUpdate({
      schema: HELIX_LIVE_CONFIDENCE_UPDATE_SCHEMA,
      confidence_update_id: `live_confidence_update:${hashShort([result.probe_result_id, comparison.confidenceDelta])}`,
      situation_run_id: input.run.situation_run_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      field_key: prediction.field_key,
      prediction_id: prediction.prediction_id,
      probe_result_id: result.probe_result_id,
      prior_confidence: prediction.confidence,
      confidence_delta: comparison.confidenceDelta,
      updated_confidence: clamp(prediction.confidence + comparison.confidenceDelta),
      reason: comparison.reason,
      evidence_refs: result.evidence_refs,
      assistant_answer: false,
      raw_content_included: false,
      role: "validation",
      created_at: now,
    });
    appendProcedureEpochLedgerItem({
      situation_run_id: input.run.situation_run_id,
      source_binding_id: input.run.source_binding_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      epoch: input.run.current_epoch,
      item_kind: "probe_result",
      item_ref: result.probe_result_id,
      summary: `Probe ${comparison.status}; observed ${comparison.observedSignals.join(", ") || "no matching signal"}.`,
      causality_refs: [
        probe.probe_id,
        prediction.prediction_id,
        input.observation.observation_id,
        ...tangentRefs,
        ...candidateRefs,
      ],
      created_at: result.created_at,
    });
    appendProcedureEpochLedgerItem({
      situation_run_id: input.run.situation_run_id,
      source_binding_id: input.run.source_binding_id,
      thread_id: input.run.thread_id,
      environment_id: input.run.environment_id,
      epoch: input.run.current_epoch,
      item_kind: "confidence_update",
      item_ref: update.confidence_update_id,
      summary: update.reason,
      causality_refs: [result.probe_result_id, prediction.prediction_id, ...update.evidence_refs],
      created_at: update.created_at,
    });
    updateLiveObservationProbeStatus(
      probe.probe_id,
      comparison.status === "blocked"
        ? "blocked_unbound"
        : comparison.status === "expired"
          ? "expired"
          : "completed",
    );
    updateLiveSituationPredictionStatus(
      prediction.prediction_id,
      comparison.status === "blocked" ? "inconclusive" : comparison.status,
    );
    results.push(result);
    updates.push(update);
    spawnedTangentRefs.push(...tangentRefs);
    spawnedCandidateRefs.push(...candidateRefs);
  }
  return {
    probe_results: results,
    confidence_updates: updates,
    spawned_tangent_refs: spawnedTangentRefs,
    spawned_candidate_refs: spawnedCandidateRefs,
  };
}
