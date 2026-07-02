import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { codexProvider } from "../codex-provider";

describe("Codex provider capability lane adapter", () => {
  it("surfaces configured LLM model metadata for UI receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousModel = process.env.LLM_HTTP_MODEL;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Hello from configured model.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.LLM_HTTP_MODEL = "gpt-4o-mini";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-model-metadata",
          question: "Say hello.",
        },
      });
      const debug = result.debug as Record<string, unknown>;

      expect(result).toMatchObject({
        llm_http_model_configured: "gpt-4o-mini",
        llm_model: "gpt-4o-mini",
      });
      expect(debug).toMatchObject({
        llm_http_model_configured: "gpt-4o-mini",
        llm_model: "gpt-4o-mini",
      });
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
      if (previousModel === undefined) {
        delete process.env.LLM_HTTP_MODEL;
      } else {
        process.env.LLM_HTTP_MODEL = previousModel;
      }
    }
  });

  it("retries a noncompliant direct translation answer before executing the lane", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-lane-retry-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "hola",
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es"}',
        "The translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-natural-lane-retry",
          question: "Translate hello to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const retryPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const reentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.3.txt"), "utf8");

      expect(result).toMatchObject({
        ok: true,
        answer: "The translation is hola.",
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.codex_runtime_lane_request_contract.v1",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: false,
        retry_attempted: true,
        retry_status: "runtime_provider_emitted_lane_request",
        final_candidate_present: true,
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(debug.runtime_lane_request_retry).toMatchObject({
        schema: "helix.codex_runtime_lane_request_retry.v1",
        status: "runtime_provider_emitted_lane_request",
        reason: "initial_provider_response_skipped_required_one_shot_lane_request",
        prior_response_preview: "hola",
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        retry: expect.objectContaining({
          status: "runtime_provider_emitted_lane_request",
        }),
        candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
        }),
      });
      expect(debug.capability_lane_call_results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          translated_text: "hola",
        }),
      ]));
      expect(debug.provider_reasoning_reentry).toMatchObject({
        status: "completed",
        capability_lane_observation_packet_count: 1,
        evidence_reentered: true,
      });
      expect(retryPrompt).toContain("prior response did not follow the capability lane request contract");
      expect(retryPrompt).toContain("Prior non-compliant response:");
      expect(reentryPrompt).toContain("Capability lane observation block after Helix execution:");
      expect(reentryPrompt).toContain("translated_text");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
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

  it("lets ordinary Codex turns request a one-shot lane and answer after observation re-entry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-lane-loop-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es","requested_backend_provider":"live_translation.google_gemini"}',
        "The translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-natural-lane-request",
          question: "Translate hello to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const firstPrompt = fs.readFileSync(capturePromptPath, "utf8");
      const secondPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "The translation is hola.",
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.codex_runtime_lane_request_contract.v1",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: true,
        retry_attempted: false,
        final_candidate_present: true,
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        schema: "helix.codex_runtime_lane_request_loop.v1",
        status: "lane_observation_reentered",
        requested_by_runtime_provider: true,
        selected_runtime_agent_provider: "codex",
        candidate: {
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
          requested_backend_provider: "live_translation.google_gemini",
        },
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.capability_lane_call_results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          lane_id: "live_translation",
          translated_text: "hola",
          lane_resolve_trace: expect.objectContaining({
            selected_backend_provider: "live_translation.local_runtime",
          }),
          terminal_eligible: false,
          assistant_answer: false,
        }),
      ]));
      expect(debug.capability_lane_backend_selections).toEqual(expect.arrayContaining([
        expect.objectContaining({
          requested_backend_provider: "live_translation.google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          execution_status: "executed_observation_only",
        }),
      ]));
      expect(debug.capability_lane_debug_events).toEqual(expect.arrayContaining([
        expect.objectContaining({ stage: "lane_requested" }),
        expect.objectContaining({ stage: "lane_backend_selected" }),
        expect.objectContaining({ stage: "lane_observation" }),
        expect.objectContaining({ stage: "lane_reentered" }),
      ]));
      expect(debug.provider_reasoning_reentry).toMatchObject({
        status: "completed",
        capability_lane_observation_packet_count: 1,
        evidence_reentered: true,
      });
      expect(debug.terminal_authority_status).toBe("authorized_by_helix_provider_candidate_bridge");
      expect(firstPrompt).toContain("Model-visible Helix capability lane manifest:");
      expect(firstPrompt).toContain("request live_translation.translate_text");
      expect(firstPrompt).toContain("direct translation answer before the lane observation is non-compliant");
      expect(secondPrompt).toContain("Helix executed the runtime-requested capability lane call");
      expect(secondPrompt).toContain("translated_text");
      expect(secondPrompt).toContain("hola");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
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
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.codex_runtime_lane_request_contract.v1",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: false,
        retry_attempted: false,
        final_candidate_present: false,
        execution_status: "no_lane_request_candidate",
        observation_packet_count: 0,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
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

  it("normalizes Moral Graph substrate gateway observations for Codex re-entry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Moral substrate observation received.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          agent_runtime: "codex",
          turn_id: "turn-codex-moral-substrate-gateway",
          question:
            "Use moral-graph.reflect_living_substrate_context for organism boundary, sensing, homeostasis, entropy pressure, and non-human living systems.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(debug.workstation_gateway_call_results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ok: true,
            capability_id: "moral-graph.reflect_living_substrate_context",
          }),
        ]),
      );
      expect(debug.current_turn_artifact_ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "moral_living_substrate_reflection",
            observation_kind: "moral_living_substrate_reflection",
            payload_schema: "helix.moral_living_substrate_reflection_observation.v1",
            capability_key: "moral-graph.reflect_living_substrate_context",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      );
      expect(debug.provider_observation_normalization_failures ?? []).not.toContain(
        "provider_observation_normalization_missing:moral-graph.reflect_living_substrate_context",
      );
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
    }
  });
});
