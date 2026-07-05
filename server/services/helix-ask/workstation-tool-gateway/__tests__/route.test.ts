import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { workstationToolGatewayRouter } from "../../../../routes/agi.workstation-tool-gateway";
import { accountSessionRouter } from "../../../../routes/account-session";
import { agentProvidersRouter } from "../../../../routes/agi.agent-providers";
import { resetAccountSessionStore } from "../../../helix-account/account-session-store";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context";
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const WORKSTATION_OPEN_PANEL_CAPABILITY = "workstation.open_panel";
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";
const VOICE_INTERIM_CALLOUT_CAPABILITY = "live_env.request_interim_voice_callout";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/account", accountSessionRouter);
  app.use("/api/agi", workstationToolGatewayRouter);
  app.use("/api/agi", agentProvidersRouter);
  return app;
};

const createDeveloperAgent = async () => {
  const app = createApp();
  const agent = request.agent(app);
  await agent
    .post("/api/account/session/sign-in")
    .send({ profile_id: "profile:developer-gateway-test" })
    .expect(200);
  return agent;
};

describe("AGI workstation tool gateway route", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("exposes capability manifests over the AGI route", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
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
        mode: "observe",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workspace_os_status_observation.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.calculator_solve_observation.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.repo_search_observation.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workstation_active_context_observation.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_SEARCH_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.docs_search_observation.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_OPEN_DOC_CAPABILITY,
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
      }),
    );
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
      }),
    );
  });

  it("exposes the same read/observe manifest for a future provider runtime", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .get("/api/agi/workstation-tool-gateway/capabilities?agent_runtime=future-agent&mode=read")
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
      manifest_version: "read-observe-act.v1",
      agent_runtime: "future-agent",
      mode: "read",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.capabilities.map((entry: { capability_id: string }) => entry.capability_id)).toEqual(
      expect.arrayContaining([
        HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        REPO_SEARCH_CAPABILITY,
        DOCS_SEARCH_CAPABILITY,
      ]),
    );
    for (const capability of response.body.capabilities) {
      expect(capability).toMatchObject({
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: expect.stringMatching(/^helix\..+(?:_observation|_receipt|_tool_result)\.v1$/),
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(["observe", "read", "act", "verify"]).toContain(capability.mode);
    }
  });

  it("calls workspace_os.status through the gateway route as non-terminal evidence", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
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
    const agent = await createDeveloperAgent();
    const response = await agent
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

  it("calls workstation.active_context through the gateway route", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "read",
        capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        turn_id: "ask:test:gateway-route-workstation-active-context",
        iteration: 3,
        arguments: {
          workspace_context: {
            activePanel: "workstation-process-graph",
            openPanels: ["docs-viewer", "workstation-process-graph"],
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.workstation_active_context_observation.v1",
        active_panel: "workstation-process-graph",
        open_panels: ["docs-viewer", "workstation-process-graph"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "workstation",
        action: "active_context",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls read-only capabilities for a future provider through the same admission path", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "future-agent",
        mode: "read",
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        turn_id: "ask:test:gateway-route-future-provider",
        iteration: 1,
        arguments: {
          expression: "11 * 12",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "future-agent",
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      gateway_admission: {
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        selected_agent_provider: "future-agent",
        permission_profile: "read",
        admission_status: "admitted",
        admission_reason: "read_only_gateway_capability",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        result: "132",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls docs-viewer.open_doc through the gateway route as a non-terminal action receipt", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: DOCS_OPEN_DOC_CAPABILITY,
        turn_id: "ask:test:gateway-route-docs-open-doc",
        iteration: 4,
        arguments: {
          path: "docs/helix-ask-api-parity-matrix.md",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: DOCS_OPEN_DOC_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "act",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path: "docs/helix-ask-api-parity-matrix.md",
          },
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: DOCS_OPEN_DOC_CAPABILITY,
        panel_id: "docs-viewer",
        action: "open_doc",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls workstation.open_panel through the gateway route as a non-terminal action receipt", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        turn_id: "ask:test:gateway-route-workstation-open-panel",
        iteration: 5,
        arguments: {
          panel_id: "workstation-task-manager",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "act",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "open_panel",
        panel_id: "workstation-task-manager",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "open_panel",
          panel_id: "workstation-task-manager",
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: WORKSTATION_OPEN_PANEL_CAPABILITY,
        panel_id: "workstation-task-manager",
        action: "open_panel",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls interim voice callout through the gateway route as a host-projected non-terminal receipt", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
        turn_id: "ask:test:gateway-route-voice-callout",
        iteration: 6,
        arguments: {
          text: "checking now",
          kind: "tool_progress",
          evidence_refs: ["ask:test:voice-route"],
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "codex",
        permission_profile: "act",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        capability_key: VOICE_INTERIM_CALLOUT_CAPABILITY,
        status: "succeeded",
        request: {
          text: "checking now",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: "awaiting_client_playback",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        host_projection: {
          kind: "voice_playback_request",
          playback_status: "awaiting_client_playback",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: VOICE_INTERIM_CALLOUT_CAPABILITY,
        panel_id: "voice-delivery",
        action: "request_interim_voice_callout",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("returns a typed non-terminal voice receipt block when confirmation is required", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
        turn_id: "ask:test:gateway-route-voice-confirmation-blocked",
        iteration: 7,
        arguments: {
          text: "confirm before speaking",
          requires_confirmation: true,
        },
      })
      .expect(400);

    expect(response.body).toMatchObject({
      ok: false,
      capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
      error: "blocked_policy",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "blocked_policy",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        status: "blocked",
        blocked_reason: "blocked_policy",
        request: {
          text: "confirm before speaking",
          requiresConfirmation: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: "blocked_policy",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("blocks unknown or mutating future-provider capabilities with typed gateway admission", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "future-agent",
        mode: "act",
        capability_id: "filesystem.write_file",
        turn_id: "ask:test:gateway-route-future-provider-blocked",
        arguments: {
          path: "server/routes/agi.plan.ts",
          text: "blocked",
        },
      })
      .expect(400);

    expect(response.body).toMatchObject({
      ok: false,
      agent_runtime: "future-agent",
      capability_id: "filesystem.write_file",
      error: "capability_not_registered",
      gateway_admission: {
        requested_capability: "filesystem.write_file",
        selected_agent_provider: "future-agent",
        admission_status: "blocked",
        blocked_reason: "capability_not_registered",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_tool_gateway.unknown_capability.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        status: "failed",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls repo.search through the gateway route as non-terminal evidence", async () => {
    const agent = await createDeveloperAgent();
    const response = await agent
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
    const agent = await createDeveloperAgent();
    const response = await agent
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
  }, 15000);

  it("treats anonymous capability listing as user policy", async () => {
    const response = await request(createApp())
      .get("/api/agi/workstation-tool-gateway/capabilities?mode=act")
      .expect(200);

    expect(response.body.account_policy).toMatchObject({
      account_type: "user",
      allowed_panels: expect.arrayContaining(["docs-viewer", "scientific-calculator", "moral-graph"]),
    });
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({ capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY }),
    );
    expect(response.body.capabilities).not.toContainEqual(
      expect.objectContaining({ capability_id: REPO_SEARCH_CAPABILITY }),
    );
    expect(response.body.locked_capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        locked_reason: "capability_outside_account_policy",
      }),
    );
  });

  it("filters user account capability listing to the release panel tool set", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:user-gateway", account_type: "user" })
      .expect(200);

    const response = await agent
      .get("/api/agi/workstation-tool-gateway/capabilities?agent_runtime=codex&mode=act")
      .expect(200);

    expect(response.body.account_policy).toMatchObject({
      account_type: "user",
      max_workstation_permission: "act",
    });
    expect(response.body.policy_gate).toMatchObject({
      account_type: "user",
      requested_mode: "act",
      effective_mode: "act",
      capped: false,
    });
    expect(response.body.capabilities).toContainEqual(
      expect.objectContaining({ capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY }),
    );
    expect(response.body.locked_capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        locked_reason: "capability_outside_account_policy",
      }),
    );
  });

  it("blocks user account panel actions when the target panel is outside user policy", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:user-call", account_type: "user" })
      .expect(200);

    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        mode: "act",
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        turn_id: "ask:test:user-gateway-block",
        arguments: {
          panel_id: "code-admin",
        },
      })
      .expect(403);

    expect(response.body).toMatchObject({
      ok: false,
      error: "account_policy_blocked",
      blocked_reason: "panel_locked_by_account_policy",
      account_policy: {
        account_type: "user",
        max_workstation_permission: "act",
      },
      policy_gate: {
        requested_mode: "act",
        effective_mode: "act",
        capped: true,
      },
    });
  });

  it("allows user account panel actions when the target panel is in user policy", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:user-allowed-call", account_type: "user" })
      .expect(200);

    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        turn_id: "ask:test:user-gateway-allowed-open",
        arguments: {
          panel_id: "workstation-task-manager",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      account_policy: {
        account_type: "user",
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        panel_id: "workstation-task-manager",
        status: "succeeded",
      },
    });
  });

  it("keeps developer account access to act-only workstation capabilities", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:developer-gateway" })
      .expect(200);

    const response = await agent
      .post("/api/agi/workstation-tool-gateway/call")
      .send({
        agent_runtime: "codex",
        mode: "act",
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        turn_id: "ask:test:developer-gateway-open",
        arguments: {
          panel_id: "workstation-task-manager",
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      account_policy: {
        account_type: "developer",
        max_workstation_permission: "danger",
      },
      capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        status: "succeeded",
      },
    });
  });

  it("filters runtime providers for user account policy", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:user-provider", account_type: "user" })
      .expect(200);

    const response = await agent.get("/api/agi/agent-providers").expect(200);

    expect(response.body.account_policy).toMatchObject({
      account_type: "user",
      allowed_runtime_agents: ["codex"],
    });
    expect(response.body.providers.map((provider: { id: string }) => provider.id)).toEqual(["codex"]);
    expect(response.body.locked_providers.map((provider: { id: string }) => provider.id)).toEqual(
      expect.arrayContaining(["helix", "future"]),
    );
  });
});
