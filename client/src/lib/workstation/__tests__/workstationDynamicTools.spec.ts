import { describe, expect, it } from "vitest";
import {
  getWorkstationDynamicTools,
  mapClientWorkstationDynamicToolCallToAction,
} from "@/lib/workstation/workstationDynamicTools";
import { WORKSTATION_V1_PANEL_CAPABILITIES } from "@/lib/workstation/panelCapabilities";
import {
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  buildWorkstationToolName,
} from "@shared/workstation-dynamic-tools";

const AGENT_CONTINUATION_ACTION_IDS = [
  "create_live_answer_environment",
  "attach_live_source",
  "set_live_commentary_policy",
  "request_agentic_review",
  "query_event_window",
  "query_synthetic_evidence",
  "goal_ledger.set_objective",
  "goal_ledger.mark_complete",
  "goal_ledger.mark_blocked",
  "goal.evaluate",
  "callout_policy.set_mode",
  "voice_delivery.propose_from_trace",
  "voice_delivery.confirm_speak",
  "live_continuation.start",
  "live_continuation.tick",
  "live_continuation.query",
  "live_continuation.pause",
  "live_continuation.resume",
  "live_continuation.stop",
  "worker_lane.run",
  "source_health.query",
] as const;

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

  it("exposes account-session interface language as a schema-bound workstation tool", () => {
    const tools = getWorkstationDynamicTools();
    const setLanguage = tools.find((tool) => tool.name === "account_session.set_interface_language");

    expect(setLanguage).toMatchObject({
      namespace: "workstation",
      panel_id: "account-session",
      action_id: "set_interface_language",
      deferLoading: false,
      risk: "low",
      returns_artifact: true,
      terminal_artifact_kind: "workspace_action_receipt",
    });
    expect(setLanguage?.inputSchema).toMatchObject({
      required: ["language"],
      properties: {
        language: { enum: ["en", "haw"] },
      },
    });

    expect(
      mapClientWorkstationDynamicToolCallToAction("account_session.set_interface_language", {
        language: "haw",
      }),
    ).toEqual({
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "account-session",
        action_id: "set_interface_language",
        args: { language: "haw" },
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

  it("exposes Dottie observer tools as receipt-backed manual actions", () => {
    const tools = getWorkstationDynamicTools();
    const manifest = tools.find((tool) => tool.name === "situation_room_pipelines.dottie_manifest");
    const attach = tools.find((tool) => tool.name === "situation_room_pipelines.observer_attach");
    const propose = tools.find((tool) => tool.name === "situation_room_pipelines.voice_delivery_propose_from_trace");

    expect(manifest).toMatchObject({
      namespace: "workstation",
      panel_id: "situation-room-pipelines",
      action_id: "dottie.manifest",
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "dottie_manifest_preset_receipt",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(manifest?.inputSchema).toMatchObject({
      properties: {
        voice_mode: { enum: expect.arrayContaining(["off", "propose_only", "on_confirm"]) },
        commentary_cadence: { enum: ["milestones_only", "salience_only", "manual"] },
      },
    });
    expect(attach).toMatchObject({
      namespace: "workstation",
      panel_id: "situation-room-pipelines",
      action_id: "observer.attach",
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "dottie_observer_subscription_receipt",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(attach?.inputSchema).toMatchObject({
      required: ["target_run_id", "observer_profile"],
      properties: {
        observer_profile: { enum: ["auntie_dottie", "dottie", "custom"] },
        event_filter: { type: "array", items: { type: "string" } },
        max_chars: { type: "number" },
      },
    });
    expect(propose).toMatchObject({
      panel_id: "situation-room-pipelines",
      action_id: "voice_delivery.propose_from_trace",
      terminal_artifact_kind: "dottie_voice_receipt",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
  });

  it("exposes generic construct recipe actions as the Situation Room builder surface", () => {
    const tools = getWorkstationDynamicTools();
    const createConstruct = tools.find((tool) => tool.name === "situation_room_pipelines.construct_create_from_recipe");
    const listRecipes = tools.find((tool) => tool.name === "situation_room_pipelines.construct_list_recipes");
    const queryConstructs = tools.find((tool) => tool.name === "situation_room_pipelines.construct_query");

    expect(createConstruct).toMatchObject({
      namespace: "workstation",
      panel_id: "situation-room-pipelines",
      action_id: "construct.create_from_recipe",
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "situation_construct_recipe_run",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(createConstruct?.inputSchema).toMatchObject({
      required: ["recipe_id"],
      properties: {
        recipe_id: {
          enum: expect.arrayContaining(["auntie_dottie_witness", "browser_audio_transcriber"]),
        },
        output: {
          enum: expect.arrayContaining(["transcript_stream", "voice_proposal", "live_answer_environment"]),
        },
        environment_id: {
          type: "string",
        },
      },
    });
    expect(listRecipes).toMatchObject({
      terminal_artifact_kind: "situation_construct_recipe_registry",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
    expect(queryConstructs).toMatchObject({
      terminal_artifact_kind: "situation_construct_query_result",
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
    });
  });

  it("maps construct recipe calls onto panel actions", () => {
    const mapped = mapClientWorkstationDynamicToolCallToAction("situation_room_pipelines.construct_create_from_recipe", {
      recipe_id: "auntie_dottie_witness",
      thread_id: "thread:dottie",
      room_id: "room:dottie",
    });

    expect(mapped).toEqual({
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "construct.create_from_recipe",
        args: {
          recipe_id: "auntie_dottie_witness",
          thread_id: "thread:dottie",
          room_id: "room:dottie",
        },
      },
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

  it("exposes Image Lens focus runs as observation-only visual evidence tools", () => {
    const tools = getWorkstationDynamicTools();
    const imageLensFocus = tools.find((tool) => tool.name === "image_lens.image_lens_focus_regions");
    const liveAnswerFocus = tools.find((tool) => tool.name === "live_answer_environment.image_lens_focus_regions");

    expect(imageLensFocus).toMatchObject({
      namespace: "workstation",
      panel_id: "image-lens",
      action_id: "image_lens.focus_regions",
      risk: "medium",
      returns_artifact: true,
      terminal_artifact_kind: "image_lens_focus_run_result",
    });
    expect(imageLensFocus?.inputSchema).toMatchObject({
      required: ["sourceId", "regions"],
      properties: {
        regions: {
          type: "array",
          items: {
            properties: {
              bboxPct: {
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                },
              },
              reason: { type: "string" },
            },
          },
        },
      },
    });
    expect(liveAnswerFocus).toMatchObject({
      panel_id: "live-answer-environment",
      action_id: "image_lens.focus_regions",
      terminal_artifact_kind: "image_lens_focus_run_result",
    });
  });

  it("keeps agent continuation Situation Room actions present in both tool registries", () => {
    const panelActions = new Set(
      WORKSTATION_V1_PANEL_CAPABILITIES["situation-room-pipelines"].actions.map((action) => action.id),
    );
    const sharedActions = new Set(
      WORKSTATION_DYNAMIC_TOOL_ACTIONS
        .filter((action) => action.panel_id === "situation-room-pipelines")
        .map((action) => action.action_id),
    );
    const tools = getWorkstationDynamicTools();

    for (const actionId of AGENT_CONTINUATION_ACTION_IDS) {
      expect(panelActions.has(actionId), `${actionId} missing from panel capabilities`).toBe(true);
      expect(sharedActions.has(actionId), `${actionId} missing from shared dynamic tool actions`).toBe(true);

      expect(
        tools.find(
          (tool) =>
            tool.name === buildWorkstationToolName("situation-room-pipelines", actionId) &&
            tool.panel_id === "situation-room-pipelines" &&
            tool.action_id === actionId,
        ),
        `${actionId} missing from generated client workstation tools`,
      ).toMatchObject({
        namespace: "workstation",
        returns_artifact: true,
      });
    }
  });
});
