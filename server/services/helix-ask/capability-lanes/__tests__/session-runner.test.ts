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
  it("runs structured start and pause calls through the governed session store", () => {
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
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
            },
          },
          {
            action: "pause",
            lane_session_id: "lane-session-runner",
            now_ms: 125,
            reason: "user_paused_translation",
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
    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        lane_id: "live_translation",
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
      action: "pause",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        status: "paused",
        health: "degraded",
        updated_at_ms: 125,
      },
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      schema: "helix.capability_lane.session_debug_summary.v1",
      lane_session_id: "lane-session-runner",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      session_status: "paused",
      session_health: "degraded",
      source_id: "docs:nhm2",
      projection_target: "docs_chunk",
      account_locale: "es-US",
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
      status: "paused",
      health: "degraded",
    });
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
});
