import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { createHelixCapabilityLaneSessionStore } from "../session-manager";
import { runHelixCapabilityLaneSessionRequests } from "../session-runner";

const buildProvider = (input: {
  id: "helix" | "codex" | "future";
  sessions: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label:
    input.id === "helix"
      ? "Helix Ask Native"
      : input.id === "codex"
        ? "Codex Workstation Mode"
        : "Future Agent Wrapper",
  permissionProfile: {
    id: input.id === "future" ? "read-observe" : "read-observe-act",
    label: input.id === "future"
      ? "Read/observe only"
      : "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: input.id !== "future",
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: input.id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: input.sessions,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

describe("Helix capability lane session runner", () => {
  it("runs structured start, pause, resume, and observation calls through the governed session store", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-runner",
            requested_backend_provider: "google_gemini",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner",
            observation_ref: "ask:lane:translation:obs:runner",
            receipt_ref: "ask:lane:translation:receipt:runner",
            chunk_id: "chunk-runner",
            chunk_index: 4,
            dedupe_key: "docs:nhm2:chunk-runner:es",
            source_event_id: "docs:nhm2:event-runner",
            source_event_ms: 90,
            observed_at_ms: 115,
            freshness_status: "stale",
            source_text_hash: "sha256:text-runner",
            source_text_char_count: 41,
            projection_target: "docs_chunk",
            cancel_requested: true,
            now_ms: 115,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-v1",
              source_kind: "docs",
            },
          },
          {
            action: "pause",
            lane_session_id: "lane-session-runner",
            now_ms: 125,
            reason: "user_paused_translation",
          },
          {
            action: "resume",
            lane_session_id: "lane-session-runner",
            now_ms: 135,
            reason: "user_resumed_translation",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      schema: "helix.capability_lane.session_runner_result.v1",
      requested: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_results).toHaveLength(4);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: "google_gemini",
      session_supported: true,
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        lane_id: "live_translation",
        source_binding: expect.objectContaining({
          source_id: "docs:nhm2",
          source_hash: "sha256:runner-v1",
        }),
        selected_runtime_agent_provider: "codex",
        selected_backend_provider: "live_translation.local_runtime",
        backend_selection_decision: expect.objectContaining({
          outcome: "fallback_selected",
          requested_backend_provider: "google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          selected_runtime_provider_remains_root: true,
          backend_provider_becomes_root_agent: false,
          terminal_authority_owner: "helix",
        }),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: "google_gemini",
      session_supported: true,
      blocked_reason: null,
      terminal_eligible: false,
      assistant_answer: false,
      lane_session: {
        lane_session_id: "lane-session-runner",
        status: "running",
        health: "healthy",
        last_observation_ref: "ask:lane:translation:obs:runner",
        last_receipt_ref: "ask:lane:translation:receipt:runner",
        updated_at_ms: 115,
        debug_history: expect.arrayContaining([
          expect.objectContaining({
            action: "record_observation",
            source_id: "docs:nhm2",
            source_hash: "sha256:runner-v1",
            chunk_id: "chunk-runner",
            chunk_index: 4,
            dedupe_key: "docs:nhm2:chunk-runner:es",
            source_event_id: "docs:nhm2:event-runner",
            source_event_ms: 90,
            observed_at_ms: 115,
            freshness_status: "stale",
            source_text_hash: "sha256:text-runner",
            source_text_char_count: 41,
            projection_target: "docs_chunk",
            cancel_requested: true,
          }),
        ]),
      },
    });
    expect(result.session_results[2]).toMatchObject({
      ok: true,
      action: "pause",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        status: "paused",
        health: "degraded",
        updated_at_ms: 125,
      },
    });
    expect(result.session_results[3]).toMatchObject({
      ok: true,
      action: "resume",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        status: "running",
        health: "healthy",
        updated_at_ms: 135,
        last_observation_ref: "ask:lane:translation:obs:runner",
        last_receipt_ref: "ask:lane:translation:receipt:runner",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      schema: "helix.capability_lane.session_debug_summary.v1",
      lane_session_id: "lane-session-runner",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      session_status: "running",
      session_health: "healthy",
      source_id: "docs:nhm2",
      source_hash: "sha256:runner-v1",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      latest_chunk_id: "chunk-runner",
      latest_chunk_index: 4,
      latest_dedupe_key: "docs:nhm2:chunk-runner:es",
      latest_source_event_id: "docs:nhm2:event-runner",
      latest_source_event_ms: 90,
      latest_observed_at_ms: 115,
      latest_freshness_status: "stale",
      source_text_hash: "sha256:text-runner",
      source_text_char_count: 41,
      latest_projection_target: "docs_chunk",
      latest_cancel_requested: true,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_session_results).toEqual(result.session_results);
    expect(result.debug_projection.capability_lane_session_debug_summaries).toEqual(
      result.session_debug_summaries,
    );
    expect(store.get("lane-session-runner")).toMatchObject({
      status: "running",
      health: "healthy",
      last_observation_ref: "ask:lane:translation:obs:runner",
      last_receipt_ref: "ask:lane:translation:receipt:runner",
      source_binding: expect.objectContaining({
        source_hash: "sha256:runner-v1",
        target_language: "es",
      }),
    });
    expect(store.get("lane-session-runner")?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "record_observation",
      "pause",
      "resume",
    ]);
  });

  it("fails closed when the selected runtime provider does not support lane sessions", () => {
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "future", sessions: false }),
      store: createHelixCapabilityLaneSessionStore(),
      body: {
        capabilityLaneSessionCall: {
          action: "start",
          laneId: "live_translation",
          laneSessionId: "lane-session-future",
          sourceBinding: {
            sourceId: "docs:nhm2",
            sourceKind: "docs",
          },
        },
      },
    });

    expect(result).toMatchObject({
      requested: true,
      session_results: [
        {
          ok: false,
          action: "start",
          lane_id: "live_translation",
          selected_runtime_agent_provider: "future",
          requested_backend_provider: null,
          session_supported: null,
          lane_session: null,
          blocked_reason: "runtime_provider_capability_lane_sessions_not_supported",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      session_debug_summaries: [],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("keeps stopped sessions closed when a structured late observation arrives", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-runner-stopped",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-stop-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "stop",
            lane_session_id: "lane-session-runner-stopped",
            now_ms: 120,
            reason: "user_stopped_translation",
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-stopped",
            observation_ref: "ask:lane:translation:obs:late",
            receipt_ref: "ask:lane:translation:receipt:late",
            now_ms: 140,
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(3);
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "stop",
      lane_session: {
        lane_session_id: "lane-session-runner-stopped",
        status: "stopped",
        health: "stopped",
        updated_at_ms: 120,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_results[2]).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      lane_session: null,
      blocked_reason: "lane_session_already_stopped",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_session_results).toEqual(result.session_results);
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      lane_session_id: "lane-session-runner-stopped",
      session_status: "stopped",
      session_health: "stopped",
      last_observation_ref: null,
      last_receipt_ref: null,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-stopped")).toMatchObject({
      status: "stopped",
      updated_at_ms: 120,
      last_observation_ref: null,
      last_receipt_ref: null,
    });
  });

  it("fails closed when a structured observation targets the wrong session language", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-runner-language",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-language-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-language",
            observation_ref: "ask:lane:translation:obs:wrong-language",
            receipt_ref: "ask:lane:translation:receipt:wrong-language",
            projection_target: "docs_chunk",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-language-v1",
              source_kind: "docs",
              target_language: "fr",
            },
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[1]).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      lane_session: null,
      blocked_reason: "target_language_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-language")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        target_language: "es",
      }),
    });
    expect(store.get("lane-session-runner-language")?.debug_history.map((event) => event.action)).toEqual([
      "start",
    ]);
    expect(result.session_debug_summaries).toHaveLength(1);
    expect(result.session_debug_summaries[0]).toMatchObject({
      lane_session_id: "lane-session-runner-language",
      session_status: "running",
      target_language: "es",
      last_observation_ref: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed when a structured observation targets the wrong session source", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-runner-source",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-source",
            observation_ref: "ask:lane:translation:obs:wrong-source",
            receipt_ref: "ask:lane:translation:receipt:wrong-source",
            projection_target: "docs_chunk",
            now_ms: 140,
            source_binding: {
              source_id: "docs:other",
              source_hash: "sha256:runner-source-v1",
              source_kind: "docs",
              target_language: "es",
            },
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[1]).toMatchObject({
      ok: false,
      action: "record_observation",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      lane_session: null,
      blocked_reason: "source_id_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-source")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        source_id: "docs:nhm2",
        source_hash: "sha256:runner-source-v1",
        target_language: "es",
      }),
    });
    expect(store.get("lane-session-runner-source")?.debug_history.map((event) => event.action)).toEqual([
      "start",
    ]);
    expect(result.session_debug_summaries).toHaveLength(1);
    expect(result.session_debug_summaries[0]).toMatchObject({
      lane_session_id: "lane-session-runner-source",
      session_status: "running",
      source_id: "docs:nhm2",
      source_hash: "sha256:runner-source-v1",
      target_language: "es",
      last_observation_ref: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
