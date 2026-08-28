import { describe, expect, it } from "vitest";
import {
  HelixStepUpReceiptError,
  HelixStepUpReceiptStore,
} from "../auth0-step-up-receipt-store";

const binding = {
  profileId: "profile:owner",
  sessionId: "session:owner",
  deviceId: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
  purpose: "device_register" as const,
  targetRef: "device:sha256:target",
  issuer: "https://tenant.auth0.com/",
  subject: "auth0|owner",
  authTime: "2026-08-27T12:00:00.000Z",
  amr: ["pwd", "mfa"],
  acr: "http://schemas.openid.net/pape/policies/2007/06/multi-factor",
};

describe("Auth0 step-up receipt store", () => {
  it("consumes one exact profile/session/device/purpose binding once", () => {
    const store = new HelixStepUpReceiptStore({
      now: () => new Date("2026-08-27T12:00:00.000Z"),
      randomBytes: () => Buffer.alloc(32, 7),
      randomId: () => "receipt-one",
    });
    const issued = store.issue({ binding });

    expect(issued.projection).toMatchObject({
      status: "active",
      usable_receipt_included: false,
      factor_detail_included: false,
    });
    expect(JSON.stringify(issued.projection)).not.toContain(issued.token);
    expect(store.consume({
      token: issued.token,
      profileId: binding.profileId,
      sessionId: binding.sessionId,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
      targetRef: binding.targetRef,
    }).status).toBe("consumed");
    expect(() => store.consume({
      token: issued.token,
      profileId: binding.profileId,
      sessionId: binding.sessionId,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
      targetRef: binding.targetRef,
    })).toThrowError(expect.objectContaining({ code: "receipt_replayed" }));
  });

  it.each([
    ["profileId", "profile:other"],
    ["sessionId", "session:other"],
    ["deviceId", "desktop_device_BBBBBBBBBBBBBBBBBBBBBB"],
    ["purpose", "device_recover"],
    ["targetRef", "device:sha256:other"],
  ] as const)("rejects crossed %s authority", (field, value) => {
    const store = new HelixStepUpReceiptStore({
      randomBytes: () => Buffer.alloc(32, 8),
    });
    const issued = store.issue({ binding });
    expect(() => store.consume({
      token: issued.token,
      profileId: binding.profileId,
      sessionId: binding.sessionId,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
      targetRef: binding.targetRef,
      [field]: value,
    })).toThrowError(expect.objectContaining({
      code: "receipt_binding_mismatch",
    }));
  });

  it("expires, revokes, and invalidates receipts across service restart", () => {
    let now = new Date("2026-08-27T12:00:00.000Z");
    const store = new HelixStepUpReceiptStore({
      now: () => now,
      randomBytes: () => Buffer.alloc(32, 9),
    });
    const expired = store.issue({ binding, ttlSeconds: 30 });
    now = new Date("2026-08-27T12:00:31.000Z");
    expect(() => store.consumeNativeOperation({
      token: expired.token,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
    })).toThrowError(expect.objectContaining({ code: "receipt_expired" }));

    now = new Date("2026-08-27T12:01:00.000Z");
    const revoked = store.issue({ binding });
    expect(store.revokeBound({ sessionId: binding.sessionId })).toBe(1);
    expect(() => store.consumeNativeOperation({
      token: revoked.token,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
    })).toThrowError(expect.objectContaining({ code: "receipt_revoked" }));

    const beforeRestart = store.issue({ binding });
    const restarted = new HelixStepUpReceiptStore();
    expect(() => restarted.consumeNativeOperation({
      token: beforeRestart.token,
      deviceId: binding.deviceId,
      purpose: binding.purpose,
    })).toThrow(HelixStepUpReceiptError);
  });
});

