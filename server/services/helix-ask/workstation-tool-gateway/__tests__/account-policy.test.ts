import { beforeEach, describe, expect, it } from "vitest";
import {
  resetAccountSessionStore,
  signInLocalAccountSession,
} from "../../../helix-account/account-session-store";
import {
  callAccountAuthorizedWorkstationGatewayCapability,
  callAccountAuthorizedWorkstationGatewayCapabilityForProvider,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  resolveWorkstationGatewayAccountContext,
} from "../account-policy";

describe("workstation gateway account policy service", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("treats an absent or invalid session as an untrusted public account", async () => {
    const context =
      await resolveWorkstationGatewayAccountContext("missing-session");

    expect(context).toMatchObject({
      session_id: null,
      profile_id: null,
      trusted_account_session: false,
      account_session: null,
      account_policy: {
        account_type: "user",
        max_workstation_permission: "act",
      },
    });
  });

  it("binds policy and profile identity from the server-side account session", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:gateway-policy-developer",
      account_type: "developer",
    });
    const context = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );

    expect(context).toMatchObject({
      session_id: receipt.session?.session_id,
      profile_id: "profile:gateway-policy-developer",
      trusted_account_session: true,
      account_policy: {
        account_type: "developer",
        allowed_runtime_agents: ["*"],
      },
    });
  });

  it("projects only account-authorized capabilities to a provider-native caller", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:gateway-policy-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const listing = listAccountAuthorizedWorkstationGatewayCapabilities({
      accountContext,
      requestedMode: "act",
      requestedRuntime: "codex",
    });

    expect(listing.capabilities).toContainEqual(
      expect.objectContaining({ capability_id: "repo.search" }),
    );
    expect(listing.capabilities).not.toContainEqual(
      expect.objectContaining({
        capability_id: "live_env.request_interim_voice_callout",
      }),
    );
    expect(listing.locked_capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: "live_env.request_interim_voice_callout",
        locked_reason: "capability_outside_account_policy",
      }),
    );
  });

  it("blocks a provider-native dynamic panel call outside the account panel policy", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:gateway-policy-panel-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const result = await callAccountAuthorizedWorkstationGatewayCapability({
      accountContext,
      requestedMode: "act",
      requestedRuntime: "codex",
      capabilityId: "workstation.open_panel",
      arguments: { panel_id: "code-admin" },
      turnId: "ask:test:gateway-policy-panel",
    });

    expect(result).toMatchObject({
      status_code: 403,
      body: {
        schema: "helix.workstation_tool_gateway.account_policy_blocked.v1",
        ok: false,
        capability_id: "workstation.open_panel",
        error: "account_policy_blocked",
        blocked_reason: "panel_locked_by_account_policy",
        policy_gate: {
          effective_agent_runtime: null,
          capped: true,
        },
        terminal_eligible: false,
        assistant_answer: false,
      },
    });
  });

  it("blocks a provider-native runtime outside the account runtime policy", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:gateway-policy-runtime-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const listing = listAccountAuthorizedWorkstationGatewayCapabilities({
      accountContext,
      requestedMode: "read",
      requestedRuntime: "future-agent",
    });
    const result = await callAccountAuthorizedWorkstationGatewayCapability({
      accountContext,
      requestedMode: "read",
      requestedRuntime: "future-agent",
      capabilityId: "repo.search",
      arguments: { query: "Helix Ask" },
      turnId: "ask:test:gateway-policy-runtime",
    });

    expect(listing.capabilities).toEqual([]);
    expect(listing.policy_gate).toMatchObject({
      requested_agent_runtime: "future-agent",
      effective_agent_runtime: null,
      runtime_locked_reason: "runtime_agent_outside_account_policy",
    });
    expect(listing.locked_capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: "repo.search",
        locked_reason: "runtime_agent_outside_account_policy",
      }),
    );
    expect(result).toMatchObject({
      status_code: 403,
      body: {
        ok: false,
        error: "runtime_agent_locked_by_account_policy",
        blocked_reason: "runtime_agent_outside_account_policy",
        policy_gate: {
          requested_agent_runtime: "future-agent",
          effective_agent_runtime: null,
          runtime_locked_reason: "runtime_agent_outside_account_policy",
        },
      },
    });
  });

  it("normalizes account policy denials into non-terminal provider observations", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:gateway-policy-provider-user",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const result = await callAccountAuthorizedWorkstationGatewayCapabilityForProvider({
      accountContext,
      requestedMode: "act",
      requestedRuntime: "codex",
      capabilityId: "workstation.open_panel",
      arguments: { panel_id: "code-admin" },
      turnId: "ask:test:gateway-policy-provider-block",
      iteration: 2,
    });

    expect(result).toMatchObject({
      schema: "helix.workstation_tool_gateway.call_result.v1",
      ok: false,
      capability_id: "workstation.open_panel",
      gateway_admission: {
        admission_status: "blocked",
        admission_reason: "account_policy_blocked",
        blocked_reason: "panel_locked_by_account_policy",
      },
      observation_packet: {
        iteration: 2,
        status: "blocked",
        terminal_eligible: false,
      },
      tool_lifecycle_trace: {
        lifecycle_stage: "blocked",
        executed_capability: null,
      },
      tool_followup_decision: {
        next_action: "ask_user",
        evidence_reentered: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      error: "panel_locked_by_account_policy",
    });
  });
});
