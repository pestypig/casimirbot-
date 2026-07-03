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
        source_hash: "sha256:nhm2-mail-v1",
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
        source_hash: "sha256:nhm2-mail-v1",
        chunk_id: "chunk-1",
        chunk_index: 1,
        dedupe_key: "docs:nhm2:chunk-1:es",
        source_event_id: "docs:nhm2:event-1",
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
        stage_play_mail_delivery_status: "created",
        previous_stage_play_mail_id: null,
        mailbox_thread_id: "ask-thread-mail",
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-mail-v1",
        source_kind: "document_markdown",
        account_locale: "es-US",
        lane_session_source_id: "docs:nhm2",
        lane_session_source_hash: "sha256:nhm2-mail-v1",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        chunk_id: "chunk-1",
        chunk_index: 1,
        dedupe_key: "docs:nhm2:chunk-1:es",
        source_event_id: "docs:nhm2:event-1",
        observed_at_ms: expect.any(Number),
        projection_target: "docs_chunk",
        target_language: "es",
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
        sourceHash: "sha256:nhm2-mail-v1",
        chunkId: "chunk-1",
        dedupeKey: "docs:nhm2:chunk-1:es",
        sourceEventId: "docs:nhm2:event-1",
        projectionTarget: "docs_chunk",
        targetLanguage: "es",
        accountLocale: "es-US",
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
    expect([
      routed,
      routed.debug_summary,
      routed.mail,
    ].every((entry) =>
      entry?.terminal_eligible === false &&
      entry?.assistant_answer === false &&
      entry?.raw_content_included === false
    )).toBe(true);
    expect(routed.debug_summary).toMatchObject({
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
    });
    expect(routed.mail?.summary.analysisState).toBe("analysis_ready");
    expect(routed.mail?.summary.text).toContain("Capability lane live_translation produced en -> es.");
    expect(routed.mail?.summary.text).toContain("Lane session: lane-session-mail.");
    expect(routed.mail?.summary.text).toContain("Projection target: docs_chunk.");
    expect(routed.mail?.summary.text).toContain("Chunk: chunk-1.");
    expect(routed.mail?.summary.text).toContain("Translation: hola");
    expect(routed.mail?.evidenceRefs).toEqual(expect.arrayContaining([
      "lane-session-mail",
      "docs:nhm2",
      "sha256:nhm2-mail-v1",
      "chunk-1",
      "docs:nhm2:event-1",
      translation.observation?.observation_ref,
      receiptRef,
      "live_translation.local_runtime",
      "google_gemini",
    ]));
    expect(routed.debug_summary.stage_play_mail_id).toBe(routed.mail?.mailId);
    expect(routed.debug_summary.stage_play_mail_delivery_status).toBe("created");
    expect(routed.debug_summary.previous_stage_play_mail_id).toBeNull();
    expect(routed.debug_summary.evidence_refs).toEqual(routed.mail?.evidenceRefs);
    expect(routed.debug_summary).toMatchObject({
      receipt_ref: receiptRef,
      source_hash: "sha256:nhm2-mail-v1",
      account_locale: "es-US",
      selected_backend_provider: "live_translation.local_runtime",
      requested_backend_provider: "google_gemini",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      chunk_index: 1,
      dedupe_key: "docs:nhm2:chunk-1:es",
      source_event_id: "docs:nhm2:event-1",
      source_event_ms: null,
      observed_at_ms: expect.any(Number),
      source_text_hash: translation.observation?.source_text_hash,
      source_text_char_count: "hello".length,
      cancel_requested: false,
    });
    expect(sessionStore.get("lane-session-mail")?.last_observation_ref).toBe(routed.mail?.mailId);
    expect(sessionStore.get("lane-session-mail")?.last_receipt_ref).toBe(receiptRef);
    expect(sessionStore.get("lane-session-mail")?.debug_history.at(-1)).toMatchObject({
      source_hash: "sha256:nhm2-mail-v1",
      target_language: "es",
      chunk_id: "chunk-1",
      source_event_id: "docs:nhm2:event-1",
    });
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
        stage_play_mail_delivery_status: "blocked",
        previous_stage_play_mail_id: null,
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

  it("fails closed when a translation observation source id does not match the lane session source", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-source-id",
      sourceBinding: {
        source_id: "docs:active",
        source_hash: "sha256:active-v1",
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
        lane_session_id: "lane-session-source-id",
        source_language: "en",
        target_language: "es",
        source_id: "docs:old",
        source_hash: "sha256:active-v1",
        chunk_id: "chunk-source-id",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-source-id",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-source-id",
      translationResult: translation,
      threadId: "ask-thread-source-id",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "source_id_mismatch",
      debug_summary: {
        blocked_reason: "source_id_mismatch",
        stage_play_mail_delivery_status: "blocked",
        previous_stage_play_mail_id: null,
        source_id: "docs:old",
        source_hash: "sha256:active-v1",
        lane_session_source_id: "docs:active",
        lane_session_source_hash: "sha256:active-v1",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        source_kind: "document_markdown",
        projection_target: "docs_chunk",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sessionStore.get("lane-session-source-id")?.last_observation_ref).toBeNull();
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-source-id" })).toHaveLength(0);
  });

  it("fails closed when a translation observation source hash does not match the lane session source hash", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-source-hash",
      sourceBinding: {
        source_id: "docs:active",
        source_hash: "sha256:active-v2",
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
        lane_session_id: "lane-session-source-hash",
        source_language: "en",
        target_language: "es",
        source_id: "docs:active",
        source_hash: "sha256:old-document",
        chunk_id: "chunk-source-hash",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-source-hash",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-source-hash",
      translationResult: translation,
      threadId: "ask-thread-source-hash",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "source_hash_mismatch",
      debug_summary: {
        blocked_reason: "source_hash_mismatch",
        stage_play_mail_delivery_status: "blocked",
        previous_stage_play_mail_id: null,
        source_id: "docs:active",
        source_hash: "sha256:old-document",
        lane_session_source_id: "docs:active",
        lane_session_source_hash: "sha256:active-v2",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        source_kind: "document_markdown",
        projection_target: "docs_chunk",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sessionStore.get("lane-session-source-hash")?.last_observation_ref).toBeNull();
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-source-hash" })).toHaveLength(0);
  });

  it("fails closed when a translation observation projection target does not match the lane session binding", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-projection-target",
      sourceBinding: {
        source_id: "docs:active",
        source_hash: "sha256:active-v3",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "hello",
        lane_session_id: "lane-session-projection-target",
        source_language: "en",
        target_language: "es",
        source_id: "docs:active",
        source_hash: "sha256:active-v3",
        chunk_id: "chunk-hover",
        projection_target: "docs_hover",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-projection-target",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-projection-target",
      translationResult: translation,
      threadId: "ask-thread-projection-target",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "projection_target_mismatch",
      debug_summary: {
        blocked_reason: "projection_target_mismatch",
        stage_play_mail_delivery_status: "blocked",
        source_id: "docs:active",
        source_hash: "sha256:active-v3",
        lane_session_source_id: "docs:active",
        lane_session_source_hash: "sha256:active-v3",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        projection_target: "docs_hover",
        target_language: "es",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sessionStore.get("lane-session-projection-target")?.last_observation_ref).toBeNull();
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-projection-target" })).toHaveLength(0);
  });

  it("fails closed when a translation observation target language does not match the lane session binding", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-target-language",
      sourceBinding: {
        source_id: "docs:active",
        source_hash: "sha256:active-v4",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "hello",
        lane_session_id: "lane-session-target-language",
        source_language: "en",
        target_language: "fr",
        source_id: "docs:active",
        source_hash: "sha256:active-v4",
        chunk_id: "chunk-fr",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-target-language",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-target-language",
      translationResult: translation,
      threadId: "ask-thread-target-language",
    })).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "target_language_mismatch",
      debug_summary: {
        blocked_reason: "target_language_mismatch",
        stage_play_mail_delivery_status: "blocked",
        source_id: "docs:active",
        source_hash: "sha256:active-v4",
        lane_session_source_id: "docs:active",
        lane_session_source_hash: "sha256:active-v4",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        projection_target: "docs_chunk",
        target_language: "fr",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sessionStore.get("lane-session-target-language")?.last_observation_ref).toBeNull();
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-target-language" })).toHaveLength(0);
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
    expect(first.debug_summary.stage_play_mail_delivery_status).toBe("created");
    expect(first.debug_summary.previous_stage_play_mail_id).toBeNull();
    expect(duplicate.debug_summary.stage_play_mail_delivery_status).toBe("deduped_existing");
    expect(duplicate.debug_summary.previous_stage_play_mail_id).toBe(first.mail?.mailId);
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
      source_text_hash: translation.observation?.source_text_hash,
      source_text_char_count: "thank you".length,
      cancel_requested: false,
    });
    expect(duplicate.debug_summary).toMatchObject({
      receipt_ref: receiptRef,
      stage_play_mail_id: first.mail?.mailId,
      stage_play_mail_delivery_status: "deduped_existing",
      previous_stage_play_mail_id: first.mail?.mailId,
      chunk_id: "chunk-stale",
      freshness_status: "stale",
      source_text_hash: translation.observation?.source_text_hash,
      source_text_char_count: "thank you".length,
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
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

  it("fails closed when a stopped lane session receives a translation observation", () => {
    const provider = buildProvider("codex");
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider,
      laneId: "live_translation",
      laneSessionId: "lane-session-stopped-mail",
      sourceBinding: {
        source_id: "docs:stopped",
        source_hash: "sha256:stopped-v1",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    sessionStore.stop({
      laneSessionId: "lane-session-stopped-mail",
      nowMs: 200,
      reason: "user_stopped_translation",
    });
    const translation = runLiveTranslationTranslateText({
      provider,
      request: {
        schema: "helix.live_translation.one_shot_request.v1",
        capability: "live_translation.translate_text",
        text: "hello",
        lane_session_id: "lane-session-stopped-mail",
        source_language: "en",
        target_language: "es",
        source_id: "docs:stopped",
        source_hash: "sha256:stopped-v1",
        chunk_id: "chunk-stopped",
        projection_target: "docs_chunk",
        assistant_answer: false,
        terminal_eligible: false,
      },
      turnId: "turn-mail-loop-stopped",
      env: {} as NodeJS.ProcessEnv,
    });

    const routed = routeLiveTranslationObservationToMailLoop({
      sessionStore,
      laneSessionId: "lane-session-stopped-mail",
      translationResult: translation,
      threadId: "ask-thread-stopped",
    });

    expect(routed).toMatchObject({
      ok: false,
      mail: null,
      stage_play_mail_id: null,
      stage_play_wake_expected: false,
      blocked_reason: "lane_session_stopped",
      debug_summary: {
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-stopped-mail",
        stage_play_mail_id: null,
        stage_play_mail_delivery_status: "blocked",
        previous_stage_play_mail_id: null,
        stage_play_wake_expected: false,
        source_id: "docs:stopped",
        source_hash: "sha256:stopped-v1",
        lane_session_source_id: "docs:stopped",
        lane_session_source_hash: "sha256:stopped-v1",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        account_locale: "es-US",
        chunk_id: "chunk-stopped",
        blocked_reason: "lane_session_stopped",
        terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sessionStore.get("lane-session-stopped-mail")).toMatchObject({
      status: "stopped",
      last_observation_ref: null,
      last_receipt_ref: null,
    });
    expect(listStagePlayLiveSourceMailItems({ threadId: "ask-thread-stopped" })).toHaveLength(0);
  });
});
