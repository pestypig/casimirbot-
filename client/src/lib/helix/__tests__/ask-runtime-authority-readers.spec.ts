import { describe, expect, it } from "vitest";

import {
  collectHelixAgentSelectedCapabilities,
  hasHelixAskBackendEntrypointTurnId,
  normalizeHelixRuntimeActionKey,
  readAgentLoopAuditArray,
  readAgentLoopAuditRecord,
  readHelixDecisionCapabilityKeys,
  readHelixGatewayCapabilityKeys,
  readHelixWorkstationActionRuntimeKeys,
} from "../ask-runtime-authority-readers";

describe("ask runtime authority readers", () => {
  it("reads only object records", () => {
    const record = { ok: true };
    expect(readAgentLoopAuditRecord(record)).toBe(record);
    expect(readAgentLoopAuditRecord(null)).toBeNull();
    expect(readAgentLoopAuditRecord("text")).toBeNull();
    expect(readAgentLoopAuditRecord(["not", "a", "record"])).toBeNull();
  });

  it("reads only audit arrays", () => {
    const array = [{ event: "step" }];
    expect(readAgentLoopAuditArray(array)).toBe(array);
    expect(readAgentLoopAuditArray(null)).toEqual([]);
    expect(readAgentLoopAuditArray({ event: "step" })).toEqual([]);
  });

  it("detects backend Ask entrypoint turn ids without admitting arbitrary ids", () => {
    expect(hasHelixAskBackendEntrypointTurnId("ask:turn-1")).toBe(true);
    expect(hasHelixAskBackendEntrypointTurnId("ask/turn-1")).toBe(true);
    expect(hasHelixAskBackendEntrypointTurnId("runtime:ask:abc-123:debug")).toBe(true);
    expect(hasHelixAskBackendEntrypointTurnId("chat:turn-1")).toBe(false);
    expect(hasHelixAskBackendEntrypointTurnId("task:asking:abc")).toBe(false);
    expect(hasHelixAskBackendEntrypointTurnId(" ")).toBe(false);
    expect(hasHelixAskBackendEntrypointTurnId(null)).toBe(false);
  });

  it("normalizes runtime action keys", () => {
    expect(normalizeHelixRuntimeActionKey(" Scientific-Calculator/Solve Expression ")).toBe(
      "scientific-calculator.solve_expression",
    );
    expect(normalizeHelixRuntimeActionKey("docs-viewer:open doc")).toBe("docs-viewer.open_doc");
  });

  it("collects decision capability keys from direct and nested records", () => {
    expect(
      readHelixDecisionCapabilityKeys({
        selected_capability: "scientific-calculator.solve_expression",
        next_action: {
          tool_name: "docs-viewer.open_doc",
        },
      }),
    ).toEqual(["scientific-calculator.solve_expression", "docs-viewer.open_doc"]);
  });

  it("collects successful gateway capability keys from payload and debug records", () => {
    expect(
      readHelixGatewayCapabilityKeys({
        workstation_gateway_call_results: [
          { ok: true, capability_id: "scientific-calculator.solve_expression" },
          { ok: false, capability_id: "docs-viewer.open_doc" },
        ],
        debug: {
          workstation_gateway_results: [
            {
              ok: true,
              gateway_admission: { requested_capability: "docs-viewer.open_doc" },
            },
          ],
        },
      }),
    ).toEqual(["scientific-calculator.solve_expression", "docs-viewer.open_doc"]);
  });

  it("collects selected capabilities from runtime-loop and gateway sources", () => {
    expect(
      collectHelixAgentSelectedCapabilities({
        agent_runtime_loop: {
          iterations: [
            { agent_step_decision: { selected_capability: "scientific-calculator.solve_expression" } },
          ],
        },
        debug: {
          observation_review: { tool_name: "docs-viewer.open_doc" },
        },
        workstation_gateway_call_results: [{ ok: true, capabilityId: "narrator.speak" }],
      }),
    ).toEqual(["docs-viewer.open_doc", "scientific-calculator.solve_expression", "narrator.speak"]);
  });

  it("projects workstation action runtime keys", () => {
    expect(
      readHelixWorkstationActionRuntimeKeys({
        panel_id: "scientific-calculator",
        action_id: "solve_expression",
        action: "run_panel_action",
      }),
    ).toEqual([
      "scientific-calculator.solve_expression",
      "scientific-calculator.solve_expression",
      "scientific-calculator.run_panel_action",
      "solve_expression",
      "run_panel_action",
    ]);
    expect(readHelixWorkstationActionRuntimeKeys({ panel_id: "docs-viewer", action: "open_panel" })).toEqual([
      "docs-viewer.open",
      "docs-viewer.open_panel",
      "open_panel",
    ]);
  });
});
