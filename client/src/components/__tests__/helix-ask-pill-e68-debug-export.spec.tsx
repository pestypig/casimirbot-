import { describe, expect, it } from "vitest";

import { buildHelixDebugExportEnvelopeFromMasterPayload } from "@/lib/agi/debugExport";

describe("helix ask pill E68 debug export envelope", () => {
  it("projects the active completed turn into a canonical debug export", () => {
    const payload = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "turn-b",
        question: "Open Scientific Calculator",
        content: "Opening panel: Scientific Calculator.",
        mode: "read",
        debug: {},
      } as any,
      {
        selectedDebugFinalAnswer: "Opening panel: Scientific Calculator.",
        debug: {
          turn_id: "turn-b",
          selected_final_answer: "Opening panel: Scientific Calculator.",
          terminal_artifact_kind: "workspace_action_receipt",
          canonical_goal_frame: { goal_kind: "panel_control" },
        },
        agentLoop: {
          selected_final_answer: "Opening panel: Scientific Calculator.",
          final_answer_source: "artifact_synthesis",
          terminal_artifact_kind: "workspace_action_receipt",
          current_turn_artifact_ledger: [
            {
              artifact_id: "turn-b:panel_control:workspace_action_receipt",
              kind: "workspace_action_receipt",
              payload: {
                action_key: "scientific-calculator.open",
                target_id: "scientific-calculator",
                action_id: "open",
                status: "dispatched",
                message: "Opening panel: Scientific Calculator.",
                workspace_action_registry_audit: { verdict: "clean" },
                workspace_action_anti_determinism_audit: { verdict: "clean" },
                workspace_action_lifecycle_events: [
                  { event: "workspace_action/started" },
                  { event: "workspace_action/dispatched" },
                  { event: "workspace_action/completed" },
                ],
              },
            },
          ],
        },
      },
    );
    const parsed = JSON.parse(payload);

    expect(parsed.schema).toBe("helix.ask.debug_export.v1");
    expect(parsed.active_turn_id).toBe("turn-b");
    expect(parsed.active_prompt).toBe("Open Scientific Calculator");
    expect(parsed.selected_final_answer).toBe("Opening panel: Scientific Calculator.");
    expect(parsed.resolved_turn_summary.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(parsed.workspace_action_debug.workspace_action_receipt.target_id).toBe("scientific-calculator");
    expect(parsed.workspace_action_debug.workspace_action_debug_proof.final_answer_receipt_backed).toBe(true);
    expect(parsed.payload_hash).toEqual(expect.any(String));
  });
});
