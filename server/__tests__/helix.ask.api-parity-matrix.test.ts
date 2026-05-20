import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { API_PARITY_SCENARIOS, type HelixApiParityScenario } from "../services/helix-ask/api-parity-matrix";
import { buildApiParityProbeResult } from "../services/helix-ask/api-parity-probe";
import { resetConversationalAnswerDistillationsForTest } from "../services/helix-ask/conversational-answer-distillation-store";
import { resetLiveSourcePipelinesForTest } from "../services/helix-ask/live-source-pipeline-executor";
import { resetReceiptPresentationSnapshotsForTest } from "../services/helix-ask/receipt-presentation-snapshot-store";
import { resetClientCapabilityActionsForTest } from "../services/client-capabilities/client-action-queue";
import { resetClientCapabilityAdoptionsForTest } from "../services/client-capabilities/client-adoption-store";
import { resetLiveAnswerEnvironments } from "../services/situation-room/live-answer-environment-store";
import { createLiveAnswerEnvironment } from "../services/situation-room/live-answer-environment-store";
import { recordLiveFieldEvaluation, resetLiveFieldEvaluationsForTest } from "../services/situation-room/live-field-evaluation-store";
import { resetLiveFieldWorkerRunsForTest } from "../services/situation-room/live-field-worker-run-store";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";
import { resetLivePipelineLifecycleForTest } from "../services/situation-room/live-pipeline-lifecycle-store";
import { ensureLiveSituationRunForEnvironment, resetLiveSituationRunsForTest } from "../services/situation-room/live-situation-run-store";
import { appendLiveSourceChunk, queueLiveSourceAnalysisJob, resetLiveSourceChunkBufferForTest } from "../services/situation-room/live-source-chunk-buffer";
import { resetLiveSourceProducerBindingsForTest } from "../services/situation-room/live-source-producer-binding";
import { resetLiveSourceProducerLifecycleForTest } from "../services/situation-room/live-source-producer-lifecycle-store";
import { resetLiveWorkerLanesForTest } from "../services/situation-room/live-worker-lane-store";
import { resetObservationJournalForTest } from "../services/situation-room/observation-journal-store";
import { appendObservationJournalEntry } from "../services/situation-room/observation-journal-store";
import { appendInterpretationCard, resetInterpretationCardsForTest } from "../services/situation-room/interpretation-card-store";
import { resetProcedureEpochClosuresForTest } from "../services/situation-room/procedure-epoch-closure";
import { resetProcedureEpochLedgerForTest } from "../services/situation-room/procedure-epoch-ledger-store";
import { resetProcedureReasoningSnapshotsForTest } from "../services/situation-room/procedure-reasoning-snapshot-store";
import { resetSituationSourceCapabilitiesForTest } from "../services/situation-room/situation-source-capability-store";
import { resetVisualComparisonSessionsForTest } from "../services/situation-room/visual-comparison-session-store";
import { resetVisualProducerSchedulerAdoptionsForTest } from "../services/situation-room/visual-producer-scheduler-adoption-store";
import { resetVisualSceneMemoryForTest } from "../services/situation-room/visual-scene-memory-store";
import { resetVisualSnapshotStoreForTest } from "../services/situation-room/visual-snapshot-store";
import { resetVoiceLiveHandoffsForTest } from "../services/situation-room/voice-live-handoff-router";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const resetAll = (): void => {
  resetLiveAnswerEnvironments();
  resetLiveSituationRunsForTest();
  resetObservationJournalForTest();
  resetLiveFieldEvaluationsForTest();
  resetProcedureEpochClosuresForTest();
  resetProcedureEpochLedgerForTest();
  resetVisualComparisonSessionsForTest();
  resetVoiceLiveHandoffsForTest();
  resetLiveSourceChunkBufferForTest();
  resetLiveFieldWorkersForTest();
  resetLiveFieldWorkerRunsForTest();
  resetProcedureReasoningSnapshotsForTest();
  resetConversationalAnswerDistillationsForTest();
  resetVisualSceneMemoryForTest();
  resetLiveSourcePipelinesForTest();
  resetLiveWorkerLanesForTest();
  resetLivePipelineLifecycleForTest();
  resetSituationSourceCapabilitiesForTest();
  resetVisualSnapshotStoreForTest();
  resetLiveSourceProducerBindingsForTest();
  resetLiveSourceProducerLifecycleForTest();
  resetVisualProducerSchedulerAdoptionsForTest();
  resetClientCapabilityActionsForTest();
  resetClientCapabilityAdoptionsForTest();
  resetReceiptPresentationSnapshotsForTest();
  resetInterpretationCardsForTest();
};

const seedIdentitySource = (input: {
  threadId: string;
  sourceId: string;
  environmentId?: string | null;
  observationId?: string;
}) => {
  const now = new Date().toISOString();
  const chunk = appendLiveSourceChunk({
    source_id: input.sourceId,
    thread_id: input.threadId,
    environment_id: input.environmentId,
    modality: "visual_frame",
    ts: now,
    compact_summary: "A parity-seeded visual frame is available.",
    evidence_refs: ["visual_evidence:api-parity"],
  }).chunk;
  const job = queueLiveSourceAnalysisJob({
    chunk,
    status: "completed",
    outputRefs: ["visual_evidence:api-parity"],
  });
  const observation = appendObservationJournalEntry({
    thread_id: input.threadId,
    observation_id: input.observationId ?? `observation:api-parity:${input.sourceId.replace(/[^a-z0-9]+/gi, "-")}`,
    role: "model_perception_observation",
    modality: "visual_frame",
    source_id: input.sourceId,
    text: "A parity-seeded visual frame is available.",
    evidence_refs: [chunk.chunk_id, job.job_id],
    model_invoked: true,
    confidence: 0.8,
    created_at: now,
    assistant_answer: false,
    raw_content_included: false,
  });
  return { now, chunk, observation };
};

const recordIdentityField = (input: {
  threadId: string;
  environmentId: string;
  situationRunId: string;
  observationId: string;
}): void => {
  const now = new Date().toISOString();
  recordLiveFieldEvaluation({
    schema: "helix.live_field_evaluation.v1",
    evaluation_id: `field_eval:api-parity:${input.situationRunId}:activity`,
    worker_run_id: `field_worker_run:api-parity:${input.situationRunId}:activity`,
    worker_id: "field_worker:api_parity_identity",
    situation_run_id: input.situationRunId,
    thread_id: input.threadId,
    environment_id: input.environmentId,
    field_key: "activity",
    value: "Reviewing parity-seeded visual evidence.",
    status: "supported",
    confidence: 0.8,
    evidence_refs: [input.observationId],
    missing_evidence: [],
    corroboration_state: { visual: "present" },
    next_check: "Compare the next frame.",
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    created_at: now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
};

const seedScenario = async (
  app: express.Express,
  scenario: HelixApiParityScenario,
  threadId: string,
): Promise<void> => {
  if (scenario.seed === "none") return;
  if (scenario.seed === "active_run_with_unbound_visual_source") {
    await request(app)
      .post("/api/agi/situation/test-harness/live-visual-source")
      .send({
        scenario: "active_run_with_unbound_visual_source",
        thread_id: threadId,
        bound_source_id: `visual_source:${scenario.id}:bound`,
        unbound_source_id: `visual_source:${scenario.id}:fresh`,
        bound_scene_text: "A backend-seeded visual capture shows File Explorer open to a research folder.",
        unbound_scene_text: "A fresh visual capture shows the Helix Ask UI with worker-lane debug output.",
        confidence: 0.82,
      })
      .expect(200);
    return;
  }
  if (scenario.seed === "live_source_identity_missing_environment_source") {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}`,
      objective: "Answer from visual evidence.",
      preset: "custom",
      source_ids: [],
    });
    seedIdentitySource({ threadId, sourceId: `visual_source:${scenario.id}:fresh`, environmentId: environment.environment_id });
    return;
  }
  if (scenario.seed === "live_source_identity_no_situation_run") {
    const sourceId = `visual_source:${scenario.id}:bound`;
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}`,
      objective: "Answer from visual evidence.",
      preset: "custom",
      source_ids: [sourceId],
    });
    seedIdentitySource({ threadId, sourceId, environmentId: environment.environment_id });
    return;
  }
  if (scenario.seed === "live_source_identity_no_field_evaluations") {
    const sourceId = `visual_source:${scenario.id}:bound`;
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}`,
      objective: "Answer from visual evidence.",
      preset: "custom",
      source_ids: [sourceId],
    });
    const { observation } = seedIdentitySource({ threadId, sourceId, environmentId: environment.environment_id });
    ensureLiveSituationRunForEnvironment({ environment, observation, advanceEpoch: true });
    return;
  }
  if (scenario.seed === "live_source_identity_stale_interpretation") {
    const sourceId = `visual_source:${scenario.id}:bound`;
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}`,
      objective: "Answer from visual evidence.",
      preset: "custom",
      source_ids: [sourceId],
    });
    const { observation } = seedIdentitySource({ threadId, sourceId, environmentId: environment.environment_id });
    const run = ensureLiveSituationRunForEnvironment({ environment, observation, advanceEpoch: true });
    recordIdentityField({ threadId, environmentId: environment.environment_id, situationRunId: run.situation_run_id, observationId: observation.observation_id });
    appendInterpretationCard({
      thread_id: threadId,
      title: "Expired visual interpretation",
      summary: "This interpretation is stale.",
      evidence_refs: [observation.observation_id],
      confidence: 0.8,
      expires_at: "2000-01-01T00:00:00.000Z",
    });
    return;
  }
  if (scenario.seed === "live_source_identity_wrong_environment") {
    const sourceId = `visual_source:${scenario.id}:bound`;
    const { environment: wrongEnvironment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}:wrong`,
      objective: "Other visual environment.",
      preset: "custom",
      source_ids: [sourceId],
      now: "2026-05-20T00:00:00.000Z",
    });
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `seed:${scenario.id}:active`,
      objective: "Answer from visual evidence.",
      preset: "custom",
      source_ids: [sourceId],
      now: "2026-05-20T00:01:00.000Z",
    });
    const { observation } = seedIdentitySource({ threadId, sourceId, environmentId: wrongEnvironment.environment_id });
    const run = ensureLiveSituationRunForEnvironment({ environment, observation, advanceEpoch: true });
    recordIdentityField({ threadId, environmentId: environment.environment_id, situationRunId: run.situation_run_id, observationId: observation.observation_id });
    appendInterpretationCard({
      thread_id: threadId,
      title: "Visual interpretation",
      summary: "The current visual frame has been interpreted.",
      evidence_refs: [observation.observation_id],
      confidence: 0.8,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    return;
  }
  await request(app)
    .post("/api/agi/situation/test-harness/live-visual-source")
    .send({
      thread_id: threadId,
      source_id: `visual_source:${scenario.id}`,
      scene_text:
        scenario.seed === "visual_frame_with_start_button"
          ? "A backend-seeded visual capture shows a workstation panel with a visible Start button and status controls."
          : "A backend-seeded visual capture shows File Explorer open to a research folder.",
      activity:
        scenario.seed === "visual_frame_with_start_button"
          ? "Reviewing a workstation panel that includes a Start button."
          : "Reviewing a research folder in File Explorer.",
      objects:
        scenario.seed === "visual_frame_with_start_button"
          ? "workstation panel, Start button, status controls"
          : "File Explorer window, research folder, visible file list",
      confidence: 0.82,
    })
    .expect(200);
};

const enabledParityScenarios = API_PARITY_SCENARIOS.filter((scenario) => scenario.enabled);

describe("Helix Ask API parity matrix", () => {
  beforeEach(resetAll);

  it.each(enabledParityScenarios)("$id stays procedural through top-level Ask", async (scenario) => {
    const app = createApp();
    const threadId = `helix-ask:api-parity:${scenario.id}`;
    await seedScenario(app, scenario, threadId);

    const ask = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: scenario.prompt,
        mode: "read",
        debug: true,
      })
      .expect(200);
    const debug = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(ask.body.turn_id)}/debug-export`)
      .expect(200);
    const probe = buildApiParityProbeResult({
      scenario,
      askTurn: ask.body,
      debugExport: debug.body,
      terminalEventSeen: true,
      streamClosedAfterTerminal: true,
    });
    expect(probe).toMatchObject({
      schema: "helix.api_parity_probe_result.v1",
      scenario_id: scenario.id,
      debug_export_available: true,
      terminal_authority_ok: true,
      procedural_ok: true,
      failures: [],
    });
    expect(probe.route_authority.ok).toBe(true);
    expect(probe.loop_parity_trace.unexpected_tool_calls).toEqual([]);
    if (scenario.expected.live_source_identity_ok !== false) {
      expect(probe.loop_parity_trace.short_circuit_risk_flags).toEqual([]);
      expect(probe.ask_turn_solver_trace.solver_short_circuit_flags).toEqual([]);
    }
    expect(probe.poison_audit_ok && !probe.route_authority.ok).toBe(false);
  }, 60_000);
});
