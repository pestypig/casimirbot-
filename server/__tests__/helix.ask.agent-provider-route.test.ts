import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { planRouter } from "../routes/agi.plan";

const originalEnableCodexAgent = process.env.ENABLE_CODEX_AGENT;
const originalCodexFakeStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
const originalCodexFakeStderr = process.env.CODEX_AGENT_FAKE_STDERR;
const originalCodexFakeExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;

afterEach(() => {
  if (originalEnableCodexAgent === undefined) {
    delete process.env.ENABLE_CODEX_AGENT;
  } else {
    process.env.ENABLE_CODEX_AGENT = originalEnableCodexAgent;
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

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        agent_runtime: "codex",
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
      terminal_authority_status: "pending_helix_terminal_authority",
      provider_terminal_candidate: {
        schema: "helix.agent_provider_terminal_candidate.v1",
        turn_id: "ask:test:codex-provider-candidate-route",
        agent_runtime: "codex",
        selected_agent_provider: "codex",
        source: "codex_text_mode_adapter",
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
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_authority_granted: false,
        final_visible_answer_authorized: false,
        blockers: ["helix_terminal_authority_not_run_for_provider_candidate"],
      },
      debug: {
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "completed",
        },
        terminal_authority_candidate_review: {
          schema: "helix.provider_terminal_authority_candidate_review.v1",
          terminal_authority_status: "pending_helix_terminal_authority",
        },
      },
    });
    expect(response.body.provider_terminal_candidate.candidate_id).toContain(
      "ask:test:codex-provider-candidate-route:agent_provider_terminal_candidate:codex:",
    );
  });
});
