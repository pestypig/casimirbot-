import { describe, expect, it } from "vitest";
import {
  HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  type HelixLiveTranslationOneShotRequest,
} from "@shared/helix-live-translation-lane";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { runLiveTranslationTranslateText } from "../live-translation";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

const request = (input: Partial<HelixLiveTranslationOneShotRequest>): HelixLiveTranslationOneShotRequest => ({
  schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  capability: "live_translation.translate_text",
  text: "hello",
  source_language: "en",
  target_language: "es",
  requested_backend_provider: null,
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

describe("live_translation.translate_text one-shot lane", () => {
  it("returns a deterministic translation observation and non-terminal observation packet", () => {
    const result = runLiveTranslationTranslateText({
      provider: buildProvider("codex"),
      request: request({ requested_backend_provider: "google_gemini" }),
      turnId: "turn-translation",
      iteration: 2,
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.live_translation.one_shot_result.v1",
      ok: true,
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      selected_runtime_agent_provider: "codex",
      translated_text: "hola",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "live_translation",
      admission_status: "admitted_shadow_only",
      lane_status: "dry_run",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_cost_class: "standard",
      requested_backend_latency_class: "realtime",
      requested_backend_privacy_class: "external_provider",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.lane_resolve_trace.observation_ref).toBe(result.observation?.observation_ref);
    expect(result.observation).toMatchObject({
      schema: "helix.live_translation.observation.v1",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: "google_gemini",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      lane_session_id: null,
      source_language: "en",
      target_language: "es",
      translated_text: "hola",
      deterministic: true,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation?.source_text_hash).toBeTruthy();
    expect(result.observation).not.toHaveProperty("source_text");
    expect(result.observation_packet).toMatchObject({
      schema: "helix.agent_step_observation_packet.v1",
      turn_id: "turn-translation",
      iteration: 2,
      capability_key: "live_translation.translate_text",
      panel_id: "capability_lane",
      action: "translate_text",
      status: "succeeded",
      observation_summary: "Translation observation ready for en -> es.",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_backend_provider: "live_translation.local_runtime",
        terminal_authority_owner: "helix",
      }),
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.produced_artifact_refs).toEqual(result.artifact_refs);
  });

  it("keeps Helix and Codex on the same one-shot lane contract", () => {
    const helix = runLiveTranslationTranslateText({
      provider: buildProvider("helix"),
      request: request({ text: "The result is 72.", target_language: "fr" }),
      turnId: "turn-helix-translation",
      env: {} as NodeJS.ProcessEnv,
    });
    const codex = runLiveTranslationTranslateText({
      provider: buildProvider("codex"),
      request: request({ text: "The result is 72.", target_language: "fr" }),
      turnId: "turn-codex-translation",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(helix.ok).toBe(true);
    expect(codex.ok).toBe(true);
    expect(helix.translated_text).toBe("le resultat est 72.");
    expect(codex.translated_text).toBe("le resultat est 72.");
    expect(helix.lane_resolve_trace.selected_backend_provider).toBe("live_translation.local_runtime");
    expect(codex.lane_resolve_trace.selected_backend_provider).toBe("live_translation.local_runtime");
    expect(helix.observation_packet.terminal_eligible).toBe(false);
    expect(codex.observation_packet.terminal_eligible).toBe(false);
  });

  it("records chunk identity, ordering, dedupe, freshness, and projection target as observation metadata", () => {
    const result = runLiveTranslationTranslateText({
      provider: buildProvider("codex"),
      request: request({
        text: "thank you",
        lane_session_id: "lane-session-chunk",
        source_language: "en",
        target_language: "fr",
        source_id: "docs:nhm2:whitepaper",
        chunk_id: "chunk-7",
        chunk_index: 7,
        dedupe_key: "docs:nhm2:whitepaper:chunk-7:fr",
        source_event_ms: 1,
        projection_target: "docs_chunk",
      }),
      turnId: "turn-translation-chunk",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.ok).toBe(true);
    expect(result.translated_text).toBe("merci");
    expect(result.observation).toMatchObject({
      lane_session_id: "lane-session-chunk",
      source_id: "docs:nhm2:whitepaper",
      chunk_id: "chunk-7",
      chunk_index: 7,
      dedupe_key: "docs:nhm2:whitepaper:chunk-7:fr",
      source_event_ms: 1,
      freshness_status: "stale",
      projection_target: "docs_chunk",
      cancel_requested: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(typeof result.observation?.observed_at_ms).toBe("number");
    expect(result.observation_packet.state_delta).toMatchObject({
      live_translation_chunk: {
        lane_session_id: "lane-session-chunk",
        source_id: "docs:nhm2:whitepaper",
        chunk_id: "chunk-7",
        chunk_index: 7,
        dedupe_key: "docs:nhm2:whitepaper:chunk-7:fr",
        source_event_ms: 1,
        freshness_status: "stale",
        projection_target: "docs_chunk",
        cancel_requested: false,
        observation_ref: result.observation?.observation_ref,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet.receipts).toEqual([
      {
        receipt_ref: result.observation_packet.state_delta.live_translation_projection_receipt?.receipt_ref,
        kind: "live_translation_projection",
        status: "stale",
      },
    ]);
    expect(result.observation_packet.state_delta.live_translation_projection_receipt).toMatchObject({
      schema: "helix.live_translation.projection_receipt.v1",
      observation_ref: result.observation?.observation_ref,
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      projection_target: "docs_chunk",
      projection_status: "stale",
      source_id: "docs:nhm2:whitepaper",
      chunk_id: "chunk-7",
      chunk_index: 7,
      dedupe_key: "docs:nhm2:whitepaper:chunk-7:fr",
      source_event_ms: 1,
      freshness_status: "stale",
      target_language: "fr",
      translated_text: "merci",
      stale: true,
      cancel_requested: false,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.state_delta.live_translation_projection_receipt?.receipt_ref).toContain(
      `${result.observation?.observation_ref}:projection:`,
    );
    expect(typeof result.observation_packet.state_delta.live_translation_projection_receipt?.observed_at_ms).toBe(
      "number",
    );
  });

  it("normalizes cancelled chunks as non-terminal cancelled evidence without backend execution", () => {
    const result = runLiveTranslationTranslateText({
      provider: buildProvider("codex"),
      request: request({
        text: "hello",
        target_language: "es",
        source_id: "docs:hover",
        chunk_id: "hover-1",
        projection_target: "docs_hover",
        cancel_requested: true,
      }),
      turnId: "turn-translation-cancelled",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("translation_chunk_cancelled");
    expect(result.translated_text).toBeUndefined();
    expect(result.observation).toBeNull();
    expect(result.lane_resolve_trace).toMatchObject({
      execution_status: "not_executed_shadow_only",
      blocked_reason: "translation_chunk_cancelled",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      status: "blocked",
      observation_summary: "Translation chunk cancelled before backend execution.",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "live_translation.local_runtime",
        live_backend_execution_enabled: false,
      }),
      state_delta: {
        live_translation_chunk: {
          lane_session_id: null,
          source_id: "docs:hover",
          chunk_id: "hover-1",
          projection_target: "docs_hover",
          cancel_requested: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.receipts).toEqual([
      {
        receipt_ref: result.observation_packet.state_delta.live_translation_projection_receipt?.receipt_ref,
        kind: "live_translation_projection",
        status: "cancelled",
      },
    ]);
    expect(result.observation_packet.state_delta.live_translation_projection_receipt).toMatchObject({
      schema: "helix.live_translation.projection_receipt.v1",
      observation_ref: result.observation_packet.produced_artifact_refs[0],
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      projection_target: "docs_hover",
      projection_status: "cancelled",
      source_id: "docs:hover",
      chunk_id: "hover-1",
      target_language: "es",
      translated_text: null,
      stale: false,
      cancel_requested: true,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("normalizes missing text or target language as missing-input observation evidence", () => {
    const result = runLiveTranslationTranslateText({
      provider: buildProvider("codex"),
      request: request({ text: "", target_language: "" }),
      turnId: "turn-translation-missing",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("missing_text");
    expect(result.observation).toBeNull();
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "live_translation",
      admission_status: "admitted_shadow_only",
      execution_status: "not_executed_shadow_only",
      blocked_reason: "missing_text",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      status: "missing_input",
      observation_summary: "Translation lane missing required input.",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "live_translation.local_runtime",
        terminal_authority_owner: "helix",
      }),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.missing_requirements.map((entry) => entry.code)).toEqual([
      "missing_text",
      "missing_target_language",
    ]);
  });
});
