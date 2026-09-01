import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import type { HelixAgentAccountBindingProjection } from "../../services/helix-account/agent-account-link-store";
import { createAgentConnectionsRouter } from "../agent-connections";

const SESSION_ID = "session-owned";
const PROFILE_ID = "profile-owned";
const SERVICE_REF = "service-current";
const binding: HelixAgentAccountBindingProjection = {
  binding_ref: "binding-owned",
  issuer: "https://auth.example",
  tenant_ref: "tenant-ref",
  provider: "auth0",
  status: "active",
  created_at: "2026-08-31T12:00:00.000Z",
  updated_at: "2026-08-31T12:00:00.000Z",
  revoked_at: null,
  subject_included: false,
  bearer_included: false,
};

const presence = (overrides: Partial<HelixLocalSupervisorPresence> = {}): HelixLocalSupervisorPresence => ({
  schema: "helix.local_supervisor_coordination.v1",
  service_instance_ref: SERVICE_REF,
  client_session_ref: "client-session-owned",
  conversation_thread_ref: "thread-owned",
  authenticated_profile_ref: PROFILE_ID,
  authenticated_mcp_client_ref: "mcp-client-owned",
  declared_objective_summary: "Observe setup readiness",
  declared_objective_is_verified: false,
  lifecycle_basis: "authenticated_client_heartbeat",
  lifecycle_state: "active",
  resource_claims: [],
  room_ref: null,
  environment_ref: null,
  run_ref: null,
  verified_room_identity: null,
  verified_connector_identity: null,
  verified_retained_runtime_identity: null,
  verified_execution_lease_identity: null,
  blocker_summary: null,
  observed_at: "2026-08-31T12:00:00.000Z",
  heartbeat_expires_at: "2026-08-31T12:01:00.000Z",
  active: true,
  credential_included: false,
  private_endpoint_included: false,
  hidden_reasoning_included: false,
  native_account_identity_included: false,
  content_role: "supervisor_presence_advisory",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const setup = (input?: { bindings?: HelixAgentAccountBindingProjection[]; presence?: HelixLocalSupervisorPresence[] }) => {
  const listBindings = vi.fn(async () => ({
    schema: "helix.agent_account_bindings.v1" as const,
    oauth_ready: (input?.bindings ?? [binding]).some((entry) => entry.status === "active"),
    bindings: input?.bindings ?? [binding],
  }));
  const coordinationStore = {
    serviceInstanceRef: SERVICE_REF,
    listPresence: vi.fn(() => input?.presence ?? [presence()]),
  };
  const resolveSession = vi.fn(async () => ({
    session_id: SESSION_ID,
    profile: { profile_id: PROFILE_ID },
  }));
  const app = express();
  app.use("/api/account", createAgentConnectionsRouter({
    bindingStore: { listBindings } as never,
    coordinationStore,
    resolveSession,
  }));
  return { app, listBindings, coordinationStore, resolveSession };
};

const getReadiness = (app: express.Express, profile = "codex_app") =>
  request(app)
    .get(`/api/account/session/agent-connections/readiness?client_profile=${profile}`)
    .set("Cookie", `helix_session=${SESSION_ID}`);

describe("owner-scoped AI app connection readiness", () => {
  it("requires a signed-in profile and a supported client profile", async () => {
    const { app, listBindings } = setup();
    await request(app)
      .get("/api/account/session/agent-connections/readiness?client_profile=codex_app")
      .expect(401);
    await getReadiness(app, "unknown-client").expect(400);
    expect(listBindings).not.toHaveBeenCalled();
  });

  it("projects exact authenticated presence without claiming client-kind verification", async () => {
    const { app } = setup();
    const response = await getReadiness(app).expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      selected_client_profile: "codex_app",
      selected_profile_is_preference_only: true,
      client_kind_verified: false,
      authenticated_profile_ref: PROFILE_ID,
      service_instance_ref: SERVICE_REF,
      oauth_binding_ref: "binding-owned",
      authenticated_mcp_client_ref: "mcp-client-owned",
      client_session_ref: "client-session-owned",
      conversation_thread_ref: "thread-owned",
      proof_basis: "authenticated_presence_tool",
      authorization_changed_after_presence: false,
      catalog_reenumeration_required: false,
      catalog_recovery: "none",
      credential_included: false,
      oauth_subject_included: false,
      hidden_reasoning_included: false,
      environment_authority: false,
      mutation_authority: false,
      answer_authority: false,
      terminal_eligible: false,
      readiness: {
        client_authorization: "active",
        client_presence: "online",
        catalog_sync: "current",
        thread_attachment: "attached",
      },
    });
    const serialized = JSON.stringify(response.body).toLowerCase();
    expect(serialized).not.toContain("bearer");
    expect(serialized).not.toContain("objective");
  });

  it("requires reconnect and catalog re-enumeration after authorization changes", async () => {
    const upgradedBinding = {
      ...binding,
      updated_at: "2026-08-31T12:00:30.000Z",
    };
    const { app } = setup({
      bindings: [upgradedBinding],
      presence: [presence({ observed_at: "2026-08-31T12:00:00.000Z" })],
    });
    const response = await getReadiness(app).expect(200);
    expect(response.body).toMatchObject({
      proof_basis: "authenticated_presence_tool",
      authorization_changed_after_presence: true,
      catalog_reenumeration_required: true,
      catalog_recovery: "reconnect_and_refresh",
      readiness: {
        catalog_sync: "stale",
        thread_attachment: "stale",
        recovery_action: "refresh_tools",
      },
    });
  });

  it("projects optional checkpoint negotiation without claiming activity completeness", async () => {
    const { app } = setup({
      presence: [presence({
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "checkpoint_publish"],
          requested_level: "checkpoint_publish",
          checkpoint_publication: {
            freshness_window_seconds: 120,
            retention: "current_session",
            revocation: "independent",
          },
          declaration_basis: "authenticated_client_declaration",
          provider_thread_content_included: false,
          hidden_reasoning_included: false,
          answer_authority: false,
          terminal_eligible: false,
        },
      })],
    });
    const response = await getReadiness(app).expect(200);
    expect(response.body.thread_observability_bridge).toEqual({
      negotiated_level: "checkpoint_publish",
      declaration_basis: "authenticated_client_declaration",
      checkpoint_publication_status: "negotiated_no_checkpoint_observed",
      checkpoint_freshness_window_seconds: 120,
      checkpoint_retention: "current_session",
      checkpoint_revocation: "independent",
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      activity_completeness_claimed: false,
    });
  });

  it("filters another profile, another node, stale, and unauthenticated presence", async () => {
    const candidates = [
      presence({ authenticated_profile_ref: "profile-other" }),
      presence({ service_instance_ref: "service-old" }),
      presence({ active: false }),
      presence({ authenticated_mcp_client_ref: null }),
    ];
    const { app } = setup({ presence: candidates });
    const response = await getReadiness(app, "standard_mcp").expect(200);
    expect(response.body).toMatchObject({
      selected_client_profile: "standard_mcp",
      proof_basis: "none",
      authenticated_mcp_client_ref: null,
      client_session_ref: null,
      conversation_thread_ref: null,
      readiness: {
        client_authorization: "active",
        client_presence: "offline",
        catalog_sync: "stale",
      },
    });
  });

  it("fails closed after authorization is revoked even if presence remains", async () => {
    const revoked = { ...binding, status: "revoked" as const, revoked_at: "2026-08-31T12:02:00.000Z" };
    const { app } = setup({ bindings: [revoked], presence: [presence()] });
    const response = await getReadiness(app).expect(200);
    expect(response.body.oauth_binding_ref).toBeNull();
    expect(response.body.proof_basis).toBe("none");
    expect(response.body.readiness.client_authorization).toBe("missing");
    expect(response.body.readiness.client_presence).toBe("offline");
  });

  it("sanitizes unexpected backend failures", async () => {
    const harness = setup();
    harness.listBindings.mockRejectedValueOnce(new Error("Bearer secret-subject"));
    const response = await getReadiness(harness.app).expect(500);
    expect(response.body).toEqual({
      schema: "helix.agent_connection_error.v1",
      ok: false,
      error: "internal_error",
      message: "AI app connection readiness is temporarily unavailable.",
      credential_included: false,
      oauth_subject_included: false,
      raw_claims_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("secret-subject");
  });
});
