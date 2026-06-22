import crypto from "node:crypto";
import { createLiveAnswerEnvironment } from "./live-answer-environment-store";
import { ensureLiveSituationRunForEnvironment } from "./live-situation-run-store";
import { appendObservationJournalEntry } from "./observation-journal-store";
import { recordLiveFieldEvaluation } from "./live-field-evaluation-store";
import { appendInterpretationCard } from "./interpretation-card-store";
import { recordProcedureEpochClosure } from "./procedure-epoch-closure";
import { appendLiveSourceChunk, queueLiveSourceAnalysisJob } from "./live-source-chunk-buffer";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const cleanNumber = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

export type BackendLiveVisualSourceSeedReceipt = {
  schema: "helix.backend_live_visual_source_seed_receipt.v1";
  ok: true;
  thread_id: string;
  source_id: string;
  environment_id: string;
  situation_run_id: string;
  source_binding_id: string;
  chunk_id: string;
  analysis_job_id: string;
  observation_ref: string;
  field_evaluation_refs: string[];
  interpretation_refs?: string[];
  epoch_closure_ref: string;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

export type BackendLiveVisualSourceSwitchReceipt = {
  schema: "helix.backend_live_visual_source_switch_receipt.v1";
  ok: true;
  thread_id: string;
  bound_seed: BackendLiveVisualSourceSeedReceipt;
  unbound_source_id: string;
  unbound_chunk_id: string;
  unbound_analysis_job_id: string;
  unbound_observation_ref: string;
  expected_repair: "explicit_visual_capture_prompt_should_diagnose_unbound_source";
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

export function seedBackendLiveVisualSourceForAskTest(body: Record<string, unknown> = {}): BackendLiveVisualSourceSeedReceipt {
  const now = cleanString(body.now) ?? new Date().toISOString();
  const threadId = cleanString(body.thread_id) ?? cleanString(body.sessionId) ?? "helix-ask:desktop";
  const sourceId = cleanString(body.source_id) ?? "visual_source:ask-test-harness";
  const turnId = cleanString(body.turn_id) ?? `ask:test-harness:${hashShort([threadId, sourceId, now], 10)}`;
  const sceneText =
    cleanString(body.scene_text) ??
    cleanString(body.text) ??
    "A backend-seeded visual capture frame shows a workstation screen with a file or app window visible.";
  const activity =
    cleanString(body.activity) ??
    "Reviewing or navigating the visible workstation screen.";
  const objects =
    cleanString(body.objects) ??
    "Visible workstation window, screen content, and UI controls.";
  const confidence = cleanNumber(body.confidence) ?? 0.72;

  const chunkResult = appendLiveSourceChunk({
    source_id: sourceId,
    thread_id: threadId,
    modality: "visual_frame",
    ts: now,
    compact_summary: sceneText,
    payload_ref: cleanString(body.payload_ref) ?? `backend_visual_seed:${hashShort([sourceId, now], 12)}`,
    evidence_refs: ["backend_live_visual_source_seed"],
    capture_mode: "manual",
    raw_content_policy: "ephemeral",
  });
  const analysisJob = queueLiveSourceAnalysisJob({
    chunk: chunkResult.chunk,
    analyzerId: "backend_visual_test_harness",
    status: "completed",
    outputRefs: ["backend_live_visual_source_seed"],
    summary: "Backend visual test harness supplied compact visual evidence.",
  });
  const { environment } = createLiveAnswerEnvironment({
    thread_id: threadId,
    created_turn_id: turnId,
    objective: cleanString(body.objective) ?? "Use backend-seeded visual capture evidence to answer current-screen Ask turns.",
    preset: "custom",
    source_ids: [sourceId],
    now,
  });
  const run = ensureLiveSituationRunForEnvironment({
    environment,
    advanceEpoch: false,
    now,
  });
  const observation = appendObservationJournalEntry({
    thread_id: threadId,
    observation_id: `observation:backend-visual-seed:${hashShort([threadId, sourceId, now], 12)}`,
    kind: "model_perception_observation",
    modality: "visual_frame",
    source_id: sourceId,
    source_binding_id: run.source_binding_id,
    text: sceneText,
    evidence_refs: [chunkResult.chunk.chunk_id, analysisJob.job_id, "backend_live_visual_source_seed"],
    model_invoked: true,
    confidence,
    created_at: now,
    assistant_answer: false,
    raw_content_included: false,
  });
  const boundRun = ensureLiveSituationRunForEnvironment({
    environment,
    observation,
    advanceEpoch: true,
    now,
  });
  const activityEval = recordLiveFieldEvaluation({
    schema: "helix.live_field_evaluation.v1",
    evaluation_id: `field_eval:backend-visual-activity:${hashShort([threadId, sourceId, now], 10)}`,
    worker_run_id: `field_worker_run:backend-visual-activity:${hashShort([threadId, sourceId, now], 10)}`,
    worker_id: "field_worker:backend_visual_activity",
    situation_run_id: boundRun.situation_run_id,
    thread_id: boundRun.thread_id,
    environment_id: boundRun.environment_id,
    field_key: "activity",
    value: activity,
    status: "supported",
    confidence: Math.max(0.1, Math.min(0.95, confidence - 0.06)),
    evidence_refs: [observation.observation_id],
    missing_evidence: [],
    corroboration_state: { visual: "present", source: "backend_test_harness" },
    next_check: "Run a top-level Ask turn and verify it selects this visual procedure evidence.",
    expires_at: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    created_at: now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
  const objectsEval = recordLiveFieldEvaluation({
    schema: "helix.live_field_evaluation.v1",
    evaluation_id: `field_eval:backend-visual-objects:${hashShort([threadId, sourceId, now], 10)}`,
    worker_run_id: `field_worker_run:backend-visual-objects:${hashShort([threadId, sourceId, now], 10)}`,
    worker_id: "field_worker:backend_visual_objects",
    situation_run_id: boundRun.situation_run_id,
    thread_id: boundRun.thread_id,
    environment_id: boundRun.environment_id,
    field_key: "objects",
    value: objects,
    status: "supported",
    confidence,
    evidence_refs: [observation.observation_id],
    missing_evidence: [],
    corroboration_state: { visual: "present", source: "backend_test_harness" },
    next_check: "Compare the next seeded or captured visual frame.",
    expires_at: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    created_at: now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
  const interpretation = appendInterpretationCard({
    thread_id: threadId,
    title: "Current visual capture",
    summary: `${activity} ${objects}`,
    evidence_refs: [observation.observation_id, activityEval.evaluation_id, objectsEval.evaluation_id],
    confidence,
    expires_at: new Date(Date.parse(now) + 60 * 60 * 1000).toISOString(),
    created_at: now,
  });
  const closure = recordProcedureEpochClosure({
    situation_run_id: boundRun.situation_run_id,
    thread_id: boundRun.thread_id,
    environment_id: boundRun.environment_id,
    source_binding_id: boundRun.source_binding_id,
    epoch: boundRun.current_epoch,
    status: "silent_update",
    card_updated: false,
    confidence_changes: [activityEval.evaluation_id, objectsEval.evaluation_id],
    created_at: now,
  });

  return {
    schema: "helix.backend_live_visual_source_seed_receipt.v1",
    ok: true,
    thread_id: threadId,
    source_id: sourceId,
    environment_id: boundRun.environment_id,
    situation_run_id: boundRun.situation_run_id,
    source_binding_id: boundRun.source_binding_id,
    chunk_id: chunkResult.chunk.chunk_id,
    analysis_job_id: analysisJob.job_id,
    observation_ref: observation.observation_id,
    field_evaluation_refs: [activityEval.evaluation_id, objectsEval.evaluation_id],
    interpretation_refs: [interpretation.interpretation_id],
    epoch_closure_ref: closure.closure_id,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function seedBackendLiveVisualSourceSwitchForAskTest(body: Record<string, unknown> = {}): BackendLiveVisualSourceSwitchReceipt {
  const now = cleanString(body.now) ?? new Date().toISOString();
  const boundNow = cleanString(body.bound_now) ?? new Date(Date.parse(now) - 180_000).toISOString();
  const threadId = cleanString(body.thread_id) ?? cleanString(body.sessionId) ?? "helix-ask:desktop";
  const boundSourceId = cleanString(body.bound_source_id) ?? "visual_source:top-debug-bound-seed";
  const unboundSourceId = cleanString(body.unbound_source_id) ?? cleanString(body.source_id) ?? "visual_source:top-debug-fresh-chrome";
  const boundSeed = seedBackendLiveVisualSourceForAskTest({
    ...body,
    thread_id: threadId,
    source_id: boundSourceId,
    now: boundNow,
    scene_text:
      cleanString(body.bound_scene_text) ??
      "A backend-seeded visual capture shows File Explorer open to a research folder.",
    activity: cleanString(body.bound_activity) ?? "Reviewing a research folder in File Explorer.",
    objects: cleanString(body.bound_objects) ?? "File Explorer window, research folder, visible file list.",
  });
  const freshSceneText =
    cleanString(body.unbound_scene_text) ??
    cleanString(body.scene_text) ??
    "A fresh Chrome visual capture frame shows the Helix Ask UI with live worker-lane debug output.";
  const chunkResult = appendLiveSourceChunk({
    source_id: unboundSourceId,
    thread_id: threadId,
    modality: "visual_frame",
    ts: now,
    compact_summary: freshSceneText,
    payload_ref: cleanString(body.unbound_payload_ref) ?? `backend_visual_switch:${hashShort([unboundSourceId, now], 12)}`,
    evidence_refs: ["backend_live_visual_source_switch"],
    capture_mode: "manual",
    raw_content_policy: "ephemeral",
  });
  const analysisJob = queueLiveSourceAnalysisJob({
    chunk: chunkResult.chunk,
    analyzerId: "backend_visual_switch_test_harness",
    status: "completed",
    outputRefs: ["backend_live_visual_source_switch"],
    summary: "Backend harness supplied a fresh unbound visual source to simulate a Chrome capture identity change.",
  });
  const observation = appendObservationJournalEntry({
    thread_id: threadId,
    observation_id: `observation:backend-visual-switch:${hashShort([threadId, unboundSourceId, now], 12)}`,
    kind: "model_perception_observation",
    modality: "visual_frame",
    source_id: unboundSourceId,
    text: freshSceneText,
    evidence_refs: [chunkResult.chunk.chunk_id, analysisJob.job_id, "backend_live_visual_source_switch"],
    model_invoked: true,
    confidence: cleanNumber(body.confidence) ?? 0.79,
    observed_at: now,
    ingested_at: now,
    available_at: now,
    created_at: now,
    assistant_answer: false,
    raw_content_included: false,
  });
  return {
    schema: "helix.backend_live_visual_source_switch_receipt.v1",
    ok: true,
    thread_id: threadId,
    bound_seed: boundSeed,
    unbound_source_id: unboundSourceId,
    unbound_chunk_id: chunkResult.chunk.chunk_id,
    unbound_analysis_job_id: analysisJob.job_id,
    unbound_observation_ref: observation.observation_id,
    expected_repair: "explicit_visual_capture_prompt_should_diagnose_unbound_source",
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}
