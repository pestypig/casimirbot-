import { describe, expect, it } from "vitest";
import {
  AttendedFalSessionError,
  AttendedFalSessionStore,
  FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
  RTP_FAL_APPROVAL_VERSION,
  readAttendedFalReadiness,
  readAttendedFalReadinessFromRuntime,
} from "../attended-fal-session";

const ready = () => readAttendedFalReadiness({
  runtimeEnabled: true,
  credentialConfigured: true,
  sdkAvailable: true,
});

const arm = (store: AttendedFalSessionStore, overrides: Record<string, unknown> = {}) =>
  store.arm({
    profileId: "profile:developer",
    sessionId: "texture-session:attended",
    readiness: ready(),
    approvalVersion: RTP_FAL_APPROVAL_VERSION,
    providerId: FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
    durationCapSeconds: 60,
    requestCap: 60,
    spendCapUsd: 1,
    externalFrameEgressAcknowledged: true,
    billableCallsAcknowledged: true,
    ...overrides,
  });

const errorCode = (operation: () => unknown): string | null => {
  try { operation(); return null; } catch (error) {
    return error instanceof AttendedFalSessionError ? error.code : "unexpected";
  }
};

describe("attended fal session authority", () => {
  it("projects readiness without exposing the configured key", () => {
    const secret = "fal-key-id:fal-key-secret-do-not-echo";
    const projection = readAttendedFalReadinessFromRuntime({
      env: { RTP_FAL_PROVIDER_ENABLED: "1", FAL_KEY: secret },
      sdkAvailable: true,
    });
    expect(projection).toMatchObject({
      ready_for_attended_arm: true,
      credential_configured: true,
      credential_included: false,
      request_cap: 60,
      duration_cap_seconds: 60,
      spend_cap_usd: 1,
    });
    expect(JSON.stringify(projection)).not.toContain(secret);
    expect(JSON.stringify(projection)).not.toContain("fal-key-secret");
  });

  it("requires exact readiness, provider, approval version, ceilings, and both acknowledgements", () => {
    const store = new AttendedFalSessionStore(() => 1_000);
    expect(errorCode(() => arm(store, { readiness: readAttendedFalReadiness({}) }))).toBe("provider_not_ready");
    expect(errorCode(() => arm(store, { providerId: "other" }))).toBe("provider_id_invalid");
    expect(errorCode(() => arm(store, { approvalVersion: "older" }))).toBe("approval_version_invalid");
    expect(errorCode(() => arm(store, { requestCap: 61 }))).toBe("attended_ceiling_invalid");
    expect(errorCode(() => arm(store, { spendCapUsd: 2 }))).toBe("attended_ceiling_invalid");
    expect(errorCode(() => arm(store, { externalFrameEgressAcknowledged: false }))).toBe("attended_user_acknowledgement_required");
  });

  it("allows exactly one in-flight request and emits no retry authority", () => {
    const store = new AttendedFalSessionStore(() => 10_000);
    arm(store);
    const claim = store.beginRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:1",
    });
    expect(claim).toMatchObject({ request_number: 1, request_cap: 60, retry_allowed: false });
    expect(errorCode(() => store.beginRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:2",
    }))).toBe("attended_request_in_flight");
    const settled = store.settleRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:1",
      providerComputeMs: 250,
      accepted: true,
    });
    expect(settled).toMatchObject({
      status: "armed",
      requests_started: 1,
      requests_completed: 1,
      requests_accepted: 1,
      in_flight: false,
      estimated_compute_seconds: 0.25,
    });
  });

  it("expires at 60 seconds and rejects further requests", () => {
    let now = 5_000;
    const store = new AttendedFalSessionStore(() => now);
    arm(store);
    now += 60_000;
    expect(store.inspect("profile:developer")).toMatchObject({
      status: "expired",
      cancellation_acknowledged: true,
      cancellation_reason: "duration_cap_reached",
    });
    expect(errorCode(() => store.beginRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:expired",
    }))).toBe("attended_session_expired");
  });

  it("hard-stops at 60 requests", () => {
    const store = new AttendedFalSessionStore(() => 20_000);
    arm(store);
    for (let index = 1; index <= 60; index += 1) {
      store.beginRequest({
        profileId: "profile:developer",
        sessionId: "texture-session:attended",
        requestId: `request:${index}`,
      });
      store.settleRequest({
        profileId: "profile:developer",
        sessionId: "texture-session:attended",
        requestId: `request:${index}`,
        providerComputeMs: 5,
        accepted: true,
      });
    }
    expect(store.inspect("profile:developer")).toMatchObject({ status: "completed", requests_started: 60 });
    expect(errorCode(() => store.beginRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:61",
    }))).toBe("attended_session_completed");
  });

  it("cancels on runtime ceiling violation and acknowledges explicit user stop", () => {
    const store = new AttendedFalSessionStore(() => 30_000);
    arm(store);
    const claim = store.beginRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:ceiling",
    });
    expect(errorCode(() => store.settleRequest({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      requestId: "request:ceiling",
      providerComputeMs: claim.max_runtime_ms + 1,
      accepted: false,
    }))).toBe("provider_runtime_ceiling_exceeded");
    expect(store.inspect("profile:developer")).toMatchObject({
      status: "cancelled",
      cancellation_acknowledged: true,
      cancellation_reason: "provider_runtime_ceiling_exceeded",
    });

    const next = new AttendedFalSessionStore(() => 40_000);
    arm(next);
    expect(next.cancel({
      profileId: "profile:developer",
      sessionId: "texture-session:attended",
      reason: "user_stopped",
    })).toMatchObject({
      status: "cancelled",
      cancellation_acknowledged: true,
      cancellation_reason: "user_stopped",
      credential_included: false,
      pixels_included: false,
      prompt_included: false,
    });
  });
});
