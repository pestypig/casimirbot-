import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { workstationToolGatewayRouter } from "../../../../routes/agi.workstation-tool-gateway";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";

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
});
