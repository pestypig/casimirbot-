import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import { ensureLiveSituationRunForEnvironment, resetLiveSituationRunsForTest } from "../services/situation-room/live-situation-run-store";
import { appendObservationJournalEntry, resetObservationJournalForTest } from "../services/situation-room/observation-journal-store";
import { recordLiveFieldEvaluation, resetLiveFieldEvaluationsForTest } from "../services/situation-room/live-field-evaluation-store";
import { recordProcedureEpochClosure, resetProcedureEpochClosuresForTest } from "../services/situation-room/procedure-epoch-closure";
import { resetProcedureEpochLedgerForTest } from "../services/situation-room/procedure-epoch-ledger-store";
import { resetVisualComparisonSessionsForTest } from "../services/situation-room/visual-comparison-session-store";
import { resetVoiceLiveHandoffsForTest } from "../services/situation-room/voice-live-handoff-router";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";
import { resetLiveFieldWorkerRunsForTest } from "../services/situation-room/live-field-worker-run-store";
import { resetProcedureReasoningSnapshotsForTest } from "../services/situation-room/procedure-reasoning-snapshot-store";
import { resetConversationalAnswerDistillationsForTest } from "../services/helix-ask/conversational-answer-distillation-store";
import {
  resetLiveSourceChunkBufferForTest,
  upsertLiveSourceProducer,
} from "../services/situation-room/live-source-chunk-buffer";
import { routeSituationContextTurn } from "../services/helix-ask/situation-context-turn-router";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";

const createApp = async (): Promise<{ app: express.Express }> => {
  const agi = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", agi.planRouter);
  return { app };
};

const seedVisualSituationRun = () => {
  const now = new Date().toISOString();
  const { environment } = createLiveAnswerEnvironment({
    thread_id: "helix-ask:desktop",
    created_turn_id: "ask:seed",
    objective: "Use the latest visual observation to describe the current workstation screen.",
    preset: "custom",
    source_ids: ["visual_source:test"],
    now,
  });
  const run = ensureLiveSituationRunForEnvironment({
    environment,
    advanceEpoch: false,
    now,
  });
  const observation = appendObservationJournalEntry({
    thread_id: "helix-ask:desktop",
    observation_id: "observation:folder-view",
    kind: "model_perception_observation",
    modality: "visual_frame",
    source_id: "visual_source:test",
    text: "A Windows File Explorer folder is visible with research files.",
    evidence_refs: ["live_source_analysis_job:test"],
    model_invoked: true,
    confidence: 0.82,
    created_at: now,
  });
  recordLiveFieldEvaluation({
    schema: "helix.live_field_evaluation.v1",
    evaluation_id: "field_eval:activity",
    worker_run_id: "field_worker_run:activity",
    worker_id: "field_worker:activity",
    situation_run_id: run.situation_run_id,
    thread_id: run.thread_id,
    environment_id: run.environment_id,
    field_key: "activity",
    value: "Likely browsing, reviewing, or organizing visible workstation files.",
    status: "supported",
    confidence: 0.62,
    evidence_refs: [observation.observation_id],
    missing_evidence: ["No audio/user steering corroboration."],
    corroboration_state: { visual: "present", transcript: "missing_not_required" },
    next_check: "Compare the next captured frame for selection, window, or content changes.",
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    created_at: now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
  recordLiveFieldEvaluation({
    schema: "helix.live_field_evaluation.v1",
    evaluation_id: "field_eval:objects",
    worker_run_id: "field_worker_run:objects",
    worker_id: "field_worker:objects",
    situation_run_id: run.situation_run_id,
    thread_id: run.thread_id,
    environment_id: run.environment_id,
    field_key: "objects",
    value: "File Explorer window, folder view, visible file entries.",
    status: "supported",
    confidence: 0.7,
    evidence_refs: [observation.observation_id],
    missing_evidence: [],
    corroboration_state: { visual: "present" },
    next_check: "Watch for a selected file or opened document.",
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    created_at: now,
    role: "ui_projection",
    assistant_answer: false,
    raw_content_included: false,
  });
  recordProcedureEpochClosure({
    situation_run_id: run.situation_run_id,
    thread_id: run.thread_id,
    environment_id: run.environment_id,
    source_binding_id: run.source_binding_id,
    epoch: run.current_epoch,
    status: "silent_update",
    card_updated: true,
    confidence_changes: ["field_eval:activity"],
    created_at: now,
  });
  return { environment, run, observation };
};

const seedTemporalVisualSituationRun = () => {
  const now = "2026-05-18T12:00:00.000Z";
  const { environment } = createLiveAnswerEnvironment({
    thread_id: "helix-ask:desktop",
    created_turn_id: "ask:temporal-seed",
    objective: "Use time-windowed visual observations.",
    preset: "custom",
    source_ids: ["visual_source:temporal"],
    now,
  });
  const run = ensureLiveSituationRunForEnvironment({
    environment,
    advanceEpoch: false,
    now,
  });
  return { environment, run };
};

describe("thread-bound situation context bridge", () => {
  beforeEach(() => {
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
  });
  it("resolves a typed selected-file prompt through active SituationRun evidence", () => {
    seedVisualSituationRun();
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Can you see the file I'm clicking on right now?",
      inputModality: "typed",
    });

    expect(route.route).toBe("situation_context_question");
    expect(route.deictic_reference).toMatchObject({
      reference_type: "selected_visible_file",
      candidate_signal: true,
      resolution_status: "resolved",
      assistant_answer: false,
    });
    expect(route.situation_evidence_selection.answerable).toBe(true);
    expect(route.situation_evidence_selection.selected_observation_refs).toContain("observation:folder-view");
    expect(route.situation_evidence_selection.raw_content_included).toBe(false);
    expect(route.answer_text).toContain("can't confirm the clicked file");
    expect(route.answer_text).not.toContain("Evidence refs:");
    expect(route.reasoning_snapshot?.assistant_answer).toBe(false);
    expect(route.answer_distillation?.assistant_answer).toBe(false);
  });

  it("creates a voice live handoff instead of quick-response authority", () => {
    seedVisualSituationRun();
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Can you see the file I'm clicking on right now?",
      inputModality: "voice",
    });

    expect(route.voice_live_handoff).toMatchObject({
      route: "situation_context_question",
      quick_response_suppressed: true,
      assistant_answer: false,
    });
  });

  it("sets up a visual comparison session from the current observation", () => {
    const { run } = seedVisualSituationRun();
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Compare this file with the next one I show you.",
      inputModality: "typed",
    });

    expect(route.route).toBe("visual_comparison_setup");
    expect(route.comparison_session).toMatchObject({
      situation_run_id: run.situation_run_id,
      baseline_observation_ref: "observation:folder-view",
      waiting_for_next_visual_observation: true,
      assistant_answer: false,
    });
  });

  it("does not convert unrelated concept prompts into situation routes", () => {
    seedVisualSituationRun();
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "What is a neutron star glitch?",
      inputModality: "typed",
    });

    expect(route.route).toBe("none");
    expect(route.deictic_reference.candidate_signal).toBe(false);
  });

  it("ask turn answers deictic visual prompts from selected situation evidence", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Can you see the file I'm clicking on right now?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.deictic_reference?.reference_type).toBe("selected_visible_file");
    expect(response.body?.situation_evidence_selection?.selected_observation_refs).toContain("observation:folder-view");
    expect(String(response.body?.answer ?? "")).toContain("can't confirm the clicked file");
    expect(String(response.body?.answer ?? "")).not.toContain("Evidence refs:");
    expect(response.body?.procedure_reasoning_snapshot?.assistant_answer).toBe(false);
    expect(response.body?.answer_distillation?.assistant_answer).toBe(false);
    expect(String(response.body?.answer ?? "")).not.toContain("I cannot access any files");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 60000);

  it("does not let active-doc identity override an explicit visual screen-capture target", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Actually, what file am I looking at in the visual screen capture?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
        workspace_context_snapshot: {
          sessionId: "helix-ask:desktop",
          activePanel: "live-answer-environment",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
          docContextValid: true,
          docContextPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_context_question");
    expect(response.body?.terminal_artifact_kind).toBe("situation_context_pack");
    expect(response.body?.deictic_reference?.candidate_signal).toBe(true);
    expect(response.body?.situation_evidence_selection?.answerable).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).not.toContain("Active doc:");
    expect(String(response.body?.selected_final_answer ?? "")).not.toContain("nhm2-current-status-whitepaper");
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("routes explicit visual capture content questions through SituationRun evidence", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Explain, what is in the visual capture?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
        workspace_context_snapshot: {
          sessionId: "helix-ask:desktop",
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
          docContextValid: true,
          docContextPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? response.body?.answer ?? "");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      target_kind: "visual_capture",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "explicit_visual_source_target",
    });
    expect(response.body?.ask_turn_preflight_context?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      must_enter_backend_ask: true,
    });
    expect(response.body?.route_product_contract).toMatchObject({
      source_target: "visual_capture",
    });
    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_context_question");
    expect(response.body?.deictic_reference).toMatchObject({
      reference_type: "current_screen",
      candidate_signal: true,
      resolution_status: "resolved",
    });
    expect(response.body?.terminal_artifact_kind).toBe("situation_context_pack");
    expect(finalAnswer).toMatch(/browsing|reviewing|organizing|File Explorer/i);
    expect(finalAnswer).not.toContain("McGurk");
    expect(finalAnswer).not.toContain("phenomenon where visual information");
    expect(finalAnswer).not.toContain("Explained the active document");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("routes plural visuals description prompts through SituationRun evidence", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, can you describe what the visuals are?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? response.body?.answer ?? "");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      target_kind: "visual_capture",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.ask_turn_preflight_context?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      must_enter_backend_ask: true,
    });
    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_context_question");
    expect(response.body?.deictic_reference).toMatchObject({
      reference_type: "current_screen",
      candidate_signal: true,
      resolution_status: "resolved",
    });
    expect(response.body?.terminal_artifact_kind).toBe("situation_context_pack");
    expect(finalAnswer).not.toContain("Visuals refer to images");
    expect(finalAnswer).not.toContain("charts, graphs, and videos");
    expect(finalAnswer).toMatch(/File Explorer|browsing|reviewing|organizing/i);
  }, 60000);

  it("does not treat visual screen content questions as live pipeline continuation", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Can you describe what we can see now in the visual screen capture?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? response.body?.answer ?? "");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_context_question");
    expect(response.body?.terminal_artifact_kind).toBe("situation_context_pack");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(finalAnswer).not.toContain("Visual capture is running every");
    expect(finalAnswer).toMatch(/File Explorer|browsing|reviewing|organizing/i);
  }, 60000);

  it("fail-closes explicit visual capture prompts without model-only concept answers when no visual evidence is bound", async () => {
    const { app } = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Explain, what is in the visual capture?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? response.body?.answer ?? "");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      target_kind: "visual_capture",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "explicit_visual_source_target",
    });
    expect(response.body?.ask_turn_preflight_context?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      must_enter_backend_ask: true,
    });
    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.deictic_reference).toMatchObject({
      reference_type: "current_screen",
      candidate_signal: true,
    });
    expect(response.body?.situation_evidence_selection?.answerable).toBe(false);
    expect(finalAnswer).toMatch(/active visual SituationRun|no server-bound active SituationRun evidence/i);
    expect(finalAnswer).not.toContain("McGurk");
    expect(finalAnswer).not.toContain("phenomenon where visual information");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 60000);

  it("keeps generic looking-at prompts on the visual terminal presentation when an active doc is present", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, explain what I'm looking at right now.",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
        workspace_context_snapshot: {
          sessionId: "helix-ask:desktop",
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
          docContextValid: true,
          docContextPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? "");
    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("situation_context_question");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      target_kind: "visual_capture",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "explicit_visual_source_target",
    });
    expect(response.body?.ask_turn_preflight_context?.source_target_intent).toMatchObject({
      target_source: "visual_capture",
      must_enter_backend_ask: true,
    });
    expect(response.body?.terminal_artifact_kind).toBe("situation_context_pack");
    expect(response.body?.terminal_presentation?.concise_text).toBe(finalAnswer);
    expect(finalAnswer).toContain("File Explorer");
    expect(finalAnswer).not.toContain("Explained the active document");
    expect(finalAnswer).not.toContain("Key claim: The current document context");
    expect(finalAnswer).not.toContain("nhm2-current-status-whitepaper");
    expect(response.body?.terminal_answer_authority?.terminal_text_preview).toBe(finalAnswer);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("does not let visual SituationRun hijack structured docs-viewer locate prompts", async () => {
    const { app } = await createApp();
    seedVisualSituationRun();
    const question = [
      "Find where this topic is addressed in the current docs viewer context.",
      "Return a short \"Locations:\" list with anchors/sections and one-line evidence snippets.",
      "Document path: docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      "Locate query: \"Okay, can you open up Docs and read me the latest NHM2 white paper?\"",
    ].join("\n");
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question,
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
        workspace_context_snapshot: {
          sessionId: "helix-ask:desktop",
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
          docContextValid: true,
          docContextPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        },
      })
      .expect(200);

    const finalAnswer = String(response.body?.selected_final_answer ?? response.body?.answer ?? "");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "docs_viewer",
      target_kind: "docs_viewer",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "explicit_docs_viewer_source_target",
    });
    expect(response.body?.route_product_contract).toMatchObject({
      schema: "helix.route_product_contract.v1",
      source_target: "docs_viewer",
    });
    expect(response.body?.route_product_contract?.forbidden_terminal_artifact_kinds).toContain("situation_context_pack");
    expect(response.body?.terminal_artifact_kind).toBe("doc_location_result");
    expect(response.body?.terminal_artifact_selection_guard?.allowed).toBe(true);
    expect(finalAnswer).toContain("Locations:");
    expect(finalAnswer).not.toContain("File Explorer");
    expect(finalAnswer).not.toContain("visible workstation files");
    expect(response.body?.route_history_debug?.rejected_route_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route: "situation_context_question",
          target_source: "docs_viewer",
        }),
      ]),
    );
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("ask turn keeps missing live context inside the situation bridge instead of model-only fallback", async () => {
    const { app } = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Can you see the file that I'm clicking right now",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(response.body?.final_answer_source).toBe("artifact_synthesis");
    expect(response.body?.deictic_reference?.reference_type).toBe("selected_visible_file");
    expect(response.body?.active_situation_context?.status).toBe("missing");
    expect(response.body?.situation_evidence_selection?.answerable).toBe(false);
    expect(String(response.body?.answer ?? "")).toContain("active visual SituationRun");
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(String(response.body?.answer ?? "")).not.toContain("model_only");
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("ask turn handles current-file deictic prompts without retrieval initialization errors", async () => {
    const { app } = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, what file am I looking at now?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("situation_context_question");
    expect(String(response.body?.answer ?? "")).not.toContain("retrievalRequiredSignal");
    expect(response.body?.final_answer_source).toBe("artifact_synthesis");
    expect(response.body?.deictic_reference?.candidate_signal).toBe(true);
    expect(response.body?.ask_turn_preflight_context?.schema).toBe("helix.ask_turn_preflight_context.v1");
    expect(response.body?.ask_turn_preflight_context?.retrieval_required_signal).toBeTruthy();
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(response.body?.terminal_presentation?.concise_text).toBe(response.body?.answer);
    expect(response.body?.terminal_presentation_coverage_audit).toMatchObject({
      schema: "helix.terminal_presentation_coverage_audit.v1",
      terminal_presenter_used: true,
      raw_route_text_returned: false,
      violations: [],
    });
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 60000);

  it("freezes live visual context at the ask timestamp and excludes post-anchor observations", () => {
    const { run } = seedTemporalVisualSituationRun();
    const inventoryObservation = appendObservationJournalEntry({
      thread_id: "helix-ask:desktop",
      observation_id: "observation:inventory-open",
      kind: "model_perception_observation",
      modality: "visual_frame",
      source_id: "visual_source:temporal",
      text: "The player has the inventory open.",
      evidence_refs: ["visual_frame:inventory"],
      model_invoked: true,
      confidence: 0.84,
      observed_at: "2026-05-18T12:00:08.000Z",
      created_at: "2026-05-18T12:00:08.500Z",
      available_at: "2026-05-18T12:00:09.000Z",
    });
    appendObservationJournalEntry({
      thread_id: "helix-ask:desktop",
      observation_id: "observation:cave-entered",
      kind: "model_perception_observation",
      modality: "visual_frame",
      source_id: "visual_source:temporal",
      text: "The player has entered a cave.",
      evidence_refs: ["visual_frame:cave"],
      model_invoked: true,
      confidence: 0.82,
      observed_at: "2026-05-18T12:00:12.000Z",
      created_at: "2026-05-18T12:00:12.500Z",
      available_at: "2026-05-18T12:00:13.000Z",
    });
    recordLiveFieldEvaluation({
      schema: "helix.live_field_evaluation.v1",
      evaluation_id: "field_eval:scene:inventory",
      worker_run_id: "field_worker_run:scene:inventory",
      worker_id: "field_worker:scene",
      situation_run_id: run.situation_run_id,
      thread_id: run.thread_id,
      environment_id: run.environment_id,
      field_key: "scene",
      value: "The visible screen shows an open inventory.",
      status: "supported",
      confidence: 0.8,
      evidence_refs: [inventoryObservation.observation_id],
      missing_evidence: [],
      corroboration_state: { visual: "present" },
      next_check: "Watch for inventory changes.",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: "2026-05-18T12:00:09.000Z",
      role: "ui_projection",
      assistant_answer: false,
      raw_content_included: false,
    });
    recordLiveFieldEvaluation({
      schema: "helix.live_field_evaluation.v1",
      evaluation_id: "field_eval:scene:cave",
      worker_run_id: "field_worker_run:scene:cave",
      worker_id: "field_worker:scene",
      situation_run_id: run.situation_run_id,
      thread_id: run.thread_id,
      environment_id: run.environment_id,
      field_key: "scene",
      value: "The visible screen shows the player entering a cave.",
      status: "supported",
      confidence: 0.8,
      evidence_refs: ["observation:cave-entered"],
      missing_evidence: [],
      corroboration_state: { visual: "present" },
      next_check: "Watch for hostile mobs.",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: "2026-05-18T12:00:13.000Z",
      role: "ui_projection",
      assistant_answer: false,
      raw_content_included: false,
    });

    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Dottie, what am I doing?",
      inputModality: "voice",
      speechEndAt: "2026-05-18T12:00:10.000Z",
      serverReceivedAt: "2026-05-18T12:00:14.000Z",
      answerStartedAt: "2026-05-18T12:00:14.000Z",
    });

    expect(route.route).toBe("situation_context_question");
    expect(route.live_context_window_binding?.window.to_ts).toBe("2026-05-18T12:00:10.000Z");
    expect(route.live_context_window_binding?.included_observation_refs).toContain("observation:inventory-open");
    expect(route.live_context_window_binding?.excluded_observation_refs).toEqual(
      expect.arrayContaining([
        { ref: "observation:cave-entered", reason: "after_anchor" },
      ]),
    );
    expect(route.situation_evidence_selection.selected_observation_refs).toContain("observation:inventory-open");
    expect(route.situation_evidence_selection.selected_observation_refs).not.toContain("observation:cave-entered");
    expect(route.situation_evidence_selection.selected_field_evaluation_refs).toContain("field_eval:scene:inventory");
    expect(route.situation_evidence_selection.selected_field_evaluation_refs).not.toContain("field_eval:scene:cave");
    expect(String(route.answer_text ?? "")).toContain("inventory");
    expect(String(route.answer_text ?? "")).not.toContain("cave");
  });

  it("allows late-arriving pre-anchor observations only when available before answer start", () => {
    const { run } = seedTemporalVisualSituationRun();
    appendObservationJournalEntry({
      thread_id: "helix-ask:desktop",
      observation_id: "observation:late-frame",
      kind: "model_perception_observation",
      modality: "visual_frame",
      source_id: "visual_source:temporal",
      text: "A frame captured before the question shows the player opening a chest.",
      evidence_refs: ["visual_frame:late"],
      model_invoked: true,
      confidence: 0.84,
      observed_at: "2026-05-18T12:00:08.000Z",
      created_at: "2026-05-18T12:00:10.500Z",
      available_at: "2026-05-18T12:00:10.500Z",
    });
    appendObservationJournalEntry({
      thread_id: "helix-ask:desktop",
      observation_id: "observation:late-translation",
      kind: "transcript_observation",
      modality: "audio_transcript",
      source_id: "translation:guest",
      text: "A translation became available after the answer started.",
      evidence_refs: ["translation:late"],
      model_invoked: false,
      confidence: 0.8,
      observed_at: "2026-05-18T12:00:07.000Z",
      created_at: "2026-05-18T12:00:12.000Z",
      available_at: "2026-05-18T12:00:12.000Z",
    });
    recordLiveFieldEvaluation({
      schema: "helix.live_field_evaluation.v1",
      evaluation_id: "field_eval:scene:late-frame",
      worker_run_id: "field_worker_run:scene:late-frame",
      worker_id: "field_worker:scene",
      situation_run_id: run.situation_run_id,
      thread_id: run.thread_id,
      environment_id: run.environment_id,
      field_key: "scene",
      value: "The visible screen shows a chest being opened.",
      status: "supported",
      confidence: 0.8,
      evidence_refs: ["observation:late-frame"],
      missing_evidence: [],
      corroboration_state: { visual: "present" },
      next_check: "Watch for item transfer.",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: "2026-05-18T12:00:10.500Z",
      role: "ui_projection",
      assistant_answer: false,
      raw_content_included: false,
    });

    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "What am I looking at?",
      inputModality: "typed",
      submittedAt: "2026-05-18T12:00:11.000Z",
      answerStartedAt: "2026-05-18T12:00:11.000Z",
    });

    expect(route.live_context_window_binding?.included_observation_refs).toContain("observation:late-frame");
    expect(route.live_context_window_binding?.excluded_observation_refs).toEqual(
      expect.arrayContaining([
        { ref: "observation:late-translation", reason: "not_available_before_answer" },
      ]),
    );
    expect(route.situation_evidence_selection.selected_observation_refs).toContain("observation:late-frame");
    expect(String(route.answer_text ?? "")).toContain("chest");
    expect(String(route.answer_text ?? "")).not.toContain("translation");
  });

  it("distills visible folder evidence into a grammatical file answer", () => {
    const { run, observation } = seedVisualSituationRun();
    recordLiveFieldEvaluation({
      schema: "helix.live_field_evaluation.v1",
      evaluation_id: "field_eval:scene:sdo",
      worker_run_id: "field_worker_run:scene",
      worker_id: "field_worker:scene",
      situation_run_id: run.situation_run_id,
      thread_id: run.thread_id,
      environment_id: run.environment_id,
      field_key: "scene",
      value: "The visible scene showcases a file directory labeled \"SDO-Solar Dynamics Observatory,\" containing various folders and files related to solar observation and data analysis.",
      status: "supported",
      confidence: 0.7,
      evidence_refs: [observation.observation_id],
      missing_evidence: [],
      corroboration_state: { visual: "present" },
      next_check: "Watch for a selected file or opened document.",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      role: "ui_projection",
      assistant_answer: false,
      raw_content_included: false,
    });

    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Okay, can you describe what file I'm looking at now?",
      inputModality: "typed",
    });

    expect(route.route).toBe("situation_context_question");
    expect(route.answer_distillation?.concise_answer).toContain("You're viewing a folder labeled \"SDO-Solar Dynamics Observatory\"");
    expect(route.answer_distillation?.concise_answer).toContain("can't confirm a specific selected file");
    expect(String(route.answer_text ?? "")).not.toContain("You're looking at The visible scene");
    expect(String(route.answer_text ?? "")).not.toContain("Observatory.\" with");
    expect(String(route.answer_text ?? "")).not.toContain("..");
    expect(String(route.answer_text ?? "")).not.toContain("Evidence refs:");
  });

  it("streaming ask turn handles explicit UUID deictic prompts without retrieval initialization errors", async () => {
    const { app } = await createApp();
    const turnId = "3450f3b2-9bb3-4ed1-9be4-d50273209029";
    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({
        question: "Okay, what file am I looking at now?",
        mode: "read",
        debug: true,
        sessionId: "helix-ask:desktop",
        traceId: turnId,
        turnId,
      })
      .expect(200);

    expect(response.text).toContain("event: turn_final");
    expect(response.text).toContain('"route_reason_code":"situation_context_question"');
    expect(response.text).toContain('"schema":"helix.ask_turn_preflight_context.v1"');
    expect(response.text).toContain('"schema":"helix.terminal_presentation.v1"');
    expect(response.text).not.toContain("retrievalRequiredSignal");
    expect(response.text).not.toContain("Cannot access");
  }, 60000);

  it("reports an unbound live visual producer instead of claiming no live source exists", () => {
    upsertLiveSourceProducer({
      sourceId: "visual_source:desktop-active",
      threadId: "helix-ask:desktop",
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      now: new Date().toISOString(),
    });

    const route = routeSituationContextTurn({
      threadId: "122b027e-56a4-41e7-8d65-dd9e1bd7af36",
      promptText: "OK, what am I looking at now?",
      inputModality: "typed",
    });

    expect(route.route).toBe("situation_context_question");
    expect(route.active_situation_context.status).toBe("unbound");
    expect(route.active_situation_context.thread_id).toBe("helix-ask:desktop");
    expect(route.active_situation_context.freshness_summary).toContain("live visual source producer exists");
    expect(route.active_situation_context.next_required_action).toBe("create_or_bind_situation_run");
    expect(route.situation_evidence_selection.answerable).toBe(false);
  });

  it("binds an unbound visual producer with observations into a SituationRun for deictic Ask", () => {
    upsertLiveSourceProducer({
      sourceId: "visual_source:desktop-active",
      threadId: "helix-ask:desktop",
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      now: new Date().toISOString(),
    });
    appendObservationJournalEntry({
      thread_id: "helix-ask:desktop",
      observation_id: "observation:barrier-formula-screen",
      kind: "model_perception_observation",
      modality: "visual_frame",
      source_id: "visual_source:desktop-active",
      text: "A file or document view is visible with a formula related to barrier height.",
      evidence_refs: ["live_source_analysis_job:test"],
      model_invoked: true,
      confidence: 0.76,
      created_at: new Date().toISOString(),
    });

    const route = routeSituationContextTurn({
      threadId: "122b027e-56a4-41e7-8d65-dd9e1bd7af36",
      promptText: "You see any files I'm looking at for the barrier height, I'm looking at one formula.",
      inputModality: "typed",
    });

    expect(route.route).toBe("situation_context_question");
    expect(route.binding_repair?.status).toBe("applied");
    expect(route.active_situation_context.status).toBe("active");
    expect(route.active_situation_context.situation_run_id).toBeTruthy();
    expect(route.situation_evidence_selection.answerable).toBe(true);
    expect(route.situation_evidence_selection.selected_observation_refs).toContain("observation:barrier-formula-screen");
    expect(route.situation_evidence_selection.selected_field_evaluation_refs.length).toBeGreaterThan(0);
    expect(String(route.answer_text ?? "")).toContain("Details are saved in the procedure log");
    expect(String(route.answer_text ?? "")).not.toContain("Evidence refs:");
  });

  it("recalls saved evidence through a snapshot expansion prompt", () => {
    seedVisualSituationRun();
    const first = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "What am I looking at now?",
      inputModality: "typed",
      turnId: "ask:first",
    });
    expect(first.answer_distillation?.expansion_available).toBe(true);

    const recall = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Show the evidence.",
      inputModality: "typed",
      turnId: "ask:recall",
    });

    expect(recall.route).toBe("procedure_epoch_replay_question");
    expect(recall.answer_text).toContain("Reasoning snapshot:");
    expect(recall.answer_text).toContain("Evidence refs:");
    expect(recall.answer_text).toContain("observation:folder-view");
    expect(recall.procedure_memory_recall).toMatchObject({
      schema: "helix.procedure_memory_recall.v1",
      recall_type: "show_evidence",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(recall.procedure_memory_recall?.snapshot_refs).toContain(first.reasoning_snapshot?.snapshot_id);
    expect(recall.answer_distillation?.assistant_answer).toBe(false);
    expect(recall.reasoning_snapshot?.assistant_answer).toBe(false);
  });

  it("routes scene-delta prompts through procedure replay", () => {
    seedVisualSituationRun();
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText: "Okay, can you describe what changed since last scene?",
      inputModality: "typed",
      turnId: "ask:scene-delta",
    });

    expect(route.route).toBe("procedure_epoch_replay_question");
    expect(route.deictic_reference.reference_type).toBe("latest_epoch_change");
    expect(route.situation_evidence_selection.selected_field_evaluation_refs).toContain("field_eval:activity");
    expect(route.reasoning_snapshot?.full_reasoning_summary).toContain(
      "Activity: Likely browsing, reviewing, or organizing visible workstation files.",
    );
    expect(route.procedure_memory_recall).toMatchObject({
      schema: "helix.procedure_memory_recall.v1",
      recall_type: "epoch_replay",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(route.reasoning_snapshot?.full_reasoning_summary).toContain(
      "Raw images, audio, and logs were not injected into Ask context.",
    );
  });

  it.each([
    "Okay, what changed since last seen epoch?",
    "What changed since the previous visual?",
    "Compare current scene to last capture.",
    "What changed in the visual epoch?",
    "Okay, so what is the difference between the last scene in the scene I'm looking at now",
  ])("routes %s through procedure epoch replay", (promptText) => {
    seedVisualSituationRun();
    const sourceTarget = arbitrateAskSourceTarget({
      turnId: "ask:scene-delta-admission",
      threadId: "helix-ask:desktop",
      promptText,
    });
    const route = routeSituationContextTurn({
      threadId: "helix-ask:desktop",
      promptText,
      inputModality: "typed",
      turnId: "ask:scene-delta-admission",
    });

    expect(sourceTarget).toMatchObject({
      target_source: "procedure_memory",
      target_kind: "situation_epoch",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(sourceTarget.requested_outputs).toEqual(
      expect.arrayContaining([
        "procedure_epoch_replay",
        "field_evaluation_refs",
        "interpretation_refs",
        "current_visual_state",
      ]),
    );
    expect(route.route).toBe("procedure_epoch_replay_question");
    expect(route.deictic_reference.reference_type).toBe("latest_epoch_change");
    expect(route.procedure_memory_recall?.recall_type).toBe("epoch_replay");
    expect(route.situation_evidence_selection.selected_observation_refs.length).toBeGreaterThan(0);
    expect(route.situation_evidence_selection.selected_field_evaluation_refs).toContain("field_eval:activity");
    expect(route.reasoning_snapshot?.full_reasoning_summary).toContain("Current observation:");
  });
});
