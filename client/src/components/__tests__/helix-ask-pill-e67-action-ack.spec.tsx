import { describe, expect, it } from "vitest";

import { buildWorkspaceActionClientAckSnapshot } from "@/lib/agi/workspaceActionAck";

describe("helix ask pill E67 action ack precision", () => {
  it("keeps dispatched-only receipts as not yet applied without client visibility", () => {
    const ack = buildWorkspaceActionClientAckSnapshot({
      artifactLedger: [
        {
          kind: "workspace_action_receipt",
          turn_id: "turn-1",
          producer_item_id: "panel_control",
          payload: {
            kind: "workspace_action_receipt",
            turn_id: "turn-1",
            producer_item_id: "panel_control",
            action_key: "agi-essence-console.open",
            target_id: "agi-essence-console",
            action_id: "open",
            status: "dispatched",
          },
        },
      ],
      openPanels: ["docs-viewer"],
      createdAtMs: 1000,
    });

    expect(ack).toEqual([
      {
        turn_id: "turn-1",
        item_id: "panel_control",
        action_key: "agi-essence-console.open",
        target_id: "agi-essence-console",
        action_id: "open",
        applied: false,
        created_at_ms: 1000,
      },
    ]);
  });

  it("marks acknowledgement as applied only when the target panel is visible", () => {
    const ack = buildWorkspaceActionClientAckSnapshot({
      artifactLedger: [
        {
          kind: "workspace_action_receipt",
          turn_id: "turn-2",
          producer_item_id: "panel_control",
          payload: {
            action_key: "agi-essence-console.open",
            target_id: "agi-essence-console",
            action_id: "open",
          },
        },
      ],
      openPanels: ["docs-viewer", "agi-essence-console"],
      createdAtMs: 2000,
    });

    expect(ack[0]).toMatchObject({
      turn_id: "turn-2",
      item_id: "panel_control",
      action_key: "agi-essence-console.open",
      target_id: "agi-essence-console",
      action_id: "open",
      applied: true,
      visible_panel_id: "agi-essence-console",
    });
  });
});
