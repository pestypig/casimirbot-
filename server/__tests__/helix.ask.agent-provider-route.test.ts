import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { planRouter } from "../routes/agi.plan";

const originalEnableCodexAgent = process.env.ENABLE_CODEX_AGENT;

afterEach(() => {
  if (originalEnableCodexAgent === undefined) {
    delete process.env.ENABLE_CODEX_AGENT;
  } else {
    process.env.ENABLE_CODEX_AGENT = originalEnableCodexAgent;
  }
});

const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("Helix Ask agent provider route metadata", () => {
  it("returns provider and gateway debug metadata for selected Codex failures", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
        turn_id: "ask:test:codex-provider-route",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: false,
      runtime: "codex",
      agent_runtime: "codex",
      agent_runtime_selection_trace: {
        schema: "helix.agent_runtime_selection_trace.v1",
        route: "/ask/turn",
        requested_runtime: "codex",
        selected_runtime: "codex",
        fallback_used: false,
        workstation_gateway: {
          manifest_version: "read-observe.v1",
          shell_enabled: false,
          file_mutation_enabled: false,
          code_mutation_enabled: false,
        },
        evidence_reentry_status: "not_run_text_mode_adapter",
        terminal_authority_status: "not_evaluated_provider_text_mode",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      selected_agent_provider: {
        id: "codex",
        permission_profile: {
          id: "read-observe",
          allows: {
            read: true,
            write: false,
            shell: false,
            codeMutation: false,
          },
        },
      },
      workstation_gateway_manifest: {
        schema: "helix.workstation_tool_gateway.v1",
        manifest_version: "read-observe.v1",
      },
      workstation_gateway_manifest_version: "read-observe.v1",
      debug: {
        agent_runtime: "codex",
        agent_runtime_selection_trace: {
          schema: "helix.agent_runtime_selection_trace.v1",
          selected_runtime: "codex",
        },
        workstation_gateway_manifest_version: "read-observe.v1",
      },
    });
    expect(response.body.workstation_gateway_capability_ids).toContain("workspace_os.status");
    expect(response.body.workstation_gateway_capability_ids).toContain("docs.search");
  });
});
