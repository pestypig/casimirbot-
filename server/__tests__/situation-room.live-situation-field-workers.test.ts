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
import { resetLiveFieldEvaluationsForTest } from "../services/situation-room/live-field-evaluation-store";
import { resetLiveFieldWorkerRunsForTest } from "../services/situation-room/live-field-worker-run-store";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";
import { resetLiveSituationRunsForTest } from "../services/situation-room/live-situation-run-store";
import { resetLiveTangentEvaluationsForTest } from "../services/situation-room/live-tangent-evaluation-store";
import { resetObservationJournalForTest } from "../services/situation-room/observation-journal-store";
import { projectPresentStateCard } from "../services/situation-room/present-state-card-projector";
import { routeLiveSourceAnalysisOutput } from "../services/situation-room/live-source-analysis-output-router";

const threadId = "helix-ask:desktop";

const visualChunk = (): HelixLiveSourceChunk => ({
  schema: "helix.live_source_chunk.v1",
  chunk_id: "live_source_chunk:field-workers",
  source_id: "source:documents",
  thread_id: threadId,
  environment_id: "live_answer:field-workers",
  modality: "visual_frame",
  sequence_index: 1,
  ts: "2026-05-17T21:30:00.000Z",
  payload_ref: "visual_frame:field-workers",
  compact_summary: "File Explorer shows a PAPERPLAY folder with image files and toolbar controls.",
  evidence_refs: [],
  raw_content_included: false,
  assistant_answer: false,
  context_policy: "compact_context_pack_only",
});

const jobFor = (chunk: HelixLiveSourceChunk): HelixLiveSourceAnalysisJob => ({
  schema: "helix.live_source_analysis_job.v1",
  job_id: "live_source_analysis_job:field-workers",
  chunk_id: chunk.chunk_id,
  worker_id: "worker:visual",
  thread_id: threadId,
  source_id: chunk.source_id,
  analyzer_id: "visual_frame_analyzer",
  status: "completed",
  output_refs: ["visual_evidence:field-workers"],
  summary: chunk.compact_summary,
  assistant_answer: false,
  raw_content_included: false,
});

describe("live situation field workers", () => {
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
  });

  it("creates a generic visual SituationRun, workers, and tentative Activity evaluation", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:field-workers",
      objective: "Using the latest visual observation, describe my current screen as a generic workstation live answer.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    const chunk = visualChunk();
    const routed = routeLiveSourceAnalysisOutput({
      job: jobFor(chunk),
      chunk,
      status: "completed",
      summary: chunk.compact_summary,
      outputRefs: ["visual_evidence:field-workers"],
      modelInvoked: true,
    });

    expect(routed.live_situation_run).toMatchObject({
      modality_scope: "generic_visual",
      status: "active",
      assistant_answer: false,
      source_binding_id: expect.stringMatching(/^source_binding:/),
      current_epoch: 1,
    });
    expect(routed.live_situation_run?.terminal_policy).toMatchObject({
      worker_outputs_are_terminal: false,
      tangent_outputs_are_terminal: false,
      terminal_authority_required: true,
    });
    expect(routed.live_situation_run?.corroboration_policy).toMatchObject({
      audio_required: false,
      user_steering_required: false,
      missing_corroboration_effect: "lower_confidence_not_block",
    });
    expect(routed.live_field_workers.length).toBeGreaterThanOrEqual(6);
    expect(routed.live_field_workers.every((worker) => worker.may_execute_tool === false && worker.assistant_answer === false)).toBe(true);
    expect(routed.live_field_worker_runs.length).toBe(routed.live_field_workers.length);
    expect(routed.live_field_worker_runs.every((run) => run.status === "completed" && run.assistant_answer === false)).toBe(true);
    const activity = routed.live_field_evaluations.find((entry) => entry.field_key === "activity");
    expect(activity).toMatchObject({
      status: "tentative",
      assistant_answer: false,
      raw_content_included: false,
      worker_run_id: expect.stringMatching(/^live_field_worker_run:/),
    });
    expect(activity?.value).toMatch(/browsing|reviewing|organizing/i);
    expect(activity?.missing_evidence.join(" ")).toMatch(/audio\/user steering/i);
    expect(activity?.corroboration_state.audio_transcript).toBe("missing_not_required");
    expect(routed.live_handoff_arbitration?.arbitration.decision).toBe("silent_update");
    expect(routed.live_handoff_arbitration?.arbitration.candidate?.type).toBe("none");
  });

  it("uses field evaluations before fallback in canonical projection", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:field-workers",
      objective: "Using the latest visual observation, describe my current screen as a generic workstation live answer.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    const chunk = visualChunk();
    routeLiveSourceAnalysisOutput({
      job: jobFor(chunk),
      chunk,
      status: "completed",
      summary: chunk.compact_summary,
      outputRefs: ["visual_evidence:field-workers"],
      modelInvoked: true,
    });
    const card = projectPresentStateCard({ threadId });
    const activityProjection = card.live_card_line_projection?.lines.find((line) => line.key === "activity");
    expect(activityProjection?.reasoner_id).toMatch(/^live_field_eval:/);
    expect(activityProjection?.value).toMatch(/browsing|reviewing|organizing/i);
    expect(JSON.stringify(card)).not.toContain("Waiting for visual activity evidence");
    expect(JSON.stringify(card)).not.toContain("No visual/event pair was available to align");
  });

  it("does not attach field evaluations from an unbound source", () => {
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "ask:field-workers",
      objective: "Using the latest visual observation, describe my current screen as a generic workstation live answer.",
      preset: "custom",
      source_ids: ["source:documents"],
    });
    const chunk = {
      ...visualChunk(),
      chunk_id: "live_source_chunk:unbound",
      source_id: "source:other-window",
    };
    const routed = routeLiveSourceAnalysisOutput({
      job: jobFor(chunk),
      chunk,
      status: "completed",
      summary: chunk.compact_summary,
      outputRefs: ["visual_evidence:unbound"],
      modelInvoked: true,
    });
    expect(routed.live_situation_run?.source_binding_id).toMatch(/^source_binding:/);
    expect(routed.live_field_workers).toEqual([]);
    expect(routed.live_field_worker_runs).toEqual([]);
    expect(routed.live_field_evaluations).toEqual([]);
  });
});
