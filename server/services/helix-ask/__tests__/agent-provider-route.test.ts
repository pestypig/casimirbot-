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
  });

  it("runs governed capability lane session control without creating a final answer", async () => {
    const response = await request(createApp())
      .post("/api/agi/capability-lanes/session")
      .send({
        agent_runtime: "helix",
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
});
