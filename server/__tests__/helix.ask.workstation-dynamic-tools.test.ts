import { describe, expect, it } from "vitest";
import {
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  buildWorkstationDynamicTools,
  mapWorkstationDynamicToolCallToAction,
} from "../services/helix-ask/workstation-dynamic-tools";

describe("Helix Ask workstation dynamic tools", () => {
  it("keeps Situation Room create-job in the shared workstation capability registry", () => {
    const action = WORKSTATION_DYNAMIC_TOOL_ACTIONS.find(
      (candidate) =>
        candidate.panel_id === "situation-room-pipelines" && candidate.action_id === "create_job",
    );
    const tool = buildWorkstationDynamicTools().find(
      (candidate) => candidate.name === "situation_room_pipelines.create_job",
    );

    expect(action).toMatchObject({
      required_args: ["kind"],
      returns_artifact: true,
    });
    expect(tool).toMatchObject({
      namespace: "workstation",
      terminal_artifact_kind: "situation_room_job",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
      deferLoading: true,
    });
  });

  it("maps dynamic tool calls to run_panel_action without a second control channel", () => {
    const mapped = mapWorkstationDynamicToolCallToAction("situation_room_pipelines.create_job", {
      kind: "translate",
      target_language: "es",
    });

    expect(mapped).toEqual({
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "create_job",
        args: {
          kind: "translate",
          target_language: "es",
        },
      },
    });
  });

  it("does not fall back to notes when required tool args are missing", () => {
    const mapped = mapWorkstationDynamicToolCallToAction("situation_room_pipelines.create_job", {
      target_language: "es",
    });

    expect(mapped).toEqual({
      ok: false,
      reason: "missing_required_args",
      missing_required_args: ["kind"],
    });
    expect(JSON.stringify(mapped)).not.toContain("workstation-notes");
  });
});
