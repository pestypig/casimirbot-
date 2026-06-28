import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { planRouter } from "../routes/agi.plan";

const originalEnableCodexAgent = process.env.ENABLE_CODEX_AGENT;
const originalEnableFutureAgent = process.env.ENABLE_FUTURE_AGENT;
const originalCodexFakeStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
const originalCodexFakeStderr = process.env.CODEX_AGENT_FAKE_STDERR;
const originalCodexFakeExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;

afterEach(() => {
  if (originalEnableCodexAgent === undefined) {
    delete process.env.ENABLE_CODEX_AGENT;
  } else {
    process.env.ENABLE_CODEX_AGENT = originalEnableCodexAgent;
  }
  if (originalEnableFutureAgent === undefined) {
    delete process.env.ENABLE_FUTURE_AGENT;
  } else {
    process.env.ENABLE_FUTURE_AGENT = originalEnableFutureAgent;
  }
  if (originalCodexFakeStdout === undefined) {
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
  } else {
    process.env.CODEX_AGENT_FAKE_STDOUT = originalCodexFakeStdout;
  }
  if (originalCodexFakeStderr === undefined) {
    delete process.env.CODEX_AGENT_FAKE_STDERR;
  } else {
    process.env.CODEX_AGENT_FAKE_STDERR = originalCodexFakeStderr;
  }
  if (originalCodexFakeExitCode === undefined) {
    delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
  } else {
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = originalCodexFakeExitCode;
  }
});

const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const parseSseEvents = (text: string): Array<{ event: string; data: Record<string, unknown> }> =>
  text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const event = block
        .split(/\n/)
        .find((line) => line.startsWith("event:"))
        ?.slice("event:".length)
        .trim() ?? "";
      const dataText = block
        .split(/\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n");
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(dataText);
      } catch {
        data = {};
      }
      return { event, data };
    });

describe("Helix Ask agent provider route metadata", () => {
  it("returns Helix Native gateway observations without promoting them to terminal answers", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "helix",
        turn_id: "ask:test:helix-provider-gateway-route",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "6 * 7",
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: false,
      turn_id: "ask:test:helix-provider-gateway-route",
      runtime: "helix",
      response_type: "workstation_gateway_observation",
      final_status: "requires_provider_reasoning_reentry",
      agent_runtime: "helix",
      agent_runtime_selection_trace: {
        schema: "helix.agent_runtime_selection_trace.v1",
        route: "/ask/turn",
        requested_runtime: "helix",
        selected_runtime: "helix",
        fallback_used: false,
        workstation_gateway: {
          manifest_version: "read-observe.v1",
          shell_enabled: false,
          file_mutation_enabled: false,
          code_mutation_enabled: false,
        },
      },
      selected_agent_provider: {
        id: "helix",
        permission_profile: {
          id: "helix-native",
        },
      },
      workstation_gateway_manifest_version: "read-observe.v1",
      workstation_gateway_reentry_status: "pending_helix_solver_reentry",
      terminal_authority_status: "not_authorized_observation_only",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "helix",
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            selected_agent_provider: "helix",
            permission_profile: "read",
            admission_status: "admitted",
          },
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            result: "42",
          },
        },
      ],
      provider_reasoning_reentry: {
        schema: "helix.provider_reasoning_reentry.v1",
        status: "pending_helix_solver_reentry",
        provider_terminal_candidate_present: false,
        post_tool_model_step_required: true,
        evidence_reentered: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      terminal_authority_candidate_review: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "not_authorized_observation_only",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["provider_reasoning_reentry_required"],
      },
      provider_terminal_candidate: null,
      terminal_answer_authority: null,
      terminal_presentation: null,
      final_answer_source: null,
      terminal_artifact_kind: null,
      debug: {
        turn_id: "ask:test:helix-provider-gateway-route",
        agent_runtime: "helix",
        workstation_gateway_manifest_version: "read-observe.v1",
        terminal_authority_status: "not_authorized_observation_only",
        terminal_answer_authority: null,
      },
    });
    expect(response.body.workstation_gateway_capability_ids).toContain("scientific-calculator.solve_expression");
    expect(response.body.debug_export_ref).toMatchObject({
      endpoint: "/api/agi/ask/turn/ask%3Atest%3Ahelix-provider-gateway-route/debug-export",
      turn_id: "ask:test:helix-provider-gateway-route",
    });
    const debugExport = await request(app)
      .get("/api/agi/ask/turn/ask%3Atest%3Ahelix-provider-gateway-route/debug-export")
      .expect(200);
    expect(debugExport.body).toMatchObject({
      ok: true,
      payload: {
        active_turn_id: "ask:test:helix-provider-gateway-route",
        response_type: "workstation_gateway_observation",
        final_status: "requires_provider_reasoning_reentry",
        terminal_authority_status: "not_authorized_observation_only",
        workstation_gateway_reentry_status: "pending_helix_solver_reentry",
        workstation_gateway_observation_packets: [
          {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "pending_helix_solver_reentry",
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_granted: false,
        },
      },
    });
  });

  it("emits Helix Native gateway observations in stream final events without terminal authority", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({
        agent_runtime: "helix",
        turn_id: "ask:test:helix-provider-gateway-stream",
        question: "Use the gateway observation.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "9 * 9",
          },
        },
      })
      .expect(200);
    const finalEvent = parseSseEvents(response.text).find((entry) => entry.event === "turn_final");

    expect(finalEvent?.data).toMatchObject({
      ok: false,
      turn_id: "ask:test:helix-provider-gateway-stream",
      runtime: "helix",
      response_type: "workstation_gateway_observation",
      final_status: "requires_provider_reasoning_reentry",
      agent_runtime: "helix",
      agent_runtime_selection_trace: {
        schema: "helix.agent_runtime_selection_trace.v1",
        route: "/ask/turn/stream",
        selected_runtime: "helix",
      },
      workstation_gateway_manifest_version: "read-observe.v1",
      workstation_gateway_reentry_status: "pending_helix_solver_reentry",
      terminal_authority_status: "not_authorized_observation_only",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "helix",
          capability_id: "scientific-calculator.solve_expression",
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            result: "81",
          },
        },
      ],
      terminal_authority_candidate_review: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["provider_reasoning_reentry_required"],
      },
      terminal_answer_authority: null,
      terminal_presentation: null,
      final_answer_source: null,
      terminal_artifact_kind: null,
      debug: {
        turn_id: "ask:test:helix-provider-gateway-stream",
        agent_runtime: "helix",
        terminal_authority_status: "not_authorized_observation_only",
        terminal_answer_authority: null,
      },
    });
    expect(finalEvent?.data.debug_export_ref).toMatchObject({
      endpoint: "/api/agi/ask/turn/ask%3Atest%3Ahelix-provider-gateway-stream/debug-export",
      turn_id: "ask:test:helix-provider-gateway-stream",
    });
    const debugExport = await request(app)
      .get("/api/agi/ask/turn/ask%3Atest%3Ahelix-provider-gateway-stream/debug-export")
      .expect(200);
    expect(debugExport.body).toMatchObject({
      ok: true,
      payload: {
        active_turn_id: "ask:test:helix-provider-gateway-stream",
        response_type: "workstation_gateway_observation",
        final_status: "requires_provider_reasoning_reentry",
        terminal_authority_status: "not_authorized_observation_only",
        workstation_gateway_reentry_status: "pending_helix_solver_reentry",
        workstation_gateway_observation_packets: [
          {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "pending_helix_solver_reentry",
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_granted: false,
        },
      },
    });
  });

  it("does not route plain Helix stream prompts into planner-derived provider gateway observations", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn/stream")
      .send({
        turn_id: "ask:test:plain-helix-stream-no-provider-gateway",
        question: "Open the NHM-2 white paper from the docs.",
        mode: "read",
        debug: true,
      })
      .expect(200);
    const finalEvent = parseSseEvents(response.text).find((entry) => entry.event === "turn_final");

    expect(finalEvent?.data).toBeTruthy();
    expect(finalEvent?.data.agent_runtime).not.toBe("helix");
    expect(finalEvent?.data.response_type).not.toBe("workstation_gateway_observation");
    expect(finalEvent?.data.final_status).not.toBe("requires_provider_reasoning_reentry");
    expect(finalEvent?.data.workstation_gateway_call_results).toBeUndefined();
    expect(finalEvent?.data.route_authority_audit).toBeTruthy();
    expect(finalEvent?.data.ask_turn_solver_trace).toBeTruthy();
    expect(finalEvent?.data.goal_satisfaction_evaluation).toBeTruthy();
    expect(finalEvent?.data.solver_controller_decision).toBeTruthy();
  }, 60_000);

  it("routes selected Helix Native calculator prompts through planner-derived gateway observations", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "helix",
        turn_id: "ask:test:helix-provider-planner-gateway-route",
        question: "Use the scientific calculator to evaluate 6 * 7 and explain the result.",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: false,
      runtime: "helix",
      response_type: "workstation_gateway_observation",
      final_status: "requires_provider_reasoning_reentry",
      agent_runtime: "helix",
      workstation_gateway_reentry_status: "pending_helix_solver_reentry",
      terminal_authority_status: "not_authorized_observation_only",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "helix",
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            selected_agent_provider: "helix",
            permission_profile: "read",
            admission_status: "admitted",
            source_target_intent: {
              source: "helix_workstation_tool_planner",
              intent: "calculator_solve",
              panel_id: "scientific-calculator",
              action_id: "solve_expression",
            },
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            expression: "6*7",
            result: "42",
          },
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      terminal_authority_candidate_review: {
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["provider_reasoning_reentry_required"],
      },
      terminal_answer_authority: null,
      final_answer_source: null,
      terminal_artifact_kind: null,
    });
  });

  it("routes selected Codex calculator prompts through the same planner-derived gateway before provider text", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "The planner-derived calculator observation reports 42.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
        thread_id: "thread:test:codex-provider-planner-gateway-route",
        turn_id: "ask:test:codex-provider-planner-gateway-route",
        question: "Use the scientific calculator to evaluate 6 * 7 and explain the result.",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      runtime: "codex",
      agent_runtime: "codex",
      text: "The planner-derived calculator observation reports 42.",
      workstation_gateway_reentry_status: "completed",
      terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "codex",
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            selected_agent_provider: "codex",
            permission_profile: "read",
            admission_status: "admitted",
            source_target_intent: {
              source: "helix_workstation_tool_planner",
              intent: "calculator_solve",
              panel_id: "scientific-calculator",
              action_id: "solve_expression",
            },
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            expression: "6*7",
            result: "42",
          },
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      provider_reasoning_reentry: {
        status: "completed",
        evidence_reentered: true,
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        server_authoritative: true,
      },
    });
  });

  it("routes selected Helix Native structured repo admission through repo.search gateway observations", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "helix",
        turn_id: "ask:test:helix-provider-structured-repo-gateway-route",
        question: "Where is workspace_os.status implemented?",
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          source_target: "repo_code",
          target_source: "repo_code",
          selected_capability: "repo-code.search_concept",
          args: {
            query: "workspace_os.status",
            paths: ["server/services/helix-ask"],
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: false,
      runtime: "helix",
      response_type: "workstation_gateway_observation",
      agent_runtime: "helix",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "helix",
          capability_id: "repo.search",
          gateway_admission: {
            selected_agent_provider: "helix",
            permission_profile: "read",
            admission_status: "admitted",
            source_target_intent: {
              source: "helix_structured_source_target_admission",
              selected_capability: "repo-code.search_concept",
            },
          },
          observation: {
            schema: "helix.repo_search_observation.v1",
            query: "workspace_os.status",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation_packet: {
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      terminal_answer_authority: null,
      final_answer_source: null,
      terminal_artifact_kind: null,
    });
    expect(response.body.workstation_gateway_call_results[0].observation.hit_count).toBeGreaterThan(0);
  });

  it("routes selected Codex structured docs admission through docs.search before provider text", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "The structured docs observation found Helix Ask evidence.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
        thread_id: "thread:test:codex-provider-structured-docs-gateway-route",
        turn_id: "ask:test:codex-provider-structured-docs-gateway-route",
        question: "Locate the Helix Ask rule in docs.",
        route_metadata: {
          schema: "helix.ask.route_metadata.v1",
          source_target: "docs_viewer",
          source_target_intent: {
            schema: "helix.ask_source_target_intent.v1",
            source_target: "docs_viewer",
            target_source: "docs_viewer",
            mandatory_next_tool: {
              tool_name: "docs-viewer.locate_in_doc",
              selected_capability: "docs-viewer.locate_in_doc",
              args: {
                query: "Helix Ask",
                paths: ["docs"],
              },
            },
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      runtime: "codex",
      agent_runtime: "codex",
      text: "The structured docs observation found Helix Ask evidence.",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "codex",
          capability_id: "docs.search",
          gateway_admission: {
            selected_agent_provider: "codex",
            permission_profile: "read",
            admission_status: "admitted",
            source_target_intent: {
              source: "helix_structured_source_target_admission",
              selected_capability: "docs-viewer.locate_in_doc",
            },
          },
          observation: {
            schema: "helix.docs_search_observation.v1",
            query: "Helix Ask",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation_packet: {
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      provider_reasoning_reentry: {
        status: "completed",
        evidence_reentered: true,
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        server_authoritative: true,
      },
    });
    expect(response.body.workstation_gateway_call_results[0].observation.hit_count).toBeGreaterThan(0);
  });

  it("returns provider and gateway debug metadata for selected Codex failures", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
        turn_id: "ask:test:codex-provider-route",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "3 * 9",
          },
        },
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
      workstation_gateway_call_results: [
        {
          ok: true,
          capability_id: "scientific-calculator.solve_expression",
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            result: "27",
          },
        },
      ],
      debug: {
        agent_runtime: "codex",
        agent_runtime_selection_trace: {
          schema: "helix.agent_runtime_selection_trace.v1",
          selected_runtime: "codex",
        },
        workstation_gateway_manifest_version: "read-observe.v1",
        workstation_gateway_call_results: {
          count: 1,
          truncated: false,
        },
      },
    });
    expect(response.body.workstation_gateway_capability_ids).toContain("workspace_os.status");
    expect(response.body.workstation_gateway_capability_ids).toContain("docs.search");
  });

  it("routes enabled future providers through the same Ask gateway contract", async () => {
    process.env.ENABLE_FUTURE_AGENT = "1";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "future",
        turn_id: "ask:test:future-provider-route",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "8 * 8",
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: false,
      turn_id: "ask:test:future-provider-route",
      runtime: "future",
      response_type: "workstation_gateway_observation",
      final_status: "requires_provider_reasoning_reentry",
      agent_runtime: "future",
      agent_runtime_selection_trace: {
        schema: "helix.agent_runtime_selection_trace.v1",
        route: "/ask/turn",
        requested_runtime: "future",
        selected_runtime: "future",
        fallback_used: false,
        workstation_gateway: {
          manifest_version: "read-observe.v1",
          shell_enabled: false,
          file_mutation_enabled: false,
          code_mutation_enabled: false,
        },
      },
      selected_agent_provider: {
        id: "future",
        label: "Future Agent Wrapper",
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
      workstation_gateway_manifest_version: "read-observe.v1",
      workstation_gateway_reentry_status: "pending_helix_solver_reentry",
      terminal_authority_status: "not_authorized_observation_only",
      workstation_gateway_call_results: [
        {
          ok: true,
          agent_runtime: "future",
          capability_id: "scientific-calculator.solve_expression",
          gateway_admission: {
            selected_agent_provider: "future",
            permission_profile: "read",
            admission_status: "admitted",
          },
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            result: "64",
          },
        },
      ],
      provider_reasoning_reentry: {
        status: "pending_helix_solver_reentry",
        provider_terminal_candidate_present: false,
        post_tool_model_step_required: true,
        evidence_reentered: false,
      },
      terminal_authority_candidate_review: {
        terminal_authority_status: "not_authorized_observation_only",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["provider_reasoning_reentry_required"],
      },
      provider_terminal_candidate: null,
      terminal_answer_authority: null,
      final_answer_source: null,
      terminal_artifact_kind: null,
      debug: {
        turn_id: "ask:test:future-provider-route",
        agent_runtime: "future",
        workstation_gateway_manifest_version: "read-observe.v1",
        terminal_authority_status: "not_authorized_observation_only",
        terminal_answer_authority: null,
      },
    });
    expect(response.body.workstation_gateway_capability_ids).toContain("workspace_os.status");
    expect(response.body.workstation_gateway_capability_ids).toContain("docs.search");
    expect(response.body.debug_export_ref).toMatchObject({
      endpoint: "/api/agi/ask/turn/ask%3Atest%3Afuture-provider-route/debug-export",
      turn_id: "ask:test:future-provider-route",
    });
  });

  it("emits provider and gateway debug metadata in stream final events", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";

    const response = await request(createApp())
      .post("/api/agi/ask/turn/stream")
      .send({
        agent_runtime: "codex",
        turn_id: "ask:test:codex-provider-stream",
        question: "",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "4 * 11",
          },
        },
      })
      .expect(200);
    const finalEvent = parseSseEvents(response.text).find((entry) => entry.event === "turn_final");

    expect(finalEvent?.data).toMatchObject({
      ok: false,
      runtime: "codex",
      agent_runtime: "codex",
      agent_runtime_selection_trace: {
        schema: "helix.agent_runtime_selection_trace.v1",
        route: "/ask/turn/stream",
        selected_runtime: "codex",
        workstation_gateway: {
          manifest_version: "read-observe.v1",
          shell_enabled: false,
          file_mutation_enabled: false,
          code_mutation_enabled: false,
        },
      },
      workstation_gateway_manifest_version: "read-observe.v1",
      workstation_gateway_call_results: [
        {
          ok: true,
          capability_id: "scientific-calculator.solve_expression",
          observation_packet: {
            status: "succeeded",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observation: {
            schema: "helix.calculator_solve_observation.v1",
            result: "44",
          },
        },
      ],
      debug: {
        agent_runtime: "codex",
        agent_runtime_selection_trace: {
          schema: "helix.agent_runtime_selection_trace.v1",
          selected_runtime: "codex",
        },
        workstation_gateway_manifest_version: "read-observe.v1",
        workstation_gateway_call_results: [
          {
            ok: true,
            capability_id: "scientific-calculator.solve_expression",
            observation_packet: {
              status: "succeeded",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            observation: {
              schema: "helix.calculator_solve_observation.v1",
              result: "44",
            },
          },
        ],
      },
    });
  });

  it("returns provider terminal candidate and pending authority review for Codex text-mode answers", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "The calculator observation reports 21.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
        thread_id: "thread:test:codex-provider-candidate-route",
        turn_id: "ask:test:codex-provider-candidate-route",
        question: "Use the calculator observation.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "3 * 7",
          },
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      runtime: "codex",
      agent_runtime: "codex",
      text: "The calculator observation reports 21.",
      workstation_gateway_reentry_status: "completed",
      terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      provider_terminal_candidate: {
        schema: "helix.agent_provider_terminal_candidate.v1",
        turn_id: "ask:test:codex-provider-candidate-route",
        agent_runtime: "codex",
        selected_agent_provider: "codex",
        source: "agent_provider_text_mode_adapter",
        candidate_text_preview: "The calculator observation reports 21.",
        grounded_in_observation_refs: expect.arrayContaining([
          expect.stringContaining("scientific-calculator.solve_expression"),
        ]),
        evidence_reentry_required: true,
        provider_reasoning_completed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      provider_reasoning_reentry: {
        schema: "helix.provider_reasoning_reentry.v1",
        status: "completed",
        provider_terminal_candidate_present: true,
        evidence_reentered: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      terminal_authority_candidate_review: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        blockers: [],
      },
      provider_terminal_authority_bridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "provider_gateway_read_observe_contract_satisfied",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        thread_id: "thread:test:codex-provider-candidate-route",
        turn_id: "ask:test:codex-provider-candidate-route",
        route: "/ask/turn",
        terminal_kind: "answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        server_authoritative: true,
        terminal_eligible: true,
        assistant_answer: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "The calculator observation reports 21.",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
      },
      debug: {
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "completed",
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        },
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          server_authoritative: true,
        },
      },
    });
    expect(response.body.provider_terminal_candidate.candidate_id).toContain(
      "ask:test:codex-provider-candidate-route:agent_provider_terminal_candidate:codex:",
    );
    expect(response.body.debug_export_ref).toMatchObject({
      endpoint: "/api/agi/ask/turn/ask%3Atest%3Acodex-provider-candidate-route/debug-export",
      turn_id: "ask:test:codex-provider-candidate-route",
    });
    const debugExport = await request(app)
      .get("/api/agi/ask/turn/ask%3Atest%3Acodex-provider-candidate-route/debug-export")
      .expect(200);
    expect(debugExport.body).toMatchObject({
      ok: true,
      payload: {
        active_turn_id: "ask:test:codex-provider-candidate-route",
        agent_runtime: "codex",
        response_type: "final_answer",
        final_status: "final_answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        workstation_gateway_manifest_version: "read-observe.v1",
        workstation_gateway_reentry_status: "completed",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        workstation_gateway_call_results: [
          {
            ok: true,
            capability_id: "scientific-calculator.solve_expression",
            gateway_admission: {
              selected_agent_provider: "codex",
              admission_status: "admitted",
            },
            observation_packet: {
              terminal_eligible: false,
              post_tool_model_step_required: true,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
        workstation_gateway_observation_packets: [
          {
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "completed",
          evidence_reentered: true,
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
          terminal_authority_granted: true,
        },
        provider_terminal_authority_bridge: {
          schema: "helix.provider_terminal_authority_bridge.v1",
          terminal_authority_granted: true,
        },
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          final_answer_source: "agent_provider_terminal_candidate",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
          server_authoritative: true,
        },
      },
    });
  });

  it("emits provider terminal authority records in stream final events for Codex text-mode answers", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "The streamed calculator observation reports 64.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({
        agent_runtime: "codex",
        thread_id: "thread:test:codex-provider-candidate-stream",
        turn_id: "ask:test:codex-provider-candidate-stream",
        question: "Use the calculator observation.",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: {
            expression: "8 * 8",
          },
        },
      })
      .expect(200);
    const finalEvent = parseSseEvents(response.text).find((entry) => entry.event === "turn_final");

    expect(finalEvent?.data).toMatchObject({
      ok: true,
      runtime: "codex",
      agent_runtime: "codex",
      text: "The streamed calculator observation reports 64.",
      workstation_gateway_reentry_status: "completed",
      terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      terminal_authority_candidate_review: {
        schema: "helix.provider_terminal_authority_candidate_review.v1",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        blockers: [],
      },
      provider_terminal_authority_bridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        route_authority_status: "provider_gateway_read_observe_contract_satisfied",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        thread_id: "thread:test:codex-provider-candidate-stream",
        turn_id: "ask:test:codex-provider-candidate-stream",
        route: "/ask/turn/stream",
        terminal_kind: "answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        server_authoritative: true,
        terminal_eligible: true,
        assistant_answer: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "The streamed calculator observation reports 64.",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
      },
      debug: {
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          route: "/ask/turn/stream",
          server_authoritative: true,
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          concise_text: "The streamed calculator observation reports 64.",
        },
      },
    });
    expect(finalEvent?.data.provider_terminal_candidate).toMatchObject({
      schema: "helix.agent_provider_terminal_candidate.v1",
      source: "agent_provider_text_mode_adapter",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(finalEvent?.data.debug_export_ref).toMatchObject({
      endpoint: "/api/agi/ask/turn/ask%3Atest%3Acodex-provider-candidate-stream/debug-export",
      turn_id: "ask:test:codex-provider-candidate-stream",
    });
    const debugExport = await request(app)
      .get("/api/agi/ask/turn/ask%3Atest%3Acodex-provider-candidate-stream/debug-export")
      .expect(200);
    expect(debugExport.body).toMatchObject({
      ok: true,
      payload: {
        active_turn_id: "ask:test:codex-provider-candidate-stream",
        agent_runtime: "codex",
        response_type: "final_answer",
        final_status: "final_answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        workstation_gateway_manifest_version: "read-observe.v1",
        workstation_gateway_reentry_status: "completed",
        terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "completed",
          evidence_reentered: true,
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
          terminal_authority_granted: true,
        },
        provider_terminal_authority_bridge: {
          schema: "helix.provider_terminal_authority_bridge.v1",
          terminal_authority_granted: true,
        },
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          route: "/ask/turn/stream",
          server_authoritative: true,
        },
      },
    });
  });
});
