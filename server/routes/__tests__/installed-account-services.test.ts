import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  HELIX_ACCOUNT_SESSION_SCHEMA,
  buildHelixAccountCapabilityPolicy,
  type HelixAccountSession,
  type HelixAccountType,
} from "@shared/helix-account-session";
import { helixInstalledAccountServicesSchema } from
  "@shared/helix-installed-account-services";
import { helixBillingEntitlementSchema } from
  "@shared/helix-billing-entitlement";
import { resolveDesktopSessionConfig } from
  "../../security/desktop-session";
import { createInstalledAccountServicesRouter } from
  "../installed-account-services";

const SECRET = "desktop-session-secret-for-installed-services-tests";
const TOKEN = Buffer.alloc(32, 4).toString("base64url");
const DESKTOP_ENV = {
  CASIMIR_DESKTOP_HOST: "1",
  CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
  HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN: "http://127.0.0.1:43125",
  HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN: TOKEN,
} satisfies NodeJS.ProcessEnv;

const session = (accountType: HelixAccountType): HelixAccountSession => ({
  schema: HELIX_ACCOUNT_SESSION_SCHEMA,
  session_id: `account_session:${accountType}`,
  profile: {
    profile_id: `profile:${accountType}`,
    display_name: accountType,
    auth_mode: "local_dev_profile",
    account_type: accountType,
    provider: "local",
    created_at: "2026-08-27T12:00:00.000Z",
    updated_at: "2026-08-27T12:00:00.000Z",
  },
  account_policy: buildHelixAccountCapabilityPolicy(accountType),
  status: "active",
  memory_scope: "profile",
  created_at: "2026-08-27T12:00:00.000Z",
  updated_at: "2026-08-27T12:00:00.000Z",
  expires_at: null,
});

const createApp = (input?: {
  env?: NodeJS.ProcessEnv;
  resolvedSession?: HelixAccountSession | null;
}) => {
  const env = input?.env ?? DESKTOP_ENV;
  const resolvedSession = input && "resolvedSession" in input
    ? input.resolvedSession ?? null
    : session("developer");
  const app = express();
  app.use("/api/account", createInstalledAccountServicesRouter({
    env,
    desktopSession: resolveDesktopSessionConfig(env),
    resolveSession: vi.fn(async () => resolvedSession),
    resolveBilling: vi.fn(async (profileId) => ({
      schema: "helix.billing_entitlement.v1",
      ok: true,
      generated_at: "2026-08-27T12:00:00.000Z",
      profile_ref: profileId,
      processor: "stripe",
      environment: "sandbox",
      status: "sandbox_ready",
      plan_id: null,
      currency: "usd",
      balance: {
        included_credit_minor: 0,
        prepaid_credit_minor: 0,
        adjustments_minor: 0,
        available_credit_minor: 0,
        hard_account_ceiling_minor: 0,
      },
      period: { starts_at: null, ends_at: null },
      recent_ledger: [],
      checkout: { hosted_only: true, available: false, payment_fields_present: false },
      portal: { hosted_only: true, available: false, customer_reference_included: false },
      authority: {
        owner_may_start_checkout: false,
        owner_may_manage_subscription: false,
        agent_may_inspect: true,
        agent_may_purchase: false,
        agent_may_refund: false,
        agent_may_adjust: false,
        agent_may_raise_ceiling: false,
        provider_traffic_enabled: false,
        billable_lease_enabled: false,
      },
      stripe_customer_included: false,
      stripe_subscription_included: false,
      payment_instrument_included: false,
      webhook_secret_included: false,
      raw_processor_object_included: false,
    })),
    now: () => new Date("2026-08-27T12:00:00.000Z"),
  }));
  return app;
};

const authorized = (app: express.Express) => request(app)
  .get("/api/account/installed-services")
  .set("X-Casimir-Desktop-Session", SECRET)
  .set("Cookie", "helix_session=account_session%3Adeveloper");

describe("installed account services route", () => {
  it("returns an exact sanitized developer projection on the installed node", async () => {
    const response = await authorized(createApp()).expect(200);
    const projection = helixInstalledAccountServicesSchema.parse(response.body);

    expect(projection.runtime.provider_credential_broker).toBe("ready");
    expect(projection.security.master_key_in_child_environment).toBe(false);
    expect(projection.billing.payment_method_collected).toBe(false);
    expect(JSON.stringify(projection)).not.toContain(TOKEN);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns a private sanitized sandbox billing projection", async () => {
    const response = await request(createApp())
      .get("/api/account/billing-entitlement")
      .set("X-Casimir-Desktop-Session", SECRET)
      .set("Cookie", "helix_session=account_session%3Adeveloper")
      .expect(200);
    const billing = helixBillingEntitlementSchema.parse(response.body);
    expect(billing).toMatchObject({
      environment: "sandbox",
      status: "sandbox_ready",
      payment_instrument_included: false,
      raw_processor_object_included: false,
    });
    expect(billing.authority.agent_may_purchase).toBe(false);
  });

  it("rejects hosted-web access even for a developer profile", async () => {
    const response = await request(createApp({ env: {} }))
      .get("/api/account/installed-services")
      .expect(409);
    expect(response.body.error).toBe("installed_node_required");
  });

  it("rejects missing desktop-session authority", async () => {
    const response = await request(createApp())
      .get("/api/account/installed-services")
      .set("Cookie", "helix_session=account_session%3Adeveloper")
      .expect(401);
    expect(response.body.error).toBe("desktop_session_required");
  });

  it("rejects missing profile identity", async () => {
    const response = await authorized(createApp({ resolvedSession: null }))
      .expect(401);
    expect(response.body.error).toBe("profile_session_required");
  });

  it("keeps unfinished service management locked for public users", async () => {
    const response = await authorized(createApp({
      resolvedSession: session("user"),
    })).expect(403);
    expect(response.body.error).toBe("installed_services_locked");
    expect(response.body.raw_credential_included).toBe(false);
  });
});
