import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { workstationToolGatewayRouter } from "../../../../routes/agi.workstation-tool-gateway";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";

const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/agi", workstationToolGatewayRouter);
  return app;
};

describe("AGI workstation tool gateway route", () => {
  it("exposes capability manifests over the AGI route", async () => {
    const response = await request(createApp())
      .get("/api/agi/workstation-tool-gateway/capabilities?agent_runtime=codex&mode=observe")
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
      agent_runtime: "codex",
      mode: "observe",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_SEARCH_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        terminal_eligible: false,
      }),
    );
  });

  it("calls workspace_os.status through the gateway route as non-terminal evidence", async () => {
    const response = await request(createApp())
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "observe",
        capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        turn_id: "ask:test:gateway-route",
        iteration: 2,
        arguments: {
          thread_id: "helix-ask:test",
          capability_ids: ["runtime.memory"],
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-route",
        iteration: 2,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls scientific-calculator.solve_expression through the gateway route", async () => {
    const response = await request(createApp())
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "read",
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        turn_id: "ask:test:gateway-route-calculator",
        iteration: 3,
        arguments: {
          expression: "(10 - 4) / 3",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        result: "2",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls repo.search through the gateway route as non-terminal evidence", async () => {
    const response = await request(createApp())
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "read",
        capability_id: REPO_SEARCH_CAPABILITY,
        turn_id: "ask:test:gateway-route-repo",
        iteration: 4,
        arguments: {
          query: "workspace_os.status",
          paths: ["server/services/helix-ask"],
          max_hits: 2,
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: REPO_SEARCH_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: REPO_SEARCH_CAPABILITY,
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(response.body.observation.hit_count).toBeGreaterThan(0);
  });

  it("calls docs.search through the gateway route as non-terminal evidence", async () => {
    const response = await request(createApp())
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "read",
        capability_id: DOCS_SEARCH_CAPABILITY,
        turn_id: "ask:test:gateway-route-docs",
        iteration: 5,
        arguments: {
          query: "Helix Ask",
          paths: ["docs"],
          max_hits: 2,
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: DOCS_SEARCH_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: DOCS_SEARCH_CAPABILITY,
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(response.body.observation.hit_count).toBeGreaterThan(0);
  });
});
