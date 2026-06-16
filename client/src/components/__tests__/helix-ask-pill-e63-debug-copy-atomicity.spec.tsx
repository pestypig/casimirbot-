import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

let copyDebugPayloadToClipboard: typeof import("@/components/helix/HelixAskPill").copyDebugPayloadToClipboard;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ copyDebugPayloadToClipboard } = await import("@/components/helix/HelixAskPill"));
});

describe("Helix Ask E63 debug copy atomicity", () => {
  it("copies a nonempty parseable debug payload on the first write", async () => {
    const originalNavigator = globalThis.navigator;
    const writes: string[] = [];
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        clipboard: {
          writeText: vi.fn(async (text: string) => {
            writes.push(text);
          }),
          readText: vi.fn(async () => writes.at(-1) ?? ""),
        },
      },
    });

    const payload = JSON.stringify({
      active_turn_id: "turn-e63",
      selected_final_answer: "visible final",
      visible_projection_invariant: {
        violations: [],
      },
    });
    const result = await copyDebugPayloadToClipboard(payload);

    expect(result.ok).toBe(true);
    expect(result.copied_text_length).toBeGreaterThan(0);
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({
      active_turn_id: "turn-e63",
      selected_final_answer: "visible final",
    });

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("keeps the debug copy button single-shot instead of pointer-down plus click", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/helix/HelixAskPill.tsx"),
      "utf8",
    );

    expect(source).toContain("debugCopyInFlightRef");
    expect(source).not.toContain("onPointerDown={() => void handleCopyReplyMasterDebug");
  });

  it("preserves rail-critical fields when debug copy compacts an oversized payload", async () => {
    const originalNavigator = globalThis.navigator;
    const writes: string[] = [];
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        clipboard: {
          writeText: vi.fn(async (text: string) => {
            writes.push(text);
          }),
          readText: vi.fn(async () => writes.at(-1) ?? ""),
        },
      },
    });

    try {
      const payload = JSON.stringify({
        schema: "helix.ask.debug_export.v1",
        active_turn_id: "ask:test:compact-rails",
        selected_final_answer: "typed failure",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        terminal_error_code: "terminal_projection_mismatch",
        terminal_authority_single_writer: {
          schema: "helix.terminal_authority_single_writer_result.v1",
          selected_terminal_artifact_kind: "workstation_tool_evaluation",
          selected_terminal_artifact_ref: "ask:test:compact-rails:workstation_tool_evaluation",
        },
        terminal_boundary_eligibility: {
          schema: "helix.runtime_authority_boundary_report.v1",
          checks: { selected_capability_observation: true },
        },
        tool_rail_failure_triage: {
          schema: "helix.tool_rail_failure_triage.v1",
          first_broken_rail: "visible_projection",
          repair_target: "presenter_boundary",
        },
        agent_runtime_loop: {
          schema: "helix.agent_runtime_loop.v1",
          iterations: [
            {
              iteration: 1,
              chosen_capability: "scientific-calculator.solve_expression",
              executed_action_key: "scientific-calculator.solve_expression",
              next_step: "next_action",
              observed_artifact_refs: ["ask:test:compact-rails:workstation_tool_evaluation"],
              tool_observation: {
                kind: "workstation_tool_evaluation",
                artifact_id: "ask:test:compact-rails:workstation_tool_evaluation",
                status: "completed",
                ok: true,
              },
            },
            {
              iteration: 2,
              chosen_capability: "model.synthesize_from_tool_observation",
              next_step: "answer",
              observation_role: "model_answer_draft",
            },
          ],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: "ask:test:compact-rails:workstation_tool_evaluation",
            kind: "workstation_tool_evaluation",
            payload: {
              schema: "helix.workstation_tool_evaluation.v1",
              supports_goal: true,
              summary: "Calculator produced 29.5.",
            },
          },
        ],
        debug: {
          oversized_padding: "x".repeat(800_000),
        },
      });

      const result = await copyDebugPayloadToClipboard(payload);
      const copied = JSON.parse(writes.at(-1) ?? "{}");

      expect(result.ok).toBe(true);
      expect(copied.debug_export_size_control?.bounded_by).toBe("client_copy_path");
      expect(copied.agent_runtime_loop?.iteration_count).toBe(2);
      expect(copied.agent_runtime_loop?.iterations?.[0]?.chosen_capability).toBe(
        "scientific-calculator.solve_expression",
      );
      expect(copied.current_turn_artifact_ledger?.[0]).toMatchObject({
        artifact_id: "ask:test:compact-rails:workstation_tool_evaluation",
        kind: "workstation_tool_evaluation",
        payload_schema: "helix.workstation_tool_evaluation.v1",
      });
      expect(copied.terminal_authority_single_writer?.selected_terminal_artifact_kind).toBe(
        "workstation_tool_evaluation",
      );
      expect(copied.terminal_boundary_eligibility?.checks?.selected_capability_observation).toBe(true);
      expect(copied.tool_rail_failure_triage?.first_broken_rail).toBe("visible_projection");
      expect(copied.debug?.agent_runtime_loop?.iteration_count).toBe(2);
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    }
  });
});
