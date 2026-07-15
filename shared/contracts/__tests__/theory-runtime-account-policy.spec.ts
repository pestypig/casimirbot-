import { describe, expect, it } from "vitest";
import { HELIX_DEVELOPER_ACCOUNT_POLICY, HELIX_USER_ACCOUNT_POLICY, resolveHelixWorkstationCapabilityAccess } from "../../helix-account-session";

describe("public theory runtime policy", () => {
  it.each([
    "scientific-calculator.run_theory_runtime",
    "scientific-calculator.read_theory_runtime_result",
    "scientific-calculator.read_visible_theory_run_result",
  ])("allows developer, user, and no-session policy for %s", (capability_id) => {
    expect(resolveHelixWorkstationCapabilityAccess(HELIX_DEVELOPER_ACCOUNT_POLICY, { capability_id, permission_profile_required: "read" }).state).toBe("available");
    expect(resolveHelixWorkstationCapabilityAccess(HELIX_USER_ACCOUNT_POLICY, { capability_id, permission_profile_required: "read" }).state).toBe("available");
    expect(resolveHelixWorkstationCapabilityAccess(null, { capability_id, permission_profile_required: "read" }).state).toBe("available");
  });
});
