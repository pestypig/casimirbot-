import { beforeEach, describe, expect, it } from "vitest";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import { resetAskHandoffsForTest } from "../services/helix-ask/ask-handoff-router";
import { resetGoalCardsForTest } from "../services/situation-room/goal-finder-store";
import { resetInterpretationCardsForTest } from "../services/situation-room/interpretation-card-store";
import { resetLiveArbitrationCandidatesForTest, listLiveArbitrationCandidates } from "../services/situation-room/live-arbitration-candidate-store";
import { resetLiveConfidenceUpdatesForTest, listLiveConfidenceUpdates } from "../services/situation-room/live-confidence-update-store";
import { resetLiveFieldEvaluationsForTest } from "../services/situation-room/live-field-evaluation-store";
import { resetLiveFieldWorkerRunsForTest } from "../services/situation-room/live-field-worker-run-store";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";
import { resetLiveObservationProbesForTest, listLiveObservationProbes } from "../services/situation-room/live-observation-probe-store";
import { resetLiveProcedureEpochsForTest, listLiveProcedureEpochs } from "../services/situation-room/live-procedure-epoch-store";
import { resetLiveProbeResultsForTest, listLiveProbeResults } from "../services/situation-room/live-probe-result-store";
import { resetLiveSituationPredictionsForTest, listLiveSituationPredictions } from "../services/situation-room/live-situation-prediction-store";
import { resetLiveSituationRunsForTest } from "../services/situation-room/live-situation-run-store";
import { resetLiveTangentEvaluationsForTest, listLiveTangentEvaluations } from "../services/situation-room/live-tangent-evaluation-store";
import { resetObservationJournalForTest } from "../services/situation-room/observation-journal-store";
import { routeLiveSourceAnalysisOutput } from "../services/situation-room/live-source-analysis-output-router";

const threadId = "helix-ask:desktop";

const visualChunk = (index: number, summary: string): HelixLiveSourceChunk => ({
  schema: "helix.live_source_chunk.v1",
  chunk_id: `live_source_chunk:probe:${index}`,
  source_id: "source:documents",
  thread_id: threadId,
  environment_id: "live_answer:probe",
  modality: "visual_frame",
  sequence_index: index,
  ts: `2026-05-17T22:10:${String(index).padStart(2, "0")}.000Z`,
  payload_ref: `visual_frame:probe:${index}`,
  compact_summary: summary,
  evidence_refs: [],
  raw_content_included: false,
  assistant_answer: false,
  context_policy: "compact_context_pack_only",
});

const jobFor = (chunk: HelixLiveSourceChunk): HelixLiveSourceAnalysisJob => ({
  schema: "helix.live_source_analysis_job.v1",
  job_id: `live_source_analysis_job:${chunk.sequence_index}`,
  chunk_id: chunk.chunk_id,
  worker_id: "worker:visual",
  thread_id: chunk.thread_id,
  source_id: chunk.source_id,
  analyzer_id: "visual_frame_analyzer",
  status: "completed",
  output_refs: [`visual_evidence:probe:${chunk.sequence_index}`],
  summary: chunk.compact_summary,
  assistant_answer: false,
  raw_content_included: false,
});

const routeSummary = (index: number, summary: string) => {
  const chunk = visualChunk(index, summary);
  return routeLiveSourceAnalysisOutput({
    job: jobFor(chunk),
    chunk,
    status: "completed",
    summary,
    outputRefs: [`visual_evidence:probe:${index}`],
    modelInvoked: true,
  });
};

describe("live situation prediction probe loop", () => {
  beforeEach(() => {
    resetLiveAnswerEnvironments();
    resetObservationJournalForTest();
    resetInterpretationCardsForTest();
    resetGoalCardsForTest();
    resetAskHandoffsForTest();
    resetLiveSituationRunsForTest();
    resetLiveFieldWorkersForTest();
    resetLiveFieldWorkerRunsForTest();
    resetLiveFieldEvaluationsForTest();
    resetLiveTangentEvaluationsForTest();
    resetLiveArbitrationCandidatesForTest();
    resetLiveSituationPredictionsForTest();
    resetLiveObservationProbesForTest();
    resetLiveProbeResultsForTest();
    resetLiveConfidenceUpdatesForTest();
    resetLiveProcedureEpochsForTest();
  });

  it("turns field next_check into predictions and passive probes", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:probe",
      objective: "Keep interpreting this generic visual workstation screen.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    const routed = routeSummary(1, "File Explorer shows a PAPERPLAY folder with image files and toolbar controls.");
    expect(routed.live_situation_predictions.length).toBeGreaterThan(0);
    expect(routed.live_observation_probes.length).toBeGreaterThan(0);
    expect(routed.live_situation_predictions.every((entry) => entry.assistant_answer === false && entry.role === "validation")).toBe(true);
    expect(listLiveSituationPredictions({ threadId })).not.toHaveLength(0);
    expect(listLiveObservationProbes({ threadId }).some((entry) => entry.status === "waiting_for_observation")).toBe(true);
  });

  it("tests previous predictions against the next bound observation", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:probe",
      objective: "Keep interpreting this generic visual workstation screen.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    routeSummary(1, "File Explorer shows a PAPERPLAY folder with image files and toolbar controls.");
    const second = routeSummary(2, "The same File Explorer folder remains visible and one image file is selected.");
    expect(second.live_probe_results.some((entry) => entry.status === "satisfied")).toBe(true);
    expect(second.live_confidence_updates.some((entry) => entry.confidence_delta > 0)).toBe(true);
    expect(listLiveProbeResults({ threadId }).some((entry) => entry.observed_signals.includes("selection_changed"))).toBe(true);
    expect(listLiveProcedureEpochs({ threadId }).at(-1)?.epoch).toBe(2);
  });

  it("spawns tangent and arbitration candidate for contradicted predictions without executing tools", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:probe",
      objective: "Keep interpreting this generic visual workstation screen.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    routeSummary(1, "File Explorer shows a PAPERPLAY folder with image files and toolbar controls.");
    const second = routeSummary(2, "A different app window changed to a browser tab instead of the folder view.");
    expect(second.live_probe_results.some((entry) => entry.status === "contradicted")).toBe(true);
    expect(listLiveTangentEvaluations({ threadId }).some((entry) => entry.tangent_type === "contradiction_tangent")).toBe(true);
    const candidates = listLiveArbitrationCandidates({ threadId, includeExpired: true });
    expect(candidates.some((entry) => entry.candidate_type === "ask_handoff_candidate" && entry.assistant_answer === false)).toBe(true);
  });
});

