import { describe, expect, it } from "vitest";
import {
  getWorkstationDynamicTools,
  mapClientWorkstationDynamicToolCallToAction,
} from "@/lib/workstation/workstationDynamicTools";

describe("workstation dynamic tools", () => {
  it("exposes Situation Room panels as schema-bound workstation tools", () => {
    const tools = getWorkstationDynamicTools();
    const createJob = tools.find((tool) => tool.name === "situation_room_pipelines.create_job");
    const attachSource = tools.find((tool) => tool.name === "situation_room_sources.attach_display_audio_source");

    expect(createJob).toMatchObject({
      namespace: "workstation",
      panel_id: "situation-room-pipelines",
      action_id: "create_job",
      deferLoading: true,
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "situation_room_job",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(createJob?.inputSchema).toMatchObject({
      required: ["kind"],
      properties: {
        kind: { enum: ["translate", "rolling_summary", "action_items", "prompt_composer"] },
        target_language: { type: "string" },
        attachment_policy: { enum: ["manual_only"] },
        context_injection: { enum: ["explicit_attachment_only"] },
      },
    });
    expect(attachSource).toMatchObject({
      terminal_artifact_kind: "situation_room_context",
    });
  });

  it("maps workstation tool calls onto the existing dispatcher action contract", () => {
    const mapped = mapClientWorkstationDynamicToolCallToAction("situation_room_pipelines.create_job", {
      kind: "translate",
      target_language: "es",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
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
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
        },
      },
    });
  });

  it("returns a bounded missing-slot result instead of choosing another action", () => {
    const mapped = mapClientWorkstationDynamicToolCallToAction("situation_room_pipelines.create_job", {
      target_language: "es",
    });

    expect(mapped).toEqual({
      ok: false,
      reason: "missing_required_args",
      missing_required_args: ["kind"],
    });
  });

  it("keeps save-as-note as a separate explicit tool", () => {
    const tools = getWorkstationDynamicTools();
    const createJob = tools.find((tool) => tool.name === "situation_room_pipelines.create_job");
    const saveJob = tools.find((tool) => tool.name === "situation_room_pipelines.save_job_as_note");

    expect(createJob?.terminal_artifact_kind).toBe("situation_room_job");
    expect(saveJob).toMatchObject({
      terminal_artifact_kind: "workstation_note",
      panel_id: "situation-room-pipelines",
      action_id: "save_job_as_note",
    });
  });
});
