import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import {
  listHelixCapabilityLanes,
  resolveHelixCapabilityLaneRequest,
} from "../registry";

const buildProvider = (input: {
  id: "helix" | "codex";
  workstationTools?: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label: input.id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: input.id === "helix" ? "helix-native" : "read-observe-act",
    label: input.id === "helix" ? "Helix native governed runtime" : "Read/observe plus non-mutating action",
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
    streaming: input.id === "helix",
    workstationTools: input.workstationTools ?? true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

describe("Helix capability lane registry", () => {
  it("exposes the same governed lane definitions to Helix and Codex", () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      ELEVENLABS_API_KEY: "test-eleven",
      GOOGLE_GEMINI_API_KEY: "test-gemini",
    } as NodeJS.ProcessEnv;
    const helix = listHelixCapabilityLanes({
      provider: buildProvider({ id: "helix" }),
      env,
    });
    const codex = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex" }),
      env,
    });

    expect(helix.schema).toBe("helix.capability_lane_manifest.v1");
    expect(helix.policy_mode).toBe("shadow");
    expect(helix.backend_selection_policy).toMatchObject({
      owner: "helix",
      runtime_provider_may_request_preference: true,
      selected_runtime_provider_remains_root: true,
      dynamic_switching_enabled: false,
    });
    expect(codex.policy_mode).toBe("shadow");
    expect(helix.lane_ids).toEqual(codex.lane_ids);
    expect(helix.lane_ids).toEqual([
      "utility_text",
      "interactive_text",
      "deliberate_text",
      "code_text",
      "speech_to_text",
      "text_to_speech",
      "live_translation",
      "visual_analysis",
      "workstation_tool_reference",
    ]);
    expect(helix.lanes.find((lane) => lane.lane_id === "live_translation")).toMatchObject({
      status: "dry_run",
      backend_family: "local_runtime",
      default_backend_provider: "live_translation.local_runtime",
      backend_providers: [
        expect.objectContaining({
          provider_id: "live_translation.local_runtime",
          configuration_status: "not_required",
          required_env_vars: [],
          configured_env_vars: [],
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "free_local",
          latency_class: "interactive",
          privacy_class: "local_only",
          raw_secret_exposed: false,
        }),
        expect.objectContaining({
          provider_id: "live_translation.google_gemini",
          configuration_status: "configured",
          required_env_vars: ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"],
          configured_env_vars: ["GOOGLE_GEMINI_API_KEY"],
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "standard",
          latency_class: "realtime",
          privacy_class: "external_provider",
          fallback_backend_provider: "live_translation.local_runtime",
          raw_secret_exposed: false,
        }),
        expect.objectContaining({
          provider_id: "live_translation.openai_compatible",
          configuration_status: "configured",
          required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
          configured_env_vars: ["OPENAI_API_KEY"],
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "standard",
          latency_class: "interactive",
          privacy_class: "account_provider",
          fallback_backend_provider: "live_translation.local_runtime",
          raw_secret_exposed: false,
        }),
      ],
      one_shot_call_contract: {
        schema: "helix.capability_lane.one_shot_call_contract.v1",
        supported: true,
        request_schema_ref: "helix.live_translation.one_shot_request.v1",
        response_schema_ref: "helix.live_translation.one_shot_response.v1",
        output_role: "observation_or_receipt",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      },
      session_contract: expect.objectContaining({
        supported: true,
        requires_source_binding: true,
        emits_observations: true,
        terminal_eligible: false,
      }),
      goal_binding_contract: expect.objectContaining({
        supported: true,
        backend_provider_becomes_root_agent: false,
        final_reports_require_terminal_authority: true,
      }),
      observation_contract: expect.objectContaining({
        observation_schema_ref: "helix.live_translation.observation.v1",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      }),
      receipt_contract: expect.objectContaining({
        receipt_schema_ref: "helix.live_translation.receipt.v1",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      }),
      terminal_policy: {
        schema: "helix.capability_lane.terminal_policy.v1",
        lane_output_can_be_final_answer: false,
        terminal_authority_owner: "helix",
        requires_evidence_reentry: true,
        preserves_runtime_provider_root: true,
      },
      capabilities: [
        {
          schema: "helix.capability_lane.capability_descriptor.v1",
          capability_id: "live_translation.translate_text",
          label: "Translate text",
          lane_id: "live_translation",
          one_shot_status: "executable",
          session_status: "supported",
          backend_provider_required: true,
          result_authority: "observation_or_receipt_only",
          reentry_required: true,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(helix.lanes.find((lane) => lane.lane_id === "utility_text")).toMatchObject({
      status: "dry_run",
      backend_family: "local_runtime",
      model_or_service_ref: "utility_text_deterministic_v1",
      default_backend_provider: "utility_text.local_runtime",
      backend_providers: [
        expect.objectContaining({
          provider_id: "utility_text.local_runtime",
          configuration_status: "not_required",
          required_env_vars: [],
          configured_env_vars: [],
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "free_local",
          latency_class: "interactive",
          privacy_class: "local_only",
          raw_secret_exposed: false,
        }),
        expect.objectContaining({
          provider_id: "utility_text.openai_compatible",
          configuration_status: "configured",
          required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
          configured_env_vars: ["OPENAI_API_KEY"],
          availability_status: "dry_run",
          permission_status: "admitted",
          cost_class: "standard",
          latency_class: "interactive",
          privacy_class: "account_provider",
          fallback_backend_provider: "utility_text.local_runtime",
          raw_secret_exposed: false,
        }),
      ],
      one_shot_call_contract: expect.objectContaining({
        supported: true,
        terminal_eligible: false,
        assistant_answer: false,
      }),
      capabilities: [
        expect.objectContaining({
          capability_id: "utility_text.normalize_text",
          one_shot_status: "executable",
          session_status: "not_supported",
          backend_provider_required: true,
          result_authority: "observation_or_receipt_only",
        }),
      ],
    });
    expect(codex.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")).toMatchObject({
      status: "available",
      backend_family: "helix_workstation_gateway",
      result_authority: "observation_or_receipt_only",
      backend_providers: [
        expect.objectContaining({
          provider_id: "workstation_tool_reference.helix_workstation_gateway",
          cost_class: "free_local",
          latency_class: "local",
          privacy_class: "local_only",
        }),
      ],
      capabilities: [
        expect.objectContaining({
          capability_id: "workstation_tool_reference.list_capabilities",
          one_shot_status: "executable",
          backend_provider_required: false,
          terminal_eligible: false,
          assistant_answer: false,
        }),
      ],
      one_shot_call_contract: expect.objectContaining({
        supported: true,
        terminal_eligible: false,
        assistant_answer: false,
      }),
    });
    expect(helix.lanes.find((lane) => lane.lane_id === "visual_analysis")?.capabilities).toEqual([
      expect.objectContaining({
        capability_id: "visual_analysis.inspect_frame",
        one_shot_status: "shadow_only",
        session_status: "not_supported",
        backend_provider_required: true,
        result_authority: "observation_or_receipt_only",
      }),
    ]);
  });

  it("exposes backend key status without exposing raw secret values", () => {
    const secretValue = "do-not-leak-this-secret";
    const manifest = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex" }),
      env: {
        GOOGLE_GEMINI_API_KEY: secretValue,
      } as NodeJS.ProcessEnv,
    });
    const translation = manifest.lanes.find((lane) => lane.lane_id === "live_translation");
    const gemini = translation?.backend_providers.find(
      (provider) => provider.provider_id === "live_translation.google_gemini",
    );
    const openai = translation?.backend_providers.find(
      (provider) => provider.provider_id === "live_translation.openai_compatible",
    );

    expect(gemini).toMatchObject({
      provider_id: "live_translation.google_gemini",
      configuration_status: "configured",
      required_env_vars: ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"],
      configured_env_vars: ["GOOGLE_GEMINI_API_KEY"],
      availability_status: "dry_run",
      raw_secret_exposed: false,
    });
    expect(openai).toMatchObject({
      provider_id: "live_translation.openai_compatible",
      configuration_status: "missing",
      required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
      configured_env_vars: [],
      availability_status: "unconfigured",
      permission_status: "configuration_missing",
      fallback_backend_provider: "live_translation.local_runtime",
      raw_secret_exposed: false,
    });
    expect(JSON.stringify(manifest)).not.toContain(secretValue);
  });

  it("keeps configured AI lanes in dry-run instead of executing them", () => {
    const trace = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "codex" }),
      requestedLane: "interactive_text",
      requestedBackendProvider: "google_gemini",
      env: { OPENAI_API_KEY: "test-key" } as NodeJS.ProcessEnv,
    });

    expect(trace).toMatchObject({
      schema: "helix.capability_lane_resolve_trace.v1",
      selected_runtime_agent_provider: "codex",
      requested_lane: "interactive_text",
      admission_status: "admitted_shadow_only",
      lane_status: "dry_run",
      requested_backend_provider: "google_gemini",
      requested_backend_provider_known: false,
      requested_backend_configuration_status: "unknown",
      requested_backend_availability_status: "unknown",
      requested_backend_permission_status: "unknown",
      requested_backend_cost_class: "unknown",
      requested_backend_latency_class: "unknown",
      requested_backend_privacy_class: "unknown",
      requested_backend_fallback_provider: null,
      selected_backend_provider: "interactive_text.openai_compatible",
      backend_selection_decision: {
        schema: "helix.capability_lane.backend_selection_decision.v1",
        owner: "helix",
        outcome: "fallback_selected",
        reason: "requested_backend_unknown_default_backend_selected_by_helix_policy",
        requested_backend_provider: "google_gemini",
        requested_backend_provider_known: false,
        selected_backend_provider: "interactive_text.openai_compatible",
        fallback_backend_provider: null,
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      selection_reason: "requested_backend_unknown_default_backend_selected_by_helix_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "standard",
      latency_class: "interactive",
      privacy_class: "account_provider",
      fallback_backend_provider: null,
      resolved_backend_provider: "openai_compatible",
      resolved_model_or_service: "interactive_text_default",
      result_ref: null,
      observation_ref: null,
      receipt_ref: null,
      reentry_required: true,
      execution_status: "not_executed_shadow_only",
      blocked_reason: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(trace.terminal_policy).toMatchObject({
      terminal_authority_owner: "helix",
      lane_output_can_be_final_answer: false,
    });
  });

  it("records requested translation backend configuration while selecting the local deterministic fallback", () => {
    const unconfiguredGemini = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "codex" }),
      requestedLane: "live_translation",
      requestedBackendProvider: "live_translation.google_gemini",
      env: {} as NodeJS.ProcessEnv,
    });
    const configuredGemini = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "codex" }),
      requestedLane: "live_translation",
      requestedBackendProvider: "live_translation.google_gemini",
      env: { GOOGLE_GEMINI_API_KEY: "test-gemini" } as NodeJS.ProcessEnv,
    });

    expect(unconfiguredGemini).toMatchObject({
      requested_lane: "live_translation",
      admission_status: "admitted_shadow_only",
      requested_backend_provider: "live_translation.google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "missing",
      requested_backend_availability_status: "unconfigured",
      requested_backend_permission_status: "configuration_missing",
      requested_backend_cost_class: "standard",
      requested_backend_latency_class: "realtime",
      requested_backend_privacy_class: "external_provider",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: {
        schema: "helix.capability_lane.backend_selection_decision.v1",
        owner: "helix",
        outcome: "fallback_selected",
        reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
        requested_backend_provider: "live_translation.google_gemini",
        requested_backend_provider_known: true,
        selected_backend_provider: "live_translation.local_runtime",
        fallback_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      resolved_backend_provider: "local_runtime",
      resolved_model_or_service: "live_translation_deterministic_v1",
      execution_status: "not_executed_shadow_only",
    });
    expect(configuredGemini).toMatchObject({
      requested_lane: "live_translation",
      admission_status: "admitted_shadow_only",
      requested_backend_provider: "live_translation.google_gemini",
      requested_backend_provider_known: true,
      requested_backend_configuration_status: "configured",
      requested_backend_availability_status: "dry_run",
      requested_backend_permission_status: "admitted",
      requested_backend_cost_class: "standard",
      requested_backend_latency_class: "realtime",
      requested_backend_privacy_class: "external_provider",
      requested_backend_fallback_provider: "live_translation.local_runtime",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: {
        schema: "helix.capability_lane.backend_selection_decision.v1",
        owner: "helix",
        outcome: "requested_recorded_default_selected",
        reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
        requested_backend_provider: "live_translation.google_gemini",
        requested_backend_provider_known: true,
        selected_backend_provider: "live_translation.local_runtime",
        fallback_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        dynamic_switching_executed: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      resolved_backend_provider: "local_runtime",
      resolved_model_or_service: "live_translation_deterministic_v1",
      execution_status: "not_executed_shadow_only",
    });
  });

  it("fails closed for unknown and unconfigured lanes", () => {
    const unknown = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "helix" }),
      requestedLane: "random_model",
      env: {} as NodeJS.ProcessEnv,
    });
    const unconfigured = resolveHelixCapabilityLaneRequest({
      provider: buildProvider({ id: "helix" }),
      requestedLane: "text_to_speech",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(unknown).toMatchObject({
      admission_status: "blocked",
      lane_status: "unknown",
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      blocked_reason: "unknown_capability_lane",
      execution_status: "not_executed_shadow_only",
    });
    expect(unconfigured).toMatchObject({
      admission_status: "blocked",
      lane_status: "unconfigured",
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      blocked_reason: "backend_provider_key_or_endpoint_not_configured",
      execution_status: "not_executed_shadow_only",
    });
  });

  it("represents provider permission differences without changing lane definitions", () => {
    const enabled = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex", workstationTools: true }),
      env: {} as NodeJS.ProcessEnv,
    });
    const blocked = listHelixCapabilityLanes({
      provider: buildProvider({ id: "codex", workstationTools: false }),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(enabled.lane_ids).toEqual(blocked.lane_ids);
    expect(enabled.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")?.status).toBe("available");
    expect(blocked.lanes.find((lane) => lane.lane_id === "workstation_tool_reference")?.status).toBe("permission_blocked");
  });
});
