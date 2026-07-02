import { beforeEach, describe, expect, it } from "vitest";
import {
  listStagePlayLiveSourceMailItems,
  resetStagePlayLiveSourceMailboxForTest,
} from "../../../stage-play/stage-play-live-source-mailbox-store";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { runLiveTranslationTranslateText } from "../live-translation";
import { routeLiveTranslationObservationToMailLoop } from "../mail-loop-adapter";
import { createHelixCapabilityLaneSessionStore } from "../session-manager";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

describe("capability lane mail-loop adapter", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceMailboxForTest();
  });

  it("routes a live translation chunk into Stage Play live-source mail without terminal authority", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    const session = sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-mail",
      sourceBinding: {
        source_id: "docs:nhm2",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      requestedBackendProvider: "google_gemini",
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "hello",
        lane_session_id: "lane-session-mail",
        source_language: "en",
        target_language: "es",
        requested_backend_provider: "google_gemini",
        source_id: "docs:nhm2",
        chunk_id: "chunk-1",
        chunk_index: 1,
        dedupe_key: "docs:nhm2:chunk-1:es",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop",
      env: {} as NodeJS.ProcessEnv,
    });
    const receiptRef = translation.lane_resolve_trace.receipt_ref;

    const routed = routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: session.lane_session?.lane_session_id ?? "",
      translationResult: translation,
      threadId: "ask-thread-mail",
      objectiveText: "Translate document chunks into account language.",
      now: "2026-07-01T13:00:01.000Z",
    });

    expect(routed).toMatchObject({
      schema: "helix.capability_lane.mail_loop_result.v1",
      ok: true,
      lane_session_id: "lane-session-mail",
      lane_id: "live_translation",
      observation_ref: translation.observation?.observation_ref,
      stage_play_wake_expected: true,
      blocked_reason: null,
      debug_summary: {
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-mail",
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        observation_ref: translation.observation?.observation_ref,
        receipt_ref: receiptRef,
        stage_play_wake_expected: true,
        mailbox_thread_id: "ask-thread-mail",
        source_id: "docs:nhm2",
        source_kind: "document_markdown",
        chunk_id: "chunk-1",
        chunk_index: 1,
        dedupe_key: "docs:nhm2:chunk-1:es",
        observed_at_ms: expect.any(Number),
        projection_target: "docs_chunk",
        cancel_requested: false,
        selected_backend_provider: "live_translation.local_runtime",
        requested_backend_provider: "google_gemini",
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
        backend_selection_decision: expect.objectContaining({
          outcome: "fallback_selected",
          requested_backend_provider: "google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          terminal_authority_owner: "helix",
        }),
        blocked_reason: null,
        mail_status: "unread",
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(routed.mail).toMatchObject({
      artifactId: "stage_play_live_source_mail_item",
      threadId: "ask-thread-mail",
      sourceId: "docs:nhm2",
      sourceKind: "document_markdown",
      sourceRefs: {
        sourceId: "docs:nhm2",
        evidenceRef: translation.observation?.observation_ref,
        observationRef: translation.observation?.observation_ref,
      },
      summary: {
        preview: "hola",
        analysisState: "analysis_ready",
      },
      objective: {
        text: "Translate document chunks into account language.",
      },
      hints: {
        deterministicChangeHint: "summary_changed",
        sourceFreshness: "unknown",
      },
      status: "unread",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(routed.mail?.summary.text).toContain("Capability lane live_translation produced en -> es.");
    expect(routed.mail?.summary.text).toContain("Lane session: lane-session-mail.");
    expect(routed.mail?.summary.text).toContain("Projection target: docs_chunk.");
    expect(routed.mail?.summary.text).toContain("Chunk: chunk-1.");
    expect(routed.mail?.summary.text).toContain("Translation: hola");
    expect(routed.mail?.evidenceRefs).toEqual(expect.arrayContaining([
      "lane-session-mail",
      "docs:nhm2",
      "chunk-1",
      translation.observation?.observation_ref,
      receiptRef,
      "live_translation.local_runtime",
      "google_gemini",
    ]));
    expect(routed.debug_summary.stage_play_mail_id).toBe(routed.mail?.mailId);
    expect(routed.debug_summary.evidence_refs).toEqual(routed.mail?.evidenceRefs);
    expect(routed.debug_summary).toMatchObject({
      receipt_ref: receiptRef,
      selected_backend_provider: "live_translation.local_runtime",
      requested_backend_provider: "google_gemini",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      chunk_index: 1,
      dedupe_key: "docs:nhm2:chunk-1:es",
      source_event_ms: null,
      observed_at_ms: expect.any(Number),
      cancel_requested: false,
    });
    expect(sessionStore.get("lane-session-mail")?.last_observation_ref).toBe(routed.mail?.mailId);
    expect(sessionStore.get("lane-session-mail")?.last_receipt_ref).toBe(receiptRef);
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-mail" })).toHaveLength(1);
  });

  it("fails closed when a translation observation belongs to a different lane session", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-a",
      sourceBinding: {
        source_id: "docs:mismatch",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "hello",
        lane_session_id: "lane-session-b",
        source_language: "en",
        target_language: "es",
        source_id: "docs:mismatch",
        chunk_id: "chunk-mismatch",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-mismatch",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-a",
      translationResult: translation,
      threadId: "ask-thread-mismatch",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "lane_session_mismatch",
      debug_summary: {
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-a",
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        stage_play_mail_id: null,
        stage_play_wake_expected: false,
        mailbox_thread_id: "ask-thread-mismatch",
        blocked_reason: "lane_session_mismatch",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-mismatch" })).toHaveLength(0);
  });

  it("dedupes repeated lane mail by observation ref and carries stale source state", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-stale",
      sourceBinding: {
        source_id: "docs:stale",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "fr-FR",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "thank you",
        source_language: "en",
        target_language: "fr",
        source_id: "docs:stale",
        chunk_id: "chunk-stale",
        source_event_ms: 1,
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-stale",
      env: {} as NodeJS.ProcessEnv,
    });
    const receiptRef = translation.lane_resolve_trace.receipt_ref;

    const first = routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-stale",
      translationResult: translation,
      threadId: "ask-thread-stale",
      now: "2026-07-01T13:00:02.000Z",
    });
    const duplicate = routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-stale",
      translationResult: translation,
      threadId: "ask-thread-stale",
      now: "2026-07-01T13:00:03.000Z",
    });

    expect(first.mail?.mailId).toBe(duplicate.mail?.mailId);
    expect(first.mail).toMatchObject({
      summary: {
        preview: "merci",
      },
      hints: {
        deterministicChangeHint: "source_stale",
        sourceFreshness: "stale",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(first.debug_summary).toMatchObject({
      receipt_ref: receiptRef,
      chunk_id: "chunk-stale",
      chunk_index: null,
      dedupe_key: expect.any(String),
      source_event_ms: 1,
      observed_at_ms: expect.any(Number),
      freshness_status: "stale",
      cancel_requested: false,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-stale" })).toHaveLength(1);
  });

  it("fails closed for paused sessions or missing translation observations", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-paused",
      sourceBinding: {
        source_id: "docs:paused",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    sessionStore.pause({ laneSessionId: "lane-session-paused" });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "",
        source_language: "en",
        target_language: "es",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-missing",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-paused",
      translationResult: translation,
      threadId: "ask-thread-paused",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "lane_session_paused",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    sessionStore.resume({ laneSessionId: "lane-session-paused" });
    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-paused",
      translationResult: translation,
      threadId: "ask-thread-paused",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "missing_text",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-paused" })).toHaveLength(0);
  });
});
