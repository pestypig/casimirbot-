import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
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

describe("Helix capability lane session manager", () => {
  it("starts, pauses, resumes, records observations, and stops a translation lane session", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const started = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-1",
      nowMs: 100,
      sourceBinding: {
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      requestedBackendProvider: "google_gemini",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(started).toMatchObject({
      ok: true,
      action: "start",
      blocked_reason: null,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(started.lane_session).toMatchObject({
      schema: "helix.capability_lane.session.v1",
      lane_session_id: "lane-session-1",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        requested_backend_provider: "google_gemini",
        selected_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      status: "running",
      health: "healthy",
      source_binding: {
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      permissions: {
        read: true,
        observe: true,
        act: true,
        write: false,
        shell: false,
        code_mutation: false,
      },
      created_at_ms: 100,
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const paused = store.pause({
      laneSessionId: "lane-session-1",
      nowMs: 120,
      reason: "user_paused_translation",
    });
    expect(paused.lane_session).toMatchObject({
      status: "paused",
      health: "degraded",
      updated_at_ms: 120,
    });

    const resumed = store.resume({
      laneSessionId: "lane-session-1",
      nowMs: 130,
    });
    expect(resumed.lane_session).toMatchObject({
      status: "running",
      health: "healthy",
      updated_at_ms: 130,
    });

    const observed = store.recordObservation({
      laneSessionId: "lane-session-1",
      observationRef: "ask:lane:translation:obs",
      receiptRef: "ask:lane:translation:obs:projection:receipt",
      chunkId: "chunk-session-1",
      chunkIndex: 2,
      dedupeKey: "docs:nhm2:chunk-session-1:es",
      sourceEventId: "docs:nhm2:event-session-1",
      sourceEventMs: 111,
      observedAtMs: 140,
      freshnessStatus: "fresh",
      sourceTextHash: "sha256:text-session-1",
      sourceTextCharCount: 37,
      sourceId: "docs:nhm2",
      sourceHash: "sha256:nhm2-v1",
      targetLanguage: "es",
      projectionTarget: "docs_chunk",
      cancelRequested: true,
      nowMs: 140,
    });
    expect(observed.lane_session).toMatchObject({
      last_observation_ref: "ask:lane:translation:obs",
      last_receipt_ref: "ask:lane:translation:obs:projection:receipt",
      updated_at_ms: 140,
    });
    expect(observed).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_id: "live_translation",
      session_supported: true,
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
    });

    const receiptOnly = store.recordObservation({
      laneSessionId: "lane-session-1",
      receiptRef: "ask:lane:translation:receipt-only:projection:receipt",
      chunkId: "chunk-session-1-receipt-only",
      chunkIndex: 3,
      dedupeKey: "docs:nhm2:chunk-session-1-receipt-only:es",
      sourceEventId: "docs:nhm2:event-session-1-receipt-only",
      sourceEventMs: 141,
      observedAtMs: 145,
      freshnessStatus: "fresh",
      sourceTextHash: "sha256:text-session-1",
      sourceTextCharCount: 37,
      sourceId: "docs:nhm2",
      sourceHash: "sha256:nhm2-v1",
      targetLanguage: "es",
      projectionTarget: "docs_chunk",
      nowMs: 145,
    });
    expect(receiptOnly).toMatchObject({
      ok: true,
      action: "record_observation",
      blocked_reason: null,
      lane_session: {
        last_observation_ref: null,
        last_receipt_ref: "ask:lane:translation:receipt-only:projection:receipt",
        updated_at_ms: 145,
        debug_history: expect.arrayContaining([
          expect.objectContaining({
            action: "record_observation",
            observation_ref: null,
            receipt_ref: "ask:lane:translation:receipt-only:projection:receipt",
            terminal_authority_status: "pending_helix_terminal_authority",
            context_role: "tool_evidence",
            answer_authority: false,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      },
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const stopped = store.stop({
      laneSessionId: "lane-session-1",
      nowMs: 150,
      reason: "goal_complete",
    });
    expect(stopped.lane_session).toMatchObject({
      status: "stopped",
      health: "stopped",
      updated_at_ms: 150,
    });
    expect(stopped.lane_session?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "pause",
      "resume",
      "record_observation",
      "record_observation",
      "stop",
    ]);
    expect(stopped.lane_session?.debug_history.every((event) =>
      event.terminal_eligible === false &&
      event.assistant_answer === false &&
      event.answer_authority === false &&
      event.raw_content_included === false &&
      event.context_role === "tool_evidence" &&
      event.reentry_required === true &&
      event.terminal_authority_status !== "terminal_authority_granted"
    )).toBe(true);
    expect(stopped.lane_session?.debug_history).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.session_event.v1",
        lane_session_id: "lane-session-1",
        lane_id: "live_translation",
        selected_runtime_agent_provider: "codex",
        selected_backend_provider: "live_translation.local_runtime",
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
        action: "start",
        status: "running",
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: null,
        receipt_ref: null,
        terminal_authority_status: "not_terminal_authority",
        reentry_required: true,
        context_role: "tool_evidence",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        action: "pause",
        status: "paused",
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: null,
        receipt_ref: null,
        terminal_authority_status: "not_terminal_authority",
      }),
      expect.objectContaining({
        action: "resume",
        status: "running",
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: null,
        receipt_ref: null,
        terminal_authority_status: "not_terminal_authority",
      }),
      expect.objectContaining({
        action: "record_observation",
        status: "running",
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: "ask:lane:translation:obs",
        receipt_ref: "ask:lane:translation:obs:projection:receipt",
        chunk_id: "chunk-session-1",
        chunk_index: 2,
        dedupe_key: "docs:nhm2:chunk-session-1:es",
        source_event_id: "docs:nhm2:event-session-1",
        source_event_ms: 111,
        observed_at_ms: 140,
        freshness_status: "fresh",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        projection_target: "docs_chunk",
        cancel_requested: true,
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
      }),
      expect.objectContaining({
        action: "record_observation",
        status: "running",
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: null,
        receipt_ref: "ask:lane:translation:receipt-only:projection:receipt",
        chunk_id: "chunk-session-1-receipt-only",
        chunk_index: 3,
        dedupe_key: "docs:nhm2:chunk-session-1-receipt-only:es",
        source_event_id: "docs:nhm2:event-session-1-receipt-only",
        source_event_ms: 141,
        observed_at_ms: 145,
        freshness_status: "fresh",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        projection_target: "docs_chunk",
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
        context_role: "tool_evidence",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        action: "stop",
        status: "stopped",
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
        source_identity_key: "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
        observation_ref: null,
        receipt_ref: null,
        terminal_authority_status: "not_terminal_authority",
      }),
    ]);
    expect(store.list()).toHaveLength(1);
  });

  it("blocks unsupported or unbound sessions without creating terminal authority", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const unsupported = store.start({
      provider: buildProvider("helix"),
      laneId: "utility_text",
      sourceBinding: {
        source_id: "ask",
        source_kind: "ask_turn",
        projection_target: null,
        account_locale: null,
      },
      env: { OPENAI_API_KEY: "test-key" } as NodeJS.ProcessEnv,
    });
    const unbound = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      sourceBinding: {
        source_id: "",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(unsupported).toMatchObject({
      ok: false,
      action: "start",
      lane_id: "utility_text",
      selected_runtime_agent_provider: "helix",
      requested_backend_provider: null,
      session_supported: false,
      lane_session: null,
      blocked_reason: "capability_lane_session_not_supported",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(unbound).toMatchObject({
      ok: false,
      action: "start",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: null,
      session_supported: true,
      lane_session: null,
      blocked_reason: "missing_source_binding",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.list()).toHaveLength(0);
  });

  it("derives session target language from account locale and rejects stale identity keys", () => {
    const store = createHelixCapabilityLaneSessionStore();

    const started = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-locale-derived",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    expect(started).toMatchObject({
      ok: true,
      action: "start",
      lane_session: {
        source_binding: {
          source_id: "docs:current",
          source_hash: "sha256:current",
          source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
          source_text_hash: "sha256:text-current",
          source_text_char_count: 128,
          source_kind: "docs",
          projection_target: "docs_chunk",
          account_locale: "es-US",
          target_language: "es",
          source_identity_key:
            "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
        },
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(started.lane_session?.debug_history[0]).toMatchObject({
      action: "start",
      account_locale: "es-US",
      target_language: "es",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_identity_key:
        "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
      terminal_authority_status: "not_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-stale-identity",
      sourceIdentityKey:
        "docs:current::sha256:old::sha256:text-current::128::docs::docs_chunk::es-US::es",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 120,
    })).toMatchObject({
      ok: false,
      action: "start",
      lane_id: "live_translation",
      lane_session_id: "lane-session-stale-identity",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_identity_key:
        "docs:current::sha256:old::sha256:text-current::128::docs::docs_chunk::es-US::es",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "source_identity_key_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-stale-identity")).toBeNull();
  });

  it("fails closed when trying to resume a stopped session", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-stopped",
      sourceBinding: {
        source_id: "docs:current",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "fr-FR",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    store.stop({ laneSessionId: "lane-session-stopped" });

    expect(store.resume({ laneSessionId: "lane-session-stopped" })).toMatchObject({
      ok: false,
      action: "resume",
      lane_session: null,
      blocked_reason: "lane_session_already_stopped",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("normalizes legacy docs inline projection targets for session binding and observation matching", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const started = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-legacy-inline",
      nowMs: 100,
      sourceBinding: {
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        source_kind: "docs",
        projection_target: "docs_viewer_inline" as never,
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(started).toMatchObject({
      ok: true,
      lane_session: {
        source_binding: {
          projection_target: "docs_chunk",
          source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
          source_identity_key:
            "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
        },
      },
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-legacy-inline",
      observationRef: "obs:legacy-inline",
      receiptRef: "receipt:legacy-inline",
      sourceId: "docs:nhm2",
      sourceHash: "sha256:nhm2-v1",
      sourceTextHash: "sha256:text-session-1",
      sourceTextCharCount: 37,
      sourceKind: "docs",
      projectionTarget: "docs_viewer.inline_translation",
      targetLanguage: "es",
      nowMs: 150,
    })).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_session: {
        source_binding: {
          projection_target: "docs_chunk",
        },
      },
      projection_target: "docs_chunk",
      source_binding_key: "docs:nhm2::sha256:nhm2-v1::docs_chunk::es-US::es",
      source_identity_key:
        "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
      blocked_reason: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("normalizes legacy document source kinds for session observation matching", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const started = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-legacy-source-kind",
      nowMs: 100,
      sourceBinding: {
        source_id: "docs:nhm2",
        source_hash: "sha256:nhm2-v1",
        source_text_hash: "sha256:text-session-1",
        source_text_char_count: 37,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
    });

    expect(started.lane_session?.source_binding.source_identity_key).toBe(
      "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
    );

    expect(store.recordObservation({
      laneSessionId: "lane-session-legacy-source-kind",
      observationRef: "obs:legacy-source-kind",
      receiptRef: "receipt:legacy-source-kind",
      sourceId: "docs:nhm2",
      sourceHash: "sha256:nhm2-v1",
      sourceTextHash: "sha256:text-session-1",
      sourceTextCharCount: 37,
      sourceKind: "document_markdown" as never,
      sourceIdentityKey:
        "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::document_markdown::docs_chunk::es-US::es",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 150,
    })).toMatchObject({
      ok: true,
      action: "record_observation",
      blocked_reason: null,
      source_identity_key:
        "docs:nhm2::sha256:nhm2-v1::sha256:text-session-1::37::docs::docs_chunk::es-US::es",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed on duplicate pause or resume lifecycle controls without adding debug events", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-duplicate-controls",
      sourceBinding: {
        source_id: "docs:current",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    expect(store.resume({
      laneSessionId: "lane-session-duplicate-controls",
      nowMs: 110,
      reason: "duplicate_resume",
    })).toMatchObject({
      ok: false,
      action: "resume",
      lane_id: "live_translation",
      lane_session_id: "lane-session-duplicate-controls",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_binding_key: "docs:current::docs_chunk::es-US::es",
      source_identity_key: "docs:current::docs::docs_chunk::es-US::es",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "lane_session_already_running",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const paused = store.pause({
      laneSessionId: "lane-session-duplicate-controls",
      nowMs: 120,
      reason: "user_paused_translation",
    });
    expect(paused).toMatchObject({
      ok: true,
      action: "pause",
      blocked_reason: null,
      lane_session: {
        status: "paused",
        health: "degraded",
        updated_at_ms: 120,
      },
    });

    expect(store.pause({
      laneSessionId: "lane-session-duplicate-controls",
      nowMs: 130,
      reason: "duplicate_pause",
    })).toMatchObject({
      ok: false,
      action: "pause",
      lane_id: "live_translation",
      lane_session_id: "lane-session-duplicate-controls",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_binding_key: "docs:current::docs_chunk::es-US::es",
      source_identity_key: "docs:current::docs::docs_chunk::es-US::es",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "lane_session_already_paused",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.get("lane-session-duplicate-controls")).toMatchObject({
      status: "paused",
      updated_at_ms: 120,
    });
    expect(store.get("lane-session-duplicate-controls")?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "pause",
    ]);
  });

  it("fails closed on duplicate lane session start without replacing debug history", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-duplicate-start",
      sourceBinding: {
        source_id: "docs:current",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });
    store.pause({
      laneSessionId: "lane-session-duplicate-start",
      reason: "user_paused_translation",
      nowMs: 125,
    });

    expect(store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-duplicate-start",
      sourceBinding: {
        source_id: "docs:replacement",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "fr-FR",
        target_language: "fr",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 150,
    })).toMatchObject({
      ok: false,
      action: "start",
      lane_id: "live_translation",
      lane_session_id: "lane-session-duplicate-start",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:replacement",
      source_binding_key: "docs:replacement::docs_chunk::fr-FR::fr",
      source_identity_key: "docs:replacement::docs::docs_chunk::fr-FR::fr",
      projection_target: "docs_chunk",
      account_locale: "fr-FR",
      target_language: "fr",
      lane_session: null,
      blocked_reason: "lane_session_already_exists",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-duplicate-start")).toMatchObject({
      status: "paused",
      source_binding: {
        source_id: "docs:current",
        account_locale: "es-US",
        target_language: "es",
      },
      updated_at_ms: 125,
    });
    expect(store.get("lane-session-duplicate-start")?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "pause",
    ]);
  });

  it("fails closed when trying to record observations after a session is stopped", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-stopped-observation",
      sourceBinding: {
        source_id: "docs:current",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "fr-FR",
      },
      env: {} as NodeJS.ProcessEnv,
    });
    store.stop({ laneSessionId: "lane-session-stopped-observation", nowMs: 200 });

    expect(store.recordObservation({
      laneSessionId: "lane-session-stopped-observation",
      observationRef: "obs:late",
      receiptRef: "receipt:late",
      nowMs: 300,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      lane_session_id: "lane-session-stopped-observation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_binding_key: "docs:current::docs_chunk::fr-FR::fr",
      source_identity_key: "docs:current::docs::docs_chunk::fr-FR::fr",
      projection_target: "docs_chunk",
      account_locale: "fr-FR",
      target_language: "fr",
      lane_session: null,
      blocked_reason: "lane_session_already_stopped",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-stopped-observation")).toMatchObject({
      status: "stopped",
      updated_at_ms: 200,
      last_observation_ref: null,
      last_receipt_ref: null,
    });
  });

  it("fails closed when trying to record observations while a session is paused", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-paused-observation",
      sourceBinding: {
        source_id: "docs:current",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });
    store.pause({
      laneSessionId: "lane-session-paused-observation",
      reason: "user_paused_translation",
      nowMs: 200,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-paused-observation",
      observationRef: "obs:paused",
      receiptRef: "receipt:paused",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 300,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      lane_session_id: "lane-session-paused-observation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_binding_key: "docs:current::docs_chunk::es-US::es",
      source_identity_key: "docs:current::docs::docs_chunk::es-US::es",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "lane_session_paused",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-paused-observation")).toMatchObject({
      status: "paused",
      health: "degraded",
      updated_at_ms: 200,
      last_observation_ref: null,
      last_receipt_ref: null,
    });
    expect(store.get("lane-session-paused-observation")?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "pause",
    ]);
  });

  it("falls back to the session source-text identity when recording sparse observations", () => {
    const store = createHelixCapabilityLaneSessionStore();
    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-sparse-observation",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    const observed = store.recordObservation({
      laneSessionId: "lane-session-sparse-observation",
      observationRef: "obs:sparse",
      receiptRef: "receipt:sparse",
      sourceHash: "sha256:current",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 150,
    });

    expect(observed).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_session: {
        last_observation_ref: "obs:sparse",
        last_receipt_ref: "receipt:sparse",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observed.lane_session?.debug_history.at(-1)).toMatchObject({
      action: "record_observation",
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      source_identity_key:
        "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      observation_ref: "obs:sparse",
      receipt_ref: "receipt:sparse",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("keeps the canonical session identity when an accepted observation uses a compatible language variant", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const canonicalSourceIdentityKey =
      "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es";

    const started = store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-language-variant",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    expect(started.lane_session?.source_binding.source_identity_key).toBe(canonicalSourceIdentityKey);

    const observed = store.recordObservation({
      laneSessionId: "lane-session-language-variant",
      observationRef: "obs:variant",
      receiptRef: "receipt:variant",
      sourceHash: "sha256:current",
      sourceTextHash: "sha256:text-current",
      sourceTextCharCount: 128,
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es-US",
      nowMs: 150,
    });

    expect(observed).toMatchObject({
      ok: true,
      action: "record_observation",
      blocked_reason: null,
      lane_session: {
        source_binding: {
          target_language: "es",
          source_identity_key: canonicalSourceIdentityKey,
        },
        last_observation_ref: "obs:variant",
        last_receipt_ref: "receipt:variant",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observed.lane_session?.debug_history.at(-1)).toMatchObject({
      action: "record_observation",
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      source_identity_key: canonicalSourceIdentityKey,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es-US",
      observation_ref: "obs:variant",
      receipt_ref: "receipt:variant",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("accepts the canonical session identity when a compatible observation variant would rebuild a different key", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const canonicalSourceIdentityKey =
      "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es";

    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-canonical-identity-observation",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    const observed = store.recordObservation({
      laneSessionId: "lane-session-canonical-identity-observation",
      observationRef: "obs:canonical-variant",
      receiptRef: "receipt:canonical-variant",
      sourceIdentityKey: canonicalSourceIdentityKey,
      sourceHash: "sha256:current",
      sourceTextHash: "sha256:text-current",
      sourceTextCharCount: 128,
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es-US",
      nowMs: 150,
    });

    expect(observed).toMatchObject({
      ok: true,
      action: "record_observation",
      blocked_reason: null,
      lane_session: {
        source_binding: {
          source_identity_key: canonicalSourceIdentityKey,
        },
        last_observation_ref: "obs:canonical-variant",
        last_receipt_ref: "receipt:canonical-variant",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observed.lane_session?.debug_history.at(-1)).toMatchObject({
      source_identity_key: canonicalSourceIdentityKey,
      target_language: "es-US",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed when observation metadata does not match the lane session binding", () => {
    const store = createHelixCapabilityLaneSessionStore();
    expect(store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-wrong-binding-key",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_binding_key: "docs:old::sha256:old::docs_chunk::es-US::es",
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 90,
    })).toMatchObject({
      ok: false,
      action: "start",
      lane_session: null,
      blocked_reason: "source_binding_key_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    store.start({
      provider: buildProvider("codex"),
      laneId: "live_translation",
      laneSessionId: "lane-session-binding-guard",
      sourceBinding: {
        source_id: "docs:current",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 128,
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:old-binding-key",
      receiptRef: "receipt:old-binding-key",
      sourceHash: "sha256:current",
      sourceBindingKey: "docs:current::sha256:old::docs_chunk::es-US::es",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 188,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      lane_session_id: "lane-session-binding-guard",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_identity_key:
        "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "source_binding_key_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:other-source",
      receiptRef: "receipt:other-source",
      sourceId: "docs:other",
      sourceHash: "sha256:current",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 190,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      lane_session_id: "lane-session-binding-guard",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_identity_key:
        "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "source_id_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:old-source",
      receiptRef: "receipt:old-source",
      sourceId: "docs:current",
      sourceHash: "sha256:old",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 200,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      lane_session_id: "lane-session-binding-guard",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      source_id: "docs:current",
      source_hash: "sha256:current",
      source_binding_key: "docs:current::sha256:current::docs_chunk::es-US::es",
      source_identity_key:
        "docs:current::sha256:current::sha256:text-current::128::docs::docs_chunk::es-US::es",
      source_text_hash: "sha256:text-current",
      source_text_char_count: 128,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      lane_session: null,
      blocked_reason: "source_hash_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:hover",
      receiptRef: "receipt:hover",
      sourceHash: "sha256:current",
      projectionTarget: "docs_hover",
      targetLanguage: "es",
      nowMs: 210,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_session: null,
      blocked_reason: "projection_target_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:other-text",
      receiptRef: "receipt:other-text",
      sourceHash: "sha256:current",
      sourceTextHash: "sha256:text-other",
      sourceTextCharCount: 128,
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 215,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_session: null,
      blocked_reason: "source_text_hash_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:other-text-count",
      receiptRef: "receipt:other-text-count",
      sourceHash: "sha256:current",
      sourceTextHash: "sha256:text-current",
      sourceTextCharCount: 127,
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      nowMs: 216,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_session: null,
      blocked_reason: "source_text_char_count_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.recordObservation({
      laneSessionId: "lane-session-binding-guard",
      observationRef: "obs:french",
      receiptRef: "receipt:french",
      sourceHash: "sha256:current",
      projectionTarget: "docs_chunk",
      targetLanguage: "fr",
      nowMs: 220,
    })).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_session: null,
      blocked_reason: "target_language_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(store.get("lane-session-binding-guard")).toMatchObject({
      last_observation_ref: null,
      last_receipt_ref: null,
      updated_at_ms: 100,
    });
    expect(store.get("lane-session-binding-guard")?.debug_history).toHaveLength(1);
  });
});
