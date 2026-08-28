import { describe, expect, it } from "vitest";
import {
  buildHelixInstalledAccountServices,
  helixInstalledAccountServicesSchema,
} from "../helix-installed-account-services";
import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
  resolveHelixAccountPanelAccess,
} from "../helix-account-session";

describe("installed account services projection", () => {
  it("keeps connection, entitlement, device, and agent authority separate", () => {
    const projection = buildHelixInstalledAccountServices({
      profileRef: "profile:developer",
      providerCredentialBrokerReady: true,
      now: new Date("2026-08-27T12:00:00.000Z"),
    });

    expect(projection.runtime.provider_credential_broker).toBe("ready");
    expect(projection.billing.status).toBe("not_configured");
    expect(projection.security.mfa).toBe("not_enforced");
    expect(projection.connections.find(({ provider_id }) =>
      provider_id === "codex_app")?.connection_type,
    ).toBe("agent_client_connection");
    expect(projection.connections.find(({ provider_id }) =>
      provider_id === "openai_api")?.status,
    ).toBe("blocked_pending_stage");
    expect(projection.agent_authority.may_enroll_credentials).toBe(false);
    expect(projection.raw_credential_included).toBe(false);
  });

  it("rejects widened or secret-bearing projections", () => {
    const projection = buildHelixInstalledAccountServices({
      profileRef: "profile:developer",
      providerCredentialBrokerReady: false,
    });
    expect(() => helixInstalledAccountServicesSchema.parse({
      ...projection,
      api_key: "must-not-appear",
    })).toThrow();
    expect(() => helixInstalledAccountServicesSchema.parse({
      ...projection,
      agent_authority: {
        ...projection.agent_authority,
        may_manage_subscription: true,
      },
    })).toThrow();
  });

  it("keeps unfinished installed service management developer-only", () => {
    expect(HELIX_DEVELOPER_ACCOUNT_POLICY.feature_flags).toContain(
      "installed_service_management",
    );
    expect(HELIX_DEVELOPER_ACCOUNT_POLICY.locked_features).not.toContain(
      "installed_service_management",
    );
    expect(HELIX_USER_ACCOUNT_POLICY.feature_flags).not.toContain(
      "installed_service_management",
    );
    expect(HELIX_USER_ACCOUNT_POLICY.locked_features).toContain(
      "installed_service_management",
    );
    expect(resolveHelixAccountPanelAccess(
      HELIX_USER_ACCOUNT_POLICY,
      "connections-billing-security",
    ).state).toBe("locked");
  });
});
