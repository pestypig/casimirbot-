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
  it("lists existing sessions without mutating lifecycle history", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const provider = buildProvider({ id: "codex", sessions: true });

    const started = runHelixCapabilityLaneSessionRequests({
      provider,
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-listable",
          now_ms: 100,
          source_binding: {
            source_id: "docs:listable",
            source_hash: "sha256:listable",
            source_text_hash: "sha256:listable-text",
            source_text_char_count: 64,
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
        },
      },
    });

    expect(started.session_debug_summaries).toHaveLength(1);
    expect(started.session_debug_summaries[0]).toMatchObject({
      lane_session_id: "lane-session-listable",
      session_event_count: 1,
      session_lifecycle_action: "start",
    });

    const listed = runHelixCapabilityLaneSessionRequests({
      provider,
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: {
          action: "list",
          lane_session_id: "lane-session-listable",
        },
      },
    });

    expect(listed).toMatchObject({
      schema: "helix.capability_lane.session_runner_result.v1",
      requested: true,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(listed.session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "list",
        lane_session_id: "lane-session-listable",
        selected_runtime_agent_provider: "codex",
        session_supported: true,
        lane_session: null,
        blocked_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(listed.session_debug_summaries).toHaveLength(1);
    expect(listed.session_debug_summaries[0]).toMatchObject({
      lane_session_id: "lane-session-listable",
      lane_id: "live_translation",
      session_status: "running",
      session_health: "healthy",
      session_event_count: 1,
      session_lifecycle_action: "start",
      source_id: "docs:listable",
      source_hash: "sha256:listable",
      source_text_hash: "sha256:listable-text",
      source_text_char_count: 64,
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-listable")?.debug_history.map((event) => event.action)).toEqual(["start"]);
  });

  it("scopes read-only session lists by source identity without exposing unrelated persistent sessions", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const provider = buildProvider({ id: "codex", sessions: true });
    const currentIdentity =
      "docs:listable::sha256:current::sha256:text-current::64::docs::docs_chunk::es-US::es";
    const otherIdentity =
      "docs:listable::sha256:other::sha256:text-other::64::docs::docs_chunk::es-US::es";

    runHelixCapabilityLaneSessionRequests({
      provider,
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-current-source",
            now_ms: 100,
            source_binding: {
              source_id: "docs:listable",
              source_hash: "sha256:current",
              source_text_hash: "sha256:text-current",
              source_text_char_count: 64,
              source_identity_key: currentIdentity,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-other-source",
            now_ms: 110,
            source_binding: {
              source_id: "docs:listable",
              source_hash: "sha256:other",
              source_text_hash: "sha256:text-other",
              source_text_char_count: 64,
              source_identity_key: otherIdentity,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
        ],
      },
    });

    const listed = runHelixCapabilityLaneSessionRequests({
      provider,
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: {
          action: "list",
          lane_id: "live_translation",
          source_id: "docs:listable",
          latest_source_identity_key: currentIdentity,
        },
      },
    });

    expect(listed.session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "list",
        lane_id: "live_translation",
        lane_session: null,
        blocked_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(listed.session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-current-source",
        source_id: "docs:listable",
        source_hash: "sha256:current",
        source_text_hash: "sha256:text-current",
        source_text_char_count: 64,
        source_identity_key: currentIdentity,
        session_event_count: 1,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(store.get("lane-session-current-source")?.debug_history.map((event) => event.action)).toEqual(["start"]);
    expect(store.get("lane-session-other-source")?.debug_history.map((event) => event.action)).toEqual(["start"]);
  });

  it("treats list as read-only instead of falling back to start", () => {
    const store = createHelixCapabilityLaneSessionStore();

    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: {
          action: "list",
        },
      },
    });

    expect(result.session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "list",
        lane_id: null,
        lane_session_id: null,
        session_supported: true,
        lane_session: null,
        blocked_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(result.session_debug_summaries).toEqual([]);
    expect(store.list()).toEqual([]);
  });

  it("runs structured start, observation, pause, resume, and stop calls through the governed session store", () => {
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
              source_binding_key: "docs:nhm2::sha256:runner-v1::docs_chunk::es-US::es",
              source_text_hash: "sha256:text-runner",
              source_text_char_count: 41,
              source_identity_key:
                "docs:nhm2::sha256:runner-v1::sha256:text-runner::41::docs::docs_chunk::es-US::es",
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
            source_identity_key:
              "docs:nhm2::sha256:runner-v1::sha256:text-runner::41::docs::docs_chunk::es-US::es",
            projection_target: "docs_chunk",
            cancel_requested: true,
            now_ms: 115,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-v1",
              source_binding_key: "docs:nhm2::sha256:runner-v1::docs_chunk::es-US::es",
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
          {
            action: "stop",
            lane_session_id: "lane-session-runner",
            now_ms: 145,
            reason: "user_stopped_translation",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      schema: "helix.capability_lane.session_runner_result.v1",
      requested: true,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_results).toHaveLength(5);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: "google_gemini",
      session_supported: true,
      blocked_reason: null,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      lane_session: {
        lane_session_id: "lane-session-runner",
        lane_id: "live_translation",
        source_binding: expect.objectContaining({
          source_id: "docs:nhm2",
          source_hash: "sha256:runner-v1",
          source_binding_key: "docs:nhm2::sha256:runner-v1::docs_chunk::es-US::es",
          source_text_hash: "sha256:text-runner",
          source_text_char_count: 41,
          source_identity_key:
            "docs:nhm2::sha256:runner-v1::sha256:text-runner::41::docs::docs_chunk::es-US::es",
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
        context_role: "tool_evidence",
        answer_authority: false,
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
      answer_authority: false,
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
            source_binding_key: "docs:nhm2::sha256:runner-v1::docs_chunk::es-US::es",
            source_identity_key:
              "docs:nhm2::sha256:runner-v1::sha256:text-runner::41::docs::docs_chunk::es-US::es",
            source_kind: "docs",
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
    expect(result.session_results[4]).toMatchObject({
      ok: true,
      action: "stop",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner",
        status: "stopped",
        health: "stopped",
        updated_at_ms: 145,
        last_observation_ref: "ask:lane:translation:obs:runner",
        last_receipt_ref: "ask:lane:translation:receipt:runner",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries[3]).toMatchObject({
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
      session_control_key: "lane-session-runner::docs:nhm2::sha256:runner-v1::docs_chunk::es-US::es",
      latest_chunk_id: "chunk-runner",
      latest_chunk_index: 4,
      latest_source_id: "docs:nhm2",
      latest_source_hash: "sha256:runner-v1",
      latest_source_kind: "docs",
      latest_dedupe_key: "docs:nhm2:chunk-runner:es",
      latest_source_event_id: "docs:nhm2:event-runner",
      latest_source_event_ms: 90,
      latest_observed_at_ms: 115,
      latest_freshness_status: "stale",
      source_text_hash: "sha256:text-runner",
      source_text_char_count: 41,
      latest_projection_target: "docs_chunk",
      latest_cancel_requested: true,
      latest_observation_key:
        "docs:nhm2::sha256:runner-v1::docs::docs_chunk::es-US::es::chunk-runner::ask:lane:translation:receipt:runner",
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      schema: "helix.capability_lane.session_debug_summary.v1",
      lane_session_id: "lane-session-runner",
      lane_id: "live_translation",
      lifecycle_action: "stop",
      session_lifecycle_action: "stop",
      session_action: "stop",
      latest_session_reason: "user_stopped_translation",
      session_status: "stopped",
      session_health: "stopped",
      last_observation_ref: "ask:lane:translation:obs:runner",
      last_receipt_ref: "ask:lane:translation:receipt:runner",
      latest_event_id: "lane-session-runner:stop:145",
      session_event_count: 5,
      has_observation: true,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_session_results).toEqual(result.session_results);
    expect(result.debug_projection.capability_lane_session_debug_summaries).toEqual(
      result.session_debug_summaries,
    );
    expect(store.get("lane-session-runner")).toMatchObject({
      status: "stopped",
      health: "stopped",
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
      "stop",
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
          lane_session_id: "lane-session-future",
          selected_runtime_agent_provider: "future",
          requested_backend_provider: null,
          session_supported: null,
          source_id: "docs:nhm2",
          lane_session: null,
          blocked_reason: "runtime_provider_capability_lane_sessions_not_supported",
          answer_authority: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      session_debug_summaries: [],
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("accepts latest source identity key aliases in runtime session calls", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const latestSourceIdentityKey =
      "docs:nhm2::sha256:runner-latest::sha256:text-latest::43::docs::docs_chunk::es-US::es";
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-latest-source-identity",
            now_ms: 200,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-latest",
              source_text_hash: "sha256:text-latest",
              source_text_char_count: 43,
              latest_source_identity_key: latestSourceIdentityKey,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-latest-source-identity",
            observation_ref: "ask:lane:translation:obs:latest",
            receipt_ref: "ask:lane:translation:receipt:latest",
            latest_source_identity_key: latestSourceIdentityKey,
            source_hash: "sha256:runner-latest",
            source_text_hash: "sha256:text-latest",
            source_text_char_count: 43,
            source_kind: "docs",
            projection_target: "docs_chunk",
            target_language: "es",
            observed_at_ms: 225,
            now_ms: 225,
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      lane_session: {
        lane_session_id: "lane-session-latest-source-identity",
        source_binding: expect.objectContaining({
          source_identity_key: latestSourceIdentityKey,
        }),
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_session: {
        lane_session_id: "lane-session-latest-source-identity",
        last_observation_ref: "ask:lane:translation:obs:latest",
        last_receipt_ref: "ask:lane:translation:receipt:latest",
        debug_history: expect.arrayContaining([
          expect.objectContaining({
            action: "record_observation",
            source_identity_key: latestSourceIdentityKey,
            terminal_authority_status: "pending_helix_terminal_authority",
            answer_authority: false,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      },
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      lane_session_id: "lane-session-latest-source-identity",
      source_identity_key: latestSourceIdentityKey,
      latest_source_identity_key: latestSourceIdentityKey,
      has_observation: true,
      terminal_authority_status: "pending_helix_terminal_authority",
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed on duplicate lifecycle controls from structured runtime session calls", () => {
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
            lane_session_id: "lane-session-duplicate-runner-controls",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-controls",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "resume",
            lane_session_id: "lane-session-duplicate-runner-controls",
            now_ms: 110,
            reason: "duplicate_resume",
          },
          {
            action: "pause",
            lane_session_id: "lane-session-duplicate-runner-controls",
            now_ms: 120,
            reason: "user_paused_translation",
          },
          {
            action: "pause",
            lane_session_id: "lane-session-duplicate-runner-controls",
            now_ms: 130,
            reason: "duplicate_pause",
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(4);
    expect(result.session_results[1]).toMatchObject({
      ok: false,
      action: "resume",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      lane_session: null,
      blocked_reason: "lane_session_already_running",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_results[2]).toMatchObject({
      ok: true,
      action: "pause",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-duplicate-runner-controls",
        status: "paused",
        updated_at_ms: 120,
      },
    });
    expect(result.session_results[3]).toMatchObject({
      ok: false,
      action: "pause",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      session_supported: true,
      lane_session: null,
      blocked_reason: "lane_session_already_paused",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries).toHaveLength(4);
    expect(result.session_debug_summaries.map((summary) => summary.session_lifecycle_action)).toEqual([
      "start",
      "start",
      "pause",
      "pause",
    ]);
    expect(result.session_debug_summaries.map((summary) => summary.session_status)).toEqual([
      "running",
      "running",
      "paused",
      "paused",
    ]);
    expect(result.session_debug_summaries.map((summary) => summary.latest_session_reason)).toEqual([
      "lane_session_started",
      "lane_session_started",
      "user_paused_translation",
      "user_paused_translation",
    ]);
    expect(store.get("lane-session-duplicate-runner-controls")?.debug_history.map((event) => event.action)).toEqual([
      "start",
      "pause",
    ]);
  });

  it("fails closed for malformed session lifecycle calls without creating summaries or answer authority", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_session_id: "lane-session-missing-lane",
            source_binding: {
              source_id: "docs:nhm2",
              source_kind: "docs",
            },
          },
          {
            action: "pause",
            lane_id: "live_translation",
            reason: "missing session id should not pause anything",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      schema: "helix.capability_lane.session_runner_result.v1",
      requested: true,
      session_results: [
        {
          ok: false,
          action: "start",
          lane_id: null,
          lane_session_id: "lane-session-missing-lane",
          selected_runtime_agent_provider: "codex",
          requested_backend_provider: null,
          session_supported: null,
          source_id: "docs:nhm2",
          lane_session: null,
          blocked_reason: "missing_capability_lane",
          answer_authority: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        {
          ok: false,
          action: "pause",
          lane_id: "live_translation",
          lane_session_id: null,
          selected_runtime_agent_provider: "codex",
          requested_backend_provider: null,
          session_supported: null,
          lane_session: null,
          blocked_reason: "missing_lane_session_id",
          answer_authority: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      session_debug_summaries: [],
      debug_projection: {
        capability_lane_session_debug_summaries: [],
      },
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.debug_projection.capability_lane_session_results).toEqual(result.session_results);
    expect(store.list()).toEqual([]);
  });

  it("accepts flat source fields from runtime adapter session calls", () => {
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
            lane_session_id: "lane-session-runner-flat",
            now_ms: 100,
            source_id: "docs:flat",
            source_hash: "sha256:flat-v1",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-flat",
            observation_ref: "ask:lane:translation:obs:flat",
            receipt_ref: "ask:lane:translation:receipt:flat",
            source_id: "docs:flat",
            source_hash: "sha256:flat-v1",
            source_kind: "docs",
            projection_target: "docs_chunk",
            target_language: "es",
            chunk_id: "chunk-flat",
            chunk_index: 1,
            dedupe_key: "docs:flat:chunk-flat:es",
            source_event_id: "docs:flat:event-1",
            source_event_ms: 95,
            observed_at_ms: 120,
            freshness_status: "fresh",
            now_ms: 120,
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      lane_session: {
        lane_session_id: "lane-session-runner-flat",
        source_binding: {
          source_id: "docs:flat",
          source_hash: "sha256:flat-v1",
          source_kind: "docs",
          projection_target: "docs_chunk",
          account_locale: "es-US",
          target_language: "es",
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_session: {
        lane_session_id: "lane-session-runner-flat",
        last_observation_ref: "ask:lane:translation:obs:flat",
        last_receipt_ref: "ask:lane:translation:receipt:flat",
        debug_history: expect.arrayContaining([
          expect.objectContaining({
            action: "record_observation",
            source_id: "docs:flat",
            source_hash: "sha256:flat-v1",
            source_identity_key: "docs:flat::sha256:flat-v1::docs::docs_chunk::es-US::es",
            source_kind: "docs",
            target_language: "es",
            projection_target: "docs_chunk",
            chunk_id: "chunk-flat",
            chunk_index: 1,
            dedupe_key: "docs:flat:chunk-flat:es",
            source_event_id: "docs:flat:event-1",
            source_event_ms: 95,
            observed_at_ms: 120,
            freshness_status: "fresh",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      lane_session_id: "lane-session-runner-flat",
      source_id: "docs:flat",
      source_hash: "sha256:flat-v1",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      session_control_key: "lane-session-runner-flat::docs:flat::sha256:flat-v1::docs_chunk::es-US::es",
      latest_chunk_id: "chunk-flat",
      latest_source_hash: "sha256:flat-v1",
      latest_target_language: "es",
      latest_projection_target: "docs_chunk",
      last_observation_ref: "ask:lane:translation:obs:flat",
      last_receipt_ref: "ask:lane:translation:receipt:flat",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-flat")).toMatchObject({
      source_binding: expect.objectContaining({
        source_id: "docs:flat",
        source_hash: "sha256:flat-v1",
        target_language: "es",
      }),
      last_observation_ref: "ask:lane:translation:obs:flat",
      last_receipt_ref: "ask:lane:translation:receipt:flat",
    });
  });

  it("normalizes Stage Play live-source kinds in runtime adapter session calls", () => {
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
            lane_session_id: "lane-session-stage-play-kind",
            now_ms: 100,
            source_id: "docs:stage-play-kind",
            source_hash: "sha256:stage-play-kind-v1",
            source_kind: "document_markdown",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-stage-play-kind",
            observation_ref: "ask:lane:translation:obs:stage-play-kind",
            receipt_ref: "ask:lane:translation:receipt:stage-play-kind",
            source_id: "docs:stage-play-kind",
            source_hash: "sha256:stage-play-kind-v1",
            source_kind: "document_markdown",
            projection_target: "docs_chunk",
            target_language: "es",
            chunk_id: "chunk-stage-play-kind",
            now_ms: 120,
          },
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-stage-play-audio-kind",
            now_ms: 130,
            source_id: "audio:stage-play-kind",
            source_hash: "sha256:stage-play-audio-kind-v1",
            source_kind: "audio_transcript",
            projection_target: "audio_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-stage-play-audio-kind",
            observation_ref: "ask:lane:translation:obs:stage-play-audio-kind",
            receipt_ref: "ask:lane:translation:receipt:stage-play-audio-kind",
            source_id: "audio:stage-play-kind",
            source_hash: "sha256:stage-play-audio-kind-v1",
            source_kind: "audio_transcript",
            projection_target: "audio_chunk",
            target_language: "es",
            chunk_id: "audio-chunk-stage-play-kind",
            now_ms: 140,
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(4);
    expect(result.session_results[0]).toMatchObject({
      ok: true,
      action: "start",
      lane_session: {
        source_binding: expect.objectContaining({
          source_id: "docs:stage-play-kind",
          source_hash: "sha256:stage-play-kind-v1",
          source_kind: "docs",
          projection_target: "docs_chunk",
        }),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "record_observation",
      lane_session: {
        debug_history: expect.arrayContaining([
          expect.objectContaining({
            action: "record_observation",
            source_id: "docs:stage-play-kind",
            source_hash: "sha256:stage-play-kind-v1",
            source_kind: "docs",
            source_identity_key: "docs:stage-play-kind::sha256:stage-play-kind-v1::docs::docs_chunk::es-US::es",
            projection_target: "docs_chunk",
            terminal_authority_status: "pending_helix_terminal_authority",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries.at(-1)).toMatchObject({
      lane_session_id: "lane-session-stage-play-audio-kind",
      source_kind: "audio",
      latest_source_kind: "audio",
      latest_projection_target: "audio_chunk",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries.find((summary) =>
      summary.lane_session_id === "lane-session-stage-play-kind" &&
      summary.latest_source_kind === "docs" &&
      summary.terminal_authority_status === "pending_helix_terminal_authority",
    )).toMatchObject({
      lane_session_id: "lane-session-stage-play-kind",
      source_kind: "docs",
      latest_source_kind: "docs",
      latest_projection_target: "docs_chunk",
      terminal_authority_status: "pending_helix_terminal_authority",
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

  it("records a structured observation with canonical session identity and a compatible language variant", () => {
    const store = createHelixCapabilityLaneSessionStore();
    const canonicalSourceIdentityKey =
      "docs:nhm2::sha256:runner-language-variant-v1::sha256:runner-language-variant-text::72::docs::docs_chunk::es-US::es";

    const result = runHelixCapabilityLaneSessionRequests({
      provider: buildProvider({ id: "codex", sessions: true }),
      store,
      env: {} as NodeJS.ProcessEnv,
      body: {
        capability_lane_session_call: [
          {
            action: "start",
            lane_id: "live_translation",
            lane_session_id: "lane-session-runner-language-variant",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-language-variant-v1",
              source_text_hash: "sha256:runner-language-variant-text",
              source_text_char_count: 72,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-language-variant",
            observation_ref: "ask:lane:translation:obs:language-variant",
            receipt_ref: "ask:lane:translation:receipt:language-variant",
            projection_target: "docs_chunk",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-language-variant-v1",
              source_identity_key: canonicalSourceIdentityKey,
              source_kind: "docs",
              account_locale: "es-US",
              target_language: "es-US",
            },
          },
        ],
      },
    });

    expect(result.session_results).toHaveLength(2);
    expect(result.session_results[1]).toMatchObject({
      ok: true,
      action: "record_observation",
      blocked_reason: null,
      lane_session: {
        lane_session_id: "lane-session-runner-language-variant",
        source_binding: expect.objectContaining({
          target_language: "es",
          source_identity_key: canonicalSourceIdentityKey,
        }),
        last_observation_ref: "ask:lane:translation:obs:language-variant",
        last_receipt_ref: "ask:lane:translation:receipt:language-variant",
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-language-variant")?.debug_history.at(-1)).toMatchObject({
      action: "record_observation",
      source_identity_key: canonicalSourceIdentityKey,
      target_language: "es-US",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.session_debug_summaries[1]).toMatchObject({
      lane_session_id: "lane-session-runner-language-variant",
      source_identity_key: canonicalSourceIdentityKey,
      latest_target_language: "es-US",
      last_observation_ref: "ask:lane:translation:obs:language-variant",
      last_receipt_ref: "ask:lane:translation:receipt:language-variant",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
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

  it("fails closed when a structured observation targets the wrong source kind", () => {
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
            lane_session_id: "lane-session-runner-source-kind",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-kind-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-source-kind",
            observation_ref: "ask:lane:translation:obs:wrong-source-kind",
            receipt_ref: "ask:lane:translation:receipt:wrong-source-kind",
            projection_target: "docs_chunk",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-kind-v1",
              source_kind: "docs_hover",
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
      blocked_reason: "source_kind_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-source-kind")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        source_kind: "docs",
      }),
    });
  });

  it("fails closed when a structured observation carries stale nested source text metadata", () => {
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
            lane_session_id: "lane-session-runner-source-text",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-text-v1",
              source_text_hash: "sha256:runner-source-text-current",
              source_text_char_count: 72,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-source-text",
            observation_ref: "ask:lane:translation:obs:stale-source-text",
            receipt_ref: "ask:lane:translation:receipt:stale-source-text",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-text-v1",
              source_text_hash: "sha256:runner-source-text-old",
              source_text_char_count: 72,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
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
      blocked_reason: "source_text_hash_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-source-text")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        source_text_hash: "sha256:runner-source-text-current",
        source_text_char_count: 72,
      }),
    });
    expect(store.get("lane-session-runner-source-text")?.debug_history.map((event) => event.action)).toEqual([
      "start",
    ]);
  });

  it("fails closed when a structured observation targets the wrong nested projection target", () => {
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
            lane_session_id: "lane-session-runner-projection-target",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-projection-target-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-projection-target",
            observation_ref: "ask:lane:translation:obs:wrong-projection-target",
            receipt_ref: "ask:lane:translation:receipt:wrong-projection-target",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-projection-target-v1",
              source_kind: "docs",
              projection_target: "hover",
              account_locale: "es-US",
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
      blocked_reason: "projection_target_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-projection-target")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        projection_target: "docs_chunk",
      }),
    });
  });

  it("fails closed when a structured observation carries the wrong source identity key", () => {
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
            lane_session_id: "lane-session-runner-source-identity",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-source-identity-v1",
              source_text_hash: "sha256:runner-source-identity-text",
              source_text_char_count: 72,
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-source-identity",
            observation_ref: "ask:lane:translation:obs:wrong-source-identity",
            receipt_ref: "ask:lane:translation:receipt:wrong-source-identity",
            source_identity_key: "docs:nhm2::sha256:old-doc::sha256:old-text::72::docs::docs_chunk::es-US::es",
            projection_target: "docs_chunk",
            target_language: "es",
            now_ms: 140,
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
      blocked_reason: "source_identity_key_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-source-identity")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        source_identity_key:
          "docs:nhm2::sha256:runner-source-identity-v1::sha256:runner-source-identity-text::72::docs::docs_chunk::es-US::es",
      }),
    });
  });

  it("fails closed when a structured observation targets the wrong account locale", () => {
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
            lane_session_id: "lane-session-runner-account-locale",
            now_ms: 100,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-account-locale-v1",
              source_kind: "docs",
              projection_target: "docs_chunk",
              account_locale: "es-US",
              target_language: "es",
            },
          },
          {
            action: "record_observation",
            lane_session_id: "lane-session-runner-account-locale",
            observation_ref: "ask:lane:translation:obs:wrong-account-locale",
            receipt_ref: "ask:lane:translation:receipt:wrong-account-locale",
            projection_target: "docs_chunk",
            now_ms: 140,
            source_binding: {
              source_id: "docs:nhm2",
              source_hash: "sha256:runner-account-locale-v1",
              source_kind: "docs",
              account_locale: "fr-FR",
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
      blocked_reason: "account_locale_mismatch",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(store.get("lane-session-runner-account-locale")).toMatchObject({
      status: "running",
      updated_at_ms: 100,
      last_observation_ref: null,
      last_receipt_ref: null,
      source_binding: expect.objectContaining({
        account_locale: "es-US",
      }),
    });
  });
});
