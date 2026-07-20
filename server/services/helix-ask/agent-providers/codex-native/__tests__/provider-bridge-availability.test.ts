import { afterEach, describe, expect, it } from "vitest";
import {
  readTurnAdmittedWorkstationTools,
  resolveCodexNativeProviderBridgeAvailability,
} from "../provider-bridge";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Codex native provider bridge availability", () => {
  it("intersects a durable goal allowlist with the narrower current-turn admission", () => {
    expect(readTurnAdmittedWorkstationTools({
      runtime_goal_session: {
        allowed_workstation_tools: [
          "workspace_os.status",
          "repo.search",
          "scientific-calculator.solve_expression",
        ],
      },
      tool_call_admission_decision: {
        compound_requested_capabilities: [
          "workspace_os.status",
          "scientific-calculator.solve_expression",
          "internet-search.search_web",
        ],
      },
    })).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
  });

  it("exposes no native tools for a rejected or contextually suppressed admission", () => {
    expect(readTurnAdmittedWorkstationTools({
      tool_call_admission_decision: {
        admission_status: "rejected",
        requested_capability: "scientific-calculator.solve_expression",
        selected_capability: "scientific-calculator.solve_expression",
        tool_admission_suppressed: true,
        runtime_capability_rejection_reason: "contextual_tool_reference_suppressed",
      },
    })).toEqual([]);
  });

  it("projects the complete policy-admitted compound route using canonical gateway ids", () => {
    expect(readTurnAdmittedWorkstationTools({
      question:
        "Use docs.search for docs/research/nhm2-current-status-whitepaper.md with query claim boundary; scientific-calculator.solve_expression with expression 8*9; theory-badge-graph.reflect_discussion_context for NHM2 claim boundary.",
    })).toEqual([
      "docs.search",
      "scientific-calculator.solve_expression",
      "theory-badge-graph.reflect_discussion_context",
    ]);
  });

  it("distinguishes an omitted goal tool list from an explicit hard-deny list", () => {
    expect(readTurnAdmittedWorkstationTools({})).toBeNull();
    expect(readTurnAdmittedWorkstationTools({
      runtime_goal_session: { allowed_workstation_tools: [] },
    })).toEqual([]);
  });

  it("does not turn deterministic test suites into live API calls", () => {
    process.env.VITEST = "true";
    process.env.OPENAI_API_KEY = "test-key-present";
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    delete process.env.HELIX_CODEX_NATIVE_APP_SERVER_TEST_ENABLED;

    expect(resolveCodexNativeProviderBridgeAvailability()).toEqual({
      enabled: true,
      available: false,
      unavailableReason: "native_app_server_disabled_in_test",
    });
  });

  it("allows an explicitly opted-in native integration test", () => {
    process.env.VITEST = "true";
    process.env.OPENAI_API_KEY = "test-key-present";
    process.env.HELIX_CODEX_NATIVE_APP_SERVER_TEST_ENABLED = "1";
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;

    expect(resolveCodexNativeProviderBridgeAvailability()).toEqual({
      enabled: true,
      available: true,
      unavailableReason: null,
    });
  });
});
