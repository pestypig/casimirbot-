import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { codexProvider } from "../codex-provider";

describe("Codex provider capability lane adapter", () => {
  it("exposes requestable capability lanes in ordinary Codex turn debug context", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-prompt-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    process.env.CODEX_AGENT_FAKE_STDOUT = "I can use live_translation.translate_text as an observation-only lane.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-model-visible-lanes",
          question: "What translation lane/tool can you use?",
        },
      });
      const prompt = fs.readFileSync(capturePromptPath, "utf8");
      const debug = result.debug as Record<string, any>;
      const modelVisible = debug.model_visible_capability_lane_manifest;
      const translation = modelVisible.lanes
        .flatMap((lane: any) => lane.capabilities)
        .find((capability: any) => capability.capability_id === "live_translation.translate_text");

      expect(result.ok).toBe(true);
      expect(modelVisible).toMatchObject({
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        selected_runtime_agent_provider: "codex",
        authority_rules: expect.objectContaining({
          helix_owns_backend_selection: true,
          selected_runtime_provider_remains_root: true,
          lane_outputs_are_not_final_answers: true,
          terminal_authority_owner: "helix",
        }),
      });
      expect(translation).toMatchObject({
        required_input_fields: ["text", "target_language"],
        optional_input_fields: expect.arrayContaining(["source_language", "requested_backend_provider"]),
        result_authority: "observation_or_receipt_only",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(translation.when_to_use).toContain("translate");
      expect(translation.when_not_to_use).toContain("docs-viewer.read_active_translation");
      expect(JSON.stringify(translation.request_shape_hint)).toContain("capability_lane_call");
      expect(JSON.stringify(translation.request_shape_hint)).toContain("live_translation.translate_text");
      expect(debug.agent_runtime_adapter_contract.model_visible_capability_lane_manifest).toEqual(modelVisible);
      expect(prompt).toContain("Model-visible Helix capability lane manifest:");
      expect(prompt).toContain("live_translation.translate_text");
      expect(prompt).toContain("docs-viewer.read_active_translation");
      expect(prompt).toContain("lane_outputs_are_not_final_answers");
      expect(prompt).toContain("Capability lane outputs are observations or receipts");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("executes structured one-shot lane calls at the provider adapter edge", async () => {
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-lane-adapter",
        question: "",
        capability_lane_call: {
          capability: "utility_text.normalize_text",
          text: "  HELLO   WORKSTATION  ",
          normalization_mode: "lowercase",
          requested_backend_provider: "utility_text.openai_compatible",
        },
      },
    });
    const debug = result.debug as Record<string, unknown>;

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
    });
    expect(debug.capability_lane_call_results).toEqual([
      expect.objectContaining({
        schema: "helix.utility_text.normalize_result.v1",
        ok: true,
        capability: "utility_text.normalize_text",
        lane_id: "utility_text",
        normalized_text: "hello workstation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_resolve_traces).toEqual([
      expect.objectContaining({
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        execution_status: "executed_observation_only",
      }),
    ]);
    expect(debug.capability_lane_backend_selections).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.backend_selection_summary.v1",
        selected_runtime_agent_provider: "codex",
        lane_id: "utility_text",
        capability: "utility_text.normalize_text",
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
        execution_status: "executed_observation_only",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_observation_packets).toEqual([
      expect.objectContaining({
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "turn-codex-lane-adapter",
        capability_key: "utility_text.normalize_text",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_debug_events).toEqual([
      expect.objectContaining({ stage: "lane_requested" }),
      expect.objectContaining({ stage: "lane_backend_selected" }),
      expect.objectContaining({ stage: "lane_observation" }),
      expect.objectContaining({ stage: "lane_reentered" }),
    ]);
    expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
    expect(debug.current_turn_artifact_ledger).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "capability_lane_observation_packet",
          observation_kind: "utility_text.normalize_text",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]),
    );
  });
});
