import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { assertNoPersonalRealtimeSession } from "../personal-session-admission";
import { buildRuntimeGoalProfileRef } from "../../runtime-goals/runtime-goal-profile-ref";
import { admitRealtimeSession, buildRealtimeRequesterRef, resetRealtimeSessionRegistryForTests } from "../../realtime-session/session-registry";

afterEach(resetRealtimeSessionRegistryForTests);

describe("personal Realtime exclusion during room admission", () => {
  it("preserves the existing profile projection", () => {
    expect(buildRuntimeGoalProfileRef(" profile-a ")).toBe(`runtime-goal-profile:sha256:${crypto.createHash("sha256").update("profile-a").digest("hex").slice(0, 24)}`);
  });

  it("blocks a matching cookie session and permits another profile", () => {
    admitRealtimeSession({ realtimeSessionId: "personal-a", requesterRef: buildRealtimeRequesterRef("session-a"), visibleUserConsentReceipt: "consent:test", model: "test-only" });
    expect(() => assertNoPersonalRealtimeSession("profile-a", "session-a")).toThrow("Stop your personal GPT Live session");
    expect(() => assertNoPersonalRealtimeSession("profile-b", "session-b")).not.toThrow();
  });

  it("blocks the same profile across OAuth and cookie sessions", () => {
    admitRealtimeSession({ realtimeSessionId: "personal-a", requesterRef: buildRealtimeRequesterRef("cookie-session"), visibleUserConsentReceipt: "consent:test", model: "test-only",
      runtimeGoalAccountScope: { schema: "helix.runtime_goal.account_scope.v1", trusted: true, session_ref: "session:opaque", profile_ref: buildRuntimeGoalProfileRef("profile-a"), account_type: "developer", policy_fingerprint: "test", raw_session_id_included: false, raw_profile_id_included: false } });
    expect(() => assertNoPersonalRealtimeSession("profile-a", "external-oauth:a")).toThrow("Stop your personal GPT Live session");
    expect(() => assertNoPersonalRealtimeSession("profile-a", null)).toThrow();
    resetRealtimeSessionRegistryForTests();
    expect(() => assertNoPersonalRealtimeSession("profile-a", null)).not.toThrow();
  });
});
