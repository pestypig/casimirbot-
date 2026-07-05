import { beforeEach, describe, expect, it } from "vitest";
import { helixRuntimeGoalSessionStore } from "../goal-runtime-session";

const translationCall = {
  capability: "live_translation.translate_text",
  text: "hello",
  source_language: "en",
  target_language: "es",
  requested_backend_provider: "google_gemini",
  source_id: "document-title:active",
  source_hash: "fnv1a32:title",
};

beforeEach(() => {
  helixRuntimeGoalSessionStore.clear();
  process.env.ENABLE_CODEX_AGENT = "1";
  process.env.CODEX_AGENT_FAKE_STDOUT = "Goal progress candidate: Spanish title translation evidence is recorded.";
  process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
  delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
  delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
});

describe("runtime goal session controller", () => {
  it("creates a Codex runtime goal session and preserves provider identity across manual resumes", async () => {
    const started = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Keep translating visible document titles to Spanish when manually woken.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:translate-titles",
      runtimeSessionId: "runtime:codex:test-session",
      allowedLanes: ["live_translation"],
      reportPolicy: "report_only_failure",
    });

    expect(started.ok).toBe(true);
    expect(started.session).toMatchObject({
      goal_id: "goal:test:translate-titles",
      runtime_agent_provider: "codex",
      runtime_session_id: "runtime:codex:test-session",
      status: "waiting",
      terminal_authority_status: "not_evaluated",
      terminal_eligible: false,
      assistant_answer: false,
      job_brief: {
        user_goal_text: "Keep translating visible document titles to Spanish when manually woken.",
        selected_runtime_agent_provider: "codex",
        allowed_capability_lanes: ["live_translation"],
        report_policy: "report_only_failure",
        stop_condition: expect.stringContaining("user_cancel"),
      },
    });
    expect(started.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "goal_started",
        runtime_agent_provider: "codex",
        runtime_session_id: "runtime:codex:test-session",
      }),
    );

    const noToolWake = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:translate-titles",
      wakeEventKind: "manual_resume",
      turnId: "turn:no-tool",
      body: {
        turn_id: "turn:no-tool",
        user_message: "manual wake",
      },
    });

    expect(noToolWake.ok).toBe(true);
    expect(noToolWake.session.runtime_agent_provider).toBe("codex");
    expect(noToolWake.session.runtime_session_id).toBe("runtime:codex:test-session");
    expect(noToolWake.session.latest_observation_refs).toEqual([]);
    expect(noToolWake.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "runtime_resumed",
        reason: "runtime_provider_made_no_tool_or_lane_request",
      }),
    );

    const laneWake = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:translate-titles",
      wakeEventKind: "manual_resume",
      turnId: "turn:translation",
      body: {
        turn_id: "turn:translation",
        capability_lane_call: translationCall,
      },
    });

    expect(laneWake.ok).toBe(true);
    expect(laneWake.session.runtime_agent_provider).toBe("codex");
    expect(laneWake.session.runtime_session_id).toBe("runtime:codex:test-session");
    expect(laneWake.session.latest_observation_refs[0]).toContain("live_translation.translate_text");
    expect(laneWake.session.latest_receipt_refs[0]).toContain(":projection:");
    expect(laneWake.session.terminal_authority_status).toBe("authorized");
    expect(laneWake.session.latest_provider_terminal_candidate_ref).toContain("agent_provider_terminal_candidate");
    expect(laneWake.debug_export).toMatchObject({
      schema: "helix.runtime_goal.debug_export.v1",
      goal_id: "goal:test:translate-titles",
      runtime_provider: "codex",
      runtime_session_id: "runtime:codex:test-session",
      terminal_authority_status: "authorized",
      quiet_report_decision: "quiet",
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(laneWake.debug_export.provider_terminal_candidate).toMatchObject({
      schema: "helix.agent_provider_terminal_candidate.v1",
      agent_runtime: "codex",
      grounded_in_observation_refs: expect.arrayContaining([
        expect.stringContaining("live_translation.translate_text"),
      ]),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(laneWake.debug_export.provider_terminal_authority_bridge).toMatchObject({
      terminal_authority_granted: true,
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(laneWake.debug_export.terminal_answer_authority).toMatchObject({
      schema: "helix.turn_terminal_authority.v1",
      server_authoritative: true,
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      terminal_eligible: true,
      assistant_answer: false,
    });
    expect(laneWake.debug_export.terminal_answer_authority?.terminal_item_id).toContain(
      "agent_provider_terminal_candidate:codex",
    );
    expect(laneWake.debug_export.terminal_answer_authority?.terminal_item_id).not.toContain(
      "live_translation.translate_text",
    );
    expect(laneWake.debug_export.runtime_goal_progress_summary).toMatchObject({
      evidence_used: {
        requested_tool_or_lane: "live_translation.translate_text",
        observation_refs: expect.arrayContaining([
          expect.stringContaining("live_translation.translate_text"),
        ]),
        provider_terminal_candidate_ref: expect.stringContaining("agent_provider_terminal_candidate:codex"),
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(laneWake.debug_export.wake_events).toHaveLength(2);
    expect(laneWake.debug_export.wake_events[1]).toMatchObject({
      kind: "manual_resume",
      turn_id: "turn:translation",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(laneWake.debug_export.debug_events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "tool_or_lane_requested",
          requested_tool_or_lane: "live_translation.translate_text",
        }),
        expect.objectContaining({
          stage: "tool_or_lane_admitted",
          requested_tool_or_lane: "live_translation.translate_text",
          admitted: true,
          backend_selected: "live_translation.local_runtime",
        }),
        expect.objectContaining({
          stage: "evidence_reentered",
          reentry_status: "reentered",
          observation_refs: expect.arrayContaining([
            expect.stringContaining("live_translation.translate_text"),
          ]),
        }),
        expect.objectContaining({
          stage: "runtime_candidate_generated",
          provider_terminal_candidate_ref: expect.stringContaining("agent_provider_terminal_candidate"),
        }),
        expect.objectContaining({
          stage: "terminal_authority_evaluated",
          terminal_authority_status: "authorized",
          reason: "provider_candidate_authorized_after_goal_evidence_reentry",
        }),
      ]),
    );
  });

  it("blocks unavailable lanes as typed goal state instead of producing a final answer", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Only translation is allowed.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:blocked-lane",
      allowedLanes: ["live_translation"],
    });

    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:blocked-lane",
      turnId: "turn:blocked-lane",
      body: {
        turn_id: "turn:blocked-lane",
        capability_lane_call: {
          capability: "text_to_speech.speak_text",
          text: "hola",
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.blocked_reason).toBe("unavailable_lane");
    expect(result.session.status).toBe("blocked");
    expect(result.session.terminal_authority_status).toBe("blocked");
    expect(result.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "tool_or_lane_rejected",
        status: "blocked",
        requested_tool_or_lane: "text_to_speech.speak_text",
        reason: "unavailable_lane",
      }),
    );
    expect(result.debug_export.terminal_eligible).toBe(false);
    expect(result.debug_export.assistant_answer).toBe(false);
  });

  it("admits existing workstation gateway tools and records non-terminal observation evidence", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Calculate visible title metadata when manually woken.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:calculator-tool",
      allowedLanes: [],
      allowedWorkstationTools: ["scientific-calculator.solve_expression"],
    });

    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:calculator-tool",
      wakeEventKind: "manual_resume",
      turnId: "turn:calculator-tool",
      body: {
        turn_id: "turn:calculator-tool",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          mode: "read",
          arguments: {
            expression: "8*9",
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.session.runtime_agent_provider).toBe("codex");
    expect(result.session.latest_observation_refs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("scientific-calculator.solve_expression"),
      ]),
    );
    expect(result.session.terminal_authority_status).toBe("authorized");
    expect(result.debug_export.provider_terminal_authority_bridge).toMatchObject({
      terminal_authority_granted: true,
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(result.debug_export.provider_terminal_candidate).toMatchObject({
      schema: "helix.agent_provider_terminal_candidate.v1",
      agent_runtime: "codex",
      grounded_in_observation_refs: expect.arrayContaining([
        expect.stringContaining("scientific-calculator.solve_expression"),
      ]),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(result.debug_export.terminal_answer_authority).toMatchObject({
      schema: "helix.turn_terminal_authority.v1",
      server_authoritative: true,
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      terminal_eligible: true,
      assistant_answer: false,
    });
    expect(result.debug_export.terminal_answer_authority?.terminal_item_id).toContain(
      "agent_provider_terminal_candidate:codex",
    );
    expect(result.debug_export.terminal_answer_authority?.terminal_item_id).not.toContain(
      "scientific-calculator.solve_expression",
    );
    expect(result.debug_export.runtime_goal_progress_summary).toMatchObject({
      evidence_used: {
        requested_tool_or_lane: "scientific-calculator.solve_expression",
        observation_refs: expect.arrayContaining([
          expect.stringContaining("scientific-calculator.solve_expression"),
        ]),
        provider_terminal_candidate_ref: expect.stringContaining("agent_provider_terminal_candidate:codex"),
      },
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(result.debug_export.debug_events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "tool_or_lane_requested",
          requested_tool_or_lane: "scientific-calculator.solve_expression",
        }),
        expect.objectContaining({
          stage: "tool_or_lane_admitted",
          admitted: true,
          requested_tool_or_lane: "scientific-calculator.solve_expression",
          terminal_authority_status: "pending_helix_terminal_authority",
        }),
        expect.objectContaining({
          stage: "evidence_reentered",
          reentry_status: "reentered",
          observation_refs: expect.arrayContaining([
            expect.stringContaining("scientific-calculator.solve_expression"),
          ]),
        }),
        expect.objectContaining({
          stage: "terminal_authority_evaluated",
          terminal_authority_status: "authorized",
          reason: "provider_candidate_authorized_after_goal_evidence_reentry",
        }),
      ]),
    );
    expect(result.debug_export.terminal_eligible).toBe(false);
    expect(result.debug_export.assistant_answer).toBe(false);
  });

  it("keeps Helix Native attached across a governed lane wake without invoking the placeholder provider", async () => {
    const started = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Translate the active title through Helix Native supervision.",
      runtimeAgentProvider: "helix",
      goalId: "goal:test:helix-native-translation",
      runtimeSessionId: "runtime:helix:test-session",
      allowedLanes: ["live_translation"],
    });

    expect(started.ok).toBe(true);
    expect(started.session).toMatchObject({
      runtime_agent_provider: "helix",
      runtime_session_id: "runtime:helix:test-session",
      status: "waiting",
    });

    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:helix-native-translation",
      wakeEventKind: "manual_resume",
      turnId: "turn:helix-native-translation",
      body: {
        turn_id: "turn:helix-native-translation",
        capability_lane_call: translationCall,
      },
    });

    expect(result.ok).toBe(true);
    expect(result.session.runtime_agent_provider).toBe("helix");
    expect(result.session.runtime_session_id).toBe("runtime:helix:test-session");
    expect(result.session.latest_observation_refs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("live_translation.translate_text"),
      ]),
    );
    expect(result.session.terminal_authority_status).toBe("authorized");
    expect(result.debug_export.provider_terminal_candidate).toMatchObject({
      schema: "helix.agent_provider_terminal_candidate.v1",
      agent_runtime: "helix",
      provider_label: "Helix Ask Native",
      grounded_in_observation_refs: expect.arrayContaining([
        expect.stringContaining("live_translation.translate_text"),
      ]),
    });
    expect(result.debug_export.terminal_answer_authority).toMatchObject({
      schema: "helix.turn_terminal_authority.v1",
      server_authoritative: true,
    });
    expect(result.debug_export.debug_events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "tool_or_lane_requested",
          requested_tool_or_lane: "live_translation.translate_text",
        }),
        expect.objectContaining({
          stage: "tool_or_lane_admitted",
          admitted: true,
          backend_selected: "live_translation.local_runtime",
        }),
        expect.objectContaining({
          stage: "evidence_reentered",
          reentry_status: "reentered",
        }),
        expect.objectContaining({
          stage: "runtime_candidate_generated",
          requested_tool_or_lane: "live_translation.translate_text",
          provider_terminal_candidate_ref: expect.stringContaining("agent_provider_terminal_candidate:helix"),
        }),
        expect.objectContaining({
          stage: "terminal_authority_evaluated",
          terminal_authority_status: "authorized",
          reason: "provider_candidate_authorized_after_goal_evidence_reentry",
        }),
      ]),
    );
  });

  it("blocks unavailable workstation gateway tools as typed goal state", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Only calculator is allowed.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:blocked-tool",
      allowedLanes: [],
      allowedWorkstationTools: ["scientific-calculator.solve_expression"],
    });

    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:blocked-tool",
      turnId: "turn:blocked-tool",
      body: {
        turn_id: "turn:blocked-tool",
        workstation_gateway_call: {
          capability_id: "repo.search",
          mode: "read",
          arguments: {
            query: "workstation_gateway",
          },
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.blocked_reason).toBe("unavailable_workstation_tool");
    expect(result.session.status).toBe("blocked");
    expect(result.session.latest_observation_refs).toEqual([]);
    expect(result.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "tool_or_lane_rejected",
        requested_tool_or_lane: "repo.search",
        reason: "unavailable_workstation_tool",
      }),
    );
    expect(result.debug_export.terminal_authority_status).toBe("blocked");
  });

  it("prevents cancelled goals from continuing to request tools", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Translate titles.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:cancelled",
      allowedLanes: ["live_translation"],
    });
    const stopped = helixRuntimeGoalSessionStore.stopGoalRuntimeSession({
      goalId: "goal:test:cancelled",
      status: "cancelled",
      reason: "user_cancel",
    });

    expect(stopped.session.status).toBe("cancelled");

    const resumed = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:cancelled",
      turnId: "turn:after-cancel",
      body: {
        turn_id: "turn:after-cancel",
        capability_lane_call: translationCall,
      },
    });

    expect(resumed.ok).toBe(false);
    expect(resumed.blocked_reason).toBe("goal_not_resumable");
    expect(resumed.session.latest_observation_refs).toEqual([]);
    expect(resumed.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "goal_blocked",
        reason: "goal_not_resumable",
      }),
    );
  });

  it("fails a goal after its repeated failure threshold is reached", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Keep a quiet watch on translation failures.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:failure-threshold",
      stopPolicy: {
        repeated_failure_threshold: 2,
      },
    });

    const firstFailure = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:failure-threshold",
      wakeEventKind: "failure",
      turnId: "turn:first-failure",
      body: {
        turn_id: "turn:first-failure",
        reason: "lane_backend_timeout",
      },
    });

    expect(firstFailure.ok).toBe(true);
    expect(firstFailure.session.status).toBe("waiting");
    expect(firstFailure.session.failure_count).toBe(1);
    expect(firstFailure.session.last_failure_reason).toBe("lane_backend_timeout");

    const secondFailure = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:failure-threshold",
      wakeEventKind: "failure",
      turnId: "turn:second-failure",
      body: {
        turn_id: "turn:second-failure",
        reason: "lane_backend_timeout",
      },
    });

    expect(secondFailure.ok).toBe(false);
    expect(secondFailure.blocked_reason).toBe("repeated_failure_threshold");
    expect(secondFailure.session.status).toBe("failed");
    expect(secondFailure.session.status_reason).toBe("repeated_failure_threshold");
    expect(secondFailure.session.failure_count).toBe(2);
    expect(secondFailure.session.terminal_authority_status).toBe("blocked");
    expect(secondFailure.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "goal_failure_recorded",
        status: "failed",
        reason: "repeated_failure_threshold",
      }),
    );
  });

  it("blocks stale source wakes before executing a requested lane", async () => {
    await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Translate only fresh visible context.",
      runtimeAgentProvider: "codex",
      goalId: "goal:test:stale-source",
      allowedLanes: ["live_translation"],
      stopPolicy: {
        stale_source_ms: 5000,
      },
    });

    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: "goal:test:stale-source",
      wakeEventKind: "visible_context_changed",
      turnId: "turn:stale-source",
      body: {
        turn_id: "turn:stale-source",
        source_freshness_ms: 6000,
        capability_lane_call: translationCall,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.blocked_reason).toBe("stale_source");
    expect(result.session.status).toBe("blocked");
    expect(result.session.latest_observation_refs).toEqual([]);
    expect(result.session.terminal_authority_status).toBe("blocked");
    expect(result.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "goal_blocked",
        reason: "stale_source",
      }),
    );
    expect(result.debug_export.debug_events).not.toContainEqual(
      expect.objectContaining({
        stage: "tool_or_lane_admitted",
      }),
    );
  });

  it("records unavailable runtime providers as typed blocked sessions", async () => {
    process.env.ENABLE_FUTURE_AGENT = "0";

    const result = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Run future runtime.",
      runtimeAgentProvider: "future",
      goalId: "goal:test:future-unavailable",
    });

    expect(result.ok).toBe(false);
    expect(result.blocked_reason).toBe("unavailable_runtime_provider");
    expect(result.session).toMatchObject({
      goal_id: "goal:test:future-unavailable",
      runtime_agent_provider: "future",
      status: "blocked",
      status_reason: "unavailable_runtime_provider",
      terminal_authority_status: "blocked",
    });
    expect(result.debug_export.debug_events).toContainEqual(
      expect.objectContaining({
        stage: "goal_blocked",
        reason: "unavailable_runtime_provider",
      }),
    );
  });
});
