import { describe, expect, it } from "vitest";
import {
  getWorkstationDynamicTools,
  mapClientWorkstationDynamicToolCallToAction,
} from "@/lib/workstation/workstationDynamicTools";

describe("workstation dynamic tools", () => {
  it("exposes Situation Room panels as schema-bound workstation tools", () => {
    const tools = getWorkstationDynamicTools();
    const createJob = tools.find((tool) => tool.name === "situation_room_pipelines.create_job");
    const createTranslationPair = tools.find((tool) => tool.name === "situation_room_pipelines.create_translation_pair");
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
    expect(createTranslationPair).toMatchObject({
      namespace: "workstation",
      panel_id: "situation-room-pipelines",
      action_id: "create_translation_pair",
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "situation_room_graph",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(createTranslationPair?.inputSchema).toMatchObject({
      required: ["speaker_a_id", "speaker_b_id", "speaker_a_native_language", "speaker_b_native_language"],
      properties: {
        render_policy: { enum: ["target_language", "native_language", "dual"] },
        voice_output: { enum: ["off", "on_confirm", "auto_when_direct_addressed"] },
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

  it("maps translation-pair graph tools onto panel actions", () => {
    const mapped = mapClientWorkstationDynamicToolCallToAction("situation_room_pipelines.create_translation_pair", {
      speaker_a_id: "spk_user_1",
      speaker_b_id: "spk_rowan",
      speaker_a_native_language: "en",
      speaker_b_native_language: "es",
      render_policy: "dual",
    });

    expect(mapped).toEqual({
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "create_translation_pair",
        args: {
          speaker_a_id: "spk_user_1",
          speaker_b_id: "spk_rowan",
          speaker_a_native_language: "en",
          speaker_b_native_language: "es",
          render_policy: "dual",
        },
      },
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

  it("exposes ideology and Zen framework actions as receipt-backed tools", () => {
    const tools = getWorkstationDynamicTools();
    const compare = tools.find((tool) => tool.name === "mission_ethos.compare_motive_to_zen");

    expect(compare).toMatchObject({
      namespace: "workstation",
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      risk: "low",
      returns_artifact: true,
      terminal_artifact_kind: "ideology_motive_comparison_receipt",
    });
    expect(compare?.inputSchema).toMatchObject({
      required: ["motive"],
      properties: {
        motive: { type: "string" },
        framework: { enum: ["zen", "mission_ethos", "custom"] },
        node_ids: { type: "array", items: { type: "string" } },
      },
    });
  });

  it("exposes process graph context pack as read-only situational awareness", () => {
    const tools = getWorkstationDynamicTools();
    const contextPack = tools.find((tool) => tool.name === "workstation_process_graph.get_context_pack");

    expect(contextPack).toMatchObject({
      namespace: "workstation",
      panel_id: "workstation-process-graph",
      action_id: "get_context_pack",
      risk: "low",
      returns_artifact: true,
      terminal_artifact_kind: "workstation_process_graph_context_pack",
    });
    expect(contextPack?.inputSchema).toMatchObject({
      required: [],
      properties: {
        max_nodes: { type: "number" },
        max_artifacts: { type: "number" },
        max_timeline: { type: "number" },
      },
    });
  });
});
