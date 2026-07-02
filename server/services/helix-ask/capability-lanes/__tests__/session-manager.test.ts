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
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
      },
      requestedBackendProvider: "google_gemini",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(started).toMatchObject({
      ok: true,
      action: "start",
      blocked_reason: null,
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
        source_kind: "docs",
        projection_target: "docs_chunk",
        account_locale: "es-US",
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
      terminal_eligible: false,
      assistant_answer: false,
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
      "stop",
    ]);
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
        observation_ref: null,
        receipt_ref: null,
        terminal_authority_status: "not_terminal_authority",
        reentry_required: true,
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
        observation_ref: "ask:lane:translation:obs",
        receipt_ref: "ask:lane:translation:obs:projection:receipt",
        chunk_id: "chunk-session-1",
        chunk_index: 2,
        dedupe_key: "docs:nhm2:chunk-session-1:es",
        source_event_id: "docs:nhm2:event-session-1",
        source_event_ms: 111,
        observed_at_ms: 140,
        freshness_status: "fresh",
        projection_target: "docs_chunk",
        cancel_requested: true,
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
      }),
      expect.objectContaining({
        action: "stop",
        status: "stopped",
        source_id: "docs:nhm2",
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
});
