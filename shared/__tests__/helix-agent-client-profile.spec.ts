import { describe, expect, it } from "vitest";
import {
  HELIX_AGENT_CLIENT_PROFILES,
  HELIX_AGENT_CLIENT_PROFILE_SCHEMA,
  helixAgentClientProfileSchema,
  helixAgentConnectionStatusSchema,
} from "../helix-agent-client-profile";
import { buildHelixAgentClientReadiness } from "../helix-agent-client-readiness";
import {
  helixThreadObservabilityBridgeDeclarationSchema,
} from "../helix-local-supervisor-coordination";

describe("Helix external-agent client profiles", () => {
  it("seals a provider-neutral manifest for Codex and standards MCP", () => {
    expect(Object.keys(HELIX_AGENT_CLIENT_PROFILES)).toEqual([
      "codex_app",
      "standard_mcp",
    ]);
    for (const value of Object.values(HELIX_AGENT_CLIENT_PROFILES)) {
      expect(helixAgentClientProfileSchema.parse(value).schema).toBe(
        HELIX_AGENT_CLIENT_PROFILE_SCHEMA,
      );
      expect(value.transport).toBe("streamable_http");
      expect(value.authentication).toBe("oauth_authorization_code_pkce");
      expect(value.oauth_session_continuity).toEqual({
        requested_scope: "offline_access",
        refresh_token_required: true,
        credential_custody: "external_ai_client",
        capability_authority_expanded: false,
      });
      expect(value.accepts_provider_credentials).toBe(false);
      expect(value.provider_chat_control).toBe(false);
      expect(value.hidden_reasoning_access).toBe(false);
      expect(value.environment_authority).toBe(false);
      expect(value.endpoint_variants).toEqual(expect.arrayContaining([
        expect.objectContaining({ purpose: "coordination_only", default: true }),
        expect.objectContaining({ purpose: "full_harness", default: false }),
      ]));
      expect(value.thread_observability_bridge.baseline_level).toBe(
        "tool_activity_only",
      );
      expect(value.thread_observability_bridge.ordinary_mcp_requires_checkpoint)
        .toBe(false);
      expect(value.consent_upgrade.scope_increase_is_silent).toBe(false);
    }
  });

  it("distinguishes tool activity, checkpoint publication, and continuation", () => {
    expect(helixThreadObservabilityBridgeDeclarationSchema.safeParse({
      supported_levels: ["tool_activity_only"],
      requested_level: "tool_activity_only",
      checkpoint_publication: null,
    }).success).toBe(true);
    expect(helixThreadObservabilityBridgeDeclarationSchema.safeParse({
      supported_levels: ["tool_activity_only", "checkpoint_publish"],
      requested_level: "checkpoint_publish",
      checkpoint_publication: {
        freshness_window_seconds: 120,
        retention: "current_session",
        revocation: "independent",
      },
    }).success).toBe(true);
    expect(helixThreadObservabilityBridgeDeclarationSchema.safeParse({
      supported_levels: ["tool_activity_only"],
      requested_level: "checkpoint_publish",
      checkpoint_publication: null,
    }).success).toBe(false);
    expect(helixThreadObservabilityBridgeDeclarationSchema.safeParse({
      supported_levels: ["tool_activity_only", "continuation_ready"],
      requested_level: "continuation_ready",
      checkpoint_publication: {
        freshness_window_seconds: 120,
        retention: "current_session",
        revocation: "independent",
      },
    }).success).toBe(false);
  });

  it("rejects endpoint-purpose mismatches and multiple defaults", () => {
    const malformed = structuredClone(HELIX_AGENT_CLIENT_PROFILES.codex_app);
    malformed.endpoint_variants[1] = {
      ...malformed.endpoint_variants[1],
      endpoint_path: "/mcp/local-supervisor-coordination",
      default: true,
    };
    expect(helixAgentClientProfileSchema.safeParse(malformed).success).toBe(false);
  });

  it("does not let selecting Codex verify the provider or control its chat", () => {
    const codex = HELIX_AGENT_CLIENT_PROFILES.codex_app;
    expect(codex.provider_app_identity_verified_by_selection).toBe(false);
    expect(codex.silent_configuration_mutation).toBe(false);
    expect(codex.endpoint_path).toBe("/mcp/local-supervisor-coordination");
    expect(codex.optional_device_check_surface).toBe("codex_plugin_deep_link");
    expect(codex.catalog_refresh).toBe("new_chat_required");
    expect(codex.provider_owned_steps).toContain("create_or_select_chat");
  });

  it("rejects status projections containing undeclared data", () => {
    const readiness = buildHelixAgentClientReadiness({
      agentSelected: true,
      provider_application: "unknown",
      client_authorization: "active",
      client_presence: "online",
      catalog_sync: "current",
      thread_attachment: "attached",
      continuation_readiness: "polling",
      environment_readiness: "not_selected",
    });
    const candidate = {
      schema: "helix.agent_connection_status.v1",
      selected_client_profile: "codex_app",
      selected_profile_is_preference_only: true,
      client_kind_verified: false,
      authenticated_profile_ref: "profile_ref",
      service_instance_ref: "service_ref",
      oauth_binding_ref: "binding_ref",
      authenticated_mcp_client_ref: "client_ref",
      client_session_ref: "session_ref",
      conversation_thread_ref: "thread_ref",
      proof_basis: "authenticated_presence_tool",
      observed_at: "2026-08-31T12:00:00.000Z",
      heartbeat_expires_at: "2026-08-31T12:01:00.000Z",
      authorization_changed_after_presence: false,
      catalog_reenumeration_required: false,
      catalog_recovery: "none",
      thread_observability_bridge: {
        negotiated_level: "tool_activity_only",
        declaration_basis: "authenticated_client_declaration",
        checkpoint_publication_status: "not_requested",
        checkpoint_freshness_window_seconds: null,
        checkpoint_retention: "none",
        checkpoint_revocation: "not_applicable",
        provider_thread_content_included: false,
        hidden_reasoning_included: false,
        activity_completeness_claimed: false,
      },
      readiness,
      readiness_schema: "helix.agent_client_readiness.v1",
      credential_included: false,
      oauth_subject_included: false,
      raw_claims_included: false,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      environment_authority: false,
      mutation_authority: false,
      answer_authority: false,
      terminal_eligible: false,
    };
    expect(helixAgentConnectionStatusSchema.safeParse(candidate).success).toBe(true);
    expect(helixAgentConnectionStatusSchema.safeParse({
      ...candidate,
      bearer: "secret",
    }).success).toBe(false);
  });
});
