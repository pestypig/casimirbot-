import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  AUTH0_MFA_ACR,
  type HelixInstalledSecurityStatus,
} from "@shared/desktop-auth0-step-up";
import {
  HELIX_ACCOUNT_SESSION_SCHEMA,
  buildHelixAccountCapabilityPolicy,
  type HelixAccountSession,
  type HelixAccountType,
} from "@shared/helix-account-session";
import { resolveDesktopSessionConfig } from "../../security/desktop-session";
import { installedDeviceRef } from
  "../../services/helix-account/installed-security-store";
import { createDesktopAuth0StepUpRouter } from "../desktop-auth0-step-up";

const SECRET = "desktop-session-secret-for-step-up-route-tests";
const DEVICE_ID = "desktop_device_AAAAAAAAAAAAAAAAAAAAAA";
const DEVICE_REF = installedDeviceRef(DEVICE_ID);
const ENV = {
  CASIMIR_DESKTOP_HOST: "1",
  CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
  HELIX_DESKTOP_DEVICE_ID: DEVICE_ID,
  HELIX_AGENT_OAUTH_PROVIDER: "auth0",
  HELIX_AGENT_OAUTH_ISSUER: "https://tenant.example.auth0.com/",
  HELIX_AGENT_OAUTH_AUDIENCE: "https://casimirbot.example/mcp",
  HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID: "nativeClient_123456",
  HELIX_AGENT_OAUTH_JWKS_URL: "https://tenant.example.auth0.com/.well-known/jwks.json",
} satisfies NodeJS.ProcessEnv;

const session = (accountType: HelixAccountType): HelixAccountSession => ({
  schema: HELIX_ACCOUNT_SESSION_SCHEMA,
  session_id: `session-${accountType}`,
  profile: {
    profile_id: `profile-${accountType}`,
    display_name: accountType,
    auth_mode: "local_dev_profile",
    account_type: accountType,
    provider: "local",
    created_at: "2026-08-27T21:00:00.000Z",
    updated_at: "2026-08-27T21:00:00.000Z",
  },
  account_policy: buildHelixAccountCapabilityPolicy(accountType),
  status: "active",
  memory_scope: "profile",
  created_at: "2026-08-27T21:00:00.000Z",
  updated_at: "2026-08-27T21:00:00.000Z",
  expires_at: null,
});

const statusProjection = (): HelixInstalledSecurityStatus => ({
  schema: "helix.installed_security_status.v1",
  ok: true,
  generated_at: "2026-08-27T21:00:00.000Z",
  profile_ref: "profile-developer",
  current_session_ref: "session:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  mfa: {
    provider: "auth0",
    configured: true,
    fresh_step_up_available: true,
    required_acr: AUTH0_MFA_ACR,
    maximum_age_seconds: 300,
    factor_detail_included: false,
  },
  current_device: {
    device_ref: DEVICE_REF,
    label: "This Windows device",
    platform: "windows",
    status: "unregistered",
    registered_at: null,
    last_seen_at: null,
    revoked_at: null,
    recovery_generation: 0,
  },
  sessions: [],
  recent_events: [],
  agent_authority: {
    may_inspect_sanitized_status: true,
    may_start_step_up: false,
    may_complete_mfa: false,
    may_receive_usable_receipt: false,
    may_register_or_recover_device: false,
    may_revoke_session: false,
  },
  usable_receipt_included: false,
  identity_token_included: false,
  access_token_included: false,
  factor_detail_included: false,
});

const createFixture = (resolved: HelixAccountSession | null = session("developer")) => {
  const controller = {
    start: vi.fn((input) => ({
      schema: "helix.auth0_step_up_start.v1" as const,
      ok: true as const,
      authorization_url: "https://tenant.example.auth0.com/authorize?state=abc",
      purpose: input.purpose,
      target_ref: input.targetRef,
      expires_at: "2026-08-27T21:10:00.000Z",
      provider: "auth0" as const,
      pkce: "S256" as const,
      nonce_bound: true as const,
      mfa_acr_requested: AUTH0_MFA_ACR,
      usable_receipt_included: false as const,
      identity_token_included: false as const,
      access_token_included: false as const,
      factor_detail_included: false as const,
    })),
    inspectStart: vi.fn(() => ({
      purpose: "device_register" as const,
      target_ref: DEVICE_REF,
      expires_at: "2026-08-27T21:10:00.000Z",
    })),
    complete: vi.fn(async () => ({
      token: `stepup_${Buffer.alloc(32, 2).toString("base64url")}`,
      receipt_ref: "stepup_receipt_test",
      purpose: "device_register" as const,
      target_ref: DEVICE_REF,
      expires_at: "2026-08-27T21:02:00.000Z",
    })),
  };
  const receipts = {
    consumeNativeOperation: vi.fn(() => ({
      binding: {
        profileId: "profile-developer",
        sessionId: "session-developer",
        deviceId: DEVICE_ID,
        purpose: "device_register" as const,
        targetRef: DEVICE_REF,
        issuer: ENV.HELIX_AGENT_OAUTH_ISSUER,
        subject: "auth0|owner",
        authTime: "2026-08-27T21:00:00.000Z",
        amr: ["mfa"],
        acr: AUTH0_MFA_ACR,
      },
      projection: {
        receipt_ref: "stepup_receipt_test",
        purpose: "device_register" as const,
        target_ref: DEVICE_REF,
        created_at: "2026-08-27T21:00:00.000Z",
        expires_at: "2026-08-27T21:02:00.000Z",
        status: "consumed" as const,
        usable_receipt_included: false as const,
        identity_token_included: false as const,
        access_token_included: false as const,
        factor_detail_included: false as const,
      },
    })),
    revokeBound: vi.fn(),
  };
  const security = {
    registerDevice: vi.fn(async () => undefined),
    recoverDevice: vi.fn(async () => undefined),
    revokeDevice: vi.fn(async () => undefined),
    revokeSession: vi.fn(async () => undefined),
    status: vi.fn(async () => statusProjection()),
  };
  const checkout = {
    configured: vi.fn(() => false),
    createCheckout: vi.fn(async () => ({
      hostedUrl: "https://checkout.stripe.com/c/pay/cs_test_sanitized",
    })),
    createPortal: vi.fn(async () => ({
      hostedUrl: "https://billing.stripe.com/p/session/portal_sanitized",
    })),
  };
  const billing = {
    portalCustomerId: vi.fn(async () => "cus_owner1"),
  };
  const app = express();
  app.use("/api/account", createDesktopAuth0StepUpRouter({
    controller,
    receipts,
    security,
    checkout,
    billing,
    env: ENV,
    desktopSession: resolveDesktopSessionConfig(ENV),
    resolveSession: vi.fn(async () => resolved),
  }));
  return { app, controller, receipts, security, checkout, billing };
};

const native = (requestBuilder: request.Test) => requestBuilder
  .set("X-Casimir-Desktop-Session", SECRET)
  .set("Cookie", "helix_session=session-developer");

describe("desktop Auth0 MFA step-up route", () => {
  it("starts only a developer-bound installed operation", async () => {
    const { app, controller } = createFixture();
    const response = await native(request(app)
      .post("/api/account/security/step-up/start"))
      .send({ purpose: "device_register", target_ref: "attacker-target" })
      .expect(200);
    expect(response.body.target_ref).toBe(DEVICE_REF);
    expect(controller.start).toHaveBeenCalledWith(expect.objectContaining({
      session: { sessionId: "session-developer", profileId: "profile-developer" },
      deviceId: DEVICE_ID,
      purpose: "device_register",
      targetRef: DEVICE_REF,
    }));
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("keeps future payment/provider purposes closed", async () => {
    const { app } = createFixture();
    const response = await native(request(app)
      .post("/api/account/security/step-up/start"))
      .send({ purpose: "payment_change", target_ref: null })
      .expect(409);
    expect(response.body.error).toBe("purpose_not_active");
  });

  it("binds configured sandbox Checkout to fresh MFA and an active installed device", async () => {
    const { app, controller, receipts, security, checkout } = createFixture();
    checkout.configured.mockReturnValue(true);
    security.status.mockResolvedValue({
      ...statusProjection(),
      current_device: {
        ...statusProjection().current_device,
        status: "active",
        registered_at: "2026-08-27T20:00:00.000Z",
      },
    });
    const targetRef = "billing_checkout:plan:starter_monthly";
    const started = await native(request(app)
      .post("/api/account/security/step-up/start"))
      .send({ purpose: "payment_change", target_ref: targetRef })
      .expect(200);
    expect(started.body.target_ref).toBe(targetRef);
    expect(controller.start).toHaveBeenCalledWith(expect.objectContaining({
      purpose: "payment_change",
      targetRef,
    }));
    receipts.consumeNativeOperation.mockReturnValueOnce({
      binding: {
        profileId: "profile-developer",
        sessionId: "session-developer",
        deviceId: DEVICE_ID,
        purpose: "payment_change",
        targetRef,
        issuer: ENV.HELIX_AGENT_OAUTH_ISSUER,
        subject: "auth0|owner",
        authTime: "2026-08-27T21:00:00.000Z",
        amr: ["mfa"],
        acr: AUTH0_MFA_ACR,
      },
      projection: {
        receipt_ref: "stepup_receipt_checkout",
        purpose: "payment_change",
        target_ref: targetRef,
        created_at: "2026-08-27T21:00:00.000Z",
        expires_at: "2026-08-27T21:02:00.000Z",
        status: "consumed",
        usable_receipt_included: false,
        identity_token_included: false,
        access_token_included: false,
        factor_detail_included: false,
      },
    });
    const response = await native(request(app)
      .post("/api/account/billing/checkout"))
      .send({ receipt_token: `stepup_${Buffer.alloc(32, 7).toString("base64url")}` })
      .expect(200);
    expect(response.body).toMatchObject({
      operation: "payment_change",
      target_ref: targetRef,
      hosted_url: "https://checkout.stripe.com/c/pay/cs_test_sanitized",
      payment_instrument_included: false,
      stripe_secret_included: false,
    });
    expect(checkout.createCheckout).toHaveBeenCalledWith({
      profileId: "profile-developer",
      targetRef,
      idempotencyKey: "checkout:stepup_receipt_checkout",
    });
  });

  it("opens hosted subscription management with exact MFA, profile, and device binding", async () => {
    const { app, receipts, security, checkout, billing } = createFixture();
    checkout.configured.mockReturnValue(true);
    security.status.mockResolvedValue({
      ...statusProjection(),
      current_device: {
        ...statusProjection().current_device,
        status: "active",
        registered_at: "2026-08-27T20:00:00.000Z",
      },
    });
    const targetRef = "billing_portal:manage_subscription";
    await native(request(app)
      .post("/api/account/security/step-up/start"))
      .send({ purpose: "payment_change", target_ref: targetRef })
      .expect(200);
    receipts.consumeNativeOperation.mockReturnValueOnce({
      binding: {
        profileId: "profile-developer",
        sessionId: "session-developer",
        deviceId: DEVICE_ID,
        purpose: "payment_change",
        targetRef,
        issuer: ENV.HELIX_AGENT_OAUTH_ISSUER,
        subject: "auth0|owner",
        authTime: "2026-08-27T21:00:00.000Z",
        amr: ["mfa"],
        acr: AUTH0_MFA_ACR,
      },
      projection: {
        receipt_ref: "stepup_receipt_portal",
        purpose: "payment_change",
        target_ref: targetRef,
        created_at: "2026-08-27T21:00:00.000Z",
        expires_at: "2026-08-27T21:02:00.000Z",
        status: "consumed",
        usable_receipt_included: false,
        identity_token_included: false,
        access_token_included: false,
        factor_detail_included: false,
      },
    });
    const response = await native(request(app)
      .post("/api/account/billing/portal"))
      .send({ receipt_token: `stepup_${Buffer.alloc(32, 8).toString("base64url")}` })
      .expect(200);
    expect(response.body).toMatchObject({
      operation: "payment_change",
      target_ref: targetRef,
      hosted_url: "https://billing.stripe.com/p/session/portal_sanitized",
      customer_reference_included: false,
      payment_instrument_included: false,
      stripe_secret_included: false,
    });
    expect(billing.portalCustomerId).toHaveBeenCalledWith("profile-developer");
    expect(checkout.createPortal).toHaveBeenCalledWith({
      customerId: "cus_owner1",
      idempotencyKey: "portal:stepup_receipt_portal",
    });
    expect(JSON.stringify(response.body)).not.toContain("cus_owner1");
  });

  it("rejects hosted, missing-native, and public-user starts", async () => {
    const { app } = createFixture(session("user"));
    await request(app).post("/api/account/security/step-up/start")
      .send({ purpose: "device_register", target_ref: null }).expect(401);
    const response = await native(request(app)
      .post("/api/account/security/step-up/start"))
      .send({ purpose: "device_register", target_ref: null }).expect(403);
    expect(response.body.error).toBe("installed_services_locked");
  });

  it("returns a sanitized status projection", async () => {
    const { app } = createFixture();
    const response = await native(request(app)
      .get("/api/account/security/status"))
      .expect(200);
    expect(response.body.current_device.device_ref).toBe(DEVICE_REF);
    expect(JSON.stringify(response.body)).not.toContain(DEVICE_ID);
    expect(response.body.usable_receipt_included).toBe(false);
  });

  it("keeps callback and receipt consumption on the private native channel", async () => {
    const { app, receipts, security } = createFixture();
    await request(app).post("/api/account/security/step-up/callback")
      .send({ callback_url: "casimirbot://oauth/callback?code=x&state=y" })
      .expect(401);
    const callback = await native(request(app)
      .post("/api/account/security/step-up/callback"))
      .send({ callback_url: "casimirbot://oauth/callback?code=x&state=y" })
      .expect(200);
    expect(callback.body.native_main_only).toBe(true);
    const operation = await native(request(app)
      .post("/api/account/security/devices/register"))
      .send({ receipt_token: callback.body.token })
      .expect(200);
    expect(operation.body).not.toHaveProperty("token");
    expect(receipts.consumeNativeOperation).toHaveBeenCalledWith({
      token: callback.body.token,
      deviceId: DEVICE_ID,
      purpose: "device_register",
    });
    expect(security.registerDevice).toHaveBeenCalledOnce();
  });
});
