import { describe, expect, it } from "vitest";
import { HELIX_AGENT_RUN_WRITE_SCOPE } from "../contracts/helix-agent-api.v1";
import {
  buildHelixClientAuthorizationReadiness,
  requiredHelixClientAuthorizationScopes,
} from "../helix-client-authorization-readiness";

const G2 = new Set([
  "helix.rooms.read",
  "helix.environment_actions.read",
  "helix.environment_actions.write",
]);

describe("Helix client authorization readiness", () => {
  it("reports the exact missing G8 run scope without projecting unrelated grants", () => {
    const readiness = buildHelixClientAuthorizationReadiness({
      capabilityProfile: "g8-monitor",
      grantedScopes: new Set([...G2, "unrelated.private.scope"]),
      authorizationExpiresAt: "2026-08-25T06:00:00.000Z",
    });

    expect(readiness).toMatchObject({
      ready: false,
      missing_scopes: [HELIX_AGENT_RUN_WRITE_SCOPE],
      granted_required_scopes: [...G2],
      recovery_action: "authorize_missing_scopes",
      credential_included: false,
      bearer_included: false,
      subject_included: false,
      client_identity_included: false,
      raw_claims_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(JSON.stringify(readiness)).not.toContain("unrelated.private.scope");
  });

  it("becomes ready only when every named profile scope is signed", () => {
    const scopes = new Set(requiredHelixClientAuthorizationScopes("g8-monitor"));
    const readiness = buildHelixClientAuthorizationReadiness({
      capabilityProfile: "g8-monitor",
      grantedScopes: scopes,
      authorizationExpiresAt: "2026-08-25T06:00:00.000Z",
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.missing_scopes).toEqual([]);
    expect(readiness.recovery_action).toBe("none");
  });
});
