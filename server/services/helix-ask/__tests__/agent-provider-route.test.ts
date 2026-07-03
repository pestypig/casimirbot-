import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { agentProvidersRouter } from "../../../routes/agi.agent-providers";

const ENV_KEYS = [
  "HELIX_ASK_AGENT_RUNTIME",
  "ENABLE_CODEX_AGENT",
  "ENABLE_FUTURE_AGENT",
] as const;
const originalEnv = new Map<string, string | undefined>();

for (const key of ENV_KEYS) {
  originalEnv.set(key, process.env[key]);
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/agi", agentProvidersRouter);
  return app;
};

describe("AGI agent provider route", () => {
  it("lists provider descriptors and resolves the default through provider availability", async () => {
    delete process.env.HELIX_ASK_AGENT_RUNTIME;
    delete process.env.ENABLE_CODEX_AGENT;
    delete process.env.ENABLE_FUTURE_AGENT;

    const response = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.agent_providers.v1",
      default_provider: "helix",
      default_provider_label: "Helix Ask Native",
    });
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "helix",
        enabled: true,
        experimental: false,
        permission_profile: expect.objectContaining({
          id: "helix-native",
        }),
      }),
    );
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "codex",
        enabled: true,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
          allows: expect.objectContaining({
            read: true,
            act: false,
            write: false,
            shell: false,
            codeMutation: false,
          }),
        }),
        runtime_status: expect.objectContaining({
          launchable: expect.any(Boolean),
          args: expect.any(Array),
        }),
        supports: expect.objectContaining({
          workstationTools: true,
          capabilityLanes: true,
          capabilityLaneOneShot: true,
          capabilityLaneSessions: true,
        }),
      }),
    );
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "future",
        enabled: false,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
        }),
      }),
    );
  });

  it("advertises enabled Codex and Future defaults only when their providers are enabled", async () => {
    process.env.HELIX_ASK_AGENT_RUNTIME = "codex";
    delete process.env.ENABLE_CODEX_AGENT;

    const codexResponse = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(codexResponse.body).toMatchObject({
      default_provider: "codex",
      default_provider_label: "Codex Workstation Mode",
    });
    expect(codexResponse.body.providers).toContainEqual(
      expect.objectContaining({
        id: "codex",
        enabled: true,
      }),
    );

    process.env.HELIX_ASK_AGENT_RUNTIME = "future";
    process.env.ENABLE_FUTURE_AGENT = "1";

    const futureResponse = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(futureResponse.body).toMatchObject({
      default_provider: "future",
      default_provider_label: "Future Agent Wrapper",
    });
    expect(futureResponse.body.providers).toContainEqual(
      expect.objectContaining({
        id: "future",
        enabled: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
        }),
      }),
    );
  });

  it("runs governed one-shot capability lane calls without creating a final answer", async () => {
    const response = await request(createApp())
      .post("/api/agi/capability-lanes/one-shot")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-one-shot",
        capability_lane_call: {
          capability: "live_translation.translate_text",
          text: "hello",
          source_language: "en",
          target_language: "es",
          requested_backend_provider: "google_gemini",
          source_id: "document_markdown:docs/example.md",
          source_hash: "fnv1a32:example",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.one_shot_response.v1",
      ok: true,
      requested: true,
      agent_runtime: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      selected_agent_provider: expect.objectContaining({
        id: "codex",
      }),
    });
    expect(response.body.capability_lane_call_results).toEqual([
      expect.objectContaining({
        ok: true,
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        translated_text: "hola",
        selected_runtime_agent_provider: "codex",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_backend_selections).toEqual([
      expect.objectContaining({
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        requested_backend_provider: "google_gemini",
        selected_backend_provider: "live_translation.local_runtime",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_observation_packets).toEqual([
      expect.objectContaining({
        capability_key: "live_translation.translate_text",
        status: "succeeded",
        turn_id: "turn-route-one-shot",
        produced_artifact_refs: expect.arrayContaining([
          expect.stringContaining("turn-route-one-shot"),
        ]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_reentry_status)
      .toBe("observation_packet_required_for_provider_reentry");
    expect(response.body.model_visible_capability_lane_manifest).toMatchObject({
      schema: "helix.agent_model_visible_capability_lane_manifest.v1",
    });
    expect(response.body.capability_lane_projection_receipts).toEqual([
      expect.objectContaining({
        capability_key: "live_translation.translate_text",
        status: "projected",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "codex",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_requested",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        lane_visible: false,
        lane_requested: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_observation",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        lane_visible: false,
        lane_requested: true,
        has_observation: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_reentered",
        selected_runtime_agent_provider: "codex",
        lane_requested: true,
        observation_reentered: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      requested_count: 1,
      backend_selected_count: 1,
      observed_count: 1,
      reentered_count: 1,
      lane_executed_count: 2,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });

  it("does not report unsupported one-shot lane requests as successful execution", async () => {
    const response = await request(createApp())
      .post("/api/agi/capability-lanes/one-shot")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-one-shot-unsupported",
        capability_lane_call: {
          capability: "random_provider.do_anything",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.one_shot_response.v1",
      ok: false,
      requested: true,
      agent_runtime: "codex",
      capability_lane_reentry_status: "not_requested",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.capability_lane_call_results).toEqual([]);
    expect(response.body.capability_lane_observation_packets).toEqual([]);
    expect(response.body.capability_lane_projection_receipts).toEqual([]);
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "codex",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      requested_count: 0,
      observed_count: 0,
      reentered_count: 0,
      lane_executed_count: 0,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });

  it("runs governed capability lane session control without creating a final answer", async () => {
    const response = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
        turn_id: "turn-route-session",
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-docs-route",
          source_binding: {
            source_id: "document_markdown:docs/example.md",
            source_hash: "fnv1a32:test",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "haw",
            target_language: "haw",
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: true,
      agent_runtime: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      selected_agent_provider: expect.objectContaining({
        id: "helix",
      }),
    });
    expect(response.body.capability_lane_session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "start",
        lane_id: "live_translation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-docs-route",
        lane_id: "live_translation",
        lifecycle_action: "start",
        session_lifecycle_action: "start",
        session_action: "start",
        session_status: "running",
        source_id: "document_markdown:docs/example.md",
        session_control_key: "lane-session-docs-route::document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
        source_binding_key: "document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
        latest_observation_key: null,
        terminal_authority_status: "not_terminal_authority",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.model_visible_capability_lane_manifest).toMatchObject({
      schema: "helix.agent_model_visible_capability_lane_manifest.v1",
    });
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "helix",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_session",
        selected_runtime_agent_provider: "helix",
        lane_id: "live_translation",
        status: "running",
        lane_visible: false,
        lane_requested: true,
        session_lifecycle_action: "start",
        session_control_key: "lane-session-docs-route::document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
        source_binding_key: "document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      session_count: 1,
      requested_count: 0,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);

    const paused = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
        capability_lane_session_call: {
          action: "pause",
          lane_session_id: "lane-session-docs-route",
          reason: "document_inline_translation_pause",
        },
      })
      .expect(200);

    expect(paused.body).toMatchObject({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: true,
      agent_runtime: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(paused.body.capability_lane_session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "pause",
        lane_id: "live_translation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(paused.body.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-docs-route",
        lane_id: "live_translation",
        lifecycle_action: "pause",
        session_lifecycle_action: "pause",
        session_action: "pause",
        session_status: "paused",
        session_health: "degraded",
        terminal_authority_status: "not_terminal_authority",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    ]);

    const resumed = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
        capability_lane_session_call: {
          action: "resume",
          lane_session_id: "lane-session-docs-route",
          reason: "document_inline_translation_resume",
        },
      })
      .expect(200);

    expect(resumed.body).toMatchObject({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: true,
      agent_runtime: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(resumed.body.capability_lane_session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "resume",
        lane_id: "live_translation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(resumed.body.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-docs-route",
        lane_id: "live_translation",
        lifecycle_action: "resume",
        session_lifecycle_action: "resume",
        session_action: "resume",
        session_status: "running",
        session_health: "healthy",
        terminal_authority_status: "not_terminal_authority",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    ]);

    const stopped = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
        capability_lane_session_call: {
          action: "stop",
          lane_session_id: "lane-session-docs-route",
          reason: "document_inline_translation_stop",
        },
      })
      .expect(200);

    expect(stopped.body).toMatchObject({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: true,
      agent_runtime: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(stopped.body.capability_lane_session_results).toEqual([
      expect.objectContaining({
        ok: true,
        action: "stop",
        lane_id: "live_translation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(stopped.body.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-docs-route",
        lane_id: "live_translation",
        lifecycle_action: "stop",
        session_lifecycle_action: "stop",
        session_action: "stop",
        session_status: "stopped",
        session_health: "stopped",
        session_event_count: 4,
        terminal_authority_status: "not_terminal_authority",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    ]);
  });

  it("does not report empty session control requests as successful execution", async () => {
    const response = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
        turn_id: "turn-route-session-empty",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: false,
      requested: false,
      agent_runtime: "helix",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.capability_lane_session_results).toEqual([]);
    expect(response.body.capability_lane_session_debug_summaries).toEqual([]);
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "helix",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      requested_count: 0,
      session_count: 0,
      lane_executed_count: 0,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });

  it("runs governed goal-binding control without creating a final answer", async () => {
    await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-binding-session",
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-goal-binding-route",
          source_binding: {
            source_id: "document_markdown:docs/goal-binding.md",
            source_hash: "fnv1a32:goal-binding",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
        },
      })
      .expect(200);

    const response = await request(createApp())
      .post("/api/agi/capability-lanes/goal-binding")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-binding",
        capability_lane_goal_binding_call: {
          action: "bind",
          goal_binding_id: "goal-binding-route",
          goal_id: "goal:translate-docs-route",
          lane_session_id: "lane-session-goal-binding-route",
          activation_policy: "while_goal_active",
          attention_policy: "quiet_until_salient",
          stop_condition: "goal_complete",
          report_policy: "ask_on_salience",
          quiet_behavior: "wake_on_salience",
          now_ms: 300,
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.goal_binding_control_response.v1",
      ok: true,
      requested: true,
      agent_runtime: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      selected_agent_provider: expect.objectContaining({
        id: "codex",
      }),
    });
    expect(response.body.capability_lane_goal_binding_results).toEqual([
      expect.objectContaining({
        ok: true,
        blocked_reason: null,
        goal_binding: expect.objectContaining({
          goal_binding_id: "goal-binding-route",
          goal_id: "goal:translate-docs-route",
          lane_session_id: "lane-session-goal-binding-route",
          lane_id: "live_translation",
          backend_provider_becomes_root_agent: false,
          final_reports_require_terminal_authority: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      }),
    ]);
    expect(response.body.capability_lane_goal_binding_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.goal_binding_debug_summary.v1",
        goal_binding_id: "goal-binding-route",
        goal_id: "goal:translate-docs-route",
        lane_session_id: "lane-session-goal-binding-route",
        lane_id: "live_translation",
        selected_runtime_agent_provider: "codex",
        binding_status: "bound",
        session_status: "running",
        session_health: "healthy",
        activation_policy: "while_goal_active",
        attention_policy: "quiet_until_salient",
        stop_condition: "goal_complete",
        report_policy: "ask_on_salience",
        quiet_behavior: "wake_on_salience",
        report_decision: expect.objectContaining({
          action: "wake_on_salience",
          wake_expected: true,
          terminal_report_requires_authority: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        dispatch_plan: expect.objectContaining({
          target: "ask_wake",
          requires_live_mail_loop: true,
          side_effects_executed: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        dispatch_admission: expect.objectContaining({
          status: "blocked",
          blocked_reason: "missing_evidence_ref",
          side_effects_executed: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        backend_provider_becomes_root_agent: false,
        final_reports_require_terminal_authority: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_mail_loop_debug_summaries).toEqual([]);
    expect(response.body.model_visible_capability_lane_manifest).toMatchObject({
      schema: "helix.agent_model_visible_capability_lane_manifest.v1",
    });
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "codex",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "goal_binding",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        status: "bound",
        lane_visible: false,
        lane_requested: true,
        lane_executed: false,
        observation_reentered: false,
        report_action: "wake_on_salience",
        report_reason: "goal_binding_policy_requests_wake_on_salience",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      goal_binding_count: 1,
      mail_loop_count: 0,
      lane_executed_count: 0,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });

  it("routes live translation lane observations into mail-loop evidence without terminal authority", async () => {
    await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-mail-loop-session",
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-mail-loop-route",
          source_binding: {
            source_id: "document_markdown:docs/mail-loop.md",
            source_hash: "fnv1a32:mail-loop",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
        },
      })
      .expect(200);

    const response = await request(createApp())
      .post("/api/agi/capability-lanes/mail-loop")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-mail-loop",
        thread_id: "ask-thread-route-mail-loop",
        lane_session_id: "lane-session-mail-loop-route",
        objective_text: "Translate document chunks into account language.",
        capability_lane_call: {
          capability: "live_translation.translate_text",
          text: "hello",
          lane_session_id: "lane-session-mail-loop-route",
          source_language: "en",
          target_language: "es",
          source_id: "document_markdown:docs/mail-loop.md",
          source_hash: "fnv1a32:mail-loop",
          chunk_id: "chunk-route-mail-loop",
          chunk_index: 1,
          dedupe_key: "document_markdown:docs/mail-loop.md:chunk-route-mail-loop:es",
          source_event_id: "docs/mail-loop.md:event-1",
          projection_target: "docs_chunk",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.capability_lane.mail_loop_response.v1",
      ok: true,
      requested: true,
      agent_runtime: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      selected_agent_provider: expect.objectContaining({
        id: "codex",
      }),
    });
    expect(response.body.capability_lane_call_results).toEqual([
      expect.objectContaining({
        ok: true,
        capability: "live_translation.translate_text",
        lane_id: "live_translation",
        translated_text: "hola",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_mail_loop_results).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.mail_loop_result.v1",
        ok: true,
        lane_session_id: "lane-session-mail-loop-route",
        lane_id: "live_translation",
        stage_play_wake_expected: true,
        blocked_reason: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_mail_loop_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-mail-loop-route",
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        stage_play_mail_delivery_status: "created",
        materialized_mail_loop_evidence: true,
        stage_play_wake_kind: "mailbox_wake",
        mailbox_thread_id: "ask-thread-route-mail-loop",
        source_id: "document_markdown:docs/mail-loop.md",
        source_hash: "fnv1a32:mail-loop",
        lane_session_source_id: "document_markdown:docs/mail-loop.md",
        lane_session_source_hash: "fnv1a32:mail-loop",
        lane_session_projection_target: "docs_chunk",
        lane_session_target_language: "es",
        lane_session_account_locale: "es-US",
        chunk_id: "chunk-route-mail-loop",
        chunk_index: 1,
        target_language: "es",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(response.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_observation",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        lane_executed: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_mail_loop",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        status: "created",
        lane_visible: false,
        lane_requested: true,
        lane_executed: true,
        observation_reentered: true,
        latest_mail_loop_wake_kind: "mailbox_wake",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(response.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      observed_count: 1,
      mail_loop_count: 1,
      lane_executed_count: 3,
      visible_lane_does_not_mean_executed: true,
    });
    expect(response.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(response.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });

  it("records materialized mail-loop evidence back into a goal binding without terminal authority", async () => {
    await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-mail-chain-session",
        capability_lane_session_call: {
          action: "start",
          lane_id: "live_translation",
          lane_session_id: "lane-session-goal-mail-chain-route",
          source_binding: {
            source_id: "document_markdown:docs/goal-mail-chain.md",
            source_hash: "fnv1a32:goal-mail-chain",
            source_kind: "docs",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
          },
        },
      })
      .expect(200);

    await request(createApp())
      .post("/api/agi/capability-lanes/goal-binding")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-mail-chain-bind",
        capability_lane_goal_binding_call: {
          action: "bind",
          goal_binding_id: "goal-binding-mail-chain-route",
          goal_id: "goal:translate-docs-mail-chain",
          lane_session_id: "lane-session-goal-mail-chain-route",
          activation_policy: "while_goal_active",
          attention_policy: "quiet_until_salient",
          stop_condition: "goal_complete",
          report_policy: "ask_on_salience",
          quiet_behavior: "wake_on_salience",
          now_ms: 400,
        },
      })
      .expect(200);

    const mailLoopResponse = await request(createApp())
      .post("/api/agi/capability-lanes/mail-loop")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-mail-chain-mail",
        thread_id: "ask-thread-route-goal-mail-chain",
        lane_session_id: "lane-session-goal-mail-chain-route",
        objective_text: "Translate goal-bound document chunks into account language.",
        capability_lane_call: {
          capability: "live_translation.translate_text",
          text: "hello",
          lane_session_id: "lane-session-goal-mail-chain-route",
          source_language: "en",
          target_language: "es",
          source_id: "document_markdown:docs/goal-mail-chain.md",
          source_hash: "fnv1a32:goal-mail-chain",
          chunk_id: "chunk-goal-mail-chain",
          chunk_index: 1,
          dedupe_key: "document_markdown:docs/goal-mail-chain.md:chunk-goal-mail-chain:es",
          source_event_id: "docs/goal-mail-chain.md:event-1",
          projection_target: "docs_chunk",
        },
      })
      .expect(200);

    const mailLoopSummary = mailLoopResponse.body.capability_lane_mail_loop_debug_summaries[0];
    expect(mailLoopSummary).toMatchObject({
      schema: "helix.capability_lane.mail_loop_debug_summary.v1",
      lane_session_id: "lane-session-goal-mail-chain-route",
      stage_play_mail_delivery_status: "created",
      materialized_mail_loop_evidence: true,
      stage_play_wake_kind: "mailbox_wake",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const recorded = await request(createApp())
      .post("/api/agi/capability-lanes/goal-binding")
      .send({
        agent_runtime: "codex",
        turn_id: "turn-route-goal-mail-chain-record",
        capability_lane_goal_binding_call: {
          action: "record_mail_loop",
          goal_binding_id: "goal-binding-mail-chain-route",
          mail_loop_summary: mailLoopSummary,
          now_ms: 450,
        },
      })
      .expect(200);

    expect(recorded.body).toMatchObject({
      schema: "helix.capability_lane.goal_binding_control_response.v1",
      ok: true,
      requested: true,
      agent_runtime: "codex",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      selected_agent_provider: expect.objectContaining({
        id: "codex",
      }),
    });
    expect(recorded.body.capability_lane_mail_loop_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-goal-mail-chain-route",
        stage_play_mail_id: mailLoopSummary.stage_play_mail_id,
        observation_ref: mailLoopSummary.observation_ref,
        receipt_ref: mailLoopSummary.receipt_ref,
        materialized_mail_loop_evidence: true,
        stage_play_wake_kind: "mailbox_wake",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(recorded.body.capability_lane_goal_binding_results).toEqual([
      expect.objectContaining({
        ok: true,
        blocked_reason: null,
        goal_binding: expect.objectContaining({
          goal_binding_id: "goal-binding-mail-chain-route",
          goal_id: "goal:translate-docs-mail-chain",
          lane_session_id: "lane-session-goal-mail-chain-route",
          latest_mail_loop_summary: expect.objectContaining({
            stage_play_mail_id: mailLoopSummary.stage_play_mail_id,
            observation_ref: mailLoopSummary.observation_ref,
            receipt_ref: mailLoopSummary.receipt_ref,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
          lane_session_mail_loop_refs: [mailLoopSummary.stage_play_mail_id],
          backend_provider_becomes_root_agent: false,
          final_reports_require_terminal_authority: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      }),
    ]);
    expect(recorded.body.capability_lane_goal_binding_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.goal_binding_debug_summary.v1",
        goal_binding_id: "goal-binding-mail-chain-route",
        lane_session_id: "lane-session-goal-mail-chain-route",
        latest_mail_loop_summary: expect.objectContaining({
          stage_play_mail_id: mailLoopSummary.stage_play_mail_id,
          observation_ref: mailLoopSummary.observation_ref,
          receipt_ref: mailLoopSummary.receipt_ref,
        }),
        mail_loop_refs: [mailLoopSummary.stage_play_mail_id],
        report_decision: expect.objectContaining({
          action: "wake_on_salience",
          mail_loop_ref: mailLoopSummary.stage_play_mail_id,
          wake_expected: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        dispatch_plan: expect.objectContaining({
          target: "ask_wake",
          mail_loop_ref: mailLoopSummary.stage_play_mail_id,
          requires_live_mail_loop: true,
          side_effects_executed: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        dispatch_admission: expect.objectContaining({
          status: "eligible_waiting_for_mail_loop",
          target: "ask_wake",
          mail_loop_ref: mailLoopSummary.stage_play_mail_id,
          wake_dispatch_allowed: false,
          side_effects_executed: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        terminal_authority_status: "pending_helix_terminal_authority",
        final_reports_require_terminal_authority: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(recorded.body.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_mail_loop",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        latest_event_id: mailLoopSummary.stage_play_mail_id,
        lane_executed: true,
        observation_reentered: true,
        latest_mail_loop_wake_kind: "mailbox_wake",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "goal_binding",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        status: "bound",
        lane_requested: true,
        lane_executed: true,
        observation_reentered: true,
        observation_ref: mailLoopSummary.stage_play_mail_id,
        receipt_ref: mailLoopSummary.receipt_ref,
        latest_mail_loop_wake_kind: "mailbox_wake",
        report_action: "wake_on_salience",
        report_reason: "goal_binding_policy_requests_wake_on_salience",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]));
    expect(recorded.body.capability_lane_timeline_summary).toMatchObject({
      schema: "helix.capability_lane.timeline_summary.v1",
      goal_binding_count: 1,
      mail_loop_count: 1,
      visible_lane_does_not_mean_executed: true,
    });
    expect(recorded.body.capability_lane_timeline_summary.visible_count).toBeGreaterThan(0);
    expect(recorded.body.capability_lane_timeline_summary.visible_only_count).toBeGreaterThan(0);
  });
});
